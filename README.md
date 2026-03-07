# Quill

クレジットカードの利用履歴を閲覧・管理するためのWebアプリケーションです。

## 機能

- 📊 取引データの閲覧（PayPayアプリ風のデザイン）
- 🔍 検索・フィルター機能
- 📁 CSVファイルのアップロード
- 🤖 AI（Google Gemini）による自動カテゴリ分類
- 📈 利用レポート（集計・グラフ表示）
- 👥 ロール管理（管理者/閲覧者）
- 🚫 非表示設定（個別・デフォルト）

## 概要

Quill（羽ペン）は、決済履歴を記録し、分析するためのアプリケーションです。PayPayなどの決済サービスからエクスポートしたCSVデータをアップロードし、AIによる自動カテゴリ分類や詳細な分析機能を提供します。

## セットアップ

詳細なセットアップ手順は [SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) を参照してください。

### クイックスタート

1. 依存関係のインストール
   ```bash
   npm install
   ```

2. SupabaseとGoogle Gemini APIのセットアップ
   - [SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) の手順に従って設定

3. 環境変数の設定
   - `.env` ファイルを作成（`.env.example`を参考）

4. 開発サーバーの起動
   ```bash
   npm run dev
   ```

## デプロイ

GitHub Actionsを使用した自動デプロイの詳細は [CI_CD_SETUP.md](./docs/CI_CD_SETUP.md) を参照してください。

### デプロイの概要

- **CI/CD**: GitHub Actions
- **ホスティング**: Vercel
- **自動デプロイ**: `main`ブランチへのpushで自動デプロイ

### クイックセットアップ

1. Vercel CLIでプロジェクトを初期化
2. GitHub Secretsに必要な情報を設定
3. Vercelの環境変数を設定
4. `main`ブランチにpushして自動デプロイ

## 使用方法

### ログイン

- ユーザー名: `admin` (管理者) または `viewer` (閲覧者)
- パスワード: `.env` で設定した `VITE_AUTH_PASSWORD`

### CSVアップロード

1. 管理者でログイン
2. 右上のアップロードアイコンをクリック
3. 決済サービス（PayPayなど）からエクスポートしたCSVファイルを選択
4. 自動的にカテゴリ分類とデータ保存が行われます

### 非表示設定

- **個別設定**: 各取引の「非表示」ボタンで設定（管理者のみ）
- **デフォルト設定**: 取引方法や取引内容ごとに非表示設定（今後実装予定）

## 技術スタック

- React + TypeScript
- Vite
- Supabase (PostgreSQL)
- Google Gemini API
- Recharts (グラフ表示)
- Lucide React (アイコン)

## ライセンス

MIT
