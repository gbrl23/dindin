-- =============================================
-- MIGRATION: Import Logs + import_id on transactions
-- Epic 5 - Importação Multiplataforma
-- =============================================

-- 1. Create import_logs table
CREATE TABLE IF NOT EXISTS public.import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('pdf', 'csv')),
    filename TEXT NOT NULL,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    total_amount NUMERIC,
    card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'undone')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Index for user queries
CREATE INDEX IF NOT EXISTS idx_import_logs_user ON public.import_logs (user_id);

-- 3. RLS
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own import logs"
    ON public.import_logs
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Add import_id to transactions for traceability
ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS import_id UUID REFERENCES public.import_logs(id) ON DELETE SET NULL;

-- 5. Partial index for import lookups (only non-null)
CREATE INDEX IF NOT EXISTS idx_transactions_import
    ON public.transactions (import_id)
    WHERE import_id IS NOT NULL;
