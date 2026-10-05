-- =========================================================
-- ESQUEMA DO BANCO DE DADOS - CADÊ MEU DINHEIRO? (SUPABASE)
-- Multi-usuário com Isolamento por Row Level Security (RLS)
-- Execute este script no SQL Editor do painel Supabase
-- =========================================================

-- 1. Habilitar extensão UUID
create extension if not exists "uuid-ossp";

-- 2. Tabela de Categorias
create table if not exists categories (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid() not null,
  name text not null,
  icon text default 'Tag',
  color text default '#6366f1',
  type text check (type in ('income', 'expense', 'both')) default 'both',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Transações
create table if not exists transactions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid() not null,
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
  user_id uuid references auth.users(id) on delete cascade default auth.uid() not null,
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
  user_id uuid references auth.users(id) on delete cascade default auth.uid() not null,
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
  user_id uuid references auth.users(id) on delete cascade default auth.uid() not null,
  category text not null,
  monthly_limit numeric(12, 2) not null,
  month text not null, -- formato 'YYYY-MM'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Tabela de Metas de Economia
create table if not exists savings_goals (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid() not null,
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

-- 9. Políticas RLS Estritas (Cada usuário acessa e modifica estritamente os seus dados)
drop policy if exists "Categorias individuais" on categories;
create policy "Categorias individuais" 
  on categories for all 
  using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

drop policy if exists "Transações individuais" on transactions;
create policy "Transações individuais" 
  on transactions for all 
  using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

drop policy if exists "Recorrentes individuais" on recurring_bills;
create policy "Recorrentes individuais" 
  on recurring_bills for all 
  using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

drop policy if exists "Parcelamentos individuais" on installment_purchases;
create policy "Parcelamentos individuais" 
  on installment_purchases for all 
  using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

drop policy if exists "Orçamentos individuais" on budgets;
create policy "Orçamentos individuais" 
  on budgets for all 
  using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

drop policy if exists "Metas individuais" on savings_goals;
create policy "Metas individuais" 
  on savings_goals for all 
  using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

-- 10. Trigger Automático: Cria categorias padrão assim que o usuário faz cadastro
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.categories (id, user_id, name, icon, color, type) values
    ('cat-salario-' || new.id, new.id, 'Salário & Renda', 'Briefcase', '#10B981', 'income'),
    ('cat-freelance-' || new.id, new.id, 'Freelance & Extras', 'Sparkles', '#06B6D4', 'income'),
    ('cat-invest-' || new.id, new.id, 'Rendimentos & Dividendos', 'TrendingUp', '#8B5CF6', 'income'),
    ('cat-moradia-' || new.id, new.id, 'Moradia & Contas', 'Home', '#6366F1', 'expense'),
    ('cat-alimentacao-' || new.id, new.id, 'Alimentação & Mercado', 'Utensils', '#F59E0B', 'expense'),
    ('cat-transporte-' || new.id, new.id, 'Transporte & Combustível', 'Car', '#EC4899', 'expense'),
    ('cat-saude-' || new.id, new.id, 'Saúde & Bem-estar', 'HeartPulse', '#EF4444', 'expense'),
    ('cat-lazer-' || new.id, new.id, 'Lazer & Entretenimento', 'Film', '#A855F7', 'expense'),
    ('cat-compras-' || new.id, new.id, 'Compras & Shopping', 'ShoppingBag', '#3B82F6', 'expense'),
    ('cat-educacao-' || new.id, new.id, 'Educação & Cursos', 'GraduationCap', '#14B8A6', 'expense'),
    ('cat-outros-' || new.id, new.id, 'Outros', 'MoreHorizontal', '#64748B', 'both');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
