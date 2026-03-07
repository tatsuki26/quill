import { X, Receipt, Calendar, Store, CreditCard, Tag, User, Hash } from 'lucide-react'
import { Transaction } from '../types'
import { formatTransactionDate } from '../utils/dateUtils'
import { formatCurrency } from '../utils/formatCurrency'

interface TransactionDetailProps {
  transaction: Transaction
  onClose: () => void
}

export function TransactionDetail({ transaction, onClose }: TransactionDetailProps) {
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

        {/* 明細の詳細（レシートから抽出された商品リスト） */}
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
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#f9f9f9',
                borderTop: '2px solid #e0e0e0',
                fontWeight: 'bold',
              }}>
                <span>合計</span>
                <span style={{ fontSize: '18px' }}>
                  ¥{details.items.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

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

        {/* レシート画像 */}
        {transaction.receipt_image && (
          <div style={{
            marginBottom: '1rem',
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '0.75rem',
            }}>
              レシート画像
            </h3>
            <img
              src={`data:image/jpeg;base64,${transaction.receipt_image}`}
              alt="Receipt"
              style={{
                width: '100%',
                maxHeight: '400px',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
              }}
            />
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
      </div>
    </div>
  )
}
