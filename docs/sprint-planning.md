# Dindin - Sprint Planning

> Planejamento de sprints para os Epics 1-5 do PRD "Gestao de Gastos"
> Criado por: River (Scrum Master)
> Data: 2026-02-21
> Metodologia: Sprints de 2 semanas
> Base: PRD (`docs/prd.md`) + Arquitetura (`docs/architecture/technical-architecture.md`)

---

## Resumo Geral

| Dado                  | Valor                     |
|-----------------------|---------------------------|
| Total de Epics        | 5                         |
| Total de Stories      | 22                        |
| Sprints planejados    | 6                         |
| Duracao por sprint    | 2 semanas                 |
| Tempo total estimado  | ~12 semanas (3 meses)     |
| Stack                 | React 19 + Vite + Supabase |
| Deploy                | Vercel                    |

---

## Mapa de Dependencias entre Epics

```
Epic 1 (Fundacao)
  |
  v
Epic 2 (Orcamentos) -----> Epic 4 (Push) [Story 4.3 depende de Epic 2]
  |                            |
  v                            v
Epic 3 (Relatorios)       Epic 4 completo
                               |
                               v
                          Epic 5 (Import)
```

**Dependencias criticas:**
- Epic 1 deve ser o primeiro (infraestrutura de testes)
- Epic 2 antes de Epic 4 (Story 4.3 depende de orcamentos)
- Epic 5 pode rodar em paralelo com Epic 4 (sem dependencia direta)

---

## Sprint 1: Fundacao Tecnica

**Periodo:** Semanas 1-2
**Epic:** 1 - Qualidade & Fundacao Tecnica
**Objetivo:** Estabelecer infraestrutura de testes e validar hooks financeiros criticos

| Story | Titulo                                     | Pontos | Prioridade |
|-------|--------------------------------------------|--------|------------|
| 1.1   | Configurar infraestrutura de testes        | 3      | Critica    |
| 1.2   | Testes para useBalanceCalculator           | 5      | Alta       |
| 1.3   | Testes para useSharePayments               | 5      | Alta       |
| 1.4   | Testes para logica de fatura de cartao     | 5      | Alta       |
| 1.5   | Atualizar configuracoes tecnicas           | 2      | Media      |

**Total:** 20 pontos | 5 stories

**Sequencia de execucao:**
1. Story 1.1 (Vitest setup) - bloqueante para 1.2-1.4
2. Stories 1.2, 1.3, 1.4 (parallelizable apos 1.1)
3. Story 1.5 (independente, pode executar a qualquer momento)

**Entregaveis:**
- [x] Vitest configurado com `npm test` funcional
- [x] Coverage habilitado
- [x] 3 hooks criticos com 90%+ coverage
- [x] `technical-preferences.md` refletindo stack real

**Criterio de Done do Sprint:**
- `npm test` roda sem erros
- Coverage report mostra 90%+ nos 3 hooks
- `npm run lint` passa limpo

---

## Sprint 2: Orcamentos - Backend + Hook

**Periodo:** Semanas 3-4
**Epic:** 2 - Orcamentos Mensais (parte 1)
**Objetivo:** Criar estrutura de dados e logica de negocios para orcamentos

| Story | Titulo                                     | Pontos | Prioridade |
|-------|--------------------------------------------|--------|------------|
| 2.1   | Criar tabela e hook de orcamentos          | 8      | Critica    |
| 2.3   | Calculo de progresso gasto vs. orcamento   | 5      | Alta       |

**Total:** 13 pontos | 2 stories

**Sequencia de execucao:**
1. Story 2.1 - Schema SQL (`budgets` table, RLS, indices) + `useBudgets` hook
2. Story 2.3 - Enriquecer hook com calculo de `spent`, barras de progresso

**Entregaveis:**
- Tabela `budgets` no Supabase com RLS e constraints
- Hook `useBudgets` com CRUD + calculo de progresso
- Testes unitarios para logica de calculo
- Barras de progresso com sistema de cores (verde/amarelo/vermelho)

**Dependencia:** Sprint 1 concluido (testes configurados)

---

## Sprint 3: Orcamentos - UI + Relatorios Inicio

