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

// ─── Manual Landmark Definitions ─────────────────────────────────────────────
// Maps manual point index to MediaPipe landmark index (where applicable)
const MANUAL_POINTS_FRONTAL = [
  { id:0,  label:"Head top",        mpIdx:0,  desc:"Top of head" },
  { id:1,  label:"L Eye",           mpIdx:2,  desc:"Left eye centre" },
  { id:2,  label:"R Eye",           mpIdx:5,  desc:"Right eye centre" },
  { id:3,  label:"L Ear",           mpIdx:7,  desc:"Left ear tragus" },
  { id:4,  label:"R Ear",           mpIdx:8,  desc:"Right ear tragus" },
  { id:5,  label:"L Shoulder",      mpIdx:11, desc:"Left acromion" },
  { id:6,  label:"R Shoulder",      mpIdx:12, desc:"Right acromion" },
  { id:7,  label:"L Elbow",         mpIdx:13, desc:"Left lateral epicondyle" },
  { id:8,  label:"R Elbow",         mpIdx:14, desc:"Right lateral epicondyle" },
  { id:9,  label:"L ASIS",          mpIdx:23, desc:"Left anterior superior iliac spine" },
  { id:10, label:"R ASIS",          mpIdx:24, desc:"Right anterior superior iliac spine" },
  { id:11, label:"L Knee",          mpIdx:25, desc:"Left knee joint line" },
  { id:12, label:"R Knee",          mpIdx:26, desc:"Right knee joint line" },
  { id:13, label:"L Ankle",         mpIdx:27, desc:"Left lateral malleolus" },
  { id:14, label:"R Ankle",         mpIdx:28, desc:"Right lateral malleolus" },
  { id:15, label:"L Heel",          mpIdx:29, desc:"Left heel contact" },
  { id:16, label:"R Heel",          mpIdx:30, desc:"Right heel contact" },
  { id:17, label:"L Toe",           mpIdx:31, desc:"Left 2nd toe" },
  { id:18, label:"R Toe",           mpIdx:32, desc:"Right 2nd toe" },
];

const MANUAL_POINTS_SAGITTAL = [
  { id:0, label:"Nose / Head",    mpIdx:0,  desc:"Nose tip" },
  { id:1, label:"Ear",            mpIdx:7,  desc:"Ear tragus (near side)" },
  { id:2, label:"Shoulder",       mpIdx:11, desc:"Acromion (near side)" },
  { id:3, label:"Hip / GT",       mpIdx:23, desc:"Greater trochanter" },
  { id:4, label:"Knee",           mpIdx:25, desc:"Lateral knee joint line" },
  { id:5, label:"Ankle",          mpIdx:27, desc:"Lateral malleolus" },
  { id:6, label:"Heel",           mpIdx:29, desc:"Heel contact point" },
  { id:7, label:"Toe",            mpIdx:31, desc:"2nd toe tip" },
];

// Connections to draw between placed manual points (frontal)
const MANUAL_CONNECTIONS_FRONTAL = [
  [3,4],[1,2],[5,6],[9,10],[11,12],[13,14],[15,16],[17,18],
  [5,7],[6,8],[5,9],[6,10],[9,11],[10,12],[11,13],[12,14],
  [13,15],[14,16],[15,17],[16,18],
];
const MANUAL_CONNECTIONS_SAGITTAL = [
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],
];

// Convert manual placed points {[id]: {x,y} normalised} to MediaPipe-like landmark array
function manualPointsToLandmarks(placed, pointDefs) {
  const lm = Array.from({length:33}, (_,i) => ({ x:0, y:0, z:0, visibility:0 }));
  pointDefs.forEach(def => {
    const p = placed[def.id];
    if (p && def.mpIdx !== undefined) {
      lm[def.mpIdx] = { x:p.x, y:p.y, z:0, visibility:1.0 };
    }
  });
  // Mirror ear/shoulder for sagittal (right side = same as left for sagittal points)
  // If sagittal: copy left to right for mirror symmetry so measureLandmarks gets both sides
  if (pointDefs.length === 8) {
    const pairs = [[7,8],[11,12],[23,24],[25,26],[27,28],[29,30],[31,32]];
    pairs.forEach(([l,r]) => {
      if (lm[l].visibility > 0) lm[r] = { ...lm[l] };
    });
  }
  return lm;
}

// ─── Measurement Engine ───────────────────────────────────────────────────────
function measureLandmarks(lm, calibration) {
  if(!lm||lm.length<33) return {};
  const g=i=>lm[i];
  const V=i=>(lm[i]?.visibility||0)>=MIN_VIS;
  const Vb=(...idx)=>idx.every(i=>V(i));

  // ── Real-world calibration ────────────────────────────────────────────────
  // calibration = { pixPerCm: number } derived from patient height entry
  // If not available, all *Cm fields remain null (% values still shown)
  const pixPerCm = calibration?.pixPerCm || null;
  // toCm: converts a normalised 0-1 distance to cm using image height as scale reference
  // We need the image height in pixels — stored in calibration.imgH
  const imgH = calibration?.imgH || null;
  const toCm = (normDist) => {
    if(normDist===null||normDist===undefined||!pixPerCm||!imgH) return null;
    return r1(Math.abs(normDist) * imgH / pixPerCm);
  };

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

  // Cervical compressive load (Hansraj 2014 model)
  // Neutral head load ~4.5kg; adds ~2.7kg per 2.5cm of forward head displacement
  // fhpNorm is a % of image width — scale to cm using typical shoulder-width ~40cm as reference
  const shoulderWidthPx = shMid&&Vb(11,12)?dist2D(g(11),g(12)):null;
  let cervicalLoadKg = null;
  if(fhpNorm!==null&&shoulderWidthPx!==null&&shoulderWidthPx>0.05){
    // Convert normalised FHP offset to estimated cm (shoulder width reference 40cm)
    const fhpCm = Math.max(0,(fhpNorm/100)/shoulderWidthPx*40);
    cervicalLoadKg = r1(clamp(4.5 + fhpCm*1.08, 4.5, 32));
  }

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

  // ── Additional measurements ported from standalone ─────────────────────────

  // Bilateral symmetry objects
  const shoulderSymmetry = Vb(11,12)?{left:g(11).y,right:g(12).y,diff:r1((g(11).y-g(12).y)*100)}:null;
  const hipSymmetry      = Vb(23,24)?{left:g(23).y,right:g(24).y,diff:r1((g(23).y-g(24).y)*100)}:null;
  const ankleSymmetry    = Vb(27,28)?{left:g(27).y,right:g(28).y,diff:r1((g(27).y-g(28).y)*100)}:null;

  // Scapular metrics
  const scapularAsymm    = Vb(11,12)?r1(Math.abs((g(11).y||0)-(g(12).y||0))*100):null;
  const shoulderWidthNorm= Vb(11,12)?r1(dist2D(g(11),g(12))*100):null;
  const hipWidthNorm     = Vb(23,24)?r1(dist2D(g(23),g(24))*100):null;

  // Foot progression angles (ankle → toe vector from vertical)
  const leftFootAngle  = Vb(31,27)?r1(Math.atan2(g(31).y-g(27).y, g(31).x-g(27).x)*180/Math.PI):null;
  const rightFootAngle = Vb(32,28)?r1(Math.atan2(g(32).y-g(28).y, g(32).x-g(28).x)*180/Math.PI):null;

  // Ankle dorsiflexion (knee-ankle-toe angle; lateral view)
  const leftAnkleAngle  = Vb(25,27,31)?vec3Angle(g(25),g(27),g(31)):null;
  const rightAnkleAngle = Vb(26,28,32)?vec3Angle(g(26),g(28),g(32)):null;

  // Pelvic obliquity (hip-knee lateral offset proxy)
  const pelvicObliquity = hipMid&&kneeMid?r1((hipMid.x-kneeMid.x)*100):null;
  const trunkRotationProxy = shoulderWidthNorm&&hipWidthNorm&&hipWidthNorm>0.01
    ? r1((shoulderWidthNorm/hipWidthNorm-1)*100):null;

  // C7 plumb deviation (head vs hip midpoint)
  const c7PlumbDev = V(0)&&hipMid?r1((g(0).x-hipMid.x)*100):null;

  // Centre of gravity (weighted average of head, shoulder, hip, foot midpoints)
  const cogParts = [V(0)?g(0):null, shMid, hipMid, footMid].filter(Boolean);
  const cogX     = cogParts.length>=2 ? cogParts.reduce((s,p)=>s+(p.x||0),0)/cogParts.length : null;
  const cogDeviation = cogX!==null ? r1((cogX-0.5)*100) : null;

  // ── Postural Load Index (PLI) ──────────────────────────────────────────────
  // Composite of 8 weighted, normalised-to-threshold components (0=perfect, 100=max)
  const PLI_comps = [
    [Math.abs(shoulderAngle||0),    3,  7,  1.0],
    [Math.abs(pelvisAngle||0),      3,  7,  1.2],
    [Math.abs(headLateralOffset||0),3,  7,  0.8],
    [Math.abs(trunkLateralShift||0),4,  8,  1.0],
    [Math.abs(fhpNorm||0),          3,  8,  1.5],
    [Math.abs(cogDeviation||0),     4,  8,  1.0],
    [Math.abs(lumbarProxy||0),      4,  9,  1.2],
    [Math.abs(scapularAsymm||0),    2.5,5,  0.8],
  ].filter(([v])=>v!==null&&!isNaN(v));
  const pliSum = PLI_comps.reduce((s,[v,norm,sev,w])=>{
    const n = v<=norm ? 0 : Math.min(1,(v-norm)/(sev-norm));
    return s+n*w;
  },0);
  const pliMax = PLI_comps.reduce((s,[,,,w])=>s+w,0);
  const posturalLoadIndex = pliMax>0 ? r1(clamp((pliSum/pliMax)*100,0,100)) : null;

  // ── NEW: Frontal Plane Measurements (Feature 2) ───────────────────────────

  // Head tilt angle (ear-to-ear line vs horizontal) — normal <2 deg
  // (already computed above as headTiltAngle — alias for clarity)
  const headTiltFrontal = headTiltAngle;

  // Neck lateral angle: ear–shoulder vector from vertical — normal <4 deg
  // Left side
  const neckLateralL = Vb(7,11) ? r1(Math.abs(
    Math.atan2(Math.abs(g(7).x - g(11).x), Math.abs(g(7).y - g(11).y)) * 180 / Math.PI
  )) : null;
  // Right side
  const neckLateralR = Vb(8,12) ? r1(Math.abs(
    Math.atan2(Math.abs(g(8).x - g(12).x), Math.abs(g(8).y - g(12).y)) * 180 / Math.PI
  )) : null;
  const neckLateralAngle = (neckLateralL!==null&&neckLateralR!==null)
    ? r1((neckLateralL+neckLateralR)/2) : (neckLateralL??neckLateralR);
  const neckLateralSide = (neckLateralL!==null&&neckLateralR!==null)
    ? (neckLateralL>neckLateralR?"Left":"Right") : null;

  // Waist triangle asymmetry: elbow-to-hip space L vs R — normal <3%
  // Already computed as waistAsymmetry above; add waistTriangleAsymmetry alias with more detail
  const waistTriangleL = Vb(11,13,23) ? r1(dist2D(g(13),g(23))*100) : null;
  const waistTriangleR = Vb(12,14,24) ? r1(dist2D(g(14),g(24))*100) : null;
  const waistTriangleAsymmetry = (waistTriangleL!==null&&waistTriangleR!==null)
    ? r1(Math.abs(waistTriangleL - waistTriangleR)) : null;
  const waistTriangleSide = (waistTriangleL!==null&&waistTriangleR!==null)
    ? (waistTriangleL < waistTriangleR ? "Left" : "Right") : null; // narrower side

  // Ankle LLD proxy in mm: medial malleolus height difference — normal <5mm
  // Uses y-coordinate difference of ankles (lower y = higher in frame = shorter limb)
  const ankleLLDmm = Vb(27,28) ? r1(Math.abs(g(27).y - g(28).y) * 1000) : null;
  const ankleLLDSide = (ankleLLDmm!==null&&Vb(27,28))
    ? (g(27).y > g(28).y ? "Right" : "Left") : null; // higher ankle = shorter side

  // Tibial varum L/R: tibial segment angle from vertical — normal <5 deg
  const tibialVarumL = Vb(25,27) ? r1(Math.abs(
    Math.atan2(Math.abs(g(25).x - g(27).x), Math.abs(g(25).y - g(27).y)) * 180 / Math.PI
  )) : null;
  const tibialVarumR = Vb(26,28) ? r1(Math.abs(
    Math.atan2(Math.abs(g(26).x - g(28).x), Math.abs(g(26).y - g(28).y)) * 180 / Math.PI
  )) : null;

  // Knee/ankle width ratio (valgus >1.15, varus <0.85)
  const kneeWidth = Vb(25,26) ? dist2D(g(25),g(26)) : null;
  const ankleWidth = Vb(27,28) ? dist2D(g(27),g(28)) : null;
  const kneeAnkleRatio = (kneeWidth&&ankleWidth&&ankleWidth>0.01)
    ? r1(kneeWidth/ankleWidth) : null;
  const kneeAnklePattern = kneeAnkleRatio!==null
    ? (kneeAnkleRatio>1.15?"Valgus":kneeAnkleRatio<0.85?"Varus":"Normal") : null;

  // Carrying angle L/R (elbow cubitus valgus) — normal 5–15 deg
  const carryingAngleL = Vb(11,13,15) ? r1(Math.abs(vec3Angle(g(11),g(13),g(15))-180)) : null;
  const carryingAngleR = Vb(12,14,16) ? r1(Math.abs(vec3Angle(g(12),g(14),g(16))-180)) : null;

  // Shoulder/hip width ratio
  const shoulderWidth = Vb(11,12) ? r1(dist2D(g(11),g(12))*100) : null;
  const hipWidth = Vb(23,24) ? r1(dist2D(g(23),g(24))*100) : null;
  const shoulderHipRatio = (shoulderWidth&&hipWidth&&hipWidth>0)
    ? r1(shoulderWidth/hipWidth) : null;

  // ── Real-world measurements (cm) — only populated when calibration available ─
  // Forward head posture in cm (most clinically used number)
  const fhpCm = (fhpNorm!==null && shoulderWidthPx!==null && shoulderWidthPx>0.05 && pixPerCm && imgH)
    ? r1(Math.max(0,(fhpNorm/100) / shoulderWidthPx * 40)) : null;

  // Shoulder height difference in cm
  const shoulderDiffCm = (shoulderSymmetry && pixPerCm && imgH)
    ? toCm(Math.abs(shoulderSymmetry.diff)/100) : null;

  // Pelvic obliquity in cm (ASIS height difference)
  const pelvisDiffCm = (hipSymmetry && pixPerCm && imgH)
    ? toCm(Math.abs(hipSymmetry.diff)/100) : null;

  // Ankle LLD in cm
  const ankleLLDcm = (ankleLLDmm!==null && pixPerCm && imgH)
    ? r1(ankleLLDmm/10) : null;

  // Trunk lateral shift in cm
  const trunkShiftCm = (trunkLateralShift!==null && pixPerCm && imgH)
    ? toCm(Math.abs(trunkLateralShift)/100) : null;

  // Head lateral offset in cm
  const headOffsetCm = (headLateralOffset!==null && pixPerCm && imgH)
    ? toCm(Math.abs(headLateralOffset)/100) : null;

  return {
    shoulderAngle, pelvisAngle, eyeLevelAngle, headTiltAngle, headTiltSide,
    headLateralOffset, trunkLateralShift, weightBearingShift, spinalDeviation, waistAsymmetry,
    cvaAngle, fhpNorm, cervicalLoadKg, thoracicAngle, lumbarProxy, hipExtensionProxy,
    leftKneeDev, rightKneeDev, leftKneeFrontal, rightKneeFrontal,
    lldProxy, lldSide, ucsIndex, lcsIndex, kneeSymmetry,
    pelvicTiltSagittal: lumbarProxy,
    cobbEstimate: (spinalDeviation!==null&&waistAsymmetry!==null)
      ? r1(clamp((Math.abs(spinalDeviation||0)+Math.abs(waistAsymmetry||0))/2,0,35)):null,
    cogDeviation,
    // New Feature 2 measurements
    headTiltFrontal,
    neckLateralAngle, neckLateralSide, neckLateralL, neckLateralR,
    waistTriangleL, waistTriangleR, waistTriangleAsymmetry, waistTriangleSide,
    ankleLLDmm, ankleLLDSide,
    tibialVarumL, tibialVarumR,
    kneeAnkleRatio, kneeAnklePattern,
    carryingAngleL, carryingAngleR,
    shoulderWidth, hipWidth, shoulderHipRatio,
    // Ported from standalone
    shoulderSymmetry, hipSymmetry, ankleSymmetry,
    scapularAsymm,
    leftFootAngle, rightFootAngle,
    leftAnkleAngle, rightAnkleAngle,
    pelvicObliquity, trunkRotationProxy, c7PlumbDev,
    posturalLoadIndex,
    // aliases
    shoulderWidthNorm, hipWidthNorm,
    // ── Real-world cm measurements ───────────────────────────────────────────
    fhpCm, shoulderDiffCm, pelvisDiffCm, ankleLLDcm, trunkShiftCm, headOffsetCm,
    _calibrated: !!(pixPerCm && imgH),
  };
}

// ─── Reliability Engine ───────────────────────────────────────────────────────
function calcReliability(lm) {
  if(!lm||lm.length<33) return {score:0,status:"No Pose",blocked:true,warnings:[{icon:"❌",text:"No pose detected",color:PC.red}],icc:null,confidence:{}};
  const KEY=[0,2,5,7,8,11,12,23,24,25,26,27,28,29,30,31,32];
  const NAMES={0:"Head",2:"L.Eye",5:"R.Eye",7:"L.Ear",8:"R.Ear",11:"L.Shoulder",12:"R.Shoulder",
    23:"L.Hip",24:"R.Hip",25:"L.Knee",26:"R.Knee",27:"L.Ankle",28:"R.Ankle",
    29:"L.Heel",30:"R.Heel",31:"L.Toe",32:"R.Toe"};
  const confidence={};
  KEY.forEach(i=>{confidence[i]={name:NAMES[i],value:Math.round((lm[i]?.visibility||0)*100)};});
  const visVals=KEY.map(i=>(lm[i]?.visibility||0));
  const avg=visVals.reduce((a,b)=>a+b,0)/KEY.length;
  const score=Math.round(clamp(avg*100,0,100));
  const critical=[{idx:11,name:"L.Shoulder"},{idx:12,name:"R.Shoulder"},{idx:23,name:"L.Hip"},{idx:24,name:"R.Hip"},{idx:0,name:"Head"}];
  const failedCritical=critical.filter(c=>(lm[c.idx]?.visibility||0)<MIN_VIS);
  const bothShLow=(lm[11]?.visibility||0)<MIN_VIS&&(lm[12]?.visibility||0)<MIN_VIS;
  const bothHipLow=(lm[23]?.visibility||0)<MIN_VIS&&(lm[24]?.visibility||0)<MIN_VIS;
  const blocked=avg<0.40||failedCritical.length>1||bothShLow||bothHipLow;
  const warnings=[];
  if(blocked){
    warnings.push({icon:"✕",text:"Image quality insufficient — improve lighting, ensure full body visible",color:PC.red,priority:6});
  } else if(avg<0.55){
    warnings.push({icon:"⚠",text:"Low confidence — findings may be inaccurate. Improve lighting and camera distance",color:PC.red,priority:5});
  } else if(avg<0.70){
    warnings.push({icon:"○",text:"Partial tracking — some measurements limited. Ensure full body in frame",color:PC.yellow,priority:3});
  }
  const low=KEY.filter(i=>(lm[i]?.visibility||0)<MIN_VIS);
  if(!blocked&&low.length>5) warnings.push({icon:"◉",text:`${low.length} landmarks low confidence — affected measurements unreliable`,color:PC.yellow,priority:4});
  if(!blocked&&Math.abs((lm[11]?.visibility||0)-(lm[12]?.visibility||0))>0.40)
    warnings.push({icon:"↔",text:"Asymmetric shoulder visibility — bilateral measurements may be inaccurate",color:PC.yellow,priority:3});
  if(!blocked&&((lm[23]?.visibility||0)<MIN_VIS||(lm[24]?.visibility||0)<MIN_VIS))
    warnings.push({icon:"⊖",text:"Hip partially occluded — pelvic measurements flagged unreliable",color:PC.yellow,priority:3});
  if((lm[7]?.visibility||0)<MIN_VIS&&(lm[8]?.visibility||0)<MIN_VIS)
    warnings.push({icon:"☉",text:"Ears not detected — CVA and forward head posture cannot be assessed",color:PC.yellow,priority:2});
  if((lm[31]?.visibility||0)<0.35&&(lm[32]?.visibility||0)<0.35)
    warnings.push({icon:"⬡",text:"Feet not visible — move camera back for full-body capture",color:PC.yellow,priority:2});
  warnings.sort((a,b)=>(b.priority||0)-(a.priority||0));
  const status=blocked?"Insufficient":avg>0.80?"Excellent":avg>0.65?"Good":avg>0.50?"Fair":"Poor";
  const icc=r1(Math.min(0.95, 0.35+avg*0.60));
  return {score,status,blocked,warnings,icc,confidence};
}

// ─── Manual Reliability ───────────────────────────────────────────────────────
function calcManualReliability(placedCount, totalPoints) {
  const pct = placedCount / totalPoints;
  const score = Math.round(clamp(pct * 100, 0, 100));
  const status = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Poor";
  return {
    score,
    status,
    blocked: score < 60,
    isManual: true,
    warnings: score < 60 ? [{icon:"⚠", text:`Place at least ${Math.ceil(totalPoints*0.6)} points to analyse`, color:PC.yellow}] : [],
  };
}

