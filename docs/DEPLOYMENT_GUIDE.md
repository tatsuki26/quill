# デプロイガイド（GitHub Actions + Vercel）

## 1. Vercelのセットアップ

### 1.1 Vercelアカウントの作成

1. [Vercel](https://vercel.com)にアクセス
2. 「Sign Up」をクリック
3. GitHubアカウントでログイン（推奨）

### 1.2 Vercelプロジェクトの作成

#### 方法A: Vercel CLIを使用（初回のみ）

1. Vercel CLIをインストール：
   ```bash
   npm install -g vercel
   ```

2. プロジェクトディレクトリでログイン：
   ```bash
   cd /Users/tatsuki/Downloads/paypay
   vercel login
   ```

3. プロジェクトをリンク：
   ```bash
   vercel link
   ```
   - プロジェクト名: `quill`
   - 既存のプロジェクトを使用するか: `N`（新規作成）
   - デプロイ先: `Production`

4. 必要な情報を取得：
   - `vercel.json` が作成される
   - `.vercel/project.json` に以下が記録される：
     - `orgId`: 組織ID
     - `projectId`: プロジェクトID

#### 方法B: Vercelダッシュボードから（推奨）

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. 「Add New...」>「Project」をクリック
3. GitHubリポジトリをインポート：
   - 「Import Git Repository」から `tatsuki26/quill` を選択
   - または、GitHubリポジトリを接続
4. プロジェクト設定：
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`（デフォルト）
   - **Build Command**: `npm run build`（自動検出される）
   - **Output Directory**: `dist`（自動検出される）
5. 「Deploy」をクリック（初回は失敗する可能性がありますが、環境変数を設定すれば動作します）

### 1.3 Vercelの認証情報を取得

1. [Vercel Account Settings](https://vercel.com/account)にアクセス
2. 「Tokens」タブを選択
3. 「Create Token」をクリック
4. Token名: `quill-deploy-token`
5. Scope: `Full Account` を選択
6. 「Create」をクリック
7. **トークンをコピーして保存**（再表示できないため）

### 1.4 プロジェクトIDと組織IDの取得

1. Vercelダッシュボードでプロジェクトを開く
2. 「Settings」>「General」を選択
3. 以下の情報をコピー：
   - **Project ID**: `prj_xxxxx` 形式
   - **Organization ID**: `team_xxxxx` または `user_xxxxx` 形式

## 2. GitHub Secretsの設定

### 2.1 GitHubリポジトリのSecretsにアクセス

1. GitHubリポジトリ `tatsuki26/quill` を開く
2. 「Settings」タブをクリック
3. 左メニューから「Secrets and variables」>「Actions」を選択

### 2.2 Secretsの追加

以下のSecretsを追加（「New repository secret」をクリック）：

| Secret名 | 値 | 説明 |
|---------|-----|------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | SupabaseのプロジェクトURL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabaseのanon key |
| `VITE_GEMINI_API_KEY` | `AIzaSy...` | Google Gemini APIキー |
| `VITE_AUTH_PASSWORD` | `your_secure_password` | 認証パスワード |
| `VERCEL_TOKEN` | `vercel_xxxxx` | Vercelのトークン |
| `VERCEL_ORG_ID` | `team_xxxxx` または `user_xxxxx` | Vercelの組織ID |
| `VERCEL_PROJECT_ID` | `prj_xxxxx` | VercelのプロジェクトID |

### 2.3 Secretsの確認

全てのSecretsが追加されていることを確認：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`
- `VITE_AUTH_PASSWORD`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 3. Vercelの環境変数設定

### 3.1 Vercelダッシュボードで環境変数を設定

1. Vercelダッシュボードでプロジェクトを開く
2. 「Settings」>「Environment Variables」を選択
3. 以下の環境変数を追加：

| 変数名 | 値 | 環境 |
|--------|-----|------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `VITE_GEMINI_API_KEY` | `AIzaSy...` | Production, Preview, Development |
| `VITE_AUTH_PASSWORD` | `your_secure_password` | Production, Preview, Development |

**重要**: 全ての環境（Production, Preview, Development）に設定してください。

## 4. GitHub Actionsの動作確認

### 4.1 初回デプロイ

1. コードをGitHubにプッシュ：
   ```bash
   git add .
   git commit -m "Setup GitHub Actions deployment"
   git push origin main
   ```

2. GitHubリポジトリの「Actions」タブを確認
3. 「Deploy to Vercel」ワークフローが実行されることを確認
4. ワークフローが成功することを確認

### 4.2 デプロイの確認

1. Vercelダッシュボードでデプロイメントを確認
2. デプロイされたURL（例: `https://quill-xxxxx.vercel.app`）にアクセス
3. アプリケーションが正常に動作することを確認

## 5. カスタムドメインの設定（オプション）

1. Vercelダッシュボードでプロジェクトを開く
2. 「Settings」>「Domains」を選択
3. ドメイン名を入力（例: `quill.yourdomain.com`）
4. DNS設定に従ってドメインを設定
5. SSL証明書が自動的に発行される（数分かかる場合があります）

## 6. トラブルシューティング

### GitHub Actionsが失敗する

- **エラー**: "Missing required secret"
  - **解決策**: GitHub Secretsに全ての必要なSecretsが設定されているか確認

- **エラー**: "Vercel deployment failed"
  - **解決策**: Vercelの環境変数が正しく設定されているか確認

### ビルドエラー

- **エラー**: "Environment variable not found"
  - **解決策**: Vercelの環境変数が設定されているか確認

- **エラー**: "Build failed"
  - **解決策**: ローカルで `npm run build` が成功するか確認

### デプロイ後の動作確認

- ログインできない場合：
  - Vercelの環境変数 `VITE_AUTH_PASSWORD` が正しく設定されているか確認
  - ブラウザのコンソールでエラーを確認

- API接続エラー：
  - SupabaseとGemini APIの環境変数が正しく設定されているか確認
  - CORS設定を確認（Supabaseの場合は通常問題なし）

## 7. 自動デプロイの動作

- **mainブランチへのpush**: 自動的に本番環境にデプロイ
- **Pull Request**: プレビュー環境にデプロイ（Vercelが自動生成）
- **手動デプロイ**: Vercelダッシュボードからも可能

## 8. 次のステップ

1. デプロイが成功したら、実際のCSVファイルをアップロードしてテスト
2. パフォーマンスを確認
3. エラーログを監視（Vercelダッシュボード > Logs）
