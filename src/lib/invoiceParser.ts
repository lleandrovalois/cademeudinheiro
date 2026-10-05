import { Category } from '../types/finance';

export interface ParsedInvoiceItem {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  category: string;
  type: 'expense' | 'income';
  isPaymentOrCredit: boolean;
  cardDigits?: string;
  installmentInfo?: {
    current: number;
    total: number;
  };
  rawText: string;
  selected: boolean;
}

export interface ParsedInvoiceResult {
  cardName: string;
  dueDate?: string;
  totalInvoiceAmount?: number;
  detectedMonth?: string;
  detectedYear?: number;
  items: ParsedInvoiceItem[];
  ignoredCount: number;
}

const MONTH_NAMES_BR: Record<string, string> = {
  jan: '01', janeiro: '01',
  fev: '02', fevereiro: '02',
  mar: '03', marco: '03', março: '03',
  abr: '04', abril: '04',
  mai: '05', maio: '05',
  jun: '06', junho: '06',
  jul: '07', julho: '07',
  ago: '08', agosto: '08',
  set: '09', setembro: '09',
  out: '10', outubro: '10',
  nov: '11', novembro: '11',
  dez: '12', dezembro: '12'
};

/**
 * Detect card issuer/bank from raw text
 */
export function detectCardName(text: string): string {
  const upper = text.toUpperCase();
  if (upper.includes('NUBANK') || upper.includes('NU PAGAMENTOS')) return 'Nubank';
  if (upper.includes('ITAU') || upper.includes('ITAÚ')) return 'Itaú';
  if (upper.includes('BRADESCO')) return 'Bradesco';
  if (upper.includes('SANTANDER')) return 'Santander';
  if (upper.includes('BANCO INTER') || upper.includes('INTER S.A') || upper.includes('INTER BLACK')) return 'Banco Inter';
  if (upper.includes('C6 BANK') || upper.includes('C6BANK')) return 'C6 Bank';
  if (upper.includes('XP INVESTIMENTOS') || upper.includes('XP VISA')) return 'XP';
  if (upper.includes('OUROCARD') || upper.includes('BANCO DO BRASIL')) return 'Banco do Brasil';
  if (upper.includes('CAIXA ECONOMICA') || upper.includes('CARTAO CAIXA')) return 'Caixa';
  if (upper.includes('BTG PACTUAL') || upper.includes('BTG+')) return 'BTG Pactual';
  return 'Cartão de Crédito';
}

/**
 * Detect invoice reference year from headers (e.g., "FATURA 23 SET 2026")
 */
