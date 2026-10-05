import { NextResponse } from 'next/server';
import { getDb, ensureDbInitialized } from '../../../../lib/db';
import { getAuthUserFromSession } from '../../../../lib/auth-server';

export async function POST(req: Request) {
  try {
    const session = await getAuthUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await ensureDbInitialized();
    const db = getDb();
    const budget = await req.json();

    if (!budget || !budget.id || !budget.category || budget.monthlyLimit === undefined) {
      return NextResponse.json({ error: 'Dados do orçamento incompletos' }, { status: 400 });
    }

    await db.execute({
      sql: `INSERT INTO budgets (id, user_id, category, monthly_limit, month)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        category=excluded.category,
        monthly_limit=excluded.monthly_limit,
        month=excluded.month;`,
      args: [
        budget.id,
        session.userId,
        budget.category,
        budget.monthlyLimit,
        budget.month
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar orçamento:', error);
    return NextResponse.json({ error: 'Erro ao salvar orçamento' }, { status: 500 });
  }
}
