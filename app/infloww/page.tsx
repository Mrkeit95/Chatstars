"use client";
import { useState, useEffect, useMemo } from "react";
import { getICreators, getITxns, getIRefunds, getILinks, getILinkFans, ITxn, ICreator, ILink, IRefund } from "@/lib/infloww";

const $ = (v:number) => "$"+Math.abs(v).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const $k = (v:number) => v >= 10000 ? "$"+(v/1000).toFixed(1)+"K" : $(v);
const dt = (ts:string) => { if(!ts)return "—"; const d=new Date(parseInt(ts)); return isNaN(d.getTime())?ts:d.toLocaleDateString("en-US",{month:"short",day:"numeric"}); };
const dtFull = (ts:string) => { if(!ts)return "—"; const d=new Date(parseInt(ts)); return isNaN(d.getTime())?ts:d.toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}); };
const TC:Record<string,string> = {Messages:"#4ade80",Tips:"#facc15",Subscriptions:"#60a5fa",Posts:"#fb923c",Streams:"#a78bfa",Referrals:"#f472b6","Ad Revenue":"#22d3ee",Unknown:"#78716c"};

function Badge({text,color}:{text:string;color:string}) {
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{background:color+"18",color}}>{text}</span>;
}
function KPI({label,value,color,sub}:{label:string;value:string;color:string;sub?:string}) {
  return <div className="p-4 rounded-xl bg-[#1a1714] border border-white/[0.06] hover:border-white/[0.12] transition">
    <div className="text-[9px] font-semibold text-[#78716c] uppercase tracking-wider mb-1.5">{label}</div>
    <div className="text-[22px] font-extrabold leading-tight" style={{color}}>{value}</div>
    {sub && <div className="text-[9px] text-[#57534e] mt-1">{sub}</div>}
  </div>;
}

