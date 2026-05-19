import Link from "next/link";

export const metadata = {
  title: "عيادتي — نظام إدارة العيادات الأذكى في العراق",
  description: "منصة SaaS متكاملة لإدارة العيادات الطبية في العراق. بوت واتساب ذكي، تذكيرات تلقائية، سجلات طبية، وشاشة انتظار. تطوير بغداد المستقبل AI.",
};

// Unsplash 4K images
const IMGS = {
  // Hero: طبيبة محترفة في عيادة حديثة مضاءة جيداً
  hero:    "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=1400&q=90",
  // Doctors grid: أطباء من مختلف التخصصات بجودة عالية
  doctor1: "https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&w=800&q=90",
  doctor2: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=800&q=90",
  doctor3: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=90",
  // Dental: صورة خريطة الأسنان الخاصة
  dental:  "/T1.jpg",
  // CTA background: عيادة حديثة نظيفة
  clinic:  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=80",
  // Company: فريق تقني في مكتب عصري
  team:    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=90",
};

export default function AboutPage() {
  return (
    <main dir="rtl" style={{ fontFamily: "'Tajawal',sans-serif", background: "#FFFFFF", color: "#0A1628", overflowX: "hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --navy:    #0A1628;
          --teal:    #0D9488;
          --teal2:   #14B8A6;
          --sky:     #0EA5E9;
          --gold:    #D97706;
          --gray:    #64748B;
          --light:   #F8FAFC;
          --border:  #E2E8F0;
        }
        a { text-decoration: none; }
        img { display: block; }

        .nav-link { color: #475569; font-weight: 600; font-size: 15px; transition: color .2s; }
        .nav-link:hover { color: var(--teal); }

        .btn-primary {
          background: var(--teal);
          color: #fff;
          font-weight: 800;
          border-radius: 12px;
          transition: all .25s;
          display: inline-block;
        }
        .btn-primary:hover { background: #0B7A72; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(13,148,136,.3); }

        .btn-outline {
          border: 2px solid var(--border);
          color: var(--navy);
          font-weight: 700;
          border-radius: 12px;
          transition: all .25s;
          display: inline-block;
        }
        .btn-outline:hover { border-color: var(--teal); color: var(--teal); }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #F0FDFA;
          border: 1px solid #CCFBF1;
          color: var(--teal);
          font-size: 13px;
          font-weight: 700;
          border-radius: 50px;
          padding: 6px 16px;
        }

        .card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 20px;
          transition: all .3s;
          overflow: hidden;
        }
        .card:hover {
          border-color: #CBD5E1;
          box-shadow: 0 20px 60px rgba(0,0,0,.08);
          transform: translateY(-4px);
        }

        .service-icon {
          width: 52px; height: 52px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }

        .plan-card {
          background: #fff;
          border: 1.5px solid var(--border);
          border-radius: 24px;
          padding: 32px 28px;
          transition: all .3s;
        }
        .plan-card:hover { box-shadow: 0 24px 64px rgba(0,0,0,.09); transform: translateY(-4px); }
        .plan-popular {
          border-color: var(--teal);
          box-shadow: 0 0 0 4px rgba(13,148,136,.08);
          position: relative;
        }

        .check {
          width: 18px; height: 18px;
          border-radius: 50%;
          background: #F0FDFA;
          border: 1px solid #99F6E4;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .img-cover {
          width: 100%; height: 100%;
          object-fit: cover;
        }

        .section-tag {
          font-size: 13px;
          font-weight: 800;
          color: var(--teal);
          letter-spacing: .08em;
          text-transform: uppercase;
          margin-bottom: 14px;
          display: block;
        }

        .wa-bubble-in  { background: #F0FDF4; border-radius: 18px 18px 4px 18px; padding: 12px 16px; width: fit-content; max-width: 82%; margin-right: auto; }
        .wa-bubble-out { background: #EFF6FF; border-radius: 18px 18px 18px 4px; padding: 12px 16px; width: fit-content; max-width: 88%; margin-left: auto; }

        @media(max-width:768px) {
          .hide-mobile { display: none !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .grid-3 { grid-template-columns: 1fr !important; }
          .grid-4 { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* ══ NAV ══ */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 17 }}>ع</div>
            <span style={{ fontWeight: 900, fontSize: 18, color: "var(--navy)" }}>عيادتي</span>
          </div>
          <div className="hide-mobile" style={{ display: "flex", gap: 32 }}>
            {[["#services","الخدمات"],["#dental","طب الأسنان"],["#plans","الباقات"],["#company","الشركة"]].map(([h,l]) => (
              <a key={h} href={h} className="nav-link">{l}</a>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/login" style={{ padding: "9px 18px", color: "var(--gray)", fontWeight: 700, fontSize: 14 }}>دخول</Link>
            <Link href="/register" className="btn-primary" style={{ padding: "10px 22px", fontSize: 14 }}>ابدأ مجاناً</Link>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{ paddingTop: 68, minHeight: "92vh", display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }} className="grid-2">

        {/* Left: text */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 60px 80px 40px", maxWidth: 620 }}>
          <span className="badge" style={{ marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--teal)" }} />
            النظام الأول من نوعه في العراق
          </span>
          <h1 style={{ fontSize: "clamp(36px,4.5vw,62px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 22, letterSpacing: "-.02em", color: "var(--navy)" }}>
            إدارة عيادتك<br />
            <span style={{ color: "var(--teal)" }}>بذكاء حقيقي</span>
          </h1>
          <p style={{ fontSize: 18, color: "var(--gray)", lineHeight: 1.8, marginBottom: 38, fontWeight: 500 }}>
            منصة متكاملة تجمع بوت واتساب ذكي، مواعيد تلقائية، سجلات طبية، وشاشة انتظار حية — كل ما تحتاجه لتشغيل عيادة احترافية.
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 52 }}>
            <Link href="/register" className="btn-primary" style={{ padding: "15px 36px", fontSize: 16 }}>
              ابدأ تجربة 14 يوم مجاناً
            </Link>
            <a href="#services" className="btn-outline" style={{ padding: "14px 30px", fontSize: 15 }}>
              استعرض المميزات
            </a>
          </div>
          {/* Trust row */}
          <div style={{ display: "flex", gap: 32, paddingTop: 32, borderTop: "1px solid var(--border)" }}>
            {[["14+","تخصصاً طبياً"],["24/7","بوت واتساب"],["4","باقات مرنة"]].map(([v,l]) => (
              <div key={l}>
                <div style={{ fontSize: 26, fontWeight: 900, color: "var(--teal)" }}>{v}</div>
                <div style={{ fontSize: 13, color: "var(--gray)", fontWeight: 600, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: hero image */}
        <div style={{ position: "relative", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={IMGS.hero} alt="طبيبة في عيادة حديثة" className="img-cover" style={{ height: "100%", minHeight: 600 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(13,148,136,.15),rgba(14,165,233,.1))" }} />
          {/* Floating card */}
          <div style={{ position: "absolute", bottom: 40, right: 32, background: "#fff", borderRadius: 18, padding: "18px 22px", boxShadow: "0 20px 60px rgba(0,0,0,.15)", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: "#F0FDFA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📅</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "var(--navy)" }}>موعد جديد مؤكد</div>
              <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 3 }}>أحمد محمد — 4:20 مساءً</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SERVICES ══ */}
      <section id="services" style={{ padding: "100px 24px", background: "var(--light)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span className="section-tag">خدمات المنصة</span>
            <h2 style={{ fontSize: "clamp(28px,3.5vw,46px)", fontWeight: 900, color: "var(--navy)", marginBottom: 16 }}>كل ما تحتاجه في مكان واحد</h2>
            <p style={{ color: "var(--gray)", fontSize: 18, maxWidth: 560, margin: "0 auto", lineHeight: 1.75 }}>من الحجز حتى السجل الطبي — نظام متكامل يعمل بدون تعقيد.</p>
          </div>

          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { icon: "🤖", title: "بوت واتساب ذكي", desc: "يستقبل رسائل المرضى ويحجز لهم المواعيد تلقائياً على مدار الساعة. يتعرف على المريض العائد ويرسل التذكيرات قبل الموعد.", color: "#F0FDFA", border: "#CCFBF1" },
              { icon: "📅", title: "إدارة المواعيد",   desc: "تقويم يومي وأسبوعي يعرض كل الحجوزات. تأكيد وإلغاء بضغطة واحدة مع إشعار فوري للمريض عبر واتساب.", color: "#EFF6FF", border: "#BFDBFE" },
              { icon: "📺", title: "شاشة الانتظار",   desc: "شاشة TV عامة في غرفة الانتظار تعرض اسم المريض الحالي والقادمين تلقائياً — تُحدَّث فورياً عند الضغط على التالي.", color: "#FFF7ED", border: "#FED7AA" },
              { icon: "📋", title: "السجل الطبي",     desc: "شكاوى، تشخيص، وصفات، وملاحظات لكل مريض. تاريخ طبي كامل محفوظ وآمن قابل للبحث في أي وقت.", color: "#F0FDF4", border: "#BBF7D0" },
              { icon: "🖨️", title: "وصفة طبية رسمية",desc: "وصفة احترافية بشعار العيادة وبيانات الطبيب وشهاداته. طباعة مباشرة على A4 بضغطة واحدة.", color: "#FDF4FF", border: "#E9D5FF" },
              { icon: "💳", title: "إدارة الاشتراكات",desc: "نظام دفع مرن عبر SuperKey أو يدوياً. السوبر أدمن يتحكم بكل العيادات من لوحة إدارة مركزية واحدة.", color: "#FFFBEB", border: "#FDE68A" },
            ].map((s, i) => (
              <div key={i} className="card" style={{ padding: "28px 24px" }}>
                <div className="service-icon" style={{ background: s.color, border: `1px solid ${s.border}`, marginBottom: 18 }}>{s.icon}</div>
                <h3 style={{ fontWeight: 800, fontSize: 18, color: "var(--navy)", marginBottom: 10 }}>{s.title}</h3>
                <p style={{ color: "var(--gray)", fontSize: 14.5, lineHeight: 1.8, fontWeight: 500 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ DOCTORS / TEAM ══ */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
            {/* Images grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, height: 480 }}>
              <div style={{ borderRadius: 20, overflow: "hidden", gridRow: "1 / 3" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={IMGS.doctor1} alt="طبيبة" className="img-cover" style={{ height: "100%" }} />
              </div>
              <div style={{ borderRadius: 20, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={IMGS.doctor2} alt="طبيب" className="img-cover" style={{ height: "100%" }} />
              </div>
              <div style={{ borderRadius: 20, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={IMGS.doctor3} alt="طاقم طبي" className="img-cover" style={{ height: "100%" }} />
              </div>
            </div>

            {/* Text */}
            <div>
              <span className="section-tag">لكل الأطباء</span>
              <h2 style={{ fontSize: "clamp(26px,3vw,42px)", fontWeight: 900, color: "var(--navy)", marginBottom: 20, lineHeight: 1.2 }}>
                مصمّم لكل<br />
                <span style={{ color: "var(--teal)" }}>التخصصات الطبية</span>
              </h2>
              <p style={{ color: "var(--gray)", lineHeight: 1.9, marginBottom: 32, fontSize: 16 }}>
                سواء كنت طبيب أسنان، أو نساء وتوليد، أو باطنية، أو أطفال — عيادتي يتكيّف مع تخصصك ويعطيك الأدوات الصحيحة لإدارة عيادتك بكفاءة عالية.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 36 }}>
                {["أسنان","نسائية","أطفال","جلدية","قلب","عيون","عظام","باطنية"].map(s => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px" }}>
                    <div className="check">
                      <svg viewBox="0 0 10 10" fill="none" style={{ width: 9, height: 9 }}><path d="M2 5l2 2 4-4" stroke="var(--teal)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>{s}</span>
                  </div>
                ))}
              </div>
              <Link href="/register" className="btn-primary" style={{ padding: "13px 30px", fontSize: 15 }}>سجّل عيادتك الآن</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ DENTAL CHART SECTION ══ */}
      <section id="dental" style={{ background: "var(--navy)", padding: "100px 24px", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: "20%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "rgba(13,148,136,.08)", filter: "blur(80px)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative" }}>
          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
            {/* Text */}
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--teal2)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 16, display: "block" }}>خاص بعيادات الأسنان</span>
              <h2 style={{ fontSize: "clamp(28px,3.5vw,46px)", fontWeight: 900, color: "#F8FAFC", marginBottom: 20, lineHeight: 1.2 }}>
                خريطة أسنان<br />
                <span style={{ color: "var(--teal2)" }}>تفاعلية احترافية</span>
              </h2>
              <p style={{ color: "rgba(248,250,252,0.6)", lineHeight: 1.9, marginBottom: 36, fontSize: 16, fontWeight: 500 }}>
                سجّل علاجات كل سن بالألوان — حشو، تقليع، تلبيس، تنظيف. خريطة مرئية واضحة تُحدَّث لحظياً مع كل زيارة.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { icon: "🦷", text: "32 سن قابل للتأشير بشكل مستقل" },
                  { icon: "🎨", text: "ألوان مختلفة لكل نوع علاج" },
                  { icon: "📊", text: "تاريخ كامل لكل سن في لمحة" },
                  { icon: "🖨️", text: "قابل للطباعة مع ملف المريض" },
                ].map(f => (
                  <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 22 }}>{f.icon}</span>
                    <span style={{ color: "rgba(248,250,252,0.75)", fontSize: 15, fontWeight: 600 }}>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dental image */}
            <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,.4)", border: "1px solid rgba(255,255,255,.08)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMGS.dental} alt="شاشة خريطة الأسنان التفاعلية" className="img-cover" style={{ height: 420, width: "100%" }} />
              <div style={{ background: "rgba(10,22,40,.95)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: "#F8FAFC", fontWeight: 800, fontSize: 14 }}>خريطة الأسنان — أحمد علي</div>
                  <div style={{ color: "rgba(248,250,252,.45)", fontSize: 12, marginTop: 4 }}>آخر تحديث: اليوم 3:45 م</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["#10B981","#F59E0B","#EF4444","#6366F1","#64748B"].map(c => (
                    <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ WHATSAPP BOT ══ */}
      <section style={{ padding: "100px 24px", background: "var(--light)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>

            {/* Phone mockup with chat */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: 320, background: "#fff", borderRadius: 32, boxShadow: "0 40px 100px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.05)", overflow: "hidden", border: "8px solid #E2E8F0" }}>
                {/* WhatsApp header */}
                <div style={{ background: "#075E54", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏥</div>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>عيادة د. سعد</div>
                    <div style={{ color: "rgba(255,255,255,.6)", fontSize: 11 }}>متصل الآن</div>
                  </div>
                </div>
                {/* Chat body */}
                <div style={{ background: "#E5DDD5", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 10, minHeight: 340 }}>
                  <div className="wa-bubble-in" style={{ fontSize: 14 }}>
                    <p style={{ color: "#1a1a1a", fontWeight: 500 }}>السلام عليكم، أريد أحجز موعد</p>
                    <p style={{ fontSize: 10, color: "#888", marginTop: 4, textAlign: "left" }}>4:11 م ✓</p>
                  </div>
                  <div className="wa-bubble-out" style={{ fontSize: 14 }}>
                    <p style={{ color: "#1a1a1a", fontWeight: 500, lineHeight: 1.7 }}>وعليكم السلام سعد 👋<br/>المواعيد المتاحة اليوم:<br/>1️⃣ 4:30 مساءً<br/>2️⃣ 5:00 مساءً<br/>3️⃣ 5:30 مساءً</p>
                    <p style={{ fontSize: 10, color: "#888", marginTop: 4, textAlign: "left" }}>4:11 م</p>
                  </div>
                  <div className="wa-bubble-in" style={{ fontSize: 14 }}>
                    <p style={{ color: "#1a1a1a", fontWeight: 600 }}>1</p>
                    <p style={{ fontSize: 10, color: "#888", marginTop: 4, textAlign: "left" }}>4:12 م ✓✓</p>
                  </div>
                  <div className="wa-bubble-out" style={{ fontSize: 14 }}>
                    <p style={{ color: "#1a1a1a", fontWeight: 500, lineHeight: 1.7 }}>✅ تم تأكيد موعدك!<br/><b>4:30 مساءً</b> — اليوم<br/>ستصلك تذكيرة قبل ساعة 🔔</p>
                    <p style={{ fontSize: 10, color: "#888", marginTop: 4, textAlign: "left" }}>4:12 م</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Text */}
            <div>
              <span className="section-tag">بوت واتساب ذكي</span>
              <h2 style={{ fontSize: "clamp(26px,3vw,42px)", fontWeight: 900, color: "var(--navy)", marginBottom: 20, lineHeight: 1.2 }}>
                المريض يحجز<br />
                <span style={{ color: "var(--teal)" }}>بدون أي تدخل منك</span>
              </h2>
              <p style={{ color: "var(--gray)", lineHeight: 1.9, marginBottom: 36, fontSize: 16 }}>
                البوت يعمل 24/7 — يستقبل الرسائل، يعرض المواعيد المتاحة، ويؤكد الحجز تلقائياً. يتعرف على المريض العائد ويرسل التذكيرات تلقائياً.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 36 }}>
                {[
                  { icon: "⚡", title: "فوري", desc: "يرد خلال ثوانٍ" },
                  { icon: "🧠", title: "ذكي", desc: "يتعلم ويتكيّف" },
                  { icon: "🔔", title: "تذكيرات", desc: "24 ساعة وساعة" },
                  { icon: "🛡️", title: "آمن", desc: "لا ازدواجية" },
                ].map(f => (
                  <div key={f.title} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
                    <span style={{ fontSize: 22 }}>{f.icon}</span>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "var(--navy)", marginTop: 8 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: "var(--gray)", fontWeight: 500, marginTop: 3 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PLANS ══ */}
      <section id="plans" style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span className="section-tag">الأسعار</span>
            <h2 style={{ fontSize: "clamp(28px,3.5vw,46px)", fontWeight: 900, color: "var(--navy)", marginBottom: 14 }}>اختر الباقة المناسبة</h2>
            <p style={{ color: "var(--gray)", fontSize: 16 }}>كل الباقات تبدأ بـ <strong style={{ color: "var(--teal)" }}>14 يوم تجريبي مجاني</strong> — بدون بطاقة ائتمان</p>
          </div>

          {/* Trial banner */}
          <div style={{ background: "linear-gradient(135deg,#F0FDFA,#EFF6FF)", border: "1px solid #CCFBF1", borderRadius: 20, padding: "24px 36px", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <span style={{ fontSize: 36 }}>🎁</span>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18, color: "var(--navy)" }}>فترة تجريبية مجانية — 14 يوم كاملة</div>
                <div style={{ color: "var(--gray)", fontSize: 14, marginTop: 4 }}>وصول كامل لكل الميزات. لا التزام. لا بطاقة ائتمان.</div>
              </div>
            </div>
            <Link href="/register" className="btn-primary" style={{ padding: "12px 28px", fontSize: 15, whiteSpace: "nowrap" }}>ابدأ مجاناً الآن</Link>
          </div>

          {/* 4 plans */}
          <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {[
              { name:"أساسية", nameEn:"BASIC", price:"35,000", color:"#64748B", popular:false,
                features:["حجوزات ومرضى","بوت واتساب","شاشة الانتظار","السجل الطبي","تقرير يومي","دعم أساسي"] },
              { name:"متوسطة", nameEn:"STANDARD", price:"45,000", color:"#0EA5E9", popular:false,
                features:["كل الأساسية","تذكيرات تلقائية","متابعة المراجعات","تقارير PDF","رفع صور وتحاليل","دعم متقدم"] },
              { name:"مميزة", nameEn:"PREMIUM", price:"55,000", color:"#0D9488", popular:true,
                features:["كل المتوسطة","خريطة الأسنان","مساعد ذكي AI","نسخ احتياطي","تصدير Excel","دعم أولوية"] },
              { name:"مميزة VIP", nameEn:"VIP", price:"65,000", color:"#7C3AED", popular:false,
                features:["كل المميزة","ملف طبي كامل","رسائل اطمئنان","أشعة وتحاليل","50 مستخدم","دعم مخصص"] },
            ].map((p, i) => (
              <div key={i} className={`plan-card${p.popular ? " plan-popular" : ""}`}>
                {p.popular && (
                  <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "var(--teal)", color: "#fff", fontSize: 12, fontWeight: 900, padding: "5px 18px", borderRadius: 20, whiteSpace: "nowrap" }}>⭐ الأكثر طلباً</div>
                )}
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".15em", color: p.color, marginBottom: 8 }}>{p.nameEn}</div>
                <div style={{ fontWeight: 900, fontSize: 20, color: "var(--navy)", marginBottom: 6 }}>{p.name}</div>
                <div style={{ marginBottom: 24, display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 30, fontWeight: 900, color: p.popular ? "var(--teal)" : "var(--navy)" }}>{p.price}</span>
                  <span style={{ color: "var(--gray)", fontSize: 13 }}>د.ع / شهر</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="check"><svg viewBox="0 0 10 10" fill="none" style={{ width: 9, height: 9 }}><path d="M2 5l2 2 4-4" stroke="var(--teal)" strokeWidth="1.5" strokeLinecap="round"/></svg></div>
                      <span style={{ fontSize: 13, color: "var(--gray)", fontWeight: 600 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register" style={{ display: "block", textAlign: "center", padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 900, background: p.popular ? "var(--teal)" : "transparent", color: p.popular ? "#fff" : "var(--navy)", border: p.popular ? "none" : "1.5px solid var(--border)", transition: "all .25s" }}>
                  ابدأ مجاناً
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BAGHDAD FUTURE AI ══ */}
      <section id="company" style={{ padding: "100px 24px", background: "var(--light)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="card grid-2" style={{ borderRadius: 28, overflow: "hidden", display: "grid" }}>
            {/* Image */}
            <div style={{ height: 380, overflow: "hidden", position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMGS.team} alt="فريق بغداد المستقبل AI" className="img-cover" style={{ height: "100%" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(13,148,136,.3),rgba(10,22,40,.4))" }} />
              <div style={{ position: "absolute", bottom: 24, right: 24, color: "#fff" }}>
                <div style={{ fontWeight: 900, fontSize: 22 }}>Baghdad Future AI</div>
                <div style={{ fontSize: 14, opacity: .8, marginTop: 4 }}>بغداد — العراق</div>
              </div>
            </div>

            {/* Text */}
            <div style={{ padding: "48px 44px" }}>
              <span className="section-tag">الشركة المطوِّرة</span>
              <h2 style={{ fontSize: "clamp(24px,2.5vw,36px)", fontWeight: 900, color: "var(--navy)", marginBottom: 16, lineHeight: 1.2 }}>
                بغداد المستقبل<br />
                <span style={{ color: "var(--teal)" }}>للذكاء الاصطناعي</span>
              </h2>
              <p style={{ color: "var(--gray)", lineHeight: 1.9, marginBottom: 32, fontSize: 15, fontWeight: 500 }}>
                شركة تقنية عراقية متخصصة في حلول الذكاء الاصطناعي والأنظمة المؤسسية. طوّرت منصة <strong style={{ color: "var(--teal)" }}>عيادتي</strong> لرفع مستوى الرعاية الصحية في العراق من خلال أحدث التقنيات.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
                {["ذكاء اصطناعي","حلول مؤسسية","تطوير SaaS","العراق"].map(t => (
                  <span key={t} style={{ background: "#F0FDFA", border: "1px solid #CCFBF1", color: "var(--teal)", fontSize: 13, fontWeight: 700, padding: "5px 14px", borderRadius: 20 }}>{t}</span>
                ))}
              </div>
              <a href="https://baghdad-future-ai.my/" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: "13px 28px", fontSize: 15 }}>
                زيارة موقع الشركة ←
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section style={{ padding: "100px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={IMGS.clinic} alt="" className="img-cover" style={{ width: "100%", height: "100%", opacity: .12 }} />
        </div>
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(34px,4.5vw,60px)", fontWeight: 900, color: "var(--navy)", marginBottom: 22, lineHeight: 1.1 }}>
            ابدأ مع عيادتك<br />
            <span style={{ color: "var(--teal)" }}>اليوم مجاناً</span>
          </h2>
          <p style={{ color: "var(--gray)", fontSize: 18, marginBottom: 44, lineHeight: 1.75 }}>
            14 يوم تجريبي مجاناً — بدون بطاقة ائتمان — إلغاء في أي وقت
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" className="btn-primary" style={{ padding: "17px 44px", fontSize: 18 }}>سجّل عيادتك الآن</Link>
            <Link href="/login" className="btn-outline" style={{ padding: "16px 36px", fontSize: 17 }}>تسجيل الدخول</Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: "var(--navy)", padding: "44px 24px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 16 }}>ع</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, color: "#F8FAFC" }}>عيادتي</div>
              <div style={{ fontSize: 11, color: "rgba(248,250,252,.35)", fontWeight: 600 }}>تطوير بغداد المستقبل AI</div>
            </div>
          </div>
          <p style={{ color: "rgba(248,250,252,.25)", fontSize: 13, fontWeight: 600 }}>© ٢٠٢٦ عيادتي — جميع الحقوق محفوظة</p>
          <div style={{ display: "flex", gap: 24, fontSize: 13, fontWeight: 700 }}>
            <Link href="/login" className="footer-link" style={{ color: "rgba(248,250,252,.4)" }}>دخول</Link>
            <Link href="/register" style={{ color: "var(--teal2)" }}>تسجيل مجاني</Link>
            <a href="https://baghdad-future-ai.my/" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ color: "rgba(248,250,252,.4)" }}>Baghdad Future AI</a>
          </div>
        </div>
      </footer>

    </main>
  );
}
