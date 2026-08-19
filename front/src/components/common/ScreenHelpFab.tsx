import React, { useMemo, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { screenHelpByRoute } from '../../content/screenHelpByRoute';

export const ScreenHelpFab: React.FC = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const help = useMemo(() => screenHelpByRoute[location.pathname], [location.pathname]);
  if (!help) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-24 md:bottom-6 z-40 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl border border-white/20 flex items-center justify-center"
        title="Ajuda da tela"
        aria-label="Abrir ajuda da tela"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[85] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{help.title}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{help.summary}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Fechar ajuda"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <details open className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/30">
                <summary className="px-4 py-3 cursor-pointer text-sm font-semibold">Campos</summary>
                <ul className="px-5 pb-4 text-xs text-zinc-600 dark:text-zinc-300 space-y-2 list-disc">
                  {help.fields.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>

              <details className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/30">
                <summary className="px-4 py-3 cursor-pointer text-sm font-semibold">Botões</summary>
                <ul className="px-5 pb-4 text-xs text-zinc-600 dark:text-zinc-300 space-y-2 list-disc">
                  {help.buttons.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>

              <details className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/30">
                <summary className="px-4 py-3 cursor-pointer text-sm font-semibold">Fluxo rápido</summary>
                <ul className="px-5 pb-4 text-xs text-zinc-600 dark:text-zinc-300 space-y-2 list-disc">
                  {help.quickFlow.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
