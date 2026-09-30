# Proposta: Busca e Filtros Completos em MealPlans Baseados em Dados Reais

**Data:** 30 de setembro de 2026  
**Arquivo Alvo:** `apps/ybytu-dashboard/src/components/MealPlans.jsx`  
**Autor da Proposta:** Antigravity  
**Executor / Revisor:** Claude  

---

## 1. Análise dos Dados e Confirmações do Banco

### 1.1. `goals_ids` armazena SLUGS (`goal_id`), não UUIDs
* **Estrutura confirmada**: Todas as 304 linhas de `meal_plans` no banco guardam arrays JSON com o **slug** do objetivo (ex.: `["weight_loss"]`, `["conditioning"]`), **nunca o UUID**.
* **Como comparar**: O filtro compara diretamente com `g.goal_id` (o slug de `lookups.goals`), e o `<select>` tem `value={g.goal_id}`. Comparar com `g.id` (uuid) devolveria sempre vazio.
* **Tipo de dado**: Como confirmado, todas as linhas são arrays JSON válidos e o `supabase-js` entrega como array JavaScript nativo. O uso de `Array.isArray(p.goals_ids)` e `includes(goalFilter)` é estritamente seguro e idiomático.

### 1.2. `is_active` em 300 dos 304 Planos (Filtro de Status)
* **Utilidade**: A função do filtro de status não é separar 50/50, mas permitir que o staff consiga **isolar imediatamente os 4 planos inativos** arquivados, sem precisar varrer visualmente 304 cards.
* **Implementação**: Mantido como um seletor simples e discreto (`Todos`, `Ativos`, `Inativos`).

---

## 2. Filtros Confirmados com Base no Banco de Dados

1. **Busca Textual**: Busca tanto em `p.name_ptbr` quanto em `p.meal_plan_id` (código `mp_...`).
2. **Objetivo (Slug `goal_id`)**: Dropdown populado por `lookups.goals` com `value={g.goal_id}`, mais a opção `"Sem objetivo"`.
3. **Calorias**: Faixas baseadas na distribuição real dos planos no banco:
   - `< 1800 kcal` (déficit calórico)
   - `1800 a 2400 kcal` (manutenção / moderado)
   - `> 2400 kcal` (superávit / hipertrofia)
4. **Refeições por Dia**: Opções derivadas dinamicamente dos próprios planos carregados (`availableMealsPerDay`), impedindo opções com 0 resultados.
5. **Status**: `Todos` | `Ativos` | `Inativos`.
6. **Origem IA**: `Todos` | `Somente IA` | `Manuais / Molde`.
7. **Contador e Limpeza**: Indicador `Exibindo X de Y planos` e botão `Limpar filtros`.

---

## 3. Diff Proposto

