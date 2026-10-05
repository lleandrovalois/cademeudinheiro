import { NextResponse } from 'next/server';
import { processDueBillsReminders } from '../../../../lib/notifications';

export async function GET(req: Request) {
  return handleCron(req);
}

export async function POST(req: Request) {
  return handleCron(req);
}

async function handleCron(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret') || req.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is configured, enforce security
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: 'Acesso não autorizado. Secret inválido.' }, { status: 401 });
    }

    const force = searchParams.get('force') === 'true';
    const result = await processDueBillsReminders({ forceSend: force });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error('Erro na execução do cron de lembretes:', error);
    return NextResponse.json({ error: 'Erro ao processar lembretes.' }, { status: 500 });
  }
}