**Periodo:** Semanas 5-6
**Epics:** 2 (parte 2) + 3 (inicio)
**Objetivo:** Entregar UI completa de orcamentos e iniciar relatorios

| Story | Titulo                                     | Pontos | Prioridade |
|-------|--------------------------------------------|--------|------------|
| 2.2   | Tela de gerenciamento de orcamentos        | 8      | Alta       |
| 2.4   | Widget de orcamentos no Dashboard          | 3      | Media      |
| 3.1   | Criar tela de relatorios com filtros       | 8      | Alta       |

**Total:** 19 pontos | 3 stories

**Sequencia de execucao:**
1. Story 2.2 - `BudgetsView`, `BudgetCard`, `BudgetFormModal`, rota `/budgets`, link no Sidebar
2. Story 2.4 - `BudgetDashboardWidget` no Dashboard (depende de 2.2)
3. Story 3.1 - `ReportsView` com filtros, rota `/reports`, link no Sidebar

**Entregaveis:**
- Tela `/budgets` funcional (CRUD + navegacao entre meses)
- Widget no dashboard com top 3 orcamentos
- Tela `/reports` com filtros de periodo, categoria e tipo
- Haptic feedback em acoes mobile

**Dependencia:** Sprint 2 concluido (hook de orcamentos)

---

## Sprint 4: Relatorios - Graficos + Exportacao

**Periodo:** Semanas 7-8
**Epic:** 3 - Relatorios & Exportacao (parte 2)
**Objetivo:** Completar relatorios com graficos e exportacao PDF/CSV

| Story | Titulo                                     | Pontos | Prioridade |
|-------|--------------------------------------------|--------|------------|
| 3.2   | Graficos analiticos no relatorio           | 5      | Alta       |
| 3.3   | Exportacao em CSV                          | 5      | Alta       |
| 3.4   | Exportacao em PDF                          | 8      | Alta       |

**Total:** 18 pontos | 3 stories

**Sequencia de execucao:**
1. Story 3.2 - Reutilizar `CategoryPieChart`, `CumulativeLineChart`
2. Story 3.3 - `exportCsv.js` com PapaParse, BOM, separador `;`
3. Story 3.4 - `exportPdf.js` com jsPDF + autoTable (lazy import), instalar deps

**Entregaveis:**
- Graficos de pizza e linha na tela de relatorios
- Exportacao CSV funcional (mobile share + desktop download)
- Exportacao PDF com cabecalho, resumo, tabela e grafico
- Dependencias: `jspdf`, `jspdf-autotable` adicionadas

**Dependencia:** Story 3.1 do Sprint 3

**Nota tecnica:** jsPDF deve ser lazy-loaded (`const { default: jsPDF } = await import('jspdf')`) para nao impactar bundle size.

---

## Sprint 5: Notificacoes Push

**Periodo:** Semanas 9-10
**Epic:** 4 - Notificacoes Push
**Objetivo:** Implementar infraestrutura e logica de push notifications

| Story | Titulo                                     | Pontos | Prioridade |
|-------|--------------------------------------------|--------|------------|
| 4.1   | Infraestrutura push (SW + Supabase)        | 8      | Critica    |
| 4.2   | Notificacoes de vencimento de contas       | 5      | Alta       |
| 4.3   | Notificacoes de orcamento atingido         | 5      | Alta       |
| 4.4   | Notificacoes de atividade em grupos        | 5      | Media      |
| 4.5   | Tela de configuracoes de notificacoes      | 3      | Media      |

**Total:** 26 pontos | 5 stories

**Sequencia de execucao:**
1. Story 4.1 - Tabelas SQL (`push_subscriptions`, `notification_preferences`), VAPID keys, `sw.js` push handler, `usePushNotifications` hook, Edge Function `send-push-notification`
2. Story 4.5 - `NotificationSettings` UI em `/account` (pode parallelizar com 4.2)
3. Story 4.2 - Edge Function `check-bills-due` + pg_cron
4. Story 4.3 - Logica client-side no `useBudgets.checkThreshold` + `budget_notifications_sent`
5. Story 4.4 - Trigger no `addTransaction` de grupo

