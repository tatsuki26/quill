import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY

if (!apiKey) {
  throw new Error('Missing Gemini API key')
}

const genAI = new GoogleGenerativeAI(apiKey)

export async function categorizeMerchant(merchantName: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const prompt = `以下の店舗名を、以下のカテゴリのいずれかに分類してください。最も適切なカテゴリ名のみを返答してください。

カテゴリ一覧：
- 外食
- コンビニ
- スーパー
- ショッピング
- ガソリン
- 医療
- 交通
- 娯楽
- 投資
- 公共料金
- その他

店舗名: ${merchantName}

カテゴリ:`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const category = response.text().trim()
    
    // カテゴリ名を正規化
    const validCategories = [
      '外食', 'コンビニ', 'スーパー', 'ショッピング', 'ガソリン',
      '医療', '交通', '娯楽', '投資', '公共料金', 'その他'
    ]
    
    if (validCategories.includes(category)) {
      return category
    }
    
    return 'その他'
  } catch (error) {
    console.error('Error categorizing merchant:', error)
    return 'その他'
  }
}

export async function categorizeMerchantsBatch(merchantNames: string[]): Promise<Record<string, string>> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const prompt = `以下の店舗名のリストを、それぞれ適切なカテゴリに分類してください。
各店舗名に対して、最も適切なカテゴリ名を返答してください。

カテゴリ一覧：
- 外食
- コンビニ
- スーパー
- ショッピング
- ガソリン
- 医療
- 交通
- 娯楽
- 投資
- 公共料金
- その他

店舗名リスト：
${merchantNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

以下の形式で返答してください（JSON形式）：
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
        const category = categories[key] || 'その他'
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
