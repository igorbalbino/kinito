import {
  Client,
  Company,
  Driver,
  FinancialTransaction,
  Ride,
  RideStatus,
  SystemAudit,
  SystemLog,
  SystemNotification,
} from '../types';

const CITIES = ['São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Curitiba, PR', 'Brasília, DF', 'Porto Alegre, RS', 'Salvador, BA'];

const NEIGHBORHOODS = [
  'Centro', 'Jardins', 'Pinheiros', 'Moema', 'Vila Madalena', 'Ipanema', 'Copacabana', 'Lourdes', 'Batel', 'Asa Sul', 'Moinhos de Vento'
];

const VEHICLES = [
  { model: 'Chevrolet Onix 1.0', color: 'Prata' },
  { model: 'Hyundai HB20 Comfort', color: 'Preto' },
  { model: 'Toyota Corolla XEi', color: 'Branco' },
  { model: 'Nissan Kicks SV', color: 'Cinza' },
  { model: 'Volkswagen Polo TSI', color: 'Vermelho' },
  { model: 'Fiat Cronos Precision', color: 'Azul' },
  { model: 'Jeep Renegade Longitude', color: 'Preto' },
  { model: 'Honda Civic EXL', color: 'Prata' },
];

const FIRST_NAMES = [
  'Gabriel', 'Lucas', 'Matheus', 'Pedro', 'Guilherme', 'Gustavo', 'Felipe', 'Rafael', 'Thiago', 'Bruno',
  'Ana', 'Juliana', 'Mariana', 'Camila', 'Beatriz', 'Larissa', 'Fernanda', 'Aline', 'Patricia', 'Amanda',
  'Rodrigo', 'Marcelo', 'Carlos', 'Eduardo', 'Leonardo', 'Renan', 'Diego', 'Vinicius', 'Alexandre', 'Daniel',
  'Isabela', 'Caroline', 'Leticia', 'Vanessa', 'Jessica', 'Natalia', 'Priscila', 'Renata', 'Bruna', 'Taís'
];

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
  'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
  'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas'
];

const COMPANY_NAMES = [
  'Veloce Logística & Transp', 'Express Fleets SP', 'TransMobilidade Brasil', 'Prime Executive Services',
  'MoveCorp Distribuidores', 'UltraFleet Urbana', 'Rotas Expressas S/A', 'Alfa Transp e Mobilidade',
  'Nexus Serviços de Corrida', 'Titanium Dispatch', 'ServCar Corporativo', 'ViaRápida Logística',
  'StarTaxi & Transfer', 'EcoTransMobilidade', 'TopLevel Chauffeurs'
];

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals = 2): number {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
}

// Generate 15 Companies
export const MOCK_COMPANIES: Company[] = COMPANY_NAMES.map((name, index) => {
  const id = `cmp-${index + 1}`;
  return {
    id,
    name,
    cnpj: `${getRandomInt(10, 99)}.${getRandomInt(100, 999)}.${getRandomInt(100, 999)}/0001-${getRandomInt(10, 99)}`,
    email: `contato@${name.toLowerCase().replace(/[^a-z]/g, '')}.com.br`,
    phone: `(11) 9${getRandomInt(1000, 9999)}-${getRandomInt(1000, 9999)}`,
    logo: `https://api.dicebear.com/7.x/identicon/svg?seed=${id}`,
    tier: index < 3 ? 'enterprise' : index < 8 ? 'pro' : 'starter',
    activeDrivers: getRandomInt(8, 35),
    totalRides: getRandomInt(120, 1800),
    monthlyRevenue: getRandomFloat(15000, 120000),
    commissionRate: getRandomInt(8, 15),
    joinedAt: new Date(Date.now() - getRandomInt(60, 365) * 86400000).toISOString(),
    collaborators: [
      { id: `col-${id}-1`, name: `${getRandom(FIRST_NAMES)} ${getRandom(LAST_NAMES)}`, email: `gerente@${name.toLowerCase().replace(/[^a-z]/g, '')}.com.br`, role: 'Dono' },
      { id: `col-${id}-2`, name: `${getRandom(FIRST_NAMES)} ${getRandom(LAST_NAMES)}`, email: `operacoes@${name.toLowerCase().replace(/[^a-z]/g, '')}.com.br`, role: 'Gerente de Frota' },
    ]
  };
});

