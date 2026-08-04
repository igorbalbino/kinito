import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, User, UserCheck, Users } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';
import { SEOHead } from '../components/common/SEOHead';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { useTranslation } from '../hooks/useTranslation';
import { useAppStore } from '../store/useAppStore';
import { apiRegisterPerson, isApiConfigured } from '../lib/api';
import { roleFromApi } from '../lib/mappers';
import { UserRole } from '../types';

export const RegisterView: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setActiveRole } = useAppStore();
  const seo = t.seo.register;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'cliente' | 'motorista'>('cliente');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApiConfigured()) {
      setError('Configure VITE_API_URL para cadastrar.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const apiRole = role === 'motorista' ? 'MOTORISTA' : 'CLIENTE';
      const { user } = await apiRegisterPerson({
        name,
        email,
        phone: phone || undefined,
        password,
        password_confirmation: password,
        role: apiRole,
        vehicle_model: role === 'motorista' ? vehicleModel : undefined,
        vehicle_plate: role === 'motorista' ? vehiclePlate : undefined,
        city: role === 'motorista' ? city : undefined,
      });
      setActiveRole(roleFromApi(user.roles) as UserRole);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no cadastro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 flex flex-col">
      <SEOHead title={seo.title} description={seo.description} keywords={seo.keywords} category={seo.category} canonicalUrl="/register" />

      <header className="p-4 sm:p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-3">
          <BrandLogo className="w-10 h-10" />
          <span className="font-extrabold text-lg">Kinito</span>
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
          className="w-full max-w-md bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl"
        >
          <h1 className="text-2xl font-black text-center">{t.auth.registerTitle}</h1>
          <p className="text-xs text-slate-500 text-center">{t.auth.registerSub}</p>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'cliente' as const, label: 'Cliente', icon: Users },
              { id: 'motorista' as const, label: 'Motorista', icon: UserCheck },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setRole(id)}
                className={`p-3 rounded-xl border text-left text-xs flex items-center gap-2 ${
                  role === id
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/15 font-bold'
                    : 'border-slate-200 dark:border-white/10'
                }`}
              >
                <Icon className="w-4 h-4 text-indigo-500" />
                {label}
              </button>
            ))}
          </div>

          <label className="block space-y-1 text-xs font-bold">
            Nome
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
          <label className="block space-y-1 text-xs font-bold">
            Senha
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" name="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5" />
            </div>
          </label>

          {role === 'motorista' && (
            <>
              <label className="block space-y-1 text-xs font-bold">
                Modelo do veículo
                <input required value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5" />
              </label>
              <label className="block space-y-1 text-xs font-bold">
                Placa
                <input required value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5" />
              </label>
              <label className="block space-y-1 text-xs font-bold">
                Cidade
                <input required value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5" />
              </label>
            </>
          )}

          {error && <p className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center gap-2">
            {loading ? 'Criando...' : 'Criar conta'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-xs text-slate-500">
            Empresa?{' '}
            <Link to="/para-empresas" className="font-bold text-indigo-500">
              Cadastro empresarial
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
};
