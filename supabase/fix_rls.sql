-- Helper function to get the current user's profile ID securely
-- vital to prevent infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_auth_profile_id()
RETURNS UUID AS $$
DECLARE
  profile_id UUID;
BEGIN
  SELECT id INTO profile_id FROM public.profiles WHERE user_id = auth.uid();
  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 1. FIX PROFILES POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Users can view their own profile and profiles they created" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile and profiles they created" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert profiles (for ghost users)" ON public.profiles;

CREATE POLICY "Users can view their own profile and profiles they created"
    ON public.profiles FOR SELECT
    USING (
        (auth.uid() = user_id) OR 
        (created_by = public.get_auth_profile_id())
    );

CREATE POLICY "Users can update their own profile and profiles they created"
    ON public.profiles FOR UPDATE
    USING (
        (auth.uid() = user_id) OR 
        (created_by = public.get_auth_profile_id())
    );

CREATE POLICY "Users can insert profiles (for ghost users)"
    ON public.profiles FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- ==========================================
-- 2. FIX CARDS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Users can view cards they own or manage" ON public.cards;
DROP POLICY IF EXISTS "Users can manage cards they own or manage" ON public.cards;

CREATE POLICY "Users can view cards they own or manage"
    ON public.cards FOR SELECT
    USING (
        owner_id = public.get_auth_profile_id() OR
        owner_id IN (SELECT id FROM public.profiles WHERE created_by = public.get_auth_profile_id())
    );

CREATE POLICY "Users can manage cards they own or manage"
    ON public.cards FOR ALL
    USING (
        owner_id = public.get_auth_profile_id() OR
        owner_id IN (SELECT id FROM public.profiles WHERE created_by = public.get_auth_profile_id())
    );

-- ==========================================
-- 3. FIX TRANSACTIONS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Users can view transactions they paid or manage" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert transactions if they manage the payer" ON public.transactions;
DROP POLICY IF EXISTS "Users can update/delete transactions if they manage the payer" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete transactions if they manage the payer" ON public.transactions;

CREATE POLICY "Users can view transactions they paid or manage"
    ON public.transactions FOR SELECT
    USING (
        payer_id = public.get_auth_profile_id() OR
        payer_id IN (SELECT id FROM public.profiles WHERE created_by = public.get_auth_profile_id())
        OR
        id IN ( -- Or if they are involved in the shares
           SELECT transaction_id FROM public.transaction_shares 
           WHERE profile_id = public.get_auth_profile_id() OR 
                 profile_id IN (SELECT id FROM public.profiles WHERE created_by = public.get_auth_profile_id())
        )
    );

CREATE POLICY "Users can insert transactions if they manage the payer"
    ON public.transactions FOR INSERT
    WITH CHECK (
        payer_id = public.get_auth_profile_id() OR
        payer_id IN (SELECT id FROM public.profiles WHERE created_by = public.get_auth_profile_id())
    );

CREATE POLICY "Users can update/delete transactions if they manage the payer"
    ON public.transactions FOR UPDATE
    USING (
        payer_id = public.get_auth_profile_id() OR
        payer_id IN (SELECT id FROM public.profiles WHERE created_by = public.get_auth_profile_id())
    );

CREATE POLICY "Users can delete transactions if they manage the payer"
    ON public.transactions FOR DELETE
    USING (
        payer_id = public.get_auth_profile_id() OR
        payer_id IN (SELECT id FROM public.profiles WHERE created_by = public.get_auth_profile_id())
    );

-- ==========================================
-- 4. FIX TRANSACTION SHARES POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Users see shares they are involved in or manage" ON public.transaction_shares;
DROP POLICY IF EXISTS "Users can manage shares if they manage the transaction payer" ON public.transaction_shares;

CREATE POLICY "Users see shares they are involved in or manage"
    ON public.transaction_shares FOR SELECT
    USING (
        profile_id = public.get_auth_profile_id() OR
        profile_id IN (SELECT id FROM public.profiles WHERE created_by = public.get_auth_profile_id())
        OR
        transaction_id IN (
            SELECT id FROM public.transactions WHERE 
                payer_id = public.get_auth_profile_id() OR
                payer_id IN (SELECT id FROM public.profiles WHERE created_by = public.get_auth_profile_id())
        )
    );

CREATE POLICY "Users can manage shares if they manage the transaction payer"
    ON public.transaction_shares FOR ALL
    USING (
        transaction_id IN (
            SELECT id FROM public.transactions WHERE 
                payer_id = public.get_auth_profile_id() OR
                payer_id IN (SELECT id FROM public.profiles WHERE created_by = public.get_auth_profile_id())
        )
    );
