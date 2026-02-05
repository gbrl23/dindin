-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Alter the column to allow NULLs and remove the default 0 if it exists
ALTER TABLE public.profiles 
ALTER COLUMN monthly_income DROP DEFAULT;

-- 2. (Optional) If you want to reset all existing 0s to NULL to trigger the popup for everyone:
-- UPDATE public.profiles SET monthly_income = NULL WHERE monthly_income = 0;
