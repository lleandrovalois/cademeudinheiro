'use client';

import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  Check, 
  Download, 
  Upload, 
  RotateCcw, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  Database
} from 'lucide-react';
import { AppDataState, exportToJSON, exportTransactionsToCSV, syncWithSupabase } from '../lib/storage';
import { resetSupabaseClient } from '../lib/supabaseClient';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  appData: AppDataState;
  onRestoreData: (newData: AppDataState) => void;
  onResetToDemo: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  appData,
  onRestoreData,
  onResetToDemo
}) => {
  const [url, setUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fincontrol_supabase_url') || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    }
    return '';
  });

  const [anonKey, setAnonKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fincontrol_supabase_key') || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    }
    return '';
  });

  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSQL, setCopiedSQL] = useState(false);

  if (!isOpen) return null;

  const handleSaveConnection = async () => {
    setIsTesting(true);
    setSyncStatus('Testando conexão com Supabase...');

    if (typeof window !== 'undefined') {
      localStorage.setItem('fincontrol_supabase_url', url.trim());
      localStorage.setItem('fincontrol_supabase_key', anonKey.trim());
    }

    resetSupabaseClient();
    const result = await syncWithSupabase();
    setSyncStatus(result.message);
    setIsTesting(false);
  };

  const handleClearConnection = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fincontrol_supabase_url');
      localStorage.removeItem('fincontrol_supabase_key');
    }
    setUrl('');
    setAnonKey('');
    resetSupabaseClient();
    setSyncStatus('Desconectado da nuvem. Operando em modo Local (Offline).');
  };

  const handleCopySQL = () => {
    const sqlScript = `-- FINCONTROL SQL SCHEMA (Copie e cole no SQL Editor do Supabase)
create extension if not exists "uuid-ossp";

create table if not exists categories (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  icon text default 'Tag',
  color text default '#6366f1',
  type text check (type in ('income', 'expense', 'both')) default 'both',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists transactions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  description text not null,
  amount numeric(12, 2) not null,
  type text check (type in ('income', 'expense')) not null,
  category text not null,
  date date not null,
  payment_method text not null,
  status text check (status in ('paid', 'pending')) default 'paid',
  notes text,
  installment_id text,
  recurring_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists recurring_bills (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  title text not null,
  amount numeric(12, 2) not null,
  category text not null,
  due_day integer check (due_day between 1 and 31) not null,
  frequency text default 'monthly',
  active boolean default true,
  notes text,
  paid_months jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists installment_purchases (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  description text not null,
  total_amount numeric(12, 2) not null,
  installment_amount numeric(12, 2) not null,
  total_installments integer not null,
  paid_installments integer not null default 0,
  start_date date not null,
  category text not null,
  payment_card text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists budgets (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  category text not null,
  monthly_limit numeric(12, 2) not null,
  month text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists savings_goals (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  title text not null,
  target_amount numeric(12, 2) not null,
  current_amount numeric(12, 2) default 0,
  deadline date,
  color text default '#10b981',
  icon text default 'ShieldCheck',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table categories enable row level security;
alter table transactions enable row level security;
alter table recurring_bills enable row level security;
alter table installment_purchases enable row level security;
alter table budgets enable row level security;
alter table savings_goals enable row level security;

create policy "Controle total categorias" on categories for all using (true);
create policy "Controle total transacoes" on transactions for all using (true);
create policy "Controle total recorrentes" on recurring_bills for all using (true);
create policy "Controle total parcelamentos" on installment_purchases for all using (true);
create policy "Controle total orcamentos" on budgets for all using (true);
create policy "Controle total metas" on savings_goals for all using (true);
`;
    navigator.clipboard.writeText(sqlScript);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed?.data) {
          onRestoreData(parsed.data);
          alert('Backup restaurado com sucesso!');
          onClose();
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao ler arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ padding: '24px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-primary-light)'
            }}>
              <Cloud size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Nuvem, Banco de Dados & Backup</h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Conecte seu Supabase ou gerencie cópias de segurança
              </span>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Section 1: Supabase Configuration */}
        <div style={{ background: 'var(--bg-tertiary)', padding: '18px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={16} color="var(--brand-primary-light)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Conexão Supabase</span>
            </div>
            <a 
              href="https://supabase.com" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ fontSize: '0.75rem', color: 'var(--brand-primary-light)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
            >
              <span>Abrir Supabase</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="form-group">
            <label className="form-label">Project URL (Supabase)</label>
            <input
              type="text"
              placeholder="https://xyzabcdefg.supabase.co"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Anon / Public API Key</label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={e => setAnonKey(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button 
              onClick={handleSaveConnection} 
              disabled={isTesting}
              className="btn btn-primary"
              style={{ flex: 1, padding: '10px' }}
            >
              <Check size={16} />
              <span>{isTesting ? 'Verificando...' : 'Salvar & Conectar'}</span>
            </button>

            {url && (
              <button 
                onClick={handleClearConnection} 
                className="btn btn-secondary"
                style={{ padding: '10px' }}
              >
                Desconectar
              </button>
            )}
          </div>

          {syncStatus && (
            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: syncStatus.includes('sucesso') ? 'var(--color-income)' : 'var(--color-warning)' }}>
              {syncStatus}
            </div>
          )}

          {/* Copy SQL button */}
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              onClick={handleCopySQL}
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}
            >
              <Copy size={14} />
              <span>{copiedSQL ? 'Script SQL Copiado para a Área de Transferência!' : 'Copiar Script SQL do Banco (Schema)'}</span>
            </button>
          </div>
        </div>

        {/* Section 2: Backup & Export */}
        <div style={{ background: 'var(--bg-tertiary)', padding: '18px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', display: 'block', marginBottom: '12px' }}>
            Backup e Exportação dos Dados
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <button 
              onClick={() => exportToJSON(appData)}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '10px' }}
            >
              <Download size={15} />
              <span>Backup JSON</span>
            </button>

            <button 
              onClick={() => exportTransactionsToCSV(appData.transactions)}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '10px' }}
            >
              <Download size={15} />
              <span>Extrato CSV (Excel)</span>
            </button>
          </div>

          <label 
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '0.8rem', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Upload size={15} />
            <span>Restaurar Backup JSON</span>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleFileUpload} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>

        {/* Section 3: Reset Demo Data */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px' }}>
          <button
            onClick={() => {
              if (confirm('Deseja restaurar os dados de demonstração brasileiros (exemplos de despesas, metas e parcelas)?')) {
                onResetToDemo();
                onClose();
              }
            }}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
          >
            <RotateCcw size={14} />
            <span>Restaurar Dados de Exemplo</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-income)' }}>
            <ShieldCheck size={14} />
            <span>Offline-First</span>
          </div>
        </div>
      </div>
    </div>
  );
};
