-- カテゴリテーブルに色カラムを追加するマイグレーション
-- SupabaseのSQL Editorで実行してください

-- color_bgとcolor_textカラムを追加
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS color_bg TEXT NOT NULL DEFAULT '#f0f0f0',
ADD COLUMN IF NOT EXISTS color_text TEXT NOT NULL DEFAULT '#666666';

-- 既存のカテゴリにデフォルトの色を設定
-- 初期データの色を設定（既に色が設定されている場合はスキップ）
UPDATE categories SET 
  color_bg = '#ffe5e5', 
  color_text = '#cc0000' 
WHERE name = '外食' AND (color_bg IS NULL OR color_bg = '#f0f0f0');

UPDATE categories SET 
  color_bg = '#e5f3ff', 
  color_text = '#0066cc' 
WHERE name = 'コンビニ' AND (color_bg IS NULL OR color_bg = '#f0f0f0');

UPDATE categories SET 
  color_bg = '#e5ffe5', 
  color_text = '#00cc00' 
WHERE name = 'スーパー' AND (color_bg IS NULL OR color_bg = '#f0f0f0');

UPDATE categories SET 
  color_bg = '#fff0e5', 
  color_text = '#cc6600' 
WHERE name = 'ドラッグストア' AND (color_bg IS NULL OR color_bg = '#f0f0f0');

UPDATE categories SET 
  color_bg = '#f0e5ff', 
  color_text = '#6600cc' 
WHERE name = 'ショッピング' AND (color_bg IS NULL OR color_bg = '#f0f0f0');

UPDATE categories SET 
  color_bg = '#ffffe5', 
  color_text = '#cccc00' 
WHERE name = 'ガソリン' AND (color_bg IS NULL OR color_bg = '#f0f0f0');

UPDATE categories SET 
  color_bg = '#ffe5f0', 
  color_text = '#cc0066' 
WHERE name = '医療' AND (color_bg IS NULL OR color_bg = '#f0f0f0');

UPDATE categories SET 
  color_bg = '#e5ffff', 
  color_text = '#00cccc' 
WHERE name = '交通' AND (color_bg IS NULL OR color_bg = '#f0f0f0');

UPDATE categories SET 
  color_bg = '#ffe5ff', 
  color_text = '#cc00cc' 
WHERE name = '娯楽' AND (color_bg IS NULL OR color_bg = '#f0f0f0');

UPDATE categories SET 
  color_bg = '#f5f5f5', 
  color_text = '#666666' 
WHERE name = '投資' AND (color_bg IS NULL OR color_bg = '#f0f0f0');

UPDATE categories SET 
  color_bg = '#e5e5ff', 
  color_text = '#0000cc' 
WHERE name = '公共料金' AND (color_bg IS NULL OR color_bg = '#f0f0f0');

UPDATE categories SET 
  color_bg = '#fff5e5', 
  color_text = '#cc3300' 
WHERE name = '食費' AND (color_bg IS NULL OR color_bg = '#f0f0f0');

UPDATE categories SET 
  color_bg = '#f0f0f0', 
  color_text = '#666666' 
WHERE name = 'その他' AND (color_bg IS NULL OR color_bg = '#f0f0f0');
