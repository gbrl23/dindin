
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** expense-tracker
- **Date:** 2026-02-03
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Email/password signup success and onboarding completion
- **Test Code:** [TC001_Emailpassword_signup_success_and_onboarding_completion.py](./TC001_Emailpassword_signup_success_and_onboarding_completion.py)
- **Test Error:** Summary of verification attempt and current status:

1) Signup attempt:
- Input used: Nome='Teste Usuario', Email='teste@teste.com', Senha='teste123'.
- Result: Signup failed with error message 'Falha ao criar conta. User already registered'. Reason: the email teste@teste.com is already registered, so a new account could not be created with that email.

2) Login attempt:
- Credentials used: email='teste@teste.com', password='teste123'.
- Result: Login succeeded. The application navigated to /dashboard and the dashboard UI is visible (widgets for Saldo Previsto, Receitas, Despesas, Fluxo Financeiro, etc.). No errors observed on the dashboard.

3) Onboarding/profile creation:
- Not performed because signup could not create a new account. Primary profile creation and adding a secondary profile were not executed. Both remain to be completed to fully verify the onboarding flow.

4) Conclusion against the requested verification steps:
- "Verify a new user can sign up with email and password": NOT VERIFIED (signup failed because email already existed).
- "Complete onboarding by creating a primary profile and at least one secondary profile": NOT COMPLETED (no onboarding steps executed).
- "Land on the dashboard": VERIFIED (after login the dashboard is visible).

5) Recommended next actions to fully complete the verification (if further execution is desired):
- Use a new unique email address (e.g., teste+<random>@teste.com) and repeat signup flow to create an account.
- After signup succeeds, complete onboarding: create primary profile (enter name and pick an avatar) and then add one secondary profile.
- Verify both profiles appear in the app and that the dashboard loads after onboarding.

If automated continuation is requested, provide confirmation to: (A) retry signup with a new unique email, or (B) proceed to create profiles for the currently-logged-in account (if that path is supported). Current run result: success=false (task not fully completed).
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/8d2893c5-2f8a-4c50-8cdd-0e525961c275
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Login failure with incorrect password
- **Test Code:** [TC002_Login_failure_with_incorrect_password.py](./TC002_Login_failure_with_incorrect_password.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/14d12498-1c3d-4507-b920-c86252d15207
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Create and edit profiles (multiple profiles per account)
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/e5a70d6c-f8eb-47e0-b0ed-58e855f464e3
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Prevent deletion of lone primary profile
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/51afa7c8-67a7-4bb9-9a29-92d1963a4312
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Create expense with 50/50 split updates balances immediately
- **Test Code:** [TC005_Create_expense_with_5050_split_updates_balances_immediately.py](./TC005_Create_expense_with_5050_split_updates_balances_immediately.py)
- **Test Error:** Unable to complete the requested verification. Summary of facts and blocking issue:

1) Current dashboard balances (captured earlier exactly as shown):
- Saldo Previsto
R$ 0,00
- Receitas Extras
R$ 0,00
- Despesas
R$ 0,00
- Fluxo Financeiro (Acumulado)
Receitas
Despesas
00000
Dia 15
Receita: R$ 0
Despesa: R$ 0
1102030

2) Actions performed so far: visited homepage, logged in (teste@teste.com), opened dashboard and extracted balances, opened 'Nova Transação' and prepared an expense for R$100,00 with 'Dividir em Grupo' enabled. Found no existing groups in the group dropdown. Navigated to Grupos and attempted to create a new group twice via the 'Criar Grupo' modal.

3) Blocking issue: both group creation attempts resulted in the create button showing 'Criando...' but the modal did not close and no new group appeared in the Grupos list. No error message visible in the UI. This prevents adding members and selecting a group for the 50/50 split transaction.

4) Result: Verification of creating an expense with a 50/50 split and confirming dashboard updates cannot be completed due to the group creation failure. Transaction creation and dashboard assertions remain unexecuted.

