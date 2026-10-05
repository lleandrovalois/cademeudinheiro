import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, InstallmentPurchase, RecurringBill } from '../types/finance';
import { formatCurrency, formatDateBR, formatMonthYearBR, getPaymentMethodLabel } from './formatters';

interface ExportContext {
  userName?: string;
  monthStr?: string;
}

// Helper to format current date and time for reports
function getReportTimestamp(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} às ${timeStr}`;
}

// Helper to calculate projected end date for installments
function calculateInstallmentEndDate(inst: InstallmentPurchase): string {
  const remainingCount = Math.max(0, inst.totalInstallments - inst.paidInstallments);
  if (remainingCount === 0) return 'Quitado';

  const [startYear, startMonth, startDay] = inst.startDate.split('-').map(Number);
  if (!startYear || !startMonth) return 'N/D';

  const monthsToAdd = remainingCount > 0 ? (remainingCount - 1) : 0;
  const endDate = new Date(startYear, (startMonth - 1) + monthsToAdd, startDay || 1);
  const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
  const endYear = endDate.getFullYear();
  return `${endMonth}/${endYear}`;
}

// ==========================================
// 1. EXCEL (XLSX) GENERATORS
// ==========================================

/**
 * Export transactions to a clean, well-formatted XLSX spreadsheet
 */
export function exportTransactionsToExcel(
  transactions: Transaction[],
  ctx?: ExportContext,
  customTitle?: string
) {
  const wb = XLSX.utils.book_new();

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const title = customTitle || (ctx?.monthStr ? `Extrato de Lançamentos - ${formatMonthYearBR(ctx.monthStr)}` : 'Relatório Geral de Lançamentos');

  const rows: (string | number)[][] = [
    ['CADÊ MEU DINHEIRO? - CONTROLE FINANCEIRO PESSOAL'],
    [title.toUpperCase()],
    [`Gerado em: ${getReportTimestamp()}`, '', `Usuário: ${ctx?.userName || 'Titular'}`],
    [''],
    // Summary Cards block
    ['RESUMO DO PERÍODO', '', '', '', '', '', '', ''],
    ['Total de Receitas:', totalIncome, '', 'Total de Despesas:', totalExpense, '', 'Saldo Líquido:', netBalance],
    ['Lançamentos:', transactions.length, '', 'Receitas:', transactions.filter(t => t.type === 'income').length, '', 'Despesas:', transactions.filter(t => t.type === 'expense').length],
    [''],
    // Table Headers
    ['Data', 'Tipo', 'Descrição', 'Categoria', 'Forma de Pagamento', 'Status', 'Valor (R$)', 'Observações']
  ];

  // Transaction rows sorted by date descending
  const sortedTx = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  sortedTx.forEach(t => {
    rows.push([
      formatDateBR(t.date),
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.description,
      t.category,
      getPaymentMethodLabel(t.paymentMethod),
      t.status === 'paid' ? (t.type === 'income' ? 'Recebido' : 'Pago') : (t.type === 'income' ? 'A Receber' : 'Pendente'),
      t.type === 'expense' ? -Math.abs(t.amount) : Math.abs(t.amount),
      t.notes || ''
    ]);
  });

  // Footer totals
  rows.push(['']);
  rows.push(['TOTAIS FINAIS', '', '', '', '', '', '']);
  rows.push(['Total de Receitas:', '', '', '', '', '', totalIncome]);
  rows.push(['Total de Despesas:', '', '', '', '', '', -totalExpense]);
  rows.push(['Saldo Líquido Final:', '', '', '', '', '', netBalance]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 14 }, // Data
    { wch: 12 }, // Tipo
    { wch: 32 }, // Descrição
    { wch: 24 }, // Categoria
    { wch: 22 }, // Forma Pagamento
    { wch: 14 }, // Status
    { wch: 18 }, // Valor (R$)
    { wch: 30 }  // Observações
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Lançamentos');

  const filenamePeriod = ctx?.monthStr || new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `CadeMeuDinheiro_Lancamentos_${filenamePeriod}.xlsx`);
}

/**
 * Export installment purchases to XLSX
 */
export function exportInstallmentsToExcel(
  installments: InstallmentPurchase[],
  ctx?: ExportContext
) {
  const wb = XLSX.utils.book_new();

  const totalCommitted = installments.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPaid = installments.reduce((acc, i) => acc + (i.installmentAmount * i.paidInstallments), 0);
  const totalRemaining = Math.max(0, totalCommitted - totalPaid);

  const rows: (string | number)[][] = [
    ['CADÊ MEU DINHEIRO? - CONTROLE FINANCEIRO PESSOAL'],
    ['RELATÓRIO DE COMPRAS PARCELADAS E FINANCIAMENTOS'],
    [`Gerado em: ${getReportTimestamp()}`, '', `Usuário: ${ctx?.userName || 'Titular'}`],
    [''],
    ['RESUMO DO ENDIVIDAMENTO PARCELADO'],
    ['Total em Compras:', totalCommitted, '', 'Total Já Quitado:', totalPaid, '', 'Saldo Devedor Restante:', totalRemaining],
    [''],
    [
      'Descrição',
      'Categoria',
      'Cartão / Banco',
      'Data Início',
      'Término Previsto',
      'Total Parcelas',
      'Pagas',
      'Restantes',
      'Valor Parcela (R$)',
      'Total Compra (R$)',
      'Total Pago (R$)',
      'Saldo Restante (R$)',
      'Progresso (%)',
      'Observações'
    ]
  ];

  installments.forEach(inst => {
    const remainingCount = Math.max(0, inst.totalInstallments - inst.paidInstallments);
    const instPaid = inst.installmentAmount * inst.paidInstallments;
    const instRemaining = Math.max(0, inst.totalAmount - instPaid);
    const progress = Math.min(100, Math.round((inst.paidInstallments / inst.totalInstallments) * 100));

    rows.push([
      inst.description,
      inst.category,
      inst.paymentCard || 'N/D',
      formatDateBR(inst.startDate),
      calculateInstallmentEndDate(inst),
      inst.totalInstallments,
      inst.paidInstallments,
      remainingCount,
      inst.installmentAmount,
      inst.totalAmount,
      instPaid,
      instRemaining,
      `${progress}%`,
      inst.notes || ''
    ]);
  });

  rows.push(['']);
  rows.push(['TOTAIS FINAIS', '', '', '', '', '', '', '', '', totalCommitted, totalPaid, totalRemaining]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 30 }, // Descrição
    { wch: 22 }, // Categoria
    { wch: 22 }, // Cartão
    { wch: 14 }, // Início
    { wch: 16 }, // Término
    { wch: 14 }, // Total Parcelas
    { wch: 10 }, // Pagas
    { wch: 12 }, // Restantes
    { wch: 18 }, // Parcela (R$)
    { wch: 18 }, // Total Compra (R$)
    { wch: 18 }, // Total Pago (R$)
    { wch: 20 }, // Saldo Restante (R$)
    { wch: 14 }, // Progresso
    { wch: 26 }  // Notas
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Parcelamentos');

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `CadeMeuDinheiro_Parcelamentos_${today}.xlsx`);
}

/**
 * Export Consolidated multi-tab workbook (Resumo + Lançamentos + Parcelamentos + Recorrentes)
 */
export function exportConsolidatedReportToExcel({
  transactions,
  installments,
  recurring,
  monthStr,
  userName
}: {
  transactions: Transaction[];
  installments: InstallmentPurchase[];
  recurring: RecurringBill[];
  monthStr: string;
  userName?: string;
}) {
  const wb = XLSX.utils.book_new();

  // 1. Resumo Executivo Sheet
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const totalFixedCommitment = recurring.filter(r => r.active).reduce((acc, r) => acc + r.amount, 0);
  const totalInstallmentMonthly = installments
    .filter(i => (i.totalInstallments - i.paidInstallments) > 0)
    .reduce((acc, i) => acc + i.installmentAmount, 0);

  const summaryRows: (string | number)[][] = [
    ['CADÊ MEU DINHEIRO? - RELATÓRIO CONSOLIDADO GERENCIAL'],
    [`Período de Referência: ${formatMonthYearBR(monthStr)}`],
    [`Emitido em: ${getReportTimestamp()}`, '', `Usuário: ${userName || 'Titular'}`],
    [''],
    ['1. INDICADORES MENSAIS PRINCIPAIS (DRE PESSOAL)'],
    ['Total de Receitas no Mês:', totalIncome],
    ['Total de Despesas no Mês:', totalExpense],
    ['Resultado Líquido do Mês:', netBalance],
    [''],
    ['2. COMPROMETIMENTO FIXO E RECORRENTE MENSAL'],
    ['Despesas Fixas Mensais Ativas:', totalFixedCommitment],
    ['Faturas de Parcelamentos no Mês:', totalInstallmentMonthly],
    ['Comprometimento Básico Mensal:', totalFixedCommitment + totalInstallmentMonthly],
    [''],
    ['3. STATUS DE ENDIVIDAMENTO PARCELADO'],
    ['Total Geral em Compras Parceladas:', installments.reduce((acc, i) => acc + i.totalAmount, 0)],
    ['Total Já Quitado:', installments.reduce((acc, i) => acc + (i.installmentAmount * i.paidInstallments), 0)],
    ['Saldo Devedor Restante em Aberto:', installments.reduce((acc, i) => acc + Math.max(0, i.totalAmount - (i.installmentAmount * i.paidInstallments)), 0)],
    ['']
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 38 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo Executivo');

  // 2. Lançamentos Sheet
  const txRows: (string | number)[][] = [
    ['Data', 'Tipo', 'Descrição', 'Categoria', 'Forma Pagamento', 'Status', 'Valor (R$)', 'Observações']
  ];
  [...transactions].sort((a, b) => b.date.localeCompare(a.date)).forEach(t => {
    txRows.push([
      formatDateBR(t.date),
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.description,
      t.category,
      getPaymentMethodLabel(t.paymentMethod),
      t.status === 'paid' ? 'Pago' : 'Pendente',
      t.type === 'expense' ? -t.amount : t.amount,
      t.notes || ''
    ]);
  });
  const wsTx = XLSX.utils.aoa_to_sheet(txRows);
  wsTx['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 32 }, { wch: 24 }, { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsTx, 'Lançamentos');

  // 3. Parcelamentos Sheet
  const instRows: (string | number)[][] = [
    ['Descrição', 'Categoria', 'Cartão', 'Data Início', 'Término Previsto', 'Parcelas', 'Pagas', 'Restantes', 'Parcela (R$)', 'Total (R$)', 'Saldo Devedor (R$)']
  ];
  installments.forEach(i => {
    const remaining = Math.max(0, i.totalInstallments - i.paidInstallments);
    const balance = Math.max(0, i.totalAmount - (i.installmentAmount * i.paidInstallments));
    instRows.push([
      i.description,
      i.category,
      i.paymentCard || 'N/D',
      formatDateBR(i.startDate),
      calculateInstallmentEndDate(i),
      i.totalInstallments,
      i.paidInstallments,
      remaining,
      i.installmentAmount,
      i.totalAmount,
      balance
    ]);
  });
  const wsInst = XLSX.utils.aoa_to_sheet(instRows);
  wsInst['!cols'] = [{ wch: 28 }, { wch: 20 }, { wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsInst, 'Parcelamentos');

  // 4. Despesas Fixas Sheet
  const recRows: (string | number)[][] = [
    ['Título', 'Categoria', 'Dia Vencimento', 'Valor Mensal (R$)', 'Status', 'Observações']
  ];
  recurring.forEach(r => {
    recRows.push([
      r.title,
      r.category,
      `Dia ${r.dueDay}`,
      r.amount,
      r.active ? 'Ativa' : 'Pausada',
      r.notes || ''
    ]);
  });
  const wsRec = XLSX.utils.aoa_to_sheet(recRows);
  wsRec['!cols'] = [{ wch: 30 }, { wch: 24 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, wsRec, 'Despesas Fixas');

  XLSX.writeFile(wb, `CadeMeuDinheiro_Consolidado_${monthStr}.xlsx`);
}

// ==========================================
// 2. PDF GENERATORS (jsPDF + autoTable)
// ==========================================

/**
 * Adds a modern branded header to PDF document
 */
function drawPDFHeader(doc: jsPDF, title: string, subtitle: string, ctx?: ExportContext) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Dark violet banner at top
  doc.setFillColor(79, 70, 229); // #4f46e5 (brand-primary)
  doc.rect(0, 0, pageWidth, 28, 'F');

  // App Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('CADÊ MEU DINHEIRO?', 14, 14);

  // System subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(224, 231, 255);
  doc.text('Sistema de Controle Financeiro Pessoal', 14, 21);

  // Right-aligned report name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), pageWidth - 14, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(224, 231, 255);
  doc.text(subtitle, pageWidth - 14, 21, { align: 'right' });

  // Metadata row below header
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Usuário: ${ctx?.userName || 'Titular'}`, 14, 35);
  doc.text(`Emitido em: ${getReportTimestamp()}`, pageWidth - 14, 35, { align: 'right' });

  // Dividing line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 38, pageWidth - 14, 38);
}

