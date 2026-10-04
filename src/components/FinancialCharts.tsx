'use client';

import React, { useState } from 'react';
import { Transaction } from '../types/finance';
import { formatCurrency, formatShortMonth } from '../lib/formatters';

interface FinancialChartsProps {
  transactions: Transaction[];
  currentMonth: string;
  hideValues: boolean;
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({
  transactions,
  currentMonth,
  hideValues
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // 1. Calculate Monthly Cashflow for the last 6 months
  const monthsList: string[] = [];
  const [curYear, curMonth] = currentMonth.split('-').map(Number);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(curYear, curMonth - 1 - i, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthsList.push(mStr);
  }

  const monthlyData = monthsList.map(mStr => {
    const monthTxs = transactions.filter(t => t.date.startsWith(mStr) && t.status === 'paid');
    const income = monthTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return {
      monthStr: mStr,
      label: formatShortMonth(mStr),
      income,
      expense
    };
  });

  const maxVal = Math.max(
    ...monthlyData.map(d => Math.max(d.income, d.expense)),
    1000 // Minimum scale
  );

  // 2. Calculate Category Breakdown for the current month
  const currentMonthExpenses = transactions.filter(
    t => t.date.startsWith(currentMonth) && t.type === 'expense' && t.status === 'paid'
  );

  const categoryTotals: Record<string, number> = {};
  currentMonthExpenses.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const categoryColors: Record<string, string> = {
    'Alimentação & Mercado': '#f59e0b',
    'Moradia & Contas': '#6366f1',
    'Transporte & Combustível': '#ec4899',
    'Saúde & Bem-estar': '#ef4444',
    'Lazer & Entretenimento': '#a855f7',
    'Compras & Shopping': '#3b82f6',
    'Educação & Cursos': '#14b8a6',
    'Outros': '#64748b'
  };

  const totalExpenseAmount = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amount]) => ({
      name: cat,
      amount,
      percentage: totalExpenseAmount > 0 ? (amount / totalExpenseAmount) * 100 : 0,
      color: categoryColors[cat] || '#8b5cf6'
    }));

  // Donut chart math
  let accumulatedAngle = 0;
  const donutSlices = sortedCategories.map(cat => {
    const angle = (cat.percentage / 100) * 360;
    const startAngle = accumulatedAngle;
    accumulatedAngle += angle;
    return {
      ...cat,
      startAngle,
      angle
    };
  });

  // Helper for SVG donut slice
  const getCoordinatesForAngle = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: 100 + radius * Math.cos(rad),
      y: 100 + radius * Math.sin(rad)
    };
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '20px',
      marginBottom: '24px'
    }}
    id="charts-grid-container"
    >
      {/* 1. Bar Chart: Fluxo de Caixa Mensal */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Fluxo de Caixa Mensal</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Comparativo de Receitas vs Despesas (Últimos 6 meses)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--color-income)' }} />
              Receitas
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--color-expense)' }} />
              Despesas
            </span>
          </div>
        </div>

        {/* SVG Bar Chart */}
        <div style={{ width: '100%', height: '220px', position: 'relative' }}>
          <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            {/* Guide lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
              <line 
                key={idx}
                x1="30"
                y1={170 - ratio * 140}
                x2="480"
                y2={170 - ratio * 140}
                stroke="var(--border-subtle)"
                strokeDasharray="4 4"
              />
            ))}

            {/* Bars for each month */}
            {monthlyData.map((d, index) => {
              const xCenter = 70 + index * 75;
              const incomeHeight = (d.income / maxVal) * 140;
              const expenseHeight = (d.expense / maxVal) * 140;
              const isSelected = d.monthStr === currentMonth;

              return (
                <g key={d.monthStr} style={{ cursor: 'pointer' }}>
                  {/* Selected indicator backglow */}
                  {isSelected && (
                    <rect 
                      x={xCenter - 26}
                      y="15"
                      width="52"
                      height="165"
                      rx="8"
                      fill="rgba(99, 102, 241, 0.08)"
                    />
                  )}

                  {/* Income bar */}
                  <rect 
                    x={xCenter - 18}
                    y={170 - incomeHeight}
                    width="14"
                    height={Math.max(incomeHeight, 2)}
                    rx="4"
                    fill="var(--color-income)"
                    opacity={isSelected ? 1 : 0.85}
                    onMouseEnter={() => setActiveTooltip(`Receita (${d.label}): ${formatCurrency(d.income, hideValues)}`)}
                    onMouseLeave={() => setActiveTooltip(null)}
                  />

                  {/* Expense bar */}
                  <rect 
                    x={xCenter + 2}
                    y={170 - expenseHeight}
                    width="14"
                    height={Math.max(expenseHeight, 2)}
                    rx="4"
                    fill="var(--color-expense)"
                    opacity={isSelected ? 1 : 0.85}
                    onMouseEnter={() => setActiveTooltip(`Despesa (${d.label}): ${formatCurrency(d.expense, hideValues)}`)}
                    onMouseLeave={() => setActiveTooltip(null)}
                  />

                  {/* Month Label */}
                  <text 
                    x={xCenter}
                    y="190"
                    textAnchor="middle"
                    fill={isSelected ? 'var(--brand-primary-light)' : 'var(--text-muted)'}
                    fontSize="11"
                    fontWeight={isSelected ? '700' : '500'}
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip popup */}
          {activeTooltip && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-strong)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              boxShadow: 'var(--shadow-md)',
              pointerEvents: 'none'
            }}>
              {activeTooltip}
            </div>
          )}
        </div>
      </div>

      {/* 2. Donut Chart: Despesas por Categoria */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Despesas por Categoria</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Distribuição dos gastos do mês corrente
          </span>
        </div>

        {totalExpenseAmount === 0 ? (
          <div style={{
            height: '220px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            textAlign: 'center'
          }}>
            <span>Nenhuma despesa paga registrada neste mês</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {/* SVG Donut */}
            <div style={{ width: '150px', height: '150px', position: 'relative', margin: '0 auto' }}>
              <svg viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                {donutSlices.map((slice, i) => {
                  const strokeWidth = 26;
                  const radius = 72;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDasharray = `${(slice.percentage * circumference) / 100} ${circumference}`;
                  const strokeDashoffset = -((slice.startAngle * circumference) / 360);

                  return (
                    <circle
                      key={i}
                      cx="100"
                      cy="100"
                      r={radius}
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      style={{ transition: 'stroke-width 0.2s ease', cursor: 'pointer' }}
                    />
                  );
                })}
              </svg>

              {/* Center Info */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Total Gasto
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formatCurrency(totalExpenseAmount, hideValues)}
                </span>
              </div>
            </div>

            {/* Category Legend list */}
            <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sortedCategories.slice(0, 5).map(cat => (
                <div key={cat.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: cat.color }} />
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{cat.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatCurrency(cat.amount, hideValues)}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: '38px', textAlign: 'right' }}>
                      {cat.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @media (min-width: 1024px) {
          #charts-grid-container {
            grid-template-columns: 3fr 2fr !important;
          }
        }
      `}</style>
    </div>
  );
};
