# Graph Report - ybytu  (2026-09-15)

## Corpus Check
- 282 files · ~248,540 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 42 file(s) not represented in the graph (top: .csv 27, (none) 11, .css 2)

## Summary
- 925 nodes · 1342 edges · 124 communities (63 shown, 58 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.81)
- Token cost: 900,000 input · 1,100,000 output

## Community Hubs (Navigation)
- Dashboard Admin Screens
- ybytu-dashboard Config & Deps
- Nutrition Export Data Model
- Training Plan Generator
- Design Mockups (Nutrition/Account)
- Dashboard Layout & Access Control
- Plan Payload Builder
- Onboarding Pre-Launch Flow
- Protein/Food-Group Classification Audit
- Expo App Icon Config
- Staff Auth & Failed Plans
- ybytu-app Package Deps
- Training Plan Dashboard Screens
- ybytu-app Expo Dependencies
- ybytu-app Screen Components
- Dashboard Preview & Core Screens
- Auth Recovery Flows
- R2 Video Migration Matching
- ybytu-app Navigation & Home
- Dashboard Account/Food/Subscription Screens
- Meal Editor Admin Screen
- Internal Auth & Plan Share Tokens
- UserPlan Display Component
- Design Mockups (Notifications/Meal Plans)
- Training Export Schema & AI Cautions
- Deploy Drift Detection
- CORS & Campaign Stats Function
- Sessão 1 Application SQL Runbook
- Exercise Editor Admin Screen
- Silent Slot Degradation Test Case
- Silent Degradation Findings
- Admin Trainings Function
- Nutrition Catalog Schema Tables
- Dashboard Icon Sprite
- Ingredient Substitution Bug Cases
- "Não Sabia Que Não Sabia" Pattern
- Nutritionist/Personal Approval Gates
- MobileNav Route-Guard Gap
- Nutritionist Recipe Coverage Gaps
- Nutritionist Review Tables & Audits
- Dashboard Theme Context
- Meal Plan Creator Component
- UserDetail Admin Screen
- Fase B Blocking Decision
- Admin Tags Function
- Fabricated Data Detection
- ybytu-app Dev Dependencies
- ybytu-app NPM Scripts
- Onboarding Subscription Plans
- Account Screen Component
- More/Settings Screen Component
- Staff-Only Caution Audience Split
- Admin Meal Plans Function
- Admin Meals Function
- ybytu-app TypeScript Config
- Dashboard Preview Fixtures
- UserDetail Sub-Helpers
- Design Mockups (Login/Mobile)
- Foods Schema Text-Array Bug
- WhatsApp Webhook Deno Imports
- WhatsApp Webhook HMAC Verification
- Admin Equipments Function
- Admin Exercises Function
- Admin Foods Function
- ybytu-app Metro Config
- App Auth Sign-In/Sign-Up
- ProfileScreen Component
- Dashboard Entrypoint Files
- MealPlanCreator Save/Load
- Design Mockups (Conta/Dashboard)
- Local Dev Environment Debt
- Pilot Launch State Notes
- Restriction Tokens Schema
- Post-Pilot Email Templates
- ybytu-app MCP Config
- Meals Screen Fetch
- StartTraining Fetch
- Trainings Screen Fetch
- Vercel Rewrites Config
- Email Confirmation Decision
- Personal Trainer Safe-Exercises Bug
- UserDetail Adherence/Freeze Pendencies
- Deploy Script Entrypoint
- Deploy Functions Script
- Detect Silent Revert Script
- Branding Icon Asset
- Branding Icon Asset
- Branding Icon Asset
- Branding Icon Asset
- Branding Icon Asset
- Branding Icon Asset
- Branding Icon Asset
- Branding Icon Asset
- Branding Icon Asset
- Branding Icon Asset
- Branding Icon Asset
- Branding Icon Asset
- Branding Icon Asset
- Branding Icon Asset
- Branding Hero Image
- Branding Icon Asset
- Branding Icon Asset
- React Logo Asset
- Branding Icon Asset
- Vite Logo Asset
- Branding Icon Asset
- Branding Icon Asset
- Branding Icon Asset
- Branding Icon Asset
- Deprecated Restriction IDs Column
- UserDetail Post-Pilot Pendencies
- Personal Trainer Review Notes
- Personal Trainer Review Notes
- Personal Trainer Review Notes
- Schema.md Table Doc
- Schema.md Table Doc
- Schema.md Table Doc
- Schema.md Table Doc
- Schema.md Table Doc
- Sessão 2 Cycle Goals
- Stale Plan Badge Pendency

