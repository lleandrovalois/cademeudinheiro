'use client';

import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CreditCard, 
  Check, 
  Trash2, 
  AlertCircle, 
  CheckSquare, 
  Square,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Category, Transaction } from '../types/finance';
import { formatCurrency, formatDateBR } from '../lib/formatters';
import { parseInvoiceText, ParsedInvoiceItem, ParsedInvoiceResult } from '../lib/invoiceParser';

interface InvoiceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  currentMonth: string;
  onImportTransactions: (transactions: Omit<Transaction, 'id' | 'createdAt'>[]) => void;
}

export const InvoiceImportModal: React.FC<InvoiceImportModalProps> = ({
  isOpen,
  onClose,
  categories,
  currentMonth,
  onImportTransactions
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParsedInvoiceResult | null>(null);
  const [cardName, setCardName] = useState('Nubank');
  const [items, setItems] = useState<ParsedInvoiceItem[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'selected' | 'unselected'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processPdfFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      processPdfFile(droppedFile);
    } else {
      setErrorMessage('Por favor, arraste um arquivo no formato PDF.');
    }
  };

  const processPdfFile = async (pdfFile: File) => {
    setFile(pdfFile);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', pdfFile);

      const res = await fetch('/api/import/invoice', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Falha ao ler o PDF da fatura.');
      }

      const result = parseInvoiceText(data.text, categories);
      if (result.items.length === 0) {
        setErrorMessage(
          'Não encontramos lançamentos formatados nesta fatura. Certifique-se de enviar uma fatura em PDF com extrato de compras ou tente outro arquivo.'
        );
        setIsLoading(false);
        return;
      }

      setParseResult(result);
      setCardName(result.cardName);
      setItems(result.items);
    } catch (err: unknown) {
      console.error('Erro na importação:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Erro ao processar arquivo. Verifique se o PDF não possui senha.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItemSelection = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const toggleSelectAll = (select: boolean) => {
    setItems(prev => prev.map(item => ({ ...item, selected: select })));
  };

  const handleUpdateItem = (id: string, field: keyof ParsedInvoiceItem, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const selectedItems = items.filter(i => i.selected);
  const totalSelectedAmount = selectedItems.reduce((acc, i) => acc + (i.type === 'expense' ? i.amount : -i.amount), 0);

  const handleConfirmImport = () => {
    if (selectedItems.length === 0) {
      alert('Nenhum lançamento selecionado para importação.');
      return;
    }

    const newTransactions: Omit<Transaction, 'id' | 'createdAt'>[] = selectedItems.map(item => ({
      description: item.description.trim(),
      amount: item.amount,
      type: item.type,
      category: item.category,
      date: item.date,
      paymentMethod: 'credit_card',
      status: 'paid',
      notes: `Fatura ${cardName}` + 
        (item.cardDigits ? ` (Final ${item.cardDigits})` : '') + 
        (item.installmentInfo ? ` [Parcela ${item.installmentInfo.current}/${item.installmentInfo.total}]` : '')
    }));

    onImportTransactions(newTransactions);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignora erro de confetti se houver
    }

    onClose();
  };

  const displayedItems = items.filter(item => {
    if (filterType === 'selected') return item.selected;
    if (filterType === 'unselected') return !item.selected;
    return true;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-primary-light)'
            }}>
              <CreditCard size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Importar Fatura do Cartão (PDF)
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Alimente seus lançamentos automaticamente a partir do extrato em PDF
              </span>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon" aria-label="Fechar modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Step 1: Upload Box if no items yet */}
          {!parseResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--brand-primary)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '48px 24px',
                  textAlign: 'center',
                  background: 'rgba(99, 102, 241, 0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,application/pdf"
                  style={{ display: 'none' }}
                />

                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-primary-light)'
                }}>
                  <UploadCloud size={28} />
                </div>

                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px' }}>
                    {isLoading ? 'Processando Fatura em PDF...' : 'Clique para selecionar ou arraste o PDF da sua fatura'}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    Suporta faturas do <strong>Nubank, Itaú, Bradesco, Santander, Inter, C6, XP, Caixa, BB</strong> e outros.
                  </p>
                </div>

                {isLoading && (
                  <div style={{
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.85rem',
                    color: 'var(--brand-primary-light)',
                    fontWeight: 600
                  }}>
                    <Sparkles size={16} />
                    <span>Extraindo compras, datas e valores...</span>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-expense-bg)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.85rem',
                  color: 'var(--color-expense)'
                }}>
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Informational tip box */}
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  🔒 100% Seguro e Privado:
                </strong>
                O processamento da fatura é feito diretamente no seu próprio servidor VPS. Nenhum dado é repassado a terceiros. Pagamentos de fatura anterior são desmarcados por padrão para não duplicar suas contas.
              </div>
            </div>
          ) : (
            /* Step 2: Review and Edit Parsed Transactions */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Summary Bar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                padding: '16px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Cartão Identificado</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.88rem', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Compras Identificadas
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                    {selectedItems.length} de {items.length} selecionadas
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Total Selecionado
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-primary-light)' }}>
                    {formatCurrency(totalSelectedAmount)}
                  </div>
                </div>
              </div>

              {/* Action and Filter Controls */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(true)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '0.76rem' }}
                  >
                    <CheckSquare size={14} />
                    <span>Marcar Todos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(false)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '0.76rem' }}
                  >
                    <Square size={14} />
                    <span>Desmarcar Todos</span>
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    style={{
                      padding: '5px 10px',
                      fontSize: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: filterType === 'all' ? 'var(--brand-primary)' : 'var(--bg-tertiary)',
                      color: filterType === 'all' ? '#fff' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    Todos ({items.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('selected')}
                    style={{
                      padding: '5px 10px',
                      fontSize: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: filterType === 'selected' ? 'var(--brand-primary)' : 'var(--bg-tertiary)',
                      color: filterType === 'selected' ? '#fff' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    Selecionados ({selectedItems.length})
                  </button>
                </div>
              </div>

              {/* Items Table */}
              <div style={{
                maxHeight: '380px',
                overflowY: 'auto',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 12px', width: '36px' }}></th>
                      <th style={{ padding: '10px 12px', width: '110px' }}>Data</th>
                      <th style={{ padding: '10px 12px' }}>Descrição</th>
                      <th style={{ padding: '10px 12px', width: '170px' }}>Categoria Sugerida</th>
                      <th style={{ padding: '10px 12px', width: '110px', textAlign: 'right' }}>Valor (R$)</th>
                      <th style={{ padding: '10px 12px', width: '36px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedItems.map(item => (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          background: item.selected ? 'transparent' : 'rgba(0, 0, 0, 0.15)',
                          opacity: item.selected ? 1 : 0.6
                        }}
                      >
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => toggleItemSelection(item.id)}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                        </td>

                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="date"
                            value={item.date}
                            onChange={e => handleUpdateItem(item.id, 'date', e.target.value)}
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          />
                        </td>

                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <input
                              type="text"
                              value={item.description}
                              onChange={e => handleUpdateItem(item.id, 'description', e.target.value)}
                              className="form-input"
                              style={{ padding: '4px 8px', fontSize: '0.8rem', fontWeight: 600 }}
                            />
                            {item.isPaymentOrCredit && (
                              <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>
                                💡 Identificado como Pagamento de Fatura / Estorno
                              </span>
                            )}
                            {item.installmentInfo && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--brand-primary-light)', fontWeight: 600 }}>
                                💳 Parcela {item.installmentInfo.current} de {item.installmentInfo.total}
                              </span>
                            )}
                            {item.cardDigits && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                🔒 Cartão •••• {item.cardDigits}
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '8px 12px' }}>
                          <select
                            value={item.category}
                            onChange={e => handleUpdateItem(item.id, 'category', e.target.value)}
                            className="form-select"
                            style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          >
                            {categories.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </td>

                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={item.amount}
                            onChange={e => handleUpdateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: '0.82rem', fontWeight: 700, textAlign: 'right', width: '100px' }}
                          />
                        </td>

                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="btn-icon"
                            style={{ width: '28px', height: '28px' }}
                            title="Remover este item"
                          >
                            <Trash2 size={13} color="var(--color-expense)" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Re-upload button */}
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  onClick={() => {
                    setParseResult(null);
                    setItems([]);
                    setFile(null);
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                >
                  <UploadCloud size={14} />
                  <span>Escolher Outro Arquivo PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {parseResult && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary)'
          }}>
            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
              Cancelar
            </button>

            <button
              onClick={handleConfirmImport}
              disabled={selectedItems.length === 0}
              className="btn btn-primary"
              style={{ padding: '10px 24px', fontSize: '0.92rem' }}
            >
              <Check size={18} />
              <span>Confirmar e Importar ({selectedItems.length} Lançamentos)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
