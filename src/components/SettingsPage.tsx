import { useState } from 'react'
import { X } from 'lucide-react'
import { CategoryManagement } from './CategoryManagement'
import { AssetManagement } from './AssetManagement'

interface SettingsPageProps {
  onClose: () => void
}

export function SettingsPage({ onClose }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<'category' | 'asset'>('category')

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'white',
      zIndex: 1000,
      overflow: 'auto',
    }}>
      {/* ヘッダー */}
      <div style={{
        backgroundColor: '#1a1a1a',
        color: 'white',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>設定</h2>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            color: 'white',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={24} />
        </button>
      </div>

      {/* タブ */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#f9f9f9',
      }}>
        <button
          onClick={() => setActiveTab('category')}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            backgroundColor: activeTab === 'category' ? 'white' : 'transparent',
            color: activeTab === 'category' ? '#1a1a1a' : '#666',
            fontWeight: activeTab === 'category' ? 'bold' : 'normal',
            cursor: 'pointer',
            borderBottom: activeTab === 'category' ? '2px solid #1a1a1a' : '2px solid transparent',
          }}
        >
          カテゴリ管理
        </button>
        <button
          onClick={() => setActiveTab('asset')}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            backgroundColor: activeTab === 'asset' ? 'white' : 'transparent',
            color: activeTab === 'asset' ? '#1a1a1a' : '#666',
            fontWeight: activeTab === 'asset' ? 'bold' : 'normal',
            cursor: 'pointer',
            borderBottom: activeTab === 'asset' ? '2px solid #1a1a1a' : '2px solid transparent',
          }}
        >
          資産管理
        </button>
      </div>

      {/* コンテンツ */}
      <div style={{ padding: '1rem' }}>
        {activeTab === 'category' && (
          <CategoryManagement
            onClose={onClose}
          />
        )}
        {activeTab === 'asset' && (
          <AssetManagement
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}
