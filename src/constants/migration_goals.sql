-- RUN THIS IN SUPABASE SQL EDITOR

CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    target_amount NUMERIC NOT NULL,
    current_amount NUMERIC DEFAULT 0,
    deadline DATE,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view goals they own or manage" ON public.goals FOR SELECT USING (
    owner_id IN (
        SELECT id FROM public.profiles 
        WHERE user_id = auth.uid() OR created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
);

CREATE POLICY "Users can manage goals they own or manage" ON public.goals FOR ALL USING (
    owner_id IN (
        SELECT id FROM public.profiles 
        WHERE user_id = auth.uid() OR created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
);

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL;
