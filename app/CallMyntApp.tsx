'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useCall } from '@/components/CallProvider';
import { SampleModal } from '@/components/modals/SampleModal';
import { OrderModal } from '@/components/modals/OrderModal';
import { supabase } from '@/lib/supabase';

/* ════════════════════════════════════════════════════
   CALLMYNT — Complete Application v4
   Light mode · All sections · All dialer states
   ════════════════════════════════════════════════════ */

const C={bg:"#FFFFFF",sf:"#F7F8FB",rs:"#EFF1F6",hv:"#E6E9F0",ac:"#DDE0E9",bd:"#E2E5ED",bdH:"#CDD1DB",t1:"#1A1D26",t2:"#5C6070",t3:"#9198A8",grn:"#10B981",gD:"#ECFDF5",gB:"#A7F3D0",gT:"#065F46",blu:"#3B82F6",bD:"#EFF6FF",bB:"#BFDBFE",bT:"#1E40AF",amb:"#F59E0B",aD:"#FFFBEB",aB:"#FDE68A",aT:"#92400E",red:"#EF4444",rD:"#FEF2F2",rB:"#FECACA",rT:"#991B1B",pur:"#8B5CF6",pD:"#F5F3FF",pB:"#DDD6FE",pT:"#5B21B6",org:"#F97316",oD:"#FFF7ED",oB:"#FED7AA",oT:"#9A3412",cyn:"#06B6D4"};

const STG: Record<string, {l:string;c:string;bg:string;bd:string;ic:string}> = {
  cold_list:       {l:"Cold list",  c:C.t3, bg:C.rs, bd:C.bd, ic:""},
  buyer_identified:{l:"Buyer ID'd", c:C.bT, bg:C.bD, bd:C.bB, ic:""},
  sending_sample:  {l:"Sent",       c:C.pT, bg:C.pD, bd:C.pB, ic:""},
  sample_follow_up:{l:"Follow up",  c:C.oT, bg:C.oD, bd:C.oB, ic:""},
  first_order:     {l:"Ordered",    c:C.gT, bg:C.gD, bd:C.gB, ic:""},
  reorder:         {l:"Reorder",    c:"#0E7490", bg:"#ECFEFF", bd:"#A5F3FC", ic:""},
};

const SC: Record<string, {t:string;s:string}[]> = {
  cold_gk:[
    {t:"Opening",s:"\"Hi, I'm [name] with BYRDGANG — performance golf polos. Can I speak with whoever handles pro shop merchandise?\""},
    {t:"Get name",s:"\"Could I get their name so I can call back directly?\""},
  ],
  cold_buyer:[
    {t:"Opening",s:"\"Hi [buyer], I'm [name] with BYRDGANG. We wholesale at $25 — pro shops sell at $49–$59 for 100%+ margin.\""},
    {t:"Close",s:"\"I'd love to send a free polo. What size do you wear?\""},
    {t:"Address",s:"\"Perfect — best address? The pro shop directly?\""},
  ],
  followup:[
    {t:"Opening",s:"\"Hey [buyer], it's [name] from BYRDGANG. Did that [color] polo arrive?\""},
    {t:"Close",s:"\"Most shops start with 24–48 units. At $25, 100% margin at $49. Want a starter order?\""},
  ],
};

const DGK = [{l:"Got buyer name",c:C.blu,a:"→ Stage 2"},{l:"Left msg",c:C.amb,a:"Retry 2d"},{l:"No buyer avail",c:C.t3,a:"Retry tmrw"}];
const DBY = [{l:"Sending sample",c:C.grn,a:"→ Ship polo",p:1,cap:1},{l:"Call back",c:C.amb,a:"Schedule"},{l:"Not interested",c:C.red,a:"90d retry"}];
const DFU = [{l:"Placing order!",c:C.grn,a:"→ Create order",p:1},{l:"Needs time",c:C.blu,a:"7d follow-up"},{l:"Not received",c:C.amb,a:"Check tracking"},{l:"Not interested",c:C.red,a:"120d retry"}];
const DSH = [{l:"Left VM",c:C.t3,a:"VM dropped"},{l:"No answer",c:C.t3,a:"Retry"},{l:"Bad #",c:C.red,a:"Remove"}];

// ─── Supabase types ───
interface DbCourse {
  id: string;
  name: string;
  course_type?: string;
  city?: string;
  state?: string;
  main_phone?: string;
  pro_shop_phone?: string;
  buyer_name?: string;
  buyer_title?: string;
  buyer_direct_phone?: string;
  buyer_email?: string;
  buyer_size?: string;
  pipeline_stage?: string;
  total_attempts?: number;
  ivr_pro_shop_key?: string;
  ivr_direct_extension?: string;
  ivr_notes?: string;
}

interface DbCampaign {
  id: string;
  name: string;
  pipeline_stage?: string;
  dialer_mode?: string;
  course_count?: number;
}

interface DbSample {
  id: string;
  course_name?: string;
  buyer_name?: string;
  size?: string;
  color?: string;
  status?: string;
  shipped_at?: string;
  delivered_at?: string;
  agent_name?: string;
  follow_up_at?: string;
  order_amount?: number;
}

interface DbOrder {
  id: string;
  course_name?: string;
  buyer_name?: string;
  created_at?: string;
  items_summary?: string;
  total?: number;
  payment_status?: string;
  fulfillment_status?: string;
  agent_name?: string;
}

interface DbCall {
  id: string;
  course_id?: string;
  spoke_to?: string;
  disposition?: string;
  notes?: string;
  created_at?: string;
  duration_seconds?: number;
  recording_url?: string;
  course_name?: string;
  buyer_name?: string;
  agent_name?: string;
  score?: number;
}

// ─── Local component interfaces ───
interface CourseRow {
  id: string;
  n: string;
  t: string;
  ci: string;
  st: string;
  ph: string;
  pp: string;
  b: string;
  bt: string;
  bp: string;
  be: string;
  bs: string;
  sg: string;
  att: number;
  sam?: {s:string;sz?:string;co?:string;sh?:string;de?:string};
  ord?: {d:string;u:number;t:string}[];
  qs?: string;
  ct?: string;
  ivrKey?: string;
  ivrExt?: string;
  ivrNotes?: string;
}

interface CampaignRow {
  id: string;
  n: string;
  sg: string;
  ct: number;
  m: string;
}

interface HistItem {d:string;w:string;o:string;n?:string}
interface RecItem {id:string;co:string;b?:string;ag:string;dt:string;dur:string;dp:string;sc?:number;sp?:string|null}
interface TranscriptItem {t:string;sp:string;tx:string}
interface SampItem {id:string;co:string;b:string;sz:string;cl:string;s:string;sh:string;de?:string;ag:string;fu?:string|null;done:boolean;amt?:string}
interface OrdItem {id:string;co:string;b:string;dt:string;items:string;tot:string;pay:string;ful:string;ag:string}
interface NotifItem {t:string;s:string;tm:string;tp:string}

const PRODS=[
  {id:"p1",n:"Performance Polo",   colors:["Navy","Charcoal","Forest","Black","White"],price:25},
  {id:"p2",n:"Quarter Zip Pullover",colors:["Navy","Charcoal","Black","Heather Grey"],price:35},
  {id:"p3",n:"Dry-Fit Polo",        colors:["Navy","White","Forest","Royal Blue"],price:25},
  {id:"p4",n:"Lightweight Vest",    colors:["Black","Navy","Charcoal"],price:40},
  {id:"p5",n:"Performance Hoodie",  colors:["Black","Navy","Charcoal","Forest"],price:45},
  {id:"p6",n:"Classic Polo",        colors:["Navy","White","Black","Charcoal","Red","Royal Blue"],price:22},
  {id:"p7",n:"Moisture-Wick Tee",   colors:["White","Black","Navy","Heather Grey"],price:18},
  {id:"p8",n:"Wind Jacket",         colors:["Black","Navy"],price:50},
];

const NOTIFS:NotifItem[]=[
  {t:"Sample delivered",s:"Follow up pending",tm:"2h ago",tp:"sample"},
  {t:"Coaching report",s:"Weekly coaching notes available",tm:"1d ago",tp:"coach"},
];

