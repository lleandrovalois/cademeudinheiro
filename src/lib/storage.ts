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

export interface AppDataState {
  transactions: Transaction[];
  categories: Category[];
  recurringBills: RecurringBill[];
  installments: InstallmentPurchase[];
  budgets: Budget[];
  goals: SavingsGoal[];
  isCloudConnected: boolean;
}

function getUserKeys(userId: string = 'guest') {
  return {
    TRANSACTIONS: `cademeudinheiro_${userId}_transactions`,
    CATEGORIES: `cademeudinheiro_${userId}_categories`,
    RECURRING_BILLS: `cademeudinheiro_${userId}_recurring_bills`,
    INSTALLMENTS: `cademeudinheiro_${userId}_installments`,
    BUDGETS: `cademeudinheiro_${userId}_budgets`,
    GOALS: `cademeudinheiro_${userId}_goals`,
    INITIALIZED: `cademeudinheiro_${userId}_initialized_v3`
  };
}

export function initializeStorage(userId: string = 'guest'): AppDataState {
  if (typeof window === 'undefined') {
    return {
      transactions: userId === 'guest' ? DEFAULT_TRANSACTIONS : [],
      categories: DEFAULT_CATEGORIES,
      recurringBills: userId === 'guest' ? DEFAULT_RECURRING_BILLS : [],
      installments: userId === 'guest' ? DEFAULT_INSTALLMENTS : [],
      budgets: userId === 'guest' ? DEFAULT_BUDGETS : [],
      goals: userId === 'guest' ? DEFAULT_GOALS : [],
      isCloudConnected: true
    };
  }

  const keys = getUserKeys(userId);
  const isInitialized = localStorage.getItem(keys.INITIALIZED);

  const fallbackTxs = userId === 'guest' ? DEFAULT_TRANSACTIONS : [];
  const fallbackRec = userId === 'guest' ? DEFAULT_RECURRING_BILLS : [];
  const fallbackInst = userId === 'guest' ? DEFAULT_INSTALLMENTS : [];
  const fallbackBdg = userId === 'guest' ? DEFAULT_BUDGETS : [];
  const fallbackGoals = userId === 'guest' ? DEFAULT_GOALS : [];

  if (!isInitialized) {
    localStorage.setItem(keys.TRANSACTIONS, JSON.stringify(fallbackTxs));
    localStorage.setItem(keys.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem(keys.RECURRING_BILLS, JSON.stringify(fallbackRec));
    localStorage.setItem(keys.INSTALLMENTS, JSON.stringify(fallbackInst));
    localStorage.setItem(keys.BUDGETS, JSON.stringify(fallbackBdg));
    localStorage.setItem(keys.GOALS, JSON.stringify(fallbackGoals));
    localStorage.setItem(keys.INITIALIZED, 'true');
  }

  const transactions = safeParse(localStorage.getItem(keys.TRANSACTIONS), fallbackTxs);
  const categories = safeParse(localStorage.getItem(keys.CATEGORIES), DEFAULT_CATEGORIES);
  const recurringBills = safeParse(localStorage.getItem(keys.RECURRING_BILLS), fallbackRec);
  const installments = safeParse(localStorage.getItem(keys.INSTALLMENTS), fallbackInst);
  const budgets = safeParse(localStorage.getItem(keys.BUDGETS), fallbackBdg);
  const goals = safeParse(localStorage.getItem(keys.GOALS), fallbackGoals);

  return {
    transactions,
    categories,
    recurringBills,
    installments,
    budgets,
    goals,
    isCloudConnected: true
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

// Local Storage update helpers scoped per user
export function saveUserData(userId: string, data: Partial<AppDataState>) {
  if (typeof window === 'undefined') return;
  const keys = getUserKeys(userId);

  if (data.transactions !== undefined) {
    localStorage.setItem(keys.TRANSACTIONS, JSON.stringify(data.transactions));
  }
  if (data.categories !== undefined) {
    localStorage.setItem(keys.CATEGORIES, JSON.stringify(data.categories));
  }
  if (data.recurringBills !== undefined) {
    localStorage.setItem(keys.RECURRING_BILLS, JSON.stringify(data.recurringBills));
  }
  if (data.installments !== undefined) {
    localStorage.setItem(keys.INSTALLMENTS, JSON.stringify(data.installments));
  }
  if (data.budgets !== undefined) {
    localStorage.setItem(keys.BUDGETS, JSON.stringify(data.budgets));
  }
  if (data.goals !== undefined) {
    localStorage.setItem(keys.GOALS, JSON.stringify(data.goals));
  }
}

// Self-Hosted Server synchronization helpers
export async function syncUserDataFromCloud(userId: string): Promise<AppDataState | null> {
  if (userId === 'guest') return null;

  try {
    const res = await fetch('/api/data/sync', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) {
      console.warn('Servidor retornou status:', res.status);
      return null;
    }

    const data = await res.json();
    if (data.error) {
      console.error('Erro na resposta do sync:', data.error);
      return null;
    }

    const cloudData: AppDataState = {
      transactions: data.transactions || [],
      categories: (data.categories && data.categories.length > 0) ? data.categories : DEFAULT_CATEGORIES,
      recurringBills: data.recurringBills || [],
      installments: data.installments || [],
      budgets: data.budgets || [],
      goals: data.goals || [],
      isCloudConnected: true
    };

    // Cache locally for this user
    saveUserData(userId, cloudData);
    return cloudData;
  } catch (err) {
    console.error('Erro ao sincronizar com servidor Hostinger:', err);
    return null;
  }
}

export async function syncWithSupabase(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/data/sync');
    if (res.ok) {
      return { success: true, message: 'Banco de dados SQLite na Hostinger VPS sincronizado com sucesso!' };
    }
    return { success: false, message: 'Falha ao sincronizar com o banco de dados.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha na conexão';
    return { success: false, message: msg };
  }
}

// Write-through to Self-Hosted SQLite
export async function syncTransactionToCloud(tx: Transaction, userId: string) {
  if (userId === 'guest') return;
  try {
    await fetch('/api/data/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx)
    });
  } catch (err) {
    console.error('Falha ao sincronizar transação:', err);
  }
}

export async function deleteTransactionFromCloud(txId: string, userId: string) {
  if (userId === 'guest') return;
  try {
    await fetch(`/api/data/transactions?id=${encodeURIComponent(txId)}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error('Falha ao remover transação no servidor:', err);
  }
}

export async function clearAllTransactionsInCloud(userId: string) {
  if (userId === 'guest') return;
  try {
    await fetch('/api/data/transactions?id=all', {
      method: 'DELETE'
    });
  } catch (err) {
    console.error('Falha ao limpar transações no servidor:', err);
  }
}

export async function syncRecurringBillToCloud(bill: RecurringBill, userId: string) {
  if (userId === 'guest') return;
  try {
    await fetch('/api/data/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bill)
    });
  } catch (err) {
    console.error('Falha ao sincronizar conta fixa:', err);
  }
}

export async function deleteRecurringBillFromCloud(billId: string, userId: string) {
  if (userId === 'guest') return;
  try {
    await fetch(`/api/data/recurring?id=${encodeURIComponent(billId)}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error('Falha ao deletar conta fixa no servidor:', err);
  }
}

export async function syncInstallmentToCloud(inst: InstallmentPurchase, userId: string) {
  if (userId === 'guest') return;
  try {
    await fetch('/api/data/installments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inst)
    });
  } catch (err) {
    console.error('Falha ao sincronizar parcelamento:', err);
  }
}

export async function deleteInstallmentFromCloud(instId: string, userId: string) {
  if (userId === 'guest') return;
  try {
    await fetch(`/api/data/installments?id=${encodeURIComponent(instId)}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error('Falha ao deletar parcelamento no servidor:', err);
  }
}

export async function syncBudgetToCloud(budget: Budget, userId: string) {
  if (userId === 'guest') return;
  try {
    await fetch('/api/data/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budget)
    });
  } catch (err) {
    console.error('Falha ao sincronizar orçamento:', err);
  }
}

export async function syncGoalToCloud(goal: SavingsGoal, userId: string) {
  if (userId === 'guest') return;
  try {
    await fetch('/api/data/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal)
    });
  } catch (err) {
    console.error('Falha ao sincronizar meta:', err);
  }
}

export async function deleteGoalFromCloud(goalId: string, userId: string) {
  if (userId === 'guest') return;
  try {
    await fetch(`/api/data/goals?id=${encodeURIComponent(goalId)}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error('Falha ao deletar meta no servidor:', err);
  }
}

export function resetAllDataToDefault(userId: string = 'guest'): AppDataState {
  const keys = getUserKeys(userId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(keys.TRANSACTIONS, JSON.stringify(DEFAULT_TRANSACTIONS));
    localStorage.setItem(keys.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem(keys.RECURRING_BILLS, JSON.stringify(DEFAULT_RECURRING_BILLS));
    localStorage.setItem(keys.INSTALLMENTS, JSON.stringify(DEFAULT_INSTALLMENTS));
    localStorage.setItem(keys.BUDGETS, JSON.stringify(DEFAULT_BUDGETS));
    localStorage.setItem(keys.GOALS, JSON.stringify(DEFAULT_GOALS));
  }

  return {
    transactions: DEFAULT_TRANSACTIONS,
    categories: DEFAULT_CATEGORIES,
    recurringBills: DEFAULT_RECURRING_BILLS,
    installments: DEFAULT_INSTALLMENTS,
    budgets: DEFAULT_BUDGETS,
    goals: DEFAULT_GOALS,
    isCloudConnected: true
  };
}

// Financial calculation helper for current selected month
export function calculateMonthlySummary(transactions: Transaction[], selectedMonth: string): FinancialSummary {
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

export function exportToJSON(data: AppDataState) {
  const exportPayload = {
    exportDate: new Date().toISOString(),
    version: '2.0',
    data
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cademeudinheiro_backup_${new Date().toISOString().slice(0, 10)}.json`;
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
  a.download = `cademeudinheiro_transacoes_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
