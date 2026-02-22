# Dindin - Arquitetura T\u00e9cnica

> Documento de arquitetura para os Epics 1-5 do PRD "Gest\u00e3o de Gastos"
> Criado por: Aria (Architect)
> Data: 2026-02-20
> Stack: React 19 + Vite 7 + Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
> Deploy: Vercel

---

## 1. Vis\u00e3o Geral da Arquitetura

```
\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502                        VERCEL (CDN)                           \u2502
\u2502  \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u2502
\u2502  \u2502  React 19 SPA (Vite)                                      \u2502  \u2502
\u2502  \u2502  \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u2502  \u2502
\u2502  \u2502  \u2502  Contexts  \u2502 \u2502   Hooks    \u2502 \u2502  Features  \u2502 \u2502  Utils  \u2502 \u2502  \u2502
\u2502  \u2502  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2502  \u2502
\u2502  \u2502  \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u2502  \u2502
\u2502  \u2502  \u2502  Service Worker (Push + Cache)                          \u2502 \u2502  \u2502
\u2502  \u2502  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2502  \u2502
\u2502  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518  \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518
                              \u2502
                    Supabase Client SDK
                              \u2502
\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502                       SUPABASE                                \u2502
\u2502  \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u2502
\u2502  \u2502 PostgreSQL \u2502 \u2502    Auth    \u2502 \u2502  Realtime  \u2502 \u2502   Edge     \u2502  \u2502
\u2502  \u2502  + RLS     \u2502 \u2502            \u2502 \u2502            \u2502 \u2502 Functions  \u2502  \u2502
\u2502  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518  \u2502
\u2502  \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510                               \u2502
\u2502  \u2502  pg_cron   \u2502 \u2502  Storage   \u2502                               \u2502
\u2502  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518                               \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518
```

**Princ\u00edpios arquiteturais:**
- Serverless-first: sem backend pr\u00f3prio, toda l\u00f3gica via Supabase (RLS, RPCs, Edge Functions)
- Client-heavy: c\u00e1lculos financeiros no client via hooks memorizados
- Feature-based: cada m\u00f3dulo em `src/features/{name}/` com view + components
- Context + Hooks: estado global via Context API, exposto via custom hooks

---

## 2. Schema de Tabelas Novas

### 2.1 Tabela: `budgets`

```sql
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    month VARCHAR(7) NOT NULL, -- formato: 'YYYY-MM'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT budgets_unique_user_category_month
        UNIQUE (user_id, category_id, month)
);

-- Indices
CREATE INDEX idx_budgets_user_month ON public.budgets (user_id, month);
CREATE INDEX idx_budgets_category ON public.budgets (category_id);

-- RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own budgets"
    ON public.budgets FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Decis\u00f5es de design:**
- `user_id` referencia `auth.users` (n\u00e3o `profiles`) porque or\u00e7amentos s\u00e3o pessoais, n\u00e3o por perfil ghost
- `month` como VARCHAR(7) em vez de DATE: simplifica queries (`WHERE month = '2026-02'`) sem overhead de data
- `UNIQUE (user_id, category_id, month)`: impede duplicatas no banco, n\u00e3o s\u00f3 no client
- `amount > 0`: or\u00e7amento zero n\u00e3o faz sentido

### 2.2 Tabela: `push_subscriptions`

```sql
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT push_subscriptions_unique_endpoint
        UNIQUE (endpoint)
);

CREATE INDEX idx_push_subs_user ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions"
    ON public.push_subscriptions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER push_subscriptions_updated_at
    BEFORE UPDATE ON public.push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Decis\u00f5es de design:**
- `endpoint` UNIQUE (n\u00e3o por user\_id): um endpoint s\u00f3 pode existir uma vez, mesmo se o usu\u00e1rio re-registrar
- `p256dh` + `auth`: chaves Web Push API necess\u00e1rias para criptografar payload
- `user_agent`: \u00fatil para debugging (qual navegador/dispositivo)
- Um usu\u00e1rio pode ter m\u00faltiplas subscriptions (celular + desktop)

### 2.3 Tabela: `notification_preferences`

