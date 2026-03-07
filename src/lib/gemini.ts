import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY

if (!apiKey) {
  throw new Error('Missing Gemini API key')
}

const genAI = new GoogleGenerativeAI(apiKey)

// カテゴリ定義
export const CATEGORIES = [
  '外食',
  'コンビニ',
  'スーパー',
  'ドラッグストア',
  'ショッピング',
  'ガソリン',
  '医療',
  '交通',
  '娯楽',
  '投資',
  '公共料金',
  '食費',
  'その他',
] as const

export type Category = typeof CATEGORIES[number]

const CATEGORY_DESCRIPTIONS = {
  外食: 'レストラン、ファストフード、居酒屋、カフェなど、外で食事をする店舗（例: マクドナルド、はま寿司、すき家、スターバックス）',
  コンビニ: 'コンビニエンスストア（例: セブン-イレブン、ローソン、ファミリーマート、ミニストップ）',
  スーパー: 'スーパーマーケット、食品スーパー（例: イオン、マルエツ、ライフ）',
  ドラッグストア: '薬局、ドラッグストア（例: ウエルシア、マツキヨ、スギ薬局、サンドラッグ）',
  ショッピング: '百貨店、専門店、ネットショップ、日用品店（例: アマゾン、ニトリ、アカチャンホンポ、セリア、バースデイ）',
  ガソリン: 'ガソリンスタンド、給油所（例: エネオス、出光、コスモ石油）',
  医療: '病院、クリニック、歯科医院（例: アクアベルクリニック、○○病院）',
  交通: '電車、バス、タクシー、高速道路、駐車場などの交通費',
  娯楽: '映画館、遊園地、ゲームセンター、スポーツ施設、レジャー施設（例: ディズニー、東京ディズニーリゾート）',
  投資: '投資、資産運用、ポイント運用（例: PayPay資産運用、PayPayポイント運用）',
  公共料金: '電気、ガス、水道、プロパンガス、インターネット、携帯電話などの公共料金（例: ＪＡクミアイプロパン、秦野市　上下水道料金）',
  食費: '自宅で食べるための食材、飲み物を購入する店舗（例: スーパーでの食材購入、自販機での飲み物購入）',
  その他: '上記のいずれにも該当しないもの',
}

export async function categorizeMerchant(merchantName: string): Promise<string> {
  // モデル名を確認（gemini-proが確実に動作する）
  let model
  try {
    model = genAI.getGenerativeModel({ model: 'gemini-pro' })
  } catch (e) {
    console.warn('Failed to use gemini-pro, trying gemini-1.5-flash:', e)
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    } catch (e2) {
      console.error('Failed to initialize Gemini model:', e2)
      return 'その他'
    }
  }

  const categoryList = CATEGORIES.map((cat) => `- ${cat}`).join('\n')
  const categoryExamples = CATEGORIES.map((cat) => `"${cat}"`).join(', ')

  const prompt = `店舗名をカテゴリに分類してください。

利用可能なカテゴリ（必ずこの中から選択）：
${categoryList}

店舗名: ${merchantName}

指示：
1. 上記のカテゴリのいずれかに分類してください
2. カテゴリ名のみを返答してください（${categoryExamples}のいずれか）
3. 説明や余分な文字は一切不要です

例：
マクドナルド → 外食
セブン-イレブン → コンビニ
Amazon.co.jp → ショッピング
ウエルシア → ドラッグストア

カテゴリ:`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    let category = response.text().trim()
    
    console.log(`[Gemini Individual] Response for "${merchantName}": "${category}"`)
    
    // 余分な文字を除去
    category = category.replace(/^カテゴリ[:：]\s*/i, '')
      .replace(/^「|」$/g, '')
      .replace(/^"|"$/g, '')
      .trim()
    
    // 完全一致で確認
    if (CATEGORIES.includes(category as Category)) {
      console.log(`[Gemini Individual] Exact match for "${merchantName}": "${category}"`)
      return category
    }
    
    // 部分一致で確認（大文字小文字を無視）
    const matchedCategory = CATEGORIES.find(cat => {
      const catLower = cat.toLowerCase()
      const categoryLower = category.toLowerCase()
      return categoryLower === catLower || 
             categoryLower.includes(catLower) || 
             catLower.includes(categoryLower)
    })
    
    if (matchedCategory) {
      console.log(`[Gemini Individual] Matched "${merchantName}": "${category}" -> "${matchedCategory}"`)
      return matchedCategory
    }
    
    console.warn(`[Gemini Individual] Unknown category for "${merchantName}": "${category}", defaulting to "その他"`)
    return 'その他'
  } catch (error) {
    console.error(`[Gemini Individual] Error categorizing "${merchantName}":`, error)
    return 'その他'
  }
}