5) Suggested next steps for resolving the block:
- Investigate backend/API logs for the group-creation endpoint to identify failure or timeout.
- Check browser console/network for failed requests (POST /groups or similar).
- Fix the server-side issue or enable group creation, then retry: create group, add two members, re-open 'Nova Transação', select group, set split 50/50, set payer to Profile A, save transaction, and confirm dashboard updates.

If assistance is available to inspect server logs or retry after backend fixes, the steps to finish the verification can be resumed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/0e535044-c139-44bf-b0ae-26397c0c98b3
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Create expense with custom split (70/30) calculation correctness
- **Test Code:** [TC006_Create_expense_with_custom_split_7030_calculation_correctness.py](./TC006_Create_expense_with_custom_split_7030_calculation_correctness.py)
- **Test Error:** Unable to complete verification due to application UI failure. Summary of what was done and what remains:

What was completed in this session:
- Logged in with teste@teste.com (login succeeded earlier).
- Opened 'Nova Transação' and entered amount R$200,00.
- Enabled 'Dividir em Grupo' in the transaction modal.

What blocked completion:
- The web app SPA became blank (white page) and currently shows no interactive elements. Attempts to reload and wait were made several times but the SPA did not render. The group dropdown in the transaction modal only returned the placeholder 'Selecione o Grupo...' earlier, and navigating to /groups produced an empty page. Without the group existing or accessible UI, the transaction cannot be saved with a custom split and the dashboard cannot be verified.

What remains to finish the user's request (after UI recovery):
1) Create a group containing Profile A and Profile B (1 required). 
2) Create an expense transaction of R$200.00 with payer = Profile A and set a custom split: Profile A 70% (R$140.00) / Profile B 30% (R$60.00). 
3) Verify the dashboard shows Profile A share = 140.00, Profile B share = 60.00 and a settlement suggestion indicating Profile B owes 60.00 to Profile A.

Recommended next steps for the user / operator:
- Confirm the web application server is running and serving the SPA assets (check backend logs, restart the dev server if needed). 
- Open the browser devtools console to check for JavaScript errors or network failures that prevent the SPA from mounting.
- After the SPA is rendering again, request a retry and the automation will continue: create the group, then the transaction, then verify the balances and settlement suggestion.

Result: Task incomplete due to UI rendering failure. Manual intervention required. Success=false.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/4b4fdbf9-46ff-4f9a-a2c1-266ae7d4517d
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Reject invalid custom split ratios (sum != 100)
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/0872800f-19b4-4882-b6d9-d59466bc0eb0
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Create income tied to profile affects net balance
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/38c435a3-bd65-41dc-bcac-035774c46dc7
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Edit transaction amount and split triggers immediate recalculation
- **Test Code:** [TC009_Edit_transaction_amount_and_split_triggers_immediate_recalculation.py](./TC009_Edit_transaction_amount_and_split_triggers_immediate_recalculation.py)
- **Test Error:** Summary of test attempt and blocking issue:

- Goal: Verify editing an existing transaction updates derived totals and settlement suggestions in realtime (create expense R$120.00 split 50/50, edit to R$150.00 split 60/40, assert dashboard balances Profile A R$90.00 / Profile B R$60.00).

- What was achieved:
  - Authenticated successfully with teste@teste.com / teste123 and dashboard loaded.
  - New Transaction modal opened successfully and value R$120,00 was entered; 'Dividir em Grupo' toggle enabled.
  - Grupo select now lists groups (Selecione o Grupo..., Grupo de Teste, Test Group, Test Group) and group selection actions were attempted.

