import { Transaction } from '../types'
import { formatTransactionDate, formatMonthHeader } from '../utils/dateUtils'
import { formatCurrency } from '../utils/formatCurrency'
import { useMemo } from 'react'

interface TransactionListProps {
  transactions: Transaction[]
}

export function TransactionList({ transactions }: TransactionListProps) {
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {}
    
    transactions.forEach((tx) => {
      const month = formatMonthHeader(tx.transaction_date)
      if (!groups[month]) {
        groups[month] = []
      }
      groups[month].push(tx)
    })
    
    return groups
  }, [transactions])

  const getMerchantIcon = (merchant: string) => {
    // 簡易的なアイコン表示（実際のPayPayアプリでは店舗ロゴを使用）
    const firstChar = merchant.charAt(0)
    return (
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#666',
      }}>
        {firstChar}
      </div>
    )
  }

  const getStatusBadge = (tx: Transaction) => {
    if (tx.transaction_type === 'ポイント、残高の獲得') {
      return (
        <span style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '12px',
        }}>
          付与処理中
        </span>
      )
    }
    
    if (tx.transaction_type === '支払い') {
      return (
        <span style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '12px',
        }}>
          支払い完了
        </span>
      )
    }
    
    return null
  }

  const getCategoryBadge = (category: string | null) => {
    if (!category) return null
    
    const categoryColors: Record<string, { bg: string; color: string }> = {
      '外食': { bg: '#ffe5e5', color: '#cc0000' },
      'コンビニ': { bg: '#e5f3ff', color: '#0066cc' },
      'スーパー': { bg: '#e5ffe5', color: '#00cc00' },
      'ドラッグストア': { bg: '#fff0e5', color: '#cc6600' },
      'ショッピング': { bg: '#f0e5ff', color: '#6600cc' },
      'ガソリン': { bg: '#ffffe5', color: '#cccc00' },
      '医療': { bg: '#ffe5f0', color: '#cc0066' },
      '交通': { bg: '#e5ffff', color: '#00cccc' },
      '娯楽': { bg: '#ffe5ff', color: '#cc00cc' },
      '投資': { bg: '#f5f5f5', color: '#666666' },
      '公共料金': { bg: '#e5e5ff', color: '#0000cc' },
      '食費': { bg: '#fff5e5', color: '#cc3300' },
      'その他': { bg: '#f0f0f0', color: '#666666' },
    }
    
    const colors = categoryColors[category] || categoryColors['その他']
    
    return (
      <span style={{
        backgroundColor: colors.bg,
        color: colors.color,
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
      }}>
        {category}
      </span>
    )
  }

  const getPaymentMethodIcon = (method: string) => {
    if (method.includes('PayPayカード')) {
      return '💳'
    }
    if (method.includes('PayPay残高')) {
      return '💰'
    }
    if (method.includes('PayPayポイント')) {
      return '🎁'
    }
    return ''
  }

  return (
    <div>
      {Object.entries(groupedTransactions)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([month, txs]) => (
          <div key={month}>
            <div style={{
              padding: '1rem',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#333',
              backgroundColor: '#f9f9f9',
            }}>
              {month}
            </div>
            {txs.map((tx) => (
                <div
                key={tx.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: 'white',
                }}
              >
                <div style={{ marginRight: '1rem' }}>
                  {getMerchantIcon(tx.merchant)}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    color: '#333',
                  }}>
                    {tx.merchant}
                  </div>
                  
                  <div style={{
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '4px',
                  }}>
                    {formatTransactionDate(tx.transaction_date)}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginBottom: '4px',
                  }}>
                    {getPaymentMethodIcon(tx.payment_method) && (
                      <span style={{ fontSize: '14px' }}>
                        {getPaymentMethodIcon(tx.payment_method)}
                      </span>
                    )}
                    <span style={{
                      fontSize: '12px',
                      color: '#999',
                    }}>
                      {tx.payment_method}
                    </span>
                    {getStatusBadge(tx)}
                  </div>
                  
                  {tx.category && (
                    <div style={{
                      marginTop: '4px',
                    }}>
                      {getCategoryBadge(tx.category)}
                    </div>
                  )}
                </div>
                
                <div style={{
                  textAlign: 'right',
                  marginLeft: '1rem',
                }}>
                  {tx.withdrawal_amount !== null && (
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#333',
                    }}>
                      {formatCurrency(tx.withdrawal_amount)}
                    </div>
                  )}
                  {tx.deposit_amount !== null && (
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#00C300',
                    }}>
                      +{formatCurrency(tx.deposit_amount)}
                    </div>
                  )}
                  {tx.transaction_type === 'ポイント、残高の獲得' && (
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#00C300',
                    }}>
                      {tx.deposit_amount}pt
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  )
}
