import { useState, useEffect, useRef, useMemo, useCallback } from "react";

// ─── Colour palette ───────────────────────────────────────────────────────────
const PC = {
  bg:"#faf8fc", surface:"#ffffff", s2:"#f5f0fb", s3:"#ede7f6",
  border:"#d8cce8", accent:"#7c3aed", a2:"#9333ea", a3:"#059669",
  text:"#1a1025", muted:"#7e6a9a", red:"#dc2626", yellow:"#b45309",
  green:"#059669", purple:"#9333ea", orange:"#f97316",
};

// ─── Math utils ───────────────────────────────────────────────────────────────
const mid = (a,b) => a&&b ? {x:(a.x+b.x)/2,y:(a.y+b.y)/2,visibility:Math.min(a.visibility||0,b.visibility||0)} : null;
const r1  = v => v!==null&&v!==undefined&&!isNaN(v) ? Math.round(v*10)/10 : null;
const clamp = (v,mn,mx) => Math.max(mn,Math.min(mx,v));

function calcAngleDeg(a,b) {
  if(!a||!b) return null;
  let angle = Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
  if(angle>90) angle-=180; if(angle<-90) angle+=180;
  return Math.round(angle*10)/10;
}
function vec3Angle(a,b,c) {
  if(!a||!b||!c) return null;
  const ab={x:a.x-b.x,y:a.y-b.y}, cb={x:c.x-b.x,y:c.y-b.y};
  const dot=ab.x*cb.x+ab.y*cb.y;
  const mag=Math.sqrt((ab.x**2+ab.y**2)*(cb.x**2+cb.y**2));
  if(mag===0) return null;
  return Math.round(Math.acos(Math.min(1,Math.max(-1,dot/mag)))*1800/Math.PI)/10;
}
function dist2D(a,b){ return (!a||!b)?null:Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2); }

const MIN_VIS = 0.45;

// ─── Measurement Engine ───────────────────────────────────────────────────────
function measureLandmarks(lm) {
  if(!lm||lm.length<33) return {};
  const g=i=>lm[i];
  const V=i=>(lm[i]?.visibility||0)>=MIN_VIS;
  const Vb=(...idx)=>idx.every(i=>V(i));

  const shMid    = Vb(11,12)?mid(g(11),g(12)):null;
  const hipMid   = Vb(23,24)?mid(g(23),g(24)):null;
  const kneeMid  = Vb(25,26)?mid(g(25),g(26)):null;
  const ankleMid = Vb(27,28)?mid(g(27),g(28)):null;
  const earMid   = Vb(7,8)?mid(g(7),g(8)):null;
  const heelMid  = Vb(29,30)?mid(g(29),g(30)):null;
  const footMid  = Vb(31,32)?mid(g(31),g(32)):null;

  const shoulderAngle   = Vb(11,12)?calcAngleDeg(g(12),g(11)):null;
  const pelvisAngle     = Vb(23,24)?calcAngleDeg(g(24),g(23)):null;
  const eyeLevelAngle   = Vb(2,5)?calcAngleDeg(g(5),g(2)):null;
  const headTiltAngle   = Vb(7,8)?r1(calcAngleDeg(g(8),g(7))):null;
  const headTiltSide    = headTiltAngle!==null?(headTiltAngle>0?"Left":"Right"):null;

  const headLateralOffset  = shMid&&V(0)?r1((g(0).x-shMid.x)*100):null;
  const trunkLateralShift  = shMid&&hipMid?r1((shMid.x-hipMid.x)*100):null;
  const weightBearingShift = hipMid&&footMid?r1((hipMid.x-footMid.x)*100):null;
  const spinalDeviation    = V(0)&&hipMid?r1((g(0).x-hipMid.x)*100):null;
  const waistAsymmetry     = Vb(11,13)&&Vb(12,14)?r1(Math.abs(Math.abs(g(13).x-g(11).x)-Math.abs(g(14).x-g(12).x))*100):null;

  // CVA
  let cvaAngle=null;
  if(earMid&&shMid){
    const dx=Math.abs(earMid.x-shMid.x), dy=Math.abs(earMid.y-shMid.y);
    if(dy>0.04&&earMid.visibility>=0.35) cvaAngle=r1(clamp(Math.atan2(dy,dx)*180/Math.PI,20,88));
  }
  const fhpNorm = shMid&&earMid?r1((earMid.x-shMid.x)*100):null;

  // Thoracic kyphosis proxy
  let thoracicAngle=null;
  if(shMid&&hipMid){
    const dx=shMid.x-hipMid.x, dy=Math.abs(shMid.y-hipMid.y);
    if(dy>0.06) thoracicAngle=r1(clamp(32+Math.atan2(Math.abs(dx),dy)*180/Math.PI*1.8,20,80));
  }

  // Lumbar proxy
  let lumbarProxy=null;
  if(hipMid&&kneeMid&&heelMid) lumbarProxy=r1((hipMid.x-(kneeMid.x+heelMid.x)/2)*100);
  const hipExtensionProxy = hipMid&&ankleMid?r1((hipMid.x-ankleMid.x)*100):null;

  // Knees
  const leftKneeAngle  = Vb(23,25,27)?vec3Angle(g(23),g(25),g(27)):null;
  const rightKneeAngle = Vb(24,26,28)?vec3Angle(g(24),g(26),g(28)):null;
  const leftKneeDev    = leftKneeAngle!==null?r1(leftKneeAngle-180):null;
  const rightKneeDev   = rightKneeAngle!==null?r1(rightKneeAngle-180):null;
  const leftKneeFrontal  = Vb(23,25,27)?r1(calcAngleDeg(g(23),g(25))-calcAngleDeg(g(25),g(27))):null;
  const rightKneeFrontal = Vb(24,26,28)?r1(calcAngleDeg(g(24),g(26))-calcAngleDeg(g(26),g(28))):null;

  const kneeSymmetry = Vb(25,26)?{left:g(25).y,right:g(26).y,diff:r1((g(25).y-g(26).y)*100)}:null;
  const lldProxy = kneeSymmetry?r1(Math.abs(kneeSymmetry.diff)*1.8):null;
  const lldSide  = kneeSymmetry?(kneeSymmetry.diff>0?"Left":"Right"):null;

  // Syndrome indices
  const ucsIndex = (shMid&&earMid&&cvaAngle!==null)
    ? r1(clamp(((55-cvaAngle)/15)*0.5+Math.abs(shoulderAngle||0)/15*0.5,0,2)) : null;
  const lcsIndex = (lumbarProxy!==null&&pelvisAngle!==null)
    ? r1(clamp(Math.abs(lumbarProxy)/20*0.5+Math.abs(pelvisAngle)/10*0.5,0,2)) : null;

  return {
    shoulderAngle, pelvisAngle, eyeLevelAngle, headTiltAngle, headTiltSide,
    headLateralOffset, trunkLateralShift, weightBearingShift, spinalDeviation, waistAsymmetry,
    cvaAngle, fhpNorm, thoracicAngle, lumbarProxy, hipExtensionProxy,
    leftKneeDev, rightKneeDev, leftKneeFrontal, rightKneeFrontal,
    lldProxy, lldSide, ucsIndex, lcsIndex, kneeSymmetry,
    pelvicTiltSagittal: lumbarProxy,
    cobbEstimate: (spinalDeviation!==null&&waistAsymmetry!==null)
      ? r1(clamp((Math.abs(spinalDeviation||0)+Math.abs(waistAsymmetry||0))/2,0,35)):null,
    cogDeviation: spinalDeviation,
  };
}

