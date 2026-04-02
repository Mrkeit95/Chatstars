export interface ITxn { id:string; transactionId:string; fanId:string; fanName:string; createdTime:string; type:string; status:string; amount:string; fee:string; net:string; creatorId?:string; creatorName?:string; }
export interface ICreator { id:string; name:string; nickName:string; userName:string; tagName:string; createdTime:string; platformCode:string; }
export interface ILink { id:string; message:string; type:string; subCount:number; subLimit:number; subDuration:number; discount:number; finishedFlag:boolean; earningsGross:number; earningsNet:number; payingFansCount:number; creatorId?:string; creatorName?:string; }
export interface IRefund { id:string; transactionId:string; fanId:string; paymentTime:string; refundTime:string; paymentStatus:string; paymentAmount:number; transactionType:string; currency:string; creatorId?:string; creatorName?:string; }

export interface InflowwData {
  creators: ICreator[];
  transactions: ITxn[];
  refunds: IRefund[];
  links: ILink[];
  fetchedAt: number;
}

// Fetch ALL data in one call (backend handles per-creator fetching)
export async function fetchAllInflowwData(days = 30): Promise<InflowwData> {
  const startTime = String(Date.now() - days * 24 * 60 * 60 * 1000);
  const endTime = String(Date.now());
  const res = await fetch(`/api/infloww?action=all_transactions&startTime=${startTime}&endTime=${endTime}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return {
    creators: json.data?.creators || [],
    transactions: json.data?.transactions || [],
    refunds: json.data?.refunds || [],
    links: json.data?.links || [],
    fetchedAt: json.data?.fetchedAt || Date.now(),
  };
}

// Just fetch creators (fast)
export async function getICreators(): Promise<ICreator[]> {
  const res = await fetch("/api/infloww?endpoint=creators&limit=100");
  const json = await res.json();
  return json.data?.list || [];
}

export async function getILinkFans(linkId: string) {
  const res = await fetch(`/api/infloww?endpoint=linkfans&linkId=${linkId}&limit=100`);
  const json = await res.json();
  return json.data?.list || [];
}
