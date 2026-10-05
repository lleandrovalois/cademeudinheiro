'use client';

import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Sun, 
  Moon, 
  Cloud, 
  CloudCheck, 
  Plus, 
  Layers,
  Bell
} from 'lucide-react';
import { formatMonthYearBR } from '../lib/formatters';
import { AuthUser } from '../types/finance';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  hideValues: boolean;
  onToggleHideValues: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isCloudConnected: boolean;
  onOpenCloudConfig: () => void;
  onOpenNotificationModal?: () => void;
  onOpenNewTransaction: () => void;
  currentUser: AuthUser | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMonth,
  onMonthChange,
  hideValues,
  onToggleHideValues,
  isDarkMode,
  onToggleDarkMode,
  isCloudConnected,
  onOpenCloudConfig,
  onOpenNotificationModal,
  onOpenNewTransaction,
  currentUser,
  onOpenAuthModal,
  onSignOut
}) => {
  // Navigate previous / next month
  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const newMonthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(newMonthStr);
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const newMonthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(newMonthStr);
  };

  return (
    <header className="top-header">
      {/* Brand logo for mobile (sidebar handles desktop) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'var(--brand-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
        }}>
          <Layers size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
            Cadê Meu <span style={{ color: 'var(--brand-primary-light)' }}>Dinheiro?</span>
          </h1>
          <span className="header-brand-subtitle" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Controle Descomplicado
          </span>
        </div>
      </div>

      {/* Month Navigator Stepper */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-tertiary)',
        padding: '4px 8px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        gap: '6px'
      }}>
        <button 
          onClick={handlePrevMonth}
          className="btn-icon"
          style={{ width: '28px', height: '28px' }}
          title="Mês Anterior"
          aria-label="Mês Anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <span style={{ 
          fontSize: '0.85rem', 
          fontWeight: 700, 
          minWidth: '130px', 
          textAlign: 'center',
          userSelect: 'none'
        }}>
          {formatMonthYearBR(currentMonth)}
        </span>

        <button 
          onClick={handleNextMonth}
          className="btn-icon"
          style={{ width: '28px', height: '28px' }}
          title="Próximo Mês"
          aria-label="Próximo Mês"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Quick Add Button on Desktop */}
        <button 
          onClick={onOpenNewTransaction}
          className="btn btn-primary"
          style={{ display: 'none', padding: '8px 14px', fontSize: '0.85rem' }}
          id="btn-desktop-quick-add"
        >
          <Plus size={16} />
          <span>Novo Lançamento</span>
        </button>

        {/* Hide Values Toggle */}
        <button 
          onClick={onToggleHideValues}
          className="btn-icon"
          title={hideValues ? 'Mostrar Valores' : 'Ocultar Valores'}
          aria-label="Alternar visibilidade de valores"
        >
          {hideValues ? <EyeOff size={18} color="var(--brand-primary-light)" /> : <Eye size={18} />}
        </button>

        {/* Dark/Light Mode Toggle */}
        <button 
          onClick={onToggleDarkMode}
          className="btn-icon"
          title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
          aria-label="Alternar tema claro/escuro"
        >
          {isDarkMode ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} />}
        </button>

        {/* Email Reminders & Notifications */}
        <button 
          id="btn-header-notifications"
          onClick={onOpenNotificationModal}
          className="btn-icon"
          title="Lembretes por E-mail no Vencimento"
          aria-label="Lembretes por E-mail"
          style={{ 
            position: 'relative',
            background: 'rgba(99, 102, 241, 0.15)',
            borderColor: 'rgba(99, 102, 241, 0.4)'
          }}
        >
          <Bell size={18} color="var(--brand-primary-light)" />
          <span style={{
            position: 'absolute',
            top: '3px',
            right: '3px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 6px #10b981'
          }} />
        </button>

        {/* Cloud Sync Status / Settings */}
        <button 
          onClick={onOpenCloudConfig}
          className="btn-icon"
          style={{
            borderColor: isCloudConnected ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)',
            background: isCloudConnected ? 'var(--color-income-bg)' : 'var(--bg-tertiary)'
          }}
          title={isCloudConnected ? 'Banco de Dados SQLite VPS Ativo' : 'Configurar Banco de Dados / Backup'}
          aria-label="Configuração de Banco de Dados e Backup"
        >
          {isCloudConnected ? (
            <CloudCheck size={18} color="var(--color-income)" />
          ) : (
            <Cloud size={18} />
          )}
        </button>

        {/* User Auth Profile Menu */}
        <UserMenu
          currentUser={currentUser}
          onOpenAuthModal={onOpenAuthModal}
          onOpenNotificationModal={onOpenNotificationModal}
          onSignOut={onSignOut}
        />
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .header-brand-subtitle {
            display: none !important;
          }
        }
        @media (min-width: 768px) {
          #btn-desktop-quick-add {
            display: inline-flex !important;
          }
        }
      `}</style>
    </header>
  );
};
