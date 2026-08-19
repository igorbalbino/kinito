import type { Language } from './translations';

export type FaqItem = { q: string; a: string };

export type SeoPage = {
  title: string;
  description: string;
  keywords: string[];
  category: string;
};

export type LandingClientCopy = {
  navTag: string;
  tag: string;
  headline: string;
  sub: string;
  ctaPrimary: string;
  ctaSecondary: string;
  f1Title: string;
  f1Desc: string;
  f2Title: string;
  f2Desc: string;
  f3Title: string;
  f3Desc: string;
  faqTitle: string;
  faq: FaqItem[];
  bizTitle: string;
  bizDesc: string;
  bizCta: string;
};

export type LandingEmpresaCopy = {
  navTag: string;
  forClients: string;
  tag: string;
  headline: string;
  sub: string;
  ctaRegister: string;
  b1Title: string;
  b1Desc: string;
  b2Title: string;
  b2Desc: string;
  b3Title: string;
  b3Desc: string;
  b4Title: string;
  b4Desc: string;
  proofTitle: string;
  proofDesc: string;
  faqTitle: string;
  faq: FaqItem[];
};

const seoPt = {
  home: {
    title: 'Peça sua corrida com segurança',
    description:
      'Kinito conecta você a motoristas confiáveis. Solicite corridas, acompanhe o trajeto e viaje com tranquilidade.',
    keywords: ['pedir corrida', 'app de transporte', 'kinito cliente', 'corrida segura', 'mobilidade urbana'],
    category: 'Mobilidade para passageiros',
  },
  empresasLanding: {
    title: 'Gestão de frotas e despacho para empresas',
    description:
      'Kinito para empresas: despacho de corridas, motoristas, clientes, financeiro e WhatsApp em um só painel. Teste 14 dias.',
    keywords: [
      'software gestão de frota',
      'despacho de corridas empresa',
      'saas transporte',
      'kinito empresas',
      'sistema para táxi e executivo',
    ],
    category: 'SaaS para frotas',
  },
  login: {
    title: 'Entrar na conta',
    description: 'Acesse o Kinito com e-mail ou telefone para gerenciar corridas, frota ou solicitar viagens.',
    keywords: ['login kinito', 'entrar conta transporte'],
    category: 'Autenticação',
  },
  register: {
    title: 'Cadastro de cliente ou motorista',
    description: 'Crie sua conta no Kinito como cliente ou motorista e comece a usar a plataforma.',
    keywords: ['cadastro motorista', 'cadastro cliente', 'criar conta kinito'],
    category: 'Cadastro',
  },
  registerEmpresa: {
    title: 'Cadastro empresarial',
    description: 'Registre sua frota ou empresa de transporte no Kinito e inicie o teste gratuito de 14 dias.',
    keywords: ['cadastro empresa transporte', 'abrir frota kinito', 'saas frota trial'],
    category: 'Cadastro empresarial',
  },
  dashboard: {
    title: 'Painel operacional',
    description: 'Acompanhe corridas ativas, motoristas disponíveis e indicadores de desempenho da sua operação em tempo real.',
    keywords: ['dashboard frota', 'painel operacional corridas', 'indicadores transporte', 'corridas ativas'],
    category: 'Painel',
  },
  corridas: {
    title: 'Corridas e despacho',
    description: 'Gerencie solicitações, atribua motoristas, acompanhe status e histórico completo de todas as corridas da frota.',
    keywords: ['gestão de corridas', 'despacho transporte', 'atribuir motorista', 'histórico corridas frota'],
    category: 'Operações',
  },
  clientes: {
    title: 'Gestão de clientes',
    description: 'Cadastre passageiros, acompanhe histórico de viagens e gerencie preferências de cada cliente da operação.',
    keywords: ['gestão de clientes transporte', 'cadastro passageiro', 'histórico viagens cliente'],
    category: 'Clientes',
  },
  motoristas: {
    title: 'Gestão de motoristas',
    description: 'Cadastro, aprovação de documentos, controle de disponibilidade e acompanhamento de desempenho dos motoristas.',
    keywords: ['aprovação motoristas', 'gestão de frota', 'documentos motorista', 'controle disponibilidade'],
    category: 'Motoristas',
  },
  empresas: {
    title: 'Empresas e frotas parceiras',
    description: 'Administre múltiplas empresas, parcerias entre frotas e distribuidores com visão consolidada por CNPJ.',
    keywords: ['multi empresa frota', 'parceiros transporte', 'gestão CNPJ frota', 'parceria frotas'],
    category: 'Empresas',
  },
  financeiro: {
    title: 'Financeiro e repasses',
    description: 'Extrato de pagamentos, split de comissões, repasses para motoristas e controle financeiro da operação.',
    keywords: ['extrato financeiro frota', 'split pagamento motorista', 'comissão plataforma transporte', 'repasse automático'],
    category: 'Financeiro',
  },
  relatorios: {
    title: 'Relatórios operacionais',
    description: 'Exporte relatórios de corridas, faturamento, desempenho de motoristas e indicadores consolidados por período.',
    keywords: ['relatório corridas', 'exportar extrato frota', 'indicadores operacionais', 'relatório financeiro transporte'],
    category: 'Relatórios',
  },
  logs: {
    title: 'Logs e auditoria',
    description: 'Consulte o histórico de ações do sistema, trilha de auditoria e eventos operacionais para rastreabilidade completa.',
    keywords: ['auditoria sistema frota', 'logs operações', 'trilha auditoria transporte', 'rastreabilidade eventos'],
    category: 'Auditoria',
  },
  notificacoes: {
    title: 'Central de notificações',
    description: 'Acompanhe alertas de corridas, aprovações pendentes e atualizações relevantes da operação em um só lugar.',
    keywords: ['notificações despacho', 'alertas corridas', 'aprovações pendentes', 'central avisos frota'],
    category: 'Notificações',
  },
  configuracoes: {
    title: 'Configurações do painel',
    description: 'Ajuste plano de assinatura, integrações com WhatsApp, modelo de corridas e preferências gerais da empresa.',
    keywords: ['configurações frota', 'whatsapp empresa', 'plano assinatura kinito', 'modelo corridas'],
    category: 'Configurações',
  },
  perfil: {
    title: 'Perfil e conta',
    description: 'Gerencie seus dados pessoais, foto, senha e preferências de acesso ao painel Kinito.',
    keywords: ['perfil usuário kinito', 'alterar senha kinito', 'dados pessoais painel'],
    category: 'Perfil',
  },
  fornecedores: {
    title: 'Fornecedores e marketplace',
    description: 'Escolha o fornecedor de corridas, alterne entre empresas parceiras ou ative o modo marketplace para receber de todos.',
    keywords: ['marketplace corridas', 'fornecedor transporte', 'modo todos kinito'],
    category: 'Fornecedores',
  },
  verifyEmail: {
    title: 'Confirmar e-mail',
    description: 'Validação do endereço de e-mail para ativar sua conta e acessar o painel Kinito.',
    keywords: ['confirmar email kinito', 'validação conta', 'ativar email'],
    category: 'Autenticação',
  },
  pendingVerification: {
    title: 'Verificação pendente',
    description: 'Um link de confirmação foi enviado para seu e-mail. Verifique sua caixa de entrada para continuar.',
    keywords: ['verificação email kinito', 'confirmar email', 'ativar conta'],
    category: 'Autenticação',
  },
  planSelection: {
    title: 'Escolher plano',
    description: 'Compare os planos Starter, Pro e Enterprise e inicie seu período de teste gratuito de 14 dias.',
    keywords: ['planos kinito', 'teste gratuito 14 dias', 'starter pro enterprise'],
    category: 'Planos',
  },
} satisfies Record<string, SeoPage>;

