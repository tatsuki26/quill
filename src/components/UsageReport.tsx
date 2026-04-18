import { useMemo, useState } from 'react'
import { Transaction } from '../types'
import { formatCurrency } from '../utils/formatCurrency'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatYearMonthJa } from '../utils/dateUtils'
import {
  aggregateCategoryAmounts,
  filterWithdrawalsInMonth,
} from '../utils/spendingAnalytics'
import { WeeklyCategorySpendChart } from './WeeklyCategorySpendChart'

const COLORS = ['#FF6B6B', '#FFA07A', '#F7DC6F', '#98D8C8', '#4ECDC4', '#45B7D1', '#BB8FCE', '#85C1E2', '#95A5A6']

interface UsageReportProps {
  transactions: Transaction[]
}

export function UsageReport({ transactions }: UsageReportProps) {
  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey)

  const { year, month1, month0 } = useMemo(() => {
    const [y, m] = selectedMonth.split('/').map(Number)
    return { year: y, month1: m, month0: m - 1 }
  }, [selectedMonth])

  const withdrawalsInMonth = useMemo(
    () => filterWithdrawalsInMonth(transactions, year, month0),
    [transactions, year, month0]
  )

  const categoryData = useMemo(
    () => aggregateCategoryAmounts(withdrawalsInMonth).map(c => ({ name: c.category, value: c.amount })),
    [withdrawalsInMonth]
  )

  const totalAmount = useMemo(
    () => withdrawalsInMonth.reduce((s, tx) => s + (tx.withdrawal_amount || 0), 0),
    [withdrawalsInMonth]
  )

  const changeMonth = (dir: 'prev' | 'next') => {
    const [y, m] = selectedMonth.split('/').map(Number)
    const d = new Date(y, m - 1, 1)
    if (dir === 'prev') d.setMonth(d.getMonth() - 1)
    else d.setMonth(d.getMonth() + 1)
    const nextKey = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`
    if (dir === 'next' && nextKey > currentMonthKey) return
    setSelectedMonth(nextKey)
  }

  const monthLabelJa = formatYearMonthJa(year, month1)
  const isCurrentMonth = selectedMonth === currentMonthKey

  return (
    <div style={{ padding: '1rem', maxWidth: '720px', margin: '0 auto' }}>
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
          <ChevronLeft size={22} />
        </button>
        <span style={{ fontSize: '18px', fontWeight: 'bold', minWidth: '120px', textAlign: 'center' }}>
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
            opacity: isCurrentMonth ? 0.45 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor: '#00C300',
          borderRadius: '8px',
          color: 'white',
        }}>
          <span style={{ fontWeight: 'bold' }}>支出</span>
          <span style={{ fontWeight: 'bold' }}>合計 {formatCurrency(totalAmount)}</span>
        </div>

        {categoryData.length > 0 ? (
          <>
            <div style={{ marginBottom: '1rem' }}>
              {categoryData.map((item, index) => (
                <div
                  key={item.name}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span style={{ fontWeight: 'bold' }}>{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={88}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
            この月の出金データがありません
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.25rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <h2 style={{
          margin: '0 0 0.75rem',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#333',
        }}>
          今月・前月・前々月の週別（カテゴリ別）
        </h2>
        <WeeklyCategorySpendChart transactions={transactions} monthsAgo={0} />
        <WeeklyCategorySpendChart transactions={transactions} monthsAgo={1} />
        <WeeklyCategorySpendChart transactions={transactions} monthsAgo={2} />
      </div>
    </div>
  )
}
