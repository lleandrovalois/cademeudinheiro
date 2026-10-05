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
    const inst = await req.json();

    if (!inst || !inst.id || !inst.description || inst.totalAmount === undefined) {
      return NextResponse.json({ error: 'Dados do parcelamento incompletos' }, { status: 400 });
    }

    await db.execute({
      sql: `INSERT INTO installment_purchases (
        id, user_id, description, total_amount, installment_amount, total_installments,
        paid_installments, start_date, category, payment_card, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        description=excluded.description,
        total_amount=excluded.total_amount,
        installment_amount=excluded.installment_amount,
        total_installments=excluded.total_installments,
        paid_installments=excluded.paid_installments,
        start_date=excluded.start_date,
        category=excluded.category,
        payment_card=excluded.payment_card,
        notes=excluded.notes;`,
      args: [
        inst.id,
        session.userId,
        inst.description,
        inst.totalAmount,
        inst.installmentAmount,
        inst.totalInstallments,
        inst.paidInstallments,
        inst.startDate,
        inst.category,
        inst.paymentCard || null,
        inst.notes || null,
        inst.createdAt || new Date().toISOString()
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar parcelamento:', error);
    return NextResponse.json({ error: 'Erro ao salvar parcelamento' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getAuthUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await ensureDbInitialized();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    await db.execute({
      sql: 'DELETE FROM installment_purchases WHERE id = ? AND user_id = ?',
      args: [id, session.userId]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar parcelamento:', error);
    return NextResponse.json({ error: 'Erro ao deletar parcelamento' }, { status: 500 });
  }
}
