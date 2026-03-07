import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Camera, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
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
  
  // カメラ関連の状態
  const [isCameraMode, setIsCameraMode] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
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

  // 自動保存の処理
  useEffect(() => {
    if (!autoSaveEnabled || hasAutoSaved) return

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
        let formattedDate = date
        const dateMatch = date.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
        if (dateMatch) {
          const year = dateMatch[1]
          const month = dateMatch[2].padStart(2, '0')
          const day = dateMatch[3].padStart(2, '0')
          formattedDate = `${year}/${month}/${day}`
        }
        const transactionNumber = `MANUAL_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

        try {
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

          onSave()
          onClose()
        } catch (error) {
          console.error('Error auto-saving transaction:', error)
          setHasAutoSaved(false) // エラー時はリセット
        }
      }, 1500) // 1.5秒後に自動保存

      return () => clearTimeout(timer)
    }
  }, [date, amount, merchant, asset, receiptImage, autoSaveEnabled, hasAutoSaved, category, memo, receiptDetails, onSave, onClose])

  // カメラのクリーンアップとビデオ要素の設定
  useEffect(() => {
    if (!isCameraMode || !stream) return
    
    // ビデオ要素が確実に存在するまで待つ
    const setupVideo = () => {
      if (videoRef.current) {
        const video = videoRef.current
        console.log('Setting up video element', { 
          stream: { 
            id: stream.id, 
            active: stream.active,
            tracks: stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState }))
          }, 
          video 
        })
        
        // ストリームを設定
        video.srcObject = stream
        
        // 強制的にスタイルを設定（親要素に依存しない）
        video.style.position = 'fixed'
        video.style.top = '0'
        video.style.left = '0'
        video.style.right = '0'
        video.style.bottom = '0'
        video.style.width = window.innerWidth + 'px'
        video.style.height = window.innerHeight + 'px'
        video.style.minWidth = window.innerWidth + 'px'
        video.style.minHeight = window.innerHeight + 'px'
        video.style.objectFit = 'cover'
        video.style.backgroundColor = '#000'
        video.style.transform = 'scaleX(-1)'
        video.style.zIndex = '0'
        video.style.display = 'block'
        
        // 強制的にサイズを再計算
        setTimeout(() => {
          const rect = video.getBoundingClientRect()
          console.log('Video rect after style setting:', rect)
          if (rect.width === 0 || rect.height === 0) {
            console.error('Video still has zero size, forcing dimensions')
            video.style.width = window.innerWidth + 'px'
            video.style.height = window.innerHeight + 'px'
            video.style.minWidth = window.innerWidth + 'px'
            video.style.minHeight = window.innerHeight + 'px'
          }
        }, 100)
        
        // ビデオが読み込まれたら再生
        const handleLoadedMetadata = () => {
          console.log('Video metadata loaded', { 
            videoWidth: video.videoWidth, 
            videoHeight: video.videoHeight,
            readyState: video.readyState
          })
          video.play().catch(err => {
            console.error('Error playing video:', err)
          })
        }
        
        const handleCanPlay = () => {
          console.log('Video can play', { 
            videoWidth: video.videoWidth, 
            videoHeight: video.videoHeight 
          })
          video.play().catch(err => {
            console.error('Error playing video:', err)
          })
        }
        
        const handlePlay = () => {
          const rect = video.getBoundingClientRect()
          const computedStyle = window.getComputedStyle(video)
          console.log('Video is playing', {
            paused: video.paused,
            ended: video.ended,
            readyState: video.readyState,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            clientWidth: video.clientWidth,
            clientHeight: video.clientHeight,
            offsetWidth: video.offsetWidth,
            offsetHeight: video.offsetHeight,
            rect: {
              width: rect.width,
              height: rect.height,
              top: rect.top,
              left: rect.left
            },
            style: {
              width: video.style.width,
              height: video.style.height,
              display: video.style.display,
              position: video.style.position,
            },
            computedStyle: {
              width: computedStyle.width,
              height: computedStyle.height,
              display: computedStyle.display,
              position: computedStyle.position,
              visibility: computedStyle.visibility,
              opacity: computedStyle.opacity,
              zIndex: computedStyle.zIndex,
            }
          })
        }
        
        const handleError = (e: any) => {
          console.error('Video error:', e)
        }
        
        video.addEventListener('loadedmetadata', handleLoadedMetadata)
        video.addEventListener('canplay', handleCanPlay)
        video.addEventListener('play', handlePlay)
        video.addEventListener('error', handleError)
        
        // 即座に再生を試みる
        const playPromise = video.play()
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.error('Error playing video immediately:', err)
          })
        }
        
        return () => {
          console.log('Cleaning up video event listeners')
          video.removeEventListener('loadedmetadata', handleLoadedMetadata)
          video.removeEventListener('canplay', handleCanPlay)
          video.removeEventListener('play', handlePlay)
          video.removeEventListener('error', handleError)
        }
      } else {
        console.log('Video ref not available yet, retrying...')
        setTimeout(setupVideo, 100)
      }
    }
    
    const cleanup = setupVideo()
    
    // クリーンアップ関数（コンポーネントのアンマウント時のみ実行）
    return () => {
      console.log('useEffect cleanup - isCameraMode:', isCameraMode)
      if (cleanup) cleanup()
      // ストリームのクリーンアップは、カメラモードが無効になった時のみ
      if (!isCameraMode && stream) {
        console.log('Stopping stream tracks')
        stream.getTracks().forEach(track => {
          track.stop()
          console.log('Stopped track:', track.kind)
        })
      }
    }
  }, [isCameraMode, stream])

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
      console.log('Requesting camera access...')
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // 背面カメラを優先
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      console.log('Camera access granted', { 
        tracks: mediaStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState }))
      })
      
      // ストリームを設定してからカメラモードを有効化
      setStream(mediaStream)
      
      // 少し待ってからカメラモードを有効化（DOM更新を待つ）
      setTimeout(() => {
        setIsCameraMode(true)
        console.log('Camera mode enabled')
      }, 100)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('カメラへのアクセスに失敗しました。ファイルアップロードを使用してください。')
    }
  }

  const stopCamera = () => {
    console.log('Stopping camera')
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.pause()
    }
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop()
        console.log('Stopped track:', track.kind)
      })
      setStream(null)
    }
    setIsCameraMode(false)
  }

  const captureAndAnalyze = async () => {
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

      if (!hasAutoSaved) {
        alert('取引を保存しました')
      }
      setHasAutoSaved(false) // リセット
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving transaction:', error)
      setHasAutoSaved(false) // エラー時もリセット
      if (!hasAutoSaved) {
        alert('取引の保存に失敗しました')
      }
    }
  }, [date, amount, merchant, asset, category, memo, receiptImage, receiptDetails, hasAutoSaved, onSave, onClose])

  return (
    <>
      {/* カメラモーダル（全画面） */}
      {isCameraMode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000',
          zIndex: 2000,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
        }}>
          {/* ビデオプレビュー - 最初に配置 */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              backgroundColor: '#000',
              transform: 'scaleX(-1)',
              zIndex: 0,
            }}
              onLoadedMetadata={(e) => {
                console.log('Video metadata loaded in JSX', {
                  videoWidth: e.currentTarget.videoWidth,
                  videoHeight: e.currentTarget.videoHeight,
                  readyState: e.currentTarget.readyState
                })
                const video = e.currentTarget
                video.play().catch(err => {
                  console.error('Error playing video in onLoadedMetadata:', err)
                })
              }}
              onCanPlay={(e) => {
                console.log('Video can play in JSX', {
                  videoWidth: e.currentTarget.videoWidth,
                  videoHeight: e.currentTarget.videoHeight
                })
                const video = e.currentTarget
                video.play().catch(err => {
                  console.error('Error playing video in onCanPlay:', err)
                })
              }}
              onPlay={() => {
                console.log('Video is playing in JSX')
              }}
              onError={() => {
                console.error('Video error in JSX')
              }}
            />
          
          {/* ヘッダー */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 10,
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
              position: 'absolute',
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
              zIndex: 20,
            }}>
              <Loader2 size={48} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '18px' }}>解析中...</span>
            </div>
          )}

          {/* コントロールボタン */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '2rem',
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            zIndex: 10,
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
        </div>
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
    </>
  )
}
