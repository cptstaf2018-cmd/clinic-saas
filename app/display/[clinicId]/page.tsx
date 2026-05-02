"use client";

import { useEffect, useState } from "react";

interface DisplayData {
  current: { name: string; queueNumber: number | null } | null;
  waiting: { name: string; queueNumber: number | null }[];
}

export default function DisplayPage({ params }: { params: Promise<{ clinicId: string }> }) {
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [data, setData] = useState<DisplayData>({ current: null, waiting: [] });
  const [clinicName, setClinicName] = useState("نظام الانتظار");
  const [time, setTime] = useState("");

  useEffect(() => { params.then((p) => setClinicId(p.clinicId)); }, [params]);

  useEffect(() => {
    if (!clinicId) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/display/${clinicId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          if (json.clinicName) setClinicName(json.clinicName);
        }
      } catch {}
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [clinicId]);

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" }));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }

        .display-root {
          min-height:100vh;
          background:#f0f4ff;
          display:flex; flex-direction:column;
          overflow:hidden; position:relative;
          font-family:'Cairo','Segoe UI',sans-serif;
        }

        /* شريط علوي متحرك */
        .top-bar {
          height:5px; flex-shrink:0;
          background:linear-gradient(90deg,#2563eb,#0ea5e9,#06b6d4,#2563eb);
          background-size:200% 100%;
          animation:shimmer 3s linear infinite;
        }
        @keyframes shimmer {
          0%{background-position:0% 0%;}
          100%{background-position:200% 0%;}
        }

        /* هيدر */
        .d-header {
          display:flex; justify-content:space-between; align-items:center;
          padding:18px 28px 14px;
          background:white;
          border-bottom:2px solid #e2e8f0;
          position:relative; z-index:2;
        }
        .d-clinic {
          display:flex; align-items:center; gap:12px;
          font-size:22px; font-weight:900; color:#1e40af;
        }
        .d-logo {
          width:48px; height:48px; border-radius:14px;
          background:linear-gradient(135deg,#1e40af,#3b82f6);
          display:flex; align-items:center; justify-content:center;
          font-size:24px;
          box-shadow:0 4px 14px rgba(30,64,175,0.35);
          animation:logoPop 8s ease-in-out infinite;
        }
        @keyframes logoPop {
          0%,88%,100%{transform:scale(1);}
          92%{transform:scale(1.12);}
          96%{transform:scale(0.97);}
        }
        .d-time {
          background:#f8fafc; border:2px solid #e2e8f0;
          border-radius:14px; padding:10px 18px;
          font-size:20px; font-weight:700; color:#334155;
          display:flex; align-items:center; gap:8px;
        }

        /* سماعة خلفية */
        .steth-bg {
          position:fixed; top:-10px; right:-20px;
          opacity:0.07; z-index:0;
          animation:floatSteth 7s ease-in-out infinite;
        }
        @keyframes floatSteth {
          0%,100%{transform:translateY(0) rotate(0deg);}
          50%{transform:translateY(12px) rotate(4deg);}
        }

        /* قلب نابض */
        .heart-bg {
          position:fixed; bottom:20px; left:30px;
          z-index:0;
          animation:heartBeat 1.3s ease-in-out infinite;
        }
        @keyframes heartBeat {
          0%,100%{transform:scale(1);}
          14%{transform:scale(1.2);}
          28%{transform:scale(1);}
          42%{transform:scale(1.1);}
          70%{transform:scale(1);}
        }

        /* خط ECG خلفي */
        .ecg-bg {
          position:fixed; bottom:10px; left:0; right:0;
          height:150px; z-index:0;
        }
        .ecg-line {
          stroke-dasharray:2200;
          stroke-dashoffset:2200;
          animation:drawECG 3.5s ease-in-out infinite;
        }
        @keyframes drawECG {
          0%{stroke-dashoffset:2200; opacity:0.04;}
          40%{opacity:0.16;}
          100%{stroke-dashoffset:0; opacity:0.04;}
        }

        /* محتوى رئيسي */
        .d-content {
          position:relative; z-index:1;
          flex:1; padding:0 24px 16px;
          display:flex; flex-direction:column;
        }

        /* نقطة حية */
        .now-label {
          text-align:center; font-size:16px;
          color:#64748b; font-weight:700;
          margin:18px 0 12px;
          display:flex; align-items:center; justify-content:center; gap:9px;
        }
        .live-dot {
          width:11px; height:11px; border-radius:50%;
          background:#22c55e;
          box-shadow:0 0 0 0 rgba(34,197,94,0.6);
          animation:livePulse 1.5s ease-out infinite;
        }
        @keyframes livePulse {
          0%{box-shadow:0 0 0 0 rgba(34,197,94,0.7);}
          70%{box-shadow:0 0 0 14px rgba(34,197,94,0);}
          100%{box-shadow:0 0 0 0 rgba(34,197,94,0);}
        }

        /* بطاقة المريض الحالي */
        .current-card {
          background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 55%,#3b82f6 100%);
          border-radius:26px; padding:36px 28px;
          text-align:center; margin-bottom:24px;
          box-shadow:0 20px 60px rgba(37,99,235,0.38);
          position:relative; overflow:hidden;
          animation:cardPulse 2.8s ease-in-out infinite;
        }
        @keyframes cardPulse {
          0%,100%{box-shadow:0 20px 60px rgba(37,99,235,0.38), 0 0 0 0 rgba(37,99,235,0.25);}
          50%{box-shadow:0 20px 60px rgba(37,99,235,0.38), 0 0 0 20px rgba(37,99,235,0);}
        }
        .card-glow {
          position:absolute; inset:0; border-radius:26px;
          background:radial-gradient(ellipse at 50% 0%,rgba(255,255,255,0.13),transparent 65%);
          animation:glowPulse 2.5s ease-in-out infinite;
        }
        @keyframes glowPulse {
          0%,100%{opacity:0.5;} 50%{opacity:1;}
        }
        /* ECG داخل البطاقة */
        .card-ecg {
          position:absolute; bottom:0; left:0; right:0; opacity:0.18;
        }
        .card-ecg-line {
          stroke-dasharray:900;
          stroke-dashoffset:900;
          animation:drawECG 2.2s ease-in-out infinite;
        }
        /* دوائر تمتد */
        .ripple {
          position:absolute; border-radius:50%;
          border:2px solid rgba(255,255,255,0.25);
          animation:rippleOut 2.6s ease-out infinite;
          top:50%; left:50%; transform:translate(-50%,-50%);
        }
        .ripple:nth-child(3){animation-delay:0.87s;}
        .ripple:nth-child(4){animation-delay:1.74s;}
        @keyframes rippleOut {
          0%{width:60px;height:60px;opacity:0.7;}
          100%{width:380px;height:380px;opacity:0;}
        }
        .num-badge {
          display:inline-flex; align-items:center; justify-content:center;
          width:54px; height:54px; border-radius:18px;
          background:rgba(255,255,255,0.18);
          border:2px solid rgba(255,255,255,0.35);
          color:white; font-size:22px; font-weight:900;
          margin-bottom:12px; position:relative; z-index:1;
        }
        .patient-name {
          font-size:62px; font-weight:900; color:white;
          line-height:1; position:relative; z-index:1;
          text-shadow:0 4px 20px rgba(0,0,0,0.22);
        }
        .empty-text {
          font-size:28px; font-weight:600;
          color:rgba(255,255,255,0.5);
          position:relative; z-index:1;
        }

        /* قائمة الانتظار */
        .queue-title {
          text-align:center; font-size:12px; font-weight:700;
          color:#94a3b8; letter-spacing:3px;
          margin-bottom:12px;
        }
        .queue-item {
          background:white;
          border:1.5px solid #e2e8f0;
          border-radius:18px;
          padding:15px 22px;
          display:flex; justify-content:space-between; align-items:center;
          margin-bottom:10px;
          box-shadow:0 2px 10px rgba(0,0,0,0.04);
        }
        .q-name { font-size:20px; font-weight:700; color:#1e293b; }
        .q-num {
          font-size:14px; font-weight:800; color:#2563eb;
          background:#eff6ff; border:1.5px solid #bfdbfe;
          padding:5px 14px; border-radius:10px;
        }

        .d-footer {
          text-align:center; color:#cbd5e1;
          font-size:12px; padding:10px 0;
          position:relative; z-index:2;
        }
      `}</style>

      <div className="display-root" dir="rtl">

        {/* شريط علوي */}
        <div className="top-bar" />

        {/* هيدر */}
        <div className="d-header">
          <div className="d-clinic">
            <div className="d-logo">🏥</div>
            {clinicName}
          </div>
          <div className="d-time">🕐 {time}</div>
        </div>

        {/* سماعة طبية خلفية */}
        <svg className="steth-bg" width="290" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="148" r="32" stroke="#2563eb" strokeWidth="12" />
          <path d="M52 52 Q52 118 100 118" stroke="#2563eb" strokeWidth="12" strokeLinecap="round" />
          <path d="M148 52 Q148 118 100 118" stroke="#2563eb" strokeWidth="12" strokeLinecap="round" />
          <circle cx="52" cy="44" r="12" fill="#2563eb" />
          <circle cx="148" cy="44" r="12" fill="#2563eb" />
        </svg>

        {/* قلب نابض */}
        <div className="heart-bg">
          <svg width="120" viewBox="0 0 200 200" fill="none">
            <path d="M100 175 C100 175 15 112 15 62 C15 36 36 20 62 29 C78 34 90 46 100 60 C110 46 122 34 138 29 C164 20 185 36 185 62 C185 112 100 175 100 175Z" fill="#fca5a5" opacity="0.7" />
            <path d="M100 165 C100 165 25 108 25 65 C25 42 44 28 68 36 C83 41 93 52 100 65 C107 52 117 41 132 36 C156 28 175 42 175 65 C175 108 100 165 100 165Z" fill="#ef4444" opacity="0.85" />
          </svg>
        </div>

        {/* خط ECG خلفي */}
        <svg className="ecg-bg" viewBox="0 0 1440 150" preserveAspectRatio="none">
          <polyline className="ecg-line"
            points="0,75 180,75 210,75 232,20 248,130 262,5 278,130 300,75 420,75 450,75 470,38 490,112 510,75 600,75 640,75 660,20 678,130 694,5 710,130 730,75 850,75 882,75 900,38 920,112 940,75 1040,75 1070,75 1090,20 1108,130 1122,5 1138,130 1160,75 1290,75 1310,75 1330,38 1348,112 1370,75 1440,75"
            fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"
          />
        </svg>

        {/* المحتوى */}
        <div className="d-content">
          <div className="now-label">
            <span className="live-dot" />
            يُرجى الدخول الآن
          </div>

          {/* بطاقة المريض الحالي */}
          <div className="current-card">
            <div className="card-glow" />
            <div className="ripple" />
            <div className="ripple" />
            <div className="ripple" />
            <svg className="card-ecg" height="55" viewBox="0 0 600 55" preserveAspectRatio="none">
              <polyline className="card-ecg-line"
                points="0,27 80,27 100,27 112,7 122,48 132,3 142,48 158,27 240,27 260,27 270,12 282,42 294,27 360,27 380,27 392,7 402,48 412,3 422,48 438,27 520,27 540,27 552,12 564,42 576,27 600,27"
                fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"
              />
            </svg>

            {data.current ? (
              <>
                {data.current.queueNumber !== null && (
                  <div className="num-badge">{data.current.queueNumber}</div>
                )}
                <div className="patient-name">{data.current.name}</div>
              </>
            ) : (
              <div className="empty-text">لا يوجد مريض حالياً</div>
            )}
          </div>

          {/* قائمة الانتظار */}
          {data.waiting.length > 0 && (
            <>
              <div className="queue-title">التالي في الانتظار</div>
              {data.waiting.slice(0, 4).map((p, i) => (
                <div className="queue-item" key={i}>
                  <div className="q-name">{p.name}</div>
                  {p.queueNumber !== null && (
                    <div className="q-num">#{p.queueNumber}</div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="d-footer">كلينيك — نظام إدارة العيادة</div>
      </div>
    </>
  );
}
