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
    description: 'Visão geral de corridas, frota e indicadores no painel Kinito.',
    keywords: ['dashboard frota', 'painel operacional corridas'],
    category: 'Painel',
  },
  corridas: {
    title: 'Corridas e despacho',
    description: 'Módulo de gestão e acompanhamento de corridas no Kinito.',
    keywords: ['gestão de corridas', 'despacho transporte'],
    category: 'Operações',
  },
  clientes: {
    title: 'Gestão de clientes',
    description: 'Módulo para cadastro e acompanhamento de clientes no Kinito.',
    keywords: ['gestão de clientes transporte'],
    category: 'Clientes',
  },
  motoristas: {
    title: 'Gestão de motoristas',
    description: 'Módulo de motoristas, documentos e aprovação no Kinito.',
    keywords: ['aprovação motoristas', 'gestão de frota'],
    category: 'Motoristas',
  },
  empresas: {
    title: 'Empresas e frotas',
    description: 'Módulo multi-empresa e frotas parceiras no Kinito.',
    keywords: ['multi empresa frota', 'parceiros transporte'],
    category: 'Empresas',
  },
  financeiro: {
    title: 'Financeiro e repasses',
    description: 'Módulo financeiro, splits e repasses no Kinito.',
    keywords: ['repasse motorista', 'financeiro frota'],
    category: 'Financeiro',
  },
  relatorios: {
    title: 'Relatórios',
    description: 'Central de relatórios operacionais e financeiros do Kinito.',
    keywords: ['relatórios frota', 'exportação corridas'],
    category: 'Relatórios',
  },
  logs: {
    title: 'Logs e auditoria',
    description: 'Trilha de auditoria e logs do sistema Kinito.',
    keywords: ['auditoria sistema frota', 'logs operações'],
    category: 'Auditoria',
  },
  notificacoes: {
    title: 'Notificações',
    description: 'Central de alertas e notificações do Kinito.',
    keywords: ['notificações despacho'],
    category: 'Notificações',
  },
  configuracoes: {
    title: 'Configurações',
    description: 'Preferências, planos, WhatsApp e ajustes do painel Kinito.',
    keywords: ['configurações frota', 'whatsapp empresa'],
    category: 'Configurações',
  },
  perfil: {
    title: 'Perfil e conta',
    description: 'Dados da conta e preferências do usuário no Kinito.',
    keywords: ['perfil usuário kinito'],
    category: 'Perfil',
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
        description: 'Overview of rides, fleet and KPIs in the Kinito panel.',
        keywords: ['fleet dashboard'],
        category: 'Dashboard',
      },
      corridas: {
        title: 'Rides and dispatch',
        description: 'Ride management module in Kinito.',
        keywords: ['ride dispatch'],
        category: 'Operations',
      },
      clientes: {
        title: 'Client management',
        description: 'Client onboarding and tracking module in Kinito.',
        keywords: ['transport clients'],
        category: 'Clients',
      },
      motoristas: {
        title: 'Driver management',
        description: 'Drivers, documents and approval in Kinito.',
        keywords: ['driver approval'],
        category: 'Drivers',
      },
      empresas: {
        title: 'Companies and fleets',
        description: 'Multi-company and partner fleets in Kinito.',
        keywords: ['partner fleets'],
        category: 'Companies',
      },
      financeiro: {
        title: 'Finance and payouts',
        description: 'Finance, splits and payouts in Kinito.',
        keywords: ['driver payouts'],
        category: 'Finance',
      },
      relatorios: {
        title: 'Reports',
        description: 'Operational and financial reports in Kinito.',
        keywords: ['fleet reports'],
        category: 'Reports',
      },
      logs: {
        title: 'Logs and audit',
        description: 'Audit trail and system logs in Kinito.',
        keywords: ['fleet audit logs'],
        category: 'Audit',
      },
      notificacoes: {
        title: 'Notifications',
        description: 'Alerts and notifications center in Kinito.',
        keywords: ['dispatch notifications'],
        category: 'Notifications',
      },
      configuracoes: {
        title: 'Settings',
        description: 'Plans, WhatsApp and panel preferences in Kinito.',
        keywords: ['fleet settings'],
        category: 'Settings',
      },
      perfil: {
        title: 'Profile and account',
        description: 'Account details and preferences in Kinito.',
        keywords: ['user profile'],
        category: 'Profile',
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