- Blocking issues (objective failure statements):
  - Participants not loaded after selecting a group: Participants area displays 'Nenhum membro encontrado.'
  - Payer dropdown ('Quem pagou?') returned no options (dropdown index 1947 had no options).
  - Direct navigation to the Groups page (http://localhost:3000/groups) returned a blank page on 2 attempts.

- Attempts and retries performed (counts):
  - Grupo dropdown options read: 3 attempts initially returned only default; later options appeared and groups selected twice.
  - Groups page navigation via URL: 2 attempts, both blank.
  - 'Quem pagou?' dropdown open attempt: 1 attempt returned no options.

- Result: Transaction creation is blocked because group members and payer options are unavailable; therefore the edit and dashboard assertions cannot be executed.

- Recommended next steps to proceed (choose one):
  1) Fix backend/frontend issue causing group members not to load (investigate why /groups returns blank and why participants list is empty). After fix, re-run the test steps.
  2) If groups are expected to be empty, add members to the appropriate group via the Groups UI (or provide an API/setup instruction) so members appear in the New Transaction modal, then re-run the create->edit->assert flow.
  3) Provide an alternative test account or group known to contain Profile A and Profile B, or provide explicit instructions/data to pre-populate the group members for the test.

- Current status: Test not completed. All three major test steps remain uncompleted due to the blocking issue.

Request: Please confirm how to proceed (fix groups/members, provide a group with members, or allow guidance to try alternative navigation).
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/9dcdd54f-3409-4a29-ae69-e2973fb9edf5
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Delete transaction updates settlement and totals
- **Test Code:** [TC010_Delete_transaction_updates_settlement_and_totals.py](./TC010_Delete_transaction_updates_settlement_and_totals.py)
- **Test Error:** Unable to complete the requested verification: deleting a transaction and confirming immediate recalculation/settlement changes. Summary of findings and why the test cannot proceed:

What was attempted:
- The app was opened and login (teste@teste.com / teste123) succeeded and dashboard was reached earlier.
- Multiple attempts were made to create transactions and an account via the UI (opened 'Nova Movimentação' modal twice, filled transaction fields, clicked 'Salvar Transação' twice; opened 'Contas' > 'Nova Conta', filled fields and clicked 'Salvar Conta' several times).
- Several waits were used to let the SPA load after actions.

What blocked progress (evidence):
- Current page DOM is empty (SPA not loaded) in the active tab (/bills). No interactive elements are available to continue the test.
- Numerous auto-closed JavaScript alerts recorded in the session logs indicating server-side or frontend errors, repeated many times:
  - 'Erro: invalid input syntax for type uuid: ""' (repeated)
  - 'Perfil não encontrado' (repeated)
- Transaction/account creation attempts are unconfirmed in the UI; likely persisted operations failed due to backend errors (invalid uuid / missing profile).

Test status (remaining):
- Transactions created: 0/2 (both save attempts unconfirmed/failed).
- Transactions deleted: 0/1.
- Assertions checked (deleted transaction removal and totals/settlement recalculation): 0/1.

Recommended next steps to resolve the blocking issue before retrying the verification:
1. Investigate backend/API logs for the invalid-UUID error and 'Perfil não encontrado' messages; confirm the API is running and returning expected payloads (especially that account and user/profile UUIDs are provided).
2. Ensure the SPA can fully load (no missing environment variables or API base URL misconfiguration). Reload the app after backend fix.
3. Retry the UI test once the SPA renders interactive elements; then: create a valid account, create two transactions (ensuring account is selected), delete one transaction, and verify the dashboard totals and settlement suggestions update immediately.

Because the SPA is currently unusable and server errors are preventing persistence, the requested verification cannot be performed. Please fix the backend/SPA issues and re-run the test. If a rerun is desired, provide confirmation and the environment will be rechecked and the remaining steps performed.

Test credentials used: teste@teste.com / teste123

