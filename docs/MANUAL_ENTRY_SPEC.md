# 手動入力機能の仕様

## 概要
PayPay以外の支払いを手動で入力できる機能を追加します。レシート写真をアップロードしてGemini Vision APIで自動解析する機能も含みます。

## 機能一覧

### 1. 手動入力フォーム
- **日付**: カレンダーから選択
- **金額**: 数値入力
- **分類**: カテゴリから選択（DB管理）
- **資産**: 資産から選択（DB管理、デフォルト値あり）
- **内容**: テキスト入力（店舗名など）
- **メモ**: テキスト入力（50文字以内）

### 2. レシート画像解析
- レシート画像をアップロード
- Gemini Vision APIで画像を解析
- 以下の情報を自動入力：
  - 日付
  - 金額
  - 店舗名（内容）
  - 分類（可能な場合）
- 資産は手動選択

### 3. 資産管理
- デフォルト資産：
  - 現金
  - 銀行
  - カード
  - 梨奈のお金
  - 樹のお金
  - ベルクペイ
  - PayPay
- 追加・削除・編集可能
- カテゴリ管理と同様のUI

## データベース設計

### assets テーブル
```sql
CREATE TABLE assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### transactions テーブルへの追加
- `asset` カラムを追加（TEXT型、NULL可）
- PayPayからのインポート時は自動で「PayPay」を設定

## UI設計

### 手動入力フォーム
- ヘッダーに「手動入力」ボタンを追加（管理者のみ）
- モーダルまたは専用ページで表示
- 入力項目：
  1. 日付（カレンダー選択）
  2. 金額（数値入力）
  3. 分類（ドロップダウン）
  4. 資産（ドロップダウン）
  5. 内容（テキスト入力）
  6. メモ（テキスト入力、50文字以内）
- レシート画像アップロードボタン
- 保存ボタン

### レシート解析
- 画像アップロードボタン
- アップロード後、Gemini Vision APIで解析
- 解析結果をフォームに自動入力
- ユーザーが確認・修正して保存

### 資産管理ページ
- カテゴリ管理と同様のUI
- 追加・削除・編集機能
- 表示順序の変更（オプション）

## 技術実装

### Gemini Vision API
- `@google/generative-ai`の`generateContent`で画像を送信
- プロンプトでレシート情報を抽出
- JSON形式で返答を要求

### 画像アップロード
- ブラウザのFile APIを使用
- Base64エンコードまたはBlob形式でGemini APIに送信
- ファイルサイズ制限: 10MB

## 実装順序
1. データベーススキーマの追加
2. 資産管理ページの作成
3. 手動入力フォームの作成
4. レシート画像アップロード機能
5. Gemini Vision API連携
6. 統合テスト
