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
        'terabyte', 'pichau', 'fast shop', 'leroy', 'mobly', 'madeira', 'kalunga', 'tactica', 'braskar'
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
 * Parse credit card statement text into structured transactions
 */
export function parseInvoiceText(rawText: string, categories: Category[]): ParsedInvoiceResult {
  const cardName = detectCardName(rawText);
  const detectedYear = detectInvoiceYear(rawText);
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const items: ParsedInvoiceItem[] = [];
  let ignoredCount = 0;

  lines.forEach((line, index) => {
    // Match line ending with Brazilian currency amount:
    // Supports R$ 88,00 | 88,00 | −R$ 2.274,97 | -R$ 2.274,97 | 2.274,97-
    // Notice [−\-] covers ASCII minus (-) and Unicode minus (− / \u2212)
    const amountMatch = line.match(/(?:[−\-–—]\s*)?(?:R\$\s*)?([−\-–—]?\s*\d{1,3}(?:\.\d{3})*,\d{2}|[−\-–—]?\s*\d+,\d{2})(?:\s*([−\-–—]))?$/i);

    if (!amountMatch) {
      return;
    }

    const rawAmountStr = amountMatch[1]
      .replace(/\s/g, '')
      .replace(/[−\-–—]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');

    let amount = parseFloat(rawAmountStr);
    if (isNaN(amount) || amount === 0) return;

    // Detect negative value (payments, refunds, discounts)
    const isNegative = line.includes('−') || amountMatch[0].includes('-') || amountMatch[0].includes('−') || amountMatch[2] != null;

    const lineWithoutAmount = line.slice(0, line.lastIndexOf(amountMatch[0])).trim();
    if (!lineWithoutAmount) return;

    let day = '';
    let month = '';
    let year = detectedYear;
    let description = '';

    // Match Pattern 1: Date with text month (e.g., "16 AGO ...", "03 SET ...")
    const matchTextMonth = lineWithoutAmount.match(/^(\d{1,2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)[A-Z]*\s+(.+)$/i);
    
    // Match Pattern 2: Date with slash (e.g., "16/08 ...", "16/08/2026 ...")
    const matchSlash = lineWithoutAmount.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(.+)$/);

    if (matchTextMonth) {
      day = matchTextMonth[1].padStart(2, '0');
      const monthWord = matchTextMonth[2].toLowerCase();
      month = MONTH_NAMES_BR[monthWord] || '01';
      description = matchTextMonth[3].trim();
    } else if (matchSlash) {
      day = matchSlash[1].padStart(2, '0');
      month = matchSlash[2].padStart(2, '0');
      if (matchSlash[3]) {
        const yr = matchSlash[3];
        year = yr.length === 2 ? 2000 + parseInt(yr, 10) : parseInt(yr, 10);
      }
      description = matchSlash[4].trim();
    } else {
      ignoredCount++;
      return;
    }

    // Strip card bullet dots and 4 digits (e.g., "•••• 5013 Description" or "**** 1835 Description")
    let cardDigits: string | undefined;
    const cardMatch = description.match(/^[•\.\*\s]+\s*(\d{4})\s*(.+)$/);
    if (cardMatch) {
      cardDigits = cardMatch[1];
      description = cardMatch[2].trim();
    }

    // Detect and parse installment info (e.g., "Fabriciobenjamin - Parcela 2/2" or "Tactical - Parcela 7/10" or "Magalu 2/10")
    let installmentInfo: { current: number; total: number } | undefined;
    const instMatch = description.match(/[-–—]?\s*(?:parcela\s*)?\(?(\d{1,2})\/(\d{1,2})\)?$/i);
    if (instMatch) {
      const cur = parseInt(instMatch[1], 10);
      const tot = parseInt(instMatch[2], 10);
      if (tot > 1 && cur <= tot) {
        installmentInfo = { current: cur, total: tot };
        // Clean the installment suffix from description for neat display
        description = description.slice(0, description.lastIndexOf(instMatch[0])).trim();
      }
    }

    // Skip general non-transaction headers
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('saldo anterior') || lowerDesc.includes('total da fatura') || lowerDesc.includes('limite total') || lowerDesc.includes('vencimento em')) {
      ignoredCount++;
      return;
    }

    const isCredit = isNegative || checkIfPaymentOrCredit(description);
    const positiveAmount = Math.abs(amount);
    const itemDate = `${year}-${month}-${day}`;
    const category = suggestCategory(description, categories);

    items.push({
      id: `invoice-item-${index}-${Date.now()}`,
      date: itemDate,
      description,
      amount: positiveAmount,
      category,
      type: isCredit ? 'income' : 'expense',
      isPaymentOrCredit: isCredit,
      cardDigits,
      installmentInfo,
      rawText: line,
      selected: !isCredit // Payments unselected by default so they don't double count expenses
    });
  });

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