const landingClientPt: LandingClientCopy = {
  navTag: 'Corridas para você',
  tag: 'Mobilidade simples e segura',
  headline: 'Peça corridas com confiança',
  sub: 'Cadastre-se como cliente, solicite viagens e acompanhe motoristas parceiros da sua região — rápido, claro e sem complicação.',
  ctaPrimary: 'Criar conta gratuita',
  ctaSecondary: 'Já tenho conta',
  f1Title: 'Solicite em poucos toques',
  f1Desc: 'Informe origem e destino e acompanhe o status da corrida em tempo real.',
  f2Title: 'Motoristas verificados',
  f2Desc: 'Empresas parceiras validam documentos e mantêm a frota sob controle.',
  f3Title: 'Histórico na sua conta',
  f3Desc: 'Veja corridas anteriores, valores e preferências de endereços salvos.',
  faqTitle: 'Dúvidas frequentes',
  faq: [
    {
      q: 'O Kinito é um app de corridas para passageiros?',
      a: 'Sim. Passageiros (clientes) usam o Kinito para solicitar e acompanhar corridas com empresas e motoristas parceiros.',
    },
    {
      q: 'Como crio minha conta?',
      a: 'Toque em Criar conta, escolha o perfil Cliente, informe seus dados e confirme. Você já pode solicitar corridas.',
    },
    {
      q: 'Posso entrar com telefone?',
      a: 'Sim. O login aceita e-mail ou telefone cadastrado, além da senha.',
    },
  ],
  bizTitle: 'Você tem uma frota ou empresa de transporte?',
  bizDesc: 'Conheça o Kinito para empresas: despacho, motoristas, financeiro e WhatsApp em um só lugar.',
  bizCta: 'Sou empresa',
};

