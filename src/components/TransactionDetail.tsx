import { useState, useEffect } from 'react'
import { X, Receipt, Calendar, Store, CreditCard, Tag, User, Hash, Trash2 } from 'lucide-react'
import { Transaction } from '../types'
import { formatTransactionDate, formatDateTimeForDb, splitTransactionDateForInput } from '../utils/dateUtils'
import { formatCurrency } from '../utils/formatCurrency'
import { supabase } from '../lib/supabase'
import { MemoField, CategoryField } from './TransactionList'

interface TransactionDetailProps {
  transaction: Transaction
  onClose: () => void
  onDeleteSuccess?: () => void
  onUpdateMemo?: (id: string, memo: string | null) => Promise<void>
  onUpdateCategory?: (id: string, merchant: string, category: string) => Promise<void>
  onUpdateTransactionDate?: (id: string, transaction_date: string) => Promise<void>
  onUpdateDetails?: (id: string, details: Transaction['details']) => Promise<void>
}

export function TransactionDetail({
  transaction,
  onClose,
  onDeleteSuccess,
  onUpdateMemo,
  onUpdateCategory,
  onUpdateTransactionDate,
  onUpdateDetails,
}: TransactionDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [dateInput, setDateInput] = useState('')
  const [timeInput, setTimeInput] = useState('')
  const [savingDate, setSavingDate] = useState(false)
  const [detailRows, setDetailRows] = useState<Array<{ name: string; amount: number }>>([])
  const [savingDetails, setSavingDetails] = useState(false)

  useEffect(() => {
    const p = splitTransactionDateForInput(transaction.transaction_date)
    setDateInput(p.date)
    setTimeInput(p.time)
  }, [transaction.id, transaction.transaction_date])

  useEffect(() => {
    const d = transaction.details as { items: Array<{ name: string; amount: number }> } | null
    const items = d?.items
    setDetailRows(items && items.length > 0 ? items.map(i => ({ name: i.name, amount: i.amount })) : [])
  }, [transaction.id, transaction.details])

  const handleDelete = async () => {
    if (!confirm('この取引を完全に削除しますか？\nこの操作は取り消せません。')) return

    setIsDeleting(true)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id)
        .select('id')

      if (error) {
        console.error('[TransactionDetail] 削除エラー:', error)
        alert(`削除に失敗しました\n${error.message}`)
        return
      }

      if (!data || data.length === 0) {
        console.error('[TransactionDetail] 削除が実行されませんでした（RLSポリシーの可能性）')
        alert('削除に失敗しました。SupabaseのRLSポリシーでDELETEが許可されているか確認してください。')
        return
      }

      onDeleteSuccess?.()
      onClose()
    } catch (error) {
      console.error('[TransactionDetail] Error deleting transaction:', error)
      const errMsg = error instanceof Error ? error.message : String(error)
      alert(`削除に失敗しました\n${errMsg}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveDate = async () => {
    if (!onUpdateTransactionDate) return
    setSavingDate(true)
    try {
      const formatted = formatDateTimeForDb(dateInput, timeInput)
      await onUpdateTransactionDate(transaction.id, formatted)
    } catch (error) {
      console.error('[TransactionDetail] 日時の保存エラー:', error)
      alert('日時の保存に失敗しました')
    } finally {
      setSavingDate(false)
    }
  }

  const handleSaveDetails = async () => {
    if (!onUpdateDetails) return
    setSavingDetails(true)
    try {
      const items = detailRows
        .map(i => {
          const raw =
            typeof i.amount === 'number' ? i.amount : parseFloat(String(i.amount).replace(/,/g, ''))
          return {
            name: i.name.trim(),
            amount: Number.isFinite(raw) ? raw : 0,
          }
        })
        .filter(i => i.name.length > 0 && i.amount > 0)
      const payload: Transaction['details'] = items.length > 0 ? { items } : null
      await onUpdateDetails(transaction.id, payload)
    } catch (error) {
      console.error('[TransactionDetail] 明細の保存エラー:', error)
      alert('購入明細の保存に失敗しました')
    } finally {
      setSavingDetails(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'white',
      zIndex: 1000,
      overflow: 'auto',
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '1rem',
      }}>
        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>取引詳細</h2>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* 基本情報 */}
        <div style={{
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}>
            <Store size={18} color="#666" />
            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{transaction.merchant}</span>
          </div>

          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: transaction.withdrawal_amount ? '#e74c3c' : '#27ae60',
            marginBottom: '1rem',
          }}>
            {transaction.withdrawal_amount
              ? `-${formatCurrency(transaction.withdrawal_amount)}`
              : transaction.deposit_amount
              ? `+${formatCurrency(transaction.deposit_amount)}`
              : formatCurrency(0)}
          </div>

          {/* 日時（編集） */}
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e8e8e8',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#444',
            }}>
              <Calendar size={16} color="#666" />
              取引日時
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '0.5rem' }}>
              現在の表示: {formatTransactionDate(transaction.transaction_date)}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                placeholder="YYYY/MM/DD"
                disabled={!onUpdateTransactionDate}
                style={{
                  flex: '1 1 120px',
                  minWidth: '110px',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
              <input
                type="time"
                value={timeInput.slice(0, 5)}
                onChange={(e) => {
                  const v = e.target.value
                  setTimeInput(v ? `${v}:00` : '12:00:00')
                }}
                step="60"
                disabled={!onUpdateTransactionDate}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
              {onUpdateTransactionDate && (
                <button
                  type="button"
                  onClick={handleSaveDate}
                  disabled={savingDate}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: savingDate ? '#ccc' : '#00C300',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: savingDate ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingDate ? '保存中…' : '日時を保存'}
                </button>
              )}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            fontSize: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={16} color="#666" />
              <span>{transaction.payment_method}</span>
            </div>
            {transaction.asset && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={16} color="#666" />
                <span>資産: {transaction.asset}</span>
              </div>
            )}
            {transaction.user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} color="#666" />
                <span>{transaction.user}</span>
              </div>
            )}
          </div>

          {/* カテゴリ（編集） */}
          {onUpdateCategory && (
            <div style={{
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid #e8e8e8',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.35rem',
                fontSize: '13px',
                fontWeight: 'bold',
                color: '#444',
              }}>
                <Tag size={16} color="#666" />
                カテゴリ
              </div>
              <CategoryField transaction={transaction} onUpdateCategory={onUpdateCategory} />
            </div>
          )}

          {/* 取引番号 */}
          <div style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '12px',
            color: '#999',
          }}>
            <Hash size={14} color="#999" />
            <span>{transaction.transaction_number}</span>
          </div>
        </div>

        {/* メモ（編集） */}
        {onUpdateMemo && (
          <div style={{
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
            }}>
              メモ
            </h3>
            <MemoField transaction={transaction} onUpdateMemo={onUpdateMemo} />
          </div>
        )}

        {/* その他の情報 */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666',
          marginBottom: '1rem',
        }}>
          <div style={{ marginBottom: '0.25rem' }}>
            取引種別: {transaction.transaction_type}
          </div>
          {transaction.payment_category && (
            <div style={{ marginBottom: '0.25rem' }}>
              支払い区分: {transaction.payment_category}
            </div>
          )}
          {transaction.currency && (
            <div style={{ marginBottom: '0.25rem' }}>
              通貨: {transaction.currency}
              {transaction.exchange_rate && ` (レート: ${transaction.exchange_rate})`}
            </div>
          )}
          {transaction.country && (
            <div style={{ marginBottom: '0.25rem' }}>
              利用国: {transaction.country}
            </div>
          )}
        </div>

        {/* 削除ボタン */}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e0e0e0',
        }}>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #e74c3c',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#e74c3c',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: isDeleting ? 0.6 : 1,
            }}
          >
            <Trash2 size={18} />
            {isDeleting ? '削除中...' : 'この取引を削除'}
          </button>
        </div>

        {/* レシート画像 */}
        {transaction.receipt_image && (
          <div style={{
            marginTop: '1.5rem',
            marginBottom: '1rem',
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <Receipt size={18} color="#666" />
              レシート画像
            </h3>
            <div style={{
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              padding: '0.5rem',
              border: '1px solid #e0e0e0',
            }}>
              <img
                src={`data:image/jpeg;base64,${transaction.receipt_image}`}
                alt="Receipt"
                style={{
                  width: '100%',
                  maxHeight: '600px',
                  objectFit: 'contain',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>
        )}

        {/* 購入明細（編集） */}
        {onUpdateDetails && (
          <div style={{
            marginBottom: '1rem',
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <Receipt size={18} color="#666" />
              購入明細
            </h3>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              padding: '0.75rem',
            }}>
              {detailRows.length === 0 && (
                <p style={{ margin: '0 0 0.75rem', fontSize: '13px', color: '#888' }}>
                  行がありません。「行を追加」から入力できます。
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {detailRows.map((row, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => {
                        const v = e.target.value
                        setDetailRows(prev => prev.map((r, i) => (i === idx ? { ...r, name: v } : r)))
                      }}
                      placeholder="品目"
                      style={{
                        flex: '1 1 140px',
                        minWidth: '120px',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={Number.isFinite(row.amount) ? String(row.amount) : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d.,]/g, '')
                        const num = parseFloat(raw.replace(/,/g, ''))
                        setDetailRows(prev =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, amount: Number.isFinite(num) ? num : 0 } : r
                          )
                        )
                      }}
                      placeholder="金額"
                      style={{
                        width: '100px',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setDetailRows(prev => prev.filter((_, i) => i !== idx))}
                      style={{
                        padding: '0.35rem 0.6rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        color: '#c00',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setDetailRows(prev => [...prev, { name: '', amount: 0 }])}
                style={{
                  marginTop: '0.75rem',
                  padding: '0.5rem 1rem',
                  border: '1px dashed #999',
                  borderRadius: '6px',
                  backgroundColor: '#fafafa',
                  color: '#555',
                  fontSize: '13px',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                行を追加
              </button>
              <button
                type="button"
                onClick={handleSaveDetails}
                disabled={savingDetails}
                style={{
                  marginTop: '0.75rem',
                  width: '100%',
                  padding: '0.65rem',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: savingDetails ? '#ccc' : '#00C300',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  cursor: savingDetails ? 'not-allowed' : 'pointer',
                }}
              >
                {savingDetails ? '保存中…' : '購入明細を保存'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
