-- Add financial_start_day to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS financial_start_day INTEGER DEFAULT 1 CHECK (financial_start_day >= 1 AND financial_start_day <= 31);

-- Add competence_date to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS competence_date DATE DEFAULT CURRENT_DATE;

-- (Optional) Backfill existing transactions to have competence_date = date
UPDATE transactions 
SET competence_date = date 
WHERE competence_date IS NULL;
