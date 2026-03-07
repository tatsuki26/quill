-- メモフィールドを追加するマイグレーション
-- SupabaseのSQL Editorで実行してください

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS memo TEXT;

-- 既存のデータには影響しません（NULLがデフォルト）