export async function categorizeMerchantsBatch(merchantNames: string[]): Promise<Record<string, string>> {
  // バッチサイズを制限（APIの制限を考慮）
  const BATCH_SIZE = 20
  const categoryMap: Record<string, string> = {}
  
  // 小さいバッチに分割して処理
  for (let i = 0; i < merchantNames.length; i += BATCH_SIZE) {
    const batch = merchantNames.slice(i, i + BATCH_SIZE)
    const batchResult = await categorizeMerchantsBatchInternal(batch)
    Object.assign(categoryMap, batchResult)
    
    // レート制限を考慮して待機
    if (i + BATCH_SIZE < merchantNames.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  return categoryMap
}

async function categorizeMerchantsBatchInternal(merchantNames: string[]): Promise<Record<string, string>> {
  // モデル名を確認（gemini-proが確実に動作する）
  let model
  try {
    model = genAI.getGenerativeModel({ model: 'gemini-pro' })
  } catch (e) {
    console.warn('Failed to use gemini-pro, trying gemini-1.5-flash:', e)
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    } catch (e2) {
      console.error('Failed to initialize Gemini model:', e2)
      // フォールバック: 個別分類
      return await fallbackToIndividualCategorization(merchantNames)
    }
  }

  const categoryList = CATEGORIES.map((cat) => `- ${cat}`).join('\n')
  const categoryExamples = CATEGORIES.map((cat) => `"${cat}"`).join(', ')

  const prompt = `あなたは店舗名をカテゴリに分類する専門家です。

利用可能なカテゴリ（必ずこの中から選択）：
${categoryList}

店舗名リスト：
${merchantNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

指示：
1. 各店舗名を上記のカテゴリのいずれかに分類してください
2. カテゴリ名は完全一致で返答してください（${categoryExamples}のいずれか）
3. 説明や余分な文字は一切不要です
4. 必ずJSON形式で返答してください

返答形式（JSONのみ）：
{
  "1": "カテゴリ名",
  "2": "カテゴリ名",
  ...
}

例：
店舗名: マクドナルド → {"1": "外食"}
店舗名: セブン-イレブン → {"1": "コンビニ"}
店舗名: Amazon.co.jp → {"1": "ショッピング"}`

  try {
    const generateResult = await model.generateContent(prompt)
    const response = await generateResult.response
    const text = response.text().trim()
    
    console.log(`[Gemini Batch] Response for ${merchantNames.length} merchants:`, text.substring(0, 500))
    
    // JSONを抽出（マークダウンコードブロックも考慮）
    let jsonText = text
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1]
      console.log('[Gemini Batch] Extracted from code block')
    } else {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonText = jsonMatch[0]
        console.log('[Gemini Batch] Extracted JSON from text')
      } else {
        console.warn('[Gemini Batch] No JSON found in response, falling back to individual categorization')
        return await fallbackToIndividualCategorization(merchantNames)
      }
    }
    
    try {
      const categories = JSON.parse(jsonText) as Record<string, string>
      const categoryMap: Record<string, string> = {}
      let successCount = 0
      let fallbackCount = 0
      
      merchantNames.forEach((name, index) => {
        const key = String(index + 1)
        let category = categories[key] || categories[name] || null
        
        if (!category) {
          console.warn(`[Gemini Batch] No category found for "${name}" (key: ${key})`)
          categoryMap[name] = 'その他'
          fallbackCount++
          return
        }
        
        // カテゴリ名を正規化
        category = category.replace(/^「|」$/g, '')
          .replace(/^カテゴリ[:：]\s*/i, '')
          .replace(/^"|"$/g, '')
          .trim()
        
        // 完全一致で確認
        if (CATEGORIES.includes(category as Category)) {
          categoryMap[name] = category
          successCount++
          return
        }
        
        // 部分一致で確認（大文字小文字を無視）
        const matchedCategory = CATEGORIES.find(cat => {
          const catLower = cat.toLowerCase()
          const categoryLower = category.toLowerCase()
          return categoryLower === catLower || 
                 categoryLower.includes(catLower) || 
                 catLower.includes(categoryLower)
        })
        
        if (matchedCategory) {
          categoryMap[name] = matchedCategory
          console.log(`[Gemini Batch] Matched "${name}": "${category}" -> "${matchedCategory}"`)
          successCount++
        } else {
          console.warn(`[Gemini Batch] Unknown category for "${name}": "${category}", defaulting to "その他"`)
          categoryMap[name] = 'その他'
          fallbackCount++
        }
      })
      
      console.log(`[Gemini Batch] Result: ${successCount} success, ${fallbackCount} fallback to "その他"`)
      console.log('[Gemini Batch] Category mapping:', categoryMap)
      
      // 成功率が低い場合は個別分類にフォールバック
      if (fallbackCount > merchantNames.length * 0.5) {
        console.warn(`[Gemini Batch] Too many fallbacks (${fallbackCount}/${merchantNames.length}), retrying individually`)
        return await fallbackToIndividualCategorization(merchantNames)
      }
      
      return categoryMap
    } catch (parseError) {
      console.error('[Gemini Batch] JSON parse error:', parseError)
      console.error('[Gemini Batch] JSON text:', jsonText)
      return await fallbackToIndividualCategorization(merchantNames)
    }
  } catch (error) {
    console.error('[Gemini Batch] Error:', error)
    return await fallbackToIndividualCategorization(merchantNames)
  }
}

async function fallbackToIndividualCategorization(merchantNames: string[]): Promise<Record<string, string>> {
  console.log(`[Fallback] Categorizing ${merchantNames.length} merchants individually`)
  const categoryMap: Record<string, string> = {}
  for (const name of merchantNames) {
    try {
      categoryMap[name] = await categorizeMerchant(name)
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (individualError) {
      console.error(`[Fallback] Error categorizing "${name}":`, individualError)
      categoryMap[name] = 'その他'
    }
  }
  return categoryMap
}