Result: verification not completed. Action required: backend/SPA fix.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/eaeb4573-e4de-46b3-bf2d-be2da989c4fb
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Pairwise settlement algorithm correctness for three profiles
- **Test Code:** [TC011_Pairwise_settlement_algorithm_correctness_for_three_profiles.py](./TC011_Pairwise_settlement_algorithm_correctness_for_three_profiles.py)
- **Test Error:** Summary of actions and current status:
- Goal: Validate settlement engine minimal pairwise transfers for three profiles (A:+40, B:-30, C:-10) and assert suggested transfers (B pays A 30.00, C pays A 10.00).
- What was attempted: created account flow (user existed so logged in), navigated to Groups, opened New Group modal, filled group name 'Test Group', clicked 'Criar Grupo' twice.
- What happened: both group-creation attempts failed or became stuck. The modal shows 'Criando...' and many auto-closed alerts report: 'Erro ao criar grupo: upstream connect error or disconnect/reset before headers. retried and the latest reset reason: connection timeout'. Backend connectivity/timeouts prevented successful group creation and therefore prevented adding members and transactions.
- Result: Unable to create group or any profiles (A,B,C) or add transactions; settlement engine could not be exercised. No settlement suggestions could be observed or validated.
- Recommendation / next steps: retry group creation after backend connectivity is restored (server/upstream). Possible actions: retry clicking 'Criar Grupo' after ensuring backend is healthy, check server logs for upstream connection errors, or attempt from another environment. Once group creation succeeds, proceed to add members A, B, C, then create transactions to produce net balances A:+40, B:-30, C:-10 and verify settlement suggestions (expected minimal transfers: B->A 30.00, C->A 10.00, total transfers equal total owed; no extraneous transfers).
Because the backend connectivity issues blocked the required UI operations, the settlement validation could not be completed. Task status: success=false.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/6783b74c-d6e3-4d36-9189-4d431c725d98
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Rounding and fractional-cent handling preserves totals
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/1a3292a9-a694-4a5f-9f90-dc2dc9907db3
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Switch active month excludes other months from monthly close
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/a3b79ae9-4906-442f-a842-474105c66dc1
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Group scoping: transactions mapped to group do not appear in other group summaries
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/6de044e0-9d12-4d02-aab9-ffe4e924e176
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Category tagging optional and non-blocking
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/7235dfa6-f210-4828-a7c0-242a5fcc8420
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Manual card/bill record creation and status update (no bank integrations)
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/81f4af20-46ec-4881-8d0e-a339b20d3dd2
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017 Server-side validation rejects malformed transaction amounts
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/468d4336-c3b2-4dd3-936e-c57a13ebbed4
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018 Access control: user cannot access another account's data
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/e8f62f27-7f58-49e1-9830-58023a10a1a3
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019 Performance: dashboard recalculation under 500ms for ~400 transactions
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/1a88960d-2bd3-48e1-8465-77da19a5b052
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC020 Concurrency: simultaneous edits result in consistent final state
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/a16efe89-297a-47d6-a9de-89ca1e69870a
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC021 Date boundary/timezone handling assigns transaction to correct month
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/a26b452d-acb5-4ad8-ab3a-296edbf8083a
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC022 Net balances algebraic correctness with multiple incomes and expenses
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/dfb2cc19-3d3c-491b-8d04-0b5ec69419aa
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC023 Suggested transfer equals owed amount in two-profile simple case
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/185f95af-660b-4c61-949a-9ddaf9991a9a
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC024 UI: immediate recalculation on transaction create without page reload
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/e3f9abce-bf3b-4864-9d9a-487275490073
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC025 Handle very large amounts without overflow and with correct arithmetic
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/68ce3ae6-1948-4df0-bbca-ac817ea22f0b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC026 Reject transaction with zero amount when not allowed
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/7160261e-a63e-479b-8e79-15e60f397baf
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC027 Profile removal updates settlements and prevents orphan data
- **Test Code:** [null](./null)
- **Test Error:** Test execution timed out after 15 minutes
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/b2795a46-83c8-4d26-acc7-12e80e581dad/14e2d607-d8a3-4b12-9883-0f5d0a0a3250
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **3.70** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---