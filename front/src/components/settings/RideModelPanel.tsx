import React, { useEffect, useState } from 'react';
import { CalendarClock, Check, Loader2, Zap } from 'lucide-react';
import { fetchCompanyDetails, getApiCompanyId, updateCompanySettings } from '../../lib/api';

type Modelo = 'INSTANTANEAS' | 'AGENDAMENTO' | 'AMBOS';

const OPTIONS: { value: Modelo; title: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: 'INSTANTANEAS',
    title: 'Instantâneo',
    desc: 'Sua frota atende corridas para o momento. O cliente pede e você vai agora.',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    value: 'AGENDAMENTO',
    title: 'Agendamento',
    desc: 'Você é o fornecedor principal para corridas agendadas. Pedidos instantâneos vão ao marketplace.',
    icon: <CalendarClock className="w-5 h-5" />,
  },
  {
    value: 'AMBOS',
    title: 'Ambos',
    desc: 'Aceita corridas instantâneas e agendadas dos seus clientes.',
    icon: <Check className="w-5 h-5" />,
  },
];

export const RideModelPanel: React.FC = () => {
  const [modelo, setModelo] = useState<Modelo>('AMBOS');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const companyId = getApiCompanyId();
    if (!companyId) {
      setLoading(false);
      setError('Empresa da sessão não encontrada.');
      return;
    }
    fetchCompanyDetails(companyId)
      .then((company) => {
        const value = String(company.settings?.modeloCorridas || 'AMBOS').toUpperCase() as Modelo;
        if (value === 'INSTANTANEAS' || value === 'AGENDAMENTO' || value === 'AMBOS') {
          setModelo(value);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Falha ao carregar'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (next: Modelo) => {
    const companyId = getApiCompanyId();
    if (!companyId) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateCompanySettings(companyId, { modelo_corridas: next });
      setModelo(next);
      setMessage('Modelo de negócio atualizado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center gap-2 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
      <div>
        <h3 className="font-semibold text-base text-slate-100">Modelo de negócio</h3>
        <p className="text-xs text-slate-400 mt-1">
          Define como sua empresa participa de corridas instantâneas e agendadas.
        </p>
      </div>

      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
      {message && <p className="text-xs text-emerald-400 font-medium">{message}</p>}

      <div className="grid grid-cols-1 gap-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={saving}
            onClick={() => void save(opt.value)}
            className={`text-left p-4 rounded-xl border transition-all flex gap-3 items-start disabled:opacity-60 ${
              modelo === opt.value
                ? 'border-indigo-500 bg-indigo-500/10 text-white'
                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              {opt.icon}
            </div>
            <div>
              <div className="font-bold text-sm">{opt.title}</div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
