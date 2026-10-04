'use client';

import React from 'react';
import { 
  Wallet, 
  ArrowDownRight, 
  ArrowUpRight, 
  PiggyBank, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { FinancialSummary } from '../types/finance';
import { formatCurrency } from '../lib/formatters';

interface BalanceCardsProps {
  summary: FinancialSummary;
  hideValues: boolean;
  onOpenNewIncome: () => void;
  onOpenNewExpense: () => void;
}

export const BalanceCards: React.FC<BalanceCardsProps> = ({
  summary,
  hideValues,
  onOpenNewIncome,
  onOpenNewExpense
}) => {
  return (
    <section className="grid-cards" style={{ marginBottom: '24px' }}>
      {/* 1. Saldo Geral Total */}
      <div className="glass-panel glass-panel-interactive" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Saldo Geral Atual
          </span>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand-primary-light)'
          }}>
            <Wallet size={20} />
          </div>
        </div>

        <div style={{
          fontSize: '1.85rem',
          fontWeight: 800,
          color: summary.totalBalance >= 0 ? 'var(--text-primary)' : 'var(--color-expense)',
          letterSpacing: '-0.02em',
          marginBottom: '8px'
        }}>
          {formatCurrency(summary.totalBalance, hideValues)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <CheckCircle2 size={14} color="var(--color-income)" />
          <span>Considera todas as contas registradas</span>
        </div>
      </div>

      {/* 2. Receitas do Mês */}
      <div className="glass-panel glass-panel-interactive" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Receitas do Mês
          </span>
          <button 
            onClick={onOpenNewIncome}
            className="btn-icon" 
            style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--color-income-bg)', border: 'none' }}
            title="Adicionar Receita"
          >
            <ArrowUpRight size={20} color="var(--color-income)" />
          </button>
        </div>

        <div style={{
          fontSize: '1.85rem',
          fontWeight: 800,
          color: 'var(--color-income)',
          letterSpacing: '-0.02em',
          marginBottom: '8px'
        }}>
          {formatCurrency(summary.monthlyIncome, hideValues)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {summary.pendingIncome > 0 ? (
            <>
              <Clock size={14} color="var(--color-warning)" />
              <span>A receber: {formatCurrency(summary.pendingIncome, hideValues)}</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={14} color="var(--color-income)" />
              <span>100% recebidas até o momento</span>
            </>
          )}
        </div>
      </div>

      {/* 3. Despesas do Mês */}
      <div className="glass-panel glass-panel-interactive" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Despesas do Mês
          </span>
          <button 
            onClick={onOpenNewExpense}
            className="btn-icon" 
            style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--color-expense-bg)', border: 'none' }}
            title="Adicionar Despesa"
          >
            <ArrowDownRight size={20} color="var(--color-expense)" />
          </button>
        </div>

        <div style={{
          fontSize: '1.85rem',
          fontWeight: 800,
          color: 'var(--color-expense)',
          letterSpacing: '-0.02em',
          marginBottom: '8px'
        }}>
          {formatCurrency(summary.monthlyExpense, hideValues)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {summary.pendingExpense > 0 ? (
            <>
              <AlertCircle size={14} color="var(--color-warning)" />
              <span>Pendente: {formatCurrency(summary.pendingExpense, hideValues)}</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={14} color="var(--color-income)" />
              <span>Nenhuma conta atrasada ou pendente</span>
            </>
          )}
        </div>
      </div>

      {/* 4. Economia do Mês / Taxa de Poupança */}
      <div className="glass-panel glass-panel-interactive" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Balanço & Poupança
          </span>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: summary.monthlySavings >= 0 ? 'var(--color-income-bg)' : 'var(--color-expense-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: summary.monthlySavings >= 0 ? 'var(--color-income)' : 'var(--color-expense)'
          }}>
            <PiggyBank size={20} />
          </div>
        </div>

        <div style={{
          fontSize: '1.85rem',
          fontWeight: 800,
          color: summary.monthlySavings >= 0 ? 'var(--brand-primary-light)' : 'var(--color-expense)',
          letterSpacing: '-0.02em',
          marginBottom: '8px'
        }}>
          {formatCurrency(summary.monthlySavings, hideValues)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Taxa de poupança:</span>
          <span className={`badge ${summary.savingsRate >= 20 ? 'badge-paid' : summary.savingsRate > 0 ? 'badge-pending' : 'badge-overdue'}`}>
            {summary.savingsRate > 0 ? `+${summary.savingsRate}%` : `${summary.savingsRate}%`}
          </span>
        </div>
      </div>
    </section>
  );
};
