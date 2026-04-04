import { FilterType } from '../types'
import { Search } from 'lucide-react'

interface FilterBarProps {
  filters: FilterType
  onToggleFilterPanel: () => void
}

export function FilterBar({ filters, onToggleFilterPanel }: FilterBarProps) {
  const activeCount = [
    filters.dateFrom || filters.dateTo,
    filters.category,
    filters.searchText?.trim(),
  ].filter(Boolean).length

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '0.75rem 1rem',
      backgroundColor: 'white',
      borderBottom: '1px solid #f0f0f0',
      gap: '0.5rem',
    }}>
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
  )
}
