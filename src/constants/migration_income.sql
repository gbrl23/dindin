-- RUN THIS IN SUPABASE SQL EDITOR

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_income NUMERIC DEFAULT 0;

-- Optional: Update RLS if needed, but 'update' policy technically covers all columns usually.
-- Just ensuring existing policy covers it:
-- CREATE POLICY "Users can update their own profile" ... (Already exists in schema.sql)
