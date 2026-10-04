import { 
  Transaction, 
  Category, 
  RecurringBill, 
  InstallmentPurchase, 
  Budget, 
  SavingsGoal, 
  FinancialSummary 
} from '../types/finance';
import { 
  DEFAULT_CATEGORIES, 
  DEFAULT_TRANSACTIONS, 
  DEFAULT_RECURRING_BILLS, 
  DEFAULT_INSTALLMENTS, 
  DEFAULT_BUDGETS, 
  DEFAULT_GOALS 
} from './mockData';
import { getSupabaseClient } from './supabaseClient';

const STORAGE_KEYS = {
  TRANSACTIONS: 'fincontrol_transactions',
  CATEGORIES: 'fincontrol_categories',
  RECURRING_BILLS: 'fincontrol_recurring_bills',
  INSTALLMENTS: 'fincontrol_installments',
  BUDGETS: 'fincontrol_budgets',
  GOALS: 'fincontrol_goals',
  INITIALIZED: 'fincontrol_initialized_v1'
};

export interface AppDataState {
  transactions: Transaction[];
  categories: Category[];
  recurringBills: RecurringBill[];
  installments: InstallmentPurchase[];
  budgets: Budget[];
  goals: SavingsGoal[];
  isCloudConnected: boolean;
}

export function initializeStorage(): AppDataState {
  if (typeof window === 'undefined') {
    return {
      transactions: DEFAULT_TRANSACTIONS,
      categories: DEFAULT_CATEGORIES,
      recurringBills: DEFAULT_RECURRING_BILLS,
      installments: DEFAULT_INSTALLMENTS,
      budgets: DEFAULT_BUDGETS,
      goals: DEFAULT_GOALS,
      isCloudConnected: false
    };
  }

  const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!isInitialized) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(DEFAULT_TRANSACTIONS));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.RECURRING_BILLS, JSON.stringify(DEFAULT_RECURRING_BILLS));
    localStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(DEFAULT_INSTALLMENTS));
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(DEFAULT_BUDGETS));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(DEFAULT_GOALS));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  const transactions = safeParse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS), DEFAULT_TRANSACTIONS);
  const categories = safeParse(localStorage.getItem(STORAGE_KEYS.CATEGORIES), DEFAULT_CATEGORIES);
  const recurringBills = safeParse(localStorage.getItem(STORAGE_KEYS.RECURRING_BILLS), DEFAULT_RECURRING_BILLS);
  const installments = safeParse(localStorage.getItem(STORAGE_KEYS.INSTALLMENTS), DEFAULT_INSTALLMENTS);
  const budgets = safeParse(localStorage.getItem(STORAGE_KEYS.BUDGETS), DEFAULT_BUDGETS);
  const goals = safeParse(localStorage.getItem(STORAGE_KEYS.GOALS), DEFAULT_GOALS);

  return {
    transactions,
    categories,
    recurringBills,
    installments,
    budgets,
    goals,
    isCloudConnected: Boolean(getSupabaseClient())
  };
}

function safeParse<T>(jsonStr: string | null, fallback: T): T {
  if (!jsonStr) return fallback;
  try {
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    console.error('Falha ao decodificar JSON do storage:', err);
    return fallback;
  }
}

// Local Storage update helpers
export function persistLocalData(key: string, data: unknown) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

export function saveTransactionsLocal(txs: Transaction[]) {
  persistLocalData(STORAGE_KEYS.TRANSACTIONS, txs);
}

export function saveRecurringBillsLocal(bills: RecurringBill[]) {
  persistLocalData(STORAGE_KEYS.RECURRING_BILLS, bills);
}

export function saveInstallmentsLocal(insts: InstallmentPurchase[]) {
  persistLocalData(STORAGE_KEYS.INSTALLMENTS, insts);
}

export function saveBudgetsLocal(budgets: Budget[]) {
  persistLocalData(STORAGE_KEYS.BUDGETS, budgets);
}

export function saveGoalsLocal(goals: SavingsGoal[]) {
  persistLocalData(STORAGE_KEYS.GOALS, goals);
}

export function resetAllDataToDefault(): AppDataState {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(DEFAULT_TRANSACTIONS));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.RECURRING_BILLS, JSON.stringify(DEFAULT_RECURRING_BILLS));
    localStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(DEFAULT_INSTALLMENTS));
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(DEFAULT_BUDGETS));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(DEFAULT_GOALS));
  }

  return {
    transactions: DEFAULT_TRANSACTIONS,
    categories: DEFAULT_CATEGORIES,
    recurringBills: DEFAULT_RECURRING_BILLS,
    installments: DEFAULT_INSTALLMENTS,
    budgets: DEFAULT_BUDGETS,
    goals: DEFAULT_GOALS,
    isCloudConnected: Boolean(getSupabaseClient())
  };
}

// Supabase synchronization helpers
export async function syncWithSupabase(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Supabase não configurado. Ative a conexão nas configurações.' };
  }

  try {
    // Attempt fetching transactions
    const { data: remoteTxs, error: txError } = await supabase.from('transactions').select('*');
    if (txError) {
      return { success: false, message: `Erro ao buscar dados remotos: ${txError.message}` };
    }

    return { 
      success: true, 
      message: `Conectado com sucesso ao Supabase! (${remoteTxs?.length || 0} registros remotos encontrados)` 
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Falha na conexão com Supabase';
    return { success: false, message: errorMsg };
  }
}

// Financial calculation helper for current selected month
export function calculateMonthlySummary(transactions: Transaction[], selectedMonth: string): FinancialSummary {
  // selectedMonth format 'YYYY-MM'
  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));

  let monthlyIncome = 0;
  let monthlyExpense = 0;
  let pendingIncome = 0;
  let pendingExpense = 0;

  monthTransactions.forEach(t => {
    if (t.type === 'income') {
      if (t.status === 'paid') monthlyIncome += t.amount;
      else pendingIncome += t.amount;
    } else {
      if (t.status === 'paid') monthlyExpense += t.amount;
      else pendingExpense += t.amount;
    }
  });

  // Total balance takes into account all completed transactions up to today
  let totalBalance = 0;
  transactions.forEach(t => {
    if (t.status === 'paid') {
      if (t.type === 'income') totalBalance += t.amount;
      else totalBalance -= t.amount;
    }
  });

  const monthlySavings = monthlyIncome - monthlyExpense;
  const savingsRate = monthlyIncome > 0 ? Math.round((monthlySavings / monthlyIncome) * 100) : 0;

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    monthlySavings,
    savingsRate,
    pendingIncome,
    pendingExpense
  };
}

// Export and Import helpers
export function exportToJSON(data: AppDataState) {
  const exportPayload = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    data
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fincontrol_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTransactionsToCSV(transactions: Transaction[]) {
  const headers = ['ID', 'Descricao', 'Valor (R$)', 'Tipo', 'Categoria', 'Data', 'Metodo', 'Status', 'Observacoes'];
  const rows = transactions.map(t => [
    `"${t.id}"`,
    `"${t.description.replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    t.type === 'income' ? 'Receita' : 'Despesa',
    `"${t.category}"`,
    t.date,
    t.paymentMethod,
    t.status === 'paid' ? 'Pago' : 'Pendente',
    `"${(t.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fincontrol_transacoes_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