// Generate 50 Drivers
export const MOCK_DRIVERS: Driver[] = Array.from({ length: 50 }, (_, i) => {
  const id = `drv-${i + 1}`;
  const firstName = getRandom(FIRST_NAMES);
  const lastName = getRandom(LAST_NAMES);
  const company = MOCK_COMPANIES[i % MOCK_COMPANIES.length];
  const vehicle = getRandom(VEHICLES);
  const statusList: Driver['status'][] = ['ativo', 'ativo', 'ativo', 'ativo', 'em_aprovacao', 'indisponivel', 'bloqueado'];
  const status = statusList[i % statusList.length];

  return {
    id,
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@motorista.com`,
    phone: `(11) 9${getRandomInt(1000, 9999)}-${getRandomInt(1000, 9999)}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    companyId: company.id,
    companyName: company.name,
    status,
    vehicleModel: vehicle.model,
    vehiclePlate: `${String.fromCharCode(65 + getRandomInt(0, 25))}${String.fromCharCode(65 + getRandomInt(0, 25))}${String.fromCharCode(65 + getRandomInt(0, 25))}-${getRandomInt(1, 9)}${String.fromCharCode(65 + getRandomInt(0, 25))}${getRandomInt(10, 99)}`,
    vehicleColor: vehicle.color,
    rating: getRandomFloat(4.2, 5.0, 1),
    totalRides: getRandomInt(15, 420),
    totalEarnings: getRandomFloat(1200, 28000),
    pendingBalance: getRandomFloat(150, 2400),
    city: getRandom(CITIES),
    joinedAt: new Date(Date.now() - getRandomInt(10, 180) * 86400000).toISOString(),
    documents: [
      { id: `doc-${id}-cnh`, name: 'CNH Categoria B/EAR', status: status === 'em_aprovacao' ? 'pendente' : 'aprovado', uploadedAt: '2026-01-10', expiresAt: '2028-05-20' },
      { id: `doc-${id}-crlv`, name: 'CRLV Anual do Veículo', status: 'aprovado', uploadedAt: '2026-01-12', expiresAt: '2027-02-15' },
      { id: `doc-${id}-antecedentes`, name: 'Atestado de Antecedentes', status: 'aprovado', uploadedAt: '2026-01-11', expiresAt: '2026-12-31' },
      { id: `doc-${id}-vistoria`, name: 'Laudo de Vistoria Veicular', status: status === 'em_aprovacao' ? 'pendente' : 'aprovado', uploadedAt: '2026-01-15', expiresAt: '2027-01-15' },
    ]
  };
});

// Generate 100 Clients
export const MOCK_CLIENTS: Client[] = Array.from({ length: 100 }, (_, i) => {
  const id = `cli-${i + 1}`;
  const firstName = getRandom(FIRST_NAMES);
  const lastName = getRandom(LAST_NAMES);
  const hasCorporate = i % 3 === 0;
  const company = hasCorporate ? MOCK_COMPANIES[i % MOCK_COMPANIES.length] : undefined;

  return {
    id,
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@gmail.com`,
    phone: `(11) 9${getRandomInt(1000, 9999)}-${getRandomInt(1000, 9999)}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    companyId: company?.id,
    companyName: company?.name,
    status: i % 15 === 0 ? 'suspenso' : i % 7 === 0 ? 'vip' : 'ativo',
    totalRides: getRandomInt(3, 85),
    totalSpent: getRandomFloat(120, 6800),
    rating: getRandomFloat(4.3, 5.0, 1),
    createdAt: new Date(Date.now() - getRandomInt(1, 200) * 86400000).toISOString(),
    favoriteAddresses: [
      `Av. Paulista, ${getRandomInt(100, 2000)} - ${getRandom(NEIGHBORHOODS)}`,
      `Rua Faria Lima, ${getRandomInt(50, 1500)} - ${getRandom(NEIGHBORHOODS)}`,
      `Aeroporto Internacional - Terminal ${getRandomInt(1, 3)}`
    ]
  };
});