```diff
--- a/apps/ybytu-dashboard/src/components/MealPlans.jsx
+++ b/apps/ybytu-dashboard/src/components/MealPlans.jsx
@@ -16,3 +16,7 @@ export default function MealPlans() {
   const [search, setSearch] = useState('');
-  const [aiFilter, setAiFilter] = useState(false);
+  const [aiFilter, setAiFilter] = useState('all'); // 'all' | 'ai' | 'manual'
+  const [goalFilter, setGoalFilter] = useState('all'); // 'all' | slug do goal_id | 'sem_objetivo'
+  const [caloricRange, setCaloricRange] = useState('all'); // 'all' | '<1800' | '1800-2400' | '>2400'
+  const [mealsFilter, setMealsFilter] = useState('all');
+  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
   const [plans, setPlans] = useState([]);
@@ -51,8 +55,42 @@ export default function MealPlans() {
 
+  // Opções dinâmicas de refeições/dia presentes nos dados reais
+  const availableMealsPerDay = useMemo(() => {
+    const set = new Set();
+    plans.forEach((p) => {
+      if (p.meals_per_day) set.add(Number(p.meals_per_day));
+    });
+    return Array.from(set).sort((a, b) => a - b);
+  }, [plans]);
+
   const filtered = useMemo(() => plans.filter((p) => {
-    if (aiFilter && !p.created_by_ai) return false;
-    if (search && !(p.name_ptbr ?? '').toLowerCase().includes(search.toLowerCase())) return false;
+    if (aiFilter === 'ai' && !p.created_by_ai) return false;
+    if (aiFilter === 'manual' && p.created_by_ai) return false;
+    if (statusFilter === 'active' && !p.is_active) return false;
+    if (statusFilter === 'inactive' && p.is_active) return false;
+    if (mealsFilter !== 'all' && Number(p.meals_per_day) !== Number(mealsFilter)) return false;
+
+    // goals_ids guarda slugs (ex: ["weight_loss"]), compara com goal_id
+    if (goalFilter !== 'all') {
+      const planGoals = Array.isArray(p.goals_ids) ? p.goals_ids : [];
+      if (goalFilter === 'sem_objetivo' && planGoals.length > 0) return false;
+      if (goalFilter !== 'sem_objetivo' && !planGoals.includes(goalFilter)) return false;
+    }
+
+    const cal = Number(p.calories) || 0;
+    if (caloricRange === '<1800' && (cal === 0 || cal >= 1800)) return false;
+    if (caloricRange === '1800-2400' && (cal < 1800 || cal > 2400)) return false;
+    if (caloricRange === '>2400' && cal <= 2400) return false;
+
+    if (search) {
+      const q = search.toLowerCase();
+      const matchName = (p.name_ptbr ?? '').toLowerCase().includes(q);
+      const matchCode = (p.meal_plan_id ?? '').toLowerCase().includes(q);
+      if (!matchName && !matchCode) return false;
+    }
     return true;
-  }), [plans, search, aiFilter]);
+  }), [plans, search, aiFilter, statusFilter, goalFilter, caloricRange, mealsFilter]);
+
+  const hasActiveFilters = search || aiFilter !== 'all' || statusFilter !== 'all' || goalFilter !== 'all' || caloricRange !== 'all' || mealsFilter !== 'all';
+  const clearFilters = () => {
+    setSearch('');
+    setAiFilter('all');
+    setStatusFilter('all');
+    setGoalFilter('all');
+    setCaloricRange('all');
+    setMealsFilter('all');
+  };
@@ -78,10 +116,68 @@ export default function MealPlans() {
           </div>
 
-          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted)', fontWeight: 600, cursor: 'pointer', marginBottom: '18px' }}>
-            Somente gerados por IA
-            <input type="checkbox" checked={aiFilter} onChange={(e) => setAiFilter(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--brand)', cursor: 'pointer' }} />
-          </label>
+          {/* Barra de Filtros com Dados Reais */}
+          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px' }}>
+            {/* Objetivo (compara slug goal_id) */}
+            <select value={goalFilter} onChange={(e) => setGoalFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '9px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', outline: 'none' }}>
+              <option value="all">Todos os Objetivos</option>
+              {(lookups?.goals ?? []).map(g => (
+                <option key={g.goal_id} value={g.goal_id}>{g.name_ptbr}</option>
+              ))}
+              <option value="sem_objetivo">Sem objetivo</option>
+            </select>
+
+            {/* Calorias */}
+            <select value={caloricRange} onChange={(e) => setCaloricRange(e.target.value)} style={{ padding: '8px 12px', borderRadius: '9px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', outline: 'none' }}>
+              <option value="all">Todas as Calorias</option>
+              <option value="<1800">Até 1800 kcal</option>
+              <option value="1800-2400">1800 a 2400 kcal</option>
+              <option value=">2400">Acima de 2400 kcal</option>
+            </select>
+
+            {/* Refeições por Dia (derivado dinâmico) */}
+            {availableMealsPerDay.length > 0 && (
+              <select value={mealsFilter} onChange={(e) => setMealsFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '9px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', outline: 'none' }}>
+                <option value="all">Todas as Refeições/dia</option>
+                {availableMealsPerDay.map(m => (
+                  <option key={m} value={m}>{m} refeições/dia</option>
+                ))}
+              </select>
+            )}
+
+            {/* Status (300 ativos / 4 inativos) */}
+            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '9px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', outline: 'none' }}>
+              <option value="all">Todos os Status</option>
+              <option value="active">Ativos</option>
+              <option value="inactive">Inativos</option>
+            </select>
+
+            {/* Origem IA */}
+            <select value={aiFilter} onChange={(e) => setAiFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '9px', background: 'var(--field)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', outline: 'none' }}>
+              <option value="all">Todas as Origens</option>
+              <option value="ai">Somente IA</option>
+              <option value="manual">Manuais / Molde</option>
+            </select>
+
+            {hasActiveFilters && (
+              <button
+                type="button"
                onClick={clearFilters}
+                style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: '12px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', padding: '6px 10px' }}
+              >
+                Limpar filtros
+              </button>
+            )}
+
+            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--muted)', fontWeight: 700 }}>
+              Exibindo <strong>{filtered.length}</strong> de {plans.length}
+            </span>
+          </div>
```

---

## 4. Validação

1. **Busca Textual**: Buscar por nome (ex.: `Emagrecimento`) e por código (`mp_001`).
2. **Filtro de Objetivo**: Filtrar por cada objetivo (ex.: `weight_loss`) deve listar apenas planos que contenham o respectivo slug em `goals_ids`.
3. **Isolar os 4 Inativos**: Ao escolher `Inativos` no dropdown de status, a lista filtra imediatamente para os 4 planos arquivados.