/**
 * Adds pagination and footer to all pages of a PDF document
 */
function addPDFFooter(doc: jsPDF) {
  const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.text('Cadê Meu Dinheiro? • Controle Financeiro Descomplicado', 14, pageHeight - 7);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }
}

/**
 * Export transactions to a polished PDF document
 */
export function exportTransactionsToPDF(
  transactions: Transaction[],
  ctx?: ExportContext,
  customTitle?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const title = customTitle || (ctx?.monthStr ? `Extrato - ${formatMonthYearBR(ctx.monthStr)}` : 'Relatório Geral de Lançamentos');
  const subtitle = ctx?.monthStr ? `Período: ${formatMonthYearBR(ctx.monthStr)}` : 'Histórico Completo';

  drawPDFHeader(doc, title, subtitle, ctx);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // KPI Summary Boxes
  const startY = 44;
  const boxWidth = 58;
  const boxHeight = 18;

  // Box 1: Receitas
  doc.setFillColor(240, 253, 244); // green-50
  doc.setDrawColor(187, 247, 208); // green-200
  doc.roundedRect(14, startY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52); // green-800
  doc.text('TOTAL RECEITAS', 18, startY + 6);
  doc.setFontSize(11);
  doc.text(formatCurrency(totalIncome), 18, startY + 13);

  // Box 2: Despesas
  doc.setFillColor(254, 242, 242); // red-50
  doc.setDrawColor(254, 202, 202); // red-200
  doc.roundedRect(76, startY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(153, 27, 27); // red-800
  doc.text('TOTAL DESPESAS', 80, startY + 6);
  doc.setFontSize(11);
  doc.text(formatCurrency(totalExpense), 80, startY + 13);

  // Box 3: Saldo Líquido
  const balanceBg = netBalance >= 0 ? [238, 242, 255] : [255, 241, 242];
  const balanceBorder = netBalance >= 0 ? [199, 210, 254] : [254, 205, 211];
  const balanceText = netBalance >= 0 ? [55, 48, 163] : [159, 18, 57];

  doc.setFillColor(balanceBg[0], balanceBg[1], balanceBg[2]);
  doc.setDrawColor(balanceBorder[0], balanceBorder[1], balanceBorder[2]);
  doc.roundedRect(138, startY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(balanceText[0], balanceText[1], balanceText[2]);
  doc.text('SALDO DO PERÍODO', 142, startY + 6);
  doc.setFontSize(11);
  doc.text(formatCurrency(netBalance), 142, startY + 13);

  // Table Data
  const sortedTx = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const tableData = sortedTx.map(t => [
    formatDateBR(t.date),
    t.description,
    t.category,
    getPaymentMethodLabel(t.paymentMethod),
    t.status === 'paid' ? 'Pago' : 'Pendente',
    (t.type === 'expense' ? '- ' : '+ ') + formatCurrency(t.amount)
  ]);

  autoTable(doc, {
    startY: startY + boxHeight + 8,
    head: [['Data', 'Descrição', 'Categoria', 'Forma Pagto', 'Status', 'Valor']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59], // #1e293b
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.8,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35 },
      3: { cellWidth: 28 },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    margin: { left: 14, right: 14, bottom: 20 },
    didParseCell: (data) => {
      // Color value column according to income / expense
      if (data.section === 'body' && data.column.index === 5) {
        const text = String(data.cell.raw);
        if (text.startsWith('+')) {
          data.cell.styles.textColor = [16, 185, 129]; // emerald-500
        } else {
          data.cell.styles.textColor = [239, 68, 68]; // red-500
        }
      }
    }
  });

  addPDFFooter(doc);

  const filenamePeriod = ctx?.monthStr || new Date().toISOString().slice(0, 10);
  doc.save(`CadeMeuDinheiro_Extrato_${filenamePeriod}.pdf`);
}

/**
 * Export installment purchases to a polished PDF document
 */
export function exportInstallmentsToPDF(
  installments: InstallmentPurchase[],
  ctx?: ExportContext
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  drawPDFHeader(doc, 'Compras Parceladas', 'Relatório de Endividamento e Prazos', ctx);

  const totalCommitted = installments.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPaid = installments.reduce((acc, i) => acc + (i.installmentAmount * i.paidInstallments), 0);
  const totalRemaining = Math.max(0, totalCommitted - totalPaid);

  const startY = 44;
  const boxWidth = 85;
  const boxHeight = 18;

  // Box 1
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(14, startY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 48, 163);
  doc.text('VALOR TOTAL COMPROMETIDO', 18, startY + 6);
  doc.setFontSize(11);
  doc.text(formatCurrency(totalCommitted), 18, startY + 13);

  // Box 2
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(105, startY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL JÁ PAGO / AMORTIZADO', 109, startY + 6);
  doc.setFontSize(11);
  doc.text(formatCurrency(totalPaid), 109, startY + 13);

  // Box 3
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(196, startY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(153, 27, 27);
  doc.text('SALDO DEVEDOR RESTANTE', 200, startY + 6);
  doc.setFontSize(11);
  doc.text(formatCurrency(totalRemaining), 200, startY + 13);

  const tableData = installments.map(i => {
    const remaining = Math.max(0, i.totalInstallments - i.paidInstallments);
    const instPaid = i.installmentAmount * i.paidInstallments;
    const instRemaining = Math.max(0, i.totalAmount - instPaid);

    return [
      i.description,
      i.category,
      i.paymentCard || 'N/D',
      formatDateBR(i.startDate),
      calculateInstallmentEndDate(i),
      `${i.paidInstallments} de ${i.totalInstallments} (${remaining} rest.)`,
      formatCurrency(i.installmentAmount),
      formatCurrency(i.totalAmount),
      formatCurrency(instRemaining)
    ];
  });

  autoTable(doc, {
    startY: startY + boxHeight + 8,
    head: [['Descrição', 'Categoria', 'Cartão', 'Início', 'Término', 'Progresso', 'Parcela (R$)', 'Total (R$)', 'Saldo Devedor']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.8
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 32 },
      2: { cellWidth: 30 },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 32, halign: 'center' },
      6: { cellWidth: 26, halign: 'right' },
      7: { cellWidth: 28, halign: 'right' },
      8: { cellWidth: 32, halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] }
    },
    margin: { left: 14, right: 14, bottom: 20 }
  });

  addPDFFooter(doc);

  const today = new Date().toISOString().slice(0, 10);
  doc.save(`CadeMeuDinheiro_Parcelamentos_${today}.pdf`);
}

