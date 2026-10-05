'use client';

import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  KeyRound, 
  Mail, 
  Lock, 
  User, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { AuthUser } from '../types/finance';
import { signInWithEmail, signUpWithEmail, resetPasswordForEmail, loginAsGuest } from '../lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    if (mode === 'login') {
      const { user, error } = await signInWithEmail(email.trim(), password);
      if (error) {
        setErrorMsg(error);
      } else if (user) {
        onAuthSuccess(user);
        onClose();
      }
    } else if (mode === 'register') {
      if (password.length < 6) {
        setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
        setLoading(false);
        return;
      }
      const { user, error } = await signUpWithEmail(email.trim(), password, name);
      if (error) {
        setErrorMsg(error);
      } else if (user) {
        setSuccessMsg('Conta criada com sucesso!');
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
        }, 800);
      }
    } else if (mode === 'forgot') {
      const { success, error } = await resetPasswordForEmail(email.trim());
      if (error) {
        setErrorMsg(error);
      } else if (success) {
        setSuccessMsg('Enviamos um e-mail com as instruções para redefinir sua senha.');
      }
    }

    setLoading(false);
  };

  const handleGuestLogin = () => {
    const guest = loginAsGuest();
    onAuthSuccess(guest);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ padding: '28px', maxWidth: '440px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--brand-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--brand-glow)'
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                {mode === 'login' ? 'Entrar na sua Conta' : mode === 'register' ? 'Criar Nova Conta' : 'Recuperar Senha'}
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Seus dados financeiros protegidos e isolados
              </span>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--bg-tertiary)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          gap: '4px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: mode === 'login' ? 'var(--bg-card-hover)' : 'transparent',
              color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <LogIn size={15} />
            <span>Entrar</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: mode === 'register' ? 'var(--bg-card-hover)' : 'transparent',
              color: mode === 'register' ? 'var(--brand-primary-light)' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={15} />
            <span>Criar Conta</span>
          </button>
        </div>

        {/* Feedback messages */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--color-expense-bg)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: 'var(--color-expense)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.82rem',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--color-income-bg)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--color-income)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.82rem',
            marginBottom: '16px'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Seu Nome</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <User size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Como quer ser chamado?"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">E-mail</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Mail size={16} />
              </div>
              <input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '38px' }}
                required
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="form-label" style={{ margin: 0 }}>Senha</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMsg(null); setSuccessMsg(null); }}
                    style={{ background: 'none', border: 'none', color: 'var(--brand-primary-light)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  placeholder="Mínimo 6 dígitos"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem', marginTop: '10px' }}
          >
            {loading ? (
              <span>Aguarde...</span>
            ) : mode === 'login' ? (
              <>
                <LogIn size={18} />
                <span>Acessar Minhas Finanças</span>
              </>
            ) : mode === 'register' ? (
              <>
                <UserPlus size={18} />
                <span>Criar Minha Conta</span>
              </>
            ) : (
              <>
                <KeyRound size={18} />
                <span>Enviar Link de Recuperação</span>
              </>
            )}
          </button>
        </form>

        {mode === 'forgot' && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              ← Voltar para o Login
            </button>
          </div>
        )}

        {/* Divider / Guest mode option */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '20px 0 14px',
          color: 'var(--text-muted)',
          fontSize: '0.75rem'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span>OU</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        <button
          type="button"
          onClick={handleGuestLogin}
          className="btn btn-secondary"
          style={{ width: '100%', fontSize: '0.825rem', padding: '10px' }}
        >
          <Sparkles size={15} color="var(--brand-primary-light)" />
          <span>Usar no Modo Demonstração (Sem Cadastro)</span>
        </button>
      </div>
    </div>
  );
};
