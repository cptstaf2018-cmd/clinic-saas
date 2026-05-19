import Link from "next/link";

export default function LandingPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#020B18] text-white overflow-x-hidden">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
        * { font-family: 'Tajawal', sans-serif; }

        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse-glow { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes slide-up { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .float { animation: float 4s ease-in-out infinite; }
        .pulse-glow { animation: pulse-glow 2.5s ease-in-out infinite; }
        .slide-up { animation: slide-up 0.7s ease forwards; }

        .gradient-text {
          background: linear-gradient(135deg, #38bdf8, #818cf8, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .card-glow {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
          transition: all 0.3s ease;
        }
        .card-glow:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(56,189,248,0.3);
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(56,189,248,0.1);
        }

        .btn-primary {
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          transition: all 0.3s ease;
          box-shadow: 0 0 30px rgba(14,165,233,0.4);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 50px rgba(14,165,233,0.6);
        }

        .mesh-bg {
          background:
            radial-gradient(ellipse at 20% 50%, rgba(14,165,233,0.12) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.10) 0%, transparent 60%),
            radial-gradient(ellipse at 60% 80%, rgba(52,211,153,0.08) 0%, transparent 50%);
        }

        .feature-icon {
          background: linear-gradient(135deg, rgba(14,165,233,0.2), rgba(99,102,241,0.2));
          border: 1px solid rgba(14,165,233,0.2);
        }

        .plan-highlight {
          background: linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.1));
          border: 1px solid rgba(14,165,233,0.4);
          box-shadow: 0 0 40px rgba(14,165,233,0.1);
        }

        .whatsapp-bubble {
          background: rgba(37,211,102,0.1);
          border: 1px solid rgba(37,211,102,0.2);
          border-radius: 18px 18px 4px 18px;
        }
        .whatsapp-bubble-reply {
          background: rgba(14,165,233,0.1);
          border: 1px solid rgba(14,165,233,0.2);
          border-radius: 18px 18px 18px 4px;
        }
      `}</style>

      {/* ══ NAV ══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-xl bg-[#020B18]/80">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-sky-500/30">ع</div>
            <span className="text-xl font-black text-white">عيادتي</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">المميزات</a>
            <a href="#plans" className="hover:text-white transition-colors">الباقات</a>
            <a href="#whatsapp" className="hover:text-white transition-colors">البوت</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-bold text-slate-400 hover:text-white transition-colors px-4 py-2">دخول</Link>
            <Link href="/register" className="btn-primary text-sm font-black text-white px-5 py-2.5 rounded-xl">ابدأ مجاناً</Link>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="mesh-bg relative min-h-screen flex items-center pt-20">
        {/* Decorative rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/[0.03] pulse-glow pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-white/[0.02] pointer-events-none" />

        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-xs font-bold text-sky-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 pulse-glow" />
            نظام إدارة العيادات الأذكى في العراق
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            <span className="gradient-text">عيادتك</span>
            <br />
            <span className="text-white">تستحق الأفضل</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            بوت واتساب ذكي يحجز المواعيد، تذكيرات تلقائية، سجلات طبية، وشاشة انتظار ذكية.
            <br />كل ما تحتاجه في مكان واحد.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register" className="btn-primary font-black text-white px-8 py-4 rounded-2xl text-base w-full sm:w-auto text-center">
              ابدأ تجربة 14 يوم مجاناً ←
            </Link>
            <a href="#features" className="card-glow font-bold text-slate-300 px-8 py-4 rounded-2xl text-base w-full sm:w-auto text-center">
              تعرف أكثر
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { value: "14", label: "يوم تجريبي مجاني" },
              { value: "8", label: "تخصصات طبية" },
              { value: "24/7", label: "بوت واتساب نشط" },
            ].map((s) => (
              <div key={s.label} className="card-glow rounded-2xl p-4 text-center">
                <p className="text-2xl font-black gradient-text">{s.value}</p>
                <p className="text-xs text-slate-500 font-bold mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHATSAPP BOT DEMO ══ */}
      <section id="whatsapp" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sky-400 font-black text-sm uppercase tracking-widest mb-4">بوت واتساب ذكي</p>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                المريض يحجز<br />
                <span className="gradient-text">بدون مكالمة</span>
              </h2>
              <p className="text-slate-400 font-medium leading-relaxed mb-8">
                البوت يستقبل رسائل المرضى على واتساب، يتعرف عليهم بالرقم، ويحجز لهم موعداً في ثوانٍ — أنت لا تفعل شيئاً.
              </p>
              <div className="space-y-4">
                {[
                  "يعمل 24 ساعة / 7 أيام بدون توقف",
                  "يتعرف على المريض عند العودة تلقائياً",
                  "يرسل تذكيرات قبل الموعد بـ 24 ساعة و ساعة",
                  "يمنع الحجز المزدوج بنفس الوقت",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M2 6l3 3 5-5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>
                    <span className="text-slate-300 font-medium text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp Chat Demo */}
            <div className="card-glow rounded-3xl p-6 space-y-4 float">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="#25D366" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.529 5.843L.057 23.571l5.9-1.548A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.374l-.359-.214-3.502.919.935-3.416-.234-.371A9.818 9.818 0 1 1 12 21.818z"/></svg>
                </div>
                <div>
                  <p className="text-white font-black text-sm">عيادة د. أحمد</p>
                  <p className="text-emerald-400 text-xs font-bold">متصل الآن</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="whatsapp-bubble px-4 py-2.5 w-fit max-w-[80%] mr-auto">
                  <p className="text-slate-300 font-medium">اريد اتصل موعد</p>
                  <p className="text-slate-600 text-[10px] mt-1">1:03 م ✓✓</p>
                </div>
                <div className="whatsapp-bubble-reply px-4 py-2.5 w-fit max-w-[85%] ml-auto">
                  <p className="text-slate-200 font-medium">مرحباً أحمد 👋<br/>المواعيد المتاحة اليوم:<br/>1️⃣ 04:00 مساءً<br/>2️⃣ 04:20 مساءً<br/>3️⃣ 05:00 مساءً<br/><br/>أرسل رقم الوقت المناسب</p>
                  <p className="text-slate-600 text-[10px] mt-1">1:03 م</p>
                </div>
                <div className="whatsapp-bubble px-4 py-2.5 w-fit mr-auto">
                  <p className="text-slate-300 font-medium">2</p>
                  <p className="text-slate-600 text-[10px] mt-1">1:04 م ✓✓</p>
                </div>
                <div className="whatsapp-bubble-reply px-4 py-2.5 w-fit max-w-[85%] ml-auto">
                  <p className="text-slate-200 font-medium">✅ تم تأكيد موعدك!<br/>الساعة 4:20 مساءً<br/>نراك قريباً 🏥</p>
                  <p className="text-slate-600 text-[10px] mt-1">1:04 م</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" className="py-24 px-6 mesh-bg">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sky-400 font-black text-sm uppercase tracking-widest mb-4">كل ما تحتاجه</p>
            <h2 className="text-4xl md:text-5xl font-black text-white">مميزات المنصة</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: "📅", title: "إدارة المواعيد", desc: "تقويم ذكي يعرض مواعيد اليوم، الأسبوع، والشهر. تأكيد وإلغاء بضغطة واحدة." },
              { icon: "📺", title: "شاشة غرفة الانتظار", desc: "شاشة عامة تعرض المريض الحالي والقادمين. تُحدَّث تلقائياً بدون إعادة تشغيل." },
              { icon: "🦷", title: "خريطة الأسنان", desc: "خريطة تفاعلية لتأشير علاجات كل سن بالألوان. مخصصة لعيادات الأسنان." },
              { icon: "📋", title: "السجل الطبي", desc: "شكاوى، تشخيص، وصفات، وملاحظات. كل تاريخ المريض في مكان واحد." },
              { icon: "🖨️", title: "وصفة طبية رسمية", desc: "وصفة احترافية بشعار العيادة وبيانات الطبيب. طباعة بضغطة واحدة على A4." },
              { icon: "💳", title: "إدارة الاشتراكات", desc: "دفع يدوي أو عبر SuperKey. السوبر أدمن يتحكم بكل العيادات من لوحة واحدة." },
            ].map((f) => (
              <div key={f.title} className="card-glow rounded-2xl p-6">
                <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4">{f.icon}</div>
                <h3 className="text-white font-black text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PLANS ══ */}
      <section id="plans" className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-sky-400 font-black text-sm uppercase tracking-widest mb-4">أسعار شفافة</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">اختر باقتك</h2>
            <p className="text-slate-500">كل الباقات تبدأ بـ 14 يوم تجريبي مجاني</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: "أساسية", price: "35,000", features: ["حجوزات ومرضى", "بوت واتساب", "شاشة الانتظار", "السجل الطبي", "تقرير يومي"], highlight: false },
              { name: "متوسطة", price: "45,000", features: ["كل الأساسية", "تذكيرات تلقائية", "متابعة المراجعات", "تقارير PDF", "دعم مميز"], highlight: true },
              { name: "مميزة", price: "55,000", features: ["كل المتوسطة", "خريطة الأسنان", "مساعد ذكي", "نسخ احتياطي", "دعم أولوية"], highlight: false },
            ].map((p) => (
              <div key={p.name} className={`rounded-2xl p-6 relative ${p.highlight ? "plan-highlight" : "card-glow"}`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-xs font-black px-4 py-1 rounded-full">الأكثر طلباً</div>
                )}
                <h3 className="text-white font-black text-xl mb-1">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-black gradient-text">{p.price}</span>
                  <span className="text-slate-500 text-sm font-bold">د.ع / شهر</span>
                </div>
                <div className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5"><path d="M1.5 5l2.5 2.5 4.5-4" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </div>
                      <span className="text-slate-400 text-sm font-medium">{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register" className={`block text-center font-black py-3 rounded-xl text-sm transition-all ${p.highlight ? "btn-primary text-white" : "border border-white/10 text-slate-300 hover:border-sky-500/30 hover:text-white"}`}>
                  ابدأ مجاناً
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="py-24 px-6 mesh-bg">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            جاهز تبدأ<br />
            <span className="gradient-text">مع عيادتك؟</span>
          </h2>
          <p className="text-slate-400 font-medium mb-10 text-lg">14 يوم مجاناً — بدون بطاقة ائتمان — إلغاء في أي وقت</p>
          <Link href="/register" className="btn-primary inline-block font-black text-white px-10 py-5 rounded-2xl text-lg">
            سجّل عيادتك الآن ←
          </Link>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white font-black text-xs">ع</div>
            <span className="text-white font-black">عيادتي</span>
          </div>
          <p className="text-slate-600 text-sm font-bold">© 2026 عيادتي — تكريت، العراق</p>
          <div className="flex gap-6 text-sm font-bold text-slate-500">
            <Link href="/login" className="hover:text-white transition-colors">دخول</Link>
            <Link href="/register" className="hover:text-white transition-colors">تسجيل</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
