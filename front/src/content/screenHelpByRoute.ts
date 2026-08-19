export type ScreenHelpContent = {
  title: string;
  summary: string;
  fields: string[];
  buttons: string[];
  quickFlow: string[];
};

const defaultOps: ScreenHelpContent = {
  title: 'Ajuda da tela',
  summary: 'Use os filtros no topo, confira os cards e abra detalhes para executar ações com segurança.',
  fields: [
    'Filtros refinam os resultados sem perder o contexto da operação.',
    'Status e indicadores mostram a situação atual em tempo real.',
  ],
  buttons: [
    'Ações principais ficam destacadas na parte superior.',
    'Ações secundárias aparecem em tabelas, cards e modais de detalhe.',
  ],
  quickFlow: [
    '1. Filtre os dados.',
    '2. Abra o item que deseja operar.',
    '3. Execute a ação e valide o status atualizado.',
  ],
};

export const screenHelpByRoute: Record<string, ScreenHelpContent> = {
  '/dashboard': {
    title: 'Painel operacional',
    summary: 'Acompanhe indicadores, corridas recentes e atalhos de ação para cada perfil.',
    fields: ['Cards de métricas mostram volume, ganhos e status da operação.', 'Listas de corridas exibem código, rota, status e valores permitidos por perfil.'],
    buttons: ['Nova Corrida abre o fluxo de solicitação.', 'Ver / Ver detalhes abre modal com ações de corrida.'],
    quickFlow: ['1. Confira métricas.', '2. Abra a corrida ativa.', '3. Inicie ou conclua conforme o status permitido.'],
  },
  '/corridas': {
    title: 'Corridas e despacho',
    summary: 'Gerencie solicitações, acompanhe status e opere corridas em tabela, cards ou timeline.',
    fields: ['Busca localiza por código, cliente, motorista e endereço.', 'Filtros de status e pagamento segmentam a fila operacional.'],
    buttons: ['Toggle alterna visualização de tabela, cards e timeline.', 'Detalhes abre o modal completo da corrida.'],
    quickFlow: ['1. Filtre a corrida.', '2. Abra detalhes.', '3. Execute iniciar, concluir, cancelar ou reatribuir quando disponível.'],
  },
  '/clientes': {
    ...defaultOps,
    title: 'Gestão de clientes',
    summary: 'Cadastre e acompanhe clientes com histórico e informações de contato.',
  },
  '/motoristas': {
    ...defaultOps,
    title: 'Gestão de motoristas',
    summary: 'Aprove documentos, ative ou bloqueie motoristas e acompanhe ganhos e disponibilidade.',
  },
  '/empresas': {
    ...defaultOps,
    title: 'Empresas e frotas',
    summary: 'Administre empresas, vínculos e visão consolidada da operação.',
  },
  '/financeiro': {
    ...defaultOps,
    title: 'Financeiro e repasses',
    summary: 'Analise transações, saldos e repasses com filtros por tipo e período.',
  },
  '/relatorios': {
    ...defaultOps,
    title: 'Relatórios operacionais',
    summary: 'Exporte relatórios de desempenho, corridas e visão financeira consolidada.',
  },
  '/logs': {
    ...defaultOps,
    title: 'Logs e auditoria',
    summary: 'Consulte eventos do sistema e trilha de auditoria para rastreabilidade.',
  },
  '/notificacoes': {
    ...defaultOps,
    title: 'Central de notificações',
    summary: 'Acompanhe alertas operacionais, confirmações e pendências em um único lugar.',
  },
  '/perfil': {
    ...defaultOps,
    title: 'Perfil e conta',
    summary: 'Atualize dados pessoais, preferências e informações de acesso.',
  },
  '/configuracoes': {
    ...defaultOps,
    title: 'Configurações do painel',
    summary: 'Ajuste integrações, plano, comportamento do despacho e preferências gerais.',
  },
  '/fornecedores': {
    title: 'Fornecedores e marketplace',
    summary: 'Defina o fornecedor padrão ou ative modo marketplace de acordo com seu perfil.',
    fields: [
      'Modo atual mostra se você está vinculado a uma empresa específica ou a todos.',
      'Lista exibe fornecedores disponíveis e modelo de corrida de cada um.',
    ],
    buttons: [
      'Todos / marketplace ativa recebimento ou escolha ampla de corridas.',
      'Selecionar empresa define fornecedor principal para novas corridas.',
    ],
    quickFlow: ['1. Verifique o modo atual.', '2. Escolha marketplace ou empresa.', '3. Confirme mensagem de sucesso no topo da tela.'],
  },
};