// ─── Reliability Engine ───────────────────────────────────────────────────────
function calcReliability(lm) {
  if(!lm||lm.length<33) return {score:0,status:"No Pose",blocked:true,warnings:[{icon:"❌",text:"No pose detected",color:PC.red}]};
  const KEY=[0,7,8,11,12,23,24,25,26,27,28];
  const visVals=KEY.map(i=>(lm[i]?.visibility||0));
  const avg=visVals.reduce((a,b)=>a+b,0)/visVals.length;
  const score=Math.round(clamp(avg*120,0,100));
  const low=KEY.filter(i=>(lm[i]?.visibility||0)<MIN_VIS);
  const warnings=[];
  if(low.length>4) warnings.push({icon:"⚠",text:`${low.length} key landmarks low confidence — reposition`,color:PC.yellow});
  const blocked=score<25;
  const status=score>=80?"Excellent":score>=60?"Good":score>=40?"Fair":"Poor";
  return {score,status,blocked,warnings};
}

// ─── Findings Engine ──────────────────────────────────────────────────────────
function buildFindings(lm, view, m) {
  if(!lm||!m) return [];
  const out=[];
  const add=(region,text,severity,correction,icd="M99.0")=>out.push({region,text,severity,correction,icd});

  const isLat=view==="left"||view==="right";

  // Frontal findings
  if(!isLat){
    if(m.shoulderAngle!==null&&Math.abs(m.shoulderAngle)>3){
      const abs=Math.abs(m.shoulderAngle), side=m.shoulderAngle>0?"Left":"Right";
      add("Shoulder Girdle",`${side} shoulder elevated (${abs.toFixed(1)}°)`,abs>7?"high":"moderate",
        "Release upper trapezius + levator scapulae. Activate lower trapezius Y-T-W ×15. Check ipsilateral QL overactivity.","M54.2");
    }
    if(m.pelvisAngle!==null&&Math.abs(m.pelvisAngle)>3){
      const abs=Math.abs(m.pelvisAngle), high=m.pelvisAngle>0?"Left":"Right";
      add("Pelvis / SIJ",`${high} ASIS elevated (${abs.toFixed(1)}°)${m.lldProxy&&m.lldProxy>5?" — LLD suspected":""}`,abs>7?"high":"moderate",
        "Assess true LLD (tape ASIS→medial malleolus). QL release elevated side. Hip abductor strengthening. SIJ provocation cluster.","M53.3");
    }
    if(m.headTiltAngle!==null&&Math.abs(m.headTiltAngle)>2){
      const abs=Math.abs(m.headTiltAngle);
      add("Head / Cervical",`Head tilt — ${m.headTiltSide||""} ear lower (${abs.toFixed(1)}°)`,abs>5?"high":"moderate",
        "Assess C1–C2 rotation restriction. Inhibit ipsilateral SCM + scalene. Activate contralateral deep neck flexors.","M43.6");
    }
    if(m.trunkLateralShift!==null&&Math.abs(m.trunkLateralShift)>3.5){
      const abs=Math.abs(m.trunkLateralShift), side=m.trunkLateralShift>0?"right":"left";
      add("Thoracic",`Trunk shifted ${side} (${abs.toFixed(1)}%)`,abs>7?"high":"moderate",
        "Assess antalgic lean (disc/radiculopathy). Lateral trunk stretch contralateral. Rib mobilisation. Mirror feedback.","M54.5");
    }
    if(m.spinalDeviation!==null&&Math.abs(m.spinalDeviation)>4){
      const abs=Math.abs(m.spinalDeviation);
      add("Spine",`Head not centred over pelvis (${abs.toFixed(1)}%)`,abs>8?"high":"moderate",
        "Adam's forward bend test — check rib hump. Refer for standing AP X-ray if structural scoliosis suspected.","M41.9");
    }
    if(m.waistAsymmetry!==null&&m.waistAsymmetry>3){
      add("Scoliosis Screen",`Waist triangle asymmetry (${m.waistAsymmetry.toFixed(1)}%)`,m.waistAsymmetry>6?"high":"moderate",
        "Adam's forward bend test. Treat lateral trunk shift driver. Rib cage mobilisation. Mirror biofeedback.","M41.9");
    }
    if(m.leftKneeFrontal!==null&&Math.abs(m.leftKneeFrontal)>5){
      const abs=Math.abs(m.leftKneeFrontal), pattern=m.leftKneeFrontal<0?"valgus":"varus";
      add("Knee",`Left knee ${pattern} (${abs.toFixed(1)}°)`,abs>10?"high":"moderate",
        m.leftKneeFrontal<0?"Glute med: clamshells, lateral band walks. VMO: terminal knee extensions. Foot tripod.":"Hip ER strengthening. ITB/TFL SMR. Assess subtalar supination.","M21.0");
    }
    if(m.rightKneeFrontal!==null&&Math.abs(m.rightKneeFrontal)>5){
      const abs=Math.abs(m.rightKneeFrontal), pattern=m.rightKneeFrontal<0?"valgus":"varus";
      add("Knee",`Right knee ${pattern} (${abs.toFixed(1)}°)`,abs>10?"high":"moderate",
        m.rightKneeFrontal<0?"Glute med: clamshells, lateral band walks. VMO: terminal knee extensions. Foot tripod.":"Hip ER strengthening. ITB/TFL SMR. Assess subtalar supination.","M21.0");
    }
    if(m.ucsIndex!==null&&m.ucsIndex>0.6){
      add("Upper Crossed Syndrome",`UCS pattern (index ${m.ucsIndex.toFixed(1)})`,m.ucsIndex>1?"high":"moderate",
        "INHIBIT: upper trap, SCM, pec minor ×90s. ACTIVATE: deep neck flexors, lower trap Y-T-W, serratus. MOBILISE: thoracic extension T4–T8.","M62.9");
    }
    if(m.lldProxy!==null&&m.lldProxy>5){
      add("Leg Length",`Functional LLD suspected — ~${m.lldProxy.toFixed(0)}mm (${m.lldSide} shorter)`,m.lldProxy>10?"high":"moderate",
        "Confirm with tape measure ASIS→medial malleolus. If LLD >5mm: heel wedge trial 3–5mm. Treat SIJ/QL if functional.","M21.7");
    }
  }

  // Sagittal findings
  if(isLat){
    if(m.cvaAngle!==null&&m.cvaAngle<55){
      const abs=55-m.cvaAngle;
      add("Cervical / CVA",`Forward head posture — CVA ${m.cvaAngle.toFixed(1)}° (normal >55°)`,m.cvaAngle<49?"high":"moderate",
        "DNF chin nod ×10 ×3 daily. Thoracic extension foam roller T4–T8. Pec minor stretch doorframe 30s×3. Monitor posture.","M43.1");
    }
    if(m.thoracicAngle!==null&&m.thoracicAngle>45){
      const abs=m.thoracicAngle-45;
      add("Thoracic Kyphosis",`Increased kyphosis (${m.thoracicAngle.toFixed(1)}°, normal 20–45°)`,m.thoracicAngle>55?"high":"moderate",
        "Thoracic extension foam roller T4–T8 ×2min. Pec stretch bilateral. Lower trap activation Y-T-W ×15. Postural cueing.","M40.0");
    }
    if(m.lumbarProxy!==null&&Math.abs(m.lumbarProxy)>5){
      const dir=m.lumbarProxy>0?"Anterior":"Posterior";
      add("Pelvis / Lumbar",`${dir} pelvic tilt (${Math.abs(m.lumbarProxy).toFixed(1)}%)`,Math.abs(m.lumbarProxy)>10?"high":"moderate",
        m.lumbarProxy>0
          ?"Hip flexor stretch (Thomas test position 30s×3). Glute activation: bridges ×20. Abdominal hollowing. QL release."
          :"Hamstring stretch 30s×3. Hip flexor activation. Lumbar extension mobility. Assess disc pathology.","M40.3");
    }
    if(m.hipExtensionProxy!==null&&Math.abs(m.hipExtensionProxy)>5){
      const dir=m.hipExtensionProxy>0?"anterior":"posterior";
      add("Hip / Global",`Hip displaced ${dir} to ankle plumb (${Math.abs(m.hipExtensionProxy).toFixed(1)}%)`,Math.abs(m.hipExtensionProxy)>10?"high":"moderate",
        "Assess hip flexor length (Thomas test). Retrain global sagittal alignment with mirror biofeedback.","M99.0");
    }
    if(m.leftKneeDev!==null&&m.leftKneeDev<-5){
      add("Knee",`Knee hyperextension / genu recurvatum (${Math.abs(m.leftKneeDev).toFixed(1)}°)`,m.leftKneeDev<-12?"high":"moderate",
        "Hamstring strengthening. Avoid terminal knee lock in stance. Beighton hypermobility screen. Proprioception training.","M21.1");
    }
    if(m.lcsIndex!==null&&m.lcsIndex>0.5){
      add("Lower Crossed Syndrome",`LCS pattern (index ${m.lcsIndex.toFixed(1)})`,m.lcsIndex>1?"high":"moderate",
        "INHIBIT: hip flexors, QL, thoracolumbar fascia. ACTIVATE: glutes (bridges), transverse abdominis. MOBILISE: hip flexor.","M62.9");
    }
  }

  return out;
}

