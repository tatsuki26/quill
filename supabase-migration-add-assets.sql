-- 資産テーブルを追加するマイグレーション
-- SupabaseのSQL Editorで実行してください

-- 資産テーブル作成
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Allow read access" ON assets;
DROP POLICY IF EXISTS "Allow insert access" ON assets;
DROP POLICY IF EXISTS "Allow update access" ON assets;
DROP POLICY IF EXISTS "Allow delete access" ON assets;

-- ポリシー作成
CREATE POLICY "Allow read access" ON assets FOR SELECT USING (true);
CREATE POLICY "Allow insert access" ON assets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access" ON assets FOR UPDATE USING (true);
CREATE POLICY "Allow delete access" ON assets FOR DELETE USING (true);

-- 初期データ（デフォルト資産）を追加
INSERT INTO assets (name, display_order) VALUES
  ('現金', 1),
  ('銀行', 2),
  ('カード', 3),
  ('梨奈のお金', 4),
  ('樹のお金', 5),
  ('ベルクペイ', 6)
ON CONFLICT (name) DO NOTHING;
