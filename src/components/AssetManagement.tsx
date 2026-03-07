import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Asset } from '../types'

interface AssetManagementProps {
  onClose?: () => void
}

export function AssetManagement({ onClose }: AssetManagementProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAssetName, setNewAssetName] = useState('')

  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setAssets(data || [])
    } catch (error) {
      console.error('Error loading assets:', error)
      alert('資産の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (asset: Asset) => {
    setEditingId(asset.id)
    setEditingName(asset.name)
  }

  const handleSave = async () => {
    if (!editingId) return
    if (!editingName.trim()) {
      alert('資産名を入力してください')
      return
    }

    try {
      const { error } = await supabase
        .from('assets')
        .update({
          name: editingName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId)

      if (error) throw error

      await loadAssets()
      setEditingId(null)
      setEditingName('')
    } catch (error) {
      console.error('Error updating asset:', error)
      alert('資産の更新に失敗しました')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`資産「${name}」を削除しますか？\nこの資産を使用している取引の資産情報が削除されます。`)) {
      return
    }

    try {
      // この資産を使用している取引の資産情報を削除
      await supabase
        .from('transactions')
        .update({ asset: null })
        .eq('asset', name)

      // 資産を削除
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadAssets()
    } catch (error) {
      console.error('Error deleting asset:', error)
      alert('資産の削除に失敗しました')
    }
  }

  const handleAdd = async () => {
    if (!newAssetName.trim()) {
      alert('資産名を入力してください')
      return
    }

    try {
      const maxOrder = assets.length > 0
        ? Math.max(...assets.map(a => a.display_order))
        : 0

      const { error } = await supabase
        .from('assets')
        .insert({
          name: newAssetName.trim(),
          display_order: maxOrder + 1,
        })

      if (error) throw error

      await loadAssets()
      setShowAddForm(false)
      setNewAssetName('')
    } catch (error) {
      console.error('Error adding asset:', error)
      alert('資産の追加に失敗しました')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        読み込み中...
      </div>
    )
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>資産管理</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#00C300',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              <Plus size={16} />
              追加
            </button>
          )}
        </div>
      </div>

      {showAddForm && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          marginBottom: '1rem',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>新しい資産を追加</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              資産名
            </label>
            <input
              type="text"
              value={newAssetName}
              onChange={(e) => setNewAssetName(e.target.value)}
              placeholder="資産名を入力"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleAdd}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#00C300',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              <Save size={16} />
              追加
            </button>
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewAssetName('')
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#ccc',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              <X size={16} />
              キャンセル
            </button>
          </div>
        </div>
      )}

      <div>
        {assets.map((asset) => (
          <div
            key={asset.id}
            style={{
              padding: '1rem',
              marginBottom: '0.5rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #f0f0f0',
            }}
          >
            {editingId === asset.id ? (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    資産名
                  </label>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={handleSave}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: '#00C300',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    <Save size={16} />
                    保存
                  </button>
                  <button
                    onClick={handleCancel}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: '#ccc',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    <X size={16} />
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {asset.name}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(asset)}
                    style={{
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: '#f0f0f0',
                      color: '#666',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(asset.id, asset.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: '#ff4444',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    <Trash2 size={16} />
                    削除
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
