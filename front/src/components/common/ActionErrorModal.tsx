import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

type ActionErrorModalProps = {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
};

export const ActionErrorModal: React.FC<ActionErrorModalProps> = ({
  open,
  title = 'Não foi possível concluir a ação',
  message,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Fechar modal de erro"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{message}</p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
