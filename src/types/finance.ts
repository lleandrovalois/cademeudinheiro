export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 
  | 'credit_card' 
  | 'debit_card' 
  | 'pix' 
  | 'cash' 
  | 'bank_transfer' 
  | 'bank_slip'
  | 'other';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType | 'both';
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  status: 'paid' | 'pending';
  notes?: string;
  installmentId?: string; // If belongs to an installment purchase
  recurringId?: string;   // If created from a recurring bill
  createdAt: string;
}

export interface RecurringBill {
  id: string;
  title: string;
  amount: number;
  category: string;
  dueDay: number; // 1 to 31
  frequency: 'monthly' | 'yearly' | 'weekly';
  active: boolean;
  notes?: string;
  paidMonths: string[]; // List of 'YYYY-MM' strings marking paid months
  createdAt: string;
}

export interface InstallmentPurchase {
  id: string;
  description: string;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  startDate: string; // YYYY-MM-DD
  category: string;
  paymentCard?: string;
  notes?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  month: string; // YYYY-MM
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
  icon: string;
}

export interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number;
  savingsRate: number;
  pendingIncome: number;
  pendingExpense: number;
}

export interface CloudConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConnected: boolean;
  syncMode: 'local' | 'cloud';
}
