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

    // Support both pdf-parse v1 (function) and v2 (class PDFParse)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfLib = require('pdf-parse');
    let extractedText = '';
    let pageCount = 1;

    if (typeof pdfLib === 'function') {
      const data = await pdfLib(buffer);
      extractedText = data.text || '';
      pageCount = data.numpages || 1;
    } else if (pdfLib.PDFParse) {
      const parser = new pdfLib.PDFParse(new Uint8Array(buffer));
      const res = await parser.getText();
      extractedText = res.text || '';
      pageCount = res.total || 1;
    } else if (typeof pdfLib.default === 'function') {
      const data = await pdfLib.default(buffer);
      extractedText = data.text || '';
      pageCount = data.numpages || 1;
    } else {
      throw new Error('Mecanismo de leitura de PDF não suportado.');
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: 'Não foi possível extrair o texto deste PDF. O arquivo pode ser uma imagem escaneada sem camada de texto pesquisável.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      text: extractedText,
      pages: pageCount
    });
  } catch (err: unknown) {
    console.error('Erro ao processar PDF da fatura:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Falha ao processar o arquivo PDF.' },
      { status: 500 }
    );
  }
}
