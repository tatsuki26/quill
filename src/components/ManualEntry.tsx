import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Camera, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Category, Asset, Transaction } from '../types'
import { parseReceiptImage, compressImage } from '../lib/geminiVision'
import { analyzeFrameForReceipt, compareFrames } from '../utils/receiptDetection'
import { formatDateTimeForDb } from '../utils/dateUtils'

interface ManualEntryProps {
  onClose: () => void
  onSave: () => void
  onSaveSuccess?: (transaction: Transaction) => void
}

export function ManualEntry({ onClose, onSave, onSaveSuccess }: ManualEntryProps) {
  const [date, setDate] = useState(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
  })
  const [time, setTime] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`
  })
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<string>('')
  const [asset, setAsset] = useState<string>('')
  const [merchant, setMerchant] = useState('')
  const [memo, setMemo] = useState('')
  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  /** レシート解析後の購入明細ドラフト（編集用） */
  const [purchaseLineDraft, setPurchaseLineDraft] = useState<Array<{ name: string; amount: number }> | null>(null)
  /** 解析直後は false。ユーザーが「取引に明細を含める」で true になるまで保存時に details は送らない */
  const [includePurchaseDetails, setIncludePurchaseDetails] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [merchantSuggestions, setMerchantSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  // カメラ関連の状態
  const [isCameraMode, setIsCameraMode] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const previousFrameRef = useRef<Uint8ClampedArray | null>(null)
  const hasAutoCapturedRef = useRef(false)
  const stableCountRef = useRef(0)
  const captureAndAnalyzeRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const [isCapturing, setIsCapturing] = useState(false)
  const [readStatus, setReadStatus] = useState<{
    date: boolean
    amount: boolean
    merchant: boolean
    asset: boolean
  }>({
    date: false,
    amount: false,
    merchant: false,
    asset: false,
  })
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [hasAutoSaved, setHasAutoSaved] = useState(false)
  // レシート解析からの自動入力時は自動保存をスキップ（ユーザーが内容を確認できるようにする）
  const [lastFillFromReceiptParse, setLastFillFromReceiptParse] = useState(false)

  const detailsForDb = useMemo(() => {
    if (!includePurchaseDetails || !purchaseLineDraft?.length) return null
    const items = purchaseLineDraft
      .map(i => {
        const raw = typeof i.amount === 'number' ? i.amount : parseFloat(String(i.amount).replace(/,/g, ''))
        return { name: i.name.trim(), amount: Number.isFinite(raw) ? raw : 0 }
      })
      .filter(i => i.name.length > 0 && i.amount > 0)
    return items.length > 0 ? { items } : null
  }, [includePurchaseDetails, purchaseLineDraft])

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

  // 必須項目の読み取り状況をチェック
  useEffect(() => {
    const hasDate = !!date && date.match(/\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/)
    const hasAmount = !!amount && !isNaN(parseFloat(amount.replace(/,/g, ''))) && parseFloat(amount.replace(/,/g, '')) > 0
    const hasMerchant = !!merchant.trim()
    const hasAsset = !!asset

    setReadStatus({
      date: !!hasDate,
      amount: !!hasAmount,
      merchant: !!hasMerchant,
      asset: !!hasAsset,
    })
  }, [date, amount, merchant, asset])

  // 自動保存の処理（レシート解析からの自動入力時はスキップし、ユーザーが内容を確認してから保存できるようにする）
  useEffect(() => {
    if (!autoSaveEnabled || hasAutoSaved || lastFillFromReceiptParse) return

    const hasDate = !!date && date.match(/\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/)
    const hasAmount = !!amount && !isNaN(parseFloat(amount.replace(/,/g, ''))) && parseFloat(amount.replace(/,/g, '')) > 0
    const hasMerchant = !!merchant.trim()
    const hasAsset = !!asset

    // 全ての必須項目が揃ったら自動保存
    if (hasDate && hasAmount && hasMerchant && hasAsset && receiptImage) {
      const timer = setTimeout(async () => {
        setHasAutoSaved(true)
        // handleSaveを直接呼び出さず、必要な処理を実行
        const amountNum = parseFloat(amount.replace(/,/g, ''))
        const formattedDateTime = formatDateTimeForDb(date, time)
        const transactionNumber = `MANUAL_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

        try {
          const { error } = await supabase
            .from('transactions')
            .insert({
              transaction_date: formattedDateTime,
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
              details: detailsForDb,
            })

          if (error) throw error

          onSave()
          onClose()
        } catch (error) {
          console.error('Error auto-saving transaction:', error)
          setHasAutoSaved(false) // エラー時はリセット
        }
      }, 1500) // 1.5秒後に自動保存

      return () => clearTimeout(timer)
    }
  }, [date, time, amount, merchant, asset, receiptImage, autoSaveEnabled, hasAutoSaved, lastFillFromReceiptParse, category, memo, detailsForDb, onSave, onClose])

  // カメラストリームをビデオ要素に設定（startCamera内で直接管理するため、このuseEffectは最小限）
  useEffect(() => {
    return () => {
      // アンマウント時にストリームをクリーンアップ
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  // レシート検出による自動撮影
  useEffect(() => {
    if (!isCameraMode || isCapturing || isAnalyzing) return

    hasAutoCapturedRef.current = false
    stableCountRef.current = 0
    previousFrameRef.current = null

    const ANALYSIS_INTERVAL = 500
    const STABLE_THRESHOLD = 4 // 2秒間安定（500ms × 4）
    const RECEIPT_SCORE_THRESHOLD = 0.7
    const STABILITY_THRESHOLD = 0.9

    const intervalId = setInterval(() => {
      const video = videoRef.current
      if (!video || video.readyState < 2 || hasAutoCapturedRef.current || isCapturing || isAnalyzing) return

      const width = Math.min(video.videoWidth, 320)
      const height = Math.min(video.videoHeight, 240)
      if (width < 10 || height < 10) return

      let analysisCanvas = analysisCanvasRef.current
      if (!analysisCanvas) {
        analysisCanvas = document.createElement('canvas')
        analysisCanvas.width = width
        analysisCanvas.height = height
        analysisCanvasRef.current = analysisCanvas
      }
      const ctx = analysisCanvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(video, 0, 0, width, height)
      const imageData = ctx.getImageData(0, 0, width, height)

      const { score } = analyzeFrameForReceipt(ctx, width, height)

      let stability = 1
      if (previousFrameRef.current && previousFrameRef.current.length === imageData.data.length) {
        stability = compareFrames(previousFrameRef.current, imageData.data)
      }
      previousFrameRef.current = new Uint8ClampedArray(imageData.data)

      if (score >= RECEIPT_SCORE_THRESHOLD && stability >= STABILITY_THRESHOLD) {
        stableCountRef.current++
        if (stableCountRef.current >= STABLE_THRESHOLD) {
          hasAutoCapturedRef.current = true
          captureAndAnalyzeRef.current()
        }
      } else {
        stableCountRef.current = 0
      }
    }, ANALYSIS_INTERVAL)

    return () => {
      clearInterval(intervalId)
      analysisCanvasRef.current = null
      previousFrameRef.current = null
    }
  }, [isCameraMode, isCapturing, isAnalyzing])

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

  const startCamera = async () => {
    try {
      let mediaStream: MediaStream
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        })
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
      }
      
      setStream(mediaStream)
      setIsCameraMode(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('カメラへのアクセスに失敗しました。ファイルアップロードを使用してください。')
    }
  }

  // ストリームをビデオ要素にアタッチ（ビデオは非表示、Canvasに描画してプレビュー表示＝モバイル黒画面対策）
  useEffect(() => {
    if (!stream || !isCameraMode) return

    const attachStream = (attempts = 0) => {
      const video = videoRef.current || (document.getElementById('camera-video') as HTMLVideoElement | null)
      if (video) {
        video.srcObject = stream
        video.muted = true
        video.setAttribute('playsinline', 'true')
        video.setAttribute('webkit-playsinline', 'true')
        video.playsInline = true
        video.play().catch(() => {})
      } else if (attempts < 60) {
        setTimeout(() => attachStream(attempts + 1), 100)
      }
    }
    const timer = setTimeout(attachStream, 100)
    return () => clearTimeout(timer)
  }, [stream, isCameraMode])

  // Canvasにビデオを描画してプレビュー表示（モバイルでvideo要素が黒くなる問題の回避）
  useEffect(() => {
    if (!stream || !isCameraMode) return

    const video = videoRef.current
    const canvas = previewCanvasRef.current
    if (!video || !canvas) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    let rafId: number
    const draw = () => {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        const vw = video.videoWidth
        const vh = video.videoHeight
        const cw = canvas.width
        const ch = canvas.height
        const scale = Math.max(cw / vw, ch / vh)
        const dw = vw * scale
        const dh = vh * scale
        const dx = (cw - dw) / 2
        const dy = (ch - dh) / 2
        const ctx = canvas.getContext('2d')
        if (ctx) ctx.drawImage(video, 0, 0, vw, vh, dx, dy, dw, dh)
      }
      rafId = requestAnimationFrame(draw)
    }
    rafId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [stream, isCameraMode])

  const stopCamera = () => {
    const video = document.getElementById('camera-video') as HTMLVideoElement | null
    if (video) {
      video.srcObject = null
      video.pause()
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCameraMode(false)
  }

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)
    try {
      // ビデオから画像をキャプチャ
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)

        // CanvasからBlobに変換
        canvas.toBlob(async (blob) => {
          if (!blob) {
            setIsCapturing(false)
            return
          }

          try {
            // 画像を圧縮
            const compressedBase64 = await compressImage(blob as File)
            setReceiptImage(compressedBase64)

            // Gemini Vision APIで解析
            setIsAnalyzing(true)
            const result = await parseReceiptImage(compressedBase64)

            // 解析結果をフォームに反映
            if (result.date) setDate(result.date)
            if (result.time) {
              const t = result.time.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/)
              setTime(t ? `${t[1].padStart(2, '0')}:${t[2].padStart(2, '0')}:${(t[3] ?? '00').padStart(2, '0')}` : '12:00:00')
            }
            if (result.amount) setAmount(String(result.amount))
            if (result.merchant) setMerchant(result.merchant)
            if (result.category) setCategory(result.category)
            // 商品詳細を保存
            if (result.items && result.items.length > 0) {
              setPurchaseLineDraft(result.items.map(it => ({ name: it.name, amount: it.amount })))
              setIncludePurchaseDetails(false)
            } else {
              setPurchaseLineDraft(null)
              setIncludePurchaseDetails(false)
            }
            // レシート解析からの自動入力のため、自動保存をスキップ（ユーザーが内容を確認できるようにする）
            setLastFillFromReceiptParse(true)
            // カメラを閉じてフォームを表示し、ユーザーが内容を確認できるようにする
            stopCamera()
          } catch (error) {
            console.error('Error analyzing receipt:', error)
            alert('レシートの解析に失敗しました。再度撮影してください。')
          } finally {
            setIsAnalyzing(false)
            setIsCapturing(false)
          }
        }, 'image/jpeg', 0.9)
      }
    } catch (error) {
      console.error('Error capturing image:', error)
      setIsCapturing(false)
    }
  }, [])

  captureAndAnalyzeRef.current = captureAndAnalyze

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
      if (result.time) {
        const t = result.time.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/)
        setTime(t ? `${t[1].padStart(2, '0')}:${t[2].padStart(2, '0')}:${(t[3] ?? '00').padStart(2, '0')}` : '12:00:00')
      }
      if (result.amount) setAmount(String(result.amount))
      if (result.merchant) setMerchant(result.merchant)
      if (result.category) setCategory(result.category)
      // 商品詳細を保存
      if (result.items && result.items.length > 0) {
        setPurchaseLineDraft(result.items.map(it => ({ name: it.name, amount: it.amount })))
        setIncludePurchaseDetails(false)
      } else {
        setPurchaseLineDraft(null)
        setIncludePurchaseDetails(false)
      }
      // レシート解析からの自動入力のため、自動保存をスキップ（ユーザーが内容を確認できるようにする）
      setLastFillFromReceiptParse(true)
    } catch (error) {
      console.error('Error analyzing receipt:', error)
      alert('レシートの解析に失敗しました。手動で入力してください。')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSave = useCallback(async () => {
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
      const formattedDateTime = formatDateTimeForDb(date, time)

      // 取引番号を自動生成（UUIDベース）
      const transactionNumber = `MANUAL_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      const { data: insertedData, error } = await supabase
        .from('transactions')
        .insert({
          transaction_date: formattedDateTime,
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
          details: detailsForDb,
        })
        .select('*')
        .single()

      if (error) {
        console.error('[ManualEntry] 保存エラー:', error)
        throw error
      }

      setHasAutoSaved(false) // リセット
      onSave()
      onSaveSuccess?.(insertedData as Transaction)
      onClose()
    } catch (error) {
      console.error('[ManualEntry] Error saving transaction:', error)
      setHasAutoSaved(false) // エラー時もリセット
      if (!hasAutoSaved) {
        const errMsg = error instanceof Error ? error.message : String(error)
        alert(`取引の保存に失敗しました\n${errMsg}`)
      }
    }
  }, [date, time, amount, merchant, asset, category, memo, receiptImage, detailsForDb, hasAutoSaved, onSave, onSaveSuccess, onClose])

  return (
    <>
      {/* カメラモーダル（全画面） - createPortalでdocument.bodyに直接レンダリング */}
      {isCameraMode && createPortal(
        <div 
          id="camera-modal"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#000',
            zIndex: 2000,
          }}
        >
          {/* ビデオ（背面・キャプチャ用）＋ Canvas（前面・プレビュー表示）
              モバイルでvideoが黒く表示されるため、Canvasに描画してプレビューを表示 */}
          <video
            ref={videoRef}
            id="camera-video"
            autoPlay
            playsInline
            muted
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              objectFit: 'cover',
              zIndex: 2000,
            }}
          />
          <canvas
            ref={previewCanvasRef}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: '#000',
              zIndex: 2001,
            }}
          />
          
          {/* ヘッダー */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 2010,
          }}>
            <h3 style={{
              margin: 0,
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
            }}>
              レシートを撮影
            </h3>
            <button
              onClick={stopCamera}
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

          {/* 解析中オーバーレイ */}
          {isAnalyzing && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '2rem',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              zIndex: 2010,
            }}>
              <Loader2 size={48} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '18px' }}>解析中...</span>
            </div>
          )}

          {/* コントロールボタン */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '2rem',
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            zIndex: 2010,
          }}>
            <button
              onClick={captureAndAnalyze}
              disabled={isCapturing || isAnalyzing}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: '4px solid white',
                backgroundColor: isCapturing || isAnalyzing ? '#666' : '#00C300',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: isCapturing || isAnalyzing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              {isCapturing || isAnalyzing ? (
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Camera size={32} />
              )}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* メインフォーム */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        zIndex: 1000,
        overflow: 'auto',
        display: isCameraMode ? 'none' : 'block',
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
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
          }}>
            <label style={{
              fontWeight: 'bold',
            }}>
              レシート画像（オプション）
            </label>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '14px',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={autoSaveEnabled}
                onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span>自動保存</span>
            </label>
          </div>

          {/* 読み取り状況の表示 */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            fontSize: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {readStatus.date ? (
                <CheckCircle size={16} color="#27ae60" />
              ) : (
                <AlertCircle size={16} color="#e74c3c" />
              )}
              <span>日付</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {readStatus.amount ? (
                <CheckCircle size={16} color="#27ae60" />
              ) : (
                <AlertCircle size={16} color="#e74c3c" />
              )}
              <span>金額</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {readStatus.merchant ? (
                <CheckCircle size={16} color="#27ae60" />
              ) : (
                <AlertCircle size={16} color="#e74c3c" />
              )}
              <span>店舗名</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {readStatus.asset ? (
                <CheckCircle size={16} color="#27ae60" />
              ) : (
                <AlertCircle size={16} color="#e74c3c" />
              )}
              <span>資産</span>
            </div>
          </div>

          {!isCameraMode ? (
            <div style={{
              border: '2px dashed #ddd',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: '#f9f9f9',
            }}>
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
              }}>
                <button
                  onClick={startCamera}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#00C300',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Camera size={20} />
                  カメラで撮影
                </button>
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
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#666',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                      解析中...
                    </>
                  ) : (
                    <>
                      <Camera size={20} />
                      ファイルから選択
                    </>
                  )}
                </label>
              </div>
            </div>
          ) : (
            <div style={{
              border: '2px solid #00C300',
              borderRadius: '8px',
              padding: '1rem',
              backgroundColor: '#f9f9f9',
            }}>
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    backgroundColor: '#000',
                  }}
                />
                {isAnalyzing && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>解析中...</span>
                  </div>
                )}
              </div>
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
              }}>
                <button
                  onClick={captureAndAnalyze}
                  disabled={isCapturing || isAnalyzing}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: isCapturing || isAnalyzing ? '#ccc' : '#00C300',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: isCapturing || isAnalyzing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {isCapturing || isAnalyzing ? (
                    <>
                      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                      処理中...
                    </>
                  ) : (
                    <>
                      <Camera size={20} />
                      撮影して解析
                    </>
                  )}
                </button>
                <button
                  onClick={stopCamera}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#666',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  キャンセル
            </button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {receiptImage && !isCameraMode && (
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

          {purchaseLineDraft !== null && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#f5f9ff',
              borderRadius: '8px',
              border: '1px solid #cfe2ff',
            }}>
              <div style={{
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                fontSize: '15px',
              }}>
                購入明細（レシート解析）
              </div>
              <p style={{
                margin: '0 0 0.75rem',
                fontSize: '13px',
                color: '#555',
                lineHeight: 1.5,
              }}>
                内容を確認・修正したうえで「取引に明細を含める」を押すと、保存時に明細が登録されます。押さない場合はレシート画像のみが保存され、行明細は保存されません。
              </p>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                marginBottom: '0.75rem',
              }}>
                <button
                  type="button"
                  onClick={() => setIncludePurchaseDetails(true)}
                  disabled={includePurchaseDetails}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: includePurchaseDetails ? '#ccc' : '#00C300',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: includePurchaseDetails ? 'not-allowed' : 'pointer',
                  }}
                >
                  取引に明細を含める
                </button>
                <button
                  type="button"
                  onClick={() => setIncludePurchaseDetails(false)}
                  disabled={!includePurchaseDetails}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#666',
                    fontSize: '13px',
                    cursor: !includePurchaseDetails ? 'not-allowed' : 'pointer',
                  }}
                >
                  明細を取引から外す
                </button>
              </div>
              {includePurchaseDetails && (
                <div style={{
                  fontSize: '12px',
                  color: '#1a7f37',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                }}>
                  保存時に明細が含まれます
                </div>
              )}
              {!includePurchaseDetails && (
                <div style={{
                  fontSize: '12px',
                  color: '#b45309',
                  marginBottom: '0.5rem',
                }}>
                  明細はまだ取引に含まれていません
                </div>
              )}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}>
                {purchaseLineDraft.map((row, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => {
                        const v = e.target.value
                        setPurchaseLineDraft(prev =>
                          prev ? prev.map((r, i) => (i === idx ? { ...r, name: v } : r)) : prev
                        )
                      }}
                      placeholder="品目"
                      style={{
                        flex: '1 1 140px',
                        minWidth: '120px',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={Number.isFinite(row.amount) ? String(row.amount) : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d.,]/g, '')
                        const num = parseFloat(raw.replace(/,/g, ''))
                        setPurchaseLineDraft(prev =>
                          prev
                            ? prev.map((r, i) =>
                                i === idx ? { ...r, amount: Number.isFinite(num) ? num : 0 } : r
                              )
                            : prev
                        )
                      }}
                      placeholder="金額"
                      style={{
                        width: '100px',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPurchaseLineDraft(prev =>
                          prev ? prev.filter((_, i) => i !== idx) : prev
                        )
                      }}
                      style={{
                        padding: '0.35rem 0.6rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        color: '#c00',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setPurchaseLineDraft(prev => [...(prev || []), { name: '', amount: 0 }])
                }
                style={{
                  marginTop: '0.75rem',
                  padding: '0.5rem 1rem',
                  border: '1px dashed #999',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#555',
                  fontSize: '13px',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                行を追加
              </button>
            </div>
          )}
        </div>

        {/* 日付・時刻 */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
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
          <div style={{ flex: '1 1 120px' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
            }}>
              時刻
            </label>
            <input
              type="time"
              value={time.slice(0, 5)}
              onChange={(e) => {
                const v = e.target.value
                setTime(v ? `${v}:00` : '12:00:00')
              }}
              step="60"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>
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
    </>
  )
}
