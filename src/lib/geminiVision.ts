import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from './supabase'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY

if (!apiKey) {
  throw new Error('Missing Gemini API key')
}

const genAI = new GoogleGenerativeAI(apiKey)

export interface ReceiptParseResult {
  date: string | null
  amount: number | null
  merchant: string | null
  category: string | null
}

/**
 * レシート画像を解析して取引情報を抽出
 */
export async function parseReceiptImage(imageBase64: string): Promise<ReceiptParseResult> {
  // Gemini 2.5 Flash-Liteを使用
  let model
  try {
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
  } catch (e) {
    console.warn('Failed to use gemini-2.5-flash-lite, trying gemini-1.5-flash:', e)
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    } catch (e2) {
      console.error('Failed to initialize Gemini model:', e2)
      return { date: null, amount: null, merchant: null, category: null }
    }
  }

  // カテゴリをDBから取得
  const { data: categoryData } = await supabase
    .from('categories')
    .select('name')
    .order('display_order', { ascending: true })
  
  const categories = categoryData?.map(c => c.name) || []
  const categoryList = categories.map((cat) => `- ${cat}`).join('\n')

  const prompt = `このレシート画像を解析して、以下の情報を抽出してください。

抽出する情報：
1. 日付（YYYY/MM/DD形式、またはYYYY-MM-DD形式）
2. 合計金額（数値のみ、円や¥記号は除く）
3. 店舗名（店名、店舗名）
4. カテゴリ（以下のカテゴリから最も適切なものを選択：${categoryList}）

以下のJSON形式で返答してください：
{
  "date": "YYYY/MM/DD形式の日付（見つからない場合はnull）",
  "amount": 数値（見つからない場合はnull）,
  "merchant": "店舗名（見つからない場合はnull）",
  "category": "カテゴリ名（見つからない場合はnull）"
}

重要：
- カテゴリは必ず上記のリストから選択してください
- 日付が見つからない場合はnullを返してください
- 金額が見つからない場合はnullを返してください
- 店舗名が見つからない場合はnullを返してください
- JSON形式のみを返答してください（説明は不要）`

  try {
    // Base64画像を送信
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/jpeg',
      },
    }

    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text().trim()

    console.log('[Gemini Vision] Response:', text)

    // JSONを抽出
    let jsonText = text
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1]
    } else {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonText = jsonMatch[0]
      } else {
        console.warn('[Gemini Vision] No JSON found in response')
        return { date: null, amount: null, merchant: null, category: null }
      }
    }

    const parsed = JSON.parse(jsonText) as ReceiptParseResult

    // 日付の形式を統一（YYYY/MM/DD形式に変換）
    if (parsed.date) {
      const dateMatch = parsed.date.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
      if (dateMatch) {
        const year = dateMatch[1]
        const month = dateMatch[2].padStart(2, '0')
        const day = dateMatch[3].padStart(2, '0')
        parsed.date = `${year}/${month}/${day}`
      }
    }

    // カテゴリの検証
    if (parsed.category && !categories.includes(parsed.category)) {
      // 部分一致で確認
      const matchedCategory = categories.find(cat => {
        const catLower = cat.toLowerCase()
        const categoryLower = parsed.category!.toLowerCase()
        return categoryLower === catLower || 
               categoryLower.includes(catLower) || 
               catLower.includes(categoryLower)
      })
      if (matchedCategory) {
        parsed.category = matchedCategory
      } else {
        parsed.category = null
      }
    }

    return parsed
  } catch (error) {
    console.error('[Gemini Vision] Error parsing receipt:', error)
    return { date: null, amount: null, merchant: null, category: null }
  }
}

/**
 * 画像を圧縮してBase64に変換
 */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1920
        const MAX_HEIGHT = 1920
        const QUALITY = 0.8

        let width = img.width
        let height = img.height

        // リサイズ
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = (height * MAX_WIDTH) / width
            width = MAX_WIDTH
          } else {
            width = (width * MAX_HEIGHT) / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // JPEG形式でBase64に変換
        const base64 = canvas.toDataURL('image/jpeg', QUALITY)
        // data:image/jpeg;base64, の部分を除去
        const base64Data = base64.split(',')[1]
        resolve(base64Data)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