/**
 * Export Full Consolidated Executive Report to PDF
 */
export function exportConsolidatedReportToPDF({
  transactions,
  installments,
  recurring,
  monthStr,
  userName
}: {
  transactions: Transaction[];
  installments: InstallmentPurchase[];
  recurring: RecurringBill[];
  monthStr: string;
  userName?: string;
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  drawPDFHeader(
    doc,
    'Relatório Consolidado',
    `DRE e Demonstrativo Mensal - ${formatMonthYearBR(monthStr)}`,
    { monthStr, userName }
  );

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const totalFixed = recurring.filter(r => r.active).reduce((acc, r) => acc + r.amount, 0);
  const totalInstallmentMonthly = installments
    .filter(i => (i.totalInstallments - i.paidInstallments) > 0)
    .reduce((acc, i) => acc + i.installmentAmount, 0);

  // Executive Summary Card
  let currentY = 44;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('1. DEMONSTRATIVO FINANCEIRO DO MÊS', 14, currentY);

  currentY += 4;
  const summaryBody = [
    ['Total de Receitas no Mês', formatCurrency(totalIncome)],
    ['Total de Despesas no Mês', formatCurrency(totalExpense)],
    ['Resultado Líquido do Mês', formatCurrency(netBalance)],
    ['Despesas Fixas & Recorrentes Comprometidas', formatCurrency(totalFixed)],
    ['Faturas de Parcelas Ativas no Mês', formatCurrency(totalInstallmentMonthly)],
    ['Comprometimento Básico Mensal (Fixas + Parcelas)', formatCurrency(totalFixed + totalInstallmentMonthly)]
  ];

  autoTable(doc, {
    startY: currentY,
    body: summaryBody,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.2 },
    columnStyles: {
      0: { cellWidth: 130, fontStyle: 'bold' },
      1: { cellWidth: 52, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.row.index === 0) data.cell.styles.textColor = [16, 185, 129];
      if (data.row.index === 1) data.cell.styles.textColor = [239, 68, 68];
      if (data.row.index === 2) {
        data.cell.styles.textColor = netBalance >= 0 ? [16, 185, 129] : [239, 68, 68];
      }
    }
  });

  const lastTable1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
  currentY = (lastTable1 ? lastTable1.finalY : currentY + 30) + 10;

  // Table 2: Lançamentos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`2. LANÇAMENTOS DO MÊS (${transactions.length} registros)`, 14, currentY);

  currentY += 4;
  const txRows = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).map(t => [
    formatDateBR(t.date),
    t.description,
    t.category,
    t.status === 'paid' ? 'Pago' : 'Pendente',
    (t.type === 'expense' ? '- ' : '+ ') + formatCurrency(t.amount)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Data', 'Descrição', 'Categoria', 'Status', 'Valor']],
    body: txRows.length > 0 ? txRows : [['-', 'Nenhum lançamento registrado neste período', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const text = String(data.cell.raw);
        if (text.startsWith('+')) data.cell.styles.textColor = [16, 185, 129];
        else if (text.startsWith('-')) data.cell.styles.textColor = [239, 68, 68];
      }
    }
  });

  const lastTable2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
  currentY = (lastTable2 ? lastTable2.finalY : currentY + 40) + 10;

  // If page would overflow, add page
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  // Table 3: Compras Parceladas Ativas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`3. PARCELAMENTOS ATIVOS (${installments.length} compras)`, 14, currentY);

  currentY += 4;
  const instRows = installments.map(i => [
    i.description,
    i.paymentCard || 'N/D',
    calculateInstallmentEndDate(i),
    `${i.paidInstallments}/${i.totalInstallments}`,
    formatCurrency(i.installmentAmount),
    formatCurrency(Math.max(0, i.totalAmount - (i.installmentAmount * i.paidInstallments)))
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Descrição', 'Cartão', 'Término', 'Parcelas', 'Parcela (R$)', 'Saldo Devedor']],
    body: instRows.length > 0 ? instRows : [['-', 'Nenhum parcelamento ativo', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 30 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] }
    }
  });

  addPDFFooter(doc);

  doc.save(`CadeMeuDinheiro_Relatorio_Consolidado_${monthStr}.pdf`);
}
