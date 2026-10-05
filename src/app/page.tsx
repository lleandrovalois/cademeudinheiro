'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowRight, 
  CalendarClock, 
  Sparkles,
  Zap,
  TrendingUp
} from 'lucide-react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { BalanceCards } from '../components/BalanceCards';
import { FinancialCharts } from '../components/FinancialCharts';
import { TransactionsList } from '../components/TransactionsList';
import { RecurringManager } from '../components/RecurringManager';
import { InstallmentsManager } from '../components/InstallmentsManager';
import { BudgetsManager } from '../components/BudgetsManager';
import { TransactionModal } from '../components/TransactionModal';
import { SupabaseConfigModal } from '../components/SupabaseConfigModal';

import { 
  AppDataState, 
  initializeStorage, 
  calculateMonthlySummary, 
  saveTransactionsLocal, 
  saveRecurringBillsLocal, 
  saveInstallmentsLocal, 
  saveBudgetsLocal, 
  saveGoalsLocal, 
  resetAllDataToDefault 
} from '../lib/storage';
import { 
  Transaction, 
  RecurringBill, 
  InstallmentPurchase, 
  TransactionType 
} from '../types/finance';
import { formatCurrency } from '../lib/formatters';

export default function Home() {
  const [appData, setAppData] = useState<AppDataState | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Selected month (default current YYYY-MM)
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [hideValues, setHideValues] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  
  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [modalInitialType, setModalInitialType] = useState<TransactionType>('expense');
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);

  // Initialize storage and theme
  useEffect(() => {
    const data = initializeStorage();
    setAppData(data);

    const savedHide = localStorage.getItem('fincontrol_hide_values');
    if (savedHide) setHideValues(savedHide === 'true');

    const savedTheme = localStorage.getItem('fincontrol_theme');
    if (savedTheme) {
      const dark = savedTheme === 'dark';
      setIsDarkMode(dark);
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    }
  }, []);

  const toggleHideValues = () => {
    setHideValues(prev => {
      const next = !prev;
      localStorage.setItem('fincontrol_hide_values', String(next));
      return next;
    });
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('fincontrol_theme', next ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Transaction Actions
  const handleSaveTransaction = (newTxData: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!appData) return;
    const newTx: Transaction = {
      ...newTxData,
      id: `tx-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newTx, ...appData.transactions];
    setAppData({ ...appData, transactions: updated });
    saveTransactionsLocal(updated);
  };

  const handleDeleteTransaction = (id: string) => {
    if (!appData) return;
    const updated = appData.transactions.filter(t => t.id !== id);
    setAppData({ ...appData, transactions: updated });
    saveTransactionsLocal(updated);
  };

  const handleToggleStatus = (id: string) => {
    if (!appData) return;
    const updated = appData.transactions.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'paid' ? 'pending' : 'paid' } as Transaction;
      }
      return t;
    });
    setAppData({ ...appData, transactions: updated });
    saveTransactionsLocal(updated);
  };

  // Recurring Bill Actions
  const handleSaveRecurring = (billData: Omit<RecurringBill, 'id' | 'createdAt' | 'paidMonths'>) => {
    if (!appData) return;
    const newBill: RecurringBill = {
      ...billData,
      id: `rec-${Date.now()}`,
      paidMonths: [],
      createdAt: new Date().toISOString()
    };
    const updated = [newBill, ...appData.recurringBills];
    setAppData({ ...appData, recurringBills: updated });
    saveRecurringBillsLocal(updated);
  };

  const handleTogglePaidThisMonth = (billId: string) => {
    if (!appData) return;
    const bill = appData.recurringBills.find(b => b.id === billId);
    if (!bill) return;

    const isAlreadyPaid = bill.paidMonths.includes(currentMonth);
    let updatedPaidMonths: string[];
    let updatedTransactions = [...appData.transactions];

    if (isAlreadyPaid) {
      updatedPaidMonths = bill.paidMonths.filter(m => m !== currentMonth);
    } else {
      updatedPaidMonths = [...bill.paidMonths, currentMonth];
      // Automatically register a matching expense transaction
      const autoTx: Transaction = {
        id: `tx-rec-${bill.id}-${currentMonth}`,
        description: bill.title,
        amount: bill.amount,
        type: 'expense',
        category: bill.category,
        date: `${currentMonth}-${String(bill.dueDay).padStart(2, '0')}`,
        paymentMethod: 'pix',
        status: 'paid',
        notes: 'Despesa fixa quitada',
        recurringId: bill.id,
        createdAt: new Date().toISOString()
      };
      // Check if already in transactions
      if (!updatedTransactions.some(t => t.recurringId === bill.id && t.date.startsWith(currentMonth))) {
        updatedTransactions = [autoTx, ...updatedTransactions];
      }
    }

    const updatedBills = appData.recurringBills.map(b => {
      if (b.id === billId) return { ...b, paidMonths: updatedPaidMonths };
      return b;
    });

    setAppData({ ...appData, recurringBills: updatedBills, transactions: updatedTransactions });
    saveRecurringBillsLocal(updatedBills);
    saveTransactionsLocal(updatedTransactions);
  };

  const handleDeleteRecurringBill = (id: string) => {
    if (!appData) return;
    const updated = appData.recurringBills.filter(b => b.id !== id);
    setAppData({ ...appData, recurringBills: updated });
    saveRecurringBillsLocal(updated);
  };

  // Installment Actions
  const handleSaveInstallment = (instData: Omit<InstallmentPurchase, 'id' | 'createdAt'>) => {
    if (!appData) return;
    const newInst: InstallmentPurchase = {
      ...instData,
      id: `inst-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newInst, ...appData.installments];
    
    // Automatically add first transaction for this month's installment
    const firstTx: Transaction = {
      id: `tx-inst-${newInst.id}-1`,
      description: `${newInst.description} (1/${newInst.totalInstallments})`,
      amount: newInst.installmentAmount,
      type: 'expense',
      category: newInst.category,
      date: newInst.startDate,
      paymentMethod: 'credit_card',
      status: 'paid',
      notes: `Cartão: ${newInst.paymentCard || 'Crédito'}`,
      installmentId: newInst.id,
      createdAt: new Date().toISOString()
    };

    const updatedTxs = [firstTx, ...appData.transactions];

    setAppData({ ...appData, installments: updated, transactions: updatedTxs });
    saveInstallmentsLocal(updated);
    saveTransactionsLocal(updatedTxs);
  };

  const handleAdvanceInstallment = (id: string) => {
    if (!appData) return;
    const updated = appData.installments.map(i => {
      if (i.id === id && i.paidInstallments < i.totalInstallments) {
        return { ...i, paidInstallments: i.paidInstallments + 1 };
      }
      return i;
    });
    setAppData({ ...appData, installments: updated });
    saveInstallmentsLocal(updated);
  };

  const handleDeleteInstallment = (id: string) => {
    if (!appData) return;
    const updated = appData.installments.filter(i => i.id !== id);
    setAppData({ ...appData, installments: updated });
    saveInstallmentsLocal(updated);
  };

  // Budget & Goal Actions
  const handleUpdateBudget = (category: string, newLimit: number) => {
    if (!appData) return;
    const updated = appData.budgets.map(b => {
      if (b.category === category) return { ...b, monthlyLimit: newLimit };
      return b;
    });
    setAppData({ ...appData, budgets: updated });
    saveBudgetsLocal(updated);
  };

  const handleAddFundsToGoal = (goalId: string, amount: number) => {
    if (!appData) return;
    const updated = appData.goals.map(g => {
      if (g.id === goalId) {
        return { ...g, currentAmount: g.currentAmount + amount };
      }
      return g;
    });
    setAppData({ ...appData, goals: updated });
    saveGoalsLocal(updated);
  };

  const handleDeleteGoal = (id: string) => {
    if (!appData) return;
    const updated = appData.goals.filter(g => g.id !== id);
    setAppData({ ...appData, goals: updated });
    saveGoalsLocal(updated);
  };

  const handleRestoreData = (newData: AppDataState) => {
    setAppData(newData);
    saveTransactionsLocal(newData.transactions);
    saveRecurringBillsLocal(newData.recurringBills);
    saveInstallmentsLocal(newData.installments);
    saveBudgetsLocal(newData.budgets);
    saveGoalsLocal(newData.goals);
  };

  const handleResetToDemo = () => {
    const reset = resetAllDataToDefault();
    setAppData(reset);
  };

  if (!appData) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--brand-primary-light)',
        fontWeight: 700,
        gap: '12px'
      }}>
        <div style={{ width: '20px', height: '20px', border: '3px solid var(--brand-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span>Carregando Cadê Meu Dinheiro?...</span>
        <style jsx>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const summary = calculateMonthlySummary(appData.transactions, currentMonth);

  // Quick modals launchers
  const openNewTransactionModal = (type: TransactionType = 'expense') => {
    setModalInitialType(type);
    setIsTxModalOpen(true);
  };

  // Recent 5 transactions for dashboard widget
  const recentTransactions = appData.transactions
    .filter(t => t.date.startsWith(currentMonth))
    .slice(0, 5);

  return (
    <div className="app-container">
      {/* Desktop Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        totalBalance={summary.totalBalance}
        hideValues={hideValues}
        onOpenNewTransaction={() => openNewTransactionModal('expense')}
        isCloudConnected={appData.isCloudConnected}
      />

      {/* Main Content Area */}
      <main className="main-content">
        <Header
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          hideValues={hideValues}
          onToggleHideValues={toggleHideValues}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          isCloudConnected={appData.isCloudConnected}
          onOpenCloudConfig={() => setIsCloudModalOpen(true)}
          onOpenNewTransaction={() => openNewTransactionModal('expense')}
        />

        {/* Tab Content Container */}
        <div style={{ padding: '20px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              {/* Hero Metric Cards */}
              <BalanceCards
                summary={summary}
                hideValues={hideValues}
                onOpenNewIncome={() => openNewTransactionModal('income')}
                onOpenNewExpense={() => openNewTransactionModal('expense')}
              />

              {/* Financial Charts: Flow & Donut */}
              <FinancialCharts
                transactions={appData.transactions}
                currentMonth={currentMonth}
                hideValues={hideValues}
              />

              {/* Two columns: Recent transactions + Recurring reminders */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '20px',
                marginTop: '10px'
              }}
              id="dashboard-widgets-grid"
              >
                {/* Widget 1: Últimos Lançamentos */}
                <div className="glass-panel" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Zap size={18} color="var(--brand-primary-light)" />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Últimos Lançamentos</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('transactions')}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      <span>Ver Extrato Completo</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {recentTransactions.map(t => (
                      <div
                        key={t.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-tertiary)'
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1, marginRight: '10px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.description}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {t.category} • {t.date.split('-').slice(1).reverse().join('/')}
                          </span>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            fontSize: '0.925rem',
                            fontWeight: 800,
                            color: t.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)'
                          }}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, hideValues)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Widget 2: Contas Fixas Próximas */}
                <div className="glass-panel" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CalendarClock size={18} color="var(--color-info)" />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Contas Fixas do Mês</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('recurring')}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      <span>Gerenciar Todas</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {appData.recurringBills.slice(0, 4).map(bill => {
                      const isPaid = bill.paidMonths.includes(currentMonth);
                      return (
                        <div
                          key={bill.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-tertiary)',
                            borderLeft: isPaid ? '3px solid var(--color-income)' : '3px solid var(--color-warning)'
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block' }}>
                              {bill.title}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Vencimento dia {bill.dueDay}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                              {formatCurrency(bill.amount, hideValues)}
                            </span>
                            <span className={`badge ${isPaid ? 'badge-paid' : 'badge-pending'}`}>
                              {isPaid ? 'Paga' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <style jsx>{`
                @media (min-width: 1024px) {
                  #dashboard-widgets-grid {
                    grid-template-columns: 1fr 1fr !important;
                  }
                }
              `}</style>
            </>
          )}

          {/* TAB 2: TRANSACTIONS LIST */}
          {activeTab === 'transactions' && (
            <TransactionsList
              transactions={appData.transactions}
              categories={appData.categories}
              currentMonth={currentMonth}
              hideValues={hideValues}
              onDeleteTransaction={handleDeleteTransaction}
              onToggleStatus={handleToggleStatus}
              onOpenNewTransaction={() => openNewTransactionModal('expense')}
            />
          )}

          {/* TAB 3: RECURRING BILLS */}
          {activeTab === 'recurring' && (
            <RecurringManager
              recurringBills={appData.recurringBills}
              currentMonth={currentMonth}
              hideValues={hideValues}
              onTogglePaidThisMonth={handleTogglePaidThisMonth}
              onDeleteRecurringBill={handleDeleteRecurringBill}
              onOpenNewRecurring={() => setIsTxModalOpen(true)}
            />
          )}

          {/* TAB 4: INSTALLMENTS / CREDIT CARDS */}
          {activeTab === 'installments' && (
            <InstallmentsManager
              installments={appData.installments}
              hideValues={hideValues}
              onAdvanceInstallment={handleAdvanceInstallment}
              onDeleteInstallment={handleDeleteInstallment}
              onOpenNewInstallment={() => setIsTxModalOpen(true)}
            />
          )}

          {/* TAB 5: BUDGETS & GOALS */}
          {activeTab === 'budgets' && (
            <BudgetsManager
              budgets={appData.budgets}
              goals={appData.goals}
              transactions={appData.transactions}
              currentMonth={currentMonth}
              hideValues={hideValues}
              onUpdateBudget={handleUpdateBudget}
              onAddFundsToGoal={handleAddFundsToGoal}
              onDeleteGoal={handleDeleteGoal}
              onOpenNewGoal={() => alert('Para criar uma nova meta, você pode usar o botão Novo Registro ou editar no painel.')}
            />
          )}

          {/* TAB 6: SETTINGS & BACKUP */}
          {activeTab === 'settings' && (
            <div style={{ maxWidth: '680px', margin: '0 auto' }}>
              <div className="glass-panel" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'var(--brand-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff'
                  }}>
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Configurações & Nuvem</h2>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Personalize sua experiência, integre banco de dados e exporte backups
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <button
                    onClick={() => setIsCloudModalOpen(true)}
                    className="btn btn-primary"
                    style={{ padding: '14px', width: '100%', fontSize: '0.95rem' }}
                  >
                    <span>Abrir Central de Conexão Supabase & Backup</span>
                  </button>

                  <div style={{ background: 'var(--bg-tertiary)', padding: '18px', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>
                      Modo Atual de Armazenamento
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      {appData.isCloudConnected 
                        ? 'Sua aplicação está configurada com conexão Supabase ativa para sincronização na nuvem.'
                        : 'Sua aplicação está operando em modo Local-First. Todos os dados permanecem salvos com segurança no seu navegador com suporte total a funcionamento offline.'}
                    </p>

                    <button
                      onClick={handleResetToDemo}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '8px 14px' }}
                    >
                      Restaurar Dados Demonstrativos Brasileiros
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button (Mobile & Tablet primary quick action) */}
      <button 
        onClick={() => openNewTransactionModal('expense')} 
        className="fab-button"
        title="Novo Lançamento Rápido"
        aria-label="Novo Lançamento Rápido"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Modal: New Transaction / Installment / Recurring */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        categories={appData.categories}
        currentMonth={currentMonth}
        onSaveTransaction={handleSaveTransaction}
        onSaveInstallment={handleSaveInstallment}
        onSaveRecurring={handleSaveRecurring}
        initialType={modalInitialType}
      />

      {/* Modal: Cloud Supabase & Backup Settings */}
      <SupabaseConfigModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        appData={appData}
        onRestoreData={handleRestoreData}
        onResetToDemo={handleResetToDemo}
      />
    </div>
  );
}
