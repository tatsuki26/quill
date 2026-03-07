import { useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { parseCSV, convertToTransaction } from '../utils/csvParser'
import { supabase } from '../lib/supabase'

interface CSVUploadProps {
  onUploadComplete: () => void
}

export function CSVUpload({ onUploadComplete }: CSVUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setProgress('CSVファイルを読み込んでいます...')

    try {
      const text = await file.text()
      const rows = parseCSV(text)
      setProgress(`${rows.length}件の取引を処理中...`)

      // 取引データを変換
      const transactions = rows.map((row) => convertToTransaction(row))

      // 既存のカテゴリマッピングを取得（手動編集されたものも含む）
      const { data: existingMappings } = await supabase
        .from('category_mappings')
        .select('merchant_name, category, is_manual')

      const existingMap = new Map(
        existingMappings?.map(m => [m.merchant_name, m.category]) || []
      )

      // デフォルト非表示設定を取得
      const { data: hiddenSettings } = await supabase
        .from('default_hidden_settings')
        .select('setting_type, value')

      const hiddenPaymentMethods = new Set(
        hiddenSettings?.filter(s => s.setting_type === 'payment_method').map(s => s.value) || []
      )
      const hiddenTransactionTypes = new Set(
        hiddenSettings?.filter(s => s.setting_type === 'transaction_type').map(s => s.value) || []
      )

      // 取引データにカテゴリと非表示フラグを追加
      setProgress('データベースに保存中...')
      const transactionsWithMetadata = transactions.map(tx => ({
        ...tx,
        category: existingMap.get(tx.merchant) || null,
        is_hidden: hiddenPaymentMethods.has(tx.payment_method) ||
                   hiddenTransactionTypes.has(tx.transaction_type) ||
                   // 銀行からのチャージを非表示
                   (tx.transaction_type === 'チャージ' && tx.payment_method.includes('銀行')),
      }))

      // 同じtransaction_numberの重複を除去（最新のデータを優先）
      const transactionMap = new Map<string, typeof transactionsWithMetadata[0]>()
      for (const tx of transactionsWithMetadata) {
        const existing = transactionMap.get(tx.transaction_number)
        if (!existing || new Date(tx.transaction_date) > new Date(existing.transaction_date)) {
          transactionMap.set(tx.transaction_number, tx)
        }
      }
      const transactionsToInsert = Array.from(transactionMap.values())

      // バッチで挿入（Supabaseの制限を考慮して分割）
      const batchSize = 100
      for (let i = 0; i < transactionsToInsert.length; i += batchSize) {
        const batch = transactionsToInsert.slice(i, i + batchSize)
        
        // バッチ内の重複もチェック
        const uniqueBatch = Array.from(
          new Map(batch.map(tx => [tx.transaction_number, tx])).values()
        )
        
        const { error } = await supabase.from('transactions').upsert(uniqueBatch, {
          onConflict: 'transaction_number',
        })

        if (error) {
          throw error
        }

        setProgress(`${Math.min(i + batchSize, transactionsToInsert.length)}/${transactionsToInsert.length}件を保存しました...`)
      }

      setProgress('アップロード完了！')
      setTimeout(() => {
        onUploadComplete()
        setUploading(false)
        setProgress('')
      }, 1000)
    } catch (error) {
      console.error('Upload error:', error)
      
      // より詳細なエラーメッセージを生成
      let errorMessage = '不明なエラーが発生しました'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        // Supabaseのエラーオブジェクトの場合
        if ('message' in error) {
          errorMessage = String(error.message)
        } else if ('error' in error && typeof error.error === 'object' && error.error !== null && 'message' in error.error) {
          errorMessage = String(error.error.message)
        }
      }
      
      // エラーの詳細をコンソールに出力
      console.error('Error details:', {
        error,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      })
      
      alert(`アップロードエラー: ${errorMessage}\n\n詳細はブラウザのコンソール（F12）を確認してください。`)
      setUploading(false)
      setProgress('')
    }
  }

  return (
    <div style={{
      padding: '1rem',
      border: '2px dashed #ddd',
      borderRadius: '8px',
      textAlign: 'center',
      backgroundColor: uploading ? '#f9f9f9' : 'white',
    }}>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        disabled={uploading}
        style={{ display: 'none' }}
        id="csv-upload"
      />
      <label
        htmlFor="csv-upload"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: uploading ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? (
          <>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: '14px', color: '#666' }}>{progress}</div>
          </>
        ) : (
          <>
            <Upload size={32} color="#00C300" />
            <div style={{ fontSize: '14px', color: '#666' }}>
              CSVファイルをアップロード
            </div>
          </>
        )}
      </label>
    </div>
  )
}
