'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowRight, 
  CalendarClock, 
  Zap,
  TrendingUp,
  UserCheck
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
import { AuthModal } from '../components/AuthModal';

import { 
  AppDataState, 
  initializeStorage, 
  calculateMonthlySummary, 
  saveUserData, 
  syncUserDataFromCloud,
  syncTransactionToCloud,
  deleteTransactionFromCloud,
  syncRecurringBillToCloud,
  deleteRecurringBillFromCloud,
  syncInstallmentToCloud,
  deleteInstallmentFromCloud,
  resetAllDataToDefault 
} from '../lib/storage';
import { getCurrentUser, signOutUser } from '../lib/auth';
import { getSupabaseClient } from '../lib/supabaseClient';
import { 
  Transaction, 
  RecurringBill, 
  InstallmentPurchase, 
  TransactionType,
  AuthUser 
} from '../types/finance';
import { formatCurrency } from '../lib/formatters';

export default function Home() {
  const [appData, setAppData] = useState<AppDataState | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Initialize storage, auth and theme
  useEffect(() => {
    const initApp = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
        const data = initializeStorage(user.id);
        setAppData(data);

        // Fetch user data from Supabase in background
        if (!user.isGuest) {
          const cloudData = await syncUserDataFromCloud(user.id);
          if (cloudData) setAppData(cloudData);
        }
      } else {
        // Fallback to guest initially and offer login
        const data = initializeStorage('guest');
        setAppData(data);
        setIsAuthModalOpen(true);
      }

      const savedHide = localStorage.getItem('fincontrol_hide_values');
      if (savedHide) setHideValues(savedHide === 'true');

      const savedTheme = localStorage.getItem('fincontrol_theme');
      if (savedTheme) {
        const dark = savedTheme === 'dark';
        setIsDarkMode(dark);
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      }
    };

    initApp();

    // Listen to Supabase auth state change events
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            isGuest: false
          };
          setCurrentUser(authUser);
          const data = initializeStorage(authUser.id);
          setAppData(data);
          const cloudData = await syncUserDataFromCloud(authUser.id);
          if (cloudData) setAppData(cloudData);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          const data = initializeStorage('guest');
          setAppData(data);
          setIsAuthModalOpen(true);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
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

  const handleAuthSuccess = async (user: AuthUser) => {
    setCurrentUser(user);
    const data = initializeStorage(user.id);
    setAppData(data);
    if (!user.isGuest) {
      const cloudData = await syncUserDataFromCloud(user.id);
      if (cloudData) setAppData(cloudData);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    const data = initializeStorage('guest');
    setAppData(data);
    setIsAuthModalOpen(true);
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
    
    const userId = currentUser?.id || 'guest';
    saveUserData(userId, { transactions: updated });

    if (currentUser && !currentUser.isGuest) {
      syncTransactionToCloud(newTx, currentUser.id);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    if (!appData) return;
    const updated = appData.transactions.filter(t => t.id !== id);
    setAppData({ ...appData, transactions: updated });
    
    const userId = currentUser?.id || 'guest';
    saveUserData(userId, { transactions: updated });

    if (currentUser && !currentUser.isGuest) {
      deleteTransactionFromCloud(id, currentUser.id);
    }
  };

  const handleToggleStatus = (id: string) => {
    if (!appData) return;
    let targetTx: Transaction | null = null;
    const updated = appData.transactions.map(t => {
      if (t.id === id) {
        const toggled = { ...t, status: t.status === 'paid' ? 'pending' : 'paid' } as Transaction;
        targetTx = toggled;
        return toggled;
      }
      return t;
    });

    setAppData({ ...appData, transactions: updated });
    const userId = currentUser?.id || 'guest';
    saveUserData(userId, { transactions: updated });

    if (targetTx && currentUser && !currentUser.isGuest) {
      syncTransactionToCloud(targetTx, currentUser.id);
    }
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
    
    const userId = currentUser?.id || 'guest';
    saveUserData(userId, { recurringBills: updated });

    if (currentUser && !currentUser.isGuest) {
      syncRecurringBillToCloud(newBill, currentUser.id);
    }
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
      if (!updatedTransactions.some(t => t.recurringId === bill.id && t.date.startsWith(currentMonth))) {
        updatedTransactions = [autoTx, ...updatedTransactions];
      }
    }

    const updatedBills = appData.recurringBills.map(b => {
      if (b.id === billId) return { ...b, paidMonths: updatedPaidMonths };
      return b;
    });

    setAppData({ ...appData, recurringBills: updatedBills, transactions: updatedTransactions });
    
    const userId = currentUser?.id || 'guest';
    saveUserData(userId, { recurringBills: updatedBills, transactions: updatedTransactions });

    if (currentUser && !currentUser.isGuest) {
      const updatedBill = updatedBills.find(b => b.id === billId);
      if (updatedBill) syncRecurringBillToCloud(updatedBill, currentUser.id);
    }
  };

  const handleDeleteRecurringBill = (id: string) => {
    if (!appData) return;
    const updated = appData.recurringBills.filter(b => b.id !== id);
    setAppData({ ...appData, recurringBills: updated });
    
    const userId = currentUser?.id || 'guest';
    saveUserData(userId, { recurringBills: updated });

    if (currentUser && !currentUser.isGuest) {
      deleteRecurringBillFromCloud(id, currentUser.id);
    }
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
    
    const userId = currentUser?.id || 'guest';
    saveUserData(userId, { installments: updated, transactions: updatedTxs });

    if (currentUser && !currentUser.isGuest) {
      syncInstallmentToCloud(newInst, currentUser.id);
      syncTransactionToCloud(firstTx, currentUser.id);
    }
  };

  const handleAdvanceInstallment = (id: string) => {
    if (!appData) return;
    let targetInst: InstallmentPurchase | null = null;
    const updated = appData.installments.map(i => {
      if (i.id === id && i.paidInstallments < i.totalInstallments) {
        const adv = { ...i, paidInstallments: i.paidInstallments + 1 };
        targetInst = adv;
        return adv;
      }
      return i;
    });
    setAppData({ ...appData, installments: updated });
    
    const userId = currentUser?.id || 'guest';
    saveUserData(userId, { installments: updated });

    if (targetInst && currentUser && !currentUser.isGuest) {
      syncInstallmentToCloud(targetInst, currentUser.id);
    }
  };

  const handleDeleteInstallment = (id: string) => {
    if (!appData) return;
    const updated = appData.installments.filter(i => i.id !== id);
    setAppData({ ...appData, installments: updated });
    
    const userId = currentUser?.id || 'guest';
    saveUserData(userId, { installments: updated });

    if (currentUser && !currentUser.isGuest) {
      deleteInstallmentFromCloud(id, currentUser.id);
    }
  };

  // Budget & Goal Actions
  const handleUpdateBudget = (category: string, newLimit: number) => {
    if (!appData) return;
    const updated = appData.budgets.map(b => {
      if (b.category === category) return { ...b, monthlyLimit: newLimit };
      return b;
    });
    setAppData({ ...appData, budgets: updated });
    const userId = currentUser?.id || 'guest';
    saveUserData(userId, { budgets: updated });
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
    const userId = currentUser?.id || 'guest';
    saveUserData(userId, { goals: updated });
  };

  const handleDeleteGoal = (id: string) => {
    if (!appData) return;
    const updated = appData.goals.filter(g => g.id !== id);
    setAppData({ ...appData, goals: updated });
    const userId = currentUser?.id || 'guest';
    saveUserData(userId, { goals: updated });
  };

  const handleRestoreData = (newData: AppDataState) => {
    setAppData(newData);
    const userId = currentUser?.id || 'guest';
    saveUserData(userId, newData);
  };

  const handleResetToDemo = () => {
    const userId = currentUser?.id || 'guest';
    const reset = resetAllDataToDefault(userId);
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

  const openNewTransactionModal = (type: TransactionType = 'expense') => {
    setModalInitialType(type);
    setIsTxModalOpen(true);
  };

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
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
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
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onSignOut={handleSignOut}
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
                    {recentTransactions.length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '10px 0' }}>
                        Nenhum lançamento registrado neste mês.
                      </span>
                    ) : (
                      recentTransactions.map(t => (
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
                      ))
                    )}
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
                    {appData.recurringBills.length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '10px 0' }}>
                        Nenhuma conta fixa cadastrada.
                      </span>
                    ) : (
                      appData.recurringBills.slice(0, 4).map(bill => {
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
                      })
                    )}
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
              onOpenNewGoal={() => alert('Para adicionar nova meta de economia, cadastre no painel.')}
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
                  {/* Account state info */}
                  <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Sua Conta</span>
                      <span className={`badge ${currentUser && !currentUser.isGuest ? 'badge-paid' : 'badge-card'}`}>
                        {currentUser && !currentUser.isGuest ? 'Autenticado' : 'Modo Convidado'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
                      {currentUser && !currentUser.isGuest 
                        ? `Conectado como: ${currentUser.email}. Seus dados estão isolados e salvos na sua conta.`
                        : 'Você está no modo de demonstração. Entre ou crie uma conta para sincronizar com segurança na nuvem.'}
                    </span>
                    {currentUser && !currentUser.isGuest ? (
                      <button onClick={handleSignOut} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                        Sair da Conta
                      </button>
                    ) : (
                      <button onClick={() => setIsAuthModalOpen(true)} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                        Entrar ou Criar Minha Conta
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setIsCloudModalOpen(true)}
                    className="btn btn-primary"
                    style={{ padding: '14px', width: '100%', fontSize: '0.95rem' }}
                  >
                    <span>Configurar Conexão Supabase & Backup</span>
                  </button>

                  <div style={{ background: 'var(--bg-tertiary)', padding: '18px', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>
                      Armazenamento Local e Isolamento
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      Cada conta de usuário possui seu próprio armazenamento isolado. Nenhum usuário tem acesso às finanças de outro.
                    </p>

                    <button
                      onClick={handleResetToDemo}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '8px 14px' }}
                    >
                      Carregar Exemplos Brasileiros nesta Conta
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

      {/* Modal: Auth (Login, Cadastro, Recuperação de Senha) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