const landingEmpresaPt: LandingEmpresaCopy = {
  navTag: 'Para frotas e empresas',
  forClients: 'Sou passageiro',
  tag: 'SaaS de despacho e gestão de frota',
  headline: 'Opere corridas, frota e financeiro em um painel',
  sub: 'Despacho em tempo real, clientes, motoristas, parceiros, planos com trial de 14 dias e WhatsApp da empresa — feito para gestores de transporte.',
  ctaRegister: 'Cadastro empresarial',
  b1Title: 'Despacho operacional',
  b1Desc: 'Crie, atribua e acompanhe corridas com status claros para a equipe.',
  b2Title: 'Clientes e motoristas',
  b2Desc: 'Cadastre clientes, aprove motoristas e mantenha documentos sob controle.',
  b3Title: 'Financeiro e planos',
  b3Desc: 'Splits, repasses e assinatura com período de teste antes de cobrar.',
  b4Title: 'WhatsApp da empresa',
  b4Desc: 'Conecte o número da frota via gateway provisório até a API oficial.',
  proofTitle: 'Feito para operação diária',
  proofDesc:
    'Do pedido à finalização, o Kinito organiza a rotina da empresa: menos planilha, mais controle e rastreabilidade.',
  faqTitle: 'Perguntas de gestores (AEO)',
  faq: [
    {
      q: 'O que o Kinito oferece para minha empresa de transporte?',
      a: 'Painel multi-perfil para despacho de corridas, gestão de motoristas e clientes, financeiro e integração WhatsApp, com trial de 14 dias por plano.',
    },
    {
      q: 'Como funciona o período de teste?',
      a: 'Ao escolher um plano, sua empresa ganha 14 dias grátis. Depois, assina para continuar ativa no marketplace ou fica suspensa até pagar.',
    },
    {
      q: 'Como faço o cadastro empresarial?',
      a: 'Use o botão Cadastro empresarial, informe dados da empresa e CNPJ. O fluxo é separado do cadastro de cliente/motorista.',
    },
  ],
};

/** Lightweight EN/ES/IT overlays — keep structure identical */
export const landingExtras: Record<
  Language,
  { seo: typeof seoPt; landingClient: LandingClientCopy; landingEmpresa: LandingEmpresaCopy }
