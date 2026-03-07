-- カテゴリテーブルのRLSポリシーを追加するマイグレーション
-- SupabaseのSQL Editorで実行してください
-- 注意: 既にポリシーが存在する場合はエラーになりますが、問題ありません

-- RLS有効化
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Allow read access" ON categories;
DROP POLICY IF EXISTS "Allow insert access" ON categories;
DROP POLICY IF EXISTS "Allow update access" ON categories;
DROP POLICY IF EXISTS "Allow delete access" ON categories;

-- ポリシー作成
CREATE POLICY "Allow read access" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow insert access" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access" ON categories FOR UPDATE USING (true);
CREATE POLICY "Allow delete access" ON categories FOR DELETE USING (true);
