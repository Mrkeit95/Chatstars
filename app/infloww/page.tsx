"use client";
import { useState, useEffect } from "react";
import { getICreators, getITxns, getIRefunds, getILinks, getILinkFans, ITxn, ICreator, ILink, IRefund, aggByType, aggByFan, aggByDay } from "@/lib/infloww";

const $ = (v:number) => "$"+v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const dt = (ts:string) => { if(!ts)return "—"; const d=new Date(parseInt(ts)); return isNaN(d.getTime())?ts:d.toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}); };
const TC:Record<string,string> = {Messages:"#4ade80",Tips:"#facc15",Subscriptions:"#60a5fa",Posts:"#fb923c",Streams:"#a78bfa",Referrals:"#f472b6",Unknown:"#78716c"};

export default function Page() {
  const [tab,setTab]=useState("overview");
  const [creators,setC]=useState<ICreator[]>([]);
  const [txns,setT]=useState<ITxn[]>([]);
  const [links,setL]=useState<ILink[]>([]);
  const [refunds,setR]=useState<IRefund[]>([]);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState("");
  const [fanSearch,setFanSearch]=useState("");
  const [txSearch,setTxSearch]=useState("");
  const [txType,setTxType]=useState("all");
  const [selLink,setSelLink]=useState<string|null>(null);
  const [linkFans,setLinkFans]=useState<any[]>([]);
  const [lfLoading,setLfLoading]=useState(false);

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      try{
        const [c,t,l,r]=await Promise.all([getICreators().catch(()=>[]),getITxns().catch(()=>[]),getILinks().catch(()=>[]),getIRefunds().catch(()=>[])]);
        setC(c);setT(t);setL(l);setR(r);
        if(!c.length&&!t.length)setErr("No data. Check INFLOWW_API_KEY and INFLOWW_OID in Vercel env vars.");
      }catch(e:any){setErr(e.message);}
      setLoading(false);
    })();
  },[]);

  async function loadLinkFans(linkId:string){
    setSelLink(linkId);setLfLoading(true);
    try{ const fans=await getILinkFans(linkId); setLinkFans(fans); }catch{setLinkFans([]);}
    setLfLoading(false);
  }

  const tGross=txns.reduce((a,t)=>a+(parseFloat(t.amount)||0),0);
  const tNet=txns.reduce((a,t)=>a+(parseFloat(t.net)||0),0);
  const tFees=txns.reduce((a,t)=>a+(parseFloat(t.fee)||0),0);
  const tRef=refunds.reduce((a,r)=>a+(r.paymentAmount||0),0);
  const byType=aggByType(txns);
  const byFan=aggByFan(txns);
  const byDay=aggByDay(txns);
  const lEarn=links.reduce((a,l)=>a+(l.earningsNet||0),0)/100;
  const lSubs=links.reduce((a,l)=>a+(l.subCount||0),0);
  const lPaying=links.reduce((a,l)=>a+(l.payingFansCount||0),0);

  const filteredTxns=txns.filter(t=>{
    if(txSearch&&!(t.fanName||"").toLowerCase().includes(txSearch.toLowerCase()))return false;
    if(txType!=="all"&&t.type!==txType)return false;
    return true;
  });
  const filteredFans=byFan.filter(([,d])=>!fanSearch||d.name.toLowerCase().includes(fanSearch.toLowerCase()));
  const txTypes=[...new Set(txns.map(t=>t.type).filter(Boolean))];

  if(loading)return <div className="text-center py-20"><div className="inline-block w-6 h-6 border-2 border-white/10 border-t-[#4ade80] rounded-full animate-spin mb-3"/><div className="text-[#78716c] text-sm">Connecting to Infloww...</div></div>;

  return (<>
    <div className="mb-7"><h1 className="text-[26px] font-extrabold tracking-tight">Infloww Analytics</h1><p className="text-[13px] text-[#78716c] mt-1">Live OnlyFans data · {creators.length} creators · {txns.length} transactions · {links.length} links</p></div>
    {err&&<div className="p-4 bg-[#f87171]/10 border border-[#f87171]/20 rounded-xl mb-6 text-xs text-[#f87171]">{err}</div>}

    {/* KPIs */}
    <div className="grid grid-cols-6 gap-2.5 mb-6">
      {([["Gross Revenue",tGross,"#4ade80"],["Net Revenue",tNet,"#22d3ee"],["OF Fees",tFees,"#f87171"],["Refunds",tRef,"#fb923c"],["Link Earnings",lEarn,"#60a5fa"],["Link Subs",lSubs,"#a78bfa"]] as [string,number,string][]).map(([l,v,c],i)=>(
        <div key={i} className="p-4 rounded-xl bg-[#1a1714] border border-white/[0.06]">
          <div className="text-[9px] font-semibold text-[#78716c] uppercase tracking-wider mb-1.5">{l}</div>
          <div className="text-[20px] font-extrabold" style={{color:c}}>{i<5?$(v):v.toLocaleString()}</div>
          {i===5&&<div className="text-[9px] text-[#57534e] mt-0.5">{lPaying} paying fans</div>}
        </div>
      ))}
    </div>

    {/* Tabs */}
    <div className="flex gap-0.5 mb-5 bg-[#1a1714] border border-white/[0.06] rounded-xl p-1 w-fit">
      {(["overview","transactions","fans","links","refunds","creators"] as const).map(k=>(
        <button key={k} onClick={()=>setTab(k)} className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold transition capitalize ${tab===k?"bg-white/[0.08] text-white":"text-[#78716c] hover:text-white"}`}>{k==="fans"?"Top Fans":k}</button>
      ))}
    </div>

    {/* OVERVIEW */}
    {tab==="overview"&&(<div className="grid grid-cols-[1fr_1fr] gap-5">
      <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl p-5">
        <div className="text-[11px] font-bold text-[#78716c] uppercase tracking-wider mb-4">Revenue by Type</div>
        {byType.map(([type,d])=>{const p=tNet>0?d.net/tNet*100:0;return(
          <div key={type} className="mb-3.5">
            <div className="flex justify-between items-center text-xs mb-1"><span className="font-semibold flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{background:TC[type]||"#78716c"}}/>{type} <span className="text-[#57534e]">({d.count})</span></span><span className="font-bold" style={{color:TC[type]||"#78716c"}}>{$(d.net)}</span></div>
            <div className="h-1.5 rounded bg-white/[0.06] overflow-hidden"><div className="h-full rounded transition-all" style={{width:p+"%",background:TC[type]||"#78716c"}}/></div>
          </div>);
        })}
      </div>
      <div className="space-y-5">
        <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl p-5">
          <div className="text-[11px] font-bold text-[#78716c] uppercase tracking-wider mb-3">Daily Revenue</div>
          {byDay.length>0?<div className="flex items-end gap-1 h-[100px]">{byDay.map(([day,val])=>{const mx=Math.max(...byDay.map(d=>d[1] as number));return(
            <div key={day} className="flex-1 group relative" style={{height:Math.max((val as number)/(mx as number)*90,3),background:"#4ade80",borderRadius:"3px 3px 0 0"}}>
              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[#0c0a09] border border-white/[0.06] rounded px-2 py-1 text-[9px] whitespace-nowrap z-10">{day}: {$(val as number)}</div>
            </div>);})}</div>:<div className="text-xs text-[#57534e]">No daily data</div>}
        </div>
        <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl p-5">
          <div className="text-[11px] font-bold text-[#78716c] uppercase tracking-wider mb-3">Top 5 Fans</div>
          {byFan.slice(0,5).map(([id,d],i)=>(
            <div key={id} className="flex items-center gap-2.5 py-1.5"><span className="text-[10px] text-[#57534e] w-4 font-bold">{i+1}</span><span className="text-xs font-semibold flex-1 truncate">{d.name}</span><span className="text-xs text-[#57534e]">{d.count} txns</span><span className="text-xs font-bold text-[#4ade80]">{$(d.total)}</span></div>
          ))}
        </div>
      </div>
    </div>)}

    {/* TRANSACTIONS */}
    {tab==="transactions"&&(<>
      <div className="flex gap-2.5 mb-4">
        <input value={txSearch} onChange={e=>setTxSearch(e.target.value)} placeholder="Search fan name..." className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]/30 min-w-[200px]"/>
        <select value={txType} onChange={e=>setTxType(e.target.value)} className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none">
          <option value="all">All Types</option>{txTypes.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-x-auto">
        <table className="w-full text-sm"><thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider"><th className="text-left p-3">Fan</th><th className="text-left p-3">Type</th><th className="text-left p-3">Gross</th><th className="text-left p-3">Fee</th><th className="text-left p-3">Net</th><th className="text-left p-3">Status</th><th className="text-left p-3">Date</th></tr></thead>
        <tbody>{filteredTxns.slice(0,100).map(t=>(
          <tr key={t.id} className="border-t border-white/[0.03] hover:bg-white/[0.02]"><td className="p-3 font-semibold text-xs">{t.fanName||t.fanId}</td><td className="p-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{background:(TC[t.type]||"#78716c")+"20",color:TC[t.type]||"#78716c"}}>{t.type}</span></td><td className="p-3 text-xs">{$(parseFloat(t.amount)||0)}</td><td className="p-3 text-xs text-[#f87171]">{$(parseFloat(t.fee)||0)}</td><td className="p-3 text-xs font-bold text-[#4ade80]">{$(parseFloat(t.net)||0)}</td><td className="p-3"><span className={`text-[10px] font-bold ${t.status==="settled"?"text-[#4ade80]":t.status==="loading"?"text-[#facc15]":"text-[#78716c]"}`}>{t.status}</span></td><td className="p-3 text-[10px] text-[#57534e]">{dt(t.createdTime)}</td></tr>
        ))}</tbody></table>
        {filteredTxns.length>100&&<div className="p-3 text-center text-[10px] text-[#57534e]">Showing 100 of {filteredTxns.length}</div>}
      </div>
    </>)}

    {/* TOP FANS */}
    {tab==="fans"&&(<>
      <input value={fanSearch} onChange={e=>setFanSearch(e.target.value)} placeholder="Search fans..." className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]/30 min-w-[200px] mb-4"/>
      <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm"><thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider"><th className="text-left p-3">#</th><th className="text-left p-3">Fan</th><th className="text-left p-3">Transactions</th><th className="text-left p-3">Total Spent (Net)</th></tr></thead>
        <tbody>{filteredFans.slice(0,50).map(([id,d],i)=>(
          <tr key={id} className="border-t border-white/[0.03] hover:bg-white/[0.02]"><td className="p-3 text-[#57534e] font-bold">{i+1}</td><td className="p-3 font-semibold">{d.name}</td><td className="p-3 text-[#78716c]">{d.count}</td><td className="p-3 font-bold text-[#4ade80]">{$(d.total)}</td></tr>
        ))}</tbody></table>
      </div>
    </>)}

    {/* LINKS */}
    {tab==="links"&&(<>
      <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-hidden mb-5">
        <table className="w-full text-sm"><thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider"><th className="text-left p-3">Campaign</th><th className="text-left p-3">Type</th><th className="text-left p-3">Subs</th><th className="text-left p-3">Limit</th><th className="text-left p-3">Discount</th><th className="text-left p-3">Earnings (Net)</th><th className="text-left p-3">Paying Fans</th><th className="text-left p-3">Status</th><th className="text-left p-3">Fans</th></tr></thead>
        <tbody>{links.map(l=>(
          <tr key={l.id} className="border-t border-white/[0.03] hover:bg-white/[0.02]"><td className="p-3 font-semibold text-xs max-w-[200px] truncate">{l.message||"—"}</td><td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${l.type==="new"?"bg-[#4ade80]/15 text-[#4ade80]":l.type==="free_trial"?"bg-[#60a5fa]/15 text-[#60a5fa]":"bg-white/5 text-[#78716c]"}`}>{l.type}</span></td><td className="p-3 text-xs">{l.subCount}</td><td className="p-3 text-xs text-[#57534e]">{l.subLimit||"∞"}</td><td className="p-3 text-xs">{l.discount}%</td><td className="p-3 text-xs font-bold text-[#4ade80]">{$(l.earningsNet/100)}</td><td className="p-3 text-xs">{l.payingFansCount}</td><td className="p-3">{l.finishedFlag?<span className="text-[10px] text-[#57534e]">Finished</span>:<span className="text-[10px] text-[#4ade80] font-bold">Active</span>}</td><td className="p-3"><button onClick={()=>loadLinkFans(l.id)} className="text-[10px] px-2 py-1 rounded bg-white/[0.06] text-[#78716c] hover:text-white transition">View</button></td></tr>
        ))}</tbody></table>
      </div>
      {selLink&&(<div className="bg-[#1a1714] border border-white/[0.06] rounded-xl p-5">
        <div className="text-[11px] font-bold text-[#78716c] uppercase tracking-wider mb-3">Fans from Link {selLink}</div>
        {lfLoading?<div className="text-xs text-[#57534e]">Loading fans...</div>:linkFans.length>0?
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">{linkFans.map((f:any,i:number)=>(
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-[#0c0a09] text-xs"><span className="font-semibold flex-1">{f.fanName||f.fanId}</span><span className="text-[#57534e]">Subs: {$(f.subscriptionEarningNet||0)}</span><span className="text-[#57534e]">Posts: {$(f.postsEarningNet||0)}</span><span className="text-[#57534e]">Msgs: {$(f.messagesEarningNet||0)}</span></div>
        ))}</div>:<div className="text-xs text-[#57534e]">No fans data</div>}
      </div>)}
    </>)}

    {/* REFUNDS */}
    {tab==="refunds"&&(
      <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm"><thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider"><th className="text-left p-3">Transaction</th><th className="text-left p-3">Type</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Status</th><th className="text-left p-3">Payment Date</th><th className="text-left p-3">Refund Date</th></tr></thead>
        <tbody>{refunds.length>0?refunds.map(r=>(
          <tr key={r.id} className="border-t border-white/[0.03] hover:bg-white/[0.02]"><td className="p-3 text-xs font-mono text-[#78716c]">{r.transactionId}</td><td className="p-3 text-xs">{r.transactionType}</td><td className="p-3 text-xs font-bold text-[#f87171]">{$(r.paymentAmount)}</td><td className="p-3"><span className={`text-[10px] font-bold ${r.paymentStatus==="undo"?"text-[#f87171]":"text-[#facc15]"}`}>{r.paymentStatus}</span></td><td className="p-3 text-[10px] text-[#57534e]">{dt(r.paymentTime)}</td><td className="p-3 text-[10px] text-[#57534e]">{dt(r.refundTime)}</td></tr>
        )):<tr><td colSpan={6} className="p-8 text-center text-[#57534e]">No refunds — great news!</td></tr>}</tbody></table>
      </div>
    )}

    {/* CREATORS */}
    {tab==="creators"&&(
      <div className="grid grid-cols-3 gap-3">{creators.map(c=>(
        <div key={c.id} className="p-4 rounded-xl bg-[#1a1714] border border-white/[0.06] hover:border-white/[0.12] transition">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4ade80]/30 to-[#22d3ee]/30 flex items-center justify-center font-bold text-sm text-white">{(c.name||c.userName||"?")[0].toUpperCase()}</div><div><div className="text-[13px] font-bold">{c.name||c.nickName}</div><div className="text-[10px] text-[#57534e]">@{c.userName}</div></div></div>
          {c.tagName&&<div className="mt-2 text-[10px] text-[#78716c]">Tag: {c.tagName}</div>}
        </div>
      ))}</div>
    )}
  </>);
}
