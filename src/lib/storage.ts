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
    INITIALIZED: `cademeudinheiro_${userId}_initialized_v2`
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
      isCloudConnected: false
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

// Supabase synchronization helpers
export async function syncUserDataFromCloud(userId: string): Promise<AppDataState | null> {
  const supabase = getSupabaseClient();
  if (!supabase || userId === 'guest') return null;

  try {
    const [txRes, recRes, instRes, bdgRes, goalRes, catRes] = await Promise.all([
      supabase.from('transactions').select('*').order('date', { ascending: false }),
      supabase.from('recurring_bills').select('*'),
      supabase.from('installment_purchases').select('*'),
      supabase.from('budgets').select('*'),
      supabase.from('savings_goals').select('*'),
      supabase.from('categories').select('*')
    ]);

    const remoteTxs: Transaction[] = (txRes.data || []).map(r => ({
      id: r.id,
      description: r.description,
      amount: Number(r.amount),
      type: r.type,
      category: r.category,
      date: r.date,
      paymentMethod: r.payment_method,
      status: r.status,
      notes: r.notes || '',
      installmentId: r.installment_id,
      recurringId: r.recurring_id,
      createdAt: r.created_at
    }));

    const remoteRec: RecurringBill[] = (recRes.data || []).map(r => ({
      id: r.id,
      title: r.title,
      amount: Number(r.amount),
      category: r.category,
      dueDay: r.due_day,
      frequency: r.frequency || 'monthly',
      active: r.active ?? true,
      notes: r.notes || '',
      paidMonths: Array.isArray(r.paid_months) ? r.paid_months : [],
      createdAt: r.created_at
    }));

    const remoteInst: InstallmentPurchase[] = (instRes.data || []).map(r => ({
      id: r.id,
      description: r.description,
      totalAmount: Number(r.total_amount),
      installmentAmount: Number(r.installment_amount),
      totalInstallments: r.total_installments,
      paidInstallments: r.paid_installments,
      startDate: r.start_date,
      category: r.category,
      paymentCard: r.payment_card,
      notes: r.notes || '',
      createdAt: r.created_at
    }));

    const remoteBdg: Budget[] = (bdgRes.data || []).map(r => ({
      id: r.id,
      category: r.category,
      monthlyLimit: Number(r.monthly_limit),
      month: r.month
    }));

    const remoteGoals: SavingsGoal[] = (goalRes.data || []).map(r => ({
      id: r.id,
      title: r.title,
      targetAmount: Number(r.target_amount),
      currentAmount: Number(r.current_amount),
      deadline: r.deadline,
      color: r.color || '#10b981',
      icon: r.icon || 'ShieldCheck'
    }));

    const categories: Category[] = (catRes.data && catRes.data.length > 0) 
      ? catRes.data.map(c => ({ id: c.id, name: c.name, icon: c.icon, color: c.color, type: c.type }))
      : DEFAULT_CATEGORIES;

    const cloudData: AppDataState = {
      transactions: remoteTxs,
      categories,
      recurringBills: remoteRec,
      installments: remoteInst,
      budgets: remoteBdg,
      goals: remoteGoals,
      isCloudConnected: true
    };

    // Cache locally for this user
    saveUserData(userId, cloudData);
    return cloudData;
  } catch (err) {
    console.error('Erro ao sincronizar com Supabase:', err);
    return null;
  }
}

// Write-through to Supabase
export async function syncTransactionToCloud(tx: Transaction, userId: string) {
  const supabase = getSupabaseClient();
  if (!supabase || userId === 'guest') return;

  try {
    await supabase.from('transactions').upsert({
      id: tx.id,
      user_id: userId,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: tx.date,
      payment_method: tx.paymentMethod,
      status: tx.status,
      notes: tx.notes || null,
      installment_id: tx.installmentId || null,
      recurring_id: tx.recurringId || null
    });
  } catch (err) {
    console.error('Falha ao sincronizar transação:', err);
  }
}

export async function deleteTransactionFromCloud(txId: string, userId: string) {
  const supabase = getSupabaseClient();
  if (!supabase || userId === 'guest') return;

  try {
    await supabase.from('transactions').delete().eq('id', txId);
  } catch (err) {
    console.error('Falha ao remover transação no Supabase:', err);
  }
}

export async function syncRecurringBillToCloud(bill: RecurringBill, userId: string) {
  const supabase = getSupabaseClient();
  if (!supabase || userId === 'guest') return;

  try {
    await supabase.from('recurring_bills').upsert({
      id: bill.id,
      user_id: userId,
      title: bill.title,
      amount: bill.amount,
      category: bill.category,
      due_day: bill.dueDay,
      frequency: bill.frequency,
      active: bill.active,
      notes: bill.notes || null,
      paid_months: bill.paidMonths
    });
  } catch (err) {
    console.error('Falha ao sincronizar conta fixa:', err);
  }
}

export async function deleteRecurringBillFromCloud(billId: string, userId: string) {
  const supabase = getSupabaseClient();
  if (!supabase || userId === 'guest') return;

  try {
    await supabase.from('recurring_bills').delete().eq('id', billId);
  } catch (err) {
    console.error('Falha ao deletar conta fixa no Supabase:', err);
  }
}

export async function syncInstallmentToCloud(inst: InstallmentPurchase, userId: string) {
  const supabase = getSupabaseClient();
  if (!supabase || userId === 'guest') return;

  try {
    await supabase.from('installment_purchases').upsert({
      id: inst.id,
      user_id: userId,
      description: inst.description,
      total_amount: inst.totalAmount,
      installment_amount: inst.installmentAmount,
      total_installments: inst.totalInstallments,
      paid_installments: inst.paidInstallments,
      start_date: inst.startDate,
      category: inst.category,
      payment_card: inst.paymentCard || null,
      notes: inst.notes || null
    });
  } catch (err) {
    console.error('Falha ao sincronizar parcelamento:', err);
  }
}

export async function deleteInstallmentFromCloud(instId: string, userId: string) {
  const supabase = getSupabaseClient();
  if (!supabase || userId === 'guest') return;

  try {
    await supabase.from('installment_purchases').delete().eq('id', instId);
  } catch (err) {
    console.error('Falha ao deletar parcelamento no Supabase:', err);
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
    isCloudConnected: Boolean(getSupabaseClient())
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

export async function syncWithSupabase(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Supabase não configurado. Insira a URL e a Anon Key.' };
  }
  try {
    const { error } = await supabase.from('transactions').select('id').limit(1);
    if (error) {
      return { success: false, message: `Erro ao conectar: ${error.message}` };
    }
    return { success: true, message: 'Conexão com o Supabase estabelecida com sucesso!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha na conexão';
    return { success: false, message: msg };
  }
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