// Generate 500 Rides
export const MOCK_RIDES: Ride[] = Array.from({ length: 500 }, (_, i) => {
  const id = `rd-${i + 1}`;
  const code = `COR-${100000 + i}`;
  const client = MOCK_CLIENTS[i % MOCK_CLIENTS.length];
  const driver = MOCK_DRIVERS[i % MOCK_DRIVERS.length];
  const company = MOCK_COMPANIES[i % MOCK_COMPANIES.length];

  const city = getRandom(CITIES);
  const originNeigh = getRandom(NEIGHBORHOODS);
  const destNeigh = getRandom(NEIGHBORHOODS);

  const statuses: RideStatus[] = [
    'concluida', 'concluida', 'concluida', 'concluida', 'concluida',
    'em_andamento', 'atribuida', 'pendente', 'cancelada'
  ];
  const status = i < 15 ? (i % 3 === 0 ? 'em_andamento' : i % 3 === 1 ? 'pendente' : 'atribuida') : getRandom(statuses);

  const distanceKm = getRandomFloat(2.5, 42.0, 1);
  const durationMin = Math.round(distanceKm * getRandomFloat(2.2, 3.8));
  
  const grossValue = parseFloat((12.50 + distanceKm * 3.40 + durationMin * 0.45).toFixed(2));
  const stripeFee = parseFloat((grossValue * 0.039 + 0.50).toFixed(2));
  const platformCommission = parseFloat((grossValue * 0.15).toFixed(2));
  const companyCut = parseFloat((grossValue * 0.10).toFixed(2));
  const driverNet = parseFloat((grossValue - stripeFee - platformCommission - companyCut).toFixed(2));

  // Timestamps spread across last 30 days
  const hoursAgo = (500 - i) * 1.4;
  const requestedDate = new Date(Date.now() - hoursAgo * 3600000);
  const requestedAt = requestedDate.toISOString();

  let startedAt: string | undefined;
  let completedAt: string | undefined;
  let cancelledAt: string | undefined;

  if (status === 'em_andamento' || status === 'concluida') {
    startedAt = new Date(requestedDate.getTime() + 4 * 60000).toISOString();
  }
  if (status === 'concluida') {
    completedAt = new Date(requestedDate.getTime() + (durationMin + 5) * 60000).toISOString();
  }
  if (status === 'cancelada') {
    cancelledAt = new Date(requestedDate.getTime() + 2 * 60000).toISOString();
  }

  const paymentMethods: Ride['paymentMethod'][] = ['credit_card', 'credit_card', 'pix', 'faturado', 'dinheiro'];
  const paymentMethod = getRandom(paymentMethods);

  return {
    id,
    code,
    clientId: client.id,
    clientName: client.name,
    clientPhone: client.phone,
    clientAvatar: client.avatar,
    driverId: status !== 'pendente' ? driver.id : undefined,
    driverName: status !== 'pendente' ? driver.name : undefined,
    driverPhone: status !== 'pendente' ? driver.phone : undefined,
    driverAvatar: status !== 'pendente' ? driver.avatar : undefined,
    driverVehicle: status !== 'pendente' ? `${driver.vehicleModel} (${driver.vehiclePlate})` : undefined,
    companyId: company.id,
    companyName: company.name,
    origin: {
      address: `Rua ${getRandom(LAST_NAMES)}, ${getRandomInt(10, 800)} - ${originNeigh}`,
      lat: -23.5505 + (Math.random() - 0.5) * 0.1,
      lng: -46.6333 + (Math.random() - 0.5) * 0.1,
      city,
      neighborhood: originNeigh
    },
    destination: {
      address: `Av. ${getRandom(LAST_NAMES)}, ${getRandomInt(50, 2500)} - ${destNeigh}`,
      lat: -23.5505 + (Math.random() - 0.5) * 0.1,
      lng: -46.6333 + (Math.random() - 0.5) * 0.1,
      city,
      neighborhood: destNeigh
    },
    distanceKm,
    durationMin,
    status,
    requestedAt,
    startedAt,
    completedAt,
    cancelledAt,
    cancellationReason: status === 'cancelada' ? getRandom(['Cliente desistiu', 'Sem motoristas na região', 'Motorista teve imprevisto', 'Endereço incorreto']) : undefined,
    grossValue,
    stripeFee,
    platformCommission,
    companyCut,
    driverNet,
    paymentMethod,
    paymentStatus: status === 'concluida' ? 'pago' : status === 'cancelada' ? 'estornado' : 'pendente',
    stripeWebhookReceived: status === 'concluida' || status === 'em_andamento',
    rating: status === 'concluida' ? getRandomInt(4, 5) : undefined,
  };
});

// Generate Financial Transactions
export const MOCK_TRANSACTIONS: FinancialTransaction[] = MOCK_RIDES.slice(0, 80).map((ride) => {
  return {
    id: `tx-${ride.id}`,
    code: `TX-${ride.code}`,
    rideId: ride.id,
    type: 'corrida',
    amount: ride.grossValue,
    grossValue: ride.grossValue,
    platformFee: ride.platformCommission,
    companyFee: ride.companyCut,
    driverFee: ride.driverNet,
    stripeFee: ride.stripeFee,
    status: ride.paymentStatus === 'pago' ? 'confirmado' : ride.paymentStatus === 'estornado' ? 'falhou' : 'pendente',
    paymentMode: 'stripe',
    sender: ride.clientName,
    recipient: ride.driverName || ride.companyName,
    createdAt: ride.requestedAt,
    description: `Pagamento da corrida ${ride.code} (${ride.distanceKm}km)`
  };
});