// ─── Findings Engine ──────────────────────────────────────────────────────────
function buildFindings(lm, view, m) {
  if(!lm||!m) return [];
  const out=[];
  const add=(region,text,severity,correction,icd="M99.0",detail="",norm="")=>out.push({region,text,severity,correction,icd,detail,norm});

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

    // ── NEW Feature 2: Additional frontal findings ───────────────────────────

    // Neck lateral angle — scalene / thoracic outlet pathway
    if(m.neckLateralAngle!==null&&m.neckLateralAngle>4){
      const abs=m.neckLateralAngle, side=m.neckLateralSide||"";
      add("Neck / Cervical",
        `Neck lateral inclination — ${side} side (${abs.toFixed(1)}°, normal <4°)`,
        abs>8?"high":"moderate",
        `Scalene release ${side} side: lateral cervical stretch 30s×3. Screen thoracic outlet (Adson's test, Roos test 3min). Assess C3–C5 facet restriction. Activate ipsilateral deep neck flexors. Rule out accessory nerve involvement if trapezius wasting present. Confirm with clinical assessment — image proxy only.`,
        "M54.2");
    }

    // Waist triangle asymmetry — Adam's test / functional vs structural scoliosis
    if(m.waistTriangleAsymmetry!==null&&m.waistTriangleAsymmetry>3){
      const abs=m.waistTriangleAsymmetry, side=m.waistTriangleSide||"";
      add("Scoliosis / Waist Asymmetry",
        `Waist triangle asymmetry — ${side} narrower (${abs.toFixed(1)}%, normal <3%)`,
        abs>6?"high":"moderate",
        `Adam's forward bend test — observe for rib hump (structural) vs correction on bending (functional). Functional: treat lateral trunk shift driver (QL, hip abductors). Structural: refer for standing AP X-ray (true Cobb angle). Rib mobilisation T5–T10. Mirror biofeedback in standing. Confirm with clinical assessment — image proxy only.`,
        "M41.9");
    }

    // Ankle LLD proxy
    if(m.ankleLLDmm!==null&&m.ankleLLDmm>5){
      const abs=m.ankleLLDmm, side=m.ankleLLDSide||"";
      add("Leg Length Discrepancy",
        `Ankle height difference — ${side} higher (${abs.toFixed(0)}mm proxy, normal <5mm)`,
        abs>10?"high":"moderate",
        `Confirm with tape measure: ASIS to medial malleolus bilaterally. True LLD >5mm: trial heel wedge 3–5mm under shorter limb. Assess SIJ provocation (FABER, FADIR, compression). Treat QL overactivity elevated side. Screen for hip OA / femoral neck asymmetry. Ankle measurement sensitivity ±5–8mm — camera level critical. Confirm with clinical assessment — image proxy only.`,
        "M21.7");
    }

    // Tibial varum
    if((m.tibialVarumL!==null&&m.tibialVarumL>5)||(m.tibialVarumR!==null&&m.tibialVarumR>5)){
      const L=m.tibialVarumL??0, R=m.tibialVarumR??0;
      const worse=L>R?"Left":"Right", abs=Math.max(L,R);
      add("Tibial Varum",
        `Tibial bowing — ${worse} worse (L:${L.toFixed(1)}° R:${R.toFixed(1)}°, normal <5°)`,
        abs>10?"high":"moderate",
        `Root pronation compensation model: assess subtalar neutral, calcaneal eversion, forefoot varus. Prescribe foot orthotic with lateral wedge if pronation-driven. Strengthening: tibialis posterior, peroneals. If bilateral severe (>15°): refer for orthopaedic review — osteotomy threshold assessment. Rotation-sensitive measure — confirm clinically. Confirm with clinical assessment — image proxy only.`,
        "M21.1");
    }

    // Knee/ankle ratio — valgus/varus pattern
    if(m.kneeAnklePattern&&m.kneeAnklePattern!=="Normal"&&m.kneeAnkleRatio!==null){
      const isValgus=m.kneeAnklePattern==="Valgus";
      add("Knee Alignment Pattern",
        `Bilateral ${m.kneeAnklePattern.toLowerCase()} pattern (knee/ankle ratio ${m.kneeAnkleRatio.toFixed(2)}, normal 0.85–1.15)`,
        Math.abs(m.kneeAnkleRatio-1)>0.25?"high":"moderate",
        isValgus
          ? `Valgus: strengthen glute medius (clamshells, lateral band walks ×3 sets). VMO activation: terminal knee extensions, step-downs. Foot tripod loading. Assess hip ER range. Screen medial compartment OA if >40yo. Confirm with clinical assessment — image proxy only.`
          : `Varus: hip external rotator strengthening. ITB/TFL SMR 90s. Assess subtalar supination, lateral ankle instability. Screen lateral compartment OA. Consider foot orthotic. Confirm with clinical assessment — image proxy only.`,
        "M21.0");
    }

    // Carrying angle (cubitus valgus/varus)
    if((m.carryingAngleL!==null&&(m.carryingAngleL<5||m.carryingAngleL>15))||
       (m.carryingAngleR!==null&&(m.carryingAngleR<5||m.carryingAngleR>15))){
      const L=m.carryingAngleL, R=m.carryingAngleR;
      const flagL=L!==null&&(L<5||L>15), flagR=R!==null&&(R<5||R>15);
      const sides=[flagL?"Left":"",flagR?"Right":""].filter(Boolean).join(" & ");
      const abs=Math.max(L??0,R??0);
      add("Carrying Angle / Elbow",
        `Abnormal carrying angle — ${sides} (L:${L!==null?L.toFixed(1)+"°":"N/A"} R:${R!==null?R.toFixed(1)+"°":"N/A"}, normal 5–15°)`,
        abs>20?"high":"moderate",
        `Screen ulnar nerve: Tinel's sign at cubital tunnel, Froment's test for intrinsic weakness. Cubital tunnel syndrome: elbow padding, avoid sustained flexion >90°. Cubitus valgus >20°: refer for orthopaedic review. Arm position critical for this measure — recheck with arms relaxed at sides. Confirm with clinical assessment — image proxy only.`,
        "M79.2");
    }
  } // end if(!isLat)

  // Sagittal findings
  if(isLat){
    if(m.cvaAngle!==null&&m.cvaAngle<55){
      const abs=55-m.cvaAngle;
      const loadStr=m.cervicalLoadKg!==null?` Est. cervical load ~${m.cervicalLoadKg.toFixed(1)}kg (neutral 4.5kg).`:"";
      add("Cervical / CVA",`Forward head posture — CVA ${m.cvaAngle.toFixed(1)}° (normal >55°)`,m.cvaAngle<49?"high":"moderate",
        `DNF chin nod ×10 ×3 daily. Thoracic extension foam roller T4–T8. Pec minor stretch doorframe 30s×3. Monitor posture.${loadStr} Hansraj 2014 load model.`,
        "M43.1");
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

    // ── UCS — sagittal flag (FHP + thoracic kyphosis) ────────────────────────
    // Triggers separately from the frontal UCS index: this fires on lateral view
    // when both CVA and thoracic angle are abnormal simultaneously (Janda pattern)
    const hasUCS_sag = m.cvaAngle!==null && m.cvaAngle<52
      && m.thoracicAngle!==null && m.thoracicAngle>45;
    if(hasUCS_sag){
      add("Upper Crossed Syndrome (UCS)",
        `UCS pattern — forward head (CVA ${m.cvaAngle.toFixed(0)}°) + thoracic kyphosis (${m.thoracicAngle.toFixed(0)}°)`,
        m.cvaAngle<45?"high":"moderate",
        `NKT Protocol — INHIBIT (90s SMR each): upper trapezius, SCM, scalenes, pec minor. ACTIVATE (3×15): deep cervical flexors (chin nod), lower trapezius (prone Y), serratus anterior (wall slide). CORRECT: thoracic extension foam roller T4–T8. Ergonomic: monitor at eye level, lumbar support. Home: hourly upper trap/pec minor stretch.`,
        "M62.8");
    }

    // ── LCS — sagittal flag (anterior pelvic tilt + kyphosis) ────────────────
    const hasLCS_sag = m.lumbarProxy!==null && m.lumbarProxy>5
      && m.thoracicAngle!==null && m.thoracicAngle>42;
    if(hasLCS_sag){
      add("Lower Crossed Syndrome (LCS)",
        `LCS pattern — anterior pelvic tilt (${m.lumbarProxy.toFixed(1)}%) + increased kyphosis`,
        m.lumbarProxy>10?"high":"moderate",
        `NKT Protocol — INHIBIT (90s SMR each): iliopsoas, rectus femoris, TFL. ACTIVATE (3×15): glute max (bridges with posterior tilt), glute med (clamshells), TVA (dead bug). CORRECT: pelvic tilt awareness drill ×20. Thomas test to confirm hip flexor contracture. Ely's test for RF tightness.`,
        "M62.8");
    }

    // ── SWAY-BACK ─────────────────────────────────────────────────────────────
    // Pattern: hips posterior to plumb + reduced lumbar curve
    const hipBehindPlumb = m.hipExtensionProxy!==null && m.hipExtensionProxy < -4;
    const hasReducedLordosis = m.lumbarProxy!==null && m.lumbarProxy < -3;
    if(hipBehindPlumb && hasReducedLordosis){
      add("Posture Pattern — Sway-Back",
        `Sway-back posture: hips posterior to plumb, flat lumbar`,
        "moderate",
        `INHIBIT: hamstrings (slump stretch, seated), abdominals (reduce over-bracing). ACTIVATE: hip flexors (psoas activation — standing hip flexion ×15), lumbar extensors (prone hip extension). Postural cue: shift hips forward over ankles. Lumbar roll support in sitting.`,
        "M40.3");
    }

    // ── MILITARY / FLAT BACK ──────────────────────────────────────────────────
    const isMilitary = m.thoracicAngle!==null && m.thoracicAngle<30
      && (m.lumbarProxy===null || Math.abs(m.lumbarProxy)<3)
      && (m.cvaAngle===null || m.cvaAngle>58);
    if(isMilitary){
      add("Posture Pattern — Military / Flat Back",
        `Flat-back posture: reduced thoracic kyphosis (${m.thoracicAngle.toFixed(0)}°) and lumbar lordosis`,
        "moderate",
        `Thoracic mobility: foam roller extension at T4–T8 ×2min daily. Rib expansion breathing ×10. Restore lordosis: McKenzie press-ups. Cervical retraction (NOT chin tuck). Reassure: flat-back is not always symptomatic — assess function.`,
        "M40.4");
    }

    // ── NAMED SAGITTAL PATTERN LABEL (Kendall classification) ─────────────────
    // Adds a single top-level pattern card summarising the overall sagittal type.
    // Only fires when a named pattern is identifiable (not for ideal alignment).
    {
      const hasFHP   = m.cvaAngle!==null && m.cvaAngle<52;
      const hasKyph  = m.thoracicAngle!==null && m.thoracicAngle>48;
      const hasLord  = m.lumbarProxy!==null && m.lumbarProxy>8;   // proxy for hyperlordosis
      const hasFlat  = m.lumbarProxy!==null && m.lumbarProxy < -5;
      const hasSway  = hipBehindPlumb && hasReducedLordosis;
      const hasMil   = isMilitary;

      let patternName = null, patternTx = null, patternNote = null, patternSev = null;

      if(hasSway){
        patternName = "Sway-Back Posture";
        patternSev  = "moderate";
        patternTx   = "Activate hip flexors. Shift hips forward over ankles. Lumbar extension mobility.";
        patternNote = "Hips posterior to plumb, flat lumbar, forward trunk lean. Hamstring/abdominal dominance.";
      } else if(hasMil){
        patternName = "Military / Flat-Back";
        patternSev  = "moderate";
        patternTx   = "Restore thoracic curve: foam roller extension. Restore lordosis: McKenzie.";
        patternNote = "All spinal curves diminished. Poor sagittal shock absorption.";
      } else if(hasFHP && hasKyph && hasLord){
        patternName = "Lordotic-Kyphotic (UCS + LCS)";
        patternSev  = "high";
        patternTx   = "Full postural correction programme. Address UCS and LCS simultaneously.";
        patternNote = `FHP (CVA ${m.cvaAngle.toFixed(0)}°) + hyperkyphosis (${m.thoracicAngle.toFixed(0)}°) + anterior pelvic tilt. Classic combined Upper and Lower Crossed Syndrome.`;
      } else if(hasKyph && hasLord){
        patternName = "Lordotic-Kyphotic Posture";
        patternSev  = "moderate";
        patternTx   = "Thoracic extension + hip flexor stretch + glute activation.";
        patternNote = `Thoracic kyphosis (${m.thoracicAngle.toFixed(0)}°) and anterior pelvic tilt both elevated. S-curve amplification.`;
      } else if(hasKyph && !hasLord){
        patternName = "Kyphotic Posture";
        patternSev  = "moderate";
        patternTx   = "Thoracic extension foam roller + lower trapezius + pec minor stretch.";
        patternNote = `Increased thoracic kyphosis (${m.thoracicAngle.toFixed(0)}°) as primary finding.`;
      } else if(hasLord && !hasKyph){
        patternName = "Lordotic Posture";
        patternSev  = "moderate";
        patternTx   = "Hip flexor inhibition + glute max activation + pelvic tilt awareness.";
        patternNote = "Hyperlordosis + anterior pelvic tilt. LCS pattern without significant thoracic component.";
      } else if(hasFlat){
        patternName = "Flat-Back Posture";
        patternSev  = "moderate";
        patternTx   = "McKenzie extension + lumbar roll support + erector facilitation.";
        patternNote = "Reduced lumbar lordosis. Disc anterior shear risk. Assess hamstring and abdominal dominance.";
      } else if(hasFHP && !hasKyph){
        patternName = "Forward Head Posture (Isolated)";
        patternSev  = "moderate";
        patternTx   = "DNF activation (chin nod ×10 ×3). Thoracic extension. Ergonomic screen and desk posture review.";
        patternNote = `FHP without significant thoracic kyphosis (CVA ${m.cvaAngle.toFixed(0)}°). Cervical extensor overactivation.`;
      }

      if(patternName!==null){
        add(
          `◈ Sagittal Pattern — ${patternName}`,
          `Classification: ${patternName}`,
          patternSev,
          patternTx,
          "Z96.89"
        );
        // Patch the last finding to carry the clinical note in correction field for display
        const last = out[out.length-1];
        last.detail = patternNote;
        last.norm   = "Ideal: ear over acromion over greater trochanter over lateral malleolus";
      }
    }
  } // end isLat

  // ── GLOBAL — all views ────────────────────────────────────────────────────
  if(m.posturalLoadIndex!==null && m.posturalLoadIndex>55){
    const pliContribs=[];
    if(Math.abs(m.shoulderAngle||0)>3) pliContribs.push(`Uneven shoulders (${Math.abs(m.shoulderAngle).toFixed(1)}°)`);
    if(Math.abs(m.pelvisAngle||0)>3)   pliContribs.push(`Uneven pelvis (${Math.abs(m.pelvisAngle).toFixed(1)}°)`);
    if(Math.abs(m.fhpNorm||0)>3)       pliContribs.push(`Head too far forward (${Math.abs(m.fhpNorm).toFixed(1)}%)`);
    if(Math.abs(m.trunkLateralShift||0)>4) pliContribs.push(`Body leaning sideways (${Math.abs(m.trunkLateralShift).toFixed(1)}%)`);
    if(Math.abs(m.cogDeviation||0)>4)  pliContribs.push(`Centre of gravity off (${Math.abs(m.cogDeviation).toFixed(1)}%)`);
    if(Math.abs(m.lumbarProxy||0)>4)   pliContribs.push(`Pelvic tilt / lower back curve (${Math.abs(m.lumbarProxy).toFixed(1)}%)`);
    if(Math.abs(m.scapularAsymm||0)>3) pliContribs.push(`Scapular asymmetry (${Math.abs(m.scapularAsymm).toFixed(1)}%)`);
    const pliLabel = m.posturalLoadIndex>80
      ? "Very High — multiple areas need attention"
      : m.posturalLoadIndex>65
      ? "High — several postural areas are stressed"
      : "Elevated — more than one area is affected";
    const pliDetail = pliContribs.length>0
      ? `Contributing factors:\n${pliContribs.map(c=>`• ${c}`).join("\n")}\n\nThis means the body is working harder than it should to stay balanced. Each problem adds up and increases joint strain over time.`
      : "Multiple small postural deviations adding up across body areas.";
    add("Global — Body Load Summary",
      `Overall postural load ${pliLabel} (PLI ${m.posturalLoadIndex}/100)`,
      m.posturalLoadIndex>75?"high":"moderate",
      `Start with the highest-priority finding above. Fixing one problem often reduces the overall load automatically. Aim for: 1 targeted exercise per area, 10–15 min daily. Re-assess in 4–6 weeks.`,
      "M62.9", pliDetail, "Target: PLI <35/100");
  }

  return out;
}

// ─── Score Engine ─────────────────────────────────────────────────────────────
function scorePosture(m, findings, reliability) {
  if(!m||!findings) return {score:0,band:"No Data",colour:PC.muted,subScores:null};
  let penalty=0;
  const P=(val,t1,t2,p1,p2)=>{if(val<=0)return;const n=Math.min(1,(val)/(Math.max(0.01,t2-t1)));penalty+=p1+(p2-p1)*n;};
  P(Math.abs(m.shoulderAngle||0),3,7,3,8);
  P(Math.abs(m.pelvisAngle||0),3,7,4,10);
  P(Math.abs(m.trunkLateralShift||0),3.5,7,4,9);
  P(Math.abs(m.headLateralOffset||0),2.5,6,3,7);
  P(Math.abs(m.scapularAsymm||0),2.5,5,2,5);
  P(Math.abs(m.cogDeviation||0),4,8,3,8);
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
  const rawScore=clamp(Math.round(100-penalty),0,100);
  // PLI–score coherence: high PLI floors the score (can't score high with poor posture load)
  const pli=m.posturalLoadIndex??0;
  const pliBand=pli>70?0:pli>50?20:pli>35?40:pli>20?60:100;
  const score=clamp(Math.min(rawScore, pliBand+30),0,100);
  const band=score>=88?"Optimal":score>=74?"Good":score>=58?"Fair":score>=40?"Needs Attention":"Priority Review";
  const colour=score>=74?PC.green:score>=58?PC.yellow:PC.red;
  // Regional sub-scores
  const subScores={
    cervical: clamp(100-(m.cvaAngle!==null?Math.max(0,55-m.cvaAngle)*2.2:0)-Math.abs(m.headLateralOffset||0)*2.5,0,100),
    shoulder: clamp(100-Math.abs(m.shoulderAngle||0)*5-(m.scapularAsymm||0)*4,0,100),
    thoracic: clamp(100-Math.max(0,(m.thoracicAngle||32)-45)*2-Math.abs(m.trunkLateralShift||0)*3.5,0,100),
    lumbar:   clamp(100-Math.abs(m.lumbarProxy||0)*4.5-Math.abs(m.pelvisAngle||0)*4.5,0,100),
    knee:     clamp(100-Math.abs(m.leftKneeFrontal||0)*3.5-Math.abs(m.rightKneeFrontal||0)*3.5-Math.max(0,-(m.leftKneeDev||0)-5)*2.5-Math.max(0,-(m.rightKneeDev||0)-5)*2.5,0,100),
    global:   clamp(100-Math.abs(m.cogDeviation||0)*4.5-Math.abs(m.weightBearingShift||0)*3.5,0,100),
  };
  return {score,band,colour,subScores};
}

// ─── Multi-View Merge Engine ──────────────────────────────────────────────────
const VIEW_PLANE = { anterior:"frontal", posterior:"frontal", left:"sagittal", right:"sagittal" };

function mergeViewResults(viewResults) {
  if (!viewResults || viewResults.length === 0) return null;
  const capturedViews = viewResults.map(r => r.view);
  const hasFrontal  = capturedViews.some(v => VIEW_PLANE[v] === "frontal");
  const hasSagittal = capturedViews.some(v => VIEW_PLANE[v] === "sagittal");
  const coverage = { frontal: hasFrontal, sagittal: hasSagittal, viewCount: viewResults.length };

  // Group findings by region; confirmed = seen in ≥2 views
  const byRegion = {};
  viewResults.forEach(({ view, findings }) => {
    (findings || []).forEach(f => {
      if (!byRegion[f.region]) byRegion[f.region] = [];
      byRegion[f.region].push({ ...f, sourceView: view });
    });
  });

  const severityRank = { high:3, moderate:2, low:1 };
  const mergedFindings = Object.values(byRegion).map(group => {
    const best = group.reduce((a,b) => (severityRank[b.severity]||0) > (severityRank[a.severity]||0) ? b : a);
    const confirmed = group.length >= 2;
    return {
      ...best,
      confirmed,
      sourceViews: [...new Set(group.map(g => VIEWS[g.sourceView]?.short || g.sourceView))],
      severity: (!confirmed && best.severity === "high") ? "moderate" : best.severity,
    };
  });
  mergedFindings.sort((a,b) => {
    const rank = f => (f.confirmed?10:0) + (f.severity==="high"?3:f.severity==="moderate"?2:1);
    return rank(b) - rank(a);
  });

  // Composite score: average, capped at 80 if missing a plane
  const validScores = viewResults.filter(r => r.scoreData?.score != null);
  const avgScore = validScores.length > 0
    ? Math.round(validScores.reduce((s,r) => s + r.scoreData.score, 0) / validScores.length) : 0;
  const coverageCap = (hasFrontal && hasSagittal) ? 100 : 80;
  const compositeScore = Math.min(avgScore, coverageCap);
  const compositeBand = compositeScore>=88?"Optimal":compositeScore>=74?"Good":compositeScore>=58?"Fair":compositeScore>=40?"Needs Attention":"Priority Review";
  const compositeColour = compositeScore>=74?PC.green:compositeScore>=58?PC.yellow:PC.red;

  // Sub-scores averaged across views
  const subKeys = ["cervical","shoulder","thoracic","lumbar","knee","global"];
  const subScores = {};
  subKeys.forEach(k => {
    const vals = viewResults.map(r => r.scoreData?.subScores?.[k]).filter(v => v != null);
    subScores[k] = vals.length > 0 ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : null;
  });

  // Named patterns
  const sagittalResult = viewResults.find(r => VIEW_PLANE[r.view] === "sagittal");
  const sagittalPattern = sagittalResult?.findings
    ?.find(f => f.region?.startsWith("◈ Sagittal Pattern"))?.text?.replace("Classification: ","") || null;
  const hasScoliosis  = mergedFindings.some(f => f.region?.includes("Scoliosis") && f.confirmed);
  const hasLLD        = mergedFindings.some(f => f.region?.includes("Leg Length") && f.confirmed);
  const hasUCS_front  = mergedFindings.some(f => f.region==="Upper Crossed Syndrome" && f.confirmed);
  const hasShoulderEl = mergedFindings.some(f => f.region==="Shoulder Girdle" && f.confirmed);
  const frontalPattern = hasScoliosis?"Scoliosis Pattern — refer for X-ray"
    :(hasUCS_front&&hasShoulderEl)?"Upper Crossed + Shoulder Asymmetry"
    :hasLLD?"Limb Length Discrepancy Pattern"
    :hasShoulderEl?"Coronal Asymmetry":null;

  const highCount      = mergedFindings.filter(f => f.severity==="high" && f.confirmed).length;
  const confirmedCount = mergedFindings.filter(f => f.confirmed).length;
  const planesCovered  = [hasFrontal&&"frontal", hasSagittal&&"sagittal"].filter(Boolean).join(" + ");
  let summary = `Assessment covers ${planesCovered} plane${coverage.viewCount>1?"s":""} (${coverage.viewCount} view${coverage.viewCount>1?"s":""}).`;
  summary += confirmedCount>0
    ? ` ${confirmedCount} finding${confirmedCount>1?"s":""} confirmed across multiple views${highCount>0?` — ${highCount} high priority`:""}.`
    : " No findings confirmed across multiple views.";
  if (!hasFrontal||!hasSagittal) summary += ` Add ${!hasFrontal?"a frontal":"a lateral"} view to complete the assessment.`;

  return { compositeScore, compositeBand, compositeColour, mergedFindings, coverage, subScores, sagittalPattern, frontalPattern, summary };
}

// ─── Canvas overlay renderer ──────────────────────────────────────────────────
// Helper: draw angle badge (small pill label on canvas)
function drawBadge(ctx, x, y, text, color) {
  const pad=4, fsize=11;
  ctx.font=`bold ${fsize}px sans-serif`;
  const tw=ctx.measureText(text).width;
  const bw=tw+pad*2, bh=fsize+pad*2;
  ctx.fillStyle="rgba(0,0,0,0.72)";
  ctx.beginPath();
  if(ctx.roundRect){
    ctx.roundRect(x-bw/2, y-bh/2, bw, bh, 4);
  } else {
    const rx=x-bw/2, ry=y-bh/2, r=4;
    ctx.moveTo(rx+r,ry); ctx.lineTo(rx+bw-r,ry); ctx.arcTo(rx+bw,ry,rx+bw,ry+r,r);
    ctx.lineTo(rx+bw,ry+bh-r); ctx.arcTo(rx+bw,ry+bh,rx+bw-r,ry+bh,r);
    ctx.lineTo(rx+r,ry+bh); ctx.arcTo(rx,ry+bh,rx,ry+bh-r,r);
    ctx.lineTo(rx,ry+r); ctx.arcTo(rx,ry,rx+r,ry,r); ctx.closePath();
  }
  ctx.fill();
  ctx.fillStyle=color||"#fff";
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(text, x, y);
}

// Helper: draw a horizontal level line between two points with label
function drawLevelLine(ctx, x1, y1, x2, y2, color, label) {
  const my=(y1+y2)/2;
  ctx.save();
  ctx.strokeStyle=color; ctx.lineWidth=1.5; ctx.setLineDash([6,4]);
  ctx.beginPath(); ctx.moveTo(x1,my); ctx.lineTo(x2,my); ctx.stroke();
  ctx.restore(); ctx.setLineDash([]);
  if(label){
    const mx=(x1+x2)/2;
    drawBadge(ctx, mx, my-12, label, color);
  }
}

