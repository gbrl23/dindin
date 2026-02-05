-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'investment')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Read default categories" ON categories;
    DROP POLICY IF EXISTS "Read own categories" ON categories;
    DROP POLICY IF EXISTS "Manage own categories" ON categories;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Read default categories" ON categories FOR SELECT USING (user_id IS NULL);
CREATE POLICY "Read own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Manage own categories" ON categories FOR ALL USING (auth.uid() = user_id);

-- Add category_id to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Seed Data (Idempotent-ish check by name not possible easily in simpler insert, assuming fresh run or ignoring dups manually if needed. 
-- Since this is an 'apply_migration' it usually runs once. I'll insert defaults.)
INSERT INTO categories (name, icon, color, type) 
SELECT 'Casa', '🏠', '#ef4444', 'expense' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Casa' AND user_id IS NULL) UNION ALL
SELECT 'Comida', '🍔', '#f97316', 'expense' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Comida' AND user_id IS NULL) UNION ALL
SELECT 'Transporte', '🚗', '#3b82f6', 'expense' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Transporte' AND user_id IS NULL) UNION ALL
SELECT 'Lazer', '🎉', '#8b5cf6', 'expense' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Lazer' AND user_id IS NULL) UNION ALL
SELECT 'Saúde', '💊', '#ec4899', 'expense' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Saúde' AND user_id IS NULL) UNION ALL
SELECT 'Compras', '🛍️', '#06b6d4', 'expense' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Compras' AND user_id IS NULL) UNION ALL
SELECT 'Educação', '📚', '#14b8a6', 'expense' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Educação' AND user_id IS NULL) UNION ALL
SELECT 'Salário', '💰', '#22c55e', 'income' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Salário' AND user_id IS NULL) UNION ALL
SELECT 'Freelance', '💻', '#84cc16', 'income' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Freelance' AND user_id IS NULL) UNION ALL
SELECT 'Investimento', '📈', '#6366f1', 'investment' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Investimento' AND user_id IS NULL) UNION ALL
SELECT 'Outros', '📦', '#64748b', 'expense' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Outros' AND user_id IS NULL);
