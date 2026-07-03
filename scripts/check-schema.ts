import { readFile } from "node:fs/promises";
import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
const bytes = await readFile(new URL("../contracts/release_risk.py", import.meta.url));
const client = createClient({ chain: testnetBradbury });
console.log(JSON.stringify(await client.getContractSchemaForCode(new Uint8Array(bytes)), null, 2));
