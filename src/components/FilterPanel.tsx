import { useState, useEffect } from 'react'
import { FilterType } from '../types'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface FilterPanelProps {
  filters: FilterType
  onFilterChange: (filters: FilterType) => void
  onClose: () => void
}

export function FilterPanel({
  filters,
  onFilterChange,
  onClose,
}: FilterPanelProps) {
  const [categoryNames, setCategoryNames] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('name')
          .order('display_order', { ascending: true })
        if (error) throw error
        if (!cancelled) {
          setCategoryNames((data || []).map(r => r.name))
        }
      } catch (e) {
        console.error('FilterPanel: categories load failed', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div
      role="dialog"
      aria-label="取引を検索"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          width: '100%',
          maxHeight: '85vh',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          padding: '1.5rem',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>検索</h2>
          <button
            type="button"
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

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '14px',
            fontWeight: 'bold',
          }}>
            日付
          </label>
          <p style={{
            margin: '0 0 0.5rem',
            fontSize: '12px',
            color: '#666',
            lineHeight: 1.5,
          }}>
            開始・終了に同じ日を指定すると、その1日分だけに絞り込めます。片方だけ指定した場合は、その日以降（または以前）になります。
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value || undefined })}
              style={{
                flex: '1 1 140px',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            />
            <span style={{ color: '#999', fontSize: '14px' }}>〜</span>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value || undefined })}
              style={{
                flex: '1 1 140px',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
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
              fontSize: '15px',
            }}
          >
            <option value="">すべて</option>
            {categoryNames.map((cat) => (
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
            キーワード（部分一致）
          </label>
          <p style={{
            margin: '0 0 0.5rem',
            fontSize: '12px',
            color: '#666',
            lineHeight: 1.5,
          }}>
            取引先（店名）・取引種別・支払い方法・メモ・購入明細の品目名のいずれかに含まれる取引を表示します。
          </p>
          <input
            type="search"
            enterKeyHint="search"
            placeholder="例: コンビニ、スーパー、コーヒー"
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
              fontSize: '15px',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
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
            条件をクリア
          </button>
          <button
            type="button"
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
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
