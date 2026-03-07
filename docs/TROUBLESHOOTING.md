# トラブルシューティングガイド

## エラーの確認方法

### 1. ブラウザの開発者ツールでエラーを確認

#### 手順
1. アプリケーションを開く
2. キーボードで `F12` を押す（または右クリック > 「検証」）
3. 「Console」タブを選択
4. エラーメッセージを確認

#### 確認すべきエラー
- 赤色のエラーメッセージ
- ネットワークエラー（Network タブも確認）
- JavaScriptの実行エラー

#### エラーのスクリーンショットを取得
- エラーメッセージ全体をコピー
- または、スクリーンショットを撮影

### 2. Vercelのログを確認

#### リアルタイムログ
1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. `quill` プロジェクトを開く
3. 「Deployments」タブで最新のデプロイメントをクリック
4. 「Logs」タブを選択
5. リアルタイムログを確認

#### 関数ログ（Serverless Functionsを使用している場合）
1. Vercelダッシュボードでプロジェクトを開く
2. 「Functions」タブを選択
3. 実行された関数のログを確認

### 3. Supabaseのログを確認

#### データベースログ
1. [Supabase Dashboard](https://supabase.com/dashboard)にアクセス
2. プロジェクトを開く
3. 「Logs」>「Postgres Logs」を選択
4. データベースクエリのエラーを確認

#### APIログ
1. Supabaseダッシュボードでプロジェクトを開く
2. 「Logs」>「API Logs」を選択
3. APIリクエストのエラーを確認

### 4. ネットワークタブでリクエストを確認

#### 手順
1. ブラウザの開発者ツールを開く（F12）
2. 「Network」タブを選択
3. CSVアップロードを実行
4. 失敗したリクエスト（赤色）をクリック
5. 「Response」タブでエラーメッセージを確認

#### 確認すべき情報
- リクエストURL
- ステータスコード（400, 500など）
- レスポンスボディのエラーメッセージ
- リクエストヘッダー

### 5. アプリケーション内のエラーメッセージ

CSVアップロード時に表示されるエラーメッセージを確認：
- アラートダイアログに表示されるメッセージ
- 画面上に表示されるエラーメッセージ

## よくあるエラーと解決方法

### CSVアップロード時のエラー

#### エラー: "Missing Supabase environment variables"
**原因**: 環境変数が設定されていない  
**解決方法**:
1. Vercelダッシュボードで環境変数を確認
2. `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` が設定されているか確認

#### エラー: "Missing Gemini API key"
**原因**: Gemini APIキーが設定されていない  
**解決方法**:
1. Vercelダッシュボードで環境変数を確認
2. `VITE_GEMINI_API_KEY` が設定されているか確認
3. 設定されていない場合、Google AI StudioでAPIキーを取得して設定

#### エラー: "Failed to insert transactions"
**原因**: データベースへの挿入に失敗  
**解決方法**:
1. Supabaseのログで詳細なエラーを確認
2. データベースのスキーマが正しく作成されているか確認
3. RLS（Row Level Security）ポリシーが正しく設定されているか確認

#### エラー: "API quota exceeded"
**原因**: Google Gemini APIの無料枠を超えた  
**解決方法**:
1. Google Cloud Consoleで使用量を確認
2. 翌日まで待つか、有料プランに移行

#### エラー: "Invalid CSV format"
**原因**: CSVファイルの形式が正しくない  
**解決方法**:
1. CSVファイルが正しい形式か確認
2. 文字エンコーディングがUTF-8か確認
3. ヘッダー行が正しいか確認

### データベースエラー

#### エラー: "relation does not exist"
**原因**: テーブルが作成されていない  
**解決方法**:
1. SupabaseのSQL Editorで `supabase-schema.sql` を実行
2. Table Editorでテーブルが作成されているか確認

#### エラー: "permission denied"
**原因**: RLSポリシーが正しく設定されていない  
**解決方法**:
1. SupabaseのSQL EditorでRLSポリシーを確認
2. `supabase-schema.sql` のRLSポリシー部分を再実行

## デバッグのヒント

### 1. コンソールログを追加

開発中は、ブラウザのコンソールに詳細なログを出力：
```javascript
console.log('CSV upload started', data)
console.error('Error occurred', error)
```

### 2. エラーの詳細情報を取得

エラーオブジェクトの詳細を確認：
```javascript
console.error('Error details:', {
  message: error.message,
  stack: error.stack,
  response: error.response
})
```

### 3. ネットワークリクエストを確認

Supabaseへのリクエストが正しく送信されているか確認：
- リクエストURL
- リクエストボディ
- レスポンスステータス

## エラー報告時の情報

問題を報告する際は、以下の情報を含めてください：

1. **エラーメッセージ**: 表示されたエラーメッセージ全文
2. **ブラウザのコンソールログ**: 開発者ツールのConsoleタブの内容
3. **ネットワークリクエスト**: 失敗したリクエストの詳細（Networkタブ）
4. **実行した操作**: どの操作でエラーが発生したか
5. **ブラウザ情報**: 使用しているブラウザとバージョン
6. **環境**: 本番環境か開発環境か

## 緊急時の対処法

### アプリが全く動作しない場合

1. Vercelダッシュボードで最新のデプロイメントを確認
2. ビルドログでエラーがないか確認
3. 環境変数が全て設定されているか確認
4. 必要に応じて、前のバージョンにロールバック

### データベースにアクセスできない場合

1. Supabaseダッシュボードでプロジェクトの状態を確認
2. データベースが一時停止していないか確認
3. APIキーが正しいか確認