// Add extra payout transactions
MOCK_COMPANIES.slice(0, 5).forEach((company, i) => {
  MOCK_TRANSACTIONS.unshift({
    id: `tx-payout-${i}`,
    code: `PAY-${3000 + i}`,
    type: 'repasse',
    amount: getRandomFloat(3500, 18000),
    status: 'confirmado',
    paymentMode: 'stripe',
    sender: 'Plataforma FleetPulse',
    recipient: company.name,
    createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    description: `Repasse quinzenal de ganhos líquidos para ${company.name}`
  });
});

// Generate System Audit & Logs
export const MOCK_LOGS: SystemLog[] = [
  {
    id: 'log-101',
    timestamp: new Date().toISOString(),
    level: 'info',
    category: 'stripe',
    message: 'Webhook recebido com sucesso: charge.succeeded (ch_3M009X2eZvKYLO2C)',
    actor: 'Stripe Webhook Gateway',
    role: 'admin',
    ip: '54.187.205.12',
    details: { event: 'charge.succeeded', amount: 84.50, currency: 'brl' }
  },
  {
    id: 'log-102',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    level: 'info',
    category: 'corrida',
    message: 'Corrida COR-100499 iniciada pelo motorista Gabriel Silva',
    actor: 'Gabriel Silva',
    role: 'motorista',
    ip: '177.138.92.10',
  },
  {
    id: 'log-103',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    level: 'security',
    category: 'auth',
    message: 'Alteração de Feature Flags: Stripe Mode alternado para Ativo',
    actor: 'Administrador Master',
    role: 'admin',
    ip: '201.82.14.99',
  },
  {
    id: 'log-104',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    level: 'warning',
    category: 'financeiro',
    message: 'Solicitação de repasse manual acima do limite padrão (R$ 15.400,00)',
    actor: 'Veloce Logística',
    role: 'empresa',
    ip: '189.40.11.23',
  },
  {
    id: 'log-105',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    level: 'info',
    category: 'motorista',
    message: 'Documento CNH aprovado para o motorista Lucas Santos',
    actor: 'Gerente de Frotas SP',
    role: 'empresa',
    ip: '177.92.100.4',
  }
];

export const MOCK_AUDITS: SystemAudit[] = [
  {
    id: 'aud-1',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    action: 'UPDATE_FEATURE_FLAG',
    user: 'admin@fleetpulse.com',
    role: 'admin',
    targetResource: 'CONFIG_FLAGS/stripeMode',
    previousValue: 'manual',
    newValue: 'stripe',
    ip: '201.82.14.99'
  },
  {
    id: 'aud-2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    action: 'APPROVE_DRIVER_DOCS',
    user: 'admin@fleetpulse.com',
    role: 'admin',
    targetResource: 'DRIVER/drv-4',
    previousValue: 'em_aprovacao',
    newValue: 'ativo',
    ip: '201.82.14.99'
  },
  {
    id: 'aud-3',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    action: 'REASSIGN_RIDE',
    user: 'gerente@velocelog.com',
    role: 'empresa',
    targetResource: 'RIDE/COR-100450',
    previousValue: 'drv-2',
    newValue: 'drv-8',
    ip: '189.40.11.23'
  }
];

export const MOCK_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-1',
    title: 'Nova Corrida Solicitada',
    message: 'O cliente Lucas Santos solicitou uma corrida VIP em Pinheiros, São Paulo.',
    timestamp: new Date().toISOString(),
    category: 'corrida',
    read: false,
    type: 'info'
  },
  {
    id: 'notif-2',
    title: 'Pagamento Confirmado (Stripe)',
    message: 'O pagamento de R$ 124,50 da corrida COR-100498 foi confirmado via Webhook.',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    category: 'financeiro',
    read: false,
    type: 'success'
  },
  {
    id: 'notif-3',
    title: 'Documento Pendente de Análise',
    message: 'O motorista Matheus Oliveira enviou novo documento de Vistoria Veicular.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    category: 'motorista',
    read: true,
    type: 'warning'
  },
  {
    id: 'notif-4',
    title: 'Modo do Sistema Alterado',
    message: 'O processamento financeiro foi configurado para o modo Stripe Automático.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    category: 'sistema',
    read: true,
    type: 'info'
  }
];