export default function Page() {
  const [tab,setTab]=useState("overview");
  const [days,setDays]=useState(30);
  const [creators,setC]=useState<ICreator[]>([]);
  const [txns,setT]=useState<ITxn[]>([]);
  const [links,setL]=useState<ILink[]>([]);
  const [refunds,setR]=useState<IRefund[]>([]);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState("");
  // Filters
  const [txSearch,setTxSearch]=useState("");
  const [txType,setTxType]=useState("all");
  const [txCreator,setTxCreator]=useState("all");
  const [txStatus,setTxStatus]=useState("all");
  const [fanSearch,setFanSearch]=useState("");
  const [creatorSearch,setCreatorSearch]=useState("");
  const [selCreator,setSelCreator]=useState<string|null>(null);
  const [selLink,setSelLink]=useState<string|null>(null);
  const [linkFans,setLinkFans]=useState<any[]>([]);
  const [lfLoading,setLfLoading]=useState(false);

  async function loadData(d:number) {
    setLoading(true); setErr("");
    try {
      const [c,t,l,r] = await Promise.all([
        getICreators().catch(()=>[]),
        getITxns(d).catch(()=>[]),
        getILinks().catch(()=>[]),
        getIRefunds(d).catch(()=>[]),
      ]);
      setC(c); setT(t); setL(l); setR(r);
      if(!c.length&&!t.length) setErr("No data returned. Verify INFLOWW_API_KEY and INFLOWW_OID in Vercel.");
    } catch(e:any) { setErr(e.message); }
    setLoading(false);
  }

  useEffect(()=>{ loadData(days); },[days]);

  async function loadLinkFans(id:string) { setSelLink(id); setLfLoading(true); try { setLinkFans(await getILinkFans(id)); } catch { setLinkFans([]); } setLfLoading(false); }

  // Aggregations
  const tGross = useMemo(()=>txns.reduce((a,t)=>a+(parseFloat(t.amount)||0),0),[txns]);
  const tNet = useMemo(()=>txns.reduce((a,t)=>a+(parseFloat(t.net)||0),0),[txns]);
  const tFees = useMemo(()=>txns.reduce((a,t)=>a+(parseFloat(t.fee)||0),0),[txns]);
  const tRefAmt = useMemo(()=>refunds.reduce((a,r)=>a+(r.paymentAmount||0),0),[refunds]);
  const lEarn = useMemo(()=>links.reduce((a,l)=>a+(l.earningsNet||0),0)/100,[links]);
  const lSubs = useMemo(()=>links.reduce((a,l)=>a+(l.subCount||0),0),[links]);
  const lPaying = useMemo(()=>links.reduce((a,l)=>a+(l.payingFansCount||0),0),[links]);

  const byType = useMemo(()=>{
    const m:Record<string,{count:number;gross:number;net:number;fee:number}>={};
    txns.forEach(t=>{const k=t.type||"Unknown";if(!m[k])m[k]={count:0,gross:0,net:0,fee:0};m[k].count++;m[k].gross+=parseFloat(t.amount)||0;m[k].net+=parseFloat(t.net)||0;m[k].fee+=parseFloat(t.fee)||0;});
    return Object.entries(m).sort((a,b)=>b[1].net-a[1].net);
  },[txns]);

  const byFan = useMemo(()=>{
    const m:Record<string,{name:string;count:number;total:number;types:Record<string,number>}>={};
    txns.forEach(t=>{const k=t.fanId||"?";if(!m[k])m[k]={name:t.fanName||k,count:0,total:0,types:{}};m[k].count++;m[k].total+=parseFloat(t.net)||0;const ty=t.type||"Unknown";m[k].types[ty]=(m[k].types[ty]||0)+(parseFloat(t.net)||0);});
    return Object.entries(m).sort((a,b)=>b[1].total-a[1].total);
  },[txns]);

  const byDay = useMemo(()=>{
    const m:Record<string,{gross:number;net:number;count:number}>={};
    txns.forEach(t=>{if(!t.createdTime)return;const d=new Date(parseInt(t.createdTime));if(isNaN(d.getTime()))return;const k=d.toISOString().split("T")[0];if(!m[k])m[k]={gross:0,net:0,count:0};m[k].gross+=parseFloat(t.amount)||0;m[k].net+=parseFloat(t.net)||0;m[k].count++;});
    return Object.entries(m).sort((a,b)=>a[0].localeCompare(b[0]));
  },[txns]);

  const byCreator = useMemo(()=>{
    const m:Record<string,{name:string;count:number;net:number;types:Record<string,number>}>={};
    txns.forEach(t=>{const k=t.creatorName||t.creatorId||"Unknown";if(!m[k])m[k]={name:k,count:0,net:0,types:{}};m[k].count++;m[k].net+=parseFloat(t.net)||0;const ty=t.type||"Unknown";m[k].types[ty]=(m[k].types[ty]||0)+(parseFloat(t.net)||0);});
    return Object.entries(m).sort((a,b)=>b[1].net-a[1].net);
  },[txns]);

  const txTypes = useMemo(()=>[...new Set(txns.map(t=>t.type).filter(Boolean))],[txns]);
  const txCreators = useMemo(()=>[...new Set(txns.map(t=>t.creatorName||t.creatorId).filter(Boolean))],[txns]);

  const filteredTxns = useMemo(()=>txns.filter(t=>{
    if(txSearch && !(t.fanName||"").toLowerCase().includes(txSearch.toLowerCase()) && !(t.creatorName||"").toLowerCase().includes(txSearch.toLowerCase())) return false;
    if(txType!=="all" && t.type!==txType) return false;
    if(txCreator!=="all" && (t.creatorName||t.creatorId)!==txCreator) return false;
    if(txStatus!=="all" && t.status!==txStatus) return false;
    if(selCreator && (t.creatorName||t.creatorId)!==selCreator) return false;
    return true;
  }),[txns,txSearch,txType,txCreator,txStatus,selCreator]);

  const filteredFans = useMemo(()=>byFan.filter(([,d])=>!fanSearch||d.name.toLowerCase().includes(fanSearch.toLowerCase())),[byFan,fanSearch]);

  const filteredCreators = useMemo(()=>creators.filter(c=>!creatorSearch||(c.name||c.userName||"").toLowerCase().includes(creatorSearch.toLowerCase())),[creators,creatorSearch]);

  const avgTicket = txns.length > 0 ? tNet / txns.length : 0;
  const feeRate = tGross > 0 ? (tFees / tGross * 100) : 0;
  const refundRate = tGross > 0 ? (tRefAmt / tGross * 100) : 0;

  if(loading) return <div className="text-center py-20"><div className="inline-block w-8 h-8 border-2 border-white/10 border-t-[#4ade80] rounded-full animate-spin mb-3"/><div className="text-[#78716c] text-sm">Loading Infloww data ({days}d)...</div><div className="text-[10px] text-[#57534e] mt-1">Fetching creators, transactions, links, refunds...</div></div>;

  return (<>
    <div className="flex items-start justify-between mb-6">
      <div><h1 className="text-[26px] font-extrabold tracking-tight">Infloww Analytics</h1>
      <p className="text-[13px] text-[#78716c] mt-1">Live OnlyFans data · {creators.length} creators · {txns.length} transactions · {links.length} links · {refunds.length} refunds</p></div>
      {/* Date Range Selector */}
      <div className="flex gap-1 bg-[#1a1714] border border-white/[0.06] rounded-xl p-1">
        {[{d:7,l:"7D"},{d:30,l:"30D"},{d:90,l:"90D"},{d:365,l:"1Y"}].map(({d,l})=>(
          <button key={d} onClick={()=>setDays(d)} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition ${days===d?"bg-[#4ade80]/15 text-[#4ade80]":"text-[#78716c] hover:text-white"}`}>{l}</button>
        ))}
      </div>
    </div>
    {err&&<div className="p-4 bg-[#f87171]/10 border border-[#f87171]/20 rounded-xl mb-5 text-xs text-[#f87171]">{err}</div>}

    {/* KPIs */}
    <div className="grid grid-cols-8 gap-2 mb-5">
      <KPI label="Gross" value={$k(tGross)} color="#4ade80" sub={`${txns.length} txns`}/>
      <KPI label="Net" value={$k(tNet)} color="#22d3ee"/>
      <KPI label="OF Fees" value={$k(tFees)} color="#f87171" sub={`${feeRate.toFixed(1)}% rate`}/>
      <KPI label="Refunds" value={$k(tRefAmt)} color="#fb923c" sub={`${refunds.length} · ${refundRate.toFixed(1)}%`}/>
      <KPI label="Avg Ticket" value={$(avgTicket)} color="#a78bfa"/>
      <KPI label="Links" value={$k(lEarn)} color="#60a5fa" sub={`${lSubs} subs`}/>
      <KPI label="Paying Fans" value={String(lPaying)} color="#f472b6"/>
      <KPI label="Creators" value={String(creators.length)} color="#facc15"/>
    </div>

    {/* Tabs */}
    <div className="flex gap-0.5 mb-5 bg-[#1a1714] border border-white/[0.06] rounded-xl p-1 w-fit">
      {([["overview","Overview"],["transactions","Transactions"],["fans","Top Fans"],["creators","Creators"],["links","Campaigns"],["refunds","Refunds"]] as const).map(([k,l])=>(
        <button key={k} onClick={()=>{setTab(k);setSelCreator(null);}} className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold transition ${tab===k?"bg-white/[0.08] text-white":"text-[#78716c] hover:text-white"}`}>{l}{k==="transactions"?` (${txns.length})`:k==="fans"?` (${byFan.length})`:k==="creators"?` (${creators.length})`:k==="links"?` (${links.length})`:k==="refunds"?` (${refunds.length})`:""}</button>
      ))}
    </div>

    {/* ═══ OVERVIEW ═══ */}
    {tab==="overview"&&(<div className="space-y-5">
      <div className="grid grid-cols-[1fr_1fr] gap-5">
        {/* Revenue by Type */}
        <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl p-5">
          <div className="text-[11px] font-bold text-[#78716c] uppercase tracking-wider mb-4">Revenue by Type</div>
          {byType.length>0?byType.map(([type,d])=>{const p=tNet>0?d.net/tNet*100:0;return(
            <div key={type} className="mb-3.5 group cursor-pointer" onClick={()=>{setTab("transactions");setTxType(type);}}>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background:TC[type]||"#78716c"}}/>{type}<span className="text-[#57534e]">({d.count})</span></span>
                <span className="font-bold" style={{color:TC[type]||"#78716c"}}>{$(d.net)}</span>
              </div>
              <div className="h-2 rounded bg-white/[0.06] overflow-hidden"><div className="h-full rounded transition-all group-hover:brightness-125" style={{width:Math.max(p,1)+"%",background:TC[type]||"#78716c"}}/></div>
              <div className="flex justify-between text-[9px] text-[#57534e] mt-0.5"><span>Gross: {$(d.gross)}</span><span>Fees: {$(d.fee)}</span><span>{p.toFixed(1)}%</span></div>
            </div>);
          }):<div className="text-xs text-[#57534e] py-8 text-center">No transaction data for this period</div>}
        </div>
        {/* Daily Revenue */}
        <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl p-5">
          <div className="text-[11px] font-bold text-[#78716c] uppercase tracking-wider mb-4">Daily Revenue ({days}d)</div>
          {byDay.length>0?<>
            <div className="flex items-end gap-[2px] h-[130px] mb-2">{byDay.map(([day,d])=>{const mx=Math.max(...byDay.map(x=>(x[1] as any).net));const h=mx>0?(d as any).net/mx*120:0;return(
              <div key={day} className="flex-1 group relative cursor-pointer" onClick={()=>{setTab("transactions");setTxSearch(day);}}>
                <div className="w-full rounded-t transition-all group-hover:brightness-150" style={{height:Math.max(h,2),background:"#4ade80"}}/>
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[#0c0a09] border border-white/10 rounded px-2.5 py-1.5 text-[9px] whitespace-nowrap z-20 shadow-lg">
                  <div className="font-bold text-white">{day}</div>
                  <div className="text-[#4ade80]">Net: {$((d as any).net)}</div>
                  <div className="text-[#57534e]">{(d as any).count} txns</div>
                </div>
              </div>);})}</div>
            <div className="flex justify-between text-[9px] text-[#57534e]"><span>{byDay[0]?.[0]}</span><span>{byDay[byDay.length-1]?.[0]}</span></div>
          </>:<div className="text-xs text-[#57534e] py-8 text-center">No daily data</div>}
        </div>
      </div>
      <div className="grid grid-cols-[1fr_1fr] gap-5">
        {/* Top Creators */}
        <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl p-5">
          <div className="text-[11px] font-bold text-[#78716c] uppercase tracking-wider mb-3">Top Creators by Revenue</div>
          {byCreator.slice(0,8).map(([id,d],i)=>(
            <div key={id} className="flex items-center gap-2.5 py-2 cursor-pointer hover:bg-white/[0.02] rounded-lg px-2 -mx-2 transition" onClick={()=>{setSelCreator(id);setTab("transactions");}}>
              <span className="text-[10px] text-[#57534e] w-4 font-bold">{i+1}</span>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4ade80]/30 to-[#22d3ee]/20 flex items-center justify-center text-[9px] font-bold">{(d.name||"?")[0].toUpperCase()}</div>
              <span className="text-xs font-semibold flex-1 truncate">{d.name}</span>
              <span className="text-[10px] text-[#57534e]">{d.count} txns</span>
              <span className="text-xs font-bold text-[#4ade80]">{$k(d.net)}</span>
            </div>
          ))}
        </div>
        {/* Top Fans */}
        <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl p-5">
          <div className="text-[11px] font-bold text-[#78716c] uppercase tracking-wider mb-3">Top Spending Fans</div>
          {byFan.slice(0,8).map(([id,d],i)=>(
            <div key={id} className="flex items-center gap-2.5 py-2 hover:bg-white/[0.02] rounded-lg px-2 -mx-2 transition cursor-pointer" onClick={()=>{setFanSearch(d.name);setTab("fans");}}>
              <span className="text-[10px] text-[#57534e] w-4 font-bold">{i+1}</span>
              <span className="text-xs font-semibold flex-1 truncate">{d.name}</span>
              <div className="flex gap-1">{Object.entries(d.types).slice(0,3).map(([ty])=><span key={ty} className="w-1.5 h-1.5 rounded-full" style={{background:TC[ty]||"#78716c"}}/>)}</div>
              <span className="text-[10px] text-[#57534e]">{d.count}</span>
              <span className="text-xs font-bold text-[#4ade80]">{$(d.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>)}

    {/* ═══ TRANSACTIONS ═══ */}
    {tab==="transactions"&&(<>
      {selCreator&&<div className="mb-3 flex items-center gap-2 text-xs"><span className="text-[#78716c]">Filtered by creator:</span><span className="font-bold text-[#4ade80]">{selCreator}</span><button onClick={()=>setSelCreator(null)} className="text-[#f87171] hover:underline ml-1">Clear</button></div>}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input value={txSearch} onChange={e=>setTxSearch(e.target.value)} placeholder="Search fan or creator..." className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]/30 min-w-[200px]"/>
        <select value={txType} onChange={e=>setTxType(e.target.value)} className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none"><option value="all">All Types</option>{txTypes.map(t=><option key={t} value={t}>{t}</option>)}</select>
        <select value={txCreator} onChange={e=>setTxCreator(e.target.value)} className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none"><option value="all">All Creators</option>{txCreators.map(c=><option key={c} value={c}>{c}</option>)}</select>
        <select value={txStatus} onChange={e=>setTxStatus(e.target.value)} className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white outline-none"><option value="all">All Status</option><option value="settled">Settled</option><option value="loading">Loading</option></select>
        <div className="ml-auto text-xs text-[#57534e] self-center">{filteredTxns.length} transactions</div>
      </div>
      <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-x-auto">
        <table className="w-full text-sm"><thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider"><th className="text-left p-3">Fan</th><th className="text-left p-3">Creator</th><th className="text-left p-3">Type</th><th className="text-left p-3">Gross</th><th className="text-left p-3">Fee</th><th className="text-left p-3">Net</th><th className="text-left p-3">Status</th><th className="text-left p-3">Date</th></tr></thead>
        <tbody>{filteredTxns.slice(0,200).map(t=>(
          <tr key={t.id} className="border-t border-white/[0.03] hover:bg-white/[0.02]">
            <td className="p-3 font-semibold text-xs">{t.fanName||t.fanId||"—"}</td>
            <td className="p-3 text-xs text-[#78716c] cursor-pointer hover:text-white" onClick={()=>{setSelCreator(t.creatorName||t.creatorId||null);}}>{t.creatorName||"—"}</td>
            <td className="p-3"><Badge text={t.type||"?"} color={TC[t.type]||"#78716c"}/></td>
            <td className="p-3 text-xs">{$(parseFloat(t.amount)||0)}</td>
            <td className="p-3 text-xs text-[#f87171]">{$(parseFloat(t.fee)||0)}</td>
            <td className="p-3 text-xs font-bold text-[#4ade80]">{$(parseFloat(t.net)||0)}</td>
            <td className="p-3"><span className={`text-[10px] font-bold ${t.status==="settled"?"text-[#4ade80]":t.status==="loading"?"text-[#facc15]":"text-[#78716c]"}`}>{t.status||"—"}</span></td>
            <td className="p-3 text-[10px] text-[#57534e] whitespace-nowrap">{dtFull(t.createdTime)}</td>
          </tr>
        ))}</tbody></table>
        {filteredTxns.length>200&&<div className="p-3 text-center text-[10px] text-[#57534e]">Showing 200 of {filteredTxns.length}</div>}
      </div>
    </>)}

    {/* ═══ TOP FANS ═══ */}
    {tab==="fans"&&(<>
      <input value={fanSearch} onChange={e=>setFanSearch(e.target.value)} placeholder="Search fans..." className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]/30 min-w-[220px] mb-4"/>
      <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm"><thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider"><th className="text-left p-3">#</th><th className="text-left p-3">Fan</th><th className="text-left p-3">Transactions</th><th className="text-left p-3">Breakdown</th><th className="text-left p-3">Total (Net)</th></tr></thead>
        <tbody>{filteredFans.slice(0,100).map(([id,d],i)=>(
          <tr key={id} className="border-t border-white/[0.03] hover:bg-white/[0.02] cursor-pointer" onClick={()=>{setTxSearch(d.name);setTab("transactions");}}>
            <td className="p-3 text-[#57534e] font-bold">{i+1}</td>
            <td className="p-3 font-semibold">{d.name}</td>
            <td className="p-3 text-[#78716c]">{d.count}</td>
            <td className="p-3"><div className="flex gap-1.5 flex-wrap">{Object.entries(d.types).map(([ty,v])=><span key={ty} className="text-[9px] px-1.5 py-0.5 rounded" style={{background:(TC[ty]||"#78716c")+"18",color:TC[ty]||"#78716c"}}>{ty}: {$(v)}</span>)}</div></td>
            <td className="p-3 font-bold text-[#4ade80]">{$(d.total)}</td>
          </tr>
        ))}</tbody></table>
      </div>
    </>)}

    {/* ═══ CREATORS ═══ */}
    {tab==="creators"&&(<>
      <input value={creatorSearch} onChange={e=>setCreatorSearch(e.target.value)} placeholder="Search creators..." className="bg-[#1a1714] border border-white/[0.06] rounded-lg px-3.5 py-2 text-sm text-white outline-none focus:border-[#4ade80]/30 min-w-[220px] mb-4"/>
      <div className="grid grid-cols-3 gap-3">
        {filteredCreators.map(c=>{
          const cTxns = txns.filter(t=>(t.creatorName||t.creatorId)===c.name||(t.creatorName||t.creatorId)===c.userName);
          const cNet = cTxns.reduce((a,t)=>a+(parseFloat(t.net)||0),0);
          const cTypes:Record<string,number> = {};
          cTxns.forEach(t=>{const ty=t.type||"?";cTypes[ty]=(cTypes[ty]||0)+(parseFloat(t.net)||0);});
          return (
            <div key={c.id} className="p-4 rounded-xl bg-[#1a1714] border border-white/[0.06] hover:border-[#4ade80]/20 transition cursor-pointer" onClick={()=>{setSelCreator(c.name||c.userName);setTab("transactions");}}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#4ade80]/30 to-[#22d3ee]/20 flex items-center justify-center font-bold text-sm text-white">{(c.name||c.userName||"?")[0].toUpperCase()}</div>
                <div><div className="text-[13px] font-bold">{c.name||c.nickName}</div><div className="text-[10px] text-[#57534e]">@{c.userName}</div></div>
              </div>
              <div className="flex items-center justify-between mb-2"><span className="text-[10px] text-[#78716c]">{days}d Revenue</span><span className="text-sm font-bold text-[#4ade80]">{$k(cNet)}</span></div>
              <div className="flex items-center justify-between mb-2"><span className="text-[10px] text-[#78716c]">Transactions</span><span className="text-xs font-semibold">{cTxns.length}</span></div>
              <div className="flex gap-1 flex-wrap">{Object.entries(cTypes).slice(0,4).map(([ty,v])=><span key={ty} className="text-[8px] px-1.5 py-0.5 rounded" style={{background:(TC[ty]||"#78716c")+"15",color:TC[ty]||"#78716c"}}>{ty}: {$k(v)}</span>)}</div>
              {c.tagName&&<div className="mt-2 text-[9px] text-[#57534e]">Tag: {c.tagName}</div>}
            </div>
          );
        })}
      </div>
    </>)}

    {/* ═══ CAMPAIGNS / LINKS ═══ */}
    {tab==="links"&&(<>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <KPI label="Total Link Earnings" value={$(lEarn)} color="#4ade80"/>
        <KPI label="Total Subs from Links" value={String(lSubs)} color="#60a5fa" sub={`${lPaying} paying`}/>
        <KPI label="Active Campaigns" value={String(links.filter(l=>!l.finishedFlag).length)} color="#facc15" sub={`of ${links.length} total`}/>
      </div>
      <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-hidden mb-5">
        <table className="w-full text-sm"><thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider"><th className="text-left p-3">Campaign</th><th className="text-left p-3">Type</th><th className="text-left p-3">Subs</th><th className="text-left p-3">Limit</th><th className="text-left p-3">Discount</th><th className="text-left p-3">Earnings</th><th className="text-left p-3">Paying</th><th className="text-left p-3">Status</th><th className="text-left p-3">Fans</th></tr></thead>
        <tbody>{links.map(l=>(
          <tr key={l.id} className={`border-t border-white/[0.03] hover:bg-white/[0.02] ${selLink===l.id?"bg-[#4ade80]/5":""}`}>
            <td className="p-3 font-semibold text-xs max-w-[200px] truncate">{l.message||"—"}</td>
            <td className="p-3"><Badge text={l.type} color={l.type==="new"?"#4ade80":l.type==="free_trial"?"#60a5fa":"#78716c"}/></td>
            <td className="p-3 text-xs font-bold">{l.subCount}</td>
            <td className="p-3 text-xs text-[#57534e]">{l.subLimit||"∞"}</td>
            <td className="p-3 text-xs">{l.discount}%</td>
            <td className="p-3 text-xs font-bold text-[#4ade80]">{$(l.earningsNet/100)}</td>
            <td className="p-3 text-xs">{l.payingFansCount}</td>
            <td className="p-3">{l.finishedFlag?<span className="text-[10px] text-[#57534e]">Ended</span>:<Badge text="Active" color="#4ade80"/>}</td>
            <td className="p-3"><button onClick={()=>loadLinkFans(l.id)} className="text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.06] text-[#78716c] hover:text-white hover:bg-white/[0.1] transition font-semibold">{selLink===l.id?"Refresh":"View Fans"}</button></td>
          </tr>
        ))}</tbody></table>
      </div>
      {selLink&&(<div className="bg-[#1a1714] border border-white/[0.06] rounded-xl p-5">
        <div className="text-[11px] font-bold text-[#78716c] uppercase tracking-wider mb-3">Fan Revenue Breakdown — Link {selLink}</div>
        {lfLoading?<div className="text-xs text-[#57534e] animate-pulse">Loading fans...</div>:linkFans.length>0?
        <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">{linkFans.map((fan:any,i:number)=>(
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#0c0a09] border border-white/[0.03]">
            <span className="text-[10px] text-[#57534e] font-bold w-4">{i+1}</span>
            <span className="text-xs font-semibold flex-1 truncate">{fan.fanName||fan.fanId}</span>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px]">
              <span className="text-[#60a5fa]">Subs: {$(fan.subscriptionEarningNet||0)}</span>
              <span className="text-[#fb923c]">Posts: {$(fan.postsEarningNet||0)}</span>
              <span className="text-[#4ade80]">Msgs: {$(fan.messagesEarningNet||0)}</span>
              <span className="text-[#a78bfa]">Streams: {$(fan.streamsEarningNet||0)}</span>
            </div>
          </div>
        ))}</div>:<div className="text-xs text-[#57534e]">No fan data for this link</div>}
      </div>)}
    </>)}

    {/* ═══ REFUNDS ═══ */}
    {tab==="refunds"&&(<>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <KPI label="Total Refunded" value={$(tRefAmt)} color="#f87171" sub={`${refunds.length} chargebacks`}/>
        <KPI label="Refund Rate" value={refundRate.toFixed(2)+"%" } color={refundRate>5?"#f87171":"#facc15"}/>
        <KPI label="Avg Refund" value={refunds.length>0?$(tRefAmt/refunds.length):"$0"} color="#fb923c"/>
      </div>
      <div className="bg-[#1a1714] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm"><thead><tr className="text-[10px] text-[#57534e] uppercase tracking-wider"><th className="text-left p-3">#</th><th className="text-left p-3">Transaction</th><th className="text-left p-3">Type</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Status</th><th className="text-left p-3">Payment Date</th><th className="text-left p-3">Refund Date</th></tr></thead>
        <tbody>{refunds.length>0?refunds.map((r,i)=>(
          <tr key={r.id} className="border-t border-white/[0.03] hover:bg-white/[0.02]"><td className="p-3 text-[#57534e] font-bold">{i+1}</td><td className="p-3 text-xs font-mono text-[#78716c] truncate max-w-[150px]">{r.transactionId}</td><td className="p-3"><Badge text={r.transactionType||"—"} color={TC[r.transactionType]||"#78716c"}/></td><td className="p-3 text-xs font-bold text-[#f87171]">{$(r.paymentAmount)}</td><td className="p-3"><span className={`text-[10px] font-bold ${r.paymentStatus==="undo"?"text-[#f87171]":"text-[#facc15]"}`}>{r.paymentStatus}</span></td><td className="p-3 text-[10px] text-[#57534e]">{dt(r.paymentTime)}</td><td className="p-3 text-[10px] text-[#57534e]">{dt(r.refundTime)}</td></tr>
        )):<tr><td colSpan={7} className="p-10 text-center text-[#4ade80] text-sm font-semibold">No refunds in this period — nice!</td></tr>}</tbody></table>
      </div>
    </>)}
  </>);
}