```sql
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    bills_due BOOLEAN DEFAULT true NOT NULL,
    budget_exceeded BOOLEAN DEFAULT true NOT NULL,
    group_activity BOOLEAN DEFAULT true NOT NULL,
    enabled BOOLEAN DEFAULT true NOT NULL, -- master toggle
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification preferences"
    ON public.notification_preferences FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER notification_prefs_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Decis\u00f5es de design:**
- PK = `user_id` (1:1 com usu\u00e1rio): simplifica queries, sem UUID extra
- Todos `DEFAULT true`: opt-out ao inv\u00e9s de opt-in (melhor engajamento)
- `enabled`: master toggle que desabilita tudo de uma vez
- Sem tabela `notifications` para hist\u00f3rico: push notifications s\u00e3o fire-and-forget no escopo MVP

### 2.4 Tabela: `import_logs`

```sql
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

CREATE INDEX idx_import_logs_user ON public.import_logs (user_id);

ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own import logs"
    ON public.import_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

**Decis\u00f5es de design:**
- `status`: 'completed' ou 'undone' (quando usu\u00e1rio desfaz importa\u00e7\u00e3o)
- `card_id ON DELETE SET NULL`: se cart\u00e3o for exclu\u00eddo, log permanece para hist\u00f3rico
- `total_amount`: calculado no client e salvo para referencia r\u00e1pida

### 2.5 Altera\u00e7\u00e3o: Coluna `import_id` em `transactions`

```sql
ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS import_id UUID REFERENCES public.import_logs(id) ON DELETE SET NULL;

CREATE INDEX idx_transactions_import ON public.transactions (import_id)
    WHERE import_id IS NOT NULL;
```

**Uso:** Ao desfazer importa\u00e7\u00e3o, `DELETE FROM transactions WHERE import_id = ?`

### 2.6 Tabela: `budget_notifications_sent`

```sql
CREATE TABLE IF NOT EXISTS public.budget_notifications_sent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
    month VARCHAR(7) NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT budget_notif_unique
        UNIQUE (user_id, budget_id, month)
);
```

**Uso:** Evita enviar notifica\u00e7\u00e3o duplicada quando or\u00e7amento atinge 90% mais de uma vez no m\u00eas.

---

## 3. Diagrama de Relacionamento (ERD Parcial - Novas Tabelas)

```
auth.users (1)
    \u2502
    \u251c\u2500\u2500 (1:N) budgets
    \u2502        \u2514\u2500\u2500 (N:1) categories
    \u2502
    \u251c\u2500\u2500 (1:N) push_subscriptions
    \u2502
    \u251c\u2500\u2500 (1:1) notification_preferences
    \u2502
    \u251c\u2500\u2500 (1:N) import_logs
    \u2502        \u2514\u2500\u2500 (N:1) cards
    \u2502
    \u2514\u2500\u2500 (1:N) budget_notifications_sent
             \u2514\u2500\u2500 (N:1) budgets

transactions
    \u2514\u2500\u2500 (N:1) import_logs  [via import_id]
```

---

## 4. Edge Functions

### 4.1 `send-push-notification`

**Prop\u00f3sito:** Enviar push notification para um ou mais usu\u00e1rios.

```
Tipo: HTTP (invocada por outras Edge Functions ou triggers)
Runtime: Deno (Supabase Edge Functions)
Depend\u00eancias: web-push (npm: via esm.sh)
```

**Interface:**
```javascript
// POST /functions/v1/send-push-notification
{
    "user_ids": ["uuid1", "uuid2"],
    "title": "Conta pr\u00f3xima do vencimento",
    "body": "Energia el\u00e9trica - R$ 180,00 vence em 2 dias",
    "url": "/bills",                    // rota para abrir ao clicar
    "tag": "bill-due-{transaction_id}"  // evita duplicata no dispositivo
}
```

**Fluxo:**
1. Recebe payload com `user_ids` e conte\u00fado
2. Busca `push_subscriptions` dos usu\u00e1rios
3. Verifica `notification_preferences` (enabled + tipo espec\u00edfico)
4. Filtra subscriptions de usu\u00e1rios com prefer\u00eancia ativa
5. Envia via Web Push API (criptografia VAPID)
6. Remove subscriptions inv\u00e1lidas (endpoint expirado/revogado)

