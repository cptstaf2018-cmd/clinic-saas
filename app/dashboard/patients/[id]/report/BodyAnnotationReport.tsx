import { AESTHETIC_FACE_IMAGE, AESTHETIC_FACE_ZONES } from "@/lib/aesthetic-face-map";

type Ann = { regionId: string; label: string; color: string; notes?: string | null };

type Region =
  | { id: string; labelAr: string; shape: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { id: string; labelAr: string; shape: "rect";    x: number;  y: number;  w: number;  h: number; rx?: number };

// ── DERMATOLOGY — body-map.png  960×1118 ──────────────────────────────────────
const DERM: Region[] = [
  { id:"head_f",       labelAr:"الرأس (أمامي)",          shape:"ellipse",cx:250,cy:76,  rx:58, ry:64  },
  { id:"neck_f",       labelAr:"الرقبة (أمامية)",        shape:"rect",   x:226, y:138, w:48,  h:42, rx:12 },
  { id:"r_shoulder_f", labelAr:"الكتف الأيمن",           shape:"ellipse",cx:114,cy:192,rx:52, ry:34  },
  { id:"l_shoulder_f", labelAr:"الكتف الأيسر",           shape:"ellipse",cx:386,cy:192,rx:52, ry:34  },
  { id:"chest_f",      labelAr:"الصدر",                  shape:"rect",   x:142, y:174, w:216, h:172,rx:20},
  { id:"abdomen_f",    labelAr:"البطن",                  shape:"rect",   x:150, y:348, w:200, h:144,rx:18},
  { id:"r_arm_f",      labelAr:"العضد الأيمن",           shape:"rect",   x:52,  y:184, w:54,  h:182,rx:22},
  { id:"l_arm_f",      labelAr:"العضد الأيسر",           shape:"rect",   x:394, y:184, w:54,  h:182,rx:22},
  { id:"r_forearm_f",  labelAr:"الساعد الأيمن",          shape:"rect",   x:38,  y:368, w:48,  h:158,rx:18},
  { id:"l_forearm_f",  labelAr:"الساعد الأيسر",          shape:"rect",   x:414, y:368, w:48,  h:158,rx:18},
  { id:"r_hand_f",     labelAr:"اليد اليمنى",            shape:"ellipse",cx:58, cy:546,rx:40, ry:50  },
  { id:"l_hand_f",     labelAr:"اليد اليسرى",            shape:"ellipse",cx:434,cy:546,rx:40, ry:50  },
  { id:"pelvis_f",     labelAr:"منطقة الحوض",            shape:"ellipse",cx:250,cy:502,rx:88, ry:42  },
  { id:"r_thigh_f",    labelAr:"الفخذ الأيمن",           shape:"rect",   x:170, y:538, w:62,  h:164,rx:24},
  { id:"l_thigh_f",    labelAr:"الفخذ الأيسر",           shape:"rect",   x:268, y:538, w:62,  h:164,rx:24},
  { id:"r_knee_f",     labelAr:"الركبة اليمنى",          shape:"ellipse",cx:201,cy:710,rx:48, ry:36  },
  { id:"l_knee_f",     labelAr:"الركبة اليسرى",          shape:"ellipse",cx:299,cy:710,rx:48, ry:36  },
  { id:"r_shin_f",     labelAr:"الساق اليمنى",           shape:"rect",   x:176, y:745, w:48,  h:240,rx:18},
  { id:"l_shin_f",     labelAr:"الساق اليسرى",           shape:"rect",   x:274, y:745, w:48,  h:240,rx:18},
  { id:"r_foot_f",     labelAr:"القدم اليمنى",           shape:"ellipse",cx:200,cy:1054,rx:52,ry:30  },
  { id:"l_foot_f",     labelAr:"القدم اليسرى",           shape:"ellipse",cx:298,cy:1054,rx:52,ry:30  },
  { id:"head_b",       labelAr:"الرأس (خلفي)",           shape:"ellipse",cx:730,cy:76,  rx:58, ry:64  },
  { id:"neck_b",       labelAr:"الرقبة (خلفية)",         shape:"rect",   x:706, y:138, w:48,  h:42, rx:12},
  { id:"r_shoulder_b", labelAr:"الكتف الأيمن (خلفي)",   shape:"ellipse",cx:866,cy:192,rx:52, ry:34  },
  { id:"l_shoulder_b", labelAr:"الكتف الأيسر (خلفي)",   shape:"ellipse",cx:594,cy:192,rx:52, ry:34  },
  { id:"upper_back",   labelAr:"أعلى الظهر",             shape:"rect",   x:622, y:174, w:216, h:172,rx:20},
  { id:"lower_back",   labelAr:"أسفل الظهر",             shape:"rect",   x:630, y:348, w:200, h:144,rx:18},
  { id:"r_arm_b",      labelAr:"العضد الأيمن (خلفي)",   shape:"rect",   x:874, y:184, w:54,  h:182,rx:22},
  { id:"l_arm_b",      labelAr:"العضد الأيسر (خلفي)",   shape:"rect",   x:532, y:184, w:54,  h:182,rx:22},
  { id:"r_forearm_b",  labelAr:"الساعد الأيمن (خلفي)",  shape:"rect",   x:890, y:368, w:48,  h:158,rx:18},
  { id:"l_forearm_b",  labelAr:"الساعد الأيسر (خلفي)",  shape:"rect",   x:522, y:368, w:48,  h:158,rx:18},
  { id:"r_hand_b",     labelAr:"اليد اليمنى (خلفية)",   shape:"ellipse",cx:910,cy:546,rx:40, ry:50  },
  { id:"l_hand_b",     labelAr:"اليد اليسرى (خلفية)",   shape:"ellipse",cx:548,cy:546,rx:40, ry:50  },
  { id:"r_buttock",    labelAr:"الأرداف الأيمن",         shape:"ellipse",cx:798,cy:506,rx:72, ry:54  },
  { id:"l_buttock",    labelAr:"الأرداف الأيسر",         shape:"ellipse",cx:662,cy:506,rx:72, ry:54  },
  { id:"r_thigh_b",    labelAr:"الفخذ الأيمن (خلفي)",   shape:"rect",   x:752, y:538, w:62,  h:164,rx:24},
  { id:"l_thigh_b",    labelAr:"الفخذ الأيسر (خلفي)",   shape:"rect",   x:650, y:538, w:62,  h:164,rx:24},
  { id:"r_calf",       labelAr:"بطة الساق اليمنى",       shape:"rect",   x:754, y:745, w:48,  h:240,rx:18},
  { id:"l_calf",       labelAr:"بطة الساق اليسرى",       shape:"rect",   x:652, y:745, w:48,  h:240,rx:18},
  { id:"r_heel",       labelAr:"الكعب الأيمن",           shape:"ellipse",cx:778,cy:1054,rx:52,ry:30  },
  { id:"l_heel",       labelAr:"الكعب الأيسر",           shape:"ellipse",cx:676,cy:1054,rx:52,ry:30  },
];

// ── ORTHOPEDICS — skeleton-front.png + skeleton-back.png  960×1856 ─────────────
const SKEL_FRONT: Region[] = [
  { id:"skull",          labelAr:"الجمجمة",             shape:"ellipse",cx:480,cy:148, rx:122,ry:94  },
  { id:"jaw",            labelAr:"الفك السفلي",         shape:"ellipse",cx:480,cy:278, rx:72, ry:30  },
  { id:"cervical",       labelAr:"الفقرات العنقية",     shape:"rect",   x:440, y:302,  w:80,  h:96, rx:14},
  { id:"thoracic",       labelAr:"الفقرات الصدرية",     shape:"rect",   x:448, y:396,  w:64,  h:390,rx:10},
  { id:"lumbar",         labelAr:"الفقرات القطنية",     shape:"rect",   x:448, y:786,  w:64,  h:178,rx:10},
  { id:"left_clavicle",  labelAr:"الترقوة اليمنى",     shape:"rect",   x:162, y:388,  w:316, h:44, rx:20},
  { id:"right_clavicle", labelAr:"الترقوة اليسرى",     shape:"rect",   x:482, y:388,  w:316, h:44, rx:20},
  { id:"ribcage",        labelAr:"القفص الصدري",        shape:"ellipse",cx:480,cy:540, rx:318,ry:210 },
  { id:"left_shoulder",  labelAr:"مفصل الكتف الأيمن",  shape:"ellipse",cx:140,cy:388, rx:92, ry:72  },
  { id:"right_shoulder", labelAr:"مفصل الكتف الأيسر",  shape:"ellipse",cx:820,cy:388, rx:92, ry:72  },
  { id:"left_humerus",   labelAr:"عظمة العضد الأيمن",  shape:"rect",   x:100, y:482,  w:84,  h:336,rx:38},
  { id:"right_humerus",  labelAr:"عظمة العضد الأيسر",  shape:"rect",   x:776, y:482,  w:84,  h:336,rx:38},
  { id:"left_elbow",     labelAr:"مفصل الكوع الأيمن",  shape:"ellipse",cx:142,cy:778, rx:64, ry:48  },
  { id:"right_elbow",    labelAr:"مفصل الكوع الأيسر",  shape:"ellipse",cx:818,cy:778, rx:64, ry:48  },
  { id:"left_radius",    labelAr:"عظام الساعد الأيمن", shape:"rect",   x:96,  y:876,  w:74,  h:258,rx:34},
  { id:"right_radius",   labelAr:"عظام الساعد الأيسر", shape:"rect",   x:790, y:876,  w:74,  h:258,rx:34},
  { id:"left_wrist",     labelAr:"مفصل الرسغ الأيمن",  shape:"ellipse",cx:133,cy:960, rx:58, ry:38  },
  { id:"right_wrist",    labelAr:"مفصل الرسغ الأيسر",  shape:"ellipse",cx:827,cy:960, rx:58, ry:38  },
  { id:"pelvis",         labelAr:"الحوض",               shape:"ellipse",cx:480,cy:946, rx:232,ry:80  },
  { id:"left_hip",       labelAr:"مفصل الورك الأيمن",  shape:"ellipse",cx:296,cy:994, rx:102,ry:96  },
  { id:"right_hip",      labelAr:"مفصل الورك الأيسر",  shape:"ellipse",cx:664,cy:994, rx:102,ry:96  },
  { id:"left_femur",     labelAr:"عظمة الفخذ اليمنى",  shape:"rect",   x:238, y:1164, w:114, h:336,rx:50},
  { id:"right_femur",    labelAr:"عظمة الفخذ اليسرى",  shape:"rect",   x:608, y:1164, w:114, h:336,rx:50},
  { id:"left_knee",      labelAr:"مفصل الركبة اليمنى", shape:"ellipse",cx:296,cy:1414,rx:70, ry:56  },
  { id:"right_knee",     labelAr:"مفصل الركبة اليسرى", shape:"ellipse",cx:664,cy:1414,rx:70, ry:56  },
  { id:"left_tibia",     labelAr:"عظمة الساق اليمنى",  shape:"rect",   x:242, y:1564, w:108, h:204,rx:44},
  { id:"right_tibia",    labelAr:"عظمة الساق اليسرى",  shape:"rect",   x:610, y:1564, w:108, h:204,rx:44},
  { id:"left_ankle",     labelAr:"مفصل الكاحل الأيمن", shape:"ellipse",cx:294,cy:1678,rx:78, ry:48  },
  { id:"right_ankle",    labelAr:"مفصل الكاحل الأيسر", shape:"ellipse",cx:666,cy:1678,rx:78, ry:48  },
  { id:"left_foot",      labelAr:"عظام القدم اليمنى",  shape:"ellipse",cx:266,cy:1720,rx:110,ry:46  },
  { id:"right_foot",     labelAr:"عظام القدم اليسرى",  shape:"ellipse",cx:694,cy:1720,rx:110,ry:46  },
];
const SKEL_BACK: Region[] = [
  { id:"skull_b",         labelAr:"الجمجمة (خلفي)",     shape:"ellipse",cx:480,cy:148, rx:122,ry:94  },
  { id:"cervical_b",      labelAr:"الفقرات العنقية",    shape:"rect",   x:440, y:302,  w:80,  h:96, rx:14},
  { id:"thoracic_b",      labelAr:"الفقرات الصدرية",    shape:"rect",   x:442, y:396,  w:76,  h:390,rx:10},
  { id:"lumbar_b",        labelAr:"الفقرات القطنية",    shape:"rect",   x:442, y:786,  w:76,  h:178,rx:10},
  { id:"sacrum",          labelAr:"العجز والعصعص",      shape:"ellipse",cx:480,cy:870, rx:76, ry:86  },
  { id:"left_scapula",    labelAr:"لوح الكتف الأيسر",  shape:"ellipse",cx:220,cy:450, rx:138,ry:160 },
  { id:"right_scapula",   labelAr:"لوح الكتف الأيمن",  shape:"ellipse",cx:740,cy:450, rx:138,ry:160 },
  { id:"left_clavicle_b", labelAr:"الترقوة اليسرى",    shape:"rect",   x:162, y:388,  w:316, h:44, rx:20},
  { id:"right_clavicle_b",labelAr:"الترقوة اليمنى",    shape:"rect",   x:482, y:388,  w:316, h:44, rx:20},
  { id:"ribcage_b",       labelAr:"القفص الصدري",       shape:"ellipse",cx:480,cy:540, rx:318,ry:210 },
  { id:"left_shoulder_b", labelAr:"مفصل الكتف الأيسر", shape:"ellipse",cx:140,cy:388, rx:92, ry:72  },
  { id:"right_shoulder_b",labelAr:"مفصل الكتف الأيمن", shape:"ellipse",cx:820,cy:388, rx:92, ry:72  },
  { id:"left_humerus_b",  labelAr:"عظمة العضد الأيسر", shape:"rect",   x:100, y:482,  w:84,  h:336,rx:38},
  { id:"right_humerus_b", labelAr:"عظمة العضد الأيمن", shape:"rect",   x:776, y:482,  w:84,  h:336,rx:38},
  { id:"left_elbow_b",    labelAr:"مفصل الكوع الأيسر", shape:"ellipse",cx:142,cy:778, rx:64, ry:48  },
  { id:"right_elbow_b",   labelAr:"مفصل الكوع الأيمن", shape:"ellipse",cx:818,cy:778, rx:64, ry:48  },
  { id:"left_radius_b",   labelAr:"ساعد أيسر",          shape:"rect",   x:96,  y:876,  w:74,  h:258,rx:34},
  { id:"right_radius_b",  labelAr:"ساعد أيمن",          shape:"rect",   x:790, y:876,  w:74,  h:258,rx:34},
  { id:"pelvis_b",        labelAr:"الحوض",              shape:"ellipse",cx:480,cy:946, rx:232,ry:80  },
  { id:"left_buttock",    labelAr:"الأرداف الأيسر",    shape:"ellipse",cx:340,cy:950, rx:130,ry:90  },
  { id:"right_buttock",   labelAr:"الأرداف الأيمن",    shape:"ellipse",cx:620,cy:950, rx:130,ry:90  },
  { id:"left_femur_b",    labelAr:"فخذ أيسر (خلفي)",   shape:"rect",   x:238, y:1164, w:114, h:336,rx:50},
  { id:"right_femur_b",   labelAr:"فخذ أيمن (خلفي)",   shape:"rect",   x:608, y:1164, w:114, h:336,rx:50},
  { id:"left_knee_b",     labelAr:"الركبة اليسرى",     shape:"ellipse",cx:296,cy:1414,rx:70, ry:56  },
  { id:"right_knee_b",    labelAr:"الركبة اليمنى",     shape:"ellipse",cx:664,cy:1414,rx:70, ry:56  },
  { id:"left_calf",       labelAr:"بطة الساق اليسرى",  shape:"rect",   x:242, y:1564, w:108, h:204,rx:44},
  { id:"right_calf",      labelAr:"بطة الساق اليمنى",  shape:"rect",   x:610, y:1564, w:108, h:204,rx:44},
  { id:"left_heel",       labelAr:"الكعب الأيسر",      shape:"ellipse",cx:286,cy:1692,rx:76, ry:46  },
  { id:"right_heel",      labelAr:"الكعب الأيمن",      shape:"ellipse",cx:674,cy:1692,rx:76, ry:46  },
  { id:"left_foot_b",     labelAr:"عظام القدم اليسرى", shape:"ellipse",cx:268,cy:1720,rx:108,ry:44  },
  { id:"right_foot_b",    labelAr:"عظام القدم اليمنى", shape:"ellipse",cx:692,cy:1720,rx:108,ry:44  },
];

// ── GYNECOLOGY — gynecology-map.png  1280×754 ──────────────────────────────────
const GYNECOLOGY: Region[] = [
  { id:"uterus",        labelAr:"الرحم",                 shape:"ellipse",cx:640, cy:300, rx:120,ry:110 },
  { id:"r_ovary",       labelAr:"المبيض الأيمن",         shape:"ellipse",cx:240, cy:270, rx:55, ry:48  },
  { id:"l_ovary",       labelAr:"المبيض الأيسر",         shape:"ellipse",cx:1040,cy:270, rx:55, ry:48  },
  { id:"r_fallopian",   labelAr:"قناة فالوب اليمنى",     shape:"rect",   x:280,  y:180,  w:310, h:50, rx:25},
  { id:"l_fallopian",   labelAr:"قناة فالوب اليسرى",     shape:"rect",   x:690,  y:180,  w:310, h:50, rx:25},
  { id:"cervix",        labelAr:"عنق الرحم",             shape:"ellipse",cx:640, cy:430, rx:65, ry:55  },
  { id:"vagina",        labelAr:"المهبل",                shape:"rect",   x:580,  y:490,  w:120, h:140,rx:20},
  { id:"vulva",         labelAr:"الفرج",                 shape:"ellipse",cx:640, cy:670, rx:90, ry:50  },
  { id:"endometrium",   labelAr:"بطانة الرحم",           shape:"ellipse",cx:640, cy:295, rx:65, ry:65  },
  { id:"r_parametrium", labelAr:"النسيج المحيط (أيمن)",  shape:"ellipse",cx:390, cy:340, rx:70, ry:50  },
  { id:"l_parametrium", labelAr:"النسيج المحيط (أيسر)",  shape:"ellipse",cx:890, cy:340, rx:70, ry:50  },
];

// ── CARDIOLOGY — heart-map.jpg  1280×896 ──────────────────────────────────────
const CARDIOLOGY: Region[] = [
  { id:"right_atrium",    labelAr:"الأذين الأيمن",        shape:"ellipse",cx:340,cy:400, rx:90, ry:100 },
  { id:"left_atrium",     labelAr:"الأذين الأيسر",        shape:"ellipse",cx:750,cy:310, rx:110,ry:85  },
  { id:"right_ventricle", labelAr:"البطين الأيمن",        shape:"ellipse",cx:440,cy:600, rx:110,ry:130 },
  { id:"left_ventricle",  labelAr:"البطين الأيسر",        shape:"ellipse",cx:720,cy:590, rx:100,ry:140 },
  { id:"septum",          labelAr:"الحاجز البطيني",       shape:"rect",   x:555, y:430,  w:50,  h:220,rx:15},
  { id:"tricuspid",       labelAr:"الصمام ثلاثي الشُرَف", shape:"ellipse",cx:400,cy:500, rx:55, ry:45  },
  { id:"mitral",          labelAr:"الصمام التاجي",        shape:"ellipse",cx:680,cy:440, rx:55, ry:45  },
  { id:"aortic_valve",    labelAr:"الصمام الأورطي",       shape:"ellipse",cx:565,cy:370, rx:45, ry:40  },
  { id:"pulm_valve",      labelAr:"الصمام الرئوي",        shape:"ellipse",cx:470,cy:330, rx:45, ry:40  },
  { id:"aorta",           labelAr:"الشريان الأورطي",      shape:"ellipse",cx:540,cy:95,  rx:70, ry:80  },
  { id:"sup_vena_cava",   labelAr:"الوريد الأجوف العلوي", shape:"ellipse",cx:380,cy:105, rx:55, ry:80  },
  { id:"inf_vena_cava",   labelAr:"الوريد الأجوف السفلي", shape:"ellipse",cx:335,cy:760, rx:55, ry:60  },
  { id:"pulm_trunk",      labelAr:"الجذع الرئوي",         shape:"ellipse",cx:455,cy:180, rx:60, ry:60  },
  { id:"r_pulm_artery",   labelAr:"الشريان الرئوي الأيمن",shape:"rect",   x:270, y:185,  w:120, h:45, rx:20},
  { id:"l_pulm_artery",   labelAr:"الشريان الرئوي الأيسر",shape:"rect",   x:710, y:140,  w:150, h:45, rx:20},
  { id:"r_pulm_veins",    labelAr:"الأوردة الرئوية اليمنى",shape:"rect",  x:215, y:300,  w:95,  h:100,rx:20},
  { id:"l_pulm_veins",    labelAr:"الأوردة الرئوية اليسرى",shape:"rect",  x:870, y:270,  w:95,  h:100,rx:20},
  { id:"myocardium",      labelAr:"عضلة القلب",           shape:"ellipse",cx:850,cy:620, rx:60, ry:40  },
  { id:"pericardium",     labelAr:"التامور",              shape:"ellipse",cx:850,cy:550, rx:60, ry:35  },
];

// ── INTERNAL MEDICINE — organs-map.svg / organs-map.png  1363×1211 ─────────────
const INTERNAL: Region[] = [
  { id:"brain",        labelAr:"الدماغ",             shape:"ellipse",cx:640,cy:85,  rx:85, ry:80  },
  { id:"pharynx",      labelAr:"الحلق / البلعوم",    shape:"ellipse",cx:640,cy:195, rx:45, ry:40  },
  { id:"thyroid",      labelAr:"الغدة الدرقية",       shape:"ellipse",cx:640,cy:248, rx:55, ry:26  },
  { id:"right_lung",   labelAr:"الرئة اليمنى",       shape:"ellipse",cx:575,cy:310, rx:52, ry:88  },
  { id:"left_lung",    labelAr:"الرئة اليسرى",       shape:"ellipse",cx:720,cy:310, rx:52, ry:88  },
  { id:"heart",        labelAr:"القلب",               shape:"ellipse",cx:618,cy:390, rx:50, ry:55  },
  { id:"liver",        labelAr:"الكبد",               shape:"ellipse",cx:594,cy:490, rx:82, ry:56  },
  { id:"gallbladder",  labelAr:"المرارة",              shape:"ellipse",cx:620,cy:553, rx:28, ry:28  },
  { id:"stomach",      labelAr:"المعدة",               shape:"ellipse",cx:700,cy:495, rx:52, ry:52  },
  { id:"spleen",       labelAr:"الطحال",               shape:"ellipse",cx:765,cy:468, rx:40, ry:44  },
  { id:"pancreas",     labelAr:"البنكرياس",            shape:"rect",   x:565, y:555,  w:168, h:36, rx:18},
  { id:"right_kidney", labelAr:"الكلية اليمنى",       shape:"ellipse",cx:562,cy:600, rx:33, ry:50  },
  { id:"left_kidney",  labelAr:"الكلية اليسرى",       shape:"ellipse",cx:735,cy:600, rx:33, ry:50  },
  { id:"small_bowel",  labelAr:"الأمعاء الدقيقة",     shape:"ellipse",cx:643,cy:730, rx:110,ry:95  },
  { id:"large_bowel",  labelAr:"الأمعاء الغليظة",     shape:"rect",   x:510, y:640,  w:270, h:200,rx:30},
  { id:"bladder",      labelAr:"المثانة",              shape:"ellipse",cx:640,cy:1000,rx:65, ry:50  },
  { id:"aorta",        labelAr:"الشريان الأورطي",     shape:"rect",   x:628, y:290,  w:30,  h:680,rx:15},
];

// ── OPHTHALMOLOGY — pure SVG 1170×760 ────────────────────────────────────────
// Arc helper (same as EyeMapClient)
function arc(cx: number, cy: number, r1: number, r2: number, a1: number, a2: number): string {
  const rad = (d: number) => (d * Math.PI) / 180;
  const c = Math.cos, s = Math.sin;
  const large = a2 - a1 > 180 ? 1 : 0;
  const x1o = cx + r2 * c(rad(a1)), y1o = cy + r2 * s(rad(a1));
  const x2o = cx + r2 * c(rad(a2)), y2o = cy + r2 * s(rad(a2));
  if (r1 === 0) return `M ${cx} ${cy} L ${x1o} ${y1o} A ${r2} ${r2} 0 ${large} 1 ${x2o} ${y2o} Z`;
  const x1i = cx + r1 * c(rad(a2)), y1i = cy + r1 * s(rad(a2));
  const x2i = cx + r1 * c(rad(a1)), y2i = cy + r1 * s(rad(a1));
  return `M ${x1o} ${y1o} A ${r2} ${r2} 0 ${large} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${r1} ${r1} 0 ${large} 0 ${x2i} ${y2i} Z`;
}

const R_OUT = 220, R_MID = 130;
const EYE_ZONES: Record<string, { path: string; labelAr: string }> = {
  OD_per_tr:  { path: arc(270,380,R_MID,R_OUT,-90,0),   labelAr:"OD محيط علوي صدغي"  },
  OD_per_br:  { path: arc(270,380,R_MID,R_OUT,0,90),    labelAr:"OD محيط سفلي صدغي"  },
  OD_per_bl:  { path: arc(270,380,R_MID,R_OUT,90,180),  labelAr:"OD محيط سفلي أنفي"  },
  OD_per_tl:  { path: arc(270,380,R_MID,R_OUT,180,270), labelAr:"OD محيط علوي أنفي"  },
  OD_post_tr: { path: arc(270,380,0,R_MID,-90,0),       labelAr:"OD قطب خلفي علوي صدغي" },
  OD_post_br: { path: arc(270,380,0,R_MID,0,90),        labelAr:"OD قطب خلفي سفلي صدغي" },
  OD_post_bl: { path: arc(270,380,0,R_MID,90,180),      labelAr:"OD قطب خلفي سفلي أنفي" },
  OD_post_tl: { path: arc(270,380,0,R_MID,180,270),     labelAr:"OD قطب خلفي علوي أنفي" },
  OS_per_tr:  { path: arc(900,380,R_MID,R_OUT,-90,0),   labelAr:"OS محيط علوي أنفي"   },
  OS_per_br:  { path: arc(900,380,R_MID,R_OUT,0,90),    labelAr:"OS محيط سفلي أنفي"   },
  OS_per_bl:  { path: arc(900,380,R_MID,R_OUT,90,180),  labelAr:"OS محيط سفلي صدغي"  },
  OS_per_tl:  { path: arc(900,380,R_MID,R_OUT,180,270), labelAr:"OS محيط علوي صدغي"  },
  OS_post_tr: { path: arc(900,380,0,R_MID,-90,0),       labelAr:"OS قطب خلفي علوي أنفي" },
  OS_post_br: { path: arc(900,380,0,R_MID,0,90),        labelAr:"OS قطب خلفي سفلي أنفي" },
  OS_post_bl: { path: arc(900,380,0,R_MID,90,180),      labelAr:"OS قطب خلفي سفلي صدغي" },
  OS_post_tl: { path: arc(900,380,0,R_MID,180,270),     labelAr:"OS قطب خلفي علوي صدغي" },
};

// ── Helper: render SVG shape ──────────────────────────────────────────────────
function RegionOverlay({ region, color }: { region: Region; color: string }) {
  const x = region.shape === "ellipse" ? region.cx : region.x + region.w / 2;
  const y = region.shape === "ellipse" ? region.cy : region.y + region.h / 2;
  return (
    <g>
      <circle cx={x} cy={y} r={18} fill={color} fillOpacity={0.32} stroke={color} strokeWidth={4} />
      <circle cx={x} cy={y} r={5} fill={color} />
    </g>
  );
}

function parsePoint(id: string) {
  const [prefix, map, x, y] = id.split(":");
  if (prefix !== "point") return null;
  const px = Number(x);
  const py = Number(y);
  if (!map || !Number.isFinite(px) || !Number.isFinite(py)) return null;
  return { map, x: px, y: py };
}

// ── Image-based map ───────────────────────────────────────────────────────────
function ImageMap({ src, vbW, vbH, regions, annotations, maxW = 300 }: {
  src: string; vbW: number; vbH: number;
  regions: Region[]; annotations: Ann[]; maxW?: number;
}) {
  const annMap = new Map(annotations.map(a => [a.regionId, a]));
  const activeRegions = regions.filter(r => annMap.has(r.id));
  const pointAnnotations = annotations
    .map((annotation) => ({ annotation, point: parsePoint(annotation.regionId) }))
    .filter((item): item is { annotation: Ann; point: { map: string; x: number; y: number } } => !!item.point);
  const h = Math.round(maxW * vbH / vbW);
  return (
    <div style={{ position: "relative", width: maxW, height: h, flexShrink: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill" }} />
      <svg viewBox={`0 0 ${vbW} ${vbH}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {activeRegions.map(r => <RegionOverlay key={r.id} region={r} color={annMap.get(r.id)!.color} />)}
        {pointAnnotations.map(({ annotation, point }) => (
          <g key={annotation.regionId}>
            <circle cx={point.x} cy={point.y} r={Math.max(vbW, vbH) * 0.015} fill={annotation.color} fillOpacity={0.32} stroke={annotation.color} strokeWidth={Math.max(vbW, vbH) * 0.004} />
            <circle cx={point.x} cy={point.y} r={Math.max(vbW, vbH) * 0.004} fill={annotation.color} />
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Annotations list ──────────────────────────────────────────────────────────
function AnnList({ annotations, labelMap }: { annotations: Ann[]; labelMap: Map<string, string> }) {
  return (
    <div style={{ flex: 1, paddingTop: 4 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
        الملاحظات على الخريطة
      </p>
      {annotations.length === 0 && (
        <p style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>
          لا توجد ملاحظات محفوظة على الخريطة.
        </p>
      )}
      {annotations.map(a => (
        <div key={a.regionId} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: a.color, flexShrink: 0, marginTop: 2 }} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
              {labelMap.get(a.regionId) ?? (parsePoint(a.regionId) ? "نقطة محددة" : a.regionId)}
            </span>
            <span style={{ fontSize: 12, color: "#64748b", margin: "0 4px" }}>—</span>
            <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>{a.label}</span>
            {a.notes && <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{a.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function BodyAnnotationReport({
  specialtyCode,
  annotations,
}: {
  specialtyCode: string;
  annotations: Ann[];
}) {
  // ── AESTHETIC — face-map.png ──────────────────────────────────────────────
  if (specialtyCode === "aesthetic") {
    const labelMap = new Map(AESTHETIC_FACE_ZONES.map(r => [r.id, r.labelAr]));
    return (
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <ImageMap
          src={AESTHETIC_FACE_IMAGE.src}
          vbW={AESTHETIC_FACE_IMAGE.width}
          vbH={AESTHETIC_FACE_IMAGE.height}
          regions={AESTHETIC_FACE_ZONES}
          annotations={annotations}
          maxW={240}
        />
        <AnnList annotations={annotations} labelMap={labelMap} />
      </div>
    );
  }

  // ── DERMATOLOGY ────────────────────────────────────────────────────────────
  if (specialtyCode === "dermatology") {
    const labelMap = new Map(DERM.map(r => [r.id, r.labelAr]));
    return (
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <ImageMap src="/body-map.png" vbW={960} vbH={1118} regions={DERM} annotations={annotations} maxW={200} />
        <AnnList annotations={annotations} labelMap={labelMap} />
      </div>
    );
  }

  // ── ORTHOPEDICS (skeleton, front + back) ───────────────────────────────────
  if (specialtyCode === "orthopedics") {
    const frontIds = new Set(SKEL_FRONT.map(r => r.id));
    const frontAnns = annotations.filter(a => frontIds.has(a.regionId) || parsePoint(a.regionId)?.map === "front");
    const backAnns  = annotations.filter(a => !frontIds.has(a.regionId) && parsePoint(a.regionId)?.map !== "front");
    const allRegions = [...SKEL_FRONT, ...SKEL_BACK];
    const labelMap = new Map(allRegions.map(r => [r.id, r.labelAr]));
    return (
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 10, textAlign: "center", color: "#94a3b8", marginBottom: 4 }}>أمامي</p>
            <ImageMap src="/skeleton-front.png" vbW={960} vbH={1856} regions={SKEL_FRONT} annotations={frontAnns} maxW={120} />
          </div>
          <div>
            <p style={{ fontSize: 10, textAlign: "center", color: "#94a3b8", marginBottom: 4 }}>خلفي</p>
            <ImageMap src="/skeleton-back.png" vbW={960} vbH={1856} regions={SKEL_BACK} annotations={backAnns} maxW={120} />
          </div>
        </div>
        <AnnList annotations={annotations} labelMap={labelMap} />
      </div>
    );
  }

  // ── GYNECOLOGY ─────────────────────────────────────────────────────────────
  if (specialtyCode === "gynecology") {
    const labelMap = new Map(GYNECOLOGY.map(r => [r.id, r.labelAr]));
    return (
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <ImageMap src="/gynecology-map.png" vbW={1280} vbH={754} regions={GYNECOLOGY} annotations={annotations} maxW={300} />
        <AnnList annotations={annotations} labelMap={labelMap} />
      </div>
    );
  }

  // ── CARDIOLOGY ─────────────────────────────────────────────────────────────
  if (specialtyCode === "cardiology") {
    const labelMap = new Map(CARDIOLOGY.map(r => [r.id, r.labelAr]));
    return (
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <ImageMap src="/heart-map.jpg" vbW={1280} vbH={896} regions={CARDIOLOGY} annotations={annotations} maxW={260} />
        <AnnList annotations={annotations} labelMap={labelMap} />
      </div>
    );
  }

  // ── INTERNAL MEDICINE ──────────────────────────────────────────────────────
  if (specialtyCode === "internal_medicine") {
    const labelMap = new Map(INTERNAL.map(r => [r.id, r.labelAr]));
    return (
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <ImageMap src="/organs-map.svg" vbW={1363} vbH={1211} regions={INTERNAL} annotations={annotations} maxW={220} />
        <AnnList annotations={annotations} labelMap={labelMap} />
      </div>
    );
  }

  // ── OPHTHALMOLOGY ──────────────────────────────────────────────────────────
  if (specialtyCode === "ophthalmology") {
    const annMap = new Map(annotations.map(a => [a.regionId, a]));
    const labelMap = new Map(Object.entries(EYE_ZONES).map(([id, z]) => [id, z.labelAr]));
    return (
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <svg viewBox="0 0 1170 760" width={340} height={220} style={{ flexShrink: 0, background: "#f8fafc", borderRadius: 8 }}>
          {/* OD circle */}
          <circle cx={270} cy={380} r={R_OUT} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={2}/>
          <circle cx={270} cy={380} r={R_MID} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth={1}/>
          <text x={270} y={130} textAnchor="middle" fontSize={28} fontWeight="bold" fill="#374151">OD</text>
          <text x={270} y={160} textAnchor="middle" fontSize={18} fill="#64748b">العين اليمنى</text>
          {/* OS circle */}
          <circle cx={900} cy={380} r={R_OUT} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={2}/>
          <circle cx={900} cy={380} r={R_MID} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth={1}/>
          <text x={900} y={130} textAnchor="middle" fontSize={28} fontWeight="bold" fill="#374151">OS</text>
          <text x={900} y={160} textAnchor="middle" fontSize={18} fill="#64748b">العين اليسرى</text>
          {/* Annotated zones */}
          {Object.entries(EYE_ZONES).map(([id, zone]) => {
            const ann = annMap.get(id);
            if (!ann) return null;
            return <path key={id} d={zone.path} fill={ann.color} fillOpacity={0.45} stroke={ann.color} strokeOpacity={0.75} strokeWidth={2}/>;
          })}
        </svg>
        <AnnList annotations={annotations} labelMap={labelMap} />
      </div>
    );
  }

  // ── GENERAL MEDICINE / SURGERY — body map ─────────────────────────────────
  if (specialtyCode === "general_medicine" || specialtyCode === "surgery") {
    const labelMap = new Map(DERM.map(r => [r.id, r.labelAr]));
    return (
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <ImageMap src="/body-map.png" vbW={960} vbH={1118} regions={DERM} annotations={annotations} maxW={200} />
        <AnnList annotations={annotations} labelMap={labelMap} />
      </div>
    );
  }

  return null;
}
