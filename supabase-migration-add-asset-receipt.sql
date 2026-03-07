-- transactionsテーブルにassetとreceipt_imageカラムを追加するマイグレーション
-- SupabaseのSQL Editorで実行してください

-- assetカラムを追加
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS asset TEXT;

-- receipt_imageカラムを追加（Base64エンコードされた画像データを保存）
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS receipt_image TEXT;

-- 既存のPayPay取引には自動で「PayPay」を設定（既にassetがNULLの場合のみ）
UPDATE transactions 
SET asset = 'PayPay' 
WHERE payment_method LIKE '%PayPay%' AND asset IS NULL;
