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
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const categoryList = CATEGORIES.map((cat, i) => `${i + 1}. ${cat}: ${CATEGORY_DESCRIPTIONS[cat]}`).join('\n')

  const prompt = `以下の店舗名を、以下のカテゴリのいずれかに分類してください。最も適切なカテゴリ名のみを返答してください。

カテゴリ一覧：
${categoryList}

店舗名: ${merchantName}

重要：
- カテゴリ名は必ず上記のリストから選択してください
- カテゴリ名のみを返答してください（説明は不要）
- 例: マクドナルド → 外食
- 例: セブン-イレブン → コンビニ
- 例: アマゾン → ショッピング
- 例: ウエルシア → ドラッグストア

カテゴリ:`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    let category = response.text().trim()
    
    // 余分な文字を除去
    category = category.replace(/^カテゴリ[:：]\s*/i, '').replace(/^「|」$/g, '').trim()
    
    // カテゴリ名を正規化
    if (CATEGORIES.includes(category as Category)) {
      return category
    }
    
    // 部分一致で確認
    const matchedCategory = CATEGORIES.find(cat => category.includes(cat))
    if (matchedCategory) {
      return matchedCategory
    }
    
    console.warn(`Unknown category for "${merchantName}": "${category}", defaulting to "その他"`)
    return 'その他'
  } catch (error) {
    console.error('Error categorizing merchant:', error)
    return 'その他'
  }
}

export async function categorizeMerchantsBatch(merchantNames: string[]): Promise<Record<string, string>> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const categoryList = CATEGORIES.map((cat, i) => `${i + 1}. ${cat}: ${CATEGORY_DESCRIPTIONS[cat]}`).join('\n')

  const prompt = `以下の店舗名のリストを、それぞれ適切なカテゴリに分類してください。
各店舗名に対して、最も適切なカテゴリ名を返答してください。

カテゴリ一覧：
${categoryList}

店舗名リスト：
${merchantNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

重要：
- カテゴリ名は必ず上記のリストから選択してください
- カテゴリ名のみを返答してください（説明は不要）

以下の形式で返答してください（JSON形式のみ）：
{
  "1": "カテゴリ名",
  "2": "カテゴリ名",
  ...
}`

  try {
    const generateResult = await model.generateContent(prompt)
    const response = await generateResult.response
    const text = response.text().trim()
    
    // JSONを抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const categories = JSON.parse(jsonMatch[0]) as Record<string, string>
      const categoryMap: Record<string, string> = {}
      
      merchantNames.forEach((name, index) => {
        const key = String(index + 1)
        let category = categories[key] || 'その他'
        
        // カテゴリ名を正規化
        category = category.replace(/^「|」$/g, '').trim()
        
        if (!CATEGORIES.includes(category as Category)) {
          // 部分一致で確認
          const matchedCategory = CATEGORIES.find(cat => category.includes(cat))
          category = matchedCategory || 'その他'
        }
        
        categoryMap[name] = category
      })
      
      return categoryMap
    }
    
    // JSON形式でない場合は個別に分類
    const categoryMap: Record<string, string> = {}
    for (const name of merchantNames) {
      categoryMap[name] = await categorizeMerchant(name)
      // レート制限を考慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return categoryMap
  } catch (error) {
    console.error('Error categorizing merchants batch:', error)
    // エラー時は個別分類にフォールバック
    const categoryMap: Record<string, string> = {}
    for (const name of merchantNames) {
      categoryMap[name] = await categorizeMerchant(name)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return categoryMap
  }
}
