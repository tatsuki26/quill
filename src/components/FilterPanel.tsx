import { FilterType } from '../types'
import { X } from 'lucide-react'

interface FilterPanelProps {
  filters: FilterType
  onFilterChange: (filters: FilterType) => void
  onClose: () => void
  paymentMethods: string[]
  transactionTypes: string[]
  categories: string[]
}

export function FilterPanel({
  filters,
  onFilterChange,
  onClose,
  paymentMethods,
  transactionTypes,
  categories,
}: FilterPanelProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'flex-end',
    }}>
      <div style={{
        backgroundColor: 'white',
        width: '100%',
        maxHeight: '80vh',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        padding: '1.5rem',
        overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>フィルター</h2>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '14px',
            fontWeight: 'bold',
          }}>
            日付範囲
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value })}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            />
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value })}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '14px',
            fontWeight: 'bold',
          }}>
            金額範囲
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              placeholder="最小"
              value={filters.amountMin || ''}
              onChange={(e) => onFilterChange({
                ...filters,
                amountMin: e.target.value ? parseFloat(e.target.value) : undefined,
              })}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            />
            <input
              type="number"
              placeholder="最大"
              value={filters.amountMax || ''}
              onChange={(e) => onFilterChange({
                ...filters,
                amountMax: e.target.value ? parseFloat(e.target.value) : undefined,
              })}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '14px',
            fontWeight: 'bold',
          }}>
            取引方法
          </label>
          <select
            value={filters.paymentMethod || ''}
            onChange={(e) => onFilterChange({
              ...filters,
              paymentMethod: e.target.value || undefined,
            })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
            }}
          >
            <option value="">すべて</option>
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '14px',
            fontWeight: 'bold',
          }}>
            取引内容
          </label>
          <select
            value={filters.transactionType || ''}
            onChange={(e) => onFilterChange({
              ...filters,
              transactionType: e.target.value || undefined,
            })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
            }}
          >
            <option value="">すべて</option>
            {transactionTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '14px',
            fontWeight: 'bold',
          }}>
            カテゴリ
          </label>
          <select
            value={filters.category || ''}
            onChange={(e) => onFilterChange({
              ...filters,
              category: e.target.value || undefined,
            })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
            }}
          >
            <option value="">すべて</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '14px',
            fontWeight: 'bold',
          }}>
            検索（取引先名）
          </label>
          <input
            type="text"
            placeholder="店舗名で検索"
            value={filters.searchText || ''}
            onChange={(e) => onFilterChange({
              ...filters,
              searchText: e.target.value || undefined,
            })}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onFilterChange({})}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            リセット
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#00C300',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            適用
          </button>
        </div>
      </div>
    </div>
  )
}
