'use client';

import React, { useState } from 'react';
import { 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  KeyRound,
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  TrendingUp,
  Smartphone,
  Layers,
  LockKeyhole
} from 'lucide-react';
import { AuthUser } from '../types/finance';
import { signInWithEmail, signUpWithEmail, resetPasswordForEmail, loginAsGuest } from '../lib/auth';

interface AuthScreenProps {
  onAuthSuccess: (user: AuthUser) => void;
}

type Mode = 'login' | 'register' | 'forgot';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
        setSuccessMsg('Conta criada com sucesso! Entrando...');
        setTimeout(() => {
          onAuthSuccess(user);
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
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 20% 15%, rgba(99, 102, 241, 0.15) 0%, transparent 45%), radial-gradient(circle at 80% 85%, rgba(16, 185, 129, 0.1) 0%, transparent 45%), var(--bg-primary)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Brand Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '28px'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--brand-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: 'var(--brand-glow)',
            marginBottom: '16px'
          }}>
            <TrendingUp size={30} />
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Cadê Meu <span style={{ color: 'var(--brand-primary-light)' }}>Dinheiro?</span>
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '340px' }}>
            Controle financeiro pessoal inteligente, seguro e 100% individualizado.
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-panel" style={{
          width: '100%',
          padding: '30px 26px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--bg-tertiary)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            gap: '4px',
            marginBottom: '22px'
          }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
              style={{
                padding: '10px 14px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: mode === 'login' ? 'var(--bg-card-hover)' : 'transparent',
                color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <LogIn size={16} />
              <span>Entrar</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
              style={{
                padding: '10px 14px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: mode === 'register' ? 'var(--bg-card-hover)' : 'transparent',
                color: mode === 'register' ? 'var(--brand-primary-light)' : 'var(--text-muted)',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <UserPlus size={16} />
              <span>Cadastre-se</span>
            </button>
          </div>

          {/* Feedback alerts */}
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--color-expense-bg)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--color-expense)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.825rem',
              marginBottom: '18px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--color-income-bg)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--color-income)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.825rem',
              marginBottom: '18px'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
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
              style={{ width: '100%', padding: '13px', fontSize: '0.95rem', marginTop: '12px' }}
            >
              {loading ? (
                <span>Aguarde...</span>
              ) : mode === 'login' ? (
                <>
                  <LogIn size={18} />
                  <span>Acessar Minha Conta</span>
                </>
              ) : mode === 'register' ? (
                <>
                  <UserPlus size={18} />
                  <span>Criar Minha Conta</span>
                </>
              ) : (
                <>
                  <KeyRound size={18} />
                  <span>Recuperar Minha Senha</span>
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

          {/* Guest demo option */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '22px 0 16px',
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
            style={{ width: '100%', fontSize: '0.82rem', padding: '11px' }}
          >
            <Sparkles size={16} color="var(--brand-primary-light)" />
            <span>Acessar Modo Demonstração (Sem Cadastro)</span>
          </button>
        </div>

        {/* Security Footer Notice */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '20px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <LockKeyhole size={14} color="var(--color-income)" />
          <span>Isolamento total de dados • Suas finanças visíveis apenas para você</span>
        </div>
      </div>
    </div>
  );
};
