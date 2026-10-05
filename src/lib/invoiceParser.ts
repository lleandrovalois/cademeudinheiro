import { Category } from '../types/finance';

export interface ParsedInvoiceItem {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  category: string;
  type: 'expense' | 'income';
  isPaymentOrCredit: boolean;
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
 * Detect card name from raw text
 */
export function detectCardName(text: string): string {
  const upper = text.toUpperCase();
  if (upper.includes('NUBANK')) return 'Nubank';
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
 * Categorize description based on keywords
 */
export function suggestCategory(description: string, categories: Category[]): string {
  const desc = description.toLowerCase();

  // Keyword rules
  const mappings: { keywords: string[]; categoryKeyword: string }[] = [
    {
      keywords: ['ifood', 'mercado', 'supermercado', 'carrefour', 'pao de acucar', 'extra', 'atacad', 'assai', 'dia%', 'restaurante', 'lanchonete', 'padaria', 'mcdonald', 'burger king', 'bk ', 'outback', 'pizza', 'acai', 'bar ', 'choperia', 'cafe', 'starbucks', 'hortifruti', 'acougue', 'rappi', 'ze delivery', 'sushi', 'subway', 'sorvete', 'doceria', 'mercearia'],
      categoryKeyword: 'alimenta'
    },
    {
      keywords: ['uber', '99app', '99 ', 'posto', 'gasolina', 'combustivel', 'ipiranga', 'shell', 'petrobras', 'estacionamento', 'sem parar', 'conectcar', 'veloe', 'pedagio', 'auto posto', 'movida', 'localiza', 'rentcars', 'passagem', 'voe', 'latam', 'gol ', 'azul '],
      categoryKeyword: 'transporte'
    },
    {
      keywords: ['droga', 'drogasil', 'droga raia', 'pague menos', 'panvel', 'farmacia', 'hospital', 'clinica', 'medico', 'consulta', 'laboratorio', 'odonto', 'dentista', 'otica', 'psicolog', 'exame', 'terapia', 'nutricionista'],
      categoryKeyword: 'saude'
    },
    {
      keywords: ['netflix', 'spotify', 'amazon prime', 'disney', 'hbo', 'max ', 'youtube', 'cinema', 'ingresso', 'show', 'steam', 'playstation', 'xbox', 'apple.com', 'google storage', 'crunchyroll', 'deezer', 'globo', 'jogos', 'games'],
      categoryKeyword: 'lazer'
    },
    {
      keywords: ['enel', 'light', 'cpfl', 'cemig', 'sabesp', 'sanepar', 'copasa', 'comgas', 'aluguel', 'condominio', 'iptu', 'energia', 'agua', 'gas ', 'internet', 'claro', 'vivo', 'tim ', 'oi '],
      categoryKeyword: 'moradia'
    },
    {
      keywords: ['curso', 'escola', 'faculdade', 'universidade', 'udemy', 'alura', 'livraria', 'livro', 'idiomas', 'colegio', 'educa'],
      categoryKeyword: 'educa'
    },
    {
      keywords: ['magalu', 'magazine luiza', 'mercado livre', 'mercadolivre', 'amazon', 'shopee', 'shein', 'aliexpress', 'zara', 'renner', 'c&a', 'riachuelo', 'centauro', 'nike', 'adidas', 'kabum', 'terabyte', 'pichau', 'fast shop', 'leroy', 'mobly', 'madeira'],
      categoryKeyword: 'compra'
    }
  ];

  for (const map of mappings) {
    if (map.keywords.some(k => desc.includes(k))) {
      const found = categories.find(c => c.name.toLowerCase().includes(map.categoryKeyword));
      if (found) return found.name;
    }
  }

  // Fallbacks: find "Outros" or first category
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
    'estorno '
  ];
  return paymentKeywords.some(k => desc.includes(k));
}

/**
 * Parse an invoice text into structured transaction rows
 */
export function parseInvoiceText(rawText: string, categories: Category[]): ParsedInvoiceResult {
  const cardName = detectCardName(rawText);
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const items: ParsedInvoiceItem[] = [];
  let ignoredCount = 0;
  const currentYear = new Date().getFullYear();

  // Pattern 1: Lines with DD MMM (e.g., "12 OUT Uber *Trip R$ 24,90" or "12 OUT Uber *Trip 24,90")
  // Pattern 2: Lines with DD/MM or DD/MM/YYYY (e.g., "12/10 Uber *Trip R$ 24,90")
  const dateRegexTextMonth = /^(\d{1,2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)[A-Z]*\s+(.+)$/i;
  const dateRegexSlash = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(.+)$/;

  lines.forEach((line, index) => {
    // Check if line contains a monetary value at or near the end
    // Match Brazilian amounts like R$ 1.250,50 or 1.250,50 or 45,90 or -45,90 or 45,90-
    const amountMatch = line.match(/(?:R\$\s*)?(-?\s*\d{1,3}(?:\.\d{3})*,\d{2}|-?\s*\d+,\d{2})(?:\s*(-))?$/i);

    if (!amountMatch) {
      return;
    }

    const rawAmountStr = amountMatch[1].replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    let amount = parseFloat(rawAmountStr);
    if (isNaN(amount) || amount === 0) return;

    // Handle trailing minus (some bank statements format as 45,90-)
    if (amountMatch[2] === '-' || line.endsWith('-')) {
      amount = -Math.abs(amount);
    }

    // The line content without the matched amount part
    const lineWithoutAmount = line.slice(0, line.lastIndexOf(amountMatch[0])).trim();
    if (!lineWithoutAmount) return;

    let day = '';
    let month = '';
    let year = currentYear;
    let description = '';

    // Test text month format (12 OUT ...)
    const matchTextMonth = lineWithoutAmount.match(dateRegexTextMonth);
    if (matchTextMonth) {
      day = matchTextMonth[1].padStart(2, '0');
      const monthWord = matchTextMonth[2].toLowerCase();
      month = MONTH_NAMES_BR[monthWord] || '01';
      description = matchTextMonth[3].trim();
    } else {
      // Test slash format (12/10 ...)
      const matchSlash = lineWithoutAmount.match(dateRegexSlash);
      if (matchSlash) {
        day = matchSlash[1].padStart(2, '0');
        month = matchSlash[2].padStart(2, '0');
        if (matchSlash[3]) {
          const yr = matchSlash[3];
          year = yr.length === 2 ? 2000 + parseInt(yr, 10) : parseInt(yr, 10);
        }
        description = matchSlash[4].trim();
      }
    }

    // If no date was matched at the beginning, skip or ignore
    if (!day || !month || !description) {
      ignoredCount++;
      return;
    }

    // Check installment pattern in description (e.g., "MAGALU 02/10" or "SHOTGUN (11/48)" or "PARCELA 3/10")
    const installmentMatch = description.match(/(?:parcela\s*)?\(?(\d{1,2})\/(\d{1,2})\)?$/i);
    let installmentInfo: { current: number; total: number } | undefined;

    if (installmentMatch) {
      const cur = parseInt(installmentMatch[1], 10);
      const tot = parseInt(installmentMatch[2], 10);
      if (tot > 1 && cur <= tot) {
        installmentInfo = { current: cur, total: tot };
      }
    }

    const isCredit = amount < 0 || checkIfPaymentOrCredit(description);
    const positiveAmount = Math.abs(amount);

    // Skip general non-transaction noises
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('saldo anterior') || lowerDesc.includes('total da fatura') || lowerDesc.includes('limite total') || lowerDesc.includes('vencimento em')) {
      ignoredCount++;
      return;
    }

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
      installmentInfo,
      rawText: line,
      selected: !isCredit // Exclude payments by default so they don't distort user's expenses
    });
  });

  // Calculate detected month
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
    items,
    ignoredCount
  };
}