// ─── Score Engine ─────────────────────────────────────────────────────────────
function scorePosture(m, findings, reliability) {
  if(!m||!findings) return {score:0,band:"No Data",colour:PC.muted};
  let penalty=0;
  const P=(val,t1,t2,p1,p2)=>{if(val<=0)return;const n=Math.min(1,(val)/(Math.max(0.01,t2-t1)));penalty+=p1+(p2-p1)*n;};
  P(Math.abs(m.shoulderAngle||0),3,7,3,8);
  P(Math.abs(m.pelvisAngle||0),3,7,4,10);
  P(Math.abs(m.trunkLateralShift||0),3.5,7,4,9);
  P(Math.abs(m.headLateralOffset||0),2.5,6,3,7);
  P(m.cvaAngle!==null?Math.max(0,55-m.cvaAngle):0,6,14,5,13);
  P((m.thoracicAngle||32)>45?(m.thoracicAngle||32)-45:0,8,18,4,10);
  P(Math.abs(m.lumbarProxy||0),4,9,3,8);
  P(Math.abs(m.leftKneeFrontal||0),5,10,3,7);
  P(Math.abs(m.rightKneeFrontal||0),5,10,3,7);
  findings.forEach((f,i)=>{
    const base=f.severity==="high"?8:f.severity==="moderate"?4:1;
    penalty+=base*Math.max(0.35,1-i*0.12);
  });
  const relFactor=0.5+((reliability?.score||50)/100)*0.5;
  penalty*=relFactor;
  const score=clamp(Math.round(100-penalty),0,100);
  const band=score>=88?"Optimal":score>=74?"Good":score>=58?"Fair":score>=40?"Needs Attention":"Priority Review";
  const colour=score>=74?PC.green:score>=58?PC.yellow:PC.red;
  return {score,band,colour};
}

