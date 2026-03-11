import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Category } from '../types'

interface CategoryManagementProps {
  onClose?: () => void
}

// カラーパレット
const COLOR_PALETTE = [
  { bg: '#ffe5e5', text: '#cc0000', name: '赤' },
  { bg: '#e5f3ff', text: '#0066cc', name: '青' },
  { bg: '#e5ffe5', text: '#00cc00', name: '緑' },
  { bg: '#fff0e5', text: '#cc6600', name: 'オレンジ' },
  { bg: '#f0e5ff', text: '#6600cc', name: '紫' },
  { bg: '#ffffe5', text: '#cccc00', name: '黄' },
  { bg: '#ffe5f0', text: '#cc0066', name: 'ピンク' },
  { bg: '#e5ffff', text: '#00cccc', name: 'シアン' },
  { bg: '#ffe5ff', text: '#cc00cc', name: 'マゼンタ' },
  { bg: '#f5f5f5', text: '#666666', name: 'グレー' },
  { bg: '#e5e5ff', text: '#0000cc', name: '濃い青' },
  { bg: '#fff5e5', text: '#cc3300', name: '茶色' },
  { bg: '#f0f0f0', text: '#666666', name: '薄いグレー' },
  { bg: '#e8f5e9', text: '#2e7d32', name: '深緑' },
  { bg: '#fff3e0', text: '#e65100', name: '深オレンジ' },
  { bg: '#f3e5f5', text: '#6a1b9a', name: '深紫' },
]

export function CategoryManagement({ onClose: _onClose }: CategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingColorBg, setEditingColorBg] = useState('#f0f0f0')
  const [editingColorText, setEditingColorText] = useState('#666666')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newColorBg, setNewColorBg] = useState('#f0f0f0')
  const [newColorText, setNewColorText] = useState('#666666')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
      alert('カテゴリの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setEditingName(category.name)
    setEditingColorBg(category.color_bg)
    setEditingColorText(category.color_text)
  }

  const handleSave = async () => {
    if (!editingId) return
    if (!editingName.trim()) {
      alert('カテゴリ名を入力してください')
      return
    }

    try {
      const originalCategory = categories.find(c => c.id === editingId)
      const originalName = originalCategory?.name

      const { data, error } = await supabase
        .from('categories')
        .update({
          name: editingName.trim(),
          color_bg: editingColorBg,
          color_text: editingColorText,
        })
        .eq('id', editingId)
        .select()

      if (error) throw error

      if (!data || data.length === 0) {
        throw new Error('更新が反映されませんでした。SupabaseのRLSポリシーでcategoriesテーブルのUPDATEが許可されているか確認してください。')
      }

      if (originalName && originalName !== editingName.trim()) {
        const { error: txError } = await supabase
          .from('transactions')
          .update({ category: editingName.trim() })
          .eq('category', originalName)

        if (txError) console.error('Error updating transactions category:', txError)

        const { error: mappingError } = await supabase
          .from('category_mappings')
          .update({ category: editingName.trim() })
          .eq('category', originalName)

        if (mappingError) console.error('Error updating category_mappings:', mappingError)
      }

      await loadCategories()
      setEditingId(null)
      setEditingName('')
      setEditingColorBg('#f0f0f0')
      setEditingColorText('#666666')
    } catch (error: any) {
      console.error('Error updating category:', error)
      const errorMessage = error?.message || error?.details || '不明なエラー'
      alert(`カテゴリの更新に失敗しました\n\n${errorMessage}`)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingName('')
    setEditingColorBg('#f0f0f0')
    setEditingColorText('#666666')
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`カテゴリ「${name}」を削除しますか？\nこのカテゴリを使用している取引は「その他」に変更されます。`)) {
      return
    }

    try {
      // このカテゴリを使用している取引を「その他」に変更
      const { data: otherCategory } = await supabase
        .from('categories')
        .select('name')
        .eq('name', 'その他')
        .single()

      if (otherCategory) {
        await supabase
          .from('transactions')
          .update({ category: 'その他' })
          .eq('category', name)

        await supabase
          .from('category_mappings')
          .update({ category: 'その他' })
          .eq('category', name)
      }

      // カテゴリを削除
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('カテゴリの削除に失敗しました')
    }
  }

  const handleAdd = async () => {
    if (!newCategoryName.trim()) {
      alert('カテゴリ名を入力してください')
      return
    }

    try {
      const maxOrder = categories.length > 0
        ? Math.max(...categories.map(c => c.display_order))
        : 0

      const { error } = await supabase
        .from('categories')
        .insert({
          name: newCategoryName.trim(),
          color_bg: newColorBg,
          color_text: newColorText,
          display_order: maxOrder + 1,
        })

      if (error) throw error

      await loadCategories()
      setShowAddForm(false)
      setNewCategoryName('')
      setNewColorBg('#f0f0f0')
      setNewColorText('#666666')
    } catch (error) {
      console.error('Error adding category:', error)
      alert('カテゴリの追加に失敗しました')
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
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>カテゴリ管理</h2>
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
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>新しいカテゴリを追加</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              カテゴリ名
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="カテゴリ名を入力"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              背景色
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {COLOR_PALETTE.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setNewColorBg(color.bg)
                    setNewColorText(color.text)
                  }}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: newColorBg === color.bg ? '3px solid #333' : '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: color.bg,
                    cursor: 'pointer',
                  }}
                  title={color.name}
                />
              ))}
            </div>
            <div style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: newColorBg,
              color: newColorText,
              borderRadius: '4px',
              textAlign: 'center',
              fontWeight: 'bold',
            }}>
              プレビュー: {newCategoryName || 'カテゴリ名'}
            </div>
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
                setNewCategoryName('')
                setNewColorBg('#f0f0f0')
                setNewColorText('#666666')
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
        {categories.map((category) => (
          <div
            key={category.id}
            style={{
              padding: '1rem',
              marginBottom: '0.5rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #f0f0f0',
            }}
          >
            {editingId === category.id ? (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    カテゴリ名
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
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    背景色
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {COLOR_PALETTE.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setEditingColorBg(color.bg)
                          setEditingColorText(color.text)
                        }}
                        style={{
                          width: '40px',
                          height: '40px',
                          border: editingColorBg === color.bg ? '3px solid #333' : '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: color.bg,
                          cursor: 'pointer',
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: editingColorBg,
                    color: editingColorText,
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}>
                    プレビュー: {editingName || 'カテゴリ名'}
                  </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span
                    style={{
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      backgroundColor: category.color_bg,
                      color: category.color_text,
                    }}
                  >
                    {category.name}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(category)}
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
                  {category.name !== 'その他' && (
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
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
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
