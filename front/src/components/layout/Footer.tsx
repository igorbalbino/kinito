import React from 'react';
import { Heart, ExternalLink, Shield, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/10 bg-[#09090b]/90 backdrop-blur-md py-6 px-4 text-xs text-slate-400 select-none mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left branding info */}
        <div className="flex items-center gap-2 text-slate-400">
          <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center font-bold text-white text-[10px]">
            FP
          </div>
          <span className="font-semibold text-slate-200">FleetPulse Pro SaaS</span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline text-slate-400">Sistema Inteligente de Despacho, Frotas & Repasse Stripe</span>
        </div>

        {/* Center / Right - Mandated Signature */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-medium">
            <span>Desenvolvido com excelência</span>
            <span className="text-slate-500">•</span>
            <a
              href="https://creatioinc.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors flex items-center gap-1 underline underline-offset-2"
            >
              made by creatioinc.com
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
