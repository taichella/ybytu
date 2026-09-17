Viewed UserPlan.jsx:800-860
Viewed UserPlan.jsx:720-770
Viewed UserPlan.jsx:120-145
Searched for "<UserPlan"
Searched for "UserPlan"
Viewed UserPlanPage.jsx:1-95
Viewed UserPlan.jsx:30-60
Viewed UserPlan.jsx:140-180
Viewed Login.jsx:35-60
Searched for "catch"
Viewed AcceptInvite.jsx:40-65
Viewed App.jsx:1-40
Viewed Sidebar.jsx:1-60
Viewed UserDetail.jsx:410-440
Viewed Campaign.jsx:1-50
Viewed Campaign.jsx:50-100
Viewed TrainingPlan.jsx:1-60
Viewed TrainingPlan.jsx:100-180
Viewed MealPlanCreator.jsx:1-60
Viewed MealEditor.jsx:1-65

# Relatório de Revisão Somente Leitura — Frontend React/Vite (Ybytu Dashboard)

**Data:** 17 de setembro de 2026  
**Escopo:** `apps/ybytu-dashboard` e contratos compartilhados com as Edge Functions do Supabase.  
**Modo:** Somente leitura (nenhum arquivo foi alterado, nenhum commit ou migração foi executado).

---

## 1. Respostas aos 5 Pontos Específicos

### 1.1. Dado Fabricado (Valores literais no JSX onde deveria haver variável)
* **`UserPlan.jsx:520`**: Os badges `<span className="pill pro">Plano Pro</span>` e `<span className="pill ok">Onboarding completo</span>` estão fixos no cabeçalho do documento do aluno. Usuários com planos `Free` ou `Start`, ou alunos cujo onboarding está incompleto, recebem a folha oficial exibindo que são "Plano Pro" e com "Onboarding completo".
* **`UserPlan.jsx:509`**: `<p className="eyebrow">Desafio {meta.cycle_days || 15} dias</p>` mascara ciclos com valor ausente ou de duração diferente cravando o literal `15`.
* **`FailedPlans.jsx:44-46, 115`**: Quando a tentativa de reprocessamento falha, `parts.push('treino: ' + (result.results.training.ok ? 'ok' : 'falhou'))` gera uma string que **não** começa com `"Erro"`. O ternário de cor na linha 115 (`retryResult[p.id].startsWith('Erro') ? '#dc2626' : '#16a34a'`) pinta o texto de **verde** (`#16a34a`). A falha operacional é apresentada ao profissional como sucesso.
* **`Dashboard.jsx:210`**: Esqueleto de carregamento com tamanho fixo `Array.from({ length: 5 })`, enquanto o array real `cards` possui 6 métricas operacionais (linhas 56–63).

---

### 1.2. Estado Vazio Tratado como Seguro (Arrays vazios exibidos como "seguro/sem restrições")
* **`UserDetail.jsx:574, 583, 643, 652`**: Nos cards de parecer do Personal e do Nutricionista, `resolvedLabels?.physicalConditions?.length > 0 ? ... : <span>Nenhuma limitação declarada</span>` e `resolvedLabels?.dietaryRestrictions?.length > 0 ? ... : <span>Nenhuma limitação declarada</span>`. Se o array for vazio ou `null`, a interface afirma taxativamente que o aluno *declarou não ter nenhuma limitação*, dando falsa garantia clínica. Na aba "Saúde & metas" (linhas 444 e 453), o mesmo estado vazio é tratado corretamente como `"Não informado"`.
* **`UserPlan.jsx:571-590`**: Os blocos `{physicalLimitations.length > 0 && ...}` e `{healthLimitations.length > 0 && ...}` são simplesmente omitidos quando vazios no documento final de prescrição, sem indicar se o aluno não possui ou se os dados não foram coletados.
* **`UserPlan.jsx:884-899`**: O bloco de alérgenos da refeição é renderizado apenas se houver flag positiva. Caso os alérgenos não tenham sido auditados ou estejam pendentes de revisão, nenhuma sinalização de "não verificado/não informado" é exibida, exceto se a flag booleana `unverified` vier explicitamente preenchida.

---

