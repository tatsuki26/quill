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

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseのセットアップ

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. SQL Editorで `supabase-schema.sql` を実行
3. Project Settings > API から URL と anon key を取得

### 3. Google Gemini APIのセットアップ

1. [Google AI Studio](https://makersuite.google.com/app/apikey)でAPIキーを取得

### 4. 環境変数の設定

`.env` ファイルを作成し、以下を設定：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_AUTH_PASSWORD=your_auth_password
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

## デプロイ

### Vercelへのデプロイ

1. GitHubにリポジトリをプッシュ
2. [Vercel](https://vercel.com)でプロジェクトをインポート
3. 環境変数を設定
4. デプロイ

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
