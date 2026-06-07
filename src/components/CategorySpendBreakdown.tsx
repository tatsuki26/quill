import { useMemo } from 'react'
import { formatCurrency } from '../utils/formatCurrency'
import { CHART_CATEGORY_COLORS } from '../utils/chartColors'

export interface CategorySpendRow {
  name: string
  amount: number
}

interface CategorySpendBreakdownProps {
  rows: CategorySpendRow[]
  /** 金額テキストの色（ダッシュボードは赤系、レポートは任意） */
  amountColor?: string
  /** 積み上げバー上の説明（例: 「2026年4月の内訳（割合）」） */
  stackCaption?: string
}

function formatPct(amount: number, total: number): string {
  if (total <= 0) return '0.0'
  const p = (amount / total) * 100
  if (p > 0 && p < 0.1) return '<0.1'
  return p.toFixed(1)
}

export function CategorySpendBreakdown({
  rows,
  amountColor = '#e74c3c',
  stackCaption = '支出の内訳（割合）',
}: CategorySpendBreakdownProps) {
  const sorted = useMemo(() => {
    const copy = rows.filter(r => r.amount > 0)
    copy.sort((a, b) => b.amount - a.amount)
    return copy
  }, [rows])

  const total = useMemo(() => sorted.reduce((s, r) => s + r.amount, 0), [sorted])

  if (sorted.length === 0 || total <= 0) return null

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '0.35rem' }}>
          {stackCaption}
        </div>
        <div
          style={{
            display: 'flex',
            height: 22,
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
          }}
          role="img"
          aria-label="カテゴリ別の支出構成"
        >
          {sorted.map((r, i) => {
            const pct = (r.amount / total) * 100
            return (
              <div
                key={r.name}
                title={`${r.name}: ${formatCurrency(r.amount)} (${pct.toFixed(1)}%)`}
                style={{
                  flexGrow: r.amount,
                  flexShrink: 1,
                  flexBasis: 0,
                  minWidth: pct >= 0.5 ? 3 : 0,
                  backgroundColor: CHART_CATEGORY_COLORS[i % CHART_CATEGORY_COLORS.length],
                }}
              />
            )
          })}
        </div>
      </div>

      <div>
        {sorted.map((r, i) => {
          const pctNum = total > 0 ? (r.amount / total) * 100 : 0
          const pctLabel = formatPct(r.amount, total)
          return (
            <div key={r.name} style={{ marginBottom: '0.85rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: '0.5rem',
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      flexShrink: 0,
                      backgroundColor: CHART_CATEGORY_COLORS[i % CHART_CATEGORY_COLORS.length],
                    }}
                  />
                  <span
                    style={{
                      fontSize: '14px',
                      color: '#333',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.name}
                  </span>
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: amountColor,
                    flexShrink: 0,
                    textAlign: 'right',
                  }}
                >
                  {formatCurrency(r.amount)}
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 'normal',
                      color: '#666',
                      marginLeft: '0.35rem',
                    }}
                  >
                    ({pctLabel}%)
                  </span>
                </span>
              </div>
              <div
                style={{
                  marginTop: '0.35rem',
                  height: 6,
                  background: '#f0f0f0',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, pctNum)}%`,
                    height: '100%',
                    backgroundColor: CHART_CATEGORY_COLORS[i % CHART_CATEGORY_COLORS.length],
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