> = {
  pt: { seo: seoPt, landingClient: landingClientPt, landingEmpresa: landingEmpresaPt },
  en: {
    landingClient: {
      ...landingClientPt,
      navTag: 'Rides for you',
      tag: 'Simple, safe mobility',
      headline: 'Request rides with confidence',
      sub: 'Sign up as a rider, request trips and track partner drivers nearby — clear and hassle-free.',
      ctaPrimary: 'Create free account',
      ctaSecondary: 'I already have an account',
      f1Title: 'Request in a few taps',
      f1Desc: 'Enter pickup and drop-off and follow ride status in real time.',
      f2Title: 'Verified drivers',
      f2Desc: 'Partner companies validate documents and keep the fleet under control.',
      f3Title: 'History in your account',
      f3Desc: 'See past rides, amounts and saved address preferences.',
      faqTitle: 'Frequently asked questions',
      faq: [
        {
          q: 'Is Kinito a ride app for passengers?',
          a: 'Yes. Riders use Kinito to request and track trips with partner companies and drivers.',
        },
        {
          q: 'How do I create an account?',
          a: 'Tap Create account, choose Client, enter your details and confirm.',
        },
        {
          q: 'Can I sign in with phone?',
          a: 'Yes. Login accepts email or registered phone plus password.',
        },
      ],
      bizTitle: 'Do you run a fleet or transport company?',
      bizDesc: 'Discover Kinito for businesses: dispatch, drivers, finance and WhatsApp in one place.',
      bizCta: 'I am a company',
    },
    landingEmpresa: {
      ...landingEmpresaPt,
      navTag: 'For fleets and companies',
      forClients: 'I am a rider',
      tag: 'Fleet dispatch SaaS',
      headline: 'Run rides, fleet and finance in one panel',
      sub: 'Real-time dispatch, clients, drivers, partners, 14-day plan trials and company WhatsApp — built for transport managers.',
      ctaRegister: 'Business registration',
      b1Title: 'Operational dispatch',
      b1Desc: 'Create, assign and track rides with clear statuses for your team.',
      b2Title: 'Clients and drivers',
      b2Desc: 'Onboard clients, approve drivers and keep documents under control.',
      b3Title: 'Finance and plans',
      b3Desc: 'Splits, payouts and subscription with a trial before billing.',
      b4Title: 'Company WhatsApp',
      b4Desc: 'Connect the fleet number via provisional gateway until the official API.',
      proofTitle: 'Built for daily operations',
      proofDesc: 'From request to completion, Kinito organizes the company routine with more control and traceability.',
      faqTitle: 'Manager questions (AEO)',
      faq: [
        {
          q: 'What does Kinito offer my transport company?',
          a: 'A multi-role panel for ride dispatch, driver/client management, finance and WhatsApp, with a 14-day plan trial.',
        },
        {
          q: 'How does the trial work?',
          a: 'After choosing a plan you get 14 free days. Then subscribe to stay active on the marketplace or remain suspended until you pay.',
        },
        {
          q: 'How do I register my company?',
          a: 'Use Business registration, enter company data and tax ID. It is separate from rider/driver signup.',
        },
      ],
    },
    seo: {
      home: {
        title: 'Request a safe ride',
        description: 'Kinito connects you to trusted drivers. Request rides, track trips and travel with peace of mind.',
        keywords: ['request ride', 'transport app', 'kinito rider', 'safe ride'],
        category: 'Passenger mobility',
      },
      empresasLanding: {
        title: 'Fleet management and dispatch for companies',
        description: 'Kinito for companies: ride dispatch, drivers, clients, finance and WhatsApp. 14-day trial.',
        keywords: ['fleet management software', 'ride dispatch saas', 'kinito business'],
        category: 'Fleet SaaS',
      },
      login: {
        title: 'Sign in',
        description: 'Access Kinito with email or phone to manage rides, fleet or request trips.',
        keywords: ['kinito login'],
        category: 'Authentication',
      },
      register: {
        title: 'Rider or driver signup',
        description: 'Create your Kinito account as a rider or driver.',
        keywords: ['driver signup', 'rider signup'],
        category: 'Signup',
      },
      registerEmpresa: {
        title: 'Business registration',
        description: 'Register your fleet on Kinito and start a 14-day free trial.',
        keywords: ['fleet registration', 'transport saas trial'],
        category: 'Business signup',
      },
      dashboard: {
        title: 'Operations dashboard',
        description: 'Track active rides, available drivers and real-time performance indicators for your operation.',
        keywords: ['fleet dashboard', 'operations panel', 'transport KPIs', 'active rides'],
        category: 'Dashboard',
      },
      corridas: {
        title: 'Rides and dispatch',
        description: 'Manage requests, assign drivers, track status and full history of every fleet ride.',
        keywords: ['ride dispatch', 'assign driver', 'ride history', 'fleet management'],
        category: 'Operations',
      },
      clientes: {
        title: 'Client management',
        description: 'Register passengers, track trip history and manage preferences for each client.',
        keywords: ['transport clients', 'passenger registration', 'trip history'],
        category: 'Clients',
      },
      motoristas: {
        title: 'Driver management',
        description: 'Registration, document approval, availability control and driver performance tracking.',
        keywords: ['driver approval', 'fleet management', 'driver documents', 'availability control'],
        category: 'Drivers',
      },
      empresas: {
        title: 'Companies and partner fleets',
        description: 'Manage multiple companies, fleet partnerships and distributors with consolidated views.',
        keywords: ['partner fleets', 'multi-company fleet', 'fleet partnerships'],
        category: 'Companies',
      },
      financeiro: {
        title: 'Finance and payouts',
        description: 'Payment statements, commission splits, driver payouts and financial control for your operation.',
        keywords: ['driver payouts', 'commission split', 'fleet finance', 'automatic payout'],
        category: 'Finance',
      },
      relatorios: {
        title: 'Operational reports',
        description: 'Export ride reports, revenue, driver performance and consolidated indicators by period.',
        keywords: ['fleet reports', 'export statement', 'operational indicators', 'financial report'],
        category: 'Reports',
      },
      logs: {
        title: 'Logs and audit',
        description: 'Review system action history, audit trail and operational events for full traceability.',
        keywords: ['fleet audit logs', 'system operations', 'audit trail', 'event traceability'],
        category: 'Audit',
      },
      notificacoes: {
        title: 'Notification center',
        description: 'Track ride alerts, pending approvals and relevant updates for your operation in one place.',
        keywords: ['dispatch notifications', 'ride alerts', 'pending approvals', 'fleet notifications'],
        category: 'Notifications',
      },
      configuracoes: {
        title: 'Panel settings',
        description: 'Adjust subscription plan, WhatsApp integrations, ride model and general company preferences.',
        keywords: ['fleet settings', 'whatsapp integration', 'subscription plan', 'ride model'],
        category: 'Settings',
      },
      perfil: {
        title: 'Profile and account',
        description: 'Manage your personal data, photo, password and access preferences in the Kinito panel.',
        keywords: ['user profile', 'change password kinito', 'account settings'],
        category: 'Profile',
      },
      fornecedores: {
        title: 'Providers and marketplace',
        description: 'Choose your ride provider, switch between partner companies or enable marketplace mode to receive from all.',
        keywords: ['ride marketplace', 'transport provider', 'all mode kinito'],
        category: 'Providers',
      },
      verifyEmail: {
        title: 'Confirm email',
        description: 'Email address validation to activate your account and access the Kinito panel.',
        keywords: ['confirm email kinito', 'account validation', 'activate email'],
        category: 'Authentication',
      },
      pendingVerification: {
        title: 'Pending verification',
        description: 'A confirmation link has been sent to your email. Check your inbox to continue.',
        keywords: ['email verification kinito', 'confirm email', 'activate account'],
        category: 'Authentication',
      },
      planSelection: {
        title: 'Choose a plan',
        description: 'Compare the Starter, Pro and Enterprise plans and start your 14-day free trial.',
        keywords: ['kinito plans', '14-day free trial', 'starter pro enterprise'],
        category: 'Plans',
      },
    },
  },
  es: {
    seo: seoPt,
    landingClient: landingClientPt,
    landingEmpresa: landingEmpresaPt,
  },
  it: {
    seo: seoPt,
    landingClient: landingClientPt,
    landingEmpresa: landingEmpresaPt,
  },
};

