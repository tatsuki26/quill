-- カテゴリマッピングにis_manualフラグを追加するマイグレーション
-- SupabaseのSQL Editorで実行してください

ALTER TABLE category_mappings 
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE;

-- 既存のデータは自動分類として扱われます（is_manual = false）
