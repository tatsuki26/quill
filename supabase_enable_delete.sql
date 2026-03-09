-- transactionsテーブルでDELETEを許可するRLSポリシー
-- Supabase Dashboard > SQL Editor でこのファイルの内容を実行してください

-- 既存の同名ポリシーがあれば削除
DROP POLICY IF EXISTS "Allow delete transactions" ON transactions;

-- DELETEポリシーを追加（anonロールで削除を許可）
CREATE POLICY "Allow delete transactions"
ON transactions
FOR DELETE
TO anon
USING (true);
