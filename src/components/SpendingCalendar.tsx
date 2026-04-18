import { useMemo } from 'react'
import { endOfMonth, format } from 'date-fns'
import { ja } from 'date-fns/locale/ja'
import { formatCurrency } from '../utils/formatCurrency'
import { dailyWithdrawalTotals } from '../utils/spendingAnalytics'
import { Transaction } from '../types'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

interface SpendingCalendarProps {
  year: number
  month0: number
  transactions: Transaction[]
  onSelectDay: (yyyyMmDd: string) => void
}

export function SpendingCalendar({ year, month0, transactions, onSelectDay }: SpendingCalendarProps) {
  const dailyTotals = useMemo(
    () => dailyWithdrawalTotals(transactions, year, month0),
    [transactions, year, month0]
  )

  const { cells } = useMemo(() => {
    const first = new Date(year, month0, 1)
    const lastDay = endOfMonth(first).getDate()
    const startWeekday = first.getDay()
    const cells: ({ day: number; key: string } | null)[] = []
    for (let i = 0; i < startWeekday; i++) {
      cells.push(null)
    }
    for (let d = 1; d <= lastDay; d++) {
      const key = format(new Date(year, month0, d), 'yyyy-MM-dd')
      cells.push({ day: d, key })
    }
    while (cells.length % 7 !== 0) {
      cells.push(null)
    }
    return { cells }
  }, [year, month0])

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '2px',
        marginBottom: '4px',
        fontSize: '11px',
        color: '#888',
        textAlign: 'center',
      }}>
        {WEEKDAYS.map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
      }}>
        {cells.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} style={{ minHeight: '52px' }} />
          }
          const total = dailyTotals[cell.key] || 0
          const has = total > 0
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelectDay(cell.key)}
              style={{
                minHeight: '52px',
                border: '1px solid #eee',
                borderRadius: '8px',
                backgroundColor: has ? '#fff5f5' : '#fafafa',
                cursor: 'pointer',
                padding: '4px 2px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}
            >
              <span style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#333',
              }}>
                {cell.day}
              </span>
              {has ? (
                <span style={{
                  fontSize: '9px',
                  color: '#e74c3c',
                  fontWeight: 'bold',
                  lineHeight: 1.2,
                  marginTop: '2px',
                  textAlign: 'center',
                }}>
                  {formatCurrency(total)}
                </span>
              ) : (
                <span style={{ fontSize: '9px', color: '#ccc', marginTop: '2px' }}>—</span>
              )}
            </button>
          )
        })}
      </div>
      <p style={{
        margin: '0.75rem 0 0',
        fontSize: '12px',
        color: '#888',
      }}>
        日付をタップすると、その日の出金明細を表示します（{format(new Date(year, month0, 1), 'yyyy年M月', { locale: ja })}）。
      </p>
    </div>
  )
}
