import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { DefaultHiddenSetting } from '../types'
import { X } from 'lucide-react'
import { RecategorizeButton } from './RecategorizeButton'

interface DefaultHiddenSettingsProps {
  onClose: () => void
  onRecategorizeComplete?: () => void
}

export function DefaultHiddenSettings({ onClose, onRecategorizeComplete }: DefaultHiddenSettingsProps) {
  const [settings, setSettings] = useState<DefaultHiddenSetting[]>([])
  const [newSettingType, setNewSettingType] = useState<'payment_method' | 'transaction_type'>('payment_method')
  const [newSettingValue, setNewSettingValue] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('default_hidden_settings')
        .select('*')
        .order('setting_type', { ascending: true })

      if (error) throw error
      setSettings(data || [])
    } catch (error) {
      console.error('Error loading settings:', error)
      alert('設定の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newSettingValue.trim()) return

    try {
      const { error } = await supabase
        .from('default_hidden_settings')
        .insert({
          setting_type: newSettingType,
          value: newSettingValue.trim(),
        })

      if (error) throw error
      setNewSettingValue('')
      loadSettings()
    } catch (error) {
      console.error('Error adding setting:', error)
      alert('設定の追加に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この設定を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('default_hidden_settings')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadSettings()
    } catch (error) {
      console.error('Error deleting setting:', error)
      alert('設定の削除に失敗しました')
    }
  }

  const paymentMethodSettings = settings.filter(s => s.setting_type === 'payment_method')
  const transactionTypeSettings = settings.filter(s => s.setting_type === 'transaction_type')

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
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>デフォルト非表示設定</h2>
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

        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '16px', fontWeight: 'bold' }}>カテゴリ再分類</h3>
          <p style={{ marginBottom: '0.5rem', fontSize: '12px', color: '#666' }}>
            全ての取引先を新しいカテゴリ定義で再分類します。
          </p>
          <RecategorizeButton onComplete={() => {
            loadSettings()
            onRecategorizeComplete?.()
          }} />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '16px', fontWeight: 'bold' }}>新しい設定を追加</h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <select
              value={newSettingType}
              onChange={(e) => setNewSettingType(e.target.value as 'payment_method' | 'transaction_type')}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            >
              <option value="payment_method">取引方法</option>
              <option value="transaction_type">取引内容</option>
            </select>
            <input
              type="text"
              value={newSettingValue}
              onChange={(e) => setNewSettingValue(e.target.value)}
              placeholder="設定値を入力"
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            />
            <button
              onClick={handleAdd}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#00C300',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              追加
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>読み込み中...</div>
        ) : (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '16px', fontWeight: 'bold' }}>取引方法</h3>
              {paymentMethodSettings.length === 0 ? (
                <div style={{ color: '#999', fontSize: '14px' }}>設定なし</div>
              ) : (
                paymentMethodSettings.map(setting => (
                  <div
                    key={setting.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span>{setting.value}</span>
                    <button
                      onClick={() => handleDelete(setting.id)}
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: '#ff3333',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      削除
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '16px', fontWeight: 'bold' }}>取引内容</h3>
              {transactionTypeSettings.length === 0 ? (
                <div style={{ color: '#999', fontSize: '14px' }}>設定なし</div>
              ) : (
                transactionTypeSettings.map(setting => (
                  <div
                    key={setting.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span>{setting.value}</span>
                    <button
                      onClick={() => handleDelete(setting.id)}
                      style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: '#ff3333',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      削除
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%',
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
  )
}
