import { useMemo, useState } from 'react'
import { Transaction } from '../types'
import { formatCurrency } from '../utils/formatCurrency'
import { ArrowRight, TrendingDown, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react'

interface DashboardProps {
  transactions: Transaction[]
  onNavigateToTransactions: () => void
}

export function Dashboard({ transactions, onNavigateToTransactions }: DashboardProps) {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  // 選択された月の取引をフィルタリング
  const selectedMonthTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.transaction_date.replace(/\//g, '-'))
      const txMonth = `${txDate.getFullYear()}/${String(txDate.getMonth() + 1).padStart(2, '0')}`
      return txMonth === selectedMonth
    })
  }, [transactions, selectedMonth])

  // 選択された月の支出合計
  const monthlyExpense = useMemo(() => {
    return selectedMonthTransactions.reduce((sum, tx) => {
      return sum + (tx.withdrawal_amount || 0)
    }, 0)
  }, [selectedMonthTransactions])

  // カテゴリ別の支出
  const categoryExpenses = useMemo(() => {
    const categoryMap: Record<string, number> = {}
    selectedMonthTransactions.forEach(tx => {
      if (tx.withdrawal_amount && tx.category) {
        categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.withdrawal_amount
      }
    })
    return Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [selectedMonthTransactions])

  // 選択された月の取引数
  const monthlyTransactionCount = selectedMonthTransactions.length

  // 月の切り替え関数
  const changeMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('/').map(Number)
    const date = new Date(year, month - 1, 1)
    
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1)
    } else {
      date.setMonth(date.getMonth() + 1)
    }
    
    const newMonth = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`
    setSelectedMonth(newMonth)
  }

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
            {selectedMonth}の概要
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
              {selectedMonth === currentMonth ? '今月の支出' : `${selectedMonth}の支出`}
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

        {/* 今月の取引数 */}
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
              {selectedMonth === currentMonth ? '今月の取引数' : `${selectedMonth}の取引数`}
            </span>
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#3498db',
          }}>
            {monthlyTransactionCount.toLocaleString()}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#999',
            marginTop: '0.5rem',
          }}>
            {selectedMonth}
          </div>
        </div>
      </div>

      {/* カテゴリ別支出 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#1a1a1a',
          }}>
            カテゴリ別支出
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <button
              onClick={() => changeMonth('prev')}
              style={{
                border: 'none',
                backgroundColor: '#f0f0f0',
                borderRadius: '6px',
                padding: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft size={20} color="#666" />
            </button>
            <span style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333',
              minWidth: '80px',
              textAlign: 'center',
            }}>
              {selectedMonth}
            </span>
            <button
              onClick={() => changeMonth('next')}
              disabled={selectedMonth === currentMonth}
              style={{
                border: 'none',
                backgroundColor: selectedMonth === currentMonth ? '#f5f5f5' : '#f0f0f0',
                borderRadius: '6px',
                padding: '0.5rem',
                cursor: selectedMonth === currentMonth ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: selectedMonth === currentMonth ? 0.5 : 1,
              }}
            >
              <ChevronRight size={20} color="#666" />
            </button>
          </div>
        </div>
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
    </div>
  )
}
