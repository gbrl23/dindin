
-- 1. Create a secure function to check group membership without recursion
CREATE OR REPLACE FUNCTION public.is_member_of_same_group(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.group_members m1
    JOIN public.group_members m2 ON m1.group_id = m2.group_id
    WHERE m1.user_id = auth.uid() 
      AND m2.user_id = target_user_id
  );
$$;

-- 2. Ensure get_my_profile_id is stable and secure
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 3. Fix PROFILES policies using exact names from DB
-- First drop existing ones
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Create enhanced ones
CREATE POLICY "profiles_select_policy"
    ON public.profiles FOR SELECT
    USING (
        (auth.uid() = user_id) OR 
        (created_by = public.get_my_profile_id()) OR
        public.is_member_of_same_group(user_id)
    );

CREATE POLICY "profiles_update_policy"
    ON public.profiles FOR UPDATE
    USING (
        (auth.uid() = user_id) OR 
        (created_by = public.get_my_profile_id())
    );

-- 4. Secure function for group membership check
CREATE OR REPLACE FUNCTION public.is_in_group(gid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = gid AND user_id = auth.uid()
  );
$$;

-- 5. Fix GROUP_MEMBERS policies using exact names from DB
DROP POLICY IF EXISTS "group_members_select_member" ON public.group_members;
CREATE POLICY "group_members_select_policy"
    ON public.group_members FOR SELECT
    USING (public.is_in_group(group_id));

-- 6. Ensure GROUPS table has correct selection policy
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "groups_select_policy" ON public.groups;
CREATE POLICY "groups_select_policy"
    ON public.groups FOR SELECT
    USING (
        (created_by = auth.uid()) OR 
        public.is_in_group(id)
    );

-- 7. Fix TRANSACTIONS visibility for group members
DROP POLICY IF EXISTS "Users can view transactions they paid or manage" ON public.transactions;
CREATE POLICY "transactions_select_policy"
    ON public.transactions FOR SELECT
    USING (
        payer_id = public.get_my_profile_id() OR
        payer_id IN (SELECT id FROM public.profiles WHERE created_by = public.get_my_profile_id()) OR
        group_id IN (SELECT id FROM public.groups WHERE public.is_in_group(id)) OR
        id IN (SELECT public.get_accessible_transaction_ids_via_shares())
    );
