'use client';

import React, { useState } from 'react';
import { 
  X, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  CalendarClock, 
  Check, 
  DollarSign,
  Calculator
} from 'lucide-react';
import { 
  Transaction, 
  Category, 
  RecurringBill, 
  InstallmentPurchase, 
  TransactionType, 
  PaymentMethod 
} from '../types/finance';
import { formatCurrency } from '../lib/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  currentMonth: string;
  onSaveTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onUpdateTransaction?: (tx: Transaction) => void;
  onSaveInstallment: (inst: Omit<InstallmentPurchase, 'id' | 'createdAt'>) => void;
  onUpdateInstallment?: (inst: InstallmentPurchase) => void;
  onSaveRecurring: (bill: Omit<RecurringBill, 'id' | 'createdAt' | 'paidMonths'>) => void;
  initialType?: TransactionType;
  initialTab?: ModalTab;
  editingTransaction?: Transaction | null;
  editingInstallment?: InstallmentPurchase | null;
}

type ModalTab = 'transaction' | 'installment' | 'recurring';

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  categories,
  currentMonth,
  onSaveTransaction,
  onUpdateTransaction,
  onSaveInstallment,
  onUpdateInstallment,
  onSaveRecurring,
  initialType = 'expense',
  initialTab = 'transaction',
  editingTransaction = null,
  editingInstallment = null
}) => {
  const [modalTab, setModalTab] = useState<ModalTab>(initialTab);

  // Form State - Single Transaction
  const [txType, setTxType] = useState<TransactionType>(initialType);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Alimentação & Mercado');
  const [date, setDate] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return today.startsWith(currentMonth) ? today : `${currentMonth}-01`;
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [status, setStatus] = useState<'paid' | 'pending'>('paid');
  const [notes, setNotes] = useState('');

  // Form State - Installment Purchase
  const [installmentInputMode, setInstallmentInputMode] = useState<'total' | 'installment'>('total');
  const [installmentAmountInput, setInstallmentAmountInput] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('10');
  const [paymentCard, setPaymentCard] = useState('Nubank Ultravioleta');
  const [paidInstallments, setPaidInstallments] = useState('0');

  // Form State - Recurring Bill
  const [dueDay, setDueDay] = useState('10');

  // Synchronization helpers between Total and Installment values
  const handleSwitchInstallmentMode = (newMode: 'total' | 'installment') => {
    if (newMode === installmentInputMode) return;
    const count = Math.max(1, parseInt(totalInstallments, 10) || 1);

    if (newMode === 'installment') {
      const tot = parseFloat(amount.replace(',', '.'));
      if (!isNaN(tot) && tot > 0) {
        setInstallmentAmountInput((tot / count).toFixed(2));
      }
    } else {
      const per = parseFloat(installmentAmountInput.replace(',', '.'));
      if (!isNaN(per) && per > 0) {
        setAmount((per * count).toFixed(2));
      }
    }
    setInstallmentInputMode(newMode);
  };

  const handleTotalInstallmentsChange = (newCountStr: string) => {
    setTotalInstallments(newCountStr);
    const count = Math.max(1, parseInt(newCountStr, 10) || 1);
    if (installmentInputMode === 'installment') {
      const per = parseFloat(installmentAmountInput.replace(',', '.'));
      if (!isNaN(per) && per > 0) {
        setAmount((per * count).toFixed(2));
      }
    } else {
      const tot = parseFloat(amount.replace(',', '.'));
      if (!isNaN(tot) && tot > 0) {
        setInstallmentAmountInput((tot / count).toFixed(2));
      }
    }
  };

  const handleInstallmentAmountChange = (valStr: string) => {
    setInstallmentAmountInput(valStr);
    const per = parseFloat(valStr.replace(',', '.'));
    const count = Math.max(1, parseInt(totalInstallments, 10) || 1);
    if (!isNaN(per) && per > 0) {
      setAmount((per * count).toFixed(2));
    }
  };

  const handleTotalAmountChange = (valStr: string) => {
    setAmount(valStr);
    const tot = parseFloat(valStr.replace(',', '.'));
    const count = Math.max(1, parseInt(totalInstallments, 10) || 1);
    if (!isNaN(tot) && tot > 0) {
      setInstallmentAmountInput((tot / count).toFixed(2));
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        setModalTab('transaction');
        setTxType(editingTransaction.type);
        setDescription(editingTransaction.description);
        setAmount(editingTransaction.amount.toString());
        setCategory(editingTransaction.category);
        setDate(editingTransaction.date);
        setPaymentMethod(editingTransaction.paymentMethod);
        setStatus(editingTransaction.status);
        setNotes(editingTransaction.notes || '');
      } else if (editingInstallment) {
        setModalTab('installment');
        setInstallmentInputMode('total');
        setDescription(editingInstallment.description);
        setAmount(editingInstallment.totalAmount.toString());
        setInstallmentAmountInput(editingInstallment.installmentAmount.toString());
        setTotalInstallments(editingInstallment.totalInstallments.toString());
        setPaidInstallments(editingInstallment.paidInstallments.toString());
        setPaymentCard(editingInstallment.paymentCard || '');
        setCategory(editingInstallment.category);
        setDate(editingInstallment.startDate);
        setNotes(editingInstallment.notes || '');
      } else {
        if (initialTab) setModalTab(initialTab);
        if (initialType) setTxType(initialType);
        setDescription('');
        setAmount('');
        setInstallmentAmountInput('');
        setInstallmentInputMode('total');
        setNotes('');
        setPaidInstallments('0');
        const today = new Date().toISOString().slice(0, 10);
        setDate(today.startsWith(currentMonth) ? today : `${currentMonth}-01`);
      }
    }
  }, [isOpen, editingTransaction, editingInstallment, initialTab, initialType, currentMonth]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      alert('Por favor, preencha a descrição.');
      return;
    }

    if (modalTab === 'transaction') {
      const numAmount = parseFloat(amount.replace(',', '.'));
      if (isNaN(numAmount) || numAmount <= 0) {
        alert('Por favor, informe um valor válido.');
        return;
      }

      if (editingTransaction && onUpdateTransaction) {
        onUpdateTransaction({
          ...editingTransaction,
          description: description.trim(),
          amount: numAmount,
          type: txType,
          category,
          date,
          paymentMethod,
          status,
          notes: notes.trim()
        });
      } else {
        onSaveTransaction({
          description: description.trim(),
          amount: numAmount,
          type: txType,
          category,
          date,
          paymentMethod,
          status,
          notes: notes.trim()
        });
      }
    } else if (modalTab === 'installment') {
      const installmentsCount = Math.max(1, parseInt(totalInstallments, 10) || 1);
      let calculatedTotal = 0;
      let calculatedInstallmentAmount = 0;

      if (installmentInputMode === 'installment') {
        const perInst = parseFloat(installmentAmountInput.replace(',', '.'));
        if (isNaN(perInst) || perInst <= 0) {
          alert('Por favor, informe um valor de parcela válido.');
          return;
        }
        calculatedInstallmentAmount = perInst;
        calculatedTotal = +(perInst * installmentsCount).toFixed(2);
      } else {
        const total = parseFloat(amount.replace(',', '.'));
        if (isNaN(total) || total <= 0) {
          alert('Por favor, informe um valor total válido.');
          return;
        }
        calculatedTotal = total;
        calculatedInstallmentAmount = +(total / installmentsCount).toFixed(2);
      }

      const paidCount = Math.max(0, parseInt(paidInstallments, 10) || 0);

      if (editingInstallment && onUpdateInstallment) {
        onUpdateInstallment({
          ...editingInstallment,
          description: description.trim(),
          totalAmount: calculatedTotal,
          installmentAmount: calculatedInstallmentAmount,
          totalInstallments: installmentsCount,
          paidInstallments: paidCount,
          startDate: date,
          category,
          paymentCard: paymentCard.trim(),
          notes: notes.trim()
        });
      } else {
        onSaveInstallment({
          description: description.trim(),
          totalAmount: calculatedTotal,
          installmentAmount: calculatedInstallmentAmount,
          totalInstallments: installmentsCount,
          paidInstallments: paidCount,
          startDate: date,
          category,
          paymentCard: paymentCard.trim(),
          notes: notes.trim()
        });
      }
    } else if (modalTab === 'recurring') {
      const numAmount = parseFloat(amount.replace(',', '.'));
      if (isNaN(numAmount) || numAmount <= 0) {
        alert('Por favor, informe um valor válido.');
        return;
      }

      onSaveRecurring({
        title: description.trim(),
        amount: numAmount,
        category,
        dueDay: parseInt(dueDay, 10) || 10,
        frequency: 'monthly',
        active: true,
        notes: notes.trim()
      });
    }

    // Reset and close
    setDescription('');
    setAmount('');
    setInstallmentAmountInput('');
    setInstallmentInputMode('total');
    setNotes('');
    setPaidInstallments('0');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ padding: '24px' }}
      >
        {/* Mobile Drag Indicator */}
        <div style={{
          width: '40px',
          height: '4px',
          background: 'var(--border-strong)',
          borderRadius: 'var(--radius-full)',
          margin: '-10px auto 16px',
        }} />

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {editingTransaction ? 'Editar Lançamento' : editingInstallment ? 'Editar Parcelamento' : 'Novo Lançamento'}
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {editingTransaction || editingInstallment ? 'Altere as informações desejadas e salve' : 'Cadastre despesas, receitas ou parcelamentos'}
            </span>
          </div>

          <button onClick={onClose} className="btn-icon" aria-label="Fechar modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Category Tabs - Only shown when creating new */}
        {!editingTransaction && !editingInstallment && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            background: 'var(--bg-tertiary)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            gap: '4px',
            marginBottom: '20px'
          }}>
          <button
            type="button"
            onClick={() => setModalTab('transaction')}
            style={{
              padding: '8px 10px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: modalTab === 'transaction' ? 'var(--bg-card-hover)' : 'transparent',
              color: modalTab === 'transaction' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>Avulso</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('installment')}
            style={{
              padding: '8px 10px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: modalTab === 'installment' ? 'var(--bg-card-hover)' : 'transparent',
              color: modalTab === 'installment' ? 'var(--brand-primary-light)' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <CreditCard size={14} />
            <span>Parcelado</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('recurring')}
            style={{
              padding: '8px 10px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: modalTab === 'recurring' ? 'var(--bg-card-hover)' : 'transparent',
              color: modalTab === 'recurring' ? 'var(--color-info)' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <CalendarClock size={14} />
            <span>Fixa/Recorrente</span>
          </button>
        </div>
        )}

        {/* Transaction Type Buttons (Income / Expense) if in transaction tab */}
        {modalTab === 'transaction' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
            <button
              type="button"
              onClick={() => setTxType('expense')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                border: txType === 'expense' ? '2px solid var(--color-expense)' : '1px solid var(--border-subtle)',
                background: txType === 'expense' ? 'var(--color-expense-bg)' : 'var(--bg-tertiary)',
                color: txType === 'expense' ? 'var(--color-expense)' : 'var(--text-secondary)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <ArrowDownRight size={18} />
              <span>Despesa</span>
            </button>

            <button
              type="button"
              onClick={() => setTxType('income')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                border: txType === 'income' ? '2px solid var(--color-income)' : '1px solid var(--border-subtle)',
                background: txType === 'income' ? 'var(--color-income-bg)' : 'var(--bg-tertiary)',
                color: txType === 'income' ? 'var(--color-income)' : 'var(--text-secondary)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <ArrowUpRight size={18} />
              <span>Receita</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          {/* Installment Calculation Mode Toggle */}
          {modalTab === 'installment' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: 'var(--bg-tertiary)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              gap: '6px',
              marginBottom: '16px'
            }}>
              <button
                type="button"
                onClick={() => handleSwitchInstallmentMode('total')}
                style={{
                  padding: '8px 10px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: installmentInputMode === 'total' ? 'var(--brand-primary)' : 'transparent',
                  color: installmentInputMode === 'total' ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>Informar Valor Total</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchInstallmentMode('installment')}
                style={{
                  padding: '8px 10px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: installmentInputMode === 'installment' ? 'var(--brand-primary)' : 'transparent',
                  color: installmentInputMode === 'installment' ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>Informar Valor da Parcela</span>
              </button>
            </div>
          )}

          {/* Amount Input */}
          {modalTab === 'installment' && installmentInputMode === 'installment' ? (
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Valor de Cada Parcela (R$)</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--brand-primary-light)', fontWeight: 600 }}>
                  em {totalInstallments}x vezes
                </span>
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}>
                  <DollarSign size={18} />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={installmentAmountInput}
                  onChange={e => handleInstallmentAmountChange(e.target.value)}
                  required
                  className="form-input"
                  style={{ paddingLeft: '40px', fontSize: '1.25rem', fontWeight: 800 }}
                  autoFocus
                />
              </div>

              {parseFloat(installmentAmountInput.replace(',', '.')) > 0 && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.82rem',
                  color: '#10b981',
                  fontWeight: 600
                }}>
                  <Calculator size={15} />
                  <span>
                    Total calculado: <strong>{formatCurrency(parseFloat(installmentAmountInput.replace(',', '.')) * (Math.max(1, parseInt(totalInstallments, 10) || 1)))}</strong> ({totalInstallments}x de {formatCurrency(parseFloat(installmentAmountInput.replace(',', '.')))})
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">
                {modalTab === 'installment' ? 'Valor Total da Compra (R$)' : 'Valor (R$)'}
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}>
                  <DollarSign size={18} />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={e => modalTab === 'installment' ? handleTotalAmountChange(e.target.value) : setAmount(e.target.value)}
                  required
                  className="form-input"
                  style={{ paddingLeft: '40px', fontSize: '1.25rem', fontWeight: 800 }}
                  autoFocus
                />
              </div>

              {modalTab === 'installment' && parseFloat(amount.replace(',', '.')) > 0 && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.82rem',
                  color: 'var(--brand-primary-light)',
                  fontWeight: 600
                }}>
                  <Calculator size={15} />
                  <span>
                    Cada parcela sairá por <strong>{formatCurrency(parseFloat(amount.replace(',', '.')) / (Math.max(1, parseInt(totalInstallments, 10) || 1)))}</strong> ({totalInstallments}x)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input
              type="text"
              placeholder={modalTab === 'installment' ? 'Ex: Smartphone 128GB' : modalTab === 'recurring' ? 'Ex: Aluguel ou Internet' : 'Ex: Supermercado, Almoço...'}
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              className="form-input"
            />
          </div>

          {/* Category & Date Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="form-select"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {modalTab !== 'recurring' ? (
              <div className="form-group">
                <label className="form-label">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="form-input"
                />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Dia do Vencimento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={e => setDueDay(e.target.value)}
                  className="form-input"
                />
              </div>
            )}
          </div>

          {/* Specific Installment Fields */}
          {modalTab === 'installment' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Número de Parcelas</label>
                  <input
                    type="number"
                    min="2"
                    max="360"
                    value={totalInstallments}
                    onChange={e => handleTotalInstallmentsChange(e.target.value)}
                    className="form-input"
                    placeholder="Ex: 10"
                    style={{ fontWeight: 700 }}
                    required
                  />
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    marginTop: '6px'
                  }}>
                    {['2', '3', '6', '10', '12', '18', '24', '36', '48'].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleTotalInstallmentsChange(n)}
                        style={{
                          padding: '3px 7px',
                          fontSize: '0.72rem',
                          fontWeight: totalInstallments === n ? 700 : 500,
                          borderRadius: 'var(--radius-sm)',
                          border: totalInstallments === n ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                          background: totalInstallments === n ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-tertiary)',
                          color: totalInstallments === n ? 'var(--brand-primary-light)' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        {n}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Cartão Utilizado</label>
                  <input
                    type="text"
                    placeholder="Ex: Nubank, Itaú..."
                    value={paymentCard}
                    onChange={e => setPaymentCard(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Parcelas Já Pagas</label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    (Geralmente 0 para compra nova)
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max={Math.max(0, (parseInt(totalInstallments, 10) || 10) - 1)}
                  value={paidInstallments}
                  onChange={e => setPaidInstallments(e.target.value)}
                  className="form-input"
                  placeholder="0"
                />
              </div>
            </>
          )}

          {/* Payment Method & Status for single transactions */}
          {modalTab === 'transaction' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Forma de Pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="form-select"
                >
                  <option value="pix">PIX</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="debit_card">Cartão de Débito</option>
                  <option value="bank_transfer">Transferência / TED</option>
                  <option value="bank_slip">Boleto Bancário</option>
                  <option value="cash">Dinheiro em Espécie</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as 'paid' | 'pending')}
                  className="form-select"
                >
                  <option value="paid">{txType === 'income' ? 'Recebido' : 'Pago'}</option>
                  <option value="pending">{txType === 'income' ? 'A Receber' : 'Pendente'}</option>
                </select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Observações (Opcional)</label>
            <input
              type="text"
              placeholder="Adicione um lembrete ou tag..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Submit Action */}
          <div style={{ marginTop: '24px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            >
              <Check size={20} />
              <span>{editingTransaction || editingInstallment ? 'Salvar Alterações' : 'Confirmar e Salvar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
