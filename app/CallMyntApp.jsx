import { useState, useEffect, useCallback } from "react";

/* ════════════════════════════════════════════════════
   CALLMYNT — Complete Application v4
   Light mode · All sections · All dialer states
   ════════════════════════════════════════════════════ */

const C={bg:"#FFFFFF",sf:"#F7F8FB",rs:"#EFF1F6",hv:"#E6E9F0",ac:"#DDE0E9",bd:"#E2E5ED",bdH:"#CDD1DB",t1:"#1A1D26",t2:"#5C6070",t3:"#9198A8",grn:"#10B981",gD:"#ECFDF5",gB:"#A7F3D0",gT:"#065F46",blu:"#3B82F6",bD:"#EFF6FF",bB:"#BFDBFE",bT:"#1E40AF",amb:"#F59E0B",aD:"#FFFBEB",aB:"#FDE68A",aT:"#92400E",red:"#EF4444",rD:"#FEF2F2",rB:"#FECACA",rT:"#991B1B",pur:"#8B5CF6",pD:"#F5F3FF",pB:"#DDD6FE",pT:"#5B21B6",org:"#F97316",oD:"#FFF7ED",oB:"#FED7AA",oT:"#9A3412",cyn:"#06B6D4"};
const STG={cold_list:{l:"Cold list",c:C.t3,bg:C.rs,bd:C.bd,ic:"\uD83D\uDCDE"},buyer_identified:{l:"Buyer ID'd",c:C.bT,bg:C.bD,bd:C.bB,ic:"\uD83C\uDFAF"},sending_sample:{l:"Sent",c:C.pT,bg:C.pD,bd:C.pB,ic:"\uD83D\uDCE6"},sample_follow_up:{l:"Follow up",c:C.oT,bg:C.oD,bd:C.oB,ic:"\uD83D\uDD25"},first_order:{l:"Ordered",c:C.gT,bg:C.gD,bd:C.gB,ic:"\u2705"},reorder:{l:"Reorder",c:"#0E7490",bg:"#ECFEFF",bd:"#A5F3FC",ic:"\uD83D\uDD04"}};

const CO=[
  {id:1,n:"Riverside Golf Club",t:"Public",ci:"Draper",st:"UT",ph:"(801) 555-0140",pp:"(801) 555-0141",b:"Mike Thompson",bt:"Head Pro",bs:"XL",bp:"(801) 555-0142",be:"mike@riversidegc.com",sg:"sample_follow_up",att:4,sam:{s:"delivered",sz:"XL",co:"Navy",sh:"Mar 29",de:"Apr 1"},qs:"live"},
  {id:2,n:"Eagle Ridge GC",t:"Semi-Priv",ci:"Lehi",st:"UT",ph:"(801) 555-0200",sg:"cold_list",att:0,qs:"ringing"},
  {id:3,n:"Sunbrook Golf Course",t:"Public",ci:"St. George",st:"UT",ph:"(435) 555-0300",b:"Jeff Willis",bt:"Pro Shop Mgr",sg:"buyer_identified",att:2,qs:"queued"},
  {id:4,n:"Valley View Golf",t:"Municipal",ci:"Layton",st:"UT",ph:"(801) 555-0400",sg:"cold_list",att:1,qs:"queued"},
  {id:5,n:"Thanksgiving Point GC",t:"Public",ci:"Lehi",st:"UT",b:"Sarah Chen",bt:"Retail Mgr",bs:"M",sg:"first_order",att:6,sam:{s:"converted"},ord:[{d:"Mar 18",u:36,t:"$900"}],qs:"done",ct:"3:22"},
  {id:6,n:"Fox Hollow GC",t:"Public",ci:"Am. Fork",st:"UT",b:"Dave Martinez",bt:"PGA Pro",bs:"L",sg:"sending_sample",att:3,sam:{s:"in_transit",sz:"L",co:"Forest",sh:"Mar 31"},qs:"queued"},
  {id:7,n:"Hobble Creek Golf",t:"Public",ci:"Springville",st:"UT",ph:"(801) 555-0600",sg:"cold_list",att:0,qs:"queued"},
  {id:8,n:"Stonebridge GC",t:"Private",ci:"W. Valley",st:"UT",ph:"(801) 555-0800",sg:"cold_list",att:0,qs:"queued"},
  {id:9,n:"The Ledges GC",t:"Semi-Priv",ci:"St. George",st:"UT",b:"Tom Reeves",bt:"Dir. Golf",sg:"reorder",att:8,ord:[{d:"Feb 10",u:48,t:"$1,200"},{d:"Mar 22",u:24,t:"$600"}],qs:"queued"},
  {id:10,n:"Wasatch State Park GC",t:"Public",ci:"Midway",st:"UT",ph:"(435) 555-0900",sg:"cold_list",att:2,qs:"queued"},
];
const CAMPS=[{id:1,n:"Cold List — Utah",sg:"cold_list",ct:142,m:"power"},{id:2,n:"Buyer Follow-ups",sg:"buyer_identified",ct:23,m:"preview"},{id:3,n:"Sample Follow-ups",sg:"sample_follow_up",ct:8,m:"power"},{id:4,n:"Reorder Check-ins",sg:"reorder",ct:4,m:"preview"}];
const HIST=[{d:"Mar 28",w:"Gatekeeper",o:"Got buyer name",n:"In before 9am"},{d:"Mar 25",w:"VM",o:"Left voicemail"},{d:"Mar 20",w:"Gatekeeper",o:"No buyer avail",n:"Try mornings"},{d:"Mar 15",w:"VM",o:"Left voicemail"}];
const RECS=[{id:1,co:"Riverside Golf Club",b:"Mike Thompson",ag:"Alex",dt:"Mar 28",dur:"2:34",dp:"Got buyer name",sc:78,sp:"Gatekeeper"},{id:2,co:"Thanksgiving Point",b:"Sarah Chen",ag:"Alex",dt:"Mar 15",dur:"4:12",dp:"Placing order",sc:94,sp:"Buyer"},{id:3,co:"Eagle Ridge GC",ag:"Jordan",dt:"Mar 27",dur:"0:45",dp:"No answer",sp:null},{id:4,co:"Fox Hollow GC",b:"Dave Martinez",ag:"Alex",dt:"Mar 30",dur:"3:08",dp:"Sending sample",sc:82,sp:"Buyer"},{id:5,co:"Sunbrook GC",b:"Jeff Willis",ag:"Jordan",dt:"Mar 25",dur:"1:22",dp:"Got buyer name",sc:71,sp:"Gate"},{id:6,co:"The Ledges GC",b:"Tom Reeves",ag:"Alex",dt:"Mar 22",dur:"2:55",dp:"Placing order",sc:91,sp:"Buyer"}];
const SAMPS=[{id:1,co:"Riverside Golf Club",b:"Mike Thompson",sz:"XL",cl:"Navy",s:"delivered",sh:"Mar 29",de:"Apr 1",ag:"Alex",fu:"Apr 3",done:false},{id:2,co:"Fox Hollow GC",b:"Dave Martinez",sz:"L",cl:"Forest",s:"in_transit",sh:"Mar 31",ag:"Alex",fu:null,done:false},{id:3,co:"Thanksgiving Point",b:"Sarah Chen",sz:"M",cl:"Charcoal",s:"converted",sh:"Mar 5",de:"Mar 8",ag:"Alex",fu:"Mar 10",done:true,amt:"$900"},{id:4,co:"The Ledges GC",b:"Tom Reeves",sz:"L",cl:"Navy",s:"converted",sh:"Jan 28",de:"Feb 1",ag:"Alex",fu:"Feb 3",done:true,amt:"$1,200"}];
const ORDS=[{id:1001,co:"Thanksgiving Point GC",b:"Sarah Chen",dt:"Mar 18",items:"36 units — Navy, Charcoal",tot:"$900",pay:"Paid",ful:"Delivered",ag:"Alex"},{id:1002,co:"The Ledges GC",b:"Tom Reeves",dt:"Mar 22",items:"24 units — Navy",tot:"$600",pay:"Paid",ful:"Shipped",ag:"Alex"},{id:1003,co:"The Ledges GC",b:"Tom Reeves",dt:"Feb 10",items:"48 units — Navy, Forest",tot:"$1,200",pay:"Paid",ful:"Delivered",ag:"Alex"}];
const PRODS=[
  {id:"p1",n:"Performance Polo",colors:["Navy","Charcoal","Forest","Black","White"],price:25,img:"👔"},
  {id:"p2",n:"Quarter Zip Pullover",colors:["Navy","Charcoal","Black","Heather Grey"],price:35,img:"🧥"},
  {id:"p3",n:"Dry-Fit Polo",colors:["Navy","White","Forest","Royal Blue"],price:25,img:"👕"},
  {id:"p4",n:"Lightweight Vest",colors:["Black","Navy","Charcoal"],price:40,img:"🦺"},
  {id:"p5",n:"Performance Hoodie",colors:["Black","Navy","Charcoal","Forest"],price:45,img:"🧶"},
  {id:"p6",n:"Classic Polo",colors:["Navy","White","Black","Charcoal","Red","Royal Blue"],price:22,img:"👔"},
  {id:"p7",n:"Moisture-Wick Tee",colors:["White","Black","Navy","Heather Grey"],price:18,img:"👕"},
  {id:"p8",n:"Wind Jacket",colors:["Black","Navy"],price:50,img:"🧥"},
];
const NOTIFS=[{t:"Sample delivered",s:"Riverside Golf Club — follow up due Apr 3",tm:"2h ago",tp:"sample"},{t:"Voicemail received",s:"Fox Hollow GC — Dave wants to place an order",tm:"4h ago",tp:"vm"},{t:"Order payment received",s:"The Ledges GC — $600 for Order #1002",tm:"1d ago",tp:"order"},{t:"Coaching report",s:"Weekly coaching notes available",tm:"1d ago",tp:"coach"},{t:"Follow-up overdue",s:"Riverside Golf Club — 2 days late",tm:"2d ago",tp:"overdue"}];

const SC={cold_gk:[{t:"Opening",s:"\"Hi, I'm [name] with BYRDGANG — performance golf polos. Can I speak with whoever handles pro shop merchandise?\""},{t:"Get name",s:"\"Could I get their name so I can call back directly?\""}],cold_buyer:[{t:"Opening",s:"\"Hi [buyer], I'm [name] with BYRDGANG. We wholesale at $25 — pro shops sell at $49\u201359 for 100%+ margin.\""},{t:"Close",s:"\"I'd love to send a free polo. What size do you wear?\""},{t:"Address",s:"\"Perfect — best address? The pro shop directly?\""}],followup:[{t:"Opening",s:"\"Hey [buyer], it's [name] from BYRDGANG. Did that [color] polo arrive?\""},{t:"Close",s:"\"Most shops start with 24\u201348 units. At $25, 100% margin at $49. Want a starter order?\""}]};
const DGK=[{l:"Got buyer name",c:C.blu,a:"\u2192 Stage 2"},{l:"Left msg",c:C.amb,a:"Retry 2d"},{l:"No buyer avail",c:C.t3,a:"Retry tmrw"}];
const DBY=[{l:"Sending sample",c:C.grn,a:"\u2192 Ship polo",p:1,cap:1},{l:"Call back",c:C.amb,a:"Schedule"},{l:"Not interested",c:C.red,a:"90d retry"}];
const DFU=[{l:"Placing order!",c:C.grn,a:"\u2192 Create order",p:1},{l:"Needs time",c:C.blu,a:"7d follow-up"},{l:"Not received",c:C.amb,a:"Check tracking"},{l:"Not interested",c:C.red,a:"120d retry"}];
const DSH=[{l:"Left VM",c:C.t3,a:"VM dropped"},{l:"No answer",c:C.t3,a:"Retry"},{l:"Bad #",c:C.red,a:"Remove"}];