**Entregaveis:**
- Tabelas de push + preferences no Supabase
- Service Worker com push handler
- 2 Edge Functions (send-push, check-bills-due)
- Cron diario para verificar vencimentos
- UI de configuracao de notificacoes

**Dependencia:** Epic 2 concluido (Story 4.3 precisa de budgets)

**Riscos:**
- iOS Safari < 16.4 nao suporta push (fallback: banner in-app)
- pg_cron pode nao estar disponivel no plano free Supabase (fallback: Vercel Cron)

---

## Sprint 6: Importacao Multiplataforma

**Periodo:** Semanas 11-12
**Epic:** 5 - Importacao Multiplataforma
**Objetivo:** Unificar e melhorar experiencia de importacao em todas as plataformas

| Story | Titulo                                     | Pontos | Prioridade |
|-------|--------------------------------------------|--------|------------|
| 5.1   | Unificar componente FileUploader           | 5      | Critica    |
| 5.2   | Melhorar importacao de fatura PDF          | 8      | Alta       |
| 5.3   | Melhorar importacao de transacoes CSV      | 8      | Alta       |
| 5.4   | Historico de importacoes                   | 5      | Media      |

**Total:** 26 pontos | 4 stories

**Sequencia de execucao:**
1. Story 5.1 - `FileUploader.jsx` com drag&drop desktop + file picker mobile
2. Story 5.2 - Refatorar `ImportInvoiceModal` para usar `FileUploader`, melhorar preview
3. Story 5.3 - `ImportCsvView` com mapeamento de colunas, rota `/import`
4. Story 5.4 - Tabela `import_logs`, coluna `import_id` em transactions, `useImportLogs`, UI de historico + undo

**Entregaveis:**
- Componente `FileUploader` reutilizavel
- Import PDF melhorado com preview e feedback
- Import CSV com mapeamento de colunas interativo
- Historico de importacoes com opcao de desfazer

**Dependencia:** Sem dependencia direta de epics anteriores

---

## Visao Geral - Timeline

```
Sem 1-2    | Sprint 1: Fundacao Tecnica (Epic 1)
Sem 3-4    | Sprint 2: Orcamentos Backend (Epic 2a)
Sem 5-6    | Sprint 3: Orcamentos UI + Relatorios Inicio (Epic 2b + 3a)
Sem 7-8    | Sprint 4: Relatorios Completo (Epic 3b)
Sem 9-10   | Sprint 5: Push Notifications (Epic 4)
Sem 11-12  | Sprint 6: Importacao (Epic 5)
```

---

## Metricas de Velocidade

| Sprint | Pontos | Stories | Epic(s)       |
|--------|--------|---------|---------------|
| 1      | 20     | 5       | 1             |
| 2      | 13     | 2       | 2 (parte 1)   |
| 3      | 19     | 3       | 2 (parte 2), 3 (parte 1) |
| 4      | 18     | 3       | 3 (parte 2)   |
| 5      | 26     | 5       | 4             |
| 6      | 26     | 4       | 5             |
| **Total** | **122** | **22** | **5 epics** |

**Velocidade media:** ~20 pontos/sprint

---

## Riscos do Planejamento

| Risco | Impacto | Mitigacao |
|-------|---------|-----------|
| Sprint 5 sobrecarregado (26pts, 5 stories) | Atraso no Epic 4 | Story 4.4 pode ser movida para Sprint 6 se necessario |
| Sprint 6 sobrecarregado (26pts) | Atraso na entrega final | Story 5.4 pode virar Sprint 7 se necessario |
| Dependencia do Epic 2 para Story 4.3 | Bloqueia push de orcamento | Se Epic 2 atrasar, Story 4.3 pode esperar sem bloquear o resto do Epic 4 |
| pg_cron indisponivel | Sem cron para vencimentos | Usar Vercel Cron Jobs como fallback (config: `vercel.json`) |
| iOS Safari push support | Usuarios iOS sem push | Banner in-app como fallback, documentar limitacao |

---

## Proximo Passo

Para iniciar a execucao, use `*draft` para criar a primeira story detalhada:

> **Proxima story:** Story 1.1 - Configurar infraestrutura de testes
> **Comando:** `*draft`

---

*-- River, removendo obstaculos* 🌊
