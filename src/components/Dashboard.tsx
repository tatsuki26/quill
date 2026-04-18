import { useMemo, useState } from 'react'
import { Transaction } from '../types'
import { formatCurrency } from '../utils/formatCurrency'
import { ArrowRight, TrendingDown, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatYearMonthJa } from '../utils/dateUtils'
import {
  aggregateCategoryAmounts,
  allVisibleTransactionsInMonth,
  filterWithdrawalsInMonth,
} from '../utils/spendingAnalytics'
import { SpendingCalendar } from './SpendingCalendar'
import { DaySpendModal } from './DaySpendModal'
import { WeeklyCategorySpendChart } from './WeeklyCategorySpendChart'

const PIE_COLORS = ['#FF6B6B', '#FFA07A', '#F7DC6F', '#98D8C8', '#4ECDC4', '#45B7D1', '#BB8FCE', '#85C1E2', '#95A5A6']

interface DashboardProps {
  transactions: Transaction[]
  onNavigateToTransactions: () => void
  onSelectTransaction?: (tx: Transaction) => void
}

export function Dashboard({
  transactions,
  onNavigateToTransactions,
  onSelectTransaction,
}: DashboardProps) {
  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey)
  const [calendarDay, setCalendarDay] = useState<string | null>(null)

  const { year, month1, month0 } = useMemo(() => {
    const [y, m] = selectedMonth.split('/').map(Number)
    return { year: y, month1: m, month0: m - 1 }
  }, [selectedMonth])

  const withdrawalsInMonth = useMemo(
    () => filterWithdrawalsInMonth(transactions, year, month0),
    [transactions, year, month0]
  )

  const txsInMonth = useMemo(
    () => allVisibleTransactionsInMonth(transactions, year, month0),
    [transactions, year, month0]
  )

  const monthlyExpense = useMemo(
    () => withdrawalsInMonth.reduce((sum, tx) => sum + (tx.withdrawal_amount || 0), 0),
    [withdrawalsInMonth]
  )

  const categoryExpenses = useMemo(
    () => aggregateCategoryAmounts(withdrawalsInMonth),
    [withdrawalsInMonth]
  )

  const pieData = useMemo(
    () => categoryExpenses.map(c => ({ name: c.category, value: c.amount })),
    [categoryExpenses]
  )

  const monthlyTransactionCount = txsInMonth.length

  const changeMonth = (direction: 'prev' | 'next') => {
    const [y, m] = selectedMonth.split('/').map(Number)
    const d = new Date(y, m - 1, 1)
    if (direction === 'prev') {
      d.setMonth(d.getMonth() - 1)
    } else {
      d.setMonth(d.getMonth() + 1)
    }
    const nextKey = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`
    if (direction === 'next' && nextKey > currentMonthKey) return
    setSelectedMonth(nextKey)
  }

  const monthLabelJa = formatYearMonthJa(year, month1)
  const isCurrentMonth = selectedMonth === currentMonthKey

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '26px',
            fontWeight: 'bold',
            color: '#1a1a1a',
            marginBottom: '0.35rem',
          }}>
            ダッシュボード
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
            月を切り替えて支出の内訳を確認できます（デフォルトは今月）
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onNavigateToTransactions()
            window.history.pushState({}, '', '?page=transactions')
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
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

      {/* 月切り替え（参考UIに近い） */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '1.25rem',
        padding: '0.75rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      }}>
        <button
          type="button"
          onClick={() => changeMonth('prev')}
          style={{
            border: 'none',
            backgroundColor: '#f0f0f0',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={22} color="#333" />
        </button>
        <span style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#1a1a1a',
          minWidth: '140px',
          textAlign: 'center',
        }}>
          {monthLabelJa}
        </span>
        <button
          type="button"
          onClick={() => changeMonth('next')}
          disabled={isCurrentMonth}
          style={{
            border: 'none',
            backgroundColor: isCurrentMonth ? '#f5f5f5' : '#f0f0f0',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: isCurrentMonth ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isCurrentMonth ? 0.45 : 1,
          }}
        >
          <ChevronRight size={22} color="#333" />
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1rem',
        marginBottom: '1.25rem',
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.25rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
          }}>
            <div style={{
              padding: '0.6rem',
              borderRadius: '8px',
              backgroundColor: '#fee',
            }}>
              <TrendingDown size={22} color="#e74c3c" />
            </div>
            <span style={{ fontSize: '12px', color: '#999' }}>
              {isCurrentMonth ? '今月の支出' : `${monthLabelJa}の支出`}
            </span>
          </div>
          <div style={{
            fontSize: '26px',
            fontWeight: 'bold',
            color: '#e74c3c',
          }}>
            {formatCurrency(monthlyExpense)}
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '0.35rem' }}>
            出金の合計（カテゴリ未設定は「その他」に含みます）
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.25rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
          }}>
            <div style={{
              padding: '0.6rem',
              borderRadius: '8px',
              backgroundColor: '#eef',
            }}>
              <CreditCard size={22} color="#3498db" />
            </div>
            <span style={{ fontSize: '12px', color: '#999' }}>取引件数</span>
          </div>
          <div style={{
            fontSize: '26px',
            fontWeight: 'bold',
            color: '#3498db',
          }}>
            {monthlyTransactionCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '0.35rem' }}>
            {monthLabelJa}の全取引
          </div>
        </div>
      </div>

      {/* 円グラフ + カテゴリ一覧 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.25rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        marginBottom: '1.25rem',
      }}>
        <h2 style={{
          margin: '0 0 1rem',
          fontSize: '17px',
          fontWeight: 'bold',
          color: '#1a1a1a',
        }}>
          カテゴリ別の支出（{monthLabelJa}）
        </h2>
        {pieData.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            alignItems: 'center',
          }}>
            <div style={{ height: '260px', minWidth: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(1)}%`
                    }
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              {categoryExpenses.map((item, idx) => (
                <div
                  key={item.category}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.65rem 0',
                    borderBottom: idx < categoryExpenses.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                    }} />
                    <span style={{ fontSize: '14px', color: '#333' }}>{item.category}</span>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#e74c3c' }}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#999', fontSize: '14px' }}>
            この月の出金データがありません
          </div>
        )}
      </div>

      {/* カレンダー */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.25rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        marginBottom: '1.25rem',
      }}>
        <h2 style={{
          margin: '0 0 0.5rem',
          fontSize: '17px',
          fontWeight: 'bold',
          color: '#1a1a1a',
        }}>
          カレンダー（日別の出金）
        </h2>
        <SpendingCalendar
          year={year}
          month0={month0}
          transactions={transactions}
          onSelectDay={d => setCalendarDay(d)}
        />
      </div>

      {/* 直近3か月の週別・カテゴリ別 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.25rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        marginBottom: '2rem',
      }}>
        <h2 style={{
          margin: '0 0 0.75rem',
          fontSize: '17px',
          fontWeight: 'bold',
          color: '#1a1a1a',
        }}>
          今月・前月・前々月の週別支出（カテゴリ別）
        </h2>
        <p style={{ margin: '0 0 1rem', fontSize: '12px', color: '#666', lineHeight: 1.5 }}>
          カレンダー月に関わらず、今日を基準とした直近3か月を週ごと（1〜7日単位）に積み上げ表示しています。
        </p>
        <WeeklyCategorySpendChart transactions={transactions} monthsAgo={0} />
        <WeeklyCategorySpendChart transactions={transactions} monthsAgo={1} />
        <WeeklyCategorySpendChart transactions={transactions} monthsAgo={2} />
      </div>

      {calendarDay && (
        <DaySpendModal
          yyyyMmDd={calendarDay}
          transactions={transactions}
          onClose={() => setCalendarDay(null)}
          onSelectTransaction={tx => {
            setCalendarDay(null)
            onSelectTransaction?.(tx)
          }}
        />
      )}
    </div>
  )
}
