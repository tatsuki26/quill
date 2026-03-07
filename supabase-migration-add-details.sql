-- transactionsテーブルにdetailsカラムを追加するマイグレーション
-- SupabaseのSQL Editorで実行してください

-- detailsカラムを追加（JSON形式で商品名と金額を保存）
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS details JSONB;

-- インデックスを追加（JSON検索用）
CREATE INDEX IF NOT EXISTS idx_transactions_details ON transactions USING GIN (details);