function drawOverlay({ctx,W,H,lm,view,showGrid,measurements}) {
  if(!ctx||!lm) return;
  ctx.clearRect(0,0,W,H);
  const g=i=>lm[i];
  const V=i=>(lm[i]?.visibility||0)>=0.4;
  const PX=i=>lm[i]?[lm[i].x*W,lm[i].y*H]:null;
  const m=measurements||{};

  if(showGrid){
    ctx.strokeStyle="rgba(255,255,255,0.06)"; ctx.lineWidth=0.5;
    for(let c=0;c<=12;c++){const x=W/12*c;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let r=0;r<=16;r++){const y=H/16*r;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  }

  const isLat=view==="left"||view==="right";

  // ── Plumb line ────────────────────────────────────────────────────────────
  if(!isLat){
    const hm=V(23)&&V(24)?{x:(g(23).x+g(24).x)/2,y:(g(23).y+g(24).y)/2}:null;
    const gx=hm?hm.x*W:W/2;
    ctx.save(); ctx.shadowColor="rgba(0,229,255,0.6)"; ctx.shadowBlur=8;
    ctx.setLineDash([10,6]); ctx.strokeStyle="rgba(0,229,255,0.7)"; ctx.lineWidth=1.8;
    ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke();
    ctx.restore(); ctx.setLineDash([]);
  } else {
    // ── Full clinical sagittal plumb line ─────────────────────────────────
    const hi=view==="right"?24:23, shi=view==="right"?12:11, ki=view==="right"?26:25;
    const ai=view==="right"?28:27, ei=view==="right"?8:7, heli=view==="right"?30:29;
    const ankPt=V(ai)?PX(ai):null;
    const plumbX=ankPt?ankPt[0]:W/2;
    // Main plumb vertical
    ctx.save(); ctx.shadowColor="rgba(0,229,255,0.8)"; ctx.shadowBlur=12;
    ctx.setLineDash([9,5]); ctx.strokeStyle="rgba(0,229,255,0.85)"; ctx.lineWidth=2.2;
    ctx.beginPath(); ctx.moveTo(plumbX,0); ctx.lineTo(plumbX,H); ctx.stroke();
    ctx.shadowBlur=0; ctx.setLineDash([]); ctx.restore();
    // Per-segment deviation dots + horizontal offset lines
    const segPts=[
      {pt:V(ei)?PX(ei):null,   label:"Ear",     norm:3},
      {pt:V(shi)?PX(shi):null, label:"Shoulder", norm:3},
      {pt:V(hi)?PX(hi):null,   label:"Hip",      norm:3},
      {pt:V(ki)?PX(ki):null,   label:"Knee",     norm:3},
      {pt:ankPt,               label:"Ankle",    norm:0},
    ].filter(s=>s.pt!==null);
    segPts.forEach(({pt,label,norm})=>{
      const dev=(pt[0]-plumbX)/W*100;
      const absD=Math.abs(dev);
      const isRef=label==="Ankle";
      const col=isRef?"rgba(0,229,255,0.9)":absD<norm+2?"rgba(0,201,122,0.9)":absD<norm+6?"rgba(255,179,0,0.9)":"rgba(255,77,109,0.9)";
      // Horizontal offset line
      if(!isRef&&Math.abs(pt[0]-plumbX)>4){
        ctx.save(); ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(plumbX,pt[1]); ctx.lineTo(pt[0],pt[1]); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
      }
      // Dot
      ctx.beginPath(); ctx.arc(pt[0],pt[1],isRef?5:4,0,Math.PI*2);
      ctx.fillStyle=col; ctx.fill();
      ctx.strokeStyle="#fff"; ctx.lineWidth=1.2; ctx.stroke();
      // Label badge
      if(!isRef){
        const devStr=`${dev>0?"+":""}${dev.toFixed(1)}%`;
        const badgeText=`${label} ${devStr}`;
        const tw=ctx.measureText(badgeText).width;
        const bx=pt[0]+(dev>0?8:-tw-16), by=pt[1]-10;
        ctx.fillStyle="rgba(0,0,0,0.82)";
        if(ctx.roundRect) ctx.roundRect(bx,by,tw+8,16,4); else ctx.rect(bx,by,tw+8,16);
        ctx.fill(); ctx.fillStyle=col; ctx.font="bold 9px system-ui"; ctx.textAlign="left";
        ctx.fillText(badgeText,bx+4,by+11);
      }
    });
    // FHP badge (lateral: horizontal line from ear to shoulder height)
    if(V(ei)&&V(shi)){
      const earPt=PX(ei), shPt2=PX(shi);
      const diff=earPt[0]-shPt2[0];
      if(Math.abs(diff)>W*0.02){
        const col2=Math.abs(diff)>W*0.04?"rgba(255,77,109,0.8)":"rgba(255,179,0,0.8)";
        ctx.strokeStyle=col2; ctx.lineWidth=1.5; ctx.setLineDash([5,4]);
        ctx.beginPath(); ctx.moveTo(earPt[0],earPt[1]); ctx.lineTo(shPt2[0],earPt[1]); ctx.stroke();
        ctx.setLineDash([]);
        const fhpPct=Math.abs((diff/W)*100).toFixed(1);
        const fLabel=`FHP ${fhpPct}%`;
        const ftw=ctx.measureText(fLabel).width;
        const fx=(earPt[0]+shPt2[0])/2-ftw/2-4;
        ctx.fillStyle="rgba(0,0,0,0.85)";
        if(ctx.roundRect) ctx.roundRect(fx,earPt[1]-22,ftw+8,16,4); else ctx.rect(fx,earPt[1]-22,ftw+8,16);
        ctx.fill(); ctx.fillStyle=col2; ctx.font="bold 9.5px system-ui"; ctx.textAlign="left";
        ctx.fillText(fLabel,fx+4,earPt[1]-10);
      }
    }
  }

  // ── Skeleton connections ──────────────────────────────────────────────────
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
    const pa=PX(a), pb=PX(b); if(!pa||!pb) return;
    ctx.beginPath(); ctx.moveTo(pa[0],pa[1]); ctx.lineTo(pb[0],pb[1]); ctx.stroke();
  });

  // ── Joint dots ────────────────────────────────────────────────────────────
  const JOINTS=[0,7,8,11,12,13,14,23,24,25,26,27,28];
  JOINTS.forEach(i=>{
    if(!V(i)) return;
    const p=PX(i); if(!p) return;
    ctx.beginPath(); ctx.arc(p[0],p[1],5,0,Math.PI*2);
    ctx.fillStyle="rgba(147,51,234,0.85)"; ctx.fill();
    ctx.strokeStyle="#fff"; ctx.lineWidth=1.5; ctx.stroke();
  });

  // ── FRONTAL-ONLY overlays ─────────────────────────────────────────────────
  if(!isLat){
    // Head tilt line
    if(V(7)&&V(8)){
      const pL=PX(7), pR=PX(8);
      const tiltAbs=m.headTiltAngle!==null?Math.abs(m.headTiltAngle):null;
      const tiltColor=tiltAbs===null?"#aaa":tiltAbs>5?"#ff4d6d":tiltAbs>2?"#ffb300":"#00e5a0";
      ctx.save();
      ctx.strokeStyle=tiltColor; ctx.lineWidth=2.5; ctx.shadowColor=tiltColor; ctx.shadowBlur=6;
      ctx.beginPath(); ctx.moveTo(pL[0],pL[1]); ctx.lineTo(pR[0],pR[1]); ctx.stroke();
      ctx.restore();
      if(tiltAbs!==null){
        const mx=(pL[0]+pR[0])/2, my=(pL[1]+pR[1])/2-16;
        drawBadge(ctx, mx, my, `Tilt ${tiltAbs.toFixed(1)}°`, tiltColor);
      }
    }
    // Horizontal level lines
    const LEVELS=[
      {idxL:2,  idxR:5,  label:"Eyes",      color:"rgba(255,200,80,0.85)"},
      {idxL:7,  idxR:8,  label:"Ears",      color:"rgba(0,229,255,0.7)"},
      {idxL:11, idxR:12, label:"Shoulders", color:"rgba(147,51,234,0.8)"},
      {idxL:23, idxR:24, label:"ASIS",      color:"rgba(249,115,22,0.8)"},
      {idxL:25, idxR:26, label:"Knees",     color:"rgba(16,185,129,0.8)"},
      {idxL:27, idxR:28, label:"Ankles",    color:"rgba(99,102,241,0.8)"},
    ];
    LEVELS.forEach(({idxL,idxR,label,color})=>{
      if(!V(idxL)||!V(idxR)) return;
      const pL=PX(idxL), pR=PX(idxR);
      drawLevelLine(ctx, pL[0]-W*0.06, pL[1], pR[0]+W*0.06, pR[1], color, label);
    });
    // ASIS dashed rings
    [[23,"L.ASIS"],[24,"R.ASIS"]].forEach(([idx,lbl])=>{
      if(!V(idx)) return;
      const pt=PX(idx); if(!pt) return;
      ctx.strokeStyle="rgba(200,100,255,0.7)"; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
      ctx.beginPath(); ctx.arc(pt[0],pt[1],14,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
      const tw=ctx.measureText(lbl).width;
      ctx.fillStyle="rgba(0,0,0,0.78)"; ctx.font="bold 8px system-ui"; ctx.textAlign="center";
      if(ctx.roundRect) ctx.roundRect(pt[0]-tw/2-4,pt[1]+16,tw+8,13,3); else ctx.rect(pt[0]-tw/2-4,pt[1]+16,tw+8,13);
      ctx.fill(); ctx.fillStyle="rgba(200,100,255,0.9)"; ctx.fillText(lbl,pt[0],pt[1]+27);
    });
    // Waist triangles
    if(V(11)&&V(13)&&V(23)&&V(12)&&V(14)&&V(24)){
      const pSL=PX(11),pEL=PX(13),pHL=PX(23),pSR=PX(12),pER=PX(14),pHR=PX(24);
      const asymm=m.waistTriangleAsymmetry||0;
      const fill=asymm>6?"rgba(255,77,109,0.18)":asymm>3?"rgba(255,179,0,0.15)":"rgba(0,229,160,0.12)";
      const strk=asymm>6?"rgba(255,77,109,0.5)":asymm>3?"rgba(255,179,0,0.4)":"rgba(0,229,160,0.35)";
      [[pSL,pEL,pHL],[pSR,pER,pHR]].forEach(([a,b,c])=>{
        ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.lineTo(c[0],c[1]); ctx.closePath();
        ctx.fillStyle=fill; ctx.fill(); ctx.strokeStyle=strk; ctx.lineWidth=1.5; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
      });
      if(asymm>3) drawBadge(ctx,(pSL[0]+pSR[0])/2,Math.min(pEL[1],pER[1])-22,`Waist ${asymm.toFixed(1)}%`,asymm>6?"#ff4d6d":"#ffb300");
    }
    // LLD arrow
    if(V(27)&&V(28)){
      const pL=PX(27), pR=PX(28), lldMm=m.ankleLLDmm;
      if(lldMm!==null&&lldMm>3){
        const higher=pL[1]<pR[1]?pL:pR, lower=pL[1]<pR[1]?pR:pL;
        const ax=Math.max(pL[0],pR[0])+W*0.04;
        const ac=lldMm>10?"#ff4d6d":lldMm>5?"#ffb300":"#aaa";
        ctx.save(); ctx.strokeStyle=ac; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(ax,higher[1]); ctx.lineTo(ax,lower[1]); ctx.stroke();
        const ah=7;
        [[higher[1],1],[lower[1],-1]].forEach(([y,d])=>{
          ctx.beginPath(); ctx.moveTo(ax,y); ctx.lineTo(ax-ah/2,y+ah*d); ctx.lineTo(ax+ah/2,y+ah*d); ctx.closePath(); ctx.fillStyle=ac; ctx.fill();
        });
        ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(higher[0],higher[1]); ctx.lineTo(ax,higher[1]); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(lower[0],lower[1]); ctx.lineTo(ax,lower[1]); ctx.stroke();
        ctx.restore(); ctx.setLineDash([]);
        drawBadge(ctx,ax+30,(higher[1]+lower[1])/2,`LLD ~${lldMm.toFixed(0)}mm`,ac);
      }
    }
    // Knee/ankle valgus-varus arc
    if(V(25)&&V(26)&&V(27)&&V(28)){
      const pKL=PX(25),pKR=PX(26),pAL=PX(27),pAR=PX(28);
      const ratio=m.kneeAnkleRatio, pattern=m.kneeAnklePattern;
      if(ratio!==null&&pattern!=="Normal"){
        const isValgus=pattern==="Valgus";
        const ac=isValgus?"rgba(249,115,22,0.85)":"rgba(99,102,241,0.85)";
        const kMx=(pKL[0]+pKR[0])/2, kMy=(pKL[1]+pKR[1])/2;
        const aMx=(pAL[0]+pAR[0])/2, aMy=(pAL[1]+pAR[1])/2;
        const midY=(kMy+aMy)/2;
        ctx.save(); ctx.strokeStyle=ac; ctx.lineWidth=2.5; ctx.setLineDash([5,4]);
        ctx.beginPath(); ctx.moveTo(kMx,kMy); ctx.quadraticCurveTo(isValgus?kMx-30:kMx+30,midY,aMx,aMy); ctx.stroke();
        ctx.restore(); ctx.setLineDash([]);
        drawBadge(ctx,isValgus?kMx-44:kMx+44,midY,pattern,ac);
      }
    }
    // Foot progression angle badges
    [[31,27,"L.Foot",0],[32,28,"R.Foot",1]].forEach(([fi,ai2,lbl,side])=>{
      if(!V(fi)||!V(ai2)) return;
      const fa=Math.abs(Math.atan2(g(fi).y-g(ai2).y, g(fi).x-g(ai2).x)*180/Math.PI);
      const col=fa<8?"rgba(0,201,122,0.9)":fa<20?"rgba(255,179,0,0.9)":"rgba(255,77,109,0.9)";
      const bx=side===0?6:W-72, by=H-30;
      ctx.fillStyle="rgba(6,9,15,0.85)";
      ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(bx,by,66,22,5); else ctx.rect(bx,by,66,22); ctx.fill();
      ctx.fillStyle=col; ctx.font="bold 9.5px system-ui"; ctx.textAlign="left";
      ctx.fillText(`${lbl} ${fa.toFixed(0)}°`,bx+5,by+15);
    });
  }

  // ── Stress heatmap (all views) ────────────────────────────────────────────
  const hotspots=[];
  const addHot=(idx,intensity)=>{ if(!V(idx)) return; const p=PX(idx); if(p) hotspots.push({x:p[0],y:p[1],r:45+intensity*20,intensity}); };
  if(Math.abs(m.shoulderAngle||0)>4) addHot(m.shoulderAngle>0?11:12, Math.min(1,Math.abs(m.shoulderAngle)/12));
  if(Math.abs(m.pelvisAngle||0)>3)   addHot(m.pelvisAngle>0?23:24,   Math.min(1,Math.abs(m.pelvisAngle)/10));
  if(Math.abs(m.headLateralOffset||0)>2.5) addHot(0, Math.min(1,Math.abs(m.headLateralOffset)/8));
  if(Math.abs(m.fhpNorm||0)>3)       addHot(0, Math.min(1,Math.abs(m.fhpNorm)/10));
  if(Math.abs(m.lumbarProxy||0)>4)   addHot(m.lumbarProxy>0?23:24, Math.min(1,Math.abs(m.lumbarProxy)/12));
  if(m.scapularAsymm&&m.scapularAsymm>3) addHot(11, Math.min(1,m.scapularAsymm/8));
  hotspots.forEach(({x,y,r,intensity})=>{
    const grad=ctx.createRadialGradient(x,y,0,x,y,r);
    const alpha=intensity*0.35;
    grad.addColorStop(0,`rgba(255,77,109,${alpha})`);
    grad.addColorStop(0.5,`rgba(255,140,0,${alpha*0.5})`);
    grad.addColorStop(1,"rgba(255,77,109,0)");
    ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  });
}

// ─── Manual overlay renderer ──────────────────────────────────────────────────
function drawManualOverlay({ctx, W, H, placed, pointDefs, connections, currentIdx}) {
  if (!ctx) return;
  const toCanvas = (p) => [p.x * W, p.y * H];

  // Draw connections between placed points
  ctx.strokeStyle = "rgba(0,229,255,0.6)";
  ctx.lineWidth = 1.8;
  ctx.setLineDash([]);
  connections.forEach(([a, b]) => {
    if (placed[a] && placed[b]) {
      const pa = toCanvas(placed[a]), pb = toCanvas(placed[b]);
      ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
    }
  });

  // Draw placed dots with numbers
  pointDefs.forEach(def => {
    const p = placed[def.id];
    if (!p) return;
    const [cx, cy] = toCanvas(p);
    ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI*2);
    ctx.fillStyle = "rgba(0,229,255,0.9)"; ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = "#000"; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(String(def.id + 1), cx, cy);
  });

  // Highlight next point to place
  if (currentIdx !== undefined && currentIdx < pointDefs.length) {
    // pulsing ring hint — drawn as dashed circle at canvas centre placeholder
    // (actual pulse is CSS; here we just mark "next" label)
  }
}

// ─── Calibration helper ───────────────────────────────────────────────────────
// Computes pixPerCm from patient height and the head-to-heel landmark span.
// Call once per image/frame with the detected landmarks and known patient height.
function computeCalibration(lm, patientHeightCm, imgH) {
  if(!lm||!patientHeightCm||!imgH) return null;
  const V=i=>(lm[i]?.visibility||0)>=0.3;
  // Head (landmark 0) to heel midpoint (29,30)
  const headY  = V(0)  ? lm[0].y  : null;
  const heelY  = (V(29)&&V(30)) ? (lm[29].y+lm[30].y)/2
               : V(29) ? lm[29].y
               : V(30) ? lm[30].y : null;
  if(headY===null||heelY===null) return null;
  const spanNorm = Math.abs(heelY - headY);      // 0-1 normalised
  if(spanNorm < 0.3) return null;                // too small — likely partial body
  const spanPx = spanNorm * imgH;
  const pixPerCm = spanPx / patientHeightCm;
  return { pixPerCm, imgH, spanPx, patientHeightCm };
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
  anterior:{label:"Frontal",short:"Frontal",badge:"+ Frontal plumb",colour:PC.accent,icon:"⬆",
    helper:"Patient faces camera, feet hip-width, arms relaxed.",
    checks:["Full body in frame","Camera at pelvis height","Feet hip-width apart","Arms relaxed","Minimal clothing"]},
  posterior:{label:"Back",short:"Back",badge:"+ Frontal plumb",colour:PC.a2,icon:"⬇",
    helper:"Patient faces away. Scapulae and heels visible.",
    checks:["Hair off shoulders","Scapulae visible","Equal weight both feet","Arms relaxed","Heel tendon visible"]},
  left:{label:"Sagittal L",short:"Sag L",badge:"+ Sagittal plumb",colour:PC.yellow,icon:"◀",
    helper:"Left side toward camera. Ear–shoulder–hip–ankle in frame.",
    checks:["Ear–shoulder–hip–ankle aligned","Neutral gaze","Knees not locked","Arms visible","Full body in frame"]},
  right:{label:"Sagittal R",short:"Sag R",badge:"+ Sagittal plumb",colour:PC.green,icon:"▶",
    helper:"Right side toward camera. Ear–shoulder–hip–ankle in frame.",
    checks:["Ear–shoulder–hip–ankle aligned","Neutral gaze","Knees not locked","Arms visible","Full body in frame"]},
};

// ─── Sparkline ────────────────────────────────────────────────────────────────
function PostureSparkline({sessions,colour=PC.accent}){
  const pts=sessions.filter(s=>s.score!==undefined).slice(-10);
  if(pts.length<2) return null;
  const vals=pts.map(p=>p.score);
  const mn=Math.min(...vals), mx=Math.max(...vals), range=mx-mn||1;
  const W=100, H=28;
  const xs=pts.map((_,i)=>(i/(pts.length-1))*W);
  const ys=vals.map(v=>H-((v-mn)/range)*H);
  const path=xs.map((x,i)=>`${i===0?"M":"L"}${x},${ys[i]}`).join(" ");
  return(
    <svg width={W} height={H} style={{display:"block"}}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colour} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={colour} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={`${path} L${xs[xs.length-1]},${H} L0,${H} Z`} fill="url(#sg)"/>
      <path d={path} stroke={colour} strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="3" fill={colour}/>
    </svg>
  );
}


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
          {f.detail&&<div style={{marginBottom:6,fontStyle:"italic",color:PC.muted}}>{f.detail}</div>}
          <div><strong style={{color:col}}>Treatment: </strong>{f.correction}</div>
          {f.norm&&<div style={{marginTop:5,fontSize:"0.6rem",fontStyle:"italic"}}>Reference: {f.norm}</div>}
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

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 ─── Clinical Reasoning Engines
// ─────────────────────────────────────────────────────────────────────────────

// ── Muscle Imbalance Engine ───────────────────────────────────────────────────
// Maps each finding region key → { tight: [...], weak: [...] }
const MUSCLE_MAP = {
  // Frontal
  "Shoulder Girdle":          { tight:["Upper Trapezius","Levator Scapulae"],                  weak:["Lower Trapezius","Serratus Anterior","Rhomboids"] },
  "Head / Cervical":          { tight:["SCM (ipsilateral)","Scalenes (ipsilateral)"],           weak:["Deep Cervical Flexors","Contralateral SCM"] },
  "Pelvis / SIJ":             { tight:["QL (elevated side)","Hip Abductors (elevated side)"],   weak:["Glute Med (low side)","Hip Abductors (low side)"] },
  "Thoracic":                 { tight:["QL (lean side)","Lateral Abdominals"],                  weak:["Contralateral QL","Lateral Trunk Stabilisers"] },
  "Spine":                    { tight:["Paraspinals (concave side)","QL"],                      weak:["Contralateral Paraspinals","TVA"] },
  "Scoliosis Screen":         { tight:["Paraspinals (concave side)","QL"],                      weak:["Contralateral Paraspinals","TVA"] },
  "Knee":                     { tight:["TFL / ITB","Adductors"],                                weak:["Glute Medius","VMO","Tibialis Anterior"] },
  "Leg Length":               { tight:["QL (short side)","Hip Flexors (long side)"],            weak:["Glute Med (short side)","Hip Abductors"] },
  "Upper Crossed Syndrome":   { tight:["Upper Trapezius","Levator Scapulae","SCM","Pec Minor"], weak:["Deep Cervical Flexors","Lower Trapezius","Serratus Anterior"] },
  "Knee Alignment Pattern":   { tight:["TFL / ITB","Adductors (valgus) / Peroneals (varus)"],  weak:["Glute Medius","VMO","Tibialis Posterior"] },
  "Neck / Cervical":          { tight:["Scalenes","SCM","Upper Trapezius"],                     weak:["Deep Cervical Flexors","Lower Trap"] },
  // Sagittal
  "Cervical / CVA":           { tight:["Suboccipitals","Cervical Extensors","Pec Minor"],       weak:["Deep Cervical Flexors (DNF)","Lower Trapezius","Serratus Anterior"] },
  "Thoracic Kyphosis":        { tight:["Pectorals Major/Minor","Upper Trapezius","SCM"],        weak:["Lower Trapezius","Rhomboids","Mid Thoracic Extensors"] },
  "Pelvis / Lumbar":          { tight:["Iliopsoas","Rectus Femoris","TFL","QL"],                weak:["Glute Max","Transverse Abdominis","Hamstrings"] },
  "Hip / Global":             { tight:["Hip Flexors","Lumbar Extensors"],                       weak:["Glute Max","Abdominals"] },
  "Lower Crossed Syndrome":   { tight:["Iliopsoas","Rectus Femoris","TFL","Thoracolumbar Fascia"], weak:["Glute Max","Glute Med","Transverse Abdominis"] },
  "Lower Crossed Syndrome (LCS)": { tight:["Iliopsoas","Rectus Femoris","TFL","Thoracolumbar Fascia"], weak:["Glute Max","Glute Med","Transverse Abdominis"] },
  "Upper Crossed Syndrome (UCS)": { tight:["Upper Trapezius","Levator Scapulae","SCM","Pec Minor","Scalenes"], weak:["Deep Cervical Flexors","Lower Trapezius","Serratus Anterior","Mid Thoracic Extensors"] },
  "Posture Pattern — Sway-Back": { tight:["Hamstrings","Abdominals","Hip Extensors"],          weak:["Hip Flexors (Iliopsoas)","Lumbar Extensors"] },
  "Posture Pattern — Military / Flat Back": { tight:["Abdominals","Hamstrings"],               weak:["Thoracic Extensors","Lumbar Extensors","Hip Flexors"] },
  "Tibial Varum":             { tight:["Peroneals","Gastrocnemius/Soleus"],                     weak:["Tibialis Posterior","Tibialis Anterior"] },
  "Ankle":                    { tight:["Gastrocnemius","Soleus"],                               weak:["Tibialis Anterior","Peroneals"] },
  "Knee":                     { tight:["TFL / ITB","Rectus Femoris"],                           weak:["Glute Med","VMO","Hamstrings"] },
};