**Vari\u00e1veis de ambiente:**
```
VAPID_PUBLIC_KEY   # Chave p\u00fablica VAPID (tamb\u00e9m usada no client)
VAPID_PRIVATE_KEY  # Chave privada VAPID (s\u00f3 no servidor)
VAPID_SUBJECT      # "mailto:contato@dindin.app"
```

### 4.2 `check-bills-due`

**Prop\u00f3sito:** Verificar contas com vencimento nos pr\u00f3ximos 3 dias e enviar notifica\u00e7\u00f5es.

```
Tipo: Cron (via pg_cron)
Schedule: '0 9 * * *' (diariamente \u00e0s 9h)
```

**Fluxo:**
1. Query contas pendentes com vencimento em at\u00e9 3 dias:
```sql
SELECT t.id, t.description, t.amount, t.date, t.payer_id, p.user_id
FROM transactions t
JOIN profiles p ON t.payer_id = p.id
WHERE t.type = 'bill'
  AND t.is_paid = false
  AND t.date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
  AND p.user_id IS NOT NULL;
```
2. Agrupa por usu\u00e1rio
3. Chama `send-push-notification` para cada usu\u00e1rio com suas contas

**Configura\u00e7\u00e3o pg_cron:**
```sql
SELECT cron.schedule(
    'check-bills-due',
    '0 9 * * *',
    $$SELECT net.http_post(
        url := current_setting('app.settings.edge_function_url') || '/check-bills-due',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := '{}'::jsonb
    )$$
);
```

### 4.3 `check-budget-exceeded`

**Prop\u00f3sito:** Verificar se or\u00e7amento atingiu 90% ap\u00f3s inser\u00e7\u00e3o de transa\u00e7\u00e3o.

```
Tipo: Database Webhook (trigger no INSERT de transactions)
```

**Alternativa escolhida: L\u00f3gica no client** (ver se\u00e7\u00e3o 6.1)

**Raz\u00e3o:** Verificar or\u00e7amento no client ap\u00f3s salvar transa\u00e7\u00e3o \u00e9 mais simples e evita complexidade de Edge Function + Database Webhook. O hook `useBudgets` j\u00e1 tem os dados necess\u00e1rios. Se o or\u00e7amento atinge 90%, o client chama diretamente `send-push-notification`.

**Fluxo no client:**
```
addTransaction() \u2192 sucesso
    \u2192 useBudgets.checkThreshold(categoryId, month)
        \u2192 spent >= amount * 0.9 ?
            \u2192 verificar budget_notifications_sent (j\u00e1 enviou?)
                \u2192 n\u00e3o: chamar send-push-notification + registrar em budget_notifications_sent
```

---

## 5. Estrat\u00e9gia de Gera\u00e7\u00e3o de PDF no Client

### Abordagem: `jspdf` + `jspdf-autotable`

**Raz\u00e3o da escolha:**
| Op\u00e7\u00e3o | Peso (KB) | Gr\u00e1ficos | Tabelas | Complexidade |
|--------|-----------|----------|---------|--------------|
| html2canvas + jsPDF | ~400 | Via screenshot | Via screenshot | M\u00e9dia |
| jsPDF + autoTable | ~250 | Via canvas export | Nativo | Baixa |
| react-pdf | ~600 | Custom | Custom | Alta |

**Escolha: jsPDF + autoTable** \u2014 menor bundle, tabelas nativas (n\u00e3o screenshot), gr\u00e1ficos via canvas `toDataURL()`.

### Implementa\u00e7\u00e3o

