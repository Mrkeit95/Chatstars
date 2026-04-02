export interface ITxn { id:string; transactionId:string; fanId:string; fanName:string; createdTime:string; type:string; status:string; amount:string; fee:string; net:string; creatorId?:string; creatorName?:string; }
export interface ICreator { id:string; name:string; nickName:string; userName:string; tagName:string; createdTime:string; platformCode:string; }
export interface ILink { id:string; message:string; type:string; subCount:number; subLimit:number; subDuration:number; discount:number; finishedFlag:boolean; earningsGross:number; earningsNet:number; payingFansCount:number; }
export interface IRefund { id:string; transactionId:string; fanId:string; paymentTime:string; refundTime:string; paymentStatus:string; paymentAmount:number; transactionType:string; currency:string; }

async function f(endpoint:string, params?:Record<string,string>, fetchAll=false) {
  const q = new URLSearchParams({ endpoint, ...(params||{}) });
  if (fetchAll) q.set("all", "true");
  const r = await fetch(`/api/infloww?${q.toString()}`);
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d.data;
}

export async function getICreators():Promise<ICreator[]> { return (await f("creators",{limit:"100"},true))?.list||[]; }
export async function getITxns(days=30):Promise<ITxn[]> {
  const start = String(Date.now() - days * 24 * 60 * 60 * 1000);
  const end = String(Date.now());
  return (await f("transactions",{limit:"100",startTime:start,endTime:end},true))?.list||[];
}
export async function getIRefunds(days=30):Promise<IRefund[]> {
  const start = String(Date.now() - days * 24 * 60 * 60 * 1000);
  const end = String(Date.now());
  return (await f("refunds",{limit:"100",startTime:start,endTime:end},true))?.list||[];
}
export async function getILinks():Promise<ILink[]> { return (await f("links",{limit:"100"},true))?.list||[]; }
export async function getILinkFans(linkId:string) { return (await f("linkfans",{linkId,limit:"100"},true))?.list||[]; }
