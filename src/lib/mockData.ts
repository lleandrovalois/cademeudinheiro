import { Category, Transaction, RecurringBill, InstallmentPurchase, Budget, SavingsGoal } from '../types/finance';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-salario', name: 'Salário & Renda', icon: 'Briefcase', color: '#10B981', type: 'income' },
  { id: 'cat-freelance', name: 'Freelance & Extras', icon: 'Sparkles', color: '#06B6D4', type: 'income' },
  { id: 'cat-invest', name: 'Rendimentos & Dividendos', icon: 'TrendingUp', color: '#8B5CF6', type: 'income' },
  { id: 'cat-moradia', name: 'Moradia & Contas', icon: 'Home', color: '#6366F1', type: 'expense' },
  { id: 'cat-alimentacao', name: 'Alimentação & Mercado', icon: 'Utensils', color: '#F59E0B', type: 'expense' },
  { id: 'cat-transporte', name: 'Transporte & Combustível', icon: 'Car', color: '#EC4899', type: 'expense' },
  { id: 'cat-saude', name: 'Saúde & Bem-estar', icon: 'HeartPulse', color: '#EF4444', type: 'expense' },
  { id: 'cat-lazer', name: 'Lazer & Entretenimento', icon: 'Film', color: '#A855F7', type: 'expense' },
  { id: 'cat-compras', name: 'Compras & Shopping', icon: 'ShoppingBag', color: '#3B82F6', type: 'expense' },
  { id: 'cat-educacao', name: 'Educação & Cursos', icon: 'GraduationCap', color: '#14B8A6', type: 'expense' },
  { id: 'cat-outros', name: 'Outros', icon: 'MoreHorizontal', color: '#64748B', type: 'both' }
];

// Helper to get current and recent month strings
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
const curMonthStr = `${currentYear}-${currentMonth}`;

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    description: 'Salário Mensal Tech Corp',
    amount: 8500.00,
    type: 'income',
    category: 'Salário & Renda',
    date: `${curMonthStr}-05`,
    paymentMethod: 'bank_transfer',
    status: 'paid',
    notes: 'Depósito em conta corrente',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-2',
    description: 'Projeto UI/UX Freelance',
    amount: 2200.00,
    type: 'income',
    category: 'Freelance & Extras',
    date: `${curMonthStr}-12`,
    paymentMethod: 'pix',
    status: 'paid',
    notes: 'Design de Landing Page',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-3',
    description: 'Rendimentos Tesouro Direto & FIIs',
    amount: 345.80,
    type: 'income',
    category: 'Rendimentos & Dividendos',
    date: `${curMonthStr}-15`,
    paymentMethod: 'bank_transfer',
    status: 'paid',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-4',
    description: 'Aluguel do Apartamento',
    amount: 2400.00,
    type: 'expense',
    category: 'Moradia & Contas',
    date: `${curMonthStr}-08`,
    paymentMethod: 'pix',
    status: 'paid',
    notes: 'Boleto imobiliária pago via PIX',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-5',
    description: 'Supermercado Pão de Açúcar',
    amount: 684.50,
    type: 'expense',
    category: 'Alimentação & Mercado',
    date: `${curMonthStr}-09`,
    paymentMethod: 'credit_card',
    status: 'paid',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-6',
    description: 'Abastecimento Shell V-Power',
    amount: 230.00,
    type: 'expense',
    category: 'Transporte & Combustível',
    date: `${curMonthStr}-11`,
    paymentMethod: 'debit_card',
    status: 'paid',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-7',
    description: 'Jantar Restaurante Japonês',
    amount: 195.00,
    type: 'expense',
    category: 'Alimentação & Mercado',
    date: `${curMonthStr}-14`,
    paymentMethod: 'credit_card',
    status: 'paid',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-8',
    description: 'Farmácia Droga Raia',
    amount: 142.30,
    type: 'expense',
    category: 'Saúde & Bem-estar',
    date: `${curMonthStr}-16`,
    paymentMethod: 'pix',
    status: 'paid',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-9',
    description: 'Cinema & Streaming',
    amount: 88.00,
    type: 'expense',
    category: 'Lazer & Entretenimento',
    date: `${curMonthStr}-18`,
    paymentMethod: 'credit_card',
    status: 'paid',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-10',
    description: 'Feira Orgânica de Domingo',
    amount: 115.00,
    type: 'expense',
    category: 'Alimentação & Mercado',
    date: `${curMonthStr}-20`,
    paymentMethod: 'pix',
    status: 'paid',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-11',
    description: 'Plano de Saúde Unimed',
    amount: 490.00,
    type: 'expense',
    category: 'Saúde & Bem-estar',
    date: `${curMonthStr}-25`,
    paymentMethod: 'bank_slip',
    status: 'pending',
    notes: 'Vence no final do mês',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-12',
    description: 'Fatura Cartão Nubank - Parcela iPhone',
    amount: 459.90,
    type: 'expense',
    category: 'Compras & Shopping',
    date: `${curMonthStr}-22`,
    paymentMethod: 'credit_card',
    status: 'pending',
    notes: 'Parcela 4/10',
    createdAt: new Date().toISOString()
  }
];

