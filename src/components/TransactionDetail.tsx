import { useState } from 'react'
import { X, Receipt, Calendar, Store, CreditCard, Tag, User, Hash, Trash2 } from 'lucide-react'
import { Transaction } from '../types'
import { formatTransactionDate } from '../utils/dateUtils'
import { formatCurrency } from '../utils/formatCurrency'
import { supabase } from '../lib/supabase'

interface TransactionDetailProps {
  transaction: Transaction
  onClose: () => void
  onDeleteSuccess?: () => void
}

export function TransactionDetail({ transaction, onClose, onDeleteSuccess }: TransactionDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false)

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

      // 実際に削除されたか確認（RLSでブロックされるとdataが空になる）
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
  const details = transaction.details as { items: Array<{ name: string; amount: number }> } | null

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

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            fontSize: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} color="#666" />
              <span>{formatTransactionDate(transaction.transaction_date)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={16} color="#666" />
              <span>{transaction.payment_method}</span>
            </div>
            {transaction.category && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tag size={16} color="#666" />
                <span>{transaction.category}</span>
              </div>
            )}
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

        {/* メモ */}
        {transaction.memo && (
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
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#333',
              whiteSpace: 'pre-wrap',
            }}>
              {transaction.memo}
            </p>
          </div>
        )}

        {/* その他の情報 */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666',
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

        {/* 購入明細（レシート画像の下に表示） */}
        {details && details.items && details.items.length > 0 && (
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
              overflow: 'hidden',
            }}>
              {details.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    borderBottom: idx < details.items.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                >
                  <span style={{ flex: 1, fontSize: '14px' }}>{item.name}</span>
                  <span style={{
                    fontWeight: 'bold',
                    fontSize: '16px',
                    marginLeft: '1rem',
                    color: '#333',
                  }}>
                    ¥{item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
