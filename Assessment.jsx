import { useState, useCallback, useRef, useEffect } from "react";

const C = {
  bg:"#06090f", surface:"#0d1117", s2:"#131c28", s3:"#192435",
  border:"#1a2d45", accent:"#00e5ff", a2:"#7f5af0", a3:"#00c97a",
  a4:"#ffb300", a5:"#ff4d6d", text:"#d4e0f0", muted:"#6b8399",
  red:"#ff4d6d", green:"#00c97a", yellow:"#ffb300", purple:"#7f5af0",
};

// ═══════════════════════════════════════════════════════════════════════════
// SPECIAL TESTS — 100+ Tests with How-To + SVG Illustrations
// ═══════════════════════════════════════════════════════════════════════════

// SVG illustrations for each test (simplified anatomical diagrams)
const TEST_SVG = {
  // ─── SHOULDER ───────────────────────────────────────────────────────────
  neer: (
    <svg viewBox="0 0 120 140" width="100%" height="100">
      <rect x="45" y="0" width="20" height="50" rx="8" fill="#1a2d45" stroke="#00e5ff" strokeWidth="1.5"/>
      <ellipse cx="55" cy="55" rx="18" ry="18" fill="#131c28" stroke="#00e5ff" strokeWidth="1.5"/>
      <rect x="38" y="68" width="14" height="55" rx="6" fill="#1a2d45" stroke="#7f5af0" strokeWidth="1.5"/>
      <path d="M55,55 L30,30" stroke="#ff4d6d" strokeWidth="2" strokeDasharray="4,2"/>
      <text x="5" y="28" fontSize="9" fill="#ff4d6d">Force</text>
      <path d="M45,15 Q20,20 15,40" stroke="#00e5ff" strokeWidth="1.5" fill="none" markerEnd="url(#arr)"/>
      <text x="5" y="115" fontSize="8" fill="#94a3b8">IR + Flex</text>
      <text x="5" y="125" fontSize="8" fill="#94a3b8">to end range</text>
      <circle cx="55" cy="55" r="4" fill="#ff4d6d"/>
    </svg>
  ),
  hawkins: (
    <svg viewBox="0 0 120 140" width="100%" height="100">
      <rect x="45" y="0" width="20" height="45" rx="8" fill="#1a2d45" stroke="#00e5ff" strokeWidth="1.5"/>
      <ellipse cx="55" cy="50" rx="18" ry="18" fill="#131c28" stroke="#00e5ff" strokeWidth="1.5"/>
      <rect x="25" y="52" width="55" height="12" rx="6" fill="#1a2d45" stroke="#7f5af0" strokeWidth="1.5"/>
      <rect x="18" y="60" width="12" height="50" rx="6" fill="#1a2d45" stroke="#7f5af0" strokeWidth="1.5"/>
      <path d="M80,58 Q90,58 90,68 Q90,78 80,78" stroke="#ff4d6d" strokeWidth="2" fill="none"/>
      <text x="5" y="130" fontSize="8" fill="#94a3b8">90° flex → IR</text>
      <circle cx="55" cy="50" r="4" fill="#ff4d6d"/>
    </svg>
  ),
  empty_can: (
    <svg viewBox="0 0 120 140" width="100%" height="100">
      <rect x="45" y="0" width="18" height="42" rx="8" fill="#1a2d45" stroke="#00e5ff" strokeWidth="1.5"/>
      <ellipse cx="54" cy="47" rx="17" ry="17" fill="#131c28" stroke="#00e5ff" strokeWidth="1.5"/>
      <rect x="22" y="46" width="60" height="11" rx="5" fill="#1a2d45" stroke="#7f5af0" strokeWidth="1.5" transform="rotate(-30,54,47)"/>
      <rect x="15" y="63" width="11" height="50" rx="5" fill="#1a2d45" stroke="#7f5af0" strokeWidth="1.5" transform="rotate(-30,54,47)"/>
      <path d="M70,35 L85,28" stroke="#ff4d6d" strokeWidth="2.5" markerEnd="url(#arr)"/>
      <text x="5" y="125" fontSize="8" fill="#94a3b8">Scap plane 30°</text>
      <text x="5" y="135" fontSize="8" fill="#94a3b8">IR (thumb down)</text>
    </svg>
  ),
  lachman: (
    <svg viewBox="0 0 140 130" width="100%" height="100">
      <rect x="10" y="20" width="50" height="22" rx="8" fill="#1a2d45" stroke="#00e5ff" strokeWidth="1.5"/>
      <rect x="70" y="20" width="55" height="22" rx="8" fill="#1a2d45" stroke="#7f5af0" strokeWidth="1.5"/>
      <ellipse cx="65" cy="31" rx="14" ry="14" fill="#131c28" stroke="#ffb300" strokeWidth="1.5"/>
      <path d="M58,25 L72,38" stroke="#ff4d6d" strokeWidth="1.5"/>
      <path d="M90,65 L90,55" stroke="#00e5ff" strokeWidth="3" markerEnd="url(#arr)"/>
      <text x="92" y="62" fontSize="9" fill="#00e5ff">Ant</text>
      <path d="M30,65 L30,55" stroke="#ffb300" strokeWidth="3"/>
      <text x="10" y="62" fontSize="9" fill="#ffb300">Fix</text>
      <text x="20" y="115" fontSize="8" fill="#94a3b8">20-30° flex. Ant</text>
      <text x="20" y="125" fontSize="8" fill="#94a3b8">tibial translation</text>
      <rect x="20" y="75" width="100" height="18" rx="6" fill="#192435" stroke="#1a2d45"/>
      <text x="35" y="87" fontSize="8" fill="#94a3b8">Tibia</text>
      <rect x="20" y="95" width="100" height="18" rx="6" fill="#192435" stroke="#1a2d45"/>
      <text x="35" y="107" fontSize="8" fill="#94a3b8">Femur stabilised</text>
    </svg>
  ),
  slr: (
    <svg viewBox="0 0 140 130" width="100%" height="100">
      <rect x="5" y="55" width="130" height="20" rx="6" fill="#1a2d45" stroke="#1a2d45"/>
      <ellipse cx="20" cy="62" rx="14" ry="10" fill="#131c28" stroke="#00e5ff" strokeWidth="1.5"/>
      <rect x="28" y="48" width="18" height="55" rx="7" fill="#1a2d45" stroke="#00e5ff" strokeWidth="1.5" transform="rotate(-45,37,62)"/>
      <rect x="28" y="65" width="18" height="55" rx="7" fill="#1a2d45" stroke="#7f5af0" strokeWidth="1.5"/>
      <path d="M42,22 L42,10" stroke="#ff4d6d" strokeWidth="2" markerEnd="url(#arr)"/>
      <text x="48" y="20" fontSize="9" fill="#ff4d6d">Lift</text>
      <text x="5" y="120" fontSize="8" fill="#94a3b8">Knee extended</text>
      <text x="5" y="130" fontSize="8" fill="#94a3b8">Raise until resistance</text>
    </svg>
  ),
  spurling: (
    <svg viewBox="0 0 120 140" width="100%" height="100">
      <ellipse cx="60" cy="30" rx="22" ry="25" fill="#131c28" stroke="#00e5ff" strokeWidth="1.5"/>
      <rect x="50" y="53" width="20" height="30" rx="6" fill="#1a2d45" stroke="#7f5af0" strokeWidth="1.5"/>
      <path d="M30,15 Q25,30 35,45" stroke="#ff4d6d" strokeWidth="1.5" strokeDasharray="3,2" fill="none"/>
      <path d="M60,0 L60,12" stroke="#ff4d6d" strokeWidth="3" markerEnd="url(#arr)"/>
      <text x="65" y="10" fontSize="9" fill="#ff4d6d">↓ Compress</text>
      <path d="M60,25 Q75,25 75,35" stroke="#ffb300" strokeWidth="1.5" fill="none"/>
      <text x="5" y="120" fontSize="8" fill="#94a3b8">Compress + side</text>
      <text x="5" y="130" fontSize="8" fill="#94a3b8">flex + extension</text>
    </svg>
  ),
  mcmurray: (
    <svg viewBox="0 0 140 130" width="100%" height="100">
      <rect x="15" y="5" width="22" height="55" rx="9" fill="#1a2d45" stroke="#00e5ff" strokeWidth="1.5"/>
      <ellipse cx="26" cy="62" rx="16" ry="16" fill="#131c28" stroke="#ffb300" strokeWidth="1.5"/>
      <rect x="14" y="76" width="22" height="50" rx="9" fill="#1a2d45" stroke="#7f5af0" strokeWidth="1.5" transform="rotate(50,26,62)"/>
      <path d="M42,62 Q55,50 55,65 Q55,80 42,80" stroke="#ff4d6d" strokeWidth="2" fill="none"/>
      <text x="58" y="65" fontSize="9" fill="#ff4d6d">ER+</text>
      <text x="58" y="75" fontSize="9" fill="#ff4d6d">Valgus</text>
      <text x="5" y="120" fontSize="8" fill="#94a3b8">Full flex → extend</text>
      <text x="5" y="130" fontSize="8" fill="#94a3b8">ER=medial, IR=lateral</text>
    </svg>
  ),
  thomas_test: (
    <svg viewBox="0 0 140 130" width="100%" height="100">
      <rect x="5" y="60" width="130" height="20" rx="4" fill="#1a2d45" stroke="#1a2d45"/>
      <ellipse cx="20" cy="65" rx="14" ry="11" fill="#131c28" stroke="#00e5ff" strokeWidth="1.5"/>
      <rect x="28" y="55" width="18" height="22" rx="8" fill="#1a2d45" stroke="#00e5ff" strokeWidth="1.5" transform="rotate(-80,37,65)"/>
      <rect x="50" y="55" width="18" height="55" rx="8" fill="#1a2d45" stroke="#7f5af0" strokeWidth="1.5" transform="rotate(20,59,65)"/>
      <path d="M70,52 L82,45" stroke="#ff4d6d" strokeWidth="2"/>
      <text x="84" y="44" fontSize="9" fill="#ff4d6d">+ve</text>
      <text x="5" y="118" fontSize="8" fill="#94a3b8">Both hips flex → lower</text>
      <text x="5" y="128" fontSize="8" fill="#94a3b8">one leg → observe</text>
    </svg>
  ),
  slump: (
    <svg viewBox="0 0 120 140" width="100%" height="100">
      <ellipse cx="60" cy="20" rx="18" ry="18" fill="#131c28" stroke="#00e5ff" strokeWidth="1.5"/>
      <path d="M60,36 Q40,55 42,90" stroke="#7f5af0" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <rect x="30" y="90" width="60" height="15" rx="5" fill="#1a2d45" stroke="#1a2d45"/>
      <rect x="40" y="100" width="15" height="35" rx="6" fill="#1a2d45" stroke="#00e5ff" strokeWidth="1.5"/>
      <rect x="65" y="100" width="15" height="35" rx="6" fill="#1a2d45" stroke="#7f5af0" strokeWidth="1.5"/>
      <path d="M55,130 L55,118" stroke="#ff4d6d" strokeWidth="2"/>
      <text x="32" y="112" fontSize="8" fill="#ff4d6d">Knee ext</text>
      <text x="5" y="8" fontSize="8" fill="#94a3b8">Slump → neck flex</text>
      <text x="5" y="18" fontSize="8" fill="#94a3b8">→ knee extend → DF</text>
    </svg>
  ),
  trendelenburg: (
    <svg viewBox="0 0 120 140" width="100%" height="100">
      <ellipse cx="55" cy="18" rx="18" ry="18" fill="#131c28" stroke="#00e5ff" strokeWidth="1.5"/>
      <rect x="40" y="34" width="28" height="35" rx="8" fill="#1a2d45" stroke="#7f5af0" strokeWidth="1.5"/>
      <rect x="25" y="65" width="22" height="45" rx="8" fill="#1a2d45" stroke="#00e5ff" strokeWidth="1.5"/>
      <rect x="65" y="75" width="22" height="35" rx="8" fill="#1a2d45" stroke="#7f5af0" strokeWidth="1.5" transform="rotate(15,76,85)"/>
      <path d="M15,68 L95,78" stroke="#ff4d6d" strokeWidth="2" strokeDasharray="4,2"/>
      <text x="5" y="90" fontSize="9" fill="#ff4d6d">↘ Pelvis drops</text>
      <text x="5" y="128" fontSize="8" fill="#94a3b8">Single leg stance</text>
      <text x="5" y="138" fontSize="8" fill="#94a3b8">Watch pelvis level</text>
    </svg>
  ),
  apprehension: (
    <svg viewBox="0 0 120 140" width="100%" height="100">
      <rect x="42" y="0" width="22" height="45" rx="9" fill="#1a2d45" stroke="#00e5ff" strokeWidth="1.5"/>
      <ellipse cx="53" cy="50" rx="18" ry="18" fill="#131c28" stroke="#ffb300" strokeWidth="1.5"/>
      <rect x="30" y="52" width="55" height="13" rx="6" fill="#1a2d45" stroke="#7f5af0" strokeWidth="1.5" transform="rotate(-35,53,50)"/>
      <rect x="18" y="65" width="13" height="50" rx="6" fill="#1a2d45" stroke="#7f5af0" strokeWidth="1.5" transform="rotate(-35,53,50)"/>
      <path d="M45,42 L28,30" stroke="#ff4d6d" strokeWidth="2.5" markerEnd="url(#arr)"/>
      <text x="5" y="28" fontSize="8" fill="#ff4d6d">Ant pressure</text>
      <text x="5" y="128" fontSize="8" fill="#94a3b8">90° abd + ER</text>
      <text x="5" y="138" fontSize="8" fill="#94a3b8">Watch for fear</text>
    </svg>
  ),
  phalen: (
    <svg viewBox="0 0 140 120" width="100%" height="100">
      <rect x="10" y="30" width="50" height="18" rx="7" fill="#1a2d45" stroke="#00e5ff" strokeWidth="1.5"/>
      <rect x="55" y="18" width="18" height="50" rx="7" fill="#1a2d45" stroke="#7f5af0" strokeWidth="1.5" transform="rotate(90,64,40)"/>
      <rect x="72" y="30" width="50" height="18" rx="7" fill="#1a2d45" stroke="#00e5ff" strokeWidth="1.5" transform="rotate(180,97,39)"/>
      <path d="M60,55 Q70,70 80,55" stroke="#ff4d6d" strokeWidth="2" fill="none"/>
      <text x="30" y="90" fontSize="9" fill="#94a3b8">Both wrists fully</text>
      <text x="30" y="102" fontSize="9" fill="#94a3b8">flexed 60 seconds</text>
      <text x="30" y="114" fontSize="8" fill="#ff4d6d">+ve = tingling thumb/index</text>
    </svg>
  ),
  thompson: (
    <svg viewBox="0 0 140 130" width="100%" height="100">
      <rect x="5" y="5" width="130" height="20" rx="5" fill="#1a2d45" stroke="#1a2d45"/>
      <rect x="45" y="22" width="50" height="70" rx="12" fill="#1a2d45" stroke="#00e5ff" strokeWidth="1.5"/>
      <ellipse cx="70" cy="92" rx="22" ry="10" fill="#131c28" stroke="#7f5af0" strokeWidth="1.5"/>
      <path d="M35,55 Q40,55 40,65 Q40,70 35,70" stroke="#ff4d6d" strokeWidth="2.5" fill="none"/>
      <text x="5" y="65" fontSize="9" fill="#ff4d6d">Squeeze</text>
      <path d="M100,92 Q115,92 115,105" stroke="#00e5ff" strokeWidth="2" fill="none" strokeDasharray="3,2"/>
      <text x="90" y="118" fontSize="8" fill="#00e5ff">No PF</text>
      <text x="5" y="125" fontSize="8" fill="#94a3b8">Squeeze calf — no PF = rupture</text>
    </svg>
  ),
  windlass: (
    <svg viewBox="0 0 140 120" width="100%" height="100">
      <rect x="10" y="55" width="120" height="18" rx="5" fill="#1a2d45" stroke="#00e5ff" strokeWidth="1.5"/>
      <ellipse cx="20" cy="63" rx="14" ry="9" fill="#131c28" stroke="#7f5af0" strokeWidth="1.5"/>
      <rect x="28" y="55" width="70" height="12" rx="4" fill="#192435" stroke="#ffb300" strokeWidth="1"/>
      <path d="M95,55 Q105,45 110,35" stroke="#ff4d6d" strokeWidth="2.5" fill="none"/>
      <circle cx="110" cy="32" r="8" fill="#131c28" stroke="#ff4d6d" strokeWidth="1.5"/>
      <text x="5" y="102" fontSize="8" fill="#94a3b8">Great toe extension</text>
      <text x="5" y="112" fontSize="8" fill="#ff4d6d">+ve = plantar fascia pain</text>
    </svg>
  ),
  ober: (
    <svg viewBox="0 0 140 130" width="100%" height="100">
      <rect x="5" y="55" width="130" height="20" rx="5" fill="#1a2d45" stroke="#1a2d45"/>
      <ellipse cx="22" cy="62" rx="16" ry="12" fill="#131c28" stroke="#00e5ff" strokeWidth="1.5"/>
      <rect x="32" y="48" width="20" height="60" rx="8" fill="#1a2d45" stroke="#7f5af0" strokeWidth="1.5" transform="rotate(20,42,62)"/>
      <rect x="52" y="48" width="20" height="60" rx="8" fill="#1a2d45" stroke="#00e5ff" strokeWidth="1.5" transform="rotate(-10,62,62)"/>
      <path d="M62,30 L62,18" stroke="#ff4d6d" strokeWidth="2" markerEnd="url(#arr)"/>
      <text x="66" y="25" fontSize="9" fill="#ff4d6d">Adduct</text>
      <path d="M62,30 Q80,30 80,50" stroke="#ffb300" strokeWidth="1.5" strokeDasharray="3,2" fill="none"/>
      <text x="5" y="125" fontSize="8" fill="#94a3b8">Sidelying: abduct then adduct</text>
      <text x="5" y="135" fontSize="8" fill="#ff4d6d">+ve = leg stays elevated</text>
    </svg>
  ),
  fadir: (
    <svg viewBox="0 0 140 130" width="100%" height="100">
      <rect x="5" y="60" width="130" height="20" rx="6" fill="#1a2d45" stroke="#1a2d45"/>
      <ellipse cx="20" cy="67" rx="14" ry="11" fill="#131c28" stroke="#00e5ff" strokeWidth="1.5"/>
      <rect x="28" y="42" width="20" height="55" rx="8" fill="#1a2d45" stroke="#7f5af0" strokeWidth="1.5" transform="rotate(-50,38,67)"/>
      <rect x="15" y="58" width="20" height="45" rx="8" fill="#1a2d45" stroke="#00e5ff" strokeWidth="1.5" transform="rotate(-80,25,67)"/>
      <text x="65" y="45" fontSize="8" fill="#ff4d6d">Flex+Add+IR</text>
      <path d="M55,50 L65,40" stroke="#ff4d6d" strokeWidth="2"/>
      <text x="5" y="120" fontSize="8" fill="#94a3b8">Hip: 90° flex → adduct → IR</text>
      <text x="5" y="130" fontSize="8" fill="#ff4d6d">+ve = groin pain (FAI/labrum)</text>
    </svg>
  ),
  faber: (
    <svg viewBox="0 0 140 130" width="100%" height="100">
      <rect x="5" y="60" width="130" height="20" rx="6" fill="#1a2d45" stroke="#1a2d45"/>
      <ellipse cx="20" cy="67" rx="14" ry="11" fill="#131c28" stroke="#00e5ff" strokeWidth="1.5"/>
      <rect x="28" y="50" width="18" height="50" rx="8" fill="#1a2d45" stroke="#7f5af0" strokeWidth="1.5" transform="rotate(-45,37,67)"/>
      <rect x="18" y="65" width="18" height="45" rx="8" fill="#1a2d45" stroke="#00e5ff" strokeWidth="1.5" transform="rotate(-80,27,67)"/>
      <path d="M30,40 Q50,35 60,45" stroke="#ffb300" strokeWidth="1.5" fill="none"/>
      <text x="60" y="42" fontSize="9" fill="#ffb300">Fig-4</text>
      <text x="5" y="120" fontSize="8" fill="#94a3b8">Figure-4: foot on opp knee</text>
      <text x="5" y="130" fontSize="8" fill="#ff4d6d">+ve = SI or hip pain</text>
    </svg>
  ),
};

// ─── COMPLETE SPECIAL TESTS DATABASE 100+ ────────────────────────────────────
const SPECIAL_TESTS_DATA = {

  cervical:{
    label:"Cervical Spine", color:"#00e5ff", icon:"🔵",
    tests:[
      { id:"st_spurling", label:"Spurling's Test", structure:"Cervical nerve root / foramen",
        sensitivity:"30–40%", specificity:"92–93%",
        positive:"Reproduces ipsilateral radicular arm pain / tingling",
        negative:"No arm symptoms",
        how:"Patient seated, head in neutral. Therapist places hands on crown. Apply DOWNWARD axial compression combined with ipsilateral side flexion and slight extension (quadrant position). Hold 10 seconds. Positive if arm symptoms reproduced.",
        options:["Negative","Positive — left (radiculopathy)","Positive — right (radiculopathy)","Bilateral positive"],
      },
      { id:"st_distraction", label:"Cervical Distraction Test", structure:"Cervical nerve root / disc",
        sensitivity:"40–44%", specificity:"90–100%",
        positive:"Arm symptoms reduce or resolve with traction",
        negative:"No change or worsening",
        how:"Patient supine. Therapist cradles occiput with both hands. Apply gentle UPWARD traction (distraction) — 10–15kg. Positive if radicular symptoms reduce or resolve (indicates neural compression relieved by opening foramen).",
        options:["Negative","Positive — symptom relief (nerve root compression)","Positive — relief only partial"],
      },
      { id:"st_sharp_purser", label:"Sharp-Purser Test", structure:"C1/C2 — atlantoaxial instability",
        sensitivity:"69%", specificity:"96%",
        positive:"URGENT — click or symptom change indicates instability",
        negative:"No movement or symptoms",
        how:"⚠️ PERFORM WITH CAUTION. Patient seated, head in flexion. Therapist places palm on forehead, thumb on C2 spinous process. Apply POSTERIOR translation of head on C2. Positive if clunk or reduction in symptoms. POSITIVE = refer immediately. Do NOT manipulate this patient.",
        options:["Negative","Positive — clunk present (C1/C2 instability — REFER URGENT)","Inconclusive"],
      },
      { id:"st_vbi", label:"VBI / 3-Part Test", structure:"Vertebral artery patency",
        sensitivity:"Variable", specificity:"Variable",
        positive:"5Ds/3Ns = STOP and refer",
        negative:"No symptoms in any position",
        how:"Patient seated. Test 3 positions held 30 seconds each: (1) Sustained rotation left, (2) Extension + rotation left, (3) Extension + rotation right. Watch for 5Ds: Dizziness, Diplopia, Dysarthria, Dysphagia, Drop attack. And 3Ns: Nausea, Nystagmus, Numbness of face. POSITIVE = stop all cervical treatment and refer.",
        options:["Negative — all 3 positions clear","Positive — 5D/3N present (REFER — no cervical manipulation)","Positive — dizziness only (monitor)","Inconclusive"],
      },
      { id:"st_alar", label:"Alar Ligament Test", structure:"Alar ligament / C1-C2 stability",
        sensitivity:"50%", specificity:"75%",
        positive:"C2 rotates with head rotation (ligament lax)",
        negative:"C2 fixed during head rotation",
        how:"Patient seated, head neutral. Therapist palpates C2 spinous process bilaterally. Ask patient to side-flex head. NORMAL: C2 should immediately move toward the side of side-flexion (tight alar ligament moves it). POSITIVE (LAXITY): C2 does not move, or head can side-flex extensively without C2 movement.",
        options:["Negative — normal C2 movement","Positive left — alar laxity (left)","Positive right — alar laxity (right)","Bilateral — bilateral alar laxity"],
      },
      { id:"st_flex_rot", label:"Flexion-Rotation Test (FRT)", structure:"C1-C2 rotation",
        sensitivity:"91%", specificity:"90%",
        positive:"< 32° rotation = C1/C2 restriction (cervicogenic headache)",
        negative:"> 40° each side — normal",
        how:"Patient supine. Therapist fully flexes cervical spine to end range (chin toward chest). With full flexion maintained (locks C2 down), SLOWLY rotate head fully to each side. Measure rotation with goniometer. Normal: 40–45° each side. Positive (< 32°) = C1/C2 hypomobility = cervicogenic headache source.",
        options:["Normal — bilateral > 40°","Positive left < 32° (C1/C2 restriction — left)","Positive right < 32° (C1/C2 restriction — right)","Bilateral restriction"],
      },
      { id:"st_jackson", label:"Jackson's Compression Test", structure:"Cervical facet / nerve root",
        sensitivity:"30%", specificity:"95%",
        positive:"Local or referred pain",
        negative:"No symptoms",
        how:"Patient seated, head in neutral. Therapist places clasped hands on crown. Apply DOWNWARD axial compression. Unlike Spurling's, no side-flexion added. Positive if local cervical pain (facet) or referred pain (nerve root) reproduced.",
        options:["Negative","Positive — local neck pain (facet)","Positive — radicular symptoms","Positive — both"],
      },
      { id:"st_cervical_rotation_lt", label:"Cervical Rotation Lateral Flexion (CRLF)", structure:"First rib elevation",
        sensitivity:"72%", specificity:"95%",
        positive:"Resistance during lateral flexion from rotation = first rib elevated",
        negative:"Free lateral flexion from rotation",
        how:"Patient seated. Passively ROTATE head fully to one side. Then, maintaining that rotation, attempt LATERAL FLEXION toward ipsilateral shoulder. Normal: neck laterally flexes freely. Positive: lateral flexion blocked = first rib elevated (thoracic outlet / scalene restriction).",
        options:["Negative bilateral","Positive left (L first rib elevated)","Positive right (R first rib elevated)"],
      },
      { id:"st_axial_loading", label:"Axial Loading Test", structure:"Cervical disc / facet",
        sensitivity:"Low", specificity:"Moderate",
        positive:"Pain reproduction with compression",
        negative:"No pain",
        how:"Patient seated. Therapist places hands on crown and applies DOWNWARD pressure with both hands (straight compression only — no rotation or side-flex). Positive if local cervical pain reproduced. Differentiates compressive vs non-compressive pain sources.",
        options:["Negative","Positive — local pain reproduced","Positive — radicular symptoms"],
      },
    ]
  },

  shoulder:{
    label:"Shoulder", color:"#7f5af0", icon:"🟣",
    tests:[
      { id:"st_neer", label:"Neer's Test", structure:"Supraspinatus / subacromial impingement",
        sensitivity:"72%", specificity:"66%",
        positive:"Anterior shoulder pain at end range",
        negative:"No pain",
        how:"Stabilise scapula with one hand (prevent elevation). With other hand, PASSIVELY FLEX the arm forward with shoulder INTERNALLY ROTATED (thumb down) to end range. Positive = anterior-superior shoulder pain reproduced. Simulates pinching of supraspinatus under anterior acromion.",
        options:["Negative","Positive — anterior shoulder pain (impingement)","Equivocal"],
      },
      { id:"st_hawkins", label:"Hawkins-Kennedy Test", structure:"Supraspinatus / subacromial",
        sensitivity:"79%", specificity:"59%",
        positive:"Subacromial pain with IR",
        negative:"No pain",
        how:"Flex shoulder to 90°, elbow 90°. Apply INTERNAL ROTATION (forearm toward floor). Positive = pain at anterior-superior shoulder (impinges supraspinatus under coracoacromial arch). Most sensitive impingement test.",
        options:["Negative","Positive — subacromial pain","Equivocal"],
      },
      { id:"st_empty_can", label:"Empty Can / Jobe Test", structure:"Supraspinatus integrity",
        sensitivity:"69%", specificity:"66%",
        positive:"Pain = tendinopathy. Weakness = tear",
        negative:"Strong and painless",
        how:"Arm abducted 90° in SCAPULAR PLANE (30° horizontal adduction). Fully INTERNALLY ROTATE (thumb pointing down — 'emptying a can'). Apply downward resistance. Positive = pain (tendinopathy) OR weakness (tear).",
        options:["Negative — strong and painless","Positive — painful (tendinopathy)","Positive — weak (partial/complete tear)","Positive — weak AND painful (serious lesion)"],
      },
      { id:"st_full_can", label:"Full Can Test", structure:"Supraspinatus — less impingement position",
        sensitivity:"66%", specificity:"64%",
        positive:"Pain or weakness in full can position",
        negative:"Strong and painless",
        how:"Same position as empty can BUT forearm EXTERNALLY ROTATED (thumb up — 'full can'). Apply downward resistance. Less likely to impinge bursa — more specific for supraspinatus muscle/tendon pathology. Compare to empty can.",
        options:["Negative","Positive — painful","Positive — weak","Both painful and weak"],
      },
      { id:"st_lift_off", label:"Lift-Off Test (Gerber)", structure:"Subscapularis integrity",
        sensitivity:"62%", specificity:"97%",
        positive:"Cannot lift hand off back",
        negative:"Strong lift-off maintained",
        how:"Patient places back of hand on lower back (posterior to iliac crest). Ask to LIFT hand away from back — resist at mid-range. Positive = cannot lift OR must substitute with elbow extension. Tests subscapularis — primary internal rotator.",
        options:["Negative — strong lift-off","Positive — cannot lift (subscapularis tear)","Positive — weakness (partial tear)"],
      },
      { id:"st_belly_press", label:"Belly Press Test", structure:"Subscapularis",
        sensitivity:"58%", specificity:"92%",
        positive:"Elbow drops or wrist flexes during press",
        negative:"Elbow maintained forward during press",
        how:"Patient places hand flat on abdomen (elbow forward of torso). Press hand INTO abdomen WITHOUT allowing wrist to flex. Positive = wrist flexes (cannot maintain IR — subscapularis deficit) or elbow drops behind torso.",
        options:["Negative — normal","Positive — wrist flexes (subscapularis deficit)","Positive — elbow drops"],
      },
      { id:"st_bear_hug", label:"Bear Hug Test", structure:"Subscapularis — upper fibres",
        sensitivity:"60%", specificity:"92%",
        positive:"Weakness during bear hug IR",
        negative:"Strong resistance",
        how:"Patient places palm of affected arm on OPPOSITE shoulder (fingers pointing toward neck). Therapist attempts to lift elbow upward/outward. Patient resists. Tests subscapularis in mid-range internal rotation position. Positive = cannot maintain resistance (subscapularis tear).",
        options:["Negative","Positive — weakness (upper subscapularis)"],
      },
      { id:"st_er_lag", label:"External Rotation Lag Sign", structure:"Infraspinatus / supraspinatus (massive tear)",
        sensitivity:"High for massive tears", specificity:"98%",
        positive:"Arm falls into IR (lag present)",
        negative:"Arm held in ER position",
        how:"Patient seated, elbow 90°. Therapist passively positions shoulder near maximum ER. Ask patient to HOLD that position as therapist releases. Positive = arm falls into internal rotation (lag) — indicates inability to actively maintain ER = posterior cuff tear.",
        options:["Negative — arm held in ER","Positive — small lag (< 10°)","Positive — significant lag (> 10°)","Positive — full lag (massive RC tear)"],
      },
      { id:"st_hornblower", label:"Hornblower's Sign", structure:"Teres minor",
        sensitivity:"100% for teres minor tear", specificity:"93%",
        positive:"Cannot externally rotate at 90° abduction",
        negative:"Normal ER at 90° abduction",
        how:"Patient abducts shoulder to 90°, elbow 90°. Ask to EXTERNALLY ROTATE against gravity (bring hand toward ceiling) from this position. Positive = cannot externally rotate at 90° abduction. Highly specific for teres minor tear.",
        options:["Negative","Positive — teres minor tear suspected"],
      },
      { id:"st_obrien", label:"O'Brien's Test (Active Compression)", structure:"SLAP lesion / AC joint",
        sensitivity:"63–100%", specificity:"73–99%",
        positive:"Pain in adduction = SLAP. Pain at top = AC joint",
        negative:"No pain in either position",
        how:"Shoulder 90° flexion, 10° horizontal adduction, FULL INTERNAL ROTATION (thumb down). Apply downward force. Note pain. Then REPEAT with shoulder in EXTERNAL ROTATION (thumb up). SLAP positive = pain with IR that reduces with ER (pain deep in shoulder). AC positive = pain at top of shoulder with IR that also reduces with ER.",
        options:["Negative","Positive — SLAP (deep pain with IR, resolves with ER)","Positive — AC joint (top of shoulder)","Both positive"],
      },
      { id:"st_speeds", label:"Speed's Test", structure:"Biceps long head / SLAP",
        sensitivity:"54%", specificity:"81%",
        positive:"Bicipital groove pain with resisted flexion",
        negative:"No pain",
        how:"Shoulder flexed ~60°, elbow EXTENDED, forearm SUPINATED. Apply downward resistance to distal forearm. Positive = pain at BICIPITAL GROOVE. Less specific test — combine with O'Brien's for SLAP confirmation.",
        options:["Negative","Positive — bicipital groove pain (biceps LH tendinopathy / SLAP)"],
      },
      { id:"st_yergason", label:"Yergason's Test", structure:"Biceps tendon stability in groove",
        sensitivity:"43%", specificity:"79%",
        positive:"Pain at bicipital groove with resisted supination",
        negative:"No pain",
        how:"Elbow 90° at side. Apply resistance as patient attempts SUPINATION + ELBOW FLEXION. Positive = pain at bicipital groove (biceps tendinopathy or biceps LH instability). Can also palp groove simultaneously.",
        options:["Negative","Positive — bicipital groove pain","Positive — tendon subluxes from groove"],
      },
      { id:"st_apprehension", label:"Apprehension Test", structure:"Anterior GH instability",
        sensitivity:"53%", specificity:"99%",
        positive:"Apprehension / fear of dislocation (NOT just pain)",
        negative:"No apprehension in this position",
        how:"Patient supine or seated. Abduct to 90°, externally rotate to near end range. Apply ANTERIOR PRESSURE on posterior humeral head. Positive = patient shows APPREHENSION (guarding, fear, tries to escape) — not just pain. Fear response is the key finding.",
        options:["Negative","Positive — apprehension present","Positive — pain only (not apprehension)","Positive — guarding + pain"],
      },
      { id:"st_relocation", label:"Relocation Test", structure:"Anterior GH instability confirmation",
        sensitivity:"57%", specificity:"87%",
        positive:"Apprehension relieves with posterior humeral pressure",
        negative:"No change in symptoms",
        how:"Performed AFTER apprehension test. While arm in same position (90° abd, ER), apply POSTERIOR pressure on anterior humeral head (relocating it). Positive = apprehension or pain RELIEVES. This confirms anterior instability.",
        options:["Negative","Positive — apprehension relieves (confirms anterior instability)"],
      },
      { id:"st_sulcus", label:"Sulcus Sign", structure:"Inferior GH instability / IGHL",
        sensitivity:"72%", specificity:"85%",
        positive:"Sulcus visible below acromion > 1cm",
        negative:"No visible sulcus",
        how:"Patient seated, arm relaxed at side. Apply DOWNWARD traction on arm (axial traction). Observe for SULCUS (groove) below acromion. Measure in cm. Grade 1: < 1cm. Grade 2: 1–2cm. Grade 3: > 2cm.",
        options:["Negative (< 0.5cm)","Grade 1 (< 1cm — mild laxity)","Grade 2 (1–2cm — moderate instability)","Grade 3 (> 2cm — severe inferior instability)"],
      },
      { id:"st_acromioclavicular", label:"AC Joint Paxinos Test", structure:"Acromioclavicular joint",
        sensitivity:"79%", specificity:"50%",
        positive:"AC joint pain with compression",
        negative:"No AC pain",
        how:"Thumb under acromion, fingers over clavicle. Apply SUPERIOR force with thumb while pressing DOWN with fingers (approximates AC joint). Positive = reproduces AC joint pain.",
        options:["Negative","Positive — AC joint pain (OA/injury)"],
      },
      { id:"st_cross_arm", label:"Cross-Arm Adduction Test", structure:"Acromioclavicular joint",
        sensitivity:"77%", specificity:"79%",
        positive:"AC joint pain with horizontal adduction",
        negative:"No AC pain",
        how:"Flex shoulder 90°. Adduct ACROSS body horizontally (horizontal adduction to end range). Positive = pain at TOP of shoulder (AC joint). Passive overpressure at end range increases sensitivity.",
        options:["Negative","Positive — AC joint pain"],
      },
      { id:"st_scapular_dyskinesis", label:"Scapular Dyskinesis Test", structure:"Scapular stabilisers",
        sensitivity:"80%", specificity:"65%",
        positive:"Visible winging or altered rhythm",
        negative:"Normal smooth scapular movement",
        how:"Observe scapulae during BILATERAL shoulder flexion and abduction (3 repetitions each). Also observe during arm lowering. Look for: (1) Medial border winging (serratus inhibited), (2) Inferior angle prominence (lower trap inhibited), (3) Early elevation (upper trap dominant), (4) Asymmetry left vs right. Use Kibler's classification: Type I (inferior angle), II (medial border), III (superior border).",
        options:["None — normal scapulohumeral rhythm","Type I — inferior angle prominence","Type II — medial border winging","Type III — superior border elevation / early shrug","Combined types"],
      },
      { id:"st_kibler_slide", label:"Lateral Scapular Slide Test", structure:"Scapular position symmetry",
        sensitivity:"76%", specificity:"78%",
        positive:"Side-to-side difference > 1.5cm",
        negative:"< 1cm difference bilateral",
        how:"Patient standing. Measure distance from inferior angle of scapula to nearest thoracic spinous process in: (1) Arms at side, (2) Hands on hips, (3) Arms at 90° abduction. Compare bilateral distances. > 1.5cm asymmetry = significant scapular asymmetry.",
        options:["Normal (< 1cm asymmetry)","Mild asymmetry (1–1.5cm)","Significant asymmetry (> 1.5cm)"],
      },
    ]
  },

  elbow_wrist:{
    label:"Elbow & Wrist", color:"#ff9a9e", icon:"🩷",
    tests:[
      { id:"st_cozens", label:"Cozen's Test", structure:"Lateral epicondyle — ECRB",
        sensitivity:"84%", specificity:"75%",
        positive:"Lateral epicondyle pain with resisted wrist ext",
        negative:"No pain",
        how:"Palpate lateral epicondyle. Patient makes a fist and EXTENDS wrist against resistance (therapist resists). Positive = sharp pain at lateral epicondyle. Most sensitive test for lateral epicondylalgia.",
        options:["Negative","Positive — lateral epicondyle pain (lateral epicondylalgia)"],
      },
      { id:"st_mills", label:"Mill's Test", structure:"Lateral epicondyle — ECRB (passive)",
        sensitivity:"53%", specificity:"85%",
        positive:"Lateral epicondyle pain with passive stretch",
        negative:"No pain",
        how:"Pronate forearm, flex wrist fully, then EXTEND elbow from this position (stretching ECRB). Positive = lateral epicondyle pain. Combines passive stretch with neural tension — if neurological = pain also in forearm.",
        options:["Negative","Positive — lateral epicondyle pain (ECRB)","Positive + forearm pain (neural component)"],
      },
      { id:"st_golfers", label:"Golfer's Elbow Test", structure:"Medial epicondyle — FCR/FCU",
        sensitivity:"75%", specificity:"78%",
        positive:"Medial epicondyle pain with resisted wrist flexion",
        negative:"No pain",
        how:"Palpate medial epicondyle. Resist WRIST FLEXION with forearm supinated. Positive = medial epicondyle pain (medial epicondylalgia / golfer's elbow). Provocative: add forearm supination simultaneously.",
        options:["Negative","Positive — medial epicondyle pain (medial epicondylalgia)"],
      },
      { id:"st_valgus_stress_elbow", label:"Elbow Valgus Stress Test", structure:"MCL (UCL) of elbow",
        sensitivity:"65%", specificity:"50%",
        positive:"Medial elbow pain with valgus stress",
        negative:"No pain or laxity",
        how:"Elbow 30° flexion. Apply VALGUS force (push forearm laterally while stabilising humerus). Feel for laxity or pain at medial elbow. Compare to contralateral side. 'Milking manoeuvre' variation: patient grabs thumb and applies valgus with flexing elbow — Positive = medial elbow pain.",
        options:["Negative","Positive — medial pain (MCL sprain)","Positive — laxity (MCL rupture)"],
      },
      { id:"st_tinel_elbow", label:"Tinel's Sign at Elbow", structure:"Ulnar nerve at cubital tunnel",
        sensitivity:"70%", specificity:"98%",
        positive:"Tingling in ring/little finger distribution",
        negative:"No distal symptoms",
        how:"Percuss (tap) ulnar nerve at CUBITAL TUNNEL (medial elbow, between medial epicondyle and olecranon). Positive = tingling in ulnar distribution (ring and little finger, medial forearm). Compare with carpal tunnel Tinel's — elbow Tinel = cubital tunnel syndrome.",
        options:["Negative","Positive — ulnar tingling (cubital tunnel syndrome)"],
      },
      { id:"st_phalen", label:"Phalen's Test", structure:"Median nerve — carpal tunnel",
        sensitivity:"68%", specificity:"73%",
        positive:"Thumb/index/middle finger tingling < 60 seconds",
        negative:"No symptoms in 60 seconds",
        how:"Patient holds both wrists in FULL FLEXION (dorsa of hands pressed together) for 60 seconds. Positive = tingling/numbness in MEDIAN nerve distribution (thumb, index, middle, and radial half of ring finger). Earlier onset = more severe carpal tunnel.",
        options:["Negative (> 60 seconds)","Positive < 30 seconds (severe CTS)","Positive 30–60 seconds (moderate CTS)","Bilateral positive"],
      },
      { id:"st_tinel_wrist", label:"Tinel's Sign at Wrist", structure:"Median nerve — carpal tunnel",
        sensitivity:"60%", specificity:"67%",
        positive:"Tingling in median distribution with percussion",
        negative:"No symptoms",
        how:"Percuss (tap) over CARPAL TUNNEL (volar wrist crease, palmaris longus tendon). Positive = tingling in thumb, index, middle, half ring finger (median distribution).",
        options:["Negative","Positive — carpal tunnel syndrome"],
      },
      { id:"st_finkelstein", label:"Finkelstein's Test", structure:"APL + EPB — De Quervain's",
        sensitivity:"High", specificity:"Moderate",
        positive:"Sharp pain at radial styloid/1st dorsal compartment",
        negative:"No pain",
        how:"Patient makes fist OVER thumb (Eichoff manoeuvre). Then therapist ulnar deviates wrist passively. Positive = sharp pain at RADIAL STYLOID / first dorsal compartment (De Quervain's tenosynovitis). Compare to contralateral side — all wrists may be slightly uncomfortable.",
        options:["Negative","Positive — radial styloid pain (De Quervain's tenosynovitis)"],
      },
      { id:"st_watson", label:"Watson Scaphoid Shift Test", structure:"Scapholunate ligament",
        sensitivity:"69%", specificity:"66%",
        positive:"Clunk or dorsal wrist pain with shift",
        negative:"No shift, no pain",
        how:"Grasp wrist with thumb on SCAPHOID TUBERCLE (volar wrist). Apply pressure on scaphoid while RADIALLY DEVIATING wrist (moving from ulnar to radial deviation). Positive = clunk or pain as scaphoid subluxes over dorsal rim of radius — indicates scapholunate ligament injury.",
        options:["Negative","Positive — clunk (SL instability)","Positive — dorsal wrist pain only"],
      },
      { id:"st_grind", label:"Grind Test", structure:"1st CMC joint (thumb base)",
        sensitivity:"High for CMC OA", specificity:"Moderate",
        positive:"Base of thumb pain and crepitus with grind",
        negative:"No pain",
        how:"Grasp patient's thumb metacarpal. Apply AXIAL COMPRESSION and ROTATION simultaneously (grinding). Positive = pain and/or crepitus at base of thumb (1st CMC joint OA).",
        options:["Negative","Positive — CMC OA (pain +/- crepitus)"],
      },
    ]
  },

  lumbar:{
    label:"Lumbar Spine", color:"#ff6b35", icon:"🟠",
    tests:[
      { id:"st_slr_test", label:"Straight Leg Raise (SLR)", structure:"L4–S1 nerve roots / disc",
        sensitivity:"80%", specificity:"40%",
        positive:"Radicular pain 30–70°. Bragard increases sensitivity",
        negative:"No radicular symptoms",
        how:"Patient SUPINE, knee extended. Passively RAISE leg. Note angle at first resistance. Add ANKLE DORSIFLEXION (Bragard's test) to sensitise. Positive = radicular leg pain (not back pain) at 30–70°. Crossed SLR (raising opposite leg produces ipsilateral symptoms) is highly specific for disc herniation (90% specificity).",
        options:["Negative","Positive 30–60° (highly specific for disc herniation)","Positive 60–90° (mild — less specific)","Positive + Bragard (neural tension confirmed)","Crossed SLR positive (disc herniation)"],
      },
      { id:"st_prone_instab", label:"Prone Instability Test", structure:"Lumbar segmental instability",
        sensitivity:"72%", specificity:"58%",
        positive:"Pain reduces when muscles activated",
        negative:"Pain unchanged with muscle activation",
        how:"Patient PRONE, feet on floor (hip extended). Apply POSTERIOR-ANTERIOR pressure on lumbar spinous processes. Note pain. Then ask patient to LIFT FEET (activating spinal stabilisers). Re-apply same PA pressure. POSITIVE = pain reduces or resolves with feet raised. Indicates segmental instability at that level.",
        options:["Negative — pain unchanged with muscle activation","Positive — pain reduces with muscle activation (segmental instability)"],
      },
      { id:"st_stork", label:"Stork Test (Single Leg Extension)", structure:"Spondylolysis / pars stress",
        sensitivity:"50%", specificity:"70%",
        positive:"Ipsilateral low back pain on extension loading",
        negative:"No pain",
        how:"Patient stands on ONE leg. EXTEND lumbar spine while balancing (Stork position). Positive = ipsilateral low back pain at the lumbar level. Young athletes with LBP — highly suspicious for SPONDYLOLYSIS (pars interarticularis stress fracture). Also test with hands on hips and extend.",
        options:["Negative","Positive — ipsilateral LBP (spondylolysis suspected)","Positive — bilateral LBP (bilateral pars)"],
      },
      { id:"st_kemp", label:"Kemp's Test (Lumbar Quadrant)", structure:"Lumbar facet joints",
        sensitivity:"Low", specificity:"High for facet",
        positive:"Local ipsilateral LBP with quadrant loading",
        negative:"No pain",
        how:"Patient seated or standing. EXTEND lumbar spine, then add IPSILATERAL ROTATION and SIDE FLEXION simultaneously (closing down ipsilateral facet joint). Positive = local ipsilateral low back pain (not radicular) = facet joint pathology. If radicular = disc or foramen contributing.",
        options:["Negative","Positive — local LBP (facet joint)","Positive — radicular symptoms (foramen/nerve)"],
      },
      { id:"st_adams", label:"Adam's Forward Bend Test", structure:"Scoliosis screen",
        sensitivity:"84%", specificity:"93%",
        positive:"Rib hump or paraspinal prominence visible",
        negative:"Symmetric forward bend",
        how:"Patient bends FORWARD 90°, arms hanging, feet together. Observe from BEHIND at eye level (spine horizontal). Look for ASYMMETRY: rib hump (thoracic rotation) or paraspinal prominence (lumbar). Measure with SCOLIOMETER if available (> 5° = referral threshold).",
        options:["Negative — symmetric","Positive — thoracic rib hump (structural scoliosis)","Positive — lumbar prominence (lumbar scoliosis)","Both levels — S-curve scoliosis"],
      },
      { id:"st_si_distraction", label:"SI Distraction Test", structure:"SIJ posterior ligaments",
        sensitivity:"60%", specificity:"81%",
        positive:"SI joint or buttock pain",
        negative:"No SI symptoms",
        how:"Patient SUPINE. Apply bilateral OUTWARD force on ASIS (distract pelvis). Hold 30 seconds. Positive = SI joint or buttock pain (posterior SI ligaments stressed by anteroposterior gapping).",
        options:["Negative","Positive — left SI pain","Positive — right SI pain","Bilateral positive"],
      },
      { id:"st_si_compression", label:"SI Compression Test", structure:"SIJ anterior ligaments",
        sensitivity:"69%", specificity:"69%",
        positive:"SI joint pain with compression",
        negative:"No SI symptoms",
        how:"Patient in SIDE LYING. Apply DOWNWARD COMPRESSION over iliac crest (compresses SI joint from above). Positive = SI joint pain. Combine with distraction and other SI tests — 3+ positive = 91% specific for SIJ.",
        options:["Negative","Positive — SI joint pain"],
      },
      { id:"st_gaenslen", label:"Gaenslen's Test", structure:"SIJ — extension loading",
        sensitivity:"53%", specificity:"71%",
        positive:"SI joint pain with hip extension stress",
        negative:"No SI pain",
        how:"Patient SUPINE at edge of table. Flex contralateral hip to chest (patient holds). Allow TEST leg to DROP into extension (hang off table edge). Positive = ipsilateral SI joint pain (extension stress on SIJ). Can also perform in sidelying.",
        options:["Negative","Positive — left SIJ","Positive — right SIJ"],
      },
      { id:"st_thigh_thrust", label:"Thigh Thrust Test", structure:"Posterior SIJ",
        sensitivity:"88%", specificity:"69%",
        positive:"Ipsilateral posterior pelvic pain",
        negative:"No SIJ symptoms",
        how:"Patient SUPINE. Hip flexed 90°. Therapist applies POSTERIOR force through FEMUR (along shaft toward table). Positive = posterior pelvic pain (SIJ shear stress). The highest sensitivity single SIJ test.",
        options:["Negative","Positive — posterior pelvic pain (SIJ)"],
      },
      { id:"st_lateral_shift", label:"Lateral Shift Correction Test", structure:"Lumbar disc — directional preference",
        sensitivity:"Moderate", specificity:"Moderate",
        positive:"Shift corrects or symptoms change",
        negative:"No change",
        how:"Patient standing with visible lateral shift. Therapist stands on CONVEX side of shift. Place shoulder against patient's thorax and pelvis on opposite side. Gradually CORRECT shift over multiple sessions. POSITIVE (useful test) = correction eases symptoms (confirms disc herniation protective pattern). McKenzie direction of preference established.",
        options:["Shift corrects easily — centralises symptoms","Shift corrects partially — some symptom change","Shift does not correct — consider structural cause","Shift worsens symptoms — STOP (wrong direction)"],
      },
    ]
  },

  hip:{
    label:"Hip", color:"#00c97a", icon:"🟢",
    tests:[
      { id:"st_faber_test", label:"FABER / Patrick's Test", structure:"SIJ / hip joint",
        sensitivity:"77%", specificity:"75%",
        positive:"Groin pain = hip. Posterior pelvic pain = SIJ",
        negative:"No pain, full range",
        how:"Patient SUPINE. Place ankle of test side on opposite KNEE (figure-4 position). Allow knee to FALL toward table under gravity. Positive = GROIN PAIN (hip joint/capsule) or POSTERIOR PELVIC PAIN (SIJ). Compare height of knee to contralateral side. Restriction = hip capsule or hip flexor tightness.",
        options:["Negative — knee drops symmetrically","Positive — groin pain (hip pathology)","Positive — posterior pelvic pain (SIJ)","Restricted range — hip capsular limitation"],
      },
      { id:"st_fadir_test", label:"FADIR Test", structure:"Hip impingement / labrum",
        sensitivity:"78%", specificity:"51%",
        positive:"Anterior groin pain (impingement / labral)",
        negative:"No symptoms",
        how:"Patient SUPINE. Bring hip to 90° FLEXION, then passively ADDUCT and INTERNALLY ROTATE (FADIR position). Positive = anterior GROIN PAIN (femoroacetabular impingement or labral tear). Most sensitive test for hip impingement — high sensitivity but moderate specificity.",
        options:["Negative","Positive — anterior groin pain (FAI / labral tear)","Positive — lateral hip pain (different pathology)"],
      },
      { id:"st_hip_scour", label:"Hip Scour Test", structure:"Hip joint — general pathology",
        sensitivity:"Moderate", specificity:"Moderate",
        positive:"Groin pain or catching with scour",
        negative:"No symptoms with circumduction",
        how:"Patient supine, hip and knee at 90°. Apply AXIAL COMPRESSION through femur toward acetabulum while CIRCUMDUCTING hip (circular motion). 'Scour' the joint. Positive = groin pain or catching sensation (OA, loose body, labral tear, cartilage pathology).",
        options:["Negative","Positive — groin pain (hip joint pathology)","Positive — catching/clicking (labral tear / loose body)"],
      },
      { id:"st_trendelenburg_test", label:"Trendelenburg Test", structure:"Gluteus medius",
        sensitivity:"72%", specificity:"77%",
        positive:"Contralateral pelvis drops on single-leg stance",
        negative:"Pelvis level for 30 seconds",
        how:"Patient stands on ONE leg for 30 seconds. Observe PELVIC LEVEL from behind. Normal = pelvis remains level or slight rise on swing side. Positive (Trendelenburg) = CONTRALATERAL pelvis DROPS > 2cm below horizontal. Indicates glute med weakness on STANDING leg. Compensatory Trendelenburg = patient leans trunk toward stance side to reduce moment arm.",
        options:["Negative — pelvis level","Positive — pelvic drop right","Positive — pelvic drop left","Compensatory lurch (trunk lean over stance leg)"],
      },
      { id:"st_thomas_test", label:"Thomas Test", structure:"Hip flexor length",
        sensitivity:"89%", specificity:"91%",
        positive:"Hip does not reach table = iliopsoas. Knee extends = rectus femoris",
        negative:"Hip reaches table, knee stays at 90°",
        how:"Patient SUPINE at table edge. Bring BOTH hips to chest (flatten lumbar). LOWER test leg. Observe: (1) THIGH ELEVATION = iliopsoas tight (hip cannot extend to neutral). (2) KNEE EXTENSION = rectus femoris tight (knee straightens as hip drops). (3) THIGH ABDUCTION = TFL tight.",
        options:["Negative — full hip extension, knee at 90°","Positive — iliopsoas (thigh elevated)","Positive — rectus femoris (knee extends)","Positive — TFL (thigh abducts)","Combined — both hip and knee compensation"],
      },
      { id:"st_ober_test", label:"Ober's Test", structure:"IT band / TFL",
        sensitivity:"75%", specificity:"80%",
        positive:"Leg cannot adduct below horizontal",
        negative:"Leg adducts past horizontal freely",
        how:"Patient SIDELYING, affected side UP. Stabilise pelvis. ABDUCT and EXTEND hip (align with body). Then slowly allow leg to ADDUCT (drop toward table) while maintaining extension. POSITIVE = leg cannot adduct below horizontal (< 10° adduction) = IT band/TFL restriction. Modified Ober: knee bent (isolates IT band over knee).",
        options:["Negative — leg adducts freely","Positive — leg stays elevated (IT band/TFL tight)"],
      },
      { id:"st_piriformis_test", label:"Piriformis Test (FAIR)", structure:"Piriformis muscle",
        sensitivity:"88%", specificity:"83%",
        positive:"Deep buttock pain reproduced",
        negative:"No buttock or sciatic pain",
        how:"Patient SIDELYING, affected side up. Hip FLEXED 60°, knee FLEXED 60°. Apply DOWNWARD FORCE on knee (adduction and internal rotation of hip) — FAIR position. Positive = DEEP BUTTOCK PAIN or sciatic symptoms. Test implicates piriformis compressing sciatic nerve.",
        options:["Negative","Positive — deep buttock pain (piriformis syndrome)","Positive — sciatic symptoms (sciatic nerve compression)"],
      },
      { id:"st_90_90", label:"90-90 Hamstring Test", structure:"Hamstring length + hip mobility",
        sensitivity:"High", specificity:"Moderate",
        positive:"Knee cannot extend to < 20° from full extension",
        negative:"Knee extends to within 20° of full extension",
        how:"Patient SUPINE. Bring hip to 90° FLEXION, knee at 90°. Ask to ACTIVELY EXTEND knee as far as possible. Measure the angle short of full extension. Normal: within 20° of full extension. Positive = > 20° from full extension = hamstring tightness. Also tests: is restriction from hip capsule (entire leg moves back) or hamstring (only knee extension limited)?",
        options:["Normal (< 20° from full extension)","Mild hamstring tightness (20–30°)","Moderate hamstring tightness (30–45°)","Severe hamstring tightness (> 45°)"],
      },
    ]
  },

  knee:{
    label:"Knee", color:"#ffb300", icon:"🟡",
    tests:[
      { id:"st_lachmans", label:"Lachman's Test", structure:"ACL integrity",
        sensitivity:"85%", specificity:"94%",
        positive:"Anterior tibial translation > 5mm or soft end-feel",
        negative:"Firm end-feel, < 5mm translation",
        how:"Patient SUPINE, knee at 20–30° flexion. Stabilise FEMUR with one hand (above knee). Grasp TIBIA just below joint line with other hand. Apply ANTERIOR translation force. Assess: amount of tibial movement AND quality of end-feel. Firm end-feel = ACL intact. Soft/empty end-feel = ACL rupture. Best ACL test.",
        options:["Negative — firm end-feel","Grade 1 (< 5mm — mild sprain)","Grade 2 (5–10mm — partial tear)","Grade 3 (> 10mm, soft end-feel — complete ACL rupture)"],
      },
      { id:"st_anterior_drawer", label:"Anterior Drawer Test", structure:"ACL",
        sensitivity:"62%", specificity:"88%",
        positive:"Anterior tibial translation > 5mm",
        negative:"Firm end-feel",
        how:"Patient SUPINE, knee at 90° flexion, foot flat on table. Sit on patient's foot (stabilise). Grasp tibia just below joint line with both hands. Apply ANTERIOR TRANSLATION. Less accurate than Lachman's in acute injury (hamstring guarding at 90° reduces translation). More useful in chronic ACL insufficiency.",
        options:["Negative","Positive — ACL insufficiency (compare to Lachman's)"],
      },
      { id:"st_posterior_drawer", label:"Posterior Drawer Test", structure:"PCL integrity",
        sensitivity:"90%", specificity:"99%",
        positive:"Posterior tibial sag / translation",
        negative:"No posterior sag",
        how:"Patient SUPINE, hip 45°, knee 90°. Observe tibia from side — POSTERIOR SAG indicates PCL rupture (gravity causes tibial drop). Apply POSTERIOR FORCE on tibia. Positive = posterior translation. ALWAYS check for posterior sag BEFORE doing anterior drawer (prevents misinterpreting sag as anterior laxity).",
        options:["Negative — no posterior sag","Positive — posterior sag present (PCL rupture)","Positive — posterior translation with force"],
      },
      { id:"st_pivot_shift", label:"Pivot Shift Test", structure:"ACL — rotational instability",
        sensitivity:"35–95%", specificity:"95–99%",
        positive:"Clunk or subluxation at 30° flexion",
        negative:"Smooth motion, no shift",
        how:"Patient SUPINE, hip 30° flexion. Apply VALGUS and INTERNAL ROTATION to foot while FLEXING knee from extension. At ~30° flexion, the iliotibial band crosses the axis of rotation — positive = CLUNK (tibia reduces from subluxed position). Best performed under anaesthesia. Grade 1 = glide, Grade 2 = clunk, Grade 3 = gross subluxation.",
        options:["Negative — smooth motion","Grade 1 — glide (mild)","Grade 2 — clunk (moderate)","Grade 3 — gross subluxation (severe ACL rupture)"],
      },
      { id:"st_valgus_stress_knee", label:"Valgus Stress Test", structure:"MCL integrity",
        sensitivity:"91%", specificity:"86%",
        positive:"Medial joint opening or pain",
        negative:"Firm end-feel, < 5mm opening",
        how:"Knee at 0° and at 30° flexion. Apply VALGUS force (push lateral side — open medial). Test at 0°: positive = MCL + posterior capsule/PCL. Test at 30° only: positive = MCL in isolation. Grade 1: pain only. Grade 2: 5–10mm opening. Grade 3: > 10mm opening.",
        options:["Negative","Grade 1 — pain only (MCL sprain)","Grade 2 — 5–10mm opening (partial tear)","Grade 3 — > 10mm opening (complete MCL rupture)"],
      },
      { id:"st_varus_stress_knee", label:"Varus Stress Test", structure:"LCL integrity",
        sensitivity:"25%", specificity:"96%",
        positive:"Lateral joint opening or pain",
        negative:"Firm end-feel",
        how:"Knee at 0° and 30°. Apply VARUS force (push medial side — open lateral). At 30° only: LCL isolated. At 0°: LCL + PCL and posterolateral corner. LCL injuries are less common than MCL.",
        options:["Negative","Positive — lateral pain (LCL sprain)","Positive — lateral opening (LCL tear)"],
      },
      { id:"st_mcmurray_test", label:"McMurray's Test", structure:"Meniscal integrity",
        sensitivity:"53%", specificity:"59%",
        positive:"Click or pain at joint line",
        negative:"No symptoms",
        how:"Patient SUPINE. Fully FLEX knee. For MEDIAL meniscus: apply VALGUS force + EXTERNAL ROTATION of tibia. For LATERAL meniscus: apply VARUS force + INTERNAL ROTATION. Slowly EXTEND knee from full flex. Positive = CLICK or PAIN at joint line during extension.",
        options:["Negative","Positive medial (valgus + ER click/pain — medial meniscus)","Positive lateral (varus + IR click/pain — lateral meniscus)","Bilateral positive"],
      },
      { id:"st_apley", label:"Apley's Grind Test", structure:"Meniscus — differentiate from ligament",
        sensitivity:"60%", specificity:"70%",
        positive:"Pain with compression (meniscus) vs distraction (ligament)",
        negative:"No pain with either",
        how:"Patient PRONE, knee 90°. STEP 1 — Distract: lift heel (distraction) + rotate. Pain = ligament. STEP 2 — Compress: push heel into table + rotate. Pain = MENISCUS. Differentiating compress vs distract response separates meniscal (compressive) from ligamentous (distractive) pathology.",
        options:["Negative both","Positive — compression (meniscal pathology)","Positive — distraction (ligamentous)","Both positive"],
      },
      { id:"st_thessaly", label:"Thessaly Test", structure:"Meniscus — weight-bearing",
        sensitivity:"69–89%", specificity:"97%",
        positive:"Medial or lateral joint pain/catching with rotation",
        negative:"No symptoms",
        how:"Patient stands on ONE leg, knee at 20° FLEXION (most sensitive angle). Rotate torso internally and externally 3 times while maintaining balance. Positive = MEDIAL or LATERAL joint line pain or clicking. Most accurate meniscal test — simulates physiological weight-bearing.",
        options:["Negative","Positive — medial joint line pain (medial meniscus)","Positive — lateral joint line pain (lateral meniscus)"],
      },
      { id:"st_clarkes", label:"Clarke's Sign", structure:"Patellofemoral joint",
        sensitivity:"39%", specificity:"67%",
        positive:"Anterior knee pain with patellar compression",
        negative:"No pain",
        how:"Patient SUPINE, knee extended. Therapist pushes PATELLA DISTALLY. Ask patient to TIGHTEN QUADRICEPS. Positive = anterior knee pain (chondromalacia patella or PFPS). Low sensitivity — false positives common. More useful combined with patellar grind and lateral tilt assessment.",
        options:["Negative","Positive — anterior knee pain (PFPS / chondromalacia)"],
      },
      { id:"st_patellar_grind", label:"Patellar Grind Test", structure:"Patellofemoral cartilage",
        sensitivity:"Moderate", specificity:"Moderate",
        positive:"Crepitus or pain with patellar compression",
        negative:"No crepitus or pain",
        how:"Patient SUPINE. Compress PATELLA into trochlea with thumb and index. Gently GRIND patella in small circles. Positive = crepitus (cartilage change) and/or pain. Also assess patellar mobility (medial/lateral glide) and tilt test (medial edge lift — tight lateral retinaculum if cannot lift).",
        options:["Negative","Positive — pain only (PFPS)","Positive — crepitus (chondromalacia)","Positive — both pain and crepitus"],
      },
      { id:"st_effusion", label:"Sweep / Ballottement Test", structure:"Knee effusion",
        sensitivity:"75%", specificity:"84%",
        positive:"Fluid wave present",
        negative:"No fluid wave",
        how:"SWEEP TEST: Patient supine, knee extended. Use palm to SWEEP fluid from medial gutter to suprapatellar pouch. Then sweep down lateral side — observe for FLUID WAVE on medial side. Positive = small effusion. BALLOTTEMENT: Apply downward patellar pressure — if patella bounces = moderate/large effusion.",
        options:["No effusion","Small effusion (sweep test positive)","Moderate effusion (ballottement positive)","Large effusion (visible swelling)"],
      },
      { id:"st_noble", label:"Noble Compression Test", structure:"IT band at lateral femoral epicondyle",
        sensitivity:"High for ITB syndrome", specificity:"Moderate",
        positive:"Sharp pain at 2cm above lateral joint line at 30° flex",
        negative:"No pain at this point",
        how:"Patient SUPINE. Apply firm pressure at LATERAL FEMORAL EPICONDYLE (2cm above lateral joint line = 'Noble's point'). Then flex and extend knee to 30°. Positive = SHARP PAIN at this precise point — IT band syndrome. Also: ask runner to replicate the activity that causes pain (may need treadmill).",
        options:["Negative","Positive — IT band syndrome (lateral epicondyle point tenderness at 30°)"],
      },
    ]
  },

  ankle_foot:{
    label:"Ankle & Foot", color:"#a8ff3e", icon:"🟢",
    tests:[
      { id:"st_ant_drawer_ankle", label:"Anterior Drawer Test — Ankle", structure:"ATFL integrity",
        sensitivity:"85%", specificity:"75%",
        positive:"Anterior talar translation > 10mm (> 3mm vs contralateral)",
        negative:"Firm end-feel, symmetric",
        how:"Patient seated, ankle at 20° PLANTARFLEXION (ATFL more vertical = more isolated). Stabilise TIBIA with one hand. With other hand, grasp CALCANEUS and apply ANTERIOR force (translate talus forward in mortise). Positive = > 10mm translation or soft end-feel. Compare bilaterally — > 3mm asymmetry = significant.",
        options:["Negative — firm end-feel","Positive — ATFL sprain (mild laxity)","Positive — ATFL rupture (> 10mm, soft end-feel)"],
      },
      { id:"st_talar_tilt", label:"Talar Tilt Test", structure:"CFL integrity",
        sensitivity:"50%", specificity:"74%",
        positive:"Excessive inversion tilt vs contralateral",
        negative:"Symmetric tilt, firm end-feel",
        how:"Ankle neutral (0°). Apply INVERSION STRESS (tilt calcaneus into inversion). CFL isolated at neutral. Positive = excessive inversion tilting > 15° or > 5° vs contralateral. Confirms CFL injury — usually combined with ATFL in Grade 3 lateral ankle sprain.",
        options:["Negative","Positive — CFL laxity (combined lateral ankle instability)"],
      },
      { id:"st_squeeze_ankle", label:"Squeeze / Mortise Test", structure:"Syndesmosis — high ankle sprain",
        sensitivity:"69%", specificity:"84%",
        positive:"Anterior ankle pain with proximal compression",
        negative:"No distal pain",
        how:"Squeeze fibula and tibia TOGETHER at mid-CALF level (well away from ankle). Positive = ANTERIOR ANKLE pain (at syndesmosis) reproduced by this proximal compression. Indicates syndesmotic (high ankle) sprain — much longer recovery than lateral sprain.",
        options:["Negative","Positive — syndesmotic (high ankle) sprain"],
      },
      { id:"st_thompson_test", label:"Thompson's Test", structure:"Achilles tendon rupture",
        sensitivity:"96%", specificity:"93%",
        positive:"No plantarflexion with calf squeeze",
        negative:"Foot plantarflexes with squeeze",
        how:"Patient PRONE, feet over table edge. SQUEEZE calf muscle belly (mid-calf). Normal = foot PLANTARFLEXES. POSITIVE = no plantarflexion = complete Achilles rupture. The Simmond's test. Patient may still be able to plantarflex actively (via other muscles) — do NOT rely on active PF.",
        options:["Negative — plantarflexion present (Achilles intact)","Positive — no plantarflexion (complete Achilles rupture)"],
      },
      { id:"st_windlass_test", label:"Windlass Test", structure:"Plantar fascia",
        sensitivity:"High for plantar fasciopathy", specificity:"Moderate",
        positive:"Plantar fascia pain with toe extension",
        negative:"No plantar pain",
        how:"Patient WEIGHT-BEARING (standing). Passively EXTEND GREAT TOE 60–70°. Positive = pain at MEDIAL CALCANEAL TUBERCLE or along plantar fascia. The windlass mechanism tightens the plantar fascia. More positive weight-bearing than non-weight-bearing.",
        options:["Negative","Positive — medial heel pain (plantar fasciitis)","Positive — mid-plantar pain (plantar fasciopathy)"],
      },
      { id:"st_navicular_drop", label:"Navicular Drop Test", structure:"Medial arch collapse / tibialis posterior",
        sensitivity:"High for arch collapse", specificity:"Moderate",
        positive:"Navicular drop > 10mm",
        negative:"< 6mm navicular drop",
        how:"Mark NAVICULAR TUBEROSITY with pen marker while patient seated (non-weight-bearing). Mark height from floor. Then patient STANDS (weight-bearing). Measure new navicular height. NAVICULAR DROP = difference between non-WB and WB heights. Normal: < 6mm. Mild: 6–10mm. Significant: > 10mm. > 10mm = tibialis posterior insufficiency / medial arch collapse.",
        options:["Normal (< 6mm drop)","Mild collapse (6–10mm)","Significant collapse (> 10mm — tib post insufficiency)"],
      },
      { id:"st_tinel_ankle", label:"Tinel's Sign — Ankle", structure:"Posterior tibial nerve (tarsal tunnel)",
        sensitivity:"58%", specificity:"86%",
        positive:"Tingling in plantar foot with percussion",
        negative:"No distal symptoms",
        how:"Percuss POSTERIOR TIBIAL NERVE behind MEDIAL MALLEOLUS (tarsal tunnel). Positive = tingling along plantar foot / toes (tibial nerve distribution). Tarsal tunnel syndrome — analogous to carpal tunnel at the ankle.",
        options:["Negative","Positive — plantar tingling (tarsal tunnel syndrome)"],
      },
      { id:"st_royal_london", label:"Royal London Hospital Test", structure:"Achilles tendinopathy",
        sensitivity:"High for mid-portion tendinopathy", specificity:"Moderate",
        positive:"Pain reduced at mid-tendon with ankle DF",
        negative:"Pain at mid-tendon in all positions",
        how:"Palpate MID-PORTION of Achilles tendon (2–6cm above insertion) — note tenderness. Then DORSIFLEX ankle (stretches and thins Achilles). Re-palpate. POSITIVE (test is positive for mid-portion tendinopathy) = tenderness REDUCES with dorsiflexion. Note: this is a CONFIRMING test — positive means mid-portion, not insertional.",
        options:["Positive (mid-portion tendinopathy confirmed — pain reduces with DF)","Negative (pain unchanged — may be insertional or other pathology)"],
      },
    ]
  },

  neural:{
    label:"Neurological Special Tests", color:"#d4a5ff", icon:"🟣",
    tests:[
      { id:"st_slump_test", label:"Slump Test", structure:"Neural tension — entire neuraxis",
        sensitivity:"84%", specificity:"83%",
        positive:"Reproduces symptoms — eases with neck extension",
        negative:"Symptoms don't change with neck extension",
        how:"Patient seated, legs over side. STEP 1: Slump trunk (thoracic + lumbar flexion). STEP 2: Flex NECK (chin to chest). STEP 3: Extend KNEE (straighten leg). STEP 4: DORSIFLEX ankle. STEP 5: EXTEND neck — observe symptom change. POSITIVE = symptoms reproduced AND improve when neck is extended (confirms neural, not muscular, cause).",
        options:["Negative — no symptom change with neck extension","Positive — left (symptoms reproduced + ease with neck ext)","Positive — right","Bilateral positive — central sensitisation suspected"],
      },
      { id:"st_ultt1", label:"ULTT1 — Median Nerve", structure:"Median nerve tension",
        sensitivity:"75%", specificity:"74%",
        positive:"Symptom reproduction in median distribution",
        negative:"No arm symptoms",
        how:"Patient supine. Sequence: (1) Scapular depression, (2) Shoulder abduction 110°, (3) Wrist + finger extension, (4) Forearm supination, (5) Elbow extension, (6) Cervical side flexion AWAY. Sensitise with shoulder IR. Positive = arm symptoms reproduced (median distribution — thumb/index/middle). Release tension to confirm (symptom change).",
        options:["Negative","Positive left — median nerve sensitised","Positive right — median nerve sensitised","Bilateral positive"],
      },
      { id:"st_ultt2", label:"ULTT2 — Radial Nerve", structure:"Radial nerve tension",
        sensitivity:"72%", specificity:"74%",
        positive:"Lateral forearm or dorsal hand symptoms",
        negative:"No radial distribution symptoms",
        how:"Patient supine. Sequence: (1) Scapular depression, (2) Shoulder abduction 40°, (3) Elbow extension, (4) Forearm pronation, (5) Wrist + finger flexion (radial nerve on tension), (6) Shoulder IR. Positive = symptoms in RADIAL distribution (lateral forearm, dorsum hand, thumb). Lateral epicondylalgia often has positive ULTT2.",
        options:["Negative","Positive left — radial nerve sensitised","Positive right — radial nerve sensitised"],
      },
      { id:"st_ultt3", label:"ULTT3 — Ulnar Nerve", structure:"Ulnar nerve tension",
        sensitivity:"75%", specificity:"74%",
        positive:"Ring/little finger and medial forearm symptoms",
        negative:"No ulnar distribution symptoms",
        how:"Patient supine. Sequence: (1) Scapular depression, (2) Shoulder abduction 90°, (3) Wrist + finger extension (ulnar side), (4) Forearm supination, (5) Elbow FLEXION (ulnar nerve stretched at cubital tunnel), (6) Cervical side flexion AWAY. Positive = ring/little finger tingling or medial forearm symptoms.",
        options:["Negative","Positive left — ulnar nerve sensitised","Positive right — ulnar nerve sensitised"],
      },
      { id:"st_femoral_nerve_stretch", label:"Femoral Nerve Stretch Test (FNST)", structure:"Femoral nerve — L2/L3/L4",
        sensitivity:"88%", specificity:"71%",
        positive:"Anterior thigh pain reproduced",
        negative:"No anterior thigh symptoms",
        how:"Patient PRONE. Therapist passively FLEXES KNEE (bring heel toward buttock). If positive = anterior thigh pain reproduced (femoral nerve tension). Extend hip further if needed (increase tension). Compare bilaterally. Tests L2/3/4 nerve roots via femoral nerve.",
        options:["Negative","Positive — anterior thigh pain (femoral nerve tension L2/3/4)"],
      },
      { id:"st_babinski", label:"Babinski Sign", structure:"Corticospinal tract — UMN lesion",
        sensitivity:"60%", specificity:"97%",
        positive:"Great toe extends, toes fan — URGENT REFER",
        negative:"Toes flex (normal plantar reflex)",
        how:"Stroke LATERAL plantar surface of foot with firm blunt instrument (thumbnail or reflex hammer handle). Move from heel toward toes. Normal: toes FLEX (plantar grasp reflex). POSITIVE (abnormal): great toe EXTENDS and other toes FAN OUT. Indicates UPPER MOTOR NEURON lesion — myelopathy, brain lesion, cord compression. URGENT referral.",
        options:["Negative — plantar flexion (normal)","Positive — great toe extension + fanning (UMN lesion — REFER URGENT)"],
      },
      { id:"st_hoffmanns", label:"Hoffmann's Sign", structure:"UMN lesion — cervical myelopathy",
        sensitivity:"Moderate", specificity:"High",
        positive:"Thumb flexes when middle finger flicked",
        negative:"No thumb movement",
        how:"Hold patient's middle finger loosely. Flick the DISTAL PHALANX downward (releasing suddenly). Observe thumb and index finger. POSITIVE = thumb FLEXES and adducts (involuntary) = upper motor neuron sign. Indicates cervical myelopathy or other corticospinal tract pathology. Combine with Babinski.",
        options:["Negative — no thumb movement","Positive — thumb flexes (UMN / myelopathy — REFER)"],
      },
      { id:"st_romberg", label:"Romberg Test", structure:"Posterior column / proprioception",
        sensitivity:"Moderate", specificity:"High",
        positive:"Falls or excessive sway with eyes closed",
        negative:"Minimal sway change with eye closure",
        how:"Patient stands feet together, eyes OPEN 30 seconds (assess baseline sway). Then CLOSE eyes 30 seconds. Normal: minimal increase in sway. POSITIVE: significant increase in sway or falls with eyes closed (proprioception / dorsal column deficit). Distinguish: if falls with eyes OPEN = cerebellar problem. Falls ONLY with eyes closed = peripheral proprioception or dorsal column.",
        options:["Negative — minimal sway change","Positive — increased sway eyes closed (proprioception deficit)","Positive — falls eyes open (cerebellar)"],
      },
    ]
  },

  balance_functional:{
    label:"Balance & Functional", color:"#90caf9", icon:"🔵",
    tests:[
      { id:"st_single_leg_stance", label:"Single Leg Stance Test", structure:"Proprioception + postural stability",
        sensitivity:"High for balance deficit", specificity:"High",
        positive:"< 10 seconds eyes open OR < 5 seconds eyes closed",
        negative:"30+ seconds eyes open, 10+ seconds eyes closed",
        how:"Patient stands on ONE leg, arms folded, hands on opposite shoulders (removes upper limb balance strategy). TIME eyes open to 30 seconds. Then TIME eyes closed to 10 seconds. Record seconds before loss of balance. Compare bilaterally. Norm: 30s eyes open, 10s eyes closed for working age adults (decreases with age).",
        options:["Normal (≥30s eyes open, ≥10s eyes closed)","Mild deficit (20–29s eyes open)","Moderate deficit (10–19s eyes open)","Severe deficit (< 10s eyes open)","Unable to perform"],
      },
      { id:"st_star_excursion", label:"Star Excursion Balance Test (SEBT)", structure:"Dynamic balance + proprioception",
        sensitivity:"High for chronic ankle instability", specificity:"High",
        positive:"Asymmetry > 4cm in any direction vs contralateral",
        negative:"< 4cm asymmetry in all directions",
        how:"Patient stands on one leg at centre of star. Reach free leg in 3 directions: ANTERIOR, POSTEROMEDIAL, POSTEROLATERAL. Measure distance (cm) from centre to reach point. Normalise to leg length. > 4cm asymmetry in posteromedial reach = high injury risk (ankle instability and ACL risk predictor).",
        options:["Normal — < 4cm asymmetry all directions","Anterior deficit (> 4cm)","Posteromedial deficit (> 4cm) — highest injury predictor","Posterolateral deficit (> 4cm)","Multiple direction deficits"],
      },
      { id:"st_functional_hop", label:"Single Leg Hop Tests (4-Test Battery)", structure:"Lower limb power, symmetry, confidence",
        sensitivity:"High for return to sport", specificity:"High",
        positive:"Limb Symmetry Index < 90% in any test",
        negative:"LSI ≥ 90% all tests",
        how:"Test 4 hops each leg: (1) SINGLE HOP for distance. (2) TRIPLE HOP for distance. (3) TRIPLE CROSSOVER HOP for distance. (4) 6-METRE TIMED HOP. Limb Symmetry Index (LSI) = (involved ÷ uninvolved) × 100. LSI < 90% = NOT ready for return to sport. ALL 4 tests must be ≥ 90%.",
        options:["Normal — LSI ≥ 90% all tests","Mild deficit — LSI 80–89%","Moderate deficit — LSI 70–79%","Severe deficit — LSI < 70% (not ready for sport)"],
      },
      { id:"st_berg_balance", label:"Berg Balance Scale", structure:"Functional balance — 14 tasks",
        sensitivity:"91%", specificity:"85% for fall risk",
        positive:"Score < 45/56 = fall risk",
        negative:"Score 50–56 = low fall risk",
        how:"14 balance tasks scored 0–4 each (max 56). Tasks include: sitting to standing, standing unsupported, sitting unsupported, standing to sitting, transfers, standing eyes closed, standing feet together, reaching forward, picking up object, turning 360°, stepping, tandem standing, one-leg standing. Score < 45 = significantly elevated fall risk.",
        options:["Normal 50–56 (low fall risk)","Mild 41–49 (increased fall risk)","Moderate 21–40 (high fall risk — requires aid)","Severe 0–20 (cannot balance independently)"],
      },
    ]
  },

  outcome_tools:{
    label:"Validated Outcome Tools", color:"#ffd700", icon:"📊",
    tests:[
      { id:"st_ndi_tool", label:"Neck Disability Index (NDI)", structure:"Cervical disability",
        sensitivity:"N/A", specificity:"N/A",
        positive:"Score 0–4: none. 5–14: mild. 15–24: moderate. 25–34: severe. >34: complete",
        negative:"N/A — score all 10 items",
        how:"10 items (pain intensity, personal care, lifting, reading, headache, concentration, work, driving, sleeping, recreation). Each scored 0–5. Maximum 50. Calculate percentage (score/50 × 100). MCID (minimum clinically important difference) = 7 points.",
        options:["No disability (0–4)","Mild disability (5–14)","Moderate disability (15–24)","Severe disability (25–34)","Complete disability (35–50)"],
      },
      { id:"st_odi_tool", label:"Oswestry Disability Index (ODI)", structure:"Lumbar disability",
        sensitivity:"N/A", specificity:"N/A",
        positive:"< 20%: minimal. 20–40%: moderate. 40–60%: severe. >60%: crippled",
        negative:"N/A",
        how:"10 sections (pain intensity, personal care, lifting, walking, sitting, standing, sleeping, sex life, social life, travelling). Each scored 0–5. Score/50 × 100 = %. MCID = 10 points (10%). Important for medico-legal and surgical decision-making.",
        options:["Minimal disability (< 20%)","Moderate disability (20–40%)","Severe disability (40–60%)","Crippling disability (60–80%)","Bed-bound (> 80%)"],
      },
      { id:"st_koos_tool", label:"KOOS (Knee injury and OA Outcome Score)", structure:"Knee function",
        sensitivity:"N/A", specificity:"N/A",
        positive:"Lower score = worse function",
        negative:"100 = no symptoms",
        how:"5 subscales: Symptoms, Pain, ADL, Sport/Recreation, Quality of Life. Each subscale 0–100 (100 = no problems). Calculate each subscale separately. KOOS4 = average of Pain, Symptoms, ADL, Sport. MCID = 8–10 points per subscale.",
        options:["Score each subscale 0–100","Document all 5 subscale scores","Calculate KOOS4 average","Compare at each reassessment"],
      },
      { id:"st_dash_tool", label:"DASH / QuickDASH Score", structure:"Upper limb disability",
        sensitivity:"N/A", specificity:"N/A",
        positive:"Higher = more disability. 0 = no disability, 100 = most severe",
        negative:"Score < 10 = minimal disability",
        how:"DASH: 30 items about ability to perform activities. QuickDASH: 11 items (faster to administer). Score formula: (sum/n - 1) × 25 = score. Work module (4 items) and Sport/Music module (4 items) optional. MCID = 10–15 points.",
        options:["Minimal (0–10)","Mild disability (11–30)","Moderate disability (31–50)","Severe disability (51–70)","Extreme disability (> 70)"],
      },
      { id:"st_psfs_tool", label:"Patient Specific Functional Scale (PSFS)", structure:"Patient-specific activities",
        sensitivity:"High responsiveness", specificity:"N/A",
        positive:"Lower score = worse function",
        negative:"10/10 = normal function",
        how:"Patient identifies 3–5 activities they cannot perform due to their problem. Rate each 0–10 (0 = unable to perform, 10 = normal). Average the scores. Reassess at each session. MCID = 2 points for individual activities, 3 points for average score. Excellent for capturing what MATTERS to the patient.",
        options:["Record 3 activities and scores","Baseline average score","Reassess score at each visit","MCID achieved = 2+ points improvement"],
      },
    ]
  },
};

// ─── SPECIAL TESTS COMPONENT ──────────────────────────────────────────────────
function SpecialTestsSection({ data, set }) {
  const [region, setRegion] = useState("shoulder");
  const [openTest, setOpenTest] = useState(null);
  const [modalTest, setModalTest] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const reg = SPECIAL_TESTS_DATA[region];
  const allTests = Object.values(SPECIAL_TESTS_DATA).flatMap(r => r.tests);
  const totalCount = allTests.length;
  const completedCount = allTests.filter(t => {
    const lv = data[t.id+"_left"], rv = data[t.id+"_right"], sv = data[t.id];
    return lv || rv || sv;
  }).length;

  const getTestResult = (testId) => {
    return data[testId+"_left"] || data[testId+"_right"] || data[testId] || "";
  };
  const setTestResult = (testId, side, val) => {
    if (side === "left") set(testId+"_left", val);
    else if (side === "right") set(testId+"_right", val);
    else set(testId, val);
  };

  const isPositive = (val) => val && (val.includes("Positive") || val.includes("positive") || val.includes("+ve") || val.includes("Grade") || val.includes("deficit") || val.includes("REFER") || val.includes("rupture") || val.includes("tear") || val.includes("instability") || val.includes("Severe"));

  const filteredTests = searchTerm
    ? Object.entries(SPECIAL_TESTS_DATA).flatMap(([rKey, r]) =>
        r.tests.filter(t => t.label.toLowerCase().includes(searchTerm.toLowerCase()) || t.structure.toLowerCase().includes(searchTerm.toLowerCase())).map(t => ({ ...t, regionKey: rKey, regionLabel: r.label, regionColor: r.color }))
      )
    : null;

  return (
    <div>
      {/* Header stats */}
      <div style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:10, padding:14, marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ fontWeight:800, color:C.text }}>🔬 Special Tests Library — {totalCount} Tests</div>
          <span style={{ fontWeight:800, color:C.accent, fontSize:"0.85rem" }}>{completedCount}/{totalCount} completed</span>
        </div>
        <div style={{ height:5, background:C.s3, borderRadius:5, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${Math.round(completedCount/totalCount*100)}%`, background:`linear-gradient(90deg,${C.accent},${C.a2})`, borderRadius:5, transition:"width 0.3s" }} />
        </div>
      </div>

      {/* Search */}
      <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        placeholder="🔍 Search tests by name or structure..."
        style={{ width:"100%", background:C.s2, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, padding:"9px 12px", fontSize:"0.82rem", fontFamily:"inherit", outline:"none", marginBottom:12 }} />

      {/* Region tabs */}
      {!searchTerm && (
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:14 }}>
          {Object.entries(SPECIAL_TESTS_DATA).map(([key, r]) => {
            const filled = r.tests.filter(t => getTestResult(t.id)).length;
            const positives = r.tests.filter(t => isPositive(getTestResult(t.id))).length;
            return (
              <button key={key} type="button" onClick={() => { setRegion(key); setOpenTest(null); }}
                style={{ padding:"6px 12px", borderRadius:20, border:`1px solid ${region===key ? r.color : filled>0 ? r.color+"50" : C.border}`, background:region===key ? `${r.color}18` : "transparent", color:region===key ? r.color : C.muted, fontSize:"0.73rem", fontWeight:region===key ? 700 : 500, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                {r.icon} {r.label}
                {positives > 0 && <span style={{ background:C.red, color:"#fff", borderRadius:10, padding:"0 5px", fontSize:"0.6rem", fontWeight:800 }}>⚠{positives}</span>}
                {filled > 0 && positives === 0 && <span style={{ background:r.color, color:"#000", borderRadius:10, padding:"0 5px", fontSize:"0.6rem", fontWeight:800 }}>{filled}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Render tests */}
      {(() => {
        const testsToRender = filteredTests || reg.tests.map(t => ({ ...t, regionColor: reg.color }));
        return testsToRender.map((t) => {
          const isOpen = openTest === t.id;
          const leftVal = data[t.id+"_left"] || "";
          const rightVal = data[t.id+"_right"] || "";
          const singleVal = data[t.id] || "";
          const anyVal = leftVal || rightVal || singleVal;
          const anyPositive = isPositive(leftVal) || isPositive(rightVal) || isPositive(singleVal);
          const color = t.regionColor || reg?.color || C.accent;
          const svgEl = TEST_SVG[t.id.replace("st_","")];

          return (
            <div key={t.id} style={{ background:C.surface, border:`1px solid ${anyPositive ? C.red+"60" : anyVal ? color+"40" : C.border}`, borderRadius:12, marginBottom:9, overflow:"hidden" }}>
              {/* Header row */}
              <div onClick={() => setOpenTest(isOpen ? null : t.id)}
                style={{ padding:"11px 14px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"flex-start", borderLeft:`3px solid ${anyPositive ? C.red : anyVal ? color : "#1a2d45"}` }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:7, alignItems:"center", marginBottom:3, flexWrap:"wrap" }}>
                    <span style={{ fontSize:"0.75rem", fontWeight:700, color:color }}>{t.label}</span>
                    {anyPositive && <span style={{ padding:"1px 7px", borderRadius:8, background:"rgba(255,77,109,0.2)", color:C.red, fontSize:"0.65rem", fontWeight:700 }}>⚠ POSITIVE</span>}
                    {anyVal && !anyPositive && <span style={{ padding:"1px 7px", borderRadius:8, background:"rgba(0,201,122,0.15)", color:C.green, fontSize:"0.65rem", fontWeight:700 }}>✓ Recorded</span>}
                  </div>
                  <div style={{ fontSize:"0.7rem", color:C.muted }}>Structure: {t.structure}</div>
                  <div style={{ fontSize:"0.68rem", color:C.muted }}>Sens: {t.sensitivity} · Spec: {t.specificity}</div>
                  {anyVal && (
                    <div style={{ marginTop:4, fontSize:"0.72rem", color:anyPositive ? C.red : C.green, fontWeight:600 }}>
                      {leftVal && `L: ${leftVal}`}{leftVal && rightVal && " | "}{rightVal && `R: ${rightVal}`}{singleVal && singleVal}
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", gap:7, alignItems:"center", flexShrink:0, marginLeft:10 }}>
                  <button type="button" onClick={e => { e.stopPropagation(); setModalTest(t); }}
                    style={{ padding:"3px 9px", background:"rgba(127,90,240,0.15)", border:`1px solid ${C.a2}40`, borderRadius:6, color:C.a2, fontSize:"0.62rem", fontWeight:700, cursor:"pointer" }}>ℹ</button>
                  <span style={{ color:C.muted, fontSize:"0.72rem" }}>{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded */}
              {isOpen && (
                <div style={{ padding:"0 14px 14px" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:14, marginBottom:12 }}>
                    {/* SVG illustration */}
                    <div style={{ background:C.s2, borderRadius:8, padding:8, border:`1px solid ${C.border}`, width:120, flexShrink:0 }}>
                      {svgEl || (
                        <svg viewBox="0 0 120 100" width="120" height="90">
                          <text x="50%" y="40%" textAnchor="middle" fontSize="22" fill={color}>⚕</text>
                          <text x="50%" y="65%" textAnchor="middle" fontSize="9" fill={C.muted}>{t.label.split(" ")[0]}</text>
                        </svg>
                      )}
                      <div style={{ fontSize:"0.6rem", color:C.muted, textAlign:"center", marginTop:2 }}>Illustration</div>
                    </div>

                    {/* How to + sensitivity */}
                    <div>
                      <div style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:8, padding:10, marginBottom:8 }}>
                        <div style={{ fontSize:"0.62rem", fontWeight:700, color:C.yellow, textTransform:"uppercase", letterSpacing:"1px", marginBottom:5 }}>👐 How to Perform</div>
                        <div style={{ fontSize:"0.78rem", color:C.text, lineHeight:1.7 }}>{t.how}</div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                        <div style={{ background:"rgba(0,201,122,0.08)", border:"1px solid rgba(0,201,122,0.25)", borderRadius:7, padding:"6px 9px" }}>
                          <div style={{ fontSize:"0.6rem", fontWeight:700, color:C.green, marginBottom:2 }}>✓ NEGATIVE means</div>
                          <div style={{ fontSize:"0.72rem", color:C.text }}>{t.negative}</div>
                        </div>
                        <div style={{ background:"rgba(255,77,109,0.08)", border:"1px solid rgba(255,77,109,0.25)", borderRadius:7, padding:"6px 9px" }}>
                          <div style={{ fontSize:"0.6rem", fontWeight:700, color:C.red, marginBottom:2 }}>⚠ POSITIVE means</div>
                          <div style={{ fontSize:"0.72rem", color:C.text }}>{t.positive}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Result selection — bilateral where needed */}
                  <div>
                    <div style={{ fontSize:"0.62rem", fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"1px", marginBottom:7 }}>📊 Record Result</div>
                    {["cervical","shoulder","elbow_wrist","neural","ankle_foot","knee","hip"].includes(region) || t.id.includes("_l_") || t.id.includes("ultt") || t.id.includes("spurling") || t.id.includes("neer") || t.id.includes("hawkins") || t.id.includes("empty_can") || t.id.includes("full_can") || t.id.includes("lift_off") || t.id.includes("belly") || t.id.includes("bear") || t.id.includes("er_lag") || t.id.includes("hornblower") || t.id.includes("obrien") || t.id.includes("speeds") || t.id.includes("yergason") || t.id.includes("apprehension") || t.id.includes("relocation") || t.id.includes("sulcus") || t.id.includes("cozens") || t.id.includes("mills") || t.id.includes("golfers") || t.id.includes("phalen") || t.id.includes("tinel") || t.id.includes("finkelstein") || t.id.includes("watson") || t.id.includes("grind") || t.id.includes("valgus_stress") || t.id.includes("fadir") || t.id.includes("faber_test") || t.id.includes("hip_scour") || t.id.includes("trendelenburg_test") || t.id.includes("thomas_test") || t.id.includes("ober_test") || t.id.includes("piriformis") || t.id.includes("lachmans") || t.id.includes("anterior_drawer") || t.id.includes("posterior_drawer") || t.id.includes("pivot") || t.id.includes("mcmurray_test") || t.id.includes("apley") || t.id.includes("thessaly") || t.id.includes("clarkes") || t.id.includes("patellar") || t.id.includes("noble") || t.id.includes("ant_drawer_ankle") || t.id.includes("talar_tilt") || t.id.includes("thompson_test") || t.id.includes("windlass") || t.id.includes("navicular") || t.id.includes("tinel_ankle") || t.id.includes("royal_london") || t.id.includes("ultt") || t.id.includes("femoral") || t.id.includes("single_leg") ? (
                      // Bilateral
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                        {["left","right"].map(side => {
                          const sideVal = data[t.id+"_"+side] || "";
                          const sidePos = isPositive(sideVal);
                          return (
                            <div key={side}>
                              <div style={{ fontSize:"0.65rem", fontWeight:700, color:sidePos ? C.red : C.muted, marginBottom:4 }}>{side.toUpperCase()} {sidePos && "⚠"}</div>
                              <select value={sideVal} onChange={e => setTestResult(t.id, side, e.target.value)}
                                style={{ width:"100%", background:C.s3, border:`1px solid ${sidePos ? C.red : C.border}`, borderRadius:7, color:C.text, padding:"7px 9px", fontSize:"0.76rem", outline:"none", fontFamily:"inherit" }}>
                                <option value="">— not tested —</option>
                                {t.options.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Single
                      <select value={singleVal} onChange={e => setTestResult(t.id, null, e.target.value)}
                        style={{ width:"100%", background:C.s3, border:`1px solid ${isPositive(singleVal) ? C.red : C.border}`, borderRadius:7, color:C.text, padding:"7px 9px", fontSize:"0.76rem", outline:"none", fontFamily:"inherit" }}>
                        <option value="">— not tested —</option>
                        {t.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        });
      })()}

      {/* MODAL */}
      {modalTest && (
        <div onClick={() => setModalTest(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:C.surface, border:`1px solid ${C.accent}40`, borderRadius:14, padding:24, maxWidth:560, width:"100%", maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
              <div>
                <div style={{ fontWeight:800, color:C.accent, fontSize:"1.05rem" }}>{modalTest.label}</div>
                <div style={{ fontSize:"0.72rem", color:C.muted, marginTop:3 }}>Structure: {modalTest.structure}</div>
                <div style={{ fontSize:"0.7rem", color:C.muted }}>Sensitivity: {modalTest.sensitivity} · Specificity: {modalTest.specificity}</div>
              </div>
              <button onClick={() => setModalTest(null)} style={{ background:"none", border:`1px solid ${C.border}`, color:C.muted, borderRadius:6, padding:"3px 9px", cursor:"pointer" }}>✕</button>
            </div>

            {/* Illustration */}
            <div style={{ background:C.s2, borderRadius:10, padding:12, marginBottom:14, textAlign:"center", border:`1px solid ${C.border}` }}>
              <div style={{ display:"inline-block", maxWidth:200 }}>
                {TEST_SVG[modalTest.id.replace("st_","")] || (
                  <svg viewBox="0 0 120 100" width="180" height="140">
                    <text x="50%" y="40%" textAnchor="middle" fontSize="32" fill={C.accent}>⚕</text>
                    <text x="50%" y="65%" textAnchor="middle" fontSize="11" fill={C.muted}>Clinical Illustration</text>
                    <text x="50%" y="78%" textAnchor="middle" fontSize="10" fill={C.muted}>{modalTest.label.split(" ").slice(0,3).join(" ")}</text>
                  </svg>
                )}
              </div>
            </div>

            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:"0.63rem", fontWeight:700, color:C.yellow, textTransform:"uppercase", letterSpacing:"1px", marginBottom:7 }}>👐 How to Perform</div>
              <div style={{ background:C.s2, borderRadius:8, padding:14, fontSize:"0.82rem", color:C.text, lineHeight:1.8 }}>{modalTest.how}</div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              <div style={{ background:"rgba(0,201,122,0.08)", border:"1px solid rgba(0,201,122,0.25)", borderRadius:8, padding:10 }}>
                <div style={{ fontSize:"0.63rem", fontWeight:700, color:C.green, textTransform:"uppercase", marginBottom:5 }}>✓ Negative</div>
                <div style={{ fontSize:"0.78rem", color:C.text, lineHeight:1.6 }}>{modalTest.negative}</div>
              </div>
              <div style={{ background:"rgba(255,77,109,0.08)", border:"1px solid rgba(255,77,109,0.25)", borderRadius:8, padding:10 }}>
                <div style={{ fontSize:"0.63rem", fontWeight:700, color:C.red, textTransform:"uppercase", marginBottom:5 }}>⚠ Positive</div>
                <div style={{ fontSize:"0.78rem", color:C.text, lineHeight:1.6 }}>{modalTest.positive}</div>
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:"0.63rem", fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>📊 Result Options</div>
              {modalTest.options.map((o, i) => (
                <div key={i} style={{ padding:"6px 10px", borderRadius:7, marginBottom:5, background:C.s2, border:`1px solid ${C.border}`, fontSize:"0.78rem", color:isPositive(o) ? C.red : C.text }}>
                  {isPositive(o) ? "⚠ " : "○ "}{o}
                </div>
              ))}
            </div>

            <button onClick={() => setModalTest(null)} style={{ width:"100%", padding:"9px", background:C.a2, border:"none", borderRadius:8, color:"#fff", fontWeight:700, cursor:"pointer" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// CYRIAX COMPLETE ASSESSMENT MODULE
// Full STTT • Active/Passive ROM • End-Feel • Resisted Tests • Joint Play
// Auto Clinical Reasoning • Tissue Diagnosis • Treatment Direction
// ═══════════════════════════════════════════════════════════════════════════

// ─── CYRIAX CORE DATA ────────────────────────────────────────────────────────

const CYRIAX_STTT_INTERPRETATION = {
  "Strong & Painless": {
    color:"#00c97a", icon:"✅",
    tissue:"Normal contractile tissue",
    meaning:"No lesion in the tested contractile unit. The muscle, musculotendinous junction, and tendon are intact and healthy. Look elsewhere for the pain source.",
    nextStep:"Test passive movements (inert tissue). If passive also normal, consider referred pain or visceral source.",
    dx:"Normal — no contractile lesion at this movement",
  },
  "Strong & Painful": {
    color:"#ffb300", icon:"⚠️",
    tissue:"Minor contractile lesion",
    meaning:"The contractile unit can generate near-normal force BUT the lesion is provoked by tension. Indicates MINOR lesion: partial muscle tear, tendinopathy, tenoperiosteal lesion, or musculotendinous junction injury. The structure is intact enough to generate force.",
    nextStep:"Palpate the exact site of lesion. Deep Transverse Friction Massage (DTFM) at the exact lesion site. Eccentric loading protocol.",
    dx:"Minor lesion of contractile tissue — tendinopathy / partial tear / tenoperiosteal",
  },
  "Weak & Painless": {
    color:"#7f5af0", icon:"⚡",
    tissue:"Neurological deficit OR complete rupture",
    meaning:"Cannot generate force AND no pain. Two possible causes: (1) Complete structural rupture (tendon/muscle torn completely — cannot generate force, no tissue left to be painful), OR (2) Neurological inhibition — nerve root lesion, peripheral nerve palsy, or UMN lesion. Must differentiate urgently.",
    nextStep:"Check dermatomes, myotomes, reflexes. If neurological: refer for nerve conduction study / MRI spine. If complete rupture: refer for imaging and surgical consultation.",
    dx:"Neurological deficit OR complete structural rupture — REFER for imaging",
  },
  "Weak & Painful": {
    color:"#ff4d6d", icon:"🚨",
    tissue:"Serious lesion — refer",
    meaning:"Cannot generate force AND painful. SERIOUS FINDING. May indicate: (1) Gross lesion with bleeding, (2) Acute complete rupture with surrounding tissue inflammation, (3) Neoplasm affecting contractile unit, (4) Fracture through muscle origin/insertion, (5) Significant nerve root compression with muscle involvement.",
    nextStep:"URGENT: Do NOT load or treat. Refer for imaging immediately (X-ray, MRI). Rule out fracture, neoplasm, acute complete rupture. Consider emergency referral.",
    dx:"SERIOUS LESION — URGENT IMAGING REFERRAL REQUIRED",
  },
};

const ENDFEEL_DATA = {
  "Bone-to-Bone (Hard)": { color:"#00c97a", normal:"Elbow extension, knee extension at limits", abnormal:"Elsewhere = osteophyte, loose body, myositis ossificans", tx:"Joint mobilisation, traction if OA" },
  "Tissue Approximation (Soft)": { color:"#00c97a", normal:"Elbow/knee flexion (soft tissue meets soft tissue)", abnormal:"If very mushy and boggy = oedema/effusion", tx:"Oedema management if abnormal" },
  "Capsular/Leathery": { color:"#ffb300", normal:"Normal capsular end-feel — firm, leathery", abnormal:"Premature capsular feel = capsulitis/fibrosis/OA", tx:"Grade III–IV joint mobilisation, sustained end-range stretching, heat" },
  "Springy/Rebound": { color:"#ff8c42", normal:"No normal joints", abnormal:"Always abnormal = loose body (OA fragment), torn meniscus, articular cartilage flap", tx:"Refer orthopaedic — may need arthroscopy" },
  "Empty (No End-Feel)": { color:"#ff4d6d", normal:"No normal joints", abnormal:"ALWAYS serious — pain stops movement before mechanical limit reached. Bursitis, neoplasm, abscess, fracture, psychogenic", tx:"REFER — serious pathology. Do NOT force range." },
  "Muscle Spasm": { color:"#ff4d6d", normal:"No normal joints", abnormal:"Acute inflammation, instability (body protective), nerve root irritation", tx:"Acute: PRICE, gentle Grade I–II mobilisation. Do NOT manipulate in spasm." },
};

const CAPSULAR_PATTERNS = {
  shoulder: { name:"Shoulder (GH)", pattern:"ER most limited > Abduction > IR", dx:"GH capsulitis / adhesive capsulitis / OA / post-surgical capsular fibrosis" },
  elbow: { name:"Elbow", pattern:"Flexion > Extension (both limited)", dx:"Elbow OA / post-fracture stiffness / capsulitis" },
  wrist: { name:"Wrist (radiocarpal)", pattern:"Flexion = Extension equally limited", dx:"Wrist OA / capsulitis / post-Colles fracture" },
  hip: { name:"Hip", pattern:"IR most limited = Flexion = Abduction", dx:"Hip OA / capsulitis / avascular necrosis" },
  knee: { name:"Knee (tibiofemoral)", pattern:"Flexion >> Extension", dx:"Knee OA / capsulitis / after immobilisation" },
  ankle: { name:"Ankle (talocrural)", pattern:"Plantarflexion > Dorsiflexion", dx:"Ankle OA / post-sprain capsulitis" },
  cervical: { name:"Cervical spine", pattern:"Side-flex equally both ways = Rotation = Flex/Ext (all equally limited)", dx:"Cervical OA / spondylosis / RA" },
  lumbar: { name:"Lumbar spine", pattern:"Side-flex both directions equally, Extension > Flexion", dx:"Lumbar OA / spondylosis / disc degeneration" },
};

// ─── CYRIAX REGION DATA ───────────────────────────────────────────────────────
const CYRIAX_REGIONS_DATA = {

  cervical: {
    label:"Cervical Spine", color:"#00e5ff", icon:"🔵",
    anatomy:"C1–C7 vertebrae. Inert structures: facet joint capsules, intervertebral discs, anterior/posterior longitudinal ligaments, alar/transverse ligaments (C1–C2), supraspinous/interspinous ligaments. Contractile: deep cervical flexors, sternocleidomastoid, scalenes, semispinalis, splenius, suboccipitals, trapezius.",
    capsularPattern:"All movements equally limited (side-flex > rotation > flex/ext). May be asymmetric in facet pathology.",
    activeROM:[
      { id:"cx_a_flex", label:"Flexion", normal:"80°", how:"Patient seated. Chin moves toward chest. Normal = chin-to-chest or ~80°. Note: pain on initiation vs end range. Painful arc (mid-range pain then eases) = disc." },
      { id:"cx_a_ext", label:"Extension", normal:"70°", how:"Look toward ceiling. Normal = 70°. Pain on extension = facet, posterior disc, foraminal stenosis." },
      { id:"cx_a_sfl", label:"Side Flex Left", normal:"45°", how:"Ear toward shoulder WITHOUT shoulder elevation. Normal = 45°. Limitation ipsilateral = disc, facet, scalene." },
      { id:"cx_a_sfr", label:"Side Flex Right", normal:"45°", how:"Ear toward right shoulder. Compare bilaterally. Asymmetry = unilateral lesion." },
      { id:"cx_a_rotl", label:"Rotation Left", normal:"80°", how:"Rotate chin toward left shoulder. Normal = 80°. Test specifically at full flex (FRT) to isolate C1/C2." },
      { id:"cx_a_rotr", label:"Rotation Right", normal:"80°", how:"Rotate chin toward right shoulder. If restricted only in rotation = upper cervical (C1/C2) pathology." },
    ],
    passiveROM:[
      { id:"cx_p_flex", label:"Passive Flexion", how:"Support head with both hands. Gently flex — feel for resistance and end-feel. Overpressure at end range. Compare active vs passive range.", endfeel_options:["Normal/Capsular","Muscle Spasm","Empty (No End-Feel)","Hard (Osteophyte)"] },
      { id:"cx_p_ext", label:"Passive Extension", how:"Support occiput, gently extend head on neck. Segmental PA pressure to feel stiff levels (C2–C7).", endfeel_options:["Normal/Capsular","Muscle Spasm","Hard (Osteophyte)","Springy/Rebound"] },
      { id:"cx_p_rot", label:"Passive Rotation (bilateral)", how:"Support head. Rotate fully each side. Note: total range, side-to-side difference, quality. Add overpressure to differentiate stiffness from pain.", endfeel_options:["Normal/Capsular","Muscle Spasm","Hard (Osteophyte)","Empty (No End-Feel)"] },
      { id:"cx_p_sfl", label:"Passive Side Flex", how:"Side-flex head gently toward shoulder. Overpressure at end range. Feel: spring (normal) vs wall (joint block) vs spasm (acute).", endfeel_options:["Normal/Capsular","Muscle Spasm","Hard (Osteophyte)","Springy/Rebound"] },
    ],
    resistedTests:[
      { id:"cx_r_flex", label:"Resisted Flexion", muscle:"SCM + deep neck flexors", how:"Patient seated. Place palm on forehead — patient flexes against resistance. No neck movement. Test bilaterally." },
      { id:"cx_r_ext", label:"Resisted Extension", muscle:"Semispinalis / splenius / suboccipitals", how:"Palm on occiput. Patient extends against resistance. No movement." },
      { id:"cx_r_sfl", label:"Resisted Side Flex L", muscle:"L scalenes / lateral flexors", how:"Palm on temporal region. Patient side-flexes left against resistance." },
      { id:"cx_r_sfr", label:"Resisted Side Flex R", muscle:"R scalenes / lateral flexors", how:"Palm on right temporal region. Patient side-flexes right." },
      { id:"cx_r_rotl", label:"Resisted Rotation L", muscle:"R SCM / L splenius", how:"Palm on left chin/jaw. Resist left rotation." },
      { id:"cx_r_rotr", label:"Resisted Rotation R", muscle:"L SCM / R splenius", how:"Palm on right chin/jaw. Resist right rotation." },
    ],
    jointPlay:[
      { id:"cx_jp_pa", label:"PA Central Pressure (C2–C7)", how:"Patient prone. Therapist thumbs on spinous process. Apply gentle PA (posterior-anterior) pressure. Note: stiffness, pain, level of restriction. Compare adjacent levels." },
      { id:"cx_jp_unilat", label:"Unilateral PA (C2–C7 facets)", how:"Thumbs on facet pillar (1–2cm lateral to spinous process). PA pressure to assess individual facet joint. Compare bilateral asymmetry at each level." },
      { id:"cx_jp_traction", label:"Manual Cervical Traction", how:"Supine. Cup occiput and chin. Apply gentle longitudinal traction. Positive if symptoms ease (indicates neural/disc compression)." },
    ],
    redFlags:["Bilateral arm symptoms", "Lower limb symptoms with cervical movement", "Drop attacks / dizziness (VBI)", "Severe sudden onset headache", "Progressive neurological deficit", "Bladder/bowel dysfunction"],
    differentials:["Cervical disc herniation", "Cervical facet syndrome", "Cervical spondylosis / OA", "Cervicogenic headache (C1/C2)", "Muscle strain", "Atlantoaxial instability (RA)", "Whiplash associated disorder", "Cervical radiculopathy"],
  },

  shoulder: {
    label:"Shoulder Complex", color:"#7f5af0", icon:"🟣",
    anatomy:"GH joint (capsule, labrum, IGHL, SGHL, MGHL), subacromial bursa, rotator cuff (supraspinatus, infraspinatus, teres minor, subscapularis), biceps long head tendon, AC joint, CC ligaments, acromial arch.",
    capsularPattern:"ER most limited > Abduction > IR. If all limited and proportional = adhesive capsulitis (frozen shoulder).",
    activeROM:[
      { id:"sh_a_flex", label:"Flexion", normal:"180°", how:"Arm forward elevation from side to full overhead. Note: painful arc (60–120° = impingement). Full painless = normal. Compensatory trunk lean = restricted." },
      { id:"sh_a_ext", label:"Extension", normal:"60°", how:"Arm behind body. Note any pain, restriction. Less clinically significant than other planes." },
      { id:"sh_a_abd", label:"Abduction", normal:"180°", how:"Arm elevation in frontal plane. Painful arc 60–120° = subacromial impingement. Pain at top = AC joint. Full restriction = capsular pattern." },
      { id:"sh_a_add", label:"Adduction", normal:"50°", how:"Arm crosses midline horizontally. Pain = AC joint or posterior capsule tightness." },
      { id:"sh_a_er", label:"External Rotation", normal:"90°", how:"Elbow at side, 90° flexion. Rotate forearm outward. Most restricted in frozen shoulder (capsular pattern). Compare bilaterally — GIRD assessment." },
      { id:"sh_a_ir", label:"Internal Rotation", normal:"70°", how:"Elbow at side, rotate forearm inward. Also test via Apley's scratch (hand up back). IR restricted = posterior capsule (GIRD) or frozen shoulder." },
      { id:"sh_a_scaption", label:"Scaption (scapular plane)", normal:"180°", how:"Elevation in scapular plane (30° forward of frontal). Most comfortable plane — tests supraspinatus in optimal line of pull." },
    ],
    passiveROM:[
      { id:"sh_p_er", label:"Passive ER", how:"Elbow at side, 90° flex. Stabilise scapula (critical). Passively rotate forearm outward to end-feel. MOST restricted in capsular pattern. Overpressure carefully.", endfeel_options:["Normal/Capsular (firm leathery)","Muscle Spasm","Empty (No End-Feel)","Hard (Osteophyte)"] },
      { id:"sh_p_abd", label:"Passive Abduction", how:"Stabilise scapula. Passively abduct. Note: range, pain reproduction, end-feel. Painful arc in passive = inert structure (bursa, capsule). No painful arc passive = contractile (tendon).", endfeel_options:["Normal/Capsular","Muscle Spasm","Springy/Rebound","Empty (No End-Feel)"] },
      { id:"sh_p_flex", label:"Passive Flexion", how:"Passively elevate arm in sagittal plane. Stabilise scapula to isolate GH contribution. Overpressure at end range — reproduce impingement.", endfeel_options:["Normal/Capsular","Muscle Spasm","Hard (Bone-to-Bone)","Empty (No End-Feel)"] },
      { id:"sh_p_ir", label:"Passive IR", how:"At 0° abd: measure IR. At 90° abd: measure GIRD (posterior capsule). Note side-to-side difference. >18° deficit at 90° = GIRD = posterior capsule contracture.", endfeel_options:["Normal/Capsular","Muscle Spasm","Hard (Bone-to-Bone)"] },
      { id:"sh_p_horiz_add", label:"Passive Horizontal Adduction", how:"Arm at 90° flex. Cross arm across body horizontally. Pain at shoulder top = AC joint. Overpressure provokes AC joint. Also posterior GH capsule stretching.", endfeel_options:["Normal/Capsular","Muscle Spasm","Hard","Springy/Rebound"] },
    ],
    resistedTests:[
      { id:"sh_r_abd", label:"Resisted Abduction (Supraspinatus)", muscle:"Supraspinatus / middle deltoid", how:"Arm at 0–30° abduction. Apply downward resistance at distal humerus. KEY TEST — most diagnostically important shoulder resisted test." },
      { id:"sh_r_er", label:"Resisted ER (Infraspinatus)", muscle:"Infraspinatus / teres minor", how:"Elbow 90° at side. Resist external rotation. Compare bilaterally. Test at 0° and 90° abduction." },
      { id:"sh_r_ir", label:"Resisted IR (Subscapularis)", muscle:"Subscapularis", how:"Elbow 90° at side. Resist internal rotation. Also: lift-off test, belly press for subscapularis isolation." },
      { id:"sh_r_flex", label:"Resisted Flexion (Biceps / Ant Deltoid)", muscle:"Biceps LH / anterior deltoid", how:"Arm at 60° flex, elbow extended, forearm supinated. Resist forward flexion. Bicipital groove pain = biceps LH lesion." },
      { id:"sh_r_elbow_flex", label:"Resisted Elbow Flexion (Biceps LH)", muscle:"Biceps long head", how:"Elbow 90°, forearm supinated. Resist flexion. Pain at bicipital groove = biceps LH tendinopathy. Combined with Speed's test." },
      { id:"sh_r_elbow_ext", label:"Resisted Elbow Extension", muscle:"Triceps", how:"Elbow 30° flex. Resist extension. Rarely positive at shoulder — if positive = posterior shoulder involvement." },
    ],
    jointPlay:[
      { id:"sh_jp_inferior", label:"Inferior GH Glide", how:"Patient supine, arm at side. Stabilise acromion. Translate humeral head INFERIORLY. Normal = 1–2 fingers. Restricted = inferior capsule (frozen shoulder). Tests IGHL." },
      { id:"sh_jp_posterior", label:"Posterior GH Glide", how:"Patient supine. Push humeral head POSTERIORLY into glenoid. Tests posterior capsule. Restricted = internal rotation deficit (GIRD). Release = impingement treatment." },
      { id:"sh_jp_anterior", label:"Anterior GH Glide", how:"Patient sidelying or supine. Translate humeral head ANTERIORLY. Restricted = limited ER (anterior capsule). Excessive = anterior instability." },
      { id:"sh_jp_ac", label:"AC Joint Accessory Motion", how:"Stabilise clavicle. Apply PA and superior-inferior glide to acromion. Pain/restriction = AC joint pathology. Reproduce with cross-arm adduction." },
    ],
    redFlags:["Severe restriction — no active movement at all", "Bilateral shoulder restriction (think RA, polymyalgia)", "Constant pain at rest with no movement", "Axillary mass", "Rapid progression of all ROM restriction"],
    differentials:["Rotator cuff tendinopathy", "Rotator cuff tear (partial/complete)", "Adhesive capsulitis (frozen shoulder)", "Subacromial bursitis", "Biceps LH tendinopathy", "SLAP lesion", "AC joint OA / sprain", "GH instability", "Glenohumeral OA", "Calcific tendinopathy", "Cervical radiculopathy (referred)"],
  },

  elbow: {
    label:"Elbow & Forearm", color:"#ff9a9e", icon:"🩷",
    anatomy:"Radioulnar joint, humeroradial joint, humeroulnar joint. Inert: medial collateral lig (UCL), lateral collateral lig (LCL), annular ligament, capsule. Contractile: biceps, brachialis, triceps, brachioradialis, wrist extensors (ECRB/ECRL/ECU), wrist flexors (FCR/FCU), pronator teres, supinator.",
    capsularPattern:"Flexion > Extension (both limited, flexion more so). Loss of full extension = OA, post-fracture, heterotopic ossification.",
    activeROM:[
      { id:"el_a_flex", label:"Flexion", normal:"145°", how:"Bend elbow from full extension. Normal = 145°. Note pain at: initiation (posterior impingement), mid-range, end range (anterior impingement). Restriction = OA, contracture, effusion." },
      { id:"el_a_ext", label:"Extension", normal:"0°", how:"Full extension from flexion. Hyperextension normal in females (-5 to -10°). Loss of full extension = earliest sign of elbow OA or effusion (capsular pattern)." },
      { id:"el_a_pro", label:"Pronation", normal:"85°", how:"Elbow 90°, thumb up start. Rotate palm DOWN. Normal = 85°. Limited = radioulnar joint, pronator teres lesion." },
      { id:"el_a_sup", label:"Supination", normal:"90°", how:"Rotate palm UP from neutral. Normal = 90°. Limited = biceps, supinator, radioulnar joint." },
    ],
    passiveROM:[
      { id:"el_p_flex", label:"Passive Flexion", how:"Passively flex elbow to end-feel. Tissue approximation (forearm to biceps) = normal. Premature capsular end-feel = OA/capsulitis.", endfeel_options:["Tissue Approximation (normal)","Capsular/Leathery","Muscle Spasm","Springy/Rebound","Hard (Bone-to-Bone)"] },
      { id:"el_p_ext", label:"Passive Extension", how:"Passively extend to end-feel. Hard end-feel at 0° = normal (olecranon in fossa). Hard end-feel before 0° = osteophyte/loose body. Soft end-feel = effusion.", endfeel_options:["Bone-to-Bone (normal at 0°)","Springy/Rebound (loose body)","Capsular (early = OA)","Muscle Spasm","Empty (No End-Feel)"] },
      { id:"el_p_ovpres", label:"Overpressure Assessment", how:"At end of passive ROM, apply gentle overpressure. Pain with overpressure = inert structure pain positive. Note: direction and quality of resistance.", endfeel_options:["No pain with overpressure","Pain at end range with overpressure","Pain before end range","Abnormal springy rebound"] },
    ],
    resistedTests:[
      { id:"el_r_flex", label:"Resisted Elbow Flexion", muscle:"Biceps / brachialis / brachioradialis", how:"Elbow 90°, forearm supinated. Resist flexion. Pain at bicipital region = biceps. Supinated vs pronated position differentiates biceps vs brachialis." },
      { id:"el_r_ext", label:"Resisted Elbow Extension", muscle:"Triceps", how:"Elbow 30° flex. Resist extension. Pain posterior elbow = triceps lesion (insertion on olecranon). Weak = C7 radiculopathy." },
      { id:"el_r_pro", label:"Resisted Pronation", muscle:"Pronator teres / pronator quadratus", how:"Elbow 90°, neutral. Resist pronation. Pain medial elbow = medial epicondylalgia / pronator teres lesion." },
      { id:"el_r_sup", label:"Resisted Supination", muscle:"Supinator / biceps", how:"Elbow 90°, pronated. Resist supination. Pain lateral elbow = lateral epicondylalgia (supinator contribution) or biceps insertion." },
      { id:"el_r_wext", label:"Resisted Wrist Extension", muscle:"ECRB / ECRL / ECU", how:"MOST IMPORTANT ELBOW TEST. Resist wrist extension with elbow in extension AND then in flexion. Pain at lateral epicondyle = ECRB tendinopathy (tennis elbow). Fist clenched increases sensitivity." },
      { id:"el_r_wflex", label:"Resisted Wrist Flexion", muscle:"FCR / FCU / palmaris longus", how:"Resist wrist flexion. Pain at medial epicondyle = medial epicondylalgia (golfer's elbow). Test FCR vs FCU by ulnar/radial deviation addition." },
      { id:"el_r_grip", label:"Resisted Grip Strength", muscle:"Forearm flexors", how:"Patient squeezes dynamometer or therapist's fingers. Compare bilaterally. Grip strength reduced = lateral epicondylalgia (pain inhibition) or C8/T1 radiculopathy." },
    ],
    jointPlay:[
      { id:"el_jp_medial", label:"Medial Traction / Valgus Glide", how:"Elbow 20° flex. Apply valgus force (medial joint gap). Tests UCL. >5mm gap or pain = UCL sprain." },
      { id:"el_jp_lateral", label:"Lateral Traction / Varus Glide", how:"Elbow 20° flex. Apply varus force (lateral gap). Tests LCL. Less commonly injured." },
      { id:"el_jp_radial_head", label:"Radial Head Accessory Motion", how:"Elbow 90°. Palpate radial head anterolaterally. Apply PA and anterior-posterior glide to radial head. Restricted = radioulnar or radiocapitellar OA." },
    ],
    redFlags:["Severe acute elbow swelling post-trauma", "Cannot extend — suspect intra-articular fracture", "Progressive weakness of grip", "Bilateral elbow restriction (think RA, haemophilia)"],
    differentials:["Lateral epicondylalgia (ECRB tendinopathy)", "Medial epicondylalgia (FCR/FCU)", "Biceps tendinopathy/rupture", "Elbow OA", "Olecranon bursitis", "UCL sprain", "Cubital tunnel syndrome (ulnar nerve)", "Radial tunnel syndrome", "C6/C7 radiculopathy (referred)"],
  },

  wrist_hand: {
    label:"Wrist & Hand", color:"#80deea", icon:"🤚",
    anatomy:"Radiocarpal, midcarpal, CMC, MCP, PIP, DIP joints. Inert: radiocarpal ligaments, UCL/RCL, TFCC, scapholunate ligament, CMC ligaments. Contractile: wrist extensors/flexors, finger extensors/flexors, intrinsics.",
    capsularPattern:"Radiocarpal: Flex = Extension equally limited. 1st CMC: Abduction > Extension.",
    activeROM:[
      { id:"wr_a_flex", label:"Wrist Flexion", normal:"80°", how:"From neutral, flex wrist. Normal = 80°. Compare bilaterally. Restriction = radiocarpal capsulitis, post-fracture." },
      { id:"wr_a_ext", label:"Wrist Extension", normal:"70°", how:"From neutral, extend wrist. Normal = 70°. Most commonly restricted after Colles fracture." },
      { id:"wr_a_ud", label:"Ulnar Deviation", normal:"30°", how:"Deviate toward ulnar side. Normal = 30°. TFCC pain = ulnar deviation loaded." },
      { id:"wr_a_rd", label:"Radial Deviation", normal:"20°", how:"Deviate toward radial side. Normal = 20°. Pain = De Quervain's (test with Finkelstein's). Restricted = radiocarpal OA." },
      { id:"wr_a_grip", label:"Grip Strength", normal:"Bilateral symmetric", how:"Compare bilateral grip strength (dynamometer or manual test). Reduced grip = lateral epicondylalgia, carpal tunnel, C8 radiculopathy, or pain inhibition." },
    ],
    passiveROM:[
      { id:"wr_p_flex", label:"Passive Wrist Flex", how:"Passively flex wrist to end-feel. Overpressure at end range. Increased pain vs active = inert structure (capsule, ligament).", endfeel_options:["Normal/Capsular","Muscle Spasm","Hard (Bone-to-Bone)","Springy/Rebound","Empty (No End-Feel)"] },
      { id:"wr_p_ext", label:"Passive Wrist Ext", how:"Passively extend to end-feel. Overpressure for inert pain.", endfeel_options:["Normal/Capsular","Hard (Bone-to-Bone)","Muscle Spasm","Springy/Rebound"] },
    ],
    resistedTests:[
      { id:"wr_r_ext", label:"Resisted Wrist Extension", muscle:"ECRB / ECRL / ECU", how:"Resist wrist extension from neutral. Pain lateral elbow = ECRB (lateral epicondylalgia). Pain dorsal wrist = local wrist extensor pathology." },
      { id:"wr_r_flex", label:"Resisted Wrist Flexion", muscle:"FCR / FCU", how:"Resist wrist flexion. Pain medial elbow = medial epicondylalgia. Pain ventral wrist = FCR/FCU lesion at wrist level." },
      { id:"wr_r_thumb_ext", label:"Resisted Thumb Extension", muscle:"EPL / EPB", how:"Resist thumb extension. Pain at 1st dorsal compartment = De Quervain's. Positive with Finkelstein's confirms." },
      { id:"wr_r_thumb_abd", label:"Resisted Thumb Abduction", muscle:"APL", how:"Resist thumb abduction. Pain at 1st dorsal compartment = De Quervain's (APL component)." },
      { id:"wr_r_fing_flex", label:"Resisted Finger Flexion", muscle:"FDS / FDP", how:"Resist finger flexion at DIP (FDP) and PIP (FDS). Weakness = C8 radiculopathy or tendon rupture." },
      { id:"wr_r_fing_ext", label:"Resisted Finger Extension", muscle:"EDC / EI / EDM", how:"Resist finger extension. Weakness = posterior interosseous nerve palsy (radial nerve branch)." },
    ],
    jointPlay:[
      { id:"wr_jp_radio", label:"Radiocarpal PA/AP Glide", how:"Stabilise radius. Translate carpal bones PA (toward dorsum) and AP (toward palm). Restricted = capsulitis. Hypermobile = instability. Compare bilaterally." },
      { id:"wr_jp_midcarpal", label:"Midcarpal Glide", how:"Stabilise proximal row. Translate distal row. Restricted = midcarpal OA or post-fracture. Pain = midcarpal instability." },
      { id:"wr_jp_tfcc", label:"TFCC Stress Test", how:"Stabilise radius. Apply ulnar compression through lunate toward TFCC. Pain at ulnar wrist = TFCC pathology. Confirm with passive ulnar deviation load." },
    ],
    redFlags:["Rapidly progressive hand weakness", "Bilateral hand weakness (think RA, myelopathy)", "Loss of 2-point discrimination", "Trophic changes"],
    differentials:["Carpal tunnel syndrome (median N)", "De Quervain's tenosynovitis", "TFCC tear", "Scapholunate instability", "Radiocarpal OA", "Dupuytren's contracture", "Trigger finger", "1st CMC OA", "Lateral/medial epicondylalgia (referred wrist pain)"],
  },

  lumbar: {
    label:"Lumbar Spine", color:"#ff6b35", icon:"🟠",
    anatomy:"L1–L5 vertebrae. Inert: disc (nucleus pulposus, annulus fibrosus), facet joint capsules, ALL, PLL, ligamentum flavum, interspinous/supraspinous ligaments, SIJ. Contractile: erector spinae, multifidus, QL, psoas, abdominals, gluteals (indirect).",
    capsularPattern:"Side-flex equally limited both ways, Extension > Flexion. Severe: all movements limited = OA / spondylosis.",
    activeROM:[
      { id:"lu_a_flex", label:"Flexion", normal:"90°", how:"Patient stands. Bends forward. OBSERVE: where does movement initiate — hip or lumbar? Lateral trunk shift? Normal = sequential lumbar flexion + hip flexion. Painful arc mid-range = disc. Restriction = disc, facet, or muscle. Measure with Schober test (mark L5 and 10cm above — normal = ≥5cm increase)." },
      { id:"lu_a_ext", label:"Extension", normal:"30°", how:"Extend lumbar spine. Support at ASIS. Pain = facet loading, spondylolysis, spinal stenosis. Relieves = disc herniation (posteriorly). Compare McKenzie assessment direction of preference." },
      { id:"lu_a_sfl", label:"Side Flex Left", normal:"40°", how:"Slide hand down lateral thigh. Normal = 40°. Restriction + ipsilateral pain = facet, lateral disc. Restriction + contralateral pain = disc herniation (nerve root tension)." },
      { id:"lu_a_sfr", label:"Side Flex Right", normal:"40°", how:"As above to right. Compare sides — asymmetry = unilateral lesion." },
      { id:"lu_a_rotl", label:"Rotation Left (standing)", normal:"45°", how:"Hands on hips. Rotate trunk. Limited rotation = facet, disc, thoracolumbar restriction. Assess thoracic contribution." },
      { id:"lu_a_rotr", label:"Rotation Right", normal:"45°", how:"As above to right. Asymmetric = ipsilateral facet or disc." },
    ],
    passiveROM:[
      { id:"lu_p_flex", label:"Passive Trunk Flexion", how:"Patient supine. Bring knees to chest (passive lumbar flexion). Assess end-feel. Add Slump for neural tension. Compare active vs passive.", endfeel_options:["Normal/Capsular","Muscle Spasm","Empty (No End-Feel)","Hard (Osteophyte)"] },
      { id:"lu_p_ext", label:"Passive Extension (prone press-up)", how:"Patient prone. Press up on arms (sphinx position). Allow lumbar to extend passively. McKenzie extension movement. Pain behaviour with extension = directional preference.", endfeel_options:["Normal/Capsular","Muscle Spasm","Springy/Rebound","Hard"] },
      { id:"lu_p_rotation", label:"Passive Rotation in Sidelying", how:"Sidelying, hips/knees 90°. Rotate trunk by moving top shoulder posteriorly while stabilising pelvis. Segmental rotation mobilisation. End-feel at each level.", endfeel_options:["Normal/Capsular","Muscle Spasm","Hard (Osteophyte)","Empty"] },
      { id:"lu_p_pa_spring", label:"Passive PA Pressure (Spring Test)", how:"Patient prone. Therapist thumbs on spinous process. Apply PA pressure each level L1–L5. Assess: pain, stiffness, quality of spring. Grade each level: (0) rigid, (1) stiff, (2) normal, (3) hypermobile. Note which level most painful/stiff.", endfeel_options:["Normal spring","Stiff — hypomobile","Rigid — severe restriction","Hypermobile — unstable","Painful — local segment","Painful — referred"] },
    ],
    resistedTests:[
      { id:"lu_r_flex", label:"Resisted Trunk Flexion", muscle:"Rectus abdominis / psoas", how:"Patient supine, knees bent. Resist curl-up. Pain = anterior abdominal/psoas lesion. Weakness = nerve root or serious lesion." },
      { id:"lu_r_ext", label:"Resisted Trunk Extension", muscle:"Erector spinae / multifidus", how:"Patient prone. Resist trunk extension. Pain = erector spinae / multifidus lesion. Weakness = L3–L5 radiculopathy." },
      { id:"lu_r_sfl", label:"Resisted Side Flex", muscle:"QL / lateral trunk", how:"Standing. Resist side-flex each direction. Pain ipsilateral = QL/lateral flexor lesion." },
      { id:"lu_r_hip_flex", label:"Resisted Hip Flexion", muscle:"Iliopsoas", how:"Supine, hip 90°. Resist hip flexion. Pain = iliopsoas lesion. Weakness = L2/3 radiculopathy." },
      { id:"lu_r_hip_abd", label:"Resisted Hip Abduction", muscle:"Gluteus medius / TFL", how:"Sidelying. Resist hip abduction. Weak+painful = gluteus medius lesion, trochanteric bursitis. Weak+painless = L4 radiculopathy or nerve injury." },
      { id:"lu_r_hip_ext", label:"Resisted Hip Extension", muscle:"Gluteus maximus / hamstrings", how:"Prone. Resist hip extension with knee bent (reduces hamstring) then extended (adds hamstring). Compare which more painful." },
    ],
    jointPlay:[
      { id:"lu_jp_pa", label:"PA Central Pressure (L1–L5)", how:"Prone. Thumbs on spinous process each level L1–L5. Apply firm PA pressure. Grade stiffness 0–3. Note pain quality and level. Most painful + stiffest = symptomatic level." },
      { id:"lu_jp_unilat", label:"Unilateral PA (Facet)", how:"Thumbs on mammary bodies (2cm lateral to spinous process). Apply PA pressure. Pain = ipsilateral facet pathology. Compare bilaterally. Asymmetric = unilateral facet involvement." },
      { id:"lu_jp_traction", label:"Lumbar Traction Assessment", how:"Supine. Stabilise pelvis with belt. Apply manual traction through legs. Positive if symptoms ease = neural/disc decompression response. Guides traction treatment decisions." },
    ],
    redFlags:["Bilateral leg symptoms", "Saddle anaesthesia (URGENT — cauda equina)", "Bladder/bowel dysfunction (URGENT)", "Night pain at rest", "Age <20 or >55 first episode", "Bilateral SLR positive"],
    differentials:["Lumbar disc herniation (L4/5 or L5/S1 most common)", "Lumbar facet syndrome", "Lumbar spinal stenosis", "Spondylolysis / spondylolisthesis", "Sacroiliac joint dysfunction", "Piriformis syndrome", "Lumbar muscle strain / sprain", "Lumbar OA / spondylosis", "Discogenic low back pain"],
  },

  hip: {
    label:"Hip Joint", color:"#00c97a", icon:"🟢",
    anatomy:"Ball-and-socket joint. Inert: hip capsule (iliofemoral, pubofemoral, ischiofemoral ligaments), acetabular labrum. Contractile: hip flexors (iliopsoas, rectus femoris, sartorius), extensors (gluteus maximus, hamstrings), abductors (gluteus medius/minimus, TFL), adductors, ER (piriformis, obturators, gemellus, quadratus femoris), IR (TFL, glute med anterior).",
    capsularPattern:"IR most limited = Flexion = Abduction. In advanced OA: all severely restricted.",
    activeROM:[
      { id:"hip_a_flex", label:"Flexion", normal:"120°", how:"Supine. Bring knee to chest. Normal = 120–130°. Restriction = capsulitis, OA, psoas tightness. Pain anterior = FAI, labral." },
      { id:"hip_a_ext", label:"Extension", normal:"30°", how:"Prone or standing (Thomas test reference position). Hip extension. Tight = iliopsoas. Measure with Thomas test for accurate reading." },
      { id:"hip_a_abd", label:"Abduction", normal:"45°", how:"Supine. Stabilise pelvis. Abduct leg. Normal = 45°. Restriction = adductor tightness, hip OA (capsular). Pain = IT band, greater trochanter." },
      { id:"hip_a_add", label:"Adduction", normal:"30°", how:"Leg crosses midline. Pain = adductor strain, medial groin. Restriction = LL fascial, hip capsule." },
      { id:"hip_a_er", label:"External Rotation", normal:"45°", how:"Prone, knee bent 90°. Foot falls inward (ER). Normal = 45°. Restriction = posterior capsule, piriformis tight." },
      { id:"hip_a_ir", label:"Internal Rotation", normal:"45°", how:"Prone, knee bent. Foot falls outward (IR). Normal = 45°. MOST RESTRICTED in hip OA (capsular pattern). <35° = high LBP risk (kinetic chain). Asymmetry = unilateral capsular problem." },
    ],
    passiveROM:[
      { id:"hip_p_ir", label:"Passive IR", how:"Prone, knee 90°. Passively IR hip. Assess range + end-feel + pain at end range. MOST restricted in capsular pattern.", endfeel_options:["Normal/Capsular","Muscle Spasm","Hard (Osteophyte — OA)","Empty (No End-Feel)"] },
      { id:"hip_p_flex", label:"Passive Flexion + Overpressure", how:"Supine. Passively flex hip maximally. Add overpressure. FADIR addition: adduct + IR at end flex = FAI/labral screen.", endfeel_options:["Normal/Capsular","Springy/Rebound","Hard (OA/osteophyte)","Muscle Spasm","Empty"] },
      { id:"hip_p_abd", label:"Passive Abduction", how:"Supine, stabilise pelvis. Passively abduct. Early restriction = adductor tightness or capsular pattern. Late pain = trochanteric bursitis.", endfeel_options:["Normal/Capsular (firm at end range)","Muscle Spasm","Springy/Rebound","Hard"] },
      { id:"hip_p_ext", label:"Passive Extension (Thomas)", how:"Thomas test position: contralateral hip fully flexed. Passively lower test hip into extension. Note: angle from horizontal = iliopsoas length. Knee extension = rectus femoris.", endfeel_options:["Normal/Capsular","Muscle Spasm","Hard","Springy/Rebound"] },
    ],
    resistedTests:[
      { id:"hip_r_flex", label:"Resisted Hip Flexion", muscle:"Iliopsoas (primary)", how:"Supine, hip 90°. Resist flexion. Pain anterior hip = iliopsoas lesion. Weakness = L2/3 radiculopathy. Combine with FABER for differentiation." },
      { id:"hip_r_ext", label:"Resisted Hip Extension", muscle:"Gluteus maximus / hamstrings", how:"Prone. Resist hip extension knee bent (isolates glute max) then knee extended (adds hamstrings). Observe FIRING ORDER — glute should fire first." },
      { id:"hip_r_abd", label:"Resisted Abduction", muscle:"Gluteus medius / TFL", how:"Sidelying. Resist abduction. Painful + weak = glute med lesion or trochanteric bursitis. Painless + weak = L4 root or nerve injury. Observe for TFL compensation." },
      { id:"hip_r_add", label:"Resisted Adduction", muscle:"Adductor group (longus, brevis, magnus)", how:"Supine. Resist adduction with knees straight. Pain medial groin = adductor lesion (origin at pubic ramus). Groin strain = strong painful. Complete rupture = weak painful." },
      { id:"hip_r_er", label:"Resisted ER", muscle:"Piriformis / obturators / gemellus", how:"Prone, knee 90°. Resist ER (push foot medially). Pain deep buttock = piriformis lesion. Compare bilaterally." },
      { id:"hip_r_ir", label:"Resisted IR", muscle:"TFL / anterior glute med", how:"Prone, knee 90°. Resist IR (push foot laterally). Less commonly isolated clinically. Weakness = L5 or sciatic nerve." },
    ],
    jointPlay:[
      { id:"hip_jp_long", label:"Longitudinal Traction", how:"Patient supine. Grip distal thigh. Apply sustained traction along femoral shaft toward foot. Relief of pain = intra-articular (OA, capsular). Guides traction and mobilisation treatment." },
      { id:"hip_jp_lateral", label:"Lateral Traction (Distraction)", how:"Strap around proximal thigh. Apply lateral distraction (strap pulling laterally while stabilising pelvis). Positive = intra-articular symptoms ease = hip joint compression driving symptoms." },
      { id:"hip_jp_posterior", label:"Posterior Glide of Femoral Head", how:"Supine, hip 90°. Apply PA pressure through distal femur. Posterior glide of femoral head in acetabulum. Restricted = anterior capsule. Used in Grade III–IV mobilisation for hip IR." },
    ],
    redFlags:["Severe restriction all directions (think fracture, tumour, infection)", "Night pain at rest (neoplasm)", "Avascular necrosis risk (sickle cell, prolonged steroid use)", "Limp in child — refer same day (Perthes / SUFE)"],
    differentials:["Hip OA", "FAI (femoroacetabular impingement)", "Hip labral tear", "Greater trochanteric pain syndrome (bursitis/glute tendinopathy)", "Adductor strain", "Iliopsoas tendinopathy", "Avascular necrosis", "SIJ referral to hip", "Lumbar referred pain (L2/L3)", "Meralgia paraesthetica (lateral femoral cutaneous nerve)"],
  },

  knee: {
    label:"Knee", color:"#ffb300", icon:"🟡",
    anatomy:"Tibiofemoral (medial + lateral compartments), patellofemoral, superior tibiofibular joints. Inert: ACL, PCL, MCL, LCL, menisci (medial + lateral), capsule, patellar retinaculum, fat pad, bursae. Contractile: quadriceps (VMO, VL, VM, RF), hamstrings (medial + lateral), popliteus, gastrocnemius, popliteal tendons.",
    capsularPattern:"Flexion >> Extension (significant flexion restriction with comparatively less extension loss). In severe OA = both significantly restricted.",
    activeROM:[
      { id:"kn_a_flex", label:"Flexion", normal:"140°", how:"Active flexion. Heel to buttock. Normal = 140°. Restricted = OA, effusion (capsular), quad tightness, posterior capsule. Painful arc = meniscal impingement at specific range." },
      { id:"kn_a_ext", label:"Extension", normal:"0°", how:"Full extension from flexed. Hyperextension = 5–10° in females. Loss of full extension = EARLIEST OA sign (capsular pattern), effusion, or ACL injury (pivot shift block). Extensor lag = patella tendon or quad rupture." },
      { id:"kn_a_stair", label:"Stair/Step Assessment", normal:"Pain free", how:"Patient performs step-up/step-down. Observe: knee valgus, pelvic drop, trunk lean. Stair descent more provocative than ascent for PF joint." },
      { id:"kn_a_squat", label:"Squat Assessment", normal:"Full depth, symmetric", how:"Functional ROM test. Note: depth achieved, pain location, compensations (valgus, heel rise, trunk lean). Correlates with daily function." },
    ],
    passiveROM:[
      { id:"kn_p_flex", label:"Passive Flexion", how:"Supine. Passively flex knee maximally. Tissue approximation normal end-feel. Premature capsular = OA. Springy = meniscal block.", endfeel_options:["Tissue Approximation (normal)","Capsular/Leathery (OA)","Springy/Rebound (meniscal block)","Muscle Spasm","Hard (osteophyte/loose body)","Empty (No End-Feel)"] },
      { id:"kn_p_ext", label:"Passive Extension", how:"Passively extend from flexion. Hard end-feel at 0° = normal. Hard before 0° = osteophyte. Springy before 0° = loose body/meniscal block. Capsular before 0° = OA.", endfeel_options:["Hard (normal at 0°)","Springy/Rebound (loose body — before 0°)","Capsular (OA — before 0°)","Muscle Spasm","Empty (No End-Feel)"] },
      { id:"kn_p_ir_er", label:"Tibial Rotation (at 90°)", how:"Knee at 90°. Passively rotate tibia IR and ER. Normal IR = 20–30°, ER = 30–40°. Restricted IR = biceps femoris, LCL. Restricted ER = MCL, medial capsule. Pain = meniscal.", endfeel_options:["Normal/Capsular","Muscle Spasm","Hard","Springy/Rebound"] },
      { id:"kn_p_patellar", label:"Patellar Mobility", how:"Knee extended, relaxed. Glide patella: (1) medially (restricted = tight lateral retinaculum), (2) laterally (restricted = medial retinaculum), (3) superiorly, (4) inferiorly. Tilt medial edge (lateral retinaculum tightness = cannot tilt ≥0°). Crepitus with passive movement = PFPS/chondromalacia.", endfeel_options:["Normal mobility","Lateral bias (tight lateral retinaculum)","Medial bias","Hypermobile (MPFL laxity)","Crepitus with movement"] },
    ],
    resistedTests:[
      { id:"kn_r_ext", label:"Resisted Knee Extension", muscle:"Quadriceps / patellar tendon", how:"Seated, knee 90°. Resist extension. Pain at patellar tendon = patellar tendinopathy. Pain at tibial tuberosity (adolescent) = Osgood-Schlatter. Weakness = L3/4 radiculopathy. VMO timing test: feel VMO vs VL — does VMO activate simultaneously?" },
      { id:"kn_r_flex", label:"Resisted Knee Flexion", muscle:"Hamstrings", how:"Prone, knee 90°. Resist flexion. Pain at posterior thigh = hamstring proximal origin. Pain at fibular head (lateral) = biceps femoris. Pain posterior knee = popliteal tendon." },
      { id:"kn_r_flex_ir", label:"Resisted Flexion + IR (medial hamstrings)", muscle:"Semimembranosus / semitendinosus", how:"Prone. Resist flexion + IR. Pain medial joint line = medial hamstring insertion lesion (semimembranosus). Differentiates medial vs lateral hamstring." },
      { id:"kn_r_flex_er", label:"Resisted Flexion + ER (biceps femoris)", muscle:"Biceps femoris", how:"Prone. Resist flexion + ER. Pain lateral joint line / fibular head = biceps femoris tendinopathy." },
    ],
    jointPlay:[
      { id:"kn_jp_tib_fem", label:"Tibiofemoral Distraction / AP Glide", how:"Patient supine, knee 30° flex. Traction tibia longitudinally. Then AP (anterior) glide: stabilise femur, translate tibia anteriorly (tests ACL). PA (posterior) glide: translate tibia posteriorly (tests PCL)." },
      { id:"kn_jp_medial_lat", label:"Medial/Lateral Compartment Distraction", how:"Apply valgus (opens medial) and varus (opens lateral) force at 0° and 30°. At 30° = isolates MCL/LCL. At 0° = also tests PCL/posterior capsule. Grade laxity 1–3." },
      { id:"kn_jp_superior_tib", label:"Superior Tibiofibular Joint", how:"Stabilise tibia. Translate fibular head anteriorly and posteriorly. Pain or restriction = superior tibiofibular joint pathology (can refer to lateral knee and ankle)." },
    ],
    redFlags:["Severe acute swelling post-trauma (haemarthrosis)", "Locked knee — cannot extend at all", "Posterior knee swelling + DVT risk factors", "Child/adolescent — growing pains vs tumour"],
    differentials:["Patellofemoral pain syndrome (PFPS)", "Patellar tendinopathy", "IT band friction syndrome", "Medial meniscal tear", "Lateral meniscal tear", "ACL insufficiency", "MCL sprain", "Knee OA (medial/lateral compartment)", "Infrapatellar fat pad impingement", "Prepatellar bursitis", "Popliteal cyst (Baker's cyst)", "L3/L4 radiculopathy (referred)"],
  },

  ankle_foot: {
    label:"Ankle & Foot", color:"#a8ff3e", icon:"🟢",
    anatomy:"Talocrural (ankle), subtalar (STJ), midtarsal (Chopart's), tarsometatarsal (Lisfranc's), MTP, IP joints. Inert: ATFL, CFL, PTFL (lateral), deltoid (medial), AITFL (syndesmosis), plantar fascia, spring ligament. Contractile: gastrocnemius/soleus (PF), tibialis anterior (DF), tibialis posterior (inversion), peroneals (eversion), intrinsic foot muscles.",
    capsularPattern:"Ankle (talocrural): Plantarflexion > Dorsiflexion. Subtalar: Inversion restricted. 1st MTP: Extension > Flexion (hallux rigidus).",
    activeROM:[
      { id:"ank_a_df", label:"Dorsiflexion", normal:"20°", how:"Non-weight-bearing: passive DF. Weight-bearing: lunge test (knee to wall — normal = 10cm+). Compare bilaterally. Restriction = gastroc/soleus, posterior ankle capsule, or OA." },
      { id:"ank_a_pf", label:"Plantarflexion", normal:"50°", how:"From neutral, point foot. Normal = 50°. Pain at end range = posterior impingement (dancer's heel). Restriction = anterior capsule, OA." },
      { id:"ank_a_inv", label:"Inversion", normal:"35°", how:"Combined plantar inversion (STJ motion). Normal = 35°. Restriction = anterior lateral ankle sprain sequelae, STJ OA. Test tibialis posterior strength via single-leg heel raise." },
      { id:"ank_a_ev", label:"Eversion", normal:"15°", how:"Evert foot. Normal = 15°. Restricted = deltoid ligament, medial capsule, or tibialis posterior spasm. Pain = peroneal tendinopathy (lateral)." },
      { id:"ank_a_1mtp", label:"1st MTP Extension", normal:"60–70°", how:"Extend great toe passively. Normal = 60–70° DF. Restriction = hallux rigidus (1st MTP OA) or hallux limitus. Critical for gait push-off and SBL function." },
    ],
    passiveROM:[
      { id:"ank_p_df", label:"Passive DF", how:"Compare passive vs active DF. More than active = contractile limitation (gastroc). Same = joint capsule or bony block. Test with knee bent (isolates subtalar, removes gastroc) vs extended (adds gastroc).", endfeel_options:["Capsular/Leathery (normal)","Hard (Bone-to-Bone — OA or impingement)","Muscle Spasm","Springy/Rebound","Empty (No End-Feel)"] },
      { id:"ank_p_inv", label:"Passive Inversion (STJ)", how:"Stabilise talus. Invert calcaneus. Tests ATFL and STJ motion. Compare to contralateral. Assess range AND quality of end-feel.", endfeel_options:["Normal/Capsular","Muscle Spasm","Hard","Springy/Rebound"] },
      { id:"ank_p_plantar_fascia", label:"Passive Plantar Fascia Assessment", how:"Flex toes and ankle into dorsiflexion simultaneously (windlass mechanism). Palpate plantar fascia from calcaneal origin to metatarsal heads. Note: tissue tension, tenderness, thickness (Doppler comparison).", endfeel_options:["Normal tension and mobility","Restricted — taut band","Tender — fasciopathy","Thick / nodular — fibrosis"] },
    ],
    resistedTests:[
      { id:"ank_r_df", label:"Resisted Dorsiflexion", muscle:"Tibialis anterior", how:"Resist ankle DF + inversion. Pain anterior shin = tibialis anterior tendinopathy. Weakness = L4 radiculopathy (foot drop risk)." },
      { id:"ank_r_pf", label:"Resisted Plantarflexion", muscle:"Gastrocnemius / soleus", how:"Resist PF. Also: single-leg heel raise test (25 reps = normal calf endurance). Weakness = S1/S2 radiculopathy. Pain = Achilles tendinopathy." },
      { id:"ank_r_inv", label:"Resisted Inversion (tibialis posterior)", muscle:"Tibialis posterior", how:"Resist PF + inversion (tibialis posterior specific). Pain medial ankle = tib post tendinopathy. Weakness = progressive flatfoot dysfunction." },
      { id:"ank_r_ev", label:"Resisted Eversion (peroneals)", muscle:"Peroneus longus / brevis", how:"Resist eversion. Pain lateral ankle = peroneal tendinopathy. Weakness = chronic lateral instability or common peroneal nerve injury (foot drop with inversion)." },
      { id:"ank_r_toe_ext", label:"Resisted Great Toe Extension", muscle:"Extensor hallucis longus", how:"Resist great toe extension. Weakness = L5 (most specific L5 myotome). Pain = EHL tendinopathy (anterior ankle)." },
      { id:"ank_r_heel_raise", label:"Single-Leg Heel Raise Test", muscle:"Gastroc-soleus / tibialis posterior", how:"Patient does single-leg heel raise repetitions. Normal = 25 reps, full height. Reduced height = tibialis posterior insufficiency. Reduced reps = gastroc-soleus weakness. Cannot invert during raise = tib post rupture." },
    ],
    jointPlay:[
      { id:"ank_jp_talar", label:"Talar Posterior Glide (↑ DF)", how:"Patient supine, ankle over table edge. Stabilise distal tibia. Apply posterior glide of talus in mortise. Restricted posterior glide = limited DF. Treatment glide: Grade III–IV for ankle DF restriction." },
      { id:"ank_jp_calcaneal", label:"Calcaneal Inversion/Eversion (STJ)", how:"Patient prone. Grasp calcaneus firmly. Assess inversion and eversion glide independently of talocrural. Restricted eversion = post-sprain STJ. Restricted inversion = medial capsule." },
      { id:"ank_jp_midfoot", label:"Midtarsal (Chopart's) Mobility", how:"Stabilise heel (calcaneus + talus). Translate midfoot PA and AP. Also forefoot rotation. Restricted = post-sprain stiffness, chronic midfoot OA." },
      { id:"ank_jp_1mtp", label:"1st MTP Joint Accessory Motion", how:"Stabilise 1st metatarsal. Translate proximal phalanx: PA glide (increases DF) and AP glide. Distraction. Restricted PA glide = hallux rigidus. Grade III–IV glide mobilisation = treatment for hallux limitus." },
    ],
    redFlags:["Acute severe ankle swelling post-trauma — Ottawa rules (refer for X-ray)", "Inability to weight-bear (potential fracture)", "Compartment syndrome signs (firm calf, pain on passive stretch)", "Posterior heel swelling + fever (infection)"],
    differentials:["Lateral ankle sprain (ATFL/CFL)", "Achilles tendinopathy (mid-portion vs insertional)", "Plantar fasciitis", "Tibialis posterior tendinopathy/rupture", "Peroneal tendinopathy/subluxation", "Sinus tarsi syndrome", "Tarsal tunnel syndrome", "Ankle OA", "Hallux rigidus", "Metatarsalgia", "Stress fracture (navicular, 5th metatarsal, calcaneus)"],
  },
};

// ─── CYRIAX CLINICAL REASONING ENGINE ────────────────────────────────────────
function cyriaxAutoReason(regionId, data) {
  const reg = CYRIAX_REGIONS_DATA[regionId];
  if (!reg) return null;

  const v = (id) => data[`cyriax_${regionId}_${id}`] || "";
  const findings = [];
  const diagnoses = [];
  const treatment = [];
  let tissueType = "";
  let confidence = "Low";

  // Check resisted tests for tissue type
  const resistedResults = reg.resistedTests.map(t => ({ id: t.id, result: v(`res_${t.id}`), label: t.label, muscle: t.muscle }));
  const strongPainful = resistedResults.filter(r => r.result === "Strong & Painful");
  const weakPainless = resistedResults.filter(r => r.result === "Weak & Painless");
  const weakPainful = resistedResults.filter(r => r.result === "Weak & Painful");
  const strongPainless = resistedResults.filter(r => r.result === "Strong & Painless");

  // Passive ROM / end-feel
  const passiveEndfeels = reg.passiveROM.map(t => ({ id: t.id, ef: v(`pass_ef_${t.id}`), label: t.label }));
  const abnormalEndfeels = passiveEndfeels.filter(e => e.ef && !["Normal/Capsular","Tissue Approximation (normal)","Hard (normal at 0°)","Bone-to-Bone (normal at 0°)"].some(n => e.ef.startsWith(n)));

  // Active ROM
  const activeROMs = reg.activeROM.map(t => ({ id: t.id, pain: v(`act_pain_${t.id}`), limited: v(`act_limited_${t.id}`), label: t.label }));
  const painfulMovements = activeROMs.filter(r => r.pain && r.pain.includes("Pain"));
  const limitedMovements = activeROMs.filter(r => r.limited && r.limited !== "Full" && r.limited !== "Normal");

  // Capsular pattern detection
  const capsPattern = v("capsular_pattern");
  const hasCapsular = capsPattern === "Yes — capsular pattern confirmed";

  // TISSUE TYPE DETERMINATION
  if (weakPainful.length > 0) {
    tissueType = "⚠️ SERIOUS CONTRACTILE LESION";
    confidence = "High";
    findings.push(`🚨 SERIOUS: ${weakPainful.map(r => r.label).join(", ")} — Weak & Painful`);
    diagnoses.push({ name:"Serious Contractile Lesion", confidence:"High", detail:"Weak + painful = serious: complete rupture + surrounding tissue damage, fracture through insertion, or neoplasm. URGENT imaging required." });
    treatment.push("URGENT: Do NOT load or treat. Refer for imaging (X-ray + MRI) immediately.", "Rule out fracture, complete rupture, neoplasm.", "Surgical consultation if rupture confirmed.");
  } else if (weakPainless.length > 0) {
    tissueType = "⚡ NEUROLOGICAL DEFICIT OR COMPLETE RUPTURE";
    confidence = "High";
    findings.push(`⚡ Neurological finding: ${weakPainless.map(r => `${r.label} (${r.muscle})`).join(", ")} — Weak & Painless`);
    diagnoses.push({ name:"Neurological Deficit or Complete Structural Rupture", confidence:"High", detail:"Weak + painless = nerve root lesion (check dermatomes + reflexes) OR complete rupture (no structure left to be painful)." });
    treatment.push("Neurological assessment: dermatomes, myotomes, reflexes.", "If neurological: nerve conduction study, MRI spine.", "If complete rupture: refer orthopaedic.");
  } else if (strongPainful.length > 0 && abnormalEndfeels.length === 0) {
    tissueType = "🎯 CONTRACTILE TISSUE LESION";
    confidence = "High";
    findings.push(`Minor contractile lesion: ${strongPainful.map(r => `${r.label} (${r.muscle})`).join(", ")}`);
    strongPainful.forEach(r => {
      diagnoses.push({ name:`${r.muscle} — Tendinopathy / Partial Tear`, confidence:"High", detail:`Strong & Painful on ${r.label}. Contractile unit generates force but lesion provoked. Minor lesion at muscle, MTJ, tendon, or tenoperiosteal junction.` });
      treatment.push(`Deep Transverse Friction Massage (DTFM) to exact palpated lesion site — ${r.muscle}`, `Eccentric loading protocol for ${r.muscle}`, "Load management — avoid aggravating movements initially");
    });
  } else if (hasCapsular || (abnormalEndfeels.length > 0 && strongPainful.length === 0 && weakPainless.length === 0)) {
    tissueType = "🔒 INERT TISSUE LESION";
    confidence = "High";
    if (hasCapsular) {
      findings.push(`Capsular pattern confirmed for ${reg.name || regionId}`);
      const cp = CAPSULAR_PATTERNS[regionId];
      if (cp) diagnoses.push({ name:`Capsulitis / ${cp.dx}`, confidence:"High", detail:`Capsular pattern: ${cp.pattern}. Inert tissue (capsule) involved. Consider: ${cp.dx}.` });
      treatment.push("Grade III–IV joint mobilisation (address capsular restriction)", "Sustained end-range stretching", "Heat before mobilisation, ice after", "Progressive ROM restoration");
    }
    abnormalEndfeels.forEach(e => {
      findings.push(`Abnormal end-feel at ${e.label}: ${e.ef}`);
      const efData = ENDFEEL_DATA[e.ef];
      if (efData) {
        diagnoses.push({ name:`${e.ef} end-feel at ${e.label}`, confidence:"Moderate", detail:efData.abnormal });
        treatment.push(efData.tx);
      }
    });
  } else if (strongPainless.length === resistedResults.filter(r => r.result).length && resistedResults.filter(r => r.result).length > 0) {
    tissueType = "✅ ALL CONTRACTILE TESTS NORMAL";
    confidence = "Moderate";
    findings.push("All resisted tests strong and painless — contractile tissue normal");
    diagnoses.push({ name:"Inert Tissue Pathology (all contractile normal)", confidence:"Moderate", detail:"Pain is not arising from contractile tissue. Inert structures (capsule, ligament, bursa, disc) are the source. Focus passive assessment." });
    treatment.push("Focus on passive assessment and joint play", "Inert tissue treatment: mobilisation, manipulation, support");
  }

  // Painful arc detection
  const painArc = v("painful_arc");
  if (painArc && painArc !== "None") {
    findings.push(`Painful arc: ${painArc}`);
    if (painArc.includes("Impingement")) diagnoses.push({ name:"Subacromial Impingement (painful arc)", confidence:"Moderate", detail:"Pain 60–120° = subacromial arc = supraspinatus or bursa impingement." });
  }

  // Related assessment suggestions
  const nextTests = [];
  if (tissueType.includes("CONTRACTILE")) {
    nextTests.push("Palpate exact lesion site (deep transverse friction point)", "Ultrasound imaging to confirm partial vs complete lesion", "Neural tension tests if referred symptoms");
  }
  if (tissueType.includes("INERT") || hasCapsular) {
    nextTests.push("X-ray (OA staging)", "Joint play assessment (grade mobility)", "Arthroscopy referral if springy end-feel (loose body)", "MRI if empty end-feel (serious pathology)");
  }
  if (tissueType.includes("NEUROLOGICAL")) {
    nextTests.push("Full neurological exam (dermatomes, myotomes, reflexes)", "MRI spine", "Nerve conduction study + EMG", "Neurosurgeon referral if progressive");
  }

  return { findings, diagnoses: diagnoses.slice(0, 5), treatment: [...new Set(treatment)].slice(0, 8), tissueType, confidence, nextTests, differentials: reg.differentials };
}

// ─── CYRIAX MODULE COMPONENT ─────────────────────────────────────────────────
function CyriaxModule({ data, set }) {
  const [region, setRegion] = useState("shoulder");
  const [tab, setTab] = useState("active");
  const [reasoning, setReasoning] = useState(null);
  const [showRed, setShowRed] = useState(false);

  const reg = CYRIAX_REGIONS_DATA[region];
  const prefix = `cyriax_${region}_`;
  const v = (id) => data[prefix + id] || "";
  const sv = (id, val) => set(prefix + id, val);

  const selectStyle = { width:"100%", background:"#192435", border:`1px solid #1a2d45`, borderRadius:8, color:"#d4e0f0", padding:"7px 10px", fontSize:"0.78rem", outline:"none", fontFamily:"inherit" };
  const labelStyle = { fontSize:"0.72rem", fontWeight:700, color:"#6b8399", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.5px" };
  const boxStyle = { background:"#0d1117", border:`1px solid #1a2d45`, borderRadius:10, padding:13, marginBottom:10 };
  const RESULT_OPTIONS = ["","Strong & Painless","Strong & Painful","Weak & Painless","Weak & Painful"];
  const PAIN_OPTIONS = ["","No pain","Pain on initiation","Pain at mid-range","Pain at end range","Painful arc","Pain throughout range","Referred pain with movement"];
  const LIMITED_OPTIONS = ["","Full range","Mildly limited","Moderately limited","Severely limited","Cannot perform"];

  const resColor = (val) => {
    if (!val) return "#1a2d45";
    const c = CYRIAX_STTT_INTERPRETATION[val];
    return c ? c.color : "#1a2d45";
  };

  const runReasoning = () => setReasoning(cyriaxAutoReason(region, data));

  const tabStyle = (t) => ({ padding:"8px 16px", cursor:"pointer", fontSize:"0.8rem", fontWeight:tab===t?700:500, color:tab===t?C.accent:C.muted, borderBottom:`2px solid ${tab===t?C.accent:"transparent"}`, background:"none", border:"none", borderBottom:`2px solid ${tab===t?C.accent:"transparent"}` });

  return (
    <div>
      {/* Region selector */}
      <div style={{ background:`${reg.color}08`, border:`1px solid ${reg.color}25`, borderRadius:12, padding:14, marginBottom:14 }}>
        <div style={{ fontWeight:800, color:reg.color, fontSize:"0.95rem", marginBottom:10 }}>⚕ Cyriax STTT — Region-Specific Assessment</div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {Object.entries(CYRIAX_REGIONS_DATA).map(([key, r]) => {
            const hasData = Object.keys(data).some(k => k.startsWith(`cyriax_${key}_`) && data[k]);
            return (
              <button key={key} type="button" onClick={() => { setRegion(key); setTab("active"); setReasoning(null); }}
                style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${region===key?r.color:hasData?r.color+"50":C.border}`, background:region===key?`${r.color}18`:"transparent", color:region===key?r.color:hasData?r.color:C.muted, fontSize:"0.75rem", fontWeight:region===key?700:500, cursor:"pointer" }}>
                {r.icon} {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Anatomy banner */}
      <div style={{ ...boxStyle, borderColor:reg.color+"30" }}>
        <div style={{ fontSize:"0.65rem", fontWeight:700, color:reg.color, textTransform:"uppercase", letterSpacing:"1px", marginBottom:5 }}>📚 Regional Anatomy</div>
        <div style={{ fontSize:"0.76rem", color:C.muted, lineHeight:1.7 }}>{reg.anatomy}</div>
        <div style={{ marginTop:8, padding:"6px 10px", background:`${reg.color}10`, borderRadius:7, fontSize:"0.74rem", color:C.text }}>
          <strong style={{ color:reg.color }}>Capsular Pattern: </strong>{reg.capsularPattern}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, marginBottom:16 }}>
        {[["active","Active ROM"],["passive","Passive ROM"],["resisted","Resisted Tests"],["joint_play","Joint Play"],["reason","🧠 Reasoning"]].map(([t,l]) => (
          <button key={t} type="button" onClick={()=>setTab(t)} style={tabStyle(t)}>{l}</button>
        ))}
      </div>

      {/* ── ACTIVE ROM TAB ── */}
      {tab === "active" && (
        <div>
          <div style={{ ...boxStyle, borderColor:"rgba(0,229,255,0.2)" }}>
            <div style={{ fontSize:"0.65rem", fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:"1px", marginBottom:12 }}>Active Range of Motion — All Directions</div>

            {/* Painful arc */}
            <div style={{ marginBottom:12 }}>
              <div style={labelStyle}>Painful Arc</div>
              <select value={v("painful_arc")} onChange={e=>sv("painful_arc",e.target.value)} style={selectStyle}>
                <option value="">— select —</option>
                {["None","Impingement arc (60–120°) — supraspinatus/bursa","Full range painful — capsular","Mid-range pain eases — disc","End range only — capsule/facet","Pain increases progressively — inflammatory","Painful on return (latent pain)"].map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {reg.activeROM.map(t => (
              <div key={t.id} style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:9, padding:12, marginBottom:9 }}>
                <div style={{ fontWeight:700, color:C.text, marginBottom:6, fontSize:"0.82rem" }}>{t.label} <span style={{ color:C.muted, fontWeight:400, fontSize:"0.72rem" }}>Normal: {t.normal}</span></div>
                <div style={{ background:C.s3, borderRadius:7, padding:9, marginBottom:8, fontSize:"0.74rem", color:C.muted, lineHeight:1.6 }}>
                  <strong style={{ color:C.yellow }}>How: </strong>{t.how}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7 }}>
                  <div>
                    <div style={labelStyle}>ROM Value</div>
                    <input type="text" value={v(`act_rom_${t.id}`)} onChange={e=>sv(`act_rom_${t.id}`,e.target.value)} placeholder={`e.g. ${t.normal}`} style={selectStyle}/>
                  </div>
                  <div>
                    <div style={labelStyle}>Pain</div>
                    <select value={v(`act_pain_${t.id}`)} onChange={e=>sv(`act_pain_${t.id}`,e.target.value)} style={{...selectStyle, borderColor:v(`act_pain_${t.id}`)?.includes("Pain")?"#ff4d6d":"#1a2d45"}}>
                      {PAIN_OPTIONS.map(o=><option key={o} value={o}>{o||"— pain? —"}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={labelStyle}>Range</div>
                    <select value={v(`act_limited_${t.id}`)} onChange={e=>sv(`act_limited_${t.id}`,e.target.value)} style={{...selectStyle, borderColor:v(`act_limited_${t.id}`)&&v(`act_limited_${t.id}`)!=="Full"?"#ffb300":"#1a2d45"}}>
                      {LIMITED_OPTIONS.map(o=><option key={o} value={o}>{o||"— range? —"}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop:6 }}>
                  <div style={labelStyle}>Compensation / Quality Notes</div>
                  <input type="text" value={v(`act_comp_${t.id}`)} onChange={e=>sv(`act_comp_${t.id}`,e.target.value)} placeholder="e.g. trunk lean, painful arc 60–120°, shoulder shrug..." style={selectStyle}/>
                </div>
              </div>
            ))}

            {/* Active vs Passive comparison */}
            <div style={{ marginTop:10 }}>
              <div style={labelStyle}>Active vs Passive Comparison (Cyriax Key Rule)</div>
              <select value={v("act_pass_comparison")} onChange={e=>sv("act_pass_comparison",e.target.value)} style={selectStyle}>
                <option value="">— select —</option>
                {["Passive ROM greater than active — inert or contractile lesion (both possible)","Passive ROM same as active — capsular/inert lesion (contractile not involved)","Passive ROM less than active — muscular/contractile over-activity","Active more restricted than passive — contractile inhibition or pain avoidance","Both equally restricted — capsular pattern"].map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── PASSIVE ROM TAB ── */}
      {tab === "passive" && (
        <div>
          <div style={{ ...boxStyle, borderColor:"rgba(127,90,240,0.3)" }}>
            <div style={{ fontSize:"0.65rem", fontWeight:700, color:C.a2, textTransform:"uppercase", letterSpacing:"1px", marginBottom:12 }}>Passive ROM — Inert Tissue Testing</div>

            {/* Capsular pattern */}
            <div style={{ background:"rgba(127,90,240,0.08)", border:`1px solid ${C.a2}40`, borderRadius:9, padding:12, marginBottom:12 }}>
              <div style={labelStyle}>Capsular Pattern Assessment</div>
              <select value={v("capsular_pattern")} onChange={e=>sv("capsular_pattern",e.target.value)} style={{...selectStyle, borderColor:v("capsular_pattern")?.includes("Yes")?"#7f5af0":"#1a2d45"}}>
                <option value="">— assess capsular pattern —</option>
                <option value="Yes — capsular pattern confirmed">Yes — capsular pattern confirmed</option>
                <option value="Non-capsular — specific direction limited">Non-capsular — specific direction limited</option>
                <option value="No restriction — all passive full">No restriction — all passive full</option>
                <option value="Partial capsular — not all directions limited">Partial capsular pattern — not all directions</option>
              </select>
              {CAPSULAR_PATTERNS[region] && (
                <div style={{ marginTop:8, padding:"6px 9px", background:C.s3, borderRadius:6, fontSize:"0.72rem", color:C.text }}>
                  <strong style={{ color:C.a2 }}>Expected pattern: </strong>{CAPSULAR_PATTERNS[region].pattern}
                  <br/><strong style={{ color:C.a2 }}>Suggests: </strong>{CAPSULAR_PATTERNS[region].dx}
                </div>
              )}
            </div>

            {reg.passiveROM.map(t => (
              <div key={t.id} style={{ ...boxStyle }}>
                <div style={{ fontWeight:700, color:C.text, marginBottom:6, fontSize:"0.82rem" }}>{t.label}</div>
                <div style={{ background:C.s3, borderRadius:7, padding:9, marginBottom:8, fontSize:"0.74rem", color:C.muted, lineHeight:1.6 }}>
                  <strong style={{ color:C.yellow }}>Method: </strong>{t.how}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:7 }}>
                  <div>
                    <div style={labelStyle}>ROM (degrees or cm)</div>
                    <input type="text" value={v(`pass_rom_${t.id}`)} onChange={e=>sv(`pass_rom_${t.id}`,e.target.value)} placeholder="e.g. 90° or less than active" style={selectStyle}/>
                  </div>
                  <div>
                    <div style={labelStyle}>Pain at End Range</div>
                    <select value={v(`pass_pain_${t.id}`)} onChange={e=>sv(`pass_pain_${t.id}`,e.target.value)} style={{...selectStyle, borderColor:v(`pass_pain_${t.id}`)?.includes("Pain")?"#ff4d6d":"#1a2d45"}}>
                      {["","No pain at end range","Pain at end range — same as active","Pain at end range — more than active (inert lesion)","Pain before end range","Referred pain with passive movement"].map(o=><option key={o} value={o}>{o||"— end range pain? —"}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom:7 }}>
                  <div style={labelStyle}>End-Feel</div>
                  <select value={v(`pass_ef_${t.id}`)} onChange={e=>sv(`pass_ef_${t.id}`,e.target.value)}
                    style={{...selectStyle, borderColor:v(`pass_ef_${t.id}`)&&!["Normal/Capsular","Tissue Approximation (normal)","Hard (normal at 0°)","Bone-to-Bone (normal at 0°)"].some(n=>v(`pass_ef_${t.id}`).startsWith(n))?"#ffb300":"#1a2d45"}}>
                    <option value="">— select end-feel —</option>
                    {(t.endfeel_options||Object.keys(ENDFEEL_DATA)).map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                  {v(`pass_ef_${t.id}`) && ENDFEEL_DATA[v(`pass_ef_${t.id}`)] && (
                    <div style={{ marginTop:6, padding:"6px 9px", background:C.s3, borderRadius:6, fontSize:"0.72rem", color:C.text, lineHeight:1.5 }}>
                      <strong style={{ color:ENDFEEL_DATA[v(`pass_ef_${t.id}`)].color }}>Clinical significance: </strong>
                      {ENDFEEL_DATA[v(`pass_ef_${t.id}`)].abnormal}
                      <br/><strong style={{ color:C.a3 }}>Treatment: </strong>{ENDFEEL_DATA[v(`pass_ef_${t.id}`)].tx}
                    </div>
                  )}
                </div>
                <div>
                  <div style={labelStyle}>Overpressure Response</div>
                  <select value={v(`pass_ovp_${t.id}`)} onChange={e=>sv(`pass_ovp_${t.id}`,e.target.value)} style={selectStyle}>
                    {["","No pain with overpressure","Mild pain with overpressure","Significant pain with overpressure","Pain before overpressure applied","Reproduction of patient's symptoms"].map(o=><option key={o} value={o}>{o||"— overpressure —"}</option>)}
                  </select>
                </div>
              </div>
            ))}

            {/* Active vs Passive summary */}
            <div style={{ background:"rgba(0,229,255,0.06)", border:`1px solid ${C.accent}25`, borderRadius:9, padding:12 }}>
              <div style={labelStyle}>Cyriax A vs P Summary</div>
              <div style={{ fontSize:"0.74rem", color:C.muted, marginBottom:6 }}>Key rule: if passive ROM is GREATER than active, the contractile unit is restricting (not the joint). If passive = active, joint/inert structure.</div>
              <textarea value={v("passive_summary")} onChange={e=>sv("passive_summary",e.target.value)}
                placeholder="Summarise passive findings and active vs passive comparison..."
                style={{ ...selectStyle, minHeight:60, resize:"vertical", display:"block" }}/>
            </div>
          </div>
        </div>
      )}

      {/* ── RESISTED TESTS TAB ── */}
      {tab === "resisted" && (
        <div>
          {/* STTT Key */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
            {Object.entries(CYRIAX_STTT_INTERPRETATION).map(([key, val]) => (
              <div key={key} style={{ background:`${val.color}10`, border:`1px solid ${val.color}40`, borderRadius:9, padding:"8px 11px" }}>
                <div style={{ fontWeight:700, color:val.color, fontSize:"0.74rem", marginBottom:3 }}>{val.icon} {key}</div>
                <div style={{ fontSize:"0.68rem", color:C.text, lineHeight:1.5 }}>{val.tissue}</div>
              </div>
            ))}
          </div>

          <div style={boxStyle}>
            <div style={{ fontSize:"0.65rem", fontWeight:700, color:C.a4, textTransform:"uppercase", letterSpacing:"1px", marginBottom:12 }}>Selective Tissue Tension — Resisted Isometric Tests</div>

            {reg.resistedTests.map(t => {
              const res = v(`res_${t.id}`);
              const interp = CYRIAX_STTT_INTERPRETATION[res];
              return (
                <div key={t.id} style={{ background:res?`${resColor(res)}10`:C.s2, border:`1px solid ${res?resColor(res)+"50":C.border}`, borderRadius:9, padding:12, marginBottom:9 }}>
                  <div style={{ fontWeight:700, color:C.text, marginBottom:3, fontSize:"0.82rem" }}>{t.label}</div>
                  <div style={{ fontSize:"0.7rem", color:C.muted, marginBottom:6 }}>🎯 Muscle tested: {t.muscle}</div>
                  <div style={{ background:C.s3, borderRadius:7, padding:8, marginBottom:8, fontSize:"0.74rem", color:C.muted, lineHeight:1.6 }}>
                    <strong style={{ color:C.yellow }}>How: </strong>{t.how}
                  </div>
                  <select value={res} onChange={e=>sv(`res_${t.id}`,e.target.value)} style={{...selectStyle, borderColor:resColor(res), fontWeight:res?700:400}}>
                    {RESULT_OPTIONS.map(o=><option key={o} value={o}>{o||"— select result —"}</option>)}
                  </select>
                  {interp && (
                    <div style={{ marginTop:8, padding:"8px 10px", background:`${interp.color}12`, border:`1px solid ${interp.color}40`, borderRadius:7 }}>
                      <div style={{ fontWeight:700, color:interp.color, fontSize:"0.74rem", marginBottom:3 }}>{interp.icon} {interp.tissue}</div>
                      <div style={{ fontSize:"0.72rem", color:C.text, lineHeight:1.6, marginBottom:4 }}>{interp.meaning}</div>
                      <div style={{ fontSize:"0.7rem", color:C.a3 }}><strong>Next step: </strong>{interp.nextStep}</div>
                    </div>
                  )}
                  <div style={{ marginTop:6 }}>
                    <input type="text" value={v(`res_notes_${t.id}`)} onChange={e=>sv(`res_notes_${t.id}`,e.target.value)} placeholder="Additional notes (e.g. painful at specific range, bilateral comparison)..." style={selectStyle}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── JOINT PLAY TAB ── */}
      {tab === "joint_play" && (
        <div>
          <div style={boxStyle}>
            <div style={{ fontSize:"0.65rem", fontWeight:700, color:C.a3, textTransform:"uppercase", letterSpacing:"1px", marginBottom:12 }}>Joint Play / Accessory Motion Assessment</div>
            <div style={{ background:"rgba(0,201,122,0.06)", border:`1px solid ${C.a3}30`, borderRadius:8, padding:10, marginBottom:12, fontSize:"0.76rem", color:C.text, lineHeight:1.7 }}>
              Joint play tests assess the ACCESSORY MOVEMENTS that accompany physiological motion. Restriction in joint play → restriction in full ROM. Grade using Maitland (I–IV) or Kaltenborn (0–6). Hypomobile = mobilise. Hypermobile = stabilise.
            </div>

            {reg.jointPlay.map(t => (
              <div key={t.id} style={boxStyle}>
                <div style={{ fontWeight:700, color:C.text, marginBottom:5, fontSize:"0.82rem" }}>{t.label}</div>
                <div style={{ background:C.s3, borderRadius:7, padding:9, marginBottom:8, fontSize:"0.74rem", color:C.muted, lineHeight:1.6 }}>
                  <strong style={{ color:C.yellow }}>Method: </strong>{t.how}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <div>
                    <div style={labelStyle}>Mobility Grade</div>
                    <select value={v(`jp_grade_${t.id}`)} onChange={e=>sv(`jp_grade_${t.id}`,e.target.value)} style={selectStyle}>
                      {["","0 — Ankylosed (no motion)","1 — Considerable restriction","2 — Slight restriction","3 — Normal","4 — Slight hypermobility","5 — Considerable hypermobility","6 — Unstable"].map(o=><option key={o} value={o}>{o||"— grade —"}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={labelStyle}>Pain Response</div>
                    <select value={v(`jp_pain_${t.id}`)} onChange={e=>sv(`jp_pain_${t.id}`,e.target.value)} style={{...selectStyle, borderColor:v(`jp_pain_${t.id}`)?.includes("Pain")?"#ff4d6d":"#1a2d45"}}>
                      {["","No pain","Pain at end of range","Pain throughout movement","Pain reproduced = local","Pain reproduced = referred","Discomfort only"].map(o=><option key={o} value={o}>{o||"— pain? —"}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop:7 }}>
                  <div style={labelStyle}>Notes / Treatment Grade Indicated</div>
                  <input type="text" value={v(`jp_notes_${t.id}`)} onChange={e=>sv(`jp_notes_${t.id}`,e.target.value)} placeholder="e.g. Grade III PA mobilisation indicated, hypomobile L4/5..." style={selectStyle}/>
                </div>
              </div>
            ))}

            {/* Palpation section */}
            <div style={{ ...boxStyle, borderColor:`${reg.color}30` }}>
              <div style={{ fontWeight:700, color:reg.color, marginBottom:8, fontSize:"0.82rem" }}>Palpation — Exact Lesion Localisation</div>
              <div style={{ fontSize:"0.74rem", color:C.muted, marginBottom:8, lineHeight:1.6 }}>After STTT identifies the tissue type, palpate to find the EXACT site of lesion. This is where DTFM is applied. Cyriax rule: all treatment must reach the lesion.</div>
              <div style={{ marginBottom:7 }}>
                <div style={labelStyle}>Lesion Site (palpation)</div>
                <input type="text" value={v("palpation_site")} onChange={e=>sv("palpation_site",e.target.value)} placeholder="e.g. Infraspinatus tendon, 2cm proximal to insertion at greater tuberosity" style={selectStyle}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <div>
                  <div style={labelStyle}>Tissue Texture</div>
                  <select value={v("palp_texture")} onChange={e=>sv("palp_texture",e.target.value)} style={selectStyle}>
                    {["","Normal","Thickened / indurated","Ropy / nodular (trigger point)","Boggy / oedematous","Hard / fibrotic","Crepitus on movement","Warmth present"].map(o=><option key={o} value={o}>{o||"— texture —"}</option>)}
                  </select>
                </div>
                <div>
                  <div style={labelStyle}>Temperature</div>
                  <select value={v("palp_temp")} onChange={e=>sv("palp_temp",e.target.value)} style={selectStyle}>
                    {["","Normal","Warm / hot (acute inflammation)","Cool (chronic / circulatory)","Localised warmth only"].map(o=><option key={o} value={o}>{o||"— temperature —"}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CLINICAL REASONING TAB ── */}
      {tab === "reason" && (
        <div>
          <button type="button" onClick={runReasoning}
            style={{ width:"100%", padding:"12px", background:`linear-gradient(135deg,${C.accent},${C.a2})`, border:"none", borderRadius:10, color:"#000", fontWeight:800, fontSize:"0.88rem", cursor:"pointer", marginBottom:16 }}>
            🧠 Generate Cyriax Clinical Reasoning
          </button>

          {reasoning ? (
            <div>
              {/* Tissue type banner */}
              <div style={{ background:"rgba(0,229,255,0.08)", border:`1px solid ${C.accent}40`, borderRadius:10, padding:14, marginBottom:12, textAlign:"center" }}>
                <div style={{ fontSize:"1.1rem", fontWeight:800, color:C.accent, marginBottom:4 }}>{reasoning.tissueType}</div>
                <div style={{ fontSize:"0.75rem", color:C.muted }}>Confidence: {reasoning.confidence}</div>
              </div>

              {/* Red flags */}
              <div style={{ background:"rgba(255,77,109,0.08)", border:`1px solid ${C.red}40`, borderRadius:10, padding:12, marginBottom:12 }}>
                <div style={{ fontWeight:800, color:C.red, marginBottom:8, fontSize:"0.85rem", cursor:"pointer" }} onClick={()=>setShowRed(r=>!r)}>🚨 Red Flags for {reg.label} {showRed?"▲":"▼"}</div>
                {showRed && reg.redFlags.map((rf,i)=><div key={i} style={{ padding:"4px 8px", fontSize:"0.76rem", color:C.text, borderBottom:`1px solid rgba(255,77,109,0.1)` }}>⚠ {rf}</div>)}
              </div>

              {/* Findings */}
              {reasoning.findings.length > 0 && (
                <div style={{ ...boxStyle }}>
                  <div style={labelStyle}>Clinical Findings Summary</div>
                  {reasoning.findings.map((f,i)=><div key={i} style={{ padding:"5px 0", fontSize:"0.78rem", color:C.text, borderBottom:`1px solid ${C.border}` }}>• {f}</div>)}
                </div>
              )}

              {/* Diagnoses */}
              {reasoning.diagnoses.length > 0 && (
                <div style={{ ...boxStyle }}>
                  <div style={labelStyle}>Probable Diagnoses</div>
                  {reasoning.diagnoses.map((d,i)=>(
                    <div key={i} style={{ background:C.s3, borderRadius:8, padding:10, marginBottom:7, borderLeft:`3px solid ${i===0?C.accent:i===1?C.a2:C.a3}` }}>
                      <div style={{ fontWeight:700, color:C.text, marginBottom:3 }}>{i+1}. {d.name}</div>
                      <div style={{ fontSize:"0.7rem", color:C.muted, marginBottom:3 }}>{d.detail}</div>
                      <span style={{ fontSize:"0.65rem", padding:"1px 7px", borderRadius:8, background:d.confidence==="High"?"rgba(0,201,122,0.15)":"rgba(255,179,0,0.15)", color:d.confidence==="High"?C.green:C.yellow }}>{d.confidence} Confidence</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Differentials */}
              <div style={{ ...boxStyle }}>
                <div style={labelStyle}>Differential Diagnoses</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {reasoning.differentials.map((d,i)=><span key={i} style={{ padding:"3px 9px", borderRadius:10, fontSize:"0.72rem", background:C.s3, color:C.muted, border:`1px solid ${C.border}` }}>{d}</span>)}
                </div>
              </div>

              {/* Treatment */}
              {reasoning.treatment.length > 0 && (
                <div style={{ background:"rgba(0,201,122,0.06)", border:`1px solid ${C.a3}30`, borderRadius:10, padding:12, marginBottom:12 }}>
                  <div style={labelStyle}>Treatment Direction</div>
                  {reasoning.treatment.map((t,i)=>(
                    <div key={i} style={{ display:"flex", gap:8, padding:"5px 0", borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
                      <span style={{ color:C.a3, fontWeight:700, flexShrink:0 }}>→</span>
                      <span style={{ fontSize:"0.78rem", color:C.text }}>{t}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Next assessments */}
              <div style={{ ...boxStyle }}>
                <div style={labelStyle}>Suggested Next Assessments</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {reasoning.nextTests.map((t,i)=><span key={i} style={{ padding:"3px 9px", borderRadius:10, fontSize:"0.72rem", background:"rgba(0,229,255,0.1)", color:C.accent, border:`1px solid ${C.accent}30` }}>→ {t}</span>)}
                </div>
              </div>

              {/* Clinical notes */}
              <div style={boxStyle}>
                <div style={labelStyle}>Clinical Reasoning Notes</div>
                <textarea value={v("reasoning_notes")} onChange={e=>sv("reasoning_notes",e.target.value)}
                  placeholder="Add clinical reasoning, working diagnosis, treatment plan, follow-up..."
                  style={{ ...selectStyle, minHeight:80, resize:"vertical", display:"block" }}/>
              </div>
            </div>
          ) : (
            <div style={{ textAlign:"center", padding:30, color:C.muted, background:C.s2, borderRadius:12, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:"2rem", marginBottom:8 }}>⚕</div>
              <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>Complete Active, Passive, and Resisted tabs</div>
              <div style={{ fontSize:"0.8rem" }}>Then click Generate to receive Cyriax clinical reasoning, tissue diagnosis, and treatment direction.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// SUBJECTIVE ASSESSMENT MODULE — 21 Sections, 40+ options each
// ═══════════════════════════════════════════════════════════════════════════

const SUBJECTIVE_SECTIONS = {

  demographics: {
    label:"Patient Demographics", icon:"👤", color:"#00e5ff",
    fields:[
      { id:"dem_name",      label:"Full Name",             type:"text", placeholder:"Patient full name" },
      { id:"dem_dob",       label:"Date of Birth",         type:"text", placeholder:"DD/MM/YYYY" },
      { id:"dem_age",       label:"Age",                   type:"number", placeholder:"Years" },
      { id:"dem_sex",       label:"Biological Sex",        type:"select", options:["Male","Female","Intersex","Prefer not to say"] },
      { id:"dem_gender",    label:"Gender Identity",       type:"text", placeholder:"e.g. Male, Female, Non-binary" },
      { id:"dem_height",    label:"Height",                type:"text", placeholder:"e.g. 175cm / 5'9\"" },
      { id:"dem_weight",    label:"Weight",                type:"text", placeholder:"e.g. 75kg / 165lbs" },
      { id:"dem_bmi",       label:"BMI",                   type:"text", placeholder:"Auto-calculated or enter" },
      { id:"dem_dominant",  label:"Dominant Hand",         type:"select", options:["Right","Left","Ambidextrous"] },
      { id:"dem_dominant_foot", label:"Dominant Foot",     type:"select", options:["Right","Left"] },
      { id:"dem_ethnicity", label:"Ethnicity",             type:"text", placeholder:"Optional" },
      { id:"dem_language",  label:"Primary Language",      type:"text", placeholder:"e.g. English, Urdu" },
      { id:"dem_interpreter",label:"Interpreter Needed",   type:"select", options:["No","Yes — arranged","Yes — needed"] },
      { id:"dem_gp",        label:"GP / Referring Doctor", type:"text", placeholder:"Name and practice" },
      { id:"dem_referral",  label:"Referral Source",       type:"multicheck", options:["GP","Orthopaedic surgeon","Self-referral","Employer","Insurance","Sports coach","Another physio","A&E","Rheumatologist","Neurologist","Other specialist"] },
      { id:"dem_insurance",  label:"Insurance / Funding",  type:"multicheck", options:["NHS","Private — self pay","BUPA","AXA","Vitality","Aviva","WPA","Allianz","Employer EAP","Workers compensation","Motor accident","Other"] },
      { id:"dem_occupation",  label:"Occupation",          type:"text", placeholder:"Job title and employer" },
      { id:"dem_work_status", label:"Work Status",         type:"multicheck", options:["Full time employed","Part time employed","Self employed","Student","Retired","Unemployed","Off work — injury","Off work — illness","Carer","Volunteer"] },
      { id:"dem_notes",     label:"Additional Notes",      type:"textarea", placeholder:"Any other relevant demographic information" },
    ]
  },

  chief_complaint: {
    label:"Chief Complaint", icon:"🎯", color:"#ff4d6d",
    fields:[
      { id:"cc_main",         label:"Main Complaint (patient's words)", type:"textarea", placeholder:"Write exactly what the patient says is their main problem" },
      { id:"cc_location",     label:"Primary Pain Location",            type:"multicheck", options:["Head","Forehead","Temple (L)","Temple (R)","Occiput","Jaw/TMJ","Neck — anterior","Neck — posterior","Neck — lateral (L)","Neck — lateral (R)","Shoulder (L)","Shoulder (R)","Upper arm (L)","Upper arm (R)","Elbow (L)","Elbow (R)","Forearm (L)","Forearm (R)","Wrist (L)","Wrist (R)","Hand/fingers (L)","Hand/fingers (R)","Upper back","Mid back","Lower back","Sacrum","Coccyx","SI joint (L)","SI joint (R)","Buttock (L)","Buttock (R)","Groin (L)","Groin (R)","Hip (L)","Hip (R)","Thigh anterior (L)","Thigh anterior (R)","Thigh posterior (L)","Thigh posterior (R)","Knee (L)","Knee (R)","Lower leg (L)","Lower leg (R)","Ankle (L)","Ankle (R)","Foot (L)","Foot (R)","Plantar fascia (L)","Plantar fascia (R)","Toes (L)","Toes (R)"] },
      { id:"cc_secondary",    label:"Secondary Pain Location",          type:"text", placeholder:"Additional pain area if applicable" },
      { id:"cc_radiation",    label:"Pain Radiation / Referral",        type:"multicheck", options:["No radiation","Radiates to arm (L)","Radiates to arm (R)","Radiates to hand/fingers (L)","Radiates to hand/fingers (R)","Radiates to leg (L)","Radiates to leg (R)","Radiates to foot (L)","Radiates to foot (R)","Radiates across lower back","Radiates to groin","Radiates to buttock","Radiates to anterior thigh","Radiates to posterior thigh","Radiates to anterior shin","Radiates to calf","Radiates bilaterally","Radiates around chest/ribs","Radiates to jaw","Radiates to face","Bilateral upper limb symptoms","Bilateral lower limb symptoms"] },
      { id:"cc_symptom_type", label:"Symptom Type",                    type:"multicheck", options:["Pain","Aching","Stiffness","Burning","Tingling/pins & needles","Numbness","Sharp","Stabbing","Shooting","Throbbing","Cramping","Tightness","Weakness","Clicking","Grinding/crepitus","Locking","Giving way","Swelling","Warmth","Fatigue","Dizziness","Headache","Nausea"] },
      { id:"cc_onset",        label:"Onset",                           type:"multicheck", options:["Sudden — traumatic","Sudden — non-traumatic","Gradual — insidious","Gradual — after illness","Post-surgical","Post-partum","After change in activity","After new job/workstation","Woke up with it","No clear cause","Work-related","Sport-related","Motor vehicle accident","Slip/trip/fall","Lifting injury","Repetitive strain"] },
      { id:"cc_duration",     label:"Duration",                        type:"multicheck", options:["< 1 week (acute)","1–2 weeks","2–4 weeks (subacute)","1–3 months","3–6 months (chronic)","6–12 months","1–2 years","2–5 years","> 5 years","Since childhood","Since last episode of same injury","Recurring — multiple episodes"] },
      { id:"cc_side",         label:"Laterality",                      type:"multicheck", options:["Unilateral — right dominant","Unilateral — left dominant","Bilateral — symmetric","Bilateral — right worse","Bilateral — left worse","Central","Axial","Diffuse — not specific","Migrates between sides","Alternates"] },
      { id:"cc_notes",        label:"Additional Complaint Notes",      type:"textarea", placeholder:"Any other details about the chief complaint" },
    ]
  },

  pain_analysis: {
    label:"Pain Analysis", icon:"🌡️", color:"#ff8c42",
    fields:[
      { id:"pa_vas_now",    label:"NRS — Current Pain (0–10)",          type:"number", placeholder:"0 = no pain, 10 = worst imaginable" },
      { id:"pa_vas_best",   label:"NRS — Best Pain (0–10)",             type:"number", placeholder:"Pain at its best" },
      { id:"pa_vas_worst",  label:"NRS — Worst Pain (0–10)",            type:"number", placeholder:"Pain at its worst" },
      { id:"pa_vas_avg",    label:"NRS — Average Pain (0–10)",          type:"number", placeholder:"Average over past week" },
      { id:"pa_quality",    label:"Pain Quality (select all that apply)",type:"multicheck", options:["Sharp","Dull","Aching","Burning","Electric shock","Shooting","Stabbing","Throbbing","Cramping","Gnawing","Tight/squeezing","Heavy","Numb","Tingling","Pins and needles","Stinging","Pressure","Deep","Superficial","Constant ache","Intermittent sharp","Referred","Radiating","Spontaneous","Provoked only"] },
      { id:"pa_depth",      label:"Pain Depth",                         type:"multicheck", options:["Superficial — skin/subcutaneous","Fascial layer","Muscular","Joint","Bone","Deep unlocatable","Referred — felt at distance from source","Central sensitisation pattern — widespread"] },
      { id:"pa_onset_speed",label:"Pain Onset Speed",                   type:"multicheck", options:["Immediate (seconds)","Within minutes","Within hours","Delayed (next day)","24–48 hours after activity","Gradual over days","Slow progressive over weeks"] },
      { id:"pa_pattern",    label:"Pain Pattern",                       type:"multicheck", options:["Constant — never goes away","Constant — varies in intensity","Intermittent — comes and goes","Predictable — pattern clear","Unpredictable — random","Only with specific movements","Only with loading / weight-bearing","Only with sustained postures","Only at rest","Night pain waking patient","Morning dominant","End of day dominant","Activity dependent","Weather dependent","Hormonal pattern","Post-activity delayed"] },
      { id:"pa_nature",     label:"Pain Nature / Tissue Source",        type:"multicheck", options:["Nociceptive — local, sharp, movement-related","Neuropathic — burning, shooting, dermatomal","Nociplastic — widespread, unpredictable, sensitisation","Central sensitisation features","Inflammatory — worse at rest, morning stiffness >30 min","Mechanical — worse with loading, better with rest","Discogenic — worse flexion, cough/sneeze","Facet — worse extension, eases with flexion","Neural — shooting, tingling, dermatomal","Vascular — cramping with walking, eases with rest","Visceral — poorly localized, unaffected by movement","Psychosocial overlay"] },
      { id:"pa_intensity_scale",label:"Pain Scale Used",                type:"multicheck", options:["NRS (Numerical Rating Scale 0–10)","VAS (Visual Analog Scale)","FACES pain scale (paediatric/cognitive)","BPI (Brief Pain Inventory)","McGill Pain Questionnaire"] },
      { id:"pa_notes",      label:"Pain Analysis Notes",                type:"textarea", placeholder:"Detailed pain description, any additional features" },
    ]
  },

  symptom_behavior: {
    label:"Symptom Behaviour", icon:"📈", color:"#7f5af0",
    fields:[
      { id:"sb_change",     label:"Symptom Change Over Time",           type:"multicheck", options:["Getting progressively worse","Slowly improving","Stable — no change","Fluctuating — good and bad days","Improving since treatment started","Worsening despite treatment","Episodic — episodes getting more frequent","Episodic — episodes getting less frequent","Plateau — improvement stopped","Post-surgical — expected trajectory","Changed character recently"] },
      { id:"sb_morning",    label:"Morning Behaviour",                   type:"multicheck", options:["Worst on waking — eases quickly (<30 min)","Worse on waking — prolonged stiffness (>30 min)","Worst on waking — stays bad all morning","Stiff on waking — improves with movement","No morning pattern","Better in morning — worse later","Pain starts after getting up","First steps painful (plantar fascia pattern)","Getting out of bed painful","Morning headache"] },
      { id:"sb_daytime",    label:"Daytime Behaviour",                   type:"multicheck", options:["Worsens through the day","Improves through the day","Constant throughout day","Worse after sitting","Worse after standing","Worse after walking","Improves with movement","Worsens with prolonged activity","Better with rest","Worse with rest — restlessness","Worse in afternoon","Specific time of day pattern"] },
      { id:"sb_evening",    label:"Evening Behaviour",                   type:"multicheck", options:["Worst in evening","Improves in evening","Constant all evening","Worse after day's activity","Better after resting in evening","Disrupts evening activities","Prevents social activities","Worse watching TV / sitting","Better with legs elevated","No evening pattern"] },
      { id:"sb_night",      label:"Night Behaviour",                    type:"multicheck", options:["No night pain","Pain disturbs sleep — takes time to settle","Pain wakes from sleep — can return to sleep","Pain wakes repeatedly","Cannot sleep on affected side","Position-dependent night pain","Constant night pain — cannot sleep","Night sweats accompanying pain","Night pain — no position of comfort (red flag)","Arm/leg symptoms at night (neural)","Improved sleep with pain medication"] },
      { id:"sb_irritability",label:"Symptom Irritability",              type:"multicheck", options:["Low irritability — hard to aggravate, quick to settle","Moderate irritability — some aggravation, moderate settling time","High irritability — easily aggravated, slow to settle","Very high irritability — severe and prolonged aggravation","Rest eases quickly (mechanical)","Activity eases (inflammatory)","Unpredictable — no clear pattern","Multiple unrelated triggers"] },
      { id:"sb_notes",      label:"Symptom Behaviour Notes",            type:"textarea", placeholder:"24-hour pattern description, any triggers or patterns" },
    ]
  },

  mechanism: {
    label:"Mechanism of Injury", icon:"⚡", color:"#ffb300",
    fields:[
      { id:"moi_type",      label:"Mechanism Type",                     type:"multicheck", options:["Direct trauma — hit/struck","Indirect trauma — force through limb","Torsion/twisting injury","Hyperflexion","Hyperextension","Hyperabduction","Axial compression","Distraction/traction","Deceleration injury","Acceleration injury","Shear force","Crush injury","Fall — onto outstretched hand","Fall — onto knee","Fall — from height","Whiplash — rear impact","Whiplash — side impact","Head-on collision","Overuse / repetitive strain","Cumulative trauma","Postural overload","Lifting injury — flexed spine","Lifting injury — rotated","Awkward reach","Prolonged sustained posture","Contact sport injury","Non-contact sport injury","Swimming injury","Running injury","Throwing injury","Cycling injury","Occupational injury","Post-surgical","Spontaneous — no mechanism","No clear mechanism identified"] },
      { id:"moi_activity",  label:"Activity at Time of Injury",         type:"text", placeholder:"e.g. Playing football, lifting box, sitting at desk" },
      { id:"moi_position",  label:"Body Position at Injury",            type:"text", placeholder:"e.g. Spine flexed and rotated, arm overhead" },
      { id:"moi_first_symptom",label:"First Symptom After Injury",      type:"multicheck", options:["Immediate pain","Delayed pain (within hours)","Next day pain","Immediate swelling","Delayed swelling","Immediate weakness","Immediate numbness/tingling","Felt pop/crack","Heard audible crack/pop","Immediate locking","Immediate giving way","Dizziness post-impact","Loss of consciousness","No immediate symptoms"] },
      { id:"moi_previous",  label:"Previous Same Injury",               type:"multicheck", options:["First occurrence","Second occurrence","Third or more","Recurring — same mechanism each time","Recurring — different mechanisms","Previous injury — same joint different structure","Old injury — previously managed","Old injury — never treated","Progressive — each episode worse","Progressive — each episode resolves less"] },
      { id:"moi_notes",     label:"Mechanism Notes",                    type:"textarea", placeholder:"Detailed description of how the injury occurred" },
    ]
  },

  aggravating: {
    label:"Aggravating Factors", icon:"🔺", color:"#ff4d6d",
    fields:[
      { id:"agg_posture",   label:"Postures that Aggravate",            type:"multicheck", options:["Sitting","Prolonged sitting > 30 min","Prolonged sitting > 1 hour","Standing","Prolonged standing","Standing on hard floors","Lying supine","Lying on affected side","Lying on unaffected side","Lying prone","Slumped posture","Upright posture paradoxically","Sitting with legs crossed","Driving","Computer work","Looking down (phone use)","Looking up","Head turned left","Head turned right"] },
      { id:"agg_movement",  label:"Movements that Aggravate",           type:"multicheck", options:["Forward bending","Backward bending","Side bending left","Side bending right","Rotation left","Rotation right","Reaching overhead","Reaching across body","Lifting","Carrying","Pushing","Pulling","Twisting","Getting up from sitting","Getting in/out of car","Dressing","Putting on shoes/socks","Hair washing","Looking over shoulder","Coughing / sneezing","Deep breathing","Swallowing"] },
      { id:"agg_activity",  label:"Activities that Aggravate",          type:"multicheck", options:["Walking short distance","Walking long distance","Running","Stairs — up","Stairs — down","Squatting","Kneeling","Swimming","Cycling","Gym — weights","Gym — cardio","Yoga/Pilates","Sport specific","Sexual activity","Housework","Gardening","Childcare activities","Manual work","Computer/keyboard work","Carrying children","Prolonged reading","Screen time"] },
      { id:"agg_other",     label:"Other Aggravating Factors",          type:"multicheck", options:["Cold weather","Hot weather","Damp/humid weather","Barometric pressure changes","Stress","Fatigue","Menstrual cycle","Morning worse — inflammatory","After activity — delayed","Alcohol","Dehydration","Poor sleep","Extended screen time","Specific shoes / footwear","Specific mattress / pillow","Work tasks","Emotional states"] },
      { id:"agg_worst",     label:"Single Worst Aggravating Activity",  type:"text", placeholder:"The one thing that makes it worst" },
      { id:"agg_notes",     label:"Aggravating Factors Notes",          type:"textarea", placeholder:"Any other specific triggers or patterns" },
    ]
  },

  relieving: {
    label:"Relieving Factors", icon:"🔻", color:"#00c97a",
    fields:[
      { id:"rel_posture",   label:"Postures that Relieve",              type:"multicheck", options:["Lying flat","Lying with knees bent","Lying with legs elevated","Lying on affected side","Lying on unaffected side","Sitting upright","Sitting with lumbar support","Sitting with legs elevated","Standing","Walking slowly","Standing with weight shifted","Hands and knees position","Side lying with pillow between knees","Prone lying","Prone lying with pillow under abdomen","Supported sitting (leaning on arms)"] },
      { id:"rel_movement",  label:"Movements that Relieve",             type:"multicheck", options:["Gentle walking","Specific direction movement (McKenzie preference)","Extension relieves","Flexion relieves","Rotation relieves","Side-bend relieves","Traction (self-applied)","Chin tuck","Shoulder blade squeeze","Hip circles / gentle rotation","Stretching","Gentle exercise","Yoga / stretching","Swimming","Aquatic exercise","Specific physiotherapy exercises"] },
      { id:"rel_manual",    label:"Manual / Physical Treatments",       type:"multicheck", options:["Physiotherapy manual therapy","Massage — general","Massage — deep tissue","Osteopathy","Chiropractic","Dry needling / acupuncture","Joint manipulation","Joint mobilisation","Stretching by therapist","Taping / strapping","Bracing / orthotics","Heat application","Ice application","Hot shower / bath","TENS machine","Ultrasound therapy","Shockwave therapy","Hydrotherapy"] },
      { id:"rel_medication",label:"Medications that Help",              type:"multicheck", options:["Paracetamol","Ibuprofen / NSAIDs","Naproxen","Codeine / opioids","Muscle relaxants","Neuropathic medications (Gabapentin/Pregabalin)","Topical NSAIDs (Voltarol)","Topical capsaicin","Cortisone injection","Hyaluronic acid injection","PRP injection","Antidepressants (pain management)","Sleep medication","No medication effective","Not tried medication"] },
      { id:"rel_other",     label:"Other Relieving Factors",            type:"multicheck", options:["Rest","Sleep","Distraction","Reduced stress","Alcohol (temporary)","Warm weather","Positive mood","After work/reduced loading","Weekend better than workdays","Holiday better (supports occupational cause)","After socialising","Mindfulness/meditation","CPAP (if sleep apnoea related)"] },
      { id:"rel_best",      label:"Single Best Relieving Factor",       type:"text", placeholder:"What helps the most" },
      { id:"rel_notes",     label:"Relieving Factors Notes",            type:"textarea", placeholder:"Any other specific factors" },
    ]
  },

  pain_pattern_24hr: {
    label:"24-Hour Pain Pattern", icon:"🕐", color:"#00d4ff",
    fields:[
      { id:"h24_wake",      label:"On Waking (6–8am)",                  type:"multicheck", options:["Pain free on waking","Stiff but not painful","Mild pain — eases quickly","Moderate pain","Severe pain","Takes > 30 min to ease","Takes > 1 hour to ease","Pain free on waking then worsens","Pain wakes before alarm","Dependent on sleep position","Worse if slept badly"] },
      { id:"h24_morning",   label:"Morning (8am–12pm)",                  type:"multicheck", options:["Eases progressively through morning","Improves rapidly with movement","Stays constant through morning","Worsens through morning","Best of the day","Stiffness clears by 10am","Stiffness persists all morning","Requires medication to function in morning","Can work in morning","Cannot work in morning"] },
      { id:"h24_midday",    label:"Midday (12pm–2pm)",                   type:"multicheck", options:["Best time of day","Moderate — manageable","Worsening from morning","Improved from morning","Lunch break movement helps","Sitting at desk worsening","Standing for lunch worsening","Pain after lunch — eating related?","No change at midday"] },
      { id:"h24_afternoon", label:"Afternoon (2pm–6pm)",                 type:"multicheck", options:["Progressive worsening through afternoon","Constant through afternoon","Fatigue driving pain increase","Activity-related worsening","Needs rest break","Most productive time","Pain manageable but present","Requires medication by 4pm","Improving through afternoon","Worst of day"] },
      { id:"h24_evening",   label:"Evening (6pm–10pm)",                  type:"multicheck", options:["Eases with rest in evening","Pain increases in evening","Difficult to relax due to pain","Prevents enjoying evening activities","Better once off feet","Worse watching TV / sitting","Better with evening walk","Medication needed for evening","Unable to sit comfortably","Cannot perform evening tasks"] },
      { id:"h24_night",     label:"Night (10pm–6am)",                    type:"multicheck", options:["Sleeps through — no night pain","Takes > 30 min to get comfortable","Pain on turning in bed","Wakes once per night","Wakes multiple times","Cannot sleep >4 hours continuously","Night pain worse than day pain","Position change relieves temporarily","Requires medication to sleep","Not related to sleep position","Restless legs","Better second half of night","Worsens toward morning"] },
      { id:"h24_pattern_summary",label:"Overall 24hr Pattern Type",     type:"multicheck", options:["Inflammatory pattern — worse at rest, morning stiffness >30 min","Mechanical pattern — worse with loading, better with rest","Neuropathic — constant burning, worse at night","Postural — worse sustained postures, relieved by position change","Activity-dependent — directly proportional to load","Deconditioned — poor exercise tolerance driving pattern","Visceral — unrelated to posture or movement","Psychosocial — disproportionate to physical findings","Hormonal cycle related","No clear pattern"] },
      { id:"h24_notes",     label:"24-Hour Pattern Notes",              type:"textarea", placeholder:"Describe the typical day in detail" },
    ]
  },

  functional_limitations: {
    label:"Functional Limitations", icon:"🚫", color:"#ff8c42",
    fields:[
      { id:"fl_self_care",  label:"Self-Care Activities",               type:"multicheck", options:["Washing/showering — normal","Showering — needs modified technique","Bathing — cannot use bath","Washing hair — difficulty","Dressing — independent","Dressing — upper body difficulty","Dressing — lower body difficulty","Putting on shoes/socks — difficulty","Grooming / shaving — difficulty","Toileting — normal","Toileting — reduced mobility","Feeding self — normal","Feeding — difficulty with cutlery","Cannot perform self-care independently"] },
      { id:"fl_mobility",   label:"Mobility",                           type:"multicheck", options:["Walks normally","Walks with antalgia","Uses walking stick","Uses crutches","Uses walking frame","Wheelchair user — full time","Wheelchair user — part time","Limps — antalgic","Limps — neurological","Stairs — normal","Stairs — one step at a time","Stairs — requires rail","Stairs — cannot manage","Ramp preferred over stairs","Cannot walk > 100m","Cannot walk > 500m","Walking limited — less than 1km","Walking limited — 1–5km","No walking limitation"] },
      { id:"fl_domestic",   label:"Domestic Activities",                type:"multicheck", options:["Cooking — normal","Cooking — standing tolerance limited","Cooking — cannot lift pots","Cleaning — normal","Cleaning — cannot vacuum","Cleaning — cannot mop","Ironing — cannot perform","Laundry — normal","Laundry — cannot lift basket","Bed making — difficulty","Shopping — normal","Shopping — cannot carry bags","Shopping — requires trolley support","Shopping — cannot walk full shop","Childcare — normal","Childcare — lifting children limited","Gardening — limited","DIY / home repairs — limited"] },
      { id:"fl_work",       label:"Work Capacity",                      type:"multicheck", options:["Full time work — no restriction","Reduced hours due to pain","Modified duties required","Working from home adaptations","Cannot sit > 30 min","Cannot sit > 1 hour","Cannot stand > 30 min","Cannot stand > 1 hour","Computer work painful","Manual tasks restricted","Lifting restricted","Cannot drive","Driving restricted to short distances","Off work — short term","Off work — long term","At risk of job loss","Reduced income impact"] },
      { id:"fl_social",     label:"Social Participation",              type:"multicheck", options:["Full social life maintained","Reduced socialising due to pain","Cannot sit for restaurant/cinema","Cannot travel long distances","Cannot travel by plane","Avoids social situations due to pain","Sex/intimacy affected","Relationship strain","Cannot play with children/grandchildren","Cannot attend religious activities","Cannot volunteer","Social isolation increasing","Dependent on others for transport","Reduced due to embarrassment"] },
      { id:"fl_sport_rec",  label:"Sport / Recreation",                 type:"multicheck", options:["No sport/recreation restriction","Reduced intensity","Playing through pain","Performance significantly reduced","Cannot play primary sport","Cannot exercise at all","Cannot run","Cannot swim","Cannot cycle","Cannot lift weights","Gym attendance reduced","Yoga/Pilates restricted","Dancing restricted","Walking/hiking restricted","Cannot participate in team sport","Retired from sport due to pain"] },
      { id:"fl_notes",      label:"Functional Limitation Notes",        type:"textarea", placeholder:"Describe the most impactful functional limitations in detail" },
    ]
  },

  activity_restrictions: {
    label:"Activity Participation Restrictions", icon:"🏃", color:"#a8ff3e",
    fields:[
      { id:"ar_sport_level",label:"Sport / Exercise Level",             type:"multicheck", options:["Sedentary — no regular exercise","Light activity — walking only","Moderate — 2–3x/week exercise","Active — 4–5x/week","Very active — daily training","Elite competitive athlete","Masters athlete (35+)","Youth/junior athlete","Recreational sport only","Club sport competition","National level competition","Professional/paid athlete","Post-competition rehabilitation","Pre-season rehabilitation","In-season management","Return to sport goal"] },
      { id:"ar_sports_played",label:"Sports / Activities Played",       type:"multicheck", options:["Football / Soccer","Rugby","Cricket","Tennis","Badminton","Squash","Golf","Athletics — track","Athletics — field","Swimming","Cycling","Triathlon","Running — road","Running — trail","CrossFit / HIIT","Weightlifting / powerlifting","Yoga / Pilates","Martial arts","Boxing","Dance","Rock climbing","Skiing / snowboarding","Rowing / paddling","Horse riding","Basketball","Volleyball","Netball","Hockey","Gymnastics","Cheerleading","Other (specify in notes)"] },
      { id:"ar_restrictions", label:"Activity Restrictions",            type:"multicheck", options:["Cannot return to sport","Restricted from contact sport","Restricted from impact activities","Restricted from overhead sport","Restricted from rotational sport","Restricted from running","Restricted from jumping","Restricted from lifting","Restricted from water sport","Restricted from racquet sport","Doctor has advised rest","Player/coach advised modified training","Self-limiting due to pain","Fearful of re-injury","Insurance/medico-legal restriction","Pre-clearance assessment required","Return to sport protocol underway"] },
      { id:"ar_goal_sport",  label:"Activity Goal",                     type:"text", placeholder:"e.g. Return to playing football at weekend level" },
      { id:"ar_timeline",    label:"Desired Return Timeline",           type:"multicheck", options:["ASAP — as fast as possible","< 2 weeks","2–4 weeks","4–8 weeks","2–3 months","3–6 months","6–12 months","No specific timeline","Before specific event (specify in notes)","Competition date (specify in notes)","End of season","Next season"] },
      { id:"ar_notes",       label:"Activity Restriction Notes",        type:"textarea", placeholder:"Details of sport, activity level, and return-to-sport goals" },
    ]
  },

  occupational: {
    label:"Occupational History", icon:"💼", color:"#ffd700",
    fields:[
      { id:"occ_job_title",  label:"Current Job Title",                 type:"text", placeholder:"e.g. Nurse, Software developer, Teacher" },
      { id:"occ_employer",   label:"Employer / Workplace",              type:"text", placeholder:"Name and type of workplace" },
      { id:"occ_duration",   label:"Time in Current Role",              type:"text", placeholder:"e.g. 3 years, 6 months" },
      { id:"occ_hours",      label:"Working Hours",                     type:"multicheck", options:["Part time < 20 hrs/week","Part time 20–30 hrs/week","Full time 35–40 hrs/week","Extended hours > 40 hrs/week","Night shifts","Rotating shifts","Weekend work","On-call duties","Variable / unpredictable hours","Working from home","Hybrid working","Office based","Field / site based","Remote / travelling"] },
      { id:"occ_tasks",      label:"Primary Physical Demands",          type:"multicheck", options:["Sedentary — primarily seated","Standing — prolonged","Walking — moderate","Walking — extensive","Repetitive lifting","Heavy lifting > 20kg","Overhead work","Forward bending repetitive","Driving — < 2 hrs/day","Driving — 2–4 hrs/day","Driving — > 4 hrs/day","Vibration exposure (hand/arm)","Whole body vibration","Repetitive fine motor tasks","Computer/keyboard intensive","Visual display unit (VDU)","Manual handling","Climbing ladders/scaffolding","Awkward postures","Cold environment","Hot environment","High noise environment","Shift work","Call centre/telephone","Patient handling (healthcare)"] },
      { id:"occ_ergonomics", label:"Workstation / Ergonomic Factors",  type:"multicheck", options:["Chair height adjustable","Lumbar support provided","Monitor at eye level","Dual monitors","Standing desk available","Standing desk not available","Keyboard position optimal","Mouse — standard","Mouse — ergonomic","Laptop only — no docking","Headset for phone calls","Poor lighting","Screen glare","Working in cramped space","Hot-desking (variable workstation)","No ergonomic assessment done","Ergonomic assessment done","Ergonomic aids provided","Occupational health involved"] },
      { id:"occ_work_impact",label:"Impact of Symptoms on Work",        type:"multicheck", options:["No impact — working fully","Reduced productivity","Reduced hours","Modified duties agreed","Off work short term (< 4 weeks)","Off work medium term (4–12 weeks)","Off work long term (> 12 weeks)","Risk of job loss","Employer unsupportive","Employer very supportive","Occupational health referral made","Phased return to work planned","Redeployment considered","Unable to return to same role","Changed career due to injury","Work compensation claim active","Work injury — employer dispute"] },
      { id:"occ_history",    label:"Previous Occupational History",     type:"textarea", placeholder:"Previous jobs, cumulative exposures, injuries at work" },
      { id:"occ_notes",      label:"Occupational Notes",                type:"textarea", placeholder:"Any other relevant occupational information" },
    ]
  },

  sports_history: {
    label:"Sports / Activity History", icon:"🏅", color:"#ff9a9e",
    fields:[
      { id:"sh_current_sport",label:"Current Sports / Activities",      type:"text", placeholder:"List all current sports and activities" },
      { id:"sh_years",        label:"Years in Sport",                   type:"text", placeholder:"e.g. 15 years football, 3 years gym" },
      { id:"sh_training_load",label:"Current Training Load",            type:"multicheck", options:["No training currently","1 session/week","2 sessions/week","3 sessions/week","4 sessions/week","5–6 sessions/week","Daily training","Twice daily training","Reduced from normal (injury)","Pre-season (high load)","In-season (moderate-high)","Off-season (reduced)","Competition phase","Taper phase","Just returned after break"] },
      { id:"sh_recent_change",label:"Recent Load Changes",              type:"multicheck", options:["No recent change","Increased volume recently","Increased intensity recently","New sport / activity started","Changed training surface","Changed footwear","Changed technique","Returned from injury lay-off","Just started training again","Pre-season ramp up","Overtraining suspected","No warm-up / cool-down","Training programme changed","New coach / trainer"] },
      { id:"sh_past_injuries",label:"Past Sports Injuries",             type:"multicheck", options:["Ankle sprain (L)","Ankle sprain (R)","Knee ligament (ACL/MCL/PCL/LCL)","Meniscal injury","Shin splints","Stress fracture","Hamstring strain","Quadriceps strain","Calf strain","Achilles tendinopathy","Plantar fasciitis","Patellofemoral pain","IT band syndrome","Hip flexor strain","Groin strain","Hip labral tear","Lower back — disc","Lower back — facet","SI joint","Rotator cuff","Shoulder dislocation","AC joint","Biceps tendon","Tennis/golfer elbow","Wrist sprain","Fractures — upper limb","Fractures — lower limb","Concussion","Stress fracture — foot","No significant past injuries"] },
      { id:"sh_previous_physio",label:"Previous Physiotherapy",        type:"multicheck", options:["No previous physiotherapy","Physiotherapy — helpful","Physiotherapy — partially helpful","Physiotherapy — not helpful","Physiotherapy — made worse","Previous surgery + physio","Ongoing physiotherapy elsewhere","Discharged from physiotherapy","Did not complete course","Sports medicine physician input","Podiatry input","Orthotics prescribed","Strength and conditioning input"] },
      { id:"sh_performance",  label:"Performance Impact",              type:"multicheck", options:["No performance impact","Slightly reduced performance","Significantly reduced performance","Training pain free, competition painful","Cannot train at full capacity","Cannot compete currently","Changed position/event due to injury","Dropped training group / level","Playing through pain","Avoiding certain skills/movements","Biomechanical adaptations noted","Coach has noted change in performance"] },
      { id:"sh_notes",        label:"Sports History Notes",            type:"textarea", placeholder:"Training history, injury history, performance goals" },
    ]
  },

  sleep: {
    label:"Sleep Analysis", icon:"😴", color:"#b388ff",
    fields:[
      { id:"sl_hours",      label:"Average Sleep Duration",             type:"multicheck", options:["< 4 hours (severely inadequate)","4–5 hours (inadequate)","5–6 hours (below optimal)","6–7 hours (borderline)","7–8 hours (optimal)","8–9 hours (slightly long)","9–10 hours (prolonged)","10+ hours (excessive — fatigue/depression?","Variable — no consistent pattern","Sleep disrupted by work shifts"] },
      { id:"sl_quality",    label:"Sleep Quality",                      type:"multicheck", options:["Excellent — restorative","Good — mostly refreshed","Fair — sometimes refreshed","Poor — rarely refreshed","Very poor — never refreshed","Difficulty falling asleep","Difficulty staying asleep","Early morning waking","Vivid dreams / nightmares","Restless sleep","Teeth grinding (bruxism)","Snoring reported","Sleep apnoea diagnosed","Sleep apnoea suspected — not diagnosed","CPAP user","Partner reports abnormal breathing","Restless legs syndrome","Periodic limb movement disorder"] },
      { id:"sl_position",   label:"Sleep Position",                     type:"multicheck", options:["Back sleeper — no pillow","Back sleeper — one pillow","Back sleeper — multiple pillows","Side sleeper — left dominant","Side sleeper — right dominant","Side sleeper — switches sides","Front/prone sleeper","Recliner / armchair sleeper","Cannot lie flat — reflux","Pillow between knees","Pillow under knees","Wedge pillow user","Cervical pillow","Standard pillow","Memory foam pillow","Multiple pillows under head"] },
      { id:"sl_mattress",   label:"Mattress / Sleep Surface",           type:"multicheck", options:["Standard spring mattress","Memory foam mattress","Orthopaedic mattress","Old / sagging mattress","New mattress (< 6 months)","Firm preferred","Soft preferred","Hospital bed at home","Sofa sleeping","Floor sleeping","Adjustable bed","Partner in bed","Children in bed","Pets in bed"] },
      { id:"sl_impact",     label:"Pain Impact on Sleep",               type:"multicheck", options:["Pain does not affect sleep","Pain slightly affects sleep quality","Pain moderately disrupts sleep","Pain severely disrupts sleep","Pain prevents falling asleep","Pain wakes from sleep — once","Pain wakes from sleep — multiple times","Pain on turning in bed","Pain on getting up to toilet","Morning pain from sleep position","No position of comfort","Pain free during sleep — worsens on waking","Fear of sleep due to pain"] },
      { id:"sl_hygiene",    label:"Sleep Hygiene",                      type:"multicheck", options:["Regular sleep schedule","Irregular sleep times","Screen use before bed","Late caffeine use (after 2pm)","Alcohol affecting sleep","Regular exercise (positive effect)","No exercise","Bedroom too hot","Bedroom too cold","Bedroom — noise disruption","Napping during day","Stress affecting sleep","Anxiety at bedtime","Pre-sleep routine established","No pre-sleep routine"] },
      { id:"sl_notes",      label:"Sleep Analysis Notes",              type:"textarea", placeholder:"Any other sleep information relevant to presentation" },
    ]
  },

  psychosocial: {
    label:"Stress / Emotional Factors", icon:"🧠", color:"#90caf9",
    fields:[
      { id:"ps_stress",     label:"Current Stress Level",               type:"multicheck", options:["No significant stress","Mild stress — manageable","Moderate stress — affecting function","High stress — significantly impacting life","Severe stress — crisis level","Work stress dominant","Financial stress dominant","Relationship stress dominant","Bereavement / loss","Family illness / carer stress","Divorce / separation","Housing stress","Legal proceedings stress","Compensation claim stress","Academic stress","Major life change","Multiple simultaneous stressors"] },
      { id:"ps_mood",       label:"Mood / Emotional State",             type:"multicheck", options:["Mood normal / positive","Mild low mood","Moderate depression — diagnosed","Severe depression — diagnosed","Anxiety — mild","Anxiety — moderate / diagnosed","Anxiety — severe / panic attacks","PTSD — diagnosed","PTSD — suspected","Post-natal depression","Grief / bereavement","Anger / frustration prominent","Fear of movement (kinesiophobia)","Catastrophising (believes worst outcome)","Pain catastrophising scale elevated","Hopelessness about recovery","Anger at cause of injury (third party)","Feeling dismissed / not believed","Previously dismissed by healthcare"] },
      { id:"ps_fear_avoid", label:"Fear Avoidance Beliefs",             type:"multicheck", options:["No fear avoidance","Mild — avoids some activities","Moderate — significant avoidance","Severe — very restricted activities","Afraid movement will cause damage","Believes rest is the only treatment","Afraid of re-injury","Avoids all exercise","Protective of injured area excessively","Tampa Scale of Kinesiophobia elevated","Believes pain = damage (unhelpful belief)","Functional overlay suspected","Nocebo effect from previous advice","Fearful of specific diagnoses","Scared of surgery","Catastrophic thinking about future"] },
      { id:"ps_social",     label:"Social Support",                     type:"multicheck", options:["Strong social support network","Partner/spouse supportive","Partner/spouse unsupportive","Family supportive","Family unsupportive","Lives alone","Socially isolated","Good friend network","No close friends","Religious/community support","Carer role limiting own recovery","Dependent on others — increased stress","Children at home — demanding","Good workplace support","Poor workplace support","Employer hostile to injury","Online support groups"] },
      { id:"ps_cope",       label:"Coping Strategies Used",             type:"multicheck", options:["Exercise / physical activity","Mindfulness / meditation","Psychological therapy (CBT/ACT)","Medication","Alcohol (maladaptive)","Cannabis / substances","Social support — friends/family","Religious / spiritual practices","Journalling","Distraction (TV, hobbies)","Rest and pacing","Positive self-talk","Problem-solving approach","Avoidance and withdrawal","Denial","Catastrophising (maladaptive)","No coping strategies identified","Open to psychological input"] },
      { id:"ps_yellow_flags",label:"Yellow Flag Screening",             type:"multicheck", options:["Belief pain is harmful / damaging","Fear of activity / movement","Catastrophising","Low mood / depression","Work dissatisfaction / conflict","Compensation / litigation active","Poor social support","Passive coping — waiting to be fixed","Prior chronic pain episode","Maladaptive pain beliefs","Somatisation of stress","Hypervigilance to symptoms","Poor sleep contributing to pain","Unhelpful advice from previous clinician","Multiple failed treatments (suggests psychosocial driver)","Poor self-efficacy for recovery"] },
      { id:"ps_notes",      label:"Psychosocial Notes",                 type:"textarea", placeholder:"Psychosocial assessment — attitude, beliefs, emotional factors" },
    ]
  },

  past_medical: {
    label:"Past Medical History", icon:"📋", color:"#ff6b6b",
    fields:[
      { id:"pmh_conditions", label:"Medical Conditions",                type:"multicheck", options:["Type 1 Diabetes","Type 2 Diabetes","Hypertension","Cardiac disease — IHD","Cardiac disease — heart failure","Cardiac disease — arrhythmia","Previous MI (heart attack)","Previous stroke / TIA","Peripheral vascular disease","DVT / pulmonary embolism","Asthma","COPD","Chronic kidney disease","Liver disease","Autoimmune — Rheumatoid Arthritis","Autoimmune — Lupus (SLE)","Autoimmune — Ankylosing Spondylitis","Autoimmune — Psoriatic Arthritis","Osteoarthritis","Osteoporosis / Osteopenia","Gout","Fibromyalgia","Chronic Fatigue Syndrome (ME/CFS)","IBS / IBD","GORD / acid reflux","Epilepsy","Multiple Sclerosis","Parkinson's Disease","Peripheral neuropathy","Hypothyroidism","Hyperthyroidism","Obesity","Malignancy — current or past","HIV","Hepatitis B / C","Mental health condition (see psychosocial)","Haemophilia / bleeding disorder","Anaemia","Eating disorder — history","Chronic pain condition — previous"] },
      { id:"pmh_pregnancy",  label:"Pregnancy / Gynaecological",        type:"multicheck", options:["Not applicable","Currently pregnant","Post-partum < 6 months","Post-partum 6–12 months","Multiple pregnancies","C-section history","Pelvic floor dysfunction","Diastasis recti","Menopause — peri","Menopause — post","Endometriosis","PCOS","Hormonal therapy (HRT)","Oral contraceptive pill"] },
      { id:"pmh_fractures",  label:"Fractures / Trauma History",        type:"multicheck", options:["No significant fractures","Cervical spine fracture","Thoracic spine fracture","Lumbar spine fracture","Coccyx fracture","Pelvic fracture","Hip fracture","Femur fracture","Tibial/fibular fracture","Foot fractures","Shoulder / clavicle fracture","Humerus fracture","Radius/ulna fracture","Wrist fracture","Hand/finger fractures","Rib fractures","Sternal fracture","Multiple fractures — trauma","Stress fractures — history","Growth plate injury (paediatric)"] },
      { id:"pmh_neuro",      label:"Neurological History",              type:"multicheck", options:["No neurological history","Disc herniation — cervical","Disc herniation — lumbar","Spinal stenosis — cervical","Spinal stenosis — lumbar","Spondylolisthesis","Spondylolysis","Cauda equina — history","Myelopathy — cervical","Radiculopathy — previous episode","Carpal tunnel syndrome — history","Cubital tunnel syndrome","Ulnar nerve neuropathy","Common peroneal nerve injury","Sciatic nerve injury","Brachial plexus injury","Thoracic outlet syndrome","Meralgia paraesthetica"] },
      { id:"pmh_other",      label:"Other Relevant History",            type:"textarea", placeholder:"Any other relevant past medical conditions, hospitalisations" },
    ]
  },

  surgical: {
    label:"Surgical History", icon:"🏥", color:"#ff8c42",
    fields:[
      { id:"surg_spine",    label:"Spinal Surgery",                     type:"multicheck", options:["No spinal surgery","Cervical discectomy","Cervical fusion (ACDF)","Lumbar microdiscectomy","Lumbar laminectomy","Lumbar decompression","Lumbar fusion (TLIF/PLIF/ALIF)","Lumbar fusion — multiple levels","Scoliosis correction — spinal rods","Disc replacement — cervical","Disc replacement — lumbar","Coccygectomy","Spinal cord stimulator implant"] },
      { id:"surg_lower",    label:"Lower Limb Surgery",                 type:"multicheck", options:["No lower limb surgery","Hip replacement (THR) — left","Hip replacement (THR) — right","Hip resurfacing","Hip arthroscopy — FAI surgery","Hip arthroscopy — labral repair","Knee replacement (TKR) — left","Knee replacement (TKR) — right","ACL reconstruction — left","ACL reconstruction — right","PCL reconstruction","Meniscectomy — partial","Meniscal repair","Knee arthroscopy","Patellofemoral realignment","OATS / cartilage repair (knee)","Ankle ligament reconstruction","Ankle arthroscopy","Ankle fusion","Achilles repair","Plantar fascia surgery","Foot surgery — bunion (hallux valgus)","Foot surgery — other","Tibial osteotomy"] },
      { id:"surg_upper",    label:"Upper Limb Surgery",                 type:"multicheck", options:["No upper limb surgery","Shoulder replacement (TSR)","Shoulder arthroscopy — subacromial","Shoulder arthroscopy — SLAP repair","Shoulder arthroscopy — Bankart","Rotator cuff repair — partial","Rotator cuff repair — full thickness","AC joint surgery","Clavicle ORIF","Shoulder fusion","Elbow arthroscopy","Elbow replacement","Tennis elbow surgery","Ulnar nerve transposition","Carpal tunnel release — left","Carpal tunnel release — right","Dupuytren's contracture release","De Quervain's surgery","Wrist arthroscopy","Wrist fusion","TFCC repair","Hand surgery","Trigger finger release"] },
      { id:"surg_abdominal",label:"Abdominal / Pelvic Surgery",        type:"multicheck", options:["No abdominal surgery","Appendectomy","Caesarean section","Hysterectomy","Laparoscopic surgery (general)","Bowel surgery","Colostomy","Hernia repair — inguinal","Hernia repair — umbilical","Hernia repair — hiatus","Prostatectomy","Bladder surgery","Kidney surgery","Gallbladder removal (cholecystectomy)","Liver surgery","Splenectomy","Bariatric surgery"] },
      { id:"surg_other",    label:"Other Surgery",                      type:"multicheck", options:["No other surgery","General anaesthetic — other","Cardiac surgery","Thoracic surgery","Neurosurgery — brain","ENT surgery","Eye surgery","Dental surgery — major","Skin graft","Amputation","Trauma surgery — ORIF","Tumour excision"] },
      { id:"surg_complications",label:"Surgical Complications",        type:"multicheck", options:["No complications","Wound infection","DVT post-surgery","Pulmonary embolism post-surgery","Nerve damage intra-operative","Implant failure","Hardware removal required","Revision surgery required","Prolonged rehabilitation","Pain persisting post-surgery","Unexpected outcome","Re-admission post-surgery"] },
      { id:"surg_notes",    label:"Surgical History Notes",            type:"textarea", placeholder:"Dates, outcomes, complications, ongoing effects of surgery" },
    ]
  },

  medications: {
    label:"Medication History", icon:"💊", color:"#80deea",
    fields:[
      { id:"med_analgesia",  label:"Current Analgesia",                 type:"multicheck", options:["No analgesia currently","Paracetamol — PRN","Paracetamol — regular","Ibuprofen — PRN","Ibuprofen — regular","Naproxen","Diclofenac (oral)","Diclofenac (topical — Voltarol)","Celecoxib (COX-2 inhibitor)","Codeine","Co-codamol (paracetamol + codeine)","Tramadol","Morphine (oral)","Oxycodone","Gabapentin","Pregabalin (Lyrica)","Amitriptyline (pain)","Duloxetine","Capsaicin topical","Lidocaine patches","Aspirin (analgesia)","Compound analgesics"] },
      { id:"med_injections", label:"Recent / Past Injections",          type:"multicheck", options:["No injections","Corticosteroid injection < 3 months","Corticosteroid injection 3–12 months","Multiple steroid injections — same site","Hyaluronic acid (viscosupplementation)","PRP (platelet-rich plasma)","Prolotherapy","Trigger point injection","Epidural steroid injection","Selective nerve root block","Facet joint injection","SIJ injection","Botox injection (muscle)","Radiofrequency ablation","Medial branch block"] },
      { id:"med_regular",    label:"Regular Medications (non-pain)",    type:"multicheck", options:["Antihypertensives","Beta blockers","ACE inhibitors","Statins (cholesterol)","Anticoagulants — warfarin","Anticoagulants — DOAC (rivaroxaban/apixaban)","Antiplatelet — aspirin","Antiplatelet — clopidogrel","Antidiabetics — oral","Insulin","Thyroid medication","SSRIs / antidepressants","SNRIs","Benzodiazepines","Sleeping tablets","Immunosuppressants","DMARDs (methotrexate/sulfasalazine)","Biologics (adalimumab/etanercept)","Oral corticosteroids","Hormone therapy (HRT)","Oral contraceptive pill","Bisphosphonates (osteoporosis)","Proton pump inhibitors (PPI)","Inhalers — SABA / LABA / ICS","Anticonvulsants"] },
      { id:"med_allergies",  label:"Drug Allergies / Intolerances",    type:"multicheck", options:["No known drug allergies","Penicillin allergy","NSAIDs — GI intolerance","NSAIDs — allergy/anaphylaxis","Aspirin intolerance","Codeine — side effects","Tramadol — intolerance","Morphine — intolerance","Latex allergy (relevant for treatment)","Iodine allergy","Nickel allergy (relevant for TENS/treatment)","Other — see notes"] },
      { id:"med_supplements",label:"Supplements / Herbal / OTC",       type:"multicheck", options:["No supplements","Vitamin D","Calcium","Magnesium","Fish oil / Omega 3","Glucosamine","Chondroitin","Turmeric / curcumin","CBD oil","Protein supplements","Multivitamin","Iron","Vitamin B12","Folic acid","Melatonin (sleep)","Herbal remedies (specify in notes)","Cannabis — medicinal","Cannabis — recreational"] },
      { id:"med_effectiveness",label:"Medication Effectiveness",       type:"multicheck", options:["Medication well controlled","Medication partially helps","Medication not effective","Side effects limiting use","Too sedating to function","Constipation from opioids","GI side effects from NSAIDs","Stopped medication — side effects","Wants to reduce medication","Currently weaning","No medication for this condition"] },
      { id:"med_notes",      label:"Medication Notes",                 type:"textarea", placeholder:"Any other relevant medication information, recent changes" },
    ]
  },

  red_flags: {
    label:"Red Flag Screening", icon:"🚨", color:"#ff4d6d",
    fields:[
      { id:"rf_malignancy",  label:"Malignancy Red Flags",              type:"multicheck", options:["No malignancy red flags","History of cancer — specify in notes","Unexplained weight loss > 5kg","Night sweats — unexplained","Fever accompanying pain","Fatigue — severe and unexplained","Pain unrelated to movement or position","Pain progressive despite rest","Age > 50 — first episode back pain","Bilateral sciatic symptoms","Pain not responding to any treatment","Supraclavicular lymphadenopathy","Axillary lymphadenopathy","Palpable mass in region of pain"] },
      { id:"rf_cauda",       label:"Cauda Equina Red Flags",            type:"multicheck", options:["No cauda equina flags","Bladder retention — acute","Bladder incontinence — new","Bowel incontinence — new","Saddle anaesthesia — perianal","Saddle anaesthesia — inner thigh","Sexual dysfunction — new onset","Bilateral leg weakness — sudden","Bilateral leg numbness — sudden","Bilateral sciatica","Rapid neurological deterioration","Progressive lower limb weakness"] },
      { id:"rf_vascular",    label:"Vascular Red Flags",                type:"multicheck", options:["No vascular red flags","Calf pain with walking — claudication","Claudication distance < 200m","Rest pain in leg — not musculoskeletal","Absent peripheral pulses (known)","Severe leg pallor","Non-healing leg ulcer","Aortic aneurysm — known","Pulsatile abdominal mass","Severe sudden-onset headache (thunderclap)","Posterior neck pain with visual changes","Dizziness with neck movement (VBI)"] },
      { id:"rf_inflammatory",label:"Inflammatory / Systemic Red Flags", type:"multicheck", options:["No inflammatory red flags","Morning stiffness > 45 minutes","Age of onset < 40 years","Peripheral joint swelling","Iritis / eye inflammation","Psoriasis","Inflammatory bowel disease","Family history of inflammatory arthritis","Enthesitis (tendon insertion pain)","Pain responds to NSAIDs strongly","Fever with musculoskeletal pain","Recent infection preceding pain","Raised inflammatory markers (known)","Immunosuppressed patient"] },
      { id:"rf_fracture",    label:"Fracture / Bone Red Flags",         type:"multicheck", options:["No fracture red flags","Major trauma (RTA, fall from height)","Minor trauma in osteoporotic patient","Age > 70 — first episode back pain","Long-term steroid use","Known osteoporosis","Point tenderness on bone","Localised night pain on bone","Unexplained pathological fracture","Recent corticosteroid use > 3 months"] },
      { id:"rf_neuro",       label:"Neurological Red Flags",            type:"multicheck", options:["No neurological red flags","Myelopathy signs (bilateral weakness/numbness)","Positive Babinski sign","Hyperreflexia — UMN pattern","Rapidly progressive neurological deficit","Cervical myelopathy symptoms","Bilateral hand weakness","Difficulty walking — ataxia","Falls — unexplained","Dysphagia (swallowing difficulty)","Dysarthria (speech difficulty)","Diplopia (double vision)","Facial numbness / weakness","Sudden severe headache","Altered consciousness"] },
      { id:"rf_other",       label:"Other Red Flags",                   type:"multicheck", options:["IV drug use — risk of discitis","Tuberculosis — risk of Pott's disease","Recent infection — septic arthritis risk","Open wound near joint","Acute severe joint swelling — hot","Immunocompromised — any cause","Transplant recipient","Chronic corticosteroid use","Unexplained systemic symptoms","Patient appears systemically unwell","Clinician clinical gut feeling — refer"] },
      { id:"rf_action",      label:"Red Flag Action Taken",             type:"multicheck", options:["No red flags — proceed with assessment","Red flags noted — monitor","Urgent GP referral made","Emergency A&E referral","Same day orthopaedic referral","Urgent MRI requested","Urgent bloods requested","Liaised with GP","Patient informed","Red flags discussed with patient","Safety netting advice given"] },
      { id:"rf_notes",       label:"Red Flag Notes",                   type:"textarea", placeholder:"Document all red flags and actions taken" },
    ]
  },

  yellow_flags: {
    label:"Yellow Flag Screening", icon:"🟡", color:"#ffb300",
    fields:[
      { id:"yf_beliefs",    label:"Beliefs About Pain",                 type:"multicheck", options:["Believes pain = damage (unhelpful)","Believes rest is the only treatment","Believes cannot recover","Believes activity will cause harm","Believes pain is permanent","Expects worst outcome","Catastrophising — magnification","Catastrophising — rumination","Catastrophising — helplessness","Expects surgery is needed","Believes medication is the only solution","Negative health beliefs generally","Multiple previous diagnoses — confused","Conflicting advice received","Received unhelpful nocebo advice"] },
      { id:"yf_emotions",   label:"Emotional Factors",                  type:"multicheck", options:["No significant emotional factors","Mild anxiety","Moderate anxiety","Severe anxiety","Mild depression","Moderate depression","Severe depression","Anger — at cause of injury","Anger — at healthcare system","Fear of the future","Grief from loss of activity/identity","Emotional distress prominent","PTSD symptoms","Emotional overlay affecting presentation","Crying during consultation","Hypervigilance to symptoms"] },
      { id:"yf_behaviour",  label:"Pain Behaviour",                     type:"multicheck", options:["Appropriate pain behaviour","Exaggerated pain behaviour (not malingering)","Reduced pain behaviour (stoic)","Significant kinesiophobia","Avoidance of all activity","Avoidance of specific activities","Withdrawal from social activities","Overprotection of body part","Excessive checking of symptoms","Seeking excessive investigations","Multiple healthcare providers (shopping)","Distress out of proportion to findings","Significant effort intolerance","Deactivated lifestyle","Significant guarding"] },
      { id:"yf_work",       label:"Workplace Yellow Flags",             type:"multicheck", options:["No workplace yellow flags","Unhappy at work pre-injury","Conflict with employer","Conflict with colleagues","Fear of returning to same job","Believes work is harmful","Compensation claim active","Litigation ongoing","Secondary gain possible","Employer dispute","Lack of job control","Monotonous work","Poor workplace relationships","History of workplace bullying","Job insecurity"] },
      { id:"yf_recovery",   label:"Recovery Expectations",              type:"multicheck", options:["Positive — expects recovery","Uncertain about recovery","Negative — does not expect recovery","Unsure what recovery looks like","Expects to return to full function","Expects permanent restriction","Goal — return to sport","Goal — return to work","Goal — pain reduction only","Goal — not clearly identified","Fear of being a burden","Motivated to participate in treatment","Passive recovery expectation","Has not thought about goals"] },
      { id:"yf_assessment", label:"Psychosocial Assessment Tools",      type:"multicheck", options:["Start Back Screening Tool — low risk","Start Back Screening Tool — medium risk","Start Back Screening Tool — high risk","Örebro Musculoskeletal Pain Questionnaire","Tampa Scale Kinesiophobia","Pain Catastrophising Scale","Hospital Anxiety Depression Scale (HADS)","PHQ-9 Depression Screen","GAD-7 Anxiety Screen","Keele STarT Back Tool","Psychosocial referral made","Psychology onward referral","Pain management programme referral"] },
      { id:"yf_notes",      label:"Yellow Flag Notes",                 type:"textarea", placeholder:"Document psychosocial yellow flags and planned management" },
    ]
  },

  patient_goals: {
    label:"Patient Goals", icon:"🎯", color:"#00c97a",
    fields:[
      { id:"pg_primary",    label:"Primary Patient Goal",               type:"textarea", placeholder:"In the patient's own words — what is the number 1 thing they want to achieve?" },
      { id:"pg_goals",      label:"Specific Goals (select all relevant)",type:"multicheck", options:["Return to full-time work","Return to modified work","Return to specific sport","Return to exercise / gym","Return to running","Return to swimming","Return to cycling","Return to golf","Return to team sport","Return to martial arts","Return to dancing","Return to yoga/Pilates","Walk without pain","Walk further distances","Sleep through the night","Reduce pain medication","Stop pain medication","Independent self-care","Lift/carry children","Drive without pain","Travel without pain","Resume social activities","Resume hobbies","Resume sexual activity","Manage pain long-term","Understand condition","Prevent recurrence","Improve posture","Improve fitness","Improve flexibility","Lose weight","Improve balance","Prevent falls","Avoid surgery","Post-surgical recovery","Improve quality of life generally","Be able to garden","Do housework independently","Reduce healthcare appointments","Self-manage"] },
      { id:"pg_timeline",   label:"Patient's Desired Timeline",         type:"multicheck", options:["Immediate — wants relief now","As soon as possible","< 2 weeks","2–4 weeks","4–6 weeks","6–8 weeks","2–3 months","3–6 months","6–12 months","No specific timeline","Before a specific event (see notes)","Realistic — open to therapist guidance","Unrealistic — needs education"] },
      { id:"pg_values",     label:"What Matters Most to Patient",       type:"multicheck", options:["Being pain free","Being able to work","Being a good parent/carer","Being active and fit","Sports/athletic identity","Independence","Sleep quality","Mental health","Relationships","Social life","Career progression","Financial stability","Faith/religious practice","Avoiding surgery","Not relying on medication","Being in control of health"] },
      { id:"pg_barriers",   label:"Barriers to Achieving Goals",        type:"multicheck", options:["No significant barriers","Pain too high to exercise","Fear of movement / re-injury","Low confidence","Poor health literacy","Lack of time","Work demands","Childcare responsibilities","Carer responsibilities","Financial barriers","Transport to appointments","Language barrier","Low motivation currently","Chronic fatigue","Comorbidities limiting treatment","Social isolation","Lack of support","Poor previous experience with physiotherapy"] },
      { id:"pg_psfs",       label:"PSFS — Activity 1 (0–10)",          type:"text", placeholder:"Activity: [write activity] — Score: 0=unable, 10=normal" },
      { id:"pg_psfs2",      label:"PSFS — Activity 2 (0–10)",          type:"text", placeholder:"Activity: [write activity] — Score:" },
      { id:"pg_psfs3",      label:"PSFS — Activity 3 (0–10)",          type:"text", placeholder:"Activity: [write activity] — Score:" },
      { id:"pg_notes",      label:"Goals Notes",                       type:"textarea", placeholder:"Shared decision-making, agreed goals, clinician comments" },
    ]
  },

  outcome_measures: {
    label:"Outcome Measures", icon:"📊", color:"#a8ff3e",
    fields:[
      { id:"om_general",    label:"General Outcome Measures",           type:"multicheck", options:["Global Rating of Change (GROC)","Patient Specific Functional Scale (PSFS)","Short Form 36 (SF-36)","EQ-5D (health-related quality of life)","PROMIS Global Health","WHO-DAS 2.0 (disability assessment)"] },
      { id:"om_pain",       label:"Pain Outcome Measures",              type:"multicheck", options:["NRS (Numerical Rating Scale) 0–10","VAS (Visual Analogue Scale)","Brief Pain Inventory (BPI)","McGill Pain Questionnaire","Pain Catastrophising Scale (PCS)","Central Sensitisation Inventory (CSI)"] },
      { id:"om_spine",      label:"Spine Outcome Measures",             type:"multicheck", options:["Oswestry Disability Index (ODI) — lumbar","Neck Disability Index (NDI) — cervical","Keele STarT Back Screening Tool","Roland Morris Disability Questionnaire","Core Outcome Measures Index (COMI)","Waddell Disability Index","Aberdeen Low Back Pain Scale"] },
      { id:"om_upper",      label:"Upper Limb Outcome Measures",        type:"multicheck", options:["DASH (Disabilities of Arm, Shoulder, Hand)","QuickDASH","ASES (American Shoulder Elbow Surgeons)","Oxford Shoulder Score","WORC (Western Ontario Rotator Cuff)","WOSI (Western Ontario Shoulder Instability)","Constant Murley Score","Oxford Elbow Score","Patient-Rated Elbow Evaluation (PREE)","Patient-Rated Wrist Evaluation (PRWE)","UEFI (Upper Extremity Functional Index)"] },
      { id:"om_lower",      label:"Lower Limb Outcome Measures",        type:"multicheck", options:["KOOS (Knee injury and OA Outcome Score)","IKDC (International Knee Documentation Committee)","Lysholm Knee Scale","Oxford Knee Score","Oxford Hip Score","HOOS (Hip injury and OA Outcome Score)","iHOT-33 (Hip)","FAAM (Foot and Ankle Ability Measure)","FAOS (Foot and Ankle Outcome Score)","VISA-A (Achilles tendinopathy)","LEFS (Lower Extremity Functional Scale)","Victorian Institute of Sport Assessment (VISA)"] },
      { id:"om_psych",      label:"Psychological Outcome Measures",     type:"multicheck", options:["Tampa Scale of Kinesiophobia (TSK-11)","Hospital Anxiety Depression Scale (HADS)","PHQ-9 Depression Screen","GAD-7 Anxiety Screen","Örebro Musculoskeletal Pain Questionnaire","Start Back Screening Tool","Pain Self-Efficacy Questionnaire (PSEQ)","Fear Avoidance Beliefs Questionnaire (FABQ)"] },
      { id:"om_sport",      label:"Sport Outcome Measures",             type:"multicheck", options:["VISA-P (Patellar tendinopathy)","ACL-RSI (Return to Sport after ACL)","SCAT5 (Sport Concussion Assessment)","FMS Score (Functional Movement Screen)","Y-Balance Test","Single Leg Hop Tests","Star Excursion Balance Test (SEBT)","Athlete-specific sport tests"] },
      { id:"om_baseline",   label:"Baseline Scores (Initial Assessment)",type:"textarea", placeholder:"Record baseline scores for all administered outcome measures with dates" },
      { id:"om_reassess",   label:"Reassessment Schedule",              type:"multicheck", options:["Reassess at 4 weeks","Reassess at 6 weeks","Reassess at 8 weeks","Reassess at 3 months","Reassess at 6 months","Reassess at discharge","Reassess at each session","Compare to baseline at each reassessment"] },
      { id:"om_notes",      label:"Outcome Measure Notes",              type:"textarea", placeholder:"Interpretation of scores, changes from baseline, clinical significance" },
    ]
  },
};

// ─── SUBJECTIVE MODULE COMPONENT ─────────────────────────────────────────────
function SubjectiveModule({ data, set }) {
  const [activeSection, setActiveSection] = useState("demographics");
  const [searchTerm, setSearchTerm] = useState("");
  const section = SUBJECTIVE_SECTIONS[activeSection];

  const countFilled = (secId) => {
    const sec = SUBJECTIVE_SECTIONS[secId];
    return sec.fields.filter(f => data[f.id] && data[f.id] !== "").length;
  };
  const totalFilled = Object.keys(SUBJECTIVE_SECTIONS).reduce((sum, k) => sum + countFilled(k), 0);
  const totalFields = Object.values(SUBJECTIVE_SECTIONS).reduce((sum, s) => sum + s.fields.length, 0);
  const pct = Math.round(totalFilled / totalFields * 100);

  const renderField = (f) => {
    const val = data[f.id] || "";
    const base = { width:"100%", background:C.s3, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontFamily:"inherit", outline:"none", padding:"8px 10px", fontSize:"0.8rem" };

    if (f.type === "multicheck") {
      const selected = val ? val.split("|||").filter(Boolean) : [];
      const filtered = f.options.filter(o => !searchTerm || o.toLowerCase().includes(searchTerm.toLowerCase()));
      const toggle = (opt) => {
        const next = selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt];
        set(f.id, next.join("|||"));
      };
      return (
        <div>
          {selected.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:8 }}>
              {selected.map(s => (
                <span key={s} onClick={() => toggle(s)}
                  style={{ padding:"3px 9px", borderRadius:20, fontSize:"0.7rem", fontWeight:600, background:`${section.color}20`, border:`1px solid ${section.color}50`, color:section.color, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                  {s} <span style={{ fontWeight:900, opacity:0.7 }}>×</span>
                </span>
              ))}
            </div>
          )}
          <div style={{ maxHeight:220, overflowY:"auto", border:`1px solid ${C.border}`, borderRadius:8, padding:6 }}>
            {filtered.map(opt => {
              const sel = selected.includes(opt);
              return (
                <div key={opt} onClick={() => toggle(opt)}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 7px", borderRadius:6, cursor:"pointer", background:sel?`${section.color}12`:"transparent", marginBottom:2, transition:"all 0.1s" }}>
                  <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${sel?section.color:C.border}`, background:sel?section.color:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {sel && <span style={{ color:"#000", fontSize:"0.55rem", fontWeight:900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:"0.78rem", color:sel?C.text:C.muted }}>{opt}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (f.type === "textarea") return (
      <textarea value={val} onChange={e => set(f.id, e.target.value)} placeholder={f.placeholder || ""}
        style={{ ...base, resize:"vertical", minHeight:72, display:"block" }} />
    );
    if (f.type === "select") return (
      <select value={val} onChange={e => set(f.id, e.target.value)} style={base}>
        <option value="">— select —</option>
        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
    return (
      <input type={f.type || "text"} value={val} onChange={e => set(f.id, e.target.value)}
        placeholder={f.placeholder || ""} style={base} />
    );
  };

  return (
    <div>
      {/* Progress bar */}
      <div style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:10, padding:14, marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ fontWeight:700, color:C.text, fontSize:"0.85rem" }}>Subjective Assessment Progress</span>
          <span style={{ fontWeight:800, color:C.accent, fontSize:"0.85rem" }}>{pct}% complete</span>
        </div>
        <div style={{ height:6, background:C.s3, borderRadius:6, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${C.accent},${C.a2})`, borderRadius:6, transition:"width 0.3s" }} />
        </div>
        <div style={{ fontSize:"0.7rem", color:C.muted, marginTop:6 }}>{totalFilled} of {totalFields} fields completed across all sections</div>
      </div>

      {/* Search */}
      <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        placeholder="🔍 Search options across all fields..."
        style={{ width:"100%", background:C.s2, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, padding:"9px 12px", fontSize:"0.82rem", fontFamily:"inherit", outline:"none", marginBottom:14 }} />

      {/* Section tabs */}
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:16 }}>
        {Object.entries(SUBJECTIVE_SECTIONS).map(([key, sec]) => {
          const filled = countFilled(key);
          const total = sec.fields.length;
          const isActive = activeSection === key;
          return (
            <button key={key} type="button" onClick={() => setActiveSection(key)}
              style={{ padding:"6px 12px", borderRadius:20, border:`1px solid ${isActive ? sec.color : filled > 0 ? sec.color + "50" : C.border}`, background: isActive ? `${sec.color}18` : filled > 0 ? `${sec.color}08` : "transparent", color: isActive ? sec.color : filled > 0 ? sec.color : C.muted, fontSize:"0.73rem", fontWeight: isActive ? 700 : 500, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
              {sec.icon} {sec.label}
              {filled > 0 && <span style={{ background:sec.color, color:"#000", borderRadius:10, padding:"0 5px", fontSize:"0.6rem", fontWeight:800 }}>{filled}</span>}
            </button>
          );
        })}
      </div>

      {/* Section content */}
      <div style={{ background:`${section.color}08`, border:`1px solid ${section.color}25`, borderRadius:10, padding:"10px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:"1.4rem" }}>{section.icon}</span>
        <div>
          <div style={{ fontWeight:800, color:section.color, fontSize:"0.95rem" }}>{section.label}</div>
          <div style={{ fontSize:"0.7rem", color:C.muted }}>{section.fields.length} fields · {countFilled(activeSection)} completed</div>
        </div>
      </div>

      {/* Fields */}
      <div style={{ display:"grid", gap:12 }}>
        {section.fields.map(f => {
          const val = data[f.id] || "";
          const hasVal = val !== "";
          const selectedCount = f.type === "multicheck" ? (val ? val.split("|||").filter(Boolean).length : 0) : 0;
          return (
            <div key={f.id} style={{ background:C.surface, border:`1px solid ${hasVal ? section.color + "40" : C.border}`, borderRadius:10, padding:"11px 13px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                <label style={{ fontSize:"0.8rem", fontWeight:600, color:hasVal ? C.text : C.muted }}>
                  {f.label}
                  {hasVal && <span style={{ color:section.color, marginLeft:6, fontSize:"0.65rem" }}>✓</span>}
                  {selectedCount > 0 && <span style={{ marginLeft:6, background:section.color, color:"#000", borderRadius:8, padding:"0 6px", fontSize:"0.62rem", fontWeight:800 }}>{selectedCount} selected</span>}
                </label>
                {f.type === "multicheck" && val && (
                  <button type="button" onClick={() => set(f.id, "")} style={{ fontSize:"0.65rem", color:C.muted, background:"none", border:"none", cursor:"pointer", padding:"2px 6px" }}>clear</button>
                )}
              </div>
              {renderField(f)}
              {/* Free text supplement for multicheck */}
              {f.type === "multicheck" && (
                <textarea value={data[f.id + "_notes"] || ""} onChange={e => set(f.id + "_notes", e.target.value)}
                  placeholder="Additional notes / specify..."
                  style={{ width:"100%", background:C.s3, border:`1px solid ${C.border}`, borderRadius:6, color:C.text, fontFamily:"inherit", outline:"none", padding:"6px 8px", fontSize:"0.76rem", resize:"vertical", minHeight:44, marginTop:6, display:"block" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── NKT REGION DATABASE ─────────────────────────────────────────────────────
const NKT_REGIONS = {
  cervical:{
    label:"Cervical / Head & Neck", color:"#00e5ff",
    intro:"The cervical NKT assessment identifies which muscles the Motor Control Centre (MCC) has inhibited in the neck and head region, and which synergists are compensating. Common compensation: DNF inhibited → SCM/scalenes overactive → forward head posture, headache, TMJ.",
    tests:[
      {
        id:"nkt_dnf", label:"Deep Neck Flexors (DNF)", muscle:"Longus colli / Longus capitis",
        compensator:"SCM, scalenes, suboccipitals",
        how:"Patient supine. Place pressure biofeedback cuff at neck (inflate to 20mmHg baseline). Ask patient to gently nod chin (craniocervical flexion — NOT a chin tuck). Gradually increase target pressure from 22 → 24 → 26 → 28 → 30mmHg holding each 10 seconds. Confirm by touching SCM during test — if SCM fires early or dominates, DNF is inhibited.",
        options:[
          { val:"Facilitated", color:"#00c97a", meaning:"DNF activates before SCM. Patient can reach 28–30mmHg without SCM firing. Normal motor control. No NKT treatment needed for DNF." },
          { val:"Inhibited", color:"#ff4d6d", meaning:"DNF cannot maintain pressure targets. SCM fires early and dominates. MCC has turned off DNF — forward head is maintained by SCM/scalenes. TREAT: release SCM/scalenes → activate DNF immediately." },
          { val:"Overactive", color:"#ffb300", meaning:"Rare. DNF may be overworking due to inhibition elsewhere (e.g. longus colli compensating for atlas instability). Presents as anterior neck pain with no relief from flexion." },
        ],
        treatment:"Release: SCM (pressure/massage) + scalenes (SMR). Activate: chin nod 10 reps × 3 sets. Home: tongue to roof of mouth posture drill. Reprogram MCC within 30 seconds of release.",
      },
      {
        id:"nkt_scm", label:"Sternocleidomastoid (SCM)", muscle:"SCM",
        compensator:"When overactive: compensating for inhibited DNF or contralateral upper trap",
        how:"Patient supine. Therapist palpates SCM (finger on muscle belly, sternal and clavicular heads). Ask patient to flex neck against resistance. SCM should only assist — if it fires hard and first, it is overactive. Therapy localization: touch SCM belly → re-test DNF. If DNF suddenly stronger = SCM is the overactive compensator.",
        options:[
          { val:"Normal tone", color:"#00c97a", meaning:"SCM assists neck flexion appropriately. Normal recruitment. Not compensating." },
          { val:"Overactive — compensating for DNF", color:"#ff4d6d", meaning:"SCM fires before DNF and dominates flexion. Confirmed by therapy localization. TREAT: release SCM → activate DNF. Patient often has forward head, headache, TMJ symptoms." },
          { val:"Overactive — compensating for upper trap", color:"#ffb300", meaning:"SCM overactive contralaterally to compensate for ipsilateral upper trap inhibition. Causes head tilt and rotation asymmetry." },
          { val:"Bilateral overactive", color:"#7f5af0", meaning:"Both SCMs overactive — typically compensating for inhibited core/diaphragm. Patient often has forward head with breathing dysfunction." },
        ],
        treatment:"Release: light pressure massage on SCM belly for 60–90 sec. Stretch: gentle lateral flexion opposite side. Then immediately activate: DNF chin nods. Never aggressively stretch an overactive SCM without activating DNF first.",
      },
      {
        id:"nkt_suboccip", label:"Suboccipital Muscles", muscle:"Rectus capitis posterior / Obliquus capitis",
        compensator:"When overactive: compensating for inhibited DNF or cervical flexors",
        how:"Patient prone or supine. Palpate suboccipital triangle (base of skull). Apply gentle pressure while patient slowly nods chin. Suboccipitals should relax with DNF activation. If they remain hard or increase in tone — overactive. Test: place finger on suboccipitals → re-test DNF → if DNF stronger, suboccipitals are compensating.",
        options:[
          { val:"Normal", color:"#00c97a", meaning:"Suboccipitals relax when DNF activates. Normal reciprocal inhibition. No compensation pattern." },
          { val:"Overactive — DNF compensation", color:"#ff4d6d", meaning:"Suboccipitals are hard and tender. Maintain atlas extension. Patient has upper cervical pain, base of skull headache, dizziness, and restricted C0–C1 mobility. TREAT: suboccipital release → DNF activation." },
          { val:"Overactive — eye muscle compensation", color:"#ffb300", meaning:"Suboccipitals overactive due to visual compensation. Follows eye movement dysfunction. Ask patient to look in directions — if symptoms change, visual/vestibular system involved." },
        ],
        treatment:"Release: suboccipital decompression (therapist fingers under occiput, sustained gentle traction 2–3 min). Dry needling to suboccipitals if acute. Then activate DNF. Refer for eye/vestibular assessment if visual pattern present.",
      },
      {
        id:"nkt_upper_trap", label:"Upper Trapezius", muscle:"Upper trapezius / Levator scapulae",
        compensator:"When overactive: compensating for inhibited lower trapezius or DNF",
        how:"Patient seated. Therapist palpates upper trapezius (upper shoulder, fibres between neck and acromion). Apply gentle downward pressure on shoulder (shrug resistance). If upper trap fires immediately and forcefully with minimal load = overactive. Therapy localization: touch upper trap → re-test lower trapezius. If lower trap suddenly stronger = upper trap compensating for lower trap inhibition.",
        options:[
          { val:"Normal tone", color:"#00c97a", meaning:"Upper trap fires proportionally with lower and middle trap. No shoulder elevation at rest or with light load." },
          { val:"Overactive — lower trap inhibition", color:"#ff4d6d", meaning:"Upper trap fires excessively. Shoulder visibly elevated at rest. Lower trap tests weak. TREAT: release upper trap → activate lower trap immediately. Common in desk workers, impingement." },
          { val:"Overactive — DNF inhibition", color:"#ffb300", meaning:"Upper trap overactive as distant compensation for cervical instability. Touching upper trap improves DNF test. Release upper trap → activate DNF." },
          { val:"Overactive — breathing dysfunction", color:"#7f5af0", meaning:"Upper trap overactive as accessory breathing muscle. Patient breathes into upper chest. Release upper trap + retrain diaphragmatic breathing." },
        ],
        treatment:"Release: SMR upper trap (tennis ball or foam roller). Massage: cross-fibre across fibres. Stretch: lateral neck stretch (ear to opposite shoulder). Then immediately activate lower trapezius: prone Y-exercise. Home: shoulder blade drops × 20 throughout day.",
      },
      {
        id:"nkt_scalenes", label:"Scalenes", muscle:"Anterior / Middle / Posterior scalenes",
        compensator:"When overactive: compensating for inhibited DNF, or thoracic outlet contributors",
        how:"Patient supine. Palpate scalenes (lateral neck, between SCM and levator). Ask patient to breathe in deeply — scalenes should only fire at end-range of inhalation. If they fire early in breathing = overactive as accessory breathers. Test resisted cervical side flexion — if scalenes are disproportionately active vs DNF = compensation. Therapy localization: touch scalenes → re-test DNF.",
        options:[
          { val:"Normal", color:"#00c97a", meaning:"Scalenes activate only at end of deep inhalation. Appropriately assist cervical side flexion. No thoracic outlet symptoms." },
          { val:"Overactive — DNF inhibition", color:"#ff4d6d", meaning:"Scalenes fire early in breathing and dominate lateral neck. Patient has anterior neck tightness, thoracic outlet symptoms (arm tingling). TREAT: release scalenes → activate DNF." },
          { val:"Overactive — rib 1 elevation", color:"#ffb300", meaning:"Scalenes elevated first rib — thoracic outlet narrowed. Adson's test may be positive. Needs rib 1 mobilisation + scalene release." },
          { val:"Bilateral overactive — breathing pattern", color:"#7f5af0", meaning:"Both scalenes overactive as primary breathers (thoracic breathing pattern). Diaphragm inhibited. TREAT: release scalenes → diaphragmatic breathing retraining." },
        ],
        treatment:"Release: gentle scalene massage (patient supine, head rotated away, fingertip pressure on scalene belly 90 sec). Stretch: cervical extension + rotation + side flex away. Activate: diaphragmatic breathing (hand on belly, breathe in 4 sec, out 6 sec). Avoid aggressive scalene stretching without diaphragm retraining.",
      },
      { id:"nkt_levator_scap", label:"Levator Scapulae", muscle:"Levator scapulae",
        compensator:"When overactive: compensating for inhibited lower trap or DNF",
        how:"Patient seated. Palpate levator scapulae (posterior-lateral neck, C1–C4 to superior medial scapular angle). Apply firm pressure while patient attempts cervical rotation away from palpated side. POSITIVE OVERACTIVITY: muscle contracts forcefully and holds tension during scapular elevation. Therapy localization: touch levator → re-test lower trap. If lower trap suddenly stronger = levator compensating.",
        options:[
          { val:"Normal tone", color:"#00c97a", meaning:"Levator scapulae assists cervical side flexion and scapular elevation proportionally. Not dominant during shoulder tasks. No neck-shoulder pain with lifting." },
          { val:"Overactive — lower trap inhibition", color:"#ff4d6d", meaning:"Levator overactive elevating medial scapular angle. Lower trap inhibited. Persistent neck-shoulder pain, restricted cervical rotation. TREAT: release levator → activate lower trap." },
          { val:"Overactive — cervical instability", color:"#ffb300", meaning:"Levator overactive as cervical stabiliser when DNF inhibited. C3/C4 facet compression, restricted ipsilateral rotation. Release levator → activate DNF." },
        ],
        treatment:"Release: lacrosse ball to posterior-lateral neck 60–90 sec. Stretch: chin to opposite armpit. Activate: lower trap Y-lifts immediately. Home: scapular depression exercises × 20 reps.",
      },
      { id:"nkt_splenius", label:"Splenius Capitis / Cervicis", muscle:"Splenius capitis / Splenius cervicis",
        compensator:"When overactive: compensating for inhibited cervical flexors",
        how:"Patient prone or seated. Palpate splenius capitis (C7-T3 spinous → mastoid/occiput) and splenius cervicis (to C2/C3 transverse processes). Ask patient to extend and ipsilaterally rotate head against light resistance. POSITIVE OVERACTIVITY: fires excessively, maintains resting tone. Therapy localization: touch splenius → re-test DNF.",
        options:[
          { val:"Normal", color:"#00c97a", meaning:"Splenius contributes proportionally to cervical extension and ipsilateral rotation. No excessive resting tone." },
          { val:"Overactive — unilateral", color:"#ffb300", meaning:"Unilateral overactivity: ipsilateral rotation bias, restricted contralateral rotation, ipsilateral headache to orbit. TREAT: release unilateral splenius → activate DNF." },
          { val:"Overactive — bilateral", color:"#ff4d6d", meaning:"Bilateral overactivity forces cervical hyperextension and suboccipital compression. TREAT: release bilateral splenius → activate DNF." },
        ],
        treatment:"Release: fingertip pressure to splenius belly 60 sec each side. Cervical flexion stretch. Activate: DNF chin nods immediately. Home: gentle cervical flexion ROM × 10 reps.",
      },
      { id:"nkt_semispinalis", label:"Semispinalis Capitis / Cervicis", muscle:"Semispinalis capitis / cervicis",
        compensator:"When overactive: compensating for inhibited deep cervical stabilisers",
        how:"Patient prone. Palpate semispinalis (posterior neck between spinous processes and mastoid — deep to upper trap, superficial to multifidus). Ask patient to extend head against gentle resistance. POSITIVE OVERACTIVITY: palpable firmness at rest, neck extension ROM excessive relative to flexor strength. Therapy localization: touch semispinalis → re-test DNF.",
        options:[
          { val:"Normal", color:"#00c97a", meaning:"Semispinalis contributes to cervical extension and bilateral contralateral rotation. Balanced with DNF. No posterior neck tension at rest." },
          { val:"Overactive — DNF inhibition", color:"#ff4d6d", meaning:"Semispinalis overactive producing posterior cervical tension and compression. Suboccipital headache, C-spine stiffness, restricted flexion. TREAT: release semispinalis → activate DNF." },
          { val:"Overactive — thoracic kyphosis compensation", color:"#ffb300", meaning:"Semispinalis hyperextending cervical spine to correct for thoracic kyphosis. Extended cervical posture despite thoracic flexion. Address thoracic extension mobility first." },
        ],
        treatment:"Release: slow sustained pressure along posterior cervical paraspinals 60–90 sec. Activate: DNF chin nods. Address thoracic posture with foam roller extension if kyphosis is driver.",
      },
    ]
  },

  shoulder:{
    label:"Shoulder & Scapula", color:"#7f5af0",
    intro:"Shoulder NKT identifies which rotator cuff and scapular muscles are inhibited, and which are compensating. Classic patterns: lower trap inhibited → upper trap overactive | serratus inhibited → pec minor overactive | RC inhibited → biceps/pec major overactive.",
    tests:[
      {
        id:"nkt_lower_trap", label:"Lower Trapezius", muscle:"Lower trapezius",
        compensator:"When inhibited: upper trapezius, levator scapulae compensate",
        how:"Patient prone, arm abducted 120–135° (Y position). Ask patient to lift arm toward ceiling (shoulder extension in Y). Apply gentle downward resistance at distal humerus. Lower trap should fire to stabilise scapula. POSITIVE INHIBITION = cannot hold position or upper trap/neck fires to compensate. Therapy localization: touch upper trap → re-test lower trap. If lower trap suddenly stronger = upper trap compensating.",
        options:[
          { val:"Facilitated — normal", color:"#00c97a", meaning:"Lower trap activates strongly in Y position. Scapula depresses and retracts appropriately. No compensation from upper trap. Normal scapulohumeral rhythm." },
          { val:"Inhibited — mild", color:"#ffb300", meaning:"Lower trap activates but fatigues quickly or upper trap fires simultaneously. Mild compensation. Patient may have intermittent shoulder pain with overhead activities. Begin isolated lower trap activation." },
          { val:"Inhibited — moderate", color:"#ff4d6d", meaning:"Lower trap cannot hold position. Upper trap immediately compensates (shoulder rises). MCC has assigned upper trap as stabiliser. Patient has chronic shoulder/neck pain, impingement pattern. TREAT: release upper trap → activate lower trap." },
          { val:"Inhibited — severe", color:"#7f5af0", meaning:"Lower trap completely inhibited. Cannot perform Y position test. Scapular winging or severe elevation present. Upper trap, levator AND rhomboids all compensating. Multiple release/activate cycles needed." },
        ],
        treatment:"Release overactive: upper trap SMR + levator scapulae massage (60–90 sec each). Activate immediately: prone Y-lifts × 5 reps, wall slide with scapular depression, cable pull-down with scapular depression. Home: doorframe lower trap sets × 20 reps throughout day.",
      },
      {
        id:"nkt_serratus", label:"Serratus Anterior", muscle:"Serratus anterior",
        compensator:"When inhibited: pectoralis minor overactive",
        how:"Patient performs wall push-up. Observe scapular position during push-up plus phase (full protraction at top). If medial border of scapula wings away from thorax = serratus inhibited. Manual test: patient pushes arm into therapist's hand (forward protraction). Apply resistance. POSITIVE INHIBITION = scapula wings or cannot protract against resistance. Therapy localization: touch pec minor → re-test serratus. If serratus stronger = pec minor compensating.",
        options:[
          { val:"Facilitated — normal", color:"#00c97a", meaning:"Serratus activates to protract and upwardly rotate scapula. No winging on push-up plus. Scapula hugs thorax throughout arm elevation. Normal scapulohumeral rhythm." },
          { val:"Inhibited — functional winging", color:"#ffb300", meaning:"Serratus inhibited under load but not at rest. Winging appears only with push-up or arm elevation. Pec minor is tight and overactive. Patient has anterior shoulder pain with overhead activities." },
          { val:"Inhibited — resting winging", color:"#ff4d6d", meaning:"Scapular winging visible at rest (medial border away from thorax). Serratus severely inhibited. Pec minor chronically overactive. Long thoracic nerve palsy must be ruled out. TREAT: release pec minor → activate serratus." },
          { val:"Long thoracic nerve palsy", color:"#7f5af0", meaning:"Complete serratus inhibition with severe winging. No voluntary activation possible. Neurological cause — C5/6/7 long thoracic nerve affected. Refer for nerve conduction study. NKT technique may still help partial cases." },
        ],
        treatment:"Release: pec minor (supine, firm pressure at coracoid process to 3rd–5th ribs, 90 sec). Activate: serratus punches (supine, arm at 90°, push fist toward ceiling adding protraction), push-up plus. Home: wall protraction holds × 10 reps, serratus activation in quadruped.",
      },
      {
        id:"nkt_infraspinatus", label:"Infraspinatus / Teres Minor", muscle:"Infraspinatus / Teres minor",
        compensator:"When inhibited: posterior deltoid, biceps compensate",
        how:"Patient seated or sidelying. Elbow at 90°, arm at side. Apply gentle resistance to external rotation. POSITIVE INHIBITION = cannot resist external rotation with adequate force, or posterior deltoid/biceps dominates. Therapy localization: touch posterior deltoid or biceps → re-test IR. If ER suddenly stronger = deltoid/biceps compensating for RC.",
        options:[
          { val:"Facilitated — strong", color:"#00c97a", meaning:"Infraspinatus/teres minor generate adequate ER force at 0° and 90°. No compensation from posterior deltoid. Normal rotator cuff function." },
          { val:"Inhibited — pain inhibition", color:"#ffb300", meaning:"Inhibited due to pain (strong & painful = minor lesion per Cyriax). Pain prevents full activation. Address pain first (DTFM, dry needling) then NKT re-test." },
          { val:"Inhibited — motor control", color:"#ff4d6d", meaning:"ER weak and painless. MCC has inhibited infraspinatus — posterior deltoid compensates for humeral head depression. Patient has shoulder impingement pattern. TREAT: release pec minor/posterior deltoid → activate IR." },
          { val:"Complete inhibition — possible tear", color:"#7f5af0", meaning:"No ER activation possible. Consider structural tear — refer for imaging (MRI/ultrasound). External rotation lag sign likely positive." },
        ],
        treatment:"Release: pec minor + anterior deltoid (both overactive compensators, SMR 60 sec). Dry needling to infraspinatus if trigger points present. Activate: sidelying ER with theraband (light resistance, slow and controlled). Home: doorframe ER isometric × 20 reps.",
      },
      {
        id:"nkt_subscapularis", label:"Subscapularis", muscle:"Subscapularis",
        compensator:"When inhibited: pec major, teres major compensate",
        how:"Patient seated or supine. Elbow 90°, arm at side. Resist internal rotation. Subscapularis is the primary IR and anterior stabiliser. POSITIVE INHIBITION = weak IR or pec major fires to compensate (you can see/feel pec major dominating). Lift-off test: patient places dorsum of hand on low back and lifts it off — cannot = subscapularis inhibited. Belly press test: press hand into abdomen without wrist flexing — cannot = subscapularis inhibited.",
        options:[
          { val:"Facilitated — normal", color:"#00c97a", meaning:"Strong IR at 0° and 45°. Can perform lift-off and belly press without compensation. Normal anterior GH stability." },
          { val:"Inhibited — instability pattern", color:"#ffb300", meaning:"IR weak, pec major compensates. Patient has anterior shoulder instability, pain with IR. Apprehension test may be positive. TREAT: release pec major → activate subscapularis." },
          { val:"Inhibited — post-surgical", color:"#ff4d6d", meaning:"Subscapularis inhibited after shoulder surgery (Bankart, SLAP repair, total shoulder). MCC 'switched off' subscapularis due to surgical trauma. Therapy localization confirms. Progressive NKT activation essential for return to function." },
          { val:"Complete inhibition", color:"#7f5af0", meaning:"Cannot perform any IR. Lift-off completely failed. Possible subscapularis tear — refer for imaging. Belly press = wrist flexion to compensate." },
        ],
        treatment:"Release: pec major SMR + anterior deltoid massage. Activate: sidelying IR with theraband, belly press holds, lift-off progression. Home: theraband IR × 20 reps, progress to 90/90 IR.",
      },
      {
        id:"nkt_mid_trap", label:"Middle Trapezius / Rhomboids", muscle:"Middle trapezius / Rhomboids",
        compensator:"When inhibited: levator scapulae, upper trap compensate",
        how:"Patient prone, arm at 90° (T position). Retract and depress scapula while lifting arm. Apply resistance at posterior humerus. POSITIVE INHIBITION = scapula protracts under load, or levator scapulae fires to elevate rather than retract. Therapy localization: touch levator → re-test mid trap. If stronger = levator compensating.",
        options:[
          { val:"Facilitated — normal", color:"#00c97a", meaning:"Middle trap retracts scapula strongly without elevation. Scapulae symmetric in prone. Normal retraction strength." },
          { val:"Inhibited — protraction bias", color:"#ffb300", meaning:"Mild weakness. Scapula protracts under resistance. Patient has rounded shoulders but not severe. Levator scapulae partially compensating." },
          { val:"Inhibited — levator dominant", color:"#ff4d6d", meaning:"Scapula elevates instead of retracting under load. Levator fully compensating for mid trap. Patient has upper neck pain and shoulder elevation at rest. TREAT: release levator → activate middle trap." },
        ],
        treatment:"Release: levator scapulae (pressure at superior angle of scapula, 60 sec). SMR upper neck region. Activate: prone T-lifts, seated cable rows with scapular retraction focus. Home: wall angel exercise × 15 reps.",
      },
      { id:"nkt_pec_minor", label:"Pectoralis Minor", muscle:"Pectoralis minor",
        compensator:"When overactive: compensating for inhibited serratus anterior",
        how:"Patient supine. Palpate pec minor at coracoid process (just below and medial to the coracoid tip, between coracoid and 3-5th ribs). Apply firm pressure medially toward ribs. POSITIVE OVERACTIVITY: extreme tenderness, scapular protraction (shoulder rolls forward at rest), restricted scapular retraction. Test: therapist passively retract scapula — if very restricted = pec minor shortened. Therapy localization: touch pec minor → re-test serratus.",
        options:[
          { val:"Normal length and tone", color:"#00c97a", meaning:"Pec minor not tender at rest. Scapula rests neutrally — not protracted. Serratus anterior not inhibited. Full passive scapular retraction available." },
          { val:"Overactive — serratus inhibition", color:"#ff4d6d", meaning:"Pec minor overactive, shortened. Scapular protraction at rest. Serratus inhibited. Patient has anterior shoulder pain, impingement pattern, rounded shoulder posture. TREAT: release pec minor → activate serratus." },
          { val:"Overactive — thoracic outlet", color:"#ffb300", meaning:"Pec minor compressing neurovascular bundle (brachial plexus, subclavian vessels). Arm tingling especially in overhead position. Coracoid hyperalgesic. Release pec minor + neural mobilisation." },
        ],
        treatment:"Release: supine coracoid-to-rib pressure technique 90 sec. Door-stretch pec minor (hand at 90° abduction, lean through doorframe). Activate: serratus punches immediately. Home: pec minor self-release with ball × 2 min daily.",
      },
      { id:"nkt_ant_deltoid", label:"Anterior Deltoid", muscle:"Anterior deltoid",
        compensator:"When overactive: compensating for inhibited rotator cuff (supraspinatus/infraspinatus)",
        how:"Patient seated. Palpate anterior deltoid (anterior shoulder, below clavicle). Resist shoulder flexion at 90°. POSITIVE OVERACTIVITY: anterior deltoid fires powerfully and dominates — palpation reveals hard, tender muscle belly. Humeral head translates anteriorly during shoulder elevation. Therapy localization: touch anterior deltoid → re-test supraspinatus. If supraspinatus stronger = anterior deltoid compensating.",
        options:[
          { val:"Normal tone", color:"#00c97a", meaning:"Anterior deltoid assists shoulder flexion proportionally. No anterior humeral head translation. Rotator cuff centring maintained throughout elevation." },
          { val:"Overactive — RC inhibition", color:"#ff4d6d", meaning:"Anterior deltoid dominates shoulder flexion. Humeral head migrates anteriorly/superiorly. Impingement pattern. Patient has anterior shoulder pain on flexion. TREAT: release anterior deltoid → activate infraspinatus/supraspinatus." },
          { val:"Overactive — biceps compensation", color:"#ffb300", meaning:"Anterior deltoid + biceps both overactive as RC compensators. Shoulder flexion with elbow flexion tendency. Bicipital groove tender. Release anterior deltoid + biceps → activate RC." },
        ],
        treatment:"Release: cross-fibre massage to anterior deltoid belly 60 sec. Activate: sidelying ER for infraspinatus. Home: doorframe stretch in neutral rotation.",
      },
      { id:"nkt_post_deltoid", label:"Posterior Deltoid", muscle:"Posterior deltoid",
        compensator:"When overactive: compensating for inhibited infraspinatus / teres minor",
        how:"Patient prone or seated. Palpate posterior deltoid (posterior shoulder). Resist shoulder horizontal abduction (arm at 90° flex, pull backward against resistance). POSITIVE OVERACTIVITY: posterior deltoid fires with disproportionate force relative to infraspinatus. Infraspinatus tests weak. Therapy localization: touch posterior deltoid → re-test infraspinatus ER.",
        options:[
          { val:"Normal tone", color:"#00c97a", meaning:"Posterior deltoid assists horizontal abduction proportionally. Infraspinatus/teres minor provide adequate ER. No dominance of posterior deltoid in ER." },
          { val:"Overactive — IR compensation", color:"#ff4d6d", meaning:"Posterior deltoid compensates for inhibited infraspinatus. ER dominated by deltoid not RC. Posterior shoulder tightness. TREAT: release posterior deltoid → activate infraspinatus." },
        ],
        treatment:"Release: cross-fibre massage to posterior deltoid 60 sec. Activate: sidelying ER with theraband (infraspinatus isolation). Home: ER doorframe isometric.",
      },
      { id:"nkt_teres_major", label:"Teres Major", muscle:"Teres major",
        compensator:"When overactive: compensating for inhibited subscapularis or lat dorsi",
        how:"Patient sidelying or prone. Palpate teres major (posterior axillary fold, between inferior angle of scapula and humerus). Apply gentle resistance to internal rotation. POSITIVE OVERACTIVITY: teres major fires powerfully and tenderly. Often confused with lat dorsi. Test: resist shoulder adduction from 90° abduction — if teres major dominates = overactive. Therapy localization: touch teres major → re-test subscapularis.",
        options:[
          { val:"Normal tone", color:"#00c97a", meaning:"Teres major assists IR and adduction proportionally. Subscapularis not inhibited. No posterior axillary tension." },
          { val:"Overactive — subscapularis inhibition", color:"#ff4d6d", meaning:"Teres major overactive compensating for subscapularis. Medial rotation with adduction pattern. Posterior axillary fold tight. TREAT: release teres major → activate subscapularis." },
          { val:"Overactive — lat dorsi compensation", color:"#ffb300", meaning:"Teres major + lat dorsi both overactive. Shoulder locked in extension/adduction/IR. Overhead reaching severely restricted. Release both → activate lower trap and serratus." },
        ],
        treatment:"Release: fingertip pressure to teres major belly at posterior axillary fold 60–90 sec. Activate: subscapularis (belly press or IR in neutral). Home: overhead reach stretch with scapular upward rotation cue.",
      },
    ]
  },

  core:{
    label:"Core & Lumbar", color:"#00c97a",
    intro:"Core NKT identifies which deep stabilisers the MCC has inhibited following injury, poor posture, or prolonged sitting. Classic patterns: TA inhibited → erector spinae overactive | multifidus inhibited → superficial back muscles compensate | diaphragm inhibited → accessory breathers (scalenes, SCM) overactive.",
    tests:[
      {
        id:"nkt_ta", label:"Transversus Abdominis (TA)", muscle:"Transversus abdominis",
        compensator:"When inhibited: erector spinae, rectus abdominis compensate",
        how:"Patient supine, knees bent. Ask patient to draw navel gently toward spine WITHOUT holding breath or flattening lumbar spine. Place fingers 2cm medial and inferior to ASIS — feel for gentle tensioning of lower abdomen. If erector spinae fires instead (back arches), or patient holds breath = TA inhibited. Pressure biofeedback (prone): inflate to 70mmHg. Ask to draw in — normal = 4–10mmHg DECREASE. More than 10mmHg decrease = RA compensating.",
        options:[
          { val:"Facilitated — normal", color:"#00c97a", meaning:"TA activates independently with drawing-in manoeuvre. No breath holding. Lumbar spine neutral. Pressure biofeedback shows 4–10mmHg decrease. Core precedes limb movement (normal feedforward activation)." },
          { val:"Inhibited — erector spinae dominant", color:"#ff4d6d", meaning:"TA cannot activate. Erector spinae fires instead (back extends/arches). Patient has chronic LBP pattern. MCC assigned spinal extensors as stabilisers. TREAT: release erector spinae → activate TA. Most common finding in chronic LBP." },
          { val:"Inhibited — breath-holding pattern", color:"#ffb300", meaning:"Patient braces with Valsalva rather than subtle TA activation. Intra-abdominal pressure elevated constantly. TA never activates independently. Indicative of chronic spinal instability fear-avoidance." },
          { val:"Inhibited — RA dominant", color:"#7f5af0", meaning:"Rectus abdominis fires instead of TA. Abdomen protrudes on activation attempt or flattens dramatically. TA completely bypassed. Pressure biofeedback shows >10mmHg decrease. Requires extensive TA isolation practice." },
        ],
        treatment:"Release: erector spinae SMR (foam roll thoracolumbar region, 90 sec each side). Activate: abdominal drawing-in manoeuvre × 10 reps (holding 10 sec), progress to dead bug. Home: TA activation every hour, integrate into all daily movement.",
      },
      {
        id:"nkt_multifidus", label:"Multifidus", muscle:"Multifidus",
        compensator:"When inhibited: superficial erector spinae, QL compensate",
        how:"Patient prone. Palpate paraspinal groove just lateral to spinous processes at L4/L5. Ask patient to gently swell the muscle outward WITHOUT moving the spine or contracting buttocks. If superficial erector fires (hard and broad contraction) instead of local deep swelling = multifidus inhibited. Ultrasound imaging gold standard. Clinical test: observe spine stability during single-leg balance — if excessive spinal movement = multifidus deficit.",
        options:[
          { val:"Facilitated — normal", color:"#00c97a", meaning:"Multifidus produces gentle local swelling at palpated level. Segmental stabilisation present. Normal spinal control during limb movements. Rapid re-activation after acute episode." },
          { val:"Inhibited — unilateral", color:"#ffb300", meaning:"Asymmetric multifidus activation. One side inhibited (often side of prior disc herniation or LBP episode). Compensatory erector spinae and QL overactivity on that side. Patient has asymmetric LBP and trunk rotation weakness." },
          { val:"Inhibited — bilateral", color:"#ff4d6d", meaning:"Both sides inhibited. Spinal extensors completely compensating. Patient has chronic, diffuse LBP with poor spinal segmental control. Core exercises targeting global muscles (crunches, deadlifts) worsen the pattern." },
          { val:"Atrophied (post-injury)", color:"#7f5af0", meaning:"Multifidus atrophied after disc herniation or surgery. Atrophy may be visible on MRI. Slow to recover — requires specific activation. NKT therapy localization confirms which superficial muscles are compensating." },
        ],
        treatment:"Release: thoracolumbar erector spinae SMR + QL pressure release. Activate: prone multifidus swelling × 10 sec holds × 10 reps, progress to quadruped arm/leg (bird-dog), then standing. Home: seated multifidus activation throughout day.",
      },
      {
        id:"nkt_diaphragm", label:"Diaphragm", muscle:"Diaphragm",
        compensator:"When inhibited: scalenes, SCM, intercostals compensate as accessory breathers",
        how:"Patient supine or seated. Observe breathing pattern: place one hand on chest, one on abdomen. Normal: abdomen rises first (diaphragm descends). POSITIVE INHIBITION = chest rises first (accessory breathing). Formal test: ask patient to breathe in deeply — if scalenes and SCM fire visibly on normal tidal breathing = diaphragm inhibited. Palpate lateral ribcage — diaphragm should expand ribcage laterally (360°). Therapy localization: touch scalenes → re-test diaphragm activation. If better = scalenes compensating for diaphragm.",
        options:[
          { val:"Normal — diaphragmatic", color:"#00c97a", meaning:"Abdomen rises first. Ribcage expands 360° laterally. Scalenes and SCM only fire on deep inhalation (3rd respiratory phase). Normal breathing pattern. Diaphragm also provides core stability contribution." },
          { val:"Inhibited — thoracic breathing", color:"#ff4d6d", meaning:"Chest rises first. Scalenes and SCM fire on every breath. Diaphragm inhibited — not descending. Patient has chronic neck tightness, upper trap pain, anxiety, and reduced lumbar stability (diaphragm contributes to IAP). TREAT: release scalenes + SCM → activate diaphragmatic breathing." },
          { val:"Inhibited — paradoxical", color:"#7f5af0", meaning:"Abdomen paradoxically moves IN on inhalation (diaphragm not descending, scalenes/accessory muscles pulling chest up only). Significant breathing dysfunction. May indicate phrenic nerve involvement or chronic postural dysfunction." },
          { val:"Inhibited — lateral expansion deficit", color:"#ffb300", meaning:"Some diaphragmatic activation but ribcage does not expand laterally — only rises. Posterior and lateral diaphragm fibres inhibited. Patient has reduced thoracolumbar fascia tension and core stability. Lateral rib expansion breathing retraining required." },
        ],
        treatment:"Release: scalenes + SCM massage (90 sec each). Activate: 360° diaphragmatic breathing (crocodile breathing — prone on floor, breathe into posterior ribcage), lateral rib expansion training. Home: diaphragmatic breathing × 10 breaths before sleep, throughout day. Address anxiety/stress contributing to thoracic breathing.",
      },
      {
        id:"nkt_ql", label:"Quadratus Lumborum (QL)", muscle:"Quadratus lumborum",
        compensator:"When overactive: compensating for inhibited glute med or multifidus",
        how:"Patient sidelying. Palpate between 12th rib and iliac crest (lateral lumbar). Ask patient to hike hip (lateral trunk flexion). Normal: QL fires as hip hiker. Overactive QL: fires excessively when it shouldn't — during hip extension (should be glute max), during abduction (should be glute med). Test: ask for hip extension in prone — if QL fires instead of glute max = QL compensating. Therapy localization: touch QL → re-test glute max or glute med. If glute fires better = QL is compensating.",
        options:[
          { val:"Normal activation", color:"#00c97a", meaning:"QL fires for lateral flexion and as respiratory stabiliser. Does not fire excessively during hip extension or abduction. Normal lumbar side stability." },
          { val:"Overactive — glute max compensation", color:"#ff4d6d", meaning:"QL fires during hip extension instead of glute max. Patient extends hip by tilting pelvis (QL) rather than extending at hip joint. Common LBP pattern. TREAT: release QL → activate glute max immediately." },
          { val:"Overactive — glute med compensation", color:"#ffb300", meaning:"QL hikes hip during walking/running instead of glute med abducting it. Patient has lateral hip pain, IT band syndrome, and Trendelenburg-equivalent pattern with QL dominance. TREAT: release QL → activate glute med." },
          { val:"Overactive — bilateral (LBP pattern)", color:"#7f5af0", meaning:"Both QLs chronically overactive. Patient cannot sit comfortably. Lateral lumbar pain bilateral. Both glute max and glute med inhibited. Multiple compensation layers — treat sequentially." },
        ],
        treatment:"Release: QL SMR (tennis ball at lateral lumbar between rib and iliac crest, 90 sec). Activate: glute max (bridges) immediately after, then glute med (side-lying abduction). Home: avoid crossing legs when sitting (increases QL asymmetry).",
      },
      {
        id:"nkt_psoas", label:"Iliopsoas (Psoas + Iliacus)", muscle:"Iliopsoas",
        compensator:"When overactive: compensating for inhibited glutes/TA; inhibited: rare, usually overactive",
        how:"Patient supine. Apply gentle resistance to hip flexion (hand on distal thigh). Normal: iliopsoas activates smoothly. Test for overactivity: is hip flexion painful or does lumbar spine extend (anterior tilt) during hip flexion? = psoas overactive pulling lumbar into extension. Thomas test: if hip cannot reach table = iliopsoas shortened/overactive. Therapy localization: touch iliopsoas (gentle pressure at inguinal region) → re-test TA or glute max. If stronger = psoas compensating.",
        options:[
          { val:"Normal length and activation", color:"#00c97a", meaning:"Hip flexes without lumbar extension. Thomas test negative. No groin pain. Psoas activates proportionally and does not pull spine forward. Appropriate hip flexion strength for activity level." },
          { val:"Overactive — anterior pelvic tilt", color:"#ff4d6d", meaning:"Psoas pulls lumbar into extension during hip flexion. Thomas test positive (hip remains elevated). Lumbar lordosis increased. Patient has LBP worsened by sitting and hip flexion. TREAT: release psoas → activate TA + glute max." },
          { val:"Overactive — glute inhibition", color:"#ffb300", meaning:"Psoas overactive because glute max is inhibited — psoas must do both flexion and extension stabilisation. Hip snapping (coxa saltans) may be present. Groin pain and anterior hip impingement symptoms." },
          { val:"Inhibited (rare)", color:"#7f5af0", meaning:"Psoas truly inhibited — weak hip flexion in fully shortened range. Rare. May indicate L2/3 nerve root involvement or hip flexor avulsion injury. Confirm with Cyriax resisted test." },
        ],
        treatment:"Release: psoas stretch (kneeling lunge, posterior pelvic tilt), SMR quads/hip flexors. Activate: TA drawing-in, glute bridges with focus on not allowing anterior tilt. Never aggressive psoas stretching without core activation.",
      },
      { id:"nkt_erector_spinae", label:"Erector Spinae", muscle:"Iliocostalis / Longissimus / Spinalis",
        compensator:"When overactive: compensating for inhibited TA, multifidus, or glute max",
        how:"Patient prone. Palpate erector spinae (lateral to spinous processes L1–L5 and thoracic). Ask patient to attempt TA activation (drawing-in) — if erector spinae fire instead of TA = overactive compensation. Test: ask patient to perform hip extension — if lumbar extensors fire before glute max = erector overactive as hip extensor substitute. Note: overactive erectors feel hard and tender at rest. Therapy localization: touch erectors → re-test TA or glute max.",
        options:[
          { val:"Normal tone", color:"#00c97a", meaning:"Erector spinae active during lumbar extension tasks only. Not firing during TA activation attempts. Not dominant in hip extension. Normal resting tone." },
          { val:"Overactive — TA inhibition", color:"#ff4d6d", meaning:"Erectors fire during every attempted TA activation. Patient cannot isolate deep stabilisers. Core training is superficial muscle dominant. Chronic LBP pattern. TREAT: release erectors → activate TA immediately." },
          { val:"Overactive — glute max inhibition", color:"#ffb300", meaning:"Erectors fire during hip extension (creating lumbar extension to simulate hip extension). Deadlift and squat form breakdown. Lumbar pain with hip extension movements. TREAT: release erectors → activate glute max." },
          { val:"Overactive — bilateral lumbar spasm", color:"#7f5af0", meaning:"Bilateral erector spasm. Cannot relax lumbar musculature. Acute or chronic spasm pattern. Thoracolumbar fascia under constant tension. Treat: heat + SMR + TA activation in non-provoked positions." },
        ],
        treatment:"Release: foam roller thoracolumbar paraspinals (slow roll T12–L5, 90 sec). SMR with lacrosse ball lateral to spinous processes. Activate: TA drawing-in immediately, progress to bird-dog. Home: TA awareness during all daily movement.",
      },
      { id:"nkt_obliques", label:"Internal / External Obliques", muscle:"Internal oblique / External oblique",
        compensator:"When inhibited: erector spinae and QL compensate for rotation control",
        how:"Patient supine. Test: resist trunk rotation (patient attempts to rotate shoulders — therapist resists at shoulder). Feel and observe: if patient substitutes with hip hiking (QL) or lateral trunk flexion rather than rotation = obliques inhibited. Pallof press test: attach resistance band at side — patient holds band at sternum and resists rotation. If core collapses or rotates = oblique weakness. Therapy localization: touch QL or erectors → re-test anti-rotation strength. If stronger = obliques inhibited.",
        options:[
          { val:"Normal anti-rotation control", color:"#00c97a", meaning:"Obliques generate adequate trunk rotation and anti-rotation force. Pallof press held without collapse. Gait shows appropriate trunk counter-rotation with arm swing. No lateral trunk bending substitution." },
          { val:"Inhibited — rotation substitution", color:"#ff4d6d", meaning:"Obliques cannot resist rotation — QL and erectors substitute. Trunk rotates excessively during single-leg activities. Poor throwing/golf/tennis mechanics. TREAT: release QL → activate obliques (Pallof press, dead bug with rotation)." },
          { val:"Inhibited — post-partum / diastasis recti", color:"#ffb300", meaning:"Obliques inhibited following pregnancy/diastasis recti. Poor linea alba tension. Belly protrudes during sit-up attempts. Oblique activation must be performed without increasing intra-abdominal pressure. TREAT: TA first, then obliques." },
        ],
        treatment:"Release: QL and lateral lumbar SMR. Activate: Pallof press × 10 reps each side, dead bug with rotation, cable woodchops. Home: side plank progression × 3 × 20 sec.",
      },
      { id:"nkt_pelvic_floor", label:"Pelvic Floor", muscle:"Levator ani / Coccygeus / Sphincters",
        compensator:"When inhibited: superficial hip flexors overactive; when overactive: thigh adductors and piriformis co-contract",
        how:"Patient seated or supine. Observe breathing pattern — normal pelvic floor coordinates with diaphragm (descends on inhalation, rises on exhalation). Test: ask patient to gently activate pelvic floor (Kegel) without activating glutes or abductors. OVERACTIVITY: patient is hypervigilant, pain with palpation of inner thigh/perineum, cannot relax floor; INHIBITION: pelvic floor cannot resist Valsalva — stress incontinence. Therapy localization: touch adductors → re-test pelvic floor coordination.",
        options:[
          { val:"Normal coordination with breath", color:"#00c97a", meaning:"Pelvic floor activates and relaxes with breathing cycle. No stress incontinence. No pelvic pain. Coordinates with TA and diaphragm for IAP management." },
          { val:"Inhibited — stress incontinence pattern", color:"#ff4d6d", meaning:"Pelvic floor cannot generate adequate tension. Leakage with cough, jump, or sneeze. Often post-partum or post-pelvic surgery. TREAT: activate TA → coordinate with pelvic floor Kegel. Refer to pelvic physiotherapist." },
          { val:"Overactive — hypertonic pattern", color:"#ffb300", meaning:"Pelvic floor chronically contracted. Cannot relax. Pelvic pain, dyspareunia, tail bone pain. Adductors and piriformis also tight. TREAT: pelvic floor downtraining (relaxation breathing), adductor release." },
        ],
        treatment:"Inhibited: Kegel × 10 reps in coordination with exhalation, integrated TA + pelvic floor activation. Overactive: pelvic floor relaxation in hooklying with diaphragm breathing, adductor stretch, piriformis release. Refer to pelvic floor physiotherapist for complex presentations.",
      },
    ]
  },

  hip:{
    label:"Hip & Pelvis", color:"#f97316",
    intro:"Hip NKT identifies gluteal inhibition and compensation patterns. The most common global pattern: gluteus maximus inhibited → hamstrings and QL overactive → chronic LBP and hamstring strains. Gluteus medius inhibited → TFL and piriformis overactive → IT band, lateral hip pain, and Trendelenburg gait.",
    tests:[
      {
        id:"nkt_gmax", label:"Gluteus Maximus", muscle:"Gluteus maximus",
        compensator:"When inhibited: hamstrings, QL, piriformis compensate",
        how:"Patient prone. Ask for hip extension with knee bent (reduces hamstring contribution). Palpate both gluteus maximus and hamstrings simultaneously. Watch and feel which fires first. Normal: glute fires before hamstring. POSITIVE INHIBITION: hamstring fires first or glute never activates. Therapy localization: place one hand on hamstring and one on QL → re-test glute max contraction. If glute gets firmer with these contacts = confirmed compensation. Single-leg bridge test: patient bridges — if hamstring cramps or QL fires instead of glute = glute max inhibited.",
        options:[
          { val:"Facilitated — fires first", color:"#00c97a", meaning:"Gluteus maximus activates before hamstrings in prone hip extension. Full activation in bridge. No QL firing. Normal hip extension power and lumbar stability. Glute drives force through hip joint appropriately." },
          { val:"Inhibited — hamstring dominant", color:"#ffb300", meaning:"Hamstring fires first or simultaneously with glute. Glute activates late and weakly. Patient often has recurrent hamstring strains and chronic LBP. Hip extension generated by knee flexion (hamstring) not hip joint extension (glute). TREAT: release hamstrings → activate glute max immediately." },
          { val:"Inhibited — QL dominant", color:"#ff4d6d", meaning:"QL fires instead of glute max for hip extension. Patient extends spine (lateral tilt) to create apparent hip extension. Classic LBP pattern. Lateral lumbar pain and poor deadlift/hinge mechanics. TREAT: release QL → activate glute max." },
          { val:"Inhibited — bilateral, severe", color:"#7f5af0", meaning:"Both glutes inhibited. Patient cannot activate glutes in any position. Hamstrings, QL, and erector spinae all compensating. Patient has bilateral LBP, poor single-leg stability, and hip flexion-dominant movement pattern. Multiple-session NKT approach needed." },
        ],
        treatment:"Release: hamstrings SMR (foam roll posterior thigh 90 sec) + QL release (tennis ball lateral lumbar). Activate IMMEDIATELY within 30 seconds: glute bridges × 5 slow reps (focus on feeling glute, not hamstring), clamshells. Home: glute squeeze at top of every step throughout day.",
      },
      {
        id:"nkt_gmed", label:"Gluteus Medius", muscle:"Gluteus medius",
        compensator:"When inhibited: TFL, piriformis, QL compensate",
        how:"Patient sidelying. Hip abduction with slight extension and IR (targets posterior glute med fibres). Apply gentle resistance above knee. Normal: glute med fires. POSITIVE INHIBITION: TFL dominates (patient rolls slightly forward — anterior tilt during abduction) or QL hikes hip instead of abducting. Standing test: Trendelenburg — single-leg stance, observe contralateral pelvis. If drops = glute med inhibited on standing leg. Therapy localization: touch TFL → re-test glute med. If stronger = TFL compensating.",
        options:[
          { val:"Facilitated — normal", color:"#00c97a", meaning:"Glute med fires and holds abduction against resistance without pelvic tilt or TFL compensation. Trendelenburg negative. Normal single-leg pelvic stability. Gait shows no hip drop." },
          { val:"Inhibited — TFL dominant", color:"#ffb300", meaning:"TFL fires first — patient rolls into hip flexion during abduction (TFL is hip flexor + abductor). Lateral hip and knee pain. IT band tight. TREAT: release TFL → activate glute med (in slight extension, not flexion, to prevent TFL from dominating)." },
          { val:"Inhibited — piriformis dominant", color:"#ff4d6d", meaning:"Piriformis compensates for glute med — provides ER and abduction. Deep buttock pain. May mimic sciatica. Trendelenburg positive. TREAT: release piriformis → activate glute med." },
          { val:"Inhibited — QL dominant (Trendelenburg)", color:"#7f5af0", meaning:"QL hikes hip instead of glute med abducting it. Lateral trunk lean during gait. Classic Trendelenburg equivalent with trunk sway. Patient compensates by leaning over stance leg. TREAT: release QL → activate glute med." },
        ],
        treatment:"Release: TFL SMR (foam roll lateral hip, 90 sec), piriformis stretch + pressure. Activate: clamshells (slight hip extension, NOT flexion), sidelying hip abduction in extension, monster walks. Home: glute med activation every single-leg stance (standing in queue, brushing teeth).",
      },
      {
        id:"nkt_piriformis", label:"Piriformis", muscle:"Piriformis",
        compensator:"When overactive: compensating for inhibited glute med or glute max",
        how:"Patient prone or sidelying. Palpate piriformis (deep buttock, between PSIS and greater trochanter). If tender to palpation = active trigger points. Test: hip ER in prone — piriformis should contribute but not dominate. Overactivity test: flex hip 60° (piriformis becomes IR when hip flexed) and apply ER resistance — if this reproduces buttock pain = piriformis overactive. FAIR test: patient sidelying, affected side up, hip 60° flex, knee 90° — apply adduction + IR force. Positive = buttock pain. Therapy localization: touch piriformis → re-test glute med or glute max.",
        options:[
          { val:"Normal tone", color:"#00c97a", meaning:"Piriformis contributes to ER appropriately. Not tender on palpation. No sciatic symptoms. Activates with hip ER without dominating the movement pattern." },
          { val:"Overactive — glute med compensation", color:"#ffb300", meaning:"Piriformis compensating for inhibited glute med. Deep buttock pain and lateral hip aching. Piriformis tender on palpation. Often causes pseudo-sciatica. TREAT: release piriformis → activate glute med." },
          { val:"Overactive — piriformis syndrome", color:"#ff4d6d", meaning:"Piriformis severely overactive. Compressing sciatic nerve (piriformis syndrome). Sciatica symptoms present (buttock to posterior thigh). SLR may be positive. FAIR test positive. TREAT: release piriformis (careful deep pressure, 90 sec) → activate glute med." },
          { val:"Overactive — glute max compensation", color:"#7f5af0", meaning:"Piriformis compensating for inhibited glute max during hip extension. Patient extends hip with lateral rotation (piriformis) rather than sagittal extension (glute max). Walking pattern shows toe-out on affected side. TREAT: release piriformis → activate glute max." },
        ],
        treatment:"Release: piriformis pressure release (patient prone, therapist elbow into piriformis at posterior hip, sustained 90 sec). Stretch: figure-4 stretch. Activate: glute med clamshells immediately after. Note: never aggressive piriformis stretching if true piriformis syndrome without releasing first.",
      },
      {
        id:"nkt_hip_flex_fo", label:"Hip Extension Firing Order", muscle:"Glute max + Hamstrings + QL + Erectors",
        compensator:"N/A — tests firing sequence",
        how:"Patient prone. Both hands palpating: one on glute max, one on hamstring (or QL or erector). Ask for hip extension slowly from neutral. Count which fires first. Repeat 3 times for reliability. Normal sequence: Glute max fires first → ipsilateral hamstring → contralateral erector → ipsilateral erector. Any deviation = abnormal motor pattern. Also test in single-leg bridge: which fires to lift pelvis?",
        options:[
          { val:"Normal — Glute max fires first", color:"#00c97a", meaning:"Correct motor program. Gluteus maximus initiates hip extension before hamstrings or spinal extensors. MCC has correct motor sequence stored. Low injury risk for hamstrings and lumbar spine." },
          { val:"Abnormal — Hamstring fires first", color:"#ffb300", meaning:"Hamstring dominant hip extension. Glute max delayed or absent. Lumbar spine overloaded. Patient has hamstring strains and LBP. TREAT: release hamstrings → activate glute max → retrain hip extension pattern." },
          { val:"Abnormal — QL fires first", color:"#ff4d6d", meaning:"QL initiates — patient tilts pelvis to extend hip. No true hip extension occurring. Lumbar spine does the work. Chronic LBP pattern. TREAT: release QL → activate glute max → hip hinge retraining." },
          { val:"Abnormal — Erector spinae fires first", color:"#7f5af0", meaning:"Spinal extensors dominate. Patient uses lumbar extension to simulate hip extension. Severe glute and hamstring inhibition. Often seen in persistent LBP with spinal extension fear. TREAT: release erectors → activate TA + glute max simultaneously." },
        ],
        treatment:"Release: whichever muscle fired first (dominant compensator). Activate: glute max in prone isolation. Retrain: hip hinge pattern (Romanian deadlift) focusing on glute-driven extension. Home: glute max squeeze during every hip extension activity.",
      },
    ]
  },

  knee:{
    label:"Knee & Thigh", color:"#00c97a",
    intro:"Knee NKT focuses on the VMO vs VL relationship, hamstring-glute co-activation balance, and popliteus as a forgotten stabiliser. Common patterns: VMO inhibited → VL overactive → PFPS | hamstrings overactive (compensating for glute max) → posterior knee pain.",
    tests:[
      {
        id:"nkt_vmo", label:"Vastus Medialis Oblique (VMO)", muscle:"VMO",
        compensator:"When inhibited: VL (vastus lateralis) overactive → patellar maltracking",
        how:"Patient seated, knee at 30°. Palpate VMO (teardrop shape at medial lower thigh) and VL (lateral thigh) simultaneously. Ask patient to straighten knee slowly. Normal: VMO fires simultaneously or slightly before VL at final 30° of extension. POSITIVE INHIBITION: VL fires first and dominates throughout — VMO barely activates. Also test: terminal knee extension (TKE) — last 10° should activate VMO strongly. If VMO absent = inhibited.",
        options:[
          { val:"VMO facilitated — fires with VL", color:"#00c97a", meaning:"VMO activates with equal or slightly greater force than VL at terminal extension. Patella tracks medially within trochlear groove. No PFPS symptoms with squatting or stairs." },
          { val:"VMO inhibited — VL dominant", color:"#ffb300", meaning:"VL fires before and more strongly than VMO. Patella tracks laterally. Patient has anterior knee pain on stairs, squatting, sitting. IT band and lateral retinaculum tight. TREAT: release VL + IT band → activate VMO (terminal knee extension)." },
          { val:"VMO inhibited — post knee injury/surgery", color:"#ff4d6d", meaning:"VMO inhibited following ACL reconstruction, meniscectomy, or knee trauma. MCC switched off VMO as protective response. Patient has persistent quad weakness post-operatively despite exercise. NKT approach: release VL → activate VMO before quad sets." },
          { val:"VMO inhibited — hip weakness contributor", color:"#7f5af0", meaning:"VMO inhibited as part of valgus chain — glute med inhibited → knee valgus → VMO inhibited. Address glute med first, then VMO. Terminal knee extension + glute med activation simultaneously." },
        ],
        treatment:"Release: VL SMR (foam roll lateral thigh 90 sec) + IT band (roller lateral knee). Activate: terminal knee extension (TKE) with theraband, step-ups focusing on medial knee control. Home: TKE × 20 reps hourly, VMO squeeze at full extension.",
      },
      {
        id:"nkt_hamstrings", label:"Hamstrings", muscle:"Biceps femoris / Semimembranosus / Semitendinosus",
        compensator:"When overactive: compensating for inhibited glute max",
        how:"Patient prone. Test knee flexion resistance at 90°. Palpate hamstring belly. Overactive hamstrings: fire during activities they shouldn't (hip extension, standing). Test: prone hip extension — if hamstring fires before glute max = overactive compensator. Hamstring cramp during bridge = overactive (normal = glute does the work). Biceps femoris vs medial hamstring: test ER vs IR during knee flexion resistance.",
        options:[
          { val:"Normal — glute max dominant in extension", color:"#00c97a", meaning:"Hamstrings contribute to knee flexion appropriately. Do not dominate hip extension. Do not cramp during bridges. Glute max does the majority of hip extension work. No recurrent hamstring strains." },
          { val:"Overactive — glute max inhibition", color:"#ff4d6d", meaning:"Hamstrings overactive as hip extensors. Patient has recurrent hamstring strains (the compensator always gets injured, not the root cause). LBP. Hamstring 'tightness' that doesn't resolve with stretching (NKT rule: overactive muscles feel tight but aren't short). TREAT: release hamstrings → activate glute max." },
          { val:"Biceps femoris overactive — lateral chain", color:"#ffb300", meaning:"Biceps femoris specifically overactive. Lateral hamstring tightness. External rotation of tibia at knee. IT band and lateral knee pain. Often compensating for weak glute med. TREAT: release biceps femoris → activate glute med." },
          { val:"Medial hamstrings overactive — medial chain", color:"#7f5af0", meaning:"Medial hamstrings overactive. Internal tibial rotation. Compensating for inhibited adductors or popliteus. Medial knee pain. TREAT: release medial hamstrings → activate adductors or glute max." },
        ],
        treatment:"Release: foam roll hamstrings (posterior thigh, 90 sec). Stretch only AFTER NKT release (stretching alone won't fix overactive hamstrings). Activate: glute max exercises immediately. Home: glute-dominant bridge practice — feel the glute, not the hamstring.",
      },
      { id:"nkt_adductors", label:"Hip Adductors", muscle:"Adductor magnus / Longus / Brevis / Gracilis",
        compensator:"When overactive: compensating for inhibited glute max or medial hamstrings",
        how:"Patient sidelying (affected side up). Apply gentle resistance to hip adduction (push bottom leg up toward top). Palpate adductor group (medial thigh). POSITIVE OVERACTIVITY: adductors fire hard at rest or dominate hip extension. Test: supine — patient squeezes pillow between knees. If adductors cramp = overactive. Therapy localization: touch adductors → re-test glute max or medial hamstrings.",
        options:[
          { val:"Normal tone", color:"#00c97a", meaning:"Adductors contribute to hip adduction and extension (adductor magnus) proportionally. Not dominant in hip extension. Not cramping at rest. Normal inner thigh tension." },
          { val:"Overactive — medial chain", color:"#ff4d6d", meaning:"Adductors overactive causing knee valgus tendency and medial tibial rotation. Medial knee pain. Groin strain risk. Often compensating for glute max. TREAT: release adductors → activate glute max + VMO." },
          { val:"Inhibited — lateral chain dominance", color:"#ffb300", meaning:"Adductors inhibited — TFL and IT band dominate lateral hip. Knee varus tendency. Poor sagittal plane hip control. Weakness in adduction particularly. TREAT: release TFL → activate adductors." },
        ],
        treatment:"Release: adductor SMR (foam roll inner thigh, 90 sec). Activate: glute max bridging with adductor squeeze. Home: side-lying adductor lifts × 15 reps, Copenhagen plank progression.",
      },
      { id:"nkt_tfl", label:"Tensor Fasciae Latae (TFL)", muscle:"Tensor fasciae latae",
        compensator:"When overactive: compensating for inhibited glute med or glute max",
        how:"Patient supine or sidelying. Palpate TFL (lateral hip, between anterior iliac crest and iliotibial band, distal to ASIS). Ask patient to flex, abduct, and IR the hip — TFL does all three. POSITIVE OVERACTIVITY: TFL fires during pure abduction (should be glute med) or is tender and firm at rest. Ober test: patient sidelying, test hip drops to table — cannot adduct past neutral = TFL/IT band tight. Therapy localization: touch TFL → re-test glute med. If glute med activates more = TFL compensating.",
        options:[
          { val:"Normal tone", color:"#00c97a", meaning:"TFL assists hip flexion and IR proportionally. Not dominant in abduction (glute med does that). Ober test: hip adducts past neutral. No lateral hip pain at rest." },
          { val:"Overactive — glute med inhibition", color:"#ff4d6d", meaning:"TFL dominant in abduction. Flexes hip during intended abduction — patient rolls forward. IT band tight (Ober positive). Lateral hip and knee pain. TREAT: release TFL → activate glute med in slight extension (not flexion, prevents TFL re-domination)." },
          { val:"Overactive — IT band syndrome", color:"#ffb300", meaning:"TFL chronically overactive → IT band under chronic tension → iliotibial band syndrome. Lateral knee pain with running. Noble compression test positive. TREAT: TFL SMR + glute max and glute med activation." },
        ],
        treatment:"Release: TFL SMR (foam roll lateral hip between ASIS and greater trochanter, 90 sec). Activate: glute med in slight extension (clamshells). Never stretch TFL alone — activate glute med first. Home: lateral band walks.",
      },
      { id:"nkt_rectus_fem", label:"Rectus Femoris", muscle:"Rectus femoris",
        compensator:"When overactive: compensating for inhibited iliopsoas or VMO",
        how:"Patient prone. Knee flexion passive test: flex knee to end range — if pelvis anteriorly tilts (ASIS lifts) before reaching full knee flexion = rectus femoris overactive/shortened. Ely's test: patient prone, flex knee — if ipsilateral hip rises = RF shortened. Active test: seated — resist knee extension. RF fires powerfully. Compare to VL. Therapy localization: touch RF belly → re-test VMO.",
        options:[
          { val:"Normal length and tone", color:"#00c97a", meaning:"Knee can flex fully prone without pelvis rising. Ely's test negative. RF contributes to knee extension without dominating. Pelvis remains neutral during hip flexion." },
          { val:"Overactive — anterior pelvic tilt", color:"#ff4d6d", meaning:"RF shortened and overactive. Pulls ASIS forward, increasing anterior pelvic tilt. Ely's test positive. LCS pattern contributor. Patient has anterior knee pain and hip flexion tightness. TREAT: release RF → activate glute max + VMO." },
          { val:"Overactive — VMO inhibition", color:"#ffb300", meaning:"RF overactive and dominates terminal knee extension while VMO is inhibited. Patellar tracking laterally. PFPS pattern. TREAT: release RF → activate VMO (terminal knee extension)." },
        ],
        treatment:"Release: RF SMR (foam roll anterior thigh, 90 sec). Stretch: kneeling hip flexor with posterior pelvic tilt. Activate: VMO terminal knee extension immediately. Home: couch stretch × 2 min each side daily.",
      },
      { id:"nkt_popliteus", label:"Popliteus", muscle:"Popliteus",
        compensator:"When inhibited: LCL, posterior capsule overloaded; when overactive: lateral knee pain",
        how:"Patient prone, knee at 90°. Palpate popliteal fossa (posterior knee joint line, medial to biceps femoris). Apply gentle IR of tibia (internal rotation) at 90° flexion — popliteus unlocks knee (screw-home mechanism reversal). POSITIVE INHIBITION: lateral tibial rotation persists during knee flexion initiation (popliteus cannot unlock knee). Positive if posterior-lateral knee pain with resisted IR at 30° flexion. Therapy localization: touch lateral hamstrings → re-test popliteus IR.",
        options:[
          { val:"Normal — unlocks knee smoothly", color:"#00c97a", meaning:"Popliteus IR of tibia during knee flexion initiation smooth and painfree. No lateral knee pain. Normal knee unlocking pattern in gait." },
          { val:"Inhibited — lateral knee instability", color:"#ff4d6d", meaning:"Popliteus cannot IR tibia during knee flexion. Lateral knee instability, especially on rough terrain. 'Joint locking' sensation. TREAT: release biceps femoris → activate popliteus (gentle resisted IR at 30° knee flexion)." },
          { val:"Overactive — posterior-lateral knee pain", color:"#ffb300", meaning:"Popliteus tendinopathy. Pain at posterolateral knee especially downhill walking. Often compensating for LCL laxity or excessive external tibial rotation. Release popliteus → address tibial rotation pattern above." },
        ],
        treatment:"Release: popliteus pressure (posterior-lateral knee, gentle sustained 60 sec). Activate: resisted tibial IR at 30° knee flexion. Home: step-downs with medial knee control cue, lateral ankle stability training.",
      },
    ]
  },

  ankle:{
    label:"Ankle & Foot", color:"#ffb300",
    intro:"Ankle NKT identifies compensation between tibialis anterior/posterior and the peroneals, and the effect of limited dorsiflexion on the kinetic chain. Classic pattern: tibialis anterior inhibited → peroneals overactive → ankle instability. Tibialis posterior inhibited → peroneals + gastroc overactive → progressive flatfoot.",
    tests:[
      {
        id:"nkt_tib_ant", label:"Tibialis Anterior", muscle:"Tibialis anterior",
        compensator:"When inhibited: peroneals + EHL compensate for dorsiflexion",
        how:"Patient seated. Dorsiflex and invert foot against gentle resistance (this isolates tibialis anterior). Palpate belly (anterior shin). Normal: strong activation with dorsiflexion + inversion. POSITIVE INHIBITION: foot everts instead of inverting (peroneal compensation), or EHL fires to dorsiflex instead. Therapy localization: touch peroneus longus belly → re-test tibialis anterior. If stronger = peroneal compensating.",
        options:[
          { val:"Facilitated — normal", color:"#00c97a", meaning:"Tibialis anterior fires strongly during dorsiflexion + inversion. No compensation from peroneals. Ankle DF ROM normal. Foot clears during swing phase of gait without hip hiking." },
          { val:"Inhibited — peroneal dominant", color:"#ffb300", meaning:"Peroneus longus/brevis dominate dorsiflexion attempt — foot everts. Patient has ankle instability and recurrent inversion sprains (peroneals overloaded as compensators). TREAT: release peroneals → activate tib ant." },
          { val:"Inhibited — foot drop pattern", color:"#ff4d6d", meaning:"Severe tib ant inhibition — L4 nerve root or peroneal nerve involvement must be excluded. If neurological clear = MCC inhibition. Patient hikes hip to clear foot. TREAT: release peroneals → intensive tib ant activation with neuromuscular electrical stimulation if needed." },
          { val:"Inhibited — shin splint pattern", color:"#7f5af0", meaning:"Tib ant inhibited causing peroneals to overwork → medial tibial stress syndrome (shin splints). Pain along medial tibia. Patient cannot eccentrically control pronation. TREAT: release peroneals → activate tib ant eccentrically." },
        ],
        treatment:"Release: peroneal SMR (roller lateral lower leg from fibular head to ankle, 90 sec). Activate: seated tibialis anterior activation (dorsiflex + invert against theraband). Home: heel walks × 2 minutes daily.",
      },
      {
        id:"nkt_tib_post", label:"Tibialis Posterior", muscle:"Tibialis posterior",
        compensator:"When inhibited: peroneals overactive, foot pronates progressively",
        how:"Patient seated. Plantarflex and invert foot against resistance (plantar inversion isolates tib posterior). Palpate behind medial malleolus. POSITIVE INHIBITION: weak inversion in plantar flexion, or foot cannot resist eversion. Navicular drop test: mark navicular tuberosity in sitting, then standing — drop >10mm = tib post inhibition (arch collapse). Therapy localization: touch peroneals → re-test tib post.",
        options:[
          { val:"Normal — arch maintained", color:"#00c97a", meaning:"Tibialis posterior supports medial arch. Navicular drop <6mm. Strong plantar inversion resistance. No progressive flatfoot. Arch maintained in single-leg stance." },
          { val:"Inhibited — medial arch collapse", color:"#ffb300", meaning:"Tib post weakened. Medial arch collapses. Navicular drop 6–10mm. Early stage adult-acquired flatfoot. Pronation chain activates: tibial IR, knee valgus, anterior pelvic tilt. TREAT: release peroneals → activate tib post (heel raises in inversion)." },
          { val:"Inhibited — progressive flatfoot", color:"#ff4d6d", meaning:"Tib post significantly inhibited or partially ruptured. Navicular drop >10mm. 'Too many toes' sign (>2 toes visible behind heel from behind). Pain medial ankle. Refer for ultrasound/MRI. NKT: release peroneals → activate tib post + intrinsics." },
          { val:"Severely inhibited — tib post dysfunction", color:"#7f5af0", meaning:"Posterior tibial tendon dysfunction. Cannot perform single-leg heel raise. Progressive collapse of medial arch. Refer to orthopaedic/podiatry. Conservative: orthotics + aggressive tib post strengthening + peroneal release." },
        ],
        treatment:"Release: peroneal SMR + gastroc-soleus stretch. Activate: heel raises in slight inversion (on slightly inverted surface), towel scrunches, short foot exercise. Orthotics if severe. Home: short foot exercise × 20 reps, single-leg balance on slight inversion.",
      },
      {
        id:"nkt_gastroc", label:"Gastrocnemius / Soleus", muscle:"Gastroc-soleus complex",
        compensator:"When overactive: compensating for weak glutes or limited ankle DF; restricts kinetic chain",
        how:"Patient prone, knee extended. Test ankle dorsiflexion passively (normal: 20°). Limited DF = gastroc overactive or shortened. Weight-bearing lunge test: patient lunges with foot against wall — knee to wall distance (normal: 10cm from wall). <7cm = gastroc restriction. Test tightness: DF with knee extended (gastroc) vs knee bent (soleus). If DF better with knee bent = gastrocnemius tight. Therapy localization: touch gastroc → re-test tib ant. If better = gastroc compensating.",
        options:[
          { val:"Normal length and tone", color:"#00c97a", meaning:"Ankle DF normal (20°+). Lunge test: knee reaches wall at 10cm. No calf cramping during activity. Kinetic chain not restricted at ankle. Gastroc-soleus contribute to plantar flexion without restricting dorsiflexion." },
          { val:"Overactive — DF restriction", color:"#ffb300", meaning:"Gastroc overactive and shortened. Restricts ankle DF (<15°). Causes compensatory knee valgus, foot pronation, anterior pelvic tilt during squats. TREAT: gastroc SMR → ankle DF mobilisation → squat correction." },
          { val:"Overactive — glute compensation", color:"#ff4d6d", meaning:"Gastroc overactive as kinetic chain compensator for inhibited glutes. Patient pushes through calf during walking/running (calf dominance) rather than glute-driven propulsion. Calf strains common. TREAT: release gastroc → activate glute max." },
          { val:"Overactive — Achilles tendinopathy pattern", color:"#7f5af0", meaning:"Gastroc-soleus chronically overloaded. Tendon cannot tolerate load. Achilles tendinopathy developing or established. NKT: release peroneals + glute max activation (reduce calf load). Eccentric Achilles loading as adjunct." },
        ],
        treatment:"Release: gastroc SMR (foam roll calf from Achilles to popliteal crease, 90 sec). Stretch: straight-leg calf stretch 30 sec × 2. Activate: tib ant + tib post to balance. Home: wall lunge DF stretch × 3 daily, strengthening glutes to reduce calf overload.",
      },
      { id:"nkt_peroneals", label:"Peroneals (Peroneus Longus / Brevis)", muscle:"Peroneus longus / Peroneus brevis",
        compensator:"When overactive: compensating for inhibited tib anterior or tib posterior",
        how:"Patient seated. Evert foot against gentle resistance — peroneals activate. Palpate peroneal belly (lateral lower leg, posterior to fibula). POSITIVE OVERACTIVITY: peroneals fire during dorsiflexion attempt (should be tib ant), foot everts instead of dorsiflexing. Ankle instability with recurrent inversion sprains (peroneals overloaded). Test: therapy localization — touch peroneus longus → re-test tib ant or tib post. If either suddenly stronger = peroneals compensating.",
        options:[
          { val:"Normal tone", color:"#00c97a", meaning:"Peroneals activate for eversion and lateral ankle stability only. Do not dominate dorsiflexion. Ankle stable in single-leg stance. No recurrent inversion sprains." },
          { val:"Overactive — tib ant inhibition", color:"#ff4d6d", meaning:"Peroneals overactive compensating for inhibited tib ant. Foot everts during swing phase instead of dorsiflexing. Recurrent ankle sprains (overloaded peroneals fatigue). TREAT: release peroneals → activate tib ant." },
          { val:"Overactive — tib post inhibition", color:"#ffb300", meaning:"Peroneals overactive pulling foot into eversion as arch collapses. Progressive flatfoot. Navicular drop >10mm. Peroneal longus cannot control 1st ray plantar flexion. TREAT: release peroneals → activate tib post + intrinsics." },
        ],
        treatment:"Release: peroneal SMR (roller from fibular head to lateral malleolus, 90 sec). Activate: tib ant (heel walks) or tib post (inversion heel raises) immediately. Home: balance board training for proprioception.",
      },
      { id:"nkt_fhl", label:"Flexor Hallucis Longus (FHL)", muscle:"Flexor hallucis longus",
        compensator:"When inhibited: plantar fascia overloaded; when overactive: hallux impingement",
        how:"Patient supine. Resist great toe flexion (MTP and IP joints) while palpating posterior medial ankle (FHL tendon behind medial malleolus). Normal: strong great toe flexion (= 'toe-off' power). POSITIVE INHIBITION: great toe cannot flex against resistance, or medial arch collapses during single-leg stance. Test: single-leg heel rise — observe great toe grip. No grip = FHL inhibited. Therapy localization: touch FHL tendon → re-test arch stability.",
        options:[
          { val:"Normal", color:"#00c97a", meaning:"FHL strong in great toe flexion. Provides windlass mechanism tension during toe-off. Medial arch stable in single-leg stance. Normal push-off during gait." },
          { val:"Inhibited — plantar fascia overload", color:"#ff4d6d", meaning:"FHL inhibited — plantar fascia must provide all longitudinal arch tension. Plantar fasciitis develops. Hallux cannot grip during push-off. TREAT: release plantar fascia → activate FHL (towel scrunches, marble pick-ups)." },
          { val:"Overactive — posterior ankle impingement", color:"#ffb300", meaning:"FHL overactive and tight. Posterior ankle impingement (triggers at extreme plantar flexion or dorsiflexion). Dancer's/footballer's ankle. Tendon snaps medially. Release FHL tendon → joint mobilisation." },
        ],
        treatment:"Release: FHL SMR (gentle pressure behind medial malleolus, 60 sec). Activate: towel scrunches, marble pick-up, single-leg heel rise with great toe contact cue. Home: short foot exercise + great toe floor contact awareness.",
      },
      { id:"nkt_foot_intrinsics", label:"Foot Intrinsic Muscles", muscle:"Lumbricals / Interossei / Abductor hallucis",
        compensator:"When inhibited: plantar fascia and extrinsic toe flexors overloaded",
        how:"Patient seated or standing. Test: ask patient to perform 'short foot exercise' — shorten foot without curling toes (activate intrinsics only). Positive inhibition: patient curls toes (extrinsic flexors compensate) or cannot shorten foot at all. Observe navicular position — if drops >6mm in standing vs seated = intrinsics insufficient. Palpate abductor hallucis (medial arch) — should be palpable and firm in single-leg stance. Therapy localization: touch plantar fascia → re-test intrinsic activation.",
        options:[
          { val:"Normal — short foot achievable", color:"#00c97a", meaning:"Can perform short foot without toe curling. Abductor hallucis palpable and active. Navicular drop <6mm. Arch stable during single-leg stance. Normal toe splaying on ground contact." },
          { val:"Inhibited — arch collapse", color:"#ff4d6d", meaning:"Cannot perform short foot. Toes curl instead. Arch collapses in single-leg stance. Plantar fascia and extrinsic toe flexors overloaded. Pronation cascade up kinetic chain. TREAT: release plantar fascia → activate short foot + abductor hallucis." },
          { val:"Inhibited — bunion / hallux valgus", color:"#ffb300", meaning:"Abductor hallucis inhibited — hallux adducts toward 2nd toe. Bunion forming or established. Intrinsics too weak to maintain medial column alignment. Short foot exercise priority. Consider orthotic support." },
        ],
        treatment:"Release: plantar fascia SMR (golf ball roll under arch, 90 sec). Activate: short foot × 20 reps, abductor hallucis activation (spread toes, especially great toe medially). Home: barefoot training on varied surfaces × 15 min daily.",
      },
    ]
  },

  upper_limb:{
    label:"Elbow, Wrist & Hand", color:"#e879f9",
    intro:"Upper limb NKT identifies motor control dysfunction from elbow to hand. Common patterns: wrist extensor inhibition → wrist flexors overactive (lateral epicondylalgia), biceps overactive compensating for RC inhibition, grip weakness from cervical radiculopathy or motor control inhibition. Per NKT: the elbow and wrist are frequently affected by DISTANT inhibition (cervical, shoulder).",
    tests:[
      { id:"nkt_biceps", label:"Biceps Brachii", muscle:"Biceps brachii (long + short head)",
        compensator:"When overactive: compensating for inhibited RC (supraspinatus/subscapularis)",
        how:"Patient seated, elbow at 90°, forearm supinated. Resist elbow flexion. Palpate biceps belly. POSITIVE OVERACTIVITY: biceps fires powerfully and early in shoulder flexion (should not initiate shoulder movement). Humeral head translates anteriorly with shoulder flexion = biceps compensating for RC. Test: therapy localization — touch biceps → re-test supraspinatus or DNF. If either stronger = biceps compensating.",
        options:[
          { val:"Normal tone", color:"#00c97a", meaning:"Biceps contributes to elbow flexion and forearm supination appropriately. Not dominant in shoulder flexion. No anterior shoulder pain on biceps loading." },
          { val:"Overactive — RC inhibition", color:"#ff4d6d", meaning:"Biceps overactive at shoulder, compensating for RC. Anterior shoulder pain especially on overhead activities. Bicipital groove tender. TREAT: release biceps (cross-fibre belly massage) → activate infraspinatus/supraspinatus." },
          { val:"Overactive — shoulder instability", color:"#ffb300", meaning:"Biceps long head overactive attempting to stabilise anterior glenohumeral joint. Usually post-instability or SLAP tear. Treat underlying instability and rotator cuff first." },
        ],
        treatment:"Release: biceps cross-fibre massage 60 sec. Supination stretch (hold elbow extended, pronate forearm gently). Activate: RC exercises (sidelying ER). Home: no aggressive biceps stretching without RC activation.",
      },
      { id:"nkt_triceps", label:"Triceps Brachii", muscle:"Triceps brachii (long / lateral / medial head)",
        compensator:"When inhibited: posterior deltoid and anconeus compensate",
        how:"Patient prone, elbow at 90°. Resist elbow extension (push forearm toward ceiling). Palpate triceps belly. POSITIVE INHIBITION: triceps weak and painless (C7 radiculopathy first); weak and painful (muscle lesion). Positive overactivity: triceps fires during elbow flexion attempts (rare — indicates neurological irritation). Therapy localization: touch posterior deltoid → re-test triceps. If triceps stronger = posterior deltoid compensating.",
        options:[
          { val:"Normal strength — C7 intact", color:"#00c97a", meaning:"Triceps extends elbow strongly against resistance. No C7 dermatomal changes. Normal push-up strength. Posterolateral elbow not painful." },
          { val:"Inhibited — C7 radiculopathy", color:"#ff4d6d", meaning:"Weak and painless triceps = C7 nerve root compression. Check C7 dermatome (middle finger), reflex (triceps jerk). Refer for MRI. Cervical neural mobilisation." },
          { val:"Inhibited — triceps tendinopathy", color:"#ffb300", meaning:"Strong and painful triceps = triceps tendinopathy at olecranon insertion. DTFM to tendon. Eccentric loading. Home: triceps eccentric press-ups." },
        ],
        treatment:"Inhibited (neurological): cervical neural mobilisation, MRI referral, nerve gliding. Inhibited (motor control): release posterior deltoid → activate triceps. Tendinopathy: DTFM, eccentric loading.",
      },
      { id:"nkt_wrist_ext", label:"Wrist Extensors (ECRB / ECRL)", muscle:"Extensor carpi radialis brevis / longus",
        compensator:"When inhibited: wrist flexors overactive — lateral epicondylalgia pattern",
        how:"Patient seated, elbow extended, forearm pronated. Resist wrist extension (dorsiflexion). Palpate ECRB (lateral epicondyle → 3rd metacarpal base). POSITIVE INHIBITION: weak wrist extension, lateral epicondyle tender. Overactivity: wrist extensors chronically tense (keyboard workers) — limit wrist flexion. Test: therapy localization — touch wrist flexors (FCR/FCU) → re-test wrist extensors.",
        options:[
          { val:"Normal strength", color:"#00c97a", meaning:"ECRB/ECRL extend wrist strongly against resistance. No lateral epicondyle pain. Normal grip strength. Full wrist flexion available passively." },
          { val:"Inhibited — lateral epicondylalgia", color:"#ff4d6d", meaning:"Wrist extensors inhibited and painful (lateral epicondylalgia). Wrist flexors overactive as compensators. TREAT: release FCR/FCU (wrist flexor SMR) → activate ECRB (eccentric wrist extension)." },
          { val:"Overactive — repetitive strain", color:"#ffb300", meaning:"Wrist extensors overactive and shortened from repetitive use (typing, gripping). Restrict wrist flexion. Lateral forearm tension. Release wrist extensors (forearm roller SMR) → activate wrist flexors." },
        ],
        treatment:"Release: wrist flexor SMR (forearm roller medial, 60 sec). Activate: eccentric wrist extension × 15 reps (Tyler twist). DTFM to lateral epicondyle if tender. Home: eccentric wrist extension daily.",
      },
      { id:"nkt_wrist_flex", label:"Wrist Flexors (FCR / FCU)", muscle:"Flexor carpi radialis / ulnaris",
        compensator:"When overactive: compensating for inhibited wrist extensors — medial epicondylalgia",
        how:"Patient seated, forearm supinated. Resist wrist flexion. Palpate FCR (medial forearm, between palmaris and pronator teres) and FCU (ulnar wrist). POSITIVE OVERACTIVITY: wrist flexors fire during gripping (expected) but also dominate wrist stabilisation when they should not. Medial epicondyle tender. Test: therapy localization — touch FCU → re-test FCR or ECRB.",
        options:[
          { val:"Normal tone", color:"#00c97a", meaning:"Wrist flexors activate for grip and wrist flexion tasks. Not dominant in wrist extension tasks. No medial epicondyle pain at rest." },
          { val:"Overactive — medial epicondylalgia", color:"#ff4d6d", meaning:"Wrist flexors overactive and tender at medial epicondyle. Medial epicondylalgia. TREAT: release wrist flexors (SMR medial forearm) → activate wrist extensors." },
          { val:"Inhibited — grip weakness", color:"#ffb300", meaning:"Wrist flexors inhibited — grip significantly weak. Rule out C8/T1 radiculopathy, cubital tunnel, or carpal tunnel. NKT: release wrist extensors → activate wrist flexors." },
        ],
        treatment:"Release: forearm flexor SMR (medial forearm rolling, 60 sec). DTFM to medial epicondyle if golfer's elbow. Activate: eccentric wrist flexion. Home: forearm stretching + grip strengthening progression.",
      },
      { id:"nkt_pronator", label:"Pronator Teres / Quadratus", muscle:"Pronator teres / Pronator quadratus",
        compensator:"When overactive: restricts supination, compresses median nerve",
        how:"Patient seated, elbow at 90°. Apply resistance to pronation. Palpate pronator teres (medial elbow to mid-radius). POSITIVE OVERACTIVITY: pronator teres dominates and is tender on palpation at medial elbow. Limited passive supination. Median nerve compression symptoms (pronator syndrome). Test: therapy localization — touch pronator teres → re-test biceps supination strength.",
        options:[
          { val:"Normal tone", color:"#00c97a", meaning:"Pronation achieved without dominance. Supination full and painless. No median nerve symptoms with sustained forearm tasks." },
          { val:"Overactive — supination restriction", color:"#ff4d6d", meaning:"Pronator teres overactive. Limits supination → wrist extensors compensate → lateral epicondylalgia risk. Common in desk workers. TREAT: release pronator teres → activate supinator + biceps." },
          { val:"Overactive — pronator syndrome", color:"#ffb300", meaning:"Pronator teres compressing median nerve. Forearm aching + hand tingling (thumb, index, middle). Worsens with repetitive pronation. Differentiate from CTS: pronator syndrome worsens with pronation, not wrist flexion. Release + nerve gliding." },
        ],
        treatment:"Release: pronator teres cross-fibre massage at medial elbow 60 sec. Activate: supinator (resisted supination) and biceps immediately. Nerve gliding if compression symptoms. Home: forearm rotation mobility × 20 reps.",
      },
      { id:"nkt_grip", label:"Grip / Hand Intrinsics", muscle:"FDP / FDS / Lumbricals / Interossei",
        compensator:"When inhibited: extrinsic forearm flexors overactive — carpal tunnel risk",
        how:"Patient seated. Use hand dynamometer or clinician resistance for grip strength. Normal: dominant 35–45 kg, non-dominant 30–40 kg. Test intrinsics: ask patient to flex MCP joints while keeping IP joints extended (lumbrical action). If IPs flex instead = lumbricals inhibited, extrinsic flexors dominate. Therapy localization: touch forearm flexors (FDP/FDS) → re-test intrinsic grip.",
        options:[
          { val:"Normal grip strength", color:"#00c97a", meaning:"Normal grip for age/sex. Intrinsics and extrinsics balanced. No hand fatigue with sustained tasks. Normal MCP flexion with IP extension (lumbrical action)." },
          { val:"Inhibited — neurological cause", color:"#ff4d6d", meaning:"Grip weak + dermatomal changes. C8/T1 radiculopathy (ring + little finger weakness) or median nerve (thumb + index). Cubital tunnel or carpal tunnel. Neurological referral + neural mobilisation." },
          { val:"Inhibited — overuse inhibition", color:"#ffb300", meaning:"Grip weak without clear neurological cause. Often follows prolonged gripping tasks (climbers, manual workers). Extrinsic flexors overactive. TREAT: release forearm flexors → activate intrinsics (lumbrical isolation, putty exercises)." },
        ],
        treatment:"Release: forearm flexor SMR, wrist flexor stretch. Activate: intrinsic isolation exercises (lumbrical set, putty pinch). Neural mobilisation if carpal/cubital tunnel suspected. Home: grip strengthening with proper wrist alignment.",
      },
    ]
  },
};

// ─── KINETIC CHAIN REGION DATABASE ───────────────────────────────────────────
const KC_REGIONS = {
  foot_ankle:{
    label:"Foot & Ankle", color:"#ffb300", role:"MOBILITY",
    intro:"The foot and ankle are the first MOBILE link of the lower kinetic chain. Their job is to absorb ground reaction forces and provide adequate dorsiflexion for squatting, running, and stair-climbing. When mobility is lost here, ALL joints above compensate — creating knee valgus, foot pronation, anterior pelvic tilt, and lumbar overload.",
    tests:[
      {
        id:"kc_ankle_df", label:"Weight-Bearing Dorsiflexion — Lunge Test",
        role:"MOBILITY TEST", joint:"Ankle (talocrural)",
        how:"Patient stands facing wall. Place foot 10cm from wall. Lunge knee toward wall keeping heel flat on floor. Measure knee-to-wall distance. If heel lifts before knee reaches wall = restricted. Normal: knee reaches wall at 10cm+ without heel rising. Also test in non-weight-bearing: patient supine, passively dorsiflex ankle — normal 20°+.",
        options:[
          { val:"Normal — ≥10cm / 20°+", color:"#00c97a", meaning:"Adequate dorsiflexion for all functional tasks. Kinetic chain above ankle is not restricted by DF limitation. No compensation patterns driven from ankle." },
          { val:"Mildly restricted — 7–9cm / 15–19°", color:"#ffb300", meaning:"Mild DF limitation. Patient compensates with slight foot pronation, tibial internal rotation, and mild knee valgus during squats/stairs. Gastroc-soleus mildly tight. Begin DF mobility work." },
          { val:"Moderately restricted — 4–6cm / 10–14°", color:"#ff6b35", meaning:"Moderate DF restriction. Significant compensation: foot hyperpronation, knee valgus, anterior pelvic tilt, and lumbar extension during squat. This is a primary driver of knee pain in runners/athletes. Gastroc, soleus, and posterior capsule restricted. Address immediately before lower limb loading." },
          { val:"Severely restricted — <4cm / <10°", color:"#ff4d6d", meaning:"Severe DF restriction. Patient cannot squat without major heel rise. Cannot walk up stairs without trunk compensation. Cascade of dysfunction through entire kinetic chain. May indicate posterior ankle impingement, OA, or old fracture. Talocrural joint mobilisation (Grade III–IV) + intensive soft tissue work essential." },
        ],
        treatment:"Mobilise: talocrural joint (posterior glide of talus, Grade III–IV). Soft tissue: gastroc SMR + soleus SMR + posterior capsule stretch. Exercise: wall lunge drill × 3 min daily, eccentric heel drops, single-leg squat with DF focus. Kinetic chain: once DF improved, reassess knee alignment and foot pronation — they should self-correct.",
        chainEffect:"Restricted ankle DF → heel rises early → foot pronates → tibia internally rotates → knee collapses into valgus → hip internally rotates → femur adducts → pelvis anteriorly tilts → lumbar extends. ONE restriction drives the entire chain.",
      },
      {
        id:"kc_subtalar", label:"Subtalar Joint Mobility — Inversion / Eversion",
        role:"MOBILITY TEST", joint:"Subtalar joint",
        how:"Patient prone or supine. Grasp calcaneus. Move calcaneus into inversion and eversion independently of talocrural joint. Normal: inversion 20°, eversion 10°. Compare sides. Also assess in weight-bearing: observe navicular drop (mark navicular sitting → standing; normal drop <6mm). Rigid subtalar = poor shock absorption. Hypermobile = excessive pronation.",
        options:[
          { val:"Normal — inversion 20° / eversion 10°", color:"#00c97a", meaning:"Subtalar joint mobile and stable. Normal shock absorption. Navicular drop <6mm. Arch height maintained in single-leg stance. No excessive pronation or supination during gait." },
          { val:"Hypomobile — rigid foot", color:"#ffb300", meaning:"Subtalar restricted in both planes. Rigid foot cannot absorb shock — loads transfer to Achilles, plantar fascia, and shin. Patient may have OA, tarsal coalition, or post-fracture stiffness. Poor shock absorption = stress injuries. Mobilise subtalar joint with inversion-eversion glides." },
          { val:"Hypermobile — excessive pronation", color:"#ff4d6d", meaning:"Subtalar excessively mobile — navicular drop >10mm. Medial arch collapses. Tibialis posterior failing to control pronation (inhibited per NKT). Pronation cascade drives tibial IR → knee valgus → hip IR. Strengthen tib posterior + arch intrinsics. Orthotics if severe." },
          { val:"Asymmetric — significant L vs R difference", color:"#7f5af0", meaning:"Side-to-side difference >5° = significant asymmetry in kinetic chain input. The more restricted side will drive ipsilateral compensations. The hypermobile side will drive contralateral trunk compensations. Address the restricted side first." },
        ],
        treatment:"Hypomobile: subtalar mobilisation (inversion-eversion glides, Grade III). Hypermobile: tibialis posterior + FHL + intrinsic foot muscle strengthening, short foot exercise. Orthotics: semi-rigid if navicular drop >10mm. Reassess tib post NKT — almost always inhibited in hypermobile foot.",
        chainEffect:"Rigid foot → poor shock absorption → Achilles overload, shin splints, plantar fasciitis. Hypermobile foot → tibial IR → knee valgus → hip adduction → SI joint asymmetry.",
      },
      {
        id:"kc_great_toe", label:"First MTP Extension — Hallux Mobility",
        role:"MOBILITY TEST", joint:"First MTP joint",
        how:"Patient seated or supine. Passively extend great toe at MTP joint. Normal: 60–70° extension. Test in weight-bearing: windlass test — patient stands on a step, extend great toe and observe arch rise. Also observe during gait push-off: does patient supinate foot to achieve toe-off or roll over lateral border? Restricted = hallux rigidus/limitus.",
        options:[
          { val:"Normal — 60–70° extension", color:"#00c97a", meaning:"Normal hallux dorsiflexion. Windlass mechanism functions — arch rises with toe extension. Patient can achieve full push-off during gait without compensation. No lateral border gait or external rotation of leg." },
          { val:"Mildly restricted — 40–59°", color:"#ffb300", meaning:"Mild hallux limitus. Patient early supinates foot during push-off (avoids hallux loading). Lateral metatarsal overload, peroneal pain, and Achilles overload may result. 1st MTP joint mobilisation required." },
          { val:"Moderately restricted — 20–39°", color:"#ff6b35", meaning:"Moderate hallux limitus. Patient cannot achieve heel-to-toe gait — abducts foot (toe-out gait), extends hip early, or flexes knee to compensate. Cascading: hip flexor overload, anterior knee pain. Bunion (hallux valgus) may be forming." },
          { val:"Severely restricted — <20° / hallux rigidus", color:"#ff4d6d", meaning:"Hallux rigidus. First MTP completely stiff. Patient walks on lateral foot border. Entire gait compensated. Refer for X-ray (OA/osteophytes). Surgical consultation if conservative fails. Conservative: MTP mobilisation, rocker-bottom shoe, sesamoid off-loading." },
        ],
        treatment:"Mobilise: 1st MTP dorsal glide (Grade III–IV). Soft tissue: plantar fascia release, sesamoid mobility. Gait retraining: heel-to-toe pattern with hallux loading. Toe separators at night. Orthotics: Morton's extension if arthritic.",
        chainEffect:"Restricted hallux → compensatory toe-out gait → tibial ER → knee valgus loss of protection → hip IR → LBP from asymmetric loading.",
      },
    ]
  },

  knee:{
    label:"Knee", color:"#ff4d6d", role:"STABILITY",
    intro:"The knee is a STABILITY joint — its job is to transmit force between the mobile ankle and mobile hip without excessive motion. Knee pain is almost always a symptom of failure elsewhere in the kinetic chain — usually restricted ankle dorsiflexion below or restricted hip mobility above. TREAT the cause, not the knee.",
    tests:[
      {
        id:"kc_knee_stability", label:"Knee Valgus Stress Test — Kinetic Chain",
        role:"STABILITY TEST", joint:"Knee",
        how:"Observe patient during: (1) Squat — does knee collapse medially? (2) Single-leg squat — does knee drop inward? (3) Step-down from 20cm box — medial knee drop? (4) Jump landing — bilateral or unilateral. Also: manually valgus stress at 0° and 30° to check MCL integrity separately. Observe: foot pronation, tibial IR, and hip adduction all occurring simultaneously = kinetic chain valgus (not structural).",
        options:[
          { val:"Stable — no valgus in any task", color:"#00c97a", meaning:"Knee maintains alignment through all functional tasks. Kinetic chain above (hip stability) and below (ankle DF, foot position) providing adequate support. No medial knee stress. MCL intact." },
          { val:"Dynamic valgus — functional tasks only", color:"#ffb300", meaning:"Knee collapses inward during squat or single-leg tasks but MCL is structurally intact. Kinetic chain failure: ankle DF limited + glute med inhibited driving valgus. This is the most common pattern in female ACL injuries. TREAT: ankle DF + glute med activation — do NOT focus on knee." },
          { val:"Valgus with hip drop — Trendelenburg pattern", color:"#ff6b35", meaning:"Knee valgus accompanied by contralateral pelvis drop (glute med weakness). Classic kinetic chain valgus from proximal instability. Patient cannot control single-leg stance. Medial compartment overloaded. Strengthen glute med → knee valgus will reduce." },
          { val:"Structural valgus — MCL laxity", color:"#ff4d6d", meaning:"Valgus present at rest and with valgus stress at 0° + 30°. MCL structurally lax. Medial compartment loaded asymmetrically. Refer if significant. NKT: assess VMO activation as it dynamically supports medial knee." },
        ],
        treatment:"Dynamic valgus: ankle DF mobilisation + glute med NKT programme + VMO activation. Jump landing retraining (soft knee, hip back). Structural MCL: bracing, progressive loading, VMO/hamstring strengthening. Kinetic chain correction: address ankle → hip → then knee-specific work.",
        chainEffect:"Restricted ankle DF (below) + inhibited glute med (above) = KNEE is squeezed into valgus by forces from both directions. Treating only the knee will fail.",
      },
      {
        id:"kc_patellar_mobility", label:"Patellar Mobility Test",
        role:"STABILITY TEST", joint:"Patellofemoral",
        how:"Patient supine, knee fully extended and relaxed. Grasp patella with thumb and index finger. Glide medially and laterally — normal: 1–2cm in each direction (approximately 1/4 patella width). Also tilt: lift medial edge of patella — lateral retinaculum tight if cannot lift ≥0°. Crepitus during passive patellar glide = PFPS or chondromalacia.",
        options:[
          { val:"Normal — symmetric glide, no crepitus", color:"#00c97a", meaning:"Patellar tracking within trochlear groove. Lateral retinaculum not restricting. No crepitus. Q-angle normal. VL/VMO balance adequate. No PFPS symptoms." },
          { val:"Laterally biased — tight lateral retinaculum", color:"#ffb300", meaning:"Patella glides less than 1cm medially. Lateral tilt test: cannot lift medial edge. Lateral retinaculum tight — often due to VL overactivity (NKT: VMO inhibited → VL overactive). Patient has PFPS with lateral knee ache, crepitus. TREAT: VL SMR + lateral retinaculum stretching + VMO activation." },
          { val:"Hypermobile — excessive lateral glide", color:"#ff4d6d", meaning:"Patella glides >2cm laterally with minimal resistance. Medial stabilisers (MPFL, VMO) insufficient. Risk of patellar subluxation or dislocation. Quad strengthening in safe range (0–30° for patellar stability), VMO focus, patellar taping." },
          { val:"Crepitus with glide", color:"#7f5af0", meaning:"Grinding/crepitus during patellar glide = cartilage change or chondromalacia patella. May be asymptomatic or painful. If painful and progressive — refer for imaging. Conservative: load management, VMO strengthening, step avoidance in acute phase." },
        ],
        treatment:"Lateral bias: VL foam roll + IT band SMR, lateral retinaculum stretch (McConnell tape medially), VMO terminal knee extension. Hypermobile: VMO strengthening (0–30°), MPFL-protecting brace. Kinetic chain: always address ankle DF and glute med before patellar taping.",
        chainEffect:"VMO inhibited (NKT) → VL overactive → patella laterally displaced → PFPS. ALSO: foot pronation → tibial IR → patella internally rotated → increased lateral patellar stress.",
      },
      {
        id:"kc_tibiofemoral_rot", label:"Tibial Rotation Assessment — Screw-Home Mechanism",
        role:"STABILITY TEST", joint:"Tibiofemoral",
        how:"Patient supine, knee at 90°. Assess passive tibial rotation: grasp foot, rotate tibia internally and externally. Normal: IR 20–30°, ER 30–40°. Assess screw-home: as knee moves from 90° to full extension, tibia should externally rotate automatically (screw-home mechanism locks knee). If not — popliteus may be inhibited. Also test standing: observe tibial rotation during single-leg squat.",
        options:[
          { val:"Normal — screw-home intact, symmetric rotation", color:"#00c97a", meaning:"Tibia normally externally rotates at terminal knee extension (screw-home mechanism). Popliteus and LCL functioning. Symmetric passive tibial rotation bilaterally. Knee locks appropriately in full extension for standing." },
          { val:"Restricted tibial IR — lateral chain tightness", color:"#ffb300", meaning:"Cannot internally rotate tibia adequately. Biceps femoris and IT band restricting IR. Patient toe-out during walking (externally rotated) to avoid tibial IR loading. Lateral knee pain. Release biceps femoris + IT band → improve tibial IR." },
          { val:"Excessive tibial IR — medial chain laxity", color:"#ff6b35", meaning:"Tibia falls into internal rotation easily. Medial structures (MCL, medial capsule) lax. Foot pronation driving tibial IR from below. Glute med weakness allowing hip IR from above. Medial knee overloaded. Strengthen: tib post, VMO, glute med." },
          { val:"Absent screw-home — popliteus dysfunction", color:"#ff4d6d", meaning:"Tibia does not externally rotate at terminal extension. Knee cannot fully lock in extension. Popliteus inhibited or over-lengthened. Patient stands with slight flexion (can't straighten fully). Unlock test positive. Treat popliteus: soft tissue + NKT activation." },
        ],
        treatment:"Restricted IR: biceps femoris + IT band SMR, tibial IR mobility drill. Absent screw-home: popliteus activation (resisted tibial IR at 30°), terminal knee extension focus. Always address kinetic chain: foot pronation → tibial IR → biceps femoris reactivity.",
        chainEffect:"Excessive tibial IR (from foot pronation) → medial knee overload → MCL stress → medial compartment OA risk. Restricted tibial ER → knee cannot lock → quadriceps must work harder → PFPS.",
      },
    ]
  },

  hip:{
    label:"Hip", color:"#00c97a", role:"MOBILITY",
    intro:"The hip is a MOBILITY joint — it needs adequate flexion, extension, internal rotation, external rotation, and abduction to transfer force between the lumbar spine and lower limb. Hip restriction is the MOST COMMON driver of lumbar spine pathology. Limited hip IR is the single most predictive finding for future LBP.",
    tests:[
      {
        id:"kc_hip_ir_mob", label:"Hip Internal Rotation Mobility",
        role:"MOBILITY TEST", joint:"Hip",
        how:"Patient prone, hips neutral, knees bent 90°. Allow both feet to fall outward (measuring hip IR). Normal: 40–45°. Also test: seated hip IR — patient seated on table, rotate lower leg outward (hip IR). Compare sides. Clinical significance: >18° side-to-side asymmetry = significant (GIRD equivalent at hip). Hip IR <35° = high LBP risk.",
        options:[
          { val:"Normal — 40–45° bilateral symmetric", color:"#00c97a", meaning:"Adequate hip IR for all functional tasks including running, cutting, squatting. Posterior hip capsule mobile. No compensation patterns driven by hip IR restriction. Lumbar spine not being forced to rotate to compensate." },
          { val:"Mildly restricted — 30–39°", color:"#ffb300", meaning:"Mild hip IR restriction. Patient compensates with increased lumbar rotation during activities requiring hip IR (e.g. walking, golf swing). Posterior capsule and external rotators (piriformis, gemellus) mildly tight. Begin posterior capsule stretching and hip ER SMR." },
          { val:"Moderately restricted — 20–29°", color:"#ff6b35", meaning:"Moderate hip IR restriction. Lumbar spine rotates excessively to compensate — LBP developing or established. Ipsilateral foot may toe-out during gait (compensatory ER to avoid IR demand). Hip impingement (FAI) or posterior capsule contracture. FADIR test likely positive." },
          { val:"Severely restricted — <20° or significant asymmetry", color:"#ff4d6d", meaning:"Severe hip IR restriction. Classic FAI or hip OA finding. Lumbar spine under enormous rotational stress. Patient cannot squat, run, or rotate without pain. FADIR and hip scour likely positive. Refer for X-ray/MRI. Aggressive hip mobility program + consider orthopaedic referral." },
        ],
        treatment:"Posterior capsule: 90-90 stretch, pigeon pose, hip IR in prone with passive pressure. Joint mobilisation: posterior hip glide (patient supine, therapist mobilises femoral head posteriorly). Soft tissue: piriformis + gemellus SMR + dry needling. NKT: piriformis release → glute med activation (piriformis often overactive when glute med inhibited).",
        chainEffect:"Restricted hip IR → lumbar spine rotates to compensate → asymmetric disc loading → LBP. Also: restricted hip IR → foot toes out during gait → medial knee stress.",
      },
      {
        id:"kc_hip_ext_mob", label:"Hip Extension Mobility — Thomas Test",
        role:"MOBILITY TEST", joint:"Hip",
        how:"Patient supine at edge of table. Bring BOTH knees to chest fully to flatten lumbar lordosis. Lower one leg — the other remains flexed to control pelvis. Observe lowering leg: (1) Hip extension: does thigh reach the table or hang above? Normal: thigh rests on or below horizontal. (2) Knee angle: does knee remain at 90° or extend? If knee extends = rectus femoris tightness. (3) Observe for tibial rotation or foot position changes.",
        options:[
          { val:"Negative — thigh to table, knee 90°", color:"#00c97a", meaning:"Full hip extension available. Iliopsoas and rectus femoris at normal length. No anterior hip capsule restriction. Pelvis can remain neutral during gait push-off phase. No anterior pelvic tilt driven by hip flexor tightness." },
          { val:"Positive — thigh elevated (iliopsoas short)", color:"#ffb300", meaning:"Thigh hangs above horizontal — iliopsoas tight/overactive. Forces anterior pelvic tilt. LCS pattern likely. Hip flexors shortened from sitting. During gait: hip cannot extend → trunk leans forward → LBP. TREAT: iliopsoas SMR + hip flexor stretching (couch stretch) + glute max activation." },
          { val:"Positive — knee extends (rectus femoris short)", color:"#ff6b35", meaning:"Knee extends (straightens) as thigh lowers — rectus femoris tight. Creates anterior pelvic tilt AND limits knee flexion simultaneously. Patient has PFPS, anterior knee pain, and anterior hip pain. Rectus femoris stretching (prone heel-to-glute) + SMR quads." },
          { val:"Positive — both hip and knee compensation", color:"#ff4d6d", meaning:"Both iliopsoas AND rectus femoris restricted. Thigh elevated AND knee extends. Severe anterior chain tightness. Patient in permanent LCS. Must address systematically: release both → activate glutes/hamstrings → retrain hip extension pattern." },
        ],
        treatment:"Iliopsoas: couch stretch, half-kneeling hip flexor stretch, iliopsoas SMR (careful — near neurovascular structures). Rectus femoris: prone heel-to-glute stretch, lying quad stretch. Activate: glute max after stretching. Gait retraining: push-off from hip not knee.",
        chainEffect:"Tight hip flexors → anterior pelvic tilt → increased lumbar lordosis → facet loading → LBP. Also: rectus femoris tight → knee cannot flex fully → altered squat mechanics.",
      },
      {
        id:"kc_hip_er_mob", label:"Hip External Rotation Mobility",
        role:"MOBILITY TEST", joint:"Hip",
        how:"Patient prone, knee bent 90°. Measure how far lower leg moves toward midline (hip ER). Normal: 40–45°. Also test in seated: patient seated, cross ankle over opposite knee (figure-4 position) and observe how far knee drops toward table. Compare sides. Note: piriformis becomes IR when hip flexed >60° — test position changes the muscle tested.",
        options:[
          { val:"Normal — 40–45° bilateral symmetric", color:"#00c97a", meaning:"Adequate hip ER for normal gait, sports, and hip dissociation. Deep gluteal muscles (piriformis, obturators, gemellus) at normal length. No lateral hip impingement. Figure-4 test: knee drops to table or near. SI joint not being stressed by ER restriction." },
          { val:"Restricted — tight external rotators", color:"#ffb300", meaning:"Hip ER < 35°. Deep external rotators tight — piriformis, obturators, quadratus femoris. Patient may have FABER test limitation. May restrict stride length during running. Prone figure-4 position limited. Stretch: lying figure-4, seated hip ER stretch." },
          { val:"Restricted + deep buttock pain (piriformis syndrome)", color:"#ff4d6d", meaning:"ER restricted with reproduction of deep gluteal pain or sciatic symptoms during ER test. Piriformis compressing sciatic nerve. FAIR test likely positive. NKT: piriformis overactive (compensating for inhibited glute med). TREAT: careful piriformis release → glute med activation." },
          { val:"Asymmetric — >15° side difference", color:"#7f5af0", meaning:"Significant asymmetry. The restricted side = more capsular loading on ipsilateral SI joint. Running creates rotational asymmetry. Asymmetric ER restriction often from single-side injury history or sport dominance (kicking leg, golf). Address restricted side first." },
        ],
        treatment:"Soft tissue: piriformis SMR, deep gluteal foam rolling, figure-4 stretch. Joint mobilisation: posterior hip capsule glide if capsular. NKT: piriformis release → glute med activation (inhibited glute med is usually driving piriformis overactivity). Hip ER stretching: seated, lying, pigeon pose.",
        chainEffect:"Restricted hip ER → compensatory lumbar rotation → asymmetric SI joint loading. During gait: hip cannot adequately ER → foot toes in → medial ankle stress.",
      },
      {
        id:"kc_hip_abd_mob", label:"Hip Abduction Mobility & Stability",
        role:"MOBILITY + STABILITY TEST", joint:"Hip",
        how:"MOBILITY: Patient sidelying, affected side up. Passively abduct hip — normal 45°. Also: Ober's test for IT band/TFL restriction (see TFL). STABILITY: Single-leg stance — Trendelenburg test. Patient stands on one leg 30 seconds. Positive = contralateral pelvis drops. Also: lateral step-down from 20cm box — observe hip drop and trunk lean. Functional: observe running gait for hip drop.",
        options:[
          { val:"Normal mobility and stability", color:"#00c97a", meaning:"Hip abducts to 45°. Trendelenburg negative. Single-leg squat: pelvis level, no hip drop. Running: symmetrical pelvis. Glute med functioning appropriately as primary lateral pelvic stabiliser." },
          { val:"Restricted mobility — TFL/IT band", color:"#ffb300", meaning:"Ober's test positive — hip cannot adduct past 10° = IT band/TFL restricting abduction. Patient has lateral hip/knee pain. TFL overactive (NKT: compensating for inhibited glute med). TREAT: TFL SMR → glute med activation." },
          { val:"Stability deficit — Trendelenburg positive", color:"#ff4d6d", meaning:"Pelvis drops contralaterally during single-leg stance. Glute med cannot support pelvis. Patient leans trunk over stance leg to reduce moment arm (gluteus medius lurch/Trendelenburg lurch). All single-leg activities overload medial structures below and lumbar above. NKT: confirm glute med inhibited → TFL/QL compensating." },
          { val:"Both mobility restricted AND stability deficit", color:"#7f5af0", meaning:"IT band tight + Trendelenburg positive. Classic kinetic chain hip failure. TFL and piriformis are both overactive, glute med severely inhibited. Lateral knee pain, hip pain, and lumbar dysfunction. Multi-session approach: release TFL + piriformis → activate glute med → functional hip loading." },
        ],
        treatment:"Restricted: TFL SMR + lateral hip stretch + IT band roller. Stability: NKT glute med protocol (release TFL → activate glute med: clamshells → lateral band walks → single-leg holds). Progress: step-ups, lateral lunges, single-leg squat with pelvis level focus. Running: cue hip level during gait.",
        chainEffect:"Glute med failure → pelvis drops → lumbar side-flexes → SI joint asymmetric load → LBP. Below: hip drop → tibial valgus stress → medial knee pain.",
      },
    ]
  },

  lumbar:{
    label:"Lumbar Spine", color:"#ff4d6d", role:"STABILITY",
    intro:"The lumbar spine is a STABILITY region — its role is to transmit force between the mobile thoracic spine above and mobile hips below, with minimal motion of its own. It has only 13° of rotation total. When the hips or thoracic spine lose mobility, the lumbar spine is forced into excessive motion → disc loading → LBP. Stability tests assess the deep stabilising system (TA, multifidus) and segmental control.",
    tests:[
      {
        id:"kc_lumbar_stability", label:"Lumbar Segmental Stability Tests",
        role:"STABILITY TEST", joint:"Lumbar spine",
        how:"1. PRONE INSTABILITY TEST: Patient prone, feet on floor. Therapist applies posterior-anterior pressure on spinous processes — note pain. Then patient lifts feet off floor (activates spinal stabilisers) — reapply PA pressure. POSITIVE = pain reduced when muscles activated = instability (not structural). 2. ACTIVE STRAIGHT LEG RAISE (ASLR): Supine. Ask patient to lift one leg 20cm without bending knee. Observe: does pelvis rotate? Does thorax rotate? Apply compression to ASIS (manual SIJ compression) — if ASLR improves = pelvic instability. Score 0–5 each side. 3. ABDOMINAL DRAWING-IN: Patient supine. Ask to draw navel in without holding breath — palpate TA 2cm medial to ASIS.",
        options:[
          { val:"Stable — all tests normal", color:"#00c97a", meaning:"Lumbar spine stable. TA activates independently before limb movement (normal feedforward). Prone instability test negative. ASLR performed without compensation. Multifidus palpable as local swelling with activation. Normal segmental control." },
          { val:"Prone instability positive — segmental instability", color:"#ffb300", meaning:"Pain on PA pressure that reduces when patient activates muscles (lifts feet) = segmental instability at that level. Most commonly L4/5 or L5/S1. Indicates deep stabiliser deficit at that segment. Address: specific TA + multifidus training at that segment." },
          { val:"ASLR positive — pelvic/SIJ instability", color:"#ff6b35", meaning:"ASLR difficult/painful. Compensatory rotation or pain. Improved with manual ASIS compression = SIJ force closure deficit. Pelvic floor + TA + gluteal activation pattern dysfunctional. Specific SIJ stabilisation program. Pelvic belt short-term if severe." },
          { val:"No TA activation — global instability", color:"#ff4d6d", meaning:"Patient cannot isolate TA. Draws in abdomen with whole breath hold or RA fires instead. Global spinal instability pattern — common in chronic LBP. Erector spinae and QL compensating for TA/multifidus inhibition. Begin specific TA retraining before ANY global strengthening." },
        ],
        treatment:"Specific stabilisation exercise (SSE): TA drawing-in (10 sec × 10 reps), progress to dead bug, bird-dog, single-leg bridge. Multifidus: prone swelling × 10 sec × 10 reps. Progress to functional: squat with belt/brace initially, wean as stabilisers develop. Address hips and thoracic mobility first.",
        chainEffect:"Lumbar instability → erector spinae + QL compensate → chronic LBP. Forces above (thoracic stiffness) and below (hip restriction) both increase lumbar instability demand.",
      },
      {
        id:"kc_lumbar_flexion_ctrl", label:"Lumbar Flexion Control — Waiter's Bow Test",
        role:"STABILITY TEST", joint:"Lumbar spine",
        how:"Patient standing. Ask to bow forward as if greeting someone — maintain lordosis while hinging forward at hips (hip hinge). Normal: lumbar maintains neutral curve while hips flex. ABNORMAL: lumbar flexes immediately and hips stay still (lumbar flexion dominant pattern). Also test: ask patient to touch toes — observe where movement occurs first. Place fingers on PSIS and ASIS — ASIS should move posteriorly as hip flexes.",
        options:[
          { val:"Normal — hip hinge dominant", color:"#00c97a", meaning:"Patient hinges from hip with lumbar maintained in neutral. PSIS moves as hips flex. Waiter's bow clean. Normal hip-dominant forward bending. Lumbar discs not excessively loaded during forward bending tasks. Correct deadlift/lifting mechanics." },
          { val:"Lumbar flexion dominant — mild", color:"#ffb300", meaning:"Lumbar flexes before or simultaneously with hip flexion. Mild pattern. Patient has increased disc loading with forward bending. Often has flexion-pattern LBP. Hip flexors and hamstrings may be tight (restricting hip hinge). Begin hip hinge retraining." },
          { val:"Lumbar flexion dominant — moderate/severe", color:"#ff4d6d", meaning:"Lumbar flexes immediately, hips barely move. Classic disc loading pattern. Patient experiences LBP with sitting, forward bending, picking up objects. Significant hamstring tightness or hip flexion restriction driving pattern. McKenzie extension may be direction of preference. Hip hinge retraining essential. Avoid lumbar flexion loading." },
          { val:"Aberrant movement — painful arc", color:"#7f5af0", meaning:"Patient deviates laterally (trunk shift) when bending forward — often reducing when returning to upright. Indicates lumbar disc herniation (shifts away from pain) or facet asymmetry. Kemp's test + SLR to differentiate. Address disc/facet before stability training." },
        ],
        treatment:"Hip hinge retraining: dowel rod along spine cue (3 contact points), Romanian deadlift with mirror, hip hinge with theraband. McKenzie if flexion-dominant LBP. Address hip hamstring tightness that forces lumbar to take the movement.",
        chainEffect:"Lumbar flexion dominant pattern → repeated disc loading → disc degeneration. Hip restriction CAUSES lumbar flexion pattern — address hip mobility to fix lumbar movement quality.",
      },
      {
        id:"kc_lumbar_rotation_ctrl", label:"Lumbar Rotation Control Test",
        role:"STABILITY TEST", joint:"Lumbar spine",
        how:"Patient seated on plinth, feet flat (removes hip/ankle from equation). Ask to rotate trunk left and right — observe where rotation occurs. Normal: majority of rotation from thoracic spine (45° each side). Lumbar contribution: <13° total. POSITIVE = lumbar rotates excessively and thoracic barely moves. Also: seated rotation with arms folded — compare to hands on head (adds thoracic load). Quadruped rotation test: on hands and knees, rotate trunk — lumbar should not flex/extend.",
        options:[
          { val:"Normal — thoracic dominant rotation", color:"#00c97a", meaning:"Thoracic spine contributes majority of rotation (>45° each side). Lumbar minimally rotates (<5° per side). Ribs and thoracic facets mobile. Thoracic rotation does not increase lumbar disc shear forces. Normal rotational mechanics for golf, tennis, running." },
          { val:"Thoracic stiff — lumbar compensating rotation", color:"#ffb300", meaning:"Thoracic rotation <30° and lumbar overrotates to compensate. Disc at L4/5 or L5/S1 subjected to rotational shear forces. LBP with rotation (golf swing, getting in/out of car). Thoracic mobilisation priority: rotational manipulation, foam roller rotation drill." },
          { val:"Bilateral thoracic stiffness — both sides", color:"#ff6b35", meaning:"Symmetric thoracic restriction — total rotation <60°. Often from prolonged desk posture, rib cage stiffness, or thoracic kyphosis. Lumbar maximally compensating bilaterally. Bilateral risk for disc pathology. Foam roller thoracic extension + rotation essential." },
          { val:"Asymmetric restriction — one side significantly less", color:"#ff4d6d", meaning:"More restricted on one side. Creates rotational asymmetry — lumbar rotation asymmetrically loaded. Common in golfers, throwers, racquet sport athletes. Address: unilateral thoracic rotation mobility (side-lying open book, seated rotation with dowel). NKT: check contralateral glute med and ipsilateral obliques." },
        ],
        treatment:"Thoracic: foam roller extension + rotation (30 reps daily), side-lying open book stretch, seated thoracic rotation with dowel. Manual therapy: thoracic rotation manipulation (high velocity). Lumbar control: seated rotation awareness training, quadruped anti-rotation.",
        chainEffect:"Stiff thoracic (above) forces lumbar to rotate → disc shear forces → LBP. Below: hip IR restriction also forces lumbar to compensate rotationally.",
      },
    ]
  },

  thoracic:{
    label:"Thoracic Spine", color:"#00e5ff", role:"MOBILITY",
    intro:"The thoracic spine is a MOBILITY region — it needs 45° of rotation each way and adequate extension to allow the shoulder and cervical spine to function properly. Thoracic stiffness is arguably the MOST OVERLOOKED cause of neck pain, shoulder impingement, and LBP. Mobilising the thoracic spine often immediately improves shoulder and cervical symptoms.",
    tests:[
      {
        id:"kc_thoracic_rotation", label:"Thoracic Rotation Mobility",
        role:"MOBILITY TEST", joint:"Thoracic spine",
        how:"Patient seated on chair (eliminates hip contribution). Ask to rotate trunk fully left and right — arms folded across chest. Normal: 45° each side (90° total). Goniometer: axis at top of head, stationary arm pointing forward, moving arm following nose direction. Also test: supine rotation test — patient supine, knees bent to 90°, drop both knees to one side (normal: legs rest on table). Compare sides.",
        options:[
          { val:"Normal — 45°+ bilateral, symmetric", color:"#00c97a", meaning:"Full thoracic rotation available. Normal T-spine mechanics. No forced lumbar compensation. Shoulder internal rotation and cervical rotation will both be adequate as thoracic is contributing its full share. No rib stiffness." },
          { val:"Mildly restricted — 35–44° one or both", color:"#ffb300", meaning:"Mild thoracic rotation restriction. Some lumbar compensation occurring. Patient notices stiffness getting in/out of car, looking over shoulder while driving. Early cervical and lumbar overload. Begin foam roller rotation + thoracic manipulation." },
          { val:"Moderately restricted — 25–34°", color:"#ff6b35", meaning:"Moderate restriction. Significant lumbar rotational compensation. Cervical spine also overloading to compensate. Shoulder impingement beginning (thoracic kyphosis increases with rotation restriction → shoulder impingement). Rib cage restriction palpable. Thoracic manipulation + rib mobilisation." },
          { val:"Severely restricted — <25° or asymmetric >15°", color:"#ff4d6d", meaning:"Severe thoracic restriction. Lumbar and cervical spine heavily overloaded. Shoulder impingement established. In athletes: high injury risk. Consider ankylosing spondylitis (bilateral symmetric restriction) or previous spinal fracture. Thoracic manipulation priority — often single greatest change in the assessment." },
        ],
        treatment:"Immediate: thoracic manipulation (HVLA rotation manipulation — often dramatically improves restriction). Daily: foam roller extension over rolled towel + seated rotation drill × 30 reps. Rib mobilisation: lateral rib glides. Soft tissue: thoracic erector + rhomboid SMR. Address cause: forward head posture, desk ergonomics.",
        chainEffect:"Stiff thoracic → lumbar overrotates (disc injury), cervical overworks (neck pain), shoulder internally rotates excessively (impingement). Improving thoracic rotation often immediately reduces shoulder and neck pain.",
      },
      {
        id:"kc_thoracic_extension", label:"Thoracic Extension Mobility",
        role:"MOBILITY TEST", joint:"Thoracic spine",
        how:"Patient supine. Place foam roller (or rolled towel) under thoracic spine at T4–T8. Ask patient to extend over roller with arms crossed or overhead. Observe: can thoracic spine extend over roller? Normal: vertebrae should extend over roller without significant resistance or pain. Also: wall angel test — patient stands with back to wall, feet 5cm from wall. Try to move arms from 90° to overhead maintaining contact with wall and lumbar neutral. Normal: arms reach overhead without losing wall contact.",
        options:[
          { val:"Normal — full extension, wall angel complete", color:"#00c97a", meaning:"Thoracic spine extends adequately. Wall angel: arms reach overhead while maintaining rib, lower back, and arm contact with wall. Normal posterior chain flexibility at thoracic level. Forward head and shoulder impingement not being driven by thoracic kyphosis." },
          { val:"Mildly restricted — some resistance over roller", color:"#ffb300", meaning:"Mild thoracic stiffness. Wall angel: arms cannot fully reach overhead without ribs lifting or lower back arching. Chronic desk posture beginning to restrict extension. Begin daily foam roller extension work — should not be painful, just stiff." },
          { val:"Moderately restricted — notable kyphosis fixation", color:"#ff6b35", meaning:"Thoracic kyphosis partially fixed. Foam roller: spine does not extend over roller — holds flat or reversal of curve. Wall angel: unable to maintain contact with wall past 120° shoulder elevation. Shoulder impingement very likely. Cervical spine hyperextending to compensate. Significant postural correction program needed." },
          { val:"Severely restricted — rigid thoracic kyphosis", color:"#ff4d6d", meaning:"Thoracic kyphosis rigidly fixed — cannot extend. May indicate Scheuermann's disease, severe disc degeneration, DISH (diffuse idiopathic skeletal hyperostosis), or osteoporotic compression fractures. Refer for imaging before aggressive manipulation. Conservative: gentle extension (prone on elbows progression) + respiratory physiotherapy." },
        ],
        treatment:"Foam roller: daily extension over T4–T8 level × 2 min. Stretch: thoracic extension with hands behind head. Wall angel: × 15 reps daily. Manual: thoracic extension HVLA manipulation (seated or prone). Breathing: rib cage expansion exercises. Correct driving/desk posture — lumbar roll support.",
        chainEffect:"Restricted thoracic extension → increased kyphosis → forward head → UCS pattern → cervical overload. Also: kyphosis → scapula protracts → impingement → rotator cuff injury.",
      },
      {
        id:"kc_rib_mobility", label:"Rib Cage Mobility Assessment",
        role:"MOBILITY TEST", joint:"Costovertebral / costotransverse joints",
        how:"Patient seated or supine. Place hands bilaterally on rib cage (thumbs at spine, fingers wrap laterally). Ask patient to breathe in deeply — observe symmetry of rib expansion. Normal: symmetric lateral expansion of lower ribs. Also: palpate individual rib angles (posterior, where rib meets transverse process) — press firmly and assess tenderness and stiffness bilaterally. Compare each level T3–T10. Spring test: HVLA-like PA pressure on rib angle — stiff = hypomobile rib.",
        options:[
          { val:"Normal — symmetric expansion, no rib tenderness", color:"#00c97a", meaning:"Bilateral symmetric rib cage expansion during breathing. No hypomobile ribs on palpation. Costotransverse joints mobile. Thoracic rotation and extension will be full. Breathing pattern diaphragmatic — ribs expanding laterally and posteriorly." },
          { val:"Asymmetric expansion — one side restricted", color:"#ffb300", meaning:"One side of rib cage expands less than other. Often ipsilateral to thoracic rotation restriction. Breathing may be thoracic (accessory muscle dominant). Ipsilateral rib articulations hypomobile. Rib mobilisation (unilateral anterior-posterior rib pressure or manipulation) at restricted level." },
          { val:"Hypomobile ribs — specific levels tender", color:"#ff6b35", meaning:"Specific rib angles tender and stiff on PA pressure. Hypomobile costovertebral/costotransverse joints. Restricts thoracic rotation at that spinal level. Often follows respiratory illness, thoracic trauma, or prolonged poor posture. Manipulate/mobilise specific ribs at stiff levels." },
          { val:"Upper chest breathing — diaphragm inhibited", color:"#ff4d6d", meaning:"Rib cage rises vertically (upper chest breathing) rather than expanding laterally — diaphragm inhibited (see NKT diaphragm). Scalenes and SCM overactive as primary breathers. Lower ribs do not expand. Retrain: 360° diaphragmatic breathing, crocodile breathing, lateral rib expansion. Treat NKT: scalene release → diaphragm activation." },
        ],
        treatment:"Rib mobilisation: Grade III–IV PA pressure on hypomobile rib angles. HVLA: rib manipulation in prone. Breathing: lateral rib expansion training (patient places hands on lower ribs, breathe into hands). Soft tissue: intercostal release. NKT: scalene + SCM release → diaphragm activation if breathing pattern disordered.",
        chainEffect:"Hypomobile ribs → restrict thoracic rotation → lumbar overrotation → LBP. Also: restricted breathing pattern → reduced core stability (diaphragm is a core stabiliser) → LBP.",
      },
    ]
  },

  scapula:{
    label:"Scapula & Shoulder", color:"#7f5af0", role:"STABILITY → MOBILITY",
    intro:"The scapula is a STABILITY region — it must be stable enough to serve as a platform for the mobile glenohumeral joint above. The glenohumeral joint is MOBILE. Poor scapular stability (serratus anterior + lower trap inhibition) forces the mobile GH joint to compensate with impingement patterns. Scapulohumeral rhythm must be normal for pain-free overhead activity.",
    tests:[
      {
        id:"kc_scapulohumeral_rhythm", label:"Scapulohumeral Rhythm Assessment",
        role:"STABILITY TEST", joint:"Scapula / GH joint",
        how:"Patient seated or standing. Observe arm elevation in scapular plane (between flexion and abduction). Normal ratio: for every 2° of GH elevation, 1° of scapular upward rotation = 2:1 ratio (total: 120° GH + 60° scapular = 180° total). Observe: (1) Early scapular elevation (shrugging) = upper trap dominant. (2) Winging at any point = serratus inhibited. (3) Painful arc (60–120°) = impingement. (4) Does scapula upwardly rotate or just elevate? Mark inferior angle and medial border with marker for precision.",
        options:[
          { val:"Normal — 2:1 ratio, no shrug, no winging", color:"#00c97a", meaning:"Scapula upwardly rotates smoothly in 2:1 ratio with GH elevation. No early shrugging. No winging. Painful arc absent. Lower trap, serratus, and upper trap balanced. Normal force couple functioning. Overhead activity pain-free." },
          { val:"Upper trap dominant — early shoulder elevation", color:"#ffb300", meaning:"Shoulder elevates immediately with arm raising (upper trap fires first — NKT: lower trap inhibited). Ratio disrupted — too much scapular elevation, not enough upward rotation. Patient feels tightness across top of shoulder. Impingement risk. TREAT: upper trap release → lower trap activation → retrain arm elevation pattern." },
          { val:"Serratus deficit — medial winging", color:"#ff6b35", meaning:"Medial border of scapula wings away from thorax during arm elevation. Serratus anterior inhibited (cannot protract/upwardly rotate scapula — NKT: pec minor overactive). Subacromial space decreases → impingement. Full overhead elevation impossible without winging. TREAT: pec minor release → serratus activation." },
          { val:"Combined pattern — both elevation and winging", color:"#ff4d6d", meaning:"Upper trap dominance + serratus inhibition simultaneously. Severe scapular dyskinesis. Multiple muscles dysfunctional. Patient has established shoulder impingement and possible rotator cuff pathology. Multi-system treatment: release upper trap + pec minor → activate lower trap + serratus → retrain arm elevation." },
        ],
        treatment:"Scapular muscle rebalancing: lower trap (prone Y) + serratus (push-up plus, serratus punch). Release: upper trap SMR + pec minor soft tissue. Movement retraining: wall slide with scapular depression cue, elevation drills with resistance band. Avoid overhead loading until rhythm normalised.",
        chainEffect:"Poor scapular stability → subacromial space narrowing → impingement → rotator cuff tendinopathy → tear. Also: scapular winging → GH joint forced into excessive IR → anterior capsule stress.",
      },
      {
        id:"kc_gh_ir_mob", label:"Glenohumeral Internal Rotation — GIRD Assessment",
        role:"MOBILITY TEST", joint:"Glenohumeral joint",
        how:"Patient supine, shoulder at 90° abduction, elbow at 90°. Stabilise scapula (prevent posterior tipping — place hand under scapular spine). Passively internally rotate: forearm drops toward table. Normal: 60–70°. Compare bilaterally. GIRD (Glenohumeral IR Deficit): >18° side-to-side difference is clinically significant in throwing athletes. Also: total arc of rotation (ER + IR combined) should be similar bilaterally. Loss of total arc = true capsular restriction.",
        options:[
          { val:"Normal — 60–70° bilateral, <18° asymmetry", color:"#00c97a", meaning:"Adequate GH internal rotation. Posterior capsule mobile. Total arc of rotation symmetric. No posterior impingement. Rotator cuff in normal length-tension relationship. No GIRD pattern. Overhead activities unrestricted." },
          { val:"GIRD — >18° side difference (throwers)", color:"#ffb300", meaning:"Significant GIRD in dominant arm of throwing athletes. Posterior capsule contracted from repetitive overhead loading. GIRD shifts GH contact point posterosuperiorly — posterior cuff and labrum at risk. Loss of total arc indicates capsular restriction (not just bony adaptation). Sleeper stretch + posterior capsule mobilisation essential." },
          { val:"Bilateral restriction — posterior capsule tightness", color:"#ff6b35", meaning:"Both shoulders show restricted IR. Non-throwing athlete — indicates global posterior capsule contracture or UCS-related tightness. Pec minor tightness also limiting IR (anterior chain restrictors). Posterior capsule stretching bilaterally + pec minor release." },
          { val:"Severely restricted — frozen shoulder pattern", color:"#ff4d6d", meaning:"IR severely restricted (<30°). All planes restricted (capsular pattern: ER > Abd > IR). Adhesive capsulitis likely. Pain at end-range passive motion. Refer for corticosteroid injection assessment. Grade III–IV GH mobilisation (inferior glide, posterior glide). Night pain = inflammatory phase — not mobilised aggressively." },
        ],
        treatment:"GIRD: sleeper stretch × 3 × 30 sec daily, posterior capsule joint mobilisation (posterior glide). Frozen shoulder: Maitland Grade I–II in pain → Grade III–IV in stiff phase. End-range stretching program. Joint distension injection if severe. NKT: RC activation after each mobilisation session.",
        chainEffect:"GH IR restriction → shoulder impingement (posterior capsule pushes humeral head anterosuperiorly → compresses supraspinatus). Also: GH IR loss → thoracic rotation compensates → lumbar overloads.",
      },
      {
        id:"kc_cervical_thoracic_jct", label:"Cervicothoracic Junction (C7–T4) Mobility",
        role:"MOBILITY TEST", joint:"Cervicothoracic junction",
        how:"Patient seated. Assess rotation at cervicothoracic junction specifically: ask patient to rotate head fully. Apply resistance to C2 level (fixes upper cervical) and ask for rotation — measures mid-cervical rotation. Then fix C6 and ask to rotate — measures lower cervical and CT junction rotation. Palpation: PA pressure on C7, T1, T2, T3 spinous processes — stiffness and tenderness indicates hypomobility at CT junction. Normal: T1 should be mobile — spring test should have spring, not 'wooden' feel.",
        options:[
          { val:"Normal — mobile CT junction", color:"#00c97a", meaning:"CT junction mobile on PA spring test. No significant stiffness at T1–T3. Cervical rotation flows smoothly through CT junction. Brachial plexus exits freely. No referred arm symptoms provoked by CT junction loading." },
          { val:"Hypomobile CT junction — restricted rotation", color:"#ffb300", meaning:"CT junction stiff — PA spring test feels wooden at T1–T3. Reduced cervical rotation, particularly at lower levels. Patient has stiffness at base of neck. Often from forward head posture (chin poke — the CT junction extends to compensate for FHP). Mobilise: PA and rotation mobilisations at C7–T3." },
          { val:"CT junction hypomobility with arm symptoms", color:"#ff4d6d", meaning:"CT junction restricted AND provokes arm tingling/heaviness with loading. Brachial plexus or first rib elevated at CT junction. First rib elevation test: compare first rib height bilaterally (should be level). Thoracic outlet symptoms. Mobilise CT junction + first rib mobilisation. Scalene release (NKT: scalenes often overactive due to diaphragm inhibition — elevating first rib)." },
          { val:"Cervicothoracic instability — excessive motion", color:"#7f5af0", meaning:"Hypermobile CT junction — too much motion (often post-whiplash). PA spring has no resistance at C7/T1. May be causing positional headaches and neurological symptoms. Stabilise: deep cervical flexor activation, cervicothoracic stabilisation exercises. Avoid aggressive mobilisation or manipulation at this level." },
        ],
        treatment:"Hypomobile: PA mobilisation at T1–T3 (Maitland Grade III–IV), rotation mobilisation in sitting. First rib: inferior-posterior first rib mobilisation. Soft tissue: levator scapulae + upper trap at CT junction. Postural correction: CT junction extension exercises.",
        chainEffect:"Stiff CT junction → cervical spine compensates with excess rotation → cervicogenic headache. Also: CT junction stiffness → brachial plexus tension → arm symptoms. Shoulder function also affected (T1 sympathetics to upper limb exit here).",
      },
    ]
  },

  cervical:{
    label:"Cervical Spine", color:"#ff6b35", role:"MOBILITY",
    intro:"The cervical spine is a MOBILITY region — it needs 80° of rotation, 80° flexion, 70° extension, and 45° side-flexion for normal function. The upper cervical spine (C0–C2) provides 50% of all cervical rotation. The lower cervical (C3–C7) is primarily flexion/extension. Cervical dysfunction is almost always secondary to thoracic stiffness below and postural control deficit from DNF inhibition.",
    tests:[
      {
        id:"kc_cervical_rot_mob", label:"Cervical Rotation Mobility",
        role:"MOBILITY TEST", joint:"Cervical spine",
        how:"Patient seated, shoulders level. Rotate head fully left and right. Normal: 80° each side. Measure with goniometer (stationary arm top of head, moving arm follows nose). Differentiating upper vs lower cervical contribution: Flexion-Rotation Test (FRT) for C1/C2 specifically — patient fully flexes cervical spine (chin to chest), then rotates maximally. Normal FRT: 40–45° each side. <32° = positive = C1/C2 hypomobility. This eliminates contribution from lower cervical.",
        options:[
          { val:"Normal — 80° bilateral, FRT 40°+ each side", color:"#00c97a", meaning:"Full cervical rotation from both upper (C1/C2) and lower (C3–C7) cervical spine. No restriction. Normal driving vision, sport rotation, and head turning. Cervical facet joints and disc all contributing appropriately. No cervicogenic headache from rotation restriction." },
          { val:"Restricted — C1/C2 dominant (FRT positive)", color:"#ffb300", meaning:"Total rotation restricted and FRT <32° = upper cervical (C1/C2) restriction. Most common cause of cervicogenic headache and unilateral base-of-skull pain. Suboccipital muscles overactive. Upper cervical mobilisation (C1/C2 rotation and side-flex) + suboccipital release are treatment." },
          { val:"Restricted — lower cervical dominant", color:"#ff6b35", meaning:"Total rotation restricted but FRT normal = lower cervical (C3–C7) restriction. Facet joint or disc-related. Cervical rotation mobilisation at specific levels. Often related to thoracic stiffness causing lower cervical overload. Treat thoracic first, reassess." },
          { val:"Severely restricted bilateral — consider serious pathology", color:"#ff4d6d", meaning:"Both rotations severely restricted (especially if recent onset, no mechanism, or in older patient). Consider: RA (atlantoaxial instability — Sharp-Purser test FIRST), cervical myelopathy (Babinski/reflexes), infection, tumour. Urgent imaging if no mechanism. Do NOT manipulate until serious pathology ruled out." },
        ],
        treatment:"C1/C2: specific C1/C2 rotation manipulation or HVT (cervicogenic headache protocol). Suboccipital release + DNF activation. Lower cervical: segmental mobilisation at restricted level. Thoracic: always treat thoracic rotation restriction first as it directly improves cervical rotation. Home: cervical rotation active ROM × 10 reps each side daily.",
        chainEffect:"Restricted cervical rotation → patient rotates thoracic more → thoracic overload. Restricted cervical → SCM overworks → cervicogenic headache. DNF inhibition (NKT) is root cause in most cases.",
      },
      {
        id:"kc_cervical_flex_ext", label:"Cervical Flexion / Extension Mobility",
        role:"MOBILITY TEST", joint:"Cervical spine",
        how:"Patient seated. Flexion: chin-to-chest — normal = chin touches chest or ~80°. Extension: look to ceiling — normal = 70°. Measure with goniometer or inclinometer. Chin-to-chest test: failure to achieve = upper cervical restriction OR DNF weakness. Chin poke during extension (lower cervical 
