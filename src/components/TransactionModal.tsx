'use client';

import React, { useState } from 'react';
import { 
  X, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  CalendarClock, 
  Check, 
  DollarSign
} from 'lucide-react';
import { 
  Transaction, 
  Category, 
  RecurringBill, 
  InstallmentPurchase, 
  TransactionType, 
  PaymentMethod 
} from '../types/finance';

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
  const [totalInstallments, setTotalInstallments] = useState('10');
  const [paymentCard, setPaymentCard] = useState('Nubank Ultravioleta');
  const [paidInstallments, setPaidInstallments] = useState('0');

  // Form State - Recurring Bill
  const [dueDay, setDueDay] = useState('10');

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
        setDescription(editingInstallment.description);
        setAmount(editingInstallment.totalAmount.toString());
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
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0) {
      alert('Por favor, preencha a descrição e um valor válido.');
      return;
    }

    if (modalTab === 'transaction') {
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
      const installmentsCount = parseInt(totalInstallments, 10) || 2;
      const installmentAmount = +(numAmount / installmentsCount).toFixed(2);
      const paidCount = Math.max(0, parseInt(paidInstallments, 10) || 0);

      if (editingInstallment && onUpdateInstallment) {
        onUpdateInstallment({
          ...editingInstallment,
          description: description.trim(),
          totalAmount: numAmount,
          installmentAmount,
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
          totalAmount: numAmount,
          installmentAmount,
          totalInstallments: installmentsCount,
          paidInstallments: paidCount,
          startDate: date,
          category,
          paymentCard: paymentCard.trim(),
          notes: notes.trim()
        });
      }
    } else if (modalTab === 'recurring') {
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
          {/* Amount Input */}
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
                onChange={e => setAmount(e.target.value)}
                required
                className="form-input"
                style={{ paddingLeft: '40px', fontSize: '1.25rem', fontWeight: 800 }}
                autoFocus
              />
            </div>
          </div>

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
                  <select
                    value={totalInstallments}
                    onChange={e => setTotalInstallments(e.target.value)}
                    className="form-select"
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 24, 36, 48].map(n => (
                      <option key={n} value={n}>{n}x parcelas</option>
                    ))}
                  </select>
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
