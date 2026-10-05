'use client';

import React from 'react';
import { 
  CalendarClock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Check,
  Bell
} from 'lucide-react';
import { RecurringBill } from '../types/finance';
import { formatCurrency } from '../lib/formatters';

interface RecurringManagerProps {
  recurringBills: RecurringBill[];
  currentMonth: string; // 'YYYY-MM'
  hideValues: boolean;
  onTogglePaidThisMonth: (billId: string) => void;
  onDeleteRecurringBill: (billId: string) => void;
  onOpenNewRecurring: () => void;
  onOpenNotificationModal?: () => void;
}

export const RecurringManager: React.FC<RecurringManagerProps> = ({
  recurringBills,
  currentMonth,
  hideValues,
  onTogglePaidThisMonth,
  onDeleteRecurringBill,
  onOpenNewRecurring,
  onOpenNotificationModal
}) => {
  const today = new Date();
  const currentDay = today.getDate();

  // Metrics for the month
  const totalBillsAmount = recurringBills.reduce((acc, b) => acc + (b.active ? b.amount : 0), 0);
  const paidBillsThisMonth = recurringBills.filter(b => b.paidMonths.includes(currentMonth));
  const paidAmount = paidBillsThisMonth.reduce((acc, b) => acc + b.amount, 0);
  const remainingAmount = totalBillsAmount - paidAmount;
  const progressPercent = totalBillsAmount > 0 ? Math.round((paidAmount / totalBillsAmount) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Email Due Date Reminder Banner */}
      {onOpenNotificationModal && (
        <div style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--brand-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)',
              flexShrink: 0
            }}>
              <Bell size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>
                Lembretes por E-mail no Vencimento
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Receba um e-mail automático às 08:00 no dia em que suas contas vencerem
              </span>
            </div>
          </div>

          <button 
            onClick={onOpenNotificationModal} 
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
          >
            <Bell size={14} />
            <span>Configurar & Testar</span>
          </button>
        </div>
      )}

      {/* Summary Banner */}
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
                background: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-info)'
              }}>
                <CalendarClock size={20} />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Contas Fixas & Recorrentes</h2>
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Acompanhamento mensal de vencimentos, assinaturas e despesas fixas
            </span>
          </div>

          <button onClick={onOpenNewRecurring} className="btn btn-primary" style={{ padding: '10px 16px' }}>
            <Plus size={16} />
            <span>Nova Despesa Fixa</span>
          </button>
        </div>

        {/* Progress Bar of paid bills this month */}
        <div style={{ background: 'var(--bg-tertiary)', padding: '18px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              Progresso do Mês ({paidBillsThisMonth.length} de {recurringBills.length} pagas)
            </span>
            <span style={{ fontWeight: 800, color: progressPercent === 100 ? 'var(--color-income)' : 'var(--brand-primary-light)' }}>
              {progressPercent}%
            </span>
          </div>

          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill"
              style={{
                width: `${progressPercent}%`,
                background: progressPercent === 100 
                  ? 'var(--color-income)' 
                  : 'linear-gradient(90deg, var(--color-info) 0%, var(--brand-primary) 100%)'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Total: <strong>{formatCurrency(totalBillsAmount, hideValues)}</strong></span>
            <span>Pago: <strong style={{ color: 'var(--color-income)' }}>{formatCurrency(paidAmount, hideValues)}</strong></span>
            <span>Restante: <strong style={{ color: 'var(--color-warning)' }}>{formatCurrency(remainingAmount, hideValues)}</strong></span>
          </div>
        </div>
      </div>

      {/* Bills Cards List */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '12px'
      }}>
        {recurringBills.map(bill => {
          const isPaid = bill.paidMonths.includes(currentMonth);
          const isOverdue = !isPaid && currentDay > bill.dueDay;
          const isDueSoon = !isPaid && bill.dueDay - currentDay >= 0 && bill.dueDay - currentDay <= 3;

          return (
            <div 
              key={bill.id}
              className="glass-panel"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
                borderLeft: isPaid 
                  ? '4px solid var(--color-income)' 
                  : isOverdue 
                  ? '4px solid var(--color-expense)' 
                  : '4px solid var(--color-warning)'
              }}
            >
              {/* Left Column: Details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '220px' }}>
                {/* 1-click Checkbox button */}
                <button
                  onClick={() => onTogglePaidThisMonth(bill.id)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: isPaid ? 'none' : '2px solid var(--border-strong)',
                    background: isPaid ? 'var(--color-income)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}
                  title={isPaid ? 'Marcar como não paga' : 'Marcar como paga neste mês'}
                >
                  {isPaid ? <Check size={20} strokeWidth={3} /> : null}
                </button>

                <div>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    textDecoration: isPaid ? 'line-through' : 'none',
                    opacity: isPaid ? 0.7 : 1
                  }}>
                    {bill.title}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    <span>{bill.category}</span>
                    <span>•</span>
                    <span>Vencimento todo dia {bill.dueDay}</span>
                  </div>
                </div>
              </div>

              {/* Center status pill */}
              <div>
                {isPaid ? (
                  <span className="badge badge-paid">
                    <CheckCircle2 size={12} />
                    Paga no Mês
                  </span>
                ) : isOverdue ? (
                  <span className="badge badge-overdue">
                    <AlertCircle size={12} />
                    Vencida dia {bill.dueDay}
                  </span>
                ) : isDueSoon ? (
                  <span className="badge badge-pending">
                    <AlertCircle size={12} />
                    Vence em {bill.dueDay - currentDay} dia(s)
                  </span>
                ) : (
                  <span className="badge badge-pending">
                    Vence dia {bill.dueDay}
                  </span>
                )}
              </div>

              {/* Right Column: Amount & Delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {formatCurrency(bill.amount, hideValues)}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mensal</span>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Excluir despesa fixa "${bill.title}"?`)) {
                      onDeleteRecurringBill(bill.id);
                    }
                  }}
                  className="btn-icon"
                  style={{ width: '32px', height: '32px' }}
                  title="Excluir despesa fixa"
                >
                  <Trash2 size={14} color="var(--color-expense)" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