function buildMuscleImbalance(findings) {
  const tightSet = new Map(); // muscle → [regions]
  const weakSet  = new Map();

  findings.forEach(f => {
    // Try exact region match, then prefix match for named patterns
    let key = f.region;
    let entry = MUSCLE_MAP[key];
    if (!entry) {
      // Try prefix match (e.g. "◈ Sagittal Pattern — Lordotic-Kyphotic" → check "Pelvis / Lumbar" etc)
      const matchKey = Object.keys(MUSCLE_MAP).find(k => key.includes(k) || k.includes(key.replace(/◈\s*/,"")));
      if (matchKey) entry = MUSCLE_MAP[matchKey];
    }
    if (!entry) return;

    const sev = f.severity === "high" ? "●" : "●";
    entry.tight.forEach(m => {
      if (!tightSet.has(m)) tightSet.set(m, []);
      tightSet.get(m).push({ region: f.region, sev });
    });
    entry.weak.forEach(m => {
      if (!weakSet.has(m)) weakSet.set(m, []);
      weakSet.get(m).push({ region: f.region, sev });
    });
  });

  // Sort: muscles flagged by high-severity findings first
  const sort = map => [...map.entries()]
    .sort((a,b) => {
      const aHigh = a[1].some(x=>x.sev==="●") ? 1 : 0;
      const bHigh = b[1].some(x=>x.sev==="●") ? 1 : 0;
      return bHigh - aHigh || b[1].length - a[1].length;
    });

  return { tight: sort(tightSet), weak: sort(weakSet) };
}

// ── Special Tests Engine ──────────────────────────────────────────────────────
const SPECIAL_TESTS_MAP = {
  "Shoulder Girdle":          [
    { name:"Apley Scratch Test",   purpose:"Shoulder ROM — reaching ability bilaterally" },
    { name:"Shoulder Shrug Test",  purpose:"Upper trap / levator overactivation" },
    { name:"Lower Trap Test",      purpose:"Lower trapezius force couple strength (prone Y)" },
  ],
  "Head / Cervical":          [
    { name:"Cervical Rotation AROM", purpose:"C1–C2 restriction screen (normal >80° each side)" },
    { name:"Cervical Lateral Flexion AROM", purpose:"Scalene/SCM length asymmetry" },
    { name:"Deep Neck Flexor Endurance Test", purpose:"DNF weakness — hold chin nod in supine (normal >38s)" },
  ],
  "Neck / Cervical":          [
    { name:"Adson's Test",         purpose:"Thoracic outlet — anterior scalene compression" },
    { name:"Roos Test (EAST)",     purpose:"Thoracic outlet — 3 min overhead arm elevation" },
    { name:"Spurling's Test",      purpose:"Cervical nerve root compression / foraminal stenosis" },
  ],
  "Cervical / CVA":           [
    { name:"Deep Neck Flexor Endurance Test", purpose:"DNF strength — chin nod hold in supine (normal >38s)" },
    { name:"Cranio-Cervical Flexion Test", purpose:"DNF activation pattern (pressure biofeedback)" },
    { name:"Cervical Retraction AROM", purpose:"Assess available retraction range" },
  ],
  "Pelvis / SIJ":             [
    { name:"FABER (Patrick's) Test", purpose:"SIJ / hip pathology provocation" },
    { name:"FADIR Test",           purpose:"Hip impingement / labral pathology screen" },
    { name:"SIJ Compression Test", purpose:"SIJ provocation" },
    { name:"Trendelenburg Test",   purpose:"Glute med weakness — single-leg stance" },
  ],
  "Pelvis / Lumbar":          [
    { name:"Thomas Test",          purpose:"Hip flexor contracture — iliopsoas / rectus femoris" },
    { name:"Ely's Test",           purpose:"Rectus femoris tightness — prone knee bend" },
    { name:"Modified Ober Test",   purpose:"TFL / ITB tightness" },
    { name:"FABER Test",           purpose:"SIJ / hip provocation" },
  ],
  "Hip / Global":             [
    { name:"Thomas Test",          purpose:"Hip flexor length — passive hip extension in supine" },
    { name:"Hip Extension Prone",  purpose:"Glute max firing pattern — timing vs hamstrings" },
    { name:"Trendelenburg Test",   purpose:"Glute medius weakness" },
  ],
  "Thoracic Kyphosis":        [
    { name:"Pec Minor Length Test", purpose:"Assess pec minor shortening — supine shoulder drop" },
    { name:"Wall Angel Test",      purpose:"Thoracic mobility and scapular upward rotation" },
    { name:"Thoracic Extension ROM", purpose:"Foam roller passive extension range (T4–T8)" },
  ],
  "Upper Crossed Syndrome":   [
    { name:"Deep Neck Flexor Endurance Test", purpose:"DNF endurance (chin nod hold)" },
    { name:"Lower Trap Test",      purpose:"Lower trap strength in prone Y" },
    { name:"Pec Minor Length",     purpose:"Supine: shoulder blade drop to table bilaterally" },
    { name:"Wall Angel Test",      purpose:"Combined thoracic + scapular mobility screen" },
  ],
  "Upper Crossed Syndrome (UCS)": [
    { name:"Deep Neck Flexor Endurance Test", purpose:"DNF endurance (chin nod hold, normal >38s)" },
    { name:"Lower Trap Test",      purpose:"Lower trap strength — prone Y position" },
    { name:"Pec Minor Length",     purpose:"Supine shoulder drop test — bilaterally compare" },
    { name:"Adson's / Roos Test",  purpose:"Rule out thoracic outlet component" },
  ],
  "Lower Crossed Syndrome":   [
    { name:"Thomas Test",          purpose:"Hip flexor contracture confirmation" },
    { name:"Ely's Test",           purpose:"Rectus femoris tightness — prone knee bend" },
    { name:"Bridge with Posterior Tilt", purpose:"Glute max activation pattern" },
    { name:"Dead Bug",             purpose:"TVA endurance and lumbopelvic control" },
  ],
  "Lower Crossed Syndrome (LCS)": [
    { name:"Thomas Test",          purpose:"Hip flexor contracture — iliopsoas / RF" },
    { name:"Ely's Test",           purpose:"RF tightness — prone knee flexion" },
    { name:"Modified Ober Test",   purpose:"TFL / ITB tightness" },
    { name:"Hip Extensor Firing Pattern", purpose:"Glute max vs hamstring dominance" },
  ],
  "Knee":                     [
    { name:"Valgus Stress Test",   purpose:"MCL integrity / medial instability" },
    { name:"VMO Activation Test",  purpose:"Single leg terminal knee extension — VMO bulk" },
    { name:"Single-Leg Squat",     purpose:"Functional valgus / glute med weakness under load" },
    { name:"Beighton Score",       purpose:"Generalised hypermobility — 9-point screen" },
  ],
  "Knee Alignment Pattern":   [
    { name:"Single-Leg Squat",     purpose:"Dynamic valgus / varus under load" },
    { name:"Trendelenburg Test",   purpose:"Glute med weakness driving valgus" },
    { name:"Ober Test",            purpose:"ITB / TFL tightness (varus pattern)" },
    { name:"Subtalar Neutral Test", purpose:"Foot pronation driving valgus" },
  ],
  "Leg Length":               [
    { name:"Tape Measure LLD",     purpose:"True LLD: ASIS → medial malleolus bilaterally" },
    { name:"Supine-to-Sit Test",   purpose:"Functional vs true LLD differentiation" },
    { name:"FABER Test",           purpose:"SIJ involvement with LLD" },
    { name:"Pelvic Landmark Palpation", purpose:"Iliac crest height bilaterally in standing" },
  ],
  "Scoliosis Screen":         [
    { name:"Adam's Forward Bend Test", purpose:"Rib hump — structural vs functional scoliosis" },
    { name:"Scoliometer / Inclinometer", purpose:"Angle of trunk rotation (ATR) — >5° refers for X-ray" },
    { name:"Leg Length Measurement", purpose:"LLD as scoliosis driver" },
  ],
  "Spine":                    [
    { name:"Adam's Forward Bend Test", purpose:"Structural scoliosis screen — rib hump" },
    { name:"C7 Plumb Line",        purpose:"Coronal balance — spinous process alignment" },
  ],
  "Tibial Varum":             [
    { name:"Subtalar Neutral Assessment", purpose:"Forefoot varus / calcaneal eversion compensation" },
    { name:"Weight-Bearing Foot Posture", purpose:"Pronation / supination index" },
  ],
  "Posture Pattern — Sway-Back": [
    { name:"Thomas Test",          purpose:"Hip flexor weakness confirmation" },
    { name:"Hamstring Length Test (SLR)", purpose:"Hamstring shortening contribution to sway-back" },
    { name:"Abdominal Bracing Test", purpose:"Over-bracing pattern assessment" },
  ],
};

function buildSpecialTests(findings) {
  const testMap = new Map(); // test name → { purpose, regions[] }

  findings.forEach(f => {
    let key = f.region;
    let tests = SPECIAL_TESTS_MAP[key];
    if (!tests) {
      const matchKey = Object.keys(SPECIAL_TESTS_MAP).find(k =>
        key.includes(k) || k.includes(key.replace(/◈\s*/,""))
      );
      if (matchKey) tests = SPECIAL_TESTS_MAP[matchKey];
    }
    if (!tests) return;

    tests.forEach(t => {
      if (!testMap.has(t.name)) testMap.set(t.name, { purpose: t.purpose, regions: [] });
      testMap.get(t.name).regions.push(f.region);
    });
  });

  return [...testMap.entries()].map(([name,{purpose,regions}]) => ({ name, purpose, regions }));
}

// ── Exercise Plan Engine ──────────────────────────────────────────────────────
// Converts findings → deduplicated, phased, numbered exercise programme
const EXERCISE_MAP = {
  "Shoulder Girdle":        [
    { phase:1, name:"Upper Trapezius SMR",         sets:"90s each side", cue:"Foam roller / lacrosse ball — superior trap between neck and shoulder. Slow sustained pressure.", category:"inhibit" },
    { phase:1, name:"Levator Scapulae Stretch",    sets:"3×30s",         cue:"Head down and away 45°. Gentle overpressure with same-side hand on back of head.", category:"inhibit" },
    { phase:2, name:"Prone Y (Lower Trap)",        sets:"3×15",          cue:"Prone, arms in Y position. Lift arms thumbs-up — feel mid-back, not neck. Hold 2s.", category:"activate" },
    { phase:2, name:"Wall Slide (Serratus)",       sets:"3×12",          cue:"Back flat on wall, arms in W. Slide up to Y maintaining contact. Breathe normally.", category:"activate" },
  ],
  "Head / Cervical":        [
    { phase:1, name:"SCM / Scalene Stretch",       sets:"3×30s/side",    cue:"Tilt head away, rotate slightly toward. Anchor shoulder by holding chair.", category:"inhibit" },
    { phase:2, name:"Chin Nod (DNF Activation)",   sets:"3×10 holds 10s",cue:"Supine, small chin nod — 'yes' motion only. Do NOT lift head. Feel deep neck muscles.", category:"activate" },
  ],
  "Neck / Cervical":        [
    { phase:1, name:"Scalene Release",             sets:"90s/side",      cue:"Side-lying, finger-tip release to anterior neck. Very gentle. Breathe into the tension.", category:"inhibit" },
    { phase:2, name:"Chin Nod (DNF Activation)",   sets:"3×10 holds 10s",cue:"Supine, gentle nod — not a full crunch. Long neck, not tucked.", category:"activate" },
  ],
  "Cervical / CVA":         [
    { phase:1, name:"Suboccipital Release",        sets:"5min",          cue:"Supine, fingertips at base of skull, let head sink. Gentle, no traction.", category:"inhibit" },
    { phase:1, name:"Pec Minor Stretch",           sets:"3×30s",         cue:"Doorframe at 90° elbow. Lean forward gently. Feel front of shoulder.", category:"inhibit" },
    { phase:2, name:"Chin Nod (DNF)",              sets:"3×10 holds 10s",cue:"Supine. Small nod, NOT a crunch. Maintain length. Build to 10-second holds.", category:"activate" },
    { phase:3, name:"Thoracic Extension (T4–T8)",  sets:"2min",          cue:"Foam roller across mid-back, arms crossed on chest, head supported. Let gravity extend.", category:"correct" },
  ],
  "Thoracic Kyphosis":      [
    { phase:1, name:"Thoracic Extension Foam Roller",sets:"2×2min T4–T8",cue:"Roller across mid-back. Arms crossed. Support head. Let gravity do the work.", category:"correct" },
    { phase:1, name:"Pec Stretch (Bilateral)",     sets:"3×30s",         cue:"Doorframe, forearm at 90°. Lean forward gently.", category:"inhibit" },
    { phase:2, name:"Prone Y–T–W",                 sets:"3×10 each",     cue:"Prone, lift arms in Y, T, then W shape. Light — this is activation, not load.", category:"activate" },
    { phase:2, name:"Band Pull-Apart",             sets:"3×15",          cue:"Resistance band at shoulder height, arms straight. Pull to chest. Squeeze mid-back.", category:"activate" },
  ],
  "Pelvis / Lumbar":        [
    { phase:1, name:"Hip Flexor Stretch (Thomas)",  sets:"3×30s/side",   cue:"One knee on floor, other foot forward. Tuck pelvis under first, THEN lunge forward.", category:"inhibit" },
    { phase:1, name:"QL Release",                  sets:"90s/side",      cue:"Side-lying over foam roller at iliac crest level. Very tender area — go slowly.", category:"inhibit" },
    { phase:2, name:"Glute Bridge",                sets:"3×20",          cue:"Supine, feet flat, drive hips up. Squeeze glutes at top, posterior pelvic tilt cue.", category:"activate" },
    { phase:2, name:"Dead Bug (TVA)",              sets:"3×8/side",      cue:"Supine, arms/knees up. Flatten back to floor — hold. Slowly lower opposite arm+leg.", category:"activate" },
  ],
  "Hip / Global":           [
    { phase:1, name:"Hip Flexor Stretch",          sets:"3×30s/side",    cue:"Kneeling lunge. Posterior pelvic tilt first. Shift weight forward slowly.", category:"inhibit" },
    { phase:2, name:"Prone Hip Extension",         sets:"3×15/side",     cue:"Prone, tighten glute, lift leg 5–10cm. Hold 2s. Do NOT hyperextend lumbar.", category:"activate" },
    { phase:3, name:"Standing Alignment Drill",    sets:"3×60s",         cue:"Mirror feedback: stack ear–shoulder–hip–ankle. Small weight shift forward to correct sway.", category:"correct" },
  ],
  "Lower Crossed Syndrome": [
    { phase:1, name:"Iliopsoas SMR",               sets:"90s/side",      cue:"Foam roller inner hip/groin. Lie face down, roller under hip flexor. Breathe out tension.", category:"inhibit" },
    { phase:1, name:"Rectus Femoris Stretch",      sets:"3×30s/side",    cue:"Kneeling, heel to glute. Tuck pelvis FIRST. Reach for ankle only if comfortable.", category:"inhibit" },
    { phase:2, name:"Glute Bridge",                sets:"3×20",          cue:"Focus: posterior tilt at top, squeeze glutes. Avoid hamstring dominance.", category:"activate" },
    { phase:2, name:"Clamshell",                   sets:"3×20/side",     cue:"Side-lying, hips 45°. Open top knee toward ceiling. Band above knees to increase demand.", category:"activate" },
    { phase:2, name:"Dead Bug",                    sets:"3×8/side",      cue:"Press lumbar flat. Alternate opposite arm/leg. Do not allow back to arch.", category:"activate" },
  ],
  "Lower Crossed Syndrome (LCS)": [
    { phase:1, name:"Iliopsoas / TFL SMR",         sets:"90s/side",      cue:"Foam roller inner thigh and outer hip region. Sustained pressure on tender spots.", category:"inhibit" },
    { phase:2, name:"Glute Bridge with Posterior Tilt", sets:"3×15",     cue:"Flatten lumbar at top of bridge. Conscious posterior tilt, not just hip extension.", category:"activate" },
    { phase:2, name:"Dead Bug",                    sets:"3×8/side",      cue:"Abdominal hollowing first, then alternate limb lowering. No lumbar arch.", category:"activate" },
    { phase:3, name:"Pelvic Tilt Awareness",       sets:"3×20 reps",     cue:"Standing, anterior/posterior tilt oscillation. Find neutral between the two extremes.", category:"correct" },
  ],
  "Upper Crossed Syndrome": [
    { phase:1, name:"Upper Trap SMR",              sets:"90s/side",      cue:"Lacrosse ball, superior trap. Sustained pressure. Breathe into tender spots.", category:"inhibit" },
    { phase:1, name:"Pec Minor Stretch",           sets:"3×30s/side",    cue:"Doorframe at 90°. Lean gently. Feel coracoid process area, not the front of shoulder joint.", category:"inhibit" },
    { phase:2, name:"Chin Nod (DNF)",              sets:"3×10 holds 10s",cue:"Supine. Gentle nod — long neck. Do NOT lift head. Press tongue to roof of mouth.", category:"activate" },
    { phase:2, name:"Prone Y (Lower Trap)",        sets:"3×15",          cue:"Prone, arms in Y, thumbs-up. Lift away from floor. Feel mid-scapular — not neck.", category:"activate" },
    { phase:3, name:"Thoracic Extension",          sets:"2min T4–T8",    cue:"Foam roller across mid-back. Gravity-assisted extension. Progress to arms overhead.", category:"correct" },
  ],
  "Upper Crossed Syndrome (UCS)": [
    { phase:1, name:"Upper Trap SMR",              sets:"90s/side",      cue:"Lacrosse ball. Slow, sustained — not rolling. Breathe out through tender spots.", category:"inhibit" },
    { phase:1, name:"SCM / Scalene Stretch",       sets:"3×30s/side",    cue:"Tilt and rotate away. Anchor shoulder. 3 repetitions, progressive gentle overpressure.", category:"inhibit" },
    { phase:1, name:"Pec Minor Stretch",           sets:"3×30s",         cue:"Corner stretch or doorframe. Focus on front-of-shoulder length, not shoulder blade pinch.", category:"inhibit" },
    { phase:2, name:"Chin Nod",                    sets:"3×10 holds 10s",cue:"Supine. Small nod — long neck. Build hold time. Not a crunch.", category:"activate" },
    { phase:2, name:"Prone Y",                     sets:"3×15",          cue:"Prone Y. Thumbs up. Lift. No neck firing. 2s hold at top.", category:"activate" },
    { phase:2, name:"Serratus Wall Slide",         sets:"3×12",          cue:"Wall angels — maintain scapular contact throughout. Slow controlled.", category:"activate" },
    { phase:3, name:"Thoracic Foam Roller T4–T8",  sets:"2×2min",        cue:"Arms crossed, head supported. Let gravity drop thoracic into extension.", category:"correct" },
  ],
  "Knee":                   [
    { phase:1, name:"TFL / ITB SMR",               sets:"90s/side",      cue:"Foam roller lateral thigh. Bend knee to control intensity. Find tender spot — pause.", category:"inhibit" },
    { phase:2, name:"Clamshell",                   sets:"3×20/side",     cue:"Band above knee. Open top knee to ceiling. Do NOT roll pelvis back.", category:"activate" },
    { phase:2, name:"Terminal Knee Extension (VMO)",sets:"3×15/side",    cue:"Band behind knee in standing. Small knee bend and straighten. Feel inner quad.", category:"activate" },
    { phase:3, name:"Step-Down (Eccentric VMO)",   sets:"3×12/side",     cue:"Stand on step, slow single-leg lowering. Control valgus with mirror cue.", category:"correct" },
  ],
  "Knee Alignment Pattern":  [
    { phase:1, name:"ITB / TFL SMR",               sets:"90s/side",      cue:"Lateral thigh roller. Slow. Find tender points and breathe through.", category:"inhibit" },
    { phase:2, name:"Lateral Band Walk",           sets:"3×20 steps/dir",cue:"Band above knees. Hinge forward slightly. Step out — don't let knees cave.", category:"activate" },
    { phase:2, name:"Single-Leg Balance",          sets:"3×30s/side",    cue:"Maintain foot tripod (heel, 1st, 5th metatarsal). Don't let arch collapse.", category:"activate" },
    { phase:3, name:"Single-Leg Squat with Mirror",sets:"3×10/side",     cue:"Watch knee tracks over 2nd toe. Stop depth before valgus appears.", category:"correct" },
  ],
  "Leg Length":              [
    { phase:1, name:"QL Stretch (elevated side)",  sets:"3×30s",         cue:"Standing, reach over and away on the elevated-hip side. Feel side waist lengthening.", category:"inhibit" },
    { phase:2, name:"Glute Med Strengthening",     sets:"3×15/side",     cue:"Clamshell or standing hip abduction. Focus on low-side glute.", category:"activate" },
  ],
  "Scoliosis Screen":        [
    { phase:1, name:"Lateral Trunk Stretch",       sets:"3×30s/side",    cue:"Overhead reach toward ceiling, sidebend away from tight side. Breathe into the stretch.", category:"inhibit" },
    { phase:2, name:"Side-Lying Hip Abduction",    sets:"3×15/side",     cue:"Lateral trunk stabiliser activation — bottom oblique also works.", category:"activate" },
    { phase:3, name:"Mirror Biofeedback Standing", sets:"3×60s",         cue:"Standing in front of mirror. Level shoulders. Level pelvis. Breathe. Note how corrected feels.", category:"correct" },
  ],
  "Spine":                   [
    { phase:3, name:"Adam's Test Self-Check",      sets:"weekly",        cue:"Forward bend, hands together, observe for rib hump. Monitor for change.", category:"correct" },
  ],
  "Posture Pattern — Sway-Back": [
    { phase:1, name:"Hamstring Stretch (Slump)",   sets:"3×30s/side",    cue:"Seated slump, extend one leg, flex foot. Hold and breathe.", category:"inhibit" },
    { phase:2, name:"Standing Hip Flexor Activation", sets:"3×15/side",  cue:"Standing high knee drive. Activate psoas consciously.", category:"activate" },
    { phase:3, name:"Hip Shift Alignment Drill",   sets:"3×60s",         cue:"Mirror: shift hips forward over ankles. Feel weight move to ball of foot.", category:"correct" },
  ],
  "Tibial Varum":            [
    { phase:1, name:"Calf / Gastrosoleus SMR",     sets:"90s/side",      cue:"Foam roller medial calf. Work from Achilles to knee.", category:"inhibit" },
    { phase:2, name:"Tibialis Posterior Strengthening", sets:"3×15/side",cue:"Single-leg heel raise with slight inward roll. Controlled lowering.", category:"activate" },
  ],
};