```javascript
// src/utils/exportPdf.js

import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function exportReportPdf({ period, summary, categoryBreakdown, chartCanvas }) {
    const doc = new jsPDF('p', 'mm', 'a4');

    // Header
    doc.setFontSize(18);
    doc.text('Dindin - Relat\u00f3rio Financeiro', 14, 22);
    doc.setFontSize(11);
    doc.text(`Per\u00edodo: ${period.start} - ${period.end}`, 14, 30);

    // Resumo
    doc.setFontSize(14);
    doc.text('Resumo', 14, 42);
    doc.autoTable({
        startY: 46,
        head: [['Receitas', 'Despesas', 'Saldo']],
        body: [[
            formatCurrency(summary.income),
            formatCurrency(summary.expenses),
            formatCurrency(summary.balance)
        ]],
        theme: 'grid',
        headStyles: { fillColor: [81, 0, 255] } // --primary
    });

    // Gr\u00e1fico (se dispon\u00edvel)
    if (chartCanvas) {
        const chartImg = chartCanvas.toDataURL('image/png');
        const y = doc.lastAutoTable.finalY + 10;
        doc.addImage(chartImg, 'PNG', 14, y, 180, 90);
    }

    // Detalhamento por categoria
    const catY = chartCanvas
        ? doc.lastAutoTable.finalY + 110
        : doc.lastAutoTable.finalY + 10;

    doc.setFontSize(14);
    doc.text('Detalhamento por Categoria', 14, catY);
    doc.autoTable({
        startY: catY + 4,
        head: [['Categoria', 'Transa\u00e7\u00f5es', 'Total', '%']],
        body: categoryBreakdown.map(c => [
            c.name, c.count, formatCurrency(c.total), `${c.percentage}%`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [81, 0, 255] }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
            `Gerado por Dindin em ${new Date().toLocaleDateString('pt-BR')}`,
            14, doc.internal.pageSize.height - 10
        );
    }

    const filename = `dindin-relatorio-${period.start}-${period.end}.pdf`;
    doc.save(filename);
}
```

**Integra\u00e7\u00e3o com gr\u00e1ficos:**
- `CategoryPieChart` e `CumulativeLineChart` usam canvas internamente
- Extrair via `document.querySelector('canvas').toDataURL('image/png')`
- Passar como `chartCanvas` para a fun\u00e7\u00e3o de export

**Depend\u00eancias a adicionar:**
```bash
npm install jspdf jspdf-autotable
```

---

## 6. Arquitetura Frontend

### 6.1 Novos Hooks

#### `useBudgets`

```javascript
// src/hooks/useBudgets.js

// Estado:
// - budgets: [{ id, category_id, amount, month, category: {...} }]
// - loading, error

// M\u00e9todos:
// - fetchBudgets(month) \u2192 SELECT com JOIN em categories
// - addBudget(categoryId, amount, month) \u2192 INSERT
// - updateBudget(id, amount) \u2192 UPDATE
// - removeBudget(id) \u2192 DELETE

// C\u00e1lculo de progresso (client-side):
// - getBudgetsWithProgress(budgets, transactions, month)
//   \u2192 Para cada budget: filtra transactions por category_id + month + type='expense'
//   \u2192 Calcula: spent, remaining, percentage
//   \u2192 Retorna: { ...budget, spent, remaining, percentage, status }
//   \u2192 status: 'healthy' | 'warning' | 'critical' | 'exceeded'

// Verifica\u00e7\u00e3o de threshold (para push):
// - checkBudgetThreshold(categoryId, month)
//   \u2192 Se percentage >= 90 E n\u00e3o notificou ainda este m\u00eas
//   \u2192 Chama send-push-notification
//   \u2192 Registra em budget_notifications_sent
```

**Padr\u00e3o de fetch (consistente com useCategories):**
```javascript
const { data, error } = await supabase
    .from('budgets')
    .select(`
        *,
        category:categories!category_id(id, name, icon, color, type)
    `)
    .eq('user_id', user.id)
    .eq('month', month)
    .order('created_at');
```

#### `useReports`

```javascript
// src/hooks/useReports.js

// N\u00e3o precisa de tabela pr\u00f3pria \u2014 agrega dados de transactions

// M\u00e9todos:
// - getReport(filters) \u2192 filtra transactions por per\u00edodo, categoria, tipo
// - getCategoryBreakdown(transactions) \u2192 agrupa por categoria com subtotal
// - getTimelineData(transactions) \u2192 dados para gr\u00e1fico de linha
// - exportCsv(filteredTransactions) \u2192 gera CSV via PapaParse
// - exportPdf(reportData) \u2192 gera PDF via jsPDF

// Filtros persistidos via useState (n\u00e3o context \u2014 escopo local da p\u00e1gina)
```

#### `usePushNotifications`