// ═══ SHARED COMPONENTS ═══
function I({children,s=20,k=C.t2,w=2}){return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={k} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">{children}</svg>}
function Pl({sg}){const m=STG[sg]||STG.cold_list;return <span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:999,background:m.bg,color:m.c,border:`1px solid ${m.bd}`,whiteSpace:"nowrap"}}>{m.l}</span>}
function M({children,c,s=13}){return <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:s,fontWeight:600,color:c||C.t1}}>{children}</span>}
function Rw({l,v,c,last}){return <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:last?"none":`1px solid ${C.rs}`,fontSize:14}}><span style={{color:C.t3}}>{l}</span><span style={{fontWeight:500,color:c||C.t1}}>{v}</span></div>}
function Cd({children,s={}}){return <div style={{background:C.bg,border:`1px solid ${C.bd}`,borderRadius:14,padding:"16px 18px",...s}}>{children}</div>}
function Lb({children,r}){return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:12,fontWeight:600,color:C.t3,textTransform:"uppercase",letterSpacing:"0.5px"}}>{children}</span>{r&&<span style={{fontSize:12,color:C.t3}}>{r}</span>}</div>}
function Btn({children,primary,danger,onClick,full}){return <button onClick={onClick} style={{padding:primary?"14px 24px":"10px 18px",borderRadius:12,border:primary||danger?"none":`1.5px solid ${C.bd}`,background:danger?C.red:primary?C.grn:C.bg,color:danger||primary?"white":C.t1,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",width:full?"100%":"auto",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{children}</button>}
function CB({children,label,big,danger,active,onClick}){return <button onClick={onClick} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer"}}><div style={{width:big?68:52,height:big?68:52,borderRadius:"50%",background:danger?C.red:active?C.bD:C.sf,border:`1.5px solid ${danger?C.red:active?C.bB:C.bd}`,display:"flex",alignItems:"center",justifyContent:"center",color:danger?"white":active?C.blu:C.t2}}>{children}</div>{label&&<span style={{fontSize:11,color:danger?C.red:C.t3,fontWeight:500}}>{label}</span>}</button>}
function Tab({tabs,active,onChange}){return <div style={{display:"flex",gap:0,borderBottom:`1px solid ${C.bd}`,marginBottom:16}}>{tabs.map(t=><button key={t} onClick={()=>onChange(t)} style={{padding:"10px 20px",fontSize:13,fontWeight:600,border:"none",borderBottom:active===t?`2px solid ${C.grn}`:"2px solid transparent",color:active===t?C.grn:C.t3,background:"transparent",cursor:"pointer"}}>{t}</button>)}</div>}
function Stat({label,value,color}){return <div style={{background:C.bg,borderRadius:14,border:`1px solid ${C.bd}`,padding:"18px 20px"}}><div style={{fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}}>{label}</div><M s={26} c={color}>{value}</M></div>}
function TH({children}){return <div style={{display:"grid",gridTemplateColumns:children,padding:"12px 20px",borderBottom:`1px solid ${C.bd}`,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:600,background:C.sf}}/>}

// ═══ MARGIN CALCULATOR ═══
function MCalc(){const[r,setR]=useState(49);const[q,setQ]=useState(24);const mg=r-25;return <div style={{background:C.gD,border:`1px solid ${C.gB}`,borderRadius:14,padding:"16px 18px"}}><div style={{fontSize:12,fontWeight:700,color:C.gT,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Margin calculator</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 14px",fontSize:14}}><span style={{color:C.t3}}>Wholesale</span><M>$25</M><span style={{color:C.t3}}>Sell at</span><div style={{display:"flex",gap:4,alignItems:"center"}}><span style={{color:C.t3}}>$</span><input type="number" value={r} onChange={e=>setR(+e.target.value||0)} style={{width:52,padding:"5px 6px",background:C.bg,border:`1.5px solid ${C.gB}`,borderRadius:8,color:C.gT,fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:700,textAlign:"center"}}/></div><span style={{color:C.t3}}>Margin</span><M c={C.grn}>${mg} ({Math.round((mg/25)*100)}%)</M><span style={{color:C.t3}}>Qty</span><div style={{display:"flex",gap:4,alignItems:"center"}}><input type="number" value={q} onChange={e=>setQ(+e.target.value||0)} style={{width:48,padding:"5px",background:C.bg,border:`1.5px solid ${C.gB}`,borderRadius:8,color:C.t1,fontFamily:"'JetBrains Mono',monospace",fontSize:15,textAlign:"center"}}/><span style={{color:C.t3,fontSize:12}}>units</span></div><span style={{color:C.gT,fontWeight:600}}>Profit</span><M c={C.grn} s={16}>${(q*mg).toLocaleString()}</M></div></div>}

// ═══ SAMPLE MODAL ═══
function SamMod({c,onClose,onDone}){const[sz,setSz]=useState(c?.bs||"");const[cl,setCl]=useState("Navy");const[ad,setAd]=useState("");return <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}}><div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.25)"}}/><div style={{position:"relative",background:C.bg,borderRadius:20,padding:"28px 32px",width:440,maxWidth:"92vw",boxShadow:"0 20px 60px rgba(0,0,0,0.12)"}}><div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Ship free sample</div><div style={{fontSize:15,color:C.t2,marginBottom:24}}>{c?.n}{c?.b?` — ${c.b}`:""}</div><div style={{fontSize:13,fontWeight:600,color:C.t2,marginBottom:8}}>Size</div><div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:20}}>{["S","M","L","XL","XXL"].map(s=><button key={s} onClick={()=>setSz(s)} style={{padding:"14px 0",borderRadius:12,fontSize:16,fontWeight:700,background:sz===s?C.gD:C.sf,color:sz===s?C.gT:C.t3,border:`2px solid ${sz===s?C.gB:C.bd}`,cursor:"pointer"}}>{s}</button>)}</div><div style={{fontSize:13,fontWeight:600,color:C.t2,marginBottom:8}}>Color</div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>{["Navy","Charcoal","Forest","Black","White"].map(c2=><button key={c2} onClick={()=>setCl(c2)} style={{padding:"12px 20px",borderRadius:12,fontSize:14,fontWeight:500,background:cl===c2?C.bD:C.sf,color:cl===c2?C.bT:C.t3,border:`2px solid ${cl===c2?C.bB:C.bd}`,cursor:"pointer"}}>{c2}</button>)}</div><div style={{fontSize:13,fontWeight:600,color:C.t2,marginBottom:8}}>Ship to</div><textarea value={ad} onChange={e=>setAd(e.target.value)} placeholder="Pro shop address..." rows={2} style={{width:"100%",padding:"14px",background:C.sf,border:`1.5px solid ${C.bd}`,borderRadius:14,color:C.t1,fontSize:15,fontFamily:"'DM Sans',sans-serif",resize:"none",marginBottom:20}}/><Btn primary full onClick={()=>onDone({sz,cl,ad})}>Ship sample via Shopify</Btn><div style={{height:8}}/><Btn full onClick={onClose}>Cancel</Btn></div></div>}

// ═══ ORDER MODAL ═══
function OrdMod({c,onClose,onDone}){const[q,setQ]=useState(24);const sizes=["S","M","L","XL","XXL"];const[grid,setGrid]=useState(Object.fromEntries(sizes.map(s=>[s,0])));const tot=Object.values(grid).reduce((a,b)=>a+b,0);const setS=(s,v)=>setGrid(g=>({...g,[s]:Math.max(0,v)}));return <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}}><div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.25)"}}/><div style={{position:"relative",background:C.bg,borderRadius:20,padding:"28px 32px",width:500,maxWidth:"92vw",boxShadow:"0 20px 60px rgba(0,0,0,0.12)"}}><div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Create wholesale order</div><div style={{fontSize:15,color:C.t2,marginBottom:24}}>{c?.n}{c?.b?` — ${c.b}`:""}</div><div style={{fontSize:13,fontWeight:600,color:C.t2,marginBottom:10}}>Quantities by size (Navy)</div><div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:16}}>{sizes.map(s=><div key={s} style={{textAlign:"center"}}><div style={{fontSize:12,color:C.t3,marginBottom:6}}>{s}</div><input type="number" value={grid[s]} onChange={e=>setS(s,+e.target.value||0)} style={{width:"100%",padding:"10px 4px",borderRadius:10,border:`1.5px solid ${C.bd}`,background:C.sf,fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:600,textAlign:"center",color:C.t1}}/></div>)}</div><div style={{display:"flex",justifyContent:"space-between",padding:"14px 0",borderTop:`1px solid ${C.bd}`,borderBottom:`1px solid ${C.bd}`,marginBottom:16}}><span style={{fontSize:15,color:C.t2}}>Total: <M s={16}>{tot} units</M></span><span style={{fontSize:15}}><M s={16} c={C.grn}>${(tot*25).toLocaleString()}</M> <span style={{color:C.t3}}>@ $25/unit</span></span></div><div style={{fontSize:13,fontWeight:600,color:C.t2,marginBottom:8}}>Payment terms</div><div style={{display:"flex",gap:8,marginBottom:20}}>{["Net 30","Credit card","Pay now"].map((p,i)=><button key={p} style={{flex:1,padding:"10px",borderRadius:10,border:`1.5px solid ${i===0?C.bB:C.bd}`,background:i===0?C.bD:C.bg,color:i===0?C.bT:C.t2,fontSize:13,fontWeight:600,cursor:"pointer"}}>{p}</button>)}</div><Btn primary full onClick={()=>onDone(grid)}>Create Shopify order — ${(tot*25).toLocaleString()}</Btn><div style={{height:8}}/><Btn full onClick={onClose}>Cancel</Btn></div></div>}

// ═══ SEARCH MODAL ═══
function SearchMod({onClose}){const[q,setQ]=useState("");const results=q.length>1?CO.filter(c=>c.n.toLowerCase().includes(q.toLowerCase())||(c.b||"").toLowerCase().includes(q.toLowerCase())):[];return <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:80}}><div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.2)"}}/><div style={{position:"relative",background:C.bg,borderRadius:16,width:560,maxWidth:"92vw",boxShadow:"0 20px 60px rgba(0,0,0,0.15)",overflow:"hidden"}}><div style={{padding:"16px 20px",borderBottom:`1px solid ${C.bd}`}}><input autoFocus type="text" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search courses, buyers, calls..." style={{width:"100%",padding:"12px 16px",borderRadius:12,border:`1.5px solid ${C.bd}`,background:C.sf,fontSize:16,fontFamily:"'DM Sans',sans-serif",color:C.t1,outline:"none"}}/></div><div style={{maxHeight:400,overflowY:"auto"}}>{q.length<2?<div style={{padding:32,textAlign:"center",color:C.t3}}>Type to search across courses, buyers, and calls</div>:results.length===0?<div style={{padding:32,textAlign:"center",color:C.t3}}>No results for "{q}"</div>:<div>{results.map(c=><div key={c.id} onClick={onClose} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 20px",borderBottom:`1px solid ${C.rs}`,cursor:"pointer"}}><div style={{width:36,height:36,borderRadius:10,background:STG[c.sg]?.bg||C.sf,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{STG[c.sg]?.ic||"⛳"}</div><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{c.n}</div><div style={{fontSize:12,color:C.t3}}>{c.b||"No buyer"} · {c.ci}, {c.st}</div></div><Pl sg={c.sg}/></div>)}</div>}</div></div></div>}

// ═══ NOTIFICATIONS ═══
function NotifDrop({onClose}){return <div style={{position:"absolute",top:52,right:16,width:380,background:C.bg,borderRadius:16,border:`1px solid ${C.bd}`,boxShadow:"0 12px 40px rgba(0,0,0,0.1)",zIndex:200,overflow:"hidden"}}><div style={{padding:"14px 18px",borderBottom:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between"}}><span style={{fontSize:14,fontWeight:600}}>Notifications</span><button onClick={onClose} style={{fontSize:12,color:C.blu,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Mark all read</button></div><div style={{maxHeight:380,overflowY:"auto"}}>{NOTIFS.map((n,i)=><div key={i} style={{padding:"14px 18px",borderBottom:`1px solid ${C.rs}`,cursor:"pointer"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:600}}>{n.t}</span><span style={{fontSize:11,color:C.t3}}>{n.tm}</span></div><div style={{fontSize:13,color:C.t2}}>{n.s}</div></div>)}</div></div>}

// ═══════════════════════════════════════
//  PAGES
// ═══════════════════════════════════════

// ── COURSES ──
function CoursesP({onSelect}){
  const[f,setF]=useState("all");const[s,setS]=useState("");const[fSt,setFSt]=useState("all");const[fTy,setFTy]=useState("all");const[fBu,setFBu]=useState("all");const[fSam,setFSam]=useState("all");const[fAtt,setFAtt]=useState("all");
  const cts=Object.fromEntries(Object.keys(STG).map(k=>[k,CO.filter(c=>c.sg===k).length]));
  const fl=CO.filter(c=>(f==="all"||c.sg===f)&&(fSt==="all"||c.st===fSt)&&(fTy==="all"||c.t===fTy)&&(fBu==="all"||(fBu==="yes"?c.b:!c.b))&&(fSam==="all"||(fSam==="has"?c.sam:fSam==="delivered"?c.sam?.s==="delivered":fSam==="none"?!c.sam:true))&&(fAtt==="all"||(fAtt==="0"?c.att===0:fAtt==="1-3"?c.att>=1&&c.att<=3:fAtt==="4+"?c.att>=4:true))&&(c.n.toLowerCase().includes(s.toLowerCase())||(c.b||"").toLowerCase().includes(s.toLowerCase())||(c.ci||"").toLowerCase().includes(s.toLowerCase())));
  const activeFilters=[fSt,fTy,fBu,fSam,fAtt].filter(f=>f!=="all").length;
  const clearAll=()=>{setF("all");setFSt("all");setFTy("all");setFBu("all");setFSam("all");setFAtt("all");setS("")};
  const states=[...new Set(CO.map(c=>c.st))].sort();
  const types=[...new Set(CO.map(c=>c.t))].sort();
  const Sel=({value,onChange,children,active})=><select value={value} onChange={e=>onChange(e.target.value)} style={{padding:"7px 10px",borderRadius:8,border:`1.5px solid ${active?C.bB:C.bd}`,fontSize:12,color:active?C.bT:C.t2,background:active?C.bD:C.bg,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>{children}</select>;
return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
    <div><div style={{fontSize:22,fontWeight:700}}>Golf courses</div><div style={{fontSize:14,color:C.t2,marginTop:2}}><M s={14} c={C.t1}>{fl.length}</M> of {CO.length} courses{activeFilters>0&&<span style={{color:C.blu,marginLeft:6}}>· {activeFilters} filter{activeFilters>1?"s":""} active</span>}</div></div>
    <input type="text" placeholder="Search name, buyer, city..." value={s} onChange={e=>setS(e.target.value)} style={{padding:"10px 16px",borderRadius:12,border:`1.5px solid ${C.bd}`,background:C.bg,color:C.t1,fontSize:14,fontFamily:"'DM Sans',sans-serif",width:260,outline:"none"}}/>
  </div>
  {/* Single unified filter bar */}
  <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
    <button onClick={()=>setF("all")} style={{padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:600,border:`1.5px solid ${f==="all"?C.gB:C.bd}`,background:f==="all"?C.gD:C.bg,color:f==="all"?C.gT:C.t2,cursor:"pointer"}}>All ({CO.length})</button>
    {Object.entries(STG).map(([k,v])=><button key={k} onClick={()=>setF(k)} style={{padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:600,border:`1.5px solid ${f===k?v.bd:C.bd}`,background:f===k?v.bg:C.bg,color:f===k?v.c:C.t2,cursor:"pointer"}}>{v.ic} {v.l} ({cts[k]||0})</button>)}
    <div style={{width:1,height:24,background:C.bd,margin:"0 4px"}}/>
    <Sel value={fSt} onChange={setFSt} active={fSt!=="all"}><option value="all">All states</option>{states.map(st=><option key={st} value={st}>{st}</option>)}</Sel>
    <Sel value={fTy} onChange={setFTy} active={fTy!=="all"}><option value="all">All types</option>{types.map(t=><option key={t} value={t}>{t}</option>)}</Sel>
    <Sel value={fBu} onChange={setFBu} active={fBu!=="all"}><option value="all">Buyer: any</option><option value="yes">Has buyer</option><option value="no">No buyer</option></Sel>
    <Sel value={fSam} onChange={setFSam} active={fSam!=="all"}><option value="all">Sample: any</option><option value="has">Has sample</option><option value="delivered">Delivered</option><option value="none">No sample</option></Sel>
    <Sel value={fAtt} onChange={setFAtt} active={fAtt!=="all"}><option value="all">Attempts: any</option><option value="0">Never contacted</option><option value="1-3">1-3 attempts</option><option value="4+">4+ attempts</option></Sel>
    {activeFilters>0&&<button onClick={clearAll} style={{padding:"7px 12px",borderRadius:8,border:"none",background:"transparent",color:C.red,fontSize:12,fontWeight:600,cursor:"pointer"}}>✕ Clear</button>}
  </div>
  {/* Results */}
  <Cd s={{padding:0,overflow:"hidden"}}>
    <div style={{display:"grid",gridTemplateColumns:"2.5fr 1fr 1fr 1.2fr 1fr 70px",padding:"12px 20px",borderBottom:`1px solid ${C.bd}`,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:600,background:C.sf}}>
      <span>Course</span><span>Stage</span><span>Type</span><span>Buyer</span><span>Sample</span><span>Calls</span>
    </div>
    {fl.length===0?<div style={{padding:40,textAlign:"center",color:C.t3}}>No courses match your filters. <button onClick={clearAll} style={{color:C.blu,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>Clear filters</button></div>:fl.map(c=><div key={c.id} onClick={()=>onSelect(c)} style={{display:"grid",gridTemplateColumns:"2.5fr 1fr 1fr 1.2fr 1fr 70px",padding:"14px 20px",borderBottom:`1px solid ${C.rs}`,alignItems:"center",fontSize:14,cursor:"pointer"}}>
      <div><div style={{fontWeight:600}}>{c.n}</div><div style={{fontSize:12,color:C.t3}}>{c.ci}, {c.st}{c.ph?` · ${c.ph}`:""}</div></div>
      <Pl sg={c.sg}/>
      <span style={{fontSize:13,color:C.t2}}>{c.t}</span>
      <span style={{color:c.b?C.t1:C.t3}}>{c.b||"—"}</span>
      <span style={{fontSize:12,fontWeight:500,color:c.sam?c.sam.s==="delivered"?C.oT:c.sam.s==="in_transit"?C.pT:c.sam.s==="converted"?C.gT:C.t3:C.t3}}>{c.sam?c.sam.s==="delivered"?"Delivered":c.sam.s==="in_transit"?"Transit":"Converted":"—"}</span>
      <M s={13} c={C.t2}>{c.att}</M>
    </div>)}
  </Cd>
</div>}

// ── COURSE DETAIL ──
function CourseDetail({course:c,onBack}){const[tab,setTab]=useState("Overview");const[ordering,setOrdering]=useState(false);const[prodSearch,setProdSearch]=useState("");const[cart,setCart]=useState([]);const[payTerms,setPayTerms]=useState("net30");
  const sizes=["S","M","L","XL","XXL","2XL","3XL"];
  const addToCart=(prod,color)=>{const key=`${prod.id}-${color}`;if(!cart.find(i=>i.key===key))setCart([...cart,{key,prod,color,sizes:Object.fromEntries(sizes.map(s=>[s,0]))}])};
  const updateQty=(key,size,val)=>setCart(cart.map(i=>i.key===key?{...i,sizes:{...i.sizes,[size]:Math.max(0,val)}}:i));
  const removeItem=(key)=>setCart(cart.filter(i=>i.key!==key));
  const cartUnits=cart.reduce((t,i)=>t+Object.values(i.sizes).reduce((a,b)=>a+b,0),0);
  const cartTotal=cart.reduce((t,i)=>t+Object.values(i.sizes).reduce((a,b)=>a+b,0)*i.prod.price,0);
  const filteredProds=PRODS.filter(p=>p.n.toLowerCase().includes(prodSearch.toLowerCase()));

  return <div className="sb" style={{height:"100%",overflowY:"auto"}}><div style={{padding:"20px 28px",borderBottom:`1px solid ${C.bd}`,background:C.sf}}><button onClick={onBack} style={{fontSize:13,color:C.blu,background:"none",border:"none",cursor:"pointer",marginBottom:12,fontWeight:600}}>&larr; Back to courses</button><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:24,fontWeight:700}}>{c.n}</span><Pl sg={c.sg}/></div><div style={{fontSize:15,color:C.t2,marginTop:4}}>{c.t} · {c.ci}, {c.st}{c.ph?` · ${c.ph}`:""}</div></div><div style={{display:"flex",gap:8}}><Btn primary>Call now</Btn><Btn>Send SMS</Btn><Btn>Edit</Btn></div></div></div>
<div style={{padding:"0 28px 28px"}}><Tab tabs={["Overview","Activity","Calls","Samples","Orders","AI"]} active={tab} onChange={setTab}/>
{tab==="Overview"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
<Cd><Lb>Course info</Lb>{[["Name",c.n],["Type",c.t],["City",`${c.ci}, ${c.st}`],["Phone",c.ph||"—"],["Pro shop",c.pp||"—"]].map(([l,v],i,a)=><Rw key={l} l={l} v={v} c={l.includes("hone")?C.blu:null} last={i===a.length-1}/>)}</Cd>
<Cd><Lb>{c.b?"Buyer":"Buyer — unknown"}</Lb>{c.b?[["Name",c.b],["Title",c.bt||"—"],["Direct",c.bp||"—"],["Email",c.be||"—"],["Size",c.bs||"—"]].map(([l,v],i,a)=><Rw key={l} l={l} v={v} c={l==="Email"&&v!=="—"?C.blu:l==="Size"&&v!=="—"?C.grn:null} last={i===a.length-1}/>):<div style={{fontSize:14,color:C.t3,fontStyle:"italic"}}>No buyer identified yet. Ask the gatekeeper for the merchandise buyer's name.</div>}</Cd>
{c.sam&&<Cd s={{gridColumn:"1/-1",background:c.sam.s==="delivered"?C.oD:c.sam.s==="in_transit"?C.pD:C.gD,border:`1px solid ${c.sam.s==="delivered"?C.oB:c.sam.s==="in_transit"?C.pB:C.gB}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:700,fontSize:15,color:c.sam.s==="delivered"?C.oT:c.sam.s==="in_transit"?C.pT:C.gT}}>{c.sam.s==="delivered"?"✓ Sample delivered":c.sam.s==="in_transit"?"📦 In transit":"✅ Converted to order"}</div><div style={{fontSize:14,color:C.t2,marginTop:4}}>{c.sam.co||""} {c.sam.sz||""} · Shipped {c.sam.sh||"—"}{c.sam.de?` · Delivered ${c.sam.de}`:""}</div></div>{c.sam.s==="delivered"&&<Btn primary>Schedule follow-up</Btn>}</div></Cd>}
<Cd s={{gridColumn:"1/-1"}}><Lb>Pipeline timeline</Lb><div style={{display:"flex",gap:8,alignItems:"center"}}>{Object.entries(STG).map(([k,v],i)=>{const active=k===c.sg;const passed=Object.keys(STG).indexOf(k)<Object.keys(STG).indexOf(c.sg);return <div key={k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}><div style={{width:"100%",height:6,borderRadius:3,background:passed?C.grn:active?C.blu:C.rs}}/><span style={{fontSize:11,fontWeight:600,color:active?C.bT:passed?C.gT:C.t3}}>{v.l}</span></div>})}</div></Cd>
</div>}
{tab==="Activity"&&<div style={{maxWidth:640}}><Lb>All activity</Lb>{HIST.map((h,i)=><div key={i} style={{display:"flex",gap:14,padding:"16px 0",borderBottom:`1px solid ${C.rs}`}}><div style={{width:36,height:36,borderRadius:10,background:h.w==="Gatekeeper"?C.aD:h.w==="VM"?C.pD:C.bD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{h.w==="Gatekeeper"?"🏢":h.w==="VM"?"📱":"📞"}</div><div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600,fontSize:14}}>{h.o}</span><span style={{fontSize:12,color:C.t3}}>{h.d}</span></div><div style={{fontSize:13,color:C.t2,marginTop:2}}>Spoke to: {h.w}</div>{h.n&&<div style={{fontSize:13,color:C.t3,fontStyle:"italic",marginTop:4}}>{h.n}</div>}</div></div>)}</div>}
{tab==="Calls"&&<div><Lb r={`${c.att} total`}>Call recordings</Lb>{HIST.map((h,i)=><Cd key={i} s={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div><span style={{fontWeight:600}}>{h.o}</span><span style={{color:C.t3,marginLeft:8}}>{h.w}</span></div><span style={{color:C.t3,fontSize:13}}>{h.d}</span></div><div style={{display:"flex",gap:10,alignItems:"center"}}><div style={{flex:1,height:32,background:C.sf,borderRadius:8,display:"flex",alignItems:"center",padding:"0 12px"}}><div style={{display:"flex",gap:2,alignItems:"center"}}>{[12,18,8,22,14,20,10,16,24,12,18,14,20,8,16].map((h2,j)=><div key={j} style={{width:3,height:h2,background:C.blu,borderRadius:2,opacity:0.5}}/>)}</div></div><button style={{padding:"8px 14px",borderRadius:8,border:`1px solid ${C.bd}`,background:C.bg,fontSize:12,fontWeight:600,cursor:"pointer",color:C.t1}}>Play</button></div></Cd>)}</div>}
{tab==="Samples"&&<div>{c.sam?<Cd><div style={{fontWeight:600,fontSize:15,marginBottom:12}}>Sample #{c.id}</div><Rw l="Status" v={c.sam.s==="delivered"?"Delivered":c.sam.s==="in_transit"?"In transit":"Converted"} c={c.sam.s==="delivered"?C.oT:c.sam.s==="in_transit"?C.pT:C.gT}/><Rw l="Size / Color" v={`${c.sam.sz||"—"} / ${c.sam.co||"—"}`}/><Rw l="Shipped" v={c.sam.sh||"—"}/><Rw l="Delivered" v={c.sam.de||"—"} last/></Cd>:<div style={{padding:40,textAlign:"center",color:C.t3}}>No samples sent to this course yet</div>}</div>}
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
      {/* Product catalog */}
      <div>
        <input value={prodSearch} onChange={e=>setProdSearch(e.target.value)} placeholder="Search designs..." style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${C.bd}`,fontSize:14,fontFamily:"'DM Sans',sans-serif",color:C.t1,marginBottom:12}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {filteredProds.map(p=><Cd key={p.id} s={{cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:24}}>{p.img}</span><div><div style={{fontSize:14,fontWeight:600}}>{p.n}</div><M s={13} c={C.grn}>${p.price}/unit</M></div></div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{p.colors.map(cl=>{const inCart=cart.find(i=>i.key===`${p.id}-${cl}`);return <button key={cl} onClick={()=>addToCart(p,cl)} style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:500,border:`1.5px solid ${inCart?C.gB:C.bd}`,background:inCart?C.gD:C.sf,color:inCart?C.gT:C.t2,cursor:"pointer"}}>{inCart?"✓ ":""}{cl}</button>})}</div>
          </Cd>)}
        </div>
      </div>
      {/* Cart / Order summary */}
      <div style={{position:"sticky",top:0,alignSelf:"start"}}>
        <Cd s={{background:C.sf}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <span style={{fontSize:16,fontWeight:700}}>Order summary</span>
            <span style={{fontSize:13,color:C.t2}}>{cart.length} item{cart.length!==1?"s":""}</span>
          </div>
          {cart.length===0?<div style={{padding:"24px 0",textAlign:"center",color:C.t3,fontSize:14}}>Click a color on any design to add it</div>:<>
            <div style={{display:"flex",flexDirection:"column",gap:12,maxHeight:400,overflowY:"auto",marginBottom:16}}>
              {cart.map(item=>{const itemUnits=Object.values(item.sizes).reduce((a,b)=>a+b,0);return <div key={item.key} style={{background:C.bg,borderRadius:12,border:`1px solid ${C.bd}`,padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div><span style={{fontWeight:600,fontSize:13}}>{item.prod.n}</span><span style={{color:C.t3,fontSize:12,marginLeft:6}}>— {item.color}</span></div>
                  <button onClick={()=>removeItem(item.key)} style={{color:C.red,background:"none",border:"none",cursor:"pointer",fontSize:12}}>Remove</button>
                </div>
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
{tab==="AI"&&<Cd><Lb>AI course analysis</Lb>{[["Likelihood to convert","High",C.grn],["Best time to call","Tues/Wed before 9am",C.amb],["Recommended approach","Lead with SunRun social proof",C.blu],["Buyer persona","Detail-oriented, wants quality proof",C.t1],["Objection risk","May ask about minimums",C.pur]].map(([l,v,c2],i,a)=><Rw key={l} l={l} v={v} c={c2} last={i===a.length-1}/>)}</Cd>}
</div></div>}

// ── CAMPAIGNS ──
function CampaignsP(){
  const[sel,setSel]=useState(null);const[creating,setCreating]=useState(false);const[step,setStep]=useState(1);const[cName,setCName]=useState("");const[cStage,setCStage]=useState("cold_list");const[cMode,setCMode]=useState("power");const[addLeads,setAddLeads]=useState(false);
  // Filter state for adding leads
  const[fStage,setFStage]=useState("all");const[fState,setFState]=useState("all");const[fType,setFType]=useState("all");const[fBuyer,setFBuyer]=useState("all");const[selected,setSelected]=useState(new Set());
  const filtered=CO.filter(c=>(fStage==="all"||c.sg===fStage)&&(fState==="all"||c.st===fState)&&(fType==="all"||c.t===fType)&&(fBuyer==="all"||(fBuyer==="yes"?c.b:!c.b)));
  const toggleSel=(id)=>setSelected(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n});
  const selectAll=()=>setSelected(new Set(filtered.map(c=>c.id)));

  // Add leads modal
  if(addLeads)return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}>
    <button onClick={()=>setAddLeads(false)} style={{fontSize:13,color:C.blu,background:"none",border:"none",cursor:"pointer",marginBottom:16,fontWeight:600}}>← Back to campaign</button>
    <div style={{fontSize:22,fontWeight:700,marginBottom:4}}>Add courses to campaign</div>
    <div style={{fontSize:14,color:C.t2,marginBottom:20}}>Filter your course database to find leads to add. {selected.size>0&&<span style={{color:C.grn,fontWeight:600}}>{selected.size} selected</span>}</div>
    {/* Filters */}
    <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
      <select value={fStage} onChange={e=>setFStage(e.target.value)} style={{padding:"8px 12px",borderRadius:10,border:`1.5px solid ${C.bd}`,fontSize:13,color:C.t1,background:C.bg}}>
        <option value="all">All stages</option>{Object.entries(STG).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}
      </select>
      <select value={fState} onChange={e=>setFState(e.target.value)} style={{padding:"8px 12px",borderRadius:10,border:`1.5px solid ${C.bd}`,fontSize:13,color:C.t1,background:C.bg}}>
        <option value="all">All states</option><option value="UT">Utah</option><option value="TX">Texas</option><option value="AZ">Arizona</option>
      </select>
      <select value={fType} onChange={e=>setFType(e.target.value)} style={{padding:"8px 12px",borderRadius:10,border:`1.5px solid ${C.bd}`,fontSize:13,color:C.t1,background:C.bg}}>
        <option value="all">All types</option>{["Public","Private","Semi-Priv","Municipal","Resort"].map(t=><option key={t} value={t}>{t}</option>)}
      </select>
      <select value={fBuyer} onChange={e=>setFBuyer(e.target.value)} style={{padding:"8px 12px",borderRadius:10,border:`1.5px solid ${C.bd}`,fontSize:13,color:C.t1,background:C.bg}}>
        <option value="all">Buyer: any</option><option value="yes">Has buyer</option><option value="no">No buyer yet</option>
      </select>
      <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:8,fontSize:13,color:C.t2}}><M s={14} c={C.t1}>{filtered.length}</M> courses match</div>
      <div style={{marginLeft:"auto",display:"flex",gap:8}}><button onClick={selectAll} style={{padding:"8px 14px",borderRadius:10,border:`1px solid ${C.bd}`,background:C.bg,fontSize:13,fontWeight:600,cursor:"pointer",color:C.blu}}>Select all ({filtered.length})</button><button onClick={()=>setSelected(new Set())} style={{padding:"8px 14px",borderRadius:10,border:`1px solid ${C.bd}`,background:C.bg,fontSize:13,cursor:"pointer",color:C.t3}}>Clear</button></div>
    </div>
    {/* Course list with checkboxes */}
    <Cd s={{padding:0,overflow:"hidden",marginBottom:16}}>
      <div style={{display:"grid",gridTemplateColumns:"40px 2.5fr 1fr 1fr 1fr 80px",padding:"12px 20px",borderBottom:`1px solid ${C.bd}`,fontSize:11,color:C.t3,textTransform:"uppercase",fontWeight:600,background:C.sf}}><span></span><span>Course</span><span>Stage</span><span>Type</span><span>Buyer</span><span>Attempts</span></div>
      {filtered.map(c=><div key={c.id} onClick={()=>toggleSel(c.id)} style={{display:"grid",gridTemplateColumns:"40px 2.5fr 1fr 1fr 1fr 80px",padding:"12px 20px",borderBottom:`1px solid ${C.rs}`,alignItems:"center",fontSize:14,cursor:"pointer",background:selected.has(c.id)?C.gD:"transparent"}}>
        <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${selected.has(c.id)?C.grn:C.bd}`,background:selected.has(c.id)?C.grn:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:12}}>{selected.has(c.id)&&"✓"}</div>
        <div><div style={{fontWeight:600}}>{c.n}</div><div style={{fontSize:12,color:C.t3}}>{c.ci}, {c.st}</div></div>
        <Pl sg={c.sg}/><span style={{color:C.t2}}>{c.t}</span><span style={{color:c.b?C.t1:C.t3}}>{c.b||"—"}</span><M s={13} c={C.t2}>{c.att}</M>
      </div>)}
    </Cd>
    {/* Action bar */}
    <div style={{position:"sticky",bottom:0,padding:"16px 0",background:C.bg,borderTop:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontSize:14,color:C.t2}}>{selected.size} course{selected.size!==1?"s":""} selected</span>
      <div style={{display:"flex",gap:10}}><Btn onClick={()=>setAddLeads(false)}>Cancel</Btn><Btn primary onClick={()=>setAddLeads(false)}>Add {selected.size} courses to campaign</Btn></div>
    </div>
  </div>;

  if(creating)return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}><button onClick={()=>{setCreating(false);setStep(1)}} style={{fontSize:13,color:C.blu,background:"none",border:"none",cursor:"pointer",marginBottom:16,fontWeight:600}}>← Back to campaigns</button>
    <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24}}>{[1,2,3].map(s=><div key={s} style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:28,height:28,borderRadius:"50%",background:step>=s?C.grn:C.rs,color:step>=s?"white":C.t3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600}}>{s}</div><span style={{fontSize:13,fontWeight:600,color:step>=s?C.t1:C.t3}}>{s===1?"Setup":s===2?"Add courses":"Review"}</span>{s<3&&<div style={{width:40,height:2,background:step>s?C.grn:C.rs,borderRadius:1}}/>}</div>)}</div>
    {step===1&&<div style={{maxWidth:500,display:"flex",flexDirection:"column",gap:16}}>
      <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Campaign setup</div>
      <div><div style={{fontSize:13,fontWeight:600,color:C.t2,marginBottom:6}}>Campaign name</div><input value={cName} onChange={e=>setCName(e.target.value)} placeholder="e.g., Cold List — Utah Q2" style={{width:"100%",padding:"12px 16px",borderRadius:12,border:`1.5px solid ${C.bd}`,fontSize:15,fontFamily:"'DM Sans',sans-serif",color:C.t1}}/></div>
      <div><div style={{fontSize:13,fontWeight:600,color:C.t2,marginBottom:6}}>Pipeline stage</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{Object.entries(STG).map(([k,v])=><button key={k} onClick={()=>setCStage(k)} style={{padding:"10px 16px",borderRadius:10,fontSize:13,fontWeight:600,border:`1.5px solid ${cStage===k?v.bd:C.bd}`,background:cStage===k?v.bg:C.bg,color:cStage===k?v.c:C.t3,cursor:"pointer"}}>{v.ic} {v.l}</button>)}</div></div>
      <div><div style={{fontSize:13,fontWeight:600,color:C.t2,marginBottom:6}}>Dialer mode</div><div style={{display:"flex",gap:8}}>{[["power","Power","Auto-dials through queue"],["preview","Preview","See contact before dialing"],["parallel","Parallel","Dial 2-5 lines at once"]].map(([id,lb,desc])=><button key={id} onClick={()=>setCMode(id)} style={{flex:1,padding:"14px",borderRadius:12,border:`1.5px solid ${cMode===id?C.bB:C.bd}`,background:cMode===id?C.bD:C.bg,cursor:"pointer",textAlign:"left"}}><div style={{fontSize:14,fontWeight:600,color:cMode===id?C.bT:C.t1}}>{lb}</div><div style={{fontSize:12,color:C.t3,marginTop:2}}>{desc}</div></button>)}</div></div>
      <div><div style={{fontSize:13,fontWeight:600,color:C.t2,marginBottom:6}}>Calling hours (recipient local time)</div><div style={{display:"flex",gap:8,alignItems:"center"}}><input defaultValue="8:00 AM" style={{width:100,padding:"8px 12px",borderRadius:8,border:`1px solid ${C.bd}`,fontSize:13,color:C.t1}}/><span style={{color:C.t3}}>to</span><input defaultValue="8:00 PM" style={{width:100,padding:"8px 12px",borderRadius:8,border:`1px solid ${C.bd}`,fontSize:13,color:C.t1}}/></div></div>
      <Btn primary onClick={()=>setStep(2)}>Next: Add courses →</Btn>
    </div>}
    {step===2&&<div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Add courses to "{cName||"New campaign"}"</div>
      <div style={{fontSize:14,color:C.t2}}>Filter your database and select which courses to include.</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <select value={fStage} onChange={e=>setFStage(e.target.value)} style={{padding:"8px 12px",borderRadius:10,border:`1.5px solid ${C.bd}`,fontSize:13,color:C.t1,background:C.bg}}><option value="all">All stages</option>{Object.entries(STG).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}</select>
        <select value={fState} onChange={e=>setFState(e.target.value)} style={{padding:"8px 12px",borderRadius:10,border:`1.5px solid ${C.bd}`,fontSize:13,color:C.t1,background:C.bg}}><option value="all">All states</option><option value="UT">Utah</option></select>
        <select value={fType} onChange={e=>setFType(e.target.value)} style={{padding:"8px 12px",borderRadius:10,border:`1.5px solid ${C.bd}`,fontSize:13,color:C.t1,background:C.bg}}><option value="all">All types</option>{["Public","Private","Semi-Priv","Municipal"].map(t=><option key={t} value={t}>{t}</option>)}</select>
        <select value={fBuyer} onChange={e=>setFBuyer(e.target.value)} style={{padding:"8px 12px",borderRadius:10,border:`1.5px solid ${C.bd}`,fontSize:13,color:C.t1,background:C.bg}}><option value="all">Buyer: any</option><option value="yes">Has buyer</option><option value="no">No buyer</option></select>
        <button onClick={selectAll} style={{padding:"8px 14px",borderRadius:10,border:`1px solid ${C.bd}`,background:C.bg,fontSize:13,fontWeight:600,cursor:"pointer",color:C.blu}}>Select all ({filtered.length})</button>
      </div>
      <Cd s={{padding:0,overflow:"hidden",maxHeight:300,overflowY:"auto"}}>{filtered.map(c=><div key={c.id} onClick={()=>toggleSel(c.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderBottom:`1px solid ${C.rs}`,cursor:"pointer",background:selected.has(c.id)?C.gD:"transparent"}}>
        <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${selected.has(c.id)?C.grn:C.bd}`,background:selected.has(c.id)?C.grn:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:10,flexShrink:0}}>{selected.has(c.id)&&"✓"}</div>
        <span style={{flex:1,fontSize:14,fontWeight:500}}>{c.n}</span><Pl sg={c.sg}/><span style={{fontSize:12,color:C.t3}}>{c.ci}, {c.st}</span>
      </div>)}</Cd>
      <div style={{fontSize:14,color:C.t2}}><M c={C.grn}>{selected.size}</M> courses selected</div>
      <div style={{display:"flex",gap:10}}><Btn onClick={()=>setStep(1)}>← Back</Btn><Btn primary onClick={()=>setStep(3)}>Next: Review →</Btn></div>
    </div>}
    {step===3&&<div style={{maxWidth:500,display:"flex",flexDirection:"column",gap:16}}>
      <div style={{fontSize:20,fontWeight:700}}>Review campaign</div>
      <Cd><Rw l="Name" v={cName||"New campaign"}/><Rw l="Stage" v={STG[cStage]?.l||cStage}/><Rw l="Mode" v={cMode}/><Rw l="Courses" v={`${selected.size} courses`} c={C.grn}/><Rw l="Calling hours" v="8:00 AM – 8:00 PM local" last/></Cd>
      <div style={{display:"flex",gap:10}}><Btn onClick={()=>setStep(2)}>← Back</Btn><Btn primary onClick={()=>{setCreating(false);setStep(1)}}>Create & activate campaign</Btn></div>
    </div>}
  </div>;

  if(sel)return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}><button onClick={()=>setSel(null)} style={{fontSize:13,color:C.blu,background:"none",border:"none",cursor:"pointer",marginBottom:16,fontWeight:600}}>← Back to campaigns</button><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22,fontWeight:700}}>{sel.n}</span><Pl sg={sel.sg}/><span style={{fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:8,background:C.gD,color:C.gT}}>Active</span></div><div style={{fontSize:14,color:C.t2,marginTop:4}}>{sel.ct} courses · {sel.m} dialing</div></div><div style={{display:"flex",gap:8}}><Btn primary>Start dialing</Btn><Btn onClick={()=>setAddLeads(true)}>+ Add courses</Btn><Btn>Edit</Btn></div></div>
    <Tab tabs={["Queue","Performance","Settings"]} active="Queue" onChange={()=>{}}/>
    <Cd s={{padding:0,overflow:"hidden"}}><div style={{display:"grid",gridTemplateColumns:"40px 2.5fr 1fr 1fr 80px 100px",padding:"12px 20px",borderBottom:`1px solid ${C.bd}`,fontSize:11,color:C.t3,textTransform:"uppercase",fontWeight:600,background:C.sf}}><span>#</span><span>Course</span><span>Stage</span><span>Buyer</span><span>Attempts</span><span>Status</span></div>
    {CO.slice(0,8).map((c,i)=><div key={c.id} style={{display:"grid",gridTemplateColumns:"40px 2.5fr 1fr 1fr 80px 100px",padding:"14px 20px",borderBottom:`1px solid ${C.rs}`,alignItems:"center",fontSize:14}}><M s={13} c={C.t3}>{i+1}</M><div><div style={{fontWeight:600}}>{c.n}</div><div style={{fontSize:12,color:C.t3}}>{c.t} · {c.ci}, {c.st}</div></div><Pl sg={c.sg}/><span style={{color:c.b?C.t1:C.t3}}>{c.b||"—"}</span><M s={13} c={C.t2}>{c.att}</M><span style={{fontSize:12,fontWeight:600,color:c.att===0?C.t3:C.bT}}>{c.att===0?"Queued":"Attempted"}</span></div>)}</Cd>
  </div>;
  return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{fontSize:22,fontWeight:700}}>Campaigns</div><Btn primary onClick={()=>setCreating(true)}>+ New campaign</Btn></div>{CAMPS.map(c=>{const m=STG[c.sg];return <Cd key={c.id} s={{marginBottom:12,cursor:"pointer"}} onClick={()=>setSel(c)}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:14}}><div style={{width:48,height:48,borderRadius:14,background:m?.bg||C.sf,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{m?.ic||"📋"}</div><div><div style={{fontSize:16,fontWeight:600}}>{c.n}</div><div style={{fontSize:13,color:C.t2,marginTop:2}}>{c.ct} courses · {c.m} dialing</div></div></div><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{display:"flex",gap:16,marginRight:12,fontSize:13}}><span style={{color:C.t3}}>Dials: <M s={13}>87</M></span><span style={{color:C.t3}}>Connects: <M s={13} c={C.grn}>12</M></span></div><Pl sg={c.sg}/><div style={{background:C.gD,color:C.gT,fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:8}}>Active</div></div></div></Cd>})}</div>;}

// ── SAMPLES ──
function SamplesP(){const stats=[["Sent",SAMPS.length,C.pur],["Delivered",SAMPS.filter(s=>s.s==="delivered").length,C.org],["In transit",SAMPS.filter(s=>s.s==="in_transit").length,C.blu],["Converted",SAMPS.filter(s=>s.s==="converted").length,C.grn]];const rate=Math.round((SAMPS.filter(s=>s.s==="converted").length/SAMPS.length)*100);
return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}><div style={{fontSize:22,fontWeight:700,marginBottom:20}}>Sample tracking</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>{stats.map(([l,v,c])=><Stat key={l} label={l} value={v} color={c}/>)}</div><div style={{background:C.gD,border:`1px solid ${C.gB}`,borderRadius:14,padding:"16px 20px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:14,fontWeight:600,color:C.gT}}>Conversion rate</div><div style={{fontSize:13,color:C.t2,marginTop:2}}>{SAMPS.filter(s=>s.s==="converted").length} of {SAMPS.length} → orders</div></div><M s={32} c={C.grn}>{rate}%</M></div>
<Cd s={{padding:0,overflow:"hidden"}}><div style={{display:"grid",gridTemplateColumns:"2fr 1fr 90px 80px 1.2fr 80px",padding:"12px 20px",borderBottom:`1px solid ${C.bd}`,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:600,background:C.sf}}><span>Course / Buyer</span><span>Size/Color</span><span>Status</span><span>Shipped</span><span>Follow-up</span><span>Order</span></div>{SAMPS.map(s=><div key={s.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 90px 80px 1.2fr 80px",padding:"14px 20px",borderBottom:`1px solid ${C.rs}`,alignItems:"center",fontSize:14}}><div><div style={{fontWeight:600}}>{s.co}</div><div style={{fontSize:12,color:C.t3}}>{s.b}</div></div><span style={{color:C.t2}}>{s.sz}/{s.cl}</span><span style={{fontSize:12,fontWeight:600,color:s.s==="delivered"?C.oT:s.s==="in_transit"?C.bT:C.gT}}>{s.s==="delivered"?"Delivered":s.s==="in_transit"?"Transit":"Converted"}</span><M s={12} c={C.t3}>{s.sh}</M><span style={{fontSize:13,color:s.done?C.gT:s.s==="delivered"?C.oT:C.t3,fontWeight:s.done||s.s!=="delivered"?400:600}}>{s.done?`✓ ${s.fu}`:s.fu||"—"}{s.s==="delivered"&&!s.done?" OVERDUE":""}</span><M s={13} c={s.amt?C.gT:C.t3}>{s.amt||"—"}</M></div>)}</Cd></div>}

// ── ORDERS ──
function OrdersP(){
  const[sel,setSel]=useState(null);
  if(sel)return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}><button onClick={()=>setSel(null)} style={{fontSize:13,color:C.blu,background:"none",border:"none",cursor:"pointer",marginBottom:16,fontWeight:600}}>← Back to orders</button>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}><div><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22,fontWeight:700}}>Order #{sel.id}</span><span style={{fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:8,background:sel.pay==="Paid"?C.gD:C.aD,color:sel.pay==="Paid"?C.gT:C.aT}}>{sel.pay}</span><span style={{fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:8,background:sel.ful==="Delivered"?C.gD:C.bD,color:sel.ful==="Delivered"?C.gT:C.bT}}>{sel.ful}</span></div><div style={{fontSize:14,color:C.t2,marginTop:4}}>{sel.co} — {sel.b} · {sel.dt}</div></div><div style={{display:"flex",gap:8}}><Btn>Print invoice</Btn><Btn>Send confirmation</Btn><Btn>Duplicate order</Btn></div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Cd><Lb>Line items</Lb><div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:"8px 0",fontSize:13}}><span style={{color:C.t3,fontWeight:600}}>Item</span><span style={{color:C.t3,fontWeight:600}}>Qty</span><span style={{color:C.t3,fontWeight:600}}>Price</span><span style={{color:C.t3,fontWeight:600}}>Total</span><span>BYRDGANG Polo — Navy</span><span>12</span><span>$25</span><span>$300</span><span>BYRDGANG Polo — Charcoal</span><span>12</span><span>$25</span><span>$300</span><span>BYRDGANG Polo — Forest</span><span>12</span><span>$25</span><span>$300</span></div><div style={{borderTop:`1px solid ${C.bd}`,marginTop:12,paddingTop:12,display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600}}>Total ({sel.items.split(" ")[0]})</span><M s={18} c={C.grn}>{sel.tot}</M></div></Cd>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <Cd><Lb>Payment</Lb><Rw l="Method" v="Net 30"/><Rw l="Status" v={sel.pay} c={sel.pay==="Paid"?C.gT:C.aT}/><Rw l="Terms" v="Due in 30 days" last/>{sel.pay!=="Paid"&&<div style={{marginTop:12}}><Btn full>Send payment reminder</Btn></div>}</Cd>
        <Cd><Lb>Fulfillment</Lb><Rw l="Status" v={sel.ful} c={sel.ful==="Delivered"?C.gT:C.bT}/><Rw l="Carrier" v="UPS Ground"/><Rw l="Tracking" v="1Z999AA10..." c={C.blu} last/></Cd>
      </div>
    </div>
  </div>;
  return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{fontSize:22,fontWeight:700}}>Wholesale orders</div><div style={{fontSize:13,color:C.t2,background:C.sf,padding:"8px 14px",borderRadius:10,border:`1px solid ${C.bd}`}}>Create orders from the course detail page →</div></div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>{[["Orders",ORDS.length,C.t1],["Revenue","$2,700",C.grn],["Avg order","$900",C.blu],["Units sold","108",C.pur]].map(([l,v,c])=><Stat key={l} label={l} value={v} color={c}/>)}</div>
  <Cd s={{padding:0,overflow:"hidden"}}><div style={{display:"grid",gridTemplateColumns:"60px 2fr 1.2fr 80px 80px 80px 80px",padding:"12px 20px",borderBottom:`1px solid ${C.bd}`,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:600,background:C.sf}}><span>#</span><span>Course / Buyer</span><span>Items</span><span>Total</span><span>Payment</span><span>Status</span><span>Agent</span></div>{ORDS.map(o=><div key={o.id} onClick={()=>setSel(o)} style={{display:"grid",gridTemplateColumns:"60px 2fr 1.2fr 80px 80px 80px 80px",padding:"14px 20px",borderBottom:`1px solid ${C.rs}`,alignItems:"center",fontSize:14,cursor:"pointer"}}><M s={13} c={C.t3}>#{o.id}</M><div><div style={{fontWeight:600}}>{o.co}</div><div style={{fontSize:12,color:C.t3}}>{o.b} · {o.dt}</div></div><span style={{fontSize:13,color:C.t2}}>{o.items}</span><M s={14} c={C.grn}>{o.tot}</M><span style={{fontSize:12,fontWeight:600,color:o.pay==="Paid"?C.gT:C.aT}}>{o.pay}</span><span style={{fontSize:12,fontWeight:600,color:o.ful==="Delivered"?C.gT:C.bT}}>{o.ful}</span><span style={{fontSize:13,color:C.t2}}>{o.ag}</span></div>)}</Cd></div>;}

// ── CALL LIBRARY ──
function CallsP(){
  const[s,setS]=useState("");const[sel,setSel]=useState(null);const[playing,setPlaying]=useState(false);const[speed,setSpeed]=useState(1);
  const fl=RECS.filter(r=>r.co.toLowerCase().includes(s.toLowerCase())||(r.b||"").toLowerCase().includes(s.toLowerCase())||r.dp.toLowerCase().includes(s.toLowerCase()));
  const transcript=[{t:"00:02",sp:"Agent",tx:"Hi, I'm Alex with BYRDGANG — we make performance golf polos. Can I speak with whoever handles pro shop merchandise?"},{t:"00:08",sp:"Prospect",tx:"That would be Mike Thompson, he's our head pro. He's actually on the course right now."},{t:"00:14",sp:"Agent",tx:"No problem at all. Could I get his direct number so I can call back? Or is there a better time to reach him?"},{t:"00:20",sp:"Prospect",tx:"He's usually in before 9am. You can try the pro shop line directly — 801-555-0141."},{t:"00:26",sp:"Agent",tx:"Perfect, and just to confirm — Mike Thompson, head pro?"},{t:"00:30",sp:"Prospect",tx:"Yep, that's right."},{t:"00:32",sp:"Agent",tx:"Great, I'll give him a call in the morning. Thanks for your help!"}];
  if(sel)return <div className="sb" style={{height:"100%",overflowY:"auto"}}><div style={{padding:"20px 28px",borderBottom:`1px solid ${C.bd}`,background:C.sf}}>
    <button onClick={()=>setSel(null)} style={{fontSize:13,color:C.blu,background:"none",border:"none",cursor:"pointer",marginBottom:12,fontWeight:600}}>← Back to call library</button>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontSize:20,fontWeight:700}}>{sel.co}</div><div style={{fontSize:14,color:C.t2,marginTop:4}}>{sel.b||"Unknown"}{sel.sp?` · ${sel.sp}`:""} · {sel.ag} · {sel.dt} · {sel.dur}</div></div><div style={{display:"flex",gap:8}}><span style={{fontSize:13,fontWeight:500,color:sel.dp.includes("order")?C.gT:sel.dp.includes("sample")?C.pT:sel.dp.includes("buyer")?C.bT:C.t2,padding:"6px 14px",borderRadius:8,background:C.sf,border:`1px solid ${C.bd}`}}>{sel.dp}</span>{sel.sc&&<span style={{fontSize:15,fontWeight:700,color:sel.sc>=85?C.grn:sel.sc>=70?C.amb:C.red,padding:"6px 14px",borderRadius:8,background:C.sf,border:`1px solid ${C.bd}`}}>{sel.sc}/100</span>}</div></div></div>
    <div style={{padding:"0 28px 28px"}}>
    {/* Recording Player */}
    <Cd s={{marginTop:20,marginBottom:20}}>
      <Lb>Recording</Lb>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
        <button onClick={()=>setPlaying(!playing)} style={{width:44,height:44,borderRadius:"50%",background:playing?C.gD:C.sf,border:`1.5px solid ${playing?C.gB:C.bd}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><I s={20} k={playing?C.grn:C.t2}>{playing?<><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>:<polygon points="5 3 19 12 5 21 5 3"/>}</I></button>
        <div style={{flex:1}}>
          <div style={{display:"flex",gap:2,alignItems:"end",height:40}}>{Array.from({length:60},(_,i)=>{const h=Math.sin(i*0.3)*16+Math.random()*10+6;return <div key={i} style={{flex:1,height:h,background:i<25?(playing?C.grn:C.blu):C.rs,borderRadius:2,minWidth:2}}/>})}</div>
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
      {/* Transcript */}
      <Cd>
        <Lb>Transcript</Lb>
        <div style={{display:"flex",flexDirection:"column",gap:0}}>
          {transcript.map((t,i)=><div key={i} style={{padding:"10px 0",borderBottom:i<transcript.length-1?`1px solid ${C.rs}`:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,fontWeight:600,color:t.sp==="Agent"?C.bT:C.gT}}>{t.sp}</span>
              <button style={{fontSize:11,color:C.blu,background:"none",border:"none",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>{t.t}</button>
            </div>
            <div style={{fontSize:14,color:C.t1,lineHeight:1.6}}>{t.tx}</div>
          </div>)}
        </div>
      </Cd>
      {/* AI Analysis */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <Cd>
          <Lb>AI analysis</Lb>
          {sel.sc&&<div style={{textAlign:"center",marginBottom:16}}><M s={48} c={sel.sc>=85?C.grn:sel.sc>=70?C.amb:C.red}>{sel.sc}</M><div style={{fontSize:12,color:C.t3,marginTop:4}}>Overall score</div></div>}
          <Rw l="Talk ratio" v="38% agent / 62% prospect" c={C.grn}/>
          <Rw l="Gatekeeper" v="Encountered — got past ✓" c={C.gT}/>
          <Rw l="Reached buyer" v="No — got name + direct line"/>
          <Rw l="Sentiment" v="Positive" c={C.grn} last/>
        </Cd>
        <Cd>
          <Lb>Script adherence</Lb>
          {[["Mentioned free sample",true],["Asked for buyer name",true],["Got direct number",true],["Mentioned SunRun proof",false],["Attempted close",false]].map(([item,done],i,a)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<a.length-1?`1px solid ${C.rs}`:"none",fontSize:13}}><span style={{color:done?C.grn:C.red}}>{done?"✓":"✗"}</span><span style={{color:done?C.t1:C.t3}}>{item}</span></div>)}
        </Cd>
        <Cd>
          <Lb>Coaching notes</Lb>
          <div style={{fontSize:14,color:C.t2,lineHeight:1.7}}>
            <p style={{margin:"0 0 8px"}}>Good gatekeeper navigation — got the buyer's name and direct line efficiently.</p>
            <p style={{margin:"0 0 8px"}}><span style={{color:C.gT,fontWeight:600}}>Strength:</span> Confirmed the buyer's name before ending the call.</p>
            <p style={{margin:0}}><span style={{color:C.aT,fontWeight:600}}>Improve:</span> Didn't mention SunRun social proof. Try working it into the opening next time.</p>
          </div>
        </Cd>
      </div>
    </div></div></div>;
  return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div><div style={{fontSize:22,fontWeight:700}}>Call library</div><div style={{fontSize:14,color:C.t2,marginTop:2}}>{RECS.length} recorded calls</div></div><input type="text" placeholder="Search calls, transcripts..." value={s} onChange={e=>setS(e.target.value)} style={{padding:"10px 16px",borderRadius:12,border:`1.5px solid ${C.bd}`,background:C.bg,color:C.t1,fontSize:14,fontFamily:"'DM Sans',sans-serif",width:280,outline:"none"}}/></div>
  <Cd s={{padding:0,overflow:"hidden"}}><div style={{display:"grid",gridTemplateColumns:"2.5fr 80px 80px 80px 1.2fr 50px",padding:"12px 20px",borderBottom:`1px solid ${C.bd}`,fontSize:11,color:C.t3,textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:600,background:C.sf}}><span>Course / Contact</span><span>Agent</span><span>Date</span><span>Duration</span><span>Disposition</span><span>Score</span></div>{fl.map(r=><div key={r.id} onClick={()=>setSel(r)} style={{display:"grid",gridTemplateColumns:"2.5fr 80px 80px 80px 1.2fr 50px",padding:"14px 20px",borderBottom:`1px solid ${C.rs}`,alignItems:"center",fontSize:14,cursor:"pointer"}}><div><div style={{fontWeight:600}}>{r.co}</div><div style={{fontSize:12,color:C.t3}}>{r.b||"Unknown"}{r.sp?` · ${r.sp}`:""}</div></div><span style={{color:C.t2,fontSize:13}}>{r.ag}</span><M s={12} c={C.t3}>{r.dt}</M><M s={13}>{r.dur}</M><span style={{fontSize:13,fontWeight:500,color:r.dp.includes("order")?C.gT:r.dp.includes("sample")?C.pT:r.dp.includes("buyer")?C.bT:C.t2}}>{r.dp}</span>{r.sc?<M s={15} c={r.sc>=85?C.grn:r.sc>=70?C.amb:C.red}>{r.sc}</M>:<span style={{color:C.t3}}>—</span>}</div>)}</Cd></div>;}

// ── COACHING ──
function CoachP(){return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}><div style={{fontSize:22,fontWeight:700,marginBottom:20}}>AI coaching</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}}>{[["Avg call score","83","/100",C.grn],["Gatekeeper pass","34%","14/41 calls",C.amb],["Sample close","62%","8/13 convos",C.pur]].map(([t,v,sub,c])=><div key={t} style={{background:C.bg,borderRadius:14,border:`1px solid ${C.bd}`,padding:"20px"}}><div style={{fontSize:12,color:C.t3,textTransform:"uppercase",marginBottom:8}}>{t}</div><M s={32} c={c}>{v}</M><div style={{fontSize:12,color:C.t3,marginTop:4}}>{sub}</div></div>)}</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
<Cd><div style={{fontSize:16,fontWeight:600,marginBottom:14}}>Top gatekeeper techniques</div>{[["Ask for \"merchandise buyer\" not \"manager\"","6/8 converted",C.grn],["Call before 9am local","3x more likely",C.amb],["\"Quick question about polo inventory\"","72% pass rate",C.blu]].map(([t,s,c],i)=><div key={i} style={{padding:"14px 16px",background:C.sf,borderRadius:12,marginBottom:8}}><div style={{fontSize:14,fontWeight:500,marginBottom:4}}>{t}</div><div style={{fontSize:13,color:c,fontWeight:600}}>{s}</div></div>)}</Cd>
<Cd><div style={{fontSize:16,fontWeight:600,marginBottom:14}}>Best objection responses</div>{[["\"Already carry polos\"","→ \"At $25 you can sell alongside at $49...\"","43%",C.amb],["\"Send me an email\"","→ \"Product sells by touch. Free sample?\"","38%",C.blu],["\"No budget\"","→ \"Sample is free. When budget opens...\"","29%",C.pur]].map(([obj,resp,stat,c],i)=><div key={i} style={{padding:"14px 16px",background:C.sf,borderRadius:12,marginBottom:8}}><div style={{fontSize:13,fontWeight:600,color:c}}>{obj}</div><div style={{fontSize:13,color:C.t2,margin:"4px 0"}}>{resp}</div><div style={{fontSize:12,color:C.grn,fontWeight:600}}>{stat} convert</div></div>)}</Cd></div>
<Cd><div style={{fontSize:16,fontWeight:600,marginBottom:12}}>Weekly notes — Alex</div><div style={{fontSize:14,color:C.t2,lineHeight:1.8}}><p style={{margin:"0 0 10px"}}>Strong week. SunRun proof landed in 4/5 sample closes. Talk ratio improved to 38/62.</p><p style={{margin:"0 0 10px"}}><span style={{color:C.gT,fontWeight:600}}>Keep doing:</span> Asking for size early creates commitment before the address ask.</p><p style={{margin:0}}><span style={{color:C.aT,fontWeight:600}}>Work on:</span> Try "quick question about polo inventory" instead of "who handles purchasing" with gatekeepers.</p></div></Cd></div>}

// ── ANALYTICS ──
function StatsP(){return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}><div style={{fontSize:22,fontWeight:700,marginBottom:20}}>Analytics</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>{[["Dials","1,247",C.t1],["Connects","189",C.grn],["Rate","15.2%",C.blu],["Talk time","18h 34m",C.t1],["Gatekeepers","94",C.amb],["Buyers","52",C.grn],["Samples","8",C.pur],["Orders","3",C.grn]].map(([l,v,c])=><Stat key={l} label={l} value={v} color={c}/>)}</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><Cd><div style={{fontSize:16,fontWeight:600,marginBottom:16}}>Pipeline funnel</div>{[["Cold → Buyer ID'd","38%",38,C.blu],["Buyer → Sample","62%",62,C.pur],["Sample → Order","50%",50,C.grn]].map(([l,r,p,c],i)=><div key={i} style={{marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}><span style={{color:C.t2}}>{l}</span><span style={{color:c,fontWeight:700}}>{r}</span></div><div style={{height:8,background:C.rs,borderRadius:4}}><div style={{height:8,background:c,borderRadius:4,width:`${p}%`}}/></div></div>)}</Cd>
<Cd><div style={{fontSize:16,fontWeight:600,marginBottom:16}}>Revenue</div>{[["This week","$600",C.grn],["This month","$2,700",C.grn],["All time","$2,700",C.grn],["Avg order","$900",C.blu],["Units/order","36",C.t1]].map(([l,v,c],i,a)=><Rw key={l} l={l} v={v} c={c} last={i===a.length-1}/>)}<div style={{marginTop:16,padding:"14px",background:C.gD,borderRadius:10,border:`1px solid ${C.gB}`}}><div style={{fontSize:12,fontWeight:700,color:C.gT,textTransform:"uppercase",marginBottom:4}}>Sample ROI</div><div style={{fontSize:13,color:C.t2}}>4 samples → 2 orders ($2,700)</div><M s={15} c={C.grn}>~$675 per sample</M></div></Cd></div></div>}

// ── SETTINGS ──
function SettingsP(){const[tab,setTab]=useState("Profile");return <div className="sb" style={{padding:"24px 28px",height:"100%",overflowY:"auto"}}><div style={{fontSize:22,fontWeight:700,marginBottom:20}}>Settings</div><Tab tabs={["Profile","Team","Phone #s","Inbound","Scripts","Voicemail","SMS","Integrations"]} active={tab} onChange={setTab}/>
{tab==="Profile"&&<Cd s={{maxWidth:500}}><Lb>My profile</Lb><div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}><div style={{width:56,height:56,borderRadius:"50%",background:C.bD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:600,color:C.bT}}>AJ</div><div><div style={{fontSize:16,fontWeight:600}}>Alex Johnson</div><div style={{fontSize:14,color:C.t2}}>alex@byrdgang.com</div></div></div>{["Full name","Email","Phone extension","Working hours"].map(f=><div key={f} style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:600,color:C.t2,marginBottom:6}}>{f}</div><input style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${C.bd}`,fontSize:14,fontFamily:"'DM Sans',sans-serif",color:C.t1}} defaultValue={f==="Full name"?"Alex Johnson":f==="Email"?"alex@byrdgang.com":""}/></div>)}<Btn primary>Save changes</Btn></Cd>}
{tab==="Integrations"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>{[["Shopify","Connected","byrdgang.myshopify.com",C.grn],["Twilio","Connected","2 phone numbers active",C.grn],["Deepgram","Connected","Nova-3 model",C.grn],["Claude API","Connected","Sonnet 4",C.grn],["Klaviyo","Not connected","Connect for email automations",C.t3],["Slack","Not connected","Connect for notifications",C.t3]].map(([n,st,desc,c])=><Cd key={n}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:15,fontWeight:600}}>{n}</div><div style={{fontSize:13,color:C.t2,marginTop:2}}>{desc}</div></div><span style={{fontSize:12,fontWeight:600,color:c,padding:"4px 10px",borderRadius:8,background:c===C.grn?C.gD:C.rs}}>{st}</span></div></Cd>)}</div>}
{tab==="Inbound"&&<Cd s={{maxWidth:600}}><Lb>Inbound routing</Lb>{[["Routing strategy","Ring all available agents"],["Max hold time","120 seconds"],["Auto-SMS after","120 seconds hold"],["After-hours","Voicemail + callback task"],["VM transcription","Enabled (Deepgram)"]].map(([l,v],i,a)=><Rw key={l} l={l} v={v} last={i===a.length-1}/>)}<div style={{marginTop:16}}><Btn>Edit routing rules</Btn></div></Cd>}
{tab==="Scripts"&&<div><Lb r="4 scripts">Script library</Lb>{["Cold call — Gatekeeper","Cold call — Buyer","Sample follow-up","Reorder check-in"].map((s,i)=><Cd key={s} s={{marginBottom:10,cursor:"pointer"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><span style={{fontWeight:600}}>{s}</span><span style={{color:C.t3,marginLeft:8,fontSize:13}}>v{i+1}</span></div><span style={{fontSize:12,color:C.blu,fontWeight:600}}>Edit</span></div></Cd>)}</div>}
{!["Profile","Integrations","Inbound","Scripts"].includes(tab)&&<Cd><div style={{padding:40,textAlign:"center",color:C.t3}}>Settings for {tab} — configure in the full app</div></Cd>}
</div>}

// ═══════════════════════════════════════
//  DIALER (all states)
// ═══════════════════════════════════════
function DialerP(){
  const[ds,setDs]=useState("idle");const[sec,setSec]=useState(0);const[mode,setMode]=useState("buyer");const[disp,setDisp]=useState(null);const[mod,setMod]=useState(null);const[camp,setCamp]=useState(null);const[notes,setNotes]=useState("");const[dials,setDials]=useState(247);const[pad,setPad]=useState(false);const[dtmf,setDtmf]=useState("");
  const act=CO[0];const isGk=mode==="gatekeeper";const scKey=act.sg==="sample_follow_up"?"followup":isGk?"cold_gk":"cold_buyer";const script=SC[scKey]||[];const disps=[...(act.sg==="sample_follow_up"?DFU:isGk?DGK:DBY),...DSH];const accent=isGk?C.amb:C.blu;const showTog=act.sg==="cold_list"||act.sg==="buyer_identified";
  useEffect(()=>{if(ds!=="connected")return;const i=setInterval(()=>setSec(s=>s+1),1000);return()=>clearInterval(i)},[ds]);
  useEffect(()=>{if(ds==="dialing"){const t=setTimeout(()=>setDs("ringing"),2000);return()=>clearTimeout(t)}if(ds==="ringing"){const t=setTimeout(()=>{setDs("connected");setSec(0);setNotes("");setDisp(null)},3000);return()=>clearTimeout(t)}},[ds]);
  const fmt=useCallback(t=>`${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`,[]);
  const sorted=[...CO].sort((a,b)=>{if(a.qs==="live")return -1;if(b.qs==="live")return 1;const p={sample_follow_up:0,buyer_identified:1,sending_sample:2,cold_list:3,first_order:4};return(p[a.sg]??9)-(p[b.sg]??9)});

  const Queue=()=><div style={{background:C.sf,borderRight:`1px solid ${C.bd}`,display:"flex",flexDirection:"column",overflow:"hidden"}}><div style={{padding:"12px 16px",borderBottom:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between"}}><div style={{fontSize:14,fontWeight:600}}>{camp?.n||"Queue"}</div><M s={12} c={C.t3}>{sorted.filter(c=>c.qs==="queued").length} left</M></div><div className="sb" style={{flex:1,overflowY:"auto"}}>{sorted.map(c=>{const live=c.qs==="live"&&ds==="connected",hot=c.sg==="sample_follow_up"&&c.qs==="queued";return <div key={c.id} style={{padding:"10px 14px",borderBottom:`1px solid ${C.rs}`,background:live?C.gD:hot?C.oD:"transparent",borderLeft:live?`3px solid ${C.grn}`:hot?`3px solid ${C.org}`:"3px solid transparent",cursor:"pointer"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{c.n}</span>{live&&<M s={12} c={C.grn}>{fmt(sec)}</M>}</div><div style={{display:"flex",gap:5,alignItems:"center"}}><Pl sg={c.sg}/>{c.b&&<span style={{fontSize:11,color:C.t2}}>{c.b}</span>}</div>{c.sam?.s==="delivered"&&!live&&<div style={{fontSize:10,color:C.oT,marginTop:4,fontWeight:600}}>Sample delivered — follow up</div>}</div>})}</div></div>;

  const Intel=()=><div className="sb" style={{background:C.sf,borderLeft:`1px solid ${C.bd}`,overflowY:"auto"}}><div style={{padding:"14px 18px",borderBottom:`1px solid ${C.bd}`}}><div style={{fontSize:14,fontWeight:600,marginBottom:8}}>Course</div>{[["Name",act.n],["Type",act.t],["Phone",act.ph||"—"],["Pro shop",act.pp||"—"]].map(([l,v],i,a)=><Rw key={l} l={l} v={v} c={l.includes("hone")?C.blu:null} last={i===a.length-1}/>)}</div><div style={{padding:"14px 18px",borderBottom:`1px solid ${C.bd}`}}><Lb>{act.b?"Buyer":"Buyer — unknown"}</Lb>{act.b?[["Name",act.b],["Title",act.bt],["Size",act.bs||"—"]].map(([l,v],i,a)=><Rw key={l} l={l} v={v} c={l==="Size"&&v!=="—"?C.grn:null} last={i===a.length-1}/>):<div style={{fontSize:13,color:C.t3,fontStyle:"italic"}}>Ask gatekeeper for name</div>}</div>{act.sam&&<div style={{padding:"14px 18px",borderBottom:`1px solid ${C.bd}`}}><div style={{padding:"10px 12px",borderRadius:10,background:act.sam.s==="delivered"?C.oD:C.pD,border:`1px solid ${act.sam.s==="delivered"?C.oB:C.pB}`}}><div style={{fontWeight:600,fontSize:13,color:act.sam.s==="delivered"?C.oT:C.pT}}>{act.sam.s==="delivered"?"✓ Delivered":"Transit"}</div><div style={{fontSize:12,color:C.t2,marginTop:2}}>{act.sam.co} {act.sam.sz}</div></div></div>}<div style={{padding:"14px 18px"}}><Lb r={`${act.att}`}>History</Lb>{HIST.slice(0,3).map((h,i)=><div key={i} style={{padding:"8px 10px",background:C.bg,borderRadius:8,border:`1px solid ${C.rs}`,marginBottom:5,fontSize:12}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.t3}}>{h.d}</span><span style={{fontWeight:500,color:h.w==="Gatekeeper"?C.aT:C.t3}}>{h.w}</span></div><div style={{fontWeight:500,marginTop:2}}>{h.o}</div></div>)}</div></div>;

  if(ds==="idle")return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:32,textAlign:"center"}}><div style={{width:80,height:80,borderRadius:24,background:C.gD,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20}}><I s={36} k={C.grn}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></I></div><div style={{fontSize:24,fontWeight:700,marginBottom:6}}>Ready to dial</div><div style={{fontSize:15,color:C.t2,marginBottom:28,maxWidth:320}}>Select a campaign to load your call queue.</div><div style={{width:"100%",maxWidth:420,display:"flex",flexDirection:"column",gap:10}}>{CAMPS.map(c2=>{const m=STG[c2.sg];return <button key={c2.id} onClick={()=>{setCamp(c2);setDs("ready")}} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",borderRadius:14,border:`1.5px solid ${C.bd}`,background:C.bg,cursor:"pointer",textAlign:"left",width:"100%"}}><div style={{width:44,height:44,borderRadius:12,background:m?.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{m?.ic}</div><div style={{flex:1}}><div style={{fontSize:15,fontWeight:600}}>{c2.n}</div><div style={{fontSize:13,color:C.t3,marginTop:2}}>{c2.ct} courses · {c2.m}</div></div><I s={16} k={C.t3}><polyline points="9 18 15 12 9 6"/></I></button>})}</div><button onClick={()=>{setCamp(CAMPS[2]);setDs("connected");setSec(0);setNotes("")}} style={{marginTop:24,padding:"10px 20px",borderRadius:10,background:C.gD,border:`1.5px solid ${C.gB}`,color:C.gT,fontSize:13,fontWeight:600,cursor:"pointer"}}>Demo: jump to live call</button><button onClick={()=>{setCamp(CAMPS[0]);setDs("complete")}} style={{marginTop:8,padding:"10px 20px",borderRadius:10,background:C.sf,border:`1.5px solid ${C.bd}`,color:C.t2,fontSize:13,fontWeight:600,cursor:"pointer"}}>Demo: campaign complete</button></div>;

  if(ds==="ready")return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:32,textAlign:"center"}}><div style={{fontSize:13,fontWeight:600,color:C.t3,textTransform:"uppercase",marginBottom:8}}>Campaign loaded</div><div style={{fontSize:24,fontWeight:700,marginBottom:4}}>{camp?.n}</div><div style={{fontSize:15,color:C.t2,marginBottom:24}}>{camp?.ct} courses · {camp?.m} dialing</div><div style={{width:"100%",maxWidth:380,background:C.sf,borderRadius:14,border:`1px solid ${C.bd}`,padding:"12px 0",marginBottom:28}}><div style={{fontSize:12,fontWeight:600,color:C.t3,textTransform:"uppercase",padding:"0 16px 10px",borderBottom:`1px solid ${C.bd}`}}>Next up</div>{sorted.slice(0,4).map((c2,i)=><div key={c2.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:i<3?`1px solid ${C.rs}`:"none"}}><M s={14} c={C.t3}>{i+1}</M><div style={{flex:1,textAlign:"left"}}><div style={{fontSize:14,fontWeight:500}}>{c2.n}</div><div style={{fontSize:12,color:C.t3}}>{c2.b||"Unknown"}</div></div><Pl sg={c2.sg}/></div>)}</div><button onClick={()=>setDs("dialing")} style={{width:180,height:180,borderRadius:"50%",background:"linear-gradient(135deg,#10B981,#059669)",border:"none",color:"white",fontSize:22,fontWeight:700,cursor:"pointer",boxShadow:"0 8px 32px rgba(16,185,129,0.35)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}><I s={40} k="white" w={2.5}><polygon points="5 3 19 12 5 21 5 3"/></I>Start dialing</button><button onClick={()=>{setCamp(null);setDs("idle")}} style={{marginTop:16,background:"none",border:"none",color:C.t3,fontSize:14,cursor:"pointer",textDecoration:"underline"}}>Change campaign</button></div>;

  if(ds==="dialing"||ds==="ringing"){const isR=ds==="ringing";const nx=sorted[0];return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:32,textAlign:"center"}}><div style={{fontSize:14,fontWeight:600,color:isR?C.aT:C.bT,textTransform:"uppercase",letterSpacing:"1px",marginBottom:16}}>{isR?"Ringing...":"Dialing..."}</div><div style={{width:72,height:72,borderRadius:"50%",background:isR?C.aD:C.bD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,marginBottom:16,border:`3px solid ${isR?C.aB:C.bB}`}}>⛳</div><div style={{fontSize:22,fontWeight:700,marginBottom:4}}>{nx.n}</div><div style={{fontSize:15,color:C.t2,marginBottom:8}}>{nx.b||"Unknown"} · {nx.t}</div><Pl sg={nx.sg}/><div style={{marginTop:24}}><Btn onClick={()=>setDs("paused")}>Pause dialer</Btn></div><button onClick={()=>setDs("idle")} style={{marginTop:12,background:"none",border:"none",color:C.red,fontSize:13,cursor:"pointer"}}>Stop session</button></div>}

  if(ds==="paused")return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:32,textAlign:"center"}}><div style={{width:72,height:72,borderRadius:"50%",background:C.aD,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20}}><I s={32} k={C.amb}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></I></div><div style={{fontSize:24,fontWeight:700,marginBottom:4}}>Paused</div><div style={{fontSize:15,color:C.t2,marginBottom:28}}>{camp?.n}</div><button onClick={()=>setDs("dialing")} style={{width:150,height:150,borderRadius:"50%",background:"linear-gradient(135deg,#10B981,#059669)",border:"none",color:"white",fontSize:20,fontWeight:700,cursor:"pointer",boxShadow:"0 8px 32px rgba(16,185,129,0.3)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}><I s={36} k="white" w={2.5}><polygon points="5 3 19 12 5 21 5 3"/></I>Resume</button><div style={{display:"flex",gap:10,marginTop:20}}><Btn onClick={()=>{setCamp(null);setDs("idle")}}>End session</Btn><Btn onClick={()=>setDs("idle")}>Switch campaign</Btn></div></div>;

  if(ds==="wrapup"){return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:32,textAlign:"center"}}><div style={{width:64,height:64,borderRadius:"50%",background:disp?C.gD:C.aD,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>{disp?<I s={28} k={C.grn}><polyline points="20 6 9 17 4 12"/></I>:<I s={28} k={C.amb}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></I>}</div><div style={{fontSize:22,fontWeight:700,marginBottom:4}}>{disp?"Call complete":"Set disposition"}</div><div style={{fontSize:15,color:C.t2,marginBottom:6}}>{act.n}</div>{disp&&<div style={{fontSize:14,color:C.grn,fontWeight:600,marginBottom:16}}>Outcome: {disp}</div>}{!disp&&<div style={{width:"100%",maxWidth:360,marginTop:12,display:"flex",flexDirection:"column",gap:8}}>{disps.map(d=><button key={d.l} onClick={()=>{setDisp(d.l);if(d.cap)setMod("sample")}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:12,border:`1.5px solid ${d.p?d.c+"55":C.bd}`,background:d.p?d.c+"08":C.bg,color:C.t1,fontSize:14,fontWeight:d.p?600:500,cursor:"pointer",textAlign:"left",width:"100%",fontFamily:"'DM Sans',sans-serif"}}><div style={{width:10,height:10,borderRadius:"50%",background:d.c}}/><div style={{flex:1}}><div>{d.l}</div><div style={{fontSize:12,color:C.t3}}>{d.a}</div></div>{d.p&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:6,background:d.c+"18",color:d.c,fontWeight:700}}>WIN</span>}</button>)}</div>}{disp&&<div style={{display:"flex",gap:10,marginTop:16}}><Btn primary onClick={()=>setDs("dialing")}>Dial next</Btn><Btn onClick={()=>setDs("paused")}>Pause</Btn></div>}</div>}

  // CAMPAIGN COMPLETE
  if(ds==="complete")return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:32,textAlign:"center"}}>
    <div style={{width:80,height:80,borderRadius:"50%",background:C.gD,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20}}><I s={36} k={C.grn}><polyline points="20 6 9 17 4 12"/></I></div>
    <div style={{fontSize:24,fontWeight:700,marginBottom:4}}>Campaign complete!</div>
    <div style={{fontSize:15,color:C.t2,marginBottom:24}}>{camp?.n} — all courses dialed</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,width:"100%",maxWidth:420,marginBottom:28}}>
      {[["Dials","142",C.t1],["Connects","38",C.grn],["Samples","8",C.pur],["Gatekeepers","24",C.amb],["Buyers","14",C.blu],["Orders","3",C.grn]].map(([l,v,c])=>
        <div key={l} style={{background:C.sf,borderRadius:12,padding:"14px",border:`1px solid ${C.bd}`}}>
          <M s={22} c={c}>{v}</M>
          <div style={{fontSize:11,color:C.t3,marginTop:4}}>{l}</div>
        </div>
      )}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%",maxWidth:320}}>
      <Btn primary full onClick={()=>{setCamp(null);setDs("idle")}}>Start another campaign</Btn>
      <Btn full onClick={()=>setDs("ready")}>Re-queue unanswered</Btn>
      <button onClick={()=>{}} style={{background:"none",border:"none",color:C.blu,fontSize:14,cursor:"pointer",fontWeight:600,marginTop:4}}>View session report →</button>
    </div>
    <div style={{background:C.aD,border:`1px solid ${C.aB}`,borderRadius:12,padding:"12px 16px",marginTop:24,width:"100%",maxWidth:420,textAlign:"left"}}>
      <div style={{fontSize:13,fontWeight:600,color:C.aT,marginBottom:4}}>3 callbacks scheduled</div>
      <div style={{fontSize:13,color:C.t2}}>Jeff Willis (tmrw 9am) · Valley View (tmrw 2pm) · Hobble Creek (Wed 10am)</div>
    </div>
  </div>;

  // CONNECTED
  const sendDtmf=(d)=>{setDtmf(prev=>prev+d);/* In production: callRef.current.sendDigits(d) */};
  return <div style={{display:"grid",gridTemplateColumns:"280px minmax(0,1fr) 280px",height:"100%",overflow:"hidden"}}>
    {mod==="sample"&&<SamMod c={act} onClose={()=>setMod(null)} onDone={()=>{setMod(null);setDisp("Sending sample");setDs("wrapup")}}/>}
    {mod==="order"&&<OrdMod c={act} onClose={()=>setMod(null)} onDone={()=>{setMod(null);setDisp("Placing order!");setDs("wrapup")}}/>}
    {/* Dialpad overlay */}
    {pad&&<div style={{position:"fixed",inset:0,zIndex:250,display:"flex",alignItems:"center",justifyContent:"center"}}><div onClick={()=>setPad(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.2)"}}/><div style={{position:"relative",background:C.bg,borderRadius:20,padding:"24px 28px",width:320,boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><span style={{fontSize:16,fontWeight:700}}>Dialpad</span><button onClick={()=>setPad(false)} style={{background:"none",border:"none",color:C.t3,fontSize:18,cursor:"pointer"}}>✕</button></div>
      {dtmf&&<div style={{background:C.sf,borderRadius:10,padding:"10px 14px",marginBottom:14,fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:600,letterSpacing:4,textAlign:"center",color:C.t1}}>{dtmf}</div>}
      {/* IVR shortcut */}
      <div style={{background:C.bD,border:`1px solid ${C.bB}`,borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:13,color:C.bT,fontWeight:600}}>Pro Shop shortcut:</span>
        <button onClick={()=>sendDtmf("2")} style={{padding:"6px 16px",borderRadius:8,background:C.blu,color:"white",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>Press 2</button>
        <button onClick={()=>{}} style={{background:"none",border:"none",color:C.t3,fontSize:11,cursor:"pointer",textDecoration:"underline"}}>Edit</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {["1","2","3","4","5","6","7","8","9","*","0","#"].map(d=>(
          <button key={d} onClick={()=>sendDtmf(d)} style={{padding:"16px 0",borderRadius:12,fontSize:22,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",background:C.sf,border:`1.5px solid ${C.bd}`,color:C.t1,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            {d}
            <span style={{fontSize:8,color:C.t3,fontWeight:400,letterSpacing:1}}>{d==="2"?"ABC":d==="3"?"DEF":d==="4"?"GHI":d==="5"?"JKL":d==="6"?"MNO":d==="7"?"PQRS":d==="8"?"TUV":d==="9"?"WXYZ":""}</span>
          </button>
        ))}
      </div>
      <button onClick={()=>{setDtmf("");setPad(false)}} style={{width:"100%",marginTop:12,padding:"10px",borderRadius:10,background:C.sf,border:`1px solid ${C.bd}`,color:C.t2,fontSize:13,fontWeight:500,cursor:"pointer"}}>Clear & close</button>
    </div></div>}
    <Queue/>
    <div style={{display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Sticky top */}
      <div style={{flexShrink:0,padding:"12px 20px",borderBottom:`1px solid ${C.bd}`,zIndex:5}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:C.gD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>⛳</div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16,fontWeight:600}}>{act.n}</span><Pl sg={act.sg}/>{act.sam?.s==="delivered"&&<span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:999,background:C.oD,color:C.oT,border:`1px solid ${C.oB}`}}>Sample delivered</span>}</div>
              <div style={{fontSize:13,color:C.t2}}>{act.b?`${act.b} · ${act.bt}`:`${act.t} · ${act.ci}`}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            {showTog&&<div style={{display:"flex",background:C.rs,borderRadius:10,padding:3,gap:3}}>{["gatekeeper","buyer"].map(m=><button key={m} onClick={()=>setMode(m)} style={{padding:"5px 14px",borderRadius:8,fontSize:12,fontWeight:600,border:"none",cursor:"pointer",background:mode===m?(m==="buyer"?C.gD:C.aD):"transparent",color:mode===m?(m==="buyer"?C.gT:C.aT):C.t3}}>{m==="gatekeeper"?"🏢 Gate":"🤝 Buyer"}</button>)}</div>}
            <div style={{textAlign:"right"}}><M c={C.grn} s={22}>{fmt(sec)}</M><div style={{fontSize:10,color:C.t3}}>Duration</div></div>
          </div>
        </div>
        {/* Phone + Caller ID indicators */}
        <div style={{display:"flex",gap:16,marginTop:8,fontSize:12}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{color:C.t3}}>Calling:</span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:C.t1}}>{act.pp||act.ph}</span>
            <span style={{color:C.t3}}>— {act.pp?"Pro Shop":"Main"}</span>
            {act.ph&&act.pp&&<select style={{marginLeft:4,padding:"2px 6px",borderRadius:6,border:`1px solid ${C.bd}`,fontSize:11,color:C.blu,background:C.bg,cursor:"pointer"}}><option>Pro Shop</option><option>Main line</option>{act.bp&&<option>Buyer direct</option>}</select>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{color:C.t3}}>From:</span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:C.t1}}>(801) 555-9999</span>
            <span style={{color:C.t3}}>— UT local</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,marginLeft:"auto"}}>
            <span style={{color:C.t3}}>🕐</span>
            <span style={{color:C.t1,fontWeight:500}}>2:34 PM MST</span>
          </div>
        </div>
      </div>
      {/* IVR quick bar */}
      <div style={{flexShrink:0,padding:"8px 20px",background:C.bD,borderBottom:`1px solid ${C.bB}`,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:12,fontWeight:600,color:C.bT}}>IVR:</span>
        {[["2","Pro Shop"],["0","Operator"],["1","Tee Times"]].map(([d,lb])=>(
          <button key={d} onClick={()=>sendDtmf(d)} style={{padding:"5px 14px",borderRadius:8,background:C.bg,border:`1.5px solid ${C.bB}`,fontSize:13,fontWeight:600,cursor:"pointer",color:C.bT,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{d}</span> {lb}
          </button>
        ))}
        <button onClick={()=>setPad(true)} style={{padding:"5px 10px",borderRadius:8,background:"transparent",border:`1px solid ${C.bB}`,fontSize:12,color:C.bT,cursor:"pointer"}}>Full dialpad</button>
        {dtmf&&<span style={{marginLeft:"auto",fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:C.bT,fontWeight:600}}>Sent: {dtmf}</span>}
      </div>
      {/* Quick capture bar — gatekeeper mode only */}
      {isGk&&<div style={{flexShrink:0,padding:"10px 20px",background:C.aD,borderBottom:`1px solid ${C.aB}`,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:11,fontWeight:600,color:C.aT,whiteSpace:"nowrap"}}>Quick capture:</span>
        <input placeholder="Buyer name" style={{flex:1,padding:"6px 10px",borderRadius:8,border:`1.5px solid ${C.aB}`,fontSize:13,fontFamily:"'DM Sans',sans-serif",background:C.bg,color:C.t1,minWidth:0}} defaultValue={act.b||""}/>
        <input placeholder="Title" style={{width:100,padding:"6px 10px",borderRadius:8,border:`1.5px solid ${C.aB}`,fontSize:13,fontFamily:"'DM Sans',sans-serif",background:C.bg,color:C.t1}}/>
        <input placeholder="Direct #" style={{width:110,padding:"6px 10px",borderRadius:8,border:`1.5px solid ${C.aB}`,fontSize:13,fontFamily:"'JetBrains Mono',monospace",background:C.bg,color:C.t1}}/>
        <input placeholder="Ext" style={{width:50,padding:"6px 10px",borderRadius:8,border:`1.5px solid ${C.aB}`,fontSize:13,fontFamily:"'JetBrains Mono',monospace",background:C.bg,color:C.t1,textAlign:"center"}}/>
        <select style={{padding:"6px 8px",borderRadius:8,border:`1.5px solid ${C.aB}`,fontSize:12,background:C.bg,color:C.t1}}><option>Best time...</option><option>Morning</option><option>Afternoon</option><option>Anytime</option></select>
        <button style={{padding:"6px 14px",borderRadius:8,background:C.amb,border:"none",color:"white",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>Save</button>
      </div>}
      {/* Scrollable workspace */}
      <div className="sb" style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>{act.sam?.s==="delivered"&&<div style={{background:C.oD,border:`1px solid ${C.oB}`,borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:13}}><span style={{fontWeight:600,color:C.oT}}>✓ Delivered {act.sam.de}</span> · {act.sam.co} {act.sam.sz}</div>}<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><div style={{display:"flex",flexDirection:"column",gap:12}}><div><Lb r={isGk?"🏢 Gate":"🤝 Buyer"}>{(STG[act.sg]||{}).l} script</Lb><div style={{background:C.sf,border:`1px solid ${C.bd}`,borderLeft:`3px solid ${accent}`,borderRadius:12,padding:"14px 16px",fontSize:13,lineHeight:1.7,color:C.t2}}>{script.map((s,i)=><div key={i}><div style={{fontWeight:600,color:accent===C.amb?C.aT:C.bT,fontSize:10,textTransform:"uppercase",margin:i===0?"0 0 5px":"12px 0 5px"}}>{s.t}</div><p style={{margin:0}}>{s.s.replace(/\[buyer\]/g,act.b||"[buyer]").replace(/\[color\]/g,act.sam?.co||"[color]")}</p></div>)}</div></div><MCalc/></div><div style={{display:"flex",flexDirection:"column",gap:12}}><div><Lb>Notes</Lb><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Type notes..." style={{width:"100%",minHeight:100,padding:"12px",background:C.sf,border:`1px solid ${C.bd}`,borderRadius:12,color:C.t1,fontFamily:"'DM Sans',sans-serif",fontSize:13,lineHeight:1.6,resize:"vertical",outline:"none"}}/></div><div><Lb>{isGk?"Gate outcome":"Outcome"}</Lb><div style={{display:"flex",flexDirection:"column",gap:5}}>{disps.map(d=><button key={d.l} onClick={()=>{setDisp(d.l);if(d.cap)setMod("sample");else setDs("wrapup")}} style={{display:"flex",alignItems:"center",gap:8,padding:d.p?"10px 12px":"8px 12px",borderRadius:10,border:`1.5px solid ${disp===d.l?d.c:d.p?d.c+"55":C.bd}`,background:disp===d.l?d.c+"12":d.p?d.c+"06":C.bg,color:C.t1,fontSize:12,fontWeight:d.p?600:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textAlign:"left",width:"100%"}}><div style={{width:8,height:8,borderRadius:"50%",background:d.c}}/><div style={{flex:1}}><div>{d.l}</div><div style={{fontSize:10,color:C.t3}}>{d.a}</div></div>{d.p&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:5,background:d.c+"18",color:d.c,fontWeight:700}}>WIN</span>}</button>)}</div></div></div></div></div>
      {/* Floating controls */}
      <div style={{flexShrink:0,padding:"14px 24px 16px",background:C.sf,borderTop:`2px solid ${C.bd}`,display:"flex",alignItems:"center",justifyContent:"center",gap:16}}>
        <div style={{display:"flex",gap:3,alignItems:"center",height:24,marginRight:12}}>{[0,.1,.2,.3,.15,.25,.08,.22].map((d,i)=><div key={i} style={{width:3,borderRadius:2,background:C.grn,animation:`cmw .7s ${d}s ease-in-out infinite alternate`,height:10}}/>)}</div>
        <CB label="Mute"><I s={20} k={C.t2}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></I></CB>
        <CB label="Hold"><I s={20} k={C.t2}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></I></CB>
        <CB big danger onClick={()=>setDs("wrapup")}><I s={26} k="white"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="1" y1="1" x2="23" y2="23"/></I></CB>
        <CB label="VM Drop"><I s={20} k={C.t2}><circle cx="5.5" cy="11.5" r="4.5"/><circle cx="18.5" cy="11.5" r="4.5"/><line x1="5.5" y1="16" x2="18.5" y2="16"/></I></CB>
        <CB label="Skip" onClick={()=>setDs("dialing")}><I s={20} k={C.t2}><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></I></CB>
      </div>
    </div>
    <Intel/>
  </div>;
}

// ═══════════════════════════════════════
//  APP SHELL
// ═══════════════════════════════════════
export default function CallMyntApp(){
  const[pg,setPg]=useState("dialer");const[search,setSearch]=useState(false);const[notif,setNotif]=useState(false);const[selCourse,setSelCourse]=useState(null);const[avDrop,setAvDrop]=useState(false);const[agSt,setAgSt]=useState("available");
  const nav=[{id:"dialer",lb:"Dialer",ic:<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>},{id:"courses",lb:"Courses",ic:<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>},{id:"campaigns",lb:"Campaigns",ic:<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>},{id:"samples",lb:"Samples",ic:<><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/></>},{id:"orders",lb:"Orders",ic:<><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>},{id:"calls",lb:"Calls",ic:<><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></>},{id:"coaching",lb:"Coach",ic:<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>},{id:"stats",lb:"Stats",ic:<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>},{id:"settings",lb:"Settings",ic:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>}];

  return <div style={{fontFamily:"'DM Sans',sans-serif",background:C.bg,color:C.t1,height:"100vh",display:"grid",gridTemplateColumns:"56px 1fr",gridTemplateRows:"52px 1fr",overflow:"hidden"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');@keyframes cmw{0%{height:4px}100%{height:18px}}@keyframes cmb{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.1;transform:scale(1.06)}}.sb::-webkit-scrollbar{width:4px}.sb::-webkit-scrollbar-track{background:transparent}.sb::-webkit-scrollbar-thumb{background:${C.ac};border-radius:4px}input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}`}</style>
    {search&&<SearchMod onClose={()=>setSearch(false)}/>}
    {notif&&<NotifDrop onClose={()=>setNotif(false)}/>}

    {/* TOPBAR */}
    <div style={{gridColumn:"1/-1",display:"flex",alignItems:"center",padding:"0 16px",borderBottom:`1px solid ${C.bd}`,gap:12,position:"relative"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,fontWeight:700,fontSize:15}}><I s={20} k={C.grn}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></I><span>Call</span><span style={{color:C.grn}}>Mynt</span></div>
      <div style={{flex:1,display:"flex",justifyContent:"center",gap:6}}>{[["Dials",247],["Connects",38,C.grn],["Samples",8,C.pur],["Orders",3,C.blu]].map(([l,v,c])=><div key={l} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",background:C.sf,borderRadius:8,border:`1px solid ${C.bd}`}}><span style={{fontSize:10,color:C.t3,textTransform:"uppercase",fontWeight:600}}>{l}</span><M s={13} c={c}>{v}</M></div>)}</div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button onClick={()=>setSearch(true)} style={{width:36,height:36,borderRadius:10,border:`1px solid ${C.bd}`,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><I s={16} k={C.t3}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></I></button>
        <button onClick={()=>setNotif(!notif)} style={{width:36,height:36,borderRadius:10,border:`1px solid ${C.bd}`,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}}><I s={16} k={C.t3}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></I><div style={{position:"absolute",top:6,right:6,width:8,height:8,borderRadius:"50%",background:C.red,border:"2px solid white"}}/></button>
        <div style={{position:"relative"}}>
          <button onClick={()=>{setAvDrop(!avDrop);setNotif(false)}} style={{width:32,height:32,borderRadius:"50%",background:C.bD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:C.bT,border:"none",cursor:"pointer",position:"relative"}}>AJ<div style={{position:"absolute",bottom:-1,right:-1,width:10,height:10,borderRadius:"50%",background:agSt==="available"?C.grn:agSt==="break"?C.amb:agSt==="dnd"?C.red:C.t3,border:"2px solid white"}}/></button>
          {avDrop&&<div style={{position:"absolute",top:42,right:0,width:260,background:C.bg,borderRadius:14,border:`1px solid ${C.bd}`,boxShadow:"0 12px 40px rgba(0,0,0,0.1)",zIndex:200,overflow:"hidden"}}>
            <div style={{padding:"16px 18px",borderBottom:`1px solid ${C.bd}`,display:"flex",alignItems:"center",gap:12}}><div style={{width:40,height:40,borderRadius:"50%",background:C.bD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:600,color:C.bT}}>AJ</div><div><div style={{fontSize:14,fontWeight:600}}>Alex Johnson</div><div style={{fontSize:12,color:C.t3}}>alex@byrdgang.com</div></div></div>
            <div style={{padding:"8px 10px",borderBottom:`1px solid ${C.bd}`}}>{[["available","Available",C.grn],["break","On Break",C.amb],["dnd","Do Not Disturb",C.red],["offline","Offline",C.t3]].map(([id,lb,co])=><button key={id} onClick={()=>setAgSt(id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 10px",borderRadius:8,border:"none",background:agSt===id?C.sf:"transparent",cursor:"pointer",fontSize:13,color:C.t1,fontFamily:"'DM Sans',sans-serif"}}><div style={{width:8,height:8,borderRadius:"50%",background:co}}/>{lb}{agSt===id&&<span style={{marginLeft:"auto",fontSize:11,color:C.grn}}>✓</span>}</button>)}</div>
            <div style={{padding:"6px 10px"}}>{[["My Profile","settings"],["Keyboard Shortcuts",null],["Help & Support",null],["Log Out",null]].map(([lb,pg2])=><button key={lb} onClick={()=>{if(pg2){setPg(pg2)};setAvDrop(false)}} style={{display:"flex",alignItems:"center",width:"100%",padding:"9px 10px",borderRadius:8,border:"none",background:"transparent",cursor:"pointer",fontSize:13,color:lb==="Log Out"?C.red:C.t1,fontFamily:"'DM Sans',sans-serif"}}>{lb}</button>)}</div>
          </div>}
        </div>
      </div>
    </div>

    {/* SIDEBAR */}
    <div style={{background:C.sf,borderRight:`1px solid ${C.bd}`,display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 0",gap:2,overflowY:"auto"}}>
      {nav.filter(n=>n.id!=="settings").map(n=><button key={n.id} onClick={()=>{setPg(n.id);setSelCourse(null)}} title={n.lb} style={{width:38,height:38,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:"none",color:pg===n.id?C.grn:C.t3,background:pg===n.id?C.gD:"transparent"}}><I s={20} k={pg===n.id?C.grn:C.t3}>{n.ic}</I></button>)}
      <div style={{flex:1}}/>
      <button onClick={()=>{setPg("settings");setSelCourse(null)}} title="Settings" style={{width:38,height:38,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:"none",color:pg==="settings"?C.grn:C.t3,background:pg==="settings"?C.gD:"transparent"}}><I s={20} k={pg==="settings"?C.grn:C.t3}>{nav.find(n=>n.id==="settings").ic}</I></button>
    </div>

    {/* MAIN */}
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
