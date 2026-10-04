-- =========================================================
-- ESQUEMA DO BANCO DE DADOS - FINCONTROL (SUPABASE)
-- Execute este script no SQL Editor do painel Supabase
-- =========================================================

-- 1. Habilitar extensão UUID caso não esteja ativa
create extension if not exists "uuid-ossp";

-- 2. Tabela de Categorias
create table if not exists categories (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  icon text default 'Tag',
  color text default '#6366f1',
  type text check (type in ('income', 'expense', 'both')) default 'both',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Transações
create table if not exists transactions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  description text not null,
  amount numeric(12, 2) not null check (amount >= 0),
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

-- 4. Tabela de Despesas Fixas / Recorrentes
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

-- 5. Tabela de Compras Parceladas
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

-- 6. Tabela de Orçamentos
create table if not exists budgets (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  category text not null,
  monthly_limit numeric(12, 2) not null,
  month text not null, -- formato 'YYYY-MM'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Tabela de Metas de Economia
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

-- 8. Ativar Segurança por Nível de Linha (RLS)
alter table categories enable row level security;
alter table transactions enable row level security;
alter table recurring_bills enable row level security;
alter table installment_purchases enable row level security;
alter table budgets enable row level security;
alter table savings_goals enable row level security;

-- Políticas de Acesso: Permite que usuários autenticados vejam e manipulem apenas seus próprios dados
-- (Ou acesso público se anon for configurado para testes simples)
create policy "Usuários gerenciam suas próprias categorias" 
  on categories for all using (auth.uid() = user_id or auth.uid() is null);

create policy "Usuários gerenciam suas próprias transações" 
  on transactions for all using (auth.uid() = user_id or auth.uid() is null);

create policy "Usuários gerenciam suas despesas recorrentes" 
  on recurring_bills for all using (auth.uid() = user_id or auth.uid() is null);

create policy "Usuários gerenciam seus parcelamentos" 
  on installment_purchases for all using (auth.uid() = user_id or auth.uid() is null);

create policy "Usuários gerenciam seus orçamentos" 
  on budgets for all using (auth.uid() = user_id or auth.uid() is null);

create policy "Usuários gerenciam suas metas" 
  on savings_goals for all using (auth.uid() = user_id or auth.uid() is null);
