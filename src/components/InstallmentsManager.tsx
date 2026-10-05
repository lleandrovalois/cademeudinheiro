'use client';

import React from 'react';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Calendar, 
  ChevronRight, 
  PartyPopper,
  CheckCircle2,
  Pencil,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { InstallmentPurchase } from '../types/finance';
import { formatCurrency, formatDateBR } from '../lib/formatters';
import { exportInstallmentsToExcel, exportInstallmentsToPDF } from '../lib/exportReports';

interface InstallmentsManagerProps {
  installments: InstallmentPurchase[];
  hideValues: boolean;
  onAdvanceInstallment: (installmentId: string) => void;
  onDeleteInstallment: (installmentId: string) => void;
  onOpenNewInstallment: () => void;
  onEditInstallment?: (installment: InstallmentPurchase) => void;
}

export const InstallmentsManager: React.FC<InstallmentsManagerProps> = ({
  installments,
  hideValues,
  onAdvanceInstallment,
  onDeleteInstallment,
  onOpenNewInstallment,
  onEditInstallment
}) => {
  // Metrics
  const activeInstallments = installments.filter(i => i.paidInstallments < i.totalInstallments);
  const completedInstallments = installments.filter(i => i.paidInstallments >= i.totalInstallments);

  const monthlyCommitment = activeInstallments.reduce((acc, i) => acc + i.installmentAmount, 0);
  const totalRemainingDebt = activeInstallments.reduce((acc, i) => {
    const remainingCount = i.totalInstallments - i.paidInstallments;
    return acc + (remainingCount * i.installmentAmount);
  }, 0);

  const handleAdvance = (inst: InstallmentPurchase) => {
    if (inst.paidInstallments + 1 >= inst.totalInstallments) {
      // Trigger confetti celebration!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    onAdvanceInstallment(inst.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header and Summary Cards */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary-light)'
              }}>
                <CreditCard size={20} />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Compras Parceladas & Cartões</h2>
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Controle de parcelas em aberto, limite comprometido e projeções
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => exportInstallmentsToPDF(installments)}
              disabled={installments.length === 0}
              className="btn btn-secondary"
              style={{ padding: '9px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Baixar relatório em PDF das compras parceladas"
            >
              <FileText size={15} color="#ef4444" />
              <span>PDF</span>
            </button>

            <button
              onClick={() => exportInstallmentsToExcel(installments)}
              disabled={installments.length === 0}
              className="btn btn-secondary"
              style={{ padding: '9px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Baixar planilha Excel (.xlsx) das compras parceladas"
            >
              <FileSpreadsheet size={15} color="#10b981" />
              <span>Excel</span>
            </button>

            <button onClick={onOpenNewInstallment} className="btn btn-primary" style={{ padding: '10px 16px' }}>
              <Plus size={16} />
              <span>Novo Parcelamento</span>
            </button>
          </div>
        </div>

        {/* Top 3 KPI Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Comprometimento Mensal
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-expense)', marginTop: '4px' }}>
              {formatCurrency(monthlyCommitment, hideValues)}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Soma das faturas este mês
            </span>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Dívida Restante Total
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-primary-light)', marginTop: '4px' }}>
              {formatCurrency(totalRemainingDebt, hideValues)}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Total a pagar nos próximos meses
            </span>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Parcelamentos Ativos
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {activeInstallments.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>em aberto</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-income)' }}>
              {completedInstallments.length} já quitado(s)
            </span>
          </div>
        </div>
      </div>

      {/* Installment Items Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {installments.map(inst => {
          const isFinished = inst.paidInstallments >= inst.totalInstallments;
          const percent = Math.min(100, Math.round((inst.paidInstallments / inst.totalInstallments) * 100));
          const remainingCount = Math.max(0, inst.totalInstallments - inst.paidInstallments);
          const paidTotal = inst.paidInstallments * inst.installmentAmount;
          const remainingTotal = remainingCount * inst.installmentAmount;

          // End date calculation based on remaining installments
          const [startYear, startMonth, startDay] = inst.startDate.split('-').map(Number);
          const monthsToAdd = remainingCount > 0 ? (remainingCount - 1) : 0;
          const endDate = new Date(startYear, (startMonth - 1) + monthsToAdd, startDay || 1);
          const endStr = isFinished ? 'Quitado' : `${String(endDate.getMonth() + 1).padStart(2, '0')}/${endDate.getFullYear()}`;

          return (
            <div 
              key={inst.id}
              className="glass-panel"
              style={{
                padding: '20px',
                borderLeft: isFinished ? '4px solid var(--color-income)' : '4px solid var(--brand-primary)'
              }}
            >
              {/* Header row of card */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '14px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{inst.description}</h3>
                    {isFinished && (
                      <span className="badge badge-paid">
                        <CheckCircle2 size={12} /> Quitado
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {inst.paymentCard && <span className="badge badge-card">{inst.paymentCard}</span>}
                    <span>{inst.category}</span>
                    <span>• Início: {formatDateBR(inst.startDate)}</span>
                    <span>• Término previsto: {endStr}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {formatCurrency(inst.installmentAmount, hideValues)}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/mês</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Total da compra: {formatCurrency(inst.totalAmount, hideValues)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {inst.paidInstallments} de {inst.totalInstallments} parcelas pagas
                  </span>
                  <span style={{ fontWeight: 700, color: isFinished ? 'var(--color-income)' : 'var(--brand-primary-light)' }}>
                    {percent}%
                  </span>
                </div>

                <div className="progress-bar-container" style={{ height: '10px' }}>
                  <div 
                    className="progress-bar-fill" 
                    style={{
                      width: `${percent}%`,
                      background: isFinished 
                        ? 'var(--color-income)' 
                        : 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Já pago: <strong style={{ color: 'var(--color-income)' }}>{formatCurrency(paidTotal, hideValues)}</strong></span>
                  <span>Restante: <strong style={{ color: 'var(--color-warning)' }}>{formatCurrency(remainingTotal, hideValues)}</strong> ({remainingCount}x restantes)</span>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                {!isFinished ? (
                  <button
                    onClick={() => handleAdvance(inst)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    <Plus size={14} />
                    <span>Pagar / Antecipar 1 Parcela</span>
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-income)', fontWeight: 600 }}>
                    <PartyPopper size={16} />
                    <span>Todas as parcelas foram quitadas!</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {onEditInstallment && (
                    <button
                      onClick={() => onEditInstallment(inst)}
                      className="btn-icon"
                      style={{ width: '32px', height: '32px' }}
                      title="Editar Parcelamento"
                      aria-label="Editar Parcelamento"
                    >
                      <Pencil size={14} color="var(--brand-primary-light)" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (confirm(`Excluir parcelamento "${inst.description}"?`)) {
                        onDeleteInstallment(inst.id);
                      }
                    }}
                    className="btn-icon"
                    style={{ width: '32px', height: '32px' }}
                    title="Excluir Parcelamento"
                  >
                    <Trash2 size={14} color="var(--color-expense)" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
