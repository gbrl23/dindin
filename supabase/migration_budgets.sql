-- Migration: Create budgets table for Epic 2 (Monthly Budgets)
-- Run this in Supabase SQL Editor

-- ==========================================
-- 1. BUDGETS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    month VARCHAR(7) NOT NULL, -- formato: 'YYYY-MM'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT budgets_unique_user_category_month
        UNIQUE (user_id, category_id, month)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets (user_id, month);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON public.budgets (category_id);

-- RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own budgets"
    ON public.budgets FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
