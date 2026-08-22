import React from 'react';
import { Loader2 } from 'lucide-react';

/** Lightweight fallback while a lazy route chunk loads. */
export const RouteFallback: React.FC = () => (
  <div
    className="min-h-[40vh] w-full flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400"
    role="status"
    aria-live="polite"
  >
    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" aria-hidden="true" />
    <span className="text-xs font-medium">Carregando…</span>
  </div>
);
