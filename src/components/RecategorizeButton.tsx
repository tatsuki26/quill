import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { categorizeMerchantsBatch } from '../lib/gemini'

interface RecategorizeButtonProps {
  onComplete: () => void
}

export function RecategorizeButton({ onComplete }: RecategorizeButtonProps) {
  const [recategorizing, setRecategorizing] = useState(false)
  const [progress, setProgress] = useState('')

  const handleRecategorize = async () => {
    if (!confirm('全ての取引先を再分類しますか？\n時間がかかる場合があります。')) {
      return
    }

    setRecategorizing(true)
    setProgress('取引先を取得中...')

    try {
      // 手動編集されたカテゴリマッピングを取得
      const { data: manualMappings } = await supabase
        .from('category_mappings')
        .select('merchant_name')
        .eq('is_manual', true)

      const manualMerchants = new Set(
        manualMappings?.map(m => m.merchant_name) || []
      )

      // 全てのユニークな取引先を取得
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('merchant')
        .not('merchant', 'is', null)

      if (txError) throw txError

      // 手動編集された取引先を除外
      const uniqueMerchants = Array.from(
        new Set(transactions?.map(tx => tx.merchant).filter(Boolean) || [])
      ).filter(merchant => !manualMerchants.has(merchant))

      if (uniqueMerchants.length === 0) {
        alert('再分類対象の取引先がありません（全て手動編集済みです）')
        setRecategorizing(false)
        setProgress('')
        return
      }

      setProgress(`${uniqueMerchants.length}件の取引先を分類中...`)

      // AIでカテゴリ分類
      const categories = await categorizeMerchantsBatch(uniqueMerchants)

      // カテゴリマッピングを更新（手動編集フラグはfalseのまま）
      const mappingsToUpsert = Object.entries(categories).map(([merchant, category]) => ({
        merchant_name: merchant,
        category,
        is_manual: false,
      }))

      if (mappingsToUpsert.length > 0) {
        await supabase.from('category_mappings').upsert(mappingsToUpsert, {
          onConflict: 'merchant_name',
        })
      }

      // 取引データのカテゴリを更新（手動編集された取引先は除外）
      setProgress('取引データのカテゴリを更新中...')
      const updatePromises = Object.entries(categories).map(([merchant, category]) =>
        supabase
          .from('transactions')
          .update({ category })
          .eq('merchant', merchant)
      )

      await Promise.all(updatePromises)

      setProgress('再分類完了！')
      setTimeout(() => {
        onComplete()
        setRecategorizing(false)
        setProgress('')
      }, 1000)
    } catch (error) {
      console.error('Recategorize error:', error)
      alert(`再分類エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
      setRecategorizing(false)
      setProgress('')
    }
  }

  return (
    <button
      onClick={handleRecategorize}
      disabled={recategorizing}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: recategorizing ? '#ccc' : '#00C300',
        color: 'white',
        cursor: recategorizing ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
      }}
    >
      <RefreshCw size={16} style={{ animation: recategorizing ? 'spin 1s linear infinite' : 'none' }} />
      {recategorizing ? progress || '再分類中...' : '全取引先を再分類'}
    </button>
  )
}
