-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. CREATE TABLES (Structure First)
-- ==========================================

-- PROFILES TABLE
-- Unifies registered users and "ghost" users (family members/tracking only)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Null for ghost users
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Owner of ghost profile
    full_name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CARDS TABLE
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('credit', 'debit')) NOT NULL,
    "limit" NUMERIC,
    closing_day INTEGER CHECK (closing_day BETWEEN 1 AND 31),
    due_day INTEGER CHECK (due_day BETWEEN 1 AND 31),
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    payer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Who paid
    card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL, -- Optional card
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TRANSACTION SHARES TABLE
CREATE TABLE IF NOT EXISTS public.transaction_shares (
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    share_amount NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('pending', 'paid')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (transaction_id, profile_id)
);

-- ==========================================
-- 2. ENABLE RLS & POLICIES
-- ==========================================

-- PROFILES POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile and profiles they created"
    ON public.profiles FOR SELECT
    USING (
        (auth.uid() = user_id) OR 
        (created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
    );

CREATE POLICY "Users can update their own profile and profiles they created"
    ON public.profiles FOR UPDATE
    USING (
        (auth.uid() = user_id) OR 
        (created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
    );

CREATE POLICY "Users can insert profiles (for ghost users)"
    ON public.profiles FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- CARDS POLICIES
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cards they own or manage"
    ON public.cards FOR SELECT
    USING (
        owner_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid() OR created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage cards they own or manage"
    ON public.cards FOR ALL
    USING (
        owner_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid() OR created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
    );

-- TRANSACTIONS POLICIES
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Note: Now safe to reference transaction_shares because the table exists
CREATE POLICY "Users can view transactions they paid or manage"
    ON public.transactions FOR SELECT
    USING (
        payer_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid() OR created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
        OR
        id IN ( -- Or if they are involved in the shares (visibility via shares)
           SELECT transaction_id FROM public.transaction_shares 
           WHERE profile_id IN (
               SELECT id FROM public.profiles WHERE user_id = auth.uid() OR created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
           )
        )
    );

CREATE POLICY "Users can insert transactions if they manage the payer"
    ON public.transactions FOR INSERT
    WITH CHECK (
        payer_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid() OR created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update/delete transactions if they manage the payer"
    ON public.transactions FOR UPDATE
    USING (
        payer_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid() OR created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete transactions if they manage the payer"
    ON public.transactions FOR DELETE
    USING (
        payer_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid() OR created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
    );


-- TRANSACTION SHARES POLICIES
ALTER TABLE public.transaction_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see shares they are involved in or manage"
    ON public.transaction_shares FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid() OR created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
        OR
        transaction_id IN ( -- Or if they are the payer of the parent transaction
            SELECT id FROM public.transactions WHERE payer_id IN (
                SELECT id FROM public.profiles WHERE user_id = auth.uid() OR created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can manage shares if they manage the transaction payer"
    ON public.transaction_shares FOR ALL
    USING (
        transaction_id IN (
            SELECT id FROM public.transactions WHERE payer_id IN (
                SELECT id FROM public.profiles WHERE user_id = auth.uid() OR created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
            )
        )
    );

-- ==========================================
-- 3. FUNCTIONS & TRIGGERS
-- ==========================================

-- Helper function to handle new user signup automatically
-- Triggers a profile creation when a new user signs up via Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
-- Drop if exists to avoid errors on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
