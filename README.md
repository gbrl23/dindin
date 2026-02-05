# Expense Tracker

Sistema de controle de despesas pessoais e compartilhadas com suporte a cartões de crédito, grupos e faturas.

## Tecnologias

- **Frontend**: React + Vite
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Estilização**: CSS Modules

## Estrutura do Projeto

```
src/
├── features/           # Módulos funcionais
│   ├── dashboard/     # Dashboard principal
│   ├── transactions/  # Gestão de transações
│   ├── cards/         # Gestão de cartões
│   ├── groups/        # Gestão de grupos
│   └── profiles/      # Perfis de usuários
├── hooks/             # Custom hooks
├── services/          # Serviços (Supabase)
└── App.jsx           # Componente principal
```

## Contratos de Filtragem

### 📊 Grupo (Organização por Mês)

**Objetivo**: Exibir despesas compartilhadas de um grupo em um mês específico.

**Filtros aplicados**:
- `group_id` = ID do grupo selecionado
- `type` = `'expense'`
- `date` dentro do mês selecionado (ex: `>= '2026-01-01' AND < '2026-02-01'`)

**Exibição**: Lista de despesas do mês real (baseado no campo `date`)

**Exemplo de query**:
```sql
SELECT * FROM transactions
WHERE group_id = '<group_id>'
  AND type = 'expense'
  AND date >= '2026-01-01'
  AND date < '2026-02-01'
ORDER BY date DESC;
```

---

### 💳 Fatura do Cartão (Padrão de Cartão de Crédito)

**Objetivo**: Exibir compras que pertencem a uma fatura específica de cartão.

**Filtros aplicados**:
- `card_id` = ID do cartão selecionado
- `type` = `'expense'`
- `invoice_date` = primeiro dia do mês da fatura (ex: `'2026-01-01'`)

**Exibição**: Compras que pertencem àquela fatura, **independentemente do campo `date`**

**Exemplo de query**:
```sql
SELECT * FROM transactions
WHERE card_id = '<card_id>'
  AND type = 'expense'
  AND invoice_date = '2026-01-01'
ORDER BY date DESC;
```

---

### ⚠️ Diferença Importante

| Aspecto | Grupo | Fatura do Cartão |
|---------|-------|------------------|
| **Campo de filtro temporal** | `date` (data real da compra) | `invoice_date` (data da fatura) |
| **Lógica** | Mês em que a despesa ocorreu | Fatura em que a compra será cobrada |
| **Exemplo** | Compra de 28/01 aparece no grupo de Janeiro | Compra de 28/01 pode aparecer na fatura de Fevereiro (dependendo da data de fechamento) |

---

## Setup do Projeto

### Instalação

```bash
npm install
```

### Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Configure as variáveis de ambiente:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Execute as migrations SQL necessárias (veja `/sql` para scripts)

### Desenvolvimento

```bash
npm run dev
```

### Build para Produção

```bash
npm run build
```

---

## Funcionalidades Principais

- ✅ Autenticação de usuários
- ✅ Gestão de transações (receitas e despesas)
- ✅ Cartões de crédito com faturas mensais
- ✅ Grupos para despesas compartilhadas
- ✅ Divisão de despesas entre perfis
- ✅ Transações recorrentes
- ✅ Parcelamento de compras
- ✅ Dashboard com visão geral financeira

---

## Licença

MIT