function buildExercisePlan(findings) {
  const seen = new Set();
  const phases = { 1: [], 2: [], 3: [] };

  // Sort findings: high severity first
  const sorted = [...findings].sort((a,b) => {
    const sev = { high:2, moderate:1, low:0 };
    return (sev[b.severity]||0) - (sev[a.severity]||0);
  });

  sorted.forEach(f => {
    let key = f.region;
    let exList = EXERCISE_MAP[key];
    if (!exList) {
      const matchKey = Object.keys(EXERCISE_MAP).find(k =>
        key.includes(k) || k.includes(key.replace(/◈\s*/,""))
      );
      if (matchKey) exList = EXERCISE_MAP[matchKey];
    }
    if (!exList) return;

    exList.forEach(ex => {
      if (seen.has(ex.name)) return;
      seen.add(ex.name);
      const ph = ex.phase || 2;
      phases[ph].push({ ...ex, sourceRegion: f.region, sourceSev: f.severity });
    });
  });

  return phases;
}

// ── Muscle Imbalance Card Component ──────────────────────────────────────────
function MuscleImbalanceCard({ findings, isWide }) {
  const { tight, weak } = useMemo(() => buildMuscleImbalance(findings), [findings]);
  if (tight.length === 0 && weak.length === 0) return null;

  const col = {
    tight: "#dc2626",
    weak:  "#2563eb",
  };
  const bgTight = "rgba(220,38,38,0.07)";
  const bgWeak  = "rgba(37,99,235,0.07)";

  const muscleChip = (muscle, regions, isTight) => {
    const hasHigh = regions.some(r => r.sev === "●");
    const c = isTight ? col.tight : col.weak;
    return (
      <div key={muscle} style={{
        padding:"6px 10px", borderRadius:8,
        background: isTight ? bgTight : bgWeak,
        border:`1px solid ${c}25`,
        marginBottom:5
      }}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:"0.65rem",fontWeight:800,color:c}}>{muscle}</span>
          {hasHigh && <span style={{fontSize:"0.55rem",padding:"1px 5px",borderRadius:4,background:`${c}18`,color:c,fontWeight:700}}>HIGH</span>}
        </div>
        <div style={{fontSize:"0.57rem",color:PC.muted,marginTop:2,lineHeight:1.4}}>
          {regions.map(r=>r.region.replace(/◈\s*/,"")).join(" · ")}
        </div>
      </div>
    );
  };

  return (
    <div style={{marginBottom:16,borderRadius:14,border:`1px solid ${PC.border}`,overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"11px 14px",background:`linear-gradient(135deg,rgba(220,38,38,0.08),rgba(37,99,235,0.08))`,borderBottom:`1px solid ${PC.border}`,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:"1rem"}}>⚡</span>
        <div>
          <div style={{fontWeight:800,fontSize:"0.78rem",color:PC.text}}>Muscle Imbalance Table</div>
          <div style={{fontSize:"0.6rem",color:PC.muted}}>Derived from findings — confirm clinically</div>
        </div>
      </div>
      {/* Two columns */}
      <div style={{display:"grid",gridTemplateColumns:isWide?"1fr 1fr":"1fr 1fr",gap:0}}>
        {/* Tight / Overactive */}
        <div style={{padding:"12px 12px",borderRight:`1px solid ${PC.border}`}}>
          <div style={{fontSize:"0.62rem",fontWeight:800,color:col.tight,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
            <span>■</span> TIGHT / OVERACTIVE
          </div>
          {tight.length === 0
            ? <div style={{fontSize:"0.65rem",color:PC.muted,fontStyle:"italic"}}>None identified</div>
            : tight.map(([m,r]) => muscleChip(m, r, true))
          }
        </div>
        {/* Weak / Underactive */}
        <div style={{padding:"12px 12px"}}>
          <div style={{fontSize:"0.62rem",fontWeight:800,color:col.weak,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
            <span>⚡</span> WEAK / UNDERACTIVE
          </div>
          {weak.length === 0
            ? <div style={{fontSize:"0.65rem",color:PC.muted,fontStyle:"italic"}}>None identified</div>
            : weak.map(([m,r]) => muscleChip(m, r, false))
          }
        </div>
      </div>
      {/* Legend */}
      <div style={{padding:"8px 14px",background:PC.s2,borderTop:`1px solid ${PC.border}`,fontSize:"0.58rem",color:PC.muted}}>
        ■ Tight = inhibit first (SMR/stretch)  ·  ⚡ Weak = activate after inhibition  ·  HIGH = high-severity finding source
      </div>
    </div>
  );
}

// ── Special Tests Card Component ─────────────────────────────────────────────
function SpecialTestsCard({ findings, isWide }) {
  const [openAll, setOpenAll] = useState(false);
  const tests = useMemo(() => buildSpecialTests(findings), [findings]);
  if (tests.length === 0) return null;

  const visible = openAll ? tests : tests.slice(0, isWide ? 6 : 4);

  return (
    <div style={{marginBottom:16,borderRadius:14,border:`1px solid ${PC.border}`,overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"11px 14px",background:`rgba(124,58,237,0.06)`,borderBottom:`1px solid ${PC.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:"1rem"}}>⚕</span>
          <div>
            <div style={{fontWeight:800,fontSize:"0.78rem",color:PC.text}}>Suggested Special Tests</div>
            <div style={{fontSize:"0.6rem",color:PC.muted}}>{tests.length} tests indicated by findings</div>
          </div>
        </div>
        {tests.length > (isWide ? 6 : 4) && (
          <button onClick={()=>setOpenAll(o=>!o)} style={{fontSize:"0.62rem",fontWeight:700,color:PC.accent,background:"none",border:"none",cursor:"pointer"}}>
            {openAll ? "▲ Less" : `▼ All ${tests.length}`}
          </button>
        )}
      </div>
      {/* Tests grid */}
      <div style={{display:"grid",gridTemplateColumns:isWide?"1fr 1fr":"1fr",gap:0}}>
        {visible.map((t,i) => (
          <div key={t.name} style={{
            padding:"10px 13px",
            borderBottom: i < visible.length - (isWide ? (i%2===0 && i===visible.length-1?1:0) : 1) ? `1px solid ${PC.border}` : "none",
            borderRight: isWide && i%2===0 ? `1px solid ${PC.border}` : "none",
          }}>
            <div style={{display:"flex",alignItems:"flex-start",gap:7}}>
              <div style={{width:20,height:20,borderRadius:6,background:`${PC.accent}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.62rem",fontWeight:800,color:PC.accent,flexShrink:0,marginTop:1}}>{i+1}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:"0.7rem",fontWeight:700,color:PC.text,lineHeight:1.3}}>{t.name}</div>
                <div style={{fontSize:"0.6rem",color:PC.muted,marginTop:2,lineHeight:1.4}}>{t.purpose}</div>
                <div style={{marginTop:4,display:"flex",flexWrap:"wrap",gap:3}}>
                  {t.regions.slice(0,2).map(r=>(
                    <span key={r} style={{fontSize:"0.54rem",padding:"1px 6px",borderRadius:4,background:`${PC.accent}10`,color:PC.accent,fontWeight:600}}>
                      {r.replace(/◈\s*/,"").split(" — ")[0].slice(0,28)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Exercise Plan Tab Component ───────────────────────────────────────────────
const PHASE_META = {
  1: { label:"Phase 1 — Inhibit & Release",  icon:"□", colour:"#dc2626", desc:"SMR and stretching of overactive muscles. Do before activation.",    category:"inhibit" },
  2: { label:"Phase 2 — Activate & Strengthen", icon:"⚡", colour:"#2563eb", desc:"Re-educate and strengthen underactive muscles after inhibition.", category:"activate" },
  3: { label:"Phase 3 — Integrate & Correct",   icon:"↻", colour:"#059669", desc:"Movement re-education, postural correction and functional loading.", category:"correct" },
};

function ExercisePlanTab({ findings, isWide }) {
  const [expandedEx, setExpandedEx] = useState(null);
  const phases = useMemo(() => buildExercisePlan(findings), [findings]);

  const totalCount = Object.values(phases).reduce((s,a)=>s+a.length,0);
  if (totalCount === 0) return (
    <div style={{padding:isWide?"20px 24px":"14px 16px",textAlign:"center",color:PC.muted,fontSize:"0.8rem",paddingTop:40}}>
      No findings detected yet — analyse a photo to generate a programme.
    </div>
  );

  const catBg  = { inhibit:"rgba(220,38,38,0.07)", activate:"rgba(37,99,235,0.07)", correct:"rgba(5,150,105,0.07)" };
  const catBorder = { inhibit:"rgba(220,38,38,0.25)", activate:"rgba(37,99,235,0.25)", correct:"rgba(5,150,105,0.25)" };
  const catColor  = { inhibit:PC.red, activate:"#2563eb", correct:PC.green };

  return (
    <div style={{padding:isWide?"20px 24px":"14px 16px"}}>
      {/* Programme header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div>
          <div style={{fontWeight:900,fontSize:isWide?"0.95rem":"0.85rem",color:PC.text}}>▶ Exercise Programme</div>
          <div style={{fontSize:"0.62rem",color:PC.muted,marginTop:2}}>{totalCount} exercises in 3 phases · Based on {findings.length} findings</div>
        </div>
        <div style={{padding:"4px 10px",borderRadius:8,background:`${PC.accent}12`,border:`1px solid ${PC.accent}25`,fontSize:"0.6rem",fontWeight:700,color:PC.accent}}>
          10–15 min/day
        </div>
      </div>

      {/* Phases */}
      {[1,2,3].map(ph => {
        const exs = phases[ph];
        if (!exs || exs.length === 0) return null;
        const meta = PHASE_META[ph];
        return (
          <div key={ph} style={{marginBottom:16,borderRadius:14,border:`1px solid ${PC.border}`,overflow:"hidden"}}>
            {/* Phase header */}
            <div style={{padding:"10px 14px",background:`${meta.colour}09`,borderBottom:`1px solid ${PC.border}`,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:"1rem"}}>{meta.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:"0.75rem",color:meta.colour}}>{meta.label}</div>
                <div style={{fontSize:"0.58rem",color:PC.muted,marginTop:1}}>{meta.desc}</div>
              </div>
              <div style={{fontSize:"0.65rem",fontWeight:700,color:meta.colour,background:`${meta.colour}12`,padding:"3px 8px",borderRadius:6}}>
                {exs.length} ex
              </div>
            </div>
            {/* Exercise list */}
            {isWide ? (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
                {exs.map((ex,i) => (
                  <ExerciseItem key={ex.name} ex={ex} idx={i} isWide={isWide}
                    isLast={i>=exs.length-2}
                    isRightCol={i%2===1}
                    expanded={expandedEx===ex.name}
                    onToggle={()=>setExpandedEx(expandedEx===ex.name?null:ex.name)}
                    catBg={catBg} catBorder={catBorder} catColor={catColor}/>
                ))}
              </div>
            ) : (
              exs.map((ex,i) => (
                <ExerciseItem key={ex.name} ex={ex} idx={i} isWide={false}
                  isLast={i===exs.length-1}
                  isRightCol={false}
                  expanded={expandedEx===ex.name}
                  onToggle={()=>setExpandedEx(expandedEx===ex.name?null:ex.name)}
                  catBg={catBg} catBorder={catBorder} catColor={catColor}/>
              ))
            )}
          </div>
        );
      })}

      {/* Footer disclaimer */}
      <div style={{padding:"10px 14px",borderRadius:10,background:PC.s2,border:`1px solid ${PC.border}`,fontSize:"0.6rem",color:PC.muted,lineHeight:1.6}}>
        ℹ️ This programme is generated from postural analysis findings. Always confirm with clinical examination before prescribing. Adjust load and range to individual tolerance. Reassess in 4–6 weeks.
      </div>
    </div>
  );
}

function ExerciseItem({ ex, idx, isWide, isLast, isRightCol, expanded, onToggle, catBg, catBorder, catColor }) {
  const cat = ex.category || "correct";
  return (
    <div
      onClick={onToggle}
      style={{
        padding:"10px 13px",
        borderBottom: !isLast ? `1px solid ${PC.border}` : "none",
        borderRight: isWide && !isRightCol ? `1px solid ${PC.border}` : "none",
        cursor:"pointer",
        background: expanded ? catBg[cat] : "transparent",
        transition:"background 0.15s",
      }}>
      <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
        {/* Number badge */}
        <div style={{
          width:22, height:22, borderRadius:7,
          background: catBg[cat],
          border:`1px solid ${catBorder[cat]}`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:"0.6rem",fontWeight:800,color:catColor[cat],flexShrink:0,marginTop:1
        }}>{idx+1}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:"0.72rem",fontWeight:700,color:PC.text,lineHeight:1.3}}>{ex.name}</div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
            <span style={{fontSize:"0.62rem",fontWeight:700,color:catColor[cat],
              background:catBg[cat],border:`1px solid ${catBorder[cat]}`,
              padding:"1px 7px",borderRadius:5}}>{ex.sets}</span>
            <span style={{fontSize:"0.57rem",color:PC.muted,
              background:catBg[cat],padding:"1px 6px",borderRadius:4}}>
              {cat.toUpperCase()}
            </span>
            <span style={{fontSize:"0.57rem",color:PC.muted,padding:"1px 6px",borderRadius:4,
              background:"rgba(124,58,237,0.06)",border:"1px solid rgba(124,58,237,0.15)"}}>
              Daily
            </span>
          </div>
        </div>
        <span style={{fontSize:"0.65rem",color:PC.muted,flexShrink:0,marginTop:2}}>{expanded?"▲":"▼"}</span>
      </div>
      {expanded && (
        <div style={{marginTop:9,paddingTop:9,borderTop:`1px solid ${catBorder[cat]}`,
          fontSize:"0.67rem",color:PC.text,lineHeight:1.6,
          background:catBg[cat],borderRadius:6,padding:"8px 10px",marginLeft:30}}>
          {/* Dosage summary line */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:6}}>
            <span style={{fontSize:"0.6rem",fontWeight:700,color:catColor[cat],
              padding:"2px 8px",borderRadius:5,background:`${catBg[cat]}`,border:`1px solid ${catBorder[cat]}`}}>
              {ex.sets}
            </span>
            <span style={{fontSize:"0.6rem",color:PC.muted,padding:"2px 7px",borderRadius:5,
              background:"rgba(124,58,237,0.07)",border:"1px solid rgba(124,58,237,0.15)"}}>
              Frequency: Daily · Reassess 4–6 wks
            </span>
          </div>
          <span style={{fontSize:"0.6rem",fontWeight:700,color:catColor[cat]}}>Technique: </span>
          {ex.cue}
          {ex.sourceRegion && (
            <div style={{marginTop:5,fontSize:"0.57rem",color:PC.muted,fontStyle:"italic"}}>
              Source: {ex.sourceRegion.replace(/◈\s*/,"")}
            </div>
          )}
        </div>
      )}
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

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useBreakpoint() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 390);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return { isMobile: w < 900, isTablet: w >= 900 && w < 1100, isDesktop: w >= 1100, w };
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
  const [motionWarning,setMotionWarning]=useState(false);
  const prevLmRef=useRef(null);
  // Calibration: patient height (cm) → pixPerCm conversion for real-world measurements
  const [patientHeightCm,setPatientHeightCm]=useState(170);
  const [showCalib,setShowCalib]=useState(false);
  // Mobile panel toggle: "camera" = left panel, "results" = right panel
  const [mobilePanel,setMobilePanel]=useState("camera");

  // ── Multi-view state ─────────────────────────────────────────────────────────
  const [assessMode,setAssessMode] = useState("single");  // "single" | "multi"
  const [mvResults,setMvResults]   = useState({});         // { [viewKey]: {view,measurements,findings,scoreData,reliability,img} }
  const [mvComposite,setMvComposite] = useState(null);
  const [mvTab,setMvTab]           = useState("capture");  // "capture" | "report"

  // ── Manual landmark placement state ─────────────────────────────────────────
  const [inputMode,setInputMode]=useState("ai");        // "ai" | "manual"
  const [manualPlaced,setManualPlaced]=useState({});    // {[pointId]: {x,y}}
  const [manualImgDims,setManualImgDims]=useState(null); // {w,h} of displayed image
  const [manualAnalysed,setManualAnalysed]=useState(false);
  const manualImgRef=useRef(null);
  const manualContainerRef=useRef(null);

  const videoRef=useRef(null);
  const overlayRef=useRef(null);
  const poseRef=useRef(null);
  const streamRef=useRef(null);
  const rafRef=useRef(null);
  const viewRef=useRef(view);
  const liveHandlerRef=useRef(null);
  const fileInputRef=useRef(null);
  const objectUrlRef=useRef(null);
  const videoSizeRef=useRef({w:640,h:480});
  const manualImgSize=useRef({w:800,h:1000});

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
  const processLandmarks=useCallback((lm,v,imgH)=>{
    const calib = computeCalibration(lm, patientHeightCm, imgH||videoSizeRef.current?.h||480);
    const m=measureLandmarks(lm, calib);
    const r=calcReliability(lm);
    const f=r.blocked?[]:buildFindings(lm,v||viewRef.current,m);
    const s=scorePosture(m,f,r);
    setLandmarks(lm); setMeasurements(m); setFindings(f); setReliability(r); setScoreData(s);
  },[patientHeightCm]);

  const saveMvResult = useCallback((viewKey,m,f,s,r,img) => {
    setMvResults(prev => ({ ...prev, [viewKey]:{ view:viewKey, measurements:m, findings:f, scoreData:s, reliability:r, img } }));
    setMvComposite(null);
  },[]);

  // ── Analyse uploaded image ──────────────────────────────────────────────────
  async function analysePhoto(url,v){
    if(!poseRef.current||mpStatus!=="ready") return null;
    return new Promise(resolve=>{
      const img=new Image();
      img.crossOrigin="anonymous";
      img.onload=async()=>{
        const W=img.naturalWidth, H=img.naturalHeight;

        // ── srcCanvas: lock pixel data BEFORE MediaPipe's WebGL consumes img ──
        // MediaPipe internally calls texImage2D on the img element which marks it
        // as "origin-clean=false" in some browsers, corrupting any later drawImage.
        // We copy pixels into srcCanvas now — this copy is always safe to redraw from.
        const srcCanvas=document.createElement("canvas");
        srcCanvas.width=W; srcCanvas.height=H;
        const srcCtx=srcCanvas.getContext("2d");
        srcCtx.fillStyle="#ffffff";
        srcCtx.fillRect(0,0,W,H);
        srcCtx.drawImage(img,0,0,W,H);

        // ── Output canvas: what gets annotated and returned ──
        const oc=document.createElement("canvas"); oc.width=W; oc.height=H;
        const octx=oc.getContext("2d");

        let resolved=false;
        const handler=results=>{
          if(resolved) return; resolved=true;
          if(results.poseLandmarks?.length>0){
            const lm=results.poseLandmarks;
            const calib=computeCalibration(lm,patientHeightCm,H);
            processLandmarks(lm,v,H);
            const mLocal=measureLandmarks(lm,calib);
            // Always draw from srcCanvas — img may be corrupted by WebGL after send()
            octx.fillStyle="#ffffff"; octx.fillRect(0,0,W,H);
            octx.drawImage(srcCanvas,0,0,W,H);
            drawOverlay({ctx:octx,W,H,lm,view:v,showGrid:true,measurements:mLocal});
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
    setError(null); setUploadedImg(url); setTab("capture");
    if(inputMode==="manual"){
      resetManual();
      setLandmarks(null); setMeasurements(null); setFindings([]); setScoreData(null); setReliability(null);
      e.target.value="";
      return;
    }
    setAnalysing(true);
    const result=await analysePhoto(url,view);
    setAnalysing(false);
    if(result){
      setUploadedImg(result.annotated);
      if(assessMode==="multi"){
        const m=measureLandmarks(result.lm);
        const r=calcReliability(result.lm);
        const f=r.blocked?[]:buildFindings(result.lm,view,m);
        const s=scorePosture(m,f,r);
        saveMvResult(view,m,f,s,r,result.annotated);
        // stay on capture tab so therapist can do next view
      } else {
        setTab("findings");
        if(isMobile) setMobilePanel("results");
      }
    } else {
      setError("Could not analyse photo — ensure full body is visible.");
    }
    e.target.value="";
  }

  async function startCamera(facing="environment"){
    if(!poseRef.current||mpStatus!=="ready"){setError("AI not ready yet — wait for AI Ready status");return;}
    setCamStatus("starting"); setError(null);
    try{
      // Progressive constraint fallback for mobile compatibility
      let stream = null;
      const constraintSets = [
        { video:{ facingMode:facing, width:{ideal:640}, height:{ideal:480} } },
        { video:{ facingMode:facing } },
        { video: true },
      ];
      for(const constraints of constraintSets){
        try{ stream = await navigator.mediaDevices.getUserMedia(constraints); break; }catch(_){}
      }
      if(!stream) throw new Error("NoStream");

      streamRef.current=stream; setCamFacing(facing);
      const video=videoRef.current;
      if(!video) throw new Error("NoVideo");
      video.srcObject=stream;
      video.setAttribute("playsinline","");
      video.setAttribute("webkit-playsinline","");
      video.muted=true;

      await new Promise((res,rej)=>{
        const go=()=>video.play().then(res).catch(rej);
        if(video.readyState>=1){ go(); }
        else { video.onloadedmetadata=go; }
        setTimeout(()=>rej(new Error("Timeout")), 8000);
      });

      setCamStatus("active");

      const handler=results=>{
        if(results.poseLandmarks?.length>0){
          const lm=results.poseLandmarks;
          if(prevLmRef.current){
            const drift=Math.abs((lm[0]?.x||0)-(prevLmRef.current[0]?.x||0))*100;
            setMotionWarning(drift>3);
          }
          prevLmRef.current=lm;
          const H=videoRef.current?.videoHeight||480;
          videoSizeRef.current={w:videoRef.current?.videoWidth||640,h:H};
          processLandmarks(lm,viewRef.current,H);
        }
        if(overlayRef.current&&videoRef.current){
          const W=videoRef.current.videoWidth||640, H=videoRef.current.videoHeight||480;
          if(W>0&&H>0){
            overlayRef.current.width=W; overlayRef.current.height=H;
            const ctx=overlayRef.current.getContext("2d");
            const liveCalib = results.poseLandmarks
              ? computeCalibration(results.poseLandmarks, patientHeightCm, H) : null;
            const liveM=results.poseLandmarks?measureLandmarks(results.poseLandmarks, liveCalib):null;
            drawOverlay({ctx,W,H,lm:results.poseLandmarks,view:viewRef.current,showGrid,measurements:liveM});
          }
        }
      };
      liveHandlerRef.current=handler;
      poseRef.current.onResults(handler);

      // Throttled loop — mobile cannot sustain 60fps ML inference
      let lastSend=0;
      const INTERVAL=120; // ~8fps inference; display still renders at browser fps
      const loop=async()=>{
        if(!streamRef.current) return;
        const now=performance.now();
        if(videoRef.current?.readyState>=2 && now-lastSend>=INTERVAL){
          lastSend=now;
          try{ await poseRef.current.send({image:videoRef.current}); }catch(_){}
        }
        rafRef.current=requestAnimationFrame(loop);
      };
      rafRef.current=requestAnimationFrame(loop);

    }catch(e){
      setCamStatus("error");
      const n=e?.name||"";
      setError(
        n==="NotAllowedError"||n==="PermissionDeniedError"
          ? "Camera permission denied. Tap the camera icon in your browser address bar and allow access, then try again."
          : n==="NotFoundError"||n==="DevicesNotFoundError"
          ? "No camera found on this device."
          : n==="NotReadableError"||n==="TrackStartError"
          ? "Camera is in use by another app. Close other apps or tabs using the camera."
          : `Camera unavailable (${n||e?.message||"unknown"}). Try refreshing the page.`
      );
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
    if(landmarks) drawOverlay({ctx,W,H,lm:landmarks,view,showGrid:true,measurements});
    const dataUrl=cc.toDataURL("image/jpeg",0.92);
    setCapturedImg(dataUrl);
    if(measurements&&findings&&scoreData&&reliability){
      saveSession({view,time:new Date().toISOString(),score:scoreData?.score,band:scoreData?.band,findings:findings.length,img:dataUrl});
    }
    setTab("findings");
    if(isMobile) setMobilePanel("results");
  }

  // ── Manual mode derived values ───────────────────────────────────────────────
  const isLat = view==="left"||view==="right";
  const manualPointDefs = isLat ? MANUAL_POINTS_SAGITTAL : MANUAL_POINTS_FRONTAL;
  const manualConnections = isLat ? MANUAL_CONNECTIONS_SAGITTAL : MANUAL_CONNECTIONS_FRONTAL;
  const manualPlacedCount = Object.keys(manualPlaced).length;
  const manualTotal = manualPointDefs.length;
  const manualPct = manualPlacedCount / manualTotal;
  const manualCanAnalyse = manualPct >= 0.6;
  const nextManualIdx = manualPointDefs.findIndex(def => !manualPlaced[def.id]);

  function handleManualImageClick(e) {
    if (inputMode !== "manual" || !uploadedImg || nextManualIdx < 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const def = manualPointDefs[nextManualIdx];
    setManualPlaced(prev => ({ ...prev, [def.id]: { x, y } }));
    setManualAnalysed(false);
  }

  function undoLastManual() {
    const ids = Object.keys(manualPlaced).map(Number).sort((a,b)=>b-a);
    if (ids.length === 0) return;
    const last = ids[0];
    setManualPlaced(prev => { const n={...prev}; delete n[last]; return n; });
    setManualAnalysed(false);
  }

  function resetManual() {
    setManualPlaced({});
    setManualAnalysed(false);
  }

  function analyseManualPoints() {
    const lm = manualPointsToLandmarks(manualPlaced, manualPointDefs);
    const imgH = manualImgSize.current?.h || 800;
    const calib = computeCalibration(lm, patientHeightCm, imgH);
    const m = measureLandmarks(lm, calib);
    const r = calcManualReliability(manualPlacedCount, manualTotal);
    const f = r.blocked ? [] : buildFindings(lm, view, m);
    const s = scorePosture(m, f, r);
    setLandmarks(lm); setMeasurements(m); setFindings(f); setReliability(r); setScoreData(s);
    setManualAnalysed(true);
    // Bake manual markers onto the annotated image
    if (objectUrlRef.current) {
      const img = new Image();
      img.onload = () => {
        const W = img.naturalWidth, H = img.naturalHeight;
        const oc = document.createElement("canvas"); oc.width=W; oc.height=H;
        const ctx = oc.getContext("2d"); ctx.drawImage(img, 0, 0, W, H);
        drawManualOverlay({ ctx, W, H, placed:manualPlaced, pointDefs:manualPointDefs, connections:manualConnections });
        setUploadedImg(oc.toDataURL("image/jpeg", 0.92));
      };
      img.src = objectUrlRef.current;
    }
    setTab("findings");
    if(isMobile) setMobilePanel("results");
  }

  function handleModeSwitch(newMode) {
    setInputMode(newMode);
    if (newMode === "manual") {
      resetManual();
      setLandmarks(null); setMeasurements(null); setFindings([]); setScoreData(null); setReliability(null);
      // Restore original image if annotated
      if (objectUrlRef.current) setUploadedImg(objectUrlRef.current);
    }
  }

  const { isMobile, isDesktop } = useBreakpoint();
  const isWide = !isMobile; // tablet + desktop

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
    if(inputMode==="manual"){
      resetManual();
      if(objectUrlRef.current) setUploadedImg(objectUrlRef.current);
      return;
    }
    if(!isLive&&objectUrlRef.current&&mpStatus==="ready"){
      setAnalysing(true); setError(null);
      const result=await analysePhoto(objectUrlRef.current,newView);
      setAnalysing(false);
      if(result){ setUploadedImg(result.annotated); }
      else{ setError("Could not re-analyse — ensure full body is visible"); }
    }
  }

  // ── Shared panel: findings/metrics/history content ──────────────────────────
  const tabContent = (
    <div style={{flex:1,overflowY:"auto",paddingBottom: isMobile ? 80 : 24}}>

      {/* Tab bar */}
      {(measurements||capturedImg)&&(
        <div style={{borderBottom:`1px solid ${PC.border}`,background:PC.surface,display:"flex",position: isWide?"sticky":"static",top:0,zIndex:5}}>
          {[["findings",`⌕ Findings${findings.length?" ("+findings.length+")":""}`],["muscles","⚡ Muscles"],["plan","▶ Plan"],["tests","⚕ Tests"],["metrics","≡ Metrics"],["history","▤ History"]].map(([t,label])=>(
            <button key={t} onClick={()=>setTab(t)}
              style={{flex:1,padding: isWide?"12px 8px":"10px 8px",border:"none",borderBottom:`3px solid ${tab===t?PC.accent:"transparent"}`,background:"transparent",color:tab===t?PC.accent:PC.muted,fontWeight:700,fontSize: isWide?"0.78rem":"0.68rem",cursor:"pointer",whiteSpace:"nowrap"}}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Findings tab */}
      {tab==="findings"&&measurements&&(
        <div style={{padding: isWide?"20px 24px":"14px 16px"}}>
          {scoreData&&(
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16,padding: isWide?"18px":"14px",background:PC.surface,borderRadius:14,border:`1px solid ${scoreData.colour}30`,boxShadow:isWide?"0 2px 12px rgba(0,0,0,0.06)":"none"}}>
              <ScoreRing score={scoreData.score} band={scoreData.band} colour={scoreData.colour} size={isWide?96:80}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:900,fontSize: isWide?"1.1rem":"0.9rem",color:scoreData.colour}}>{scoreData.band}</div>
                <div style={{fontSize: isWide?"0.72rem":"0.65rem",color:PC.muted,marginTop:2}}>
                  Score {scoreData.score}/100 &nbsp;·&nbsp;
                  <span style={{color:scoreData.colour,fontWeight:700}}>
                    {scoreData.score>=88?"Excellent posture":scoreData.score>=74?"Minor deviations":scoreData.score>=58?"Moderate — intervention advised":scoreData.score>=40?"Significant — prioritise treatment":"Urgent — multiple areas affected"}
                  </span>
                </div>
                <div style={{fontSize: isWide?"0.68rem":"0.62rem",color:PC.muted,marginTop:2}}>
                  {findings.length} finding{findings.length!==1?"s":""} · {highFindings.length} high priority
                </div>
                <div style={{fontSize: isWide?"0.65rem":"0.6rem",color:PC.muted,marginTop:2}}>
                  Reliability: {reliability?.score}% ({reliability?.isManual?"Manual ✓ ":""}{reliability?.status})
                  {reliability?.icc!=null&&` · ICC ${reliability.icc}`}
                </div>
                {measurements?.cervicalLoadKg!=null&&(
                  <div style={{marginTop:6,display:"inline-flex",alignItems:"center",gap:5,padding:"3px 9px",borderRadius:6,
                    background:measurements.cervicalLoadKg>18?"rgba(220,38,38,0.1)":measurements.cervicalLoadKg>12?"rgba(180,83,9,0.1)":"rgba(5,150,105,0.1)",
                    border:`1px solid ${measurements.cervicalLoadKg>18?PC.red:measurements.cervicalLoadKg>12?PC.yellow:PC.green}40`}}>
                    <span style={{fontSize:"0.65rem",fontWeight:700,color:measurements.cervicalLoadKg>18?PC.red:measurements.cervicalLoadKg>12?PC.yellow:PC.green}}>
                      Cervical load ~{measurements.cervicalLoadKg.toFixed(1)}kg
                    </span>
                    <span style={{fontSize:"0.58rem",color:PC.muted}}>(neutral 4.5kg)</span>
                  </div>
                )}
                {/* Real cm measurements row */}
                {measurements?._calibrated&&(
                  <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:5}}>
                    {/* CVA — most important single measure; always first if present */}
                    {measurements.cvaAngle!=null&&(
                      <span style={{padding:"2px 8px",borderRadius:6,fontSize:"0.62rem",fontWeight:700,
                        background:measurements.cvaAngle<49?"rgba(220,38,38,0.1)":measurements.cvaAngle<55?"rgba(180,83,9,0.1)":"rgba(5,150,105,0.1)",
                        color:measurements.cvaAngle<49?PC.red:measurements.cvaAngle<55?PC.yellow:PC.green,
                        border:`1px solid ${measurements.cvaAngle<49?PC.red:measurements.cvaAngle<55?PC.yellow:PC.green}40`}}>
                        CVA {measurements.cvaAngle.toFixed(1)}° {measurements.cvaAngle>=55?"✓":`(normal >55°)`}
                      </span>
                    )}
                    {measurements.fhpCm!=null&&(
                      <span style={{padding:"2px 8px",borderRadius:6,fontSize:"0.62rem",fontWeight:700,
                        background:measurements.fhpCm>3.5?"rgba(220,38,38,0.1)":measurements.fhpCm>2?"rgba(180,83,9,0.1)":"rgba(5,150,105,0.1)",
                        color:measurements.fhpCm>3.5?PC.red:measurements.fhpCm>2?PC.yellow:PC.green,
                        border:`1px solid ${measurements.fhpCm>3.5?PC.red:measurements.fhpCm>2?PC.yellow:PC.green}40`}}>
                        FHP {measurements.fhpCm}cm
                      </span>
                    )}
                    {measurements.shoulderDiffCm!=null&&measurements.shoulderDiffCm>0.3&&(
                      <span style={{padding:"2px 8px",borderRadius:6,fontSize:"0.62rem",fontWeight:700,
                        background:measurements.shoulderDiffCm>1.5?"rgba(220,38,38,0.1)":"rgba(180,83,9,0.1)",
                        color:measurements.shoulderDiffCm>1.5?PC.red:PC.yellow,
                        border:`1px solid ${measurements.shoulderDiffCm>1.5?PC.red:PC.yellow}40`}}>
                        Sh diff {measurements.shoulderDiffCm}cm
                      </span>
                    )}
                    {measurements.pelvisDiffCm!=null&&measurements.pelvisDiffCm>0.3&&(
                      <span style={{padding:"2px 8px",borderRadius:6,fontSize:"0.62rem",fontWeight:700,
                        background:measurements.pelvisDiffCm>1.5?"rgba(220,38,38,0.1)":"rgba(180,83,9,0.1)",
                        color:measurements.pelvisDiffCm>1.5?PC.red:PC.yellow,
                        border:`1px solid ${measurements.pelvisDiffCm>1.5?PC.red:PC.yellow}40`}}>
                        Pelvis diff {measurements.pelvisDiffCm}cm
                      </span>
                    )}
                    {measurements.trunkShiftCm!=null&&measurements.trunkShiftCm>0.5&&(
                      <span style={{padding:"2px 8px",borderRadius:6,fontSize:"0.62rem",fontWeight:700,
                        background:measurements.trunkShiftCm>5?"rgba(156,163,175,0.15)":"rgba(180,83,9,0.1)",
                        color:measurements.trunkShiftCm>5?PC.muted:PC.yellow,
                        border:`1px solid ${measurements.trunkShiftCm>5?PC.muted:PC.yellow}40`}}>
                        Trunk shift {measurements.trunkShiftCm}cm{measurements.trunkShiftCm>5?" ⚠ verify positioning":""}
                      </span>
                    )}
                  </div>
                )}
                {!measurements?._calibrated&&(
                  <div style={{marginTop:6,fontSize:"0.58rem",color:PC.muted,fontStyle:"italic"}}>
                    Enter patient height in Metrics tab for real cm measurements
                  </div>
                )}
                {/* Sub-score pills on wide screens */}
                {isWide&&scoreData?.subScores&&(
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>
                    {Object.entries(scoreData.subScores).map(([region,val])=>{
                      const col=val>=74?PC.green:val>=55?PC.yellow:PC.red;
                      return(
                        <div key={region} style={{display:"flex",alignItems:"center",gap:5,padding:"3px 9px",borderRadius:20,background:`${col}12`,border:`1px solid ${col}30`}}>
                          <span style={{fontSize:"0.62rem",color:PC.muted,textTransform:"capitalize"}}>{region}</span>
                          <span style={{fontSize:"0.68rem",fontWeight:800,color:col}}>{Math.round(val)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* ── TOP 3 PRIORITY TREATMENT CARD ─────────────────────────────── */}
          {findings.length>0&&(()=>{
            // Pick top 3: confirmed high > high > confirmed moderate > moderate
            const ranked = [...findings].sort((a,b)=>{
              const score = f => (f.confirmed?8:0)+(f.severity==="high"?4:f.severity==="moderate"?2:1);
              return score(b)-score(a);
            });
            const top3 = ranked.slice(0,3);
            return(
              <div style={{marginBottom:14,padding:isWide?"16px 18px":"12px 14px",borderRadius:14,
                background:"linear-gradient(135deg,rgba(124,58,237,0.06),rgba(147,51,234,0.04))",
                border:`1.5px solid ${PC.accent}30`}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
                  <span style={{fontSize:"0.95rem"}}>◎</span>
                  <div>
                    <div style={{fontSize:isWide?"0.8rem":"0.72rem",fontWeight:900,color:PC.accent}}>Top 3 — Treat Now</div>
                    <div style={{fontSize:"0.58rem",color:PC.muted,marginTop:1}}>Highest clinical priority · Address in this order</div>
                  </div>
                </div>
                {top3.map((f,i)=>{
                  const col=f.severity==="high"?PC.red:f.severity==="moderate"?PC.yellow:PC.green;
                  // Pull first sentence of correction as the key action
                  const keyAction = f.correction?.split(/\.\s/)[0]||f.correction||"";
                  return(
                    <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",
                      padding:"9px 0",borderTop:i>0?`1px solid ${PC.border}`:"none"}}>
                      <div style={{width:22,height:22,borderRadius:"50%",
                        background:`linear-gradient(135deg,${PC.accent},${PC.a2})`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:"0.65rem",fontWeight:900,color:"#fff",flexShrink:0}}>
                        {i+1}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                          <span style={{fontSize:"0.6rem",fontWeight:700,color:col,
                            padding:"1px 6px",borderRadius:4,background:`${col}15`,
                            border:`1px solid ${col}25`,flexShrink:0}}>
                            {f.severity?.toUpperCase()}{f.confirmed?" ✓":""}
                          </span>
                          <span style={{fontSize:"0.65rem",fontWeight:700,color:PC.text,
                            whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                            {f.region}
                          </span>
                        </div>
                        <div style={{fontSize:"0.63rem",color:PC.muted,lineHeight:1.4}}>
                          {keyAction}{keyAction&&!keyAction.endsWith(".")?".":""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {findings.length===0&&(
            <div style={{textAlign:"center",padding:"40px 20px",color:PC.muted,fontSize: isWide?"0.9rem":"0.8rem"}}>
              {!measurements?"Upload or capture a photo to begin.":`✅ No significant postural deviations detected in ${VIEWS[view]?.label} view.`}
            </div>
          )}
          {/* Wide: two-column findings grid */}
          {isWide&&findings.length>0?(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {highFindings.length>0&&(
                <div style={{gridColumn:"1/-1",marginBottom:4}}>
                  <div style={{fontSize:"0.65rem",fontWeight:700,color:PC.red,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>⚠ High Priority</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {highFindings.map((f,i)=><FindingCard key={i} f={f}/>)}
                  </div>
                </div>
              )}
              {otherFindings.length>0&&(
                <div style={{gridColumn:"1/-1"}}>
                  <div style={{fontSize:"0.65rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>Other Findings</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {otherFindings.map((f,i)=><FindingCard key={i} f={f}/>)}
                  </div>
                </div>
              )}
            </div>
          ):(
            <>
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
            </>
          )}

          {/* Clinical reasoning cards — inline on findings tab when there are findings */}
          {findings.length > 0 && (
            <div style={{marginTop:18}}>
              <div style={{fontSize:"0.62rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>Clinical Reasoning</div>
              <MuscleImbalanceCard findings={findings} isWide={isWide}/>
              <SpecialTestsCard findings={findings} isWide={isWide}/>
              <div style={{padding:"8px 13px",borderRadius:10,background:`${PC.accent}08`,border:`1px solid ${PC.accent}20`,fontSize:"0.62rem",color:PC.accent,fontWeight:600,cursor:"pointer",textAlign:"center",marginTop:2}}
                onClick={()=>setTab("plan")}>
                ▶ View Full Exercise Programme →
              </div>
            </div>
          )}
        </div>
      )}

      {/* Muscle Imbalance tab */}
      {tab==="muscles"&&(
        <div style={{padding:isWide?"20px 24px":"14px 16px"}}>
          {findings.length > 0 ? (
            <>
              <MuscleImbalanceCard findings={findings} isWide={isWide}/>
              <div style={{padding:"10px 14px",borderRadius:10,background:PC.s2,border:`1px solid ${PC.border}`,fontSize:"0.6rem",color:PC.muted,lineHeight:1.6}}>
                ℹ️ Muscles listed are predicted from postural findings using Janda's muscle imbalance model. Always confirm with manual muscle testing and length assessment before treating.
              </div>
            </>
          ) : (
            <div style={{textAlign:"center",color:PC.muted,fontSize:"0.8rem",paddingTop:40}}>
              No findings yet — analyse a photo to populate the muscle imbalance table.
            </div>
          )}
        </div>
      )}

      {/* Exercise Plan tab */}
      {tab==="plan"&&(
        <ExercisePlanTab findings={findings} isWide={isWide}/>
      )}

      {/* Special Tests tab */}
      {tab==="tests"&&(
        <div style={{padding:isWide?"20px 24px":"14px 16px"}}>
          {findings.length > 0 ? (
            <>
              <SpecialTestsCard findings={findings} isWide={isWide}/>
              <div style={{padding:"10px 14px",borderRadius:10,background:PC.s2,border:`1px solid ${PC.border}`,fontSize:"0.6rem",color:PC.muted,lineHeight:1.6}}>
                ℹ️ Tests are suggested based on postural findings. Clinical judgement and contraindication screening required before performing any provocative test. Use in conjunction with patient history and subjective assessment.
              </div>
            </>
          ) : (
            <div style={{textAlign:"center",color:PC.muted,fontSize:"0.8rem",paddingTop:40}}>
              No findings yet — analyse a photo to generate special test recommendations.
            </div>
          )}
        </div>
      )}

      {/* Metrics tab */}
      {tab==="metrics"&&measurements&&(
        <div style={{padding: isWide?"20px 24px":"14px 16px"}}>
          {isWide?(
            // Wide: two-column metric grid
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 32px"}}>
              <div>
                <div style={{fontSize:"0.65rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>Frontal Plane</div>
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
                <MetricRow label="Neck Lateral Angle" value={measurements.neckLateralAngle} unit="°" normal={4} abnormal={8}/>
                <MetricRow label="Waist Triangle Asymm." value={measurements.waistTriangleAsymmetry} unit="%" normal={3} abnormal={6}/>
                <MetricRow label="Ankle LLD" value={measurements.ankleLLDmm} unit="mm" normal={5} abnormal={10}/>
                <MetricRow label="Tibial Varum L" value={measurements.tibialVarumL} unit="°" normal={5} abnormal={10}/>
                <MetricRow label="Tibial Varum R" value={measurements.tibialVarumR} unit="°" normal={5} abnormal={10}/>
                <MetricRow label="Carrying Angle L" value={measurements.carryingAngleL} unit="°" normal={15} abnormal={20}/>
                <MetricRow label="Carrying Angle R" value={measurements.carryingAngleR} unit="°" normal={15} abnormal={20}/>
              </div>
              <div>
                <div style={{fontSize:"0.65rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>Sagittal Plane</div>
                {/* CVA — most important sagittal metric, shown prominently */}
                <div style={{marginBottom:8,padding:"8px 10px",borderRadius:8,
                  background:measurements.cvaAngle!=null&&measurements.cvaAngle<49?"rgba(220,38,38,0.07)":measurements.cvaAngle!=null&&measurements.cvaAngle<55?"rgba(180,83,9,0.07)":"rgba(5,150,105,0.07)",
                  border:`1px solid ${measurements.cvaAngle!=null&&measurements.cvaAngle<49?PC.red:measurements.cvaAngle!=null&&measurements.cvaAngle<55?PC.yellow:PC.green}25`}}>
                  <div style={{fontSize:"0.58rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:2}}>CVA — Primary FHP Marker</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                    <span style={{fontSize:"0.67rem",color:PC.text}}>Craniovertebral Angle</span>
                    <span style={{fontSize:"0.82rem",fontWeight:900,color:measurements.cvaAngle!=null&&measurements.cvaAngle<49?PC.red:measurements.cvaAngle!=null&&measurements.cvaAngle<55?PC.yellow:PC.green}}>
                      {measurements.cvaAngle!=null?`${measurements.cvaAngle.toFixed(1)}°`:"—"}
                    </span>
                  </div>
                  <div style={{fontSize:"0.57rem",color:PC.muted,marginTop:2}}>Normal &gt;55° · &lt;49° = High load · Hansraj cervical load model</div>
                </div>
                {measurements.cervicalLoadKg!=null&&(
                  <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${PC.border}`}}>
                    <div style={{flex:1,fontSize:"0.68rem",color:PC.muted}}>Cervical Load <span style={{fontSize:"0.56rem"}}>(Hansraj)</span></div>
                    <div style={{fontSize:"0.75rem",fontWeight:800,color:measurements.cervicalLoadKg>18?PC.red:measurements.cervicalLoadKg>12?PC.yellow:PC.green}}>{measurements.cervicalLoadKg.toFixed(1)}kg</div>
                  </div>
                )}
                <MetricRow label="Forward Head" value={measurements.fhpNorm} unit="%" normal={3} abnormal={7}/>
                <MetricRow label="Thoracic Kyphosis" value={measurements.thoracicAngle} unit="°" normal={45} abnormal={55}/>
                {/* Lumbar lordosis: paired with kyphosis — show together */}
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${PC.border}`}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"0.68rem",color:PC.muted}}>Lumbar Lordosis (proxy)</div>
                    <div style={{fontSize:"0.55rem",color:PC.muted,marginTop:1}}>Normal 20–40° · Pairs with thoracic kyphosis — assess together</div>
                  </div>
                  <div style={{fontSize:"0.75rem",fontWeight:800,
                    color:measurements.lumbarProxy==null?"rgba(156,163,175,0.6)":Math.abs(measurements.lumbarProxy)>10?PC.red:Math.abs(measurements.lumbarProxy)>5?PC.yellow:PC.green}}>
                    {measurements.lumbarProxy!=null?`${measurements.lumbarProxy>0?"↑":"↓"}${Math.abs(measurements.lumbarProxy).toFixed(1)}%`:"—"}
                  </div>
                </div>
                <MetricRow label="Hip Extension Proxy" value={measurements.hipExtensionProxy} unit="%" normal={5} abnormal={10}/>
                <MetricRow label="L Knee Deviation" value={measurements.leftKneeDev} unit="°" normal={5} abnormal={12}/>
                <MetricRow label="R Knee Deviation" value={measurements.rightKneeDev} unit="°" normal={5} abnormal={12}/>
                <div style={{fontSize:"0.65rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginTop:14,marginBottom:7}}>Global & Symmetry</div>
                <MetricRow label="Scapular Asymmetry" value={measurements.scapularAsymm} unit="%" normal={2.5} abnormal={5}/>
                <MetricRow label="C7 Plumb Deviation" value={measurements.c7PlumbDev} unit="%" normal={3} abnormal={6}/>
                <MetricRow label="COG Deviation" value={measurements.cogDeviation} unit="%" normal={4} abnormal={8}/>
                <MetricRow label="Pelvic Obliquity" value={measurements.pelvicObliquity} unit="%" normal={3} abnormal={6}/>
                <MetricRow label="L Foot Angle" value={measurements.leftFootAngle} unit="°" normal={10} abnormal={20}/>
                <MetricRow label="R Foot Angle" value={measurements.rightFootAngle} unit="°" normal={10} abnormal={20}/>
                <MetricRow label="L Ankle Dorsiflexion" value={measurements.leftAnkleAngle} unit="°" normal={100} abnormal={85}/>
                <MetricRow label="R Ankle Dorsiflexion" value={measurements.rightAnkleAngle} unit="°" normal={100} abnormal={85}/>
                <MetricRow label="UCS Index" value={measurements.ucsIndex} unit="" normal={0.6} abnormal={1.0}/>
                <MetricRow label="LCS Index" value={measurements.lcsIndex} unit="" normal={0.5} abnormal={1.0}/>
              </div>
            </div>
          ):(
            // Mobile: stacked
            <>
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
              <div style={{fontSize:"0.62rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginTop:14,marginBottom:7}}>Sagittal Plane</div>
              {/* CVA highlighted card on mobile too */}
              <div style={{marginBottom:8,padding:"8px 10px",borderRadius:8,
                background:measurements.cvaAngle!=null&&measurements.cvaAngle<49?"rgba(220,38,38,0.07)":measurements.cvaAngle!=null&&measurements.cvaAngle<55?"rgba(180,83,9,0.07)":"rgba(5,150,105,0.07)",
                border:`1px solid ${measurements.cvaAngle!=null&&measurements.cvaAngle<49?PC.red:measurements.cvaAngle!=null&&measurements.cvaAngle<55?PC.yellow:PC.green}25`}}>
                <div style={{fontSize:"0.56rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:2}}>CVA — Primary FHP Marker</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                  <span style={{fontSize:"0.65rem",color:PC.text}}>Craniovertebral Angle</span>
                  <span style={{fontSize:"0.8rem",fontWeight:900,color:measurements.cvaAngle!=null&&measurements.cvaAngle<49?PC.red:measurements.cvaAngle!=null&&measurements.cvaAngle<55?PC.yellow:PC.green}}>
                    {measurements.cvaAngle!=null?`${measurements.cvaAngle.toFixed(1)}°`:"—"}
                  </span>
                </div>
                <div style={{fontSize:"0.55rem",color:PC.muted,marginTop:2}}>Normal &gt;55° · &lt;49° = High load</div>
              </div>
              {measurements.cervicalLoadKg!=null&&(
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${PC.border}`}}>
                  <div style={{flex:1,fontSize:"0.68rem",color:PC.muted}}>Cervical Load Est. <span style={{fontSize:"0.56rem"}}>(Hansraj 2014)</span></div>
                  <div style={{fontSize:"0.75rem",fontWeight:800,color:measurements.cervicalLoadKg>18?PC.red:measurements.cervicalLoadKg>12?PC.yellow:PC.green,minWidth:60,textAlign:"right"}}>{measurements.cervicalLoadKg.toFixed(1)}kg</div>
                </div>
              )}
              <MetricRow label="Forward Head" value={measurements.fhpNorm} unit="%" normal={3} abnormal={7}/>
              <MetricRow label="Thoracic Kyphosis" value={measurements.thoracicAngle} unit="°" normal={45} abnormal={55}/>
              {/* Lumbar lordosis paired with kyphosis */}
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${PC.border}`}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:"0.68rem",color:PC.muted}}>Lumbar Lordosis (proxy)</div>
                  <div style={{fontSize:"0.54rem",color:PC.muted,marginTop:1}}>Normal 20–40° · Pairs with kyphosis</div>
                </div>
                <div style={{fontSize:"0.75rem",fontWeight:800,minWidth:60,textAlign:"right",
                  color:measurements.lumbarProxy==null?"rgba(156,163,175,0.6)":Math.abs(measurements.lumbarProxy)>10?PC.red:Math.abs(measurements.lumbarProxy)>5?PC.yellow:PC.green}}>
                  {measurements.lumbarProxy!=null?`${measurements.lumbarProxy>0?"↑":"↓"}${Math.abs(measurements.lumbarProxy).toFixed(1)}%`:"—"}
                </div>
              </div>
              <MetricRow label="Hip Extension Proxy" value={measurements.hipExtensionProxy} unit="%" normal={5} abnormal={10}/>
              <MetricRow label="L Knee Deviation" value={measurements.leftKneeDev} unit="°" normal={5} abnormal={12}/>
              <MetricRow label="R Knee Deviation" value={measurements.rightKneeDev} unit="°" normal={5} abnormal={12}/>
              <div style={{fontSize:"0.62rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginTop:14,marginBottom:7}}>New Measurements</div>
              <MetricRow label="Neck Lateral Angle" value={measurements.neckLateralAngle} unit="°" normal={4} abnormal={8}/>
              <MetricRow label="Waist Triangle Asymm." value={measurements.waistTriangleAsymmetry} unit="%" normal={3} abnormal={6}/>
              <MetricRow label="Ankle LLD" value={measurements.ankleLLDmm} unit="mm" normal={5} abnormal={10}/>
              <MetricRow label="Tibial Varum L" value={measurements.tibialVarumL} unit="°" normal={5} abnormal={10}/>
              <MetricRow label="Tibial Varum R" value={measurements.tibialVarumR} unit="°" normal={5} abnormal={10}/>
              <MetricRow label="Carrying Angle L" value={measurements.carryingAngleL} unit="°" normal={15} abnormal={20}/>
              <MetricRow label="Carrying Angle R" value={measurements.carryingAngleR} unit="°" normal={15} abnormal={20}/>
              <div style={{fontSize:"0.62rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginTop:14,marginBottom:7}}>Bilateral Symmetry &amp; Global</div>
              <MetricRow label="Scapular Asymmetry" value={measurements.scapularAsymm} unit="%" normal={2.5} abnormal={5}/>
              <MetricRow label="C7 Plumb Deviation" value={measurements.c7PlumbDev} unit="%" normal={3} abnormal={6}/>
              <MetricRow label="COG Deviation" value={measurements.cogDeviation} unit="%" normal={4} abnormal={8}/>
              <MetricRow label="Pelvic Obliquity" value={measurements.pelvicObliquity} unit="%" normal={3} abnormal={6}/>
              <MetricRow label="L Foot Angle" value={measurements.leftFootAngle} unit="°" normal={10} abnormal={20}/>
              <MetricRow label="R Foot Angle" value={measurements.rightFootAngle} unit="°" normal={10} abnormal={20}/>
              <MetricRow label="L Ankle Dorsiflexion" value={measurements.leftAnkleAngle} unit="°" normal={100} abnormal={85}/>
              <MetricRow label="R Ankle Dorsiflexion" value={measurements.rightAnkleAngle} unit="°" normal={100} abnormal={85}/>
              <div style={{fontSize:"0.62rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginTop:14,marginBottom:10}}>Syndrome Indices</div>
              <MetricRow label="UCS Index" value={measurements.ucsIndex} unit="" normal={0.6} abnormal={1.0}/>
              <MetricRow label="LCS Index" value={measurements.lcsIndex} unit="" normal={0.5} abnormal={1.0}/>
            </>
          )}

          {/* PLI — both layouts */}
          {measurements.posturalLoadIndex!=null&&(
            <>
              <div style={{fontSize:"0.62rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginTop:18,marginBottom:7}}>Postural Load Index</div>
              <div style={{padding:"12px 14px",borderRadius:12,border:`1px solid ${measurements.posturalLoadIndex>65?PC.red:measurements.posturalLoadIndex>35?PC.yellow:PC.green}30`,background:`${measurements.posturalLoadIndex>65?PC.red:measurements.posturalLoadIndex>35?PC.yellow:PC.green}08`,marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                  <span style={{fontSize:"0.72rem",color:PC.muted}}>PLI (0 = ideal, 100 = max load)</span>
                  <span style={{fontSize:"1rem",fontWeight:900,color:measurements.posturalLoadIndex>65?PC.red:measurements.posturalLoadIndex>35?PC.yellow:PC.green}}>{measurements.posturalLoadIndex}/100</span>
                </div>
                <div style={{height:6,background:PC.s2,borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${measurements.posturalLoadIndex}%`,height:"100%",background:measurements.posturalLoadIndex>65?PC.red:measurements.posturalLoadIndex>35?PC.yellow:PC.green,borderRadius:3,transition:"width 0.5s"}}/>
                </div>
              </div>
            </>
          )}

          {/* Regional sub-scores */}
          {scoreData?.subScores&&!isWide&&(
            <>
              <div style={{fontSize:"0.62rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginTop:14,marginBottom:7}}>Regional Sub-scores</div>
              {Object.entries(scoreData.subScores).map(([region,val])=>{
                const col=val>=74?PC.green:val>=55?PC.yellow:PC.red;
                return(
                  <div key={region} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${PC.border}`}}>
                    <div style={{flex:1,fontSize:"0.68rem",color:PC.muted,textTransform:"capitalize"}}>{region}</div>
                    <div style={{width:60,height:4,background:PC.s2,borderRadius:2,overflow:"hidden"}}>
                      <div style={{width:`${val}%`,height:"100%",background:col,borderRadius:2}}/>
                    </div>
                    <div style={{fontSize:"0.72rem",fontWeight:800,color:col,minWidth:32,textAlign:"right"}}>{Math.round(val)}</div>
                  </div>
                );
              })}
            </>
          )}

          {/* Calibration */}
          <div style={{fontSize:"0.62rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginTop:18,marginBottom:7}}>Calibration — Real Measurements</div>
          <div style={{padding:"10px 14px",borderRadius:12,border:`1px solid ${PC.border}`,background:PC.surface,marginBottom:8}}>
            <div style={{fontSize:"0.7rem",color:PC.muted,marginBottom:8}}>Patient height — used to convert % measurements to real cm</div>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
              <input type="number" min={100} max={220} value={patientHeightCm}
                onChange={e=>setPatientHeightCm(Number(e.target.value))}
                style={{flex:1,padding:"8px 12px",border:`1px solid ${PC.border}`,borderRadius:9,fontSize:"0.85rem",background:PC.bg,color:PC.text}}/>
              <span style={{fontSize:"0.75rem",color:PC.muted}}>cm</span>
            </div>
            {measurements?._calibrated?(
              <div>
                <div style={{fontSize:"0.6rem",fontWeight:700,color:PC.green,marginBottom:6}}>✓ Calibrated — showing real measurements</div>
                {[
                  ["Forward Head Posture", measurements.fhpCm, "cm", 2, 3.5, "Normal: <1.5cm"],
                  ["Shoulder Height Diff", measurements.shoulderDiffCm, "cm", 0.8, 1.8, "Normal: <0.5cm"],
                  ["Pelvic Height Diff (ASIS)", measurements.pelvisDiffCm, "cm", 0.8, 1.5, "Normal: <0.5cm"],
                  ["Trunk Lateral Shift", measurements.trunkShiftCm, "cm", 1.5, 3, "Normal: <1cm"],
                  ["Head Lateral Offset", measurements.headOffsetCm, "cm", 1, 2.5, "Normal: <0.8cm"],
                  ["Ankle LLD (proxy)", measurements.ankleLLDcm, "cm", 0.5, 1, "Significant: >0.5cm — confirm with tape"],
                ].map(([label, val, unit, warn, crit, hint])=>{
                  if(val===null||val===undefined) return null;
                  const col = val>crit?PC.red:val>warn?PC.yellow:PC.green;
                  return(
                    <div key={label} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${PC.border}`}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:"0.68rem",color:PC.muted}}>{label}</div>
                        <div style={{fontSize:"0.55rem",color:PC.muted,opacity:0.7}}>{hint}</div>
                      </div>
                      <div style={{fontSize:"0.82rem",fontWeight:800,color:col}}>{val.toFixed(1)}{unit}</div>
                      <div style={{width:8,height:8,borderRadius:"50%",background:col,flexShrink:0}}/>
                    </div>
                  );
                })}
              </div>
            ):(
              <div style={{fontSize:"0.65rem",color:PC.muted,fontStyle:"italic"}}>
                Upload a photo or start camera to compute calibration from detected landmarks.
              </div>
            )}
          </div>
          {reliability?.icc!=null&&(
            <div style={{padding:"8px 0",borderBottom:`1px solid ${PC.border}`,display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:"0.7rem",color:PC.muted}}>ICC estimate (test-retest reliability)</span>
              <span style={{fontSize:"0.75rem",fontWeight:800,color:reliability.icc>0.75?PC.green:reliability.icc>0.5?PC.yellow:PC.red}}>{reliability.icc}</span>
            </div>
          )}
        </div>
      )}

      {/* History tab */}
      {tab==="history"&&(
        <div style={{padding: isWide?"20px 24px":"14px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontWeight:700,fontSize: isWide?"0.95rem":"0.8rem",color:PC.text}}>Session History</div>
            {sessions.length>0&&<button onClick={clearHistory} style={{fontSize:"0.68rem",color:PC.red,background:"none",border:"none",cursor:"pointer"}}>Clear all</button>}
          </div>
          {sessions.length===0&&<div style={{textAlign:"center",color:PC.muted,fontSize:"0.82rem",padding:"30px"}}>No sessions yet. Capture or analyse a photo to start tracking.</div>}
          {sessions.length>=2&&(
            <div style={{padding:"12px 14px",borderRadius:12,border:`1px solid ${PC.border}`,marginBottom:14,background:PC.surface}}>
              <div style={{fontSize:"0.6rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:7}}>Score Trend</div>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <PostureSparkline sessions={sessions} colour={PC.accent}/>
                <div>
                  <div style={{fontSize:"0.82rem",fontWeight:900,color:PC.accent}}>{sessions[sessions.length-1].score} <span style={{fontSize:"0.65rem",fontWeight:400,color:PC.muted}}>latest</span></div>
                  <div style={{fontSize:"0.65rem",color:sessions[sessions.length-1].score>=sessions[sessions.length-2].score?PC.green:PC.red}}>
                    {sessions[sessions.length-1].score>=sessions[sessions.length-2].score?"▲":"▼"} {Math.abs(sessions[sessions.length-1].score-sessions[sessions.length-2].score)} vs prev
                  </div>
                </div>
              </div>
            </div>
          )}
          <div style={isWide?{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}:{}}>
            {[...sessions].reverse().map((s,i)=>(
              <div key={i} style={{padding:"11px 14px",borderRadius:11,border:`1px solid ${PC.border}`,marginBottom: isWide?0:8,background:PC.surface}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontWeight:700,fontSize:"0.75rem",color:PC.text}}>{VIEWS[s.view]?.label||s.view} · Score {s.score}</div>
                  <div style={{fontSize:"0.62rem",color:PC.muted}}>{new Date(s.time).toLocaleTimeString()}</div>
                </div>
                <div style={{fontSize:"0.68rem",color:PC.muted,marginTop:3}}>{s.band} · {s.findings} finding{s.findings!==1?"s":""}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── Left panel: controls + image ────────────────────────────────────────────
  // ── Multi-view helpers ───────────────────────────────────────────────────────
  const mvViewOrder = ["anterior","posterior","left","right"];
  const mvCapturedCount = Object.keys(mvResults).length;
  const mvCanGenerate = mvCapturedCount >= 2;

  function handleGenerateComposite() {
    const composite = mergeViewResults(Object.values(mvResults));
    setMvComposite(composite);
    setMvTab("report");
  }
  function handleClearMv() { setMvResults({}); setMvComposite(null); setMvTab("capture"); }

  // Assessment mode toggle strip
  const assessModeToggle = (
    <div style={{padding:isWide?"8px 20px":"8px 16px",background:PC.bg,borderBottom:`1px solid ${PC.border}`,display:"flex",gap:6}}>
      {[
        ["single","▣ Single View","Quick screen — one view"],
        ["multi", "☰ Multi-View", "Full assessment — 2–4 views"],
      ].map(([m,label,sub])=>(
        <button key={m} onClick={()=>{ setAssessMode(m); if(m==="single"){setMvResults({});setMvComposite(null);} }}
          style={{flex:1,padding:isWide?"9px 8px":"8px 6px",borderRadius:10,
            border:`1px solid ${assessMode===m?PC.accent:PC.border}`,
            background:assessMode===m?`${PC.accent}14`:"transparent",
            color:assessMode===m?PC.accent:PC.muted,
            fontWeight:700,fontSize:isWide?"0.78rem":"0.7rem",cursor:"pointer",textAlign:"center"}}>
          <div>{label}</div>
          <div style={{fontSize:"0.55rem",fontWeight:400,marginTop:2,opacity:0.75}}>{sub}</div>
        </button>
      ))}
    </div>
  );

  // Multi-view progress strip (shown below view selector in multi mode)
  const mvCaptureStrip = assessMode==="multi" && (
    <div style={{padding:isWide?"12px 20px":"10px 16px",background:PC.s2,borderBottom:`1px solid ${PC.border}`}}>
      <div style={{fontSize:"0.6rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>☰ Multi-View Progress ({mvCapturedCount}/4)</span>
        {mvCapturedCount>0&&<button onClick={handleClearMv} style={{fontSize:"0.58rem",color:PC.red,background:"none",border:"none",cursor:"pointer",fontWeight:700}}>Reset all</button>}
      </div>
      {/* Per-view dots */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
        {mvViewOrder.map(vk=>{
          const meta=VIEWS[vk]; const done=!!mvResults[vk]; const isAct=view===vk;
          return(
            <button key={vk} onClick={()=>setView(vk)} style={{padding:"6px 4px",borderRadius:9,
              border:`1px solid ${done?PC.green:isAct?meta.colour:PC.border}`,
              background:done?`${PC.green}12`:isAct?`${meta.colour}12`:"transparent",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:"0.9rem"}}>{done?"✅":meta.icon}</div>
              <div style={{fontSize:"0.55rem",fontWeight:700,color:done?PC.green:isAct?meta.colour:PC.muted,marginTop:2}}>{meta.short}</div>
            </button>
          );
        })}
      </div>
      {/* Plane coverage */}
      <div style={{display:"flex",gap:6,marginBottom:10}}>
        {[["Frontal",!!(mvResults.anterior||mvResults.posterior),"Anterior or Posterior"],
          ["Sagittal",!!(mvResults.left||mvResults.right),"Left or Right lateral"]
        ].map(([label,has,tip])=>(
          <div key={label} style={{flex:1,padding:"5px 8px",borderRadius:7,
            background:has?`${PC.green}10`:`${PC.border}40`,border:`1px solid ${has?PC.green:PC.border}`,
            display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:"0.65rem"}}>{has?"✓":"○"}</span>
            <div>
              <div style={{fontSize:"0.6rem",fontWeight:700,color:has?PC.green:PC.muted}}>{label}</div>
              <div style={{fontSize:"0.52rem",color:PC.muted}}>{tip}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Generate button */}
      <button onClick={handleGenerateComposite} disabled={!mvCanGenerate} style={{
        width:"100%",padding:"11px",borderRadius:11,border:"none",
        background:mvCanGenerate?`linear-gradient(135deg,${PC.accent},${PC.a2})`:PC.s3,
        color:mvCanGenerate?"#fff":PC.muted,fontWeight:800,
        fontSize:isWide?"0.85rem":"0.78rem",cursor:mvCanGenerate?"pointer":"not-allowed"}}>
        {mvCanGenerate?`▶ Generate Composite Report (${mvCapturedCount} views)`:`Upload ≥2 views to generate report`}
      </button>
    </div>
  );

  // Multi-view thumbnail strip — shows captured images side by side
  const mvThumbnailStrip = assessMode==="multi" && mvCapturedCount > 0 && (
    <div style={{padding:"10px 16px",background:PC.surface,borderBottom:`1px solid ${PC.border}`}}>
      <div style={{fontSize:"0.58rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:7}}>
        Captured Views — {mvCapturedCount} of 4
      </div>
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
        {mvViewOrder.map(vk=>{
          const res=mvResults[vk];
          const meta=VIEWS[vk];
          const isActive=view===vk;
          if(!res && !isActive) return null; // only show captured + current active
          return(
            <div key={vk} onClick={()=>setView(vk)}
              style={{flexShrink:0,width:72,cursor:"pointer",
                border:`2px solid ${isActive?meta.colour:res?PC.green:PC.border}`,
                borderRadius:9,overflow:"hidden",position:"relative"}}>
              {res?.img ? (
                <img src={res.img} alt={meta.label}
                  style={{width:"100%",height:56,objectFit:"cover",display:"block"}}/>
              ) : (
                <div style={{width:"100%",height:56,background:PC.s3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem"}}>{meta.icon}</div>
              )}
              <div style={{padding:"2px 4px",background:res?"rgba(5,150,105,0.85)":isActive?`rgba(124,58,237,0.85)`:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:"0.52rem",fontWeight:700,color:"#fff"}}>{meta.short}</span>
                {res?.scoreData&&<span style={{fontSize:"0.52rem",color:"#fff",fontWeight:800}}>{res.scoreData.score}</span>}
                {!res&&isActive&&<span style={{fontSize:"0.5rem",color:"#fff"}}>active</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Multi-view composite report (replaces right panel when ready)
  const mvReportPanel = assessMode==="multi" && mvComposite && mvTab==="report" && (
    <div style={{flex:1,overflowY:"auto",paddingBottom:isMobile?80:24}}>
      {/* Header */}
      <div style={{padding:isWide?"18px 24px":"14px 16px",borderBottom:`1px solid ${PC.border}`,background:PC.surface,display:"flex",alignItems:"center",justifyContent:"space-between",position:isWide?"sticky":"static",top:0,zIndex:5}}>
        <div>
          <div style={{fontWeight:900,fontSize:isWide?"1rem":"0.9rem",color:PC.text}}>Multi-View Composite Report</div>
          <div style={{fontSize:"0.62rem",color:PC.muted,marginTop:2}}>
            {mvComposite.coverage.viewCount} views · {mvComposite.coverage.frontal?"✓ Frontal":"○ Frontal"} · {mvComposite.coverage.sagittal?"✓ Sagittal":"○ Sagittal"}
          </div>
        </div>
        <button onClick={()=>setMvTab("capture")} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${PC.border}`,background:PC.s2,fontSize:"0.68rem",fontWeight:700,color:PC.muted,cursor:"pointer"}}>← Back</button>
      </div>

      {/* Captured view thumbnails inside report */}
      <div style={{padding:"10px 16px",borderBottom:`1px solid ${PC.border}`,background:PC.s2}}>
        <div style={{fontSize:"0.58rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>Views Analysed</div>
        <div style={{display:"flex",gap:8,overflowX:"auto"}}>
          {mvViewOrder.map(vk=>{
            const res=mvResults[vk]; if(!res) return null;
            const meta=VIEWS[vk];
            return(
              <div key={vk} style={{flexShrink:0,width:isWide?88:72,borderRadius:9,overflow:"hidden",border:`2px solid ${PC.green}`}}>
                {res.img&&<img src={res.img} alt={meta.label} style={{width:"100%",height:isWide?64:54,objectFit:"cover",display:"block"}}/>}
                <div style={{padding:"2px 5px",background:"rgba(5,150,105,0.85)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:"0.52rem",fontWeight:700,color:"#fff"}}>{meta.short}</span>
                  {res.scoreData&&<span style={{fontSize:"0.55rem",color:"#fff",fontWeight:800}}>{res.scoreData.score}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{padding:isWide?"20px 24px":"14px 16px"}}>
        {/* Score + summary */}
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16,padding:isWide?"18px":"14px",background:PC.surface,borderRadius:14,border:`1px solid ${mvComposite.compositeColour}30`}}>
          <ScoreRing score={mvComposite.compositeScore} band={mvComposite.compositeBand} colour={mvComposite.compositeColour} size={isWide?96:80}/>
          <div style={{flex:1}}>
            <div style={{fontWeight:900,fontSize:isWide?"1rem":"0.88rem",color:mvComposite.compositeColour}}>{mvComposite.compositeBand}</div>
            <div style={{fontSize:"0.68rem",color:PC.muted,marginTop:4,lineHeight:1.5}}>{mvComposite.summary}</div>
          </div>
        </div>
        {/* Named patterns */}
        {(mvComposite.sagittalPattern||mvComposite.frontalPattern)&&(
          <div style={{marginBottom:14,display:"flex",flexDirection:"column",gap:6}}>
            {mvComposite.sagittalPattern&&(
              <div style={{padding:"9px 13px",borderRadius:10,background:`${PC.accent}10`,border:`1px solid ${PC.accent}25`,fontSize:"0.72rem",fontWeight:700,color:PC.accent}}>
                ◈ Sagittal: {mvComposite.sagittalPattern}
              </div>
            )}
            {mvComposite.frontalPattern&&(
              <div style={{padding:"9px 13px",borderRadius:10,background:`${PC.a2}10`,border:`1px solid ${PC.a2}25`,fontSize:"0.72rem",fontWeight:700,color:PC.a2}}>
                ◈ Frontal: {mvComposite.frontalPattern}
              </div>
            )}
          </div>
        )}
        {/* Regional sub-scores */}
        {mvComposite.subScores&&(
          <div style={{marginBottom:16}}>
            <div style={{fontSize:"0.6rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>Regional Scores</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {Object.entries(mvComposite.subScores).map(([region,val])=>{
                if(val==null) return null;
                const col=val>=74?PC.green:val>=55?PC.yellow:PC.red;
                return(
                  <div key={region} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,background:`${col}12`,border:`1px solid ${col}30`}}>
                    <span style={{fontSize:"0.62rem",color:PC.muted,textTransform:"capitalize"}}>{region}</span>
                    <span style={{fontSize:"0.7rem",fontWeight:800,color:col}}>{val}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Confirmed findings */}
        {mvComposite.mergedFindings.filter(f=>f.confirmed).length>0&&(
          <div style={{marginBottom:12}}>
            <div style={{fontSize:"0.6rem",fontWeight:700,color:PC.green,textTransform:"uppercase",letterSpacing:"1px",marginBottom:7}}>✓ Confirmed — seen in ≥2 views</div>
            {mvComposite.mergedFindings.filter(f=>f.confirmed).map((f,i)=>(
              <FindingCard key={i} f={{...f, text:`${f.text}  [${f.sourceViews.join(" + ")}]`}}/>
            ))}
          </div>
        )}
        {/* Unconfirmed findings */}
        {mvComposite.mergedFindings.filter(f=>!f.confirmed).length>0&&(
          <div>
            <div style={{fontSize:"0.6rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:7}}>○ Single-view only — verify clinically</div>
            {mvComposite.mergedFindings.filter(f=>!f.confirmed).map((f,i)=>(
              <div key={i} style={{opacity:0.8}}><FindingCard f={f}/></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const leftPanel = (
    <div style={{display:"flex",flexDirection:"column",flex: isWide?"0 0 480px":"1",minWidth:0,borderRight: isWide?`1px solid ${PC.border}`:"none",overflowY: isWide?"hidden":"auto"}}>

      {/* Assessment mode toggle: Single View vs Multi-View */}
      {assessModeToggle}

      {/* Mode toggle */}
      <div style={{padding: isWide?"10px 20px":"10px 16px",background:PC.surface,borderBottom:`1px solid ${PC.border}`,display:"flex",gap:8}}>
        {[["upload","↑ Upload"],["live","▣ Live"]].map(([m,label])=>(
          <button key={m} onClick={()=>{setMode(m);if(m==="live")setTab("capture");else{stopCamera();setTab("capture");}}}
            style={{flex:1,padding: isWide?"10px":"9px",borderRadius:10,border:`1px solid ${mode===m?viewMeta.colour:PC.border}`,background:mode===m?`${viewMeta.colour}15`:"transparent",color:mode===m?viewMeta.colour:PC.muted,fontWeight:700,fontSize: isWide?"0.85rem":"0.78rem",cursor:"pointer"}}>
            {label}
          </button>
        ))}
      </div>

      {/* AI/Manual toggle */}
      {!isLive&&(
        <div style={{padding: isWide?"8px 20px":"8px 16px",background:PC.s3,borderBottom:`1px solid ${PC.border}`,display:"flex",gap:6}}>
          {[["ai","⚙ AI Auto (~70-80%)"],["manual","✋ Manual Points (~90-95%)"]].map(([m,label])=>(
            <button key={m} onClick={()=>handleModeSwitch(m)}
              style={{flex:1,padding:"7px 6px",borderRadius:9,border:`1px solid ${inputMode===m?PC.accent:PC.border}`,background:inputMode===m?`${PC.accent}18`:"transparent",color:inputMode===m?PC.accent:PC.muted,fontWeight:700,fontSize: isWide?"0.75rem":"0.68rem",cursor:"pointer",textAlign:"center"}}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* View selector */}
      <div style={{padding: isWide?"12px 20px":"10px 16px",background:PC.s2,borderBottom:`1px solid ${PC.border}`}}>
        <div style={{fontSize:"0.6rem",fontWeight:700,color:PC.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>Select View</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap: isWide?10:7}}>
          {Object.entries(VIEWS).map(([key,meta])=>{
            const active=view===key;
            return(
              <button key={key} onClick={()=>handleViewSwitch(key)}
                style={{padding: isWide?"10px 4px":"8px 4px",borderRadius:11,border:`1px solid ${active?meta.colour:PC.border}`,background:active?`${meta.colour}18`:"transparent",cursor:"pointer",textAlign:"center",transition:"all 0.15s"}}>
                <div style={{fontSize: isWide?"1.2rem":"1rem",marginBottom:2}}>{meta.icon}</div>
                <div style={{fontSize: isWide?"0.7rem":"0.62rem",fontWeight:800,color:active?meta.colour:PC.muted,lineHeight:1.2}}>{meta.short}</div>
                <div style={{fontSize:"0.5rem",color:active?meta.colour:PC.muted,opacity:0.75,marginTop:2}}>{meta.badge}</div>
              </button>
            );
          })}
        </div>
        <div style={{marginTop:8,padding:"7px 11px",background:`${viewMeta.colour}08`,border:`1px solid ${viewMeta.colour}20`,borderRadius:9,fontSize: isWide?"0.72rem":"0.65rem",color:PC.muted}}>
          <div>{viewMeta.helper}</div>
          {viewMeta.checks&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:"3px 10px",marginTop:5}}>
              {viewMeta.checks.map((c,i)=><span key={i} style={{color:PC.a3,fontSize:"0.62rem"}}>✓ {c}</span>)}
            </div>
          )}
        </div>
      </div>

      {/* Multi-view progress strip */}
      {mvCaptureStrip}

      {/* Multi-view thumbnail strip */}
      {mvThumbnailStrip}

      {/* Camera / Upload area */}
      <div style={{flex:1,overflowY:"auto"}}>
        {isLive?(
          <div>
            {!camReady?(
              <div style={{padding: isWide?"20px":"16px",display:"flex",flexDirection:"column",gap:10}}>
                {error&&<div style={{padding:"10px 13px",background:"rgba(220,38,38,0.08)",border:`1px solid ${PC.red}30`,borderRadius:9,fontSize:"0.76rem",color:PC.red}}>{error}</div>}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[["environment","▣ Back Camera"],["user","⎇ Front Camera"]].map(([f,label])=>(
                    <button key={f} onClick={()=>startCamera(f)} disabled={mpStatus!=="ready"}
                      style={{padding: isWide?"16px":"13px",borderRadius:12,border:`1px solid ${PC.border}`,background:PC.surface,color:mpStatus==="ready"?PC.text:PC.muted,fontWeight:700,fontSize: isWide?"0.85rem":"0.78rem",cursor:mpStatus==="ready"?"pointer":"not-allowed"}}>
                      {label}
                    </button>
                  ))}
                </div>
                {camStatus==="starting"&&<div style={{textAlign:"center",color:PC.yellow,fontSize:"0.78rem"}}>⏳ Starting camera…</div>}
              </div>
            ):(
              <div>
                <div style={{position:"relative",background:"#111",width:"100%",overflow:"hidden",borderRadius:0}}>
                  {/* Video — NO scaleX flip; front camera CSS-flipped only when user-facing */}
                  <video ref={videoRef} playsInline webkit-playsinline="true" muted autoPlay
                    style={{width:"100%",display:"block",
                      transform:camFacing==="user"?"scaleX(-1)":"none",
                      maxHeight: isMobile?"55vw":"45vh",
                      objectFit:"cover",background:"#111"}}/>
                  {/* Canvas overlay — matches video flip */}
                  <canvas ref={overlayRef}
                    style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",
                      transform:camFacing==="user"?"scaleX(-1)":"none",
                      pointerEvents:"none"}}/>
                  <div style={{position:"absolute",top:8,left:8,display:"flex",gap:5,flexWrap:"wrap"}}>
                    <div style={{padding:"3px 8px",borderRadius:8,background:"rgba(0,0,0,0.7)",fontSize:"0.62rem",fontWeight:700,color:hasData?PC.green:PC.yellow}}>
                      {hasData?`● Tracking · ${reliability?.score}% · ICC ${reliability?.icc??"-"}`:"● Searching…"}
                    </div>
                    {motionWarning&&<div style={{padding:"3px 8px",borderRadius:8,background:"rgba(0,0,0,0.7)",fontSize:"0.62rem",fontWeight:700,color:PC.yellow}}>⟳ Hold still</div>}
                    <div style={{padding:"3px 8px",borderRadius:8,background:"rgba(0,0,0,0.7)",fontSize:"0.62rem",fontWeight:700,color:PC.a3}}>— {patientHeightCm}cm</div>
                  </div>
                  {scoreData&&<div style={{position:"absolute",top:8,right:8}}><ScoreRing score={scoreData.score} band={scoreData.band} colour={scoreData.colour} size={isMobile?60:80}/></div>}
                  {countdown!==null&&(
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.4)"}}>
                      <div style={{fontSize:"6rem",fontWeight:900,color:"#fff"}}>{countdown}</div>
                    </div>
                  )}
                </div>
                <div style={{padding:"10px 14px",background:PC.surface,borderTop:`1px solid ${PC.border}`,display:"flex",gap:8}}>
                  <button onClick={()=>capturePhoto(0)} disabled={!hasData}
                    style={{flex:2,padding: isWide?"13px":"11px",background:hasData?`linear-gradient(135deg,${PC.accent},${PC.a2})`:"#e5e7eb",border:"none",borderRadius:10,color:hasData?"#fff":PC.muted,fontWeight:800,fontSize: isWide?"0.85rem":"0.78rem",cursor:hasData?"pointer":"not-allowed"}}>
                    ☉ Capture
                  </button>
                  <button onClick={()=>capturePhoto(3)} disabled={!hasData}
                    style={{flex:1,padding:"11px",background:`${PC.a2}20`,border:`1px solid ${PC.a2}30`,borderRadius:10,color:PC.a2,fontWeight:700,fontSize:"0.75rem",cursor:hasData?"pointer":"not-allowed"}}>
                    ⏳ 3s
                  </button>
                  <button onClick={flipCamera} style={{flex:"0 0 44px",padding:"11px",background:PC.s2,border:`1px solid ${PC.border}`,borderRadius:10,cursor:"pointer"}}>↻</button>
                  <button onClick={stopCamera} style={{flex:"0 0 44px",padding:"11px",background:"rgba(220,38,38,0.1)",border:`1px solid ${PC.red}30`,borderRadius:10,color:PC.red,cursor:"pointer"}}>⏹</button>
                </div>
              </div>
            )}
          </div>
        ):(
          <div style={{padding: isWide?"20px":"16px"}}>
            {error&&<div style={{padding:"10px 13px",background:"rgba(220,38,38,0.08)",border:`1px solid ${PC.red}30`,borderRadius:9,fontSize:"0.76rem",color:PC.red,marginBottom:12}}>{error}</div>}
            <button onClick={()=>fileInputRef.current?.click()}
              disabled={inputMode==="ai"?(mpStatus!=="ready"||analysing):false}
              style={{width:"100%",padding: isWide?"20px":"16px",borderRadius:14,border:`2px dashed ${viewMeta.colour}`,background:`${viewMeta.colour}08`,color:viewMeta.colour,fontWeight:700,fontSize: isWide?"0.9rem":"0.82rem",cursor:"pointer",textAlign:"center",marginBottom:14}}>
              {analysing?"⏳ Analysing…":"▤ Tap to upload photo"}
              <div style={{fontSize: isWide?"0.72rem":"0.65rem",fontWeight:400,marginTop:5,color:PC.muted}}>
                {inputMode==="manual"?"Upload photo — then tap each anatomical point":"JPG, PNG — full body, clear background"}
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>

            {/* Manual mode */}
            {inputMode==="manual"&&uploadedImg&&(
              <div>
                <div style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <div style={{fontSize:"0.72rem",fontWeight:700,color:PC.accent}}>✋ Manual Points: {manualPlacedCount} / {manualTotal}</div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={undoLastManual} disabled={manualPlacedCount===0}
                        style={{padding:"4px 10px",borderRadius:7,border:`1px solid ${PC.border}`,background:PC.s2,fontSize:"0.65rem",fontWeight:700,color:PC.muted,cursor:manualPlacedCount>0?"pointer":"not-allowed"}}>
                        ↩ Undo
                      </button>
                      <button onClick={resetManual} disabled={manualPlacedCount===0}
                        style={{padding:"4px 10px",borderRadius:7,border:`1px solid ${PC.red}30`,background:"rgba(220,38,38,0.06)",fontSize:"0.65rem",fontWeight:700,color:PC.red,cursor:manualPlacedCount>0?"pointer":"not-allowed"}}>
                        Reset
                      </button>
                    </div>
                  </div>
                  <div style={{height:6,borderRadius:6,background:PC.s3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${manualPct*100}%`,background:manualCanAnalyse?PC.green:PC.accent,borderRadius:6,transition:"width 0.3s"}}/>
                  </div>
                </div>
                {nextManualIdx >= 0 ? (
                  <div style={{padding:"7px 11px",borderRadius:8,background:`${PC.accent}10`,border:`1px solid ${PC.accent}30`,fontSize:"0.7rem",color:PC.accent,marginBottom:9,fontWeight:700}}>
                    Next: {nextManualIdx+1}. {manualPointDefs[nextManualIdx]?.label} — {manualPointDefs[nextManualIdx]?.desc}
                  </div>
                ) : (
                  <div style={{padding:"7px 11px",borderRadius:8,background:`${PC.green}10`,border:`1px solid ${PC.green}30`,fontSize:"0.7rem",color:PC.green,marginBottom:9,fontWeight:700}}>
                    All points placed!
                  </div>
                )}
                <div ref={manualContainerRef} onClick={handleManualImageClick}
                  style={{position:"relative",borderRadius:12,overflow:"hidden",border:`2px solid ${PC.accent}`,cursor:nextManualIdx>=0?"crosshair":"default",marginBottom:10}}>
                  <img src={objectUrlRef.current||uploadedImg} alt="Tap to place points"
                    onLoad={e=>{ manualImgSize.current={w:e.target.naturalWidth,h:e.target.naturalHeight}; }}
                    style={{width:"100%",display:"block",userSelect:"none",pointerEvents:"none"}}/>
                  <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none"}} viewBox="0 0 1 1" preserveAspectRatio="none">
                    {manualConnections.map(([a,b],ci)=>{
                      const pa=manualPlaced[a], pb=manualPlaced[b];
                      if(!pa||!pb) return null;
                      return <line key={ci} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="rgba(0,229,255,0.7)" strokeWidth="0.003"/>;
                    })}
                    {manualPointDefs.map(def=>{
                      const p=manualPlaced[def.id]; if(!p) return null;
                      return (
                        <g key={def.id}>
                          <circle cx={p.x} cy={p.y} r="0.018" fill="rgba(0,229,255,0.9)" stroke="white" strokeWidth="0.004"/>
                          <text x={p.x} y={p.y+0.006} textAnchor="middle" fontSize="0.014" fontWeight="bold" fill="#000">{def.id+1}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div style={{display:"grid",gridTemplateColumns: isWide?"repeat(3,1fr)":"repeat(2,1fr)",gap:4,marginBottom:10}}>
                  {manualPointDefs.map(def=>{
                    const done=!!manualPlaced[def.id];
                    const isNext=def.id===manualPointDefs[nextManualIdx]?.id;
                    return(
                      <div key={def.id} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 7px",borderRadius:6,background:done?`${PC.green}10`:isNext?`${PC.accent}10`:"transparent",border:`1px solid ${done?PC.green:isNext?PC.accent:PC.border}`}}>
                        <div style={{width:14,height:14,borderRadius:"50%",background:done?PC.green:isNext?PC.accent:PC.s3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.55rem",fontWeight:900,color:"#fff",flexShrink:0}}>{done?"✓":def.id+1}</div>
                        <div style={{fontSize:"0.6rem",color:done?PC.green:isNext?PC.accent:PC.muted,fontWeight:done||isNext?700:400,lineHeight:1.2}}>{def.label}</div>
                      </div>
                    );
                  })}
                </div>
                {manualCanAnalyse&&(
                  <button onClick={analyseManualPoints}
                    style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${PC.accent},${PC.a2})`,color:"#fff",fontWeight:800,fontSize: isWide?"0.9rem":"0.82rem",cursor:"pointer"}}>
                    ✋ Analyse Now — {manualPlacedCount}/{manualTotal} points
                  </button>
                )}
              </div>
            )}

            {/* AI mode image */}
            {inputMode==="ai"&&uploadedImg&&(
              <div style={{borderRadius:14,overflow:"hidden",border:`1px solid ${PC.border}`,boxShadow:isWide?"0 4px 20px rgba(0,0,0,0.08)":"none",background:PC.s2}}>
                <img src={uploadedImg} alt="Analysed" style={{width:"100%",display:"block",maxHeight:isMobile?"50vh":"none",objectFit:"contain"}}/> 
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return(
    <div style={{background:PC.bg,minHeight:"100vh",fontFamily:"system-ui,-apple-system,sans-serif",display:"flex",flexDirection:"column"}}>

      {/* ── Header ── */}
      <div style={{padding:isWide?"14px 28px":"12px 16px",borderBottom:`1px solid ${PC.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:PC.surface,position:"sticky",top:0,zIndex:20,boxShadow:isWide?"0 1px 8px rgba(0,0,0,0.06)":"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:isWide?14:8}}>
          <div style={{width:isWide?40:32,height:isWide?40:32,borderRadius:isWide?12:9,background:`linear-gradient(135deg,${PC.accent},${PC.a2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isWide?"1.3rem":"1rem",flexShrink:0}}>∠</div>
          <div>
            <div style={{fontWeight:900,fontSize:isWide?"1.1rem":"0.95rem",background:`linear-gradient(90deg,${PC.accent},${PC.a2})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              Posture Analysis
            </div>
            <div style={{fontSize:isWide?"0.68rem":"0.6rem",color:PC.muted,marginTop:1}}>Clinical-grade biomechanical assessment</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{padding:isWide?"5px 12px":"3px 9px",borderRadius:20,fontSize:isWide?"0.65rem":"0.58rem",fontWeight:700,
            background:mpStatus==="ready"?"rgba(5,150,105,0.12)":mpStatus==="loading"?"rgba(180,83,9,0.12)":"rgba(220,38,38,0.12)",
            color:mpStatus==="ready"?PC.green:mpStatus==="loading"?PC.yellow:PC.red,
            border:`1px solid ${mpStatus==="ready"?PC.green:mpStatus==="loading"?PC.yellow:PC.red}40`}}>
            {mpStatus==="ready"?"⚙ AI Ready":mpStatus==="loading"?"⏳ Loading…":"❌ AI Error"}
          </div>
          <button onClick={()=>setShowHistory(h=>!h)}
            style={{padding:isWide?"6px 14px":"4px 9px",background:`${PC.a2}15`,border:`1px solid ${PC.a2}30`,borderRadius:9,color:PC.a2,fontSize:isWide?"0.72rem":"0.65rem",fontWeight:700,cursor:"pointer"}}>
            ▤ {sessions.length}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      {isWide ? (
        <div style={{flex:1,display:"flex",flexDirection:"row",overflow:"hidden",minHeight:"calc(100vh - 60px)"}}>
          {leftPanel}
          <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>
            {mvReportPanel || tabContent}
          </div>
        </div>
      ) : (
        /* ── Mobile: toggled panels with sticky switcher ── */
        <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
          {/* Panel toggle bar */}
          <div style={{display:"flex",borderBottom:`2px solid ${PC.border}`,background:PC.surface,position:"sticky",top:60,zIndex:15}}>
            <button onClick={()=>setMobilePanel("camera")}
              style={{flex:1,padding:"10px 8px",border:"none",
                borderBottom:`3px solid ${mobilePanel==="camera"?PC.accent:"transparent"}`,
                background:"transparent",color:mobilePanel==="camera"?PC.accent:PC.muted,
                fontWeight:800,fontSize:"0.78rem",cursor:"pointer"}}>
              ▣ Camera
            </button>
            <button onClick={()=>setMobilePanel("results")}
              style={{flex:1,padding:"10px 8px",border:"none",
                borderBottom:`3px solid ${mobilePanel==="results"?PC.accent:"transparent"}`,
                background:"transparent",
                color:mobilePanel==="results"?PC.accent:PC.muted,
                fontWeight:800,fontSize:"0.78rem",cursor:"pointer",
                position:"relative"}}>
              ≡ Results
              {findings.length>0&&(
                <span style={{marginLeft:5,padding:"1px 6px",borderRadius:10,
                  background:scoreData?.colour||PC.accent,color:"#fff",
                  fontSize:"0.62rem",fontWeight:800}}>
                  {scoreData?.score??findings.length}
                </span>
              )}
            </button>
          </div>

          {/* Panel content */}
          <div style={{flex:1,overflowY:"auto"}}>
            {mobilePanel==="camera" ? leftPanel : (mvReportPanel || tabContent)}
          </div>
        </div>
      )}

      {/* ── History modal ── */}
      {showHistory&&(
        <div onClick={()=>setShowHistory(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:50,display:"flex",alignItems:isWide?"center":"flex-end",justifyContent:"center"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:isWide?560:600,margin:isWide?"auto":"0 auto",background:PC.surface,borderRadius:isWide?"16px":"16px 16px 0 0",padding:"24px 20px",maxHeight:"70vh",overflowY:"auto"}}>
            <div style={{fontWeight:800,fontSize:"0.95rem",color:PC.text,marginBottom:14}}>▤ Session History ({sessions.length})</div>
            {sessions.length===0&&<div style={{color:PC.muted,fontSize:"0.82rem"}}>No sessions yet.</div>}
            {[...sessions].reverse().map((s,i)=>(
              <div key={i} style={{padding:"11px 14px",borderRadius:11,border:`1px solid ${PC.border}`,marginBottom:8}}>
                <div style={{fontWeight:700,fontSize:"0.75rem"}}>{VIEWS[s.view]?.label} · Score {s.score} — {s.band}</div>
                <div style={{fontSize:"0.65rem",color:PC.muted,marginTop:2}}>{new Date(s.time).toLocaleString()} · {s.findings} findings</div>
              </div>
            ))}
            <button onClick={()=>setShowHistory(false)} style={{marginTop:14,width:"100%",padding:"13px",background:`${PC.accent}15`,border:`1px solid ${PC.accent}30`,borderRadius:10,color:PC.accent,fontWeight:700,cursor:"pointer"}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
