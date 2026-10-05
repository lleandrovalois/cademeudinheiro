import { NextResponse } from 'next/server';
import { getAuthUserFromSession } from '../../../../lib/auth-server';
import { sendDueBillsReminderEmail } from '../../../../lib/email';

export async function POST() {
  try {
    const session = await getAuthUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Você precisa estar logado para enviar um e-mail de teste.' }, { status: 401 });
    }

    const now = new Date();
    const parts = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(now);

    const testBills = [
      {
        title: 'Aluguel do Imóvel (Teste)',
        category: 'Moradia & Contas',
        amount: 1450.0,
        type: 'recurring' as const,
      },
      {
        title: 'Energia Elétrica / Luz (Teste)',
        category: 'Moradia & Contas',
        amount: 215.80,
        type: 'recurring' as const,
      },
      {
        title: 'Internet Fibra Óptica (Teste)',
        category: 'Moradia & Contas',
        amount: 119.90,
        type: 'recurring' as const,
      }
    ];

    const result = await sendDueBillsReminderEmail({
      to: session.email,
      userName: session.name || session.email.split('@')[0],
      bills: testBills,
      dateStr: parts,
    });

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Falha ao enviar e-mail. Verifique suas credenciais SMTP.' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `E-mail de teste enviado com sucesso para ${session.email}! Verifique sua caixa de entrada ou spam.`
    });
  } catch (error) {
    console.error('Erro na rota de teste de e-mail:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno ao disparar e-mail de teste.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
