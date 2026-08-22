import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  FileText,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  User,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import { formatBRL, formatDate } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';
import { Ride } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { SafeSelect } from '../common/SafeSelect';
import { ActionErrorModal } from '../common/ActionErrorModal';
import { rideAction, patchRideFinance } from '../../lib/api';
import { normalizeRide } from '../../lib/normalize';
import { unwrapResource } from '../../lib/sessionProfile';
import { isClientRole, isFleetOperator } from '../../lib/navByRole';
import { downloadRideReceiptPdf } from '../../lib/rideReceiptPdf';

interface RideDetailsModalProps {
  ride: Ride | null;
  onClose: () => void;
}

export const RideDetailsModal: React.FC<RideDetailsModalProps> = ({ ride, onClose }) => {
  const { financialMode, upsertRide, drivers, activeRole } = useAppStore();
  const clientMode = isClientRole(activeRole);
  const driverMode = activeRole === 'motorista';
  const canDispatch = isFleetOperator(activeRole);

  const [isEditingFinancials, setIsEditingFinancials] = useState(false);
  const [grossInput, setGrossInput] = useState(ride?.grossValue || 0);
  const [driverNetInput, setDriverNetInput] = useState(ride?.driverNet || 0);
  const [platformFeeInput, setPlatformFeeInput] = useState(ride?.platformCommission || 0);
  const [selectedNewDriverId, setSelectedNewDriverId] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!ride) return null;

  const runAction = async (
    action: 'reassign' | 'cancel' | 'finish' | 'start',
    body: Record<string, unknown> = {},
    after?: () => void,
  ) => {
    setActionError(null);
    setActionBusy(true);
    try {
      const res = await rideAction(ride.id, action, body);
      upsertRide(normalizeRide(unwrapResource(res)));
      after?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Falha na ação');
    } finally {
      setActionBusy(false);
    }
  };

  const canAdjustPrice =
    (canDispatch || driverMode) &&
    ride.status !== 'cancelada';

  const handleSaveFinancials = () => {
    void (async () => {
      setActionError(null);
      try {
        const res = await patchRideFinance(ride.id, {
          gross_value: Number(grossInput),
        });
        upsertRide(normalizeRide(unwrapResource(res)));
        setIsEditingFinancials(false);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Falha ao salvar financeiro');
      }
    })();
  };

  const handleReassign = () => {
    if (!selectedNewDriverId) return;
    void runAction('reassign', { driver_id: Number(selectedNewDriverId) }, () => setIsReassigning(false));
  };

  const handleCancel = () => {
    void runAction(
      'cancel',
      { reason: cancelReasonInput || 'Cancelada via painel' },
      () => setIsCancelling(false),
    );
  };

  const handleFinish = () => void runAction('finish');
  const handleStart = () => void runAction('start');

  return (
    <div
      id="ride-details-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="ride-details-modal-card"
        className="w-full max-w-3xl bg-[#121215] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 sm:hidden" />

        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-slate-100">
                  Corrida {ride.code}
                </h3>
                <StatusBadge type="ride" status={ride.status} size="sm" />
              </div>
              <p className="text-xs text-slate-400">
                Solicitada em {formatDate(ride.requestedAt)} • {ride.companyName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(ride.status === 'concluida' || ride.status === 'cancelada') && (
              <button
                type="button"
                onClick={() => downloadRideReceiptPdf(ride, financialMode)}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-100 text-xs font-semibold flex items-center gap-1.5 min-h-[40px]"
              >
                <FileText className="w-4 h-4" /> PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors active:scale-90"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-white relative overflow-hidden space-y-4">
            <div className="absolute top-2 right-2 px-2 py-1 rounded bg-zinc-800/80 text-[10px] text-zinc-300 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Simulação de Rota GPS
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Origem</div>
                  <div className="font-medium text-zinc-100 text-xs">{ride.origin.address}</div>
                  <div className="text-[10px] text-zinc-400">{ride.origin.city}</div>
                </div>
              </div>

              <div className="ml-3 border-l-2 border-dashed border-indigo-500/60 h-6 my-1" />

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Destino</div>
                  <div className="font-medium text-zinc-100 text-xs">{ride.destination.address}</div>
                  <div className="text-[10px] text-zinc-400">{ride.destination.city}</div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-zinc-400 text-[11px]">
              <span>Distância Estimada: <strong className="text-white">{ride.distanceKm} km</strong></span>
              <span>Tempo Estimado: <strong className="text-white">{ride.durationMin} min</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2">
              <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" /> Cliente Solicitante
              </div>
              <div className="flex items-center gap-3 pt-1">
                {ride.clientAvatar && <img src={ride.clientAvatar} alt={ride.clientName} className="w-9 h-9 rounded-full bg-zinc-200" />}
                <div>
                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{ride.clientName}</div>
                  <div className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {ride.clientPhone}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2">
              <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Motorista Atribuído
                </span>
                {canDispatch && ride.status !== 'concluida' && ride.status !== 'cancelada' && (
                  <button
                    onClick={() => setIsReassigning(!isReassigning)}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                  >
                    {isReassigning ? 'Cancelar' : 'Reatribuir'}
                  </button>
                )}
              </div>

              {isReassigning ? (
                <div className="space-y-2 pt-1">
                  <SafeSelect
                    value={selectedNewDriverId}
                    onChange={setSelectedNewDriverId}
                    sanitizeLabels
                    placeholder="Selecione outro motorista disponível..."
                    label="Motorista"
                    options={[
                      { value: '', label: 'Selecione outro motorista disponível...' },
                      ...drivers
                        .filter((d) => d.status === 'ativo')
                        .map((drv) => ({
                          value: String(drv.id),
                          label: `${drv.name} (${drv.vehicleModel} - ${drv.vehiclePlate})`,
                        })),
                    ]}
                  />
                  <button
                    type="button"
                    onClick={() => void handleReassign()}
                    disabled={actionBusy || !selectedNewDriverId}
                    className="w-full py-1.5 min-h-[40px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
                  >
                    Confirmar Reatribuição
                  </button>
                </div>
              ) : ride.driverName ? (
                <div className="flex items-center gap-3 pt-1">
                  {ride.driverAvatar && <img src={ride.driverAvatar} alt={ride.driverName} className="w-9 h-9 rounded-full bg-zinc-200" />}
                  <div>
                    <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{ride.driverName}</div>
                    <div className="text-zinc-500 dark:text-zinc-400 text-[11px]">{ride.driverVehicle}</div>
                  </div>
                </div>
              ) : (
                <div className="text-amber-600 dark:text-amber-400 font-medium pt-2">
                  Aguardando atribuição de motorista próximo...
                </div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-500" />
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Resumo Financeiro & Repasse
                </span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge type="payment" status={ride.paymentStatus} size="sm" />
                {canAdjustPrice && !isEditingFinancials && (
                  <button
                    type="button"
                    onClick={() => {
                      setGrossInput(ride.grossValue);
                      setDriverNetInput(ride.driverNet);
                      setPlatformFeeInput(ride.platformCommission);
                      setIsEditingFinancials(true);
                    }}
                    className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold hover:bg-amber-500/30 text-[11px]"
                  >
                    Alterar valor
                  </button>
                )}
              </div>
            </div>

            {clientMode && financialMode === 'manual' ? (
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Pague ao motorista ao final da corrida.</span>
              </div>
            ) : financialMode === 'stripe' ? (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Split de Pagamento Calculado Automaticamente via Stripe Connect
                </span>
                <span className="font-bold">Webhook OK</span>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Modo Manual Ativo: Os valores exibidos são estimativas pendentes de liquidação manual.</span>
              </div>
            )}

            {isEditingFinancials && canAdjustPrice ? (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl space-y-3">
                <div>
                  <label className="text-[10px] text-zinc-400 font-medium">Valor da corrida (R$)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={grossInput}
                    onChange={(e) => setGrossInput(parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-bold"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Ao salvar, taxas e líquido do motorista são recalculados automaticamente.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingFinancials(false)}
                    className="px-3 py-1.5 min-h-[40px] rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFinancials}
                    className="px-3 py-1.5 min-h-[40px] rounded bg-indigo-600 text-white font-semibold"
                  >
                    Salvar valor
                  </button>
                </div>
              </div>
            ) : (
              clientMode ? (
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-center">
                  <div className="text-[10px] text-zinc-400">Valor da corrida</div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{formatBRL(ride.grossValue)}</div>
                </div>
              ) : driverMode ? (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Seu ganho líquido</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(ride.driverNet)}</div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                    <div className="text-[10px] text-zinc-400">Valor Bruto</div>
                    <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">{formatBRL(ride.grossValue)}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                    <div className="text-[10px] text-zinc-400">Taxa Stripe</div>
                    <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                      {financialMode === 'stripe' ? formatBRL(ride.stripeFee) : 'R$ 0,00'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                    <div className="text-[10px] text-zinc-400">Comissão Plataforma</div>
                    <div className="text-base font-bold text-purple-600 dark:text-purple-400">{formatBRL(ride.platformCommission)}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Líquido Motorista</div>
                    <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(ride.driverNet)}</div>
                  </div>
                </div>
              )
            )}
          </div>

          {!clientMode && ride.status !== 'concluida' && ride.status !== 'cancelada' && (
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              {isCancelling ? (
                <div className="w-full space-y-2">
                  <input
                    type="text"
                    value={cancelReasonInput}
                    onChange={(e) => setCancelReasonInput(e.target.value)}
                    placeholder="Digite o motivo do cancelamento da corrida..."
                    className="w-full p-2 rounded bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-800 text-xs"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsCancelling(false)}
                      className="px-3 py-1.5 min-h-[40px] rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                      disabled={actionBusy}
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCancel()}
                      className="px-3 py-1.5 min-h-[40px] rounded bg-rose-600 text-white font-semibold disabled:opacity-50"
                      disabled={actionBusy}
                    >
                      Confirmar Cancelamento
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsCancelling(true)}
                    className="text-rose-600 dark:text-rose-400 font-semibold hover:underline flex items-center gap-1"
                    disabled={actionBusy}
                  >
                    <XCircle className="w-4 h-4" /> Cancelar Corrida
                  </button>
                  <div className="flex gap-2">
                    {ride.status === 'atribuida' && (
                      <button
                        type="button"
                        onClick={() => void handleStart()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                        disabled={actionBusy}
                      >
                        Iniciar Corrida
                      </button>
                    )}
                    {ride.status === 'em_andamento' && (
                      <button
                        type="button"
                        onClick={() => void handleFinish()}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                        disabled={actionBusy}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Concluir Corrida
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <ActionErrorModal
        open={Boolean(actionError)}
        title="Ação não permitida agora"
        message={
          /Transição inválida/i.test(actionError || '')
            ? 'Essa ação não é permitida no status atual da corrida. Se ela estiver atribuída, clique em "Iniciar Corrida" antes de concluir.'
            : actionError || ''
        }
        onClose={() => setActionError(null)}
      />
    </div>
  );
};