export const DEFAULT_RECURRING_BILLS: RecurringBill[] = [
  {
    id: 'rec-1',
    title: 'Aluguel & Condomínio',
    amount: 2400.00,
    category: 'Moradia & Contas',
    dueDay: 8,
    frequency: 'monthly',
    active: true,
    paidMonths: [curMonthStr],
    notes: 'Transferir dia 8 de cada mês',
    createdAt: new Date().toISOString()
  },
  {
    id: 'rec-2',
    title: 'Internet Fibra Óptica 500MB',
    amount: 129.90,
    category: 'Moradia & Contas',
    dueDay: 15,
    frequency: 'monthly',
    active: true,
    paidMonths: [curMonthStr],
    createdAt: new Date().toISOString()
  },
  {
    id: 'rec-3',
    title: 'Academia Smart Fit',
    amount: 139.90,
    category: 'Saúde & Bem-estar',
    dueDay: 10,
    frequency: 'monthly',
    active: true,
    paidMonths: [curMonthStr],
    createdAt: new Date().toISOString()
  },
  {
    id: 'rec-4',
    title: 'Plano de Saúde',
    amount: 490.00,
    category: 'Saúde & Bem-estar',
    dueDay: 25,
    frequency: 'monthly',
    active: true,
    paidMonths: [], // Not paid this month yet
    createdAt: new Date().toISOString()
  },
  {
    id: 'rec-5',
    title: 'Assinatura Spotify Family',
    amount: 34.90,
    category: 'Lazer & Entretenimento',
    dueDay: 18,
    frequency: 'monthly',
    active: true,
    paidMonths: [curMonthStr],
    createdAt: new Date().toISOString()
  },
  {
    id: 'rec-6',
    title: 'Netflix 4K Premium',
    amount: 55.90,
    category: 'Lazer & Entretenimento',
    dueDay: 21,
    frequency: 'monthly',
    active: true,
    paidMonths: [],
    createdAt: new Date().toISOString()
  }
];

export const DEFAULT_INSTALLMENTS: InstallmentPurchase[] = [
  {
    id: 'inst-1',
    description: 'Smartphone iPhone 15 Pro 256GB',
    totalAmount: 4599.00,
    installmentAmount: 459.90,
    totalInstallments: 10,
    paidInstallments: 4,
    startDate: `${currentYear}-06-15`,
    category: 'Compras & Shopping',
    paymentCard: 'Nubank Ultravioleta',
    notes: 'Comprado na Amazon com cashback',
    createdAt: new Date().toISOString()
  },
  {
    id: 'inst-2',
    description: 'Notebook Dell Inspiron i7 16GB',
    totalAmount: 3800.00,
    installmentAmount: 380.00,
    totalInstallments: 10,
    paidInstallments: 7,
    startDate: `${currentYear}-03-10`,
    category: 'Educação & Cursos',
    paymentCard: 'Itaú Personalité',
    notes: 'Para estudos e trabalho freelance',
    createdAt: new Date().toISOString()
  },
  {
    id: 'inst-3',
    description: 'Passagens Aéreas Férias Salvador',
    totalAmount: 1680.00,
    installmentAmount: 280.00,
    totalInstallments: 6,
    paidInstallments: 2,
    startDate: `${currentYear}-08-05`,
    category: 'Lazer & Entretenimento',
    paymentCard: 'C6 Carbon Black',
    createdAt: new Date().toISOString()
  },
  {
    id: 'inst-4',
    description: 'Revisão e Troca de Pneus do Carro',
    totalAmount: 1400.00,
    installmentAmount: 350.00,
    totalInstallments: 4,
    paidInstallments: 4,
    startDate: `${currentYear}-05-20`,
    category: 'Transporte & Combustível',
    paymentCard: 'Nubank Ultravioleta',
    notes: 'Parcelamento concluído com sucesso!',
    createdAt: new Date().toISOString()
  }
];

export const DEFAULT_BUDGETS: Budget[] = [
  { id: 'bdg-1', category: 'Alimentação & Mercado', monthlyLimit: 1400.00, month: curMonthStr },
  { id: 'bdg-2', category: 'Moradia & Contas', monthlyLimit: 2800.00, month: curMonthStr },
  { id: 'bdg-3', category: 'Transporte & Combustível', monthlyLimit: 500.00, month: curMonthStr },
  { id: 'bdg-4', category: 'Lazer & Entretenimento', monthlyLimit: 450.00, month: curMonthStr },
  { id: 'bdg-5', category: 'Compras & Shopping', monthlyLimit: 700.00, month: curMonthStr }
];

export const DEFAULT_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    title: 'Reserva de Emergência (6 Meses)',
    targetAmount: 25000.00,
    currentAmount: 18450.00,
    deadline: `${currentYear + 1}-03-31`,
    color: '#10B981',
    icon: 'ShieldCheck'
  },
  {
    id: 'goal-2',
    title: 'Viagem de Férias & Réveillon',
    targetAmount: 6000.00,
    currentAmount: 4350.00,
    deadline: `${currentYear}-12-20`,
    color: '#3B82F6',
    icon: 'Plane'
  },
  {
    id: 'goal-3',
    title: 'Troca de Carro / Entrada Imóvel',
    targetAmount: 50000.00,
    currentAmount: 14200.00,
    deadline: `${currentYear + 2}-12-31`,
    color: '#8B5CF6',
    icon: 'Car'
  }
];