## God Nodes (most connected - your core abstractions)
1. `react-router-dom` - 34 edges
2. `corsHeadersFor()` - 27 edges
3. `ThemeToggle()` - 22 edges
4. `invokeFunction()` - 21 edges
5. `resolveStaffFromRequest()` - 19 edges
6. `react-native` - 16 edges
7. `lucide-react-native` - 14 edges
8. `supabase` - 13 edges
9. `supabase` - 13 edges
10. `requireRole()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `UsuarioDetalhe.dc.html — user detail screen mockup` --semantically_similar_to--> `meal_plans.restriction_tags left stale after ingredient repair`  [INFERRED] [semantically similar]
  designs/UsuarioDetalhe.dc.html → docs/AUDITORIA_DADOS_20260831.md
- `derivePlanPreference confia em dietary_preference sem checar ingredientes` --references--> `derivePlanPreference()`  [EXTRACTED]
  docs/CRITERIO_FOOD_GROUP_E_PROTEINA_20260902.md → supabase/functions/ybytu-generate-meal-plan/index.ts
- `ybytu-dashboard preview/index.html (Biblioteca de Exercícios preview)` --conceptually_related_to--> `Exercicios.dc.html (Biblioteca de Exercícios screen mockup)`  [INFERRED]
  apps/ybytu-dashboard/preview/index.html → designs/Exercicios.dc.html
- `invoke()` --calls--> `invokeFunction()`  [EXTRACTED]
  apps/ybytu-dashboard/src/services/trainingService.js → apps/ybytu-dashboard/src/services/apiClient.js
- `vite preview config for dashboard fixtures` --references--> `ybytu-dashboard preview/index.html (Biblioteca de Exercícios preview)`  [EXTRACTED]
  README.md → apps/ybytu-dashboard/preview/index.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Deploy-drift audit pattern (Caso 9)** — readme_deploy_functions, readme_check_stale_deploys, readme_caso_9_coco_token, readme_stale_deploy_crlf_lf_gotcha [EXTRACTED 1.00]
- **Post-onboarding plan generation + notification flow** — apps_onboardingprelaunch_fn_generate_meal_plan, apps_onboardingprelaunch_fn_generate_training_plan, apps_onboardingprelaunch_fn_notify_plan_ready, apps_onboardingprelaunch_fn_create_plan_share_token, apps_onboardingprelaunch_sequential_invoke_rationale [EXTRACTED 1.00]
- **Dietary preference / restriction consistency logic** — apps_onboardingprelaunch_dietary_restriction_blocks, apps_onboardingprelaunch_redundant_restrictions_removed, apps_onboardingprelaunch_handleselect [EXTRACTED 1.00]
- **Silent slot degradation investigation and fix (fifth fail-open)** — docs_achado_degradacao_silenciosa_20260904, docs_armadilhas_schema, concept_muscle_category_map [EXTRACTED 0.90]
- **Ingredient substitution correction and nutritionist approval chain** — docs_analise_padroes_substituicao_nutricao, docs_aprovacao_nutricionista_reversao, docs_auditoria_refeicoes_ativas_consolidado_20260902 [INFERRED 0.85]
- **Allergen-not-announced-in-name audit (active + inactive meals)** — docs_alergeno_nao_anunciado_ativas_20260901, docs_alergeno_nao_anunciado_inativas_20260901, concept_allergen_not_announced_pattern [EXTRACTED 0.90]
- **Ciclo Sessão 1: procedimento de aplicação, script SQL e encerramento** — docs_procedimento_aplicacao_sessao_1_20260906_procedimento, scripts_aplicacao_sessao1_20260904_sql, docs_encerramento_sessao1_20260913_encerramento [EXTRACTED 1.00]
- **Cadeia de segurança de alérgeno: allergen_review_status, RPC de match, Fase B** — allergen_review_status_column, ybytu_match_meals_ybytu_match_meal_plans_rpc, fase_b_bloqueio_automatico_nunca_implementado [EXTRACTED 1.00]
- **Casamento R2 x Drive: listagem bruta, revisão manual e sem correspondência** — docs_r2_listagem_bruta_20260908_txt, docs_r2_revisao_manual_20260908_revisao, docs_r2_sem_correspondencia_20260908_sem_correspondencia [EXTRACTED 1.00]
- **Meal ingredient-substitution bug found identically by 3 independent audits (ingredients, instructions, names)** — docs_revisao_nutricionista_meal_catalog_bug, docs_sessao_2_auditoria_instrucoes_20260902_completude_inflada, docs_sessao_2_auditoria_nomes_20260903_offset_terceira_vez [INFERRED 0.90]
- **AI-generated safety content (allergens + exercise cautions) in production without human review, both blocked on nutritionist/personal trainer sessions** — docs_revisao_nutricionista_alergenos_486_foods_20260901_fase_b_never_implemented, docs_sessao_1_personal_20260903_13_regras_caution_ai, docs_export_treino_20260903_readme_tarefa7_ai_suggested_unreviewed [INFERRED 0.90]
- **Sessão 1 internal technical docs paired with simplified send versions for nutritionist and personal trainer** — docs_sessao_1_nutricionista_20260902_internal, docs_sessao_1_nutricionista_para_envio_20260905_decisoes, docs_sessao_1_personal_20260903_internal [EXTRACTED 1.00]

## Communities (124 total, 58 thin omitted)

### Community 0 - "Dashboard Admin Screens"
Cohesion: 0.06
Nodes (30): Campaign, Dashboard, Equipment, FoodEditor, MealPlans, Tags, buildGrowthPath(), Dashboard() (+22 more)

### Community 1 - "ybytu-dashboard Config & Deps"
Cohesion: 0.05
Nodes (39): dependencies, dotenv, react, react-dom, react-router-dom, @supabase/supabase-js, devDependencies, eslint (+31 more)

### Community 2 - "Nutrition Export Data Model"
Cohesion: 0.05
Nodes (39): Modelo de dados nutrição - restriction_tokens/food_restriction_tags não lidos em runtime, ybytu_match_meal_plans RPC, ybytu_match_meals RPC, Export catálogo de nutrição 2026-09-01, analise_alergenos_v5.csv - proposta original com viés de remoção, Coco como tree_nuts - debate FDA vs Anvisa, Critério alimento simples vs prato composto, Decisão: exibir badge de alérgeno em vez de desativar refeição (+31 more)

### Community 3 - "Training Plan Generator"
Cohesion: 0.06
Nodes (23): buildSplitSlots(), CARDIO_EXERCISE_NAMES, CAUTION_MESSAGES, CORE_EXERCISE_NAMES, DEFAULT_CADENCE, DEFAULT_REPS_BY_ROLE, DesignedSlotSpec, fetchMoldeSlotsWithMuscles() (+15 more)

### Community 4 - "Design Mockups (Nutrition/Account)"
Cohesion: 0.07
Nodes (33): AlimentoEditor.dc.html (Food editor screen mockup), Alimentos.dc.html (Banco de Alimentos screen mockup), Assinaturas.dc.html (Subscriptions screen mockup), ConstrutorPlano.dc.html (Training Plan Builder mockup — Treino A Peito & Tríceps), ConstrutorPlanoAlimentar.dc.html (Meal Plan Builder mockup — Segunda-feira), DesignSystem.dc.html (Ybytu Admin Dashboard Design System), Avatars component spec, Badges & Status component spec (+25 more)

### Community 5 - "Dashboard Layout & Access Control"
Cohesion: 0.10
Nodes (18): DashboardLayout, FailedPlans, InviteStaff, DashboardLayout(), FailedPlans(), formatDate(), SUB_LABEL, ROLES (+10 more)

### Community 6 - "Plan Payload Builder"
Cohesion: 0.11
Nodes (28): ALLERGEN_TOKENS_FOR_BADGE, ANCHOR_MINUTES_BY_TYPE, bmiClassPtbr(), buildCalendar(), buildNutritionSection(), buildPlanPayload(), buildReviewSection(), buildTrainingSection() (+20 more)

### Community 7 - "Onboarding Pre-Launch Flow"
Cohesion: 0.09
Nodes (26): client-side gate before server truth caused 0 staff notifications (2026-08-26/27), dedicated_days_per_week 3-5 range (PT-confirmed rationale), DIETARY_RESTRICTION_BLOCKS_BY_PREFERENCE map, edge function: ybytu-create-plan-share-token, edge function: ybytu-generate-meal-plan, edge function: ybytu-generate-training-plan, edge function: ybytu-notify-onboarding-received, edge function: ybytu-notify-plan-ready (+18 more)

### Community 8 - "Protein/Food-Group Classification Audit"
Cohesion: 0.09
Nodes (17): Auditoria externa: 16/20 falso positivo de 'sem proteína', Cálculo de proteína real de uma refeição, derivePlanPreference confia em dietary_preference sem checar ingredientes, food_group_id nunca responde 'tem proteína?', food_group_id classifica por natureza, nunca recalculado, meal_plans.restriction_tags — abandonado como fonte primária clínica, callGroq(), derivePlanPreference() (+9 more)

### Community 9 - "Expo App Icon Config"
Cohesion: 0.09
Nodes (22): backgroundColor, foregroundImage, adaptiveIcon, edgeToEdgeEnabled, expo, android, icon, ios (+14 more)

### Community 10 - "Staff Auth & Failed Plans"
Cohesion: 0.15
Nodes (9): requireRole(), resolveStaffFromRequest(), StaffInfo, StaffResolution, SUBSCRIPTION_PLANS, VALID_ROLES, REVIEW_ROLES, VALID_ROLES (+1 more)

### Community 11 - "ybytu-app Package Deps"
Cohesion: 0.10
Nodes (19): react, react-dom, @supabase/supabase-js, @types/react, main, name, private, version (+11 more)

### Community 12 - "Training Plan Dashboard Screens"
Cohesion: 0.12
Nodes (12): TrainingPlan, TrainingPlanCreator, Trainings, DAY_LETTERS, TrainingPlan(), EMPTY_PLAN, EMPTY_SLOTS, TrainingPlanCreator() (+4 more)

### Community 13 - "ybytu-app Expo Dependencies"
Cohesion: 0.11
Nodes (19): dependencies, expo, expo-av, expo-status-bar, lucide-react-native, nativewind, react, react-dom (+11 more)

### Community 14 - "ybytu-app Screen Components"
Cohesion: 0.40
Nodes (5): Navbar(), Topbar(), supabase, lucide-react-native, react-native

### Community 15 - "Dashboard Preview & Core Screens"
Cohesion: 0.16
Nodes (13): SCREENS, Exercises, Login, Users, Exercises(), LEVEL_COLORS, levelStyle(), resolveR2Media() (+5 more)

### Community 16 - "Auth Recovery Flows"
Cohesion: 0.17
Nodes (8): AcceptInvite, ForgotPassword, ResetPassword, SharedPlan, ERROR_MESSAGES, SharedPlan(), YbytuLogo(), supabase

### Community 17 - "R2 Video Migration Matching"
Cohesion: 0.13
Nodes (17): 65 arquivos do R2 sem exercício correspondente no CSV, 7 exercícios do CSV sem arquivo correspondente no R2, Achado crítico: ex_062/ex_068/ex_179 zerados como 404 têm candidato quase idêntico no R2, Ambiguidade por colisão de nome (48 grupos, exercícios duplicados compartilhando vídeo), Casamento por nome: R2 filename × exercises.name_ptbr, Correção de rota: R2 puro em vez de Cloudflare Stream, Custom Domain videos.ybytu.app avaliado e descartado, getVideoUrl/getThumbnailUrl — chave de objeto, não URL completa (+9 more)

### Community 18 - "ybytu-app Navigation & Home"
Cohesion: 0.13
Nodes (12): App(), Stack, HomeScreen(), LoginScreen(), NutritionScreen(), RegisterScreen(), StartTrainingScreen(), TrainingScreen() (+4 more)

### Community 19 - "Dashboard Account/Food/Subscription Screens"
Cohesion: 0.17
Nodes (6): CreateAccount, Foods, Subscriptions, UserPlanPage, Foods(), LoadingFallback()

### Community 20 - "Meal Editor Admin Screen"
Cohesion: 0.16
Nodes (9): MealEditor, Meals, EMPTY, MealEditor(), MEAL_TYPE_ICON, Meals(), ThemeToggle(), useTheme() (+1 more)

### Community 21 - "Internal Auth & Plan Share Tokens"
Cohesion: 0.22
Nodes (8): Débito: alerta via parâmetro fullName do template WhatsApp, isInternalServiceCall(), generatePlanShareToken(), getOrCreatePlanShareToken(), doSendWhatsAppTemplate(), sendWhatsAppTemplate(), ROLE_PHONE_ENV, WhatsApp business-initiated: obrigatório template pré-aprovado (HSM)

### Community 22 - "UserPlan Display Component"
Cohesion: 0.18
Nodes (10): abbrevWeekday(), BMI_COLOR, findMenuCalendarInfo(), formatIssuedDate(), GOAL_LABELS, initials(), macroPercents(), MEAL_ICONS (+2 more)

### Community 23 - "Design Mockups (Notifications/Meal Plans)"
Cohesion: 0.41
Nodes (13): meal_plans.restriction_tags left stale after ingredient repair, MobileNav.dc.html — bottom mobile nav component, Notificacoes.dc.html — notifications screen mockup, PlanosAlimentares.dc.html — meal plans catalog mockup, designs/README.md — mockup sync policy doc, RefeicaoEditor.dc.html — meal/recipe editor mockup, Refeicoes.dc.html — meals catalog mockup, Sidebar.dc.html — shared admin sidebar nav component (+5 more)

### Community 24 - "Training Export Schema & AI Cautions"
Cohesion: 0.17
Nodes (12): ambiente_permitido derivado por regra de código, não coluna de tabela, exercises table has no is_active column (no deactivation mechanism), Export catálogo de treino 2026-09-03, Tarefa 7 - 323 exercise_condition_proposals nunca revisadas, já em produção, exercise_condition_proposals table schema, exercise_effective_cautions view schema, exercises table schema, 13 regras de caution/avoid geradas por IA sem revisão humana (+4 more)

### Community 25 - "Deploy Drift Detection"
Cohesion: 0.21
Nodes (11): deployedBySlug, FUNCTIONS_DIR, isDirty(), lastCommitEpoch(), localSlugs, problems, REPO_ROOT, rows (+3 more)

### Community 26 - "CORS & Campaign Stats Function"
Cohesion: 0.24
Nodes (4): ALLOWED_ORIGINS, corsHeadersFor(), REVIEW_ROLES, VALID_ROLES

### Community 27 - "Sessão 1 Application SQL Runbook"
Cohesion: 0.22
Nodes (10): Encerramento Sessão 1 (2026-09-13), Piso mínimo de proteína (20g/15g/10g) — decidido, não implementado, Pendências pós-piloto (2026-09-13), Procedimento — aplicar as respostas da Sessão 1, docs/SQL_EXPANSAO_ONBOARDING_PHYSICAL_CONDITIONS_20260904.sql (7 opções novas), scripts/aplicacao_sessao1_20260904.sql (Seção A aplicada), scripts/aplicacao_sessao1_secao_b_personal_20260913.sql (Seção B aplicada), scripts/coco_token_e_opcao_onboarding_20260913.sql (+2 more)

### Community 28 - "Exercise Editor Admin Screen"
Cohesion: 0.29
Nodes (4): ExerciseEditor, EMPTY, ExerciseEditor(), toggleInArray()

### Community 29 - "Silent Slot Degradation Test Case"
Cohesion: 0.25
Nodes (8): Caso 3: gerador de treino preenchia slot errado calado (degradação silenciosa), Combinação que aciona o caso: beginner+bodyweight+pregnancy+emagrecimento 4x/sem, commit ad8afe5 — fix de dedupe (mesmo exercise_id repetia 3x), Conta <email-redacted> — signup órfão sem contexto, Perfil de teste reutilizável — degradação silenciosa de slot, ex_194 (Flexão de braço pegada fechada) — avoid_health_conditions_ids=['pregnancy'], Verificação C-B1: pool esvaziado por nível (exercicios_sobrando_pior_caso=0), Verificação C-B3: alunos já expostos a exercício recém-contraindicado

### Community 30 - "Silent Degradation Findings"
Cohesion: 0.32
Nodes (8): Allergen not announced in recipe name (fail-open pattern), deterministicPick alphabetical fail-open bug (5th fail-open), MUSCLE_CATEGORY_MAP — 4-bucket day-label heuristic, not a muscle hierarchy, Silent slot degradation finding (2026-09-04), Alérgeno não anunciado — refeições ativas (2026-09-01), Alérgeno não anunciado — refeições inativas (2026-09-01), Armadilhas de schema (nomes que enganam), Checklist do primeiro aluno real

### Community 31 - "Admin Trainings Function"
Cohesion: 0.29
Nodes (4): listToPgArray(), MOLDE_IDS, PLAN_WRITABLE_FIELDS, sanitizePlan()

### Community 32 - "Nutrition Catalog Schema Tables"
Cohesion: 0.29
Nodes (7): allergen_review_status (reviewed_none/reviewed_has_allergens/unreviewed), docs/MODELO_DE_DADOS.md corrigido (mito de bloqueio automático), Modelo de Dados do Catálogo de Nutrição Ybytu, foods (base genérica de alimentos), meal_plan_meals (distribuição das refeições), meal_plans (envelope do plano alimentar), meals (nome, instruções, ingredients_json)

### Community 33 - "Dashboard Icon Sprite"
Cohesion: 0.29
Nodes (7): icons.svg (sprite sheet), bluesky-icon, discord-icon, documentation-icon, github-icon, social-icon, x-icon

### Community 34 - "Ingredient Substitution Bug Cases"
Cohesion: 0.29
Nodes (7): Caso 1: refeições com ingrediente errado servidas sem sinal, docs/NUTRICIONISTA_SUBSTITUICOES_INGREDIENTES_20260901.csv, Proposta combinada — Moqueca (meal_112): troca de peixe + correção de fruta, food_080 Maçã — defeito de offset (deveria ser banana-da-terra), food_285 Tilápia grelhada (proposta de substituição), food_290 Cação cozido, meal_112 Moqueca Leve de Cação e Banana-da-Terra (is_active=false)

### Community 35 - ""Não Sabia Que Não Sabia" Pattern"
Cohesion: 0.33
Nodes (7): Caso 4: notificação de staff nunca disparou (2 onboardings reais), Caso 5: admin não conseguia registrar parecer (seletor nunca renderizava), Caso 8: código em produção que não existia no git, Caso 9: commit sem deploy (token 'coco' não deployado 5 dias), Padrão: 'o sistema não sabia que não sabia' (9 casos), scripts/check-stale-deploys.sh (auditoria periódica commit vs deploy), scripts/deploy-functions.sh (guarda contra deploy sem commit)

### Community 36 - "Nutritionist/Personal Approval Gates"
Cohesion: 0.33
Nodes (7): Systematic ingredient-substitution offset bug (99 meals), Nutritionist-must-approve gate before bulk catalog fixes, Análise de Padrões — Substituição de Ingredientes (superseded), Aprovação — Reversão de Ingredientes Errados (superseded), Aprovação — Vídeos e Capas Sem Correspondência (Personal, R2), Auditoria de proteína real — almoço/jantar ativos (2026-09-02), Auditoria de refeições ativas — consolidado (2026-09-02)

### Community 37 - "MobileNav Route-Guard Gap"
Cohesion: 0.29
Nodes (7): designs/MobileNav.dc.html (mockup com 5 itens incluindo 'Mais'), Não existe guard de rota no client (achado), ProtectedRoute/RequireRole no client — não implementado, Pendência: logout inalcançável no mobile (não urgente), MobileNav.jsx (4 itens, falta 'Mais'), Sidebar.jsx/MobileNav.jsx — filtro de navegação por papel (PR 2026-09-01), ybytu-admin-users/index.ts:24 requireRole (barreira real server-side)

### Community 38 - "Nutritionist Recipe Coverage Gaps"
Cohesion: 0.29
Nodes (7): Pedido de Novas Receitas — Lacunas de Cobertura do Cardápio, Gap moderado: Pescetariano × Almoço (2 opções ativas), Gap crítico: Pescetariano × Café da manhã (0 opções ativas), Gap alto: Pescetariano × Jantar (1 opção ativa), Gap alto: Pescetariano × Lanche (1 opção ativa), Gap moderado: Vegetariano × Jantar (2 opções ativas), Vegano conferido — sem lacuna crítica (mín. 3 opções em todas refeições)

### Community 39 - "Nutritionist Review Tables & Audits"
Cohesion: 0.33
Nodes (7): 49.5% meal ingredient/name mismatch bug, Padrões recorrentes de substituição de ingrediente, Tabela A - 74 refeições desativadas, Tabela B - 25 refeições ainda ativas com bug, Auditoria instruções de preparo - categoria Completude inflada pelo bug de offset, Auditoria de nomes - mesmo bug de offset visto pela terceira vez, Pizza de Frigideira Low Carb - feita quase só de ovos

### Community 40 - "Dashboard Theme Context"
Cohesion: 0.47
Nodes (3): App(), ThemeProvider(), ThemeContext

### Community 41 - "Meal Plan Creator Component"
Cohesion: 0.40
Nodes (4): MealPlanCreator, ChipMultiSelect(), EMPTY_PLAN, EMPTY_SLOTS

### Community 42 - "UserDetail Admin Screen"
Cohesion: 0.33
Nodes (4): UserDetail, GOAL_LABELS, MEALS_PER_DAY_LABELS, VALID_TABS

### Community 43 - "Fase B Blocking Decision"
Cohesion: 0.33
Nodes (6): Caso 2: alimento não revisado servido sem aviso (Fase B mito), dietary_restrictions.excludes_tokens (bloqueio real declarado), Meio-termo futuro: bloqueio por aluno (não por catálogo), Decisão Fase B: manter só o aviso, não implementar bloqueio, Fase B: bloqueio automático nunca implementado (mito corrigido), RPC ybytu_match_meals/ybytu_match_meal_plans

### Community 44 - "Admin Tags Function"
Cohesion: 0.33
Nodes (3): WRITABLE_FIELDS_DIET, WRITABLE_FIELDS_FUNCTIONAL, WRITABLE_FIELDS_TAGS

### Community 45 - "Fabricated Data Detection"
Cohesion: 0.50
Nodes (5): apps/ybytu-app (app do aluno, fora do escopo do piloto), Caso 6: dado fabricado exibido como real (Users.jsx/Login.jsx), Pendência: varredura de dado fabricado em apps/ybytu-app (não agora), Técnica: comparação tela por tela contra mockup de origem, Técnica: literal cru vs. variável interpolada (grep fabricação numérica)

### Community 46 - "ybytu-app Dev Dependencies"
Cohesion: 0.40
Nodes (5): devDependencies, babel-preset-expo, tailwindcss, @types/react, typescript

### Community 47 - "ybytu-app NPM Scripts"
Cohesion: 0.40
Nodes (5): scripts, android, ios, start, web

### Community 48 - "Onboarding Subscription Plans"
Cohesion: 0.40
Nodes (3): Onboarding(), SUBSCRIPTION_PLANS, @react-native-community/slider

### Community 49 - "Account Screen Component"
Cohesion: 0.50
Nodes (4): Account, Account(), initials(), ROLE_LABELS

### Community 50 - "More/Settings Screen Component"
Cohesion: 0.50
Nodes (4): More, initials(), More(), ROLE_LABELS

### Community 51 - "Staff-Only Caution Audience Split"
Cohesion: 0.40
Nodes (5): buildPlanPayload(supabase, userId, audience) — padrão staff/student, Caso 7: zero linha retornada lida como 'sem problema' (JOIN sem match), Débito: separar aviso de cautela por público (staff vs. aluno), scripts/aplicacao_sessao1_20260904.sql Seção B2 — Regra 7 pendente, CAUTION_MESSAGES (ybytu-generate-training-plan/index.ts:~1190)

### Community 54 - "ybytu-app TypeScript Config"
Cohesion: 0.50
Nodes (3): compilerOptions, extends, expo/tsconfig.base

### Community 55 - "Dashboard Preview Fixtures"
Cohesion: 0.50
Nodes (3): EXERCISES, exerciseService, LOOKUPS

### Community 57 - "Design Mockups (Login/Mobile)"
Cohesion: 0.50
Nodes (4): EsqueciSenha.dc.html (Forgot password screen mockup), Login.dc.html (Acessar painel / Entrar screen mockup), Mais.dc.html (Mais / More menu screen mockup), Mobile.dc.html (mobile app screens mockup — login, notifications, mais)

### Community 58 - "Foods Schema Text-Array Bug"
Cohesion: 0.50
Nodes (4): foods table schema, foods.*_ids colunas TEXT disfarçadas de array, 6 colunas de taxonomia de alimentos sem FK real, 56 foods com food_source_id='mixed' - lacuna de vocabulário

### Community 59 - "WhatsApp Webhook Deno Imports"
Cohesion: 0.50
Nodes (3): imports, @supabase/functions-js, @supabase/server

### Community 67 - "Dashboard Entrypoint Files"
Cohesion: 0.67
Nodes (3): ybytu-dashboard index.html, ybytu-dashboard README (Vite React template), src/main.jsx entrypoint (referenced)

### Community 69 - "Design Mockups (Conta/Dashboard)"
Cohesion: 0.67
Nodes (3): Conta.dc.html (Minha Conta / Admin account screen mockup), CriarConta.dc.html (Create account screen mockup), Dashboard.dc.html (Visão Geral / admin dashboard overview mockup)

### Community 70 - "Local Dev Environment Debt"
Cohesion: 0.67
Nodes (3): Page.printToPDF do CDP como alternativa ao diálogo nativo de impressão, Débito: não existe ambiente local funcional, supabase/functions/_shared/cors.ts (allowlist fixa sem localhost)

### Community 71 - "Pilot Launch State Notes"
Cohesion: 0.67
Nodes (3): Estado do lançamento do piloto (2026-09-02), Domínio Resend send.ybytu.app — verificação inconclusiva, Tela de staff (/users/:id/plano, /dashboard) travada — novo achado

### Community 72 - "Restriction Tokens Schema"
Cohesion: 0.67
Nodes (3): 3 estados de allergen_review_status, food_restriction_tags table, restriction_tokens table (vocabulário fechado 20 tokens)

### Community 73 - "Post-Pilot Email Templates"
Cohesion: 0.67
Nodes (3): Duplicação de templates de e-mail resolvida (commit 54ec53be), Ideia registrada: e-mail de fallback quando WhatsApp falhar no envio, Templates 04-entrega-do-plano.html / 09-plano-aluno-a-validar.html

## Ambiguous Edges - Review These
- `OnboardingApp React component` → `supabase.auth.signUp call`  [AMBIGUOUS]
  apps/OnboardingPreLaunch.html · relation: semantically_similar_to
- `Sessão 2 - texto CYCLE_EXPECTATIONS_BY_GOAL nas Metas do Ciclo` → `Sessão 2 - texto CYCLE_EXPECTATIONS_BY_GOAL nas Metas do Ciclo`  [AMBIGUOUS]
  docs/SESSAO_2_METAS_DO_CICLO_20260904.md · relation: references

## Knowledge Gaps
- **330 isolated node(s):** `supabase`, `Stack`, `name`, `slug`, `version` (+325 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 467 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **58 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `OnboardingApp React component` and `supabase.auth.signUp call`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **What is the exact relationship between `Sessão 2 - texto CYCLE_EXPECTATIONS_BY_GOAL nas Metas do Ciclo` and `Sessão 2 - texto CYCLE_EXPECTATIONS_BY_GOAL nas Metas do Ciclo`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `react-router-dom` connect `Dashboard Preview & Core Screens` to `Dashboard Admin Screens`, `ybytu-dashboard Config & Deps`, `Dashboard Layout & Access Control`, `Meal Plan Creator Component`, `UserDetail Admin Screen`, `Training Plan Dashboard Screens`, `Auth Recovery Flows`, `Account Screen Component`, `More/Settings Screen Component`, `Dashboard Account/Food/Subscription Screens`, `Meal Editor Admin Screen`, `Exercise Editor Admin Screen`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `corsHeadersFor()` connect `CORS & Campaign Stats Function` to `Training Plan Generator`, `Protein/Food-Group Classification Audit`, `Staff Auth & Failed Plans`, `Admin Tags Function`, `Admin Meal Plans Function`, `Admin Meals Function`, `Internal Auth & Plan Share Tokens`, `Admin Trainings Function`, `Admin Equipments Function`, `Admin Exercises Function`, `Admin Foods Function`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `supabase`, `Stack`, `name` to the rest of the system?**
  _330 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dashboard Admin Screens` be split into smaller, more focused modules?**
  _Cohesion score 0.0596078431372549 - nodes in this community are weakly interconnected._
- **Should `ybytu-dashboard Config & Deps` be split into smaller, more focused modules?**
  _Cohesion score 0.05204872646733112 - nodes in this community are weakly interconnected._