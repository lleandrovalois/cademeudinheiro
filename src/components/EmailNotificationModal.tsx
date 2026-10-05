'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  BellRing, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Server, 
  Clock, 
  Sparkles,
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { AuthUser } from '../types/finance';

interface EmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
}

export const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [enabled, setEnabled] = useState(true);
  const [isSmtpConfigured, setIsSmtpConfigured] = useState(false);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(true);
  
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchSettings = async () => {
      setLoadingSettings(true);
      setTestResult(null);
      try {
        const res = await fetch('/api/notifications/settings');
        if (res.ok) {
          const data = await res.json();
          setEnabled(data.enabled ?? true);
          setIsSmtpConfigured(Boolean(data.isSmtpConfigured));
          setSmtpHost(data.smtpHost || '');
          setSmtpUser(data.smtpUser || '');
        }
      } catch (err) {
        console.error('Erro ao carregar configurações de e-mail:', err);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleEnabled = async () => {
    const nextState = !enabled;
    setEnabled(nextState);
    try {
      await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextState })
      });
    } catch (err) {
      console.error('Erro ao salvar preferência de notificação:', err);
    }
  };

  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'E-mail de teste enviado com sucesso! Verifique sua caixa de entrada ou pasta de spam.'
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Falha ao enviar e-mail. Verifique suas credenciais SMTP na VPS.'
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro na requisição';
      setTestResult({
        success: false,
        message: `Falha de conexão com o servidor: ${msg}`
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div 
        className="modal-content glass-card animate-fade-in" 
        style={{ maxWidth: '540px', width: '100%', padding: '24px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
            }}>
              <BellRing size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                Lembretes por E-mail
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Avisos automáticos no dia do vencimento das contas
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn-icon" 
            aria-label="Fechar"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        {loadingSettings ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px auto' }} />
            <p style={{ fontSize: '0.85rem' }}>Carregando preferências...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Main Toggle Switch */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Receber aviso no dia do vencimento
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Envia um e-mail às 08:00 com a lista de contas que vencem hoje
                </span>
              </div>
              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
                <input 
                  type="checkbox" 
                  checked={enabled} 
                  onChange={handleToggleEnabled}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: enabled ? 'var(--brand-primary)' : 'var(--bg-secondary)',
                  borderRadius: '26px',
                  transition: '0.3s',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '20px',
                    width: '20px',
                    left: enabled ? '23px' : '3px',
                    bottom: '2px',
                    backgroundColor: '#ffffff',
                    borderRadius: '50%',
                    transition: '0.3s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </span>
              </label>
            </div>

            {/* Recipient Email Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 'var(--radius-md)'
            }}>
              <Mail size={18} color="var(--brand-primary-light)" />
              <div style={{ fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Destinatário das notificações:</span>
                <strong style={{ color: 'var(--brand-primary-light)' }}>
                  {currentUser?.email || 'seu-email@dominio.com'}
                </strong>
              </div>
            </div>

            {/* Server SMTP Status */}
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: isSmtpConfigured ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${isSmtpConfigured ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Server size={15} color={isSmtpConfigured ? 'var(--color-income)' : '#f59e0b'} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isSmtpConfigured ? 'var(--color-income)' : '#f59e0b' }}>
                    {isSmtpConfigured ? 'Servidor SMTP Conectado' : 'Configuração de E-mail (Hostinger SMTP)'}
                  </span>
                </div>
                <span className={`badge ${isSmtpConfigured ? 'badge-paid' : 'badge-pending'}`} style={{ fontSize: '0.7rem' }}>
                  {isSmtpConfigured ? 'Ativo' : 'Aguardando Config'}
                </span>
              </div>

              {isSmtpConfigured ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span>Host: <code>{smtpHost}</code></span>
                  <span>Conta remetente: <code>{smtpUser}</code></span>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Para enviar os e-mails reais pela sua conta Hostinger, basta definir <code>SMTP_HOST</code>, <code>SMTP_USER</code> e <code>SMTP_PASS</code> no seu arquivo <code>.env</code> ou <code>docker-compose.yml</code>.
                </p>
              )}
            </div>

            {/* Test Email Action */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={handleSendTestEmail}
                disabled={isSendingTest}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.88rem'
                }}
              >
                {isSendingTest ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Disparando E-mail de Teste...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Enviar E-mail de Teste Agora</span>
                  </>
                )}
              </button>

              {testResult && (
                <div style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: testResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  {testResult.success ? (
                    <CheckCircle2 size={16} color="var(--color-income)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  ) : (
                    <AlertCircle size={16} color="var(--color-expense)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  )}
                  <span style={{ fontSize: '0.78rem', color: testResult.success ? 'var(--color-income)' : 'var(--color-expense)', lineHeight: 1.4 }}>
                    {testResult.message}
                  </span>
                </div>
              )}
            </div>

            {/* Crontab / Schedule Info */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              fontSize: '0.72rem',
              color: 'var(--text-muted)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                <Clock size={13} color="var(--brand-primary-light)" />
                <span>Como funciona o disparo diário?</span>
              </div>
              <p style={{ margin: '0 0 6px 0', lineHeight: 1.4 }}>
                O sistema verifica diariamente as contas que vencem no dia de hoje. Se houver contas pendentes, ele envia um e-mail consolidado e registra o envio para não reenviar no mesmo dia.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                <Terminal size={12} />
                <span>Endpoint do Cron: <code>/api/cron/reminders</code></span>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
