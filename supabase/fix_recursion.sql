
-- Function to break recursion: Get transaction IDs where user is a shareholder
-- valid for auth.uid()
CREATE OR REPLACE FUNCTION public.get_accessible_transaction_ids_via_shares()
RETURNS SETOF UUID AS $$
DECLARE
  current_profile_id UUID;
BEGIN
  -- Get current user's profile ID directly (assuming get_auth_profile_id exists or inline)
  SELECT id INTO current_profile_id FROM public.profiles WHERE user_id = auth.uid();

  RETURN QUERY
  SELECT transaction_id 
  FROM public.transaction_shares
  WHERE profile_id = current_profile_id 
     OR profile_id IN (SELECT id FROM public.profiles WHERE created_by = current_profile_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update Transactions Policy
DROP POLICY IF EXISTS "Users can view transactions they paid or manage" ON public.transactions;

CREATE POLICY "Users can view transactions they paid or manage"
    ON public.transactions FOR SELECT
    USING (
        payer_id = public.get_auth_profile_id() OR
        payer_id IN (SELECT id FROM public.profiles WHERE created_by = public.get_auth_profile_id())
        OR
        id IN (SELECT public.get_accessible_transaction_ids_via_shares()) -- BROKEN RECURSION HERE
    );

-- Keep transaction_shares policy as is (it checks transactions via RLS, which is now safe)
