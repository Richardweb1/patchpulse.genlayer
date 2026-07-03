import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpRight, Box, ExternalLink, GitBranch, Radar, RefreshCw, ShieldAlert, Terminal, Wallet } from "lucide-react";
import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionHashVariant } from "genlayer-js/types";

const ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS ?? "0x33aFc7D737027BA2442697150ff0e7Ae9317471A";
const EXPLORER = "https://explorer-bradbury.genlayer.com";
const CHAIN_HEX = "0x107d";
const STAGES = ["PENDING","PROPOSING","COMMITTING","REVEALING","ACCEPTED","FINALIZED"];
const client = createClient({ chain: testnetBradbury });
type Result = {code:number;verdict:"BREAKING"|"SAFE"|"UNCLEAR"|"IDLE";package:string;url:string;reasoning:string};
const empty:Result={code:0,verdict:"IDLE",package:"AWAITING SCAN",url:"",reasoning:"No finalized release analysis is available."};

const statusOf=(tx:unknown)=>String((tx as Record<string,unknown>)?.statusName??"PENDING").toUpperCase();
const consensusOf=(tx:unknown)=>{const x=JSON.stringify(tx).toUpperCase();return x.includes("DISAGREE")?"DISAGREE":x.includes("AGREE")?"AGREE":"IDLE"};
const short=(x:string)=>x?`${x.slice(0,6)}…${x.slice(-4)}`:"CONNECT";

export default function App(){
  const [account,setAccount]=useState("");
  const [name,setName]=useState("Vite latest release");
  const [url,setUrl]=useState("https://api.github.com/repos/vitejs/vite/releases/latest");
  const [latest,setLatest]=useState<Result>(empty);
  const [count,setCount]=useState(0);
  const [hash,setHash]=useState("");
  const [status,setStatus]=useState("IDLE");
  const [consensus,setConsensus]=useState("IDLE");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const configured=/^0x[a-fA-F0-9]{40}$/.test(ADDRESS);
  const stage=useMemo(()=>STAGES.indexOf(status),[status]);

  const refresh=useCallback(async()=>{
    if(!configured)return;
    setError("");
    try{
      const [r,c]=await Promise.all([
        client.readContract({address:ADDRESS as `0x${string}`,functionName:"get_latest_result",args:[],transactionHashVariant:TransactionHashVariant.LATEST_FINAL}),
        client.readContract({address:ADDRESS as `0x${string}`,functionName:"get_count",args:[],transactionHashVariant:TransactionHashVariant.LATEST_FINAL})
      ]);
      setLatest(JSON.parse(String(r)));setCount(Number(c));
    }catch(e){setError(e instanceof Error?e.message:"Finalized state unavailable.")}
  },[configured]);
  useEffect(()=>{void refresh()},[refresh]);
  useEffect(()=>{if(!hash||status==="FINALIZED")return;const id=window.setInterval(async()=>{try{const tx=await client.getTransaction({hash:hash as never});const s=statusOf(tx);setStatus(s);setConsensus(consensusOf(tx));if(s==="FINALIZED"){setBusy(false);await refresh()}}catch{}},5000);return()=>clearInterval(id)},[hash,status,refresh]);

  async function network(){if(!window.ethereum)return;try{await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:CHAIN_HEX}]})}catch(e){if((e as {code?:number}).code!==4902)throw e;await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:CHAIN_HEX,chainName:"GenLayer Bradbury Testnet",nativeCurrency:{name:"GEN",symbol:"GEN",decimals:18},rpcUrls:["https://rpc-bradbury.genlayer.com"],blockExplorerUrls:[EXPLORER]}]})}}
  async function connect(){setError("");if(!window.ethereum){setError("No EIP-1193 wallet detected.");return}try{const a=await window.ethereum.request({method:"eth_requestAccounts"}) as string[];await network();setAccount(a[0]??"")}catch(e){setError(e instanceof Error?e.message:"Wallet connection cancelled.")}}
  async function submit(e:React.FormEvent){e.preventDefault();setError("");if(!configured){setError("Contract deployment is the next step.");return}if(!account){await connect();return}if(!window.ethereum)return;setBusy(true);setStatus("PENDING");setConsensus("IDLE");setHash("");try{await network();const write=createClient({chain:testnetBradbury,account:account as `0x${string}`,provider:window.ethereum as never});setHash(await write.writeContract({address:ADDRESS as `0x${string}`,functionName:"scan_release",args:[url.trim(),name.trim()],value:0n}))}catch(e){setBusy(false);setStatus("IDLE");setError(e instanceof Error?e.message:"Transaction failed.")}}

  return <div className="shell">
    <header><a className="logo" href="#top"><span>PP</span> PATCHPULSE</a><div className="network"><i/> BRADBURY / 4221</div><button className="wallet" onClick={connect}><Wallet size={17}/>{short(account)}</button></header>
    <main id="top">
      <section className="hero"><div className="kicker"><Terminal size={16}/> RELEASE INTELLIGENCE TERMINAL</div><h1>KNOW THE RISK<br/><em>BEFORE</em> YOU SHIP.</h1><p>Live release notes. Independent AI validators. One onchain upgrade signal.</p><div className="hero-stats"><span><b>03</b> RISK STATES</span><span><b>05</b> VALIDATORS</span><span><b>01</b> FINAL VERDICT</span></div></section>
      <section className="console">
        <form onSubmit={submit}><div className="panel-title"><span>INPUT_STREAM</span><Radar size={20}/></div><label htmlFor="package">PACKAGE / RELEASE</label><input id="package" value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={80} required/><label htmlFor="url">RELEASE JSON OR TEXT URL</label><input id="url" type="url" value={url} onChange={e=>setUrl(e.target.value)} maxLength={300} required/><small>PUBLIC HTTPS · MAX EVIDENCE 10 KB</small>{error&&<div className="error" role="alert"><ShieldAlert size={18}/>{error}</div>}<button className="scan" disabled={busy}>{busy?<RefreshCw className="spin"/>:<Activity/>}{busy?"CONSENSUS IN PROGRESS":"RUN RISK SCAN"}<ArrowUpRight/></button></form>
        <article className={`output ${latest.verdict.toLowerCase()}`}><div className="panel-title"><span>FINAL_OUTPUT</span><button onClick={refresh} disabled={!configured} aria-label="Refresh finalized state"><RefreshCw size={18}/></button></div><div className="signal"><span>RISK SIGNAL</span><strong>{latest.verdict}</strong></div><h2>{latest.package}</h2><p>{latest.reasoning}</p><div className="meta"><span><Box size={15}/>{count} FINALIZED SCANS</span>{latest.url&&<a href={latest.url} target="_blank" rel="noreferrer">SOURCE <ExternalLink size={14}/></a>}</div></article>
      </section>
      <section className="tx"><div className="panel-title"><span>CONSENSUS_TRACE</span><b>{consensus}</b></div><div className="stages">{STAGES.map((s,i)=><div className={i<=stage?"on":""} key={s}><i/>{s}</div>)}</div>{hash?<a className="hash" href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noreferrer"><GitBranch size={17}/>{hash}<ExternalLink size={15}/></a>:<div className="hash muted"><GitBranch size={17}/>TRANSACTION HASH WILL STREAM HERE</div>}</section>
    </main><footer><span>PATCHPULSE // GENLAYER</span><span>LIVE WEB → AI JUDGMENT → CONSENSUS</span></footer>
  </div>
}
