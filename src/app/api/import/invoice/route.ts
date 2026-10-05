import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamic import to avoid build-time issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);

    return NextResponse.json({
      text: data.text || '',
      pages: data.numpages || 1,
      info: data.info || {}
    });
  } catch (err: unknown) {
    console.error('Erro ao processar PDF:', err);
    return NextResponse.json(
      { error: 'Não foi possível ler o arquivo PDF. Verifique se o arquivo não está corrompido ou protegido por senha.' },
      { status: 500 }
    );
  }
}
