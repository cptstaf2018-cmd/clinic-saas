import Link from "next/link";

export const metadata = {
  title: "عيادتي — نظام إدارة العيادات الأذكى في العراق",
  description: "منصة SaaS متكاملة لإدارة العيادات الطبية في العراق. بوت واتساب ذكي، تذكيرات تلقائية، سجلات طبية، وشاشة انتظار. تطوير بغداد المستقبل AI.",
};

export default function AboutPage() {
  return (
    <main dir="rtl" className="min-h-screen overflow-x-hidden" style={{ background: "#06080F", color: "#F8FAFC" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap');

        * { font-family: 'Tajawal', sans-serif; box-sizing: border-box; }

        :root {
          --gold: #C9A84C;
          --gold-light: #E8C97A;
          --gold-dim: rgba(201,168,76,0.15);
          --blue: #0EA5E9;
          --blue-dim: rgba(14,165,233,0.12);
          --bg: #06080F;
          --bg2: #0B0F1A;
          --glass: rgba(255,255,255,0.03);
          --border: rgba(255,255,255,0.07);
          --border-gold: rgba(201,168,76,0.25);
        }

        /* ── Animations ── */
        @keyframes float    { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-14px)} }
        @keyframes glow-pulse { 0%,100%{opacity:.3} 50%{opacity:.7} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes shimmer  { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes fade-up  { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes draw-line { from{width:0} to{width:100%} }

        .float     { animation: float 5s ease-in-out infinite; }
        .glow-pulse{ animation: glow-pulse 3s ease-in-out infinite; }
        .fade-up   { animation: fade-up .8s ease forwards; }
        .fade-up-1 { animation: fade-up .8s .1s ease both; }
        .fade-up-2 { animation: fade-up .8s .2s ease both; }
        .fade-up-3 { animation: fade-up .8s .35s ease both; }

        /* ── Gold gradient text ── */
        .gold-text {
          background: linear-gradient(135deg, #C9A84C 0%, #F5D78E 50%, #C9A84C 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        /* ── Blue gradient text ── */
        .blue-text {
          background: linear-gradient(135deg, #0EA5E9, #38BEF8, #7DD3FC);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Arabic geometric pattern ── */
        .pattern-bg {
          background-image:
            radial-gradient(ellipse at 15% 40%, rgba(201,168,76,0.08) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 15%, rgba(14,165,233,0.07) 0%, transparent 55%),
            radial-gradient(ellipse at 55% 85%, rgba(201,168,76,0.05) 0%, transparent 50%);
        }

        .geo-pattern {
          background-image:
            repeating-linear-gradient(60deg, transparent, transparent 40px, rgba(201,168,76,0.03) 40px, rgba(201,168,76,0.03) 41px),
            repeating-linear-gradient(-60deg, transparent, transparent 40px, rgba(201,168,76,0.03) 40px, rgba(201,168,76,0.03) 41px),
            repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(201,168,76,0.02) 40px, rgba(201,168,76,0.02) 41px);
        }

        /* ── Glass card ── */
        .glass {
          background: var(--glass);
          border: 1px solid var(--border);
          backdrop-filter: blur(16px);
          transition: all .35s ease;
        }
        .glass:hover {
          background: rgba(255,255,255,0.055);
          border-color: var(--border-gold);
          transform: translateY(-4px);
          box-shadow: 0 24px 60px rgba(201,168,76,0.08), 0 0 0 1px rgba(201,168,76,0.1);
        }

        /* ── Gold button ── */
        .btn-gold {
          background: linear-gradient(135deg, #C9A84C, #E8C97A, #C9A84C);
          background-size: 200% auto;
          color: #06080F;
          font-weight: 900;
          transition: all .3s ease;
          box-shadow: 0 0 30px rgba(201,168,76,0.3);
          animation: shimmer 3s linear infinite;
        }
        .btn-gold:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 50px rgba(201,168,76,0.5);
        }

        /* ── Ghost button ── */
        .btn-ghost {
          border: 1px solid var(--border-gold);
          color: var(--gold-light);
          transition: all .3s ease;
        }
        .btn-ghost:hover {
          background: var(--gold-dim);
          border-color: var(--gold);
        }

        /* ── Nav ── */
        .nav-blur {
          background: rgba(6,8,15,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }

        /* ── Gold divider ── */
        .gold-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }

        /* ── Plan card special ── */
        .plan-popular {
          background: linear-gradient(135deg, rgba(201,168,76,0.12), rgba(232,201,122,0.06));
          border: 1px solid rgba(201,168,76,0.4);
          box-shadow: 0 0 60px rgba(201,168,76,0.12), inset 0 1px 0 rgba(201,168,76,0.2);
        }

        /* ── WhatsApp bubbles ── */
        .wa-in  { background: rgba(37,211,102,0.08); border: 1px solid rgba(37,211,102,0.18); border-radius: 20px 20px 4px 20px; }
        .wa-out { background: rgba(14,165,233,0.08); border: 1px solid rgba(14,165,233,0.18); border-radius: 20px 20px 20px 4px; }

        /* ── Feature icon ── */
        .feat-icon {
          background: linear-gradient(135deg, rgba(201,168,76,0.15), rgba(14,165,233,0.1));
          border: 1px solid rgba(201,168,76,0.2);
        }

        /* ── Orb ── */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }

        /* ── Scroll line ── */
        .section-label {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .2em;
          text-transform: uppercase;
          color: var(--gold);
        }
        .section-label::before {
          content: '';
          display: block;
          width: 32px;
          height: 1px;
          background: var(--gold);
        }

        .nav-link { color: rgba(248,250,252,0.55); transition: color .2s; text-decoration: none; }
        .nav-link:hover { color: #F8FAFC; }
        .footer-link { color: inherit; text-decoration: none; }
        .footer-link:hover { color: var(--gold-light); }

        /* Baghdad AI section */
        .bai-card {
          background: linear-gradient(135deg, rgba(201,168,76,0.06), rgba(14,165,233,0.04));
          border: 1px solid rgba(201,168,76,0.2);
          position: relative;
          overflow: hidden;
        }
        .bai-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 30% 50%, rgba(201,168,76,0.08), transparent 70%);
          pointer-events: none;
        }
      `}</style>

      {/* ══════════════════════════════════════════
          NAV
      ══════════════════════════════════════════ */}
      <nav className="nav-blur fixed top-0 left-0 right-0 z-50">
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#C9A84C,#E8C97A)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#06080F", fontSize: 18, boxShadow: "0 0 20px rgba(201,168,76,0.4)" }}>ع</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, color: "#F8FAFC", letterSpacing: ".02em" }}>عيادتي</div>
              <div style={{ fontSize: 9, color: "var(--gold)", fontWeight: 700, letterSpacing: ".1em" }}>AYADTI PLATFORM</div>
            </div>
          </div>

          {/* Links */}
          <div style={{ display: "flex", alignItems: "center", gap: 32, fontSize: 14, fontWeight: 700 }}>
            {[["#features","المميزات"],["#plans","الباقات"],["#bot","البوت"],["#company","الشركة"]].map(([h,l]) => (
              <a key={h} href={h} className="nav-link">{l}</a>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/login" style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "rgba(248,250,252,0.6)" }}>دخول</Link>
            <Link href="/register" className="btn-gold" style={{ padding: "9px 20px", borderRadius: 10, fontSize: 13 }}>ابدأ مجاناً</Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="pattern-bg geo-pattern" style={{ minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: 88, position: "relative", overflow: "hidden" }}>

        {/* Orbs */}
        <div className="orb glow-pulse" style={{ width: 500, height: 500, background: "rgba(201,168,76,0.08)", top: "10%", right: "-10%" }} />
        <div className="orb glow-pulse" style={{ width: 400, height: 400, background: "rgba(14,165,233,0.07)", bottom: "5%", left: "-8%", animationDelay: "1.5s" }} />
        <div className="orb" style={{ width: 200, height: 200, background: "rgba(201,168,76,0.05)", top: "40%", left: "40%", animation: "glow-pulse 4s ease-in-out infinite 3s" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px", width: "100%", textAlign: "center" }}>

          {/* Badge */}
          <div className="fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 50, padding: "7px 18px", marginBottom: 36 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)" }} className="glow-pulse" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gold-light)", letterSpacing: ".08em" }}>منصة SaaS — العراق ٢٠٢٦</span>
          </div>

          {/* Headline */}
          <h1 className="fade-up-1" style={{ fontSize: "clamp(42px,7vw,90px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: "-.02em" }}>
            <span className="gold-text">عيادتك</span>
            <br />
            <span style={{ color: "#F8FAFC" }}>تستحق الأفضل</span>
          </h1>

          {/* Sub */}
          <p className="fade-up-2" style={{ fontSize: "clamp(16px,2.2vw,22px)", color: "rgba(248,250,252,0.5)", maxWidth: 620, margin: "0 auto 48px", lineHeight: 1.8, fontWeight: 500 }}>
            نظام إدارة عيادات متكامل — بوت واتساب ذكي، تذكيرات تلقائية، سجلات طبية، وشاشة انتظار حية. كل ما تحتاجه في مكان واحد.
          </p>

          {/* Buttons */}
          <div className="fade-up-3" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 72 }}>
            <Link href="/register" className="btn-gold" style={{ padding: "15px 36px", borderRadius: 14, fontSize: 16 }}>
              ابدأ تجربتك المجانية ←
            </Link>
            <a href="#plans" className="btn-ghost" style={{ padding: "14px 32px", borderRadius: 14, fontSize: 15, display: "inline-block" }}>
              عرض الباقات
            </a>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, maxWidth: 700, margin: "0 auto", background: "var(--border)", borderRadius: 20, overflow: "hidden" }}>
            {[
              { v: "14", l: "يوم تجريبي مجاناً" },
              { v: "8",  l: "تخصص طبي" },
              { v: "24/7", l: "بوت واتساب نشط" },
              { v: "4", l: "باقات مرنة" },
            ].map((s,i) => (
              <div key={i} style={{ background: "var(--bg2)", padding: "22px 12px", textAlign: "center" }}>
                <div className="gold-text" style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 12, color: "rgba(248,250,252,0.4)", fontWeight: 600, marginTop: 6 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gold-line" />

      {/* ══════════════════════════════════════════
          BOT DEMO
      ══════════════════════════════════════════ */}
      <section id="bot" style={{ padding: "120px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

          {/* Left text */}
          <div>
            <p className="section-label">بوت واتساب ذكي</p>
            <h2 style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 900, lineHeight: 1.15, margin: "18px 0 22px" }}>
              المريض يحجز<br />
              <span className="gold-text">بدون مكالمة</span>
            </h2>
            <p style={{ color: "rgba(248,250,252,0.5)", lineHeight: 1.9, marginBottom: 36, fontSize: 17 }}>
              البوت يستقبل رسائل المرضى، يتعرف عليهم تلقائياً بالرقم، ويحجز لهم موعداً في ثوانٍ — أنت لا تتدخل.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                "يعمل 24 ساعة / 7 أيام — لا انقطاع",
                "يتعرف على المريض العائد فوراً",
                "تذكيرات تلقائية قبل الموعد بـ 24 ساعة و ساعة",
                "يمنع الحجز المزدوج بنفس الوقت بالكامل",
              ].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg viewBox="0 0 12 12" fill="none" style={{ width: 10, height: 10 }}><path d="M2 6l2.5 2.5L10 3" stroke="#C9A84C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ color: "rgba(248,250,252,0.7)", fontSize: 15, fontWeight: 600 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Chat */}
          <div className="glass float" style={{ borderRadius: 28, padding: 28, border: "1px solid rgba(201,168,76,0.15)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 18, borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" fill="#25D366" style={{ width: 22, height: 22 }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a8.7 8.7 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.529 5.843L.057 23.571l5.9-1.548A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.374l-.359-.214-3.502.919.935-3.416-.234-.371A9.818 9.818 0 1 1 12 21.818z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 14, color: "#F8FAFC" }}>عيادة د. أحمد</div>
                <div style={{ fontSize: 11, color: "#25D366", fontWeight: 700 }}>● متصل الآن</div>
              </div>
            </div>
            {/* Messages */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
              <div className="wa-in" style={{ padding: "10px 16px", maxWidth: "78%", marginRight: "auto" }}>
                <p style={{ color: "rgba(248,250,252,0.85)", fontWeight: 500 }}>اريد احجز موعد</p>
                <p style={{ fontSize: 10, color: "rgba(248,250,252,0.3)", marginTop: 4 }}>4:12 م ✓✓</p>
              </div>
              <div className="wa-out" style={{ padding: "12px 16px", maxWidth: "88%", marginLeft: "auto" }}>
                <p style={{ color: "rgba(248,250,252,0.9)", fontWeight: 500, lineHeight: 1.7 }}>مرحباً أحمد 👋<br/>المواعيد المتاحة اليوم:<br/><span className="gold-text">1️⃣ 04:20 مساءً</span><br/>2️⃣ 05:00 مساءً<br/>3️⃣ 05:40 مساءً</p>
              </div>
              <div className="wa-in" style={{ padding: "10px 16px", maxWidth: "30%", marginRight: "auto" }}>
                <p style={{ color: "rgba(248,250,252,0.85)", fontWeight: 700 }}>1</p>
              </div>
              <div className="wa-out" style={{ padding: "12px 16px", maxWidth: "88%", marginLeft: "auto" }}>
                <p style={{ color: "rgba(248,250,252,0.9)", fontWeight: 500, lineHeight: 1.7 }}>✅ تم تأكيد موعدك!<br/><b>4:20 مساءً</b> — عيادة د. أحمد<br/><span style={{ color: "var(--gold)", fontSize: 12 }}>ستصلك تذكيرات تلقائية 🔔</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="gold-line" />

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section id="features" style={{ padding: "120px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <p className="section-label" style={{ justifyContent: "center" }}>قدرات المنصة</p>
            <h2 style={{ fontSize: "clamp(30px,4vw,52px)", fontWeight: 900, marginTop: 18, letterSpacing: "-.02em" }}>
              كل شيء تحتاجه<br /><span className="gold-text">في مكان واحد</span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
            {[
              { icon: "📅", title: "إدارة المواعيد",    desc: "تقويم ذكي يعرض اليوم والأسبوع. تأكيد، إلغاء، وإدارة كاملة بضغطة واحدة.", accent: "gold" },
              { icon: "📺", title: "شاشة الانتظار",    desc: "شاشة TV عامة تُحدَّث لحظياً — تعرض المريض الحالي والقادمين تلقائياً.", accent: "blue" },
              { icon: "🦷", title: "خريطة الأسنان",    desc: "تأشير علاجات كل سن بالألوان. مصممة خصيصاً لعيادات الأسنان.", accent: "gold" },
              { icon: "📋", title: "السجل الطبي",      desc: "شكاوى، تشخيص، وصفات، وملاحظات — كل تاريخ المريض محفوظ وآمن.", accent: "blue" },
              { icon: "🖨️", title: "وصفة طبية رسمية", desc: "وصفة احترافية بشعار العيادة وبيانات الطبيب. طباعة مباشرة على A4.", accent: "gold" },
              { icon: "🤖", title: "بوت واتساب ذكي",   desc: "يحجز المواعيد، يرسل التذكيرات، ويجيب المرضى — 24/7 بدون توقف.", accent: "blue" },
            ].map((f, i) => (
              <div key={i} className="glass" style={{ borderRadius: 22, padding: "28px 24px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, borderRadius: "0 22px 0 100%", background: f.accent === "gold" ? "var(--gold-dim)" : "var(--blue-dim)", opacity: 0.6 }} />
                <div className="feat-icon" style={{ width: 52, height: 52, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 18, position: "relative" }}>{f.icon}</div>
                <h3 style={{ fontWeight: 900, fontSize: 18, marginBottom: 10, color: "#F8FAFC" }}>{f.title}</h3>
                <p style={{ color: "rgba(248,250,252,0.45)", fontSize: 14, lineHeight: 1.75, fontWeight: 500 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gold-line" />

      {/* ══════════════════════════════════════════
          PLANS — 4 + FREE TRIAL
      ══════════════════════════════════════════ */}
      <section id="plans" style={{ padding: "120px 24px", background: "var(--bg2)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <p className="section-label" style={{ justifyContent: "center" }}>أسعار شفافة</p>
            <h2 style={{ fontSize: "clamp(30px,4vw,52px)", fontWeight: 900, marginTop: 18 }}>
              <span className="gold-text">اختر باقتك</span>
            </h2>
            <p style={{ color: "rgba(248,250,252,0.4)", marginTop: 14, fontSize: 16 }}>كل الباقات المدفوعة تبدأ بـ <span className="gold-text" style={{ fontWeight: 900 }}>14 يوم تجريبي مجاني</span></p>
          </div>

          {/* Free trial banner */}
          <div style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.1),rgba(14,165,233,0.08))", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 20, padding: "24px 36px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ fontSize: 36 }}>🎁</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 20, color: "#F8FAFC" }}>فترة تجريبية مجانية — 14 يوم</div>
                <div style={{ color: "rgba(248,250,252,0.5)", fontSize: 14, marginTop: 4 }}>وصول كامل لجميع الميزات. لا بطاقة ائتمان. لا التزام.</div>
              </div>
            </div>
            <Link href="/register" className="btn-gold" style={{ padding: "12px 28px", borderRadius: 12, fontSize: 15, whiteSpace: "nowrap" }}>
              ابدأ مجاناً
            </Link>
          </div>

          {/* 4 plans */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {[
              {
                name: "أساسية",
                nameEn: "BASIC",
                price: "35,000",
                color: "#64748B",
                features: ["حجوزات ومرضى","بوت واتساب","شاشة الانتظار","السجل الطبي","تقرير يومي"],
                highlight: false,
              },
              {
                name: "متوسطة",
                nameEn: "STANDARD",
                price: "45,000",
                color: "#0EA5E9",
                features: ["كل الأساسية","تذكيرات تلقائية","متابعة المراجعات","تقارير PDF","دعم متقدم"],
                highlight: false,
              },
              {
                name: "مميزة",
                nameEn: "PREMIUM",
                price: "55,000",
                color: "#C9A84C",
                features: ["كل المتوسطة","خريطة الأسنان","مساعد ذكي","نسخ احتياطي","دعم أولوية"],
                highlight: true,
              },
              {
                name: "مميزة VIP",
                nameEn: "VIP",
                price: "65,000",
                color: "#A855F7",
                features: ["كل المميزة","تحاليل وأشعة","رفع ملفات","رسائل اطمئنان","ملف طبي كامل"],
                highlight: false,
              },
            ].map((p, i) => (
              <div key={i} style={{ borderRadius: 22, padding: "28px 20px", position: "relative", ...(p.highlight ? {} : { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }) }}
                className={p.highlight ? "plan-popular" : ""}>
                {p.highlight && (
                  <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#C9A84C,#E8C97A)", color: "#06080F", fontSize: 11, fontWeight: 900, padding: "4px 16px", borderRadius: 20, whiteSpace: "nowrap" }}>
                    ★ الأكثر طلباً
                  </div>
                )}
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".15em", color: p.color, marginBottom: 8 }}>{p.nameEn}</div>
                <div style={{ fontWeight: 900, fontSize: 20, color: "#F8FAFC", marginBottom: 6 }}>{p.name}</div>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, background: `linear-gradient(135deg,${p.color},#F8FAFC)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{p.price}</span>
                  <span style={{ color: "rgba(248,250,252,0.35)", fontSize: 12, fontWeight: 600 }}> د.ع / شهر</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: `${p.color}20`, border: `1px solid ${p.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg viewBox="0 0 10 10" fill="none" style={{ width: 8, height: 8 }}><path d="M1.5 5l2 2L8.5 3" stroke={p.color} strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </div>
                      <span style={{ fontSize: 12.5, color: "rgba(248,250,252,0.6)", fontWeight: 600 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register" style={{ display: "block", textAlign: "center", padding: "11px 16px", borderRadius: 12, fontSize: 13, fontWeight: 900, background: p.highlight ? "linear-gradient(135deg,#C9A84C,#E8C97A)" : "transparent", color: p.highlight ? "#06080F" : "rgba(248,250,252,0.6)", border: p.highlight ? "none" : `1px solid ${p.color}30`, transition: "all .25s" }}>
                  ابدأ مجاناً
                </Link>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", color: "rgba(248,250,252,0.25)", fontSize: 13, marginTop: 28, fontWeight: 600 }}>
            جميع الباقات تشمل: بوت واتساب + شاشة الانتظار + دعم فني أساسي
          </p>
        </div>
      </section>

      <div className="gold-line" />

      {/* ══════════════════════════════════════════
          BAGHDAD FUTURE AI
      ══════════════════════════════════════════ */}
      <section id="company" style={{ padding: "120px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="bai-card" style={{ borderRadius: 28, padding: "60px 48px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 36 }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <p className="section-label" style={{ marginBottom: 18 }}>الشركة المطوِّرة</p>
                <h2 style={{ fontSize: "clamp(26px,3.5vw,44px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 20 }}>
                  <span className="gold-text">بغداد المستقبل</span>
                  <br />
                  <span style={{ color: "#F8FAFC" }}>للذكاء الاصطناعي</span>
                </h2>
                <p style={{ color: "rgba(248,250,252,0.5)", lineHeight: 1.9, fontSize: 16, marginBottom: 32, fontWeight: 500 }}>
                  شركة تقنية عراقية متخصصة في حلول الذكاء الاصطناعي والأنظمة المؤسسية. نطوّر منصة <strong style={{ color: "var(--gold-light)" }}>عيادتي</strong> لرفع مستوى الرعاية الصحية في العراق من خلال التقنيات الحديثة.
                </p>
                <a href="https://baghdad-future-ai.my/" target="_blank" rel="noopener noreferrer" className="btn-gold" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "13px 28px", borderRadius: 12, fontSize: 15, textDecoration: "none" }}>
                  زيارة موقع الشركة
                  <svg viewBox="0 0 16 16" fill="none" style={{ width: 16, height: 16 }}><path d="M3 8h10M8 3l5 5-5 5" stroke="#06080F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              </div>

              {/* Company card */}
              <div style={{ flexShrink: 0 }}>
                <div className="glass" style={{ borderRadius: 24, padding: "32px 36px", textAlign: "center", minWidth: 220, border: "1px solid rgba(201,168,76,0.2)" }}>
                  <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg,#C9A84C20,#0EA5E920)", border: "1px solid rgba(201,168,76,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 32 }}>🏙️</div>
                  <div style={{ fontWeight: 900, fontSize: 16, color: "#F8FAFC", marginBottom: 6 }}>Baghdad Future AI</div>
                  <div style={{ fontSize: 12, color: "rgba(248,250,252,0.4)", fontWeight: 600, marginBottom: 16 }}>بغداد — العراق</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {["ذكاء اصطناعي","حلول مؤسسية","تطوير SaaS"].map(t => (
                      <span key={t} style={{ background: "var(--gold-dim)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "var(--gold-light)", fontWeight: 700 }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="gold-line" />

      {/* ══════════════════════════════════════════
          CTA
      ══════════════════════════════════════════ */}
      <section className="pattern-bg" style={{ padding: "120px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div className="orb glow-pulse" style={{ width: 600, height: 600, background: "rgba(201,168,76,0.06)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
        <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(36px,5vw,68px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 24 }}>
            جاهز تبدأ<br />
            <span className="gold-text">مع عيادتك؟</span>
          </h2>
          <p style={{ color: "rgba(248,250,252,0.45)", fontSize: 18, marginBottom: 44, fontWeight: 500 }}>
            14 يوم تجريبي مجاناً — بدون بطاقة ائتمان — إلغاء في أي وقت
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" className="btn-gold" style={{ padding: "17px 44px", borderRadius: 16, fontSize: 18 }}>
              سجّل عيادتك الآن ←
            </Link>
            <Link href="/login" className="btn-ghost" style={{ padding: "16px 36px", borderRadius: 16, fontSize: 17, display: "inline-block" }}>
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "40px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#C9A84C,#E8C97A)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#06080F", fontSize: 15 }}>ع</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, color: "#F8FAFC" }}>عيادتي</div>
              <div style={{ fontSize: 10, color: "rgba(248,250,252,0.3)", fontWeight: 600 }}>تطوير بغداد المستقبل AI</div>
            </div>
          </div>

          <p style={{ color: "rgba(248,250,252,0.2)", fontSize: 13, fontWeight: 600 }}>© ٢٠٢٦ عيادتي — جميع الحقوق محفوظة</p>

          <div style={{ display: "flex", gap: 24, fontSize: 13, fontWeight: 700, color: "rgba(248,250,252,0.35)" }}>
            <Link href="/login" style={{ color: "inherit", textDecoration: "none" }}>دخول</Link>
            <Link href="/register" style={{ color: "var(--gold-light)", textDecoration: "none" }}>تسجيل مجاني</Link>
            <a href="https://baghdad-future-ai.my/" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>Baghdad Future AI</a>
          </div>
        </div>
      </footer>

    </main>
  );
}
