-- カテゴリテーブルを追加するマイグレーション
-- SupabaseのSQL Editorで実行してください
-- 注意: 既にテーブルを作成している場合は、supabase-migration-add-color-columns.sql を実行してください

-- カテゴリテーブル作成（既に作成済みの場合はスキップ）
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color_bg TEXT,
  color_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- 色カラムを追加（既に存在する場合はスキップ）
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS color_bg TEXT,
ADD COLUMN IF NOT EXISTS color_text TEXT;

-- 初期データ（現在のカテゴリ）を追加
INSERT INTO categories (name, color_bg, color_text, display_order) VALUES
  ('外食', '#ffe5e5', '#cc0000', 1),
  ('コンビニ', '#e5f3ff', '#0066cc', 2),
  ('スーパー', '#e5ffe5', '#00cc00', 3),
  ('ドラッグストア', '#fff0e5', '#cc6600', 4),
  ('ショッピング', '#f0e5ff', '#6600cc', 5),
  ('ガソリン', '#ffffe5', '#cccc00', 6),
  ('医療', '#ffe5f0', '#cc0066', 7),
  ('交通', '#e5ffff', '#00cccc', 8),
  ('娯楽', '#ffe5ff', '#cc00cc', 9),
  ('投資', '#f5f5f5', '#666666', 10),
  ('公共料金', '#e5e5ff', '#0000cc', 11),
  ('食費', '#fff5e5', '#cc3300', 12),
  ('その他', '#f0f0f0', '#666666', 13)
ON CONFLICT (name) DO NOTHING;
