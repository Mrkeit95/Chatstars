
export interface ITxn { id:string; transactionId:string; fanId:string; fanName:string; createdTime:string; type:string; status:string; amount:string; fee:string; net:string; creatorId?:string; creatorName?:string; }
export interface ICreator { id:string; name:string; nickName:string; userName:string; tagName:string; createdTime:string; platformCode:string; }
export interface ILink { id:string; message:string; type:string; subCount:number; subLimit:number; subDuration:number; discount:number; finishedFlag:boolean; earningsGross:number; earningsNet:number; payingFansCount:number; }
export interface IRefund { id:string; transactionId:string; fanId:string; paymentTime:string; refundTime:string; paymentStatus:string; paymentAmount:number; transactionType:string; currency:string; }

async function f(endpoint:string, params?:Record<string,string>) {
  const q = new URLSearchParams({ endpoint, ...(params||{}) });
  const r = await fetch(`/api/infloww?${q.toString()}`);
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d.data;
}
export async function getICreators():Promise<ICreator[]> { return (await f("creators",{limit:"100"}))?.list||[]; }
export async function getITxns(p?:Record<string,string>):Promise<ITxn[]> { return (await f("transactions",{limit:"100",...p}))?.list||[]; }
export async function getIRefunds():Promise<IRefund[]> { return (await f("refunds",{limit:"100"}))?.list||[]; }
export async function getILinks():Promise<ILink[]> { return (await f("links",{limit:"100"}))?.list||[]; }
export async function getILinkFans(linkId:string) { return (await f("linkfans",{linkId,limit:"100"}))?.list||[]; }

export function aggByType(t:ITxn[]) { const m:Record<string,{count:number;gross:number;net:number;fee:number}>={};t.forEach(x=>{const k=x.type||"Unknown";if(!m[k])m[k]={count:0,gross:0,net:0,fee:0};m[k].count++;m[k].gross+=parseFloat(x.amount)||0;m[k].net+=parseFloat(x.net)||0;m[k].fee+=parseFloat(x.fee)||0;});return Object.entries(m).sort((a,b)=>b[1].net-a[1].net); }
export function aggByFan(t:ITxn[]) { const m:Record<string,{name:string;count:number;total:number}>={};t.forEach(x=>{const k=x.fanId||"?";if(!m[k])m[k]={name:x.fanName||k,count:0,total:0};m[k].count++;m[k].total+=parseFloat(x.net)||0;});return Object.entries(m).sort((a,b)=>b[1].total-a[1].total); }
export function aggByDay(t:ITxn[]) { const m:Record<string,number>={};t.forEach(x=>{if(!x.createdTime)return;const d=new Date(parseInt(x.createdTime));if(isNaN(d.getTime()))return;const k=d.toISOString().split("T")[0];m[k]=(m[k]||0)+(parseFloat(x.net)||0);});return Object.entries(m).sort((a,b)=>a[0].localeCompare(b[0])); }
