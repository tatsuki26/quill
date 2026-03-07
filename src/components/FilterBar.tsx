import { FilterType } from '../types'
import { Filter } from 'lucide-react'

interface FilterBarProps {
  filters: FilterType
  onFilterChange: (filters: FilterType) => void
  onToggleFilterPanel: () => void
}

export function FilterBar({ filters, onFilterChange, onToggleFilterPanel }: FilterBarProps) {
  const activeFilters = [
    filters.paymentMethod && '取引方法',
    filters.transactionType && '取引内容',
    filters.category && 'カテゴリ',
    filters.dateFrom && '日付',
    filters.amountMin && '金額',
  ].filter(Boolean).length

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '0.75rem 1rem',
      backgroundColor: 'white',
      borderBottom: '1px solid #f0f0f0',
      gap: '0.5rem',
      overflowX: 'auto',
    }}>
      <button
        onClick={onToggleFilterPanel}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 12px',
          border: '1px solid #ddd',
          borderRadius: '20px',
          backgroundColor: activeFilters > 0 ? '#00C300' : 'white',
          color: activeFilters > 0 ? 'white' : '#333',
          cursor: 'pointer',
          fontSize: '14px',
          whiteSpace: 'nowrap',
        }}
      >
        <Filter size={16} />
        フィルター
        {activeFilters > 0 && (
          <span style={{
            marginLeft: '4px',
            backgroundColor: 'rgba(255,255,255,0.3)',
            padding: '2px 6px',
            borderRadius: '10px',
            fontSize: '12px',
          }}>
            {activeFilters}
          </span>
        )}
      </button>

      <div style={{
        display: 'flex',
        gap: '0.5rem',
        flex: 1,
        overflowX: 'auto',
      }}>
        <button
          onClick={() => onFilterChange({ ...filters, paymentMethod: undefined })}
          style={{
            padding: '6px 12px',
            border: 'none',
            borderRadius: '20px',
            backgroundColor: '#f0f0f0',
            color: '#333',
            cursor: 'pointer',
            fontSize: '14px',
            whiteSpace: 'nowrap',
          }}
        >
          すべて
        </button>
        <button
          onClick={() => onFilterChange({ ...filters, paymentMethod: 'PayPay残高' })}
          style={{
            padding: '6px 12px',
            border: 'none',
            borderRadius: '20px',
            backgroundColor: filters.paymentMethod === 'PayPay残高' ? '#00C300' : '#f0f0f0',
            color: filters.paymentMethod === 'PayPay残高' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '14px',
            whiteSpace: 'nowrap',
          }}
        >
          PayPay残高
        </button>
        <button
          onClick={() => onFilterChange({ ...filters, paymentMethod: 'PayPayカード' })}
          style={{
            padding: '6px 12px',
            border: 'none',
            borderRadius: '20px',
            backgroundColor: filters.paymentMethod === 'PayPayカード' ? '#00C300' : '#f0f0f0',
            color: filters.paymentMethod === 'PayPayカード' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '14px',
            whiteSpace: 'nowrap',
          }}
        >
          PayPayカード
        </button>
      </div>
    </div>
  )
}