### 1.3. Erro Engolido (HTTP 200 com `success: false` e catchs vazios)
* **`apiClient.js:32-40` (`invokeFunction`)**: O wrapper central valida apenas `if (error)` e `if (data?.error)`. As Edge Functions `ybytu-generate-meal-plan:473` (falha `no_safe_meals`) e `ybytu-generate-training-plan:873` (falha `no_safe_exercises`) retornam `new Response(JSON.stringify({ success: false, status: '...' }))` sem especificar código HTTP (logo, default **HTTP 200 OK**) e sem campo `error`. O `apiClient` retorna esse objeto como sucesso, fazendo o frontend acreditar que a operação foi bem-sucedida.
* **`Users.jsx:29-33`**: Não valida se `data` é um array ou objeto de erro em HTTP 200. Se o backend retornar `{ error: '...' }`, a linha 33 executa `data.map(...)` provocando `TypeError: data.map is not a function` sem tratamento amigável.
* **`UserPlanPage.jsx:39-44` e `UserDetail.jsx:196-198`**: A verificação `if (planRes.data && !planRes.error)` passa `planRes.data` diretamente para o estado `planPayload`. Se o endpoint retornar `{ error: 'not_found' }` com status 200, o objeto de erro é tratado como um plano legítimo, renderizando uma folha de treino e cardápio em branco sem sinalizar falha ao usuário.
* **Catchs vazios/supressivos**:
  * `Login.jsx:47`: `catch { isStaff = false; }` suprime falhas de rede/RPC durante a consulta de perfil administrativo, acusando erroneamente "Acesso negado" em vez de instabilidade de conexão.
  * `UserPlan.jsx:133`: `catch { setSaveState('error'); }` descarta o motivo do erro no salvamento de cargas.
  * `MealEditor.jsx:75`, `MealPlanCreator.jsx:78`, `TrainingPlanCreator.jsx:89`: Autocomplete silencioso sem telemetria em caso de falha de API.

---

### 1.4. ProtectedRoute & Autorização nas Rotas do Dashboard
* **Toda rota do dashboard exige papel? NÃO.**  
  O `DashboardLayout.jsx:28-37` apenas valida se o usuário possui sessão ativa e se `whoami?.isStaff === true`. As seguintes rotas **não** possuem `ProtectedRoute` com restrição de papel (`allowedRoles`):
  * `/dashboard`, `/users`, `/users/:id`, `/users/:id/plano`, `/review/:id`, `/campaign`, `/campaign/failed-plans`, `/account`, `/more`.
  * **Vulnerabilidade crítica de papel em `/subscriptions`**: Embora a barra lateral (`Sidebar.jsx:52`) esconda visualmente o link para não-admins, a rota `/subscriptions` em `App.jsx:98` **não** está envelopada em `ProtectedRoute allowedRoles={['admin']}`. Qualquer personal trainer ou nutricionista autenticado que digite a URL tem acesso à tela de assinaturas.
* **A rota `/review/:id` expõe dados de outro aluno ao trocar o id?**
  * **Entre Alunos:** Alunos não têm acesso a essa rota. O `DashboardLayout` rejeita contas sem flag `isStaff` e redireciona para `/login`. Os alunos acessam planos exclusivamente via token opaco público em `/plano/:token`.
  * **Entre Profissionais da Equipe (Vulnerabilidade IDOR / BOLA): SIM.** Qualquer membro da equipe (personal trainer ou nutricionista) autenticado que alterar o `:id` na barra de navegação carrega e visualiza a anamnese completa, telefones, restrições e plano de qualquer aluno da plataforma. O backend (`ybytu-admin-users` e `ybytu-get-plan-for-staff`) apenas confere se o solicitante é staff ativo, sem checar atribuição/vínculo entre aquele profissional e o aluno consultado. Além disso, o endpoint de parecer (`ybytu-submit-plan-review`) permite submeter parecer e editar cargas de qualquer aluno.

---

### 1.5. Regressões do Refactor
* **Props órfãs em `UserPlan.jsx:114`**: A assinatura `UserPlan({ payload, editable = false, onSaveLoads, staffRoles = [] })` preserva lógica de edição inline de cargas e séries (linhas 115–136, 727–770), mas nenhum chamador no app passa essas propriedades desde que a edição foi desacoplada para `UserDetail.jsx` e construtores dedicados.
* **Helper morto em `UserDetail.jsx:131`**: A constante `tabStyle` está declarada mas não é referenciada em nenhuma linha do componente.
* **Hook despadronizado em `UserDetail.jsx:144`**: Utiliza `useContext(StaffContext)` diretamente, enquanto o restante do dashboard utiliza o hook utilitário centralizado `useStaff()`.
* **Código duplicado em `UserDetail.jsx`**: Os blocos de renderização de restrições das linhas 565–586 (card do Personal) e 634–655 (card do Nutricionista) são cópias idênticas do mesmo JSX e compartilham o mesmo vício de estado vazio.

---

## 2. Tabela de Defeitos e Vulnerabilidades