```javascript
// src/hooks/usePushNotifications.js

// M\u00e9todos:
// - requestPermission() \u2192 Notification.requestPermission()
// - subscribe() \u2192 SW registration.pushManager.subscribe() + salva no Supabase
// - unsubscribe() \u2192 remove subscription do Supabase
// - getPermissionStatus() \u2192 'granted' | 'denied' | 'default'

// Estado:
// - isSupported: boolean (navigator.serviceWorker && 'PushManager' in window)
// - permission: 'granted' | 'denied' | 'default'
// - subscription: PushSubscription | null
```

#### `useNotificationPreferences`

```javascript
// src/hooks/useNotificationPreferences.js

// M\u00e9todos:
// - fetchPreferences() \u2192 SELECT from notification_preferences
// - updatePreference(key, value) \u2192 UPDATE (UPSERT na primeira vez)
// - toggleAll(enabled) \u2192 UPDATE enabled field

// Estado:
// - preferences: { bills_due, budget_exceeded, group_activity, enabled }
// - loading
```

#### `useImportLogs`

```javascript
// src/hooks/useImportLogs.js

// M\u00e9todos:
// - fetchLogs() \u2192 SELECT com JOIN em cards
// - createLog(type, filename, count, totalAmount, cardId) \u2192 INSERT, retorna id
// - undoImport(logId) \u2192 DELETE transactions WHERE import_id = logId + UPDATE log status

// Estado:
// - logs: [{ id, type, filename, transaction_count, total_amount, card, status, created_at }]
```

### 6.2 Novos Features (Estrutura de Diret\u00f3rio)

```
src/features/
\u251c\u2500\u2500 budgets/                    [NOVO]
\u2502   \u251c\u2500\u2500 BudgetsView.jsx         # Tela principal /budgets
\u2502   \u251c\u2500\u2500 BudgetCard.jsx          # Card individual com barra de progresso
\u2502   \u251c\u2500\u2500 BudgetFormModal.jsx     # Bottom sheet criar/editar
\u2502   \u2514\u2500\u2500 BudgetDashboardWidget.jsx  # Widget para sidebar do dashboard
\u2502
\u251c\u2500\u2500 reports/                    [NOVO]
\u2502   \u251c\u2500\u2500 ReportsView.jsx         # Tela principal /reports
\u2502   \u251c\u2500\u2500 ReportFilters.jsx       # Chips + filtros de per\u00edodo/categoria/tipo
\u2502   \u251c\u2500\u2500 ReportSummaryCards.jsx  # Cards de receita/despesa/saldo
\u2502   \u251c\u2500\u2500 CategoryBreakdown.jsx   # Lista expans\u00edvel por categoria
\u2502   \u2514\u2500\u2500 ExportActionSheet.jsx   # Bottom sheet mobile com op\u00e7\u00f5es CSV/PDF
\u2502
\u251c\u2500\u2500 transactions/
\u2502   \u251c\u2500\u2500 ... (existentes)
\u2502   \u251c\u2500\u2500 FileUploader.jsx        [NOVO] # Componente reutiliz\u00e1vel de upload
\u2502   \u251c\u2500\u2500 ImportCsvView.jsx       [NOVO] # Fluxo CSV com mapeamento
\u2502   \u2514\u2500\u2500 ImportInvoiceModal.jsx  [REFACTOR] # Refatorar para usar FileUploader
\u2502
\u2514\u2500\u2500 account/
    \u2514\u2500\u2500 NotificationSettings.jsx [NOVO] # Se\u00e7\u00e3o de config de notifica\u00e7\u00f5es
```

### 6.3 Novas Rotas

```javascript
// Adicionar em App.jsx:

// Epic 2: Or\u00e7amentos
<Route path="/budgets" element={<ProtectedRoute><MainLayout><BudgetsView /></MainLayout></ProtectedRoute>} />

// Epic 3: Relat\u00f3rios
<Route path="/reports" element={<ProtectedRoute><MainLayout><ReportsView /></MainLayout></ProtectedRoute>} />

// Epic 5: Import CSV (tela dedicada vs modal)
<Route path="/import" element={<ProtectedRoute><MainLayout><ImportCsvView /></MainLayout></ProtectedRoute>} />
```

### 6.4 Altera\u00e7\u00f5es em Componentes Existentes

