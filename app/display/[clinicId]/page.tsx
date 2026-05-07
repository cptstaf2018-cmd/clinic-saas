"use client";

import { useEffect, useRef, useState } from "react";

interface DisplayData {
  clinicName: string;
  logoUrl: string | null;
  current: { name: string; queueNumber: number | null } | null;
  waiting: { name: string; queueNumber: number | null }[];
}

const ARABIC_DAYS = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const ARABIC_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const toArabic = (n: number) => String(n).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);

function AnalogClock() {
  const svgRef = useRef<SVGSVGElement>(null);
  const ticksRef = useRef<SVGGElement>(null);
  const numsRef = useRef<SVGGElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const svg = svgRef.current;
    const tg = ticksRef.current;
    const ng = numsRef.current;
    if (!svg || !tg || !ng) return;

    // Draw tick marks
    for (let i = 0; i < 60; i++) {
      const a = (i * 6 * Math.PI) / 180;
      const isH = i % 5 === 0;
      const r1 = isH ? 34 : 38, r2 = 42;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(50 + r1 * Math.sin(a)));
      line.setAttribute("y1", String(50 - r1 * Math.cos(a)));
      line.setAttribute("x2", String(50 + r2 * Math.sin(a)));
      line.setAttribute("y2", String(50 - r2 * Math.cos(a)));
      line.setAttribute("stroke", isH ? "#2563eb" : "#dbeafe");
      line.setAttribute("stroke-width", isH ? "2.5" : "1");
      line.setAttribute("stroke-linecap", "round");
      tg.appendChild(line);
    }

    // Draw Arabic hour numbers
    const nums = ["١٢","١","٢","٣","٤","٥","٦","٧","٨","٩","١٠","١١"];
    for (let i = 0; i < 12; i++) {
      const a = ((i * 30 - 90) * Math.PI) / 180;
      const r = 27;
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", String(50 + r * Math.cos(a)));
      t.setAttribute("y", String(50 + r * Math.sin(a)));
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("dominant-baseline", "central");
      t.setAttribute("font-size", "7");
      t.setAttribute("font-weight", "900");
      t.setAttribute("fill", "#1e40af");
      t.textContent = nums[i];
      ng.appendChild(t);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const update = () => {
      const now = new Date();
      const h = now.getHours() % 12;
      const m = now.getMinutes();
      const s = now.getSeconds();
      const hDeg = h * 30 + m * 0.5 + s * 0.00833;
      const mDeg = m * 6 + s * 0.1;
      const sDeg = s * 6;

      const setHand = (id: string, deg: number, tip: number, tail = 0) => {
        const r = (deg * Math.PI) / 180;
        const el = document.getElementById(id);
        if (!el) return;
        el.setAttribute("x2", String(50 + tip * Math.sin(r)));
        el.setAttribute("y2", String(50 - tip * Math.cos(r)));
        if (tail) {
          const tl = document.getElementById(id + "-t");
          if (tl) {
            tl.setAttribute("x2", String(50 - tail * Math.sin(r)));
            tl.setAttribute("y2", String(50 + tail * Math.cos(r)));
          }
        }
      };
      setHand("hh", hDeg, 21);
      setHand("hm", mDeg, 33);
      setHand("hs", sDeg, 37, 8);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [ready]);

  return (
    <svg ref={svgRef} width="90" height="90" viewBox="0 0 100 100"
      style={{ filter: "drop-shadow(0 4px 14px rgba(37,99,235,0.25))" }}>
      <circle cx="50" cy="50" r="47" fill="rgba(37,99,235,0.05)" />
      <circle cx="50" cy="50" r="45" fill="white" stroke="#dbeafe" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="45" fill="none" stroke="#2563eb" strokeWidth="3" />
      <circle cx="50" cy="50" r="39" fill="none" stroke="#eff6ff" strokeWidth="1" />
      <g ref={ticksRef} />
      <g ref={numsRef} />
      <line id="hh" x1="50" y1="50" x2="50" y2="29" stroke="#1e3a8a" strokeWidth="6"   strokeLinecap="round" />
      <line id="hm" x1="50" y1="50" x2="50" y2="17" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" />
      <line id="hs"   x1="50" y1="57" x2="50" y2="13" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
      <line id="hs-t" x1="50" y1="50" x2="50" y2="61" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="50" cy="50" r="5.5" fill="#1e3a8a" />
      <circle cx="50" cy="50" r="3"   fill="#ef4444" />
      <circle cx="50" cy="50" r="1.2" fill="white" />
    </svg>
  );
}

