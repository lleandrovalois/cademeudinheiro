import { NextResponse } from 'next/server';
import { getDb, ensureDbInitialized } from '../../../../lib/db';
import { getAuthUserFromSession } from '../../../../lib/auth-server';
import { 
  Transaction, 
  RecurringBill, 
  InstallmentPurchase, 
  Budget, 
  SavingsGoal, 
  Category 
} from '../../../../types/finance';
import { DEFAULT_CATEGORIES } from '../../../../lib/mockData';

export async function GET() {
  try {
    const session = await getAuthUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    await ensureDbInitialized();
    const db = getDb();
    const userId = session.userId;

    const [txRows, recRows, instRows, bdgRows, goalRows, catRows] = await Promise.all([
      db.execute({
        sql: 'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC',
        args: [userId]
      }),
      db.execute({
        sql: 'SELECT * FROM recurring_bills WHERE user_id = ? ORDER BY due_day ASC',
        args: [userId]
      }),
      db.execute({
        sql: 'SELECT * FROM installment_purchases WHERE user_id = ? ORDER BY created_at DESC',
        args: [userId]
      }),
      db.execute({
        sql: 'SELECT * FROM budgets WHERE user_id = ?',
        args: [userId]
      }),
      db.execute({
        sql: 'SELECT * FROM savings_goals WHERE user_id = ?',
        args: [userId]
      }),
      db.execute({
        sql: 'SELECT * FROM categories WHERE user_id = ?',
        args: [userId]
      })
    ]);

    const transactions: Transaction[] = txRows.rows.map(r => ({
      id: String(r.id),
      description: String(r.description),
      amount: Number(r.amount),
      type: r.type as 'income' | 'expense',
      category: String(r.category),
      date: String(r.date),
      paymentMethod: String(r.payment_method) as any,
      status: r.status as 'paid' | 'pending',
      notes: r.notes ? String(r.notes) : undefined,
      installmentId: r.installment_id ? String(r.installment_id) : undefined,
      recurringId: r.recurring_id ? String(r.recurring_id) : undefined,
      createdAt: String(r.created_at)
    }));

    const recurringBills: RecurringBill[] = recRows.rows.map(r => {
      let paidMonths: string[] = [];
      if (r.paid_months) {
        try {
          paidMonths = JSON.parse(String(r.paid_months));
        } catch {
          paidMonths = [];
        }
      }
      return {
        id: String(r.id),
        title: String(r.title),
        amount: Number(r.amount),
        category: String(r.category),
        dueDay: Number(r.due_day),
        frequency: String(r.frequency) as any,
        active: Number(r.active) === 1,
        notes: r.notes ? String(r.notes) : undefined,
        paidMonths,
        createdAt: String(r.created_at)
      };
    });

    const installments: InstallmentPurchase[] = instRows.rows.map(r => ({
      id: String(r.id),
      description: String(r.description),
      totalAmount: Number(r.total_amount),
      installmentAmount: Number(r.installment_amount),
      totalInstallments: Number(r.total_installments),
      paidInstallments: Number(r.paid_installments),
      startDate: String(r.start_date),
      category: String(r.category),
      paymentCard: r.payment_card ? String(r.payment_card) : undefined,
      notes: r.notes ? String(r.notes) : undefined,
      createdAt: String(r.created_at)
    }));

    const budgets: Budget[] = bdgRows.rows.map(r => ({
      id: String(r.id),
      category: String(r.category),
      monthlyLimit: Number(r.monthly_limit),
      month: String(r.month)
    }));

    const goals: SavingsGoal[] = goalRows.rows.map(r => ({
      id: String(r.id),
      title: String(r.title),
      targetAmount: Number(r.target_amount),
      currentAmount: Number(r.current_amount),
      deadline: r.deadline ? String(r.deadline) : undefined,
      color: String(r.color || '#10b981'),
      icon: String(r.icon || 'ShieldCheck')
    }));

    let categories: Category[] = catRows.rows.map(r => ({
      id: String(r.id),
      name: String(r.name),
      icon: String(r.icon),
      color: String(r.color),
      type: r.type as any
    }));

    if (categories.length === 0) {
      // Seed categories for existing user if missing
      for (const cat of DEFAULT_CATEGORIES) {
        const catId = `cat-${crypto.randomUUID().slice(0, 8)}`;
        await db.execute({
          sql: 'INSERT INTO categories (id, user_id, name, icon, color, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          args: [catId, userId, cat.name, cat.icon, cat.color, cat.type, new Date().toISOString()]
        });
      }
      categories = DEFAULT_CATEGORIES;
    }

    return NextResponse.json({
      transactions,
      recurringBills,
      installments,
      budgets,
      goals,
      categories,
      isCloudConnected: true
    });
  } catch (error) {
    console.error('Erro na sincronização de dados:', error);
    return NextResponse.json({ error: 'Erro ao carregar dados do usuário.' }, { status: 500 });
  }
}
