import { useState, useEffect } from 'react'
import { X, Camera, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Category, Asset } from '../types'
import { parseReceiptImage, compressImage } from '../lib/geminiVision'

interface ManualEntryProps {
  onClose: () => void
  onSave: () => void
}

export function ManualEntry({ onClose, onSave }: ManualEntryProps) {
  const [date, setDate] = useState(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
  })
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<string>('')
  const [asset, setAsset] = useState<string>('')
  const [merchant, setMerchant] = useState('')
  const [memo, setMemo] = useState('')
  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [receiptDetails, setReceiptDetails] = useState<{ items: Array<{ name: string; amount: number }> } | null>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [merchantSuggestions, setMerchantSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    loadCategories()
    loadAssets()
  }, [])

  useEffect(() => {
    if (merchant.length > 0) {
      loadMerchantSuggestions(merchant)
    } else {
      setMerchantSuggestions([])
      setShowSuggestions(false)
    }
  }, [merchant])

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setAssets(data || [])
      // デフォルトで最初の資産を選択
      if (data && data.length > 0 && !asset) {
        setAsset(data[0].name)
      }
    } catch (error) {
      console.error('Error loading assets:', error)
    }
  }

  const loadMerchantSuggestions = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('merchant')
        .ilike('merchant', `%${query}%`)
        .limit(10)

      if (error) throw error

      const uniqueMerchants = Array.from(new Set(data?.map(t => t.merchant) || []))
      setMerchantSuggestions(uniqueMerchants)
      setShowSuggestions(uniqueMerchants.length > 0)
    } catch (error) {
      console.error('Error loading merchant suggestions:', error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック（10MB制限）
    if (file.size > 10 * 1024 * 1024) {
      alert('画像サイズが大きすぎます（10MB以下にしてください）')
      return
    }

    setIsAnalyzing(true)
    try {
      // 画像を圧縮
      const compressedBase64 = await compressImage(file)
      setReceiptImage(compressedBase64)

      // Gemini Vision APIで解析
      const result = await parseReceiptImage(compressedBase64)

      // 解析結果をフォームに反映
      if (result.date) setDate(result.date)
      if (result.amount) setAmount(String(result.amount))
      if (result.merchant) setMerchant(result.merchant)
      if (result.category) setCategory(result.category)
      // 商品詳細を保存
      if (result.items && result.items.length > 0) {
        setReceiptDetails({ items: result.items })
      } else {
        setReceiptDetails(null)
      }
    } catch (error) {
      console.error('Error analyzing receipt:', error)
      alert('レシートの解析に失敗しました。手動で入力してください。')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSave = async () => {
    // バリデーション
    if (!date || !amount || !asset) {
      alert('日付、金額、資産は必須です')
      return
    }

    const amountNum = parseFloat(amount.replace(/,/g, ''))
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('有効な金額を入力してください')
      return
    }

    if (!merchant.trim()) {
      alert('内容（店舗名）を入力してください')
      return
    }

    try {
      // 日付の形式を統一（YYYY/MM/DD形式に変換）
      let formattedDate = date
      const dateMatch = date.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
      if (dateMatch) {
        const year = dateMatch[1]
        const month = dateMatch[2].padStart(2, '0')
        const day = dateMatch[3].padStart(2, '0')
        formattedDate = `${year}/${month}/${day}`
      }

      // 取引番号を自動生成（UUIDベース）
      const transactionNumber = `MANUAL_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      const { error } = await supabase
        .from('transactions')
        .insert({
          transaction_date: formattedDate,
          withdrawal_amount: amountNum,
          deposit_amount: null,
          foreign_withdrawal_amount: null,
          currency: null,
          exchange_rate: null,
          country: null,
          transaction_type: '支払い',
          merchant: merchant.trim(),
          payment_method: '手動入力',
          payment_category: null,
          user: null,
          transaction_number: transactionNumber,
          category: category || null,
          is_hidden: false,
          memo: memo.trim() || null,
          asset: asset,
          receipt_image: receiptImage,
          details: receiptDetails,
        })

      if (error) throw error

      alert('取引を保存しました')
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving transaction:', error)
      alert('取引の保存に失敗しました')
    }
  }

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
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '1rem',
      }}>
        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>手動入力</h2>
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

        {/* レシート画像アップロード */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 'bold',
          }}>
            レシート画像（オプション）
          </label>
          <div style={{
            border: '2px dashed #ddd',
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: '#f9f9f9',
          }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="receipt-upload"
            />
            <label
              htmlFor="receipt-upload"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
              }}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>解析中...</span>
                </>
              ) : (
                <>
                  <Camera size={32} color="#666" />
                  <span>レシート画像をアップロード</span>
                  <span style={{ fontSize: '12px', color: '#999' }}>
                    自動で情報を抽出します
                  </span>
                </>
              )}
            </label>
          </div>
          {receiptImage && (
            <div style={{ marginTop: '0.5rem' }}>
              <img
                src={`data:image/jpeg;base64,${receiptImage}`}
                alt="Receipt"
                style={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  borderRadius: '4px',
                }}
              />
            </div>
          )}
        </div>

        {/* 日付 */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 'bold',
          }}>
            日付 <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="YYYY/MM/DD"
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
        </div>

        {/* 金額 */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 'bold',
          }}>
            金額 <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            value={amount}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\d,]/g, '')
              setAmount(value)
            }}
            placeholder="0"
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
        </div>

        {/* 分類 */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 'bold',
          }}>
            分類
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <option value="">選択してください</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* 資産 */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 'bold',
          }}>
            資産 <span style={{ color: 'red' }}>*</span>
          </label>
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <option value="">選択してください</option>
            {assets.map(a => (
              <option key={a.id} value={a.name}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* 内容（店舗名） */}
        <div style={{ marginBottom: '1rem', position: 'relative' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 'bold',
          }}>
            内容（店舗名）
          </label>
          <input
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="店舗名を入力"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
          {showSuggestions && merchantSuggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginTop: '4px',
              maxHeight: '200px',
              overflow: 'auto',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}>
              {merchantSuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setMerchant(suggestion)
                    setShowSuggestions(false)
                  }}
                  style={{
                    padding: '0.5rem',
                    cursor: 'pointer',
                    borderBottom: idx < merchantSuggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* メモ */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 'bold',
          }}>
            メモ（50文字以内）
          </label>
          <textarea
            value={memo}
            onChange={(e) => {
              const value = e.target.value
              if (value.length <= 50) {
                setMemo(value)
              }
            }}
            placeholder="詳細を入力"
            maxLength={50}
            rows={3}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
          <div style={{
            textAlign: 'right',
            fontSize: '12px',
            color: '#999',
            marginTop: '0.25rem',
          }}>
            {memo.length}/50
          </div>
        </div>

        {/* 保存ボタン */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #f0f0f0',
        }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#00C300',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            保存
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#666',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}