// ─── Canvas overlay renderer ──────────────────────────────────────────────────
function drawOverlay({ctx,W,H,lm,view,showGrid}) {
  if(!ctx||!lm) return;
  ctx.clearRect(0,0,W,H);
  const g=i=>lm[i];
  const V=i=>(lm[i]?.visibility||0)>=0.4;
  const PX=i=>lm[i]?[lm[i].x*W,lm[i].y*H]:null;

  if(showGrid){
    ctx.strokeStyle="rgba(255,255,255,0.06)"; ctx.lineWidth=0.5;
    for(let c=0;c<=12;c++){const x=W/12*c;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let r=0;r<=16;r++){const y=H/16*r;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  }

  const isLat=view==="left"||view==="right";

  // Plumb line
  if(!isLat){
    const hm=V(23)&&V(24)?mid(g(23),g(24)):null;
    const gx=hm?hm.x*W:W/2;
    ctx.save(); ctx.shadowColor="rgba(0,229,255,0.6)"; ctx.shadowBlur=8;
    ctx.setLineDash([10,6]); ctx.strokeStyle="rgba(0,229,255,0.7)"; ctx.lineWidth=1.8;
    ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke();
    ctx.restore(); ctx.setLineDash([]);
  } else {
    const hi=view==="right"?24:23, shi=view==="right"?12:11, ki=view==="right"?26:25;
    const ai=view==="right"?28:27, ei=view==="right"?8:7;
    const pts=[V(ei)?PX(ei):null, V(shi)?PX(shi):null, V(hi)?PX(hi):null, V(ki)?PX(ki):null, V(ai)?PX(ai):null].filter(Boolean);
    if(pts.length>=2){
      ctx.save(); ctx.shadowColor="rgba(0,229,255,0.5)"; ctx.shadowBlur=6;
      ctx.setLineDash([8,5]); ctx.strokeStyle="rgba(0,229,255,0.6)"; ctx.lineWidth=1.5;
      ctx.beginPath(); pts.forEach((p,i)=>i===0?ctx.moveTo(p[0],p[1]):ctx.lineTo(p[0],p[1])); ctx.stroke();
      ctx.restore(); ctx.setLineDash([]);
    }
  }

  // Skeleton connections
  const CONNECTIONS=[
    [11,12],[11,23],[12,24],[23,24],
    [11,13],[13,15],[12,14],[14,16],
    [23,25],[25,27],[24,26],[26,28],
    [27,29],[28,30],[27,31],[28,32],
    [7,8],[0,7],[0,8],
  ];
  ctx.strokeStyle="rgba(124,58,237,0.55)"; ctx.lineWidth=2; ctx.setLineDash([]);
  CONNECTIONS.forEach(([a,b])=>{
    if(!V(a)||!V(b)) return;
    const pa=PX(a), pb=PX(b);
    if(!pa||!pb) return;
    ctx.beginPath(); ctx.moveTo(pa[0],pa[1]); ctx.lineTo(pb[0],pb[1]); ctx.stroke();
  });

  // Joint dots
  const JOINTS=[0,7,8,11,12,13,14,23,24,25,26,27,28];
  JOINTS.forEach(i=>{
    if(!V(i)) return;
    const p=PX(i); if(!p) return;
    ctx.beginPath(); ctx.arc(p[0],p[1],5,0,Math.PI*2);
    ctx.fillStyle="rgba(147,51,234,0.85)"; ctx.fill();
    ctx.strokeStyle="#fff"; ctx.lineWidth=1.5; ctx.stroke();
  });
}

// ─── MediaPipe loader ─────────────────────────────────────────────────────────
function loadScript(src){
  return new Promise((res,rej)=>{
    if(document.querySelector(`script[src="${src}"]`)){res();return;}
    const s=document.createElement("script");
    s.src=src; s.onload=res; s.onerror=rej;
    document.head.appendChild(s);
  });
}
const MP_CDN="https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404";

// ─── View config ──────────────────────────────────────────────────────────────
const VIEWS={
  anterior:{label:"Frontal",short:"Front",colour:PC.accent,icon:"⬆",helper:"Patient faces camera, feet hip-width, arms relaxed."},
  posterior:{label:"Posterior",short:"Back",colour:PC.a2,icon:"⬇",helper:"Patient faces away. Scapulae and heels visible."},
  left:{label:"Sagittal L",short:"Left",colour:PC.yellow,icon:"◀",helper:"Left side toward camera. Ear–shoulder–hip–ankle in frame."},
  right:{label:"Sagittal R",short:"Right",colour:PC.green,icon:"▶",helper:"Right side toward camera. Ear–shoulder–hip–ankle in frame."},
};

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({score,band,colour,size=80}){
  if(score===null||score===undefined||!colour) return null;
  const r=(size/2)-7, circ=2*Math.PI*r, dash=(score/100)*circ;
  return(
    <div style={{textAlign:"center"}}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${colour}25`} strokeWidth={9}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={colour} strokeWidth={9}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}/>
        <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
          fill={colour} fontSize={size>70?18:14} fontWeight={900}>{score}</text>
        <text x={size/2} y={size/2+14} textAnchor="middle" dominantBaseline="middle"
          fill={colour} fontSize={8} fontWeight={700}>{band?.slice?.(0,8)}</text>
      </svg>
    </div>
  );
}

// ─── Finding Card ─────────────────────────────────────────────────────────────
function FindingCard({f}){
  const [open,setOpen]=useState(false);
  const col=f.severity==="high"?PC.red:f.severity==="moderate"?PC.yellow:PC.green;
  return(
    <div onClick={()=>setOpen(o=>!o)} style={{border:`1px solid ${col}30`,borderRadius:10,padding:"10px 12px",marginBottom:7,background:`${col}08`,cursor:"pointer"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:col,marginTop:5,flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{fontSize:"0.72rem",fontWeight:700,color:PC.text,lineHeight:1.3}}>{f.text}</div>
          <div style={{fontSize:"0.6rem",color:PC.muted,marginTop:2}}>{f.region} · {f.icd}</div>
        </div>
        <div style={{fontSize:"0.65rem",color:col,fontWeight:700,flexShrink:0}}>{f.severity?.toUpperCase()}</div>
        <div style={{color:PC.muted,fontSize:"0.8rem"}}>{open?"▲":"▼"}</div>
      </div>
      {open&&(
        <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${col}20`,fontSize:"0.68rem",color:PC.muted,lineHeight:1.6}}>
          <strong style={{color:col}}>Treatment: </strong>{f.correction}
        </div>
      )}
    </div>
  );
}

