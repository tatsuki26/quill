/**
 * Gemini APIで利用可能なモデルを確認するスクリプト
 * 
 * 使用方法:
 * 1. .envファイルにVITE_GEMINI_API_KEYを設定
 * 2. node scripts/check-gemini-models.js
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// .envファイルを読み込む
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })

const apiKey = process.env.VITE_GEMINI_API_KEY

if (!apiKey) {
  console.error('❌ VITE_GEMINI_API_KEYが設定されていません')
  console.error('   .envファイルに以下を追加してください:')
  console.error('   VITE_GEMINI_API_KEY=your_api_key_here')
  process.exit(1)
}

const genAI = new GoogleGenerativeAI(apiKey)

async function listAvailableModels() {
  console.log('🔍 利用可能なGeminiモデルを確認中...\n')
  
  try {
    // ListModels APIを使用（もし利用可能なら）
    // ただし、@google/generative-aiパッケージには直接的なListModelsメソッドがないため、
    // 代わりに各モデル名を試して動作するものを確認します
    
    const possibleModels = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest',
      'gemini-pro',
      'gemini-1.0-pro',
      'gemini-1.0-pro-latest',
    ]
    
    console.log('📋 テストするモデル一覧:')
    possibleModels.forEach(model => console.log(`   - ${model}`))
    console.log('\n')
    
    const workingModels = []
    const failedModels = []
    
    for (const modelName of possibleModels) {
      try {
        console.log(`🧪 テスト中: ${modelName}...`)
        const model = genAI.getGenerativeModel({ model: modelName })
        
        // 簡単なテストリクエストを送信
        const result = await model.generateContent('Hello')
        const response = await result.response
        const text = response.text()
        
        console.log(`   ✅ ${modelName} - 動作確認済み`)
        workingModels.push({
          name: modelName,
          status: 'OK',
          response: text.substring(0, 50) + '...'
        })
      } catch (error) {
        const errorMessage = error.message || error.toString()
        console.log(`   ❌ ${modelName} - エラー: ${errorMessage.substring(0, 100)}`)
        failedModels.push({
          name: modelName,
          error: errorMessage
        })
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 結果サマリー')
    console.log('='.repeat(60))
    
    if (workingModels.length > 0) {
      console.log('\n✅ 動作するモデル:')
      workingModels.forEach(model => {
        console.log(`   - ${model.name}`)
      })
      console.log('\n💡 推奨: 最初の動作するモデルを使用してください')
      console.log(`   推奨モデル: ${workingModels[0].name}`)
    } else {
      console.log('\n❌ 動作するモデルが見つかりませんでした')
      console.log('   以下を確認してください:')
      console.log('   1. APIキーが正しく設定されているか')
      console.log('   2. APIキーに適切な権限があるか')
      console.log('   3. インターネット接続が正常か')
    }
    
    if (failedModels.length > 0) {
      console.log('\n❌ 動作しないモデル:')
      failedModels.forEach(model => {
        console.log(`   - ${model.name}`)
      })
    }
    
  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error)
    console.error('\n📚 参考情報:')
    console.error('   - Google AI Studio: https://aistudio.google.com/app/apikey')
    console.error('   - Gemini API ドキュメント: https://ai.google.dev/docs')
  }
}

// 実行
listAvailableModels().catch(console.error)
