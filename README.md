# PatchPulse

PatchPulse is a GenLayer intelligent contract and dark release-intelligence interface that classifies live software release notes as `BREAKING`, `SAFE`, or `UNCLEAR`.

## Architecture

The leader fetches up to 10 KB from a public HTTPS release source with `gl.nondet.web.get`, then asks AI to judge only that evidence and return strict JSON. Validators independently repeat the web fetch and AI judgment. `gl.vm.run_nondet_unsafe` compares only the bounded integer verdict before storage changes. There is no manual validator simulation.

## Contract

- Studio filename: `release_risk.py`
- Class: `ReleaseRisk`
- Constructor: no arguments
- Codes: `1 = BREAKING`, `2 = SAFE`, `3 = UNCLEAR`
- Write method: `scan_release(source_url, package_name)`
- Views: `get_latest_result()` and `get_count()`

## Network

- GenLayer Bradbury Testnet · Chain ID `4221`
- RPC: `https://rpc-bradbury.genlayer.com`
- Explorer: `https://explorer-bradbury.genlayer.com`
- Contract: `0x33aFc7D737027BA2442697150ff0e7Ae9317471A`
- Contract explorer: https://explorer-bradbury.genlayer.com/address/0x33aFc7D737027BA2442697150ff0e7Ae9317471A
- Deployment transaction: `0xfefe07c0610fb4c25a3a0a3715a22d77d6f729aaaacbbe0c77c1110e315ae723`
- Deployment status: `FINALIZED + AGREE + FINISHED_WITH_RETURN`
- Finalized call: `0x56ce00ba979b54429aa9812e8a657202719c7baf03b95860ea4462526fee1f66`
- Call explorer: https://explorer-bradbury.genlayer.com/tx/0x56ce00ba979b54429aa9812e8a657202719c7baf03b95860ea4462526fee1f66
- Call status: `FINALIZED + AGREE + FINISHED_WITH_RETURN`
- Trace: `result_code = 0`, empty `stderr`, no revert
- Finalized state: `UNCLEAR`, scan count `1`
- GitHub and live app: pending

## Local

```bash
npm install
npm run typecheck
npm run build
```
