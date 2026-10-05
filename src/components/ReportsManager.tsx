'use client';

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  TrendingUp, 
  DollarSign, 
  Layers, 
  Filter,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { Transaction, InstallmentPurchase, RecurringBill, Category, AuthUser } from '../types/finance';
import { formatCurrency, formatDateBR, formatMonthYearBR, getPaymentMethodLabel } from '../lib/formatters';
import { 
  exportTransactionsToExcel, 
  exportInstallmentsToExcel, 
  exportConsolidatedReportToExcel, 
  exportTransactionsToPDF, 
  exportInstallmentsToPDF, 
  exportConsolidatedReportToPDF 
} from '../lib/exportReports';

interface ReportsManagerProps {
  transactions: Transaction[];
  installments: InstallmentPurchase[];
  recurring: RecurringBill[];
  categories: Category[];
  currentMonth: string;
  currentUser: AuthUser | null;
}

export const ReportsManager: React.FC<ReportsManagerProps> = ({
  transactions,
  installments,
  recurring,
  categories,
  currentMonth,
  currentUser
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'last3' | 'year' | 'all'>('current');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Filter transactions based on selection
  const currentYear = currentMonth.slice(0, 4);
  const filteredTransactions = transactions.filter(t => {
    // Period filter
    if (selectedPeriod === 'current') {
      if (!t.date.startsWith(currentMonth)) return false;
    } else if (selectedPeriod === 'year') {
      if (!t.date.startsWith(currentYear)) return false;
    } else if (selectedPeriod === 'last3') {
      const txMonth = t.date.slice(0, 7);
      const months = [];
      const [y, m] = currentMonth.split('-').map(Number);
      for (let i = 0; i < 3; i++) {
        const d = new Date(y, m - 1 - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
      if (!months.includes(txMonth)) return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;

    // Type filter
    if (selectedType !== 'all' && t.type !== selectedType) return false;

    return true;
  });

  const periodTotalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const periodTotalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const periodNetBalance = periodTotalIncome - periodTotalExpense;

  const currentMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));

  // Handlers with loading state for UX
  const triggerExport = (id: string, exportFn: () => void) => {
    setIsExporting(id);
    setTimeout(() => {
      try {
        exportFn();
      } catch (err) {
        console.error('Erro ao gerar relatório:', err);
        alert('Ocorreu um erro ao exportar o relatório. Verifique os dados e tente novamente.');
      } finally {
        setIsExporting(null);
      }
    }, 150);
  };

  const getPeriodLabel = () => {
    if (selectedPeriod === 'current') return formatMonthYearBR(currentMonth);
    if (selectedPeriod === 'last3') return 'Últimos 3 Meses';
    if (selectedPeriod === 'year') return `Ano de ${currentYear}`;
    return 'Todo o Histórico';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Central de Relatórios & Exportação
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
          Gere relatórios completos e consolidados para controle pessoal ou contabilidade em planilhas <strong>Excel (.xlsx)</strong> e documentos <strong>PDF</strong>.
        </p>
      </div>

      {/* Quick Action Export Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
        gap: '16px'
      }}>
        {/* Card 1: Extrato Mensal Atual */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--brand-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Extrato do Mês Atual</h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{formatMonthYearBR(currentMonth)}</span>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Extrato completo de receitas, despesas e saldo do mês com métricas e detalhes por categoria.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => triggerExport('month-pdf', () => exportTransactionsToPDF(currentMonthTransactions, { monthStr: currentMonth, userName: currentUser?.name }))}
              disabled={isExporting !== null}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.78rem', justifyContent: 'center' }}
            >
              <FileText size={15} color="#ef4444" />
              <span>{isExporting === 'month-pdf' ? 'Gerando...' : 'Baixar PDF'}</span>
            </button>
            <button
              onClick={() => triggerExport('month-xlsx', () => exportTransactionsToExcel(currentMonthTransactions, { monthStr: currentMonth, userName: currentUser?.name }))}
              disabled={isExporting !== null}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.78rem', justifyContent: 'center' }}
            >
              <FileSpreadsheet size={15} color="#10b981" />
              <span>{isExporting === 'month-xlsx' ? 'Gerando...' : 'Baixar Excel'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Compras Parceladas */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(236, 72, 153, 0.15)',
                color: '#ec4899',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CreditCard size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Compras Parceladas</h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{installments.length} compras cadastradas</span>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Demonstrativo de parcelas pagas, saldo devedor restante e previsão exata de término por cartão.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => triggerExport('inst-pdf', () => exportInstallmentsToPDF(installments, { userName: currentUser?.name }))}
              disabled={isExporting !== null}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.78rem', justifyContent: 'center' }}
            >
              <FileText size={15} color="#ef4444" />
              <span>{isExporting === 'inst-pdf' ? 'Gerando...' : 'Baixar PDF'}</span>
            </button>
            <button
              onClick={() => triggerExport('inst-xlsx', () => exportInstallmentsToExcel(installments, { userName: currentUser?.name }))}
              disabled={isExporting !== null}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.78rem', justifyContent: 'center' }}
            >
              <FileSpreadsheet size={15} color="#10b981" />
              <span>{isExporting === 'inst-xlsx' ? 'Gerando...' : 'Baixar Excel'}</span>
            </button>
          </div>
        </div>

        {/* Card 3: Relatório Consolidado (DRE) */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--brand-gradient)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Layers size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>DRE & Consolidado</h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--brand-primary-light)' }}>Pacote Completo</span>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Demonstrativo completo: Balanço, Lançamentos, Parcelamentos e Contas Fixas em documento único.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => triggerExport('full-pdf', () => exportConsolidatedReportToPDF({
                transactions: currentMonthTransactions,
                installments,
                recurring,
                monthStr: currentMonth,
                userName: currentUser?.name
              }))}
              disabled={isExporting !== null}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.78rem', justifyContent: 'center' }}
            >
              <FileText size={15} color="#ef4444" />
              <span>{isExporting === 'full-pdf' ? 'Gerando...' : 'PDF Completo'}</span>
            </button>
            <button
              onClick={() => triggerExport('full-xlsx', () => exportConsolidatedReportToExcel({
                transactions: currentMonthTransactions,
                installments,
                recurring,
                monthStr: currentMonth,
                userName: currentUser?.name
              }))}
              disabled={isExporting !== null}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.78rem', justifyContent: 'center' }}
            >
              <FileSpreadsheet size={15} color="#10b981" />
              <span>{isExporting === 'full-xlsx' ? 'Gerando...' : 'Excel Multi-Aba'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Report Filter & Generator Section */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 4px' }}>
              Exportação Customizada de Lançamentos
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Filtre por período, tipo ou categoria e exporte sob medida
            </span>
          </div>

          {/* Export Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => triggerExport('custom-pdf', () => exportTransactionsToPDF(
                filteredTransactions,
                { monthStr: selectedPeriod === 'current' ? currentMonth : undefined, userName: currentUser?.name },
                `Extrato Personalizado (${getPeriodLabel()})`
              ))}
              disabled={isExporting !== null || filteredTransactions.length === 0}
              className="btn btn-secondary"
              style={{ fontSize: '0.84rem' }}
            >
              <FileText size={16} color="#ef4444" />
              <span>Exportar PDF</span>
            </button>
            <button
              onClick={() => triggerExport('custom-xlsx', () => exportTransactionsToExcel(
                filteredTransactions,
                { monthStr: selectedPeriod === 'current' ? currentMonth : undefined, userName: currentUser?.name },
                `Extrato Personalizado (${getPeriodLabel()})`
              ))}
              disabled={isExporting !== null || filteredTransactions.length === 0}
              className="btn btn-primary"
              style={{ fontSize: '0.84rem' }}
            >
              <FileSpreadsheet size={16} />
              <span>Exportar Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          padding: '16px',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px'
        }}>
          {/* Period Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.74rem' }}>Período</label>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value as 'current' | 'last3' | 'year' | 'all')}
              className="form-select"
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            >
              <option value="current">Mês Selecionado ({formatMonthYearBR(currentMonth)})</option>
              <option value="last3">Últimos 3 Meses</option>
              <option value="year">Ano Atual ({currentYear})</option>
              <option value="all">Todo o Histórico Geral</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.74rem' }}>Tipo de Movimentação</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as 'all' | 'income' | 'expense')}
              className="form-select"
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            >
              <option value="all">Todas (Receitas e Despesas)</option>
              <option value="expense">Apenas Despesas</option>
              <option value="income">Apenas Receitas</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.74rem' }}>Categoria</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="form-select"
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            >
              <option value="all">Todas as Categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Data Summary KPIs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>LANÇAMENTOS FILTRADOS</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>{filteredTransactions.length}</div>
          </div>

          <div style={{ padding: '12px 16px', background: 'var(--color-income-bg)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-income)', fontWeight: 600 }}>TOTAL RECEITAS</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-income)', marginTop: '2px' }}>
              {formatCurrency(periodTotalIncome)}
            </div>
          </div>

          <div style={{ padding: '12px 16px', background: 'var(--color-expense-bg)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-expense)', fontWeight: 600 }}>TOTAL DESPESAS</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-expense)', marginTop: '2px' }}>
              {formatCurrency(periodTotalExpense)}
            </div>
          </div>

          <div style={{
            padding: '12px 16px',
            background: periodNetBalance >= 0 ? 'rgba(99, 102, 241, 0.08)' : 'var(--color-expense-bg)',
            borderRadius: 'var(--radius-md)',
            border: periodNetBalance >= 0 ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <span style={{ fontSize: '0.72rem', color: periodNetBalance >= 0 ? 'var(--brand-primary-light)' : 'var(--color-expense)', fontWeight: 600 }}>
              RESULTADO LÍQUIDO
            </span>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: periodNetBalance >= 0 ? 'var(--brand-primary-light)' : 'var(--color-expense)',
              marginTop: '2px'
            }}>
              {formatCurrency(periodNetBalance)}
            </div>
          </div>
        </div>

        {/* Live Preview Table */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Data</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Descrição</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Categoria</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Forma Pagto</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum lançamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 15).map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                      {formatDateBR(t.date)}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                      {t.description}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                      {t.category}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {getPaymentMethodLabel(t.paymentMethod)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className={`badge ${t.status === 'paid' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.72rem' }}>
                        {t.status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td style={{
                      padding: '10px 14px',
                      textAlign: 'right',
                      fontWeight: 700,
                      color: t.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)'
                    }}>
                      {t.type === 'income' ? '+ ' : '- '}
                      {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredTransactions.length > 15 && (
            <div style={{ padding: '10px 14px', background: 'var(--bg-tertiary)', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Mostrando prévia dos primeiros 15 de <strong>{filteredTransactions.length}</strong> lançamentos. O arquivo exportado (XLSX / PDF) incluirá todos os registros.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