| Componente | Altera\u00e7\u00e3o | Epic |
|-----------|----------|------|
| `Sidebar.jsx` | Adicionar links: Or\u00e7amentos, Relat\u00f3rios | 2, 3 |
| `DashboardView.jsx` | Adicionar `BudgetDashboardWidget` na sidebar | 2 |
| `MainLayout.jsx` | Sem altera\u00e7\u00e3o estrutural | - |
| `ImportInvoiceModal.jsx` | Refatorar para usar `FileUploader` + adicionar `import_id` | 5 |
| `TransactionsContext.jsx` | `addTransactionsBulk` retorna `import_id` | 5 |
| `AccountView.jsx` | Adicionar se\u00e7\u00e3o `NotificationSettings` | 4 |
| `sw.js` | Adicionar `push` event listener | 4 |

---

## 7. Componente FileUploader

### Arquitetura

```javascript
// src/features/transactions/FileUploader.jsx

// Props:
// - accept: string[]  (ex: ['.pdf', '.csv'])
// - maxSize: number   (bytes, default: 10MB)
// - onFileSelect: (file: File) => void
// - onError: (message: string) => void
// - disabled: boolean

// Estados internos:
// - isDragging: boolean (desktop drag over)
// - selectedFile: File | null
// - error: string | null

// Comportamento por plataforma:
// - Desktop: Drag & drop zone + click to select
// - Mobile: Click to open native file picker (detect via useIsMobile)
// - Ambos: Valida\u00e7\u00e3o de tipo e tamanho antes de callback
```

**Detec\u00e7\u00e3o de plataforma:** Usa `useIsMobile()` hook j\u00e1 existente no projeto.

**Eventos:**
```javascript
// Desktop: drag handlers
onDragEnter, onDragOver, onDragLeave, onDrop

// Ambos: input[type="file"]
onChange -> validateFile(file) -> onFileSelect(file)

// Valida\u00e7\u00e3o:
function validateFile(file) {
    if (!accept.some(ext => file.name.toLowerCase().endsWith(ext)))
        return onError(`Tipo n\u00e3o aceito. Use: ${accept.join(', ')}`);
    if (file.size > maxSize)
        return onError(`Arquivo muito grande. M\u00e1ximo: ${formatSize(maxSize)}`);
    setSelectedFile(file);
    onFileSelect(file);
}
```

---

## 8. Service Worker: Push Notifications

### Extens\u00e3o do `sw.js` Existente

```javascript
// public/sw.js - adicionar ao arquivo existente:

// Push event handler
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/icon-512.png',
        badge: '/icon-512.png',
        tag: data.tag || 'dindin-notification',
        data: { url: data.url || '/' },
        vibrate: [200, 100, 200],
        actions: [
            { action: 'open', title: 'Abrir' },
            { action: 'dismiss', title: 'Dispensar' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            // Foca janela existente se poss\u00edvel
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin)) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            // Abre nova janela se nenhuma existente
            return clients.openWindow(url);
        })
    );
});
```

### Registro de Subscription no Client

```javascript
// Dentro de usePushNotifications.js

async function subscribe() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    const { endpoint, keys } = subscription.toJSON();

    await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: navigator.userAgent
    }, { onConflict: 'endpoint' });
}
```

---

## 9. Estrat\u00e9gia de Exporta\u00e7\u00e3o CSV

### Implementa\u00e7\u00e3o

```javascript
// src/utils/exportCsv.js

import Papa from 'papaparse';

export function exportReportCsv({ transactions, period }) {
    const data = transactions.map(t => ({
        'Data': new Date(t.date).toLocaleDateString('pt-BR'),
        'Descri\u00e7\u00e3o': t.description,
        'Categoria': t.category_details?.name || 'Sem categoria',
        'Tipo': t.type === 'expense' ? 'Despesa' : t.type === 'income' ? 'Receita' : t.type,
        'Valor': t.amount.toFixed(2).replace('.', ','),
        'Cart\u00e3o': t.card?.name || '-',
        'Status': t.is_paid ? 'Pago' : 'Pendente'
    }));

    const csv = Papa.unparse(data, {
        delimiter: ';',  // padr\u00e3o brasileiro (Excel BR usa ;)
        quotes: true
    });

    // BOM para encoding correto no Excel
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const filename = `dindin-relatorio-${period.start}-${period.end}.csv`;

    // Mobile: share API se dispon\u00edvel
    if (navigator.share && navigator.canShare?.({ files: [new File([blob], filename)] })) {
        navigator.share({
            files: [new File([blob], filename, { type: 'text/csv' })],
            title: 'Relat\u00f3rio Dindin'
        });
    } else {
        // Desktop: download direto
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}
```