// ─── Metric Row ───────────────────────────────────────────────────────────────
function MetricRow({label,value,unit,normal,abnormal}){
  if(value===null||value===undefined) return null;
  const abs=Math.abs(value);
  const isAbnormal=abnormal?abs>abnormal:false;
  const isModerate=normal?abs>normal:false;
  const col=isAbnormal?PC.red:isModerate?PC.yellow:PC.green;
  return(
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${PC.border}`}}>
      <div style={{flex:1,fontSize:"0.68rem",color:PC.muted}}>{label}</div>
      <div style={{fontSize:"0.75rem",fontWeight:800,color:col,minWidth:60,textAlign:"right"}}>{typeof value==="number"?value.toFixed(1):value}{unit}</div>
      <div style={{width:8,height:8,borderRadius:"50%",background:col,flexShrink:0}}/>
    </div>
  );
}

// ─── History hook (in-memory only) ───────────────────────────────────────────
function useHistory(){
  const [sessions,setSessions]=useState([]);
  const save=useCallback((s)=>setSessions(prev=>[...prev.slice(-19),s]),[]);
  const clear=useCallback(()=>setSessions([]),[]);
  return {sessions,save,clear};
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function PostureAnalysisModule(){
  const [mode,setMode]=useState("upload");
  const [view,setView]=useState("anterior");
  const [mpStatus,setMpStatus]=useState("loading");
  const [camStatus,setCamStatus]=useState("idle");
  const [camFacing,setCamFacing]=useState("environment");
  const [tab,setTab]=useState("capture");
  const [landmarks,setLandmarks]=useState(null);
  const [measurements,setMeasurements]=useState(null);
  const [findings,setFindings]=useState([]);
  const [scoreData,setScoreData]=useState(null);
  const [reliability,setReliability]=useState(null);
  const [uploadedImg,setUploadedImg]=useState(null);
  const [capturedImg,setCapturedImg]=useState(null);
  const [analysing,setAnalysing]=useState(false);
  const [error,setError]=useState(null);
  const [countdown,setCountdown]=useState(null);
  const [showHeatmap]=useState(true);
  const [showGrid,setShowGrid]=useState(true);
  const {sessions,save:saveSession,clear:clearHistory}=useHistory();
  const [showHistory,setShowHistory]=useState(false);

  const videoRef=useRef(null);
  const overlayRef=useRef(null);
  const poseRef=useRef(null);
  const streamRef=useRef(null);
  const rafRef=useRef(null);
  const viewRef=useRef(view);
  const liveHandlerRef=useRef(null);
  const fileInputRef=useRef(null);
  const objectUrlRef=useRef(null);

  useEffect(()=>{viewRef.current=view;},[view]);

  // ── Load MediaPipe ──────────────────────────────────────────────────────────
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        await loadScript(`${MP_CDN}/pose.js`);
        await loadScript(`${MP_CDN}/pose_solution_simd_wasm_bin.js`);
        if(cancelled) return;
        const pose=new window.Pose({locateFile:f=>`${MP_CDN}/${f}`});
        pose.setOptions({modelComplexity:1,smoothLandmarks:true,enableSegmentation:false,minDetectionConfidence:0.5,minTrackingConfidence:0.5});
        await pose.initialize();
        if(!cancelled){poseRef.current=pose; setMpStatus("ready");}
      }catch(e){
        if(!cancelled) setMpStatus("error");
      }
    })();
    return()=>{cancelled=true;};
  },[]);

  // ── Process landmarks ───────────────────────────────────────────────────────
  const processLandmarks=useCallback((lm,v)=>{
    const m=measureLandmarks(lm);
    const r=calcReliability(lm);
    const f=r.blocked?[]:buildFindings(lm,v||viewRef.current,m);
    const s=scorePosture(m,f,r);
    setLandmarks(lm); setMeasurements(m); setFindings(f); setReliability(r); setScoreData(s);
  },[]);

  // ── Analyse uploaded image ──────────────────────────────────────────────────
  async function analysePhoto(url,v){
    if(!poseRef.current||mpStatus!=="ready") return null;
    return new Promise(resolve=>{
      const img=new Image();
      img.onload=async()=>{
        const W=img.naturalWidth, H=img.naturalHeight;
        let resolved=false;
        const handler=results=>{
          if(resolved) return; resolved=true;
          if(results.poseLandmarks?.length>0){
            const lm=results.poseLandmarks;
            processLandmarks(lm,v);
            const oc=document.createElement("canvas"); oc.width=W; oc.height=H;
            const octx=oc.getContext("2d"); octx.drawImage(img,0,0,W,H);
            drawOverlay({ctx:octx,W,H,lm,view:v,showGrid:true});
            const annotated=oc.toDataURL("image/jpeg",0.92);
            resolve({lm,annotated});
          } else { resolve(null); }
          if(liveHandlerRef.current) poseRef.current.onResults(liveHandlerRef.current);
        };
        poseRef.current.onResults(handler);
        const t=setTimeout(()=>{if(!resolved){resolved=true;resolve(null);}},8000);
        try{ await poseRef.current.send({image:img}); }
        catch(e){ if(!resolved){resolved=true;resolve(null);} }
        finally{ clearTimeout(t); }
      };
      img.onerror=()=>resolve(null);
      img.src=url;
    });
  }

  // ── Handle file upload ──────────────────────────────────────────────────────
  async function handleFile(e){
    const file=e.target.files?.[0]; if(!file) return;
    if(objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url=URL.createObjectURL(file); objectUrlRef.current=url;
    setError(null); setAnalysing(true); setUploadedImg(url); setTab("capture");
    const result=await analysePhoto(url,view);
    setAnalysing(false);
    if(result){ setUploadedImg(result.annotated); setTab("findings"); }
    else{ setError("No pose detected. Ensure full body is visible."); }
    e.target.value="";
  }

  // ── Camera ──────────────────────────────────────────────────────────────────
  async function startCamera(facing="environment"){
    if(!poseRef.current||mpStatus!=="ready"){setError("AI not ready yet");return;}
    setCamStatus("starting"); setError(null);
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facing,width:{ideal:1280},height:{ideal:720}}});
      streamRef.current=stream; setCamFacing(facing);
      const video=videoRef.current;
      video.srcObject=stream;
      await new Promise(res=>{video.onloadedmetadata=()=>{video.play().then(res).catch(res);};});
      setCamStatus("active");
      const handler=results=>{
        if(results.poseLandmarks?.length>0) processLandmarks(results.poseLandmarks);
        if(overlayRef.current&&videoRef.current){
          const W=videoRef.current.videoWidth||640, H=videoRef.current.videoHeight||480;
          overlayRef.current.width=W; overlayRef.current.height=H;
          const ctx=overlayRef.current.getContext("2d");
          drawOverlay({ctx,W,H,lm:results.poseLandmarks,view:viewRef.current,showGrid});
        }
      };
      liveHandlerRef.current=handler;
      poseRef.current.onResults(handler);
      const loop=async()=>{
        if(!streamRef.current){return;}
        if(videoRef.current?.readyState>=2){
          try{ await poseRef.current.send({image:videoRef.current}); }catch(_){}
        }
        rafRef.current=requestAnimationFrame(loop);
      };
      rafRef.current=requestAnimationFrame(loop);
    }catch(e){
      setCamStatus("error"); setError("Camera access denied or unavailable.");
    }
  }

  function stopCamera(){
    if(rafRef.current) cancelAnimationFrame(rafRef.current);
    if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current=null;}
    setCamStatus("idle"); setLandmarks(null); setMeasurements(null); setFindings([]); setScoreData(null);
  }

  function flipCamera(){ stopCamera(); setTimeout(()=>startCamera(camFacing==="user"?"environment":"user"),300); }

  async function capturePhoto(delay=0){
    if(delay>0){
      for(let i=delay;i>=1;i--){ setCountdown(i); await new Promise(r=>setTimeout(r,1000)); }
    }
    setCountdown(null);
    const video=videoRef.current; if(!video||video.readyState<2) return;
    const W=video.videoWidth, H=video.videoHeight;
    const cc=document.createElement("canvas"); cc.width=W; cc.height=H;
    const ctx=cc.getContext("2d"); ctx.drawImage(video,0,0,W,H);
    if(landmarks) drawOverlay({ctx,W,H,lm:landmarks,view,showGrid:true});
    const dataUrl=cc.toDataURL("image/jpeg",0.92);
    setCapturedImg(dataUrl);
    if(measurements&&findings&&scoreData&&reliability){
      saveSession({view,time:new Date().toISOString(),score:scoreData?.score,band:scoreData?.band,findings:findings.length,img:dataUrl});
    }
    setTab("findings");
  }

  useEffect(()=>()=>{stopCamera();},[]);

  const isLive=mode==="live";
  const camReady=camStatus==="active";
  const hasData=!!landmarks;
  const viewMeta=VIEWS[view]||VIEWS.anterior;
  const highFindings=findings.filter(f=>f.severity==="high");
  const otherFindings=findings.filter(f=>f.severity!=="high");

  const displayImg=isLive?capturedImg:uploadedImg;

  // ── View switch handler ─────────────────────────────────────────────────────
  async function handleViewSwitch(newView){
    setView(newView);
    if(!isLive&&objectUrlRef.current&&mpStatus==="ready"){
      setAnalysing(true); setError(null);
      const result=await analysePhoto(objectUrlRef.current,newView);
      setAnalysing(false);
      if(result){ setUploadedImg(result.annotated); }
      else{ setError("Could not re-analyse — ensure full body is visible"); }
    }
  }

  return(
    <div style={{background:PC.bg,minHeight:"100vh",fontFamily:"system-ui,-apple-system,sans-serif",maxWidth:600,margin:"0 auto"}}>

      {/* ── Header ── */}
      <div style={{padding:"12px 16px",borderBottom:`1px solid ${PC.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:PC.surface,position:"sticky",top:0,zIndex:10}}>
        <div>
          <div style={{fontWeight:900,fontSize:"0.95rem",background:`linear-gradient(90deg,${PC.accent},${PC.a2})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            📐 Posture Analysis
          </div>
          <div style={{fontSize:"0.6rem",color:PC.muted,marginTop:1}}>Clinical-grade biomechanical assessment</div>
        </div>
        <div style={{display:"flex",gap:7,alignItems:"center"}}>
          <div style={{padding:"3px 9px",borderRadius:20,fontSize:"0.58rem",fontWeight:700,
            background:mpStatus==="ready"?"rgba(5,150,105,0.12)":mpStatus==="loading"?"rgba(180,83,9,0.12)":"rgba(220,38,38,0.12)",
            color:mpStatus==="ready"?PC.green:mpStatus==="loading"?PC.yellow:PC.red,
            border:`1px solid ${mpStatus==="ready"?PC.green:mpStatus==="loading"?PC.yellow:PC.red}40`}}>
            {mpStatus==="ready"?"🤖 AI Ready":mpStatus==="loading"?"⏳ Loading…":"❌ AI Error"}
          </div>
          <button onClick={()=>setShowHistory(h=>!h)} style={{padding:"4px 9px",background:`${PC.a2}15`,border:`1px solid ${PC.a2}30`,borderRadius:8,color:PC.a2,fontSize:"0.65rem",fontWeight:700,cursor:"pointer"}}>
            📁 {sessions.length}
          </button>
        </div>
      </div>

      {/* ── Mode toggle ── */}
      <div style={{padding:"10px 16px",background:PC.surface,borderBottom:`1px solid ${PC.border}`,display:"flex",gap:8}}>
        {[["upload","📤 Upload"],["live","📷 Live"]].map(([m,label])=>(
          <button key={m} onClick={()=>{setMode(m);if(m==="live")setTab("capture");else{stopCamera();setTab("capture");}}}
            style={{flex:1,padding:"9px",borderRadius:10,border:`1px solid ${mode===m?viewMeta.colour:PC.border}`,background:mode===m?`${viewMeta.colour}15`:"transparent",color:mode===m?viewMeta.colour:PC.muted,fontWeight:700,fontSize:"0.78rem",cursor:"pointer"}}>
            {label}
          </button>
        ))}
      </div>

      {/* ── View selector ── */}
      <div style={{padding:"10px 16px",background:PC.s2,borderBottom:`1px solid ${PC.border}`}}>
        <div style={{fontSize:"0.56rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:7}}>Select View</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
          {Object.entries(VIEWS).map(([key,meta])=>{
            const active=view===key;
            return(
              <button key={key} onClick={()=>handleViewSwitch(key)}
                style={{padding:"9px 5px",borderRadius:10,border:`1px solid ${active?meta.colour:PC.border}`,background:active?`${meta.colour}18`:"transparent",cursor:"pointer",textAlign:"center"}}>
                <div style={{fontSize:"1rem",marginBottom:2}}>{meta.icon}</div>
                <div style={{fontSize:"0.62rem",fontWeight:800,color:active?meta.colour:PC.muted}}>{meta.short}</div>
              </button>
            );
          })}
        </div>
        <div style={{marginTop:7,padding:"6px 10px",background:`${viewMeta.colour}08`,border:`1px solid ${viewMeta.colour}20`,borderRadius:9,fontSize:"0.65rem",color:PC.muted}}>
          {viewMeta.helper}
        </div>
      </div>

      {/* ── Camera / Upload ── */}
      {isLive?(
        <div>
          {!camReady?(
            <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:9}}>
              {error&&<div style={{padding:"9px 12px",background:"rgba(220,38,38,0.08)",border:`1px solid ${PC.red}30`,borderRadius:9,fontSize:"0.74rem",color:PC.red}}>{error}</div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
                {[["environment","📷 Back Camera"],["user","🤳 Front Camera"]].map(([f,label])=>(
                  <button key={f} onClick={()=>startCamera(f)} disabled={mpStatus!=="ready"}
                    style={{padding:"13px",borderRadius:12,border:`1px solid ${PC.border}`,background:PC.surface,color:mpStatus==="ready"?PC.text:PC.muted,fontWeight:700,fontSize:"0.78rem",cursor:mpStatus==="ready"?"pointer":"not-allowed"}}>
                    {label}
                  </button>
                ))}
              </div>
              {camStatus==="starting"&&<div style={{textAlign:"center",color:PC.yellow,fontSize:"0.76rem"}}>⏳ Starting camera…</div>}
            </div>
          ):(
            <div>
              <div style={{position:"relative",background:"#0a0a14",aspectRatio:"4/3",maxHeight:340,overflow:"hidden"}}>
                <video ref={videoRef} playsInline muted autoPlay style={{width:"100%",height:"100%",objectFit:"cover",transform:"scaleX(-1)"}}/>
                <canvas ref={overlayRef} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",transform:"scaleX(-1)",pointerEvents:"none"}}/>
                <div style={{position:"absolute",top:8,left:8,display:"flex",gap:5}}>
                  <div style={{padding:"3px 8px",borderRadius:8,background:"rgba(0,0,0,0.7)",fontSize:"0.6rem",fontWeight:700,color:hasData?PC.green:PC.yellow}}>
                    {hasData?`🟢 Tracking · ${reliability?.score}%`:"🟡 Searching…"}
                  </div>
                </div>
                {scoreData&&<div style={{position:"absolute",top:8,right:8}}><ScoreRing score={scoreData.score} band={scoreData.band} colour={scoreData.colour} size={70}/></div>}
                {countdown!==null&&(
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.4)"}}>
                    <div style={{fontSize:"5rem",fontWeight:900,color:"#fff"}}>{countdown}</div>
                  </div>
                )}
              </div>
              <div style={{padding:"10px 14px",background:PC.surface,borderTop:`1px solid ${PC.border}`,display:"flex",gap:8}}>
                <button onClick={()=>capturePhoto(0)} disabled={!hasData}
                  style={{flex:2,padding:"11px",background:hasData?`linear-gradient(135deg,${PC.accent},${PC.a2})`:"#e5e7eb",border:"none",borderRadius:10,color:hasData?"#fff":PC.muted,fontWeight:800,fontSize:"0.78rem",cursor:hasData?"pointer":"not-allowed"}}>
                  📸 Capture
                </button>
                <button onClick={()=>capturePhoto(3)} disabled={!hasData}
                  style={{flex:1,padding:"11px",background:`${PC.a2}20`,border:`1px solid ${PC.a2}30`,borderRadius:10,color:PC.a2,fontWeight:700,fontSize:"0.72rem",cursor:hasData?"pointer":"not-allowed"}}>
                  ⏳ 3s
                </button>
                <button onClick={flipCamera} style={{flex:"0 0 44px",padding:"11px",background:PC.s2,border:`1px solid ${PC.border}`,borderRadius:10,cursor:"pointer"}}>🔄</button>
                <button onClick={stopCamera} style={{flex:"0 0 44px",padding:"11px",background:"rgba(220,38,38,0.1)",border:`1px solid ${PC.red}30`,borderRadius:10,color:PC.red,cursor:"pointer"}}>⏹</button>
              </div>
            </div>
          )}
        </div>
      ):(
        <div style={{padding:"16px"}}>
          {error&&<div style={{padding:"9px 12px",background:"rgba(220,38,38,0.08)",border:`1px solid ${PC.red}30`,borderRadius:9,fontSize:"0.74rem",color:PC.red,marginBottom:10}}>{error}</div>}
          <button onClick={()=>fileInputRef.current?.click()} disabled={mpStatus!=="ready"||analysing}
            style={{width:"100%",padding:"18px",borderRadius:14,border:`2px dashed ${mpStatus==="ready"?viewMeta.colour:PC.border}`,background:`${viewMeta.colour}08`,color:mpStatus==="ready"?viewMeta.colour:PC.muted,fontWeight:700,fontSize:"0.82rem",cursor:mpStatus==="ready"&&!analysing?"pointer":"not-allowed",textAlign:"center"}}>
            {analysing?"⏳ Analysing…":"📁 Tap to upload photo"}
            <div style={{fontSize:"0.65rem",fontWeight:400,marginTop:4,color:PC.muted}}>JPG, PNG — full body, clear background</div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
          {uploadedImg&&(
            <div style={{marginTop:12,borderRadius:12,overflow:"hidden",border:`1px solid ${PC.border}`}}>
              <img src={uploadedImg} alt="Analysed" style={{width:"100%",display:"block"}}/>
            </div>
          )}
        </div>
      )}

      {/* ── Tab bar ── */}
      {(measurements||capturedImg)&&(
        <div style={{borderTop:`1px solid ${PC.border}`,borderBottom:`1px solid ${PC.border}`,background:PC.surface,display:"flex",overflowX:"auto"}}>
          {[["findings",`🔍 Findings${findings.length?" ("+findings.length+")":""}`],["metrics","📊 Metrics"],["history","📁 History"]].map(([t,label])=>(
            <button key={t} onClick={()=>setTab(t)}
              style={{flex:1,minWidth:80,padding:"10px 8px",border:"none",borderBottom:`3px solid ${tab===t?PC.accent:"transparent"}`,background:"transparent",color:tab===t?PC.accent:PC.muted,fontWeight:700,fontSize:"0.68rem",cursor:"pointer",whiteSpace:"nowrap"}}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Tab content ── */}
      <div style={{padding:"0 0 80px"}}>

        {/* Findings */}
        {tab==="findings"&&measurements&&(
          <div style={{padding:"14px 16px"}}>
            {scoreData&&(
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14,padding:"14px",background:PC.surface,borderRadius:12,border:`1px solid ${scoreData.colour}30`}}>
                <ScoreRing score={scoreData.score} band={scoreData.band} colour={scoreData.colour} size={80}/>
                <div>
                  <div style={{fontWeight:900,fontSize:"0.9rem",color:scoreData.colour}}>{scoreData.band}</div>
                  <div style={{fontSize:"0.68rem",color:PC.muted,marginTop:3}}>
                    {findings.length} finding{findings.length!==1?"s":""} · {highFindings.length} high priority
                  </div>
                  <div style={{fontSize:"0.62rem",color:PC.muted,marginTop:2}}>Reliability: {reliability?.score}% ({reliability?.status})</div>
                </div>
              </div>
            )}
            {findings.length===0&&(
              <div style={{textAlign:"center",padding:"30px",color:PC.muted,fontSize:"0.8rem"}}>
                {!measurements?"Upload or capture a photo to begin.":`✅ No significant postural deviations detected in ${VIEWS[view]?.label} view.`}
              </div>
            )}
            {highFindings.length>0&&(
              <div style={{marginBottom:10}}>
                <div style={{fontSize:"0.62rem",fontWeight:700,color:PC.red,textTransform:"uppercase",letterSpacing:"1px",marginBottom:7}}>⚠ High Priority</div>
                {highFindings.map((f,i)=><FindingCard key={i} f={f}/>)}
              </div>
            )}
            {otherFindings.length>0&&(
              <div>
                <div style={{fontSize:"0.62rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:7}}>Other Findings</div>
                {otherFindings.map((f,i)=><FindingCard key={i} f={f}/>)}
              </div>
            )}
          </div>
        )}

        {/* Metrics */}
        {tab==="metrics"&&measurements&&(
          <div style={{padding:"14px 16px"}}>
            <div style={{fontSize:"0.62rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>Frontal Plane</div>
            <MetricRow label="Shoulder Tilt" value={measurements.shoulderAngle} unit="°" normal={3} abnormal={7}/>
            <MetricRow label="Pelvic Obliquity" value={measurements.pelvisAngle} unit="°" normal={3} abnormal={7}/>
            <MetricRow label="Head Tilt" value={measurements.headTiltAngle} unit="°" normal={2} abnormal={5}/>
            <MetricRow label="Trunk Lateral Shift" value={measurements.trunkLateralShift} unit="%" normal={3.5} abnormal={7}/>
            <MetricRow label="Head Lateral Offset" value={measurements.headLateralOffset} unit="%" normal={2.5} abnormal={6}/>
            <MetricRow label="Spinal Deviation" value={measurements.spinalDeviation} unit="%" normal={4} abnormal={8}/>
            <MetricRow label="Waist Asymmetry" value={measurements.waistAsymmetry} unit="%" normal={3} abnormal={6}/>
            <MetricRow label="L Knee Frontal" value={measurements.leftKneeFrontal} unit="°" normal={5} abnormal={10}/>
            <MetricRow label="R Knee Frontal" value={measurements.rightKneeFrontal} unit="°" normal={5} abnormal={10}/>
            <MetricRow label="Weight-Bearing Shift" value={measurements.weightBearingShift} unit="%" normal={4} abnormal={8}/>
            <MetricRow label="LLD Proxy" value={measurements.lldProxy} unit="mm" normal={5} abnormal={10}/>

            <div style={{fontSize:"0.62rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginTop:14,marginBottom:10}}>Sagittal Plane</div>
            <MetricRow label="CVA Angle" value={measurements.cvaAngle} unit="°" normal={55} abnormal={49}/>
            <MetricRow label="Forward Head" value={measurements.fhpNorm} unit="%" normal={3} abnormal={7}/>
            <MetricRow label="Thoracic Kyphosis" value={measurements.thoracicAngle} unit="°" normal={45} abnormal={55}/>
            <MetricRow label="Lumbar Proxy" value={measurements.lumbarProxy} unit="%" normal={5} abnormal={10}/>
            <MetricRow label="Hip Extension Proxy" value={measurements.hipExtensionProxy} unit="%" normal={5} abnormal={10}/>
            <MetricRow label="L Knee Deviation" value={measurements.leftKneeDev} unit="°" normal={5} abnormal={12}/>
            <MetricRow label="R Knee Deviation" value={measurements.rightKneeDev} unit="°" normal={5} abnormal={12}/>

            <div style={{fontSize:"0.62rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginTop:14,marginBottom:10}}>Syndrome Indices</div>
            <MetricRow label="UCS Index" value={measurements.ucsIndex} unit="" normal={0.6} abnormal={1.0}/>
            <MetricRow label="LCS Index" value={measurements.lcsIndex} unit="" normal={0.5} abnormal={1.0}/>
          </div>
        )}

        {/* History */}
        {tab==="history"&&(
          <div style={{padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:"0.8rem",color:PC.text}}>Session History</div>
              {sessions.length>0&&<button onClick={clearHistory} style={{fontSize:"0.65rem",color:PC.red,background:"none",border:"none",cursor:"pointer"}}>Clear</button>}
            </div>
            {sessions.length===0&&<div style={{textAlign:"center",color:PC.muted,fontSize:"0.78rem",padding:"20px"}}>No sessions yet. Capture or analyse a photo to start tracking.</div>}
            {[...sessions].reverse().map((s,i)=>(
              <div key={i} style={{padding:"10px 12px",borderRadius:10,border:`1px solid ${PC.border}`,marginBottom:8,background:PC.surface}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontWeight:700,fontSize:"0.72rem",color:PC.text}}>{VIEWS[s.view]?.label||s.view} · Score {s.score}</div>
                  <div style={{fontSize:"0.6rem",color:PC.muted}}>{new Date(s.time).toLocaleString()}</div>
                </div>
                <div style={{fontSize:"0.65rem",color:PC.muted,marginTop:3}}>{s.band} · {s.findings} finding{s.findings!==1?"s":""}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── History modal (floating) ── */}
      {showHistory&&(
        <div onClick={()=>setShowHistory(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:50,display:"flex",alignItems:"flex-end"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:600,margin:"0 auto",background:PC.surface,borderRadius:"16px 16px 0 0",padding:"20px 16px",maxHeight:"70vh",overflowY:"auto"}}>
            <div style={{fontWeight:800,fontSize:"0.9rem",color:PC.text,marginBottom:12}}>📁 Session History ({sessions.length})</div>
            {sessions.length===0&&<div style={{color:PC.muted,fontSize:"0.78rem"}}>No sessions yet.</div>}
            {[...sessions].reverse().map((s,i)=>(
              <div key={i} style={{padding:"10px 12px",borderRadius:10,border:`1px solid ${PC.border}`,marginBottom:8}}>
                <div style={{fontWeight:700,fontSize:"0.72rem"}}>{VIEWS[s.view]?.label} · Score {s.score} — {s.band}</div>
                <div style={{fontSize:"0.62rem",color:PC.muted,marginTop:2}}>{new Date(s.time).toLocaleString()} · {s.findings} findings</div>
              </div>
            ))}
            <button onClick={()=>setShowHistory(false)} style={{marginTop:12,width:"100%",padding:"12px",background:`${PC.accent}15`,border:`1px solid ${PC.accent}30`,borderRadius:10,color:PC.accent,fontWeight:700,cursor:"pointer"}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
