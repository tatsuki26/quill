import { useMemo } from 'react'
import { subMonths, format } from 'date-fns'
import { ja } from 'date-fns/locale/ja'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Transaction } from '../types'
import { formatCurrency } from '../utils/formatCurrency'
import { weeklyCategoryStacksForMonth } from '../utils/spendingAnalytics'

const COLORS = ['#FF6B6B', '#FFA07A', '#F7DC6F', '#98D8C8', '#4ECDC4', '#45B7D1', '#BB8FCE', '#85C1E2', '#95A5A6']

interface WeeklyCategorySpendChartProps {
  transactions: Transaction[]
  /** 0 = 今月, 1 = 前月, … */
  monthsAgo: number
}

export function WeeklyCategorySpendChart({ transactions, monthsAgo }: WeeklyCategorySpendChartProps) {
  const { title, rows, categoryKeys } = useMemo(() => {
    const ref = subMonths(new Date(), monthsAgo)
    const year = ref.getFullYear()
    const month0 = ref.getMonth()
    const title = format(new Date(year, month0, 1), 'yyyy年M月', { locale: ja })
    const raw = weeklyCategoryStacksForMonth(transactions, year, month0)
    const catSet = new Set<string>()
    raw.forEach(r => {
      Object.keys(r).forEach(k => {
        if (k !== 'weekLabel') catSet.add(k)
      })
    })
    const categoryKeys = [...catSet].sort((a, b) => a.localeCompare(b, 'ja'))
    return { title, rows: raw, categoryKeys }
  }, [transactions, monthsAgo])

  if (rows.length === 0 || categoryKeys.length === 0) {
    return (
      <div style={{ padding: '1rem', color: '#999', fontSize: '13px' }}>
        {title}：週別データがありません
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <h3 style={{
        margin: '0 0 0.5rem',
        fontSize: '15px',
        fontWeight: 'bold',
        color: '#333',
      }}>
        {title}
      </h3>
      <div style={{ height: '240px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="weekLabel" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v >= 10000 ? `${v / 10000}万` : `${v}`)} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={label => `週: ${label}`}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {categoryKeys.map((cat, i) => (
              <Bar
                key={cat}
                dataKey={cat}
                stackId="w"
                fill={COLORS[i % COLORS.length]}
                name={cat}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
