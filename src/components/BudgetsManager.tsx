'use client';

import React, { useState } from 'react';
import { 
  PieChart, 
  Target, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  ShieldCheck, 
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Budget, SavingsGoal, Transaction } from '../types/finance';
import { formatCurrency } from '../lib/formatters';

interface BudgetsManagerProps {
  budgets: Budget[];
  goals: SavingsGoal[];
  transactions: Transaction[];
  currentMonth: string;
  hideValues: boolean;
  onUpdateBudget: (category: string, newLimit: number) => void;
  onAddFundsToGoal: (goalId: string, amount: number) => void;
  onDeleteGoal: (goalId: string) => void;
  onOpenNewGoal: () => void;
}

export const BudgetsManager: React.FC<BudgetsManagerProps> = ({
  budgets,
  goals,
  transactions,
  currentMonth,
  hideValues,
  onUpdateBudget,
  onAddFundsToGoal,
  onDeleteGoal,
  onOpenNewGoal
}) => {
  // Category spending calculation for current month
  const monthExpenses = transactions.filter(
    t => t.date.startsWith(currentMonth) && t.type === 'expense' && t.status === 'paid'
  );

  const spentByCategory: Record<string, number> = {};
  monthExpenses.forEach(t => {
    spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount;
  });

  // State for deposit modal/input
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const handleDeposit = (goal: SavingsGoal) => {
    const val = parseFloat(depositAmount.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    if (goal.currentAmount + val >= goal.targetAmount) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    }

    onAddFundsToGoal(goal.id, val);
    setSelectedGoalId(null);
    setDepositAmount('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. SECTION: TETOS DE GASTO POR CATEGORIA */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-warning)'
              }}>
                <PieChart size={20} />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Tetos & Limites de Gastos</h2>
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Defina orçamentos mensais para não estourar seu orçamento em categorias chave
            </span>
          </div>
        </div>

        {/* Budgets Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {budgets.map(b => {
            const spent = spentByCategory[b.category] || 0;
            const percent = Math.round((spent / b.monthlyLimit) * 100);
            const remaining = b.monthlyLimit - spent;
            const isExceeded = spent > b.monthlyLimit;
            const isWarning = !isExceeded && percent >= 75;

            return (
              <div 
                key={b.id}
                style={{
                  background: 'var(--bg-tertiary)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: isExceeded 
                    ? '1px solid var(--color-expense)' 
                    : isWarning 
                    ? '1px solid var(--color-warning)' 
                    : '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{b.category}</span>
                  <span className={`badge ${isExceeded ? 'badge-overdue' : isWarning ? 'badge-pending' : 'badge-paid'}`}>
                    {isExceeded ? 'Estourado' : `${percent}%`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="progress-bar-container" style={{ height: '8px', marginBottom: '8px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(100, percent)}%`,
                      background: isExceeded ? 'var(--color-expense)' : isWarning ? 'var(--color-warning)' : 'var(--color-income)'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>Gasto: <strong>{formatCurrency(spent, hideValues)}</strong></span>
                  <span>Teto: <strong>{formatCurrency(b.monthlyLimit, hideValues)}</strong></span>
                </div>

                <div style={{ marginTop: '8px', fontSize: '0.75rem', fontWeight: 600, color: isExceeded ? 'var(--color-expense)' : 'var(--text-secondary)' }}>
                  {isExceeded ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={14} /> Estourou em {formatCurrency(Math.abs(remaining), hideValues)}
                    </span>
                  ) : (
                    <span>Restam {formatCurrency(remaining, hideValues)} para gastar</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. SECTION: METAS DE ECONOMIA */}
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
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-income)'
              }}>
                <Target size={20} />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Metas de Economia & Sonhos</h2>
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Acompanhe a construção da sua reserva de emergência e objetivos futuros
            </span>
          </div>

          <button onClick={onOpenNewGoal} className="btn btn-primary" style={{ padding: '10px 16px' }}>
            <Plus size={16} />
            <span>Nova Meta</span>
          </button>
        </div>

        {/* Goals Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {goals.map(goal => {
            const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const isCompleted = percent >= 100;

            return (
              <div
                key={goal.id}
                style={{
                  background: 'var(--bg-tertiary)',
                  padding: '20px',
                  borderRadius: 'var(--radius-lg)',
                  border: isCompleted ? '1px solid var(--color-income)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{goal.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Objetivo: {formatCurrency(goal.targetAmount, hideValues)}
                    </span>
                  </div>

                  <span className={`badge ${isCompleted ? 'badge-paid' : 'badge-card'}`}>
                    {isCompleted ? 'Meta Atingida!' : `${percent}%`}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="progress-bar-container" style={{ height: '10px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${percent}%`,
                        background: isCompleted 
                          ? 'var(--color-income)' 
                          : 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>Acumulado: <strong style={{ color: 'var(--color-income)' }}>{formatCurrency(goal.currentAmount, hideValues)}</strong></span>
                    <span>Faltam: <strong>{formatCurrency(remaining, hideValues)}</strong></span>
                  </div>
                </div>

                {/* Deposit Action */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  {selectedGoalId === goal.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                      <input
                        type="number"
                        placeholder="R$ Valor"
                        value={depositAmount}
                        onChange={e => setDepositAmount(e.target.value)}
                        className="form-input"
                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                        autoFocus
                      />
                      <button 
                        onClick={() => handleDeposit(goal)}
                        className="btn btn-income"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Salvar
                      </button>
                      <button 
                        onClick={() => setSelectedGoalId(null)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setSelectedGoalId(goal.id)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        <Plus size={14} />
                        <span>Adicionar Valor</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Excluir meta "${goal.title}"?`)) {
                            onDeleteGoal(goal.id);
                          }
                        }}
                        className="btn-icon"
                        style={{ width: '30px', height: '30px' }}
                        title="Excluir Meta"
                      >
                        <Trash2 size={13} color="var(--color-expense)" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
