# CI/CD セットアップガイド（GitHub Actions + Vercel）

このガイドでは、GitHub Actionsを使用してVercelに自動デプロイする設定を行います。

## 前提条件

- GitHubリポジトリが作成済み（`tatsuki26/quill`）
- Vercelアカウントが作成済み
- SupabaseとGoogle Gemini APIの設定が完了していること

## ステップ1: Vercel CLIでプロジェクトを初期化

### 1.1 Vercel CLIのインストール

```bash
cd /Users/tatsuki/Downloads/paypay
npm install -g vercel
```

### 1.2 Vercelにログイン

```bash
vercel login
```

ブラウザが開くので、GitHubアカウントでログインします。

### 1.3 GitHubアカウントをVercelに接続（重要）

GitHubリポジトリをVercelに接続する前に、VercelのダッシュボードでGitHubアカウントを接続する必要があります。

1. [Vercel Account Settings](https://vercel.com/account)にアクセス
2. 「Connected Accounts」タブを選択
3. 「GitHub」の「Connect」ボタンをクリック
4. GitHubの認証画面で「Authorize Vercel」をクリック
5. 接続が完了したことを確認

**注意**: この手順をスキップすると、`vercel link`でGitHubリポジトリを接続する際にエラーが発生します。

### 1.4 プロジェクトをリンク

```bash
vercel link
```

以下の質問に答えます：
- **Set up and develop "quill"?** → `Y`
- **Which scope?** → 自分のアカウントまたは組織を選択
- **Link to existing project?** → `N`（新規作成）
- **What's your project's name?** → `quill`
- **In which directory is your code located?** → `./`（そのままEnter）
- **Want to modify these settings?** → `no`
- **Do you want to change additional project settings?** → `no`
- **Detected a repository. Connect it to this project?** → `yes`（GitHubアカウントが接続されていれば成功）

これで `.vercel` ディレクトリが作成され、以下の情報が保存されます：
- `projectId`: プロジェクトID
- `orgId`: 組織ID

**エラーが出た場合**: 上記の「1.3 GitHubアカウントをVercelに接続」の手順を実行してください。

### 1.4 情報の確認

```bash
cat .vercel/project.json
```

以下のような内容が表示されます：
```json
{
  "projectId": "prj_xxxxx",
  "orgId": "team_xxxxx"
}
```

これらの値をメモしておきます。

## ステップ2: Vercel Tokenの取得

1. [Vercel Account Settings](https://vercel.com/account)にアクセス
2. 「Tokens」タブを選択
3. 「Create Token」をクリック
4. 以下の情報を入力：
   - **Token Name**: `quill-deploy-token`
   - **Scope**: `Full Account`
5. 「Create」をクリック
6. **トークンをコピーして保存**（再表示できないため重要）

## ステップ3: GitHub Secretsの設定

### 3.1 Secretsにアクセス

1. GitHubリポジトリ `tatsuki26/quill` を開く
2. 「Settings」タブをクリック
3. 左メニューから「Secrets and variables」>「Actions」を選択

### 3.2 必要なSecretsを追加

以下の7つのSecretsを「New repository secret」から追加します：

| Secret名 | 値 | 取得方法 |
|---------|-----|---------|
| `VITE_SUPABASE_URL` | `https://tqfegzccluauhllyqjgz.supabase.co` | Supabase設定から |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase設定から |
| `VITE_GEMINI_API_KEY` | `AIzaSy...` | Google AI Studioから |
| `VITE_AUTH_PASSWORD` | 任意のパスワード | 自分で設定 |
| `VERCEL_TOKEN` | `vercel_xxxxx` | Vercel Account Settings > Tokens |
| `VERCEL_ORG_ID` | `team_xxxxx` または `user_xxxxx` | `.vercel/project.json` から |
| `VERCEL_PROJECT_ID` | `prj_xxxxx` | `.vercel/project.json` から |

**重要**: 全てのSecretsが追加されていることを確認してください。

## ステップ4: Vercelの環境変数設定

### 4.1 Vercelダッシュボードで環境変数を設定

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. `quill` プロジェクトを開く
3. 「Settings」>「Environment Variables」を選択
4. 以下の環境変数を追加（**全ての環境に設定**）：

| 変数名 | 値 | 環境 |
|--------|-----|------|
| `VITE_SUPABASE_URL` | `https://tqfegzccluauhllyqjgz.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `VITE_GEMINI_API_KEY` | `AIzaSy...` | Production, Preview, Development |
| `VITE_AUTH_PASSWORD` | 任意のパスワード | Production, Preview, Development |

**重要**: 
- 「Environment」で「Production」「Preview」「Development」の全てにチェックを入れてください
- 各環境変数を追加したら「Save」をクリック

## ステップ5: 初回デプロイの実行

### 5.1 コードをGitHubにプッシュ

```bash
cd /Users/tatsuki/Downloads/paypay

# 変更をコミット
git add .
git commit -m "Setup CI/CD with GitHub Actions"

# GitHubにプッシュ
git push origin main
```

### 5.2 GitHub Actionsの確認

1. GitHubリポジトリの「Actions」タブを開く
2. 「Deploy to Vercel」ワークフローが実行されていることを確認
3. ワークフローのログを確認して、エラーがないか確認

### 5.3 デプロイの確認

1. Vercelダッシュボードで「Deployments」タブを確認
2. デプロイメントが成功していることを確認
3. デプロイされたURL（例: `https://quill-xxxxx.vercel.app`）にアクセス
4. アプリケーションが正常に動作することを確認

## ステップ6: 動作確認

### 6.1 ログインの確認

1. デプロイされたURLにアクセス
2. ログイン画面が表示されることを確認
3. ユーザー名: `admin`、パスワード: `VITE_AUTH_PASSWORD`で設定した値でログイン
4. ログインが成功することを確認

### 6.2 機能の確認

- CSVアップロード機能
- データ表示
- フィルター機能
- 利用レポート

## トラブルシューティング

### GitHub Actionsが失敗する

**エラー**: "Missing required secret"
- **解決策**: GitHub Secretsに全ての必要なSecretsが設定されているか確認

**エラー**: "Vercel deployment failed"
- **解決策**: 
  - Vercel Tokenが正しいか確認
  - Vercel Org IDとProject IDが正しいか確認
  - Vercelダッシュボードでプロジェクトが作成されているか確認

### ビルドエラー

**エラー**: "Environment variable not found"
- **解決策**: 
  - GitHub Secretsに環境変数が設定されているか確認
  - Vercelの環境変数も設定されているか確認

**エラー**: "Build failed"
- **解決策**: 
  - ローカルで `npm run build` が成功するか確認
  - エラーログを確認して原因を特定

### デプロイ後の動作確認

**ログインできない**:
- Vercelの環境変数 `VITE_AUTH_PASSWORD` が正しく設定されているか確認
- ブラウザのコンソールでエラーを確認

**API接続エラー**:
- SupabaseとGemini APIの環境変数が正しく設定されているか確認
- ブラウザのコンソールでエラーメッセージを確認

## 今後のデプロイ

- **mainブランチへのpush**: 自動的に本番環境にデプロイ
- **Pull Request**: 自動的にプレビュー環境にデプロイ
- **手動デプロイ**: GitHub Actionsの「Run workflow」ボタンからも実行可能

## 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Action](https://github.com/amondnet/vercel-action)
