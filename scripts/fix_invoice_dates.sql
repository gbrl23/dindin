-- Script para corrigir invoice_date das transações existentes
-- Nova regra CORRETA:
--   dia < closing_day  → fatura do MÊS ATUAL da transação
--   dia >= closing_day → fatura do MÊS SEGUINTE

-- Este script recalcula o invoice_date para todas as transações de despesa (expense)
-- que têm um cartão associado

UPDATE transactions t
SET invoice_date = (
    CASE 
        -- Se o dia da transação >= closing_day, fatura do mês seguinte
        WHEN EXTRACT(DAY FROM t.date) >= c.closing_day THEN
            DATE_TRUNC('month', t.date + INTERVAL '1 month')
        -- Se o dia da transação < closing_day, fatura do mês atual
        ELSE
            DATE_TRUNC('month', t.date)
    END
)::date
FROM cards c
WHERE t.card_id = c.id
  AND t.type = 'expense'
  AND t.card_id IS NOT NULL;

-- Verificar resultado
SELECT 
    t.id,
    t.description,
    t.date,
    t.invoice_date,
    c.name as card_name,
    c.closing_day,
    EXTRACT(DAY FROM t.date) as tx_day,
    CASE 
        WHEN EXTRACT(DAY FROM t.date) >= c.closing_day THEN 'Próximo mês'
        ELSE 'Mês atual'
    END as regra_aplicada
FROM transactions t
JOIN cards c ON t.card_id = c.id
WHERE t.type = 'expense'
ORDER BY t.date DESC
LIMIT 20;
