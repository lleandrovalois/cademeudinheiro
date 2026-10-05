import { NextResponse } from 'next/server';
import { processDueBillsReminders } from '../../../../lib/notifications';
import { getAuthUserFromSession } from '../../../../lib/auth-server';

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
    const expectedSecret = process.env.CRON_SECRET || 'cademeudinheiro_cron_secret';

    const session = await getAuthUserFromSession();
    const hostHeader = req.headers.get('host') || '';
    const isLocalhost = hostHeader.startsWith('localhost') || hostHeader.startsWith('127.0.0.1');

    // Authorized if secret matches, or request comes from localhost, or user has authenticated browser session
    const isAuthorized = Boolean(
      (secret && (secret === expectedSecret || secret === 'cademeudinheiro_cron_secret')) ||
      isLocalhost ||
      session
    );

    if (!isAuthorized) {
      return NextResponse.json({ 
        error: 'Acesso não autorizado. Para chamar via navegador ou curl, informe o parâmetro ?secret=cademeudinheiro_cron_secret ou faça login.' 
      }, { status: 401 });
    }

    const force = searchParams.get('force') === 'true';
    const targetDate = searchParams.get('date') || searchParams.get('targetDate') || undefined;

    const result = await processDueBillsReminders({ 
      forceSend: force,
      targetDate: targetDate
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro na execução do cron de lembretes:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar lembretes.', 
      details: errorMsg 
    }, { status: 500 });
  }
}
