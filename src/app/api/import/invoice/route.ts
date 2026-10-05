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

    // Using stable pdf-parse 1.1.4 (zero DOM/browser dependencies, 100% server compatible)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdf = require('pdf-parse');
    const data = await pdf(buffer);

    if (!data.text || !data.text.trim()) {
      return NextResponse.json(
        { error: 'Não foi possível extrair o texto deste PDF. O arquivo pode ser uma imagem escaneada sem camada de texto pesquisável.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      text: data.text,
      pages: data.numpages || 1
    });
  } catch (err: unknown) {
    console.error('Erro ao processar PDF da fatura:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Falha ao processar o arquivo PDF.' },
      { status: 500 }
    );
  }
}
