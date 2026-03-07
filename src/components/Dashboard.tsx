import { useMemo } from 'react'
import { Transaction } from '../types'
import { formatCurrency } from '../utils/formatCurrency'
import { formatTransactionDate } from '../utils/dateUtils'
import { ArrowRight, TrendingUp, TrendingDown, Calendar, CreditCard } from 'lucide-react'

interface DashboardProps {
  transactions: Transaction[]
  onNavigateToTransactions: () => void
}

export function Dashboard({ transactions, onNavigateToTransactions }: DashboardProps) {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`

  // 今月の取引をフィルタリング
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.transaction_date.replace(/\//g, '-'))
      const txMonth = `${txDate.getFullYear()}/${String(txDate.getMonth() + 1).padStart(2, '0')}`
      return txMonth === currentMonth
    })
  }, [transactions, currentMonth])

  // 今月の支出合計
  const monthlyExpense = useMemo(() => {
    return currentMonthTransactions.reduce((sum, tx) => {
      return sum + (tx.withdrawal_amount || 0)
    }, 0)
  }, [currentMonthTransactions])

  // 今月の収入合計
  const monthlyIncome = useMemo(() => {
    return currentMonthTransactions.reduce((sum, tx) => {
      return sum + (tx.deposit_amount || 0)
    }, 0)
  }, [currentMonthTransactions])

  // カテゴリ別の支出
  const categoryExpenses = useMemo(() => {
    const categoryMap: Record<string, number> = {}
    currentMonthTransactions.forEach(tx => {
      if (tx.withdrawal_amount && tx.category) {
        categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.withdrawal_amount
      }
    })
    return Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5) // トップ5
  }, [currentMonthTransactions])

  // 最近の取引（最新5件）
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        const dateA = new Date(a.transaction_date.replace(/\//g, '-'))
        const dateB = new Date(b.transaction_date.replace(/\//g, '-'))
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 5)
  }, [transactions])

  // 取引数
  const transactionCount = transactions.length
  const monthlyTransactionCount = currentMonthTransactions.length

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* ヘッダー */}
      <div style={{
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1a1a1a',
            marginBottom: '0.5rem',
          }}>
            ダッシュボード
          </h1>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#666',
          }}>
            {currentMonth}の概要
          </p>
        </div>
        <button
          onClick={onNavigateToTransactions}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: '#00a000',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 160, 0, 0.2)',
          }}
        >
          明細一覧を見る
          <ArrowRight size={18} />
        </button>
      </div>

      {/* 統計カード */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {/* 今月の支出 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}>
            <div style={{
              padding: '0.75rem',
              borderRadius: '8px',
              backgroundColor: '#fee',
            }}>
              <TrendingDown size={24} color="#e74c3c" />
            </div>
            <span style={{
              fontSize: '12px',
              color: '#999',
            }}>
              今月の支出
            </span>
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#e74c3c',
          }}>
            {formatCurrency(monthlyExpense)}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#999',
            marginTop: '0.5rem',
          }}>
            {monthlyTransactionCount}件の取引
          </div>
        </div>

        {/* 今月の収入 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}>
            <div style={{
              padding: '0.75rem',
              borderRadius: '8px',
              backgroundColor: '#efe',
            }}>
              <TrendingUp size={24} color="#27ae60" />
            </div>
            <span style={{
              fontSize: '12px',
              color: '#999',
            }}>
              今月の収入
            </span>
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#27ae60',
          }}>
            {formatCurrency(monthlyIncome)}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#999',
            marginTop: '0.5rem',
          }}>
            {currentMonthTransactions.filter(tx => tx.deposit_amount).length}件の取引
          </div>
        </div>

        {/* 総取引数 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}>
            <div style={{
              padding: '0.75rem',
              borderRadius: '8px',
              backgroundColor: '#eef',
            }}>
              <CreditCard size={24} color="#3498db" />
            </div>
            <span style={{
              fontSize: '12px',
              color: '#999',
            }}>
              総取引数
            </span>
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#3498db',
          }}>
            {transactionCount.toLocaleString()}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#999',
            marginTop: '0.5rem',
          }}>
            全期間
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem',
      }}>
        {/* カテゴリ別支出 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{
            margin: 0,
            marginBottom: '1rem',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#1a1a1a',
          }}>
            カテゴリ別支出（今月）
          </h2>
          {categoryExpenses.length > 0 ? (
            <div>
              {categoryExpenses.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 0',
                    borderBottom: idx < categoryExpenses.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                >
                  <span style={{
                    fontSize: '14px',
                    color: '#333',
                  }}>
                    {item.category}
                  </span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#e74c3c',
                  }}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#999',
              fontSize: '14px',
            }}>
              データがありません
            </div>
          )}
        </div>

        {/* 最近の取引 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{
            margin: 0,
            marginBottom: '1rem',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#1a1a1a',
          }}>
            最近の取引
          </h2>
          {recentTransactions.length > 0 ? (
            <div>
              {recentTransactions.map((tx, idx) => (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 0',
                    borderBottom: idx < recentTransactions.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#333',
                      marginBottom: '0.25rem',
                    }}>
                      {tx.merchant}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#999',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}>
                      <Calendar size={12} />
                      {formatTransactionDate(tx.transaction_date)}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: tx.withdrawal_amount ? '#e74c3c' : '#27ae60',
                    marginLeft: '1rem',
                  }}>
                    {tx.withdrawal_amount
                      ? `-${formatCurrency(tx.withdrawal_amount)}`
                      : tx.deposit_amount
                      ? `+${formatCurrency(tx.deposit_amount)}`
                      : formatCurrency(0)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#999',
              fontSize: '14px',
            }}>
              データがありません
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
