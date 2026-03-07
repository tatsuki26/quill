-- Supabaseデータベーススキーマ

-- 取引テーブル
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_date TEXT NOT NULL,
  withdrawal_amount NUMERIC,
  deposit_amount NUMERIC,
  foreign_withdrawal_amount NUMERIC,
  currency TEXT,
  exchange_rate NUMERIC,
  country TEXT,
  transaction_type TEXT NOT NULL,
  merchant TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_category TEXT,
  "user" TEXT,
  transaction_number TEXT UNIQUE NOT NULL,
  category TEXT,
  is_hidden BOOLEAN DEFAULT FALSE,
  memo TEXT,
  asset TEXT,
  receipt_image TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- カテゴリマッピングテーブル
CREATE TABLE category_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  is_manual BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- カテゴリテーブル
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color_bg TEXT NOT NULL,
  color_text TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 資産テーブル
CREATE TABLE assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 資産テーブル
CREATE TABLE assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- デフォルト非表示設定テーブル
CREATE TABLE default_hidden_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('payment_method', 'transaction_type')),
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(setting_type, value)
);

-- インデックス作成
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_merchant ON transactions(merchant);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_hidden ON transactions(is_hidden);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX idx_transactions_details ON transactions USING GIN (details);

-- RLS (Row Level Security) ポリシー
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_hidden_settings ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能
CREATE POLICY "Allow read access" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON category_mappings FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON assets FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON default_hidden_settings FOR SELECT USING (true);

-- 全ユーザーが挿入・更新可能（認証はアプリ側で制御）
CREATE POLICY "Allow insert access" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Allow insert access" ON category_mappings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access" ON category_mappings FOR UPDATE USING (true);
CREATE POLICY "Allow insert access" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access" ON categories FOR UPDATE USING (true);
CREATE POLICY "Allow delete access" ON categories FOR DELETE USING (true);
CREATE POLICY "Allow insert access" ON assets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access" ON assets FOR UPDATE USING (true);
CREATE POLICY "Allow delete access" ON assets FOR DELETE USING (true);
CREATE POLICY "Allow insert access" ON default_hidden_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access" ON default_hidden_settings FOR UPDATE USING (true);
CREATE POLICY "Allow delete access" ON default_hidden_settings FOR DELETE USING (true);
