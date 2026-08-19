import React from 'react';
import { SEOHead } from './SEOHead';
import { useTranslation } from '../../hooks/useTranslation';
import { landingExtras } from '../../i18n/landingExtras';

type SeoKey = keyof (typeof landingExtras)['pt']['seo'];

const canonicals: Partial<Record<SeoKey, string>> = {
  home: '/',
  empresasLanding: '/para-empresas',
  login: '/login',
  register: '/register',
  registerEmpresa: '/register/empresa',
  dashboard: '/dashboard',
  corridas: '/corridas',
  clientes: '/clientes',
  motoristas: '/motoristas',
  empresas: '/empresas',
  financeiro: '/financeiro',
  relatorios: '/relatorios',
  logs: '/logs',
  notificacoes: '/notificacoes',
  configuracoes: '/configuracoes',
  perfil: '/perfil',
  fornecedores: '/fornecedores',
  verifyEmail: '/verificar-email',
  pendingVerification: '/verificar-email-pendente',
  planSelection: '/escolher-plano',
};

export const PageSEO: React.FC<{ page: SeoKey }> = ({ page }) => {
  const { t } = useTranslation();
  const seo = t.seo[page];
  return (
    <SEOHead
      title={seo.title}
      description={seo.description}
      keywords={seo.keywords}
      category={seo.category}
      canonicalUrl={canonicals[page]}
    />
  );
};
