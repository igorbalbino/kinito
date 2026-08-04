import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Lock, Mail, User } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';
import { SEOHead } from '../components/common/SEOHead';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { useTranslation } from '../hooks/useTranslation';
import { useAppStore } from '../store/useAppStore';
import { apiLogin, apiRegisterCompany, fetchPlans, isApiConfigured, ApiPlan } from '../lib/api';
import { SafeSelect } from '../components/common/SafeSelect';

export const RegisterEmpresaView: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setActiveRole, setSelectedCompanyId } = useAppStore();
  const seo = t.seo.registerEmpresa;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [planId, setPlanId] = useState<string>('');
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiConfigured()) return;
    fetchPlans()
      .then((list) => {
        setPlans(list);
        if (list[0]) setPlanId(String(list[0].id));
      })
      .catch(() => undefined);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApiConfigured()) {
      setError('Configure VITE_API_URL para cadastrar.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await apiRegisterCompany({
        name,
        email,
        phone: phone || undefined,
        password,
        password_confirmation: password,
        company_name: companyName,
        cnpj,
        plan_id: planId ? Number(planId) : undefined,
      });
      await apiLogin(email, password);
      setActiveRole('empresa');
      if (result.company?.id) setSelectedCompanyId(String(result.company.id));
      navigate('/configuracoes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no cadastro empresarial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 flex flex-col">
      <SEOHead
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        category={seo.category}
        canonicalUrl="/register/empresa"
      />

      <header className="p-4 sm:p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/para-empresas" className="flex items-center gap-3">
          <BrandLogo className="w-10 h-10" />
          <span className="font-extrabold text-lg">Kinito Empresas</span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSelector variant="compact" />
          <Link to="/login" className="text-xs font-bold text-indigo-500">
            {t.nav.login}
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <form
          onSubmit={(e) => void handleRegister(e)}
          autoComplete="off"
          className="w-full max-w-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl"
        >
          <div className="text-center space-y-1">
            <Building2 className="w-8 h-8 text-indigo-500 mx-auto" />
            <h1 className="text-2xl font-black">Cadastro empresarial</h1>
            <p className="text-xs text-slate-500">Registre sua frota e escolha um plano para o trial de 14 dias.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block space-y-1 text-xs font-bold sm:col-span-2">
              Nome do responsável
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5" />
              </div>
            </label>
            <label className="block space-y-1 text-xs font-bold">
              E-mail
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5" />
              </div>
            </label>
            <label className="block space-y-1 text-xs font-bold">
              Telefone
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5" />
            </label>
            <label className="block space-y-1 text-xs font-bold sm:col-span-2">
              Senha
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" name="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5" />
              </div>
            </label>
            <label className="block space-y-1 text-xs font-bold">
              Nome da empresa
              <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5" />
            </label>
            <label className="block space-y-1 text-xs font-bold">
              CNPJ
              <input required value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5" />
            </label>
            {plans.length > 0 && (
              <label className="block space-y-1 text-xs font-bold sm:col-span-2">
                Plano (trial 14 dias)
                <SafeSelect
                  value={planId}
                  onChange={setPlanId}
                  label="Plano"
                  options={plans.map((p) => ({
                    value: String(p.id),
                    label: `${p.name} — R$ ${Number(p.price).toFixed(2)}`,
                  }))}
                />
              </label>
            )}
          </div>

          {error && <p className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center gap-2">
            {loading ? 'Registrando...' : 'Criar conta empresarial'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </main>
    </div>
  );
};
