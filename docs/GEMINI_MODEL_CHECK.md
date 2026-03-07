# Gemini API 利用可能モデルの確認方法

## 確認方法1: Google AI Studioで確認

1. **Google AI Studioにアクセス**
   - URL: https://aistudio.google.com/
   - Googleアカウントでログイン

2. **モデル一覧を確認**
   - 左側のメニューから「Get API key」をクリック
   - または、直接APIキー管理画面へ: https://aistudio.google.com/app/apikey
   - 利用可能なモデルは、APIドキュメントで確認できます

3. **APIドキュメントを確認**
   - URL: https://ai.google.dev/docs
   - 「Models」セクションで利用可能なモデル名を確認

## 確認方法2: Gemini APIドキュメントで確認

1. **公式ドキュメント**
   - URL: https://ai.google.dev/api/rest
   - 「Models」セクションを確認

2. **利用可能なモデル名（2024年時点の一般的な例）**
   - `gemini-1.5-flash` - 高速で低コスト（推奨）
   - `gemini-1.5-pro` - 高精度
   - `gemini-1.5-flash-latest` - 最新版のFlash
   - `gemini-1.5-pro-latest` - 最新版のPro
   - `gemini-pro` - 旧モデル（非推奨、利用不可の可能性あり）

## 確認方法3: ブラウザの開発者ツールで確認

1. **アプリケーションを開く**
   - ブラウザでアプリを開く
   - 開発者ツール（F12）を開く
   - 「Network」タブを開く

2. **APIリクエストを確認**
   - 「全取引先を再分類」ボタンをクリック
   - Networkタブで `generateContent` へのリクエストを確認
   - エラーレスポンスに利用可能なモデル情報が含まれる場合があります

## 確認方法4: 直接APIをテスト

以下のURLに直接アクセスして、利用可能なモデルを確認できます：

```
https://generativelanguage.googleapis.com/v1/models?key=YOUR_API_KEY
```

**注意**: `YOUR_API_KEY` を実際のAPIキーに置き換えてください。

レスポンス例：
```json
{
  "models": [
    {
      "name": "models/gemini-1.5-flash",
      "displayName": "Gemini 1.5 Flash",
      "description": "...",
      "supportedGenerationMethods": ["generateContent"]
    },
    ...
  ]
}
```

## 推奨される確認手順

1. **まずGoogle AI Studioで確認**
   - https://aistudio.google.com/ にアクセス
   - 左側のメニューから「Get API key」をクリック
   - 利用可能なモデル名を確認

2. **APIドキュメントで確認**
   - https://ai.google.dev/docs を確認
   - 最新の利用可能なモデル名を確認

3. **確認したモデル名をコードに反映**
   - `src/lib/gemini.ts` のモデル名を更新
   - 動作確認

## 現在のコードで使用しているモデル

現在、以下の順序でモデルを試行しています：

1. `gemini-1.5-flash` （最初に試行）
2. `gemini-1.5-pro` （フォールバック）

もし両方とも動作しない場合は、上記の確認方法で正しいモデル名を確認してください。
