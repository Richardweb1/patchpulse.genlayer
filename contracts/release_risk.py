# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


class ReleaseRisk(gl.Contract):
    latest_result_code: u64
    latest_package_name: str
    latest_source_url: str
    latest_reasoning: str
    scan_count: u64

    RESULT_BREAKING = 1
    RESULT_SAFE = 2
    RESULT_UNCLEAR = 3

    def __init__(self):
        self.latest_result_code = 0
        self.latest_package_name = ""
        self.latest_source_url = ""
        self.latest_reasoning = ""
        self.scan_count = 0

    def _result_name(self, code: u64) -> str:
        if code == self.RESULT_BREAKING:
            return "BREAKING"
        if code == self.RESULT_SAFE:
            return "SAFE"
        if code == self.RESULT_UNCLEAR:
            return "UNCLEAR"
        return "IDLE"

    def _validate_inputs(self, source_url: str, package_name: str):
        if len(source_url) < 12 or len(source_url) > 300:
            raise gl.UserError("Source URL must contain 12 to 300 characters")
        if not source_url.startswith("https://"):
            raise gl.UserError("Source URL must start with https://")
        if " " in source_url or "\n" in source_url or "\r" in source_url:
            raise gl.UserError("Source URL contains invalid whitespace")
        if len(package_name.strip()) < 2 or len(package_name.strip()) > 80:
            raise gl.UserError("Package name must contain 2 to 80 characters")

    @gl.public.write
    def scan_release(self, source_url: str, package_name: str):
        self._validate_inputs(source_url, package_name)
        clean_name = package_name.strip()

        def judge_release() -> dict:
            response = gl.nondet.web.get(source_url)
            evidence = response.body.decode("utf-8")[:10000]
            prompt = f"""
Classify the upgrade risk in these live software release notes for {clean_name}.
Use ONLY the fetched evidence below. Do not use training knowledge or outside facts.
Allowed verdicts:
- BREAKING: explicit breaking changes, incompatible changes, required migrations, or removed APIs.
- SAFE: explicit evidence of only fixes, patches, compatible additions, or maintenance with no breaking change.
- UNCLEAR: missing, conflicting, generic, or insufficient release information.
Return strict JSON exactly: {{"verdict":"BREAKING|SAFE|UNCLEAR","reasoning":"evidence-based reason, maximum 400 characters"}}.
Evidence:
<evidence>{evidence}</evidence>
"""
            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            if not isinstance(raw, dict):
                raise gl.UserError("AI response was not a JSON object")
            verdict = str(raw.get("verdict", "")).strip().upper()
            reasoning = str(raw.get("reasoning", "")).strip()[:400]
            if verdict == "BREAKING":
                code = 1
            elif verdict == "SAFE":
                code = 2
            else:
                code = 3
                verdict = "UNCLEAR"
            if len(reasoning) == 0:
                reasoning = "The live release evidence did not support a clear explanation."
            return {"code": code, "verdict": verdict, "reasoning": reasoning}

        def validate_judgment(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            validator_result = judge_release()
            leader_data = leader_result.calldata
            return (
                isinstance(leader_data, dict)
                and leader_data.get("code") in (1, 2, 3)
                and leader_data.get("code") == validator_result.get("code")
            )

        result = gl.vm.run_nondet_unsafe(judge_release, validate_judgment)
        self.latest_result_code = int(result["code"])
        self.latest_package_name = clean_name
        self.latest_source_url = source_url
        self.latest_reasoning = str(result["reasoning"])[:400]
        self.scan_count += 1

    @gl.public.view
    def get_latest_result(self) -> str:
        return json.dumps({
            "code": self.latest_result_code,
            "verdict": self._result_name(self.latest_result_code),
            "package": self.latest_package_name,
            "url": self.latest_source_url,
            "reasoning": self.latest_reasoning,
        }, separators=(",", ":"))

    @gl.public.view
    def get_count(self) -> u64:
        return self.scan_count