export default function DisplayPage({ params }: { params: Promise<{ clinicId: string }> }) {
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [data, setData] = useState<DisplayData>({ clinicName: "نظام الانتظار", logoUrl: null, current: null, waiting: [] });
  const [dateDay, setDateDay] = useState("");
  const [dateFull, setDateFull] = useState("");
  const prevPatientRef = useRef<string | null | undefined>(undefined);
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => { params.then((p) => setClinicId(p.clinicId)); }, [params]);

  useEffect(() => {
    if (!clinicId) return;
    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/display/${clinicId}`);
        if (res.ok) setData(await res.json());
      } catch {}
    };
    fetch_();
    const t = setInterval(fetch_, 5000);
    return () => clearInterval(t);
  }, [clinicId]);

  function unlockAndSpeak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const speak = () => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ar-SA";
      u.rate = 0.82;
      u.pitch = 1;
      u.volume = 1;
      window.speechSynthesis.speak(u);
    };
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { speak(); }
    else { window.speechSynthesis.addEventListener("voiceschanged", speak, { once: true }); setTimeout(speak, 300); }
  }

  function enableSound() {
    if (!("speechSynthesis" in window)) return;
    // تشغيل نطق صامت لفتح الصوت على iOS/Android
    const u = new SpeechSynthesisUtterance(" ");
    u.lang = "ar-SA";
    u.volume = 0;
    window.speechSynthesis.speak(u);
    setSoundEnabled(true);
  }

  // نداء صوتي عند تغيّر المريض الحالي
  useEffect(() => {
    const name = data.current?.name ?? null;
    if (prevPatientRef.current === undefined) {
      prevPatientRef.current = name;
      return;
    }
    if (name && name !== prevPatientRef.current && soundEnabled) {
      unlockAndSpeak(`المريض ${name} ... تفضل من فضلك`);
    }
    prevPatientRef.current = name;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.current, soundEnabled]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setDateDay(ARABIC_DAYS[now.getDay()]);
      setDateFull(
        toArabic(now.getDate()) + " " + ARABIC_MONTHS[now.getMonth()] + " " + toArabic(now.getFullYear())
      );
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, []);

  const waiting = data.waiting.slice(0, 4);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;700;900&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#f0f7ff; }

        .dp-root {
          min-height:100vh; background:#f0f7ff;
          font-family:'Cairo',sans-serif;
          display:flex; flex-direction:column;
          overflow:hidden; position:relative;
        }
        .dp-root::before {
          content:''; position:fixed; inset:0;
          background-image:url("data:image/svg+xml,%3Csvg width='70' height='70' viewBox='0 0 70 70' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%232563eb' stroke-width='0.4' opacity='0.09'%3E%3Cpolygon points='35,3 46,12 56,9 60,20 70,24 66,35 70,45 59,50 59,61 48,63 43,70 35,65 27,70 22,63 11,61 11,50 0,45 4,35 0,24 10,20 14,9 24,12'/%3E%3Ccircle cx='35' cy='35' r='16'/%3E%3C/g%3E%3C/svg%3E");
          background-size:70px 70px; pointer-events:none; z-index:0;
        }

        /* شريط علوي */
        .dp-topbar {
          height:5px; flex-shrink:0;
          background:linear-gradient(90deg,#1e40af,#3b82f6,#60a5fa,#3b82f6,#1e40af);
          background-size:300% 100%;
          animation:dp-sh 4s linear infinite;
        }
        @keyframes dp-sh { 0%{background-position:0%} 100%{background-position:300%} }

        /* هيدر ثلاثة أعمدة */
        .dp-header {
          position:relative; z-index:2;
          display:grid; grid-template-columns:1fr auto 1fr;
          align-items:center;
          padding:10px 26px;
          background:white;
          border-bottom:2px solid #dbeafe;
          box-shadow:0 2px 12px rgba(37,99,235,0.07);
          gap:10px;
        }
        /* يمين — ساعة عقارب */
        .dp-clock {
          display:flex; align-items:center; gap:9px;
        }
        .dp-live { font-size:12px; font-weight:700; color:#3b82f6; }
        .dp-dot {
          width:10px; height:10px; border-radius:50%;
          background:#3b82f6;
          animation:dp-lp 1.4s infinite;
        }
        @keyframes dp-lp {
          0%{box-shadow:0 0 0 0 rgba(59,130,246,0.6);}
          70%{box-shadow:0 0 0 12px rgba(59,130,246,0);}
          100%{box-shadow:0 0 0 0 rgba(59,130,246,0);}
        }
        /* وسط — اسم العيادة */
        .dp-clinic {
          display:flex; align-items:center; gap:10px;
          white-space:nowrap;
        }
        .dp-logo {
          width:44px; height:44px; border-radius:13px;
          background:linear-gradient(135deg,#1e40af,#3b82f6);
          display:flex; align-items:center; justify-content:center;
          font-size:22px;
          box-shadow:0 4px 14px rgba(37,99,235,0.3);
        }
        .dp-cname { font-size:21px; font-weight:900; color:#1e3a8a; }
        /* يسار — التاريخ */
        .dp-date {
          display:flex; flex-direction:column;
          align-items:flex-end;
          text-align:left;
        }
        .dp-date-day  { font-size:26px; font-weight:900; color:#1e3a8a; line-height:1; }
        .dp-date-full { font-size:14px; font-weight:700; color:#3b82f6; margin-top:2px; }

        /* آية قرآنية */
        .dp-quran {
          position:relative; z-index:2;
          margin:12px 22px 0;
          background:linear-gradient(135deg,#1e3a8a,#1e40af,#2563eb);
          border-radius:18px; padding:14px 50px 12px;
          text-align:center; overflow:hidden;
          box-shadow:0 8px 28px rgba(37,99,235,0.28);
        }
        .dp-quran::before,.dp-quran::after {
          content:'✦'; position:absolute;
          top:50%; transform:translateY(-50%);
          font-size:20px; color:rgba(255,255,255,0.14);
        }
        .dp-quran::before { right:14px; }
        .dp-quran::after  { left:14px; }
        .dp-bsm { font-family:'Amiri',serif; font-size:12px; color:rgba(255,255,255,0.5); margin-bottom:3px; }
        .dp-aya {
          font-family:'Amiri',serif; font-size:26px;
          color:white; line-height:1.7;
          animation:dp-ab 5s ease-in-out infinite;
        }
        @keyframes dp-ab { 0%,100%{opacity:0.88;} 50%{opacity:1;} }
        .dp-aya-ref { font-size:11px; color:rgba(255,255,255,0.4); margin-top:3px; }

        /* المنطقة الرئيسية */
        .dp-main {
          position:relative; z-index:1;
          flex:1; display:grid;
          grid-template-columns:1.2fr 1fr;
          gap:12px; margin:12px 22px;
        }
        .dp-cur-wrap, .dp-q-wrap { display:flex; flex-direction:column; }
        .dp-sec-lbl {
          font-size:10px; font-weight:700; letter-spacing:3px;
          color:#93c5fd; text-align:center; margin-bottom:7px;
        }

        /* بطاقة المريض الحالي */
        .dp-cur-card {
          flex:1;
          background:linear-gradient(150deg,#1e3a8a,#1d4ed8,#2563eb);
          border-radius:22px;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          padding:26px 20px; text-align:center;
          position:relative; overflow:hidden;
          box-shadow:0 16px 48px rgba(37,99,235,0.38);
          animation:dp-cp 3s ease-in-out infinite;
        }
        @keyframes dp-cp {
          0%,100%{box-shadow:0 16px 48px rgba(37,99,235,0.38),0 0 0 0 rgba(37,99,235,0.2);}
          50%{box-shadow:0 16px 48px rgba(37,99,235,0.45),0 0 0 20px rgba(37,99,235,0);}
        }
        .dp-cur-card::before {
          content:''; position:absolute;
          width:200px; height:200px; border-radius:50%;
          background:rgba(255,255,255,0.04);
          top:-50px; right:-50px;
        }
        .dp-ecg { position:absolute; bottom:0; left:0; right:0; opacity:0.14; }
        .dp-ecg-p {
          stroke-dasharray:800; stroke-dashoffset:800;
          animation:dp-de 2.5s ease-in-out infinite;
        }
        @keyframes dp-de {
          0%{stroke-dashoffset:800;opacity:0.08;}
          50%{opacity:0.28;}
          100%{stroke-dashoffset:0;opacity:0.08;}
        }
        .dp-now-tag {
          display:inline-flex; align-items:center; gap:6px;
          background:rgba(255,255,255,0.14);
          border:1.5px solid rgba(255,255,255,0.28);
          border-radius:999px; padding:5px 14px;
          font-size:12px; font-weight:700; color:white;
          margin-bottom:14px; position:relative; z-index:1;
        }
        .dp-num-ring {
          width:78px; height:78px; border-radius:50%;
          background:rgba(255,255,255,0.14);
          border:3px solid rgba(255,255,255,0.35);
          display:flex; align-items:center; justify-content:center;
          font-size:34px; font-weight:900; color:white;
          margin-bottom:12px; position:relative; z-index:1;
          animation:dp-nr 2s ease-out infinite;
        }
        @keyframes dp-nr {
          0%{box-shadow:0 0 0 0 rgba(255,255,255,0.3);}
          70%{box-shadow:0 0 0 18px rgba(255,255,255,0);}
          100%{box-shadow:0 0 0 0 rgba(255,255,255,0);}
        }
        .dp-patient-name {
          font-size:50px; font-weight:900; color:white;
          line-height:1.1; position:relative; z-index:1;
          text-shadow:0 3px 14px rgba(0,0,0,0.2);
        }
        .dp-patient-sub {
          font-size:12px; color:rgba(255,255,255,0.55);
          margin-top:8px; position:relative; z-index:1; font-weight:600;
        }
        .dp-empty {
          font-size:24px; font-weight:600;
          color:rgba(255,255,255,0.45);
          position:relative; z-index:1;
        }

        /* قائمة الانتظار */
        .dp-q-list { display:flex; flex-direction:column; gap:8px; flex:1; }
        .dp-qi {
          background:white; border-radius:15px;
          display:flex; align-items:stretch; overflow:hidden;
          box-shadow:0 2px 8px rgba(37,99,235,0.07);
          border:1.5px solid #e0eaff;
        }
        .dp-qi.next { border-color:#93c5fd; background:#eff6ff; }
        .dp-qi-num {
          width:50px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          background:#f0f7ff;
          font-size:21px; font-weight:900; color:#3b82f6;
          border-left:1.5px solid #dbeafe;
        }
        .dp-qi.next .dp-qi-num { background:#dbeafe; color:#1d4ed8; border-color:#93c5fd; }
        .dp-qi-body { flex:1; padding:11px 13px; display:flex; flex-direction:column; justify-content:center; }
        .dp-qi-name { font-size:18px; font-weight:800; color:#1e293b; }
        .dp-qi-st   { font-size:10px; font-weight:700; margin-top:2px; color:#94a3b8; }
        .dp-qi.next .dp-qi-st { color:#1d4ed8; }
        .dp-qi-tag  { display:flex; align-items:center; padding:0 12px; flex-shrink:0; }
        .dp-pill {
          font-size:11px; font-weight:800;
          padding:4px 11px; border-radius:18px;
          background:#eff6ff; color:#3b82f6; border:1px solid #bfdbfe;
        }
        .dp-qi.next .dp-pill { background:#dbeafe; color:#1d4ed8; border-color:#93c5fd; }

        .dp-footer {
          position:relative; z-index:2;
          text-align:center; font-size:11px; color:#cbd5e1;
          padding:6px; border-top:1px solid #f1f5f9; background:white;
        }
      `}</style>

      <div className="dp-root" dir="rtl">
        <div className="dp-topbar" />

        {/* هيدر */}
        <div className="dp-header">
          {/* يمين — ساعة + زر الصوت */}
          <div className="dp-clock">
            <AnalogClock />
            <span className="dp-dot" />
            <span className="dp-live">مباشر</span>
            <button
              onClick={enableSound}
              title={soundEnabled ? "الصوت مفعّل" : "اضغط لتفعيل الصوت"}
              style={{
                marginRight: 6,
                background: soundEnabled ? "#dcfce7" : "#fef9c3",
                border: `1.5px solid ${soundEnabled ? "#86efac" : "#fde047"}`,
                borderRadius: 10,
                padding: "4px 10px",
                fontSize: 13,
                fontWeight: 700,
                color: soundEnabled ? "#15803d" : "#a16207",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                whiteSpace: "nowrap",
              }}
            >
              {soundEnabled ? "🔊 صوت مفعّل" : "🔇 فعّل الصوت"}
            </button>
          </div>

          {/* وسط — اسم العيادة */}
          <div className="dp-clinic">
            {data.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.logoUrl}
                alt={data.clinicName}
                style={{ width: 44, height: 44, borderRadius: 13, objectFit: "contain", background: "white", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}
              />
            ) : (
              <div className="dp-logo">🏥</div>
            )}
            <div className="dp-cname">{data.clinicName || "نظام الانتظار"}</div>
          </div>

          {/* يسار — التاريخ */}
          <div className="dp-date">
            <div className="dp-date-day">{dateDay}</div>
            <div className="dp-date-full">{dateFull}</div>
          </div>
        </div>

        {/* آية قرآنية */}
        <div className="dp-quran">
          <div className="dp-bsm">﷽</div>
          <div className="dp-aya">وَإِذَا مَرِضْتُ فَهُوَ يَشْفِينِ</div>
          <div className="dp-aya-ref">سورة الشعراء — الآية ٨٠</div>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="dp-main">
          {/* المريض الحالي */}
          <div className="dp-cur-wrap">
            <div className="dp-sec-lbl">المريض الحالي</div>
            <div className="dp-cur-card">
              <svg className="dp-ecg" height="48" viewBox="0 0 600 48" preserveAspectRatio="none">
                <polyline className="dp-ecg-p"
                  points="0,24 80,24 100,24 112,5 122,43 132,2 142,43 158,24 240,24 260,24 270,10 282,38 294,24 360,24 380,24 392,5 402,43 412,2 422,43 438,24 540,24 552,10 564,38 576,24 600,24"
                  fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"
                />
              </svg>

              {data.current ? (
                <>
                  <div className="dp-now-tag">
                    <span className="dp-dot" style={{ background: "white" }} />
                    يُرجى الدخول الآن
                  </div>
                  {data.current.queueNumber !== null && (
                    <div className="dp-num-ring">{data.current.queueNumber}</div>
                  )}
                  <div className="dp-patient-name">{data.current.name}</div>
                  <div className="dp-patient-sub">تفضل/ي بالدخول للعيادة</div>
                </>
              ) : (
                <div className="dp-empty">لا يوجد مريض حالياً</div>
              )}
            </div>
          </div>

          {/* قائمة الانتظار */}
          <div className="dp-q-wrap">
            <div className="dp-sec-lbl">قائمة الانتظار</div>
            <div className="dp-q-list">
              {waiting.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", marginTop: "40px", fontSize: "14px" }}>
                  لا يوجد مرضى في الانتظار
                </div>
              ) : waiting.map((p, i) => (
                <div key={i} className={`dp-qi${i === 0 ? " next" : ""}`}>
                  <div className="dp-qi-num">{p.queueNumber ?? i + 1}</div>
                  <div className="dp-qi-body">
                    <div className="dp-qi-name">{p.name}</div>
                    <div className="dp-qi-st">{i === 0 ? "▶ التالي" : "في الانتظار"}</div>
                  </div>
                  <div className="dp-qi-tag">
                    <span className="dp-pill">{i === 0 ? "التالي" : "انتظار"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dp-footer">كلينيك — نظام إدارة العيادة</div>
      </div>
    </>
  );
}
