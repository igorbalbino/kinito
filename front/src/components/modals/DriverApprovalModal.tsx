import React from 'react';
import { CheckCircle2, FileCheck, ShieldAlert, UserCheck, X, XCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Driver } from '../../types';

interface DriverApprovalModalProps {
  driver: Driver | null;
  onClose: () => void;
}

export const DriverApprovalModal: React.FC<DriverApprovalModalProps> = ({ driver, onClose }) => {
  const { updateDriverDocument, updateDriverStatus } = useAppStore();

  if (!driver) return null;

  return (
    <div
      id="driver-approval-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="driver-approval-modal-card"
        className="w-full max-w-2xl bg-[#121215] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tactile Handle for Mobile */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <img src={driver.avatar} alt={driver.name} className="w-10 h-10 rounded-full bg-white/10 border border-white/10" />
            <div>
              <h3 className="font-semibold text-base text-slate-100">
                Auditoria de Documentação: {driver.name}
              </h3>
              <p className="text-xs text-slate-400">
                {driver.vehicleModel} • Placa: {driver.vehiclePlate} • {driver.companyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors active:scale-90"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Documents list */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Todos os 4 documentos obrigatórios devem estar aprovados para liberar o cadastro do motorista na frota.</span>
          </div>

          <div className="space-y-2">
            {driver.documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-xl border border-white/10 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <FileCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <div className="font-medium text-slate-200">{doc.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Enviado em: {doc.uploadedAt} • Validade: {doc.expiresAt}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => updateDriverDocument(driver.id, doc.id, 'rejeitado')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-90 min-h-[40px] ${
                      doc.status === 'rejeitado'
                        ? 'bg-rose-600 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-rose-600/30 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-4 h-4" /> Rejeitar
                  </button>
                  <button
                    onClick={() => updateDriverDocument(driver.id, doc.id, 'aprovado')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-90 min-h-[40px] ${
                      doc.status === 'aprovado'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-emerald-600/30 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Aprovar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                updateDriverStatus(driver.id, 'bloqueado');
                onClose();
              }}
              className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold hover:bg-rose-500/20 active:scale-95 transition-all min-h-[48px]"
            >
              Bloquear Motorista
            </button>

            <button
              onClick={() => {
                updateDriverStatus(driver.id, 'ativo');
                onClose();
              }}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 active:scale-95 transition-all min-h-[48px]"
            >
              <UserCheck className="w-4 h-4" /> Aprovar e Liberar Motorista
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