**Decis\u00f5es:**
- Delimitador `;` (ponto e v\u00edrgula): Excel no Brasil usa `;` como separador padr\u00e3o
- BOM (`\uFEFF`): garante que Excel reconhe\u00e7a UTF-8 com acentos
- Web Share API: no mobile, permite enviar via WhatsApp, email, etc.
- Fallback: download direto para desktop e mobile sem Share API

---

## 10. Depend\u00eancias Novas

### NPM

```bash
# Epic 1: Testes
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Epic 3: Exporta\u00e7\u00e3o PDF
npm install jspdf jspdf-autotable
```

### Supabase

```bash
# VAPID keys (gerar uma vez)
npx web-push generate-vapid-keys

# Environment variables no Supabase Dashboard:
VAPID_PUBLIC_KEY=<chave_publica>
VAPID_PRIVATE_KEY=<chave_privada>
VAPID_SUBJECT=mailto:contato@dindin.app
```

### Vite Config

```javascript
// vite.config.js - adicionar para testes:
export default defineConfig({
    // ... existente
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.js',
        css: true
    }
});
```

---

## 11. Riscos T\u00e9cnicos e Mitiga\u00e7\u00f5es

| Risco | Impacto | Mitiga\u00e7\u00e3o |
|-------|---------|-----------|
| Push notifications n\u00e3o funcionam no iOS Safari antes de 16.4 | Usu\u00e1rios iOS antigos sem push | Fallback: in-app notification banner no dashboard |
| PDF parsing de faturas de diferentes bancos falha | Import n\u00e3o reconhece formato | Manter regex extensivos + fallback para import manual |
| Edge Functions cold start (5-10s) atrasa notifica\u00e7\u00e3o | UX de push lenta | Aceit\u00e1vel para notifica\u00e7\u00f5es (n\u00e3o s\u00e3o real-time cr\u00edtico) |
| Web Push API n\u00e3o suportada em alguns browsers | Sem push em browsers antigos | `isSupported` check + graceful degradation |
| jsPDF bundle size (~250KB) | Aumento do bundle | Lazy import: `const jsPDF = await import('jspdf')` |
| pg_cron n\u00e3o dispon\u00edvel no plano free Supabase | Sem cron para check-bills-due | Alternativa: Vercel Cron Jobs (gratuito, at\u00e9 1x/dia) |

---

## 12. Ordem de Implementa\u00e7\u00e3o (Sequ\u00eancia T\u00e9cnica)

```
Epic 1 (Funda\u00e7\u00e3o)
  \u2514\u2192 Vitest setup \u2192 Testes hooks \u2192 Tech preferences

Epic 2 (Or\u00e7amentos)
  \u2514\u2192 SQL: budgets table \u2192 useBudgets hook \u2192 BudgetsView \u2192 Dashboard widget

Epic 3 (Relat\u00f3rios)
  \u2514\u2192 useReports hook \u2192 ReportsView + filtros \u2192 exportCsv \u2192 exportPdf (lazy)

Epic 4 (Push)
  \u2514\u2192 SQL: push_subscriptions + notification_preferences
  \u2192 VAPID keys \u2192 sw.js push handler \u2192 usePushNotifications
  \u2192 Edge Function: send-push \u2192 Edge Function: check-bills-due
  \u2192 Client: check-budget-exceeded \u2192 NotificationSettings UI

Epic 5 (Import)
  \u2514\u2192 FileUploader component \u2192 Refatorar ImportInvoiceModal
  \u2192 SQL: import_logs + transactions.import_id
  \u2192 ImportCsvView (mapeamento) \u2192 useImportLogs (hist\u00f3rico + undo)
```

---

*\u2014 Aria, arquitetando o futuro \ud83c\udfd7\ufe0f*
