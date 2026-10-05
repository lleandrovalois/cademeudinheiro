'use client';

import React, { useState } from 'react';
import { 
  User, 
  LogOut, 
  LogIn, 
  ShieldCheck, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { AuthUser } from '../types/finance';

interface UserMenuProps {
  currentUser: AuthUser | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  currentUser,
  onOpenAuthModal,
  onSignOut
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!currentUser || currentUser.isGuest) {
    return (
      <button
        onClick={onOpenAuthModal}
        className="btn btn-primary"
        style={{ padding: '6px 14px', fontSize: '0.82rem' }}
        title="Entrar ou criar conta para salvar suas finanças na nuvem"
      >
        <LogIn size={15} />
        <span>Entrar / Cadastrar</span>
      </button>
    );
  }

  const initials = (currentUser.name || currentUser.email || 'U')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setDropdownOpen(prev => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-full)',
          padding: '4px 10px 4px 4px',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontSize: '0.8rem',
          fontWeight: 600
        }}
      >
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'var(--brand-gradient)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 800
        }}>
          {initials}
        </div>
        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentUser.name || currentUser.email.split('@')[0]}
        </span>
        <ChevronDown size={14} color="var(--text-muted)" />
      </button>

      {dropdownOpen && (
        <>
          <div 
            onClick={() => setDropdownOpen(false)} 
            style={{ position: 'fixed', inset: 0, zIndex: 998 }} 
          />
          <div style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: '12px',
            minWidth: '220px',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Conectado como</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.email}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '0.72rem', color: 'var(--color-income)' }}>
                <ShieldCheck size={13} />
                <span>Conta Autenticada</span>
              </div>
            </div>

            <button
              onClick={() => {
                setDropdownOpen(false);
                if (confirm('Deseja realmente sair da sua conta?')) {
                  onSignOut();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                background: 'none',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-expense)',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <LogOut size={15} />
              <span>Sair da Conta</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