// Improve ES/IT quickly with EN structure + PT fallback already set; overwrite ES/IT from EN keys adapted
landingExtras.es = {
  seo: landingExtras.en.seo,
  landingClient: {
    ...landingExtras.en.landingClient,
    navTag: 'Viajes para ti',
    tag: 'Movilidad simple y segura',
    headline: 'Pide viajes con confianza',
    sub: 'Regístrate como cliente, solicita viajes y sigue a conductores asociados cerca de ti.',
    ctaPrimary: 'Crear cuenta gratis',
    ctaSecondary: 'Ya tengo cuenta',
    faqTitle: 'Preguntas frecuentes',
    bizTitle: '¿Tienes una flota o empresa de transporte?',
    bizDesc: 'Conoce Kinito para empresas: despacho, conductores, finanzas y WhatsApp.',
    bizCta: 'Soy empresa',
  },
  landingEmpresa: {
    ...landingExtras.en.landingEmpresa,
    navTag: 'Para flotas y empresas',
    forClients: 'Soy pasajero',
    tag: 'SaaS de despacho y gestión de flota',
    headline: 'Opera viajes, flota y finanzas en un panel',
    ctaRegister: 'Registro empresarial',
    faqTitle: 'Preguntas de gestores (AEO)',
  },
};

landingExtras.it = {
  seo: landingExtras.en.seo,
  landingClient: {
    ...landingExtras.en.landingClient,
    navTag: 'Corse per te',
    tag: 'Mobilità semplice e sicura',
    headline: 'Richiedi corse con fiducia',
    sub: 'Registrati come cliente, richiedi corse e segui autisti partner nella tua zona.',
    ctaPrimary: 'Crea account gratuito',
    ctaSecondary: 'Ho già un account',
    faqTitle: 'Domande frequenti',
    bizTitle: 'Hai una flotta o un’azienda di trasporto?',
    bizDesc: 'Scopri Kinito per le aziende: dispatch, autisti, finance e WhatsApp.',
    bizCta: 'Sono un’azienda',
  },
  landingEmpresa: {
    ...landingExtras.en.landingEmpresa,
    navTag: 'Per flotte e aziende',
    forClients: 'Sono un passeggero',
    tag: 'SaaS di dispatch e gestione flotta',
    headline: 'Gestisci corse, flotta e finance in un pannello',
    ctaRegister: 'Registrazione aziendale',
    faqTitle: 'Domande per i manager (AEO)',
  },
};
