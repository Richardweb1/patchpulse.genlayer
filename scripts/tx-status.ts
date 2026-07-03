import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
const hash=process.argv[2];if(!hash)throw new Error("Missing hash");
const tx=await createClient({chain:testnetBradbury}).getTransaction({hash:hash as never});
console.log(JSON.stringify({txId:tx.txId,recipient:tx.recipient,statusName:tx.statusName,resultName:tx.resultName,txExecutionResultName:tx.txExecutionResultName},null,2));
