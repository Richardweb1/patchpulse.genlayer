/// <reference types="vite/client" />
interface ImportMetaEnv { readonly VITE_CONTRACT_ADDRESS?: `0x${string}` }
interface ImportMeta { readonly env: ImportMetaEnv }
interface EthereumProvider { request(args:{method:string;params?:unknown[]|object}):Promise<unknown> }
interface Window { ethereum?: EthereumProvider }