export function detectInvoiceYear(text: string): number {
  const match = text.match(/(?:fatura|vencimento|per[ií]odo|emiss[aã]o)[\s\S]{0,30}\b(202\d|203\d)\b/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return new Date().getFullYear();
}

/**
 * Categorize description based on keywords
 */
export function suggestCategory(description: string, categories: Category[]): string {
  const desc = description.toLowerCase();

  const mappings: { keywords: string[]; categoryKeyword: string }[] = [
    {
      keywords: [
        'ifood', 'mercado', 'supermercado', 'carrefour', 'pao de acucar', 'extra', 'atacad', 'assai', 
        'restaurante', 'lanchonete', 'padaria', 'panificadora', 'mcdonald', 'burger king', 'bk ', 'outback', 
        'pizza', 'acai', 'bar ', 'choperia', 'cafe', 'starbucks', 'hortifruti', 'acougue', 'rappi', 
        'ze delivery', 'sushi', 'subway', 'sorvete', 'doceria', 'mercearia', 'belem'
      ],
      categoryKeyword: 'alimenta'
    },
    {
      keywords: [
        'uber', '99app', '99 ', 'posto', 'gasolina', 'combustivel', 'ipiranga', 'shell', 'petrobras', 
        'estacionamento', 'sem parar', 'conectcar', 'veloe', 'pedagio', 'auto posto', 'movida', 'localiza', 
        'rentcars', 'passagem', 'voe', 'latam', 'gol ', 'azul ', 'royal enfield', 'oficina', 'mecanic'
      ],
      categoryKeyword: 'transporte'
    },
    {
      keywords: [
        'droga', 'drogasil', 'droga raia', 'pague menos', 'panvel', 'farmacia', 'hospital', 'clinica', 
        'medico', 'consulta', 'laboratorio', 'odonto', 'dentista', 'otica', 'psicolog', 'exame', 'terapia', 'nutricionista'
      ],
      categoryKeyword: 'saude'
    },
    {
      keywords: [
        'netflix', 'spotify', 'amazon prime', 'disney', 'hbo', 'max ', 'youtube', 'youtubepremium', 'cinema', 
        'ingresso', 'show', 'steam', 'playstation', 'xbox', 'apple.com', 'google one', 'google storage', 
        'kindle', 'crunchyroll', 'deezer', 'globo', 'jogos', 'games', 'salao', 'barbearia', 'beleza'
      ],
      categoryKeyword: 'lazer'
    },
    {
      keywords: [
        'enel', 'light', 'cpfl', 'cemig', 'sabesp', 'sanepar', 'copasa', 'comgas', 'aluguel', 'condominio', 
        'iptu', 'energia', 'agua', 'gas ', 'internet', 'claro', 'vivo', 'tim ', 'oi '
      ],
      categoryKeyword: 'moradia'
    },
    {
      keywords: [
        'curso', 'escola', 'faculdade', 'universidade', 'udemy', 'alura', 'livraria', 'livro', 'idiomas', 'colegio', 'educa'
      ],
      categoryKeyword: 'educa'
    },
    {
      keywords: [
        'shopee', 'magalu', 'magazine luiza', 'mercado livre', 'mercadolivre', 'amazon', 'shein', 
        'aliexpress', 'zara', 'renner', 'c&a', 'riachuelo', 'centauro', 'nike', 'adidas', 'kabum', 
        'terabyte', 'pichau', 'fast shop', 'leroy', 'mobly', 'madeira', 'kalunga', 'tactica', 'braskar', 'fabricio'
      ],
      categoryKeyword: 'compra'
    }
  ];

  for (const map of mappings) {
    if (map.keywords.some(k => desc.includes(k))) {
      const found = categories.find(c => c.name.toLowerCase().includes(map.categoryKeyword));
      if (found) return found.name;
    }
  }

  const fallback = categories.find(c => c.name.toLowerCase().includes('outro')) || categories[0];
  return fallback?.name || 'Alimentação & Mercado';
}

/**
 * Checks if line is an invoice payment or cashback credit
 */
function checkIfPaymentOrCredit(description: string): boolean {
  const desc = description.toLowerCase();
  const paymentKeywords = [
    'pagamento recebido',
    'pagamento de fatura',
    'pgto fatura',
    'pagamento em',
    'credito de pagamento',
    'pagamento efetuado',
    'reversao de',
    'estorno de',
    'estorno ',
    'saldo restante da fatura'
  ];
  return paymentKeywords.some(k => desc.includes(k));
}

/**
 * Parse credit card statement text into structured transactions.
 * Handles both standalone date lines (e.g. Nubank) and inline date transactions.
 */
export function parseInvoiceText(rawText: string, categories: Category[]): ParsedInvoiceResult {
  const cardName = detectCardName(rawText);
  const detectedYear = detectInvoiceYear(rawText);
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const items: ParsedInvoiceItem[] = [];
  let ignoredCount = 0;
  let pendingDate: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is ONLY a date (e.g., '16 AGO' or '03 SET' or '16/08')
    const standaloneDateMatch = 
      line.match(/^(\d{1,2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)$/i) || 
      line.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);

    if (standaloneDateMatch) {
      if (standaloneDateMatch[2].length === 3) {
        const monthWord = standaloneDateMatch[2].toLowerCase();
        pendingDate = `${detectedYear}-${MONTH_NAMES_BR[monthWord] || '01'}-${standaloneDateMatch[1].padStart(2, '0')}`;
      } else {
        const yr = standaloneDateMatch[3] 
          ? (standaloneDateMatch[3].length === 2 ? 2000 + parseInt(standaloneDateMatch[3], 10) : parseInt(standaloneDateMatch[3], 10))
          : detectedYear;
        pendingDate = `${yr}-${standaloneDateMatch[2].padStart(2, '0')}-${standaloneDateMatch[1].padStart(2, '0')}`;
      }
      continue;
    }

    // Match amount at end of line (supports with or without space before R$, e.g. 'Parcela 2/2R$ 88,00' or 'R$ 88,00')
    const amountMatch = line.match(/(?:([−\-–—])\s*)?(?:R\$\s*)?([−\-–—]?\s*\d{1,3}(?:\.\d{3})*,\d{2}|[−\-–—]?\s*\d+,\d{2})(?:\s*([−\-–—]))?$/i);
    if (!amountMatch) {
      pendingDate = null;
      continue;
    }

    const rawVal = amountMatch[2]
      .replace(/\s/g, '')
      .replace(/[−\-–—]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');

    const amount = parseFloat(rawVal);
    if (isNaN(amount) || amount === 0) {
      pendingDate = null;
      continue;
    }

    const isNegative = line.includes('−') || line.includes('-R$') || (amountMatch[1] != null) || (amountMatch[3] != null);
    let lineWithoutAmount = line.slice(0, line.lastIndexOf(amountMatch[0])).trim();
    if (lineWithoutAmount.endsWith('R$')) {
      lineWithoutAmount = lineWithoutAmount.slice(0, -2).trim();
    }

    let date = pendingDate;
    pendingDate = null; // consume

    // If date was not on previous line, check if it's on this line (inline date)
    if (!date) {
      const inlineDateMatchText = lineWithoutAmount.match(/^(\d{1,2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)[A-Z]*\s+(.+)$/i);
      const inlineDateMatchSlash = lineWithoutAmount.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(.+)$/);

      if (inlineDateMatchText) {
        const monthWord = inlineDateMatchText[2].toLowerCase();
        date = `${detectedYear}-${MONTH_NAMES_BR[monthWord] || '01'}-${inlineDateMatchText[1].padStart(2, '0')}`;
        lineWithoutAmount = inlineDateMatchText[3].trim();
      } else if (inlineDateMatchSlash) {
        const yr = inlineDateMatchSlash[3]
          ? (inlineDateMatchSlash[3].length === 2 ? 2000 + parseInt(inlineDateMatchSlash[3], 10) : parseInt(inlineDateMatchSlash[3], 10))
          : detectedYear;
        date = `${yr}-${inlineDateMatchSlash[2].padStart(2, '0')}-${inlineDateMatchSlash[1].padStart(2, '0')}`;
        lineWithoutAmount = inlineDateMatchSlash[4].trim();
      }
    }

    if (!date || !lineWithoutAmount) {
      ignoredCount++;
      continue;
    }

    // Check card digits (e.g. •••• 5013 or **** 1835)
    let cardDigits: string | undefined;
    const cardMatch = lineWithoutAmount.match(/^[•\.\*\s]+\s*(\d{4})\s*(.+)$/);
    let desc = lineWithoutAmount;
    if (cardMatch) {
      cardDigits = cardMatch[1];
      desc = cardMatch[2].trim();
    }

    // Installment detection (e.g. 'Fabriciobenjamin - Parcela 2/2' or 'Royal Enfield - Parcela 2/6' or 'Magalu 02/10')
    let installmentInfo: { current: number; total: number } | undefined;
    const instMatch = desc.match(/[-–—]?\s*(?:parcela\s*)?\(?(\d{1,2})\/(\d{1,2})\)?$/i);
    if (instMatch) {
      const cur = parseInt(instMatch[1], 10);
      const tot = parseInt(instMatch[2], 10);
      if (tot > 1 && cur <= tot) {
        installmentInfo = { current: cur, total: tot };
        desc = desc.slice(0, desc.lastIndexOf(instMatch[0])).trim();
      }
    }

    // Skip general non-transaction headers
    const lowerDesc = desc.toLowerCase();
    if (
      lowerDesc.includes('saldo restante da fatura') || 
      lowerDesc.includes('saldo anterior') || 
      lowerDesc.includes('total da fatura') || 
      lowerDesc.includes('limite total') || 
      lowerDesc.includes('vencimento em')
    ) {
      ignoredCount++;
      continue;
    }

    const isCredit = isNegative || checkIfPaymentOrCredit(desc);
    const positiveAmount = Math.abs(amount);
    const category = suggestCategory(desc, categories);

    items.push({
      id: `invoice-item-${i}-${Date.now()}`,
      date,
      description: desc,
      amount: positiveAmount,
      category,
      type: isCredit ? 'income' : 'expense',
      isPaymentOrCredit: isCredit,
      cardDigits,
      installmentInfo,
      rawText: line,
      selected: !isCredit // Payments are unselected by default
    });
  }

  // Calculate detected dominant month
  let detectedMonth: string | undefined;
  if (items.length > 0) {
    const monthCounts: Record<string, number> = {};
    items.forEach(i => {
      const m = i.date.slice(0, 7);
      monthCounts[m] = (monthCounts[m] || 0) + 1;
    });
    const sorted = Object.entries(monthCounts).sort((a, b) => b[1] - a[1]);
    if (sorted[0]) detectedMonth = sorted[0][0];
  }

  return {
    cardName,
    detectedMonth,
    detectedYear,
    items,
    ignoredCount
  };
}
