import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, ShieldCheck, Sparkles, Building2 } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';
import { SEOHead } from '../components/common/SEOHead';
import { Footer } from '../components/layout/Footer';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { useTranslation } from '../hooks/useTranslation';

export const LandingView: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const seo = t.seo.home;
  const L = t.landingClient;

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <SEOHead
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        category={seo.category}
        canonicalUrl="/"
        prerenderRoutes={['/', '/para-empresas', '/login', '/register']}
        jsonLdSchema={{
          '@type': 'FAQPage',
          mainEntity: L.faq.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
          })),
        }}
      />

      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo className="w-9 h-9 shadow-lg" />
            <div>
              <span className="font-bold text-base tracking-tight block">Kinito</span>
              <span className="text-[10px] text-slate-500">{L.navTag}</span>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector variant="compact" />
            <button type="button" onClick={() => navigate('/login')} className="px-3.5 py-2 text-xs font-bold">
              {t.nav.login}
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
            >
              {t.nav.register}
            </button>
          </div>
        </div>
      </header>

      <section className="relative isolate pt-14 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-100 via-transparent to-transparent dark:from-emerald-950/30 dark:via-transparent dark:to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            {L.tag}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
            <span className="block text-indigo-600 dark:text-indigo-400 mb-1">Kinito</span>
            {L.headline}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">{L.sub}</p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold"
            >
              {L.ctaPrimary}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-5 py-3 rounded-xl border border-slate-300 dark:border-white/15 text-sm font-bold"
            >
              {L.ctaSecondary}
            </button>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 max-w-5xl mx-auto w-full grid sm:grid-cols-3 gap-6">
        {[
          { icon: MapPin, title: L.f1Title, desc: L.f1Desc },
          { icon: ShieldCheck, title: L.f2Title, desc: L.f2Desc },
          { icon: Sparkles, title: L.f3Title, desc: L.f3Desc },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
            <Icon className="w-5 h-5 text-indigo-500 mb-3" />
            <h2 className="font-bold text-sm mb-1">{title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      <section className="px-4 pb-20 max-w-3xl mx-auto w-full space-y-4">
        <h2 className="text-xl font-black text-center">{L.faqTitle}</h2>
        {L.faq.map((item) => (
          <details key={item.q} className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
            <summary className="font-semibold text-sm cursor-pointer">{item.q}</summary>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{item.a}</p>
          </details>
        ))}
      </section>

      <section className="mt-auto border-t border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.03] px-4 py-12">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-3 text-center sm:text-left">
            <Building2 className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-base">{L.bizTitle}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">{L.bizDesc}</p>
            </div>
          </div>
          <Link
            to="/para-empresas"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-xs font-bold shrink-0"
          >
            {L.bizCta}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};
