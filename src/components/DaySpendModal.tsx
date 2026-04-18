import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale/ja'
import { X } from 'lucide-react'
import { Transaction } from '../types'
import { formatCurrency } from '../utils/formatCurrency'
import { formatTransactionDate } from '../utils/dateUtils'
import { transactionsOnCalendarDay } from '../utils/spendingAnalytics'

interface DaySpendModalProps {
  yyyyMmDd: string
  transactions: Transaction[]
  onClose: () => void
  onSelectTransaction: (tx: Transaction) => void
}

export function DaySpendModal({
  yyyyMmDd,
  transactions,
  onClose,
  onSelectTransaction,
}: DaySpendModalProps) {
  const dayTxs = transactionsOnCalendarDay(transactions, yyyyMmDd).sort((a, b) =>
    b.transaction_date.localeCompare(a.transaction_date)
  )
  const label = format(parseISO(yyyyMmDd), 'yyyy年M月d日（E）', { locale: ja })
  const total = dayTxs.reduce((s, tx) => s + (tx.withdrawal_amount || 0), 0)

  return (
    <div
      role="dialog"
      aria-label="日別の出金"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        zIndex: 1500,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '78vh',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '1rem 1rem 0.75rem',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '0.5rem',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{label}</h2>
            <p style={{ margin: '0.35rem 0 0', fontSize: '14px', color: '#e74c3c', fontWeight: 'bold' }}>
              出金合計 {formatCurrency(total)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={24} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: '0.5rem 1rem 1rem' }}>
          {dayTxs.length === 0 ? (
            <p style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '2rem' }}>
              この日の出金はありません
            </p>
          ) : (
            dayTxs.map(tx => (
              <button
                key={tx.id}
                type="button"
                onClick={() => onSelectTransaction(tx)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  borderBottom: '1px solid #f5f5f5',
                  background: 'white',
                  padding: '0.85rem 0.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#222' }}>{tx.merchant}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                    {formatTransactionDate(tx.transaction_date)}
                    {tx.category ? ` · ${tx.category}` : ''}
                  </div>
                </div>
                <div style={{ fontWeight: 'bold', color: '#e74c3c', fontSize: '15px' }}>
                  {formatCurrency(tx.withdrawal_amount || 0)}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