| Severidade | arquivo:linha | Evidência | Correção Sugerida |
| :--- | :--- | :--- | :--- |
| **bloqueia piloto** | [apiClient.js:32-40](file:///c:/ybytu/apps/ybytu-dashboard/src/services/apiClient.js#L32-L40) | `invokeFunction` valida apenas `data?.error`. As Edge Functions `ybytu-generate-training-plan:873` e `ybytu-generate-meal-plan:474` retornam `{ success: false, status: 'no_safe_...' }` com HTTP 200. O cliente resolve com sucesso e engole a falha. | Checar `if (data?.success === false || data?.ok === false)` e lançar `new ApiError(data.message || data.status, data)`. |
| **bloqueia piloto** | [FailedPlans.jsx:44-46](file:///c:/ybytu/apps/ybytu-dashboard/src/components/FailedPlans.jsx#L44-L46) <br/> [FailedPlans.jsx:115](file:///c:/ybytu/apps/ybytu-dashboard/src/components/FailedPlans.jsx#L115) | Quando o reprocessamento falha, `parts` recebe `'treino: falhou'`. A linha 115 testa `retryResult[p.id].startsWith('Erro') ? '#dc2626' : '#16a34a'`. O texto de falha é exibido em **verde** como se tivesse dado certo. | Armazenar o status booleano estruturado `{ ok: boolean, text: string }` em vez de inspecionar prefixo de string, ou colorir vermelho caso contenha `'falhou'`. |
| **bloqueia piloto** | [App.jsx:98](file:///c:/ybytu/apps/ybytu-dashboard/src/App.jsx#L98) | `<Route path="/subscriptions" element={<Subscriptions />} />` não está envolvido em `ProtectedRoute allowedRoles={['admin']}`, permitindo que qualquer staff acesse a rota diretamente pela URL. | Mover a rota `/subscriptions` para dentro do bloco `<Route element={<ProtectedRoute allowedRoles={['admin']} ... />}>`. |
| **bloqueia piloto** | [UserPlan.jsx:520](file:///c:/ybytu/apps/ybytu-dashboard/src/components/UserPlan.jsx#L520) | `<div className="rw"><span className="pill pro">Plano Pro</span><span className="pill ok">Onboarding completo</span></div>` literais impressos em todos os planos gerados, inclusive usuários Start/Free ou com onboarding incompleto. | Interpolar `profile.subscription_name || meta.plan_tier || 'Plano Start'` e checar condicionalmente `profile.onboarding_completed`. |
| **bloqueia piloto** | [App.jsx:97](file:///c:/ybytu/apps/ybytu-dashboard/src/App.jsx#L97) <br/> [UserDetail.jsx:183-186](file:///c:/ybytu/apps/ybytu-dashboard/src/components/UserDetail.jsx#L183-L186) | Rota `/review/:id` não valida se o profissional logado possui atribuição ao aluno `:id`. Trocar o UUID expõe anamnese e dados de qualquer aluno cadastrado para qualquer profissional da equipe (IDOR). | Implementar verificação de vínculo entre staff e aluno no backend ou restringir no frontend a visualização aos alunos presentes na fila de pendências do profissional. |
| **bloqueia piloto** | [Users.jsx:29-33](file:///c:/ybytu/apps/ybytu-dashboard/src/components/Users.jsx#L29-L33) | `const { data } = await supabase.functions.invoke('ybytu-admin-users'); const mapped = data.map(...)` sem checar `Array.isArray(data)`. Resposta de erro em HTTP 200 causa crash de tela branca por `TypeError`. | Validar `if (!Array.isArray(data)) throw new Error(data?.error || 'Resposta inválida do servidor');` antes do `.map()`. |
| **bloqueia piloto** | [UserPlanPage.jsx:39-44](file:///c:/ybytu/apps/ybytu-dashboard/src/components/UserPlanPage.jsx#L39-L44) | `if (planRes.data && !planRes.error) setPlanPayload(planRes.data);` não confere se `planRes.data.error` existe. Se o plano não for encontrado em HTTP 200, injeta `{ error: 'not_found' }` em `<UserPlan />`, renderizando um documento em branco como válido. | Checar explicitamente `if (planRes.data && !planRes.data.error)` e exibir estado visual de erro caso `planRes.data.error` esteja presente. |
| **corrigir logo** | [UserDetail.jsx:574, 583](file:///c:/ybytu/apps/ybytu-dashboard/src/components/UserDetail.jsx#L574) <br/> [UserDetail.jsx:643, 652](file:///c:/ybytu/apps/ybytu-dashboard/src/components/UserDetail.jsx#L643) | `physicalConditions?.length > 0 ? ... : <span>Nenhuma limitação declarada</span>`. O estado vazio `[]` induz o profissional a crer que o aluno declarou não ter lesões, divergindo da aba Saúde (que exibe `"Não informado"`). | Substituir `"Nenhuma limitação declarada"` por `"Não informado"` quando o array for nulo ou vazio, preservando o princípio de não presumir segurança. |
| **corrigir logo** | [UserPlan.jsx:509](file:///c:/ybytu/apps/ybytu-dashboard/src/components/UserPlan.jsx#L509) | `<p className="eyebrow">Desafio {meta.cycle_days || 15} dias</p>` mascara ciclos nulos com fallback cravado em 15. | Utilizar `meta.cycle_days || (calendar.length > 0 ? calendar.length : null)` e exibir apenas se houver valor confiável. |
| **corrigir logo** | [Login.jsx:47](file:///c:/ybytu/apps/ybytu-dashboard/src/components/Login.jsx#L47) | Bloco `catch { isStaff = false; }` converte qualquer erro de rede ou indisponibilidade da Edge Function `ybytu-whoami` em negação de acesso ("Esta área é restrita"). | Tratar falhas de rede no `catch` setando `setError('Falha ao validar credenciais no servidor. Verifique sua conexão e tente novamente.')`. |
| **corrigir logo** | [UserPlan.jsx:133](file:///c:/ybytu/apps/ybytu-dashboard/src/components/UserPlan.jsx#L133) | `catch { setSaveState('error'); }` descarta silenciosamente o erro de `onSaveLoads` sem registrar telemetria nem notificar o motivo real. | Capturar `catch (err)` e exibir mensagem de erro específica ou salvar em estado para exibição em tooltip. |
| **pós-piloto** | [Dashboard.jsx:210](file:///c:/ybytu/apps/ybytu-dashboard/src/components/Dashboard.jsx#L210) | `(loading ? Array.from({ length: 5 }) : cards).map(...)` gera 5 cartões de skeleton enquanto `cards` possui 6 itens definidos nas linhas 56–63, provocando salto de layout. | Alterar o tamanho do skeleton para `Array.from({ length: 6 })` ou derivar dinamicamente. |
| **pós-piloto** | [UserPlan.jsx:114](file:///c:/ybytu/apps/ybytu-dashboard/src/components/UserPlan.jsx#L114) | As props `editable`, `onSaveLoads` e `staffRoles` em `UserPlan` não são passadas por nenhum componente chamador (`UserPlanPage.jsx` e `SharedPlan.jsx`), restando como código morto. | Remover as props e a lógica interna de edição de cargas de `UserPlan.jsx`, mantendo o componente estritamente voltado para renderização e impressão do documento. |
| **pós-piloto** | [UserDetail.jsx:131](file:///c:/ybytu/apps/ybytu-dashboard/src/components/UserDetail.jsx#L131) | Função de estilo `tabStyle` declarada e nunca utilizada no arquivo. | Remover declaração órfã. |
| **pós-piloto** | [UserDetail.jsx:144](file:///c:/ybytu/apps/ybytu-dashboard/src/components/UserDetail.jsx#L144) | Importa `StaffContext` e invoca `useContext(StaffContext)` em vez de utilizar o hook padronizado `useStaff()` disponibilizado em `staffContextCore.js`. | Substituir por `const staff = useStaff();`. |
| **pós-piloto** | [UserDetail.jsx:565-586](file:///c:/ybytu/apps/ybytu-dashboard/src/components/UserDetail.jsx#L565-L586) <br/> [UserDetail.jsx:634-655](file:///c:/ybytu/apps/ybytu-dashboard/src/components/UserDetail.jsx#L634-L655) | Código idêntico duplicado entre os cards de parecer do Personal e Nutricionista para renderizar condições físicas e alimentares. | Extrair para um subcomponente reutilizável (ex: `<UserLimitationsList resolvedLabels={resolvedLabels} />`). |

---

## 3. Recomendações Prioritárias para o Piloto

1. **Ajuste imediato de autorização de rotas (`App.jsx`)**: Envolver `/subscriptions` com `ProtectedRoute allowedRoles={['admin']}`.
2. **Correção do status de erro em `FailedPlans.jsx`**: Evitar que falhas no reprocessamento de planos sejam mascaradas com a cor verde na tela operacional.
3. **Endurecimento do `apiClient.js`**: Rejeitar payloads que retornem `success: false` ou `ok: false` mesmo sob HTTP 200, impedindo que pools vazios de treino/nutrição passem despercebidos pela equipe.
4. **Remoção de literais em `UserPlan.jsx`**: Substituir os pills fixos `"Plano Pro"` e `"Onboarding completo"` pelos atributos reais do perfil do aluno antes da emissão dos PDFs do piloto.

Viewed OnboardingPreLaunch.html:5-9
