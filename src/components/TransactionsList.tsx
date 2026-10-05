'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  CheckCircle, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Tag, 
  SlidersHorizontal,
  Plus,
  Calendar,
  CalendarClock,
  AlertCircle
} from 'lucide-react';
import { Transaction, Category } from '../types/finance';
import { formatCurrency, formatDateBR, getPaymentMethodLabel, formatMonthYearBR } from '../lib/formatters';

interface TransactionsListProps {
  transactions: Transaction[];
  categories: Category[];
  currentMonth: string;
  hideValues: boolean;
  onDeleteTransaction: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onOpenNewTransaction: () => void;
  onClearAllTransactions?: () => void;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  categories,
  currentMonth,
  hideValues,
  onDeleteTransaction,
  onToggleStatus,
  onOpenNewTransaction,
  onClearAllTransactions
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'pending'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [periodScope, setPeriodScope] = useState<'month' | 'all'>('month');

  // Filter transactions
  const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
  const outOfMonthTransactions = transactions.filter(t => !t.date.startsWith(currentMonth));

  const baseTransactions = periodScope === 'month' ? monthTransactions : transactions;

  const filteredTransactions = baseTransactions.filter(t => {
    // Type filter
    if (typeFilter === 'income' && t.type !== 'income') return false;
    if (typeFilter === 'expense' && t.type !== 'expense') return false;
    if (typeFilter === 'pending' && t.status !== 'pending') return false;

    // Category filter
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

    // Search term
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(query);
      const matchCat = t.category.toLowerCase().includes(query);
      const matchNotes = (t.notes || '').toLowerCase().includes(query);
      return matchDesc || matchCat || matchNotes;
    }

    return true;
  });

  // Calculate filtered sum
  const filteredTotal = filteredTransactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount;
  }, 0);

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {/* Header & Title */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Lançamentos & Extrato</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {filteredTransactions.length} registro(s) exibido(s) • Total filtrado: {' '}
            <strong style={{ color: filteredTotal >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}>
              {formatCurrency(filteredTotal, hideValues)}
            </strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Period Selector Tabs */}
          <div style={{
            display: 'inline-flex',
            background: 'var(--bg-tertiary)',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => setPeriodScope('month')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: periodScope === 'month' ? 'var(--brand-primary)' : 'transparent',
                color: periodScope === 'month' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Calendar size={13} />
              <span>Mês Atual ({monthTransactions.length})</span>
            </button>
            <button
              onClick={() => setPeriodScope('all')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: periodScope === 'all' ? 'var(--brand-primary)' : 'transparent',
                color: periodScope === 'all' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <CalendarClock size={13} />
              <span>Todo o Histórico ({transactions.length})</span>
            </button>
          </div>

          <button 
            onClick={onOpenNewTransaction}
            className="btn btn-primary"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>Novo Lançamento</span>
          </button>

          {onClearAllTransactions && transactions.length > 0 && periodScope === 'all' && (
            <button
              onClick={onClearAllTransactions}
              className="btn btn-danger"
              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
              title="Excluir todos os lançamentos e zerar o saldo"
            >
              <Trash2 size={14} />
              <span>Zerar Tudo</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert banner if there are transactions in other months */}
      {periodScope === 'month' && outOfMonthTransactions.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
            <AlertCircle size={18} color="var(--brand-primary-light)" />
            <span>
              Você possui <strong>{outOfMonthTransactions.length} lançamento(s)</strong> em outros meses ou datas que afetam o seu Saldo Geral.
            </span>
          </div>
          <button
            onClick={() => setPeriodScope('all')}
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          >
            Ver Todo o Histórico ({transactions.length})
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* Search input */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }}>
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Buscar por descrição, categoria ou nota..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '38px' }}
          />
        </div>

        {/* Filter Pills row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}>
          <button
            onClick={() => setTypeFilter('all')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: typeFilter === 'all' ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
              background: typeFilter === 'all' ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-tertiary)',
              color: typeFilter === 'all' ? 'var(--brand-primary-light)' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Todos
          </button>

          <button
            onClick={() => setTypeFilter('income')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: typeFilter === 'income' ? '1px solid var(--color-income)' : '1px solid var(--border-subtle)',
              background: typeFilter === 'income' ? 'var(--color-income-bg)' : 'var(--bg-tertiary)',
              color: typeFilter === 'income' ? 'var(--color-income)' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Receitas
          </button>

          <button
            onClick={() => setTypeFilter('expense')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: typeFilter === 'expense' ? '1px solid var(--color-expense)' : '1px solid var(--border-subtle)',
              background: typeFilter === 'expense' ? 'var(--color-expense-bg)' : 'var(--bg-tertiary)',
              color: typeFilter === 'expense' ? 'var(--color-expense)' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Despesas
          </button>

          <button
            onClick={() => setTypeFilter('pending')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: typeFilter === 'pending' ? '1px solid var(--color-warning)' : '1px solid var(--border-subtle)',
              background: typeFilter === 'pending' ? 'var(--color-warning-bg)' : 'var(--bg-tertiary)',
              color: typeFilter === 'pending' ? 'var(--color-warning)' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Pendentes
          </button>

          {/* Category Dropdown filter */}
          <div style={{ marginLeft: 'auto', minWidth: '160px' }}>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="form-select"
              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
            >
              <option value="all">Todas as Categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div style={{
          padding: '48px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <SlidersHorizontal size={40} opacity={0.4} />
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Nenhum lançamento encontrado
            </h4>
            <span style={{ fontSize: '0.82rem' }}>
              Tente mudar os filtros ou adicione uma nova transação neste mês.
            </span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredTransactions.map(t => {
            const isIncome = t.type === 'income';
            return (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'all 0.2s ease',
                  gap: '12px'
                }}
              >
                {/* Left icon & Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: isIncome ? 'var(--color-income-bg)' : 'var(--color-expense-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isIncome ? 'var(--color-income)' : 'var(--color-expense)',
                    flexShrink: 0
                  }}>
                    {isIncome ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.925rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {t.description}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                      marginTop: '4px',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)'
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Tag size={12} />
                        {t.category}
                      </span>
                      <span>•</span>
                      <span>{formatDateBR(t.date)}</span>
                      <span>•</span>
                      <span>{getPaymentMethodLabel(t.paymentMethod)}</span>
                      {t.notes && (
                        <>
                          <span>•</span>
                          <span style={{ fontStyle: 'italic', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.notes}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Amount & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: isIncome ? 'var(--color-income)' : 'var(--color-expense)'
                    }}>
                      {isIncome ? '+' : '-'}{formatCurrency(t.amount, hideValues)}
                    </div>

                    {/* Status Pill Toggle */}
                    <button
                      onClick={() => onToggleStatus(t.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        marginTop: '2px'
                      }}
                      title="Clique para alternar status"
                    >
                      <span className={`badge ${t.status === 'paid' ? 'badge-paid' : 'badge-pending'}`}>
                        {t.status === 'paid' ? (
                          <>
                            <CheckCircle size={10} />
                            {isIncome ? 'Recebido' : 'Pago'}
                          </>
                        ) : (
                          <>
                            <Clock size={10} />
                            {isIncome ? 'A Receber' : 'Pendente'}
                          </>
                        )}
                      </span>
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      if (confirm(`Excluir lançamento "${t.description}"?`)) {
                        onDeleteTransaction(t.id);
                      }
                    }}
                    className="btn-icon"
                    style={{ width: '32px', height: '32px' }}
                    title="Excluir Lançamento"
                    aria-label="Excluir Lançamento"
                  >
                    <Trash2 size={15} color="var(--color-expense)" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
