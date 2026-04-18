import { FilterType } from '../types'
import { Search } from 'lucide-react'
import { getMonthDateRangeYyyyMmDd } from '../utils/dateUtils'

interface FilterBarProps {
  filters: FilterType
  onToggleFilterPanel: () => void
  onQuickMonth: (monthsAgo: number | null) => void
}

function matchesMonthRange(filters: FilterType, monthsAgo: number): boolean {
  const { dateFrom, dateTo } = getMonthDateRangeYyyyMmDd(monthsAgo)
  return filters.dateFrom === dateFrom && filters.dateTo === dateTo
}

export function FilterBar({ filters, onToggleFilterPanel, onQuickMonth }: FilterBarProps) {
  const activeCount = [
    filters.dateFrom || filters.dateTo,
    filters.category,
    filters.searchText?.trim(),
  ].filter(Boolean).length

  const isAll = !filters.dateFrom && !filters.dateTo

  const btn = (label: string, active: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 12px',
        border: '1px solid #ddd',
        borderRadius: '20px',
        backgroundColor: active ? '#00C300' : 'white',
        color: active ? 'white' : '#333',
        cursor: 'pointer',
        fontSize: '13px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{
      padding: '0.65rem 1rem',
      backgroundColor: 'white',
      borderBottom: '1px solid #f0f0f0',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onToggleFilterPanel}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            border: '1px solid #ddd',
            borderRadius: '20px',
            backgroundColor: activeCount > 0 ? '#00C300' : 'white',
            color: activeCount > 0 ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '14px',
            whiteSpace: 'nowrap',
          }}
        >
          <Search size={18} />
          検索
          {activeCount > 0 && (
            <span style={{
              marginLeft: '2px',
              backgroundColor: 'rgba(255,255,255,0.3)',
              padding: '2px 6px',
              borderRadius: '10px',
              fontSize: '12px',
            }}>
              {activeCount}
            </span>
          )}
        </button>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '12px', color: '#888', marginRight: '0.25rem' }}>月で絞る</span>
        {btn('今月', matchesMonthRange(filters, 0), () => onQuickMonth(0))}
        {btn('前月', matchesMonthRange(filters, 1), () => onQuickMonth(1))}
        {btn('前々月', matchesMonthRange(filters, 2), () => onQuickMonth(2))}
        {btn('すべて', isAll, () => onQuickMonth(null))}
      </div>
    </div>
  )
}
