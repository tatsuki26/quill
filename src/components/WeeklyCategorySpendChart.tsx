import { useMemo } from 'react'
import { subMonths, format } from 'date-fns'
import { ja } from 'date-fns/locale/ja'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Transaction } from '../types'
import { formatCurrency } from '../utils/formatCurrency'
import { weeklyCategoryStacksForMonth } from '../utils/spendingAnalytics'
import { CHART_CATEGORY_COLORS } from '../utils/chartColors'

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
      <div style={{ height: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <XAxis dataKey="weekLabel" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v >= 10000 ? `${v / 10000}万` : `${v}`)} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={label => `週: ${label}`}
            />
            {categoryKeys.map((cat, i) => (
              <Bar
                key={cat}
                dataKey={cat}
                stackId="w"
                fill={CHART_CATEGORY_COLORS[i % CHART_CATEGORY_COLORS.length]}
                name={cat}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '6px 10px',
          marginTop: '10px',
          fontSize: '11px',
          color: '#444',
        }}
      >
        {categoryKeys.map((cat, i) => (
          <div
            key={cat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              minWidth: 0,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 2,
                flexShrink: 0,
                backgroundColor: CHART_CATEGORY_COLORS[i % CHART_CATEGORY_COLORS.length],
              }}
            />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