// ═══ SHARED COMPONENTS ═══
function I({children,s=20,k=C.t2,w=2}:{children:React.ReactNode;s?:number;k?:string;w?:number}){
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={k} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}
function Pl({sg}:{sg:string}){const m=STG[sg]||STG.cold_list;return <span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:999,background:m.bg,color:m.c,border:`1px solid ${m.bd}`,whiteSpace:"nowrap"}}>{m.l}</span>}
function M({children,c,s=13}:{children:React.ReactNode;c?:string;s?:number}){return <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:s,fontWeight:600,color:c||C.t1}}>{children}</span>}
function Rw({l,v,c,last}:{l:string;v:React.ReactNode;c?:string|null;last?:boolean}){return <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:last?"none":`1px solid ${C.rs}`,fontSize:14}}><span style={{color:C.t3}}>{l}</span><span style={{fontWeight:500,color:c||C.t1}}>{v}</span></div>}
function Cd({children,s={},onClick}:{children:React.ReactNode;s?:React.CSSProperties;onClick?:()=>void}){return <div onClick={onClick} style={{background:C.bg,border:`1px solid ${C.bd}`,borderRadius:14,padding:"16px 18px",...s}}>{children}</div>}
function Lb({children,r}:{children:React.ReactNode;r?:React.ReactNode}){return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:12,fontWeight:600,color:C.t3,textTransform:"uppercase",letterSpacing:"0.5px"}}>{children}</span>{r&&<span style={{fontSize:12,color:C.t3}}>{r}</span>}</div>}
function Btn({children,primary,danger,onClick,full}:{children:React.ReactNode;primary?:boolean;danger?:boolean;onClick?:()=>void;full?:boolean}){return <button onClick={onClick} style={{padding:primary?"14px 24px":"10px 18px",borderRadius:12,border:primary||danger?"none":`1.5px solid ${C.bd}`,background:danger?C.red:primary?C.grn:C.bg,color:danger||primary?"white":C.t1,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",width:full?"100%":"auto",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{children}</button>}
function CB({children,label,big,danger,active,onClick}:{children:React.ReactNode;label?:string;big?:boolean;danger?:boolean;active?:boolean;onClick?:()=>void}){return <button onClick={onClick} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer"}}><div style={{width:big?68:52,height:big?68:52,borderRadius:"50%",background:danger?C.red:active?C.bD:C.sf,border:`1.5px solid ${danger?C.red:active?C.bB:C.bd}`,display:"flex",alignItems:"center",justifyContent:"center",color:danger?"white":active?C.blu:C.t2}}>{children}</div>{label&&<span style={{fontSize:11,color:danger?C.red:C.t3,fontWeight:500}}>{label}</span>}</button>}
function Tab({tabs,active,onChange}:{tabs:string[];active:string;onChange:(t:string)=>void}){return <div style={{display:"flex",gap:0,borderBottom:`1px solid ${C.bd}`,marginBottom:16}}>{tabs.map(t=><button key={t} onClick={()=>onChange(t)} style={{padding:"10px 20px",fontSize:13,fontWeight:600,border:"none",borderBottom:active===t?`2px solid ${C.grn}`:"2px solid transparent",color:active===t?C.grn:C.t3,background:"transparent",cursor:"pointer"}}>{t}</button>)}</div>}
function Stat({label,value,color}:{label:string;value:string|number;color?:string}){return <div style={{background:C.bg,borderRadius:14,border:`1px solid ${C.bd}`,padding:"18px 20px"}}><div style={{fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}}>{label}</div><M s={26} c={color}>{value}</M></div>}

// ═══ MARGIN CALCULATOR ═══
function MCalc(){
  const[r,setR]=useState(49);const[q,setQ]=useState(24);const mg=r-25;
  return <div style={{background:C.gD,border:`1px solid ${C.gB}`,borderRadius:14,padding:"16px 18px"}}>
    <div style={{fontSize:12,fontWeight:700,color:C.gT,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Margin calculator</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 14px",fontSize:14}}>
      <span style={{color:C.t3}}>Wholesale</span><M>$25</M>
      <span style={{color:C.t3}}>Sell at</span>
      <div style={{display:"flex",gap:4,alignItems:"center"}}><span style={{color:C.t3}}>$</span><input type="number" value={r} onChange={e=>setR(+e.target.value||0)} style={{width:52,padding:"5px 6px",background:C.bg,border:`1.5px solid ${C.gB}`,borderRadius:8,color:C.gT,fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:700,textAlign:"center"}}/></div>
      <span style={{color:C.t3}}>Margin</span><M c={C.grn}>${mg} ({Math.round((mg/25)*100)}%)</M>
      <span style={{color:C.t3}}>Qty</span>
      <div style={{display:"flex",gap:4,alignItems:"center"}}><input type="number" value={q} onChange={e=>setQ(+e.target.value||0)} style={{width:48,padding:"5px",background:C.bg,border:`1.5px solid ${C.gB}`,borderRadius:8,color:C.t1,fontFamily:"'JetBrains Mono',monospace",fontSize:15,textAlign:"center"}}/><span style={{color:C.t3,fontSize:12}}>units</span></div>
      <span style={{color:C.gT,fontWeight:600}}>Profit</span><M c={C.grn} s={16}>${(q*mg).toLocaleString()}</M>
    </div>
  </div>;
}

// ═══ SEARCH MODAL ═══
function SearchMod({onClose,courses}:{onClose:()=>void;courses:CourseRow[]}){
  const[q,setQ]=useState("");
  const results=q.length>1?courses.filter(c=>c.n.toLowerCase().includes(q.toLowerCase())||(c.b||"").toLowerCase().includes(q.toLowerCase())):[];
  return <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:80}}>
    <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.2)"}}/>
    <div style={{position:"relative",background:C.bg,borderRadius:16,width:560,maxWidth:"92vw",boxShadow:"0 20px 60px rgba(0,0,0,0.15)",overflow:"hidden"}}>
      <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.bd}`}}>
        <input autoFocus type="text" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search courses, buyers, calls..." style={{width:"100%",padding:"12px 16px",borderRadius:12,border:`1.5px solid ${C.bd}`,background:C.sf,fontSize:16,fontFamily:"'DM Sans',sans-serif",color:C.t1,outline:"none"}}/>
      </div>
      <div style={{maxHeight:400,overflowY:"auto"}}>
        {q.length<2?<div style={{padding:32,textAlign:"center",color:C.t3}}>Type to search across courses, buyers, and calls</div>
        :results.length===0?<div style={{padding:32,textAlign:"center",color:C.t3}}>No results for &quot;{q}&quot;</div>
        :<div>{results.map(c=><div key={c.id} onClick={onClose} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 20px",borderBottom:`1px solid ${C.rs}`,cursor:"pointer"}}>
          <div style={{width:36,height:36,borderRadius:10,background:STG[c.sg]?.bg||C.sf,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}></div>
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{c.n}</div><div style={{fontSize:12,color:C.t3}}>{c.b||"No buyer"} · {c.ci}, {c.st}</div></div>
          <Pl sg={c.sg}/>
        </div>)}</div>}
      </div>
    </div>
  </div>;
}

// ═══ NOTIFICATIONS ═══
function NotifDrop({onClose}:{onClose:()=>void}){
  return <div style={{position:"absolute",top:52,right:16,width:380,background:C.bg,borderRadius:16,border:`1px solid ${C.bd}`,boxShadow:"0 12px 40px rgba(0,0,0,0.1)",zIndex:200,overflow:"hidden"}}>
    <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between"}}>
      <span style={{fontSize:14,fontWeight:600}}>Notifications</span>
      <button onClick={onClose} style={{fontSize:12,color:C.blu,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Mark all read</button>
    </div>
    <div style={{maxHeight:380,overflowY:"auto"}}>
      {NOTIFS.map((n,i)=><div key={i} style={{padding:"14px 18px",borderBottom:`1px solid ${C.rs}`,cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:600}}>{n.t}</span><span style={{fontSize:11,color:C.t3}}>{n.tm}</span></div>
        <div style={{fontSize:13,color:C.t2}}>{n.s}</div>
      </div>)}
    </div>
  </div>;
}

// ═══════════════════════════════════════
//  DATA HOOKS
// ═══════════════════════════════════════
function useCourses(){
  const[courses,setCourses]=useState<CourseRow[]>([]);
  const[loading,setLoading]=useState(true);
  useEffect(()=>{
    supabase.from("courses").select("*").order("name").limit(500).then(({data})=>{
      if(data) setCourses((data as DbCourse[]).map(d=>({
        id:d.id,n:d.name||"",t:d.course_type||"",ci:d.city||"",st:d.state||"",
        ph:d.main_phone||"",pp:d.pro_shop_phone||"",b:d.buyer_name||"",
        bt:d.buyer_title||"",bp:d.buyer_direct_phone||"",be:d.buyer_email||"",
        bs:d.buyer_size||"",sg:d.pipeline_stage||"cold_list",att:d.total_attempts||0,
        ivrKey:d.ivr_pro_shop_key,ivrExt:d.ivr_direct_extension,ivrNotes:d.ivr_notes,
      })));
      setLoading(false);
    });
  },[]);
  return {courses,loading};
}

function useCampaigns(){
  const[campaigns,setCampaigns]=useState<CampaignRow[]>([]);
  useEffect(()=>{
    supabase.from("campaigns").select("*,campaign_queue(count)").order("created_at",{ascending:false}).then(({data})=>{
      if(data) setCampaigns((data as (DbCampaign&{campaign_queue?:{count:number}[]})[]). map(d=>({
        id:d.id,n:d.name||"",sg:d.pipeline_stage||"cold_list",
        ct:d.campaign_queue?.[0]?.count||d.course_count||0,
        m:d.dialer_mode||"power",
      })));
    });
  },[]);
  return {campaigns};
}

function useSamples(){
  const[samples,setSamples]=useState<SampItem[]>([]);
  useEffect(()=>{
    supabase.from("samples").select("*").order("created_at",{ascending:false}).then(({data})=>{
      if(data) setSamples((data as DbSample[]).map(d=>({
        id:d.id,co:d.course_name||"",b:d.buyer_name||"",sz:d.size||"",cl:d.color||"",
        s:d.status||"in_transit",
        sh:d.shipped_at?new Date(d.shipped_at).toLocaleDateString("en-US",{month:"short",day:"numeric"}):"",
        de:d.delivered_at?new Date(d.delivered_at).toLocaleDateString("en-US",{month:"short",day:"numeric"}):undefined,
        ag:d.agent_name||"",
        fu:d.follow_up_at?new Date(d.follow_up_at).toLocaleDateString("en-US",{month:"short",day:"numeric"}):null,
        done:d.status==="converted",
        amt:d.order_amount?`$${d.order_amount}`:undefined,
      })));
    });
  },[]);
  return {samples};
}

function useOrders(){
  const[orders,setOrders]=useState<OrdItem[]>([]);
  useEffect(()=>{
    supabase.from("orders").select("*").order("created_at",{ascending:false}).then(({data})=>{
      if(data) setOrders((data as DbOrder[]).map(d=>({
        id:d.id,co:d.course_name||"",b:d.buyer_name||"",
        dt:d.created_at?new Date(d.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"}):"",
        items:d.items_summary||"",tot:d.total?`$${d.total}`:"",
        pay:d.payment_status||"Pending",ful:d.fulfillment_status||"Processing",ag:d.agent_name||"",
      })));
    });
  },[]);
  return {orders};
}

function useCallHistory(courseId?:string){
  const[history,setHistory]=useState<HistItem[]>([]);
  useEffect(()=>{
    if(!courseId)return;
    supabase.from("calls").select("*").eq("course_id",courseId).order("created_at",{ascending:false}).limit(10).then(({data})=>{
      if(data) setHistory((data as DbCall[]).map(d=>({
        d:d.created_at?new Date(d.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"}):"",
        w:d.spoke_to||"Unknown",o:d.disposition||"No disposition",n:d.notes||undefined,
      })));
    });
  },[courseId]);
  return {history};
}

function useRecordings(){
  const[recs,setRecs]=useState<RecItem[]>([]);
  useEffect(()=>{
    supabase.from("calls").select("*").not("recording_url","is",null).order("created_at",{ascending:false}).limit(50).then(({data})=>{
      if(data) setRecs((data as DbCall[]).map(d=>({
        id:d.id,co:d.course_name||"Unknown",b:d.buyer_name||"",ag:d.agent_name||"Agent",
        dt:d.created_at?new Date(d.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"}):"",
        dur:d.duration_seconds?`${Math.floor(d.duration_seconds/60)}:${String(d.duration_seconds%60).padStart(2,"0")}`:"0:00",
        dp:d.disposition||"",sc:d.score,sp:d.spoke_to||null,
      })));
    });
  },[]);
  return {recs};
}

function useStats(){
  const[stats,setStats]=useState({dials:0,connects:0,samples:0,orders:0});
  useEffect(()=>{
    Promise.all([
      supabase.from("calls").select("*",{count:"exact",head:true}),
      supabase.from("calls").select("*",{count:"exact",head:true}).not("disposition","is",null),
      supabase.from("samples").select("*",{count:"exact",head:true}),
      supabase.from("orders").select("*",{count:"exact",head:true}),
    ]).then(([d,c,s,o])=>{
      setStats({dials:d.count||0,connects:c.count||0,samples:s.count||0,orders:o.count||0});
    });
  },[]);
  return stats;
}

// ═══════════════════════════════════════
//  PAGES
// ═══════════════════════════════════════

// ── COURSES ──
function CoursesP({onSelect}:{onSelect:(c:CourseRow)=>void}){
  const {courses}=useCourses();
  const[f,setF]=useState("all");const[s,setS]=useState("");const[fSt,setFSt]=useState("all");const[fTy,setFTy]=useState("all");const[fBu,setFBu]=useState("all");const[fSam,setFSam]=useState("all");const[fAtt,setFAtt]=useState("all");
  const cts=Object.fromEntries(Object.keys(STG).map(k=>[k,courses.filter(c=>c.sg===k).length]));
  const fl=courses.filter(c=>(f==="all"||c.sg===f)&&(fSt==="all"||c.st===fSt)&&(fTy==="all"||c.t===fTy)&&(fBu==="all"||(fBu==="yes"?c.b:!c.b))&&(fAtt==="all"||(fAtt==="0"?c.att===0:fAtt==="1-3"?c.att>=1&&c.att<=3:fAtt==="4+"?c.att>=4:true))&&(c.n.toLowerCase().includes(s.toLowerCase())||(c.b||"").toLowerCase().includes(s.toLowerCase())||(c.ci||"").toLowerCase().includes(s.toLowerCase())));
  const activeFilters=[fSt,fTy,fBu,fSam,fAtt].filter(x=>x!=="all").length;
  const clearAll=()=>{setF("all");setFSt("all");setFTy("all");setFBu("all");setFSam("all");setFAtt("all");setS("")};
  const states=[...new Set(courses.map(c=>c.st))].sort();
  const types=[...new Set(courses.map(c=>c.t))].sort();
  const Sel=({value,onChange,children,active}:{value:string;onChange:(v:string)=>void;children:React.ReactNode;active?:boolean})=><select value={value} onChange={e=>onChange(e.target.value)} style={{padding:"7px 10px",borderRadius:8,border:`1.5px solid ${active?C.bB:C.bd}`,fontSize:12,color:active?C.bT:C.t2,background:active?C.bD:C.bg,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>{children}</select>;
  return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div><div style={{fontSize:22,fontWeight:700}}>Golf courses</div><div style={{fontSize:14,color:C.t2,marginTop:2}}><M s={14} c={C.t1}>{fl.length}</M> of {courses.length} courses{activeFilters>0&&<span style={{color:C.blu,marginLeft:6}}>· {activeFilters} filter{activeFilters>1?"s":""} active</span>}</div></div>
      <input type="text" placeholder="Search name, buyer, city..." value={s} onChange={e=>setS(e.target.value)} style={{padding:"10px 16px",borderRadius:12,border:`1.5px solid ${C.bd}`,background:C.bg,color:C.t1,fontSize:14,fontFamily:"'DM Sans',sans-serif",width:260,outline:"none"}}/>
    </div>
    <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
      <button onClick={()=>setF("all")} style={{padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:600,border:`1.5px solid ${f==="all"?C.gB:C.bd}`,background:f==="all"?C.gD:C.bg,color:f==="all"?C.gT:C.t2,cursor:"pointer"}}>All ({courses.length})</button>
      {Object.entries(STG).map(([k,v])=><button key={k} onClick={()=>setF(k)} style={{padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:600,border:`1.5px solid ${f===k?v.bd:C.bd}`,background:f===k?v.bg:C.bg,color:f===k?v.c:C.t2,cursor:"pointer"}}>{v.l} ({cts[k]||0})</button>)}
      <div style={{width:1,height:24,background:C.bd,margin:"0 4px"}}/>
      <Sel value={fSt} onChange={setFSt} active={fSt!=="all"}><option value="all">All states</option>{states.map(st=><option key={st} value={st}>{st}</option>)}</Sel>
      <Sel value={fTy} onChange={setFTy} active={fTy!=="all"}><option value="all">All types</option>{types.map(t=><option key={t} value={t}>{t}</option>)}</Sel>
      <Sel value={fBu} onChange={setFBu} active={fBu!=="all"}><option value="all">Buyer: any</option><option value="yes">Has buyer</option><option value="no">No buyer</option></Sel>
      <Sel value={fAtt} onChange={setFAtt} active={fAtt!=="all"}><option value="all">Attempts: any</option><option value="0">Never contacted</option><option value="1-3">1-3 attempts</option><option value="4+">4+ attempts</option></Sel>
      {activeFilters>0&&<button onClick={clearAll} style={{padding:"7px 12px",borderRadius:8,border:"none",background:"transparent",color:C.red,fontSize:12,fontWeight:600,cursor:"pointer"}}>Clear</button>}
    </div>
    <Cd s={{padding:0,overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"2.5fr 1fr 1fr 1.2fr 1fr 70px",padding:"12px 20px",borderBottom:`1px solid ${C.bd}`,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:600,background:C.sf}}>
        <span>Course</span><span>Stage</span><span>Type</span><span>Buyer</span><span>Sample</span><span>Calls</span>
      </div>
      {fl.length===0?<div style={{padding:40,textAlign:"center",color:C.t3}}>No courses match your filters. <button onClick={clearAll} style={{color:C.blu,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Clear filters</button></div>
      :fl.map(c=><div key={c.id} onClick={()=>onSelect(c)} style={{display:"grid",gridTemplateColumns:"2.5fr 1fr 1fr 1.2fr 1fr 70px",padding:"14px 20px",borderBottom:`1px solid ${C.rs}`,alignItems:"center",fontSize:14,cursor:"pointer"}}>
        <div><div style={{fontWeight:600}}>{c.n}</div><div style={{fontSize:12,color:C.t3}}>{c.ci}, {c.st}{c.ph?` · ${c.ph}`:""}</div></div>
        <Pl sg={c.sg}/>
        <span style={{fontSize:13,color:C.t2}}>{c.t}</span>
        <span style={{color:c.b?C.t1:C.t3}}>{c.b||"—"}</span>
        <span style={{fontSize:12,fontWeight:500,color:c.sam?c.sam.s==="delivered"?C.oT:c.sam.s==="in_transit"?C.pT:c.sam.s==="converted"?C.gT:C.t3:C.t3}}>{c.sam?c.sam.s==="delivered"?"Delivered":c.sam.s==="in_transit"?"Transit":"Converted":"—"}</span>
        <M s={13} c={C.t2}>{c.att}</M>
      </div>)}
    </Cd>
  </div>;
}

// ── COURSE DETAIL ──
function CourseDetail({course:c,onBack}:{course:CourseRow;onBack:()=>void}){
  const[tab,setTab]=useState("Overview");
  const[ordering,setOrdering]=useState(false);
  const[prodSearch,setProdSearch]=useState("");
  const[cart,setCart]=useState<{key:string;prod:typeof PRODS[0];color:string;sizes:Record<string,number>}[]>([]);
  const[payTerms,setPayTerms]=useState("net30");
  const{history}=useCallHistory(c.id);
  const sizes=["S","M","L","XL","XXL","2XL","3XL"];
  const addToCart=(prod:typeof PRODS[0],color:string)=>{const key=`${prod.id}-${color}`;if(!cart.find(i=>i.key===key))setCart([...cart,{key,prod,color,sizes:Object.fromEntries(sizes.map(s=>[s,0]))}])};
  const updateQty=(key:string,size:string,val:number)=>setCart(cart.map(i=>i.key===key?{...i,sizes:{...i.sizes,[size]:Math.max(0,val)}}:i));
  const removeItem=(key:string)=>setCart(cart.filter(i=>i.key!==key));
  const cartUnits=cart.reduce((t,i)=>t+Object.values(i.sizes).reduce((a,b)=>a+b,0),0);
  const cartTotal=cart.reduce((t,i)=>t+Object.values(i.sizes).reduce((a,b)=>a+b,0)*i.prod.price,0);
  const filteredProds=PRODS.filter(p=>p.n.toLowerCase().includes(prodSearch.toLowerCase()));

  return <div className="sb" style={{height:"100%",overflowY:"auto"}}>
    <div style={{padding:"20px 28px",borderBottom:`1px solid ${C.bd}`,background:C.sf}}>
      <button onClick={onBack} style={{fontSize:13,color:C.blu,background:"none",border:"none",cursor:"pointer",marginBottom:12,fontWeight:600}}>← Back to courses</button>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:24,fontWeight:700}}>{c.n}</span><Pl sg={c.sg}/></div>
          <div style={{fontSize:15,color:C.t2,marginTop:4}}>{c.t} · {c.ci}, {c.st}{c.ph?` · ${c.ph}`:""}</div>
        </div>
        <div style={{display:"flex",gap:8}}><Btn primary>Call now</Btn><Btn>Send SMS</Btn><Btn>Edit</Btn></div>
      </div>
    </div>
    <div style={{padding:"0 28px 28px"}}>
      <Tab tabs={["Overview","Activity","Calls","Samples","Orders","AI"]} active={tab} onChange={setTab}/>
      {tab==="Overview"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <Cd><Lb>Course info</Lb>{[["Name",c.n],["Type",c.t],["City",`${c.ci}, ${c.st}`],["Phone",c.ph||"—"],["Pro shop",c.pp||"—"]].map(([l,v],i,a)=><Rw key={l as string} l={l as string} v={v as string} c={l.includes("hone")?C.blu:null} last={i===a.length-1}/>)}</Cd>
        <Cd><Lb>{c.b?"Buyer":"Buyer — unknown"}</Lb>{c.b?[["Name",c.b],["Title",c.bt||"—"],["Direct",c.bp||"—"],["Email",c.be||"—"],["Size",c.bs||"—"]].map(([l,v],i,a)=><Rw key={l as string} l={l as string} v={v as string} c={l==="Email"&&v!=="—"?C.blu:l==="Size"&&v!=="—"?C.grn:null} last={i===a.length-1}/>):<div style={{fontSize:14,color:C.t3,fontStyle:"italic"}}>No buyer identified yet. Ask the gatekeeper for the merchandise buyer&apos;s name.</div>}</Cd>
        {c.sam&&<Cd s={{gridColumn:"1/-1",background:c.sam.s==="delivered"?C.oD:c.sam.s==="in_transit"?C.pD:C.gD,border:`1px solid ${c.sam.s==="delivered"?C.oB:c.sam.s==="in_transit"?C.pB:C.gB}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontWeight:700,fontSize:15,color:c.sam.s==="delivered"?C.oT:c.sam.s==="in_transit"?C.pT:C.gT}}>{c.sam.s==="delivered"?"Sample delivered":c.sam.s==="in_transit"?"In transit":"Converted to order"}</div>
              <div style={{fontSize:14,color:C.t2,marginTop:4}}>{c.sam.co||""} {c.sam.sz||""} · Shipped {c.sam.sh||"—"}{c.sam.de?` · Delivered ${c.sam.de}`:""}</div>
            </div>
            {c.sam.s==="delivered"&&<Btn primary>Schedule follow-up</Btn>}
          </div>
        </Cd>}
        <Cd s={{gridColumn:"1/-1"}}><Lb>Pipeline timeline</Lb>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>{Object.entries(STG).map(([k,v])=>{const active=k===c.sg;const passed=Object.keys(STG).indexOf(k)<Object.keys(STG).indexOf(c.sg);return <div key={k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}><div style={{width:"100%",height:6,borderRadius:3,background:passed?C.grn:active?C.blu:C.rs}}/><span style={{fontSize:11,fontWeight:600,color:active?C.bT:passed?C.gT:C.t3}}>{v.l}</span></div>})}</div>
        </Cd>
      </div>}
      {tab==="Activity"&&<div style={{maxWidth:640}}><Lb>All activity</Lb>{history.map((h,i)=><div key={i} style={{display:"flex",gap:14,padding:"16px 0",borderBottom:`1px solid ${C.rs}`}}>
        <div style={{width:36,height:36,borderRadius:10,background:h.w==="gatekeeper"?C.aD:h.w==="voicemail"?C.pD:C.bD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}></div>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600,fontSize:14}}>{h.o}</span><span style={{fontSize:12,color:C.t3}}>{h.d}</span></div>
          <div style={{fontSize:13,color:C.t2,marginTop:2}}>Spoke to: {h.w}</div>
          {h.n&&<div style={{fontSize:13,color:C.t3,fontStyle:"italic",marginTop:4}}>{h.n}</div>}
        </div>
      </div>)}</div>}
      {tab==="Calls"&&<div><Lb r={`${c.att} total`}>Call recordings</Lb>{history.map((h,i)=><Cd key={i} s={{marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div><span style={{fontWeight:600}}>{h.o}</span><span style={{color:C.t3,marginLeft:8}}>{h.w}</span></div><span style={{color:C.t3,fontSize:13}}>{h.d}</span></div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}><div style={{flex:1,height:32,background:C.sf,borderRadius:8,display:"flex",alignItems:"center",padding:"0 12px"}}><div style={{display:"flex",gap:2,alignItems:"center"}}>{[12,18,8,22,14,20,10,16,24,12,18,14,20,8,16].map((h2,j)=><div key={j} style={{width:3,height:h2,background:C.blu,borderRadius:2,opacity:0.5}}/>)}</div></div><button style={{padding:"8px 14px",borderRadius:8,border:`1px solid ${C.bd}`,background:C.bg,fontSize:12,fontWeight:600,cursor:"pointer",color:C.t1}}>Play</button></div>
      </Cd>)}</div>}
      {tab==="Samples"&&<div>{c.sam?<Cd>
        <div style={{fontWeight:600,fontSize:15,marginBottom:12}}>Sample</div>
        <Rw l="Status" v={c.sam.s==="delivered"?"Delivered":c.sam.s==="in_transit"?"In transit":"Converted"} c={c.sam.s==="delivered"?C.oT:c.sam.s==="in_transit"?C.pT:C.gT}/>
        <Rw l="Size / Color" v={`${c.sam.sz||"—"} / ${c.sam.co||"—"}`}/>
        <Rw l="Shipped" v={c.sam.sh||"—"}/>
        <Rw l="Delivered" v={c.sam.de||"—"} last/>
      </Cd>:<div style={{padding:40,textAlign:"center",color:C.t3}}>No samples sent to this course yet</div>}</div>}
      {tab==="Orders"&&<div>
        {!ordering?<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <Lb>Order history</Lb>
            <Btn primary onClick={()=>setOrdering(true)}>+ Create wholesale order</Btn>
          </div>
          {c.ord?c.ord.map((o,i)=><Cd key={i} s={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between"}}><div><span style={{fontWeight:600,fontSize:15}}>{o.u} units</span><span style={{color:C.t3,marginLeft:8}}>{o.d}</span></div><M s={16} c={C.grn}>{o.t}</M></div></Cd>):<div style={{padding:40,textAlign:"center",color:C.t3}}>No orders yet. Create the first wholesale order for {c.n}.</div>}
        </>:<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div><div style={{fontSize:18,fontWeight:700}}>New order for {c.b||c.n}</div><div style={{fontSize:13,color:C.t2,marginTop:2}}>Browse the catalog, add items, set quantities per size</div></div>
            <button onClick={()=>{setOrdering(false);setCart([])}} style={{fontSize:13,color:C.red,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Cancel order</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:20}}>
            <div>
              <input value={prodSearch} onChange={e=>setProdSearch(e.target.value)} placeholder="Search designs..." style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${C.bd}`,fontSize:14,fontFamily:"'DM Sans',sans-serif",color:C.t1,marginBottom:12}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {filteredProds.map(p=><Cd key={p.id} s={{cursor:"pointer"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div><div style={{fontSize:14,fontWeight:600}}>{p.n}</div><M s={13} c={C.grn}>${p.price}/unit</M></div>
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{p.colors.map(cl=>{const inCart=!!cart.find(i=>i.key===`${p.id}-${cl}`);return <button key={cl} onClick={()=>addToCart(p,cl)} style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:500,border:`1.5px solid ${inCart?C.gB:C.bd}`,background:inCart?C.gD:C.sf,color:inCart?C.gT:C.t2,cursor:"pointer"}}>{inCart?"✓ ":""}{cl}</button>})}</div>
                </Cd>)}
              </div>
            </div>
            <div style={{position:"sticky",top:0,alignSelf:"start"}}>
              <Cd s={{background:C.sf}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><span style={{fontSize:16,fontWeight:700}}>Order summary</span><span style={{fontSize:13,color:C.t2}}>{cart.length} item{cart.length!==1?"s":""}</span></div>
                {cart.length===0?<div style={{padding:"24px 0",textAlign:"center",color:C.t3,fontSize:14}}>Click a color on any design to add it</div>:<>
                  <div style={{display:"flex",flexDirection:"column",gap:12,maxHeight:400,overflowY:"auto",marginBottom:16}}>
                    {cart.map(item=>{const itemUnits=Object.values(item.sizes).reduce((a,b)=>a+b,0);return <div key={item.key} style={{background:C.bg,borderRadius:12,border:`1px solid ${C.bd}`,padding:"12px 14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div><span style={{fontWeight:600,fontSize:13}}>{item.prod.n}</span><span style={{color:C.t3,fontSize:12,marginLeft:6}}>— {item.color}</span></div><button onClick={()=>removeItem(item.key)} style={{color:C.red,background:"none",border:"none",cursor:"pointer",fontSize:12}}>Remove</button></div>
                      <div style={{display:"grid",gridTemplateColumns:`repeat(${sizes.length},1fr)`,gap:4}}>
                        {sizes.map(s=><div key={s} style={{textAlign:"center"}}>
                          <div style={{fontSize:10,color:C.t3,marginBottom:3}}>{s}</div>
                          <input type="number" value={item.sizes[s]} onChange={e=>updateQty(item.key,s,+e.target.value||0)} style={{width:"100%",padding:"6px 2px",borderRadius:6,border:`1px solid ${C.bd}`,fontSize:13,fontFamily:"'JetBrains Mono',monospace",textAlign:"center",color:C.t1,background:item.sizes[s]>0?C.gD:C.bg}}/>
                        </div>)}
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:12,color:C.t3}}><span>{itemUnits} units</span><M s={12} c={C.t1}>${(itemUnits*item.prod.price).toLocaleString()}</M></div>
                    </div>})}
                  </div>
                  <div style={{borderTop:`2px solid ${C.bd}`,paddingTop:14,marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:14,color:C.t2}}>Total units</span><M s={16}>{cartUnits}</M></div>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16,fontWeight:700}}>Order total</span><M s={22} c={C.grn}>${cartTotal.toLocaleString()}</M></div>
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:C.t2,marginBottom:8}}>Payment terms</div>
                  <div style={{display:"flex",gap:6,marginBottom:16}}>{[["net30","Net 30"],["card","Credit card"],["now","Pay now"]].map(([id,lb])=><button key={id} onClick={()=>setPayTerms(id)} style={{flex:1,padding:"10px",borderRadius:10,border:`1.5px solid ${payTerms===id?C.bB:C.bd}`,background:payTerms===id?C.bD:C.bg,color:payTerms===id?C.bT:C.t2,fontSize:12,fontWeight:600,cursor:"pointer"}}>{lb}</button>)}</div>
                  <Btn primary full onClick={()=>{setOrdering(false);setCart([])}}>Create Shopify order — ${cartTotal.toLocaleString()}</Btn>
                </>}
              </Cd>
            </div>
          </div>
        </div>}
      </div>}
      {tab==="AI"&&<Cd><Lb>AI course analysis</Lb>{[["Likelihood to convert","High",C.grn],["Best time to call","Tues/Wed before 9am",C.amb],["Recommended approach","Lead with SunRun social proof",C.blu],["Buyer persona","Detail-oriented, wants quality proof",C.t1],["Objection risk","May ask about minimums",C.pur]].map(([l,v,c2],i,a)=><Rw key={l as string} l={l as string} v={v as string} c={c2 as string} last={i===a.length-1}/>)}</Cd>}
    </div>
  </div>;
}

// ── CAMPAIGNS ──
function CampaignsP(){
  const {campaigns}=useCampaigns();
  const[sel,setSel]=useState<CampaignRow|null>(null);const[creating,setCreating]=useState(false);const[step,setStep]=useState(1);const[cName,setCName]=useState("");const[cStage,setCStage]=useState("cold_list");const[cMode,setCMode]=useState("power");const[addLeads,setAddLeads]=useState(false);

  if(addLeads)return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}>
    <button onClick={()=>setAddLeads(false)} style={{fontSize:13,color:C.blu,background:"none",border:"none",cursor:"pointer",marginBottom:16,fontWeight:600}}>← Back to campaign</button>
    <div style={{fontSize:22,fontWeight:700,marginBottom:4}}>Add courses to campaign</div>
    <div style={{fontSize:14,color:C.t2,marginBottom:20}}>Filter your course database to find leads to add.</div>
  </div>;

  if(creating)return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}>
    <button onClick={()=>{setCreating(false);setStep(1)}} style={{fontSize:13,color:C.blu,background:"none",border:"none",cursor:"pointer",marginBottom:16,fontWeight:600}}>← Back to campaigns</button>
    <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24}}>{[1,2,3].map(s=><div key={s} style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:28,height:28,borderRadius:"50%",background:step>=s?C.grn:C.rs,color:step>=s?"white":C.t3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600}}>{s}</div><span style={{fontSize:13,fontWeight:600,color:step>=s?C.t1:C.t3}}>{s===1?"Setup":s===2?"Add courses":"Review"}</span>{s<3&&<div style={{width:40,height:2,background:step>s?C.grn:C.rs,borderRadius:1}}/>}</div>)}</div>
    {step===1&&<div style={{maxWidth:500,display:"flex",flexDirection:"column",gap:16}}>
      <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Campaign setup</div>
      <div><div style={{fontSize:13,fontWeight:600,color:C.t2,marginBottom:6}}>Campaign name</div><input value={cName} onChange={e=>setCName(e.target.value)} placeholder="e.g., Cold List — Utah Q2" style={{width:"100%",padding:"12px 16px",borderRadius:12,border:`1.5px solid ${C.bd}`,fontSize:15,fontFamily:"'DM Sans',sans-serif",color:C.t1}}/></div>
      <div><div style={{fontSize:13,fontWeight:600,color:C.t2,marginBottom:6}}>Pipeline stage</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{Object.entries(STG).map(([k,v])=><button key={k} onClick={()=>setCStage(k)} style={{padding:"10px 16px",borderRadius:10,fontSize:13,fontWeight:600,border:`1.5px solid ${cStage===k?v.bd:C.bd}`,background:cStage===k?v.bg:C.bg,color:cStage===k?v.c:C.t3,cursor:"pointer"}}>{v.l}</button>)}</div></div>
      <div><div style={{fontSize:13,fontWeight:600,color:C.t2,marginBottom:6}}>Dialer mode</div><div style={{display:"flex",gap:8}}>{[["power","Power","Auto-dials through queue"],["preview","Preview","See contact before dialing"],["parallel","Parallel","Dial 2-5 lines at once"]].map(([id,lb,desc])=><button key={id} onClick={()=>setCMode(id)} style={{flex:1,padding:"14px",borderRadius:12,border:`1.5px solid ${cMode===id?C.bB:C.bd}`,background:cMode===id?C.bD:C.bg,cursor:"pointer",textAlign:"left"}}><div style={{fontSize:14,fontWeight:600,color:cMode===id?C.bT:C.t1}}>{lb}</div><div style={{fontSize:12,color:C.t3,marginTop:2}}>{desc}</div></button>)}</div></div>
      <Btn primary onClick={()=>setStep(2)}>Next: Add courses →</Btn>
    </div>}
    {step===2&&<div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Add courses to &quot;{cName||"New campaign"}&quot;</div>
      <div style={{fontSize:14,color:C.t2}}>Filter your database and select which courses to include.</div>
      <div style={{display:"flex",gap:10}}><Btn onClick={()=>setStep(1)}>← Back</Btn><Btn primary onClick={()=>setStep(3)}>Next: Review →</Btn></div>
    </div>}
    {step===3&&<div style={{maxWidth:500,display:"flex",flexDirection:"column",gap:16}}>
      <div style={{fontSize:20,fontWeight:700}}>Review campaign</div>
      <Cd><Rw l="Name" v={cName||"New campaign"}/><Rw l="Stage" v={STG[cStage]?.l||cStage}/><Rw l="Mode" v={cMode}/><Rw l="Calling hours" v="8:00 AM – 8:00 PM local" last/></Cd>
      <div style={{display:"flex",gap:10}}><Btn onClick={()=>setStep(2)}>← Back</Btn><Btn primary onClick={()=>{setCreating(false);setStep(1)}}>Create & activate campaign</Btn></div>
    </div>}
  </div>;

  if(sel)return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}>
    <button onClick={()=>setSel(null)} style={{fontSize:13,color:C.blu,background:"none",border:"none",cursor:"pointer",marginBottom:16,fontWeight:600}}>← Back to campaigns</button>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22,fontWeight:700}}>{sel.n}</span><Pl sg={sel.sg}/><span style={{fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:8,background:C.gD,color:C.gT}}>Active</span></div>
        <div style={{fontSize:14,color:C.t2,marginTop:4}}>{sel.ct} courses · {sel.m} dialing</div>
      </div>
      <div style={{display:"flex",gap:8}}><Btn primary>Start dialing</Btn><Btn onClick={()=>setAddLeads(true)}>+ Add courses</Btn><Btn>Edit</Btn></div>
    </div>
    <Tab tabs={["Queue","Performance","Settings"]} active="Queue" onChange={()=>{}}/>
    <Cd s={{padding:0,overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"40px 2.5fr 1fr 1fr 80px 100px",padding:"12px 20px",borderBottom:`1px solid ${C.bd}`,fontSize:11,color:C.t3,textTransform:"uppercase",fontWeight:600,background:C.sf}}><span>#</span><span>Course</span><span>Stage</span><span>Buyer</span><span>Attempts</span><span>Status</span></div>
    </Cd>
  </div>;

  return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{fontSize:22,fontWeight:700}}>Campaigns</div><Btn primary onClick={()=>setCreating(true)}>+ New campaign</Btn></div>
    {campaigns.map(c=>{const m=STG[c.sg];return <Cd key={c.id} s={{marginBottom:12,cursor:"pointer"}} onClick={()=>setSel(c)}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:14,background:m?.bg||C.sf,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}></div>
          <div><div style={{fontSize:16,fontWeight:600}}>{c.n}</div><div style={{fontSize:13,color:C.t2,marginTop:2}}>{c.ct} courses · {c.m} dialing</div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{display:"flex",gap:16,marginRight:12,fontSize:13}}><span style={{color:C.t3}}>Dials: <M s={13}>0</M></span><span style={{color:C.t3}}>Connects: <M s={13} c={C.grn}>0</M></span></div>
          <Pl sg={c.sg}/>
          <div style={{background:C.gD,color:C.gT,fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:8}}>Active</div>
        </div>
      </div>
    </Cd>})}
  </div>;
}

// ── SAMPLES ──
function SamplesP(){
  const {samples}=useSamples();
  const stats=[["Sent",samples.length,C.pur],["Delivered",samples.filter(s=>s.s==="delivered").length,C.org],["In transit",samples.filter(s=>s.s==="in_transit").length,C.blu],["Converted",samples.filter(s=>s.s==="converted").length,C.grn]] as const;
  const rate=samples.length?Math.round((samples.filter(s=>s.s==="converted").length/samples.length)*100):0;
  return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}>
    <div style={{fontSize:22,fontWeight:700,marginBottom:20}}>Sample tracking</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>{stats.map(([l,v,c])=><Stat key={l} label={l} value={v} color={c}/>)}</div>
    <div style={{background:C.gD,border:`1px solid ${C.gB}`,borderRadius:14,padding:"16px 20px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontSize:14,fontWeight:600,color:C.gT}}>Conversion rate</div><div style={{fontSize:13,color:C.t2,marginTop:2}}>{samples.filter(s=>s.s==="converted").length} of {samples.length} → orders</div></div>
      <M s={32} c={C.grn}>{rate}%</M>
    </div>
    <Cd s={{padding:0,overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 90px 80px 1.2fr 80px",padding:"12px 20px",borderBottom:`1px solid ${C.bd}`,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:600,background:C.sf}}><span>Course / Buyer</span><span>Size/Color</span><span>Status</span><span>Shipped</span><span>Follow-up</span><span>Order</span></div>
      {samples.map(s=><div key={s.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 90px 80px 1.2fr 80px",padding:"14px 20px",borderBottom:`1px solid ${C.rs}`,alignItems:"center",fontSize:14}}>
        <div><div style={{fontWeight:600}}>{s.co}</div><div style={{fontSize:12,color:C.t3}}>{s.b}</div></div>
        <span style={{color:C.t2}}>{s.sz}/{s.cl}</span>
        <span style={{fontSize:12,fontWeight:600,color:s.s==="delivered"?C.oT:s.s==="in_transit"?C.bT:C.gT}}>{s.s==="delivered"?"Delivered":s.s==="in_transit"?"Transit":"Converted"}</span>
        <M s={12} c={C.t3}>{s.sh}</M>
        <span style={{fontSize:13,color:s.done?C.gT:s.s==="delivered"?C.oT:C.t3,fontWeight:s.done||s.s!=="delivered"?400:600}}>{s.done?`${s.fu}`:s.fu||"—"}{s.s==="delivered"&&!s.done?" OVERDUE":""}</span>
        <M s={13} c={s.amt?C.gT:C.t3}>{s.amt||"—"}</M>
      </div>)}
    </Cd>
  </div>;
}

// ── ORDERS ──
function OrdersP(){
  const {orders}=useOrders();
  const[sel,setSel]=useState<OrdItem|null>(null);
  if(sel)return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}>
    <button onClick={()=>setSel(null)} style={{fontSize:13,color:C.blu,background:"none",border:"none",cursor:"pointer",marginBottom:16,fontWeight:600}}>← Back to orders</button>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22,fontWeight:700}}>Order #{sel.id}</span><span style={{fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:8,background:sel.pay==="Paid"?C.gD:C.aD,color:sel.pay==="Paid"?C.gT:C.aT}}>{sel.pay}</span><span style={{fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:8,background:sel.ful==="Delivered"?C.gD:C.bD,color:sel.ful==="Delivered"?C.gT:C.bT}}>{sel.ful}</span></div>
        <div style={{fontSize:14,color:C.t2,marginTop:4}}>{sel.co} — {sel.b} · {sel.dt}</div>
      </div>
      <div style={{display:"flex",gap:8}}><Btn>Print invoice</Btn><Btn>Send confirmation</Btn><Btn>Duplicate order</Btn></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Cd>
        <Lb>Line items</Lb>
        <div style={{fontSize:14,color:C.t2,marginBottom:12}}>{sel.items}</div>
        <div style={{borderTop:`1px solid ${C.bd}`,paddingTop:12,display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600}}>Total</span><M s={18} c={C.grn}>{sel.tot}</M></div>
      </Cd>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <Cd><Lb>Payment</Lb><Rw l="Status" v={sel.pay} c={sel.pay==="Paid"?C.gT:C.aT}/><Rw l="Terms" v="Net 30" last/>{sel.pay!=="Paid"&&<div style={{marginTop:12}}><Btn full>Send payment reminder</Btn></div>}</Cd>
        <Cd><Lb>Fulfillment</Lb><Rw l="Status" v={sel.ful} c={sel.ful==="Delivered"?C.gT:C.bT}/><Rw l="Carrier" v="UPS Ground"/><Rw l="Tracking" v="—" c={C.blu} last/></Cd>
      </div>
    </div>
  </div>;
  return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{fontSize:22,fontWeight:700}}>Wholesale orders</div></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>{[["Orders",orders.length,C.t1],["Revenue",`$${orders.reduce((t,o)=>t+(parseFloat(o.tot.replace(/[$,]/g,""))||0),0).toLocaleString()}`,C.grn],["Avg order","—",C.blu],["Units sold","—",C.pur]].map(([l,v,c])=><Stat key={l as string} label={l as string} value={v as string} color={c as string}/>)}</div>
    <Cd s={{padding:0,overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"60px 2fr 1.2fr 80px 80px 80px 80px",padding:"12px 20px",borderBottom:`1px solid ${C.bd}`,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:600,background:C.sf}}><span>#</span><span>Course / Buyer</span><span>Items</span><span>Total</span><span>Payment</span><span>Status</span><span>Agent</span></div>
      {orders.map(o=><div key={o.id} onClick={()=>setSel(o)} style={{display:"grid",gridTemplateColumns:"60px 2fr 1.2fr 80px 80px 80px 80px",padding:"14px 20px",borderBottom:`1px solid ${C.rs}`,alignItems:"center",fontSize:14,cursor:"pointer"}}>
        <M s={13} c={C.t3}>#{o.id}</M>
        <div><div style={{fontWeight:600}}>{o.co}</div><div style={{fontSize:12,color:C.t3}}>{o.b} · {o.dt}</div></div>
        <span style={{fontSize:13,color:C.t2}}>{o.items}</span>
        <M s={14} c={C.grn}>{o.tot}</M>
        <span style={{fontSize:12,fontWeight:600,color:o.pay==="Paid"?C.gT:C.aT}}>{o.pay}</span>
        <span style={{fontSize:12,fontWeight:600,color:o.ful==="Delivered"?C.gT:C.bT}}>{o.ful}</span>
        <span style={{fontSize:13,color:C.t2}}>{o.ag}</span>
      </div>)}
    </Cd>
  </div>;
}

// ── CALL LIBRARY ──
function CallsP(){
  const {recs}=useRecordings();
  const[s,setS]=useState("");const[sel,setSel]=useState<RecItem|null>(null);const[playing,setPlaying]=useState(false);const[speed,setSpeed]=useState(1);
  const fl=recs.filter(r=>r.co.toLowerCase().includes(s.toLowerCase())||(r.b||"").toLowerCase().includes(s.toLowerCase())||r.dp.toLowerCase().includes(s.toLowerCase()));
  const transcript:TranscriptItem[]=[{t:"00:02",sp:"Agent",tx:"Hi, I'm Alex with BYRDGANG — performance golf polos. Can I speak with whoever handles pro shop merchandise?"},{t:"00:08",sp:"Prospect",tx:"That would be Mike Thompson, he's our head pro."},{t:"00:14",sp:"Agent",tx:"No problem. Could I get his direct number so I can call back?"},{t:"00:20",sp:"Prospect",tx:"He's usually in before 9am. 801-555-0141."},{t:"00:26",sp:"Agent",tx:"Perfect — Mike Thompson, head pro?"},{t:"00:30",sp:"Prospect",tx:"Yep."},{t:"00:32",sp:"Agent",tx:"Great, I'll call him in the morning. Thanks!"}];
  if(sel)return <div className="sb" style={{height:"100%",overflowY:"auto"}}>
    <div style={{padding:"20px 28px",borderBottom:`1px solid ${C.bd}`,background:C.sf}}>
      <button onClick={()=>setSel(null)} style={{fontSize:13,color:C.blu,background:"none",border:"none",cursor:"pointer",marginBottom:12,fontWeight:600}}>← Back to call library</button>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div><div style={{fontSize:20,fontWeight:700}}>{sel.co}</div><div style={{fontSize:14,color:C.t2,marginTop:4}}>{sel.b||"Unknown"}{sel.sp?` · ${sel.sp}`:""} · {sel.ag} · {sel.dt} · {sel.dur}</div></div>
        <div style={{display:"flex",gap:8}}><span style={{fontSize:13,fontWeight:500,color:sel.dp.includes("order")?C.gT:sel.dp.includes("sample")?C.pT:sel.dp.includes("buyer")?C.bT:C.t2,padding:"6px 14px",borderRadius:8,background:C.sf,border:`1px solid ${C.bd}`}}>{sel.dp}</span>{sel.sc&&<span style={{fontSize:15,fontWeight:700,color:sel.sc>=85?C.grn:sel.sc>=70?C.amb:C.red,padding:"6px 14px",borderRadius:8,background:C.sf,border:`1px solid ${C.bd}`}}>{sel.sc}/100</span>}</div>
      </div>
    </div>
    <div style={{padding:"0 28px 28px"}}>
      <Cd s={{marginTop:20,marginBottom:20}}>
        <Lb>Recording</Lb>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
          <button onClick={()=>setPlaying(!playing)} style={{width:44,height:44,borderRadius:"50%",background:playing?C.gD:C.sf,border:`1.5px solid ${playing?C.gB:C.bd}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><I s={20} k={playing?C.grn:C.t2}>{playing?<><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>:<polygon points="5 3 19 12 5 21 5 3"/>}</I></button>
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:2,alignItems:"end",height:40}}>{Array.from({length:60},(_,i)=>{const h=Math.sin(i*0.3)*16+8;return <div key={i} style={{flex:1,height:h,background:i<25?(playing?C.grn:C.blu):C.rs,borderRadius:2,minWidth:2}}/>})}</div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><M s={11} c={C.t3}>1:02</M><M s={11} c={C.t3}>{sel.dur}</M></div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {[0.5,1,1.5,2].map(sp=><button key={sp} onClick={()=>setSpeed(sp)} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${speed===sp?C.bB:C.bd}`,background:speed===sp?C.bD:C.bg,color:speed===sp?C.bT:C.t3,fontSize:12,fontWeight:600,cursor:"pointer"}}>{sp}x</button>)}
          <div style={{flex:1}}/>
          <Btn>Download</Btn>
        </div>
      </Cd>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <Cd>
          <Lb>Transcript</Lb>
          {transcript.map((t,i)=><div key={i} style={{padding:"10px 0",borderBottom:i<transcript.length-1?`1px solid ${C.rs}`:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,fontWeight:600,color:t.sp==="Agent"?C.bT:C.gT}}>{t.sp}</span><button style={{fontSize:11,color:C.blu,background:"none",border:"none",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>{t.t}</button></div>
            <div style={{fontSize:14,color:C.t1,lineHeight:1.6}}>{t.tx}</div>
          </div>)}
        </Cd>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Cd>
            <Lb>AI analysis</Lb>
            {sel.sc&&<div style={{textAlign:"center",marginBottom:16}}><M s={48} c={sel.sc>=85?C.grn:sel.sc>=70?C.amb:C.red}>{sel.sc}</M><div style={{fontSize:12,color:C.t3,marginTop:4}}>Overall score</div></div>}
            <Rw l="Talk ratio" v="38% agent / 62% prospect" c={C.grn}/>
            <Rw l="Gatekeeper" v="Encountered — got past" c={C.gT}/>
            <Rw l="Reached buyer" v="No — got name + direct line"/>
            <Rw l="Sentiment" v="Positive" c={C.grn} last/>
          </Cd>
          <Cd>
            <Lb>Script adherence</Lb>
            {[["Mentioned free sample",true],["Asked for buyer name",true],["Got direct number",true],["Mentioned SunRun proof",false],["Attempted close",false]].map(([item,done],i,a)=><div key={i as number} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<a.length-1?`1px solid ${C.rs}`:"none",fontSize:13}}><span style={{color:done?C.grn:C.red}}>{done?"✓":"✗"}</span><span style={{color:done?C.t1:C.t3}}>{item as string}</span></div>)}
          </Cd>
        </div>
      </div>
    </div>
  </div>;
  return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div><div style={{fontSize:22,fontWeight:700}}>Call library</div><div style={{fontSize:14,color:C.t2,marginTop:2}}>{recs.length} recorded calls</div></div><input type="text" placeholder="Search calls, transcripts..." value={s} onChange={e=>setS(e.target.value)} style={{padding:"10px 16px",borderRadius:12,border:`1.5px solid ${C.bd}`,background:C.bg,color:C.t1,fontSize:14,fontFamily:"'DM Sans',sans-serif",width:280,outline:"none"}}/></div>
    <Cd s={{padding:0,overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"2.5fr 80px 80px 80px 1.2fr 50px",padding:"12px 20px",borderBottom:`1px solid ${C.bd}`,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:600,background:C.sf}}><span>Course / Contact</span><span>Agent</span><span>Date</span><span>Duration</span><span>Disposition</span><span>Score</span></div>
      {fl.map(r=><div key={r.id} onClick={()=>setSel(r)} style={{display:"grid",gridTemplateColumns:"2.5fr 80px 80px 80px 1.2fr 50px",padding:"14px 20px",borderBottom:`1px solid ${C.rs}`,alignItems:"center",fontSize:14,cursor:"pointer"}}>
        <div><div style={{fontWeight:600}}>{r.co}</div><div style={{fontSize:12,color:C.t3}}>{r.b||"Unknown"}{r.sp?` · ${r.sp}`:""}</div></div>
        <span style={{color:C.t2,fontSize:13}}>{r.ag}</span>
        <M s={12} c={C.t3}>{r.dt}</M>
        <M s={13}>{r.dur}</M>
        <span style={{fontSize:13,fontWeight:500,color:r.dp.includes("order")?C.gT:r.dp.includes("sample")?C.pT:r.dp.includes("buyer")?C.bT:C.t2}}>{r.dp}</span>
        {r.sc?<M s={15} c={r.sc>=85?C.grn:r.sc>=70?C.amb:C.red}>{r.sc}</M>:<span style={{color:C.t3}}>—</span>}
      </div>)}
    </Cd>
  </div>;
}

// ── COACHING ──
function CoachP(){return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}><div style={{fontSize:22,fontWeight:700,marginBottom:20}}>AI coaching</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}}>{[["Avg call score","83","/100",C.grn],["Gatekeeper pass","34%","14/41 calls",C.amb],["Sample close","62%","8/13 convos",C.pur]].map(([t,v,sub,c])=><div key={t} style={{background:C.bg,borderRadius:14,border:`1px solid ${C.bd}`,padding:"20px"}}><div style={{fontSize:12,color:C.t3,textTransform:"uppercase",marginBottom:8}}>{t}</div><M s={32} c={c}>{v}</M><div style={{fontSize:12,color:C.t3,marginTop:4}}>{sub}</div></div>)}</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
<Cd><div style={{fontSize:16,fontWeight:600,marginBottom:14}}>Top gatekeeper techniques</div>{[["Ask for \"merchandise buyer\" not \"manager\"","6/8 converted",C.grn],["Call before 9am local","3x more likely",C.amb],["\"Quick question about polo inventory\"","72% pass rate",C.blu]].map(([t,s,c],i)=><div key={i} style={{padding:"14px 16px",background:C.sf,borderRadius:12,marginBottom:8}}><div style={{fontSize:14,fontWeight:500,marginBottom:4}}>{t}</div><div style={{fontSize:13,color:c,fontWeight:600}}>{s}</div></div>)}</Cd>
<Cd><div style={{fontSize:16,fontWeight:600,marginBottom:14}}>Best objection responses</div>{[["\"Already carry polos\"","→ \"At $25 you can sell alongside at $49...\"","43%",C.amb],["\"Send me an email\"","→ \"Product sells by touch. Free sample?\"","38%",C.blu],["\"No budget\"","→ \"Sample is free. When budget opens...\"","29%",C.pur]].map(([obj,resp,stat,c],i)=><div key={i} style={{padding:"14px 16px",background:C.sf,borderRadius:12,marginBottom:8}}><div style={{fontSize:13,fontWeight:600,color:c}}>{obj}</div><div style={{fontSize:13,color:C.t2,margin:"4px 0"}}>{resp}</div><div style={{fontSize:12,color:C.grn,fontWeight:600}}>{stat} convert</div></div>)}</Cd>
</div>
<Cd><div style={{fontSize:16,fontWeight:600,marginBottom:12}}>Weekly notes — Alex</div><div style={{fontSize:14,color:C.t2,lineHeight:1.8}}><p style={{margin:"0 0 10px"}}>Strong week. SunRun proof landed in 4/5 sample closes. Talk ratio improved to 38/62.</p><p style={{margin:"0 0 10px"}}><span style={{color:C.gT,fontWeight:600}}>Keep doing:</span> Asking for size early creates commitment before the address ask.</p><p style={{margin:0}}><span style={{color:C.aT,fontWeight:600}}>Work on:</span> Try &quot;quick question about polo inventory&quot; instead of &quot;who handles purchasing&quot; with gatekeepers.</p></div></Cd></div>}

// ── ANALYTICS ──
function StatsP(){
  const stats=useStats();
  return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}><div style={{fontSize:22,fontWeight:700,marginBottom:20}}>Analytics</div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>{[["Dials",stats.dials,C.t1],["Connects",stats.connects,C.grn],["Rate",stats.dials?`${((stats.connects/stats.dials)*100).toFixed(1)}%`:"0%",C.blu],["Samples",stats.samples,C.pur],["Orders",stats.orders,C.grn]].map(([l,v,c])=><Stat key={l as string} label={l as string} value={v as string|number} color={c as string}/>)}</div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
    <Cd><div style={{fontSize:16,fontWeight:600,marginBottom:16}}>Pipeline funnel</div>{[["Cold → Buyer ID'd","38%",38,C.blu],["Buyer → Sample","62%",62,C.pur],["Sample → Order","50%",50,C.grn]].map(([l,r,p,c],i)=><div key={i} style={{marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}><span style={{color:C.t2}}>{l as string}</span><span style={{color:c as string,fontWeight:700}}>{r as string}</span></div><div style={{height:8,background:C.rs,borderRadius:4}}><div style={{height:8,background:c as string,borderRadius:4,width:`${p}%`}}/></div></div>)}</Cd>
    <Cd><div style={{fontSize:16,fontWeight:600,marginBottom:16}}>Revenue</div>{[["This week","—",C.grn],["This month","—",C.grn],["All time","—",C.grn],["Avg order","—",C.blu],["Units/order","—",C.t1]].map(([l,v,c],i,a)=><Rw key={l} l={l} v={v} c={c} last={i===a.length-1}/>)}</Cd>
  </div>
  </div>;
}

// ── SETTINGS ──
function SettingsP(){const[tab,setTab]=useState("Profile");return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}><div style={{fontSize:22,fontWeight:700,marginBottom:20}}>Settings</div><Tab tabs={["Profile","Team","Phone #s","Inbound","Scripts","Voicemail","SMS","Integrations"]} active={tab} onChange={setTab}/>
{tab==="Profile"&&<Cd s={{maxWidth:500}}><Lb>My profile</Lb><div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}><div style={{width:56,height:56,borderRadius:"50%",background:C.bD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:600,color:C.bT}}>AJ</div><div><div style={{fontSize:16,fontWeight:600}}>Alex Johnson</div><div style={{fontSize:14,color:C.t2}}>alex@byrdgang.com</div></div></div>{["Full name","Email","Phone extension","Working hours"].map(f=><div key={f} style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:600,color:C.t2,marginBottom:6}}>{f}</div><input style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${C.bd}`,fontSize:14,fontFamily:"'DM Sans',sans-serif",color:C.t1}} defaultValue={f==="Full name"?"Alex Johnson":f==="Email"?"alex@byrdgang.com":""}/></div>)}<Btn primary>Save changes</Btn></Cd>}
{tab==="Integrations"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>{[["Shopify","Connected","byrdgang.myshopify.com",C.grn],["Twilio","Connected","2 phone numbers active",C.grn],["Deepgram","Connected","Nova-3 model",C.grn],["Claude API","Connected","Sonnet 4",C.grn],["Klaviyo","Not connected","Connect for email automations",C.t3],["Slack","Not connected","Connect for notifications",C.t3]].map(([n,st,desc,c])=><Cd key={n}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:15,fontWeight:600}}>{n}</div><div style={{fontSize:13,color:C.t2,marginTop:2}}>{desc}</div></div><span style={{fontSize:12,fontWeight:600,color:c,padding:"4px 10px",borderRadius:8,background:c===C.grn?C.gD:C.rs}}>{st}</span></div></Cd>)}</div>}
{tab==="Inbound"&&<Cd s={{maxWidth:600}}><Lb>Inbound routing</Lb>{[["Routing strategy","Ring all available agents"],["Max hold time","120 seconds"],["Auto-SMS after","120 seconds hold"],["After-hours","Voicemail + callback task"],["VM transcription","Enabled (Deepgram)"]].map(([l,v],i,a)=><Rw key={l} l={l} v={v} last={i===a.length-1}/>)}<div style={{marginTop:16}}><Btn>Edit routing rules</Btn></div></Cd>}
{tab==="Scripts"&&<div><Lb r="4 scripts">Script library</Lb>{["Cold call — Gatekeeper","Cold call — Buyer","Sample follow-up","Reorder check-in"].map((s,i)=><Cd key={s} s={{marginBottom:10,cursor:"pointer"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><span style={{fontWeight:600}}>{s}</span><span style={{color:C.t3,marginLeft:8,fontSize:13}}>v{i+1}</span></div><span style={{fontSize:12,color:C.blu,fontWeight:600}}>Edit</span></div></Cd>)}</div>}
{!["Profile","Integrations","Inbound","Scripts"].includes(tab)&&<Cd><div style={{padding:40,textAlign:"center",color:C.t3}}>Settings for {tab} — configure in the full app</div></Cd>}
</div>}

// ═══════════════════════════════════════
//  DIALER (wired to CallProvider)
// ═══════════════════════════════════════
function DialerP(){
  const call=useCall();
  // Map CallProvider phases to v4 dialer states
  const phaseMap:Record<string,string>={IDLE:"idle",READY:"ready",DIALING:"dialing",RINGING:"ringing",CONNECTED:"connected","WRAP-UP":"wrapup",PAUSED:"paused",COMPLETE:"complete"};
  const ds=phaseMap[call.phase]||"idle";

  const[mod,setMod]=useState<"sample"|"order"|null>(null);
  const[pad,setPad]=useState(false);
  const[avDrop,setAvDrop]=useState(false);

  // Load campaigns for idle state
  const {campaigns}=useCampaigns();

  // Format seconds as MM:SS
  const fmt=useCallback((t:number)=>`${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`,[]);

  // Current course info from CallProvider
  const rawCourse=call.currentCourse;
  const act:CourseRow=rawCourse?{
    id:rawCourse.id,n:rawCourse.name||"",t:"",ci:rawCourse.city||"",st:rawCourse.state||"",
    ph:rawCourse.main_phone||"",pp:rawCourse.pro_shop_phone||"",
    b:rawCourse.buyer_name||"",bt:rawCourse.buyer_title||"",bp:rawCourse.buyer_direct_phone||"",be:"",bs:"",
    sg:rawCourse.pipeline_stage||"cold_list",att:rawCourse.total_attempts||0,
    ivrKey:rawCourse.ivr_pro_shop_key||"",ivrExt:rawCourse.ivr_direct_extension||"",ivrNotes:rawCourse.ivr_notes||"",
  }:{id:"",n:"Unknown",t:"",ci:"",st:"",ph:"",pp:"",b:"",bt:"",bp:"",be:"",bs:"",sg:"cold_list",att:0};

  const mode=call.mode;
  const isGk=mode==="gatekeeper";
  const scKey=act.sg==="sample_follow_up"?"followup":isGk?"cold_gk":"cold_buyer";
  const script=SC[scKey]||[];
  const disps=[...(act.sg==="sample_follow_up"?DFU:isGk?DGK:DBY),...DSH];
  const accent=isGk?C.amb:C.blu;
  const showTog=act.sg==="cold_list"||act.sg==="buyer_identified";

  // Queue for sidebar — use CallProvider queue
  const sortedQueue=call.queue;

  // P key hotkey for dialpad — only when not in input/textarea
  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{
      const tag=(e.target as HTMLElement)?.tagName?.toLowerCase();
      if(tag==="input"||tag==="textarea"||tag==="select")return;
      if(e.key==="p"||e.key==="P")setPad(p=>!p);
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[]);

  const sendDtmf=(d:string)=>{call.sendDigits(d)};

  const Queue=()=><div style={{background:C.sf,borderRight:`1px solid ${C.bd}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
    <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between"}}>
      <div style={{fontSize:14,fontWeight:600}}>{call.queue.length>0?"Queue":"No campaign"}</div>
      <M s={12} c={C.t3}>{call.queue.length-call.currentIndex-1} left</M>
    </div>
    <div className="sb" style={{flex:1,overflowY:"auto"}}>
      {sortedQueue.map((qi,i)=>{
        const live=i===call.currentIndex&&ds==="connected";
        const hot=qi.course.pipeline_stage==="sample_follow_up";
        return <div key={qi.id} style={{padding:"10px 14px",borderBottom:`1px solid ${C.rs}`,background:live?C.gD:hot?C.oD:"transparent",borderLeft:live?`3px solid ${C.grn}`:hot?`3px solid ${C.org}`:"3px solid transparent"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <span style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{qi.course.name}</span>
            {live&&<M s={12} c={C.grn}>{fmt(call.callDuration)}</M>}
          </div>
          <div style={{display:"flex",gap:5,alignItems:"center"}}><Pl sg={qi.course.pipeline_stage||"cold_list"}/>{qi.course.buyer_name&&<span style={{fontSize:11,color:C.t2}}>{qi.course.buyer_name}</span>}</div>
        </div>;
      })}
    </div>
  </div>;

  const Intel=()=><div className="sb" style={{background:C.sf,borderLeft:`1px solid ${C.bd}`,overflowY:"auto"}}>
    <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.bd}`}}>
      <div style={{fontSize:14,fontWeight:600,marginBottom:8}}>Course</div>
      {[["Name",act.n],["Type",act.t||"—"],["Phone",act.ph||"—"],["Pro shop",act.pp||"—"]].map(([l,v],i,a)=><Rw key={l} l={l} v={v} c={l.includes("hone")?C.blu:null} last={i===a.length-1}/>)}
    </div>
    <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.bd}`}}>
      <Lb>{act.b?"Buyer":"Buyer — unknown"}</Lb>
      {act.b?[["Name",act.b],["Title",act.bt||"—"],["Size",act.bs||"—"]].map(([l,v],i,a)=><Rw key={l} l={l} v={v} c={l==="Size"&&v!=="—"?C.grn:null} last={i===a.length-1}/>):<div style={{fontSize:13,color:C.t3,fontStyle:"italic"}}>Ask gatekeeper for name</div>}
    </div>
    {call.queue[call.currentIndex]&&<div style={{padding:"14px 18px"}}>
      <Lb r={`${act.att}`}>Attempts</Lb>
      <div style={{fontSize:13,color:C.t3}}>Total: {act.att}</div>
    </div>}
  </div>;

  if(ds==="idle")return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:32,textAlign:"center"}}>
    <div style={{width:80,height:80,borderRadius:24,background:C.gD,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20}}><I s={36} k={C.grn}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></I></div>
    <div style={{fontSize:24,fontWeight:700,marginBottom:6}}>Ready to dial</div>
    <div style={{fontSize:15,color:C.t2,marginBottom:28,maxWidth:320}}>Select a campaign to load your call queue.</div>
    <div style={{width:"100%",maxWidth:420,display:"flex",flexDirection:"column",gap:10}}>
      {campaigns.map(c2=>{const m=STG[c2.sg];return <button key={c2.id} onClick={()=>call.prepareCampaign({id:c2.id,name:c2.n,pipeline_stage:c2.sg,dialer_mode:c2.m,course_count:c2.ct})} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",borderRadius:14,border:`1.5px solid ${C.bd}`,background:C.bg,cursor:"pointer",textAlign:"left",width:"100%"}}>
        <div style={{width:44,height:44,borderRadius:12,background:m?.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}></div>
        <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600}}>{c2.n}</div><div style={{fontSize:13,color:C.t3,marginTop:2}}>{c2.ct} courses · {c2.m}</div></div>
        <I s={16} k={C.t3}><polyline points="9 18 15 12 9 6"/></I>
      </button>})}
    </div>
  </div>;

  if(ds==="ready")return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:32,textAlign:"center"}}>
    <div style={{fontSize:13,fontWeight:600,color:C.t3,textTransform:"uppercase",marginBottom:8}}>Campaign loaded</div>
    <div style={{fontSize:24,fontWeight:700,marginBottom:4}}>{call.queue[0]?.course.name||"Queue ready"}</div>
    <div style={{fontSize:15,color:C.t2,marginBottom:24}}>{call.queue.length} courses in queue</div>
    <div style={{width:"100%",maxWidth:380,background:C.sf,borderRadius:14,border:`1px solid ${C.bd}`,padding:"12px 0",marginBottom:28}}>
      <div style={{fontSize:12,fontWeight:600,color:C.t3,textTransform:"uppercase",padding:"0 16px 10px",borderBottom:`1px solid ${C.bd}`}}>Next up</div>
      {call.queue.slice(0,4).map((qi,i)=><div key={qi.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:i<3?`1px solid ${C.rs}`:"none"}}>
        <M s={14} c={C.t3}>{i+1}</M>
        <div style={{flex:1,textAlign:"left"}}><div style={{fontSize:14,fontWeight:500}}>{qi.course.name}</div><div style={{fontSize:12,color:C.t3}}>{qi.course.buyer_name||"Unknown"}</div></div>
        <Pl sg={qi.course.pipeline_stage||"cold_list"}/>
      </div>)}
    </div>
    <button onClick={()=>call.startDialing()} style={{width:180,height:180,borderRadius:"50%",background:"linear-gradient(135deg,#10B981,#059669)",border:"none",color:"white",fontSize:22,fontWeight:700,cursor:"pointer",boxShadow:"0 8px 32px rgba(16,185,129,0.35)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
      <I s={40} k="white" w={2.5}><polygon points="5 3 19 12 5 21 5 3"/></I>
      Start dialing
    </button>
    <button onClick={()=>call.pauseDialer()} style={{marginTop:16,background:"none",border:"none",color:C.t3,fontSize:14,cursor:"pointer",textDecoration:"underline"}}>Change campaign</button>
  </div>;

  if(ds==="dialing"||ds==="ringing"){const isR=ds==="ringing";const nx=call.queue[call.currentIndex];return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:32,textAlign:"center"}}>
    <div style={{fontSize:14,fontWeight:600,color:isR?C.aT:C.bT,textTransform:"uppercase",letterSpacing:"1px",marginBottom:16}}>{isR?"Ringing...":"Dialing..."}</div>
    <div style={{width:72,height:72,borderRadius:"50%",background:isR?C.aD:C.bD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,marginBottom:16,border:`3px solid ${isR?C.aB:C.bB}`}}></div>
    <div style={{fontSize:22,fontWeight:700,marginBottom:4}}>{nx?.course.name||"Connecting..."}</div>
    <div style={{fontSize:15,color:C.t2,marginBottom:8}}>{nx?.course.buyer_name||"Unknown"} · {nx?.course.city||""}</div>
    <Pl sg={nx?.course.pipeline_stage||"cold_list"}/>
    <div style={{marginTop:24}}><Btn onClick={()=>call.pauseDialer()}>Pause dialer</Btn></div>
    <button onClick={()=>call.endCall()} style={{marginTop:12,background:"none",border:"none",color:C.red,fontSize:13,cursor:"pointer"}}>Stop session</button>
  </div>}

  if(ds==="paused")return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:32,textAlign:"center"}}>
    <div style={{width:72,height:72,borderRadius:"50%",background:C.aD,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20}}><I s={32} k={C.amb}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></I></div>
    <div style={{fontSize:24,fontWeight:700,marginBottom:4}}>Paused</div>
    <div style={{fontSize:15,color:C.t2,marginBottom:28}}>{call.queue.length} courses in queue</div>
    <button onClick={()=>call.resumeDialer()} style={{width:150,height:150,borderRadius:"50%",background:"linear-gradient(135deg,#10B981,#059669)",border:"none",color:"white",fontSize:20,fontWeight:700,cursor:"pointer",boxShadow:"0 8px 32px rgba(16,185,129,0.3)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}>
      <I s={36} k="white" w={2.5}><polygon points="5 3 19 12 5 21 5 3"/></I>Resume
    </button>
    <div style={{display:"flex",gap:10,marginTop:20}}><Btn onClick={()=>call.pauseDialer()}>End session</Btn></div>
  </div>;

  if(ds==="wrapup"){return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:32,textAlign:"center"}}>
    <div style={{width:64,height:64,borderRadius:"50%",background:call.disposition?C.gD:C.aD,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>
      {call.disposition?<I s={28} k={C.grn}><polyline points="20 6 9 17 4 12"/></I>:<I s={28} k={C.amb}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></I>}
    </div>
    <div style={{fontSize:22,fontWeight:700,marginBottom:4}}>{call.disposition?"Call complete":"Set disposition"}</div>
    <div style={{fontSize:15,color:C.t2,marginBottom:6}}>{act.n}</div>
    {call.disposition&&<div style={{fontSize:14,color:C.grn,fontWeight:600,marginBottom:16}}>Outcome: {call.disposition}</div>}
    {!call.disposition&&<div style={{width:"100%",maxWidth:360,marginTop:12,display:"flex",flexDirection:"column",gap:8}}>
      {disps.map(d=><button key={d.l} onClick={()=>{
        call.setDisposition(d.l);
        if((d as any).cap)setMod("sample");
        else call.submitDisposition(d.l);
      }} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:12,border:`1.5px solid ${(d as any).p?d.c+"55":C.bd}`,background:(d as any).p?d.c+"08":C.bg,color:C.t1,fontSize:14,fontWeight:(d as any).p?600:500,cursor:"pointer",textAlign:"left",width:"100%",fontFamily:"'DM Sans',sans-serif"}}>
        <div style={{width:10,height:10,borderRadius:"50%",background:d.c}}/>
        <div style={{flex:1}}><div>{d.l}</div><div style={{fontSize:12,color:C.t3}}>{d.a}</div></div>
        {(d as any).p&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:6,background:d.c+"18",color:d.c,fontWeight:700}}>WIN</span>}
      </button>)}
    </div>}
    {call.disposition&&<div style={{display:"flex",gap:10,marginTop:16}}>
      <Btn primary onClick={()=>call.startDialing()}>Dial next</Btn>
      <Btn onClick={()=>call.pauseDialer()}>Pause</Btn>
    </div>}
  </div>}

  if(ds==="complete")return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:32,textAlign:"center"}}>
    <div style={{width:80,height:80,borderRadius:"50%",background:C.gD,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20}}><I s={36} k={C.grn}><polyline points="20 6 9 17 4 12"/></I></div>
    <div style={{fontSize:24,fontWeight:700,marginBottom:4}}>Campaign complete!</div>
    <div style={{fontSize:15,color:C.t2,marginBottom:24}}>All courses dialed</div>
    <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%",maxWidth:320}}>
      <Btn primary full onClick={()=>call.pauseDialer()}>Start another campaign</Btn>
      <Btn full onClick={()=>call.resumeDialer()}>Re-queue unanswered</Btn>
    </div>
  </div>;

  // CONNECTED
  return <div style={{display:"grid",gridTemplateColumns:"280px minmax(0,1fr) 280px",height:"100%",overflow:"hidden"}}>
    {mod==="sample"&&<SampleModal c={{n:act.n,b:act.b,bs:act.bs}} onClose={()=>setMod(null)} onDone={async(data)=>{
      setMod(null);
      await fetch("/api/samples/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({courseId:act.id,size:data.sz,color:data.cl,address:data.ad})});
      call.setDisposition("Sending sample");
      await call.submitDisposition("Sending sample");
    }}/>}
    {mod==="order"&&<OrderModal c={{n:act.n,b:act.b}} onClose={()=>setMod(null)} onDone={async(data)=>{
      setMod(null);
      await fetch("/api/orders/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({courseId:act.id,...data})});
      call.setDisposition("Placing order!");
      await call.submitDisposition("Placing order!");
    }}/>}
    {/* Dialpad overlay */}
    {pad&&<div style={{position:"fixed",inset:0,zIndex:250,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div onClick={()=>setPad(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.2)"}}/>
      <div style={{position:"relative",background:C.bg,borderRadius:20,padding:"24px 28px",width:320,boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><span style={{fontSize:16,fontWeight:700}}>Dialpad</span><button onClick={()=>setPad(false)} style={{background:"none",border:"none",color:C.t3,fontSize:18,cursor:"pointer"}}>✕</button></div>
        {call.dtmfDigits&&<div style={{background:C.sf,borderRadius:10,padding:"10px 14px",marginBottom:14,fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:600,letterSpacing:4,textAlign:"center",color:C.t1}}>{call.dtmfDigits}</div>}
        <div style={{background:C.bD,border:`1px solid ${C.bB}`,borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:13,color:C.bT,fontWeight:600}}>Pro Shop shortcut:</span>
          <button onClick={()=>sendDtmf(act.ivrKey||"2")} style={{padding:"6px 16px",borderRadius:8,background:C.blu,color:"white",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>Press {act.ivrKey||"2"}</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {["1","2","3","4","5","6","7","8","9","*","0","#"].map(d=><button key={d} onClick={()=>sendDtmf(d)} style={{padding:"16px 0",borderRadius:12,fontSize:22,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",background:C.sf,border:`1.5px solid ${C.bd}`,color:C.t1,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            {d}
            <span style={{fontSize:8,color:C.t3,fontWeight:400,letterSpacing:1}}>{d==="2"?"ABC":d==="3"?"DEF":d==="4"?"GHI":d==="5"?"JKL":d==="6"?"MNO":d==="7"?"PQRS":d==="8"?"TUV":d==="9"?"WXYZ":""}</span>
          </button>)}
        </div>
        <button onClick={()=>setPad(false)} style={{width:"100%",marginTop:12,padding:"10px",borderRadius:10,background:C.sf,border:`1px solid ${C.bd}`,color:C.t2,fontSize:13,fontWeight:500,cursor:"pointer"}}>Close</button>
      </div>
    </div>}
    <Queue/>
    <div style={{display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{flexShrink:0,padding:"12px 20px",borderBottom:`1px solid ${C.bd}`,zIndex:5}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:C.gD,display:"flex",alignItems:"center",justifyContent:"center"}}><I s={18} k={C.grn}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></I></div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16,fontWeight:600}}>{act.n}</span><Pl sg={act.sg}/></div>
              <div style={{fontSize:13,color:C.t2}}>{act.b?`${act.b} · ${act.bt}`:`${act.t} · ${act.ci}`}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            {showTog&&<div style={{display:"flex",background:C.rs,borderRadius:10,padding:3,gap:3}}>{["gatekeeper","buyer"].map(m=><button key={m} onClick={()=>call.setMode(m as "gatekeeper"|"buyer")} style={{padding:"5px 14px",borderRadius:8,fontSize:12,fontWeight:600,border:"none",cursor:"pointer",background:mode===m?(m==="buyer"?C.gD:C.aD):"transparent",color:mode===m?(m==="buyer"?C.gT:C.aT):C.t3}}>{m==="gatekeeper"?"Gate":"Buyer"}</button>)}</div>}
            <div style={{textAlign:"right"}}><M c={C.grn} s={22}>{fmt(call.callDuration)}</M><div style={{fontSize:10,color:C.t3}}>Duration</div></div>
          </div>
        </div>
        <div style={{display:"flex",gap:16,marginTop:8,fontSize:12}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{color:C.t3}}>Calling:</span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:C.t1}}>{call.displayPhone||act.pp||act.ph}</span>
            <span style={{color:C.t3}}>· {call.phoneLabel}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{color:C.t3}}>From:</span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:C.t1}}>{call.currentCallerId||"Unknown"}</span>
          </div>
          {call.localTimeLabel&&<div style={{display:"flex",alignItems:"center",gap:5,marginLeft:"auto"}}><span style={{color:C.t1,fontWeight:500}}>{call.localTimeLabel}</span></div>}
        </div>
      </div>
      <div style={{flexShrink:0,padding:"8px 20px",background:C.bD,borderBottom:`1px solid ${C.bB}`,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:12,fontWeight:600,color:C.bT}}>IVR:</span>
        {[["2","Pro Shop"],["0","Operator"],["1","Tee Times"]].map(([d,lb])=><button key={d} onClick={()=>sendDtmf(d)} style={{padding:"5px 14px",borderRadius:8,background:C.bg,border:`1.5px solid ${C.bB}`,fontSize:13,fontWeight:600,cursor:"pointer",color:C.bT,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:5}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{d}</span> {lb}</button>)}
        <button onClick={()=>setPad(true)} style={{padding:"5px 10px",borderRadius:8,background:"transparent",border:`1px solid ${C.bB}`,fontSize:12,color:C.bT,cursor:"pointer"}}>Full dialpad</button>
        {call.dtmfDigits&&<span style={{marginLeft:"auto",fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:C.bT,fontWeight:600}}>Sent: {call.dtmfDigits}</span>}
      </div>
      {isGk&&<div style={{flexShrink:0,padding:"10px 20px",background:C.aD,borderBottom:`1px solid ${C.aB}`,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:11,fontWeight:600,color:C.aT,whiteSpace:"nowrap"}}>Quick capture:</span>
        <input placeholder="Buyer name" value={call.quickCapture.buyer_name} onChange={e=>call.setQuickCaptureField("buyer_name",e.target.value)} style={{flex:1,padding:"6px 10px",borderRadius:8,border:`1.5px solid ${C.aB}`,fontSize:13,fontFamily:"'DM Sans',sans-serif",background:C.bg,color:C.t1,minWidth:0}}/>
        <input placeholder="Title" value={call.quickCapture.buyer_title} onChange={e=>call.setQuickCaptureField("buyer_title",e.target.value)} style={{width:100,padding:"6px 10px",borderRadius:8,border:`1.5px solid ${C.aB}`,fontSize:13,fontFamily:"'DM Sans',sans-serif",background:C.bg,color:C.t1}}/>
        <input placeholder="Direct #" value={call.quickCapture.buyer_direct_phone} onChange={e=>call.setQuickCaptureField("buyer_direct_phone",e.target.value)} style={{width:110,padding:"6px 10px",borderRadius:8,border:`1.5px solid ${C.aB}`,fontSize:13,fontFamily:"'JetBrains Mono',monospace",background:C.bg,color:C.t1}}/>
        <input placeholder="Ext" value={call.quickCapture.ivr_direct_extension} onChange={e=>call.setQuickCaptureField("ivr_direct_extension",e.target.value)} style={{width:50,padding:"6px 10px",borderRadius:8,border:`1.5px solid ${C.aB}`,fontSize:13,fontFamily:"'JetBrains Mono',monospace",background:C.bg,color:C.t1,textAlign:"center"}}/>
        <select value={call.quickCapture.best_time_to_reach} onChange={e=>call.setQuickCaptureField("best_time_to_reach",e.target.value)} style={{padding:"6px 8px",borderRadius:8,border:`1.5px solid ${C.aB}`,fontSize:12,background:C.bg,color:C.t1}}><option value="">Best time...</option><option value="Morning">Morning</option><option value="Afternoon">Afternoon</option><option value="Anytime">Anytime</option></select>
        <button onClick={()=>call.saveQuickCapture()} style={{padding:"6px 14px",borderRadius:8,background:C.amb,border:"none",color:"white",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>Save</button>
      </div>}
      <div className="sb" style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div><Lb r={isGk?"Gate":"Buyer"}>{(STG[act.sg]||{}).l} script</Lb><div style={{background:C.sf,border:`1px solid ${C.bd}`,borderLeft:`3px solid ${accent}`,borderRadius:12,padding:"14px 16px",fontSize:13,lineHeight:1.7,color:C.t2}}>{script.map((s,i)=><div key={i}><div style={{fontWeight:600,color:accent===C.amb?C.aT:C.bT,fontSize:10,textTransform:"uppercase",margin:i===0?"0 0 5px":"12px 0 5px"}}>{s.t}</div><p style={{margin:0}}>{s.s.replace(/\[buyer\]/g,act.b||"[buyer]").replace(/\[color\]/g,act.sam?.co||"[color]")}</p></div>)}</div></div>
            <MCalc/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div><Lb>Notes</Lb><textarea value={call.notes} onChange={e=>call.setNotes(e.target.value)} placeholder="Type notes..." style={{width:"100%",minHeight:100,padding:"12px",background:C.sf,border:`1px solid ${C.bd}`,borderRadius:12,color:C.t1,fontFamily:"'DM Sans',sans-serif",fontSize:13,lineHeight:1.6,resize:"vertical",outline:"none"}}/></div>
            <div><Lb>{isGk?"Gate outcome":"Outcome"}</Lb><div style={{display:"flex",flexDirection:"column",gap:5}}>{disps.map(d=><button key={d.l} onClick={()=>{call.setDisposition(d.l);if((d as any).cap)setMod("sample");else if(d.l==="Placing order!")setMod("order");else void call.submitDisposition(d.l)}} style={{display:"flex",alignItems:"center",gap:8,padding:(d as any).p?"10px 12px":"8px 12px",borderRadius:10,border:`1.5px solid ${call.disposition===d.l?d.c:(d as any).p?d.c+"55":C.bd}`,background:call.disposition===d.l?d.c+"12":(d as any).p?d.c+"06":C.bg,color:C.t1,fontSize:12,fontWeight:(d as any).p?600:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textAlign:"left",width:"100%"}}><div style={{width:8,height:8,borderRadius:"50%",background:d.c}}/><div style={{flex:1}}><div>{d.l}</div><div style={{fontSize:10,color:C.t3}}>{d.a}</div></div>{(d as any).p&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:5,background:d.c+"18",color:d.c,fontWeight:700}}>WIN</span>}</button>)}</div></div>
          </div>
        </div>
      </div>
      <div style={{flexShrink:0,padding:"14px 24px 16px",background:C.sf,borderTop:`2px solid ${C.bd}`,display:"flex",alignItems:"center",justifyContent:"center",gap:16}}>
        <div style={{display:"flex",gap:3,alignItems:"center",height:24,marginRight:12}}>{[0,.1,.2,.3,.15,.25,.08,.22].map((d,i)=><div key={i} style={{width:3,borderRadius:2,background:C.grn,animation:`cmw .7s ${d}s ease-in-out infinite alternate`,height:10}}/>)}</div>
        <CB label="Mute" active={call.isMuted} onClick={()=>call.mute()}><I s={20} k={C.t2}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></I></CB>
        <CB label="Hold" onClick={()=>call.holdCall()}><I s={20} k={C.t2}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></I></CB>
        <CB big danger onClick={()=>call.endCall()}><I s={26} k="white"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="1" y1="1" x2="23" y2="23"/></I></CB>
        <CB label="Skip" onClick={()=>call.skipCurrent()}><I s={20} k={C.t2}><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></I></CB>
      </div>
    </div>
    <Intel/>
  </div>;
}

export default function CallMyntApp(){
  const {courses}=useCourses();
  const stats=useStats();
  const[pg,setPg]=useState("dialer");const[search,setSearch]=useState(false);const[notif,setNotif]=useState(false);const[selCourse,setSelCourse]=useState<CourseRow|null>(null);const[avDrop,setAvDrop]=useState(false);const[agSt,setAgSt]=useState("available");
  const nav=[{id:"dialer",lb:"Dialer",ic:<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>},{id:"courses",lb:"Courses",ic:<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>},{id:"campaigns",lb:"Campaigns",ic:<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>},{id:"samples",lb:"Samples",ic:<><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/></>},{id:"orders",lb:"Orders",ic:<><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>},{id:"calls",lb:"Calls",ic:<><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></>},{id:"coaching",lb:"Coach",ic:<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>},{id:"stats",lb:"Stats",ic:<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>},{id:"settings",lb:"Settings",ic:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>}];

  return <div style={{fontFamily:"'DM Sans',sans-serif",background:C.bg,color:C.t1,height:"100vh",display:"grid",gridTemplateColumns:"56px 1fr",gridTemplateRows:"52px 1fr",overflow:"hidden"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');@keyframes cmw{0%{height:4px}100%{height:18px}}@keyframes cmb{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.1;transform:scale(1.06)}}.sb::-webkit-scrollbar{width:4px}.sb::-webkit-scrollbar-track{background:transparent}.sb::-webkit-scrollbar-thumb{background:${C.ac};border-radius:4px}input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}`}</style>
    {search&&<SearchMod onClose={()=>setSearch(false)} courses={courses}/>}
    {notif&&<NotifDrop onClose={()=>setNotif(false)}/>}
    <div style={{gridColumn:"1/-1",display:"flex",alignItems:"center",padding:"0 16px",borderBottom:`1px solid ${C.bd}`,gap:12,position:"relative"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,fontWeight:700,fontSize:15}}><I s={20} k={C.grn}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></I><span>Call</span><span style={{color:C.grn}}>Mynt</span></div>
      <div style={{flex:1,display:"flex",justifyContent:"center",gap:6}}>{[["Dials",stats.dials],["Connects",stats.connects,C.grn],["Samples",stats.samples,C.pur],["Orders",stats.orders,C.blu]].map(([l,v,c])=><div key={String(l)} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",background:C.sf,borderRadius:8,border:`1px solid ${C.bd}`}}><span style={{fontSize:10,color:C.t3,textTransform:"uppercase",fontWeight:600}}>{l}</span><M s={13} c={c as string}>{v as number}</M></div>)}</div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button onClick={()=>setSearch(true)} style={{width:36,height:36,borderRadius:10,border:`1px solid ${C.bd}`,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><I s={16} k={C.t3}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></I></button>
        <button onClick={()=>setNotif(!notif)} style={{width:36,height:36,borderRadius:10,border:`1px solid ${C.bd}`,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}}><I s={16} k={C.t3}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></I><div style={{position:"absolute",top:6,right:6,width:8,height:8,borderRadius:"50%",background:C.red,border:"2px solid white"}}/></button>
        <div style={{position:"relative"}}>
          <button onClick={()=>{setAvDrop(!avDrop);setNotif(false)}} style={{width:32,height:32,borderRadius:"50%",background:C.bD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:C.bT,border:"none",cursor:"pointer",position:"relative"}}>AJ<div style={{position:"absolute",bottom:-1,right:-1,width:10,height:10,borderRadius:"50%",background:agSt==="available"?C.grn:agSt==="break"?C.amb:agSt==="dnd"?C.red:C.t3,border:"2px solid white"}}/></button>
          {avDrop&&<div style={{position:"absolute",top:42,right:0,width:260,background:C.bg,borderRadius:14,border:`1px solid ${C.bd}`,boxShadow:"0 12px 40px rgba(0,0,0,0.1)",zIndex:200,overflow:"hidden"}}>
            <div style={{padding:"16px 18px",borderBottom:`1px solid ${C.bd}`,display:"flex",alignItems:"center",gap:12}}><div style={{width:40,height:40,borderRadius:"50%",background:C.bD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:600,color:C.bT}}>AJ</div><div><div style={{fontSize:14,fontWeight:600}}>Alex Johnson</div><div style={{fontSize:12,color:C.t3}}>alex@byrdgang.com</div></div></div>
            <div style={{padding:"8px 10px",borderBottom:`1px solid ${C.bd}`}}>{[["available","Available",C.grn],["break","On Break",C.amb],["dnd","Do Not Disturb",C.red],["offline","Offline",C.t3]].map(([id,lb,co])=><button key={String(id)} onClick={()=>setAgSt(String(id))} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 10px",borderRadius:8,border:"none",background:agSt===id?C.sf:"transparent",cursor:"pointer",fontSize:13,color:C.t1,fontFamily:"'DM Sans',sans-serif"}}><div style={{width:8,height:8,borderRadius:"50%",background:String(co)}}/>{lb}{agSt===id&&<span style={{marginLeft:"auto",fontSize:11,color:C.grn}}>OK</span>}</button>)}</div>
            <div style={{padding:"6px 10px"}}>{[["My Profile","settings"],["Keyboard Shortcuts",null],["Help & Support",null],["Log Out",null]].map(([lb,pg2])=><button key={String(lb)} onClick={()=>{if(pg2){setPg(String(pg2))};setAvDrop(false)}} style={{display:"flex",alignItems:"center",width:"100%",padding:"9px 10px",borderRadius:8,border:"none",background:"transparent",cursor:"pointer",fontSize:13,color:lb==="Log Out"?C.red:C.t1,fontFamily:"'DM Sans',sans-serif"}}>{lb}</button>)}</div>
          </div>}
        </div>
      </div>
    </div>
    <div style={{background:C.sf,borderRight:`1px solid ${C.bd}`,display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 0",gap:2,overflowY:"auto"}}>
      {nav.filter(n=>n.id!=="settings").map(n=><button key={n.id} onClick={()=>{setPg(n.id);setSelCourse(null)}} title={n.lb} style={{width:38,height:38,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:"none",color:pg===n.id?C.grn:C.t3,background:pg===n.id?C.gD:"transparent"}}><I s={20} k={pg===n.id?C.grn:C.t3}>{n.ic}</I></button>)}
      <div style={{flex:1}}/>
      <button onClick={()=>{setPg("settings");setSelCourse(null)}} title="Settings" style={{width:38,height:38,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:"none",color:pg==="settings"?C.grn:C.t3,background:pg==="settings"?C.gD:"transparent"}}><I s={20} k={pg==="settings"?C.grn:C.t3}>{nav.find(n=>n.id==="settings")?.ic}</I></button>
    </div>
    <div style={{overflow:"hidden"}}>
      {pg==="dialer"&&<DialerP/>}
      {pg==="courses"&&!selCourse&&<CoursesP onSelect={c=>setSelCourse(c)}/>}
      {pg==="courses"&&selCourse&&<CourseDetail course={selCourse} onBack={()=>setSelCourse(null)}/>}
      {pg==="campaigns"&&<CampaignsP/>}
      {pg==="samples"&&<SamplesP/>}
      {pg==="orders"&&<OrdersP/>}
      {pg==="calls"&&<CallsP/>}
      {pg==="coaching"&&<CoachP/>}
      {pg==="stats"&&<StatsP/>}
      {pg==="settings"&&<SettingsP/>}
    </div>
  </div>;
}
