'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  CalendarClock, 
  CreditCard, 
  PieChart, 
  CloudSync, 
  PlusCircle,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { formatCurrency } from '../lib/formatters';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  totalBalance: number;
  hideValues: boolean;
  onOpenNewTransaction: () => void;
  isCloudConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  totalBalance,
  hideValues,
  onOpenNewTransaction,
  isCloudConnected
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'transactions', label: 'Lançamentos', icon: ArrowLeftRight },
    { id: 'recurring', label: 'Despesas Fixas', icon: CalendarClock },
    { id: 'installments', label: 'Parcelamentos', icon: CreditCard },
    { id: 'budgets', label: 'Metas & Limites', icon: PieChart },
    { id: 'settings', label: 'Nuvem & Backup', icon: CloudSync }
  ];

  return (
    <aside style={{
      width: '280px',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'none',
      flexDirection: 'column',
      padding: '24px 18px',
      zIndex: 100,
      overflowY: 'auto'
    }}
    id="desktop-sidebar"
    >
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'var(--brand-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: 'var(--brand-glow)'
        }}>
          <TrendingUp size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Cadê Meu <span style={{ color: 'var(--brand-primary-light)' }}>Dinheiro?</span>
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Controle Descomplicado
          </span>
        </div>
      </div>

      {/* Quick Action Button */}
      <button 
        onClick={onOpenNewTransaction}
        className="btn btn-primary"
        style={{ width: '100%', marginBottom: '28px', padding: '12px 18px' }}
      >
        <PlusCircle size={18} />
        <span>Novo Registro</span>
      </button>

      {/* Navigation List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        <div style={{ 
          fontSize: '0.72rem', 
          fontWeight: 700, 
          textTransform: 'uppercase', 
          letterSpacing: '0.08em', 
          color: 'var(--text-muted)',
          marginBottom: '8px',
          paddingLeft: '12px'
        }}>
          Menu Principal
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: isActive ? 'var(--brand-primary-light)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.2s ease',
                fontSize: '0.925rem'
              }}
            >
              <Icon size={19} color={isActive ? 'var(--brand-primary-light)' : 'var(--text-muted)'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Patrimony / Balance Snapshot */}
      <div className="glass-panel" style={{ padding: '16px', marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Patrimônio Líquido
          </span>
          <span className={`badge ${isCloudConnected ? 'badge-paid' : 'badge-card'}`}>
            {isCloudConnected ? 'Nuvem' : 'Local'}
          </span>
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: totalBalance >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}>
          {formatCurrency(totalBalance, hideValues)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <ShieldCheck size={14} color="var(--color-income)" />
          <span>Dados criptografados localmente</span>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 1024px) {
          #desktop-sidebar {
            display: flex !important;
          }
        }
      `}</style>
    </aside>
  );
};
