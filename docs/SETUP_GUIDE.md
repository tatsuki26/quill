# セットアップガイド

## 1. Supabaseのセットアップ

### 1.1 プロジェクトの作成

1. [Supabase](https://supabase.com)にアクセス
2. 「Start your project」または「New Project」をクリック
3. GitHubアカウントでログイン（推奨）またはメールアドレスでサインアップ
4. 組織を作成（初回のみ）
   - Organization name: 任意の名前（例: "Personal Projects"）
   - Organization URL: 自動生成される
5. プロジェクト作成画面で以下を入力：
   - **Project Name**: `quill` または任意の名前
   - **Database Password**: 強力なパスワードを設定（必ずメモしておく）
   - **Region**: `Northeast Asia (Tokyo)` を選択（日本に近いため）
   - **Pricing Plan**: `Free` を選択
6. 「Create new project」をクリック
7. プロジェクトの作成が完了するまで待機（約2-3分）

### 1.2 データベーススキーマの実行

1. Supabaseダッシュボードで、左メニューから「SQL Editor」をクリック
2. 「New query」をクリック
3. プロジェクト内の `supabase-schema.sql` ファイルの内容をコピー
4. SQL Editorのエディタに貼り付け
5. 「Run」ボタンをクリック（または `Cmd+Enter` / `Ctrl+Enter`）
6. 成功メッセージが表示されることを確認

### 1.3 APIキーの取得

1. 左メニューから「Project Settings」（歯車アイコン）をクリック
2. 「API」タブを選択
3. 以下の情報をコピー：
   - **Project URL**: `https://xxxxx.supabase.co` 形式
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` 形式の長い文字列
4. これらを `.env` ファイルに設定（後述）

### 1.4 動作確認（オプション）

1. 左メニューから「Table Editor」をクリック
2. 以下のテーブルが作成されていることを確認：
   - `transactions`
   - `category_mappings`
   - `default_hidden_settings`

## 2. Google Gemini APIのセットアップ

### 2.1 Google AI Studioへのアクセス

1. [Google AI Studio](https://makersuite.google.com/app/apikey)にアクセス
2. Googleアカウントでログイン

### 2.2 APIキーの作成

1. 「Get API key」または「Create API key」をクリック
2. 初回の場合：
   - 「Create API key in new project」を選択
   - プロジェクト名を入力（例: "quill-project"）
   - 「Create API key」をクリック
3. 既存プロジェクトがある場合：
   - プロジェクトを選択
   - 「Create API key」をクリック
4. APIキーが表示されるので、**必ずコピーして保存**（後で再表示できない場合があります）
   - 形式: `AIzaSy...` で始まる文字列

### 2.3 APIキーの制限設定（推奨）

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 「APIとサービス」>「認証情報」を選択
3. 作成したAPIキーをクリック
4. 「アプリケーションの制限」で「HTTPリファラー（ウェブサイト）」を選択
5. 「ウェブサイトの制限」に以下を追加（デプロイ後に設定）：
   - `https://your-domain.vercel.app/*`
   - `http://localhost:5173/*`（開発用）
6. 「APIの制限」で「キーを制限」を選択
7. 「Generative Language API」のみを選択
8. 「保存」をクリック

### 2.4 無料枠の確認

- **無料枠**: 月60リクエスト/分、1日1,500リクエストまで
- 使用量は[Google Cloud Console](https://console.cloud.google.com/)の「APIとサービス」>「ダッシュボード」で確認可能

## 3. 環境変数の設定

### 3.1 .envファイルの作成

プロジェクトルート（`/Users/tatsuki/Downloads/paypay`）に `.env` ファイルを作成：

```bash
cd /Users/tatsuki/Downloads/paypay
touch .env
```

### 3.2 環境変数の設定

`.env` ファイルに以下を記述（実際の値に置き換える）：

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=AIzaSy...
VITE_AUTH_PASSWORD=your_secure_password_here
```

**重要**:
- `.env` ファイルは `.gitignore` に含まれているため、Gitにコミットされません
- 本番環境（Vercel）では別途環境変数を設定する必要があります

### 3.3 環境変数の確認

各環境変数が正しく設定されているか確認：

```bash
# .envファイルの内容を確認（パスワードは表示されないように注意）
cat .env
```

## 4. 動作確認

### 4.1 依存関係のインストール

```bash
npm install
```

### 4.2 開発サーバーの起動

```bash
npm run dev
```

### 4.3 ブラウザで確認

1. ブラウザで `http://localhost:5173` にアクセス
2. ログイン画面が表示されることを確認
3. ユーザー名: `admin`、パスワード: `.env`で設定した `VITE_AUTH_PASSWORD` でログイン
4. ログインが成功することを確認

## 5. トラブルシューティング

### Supabase接続エラー

- **エラー**: "Missing Supabase environment variables"
  - **解決策**: `.env` ファイルが正しく設定されているか確認

- **エラー**: "Invalid API key"
  - **解決策**: SupabaseのURLとanon keyが正しいか確認

### Gemini APIエラー

- **エラー**: "Missing Gemini API key"
  - **解決策**: `.env` ファイルに `VITE_GEMINI_API_KEY` が設定されているか確認

- **エラー**: "API quota exceeded"
  - **解決策**: 無料枠の制限に達している可能性。翌日まで待つか、有料プランに移行

### データベースエラー

- **エラー**: "relation does not exist"
  - **解決策**: `supabase-schema.sql` が正しく実行されているか確認

- **エラー**: "permission denied"
  - **解決策**: RLS（Row Level Security）ポリシーが正しく設定されているか確認

## 6. 次のステップ

セットアップが完了したら、以下を実行：

1. CSVファイルのアップロードテスト
2. カテゴリ分類の動作確認
3. フィルター機能のテスト
4. 利用レポートの確認
