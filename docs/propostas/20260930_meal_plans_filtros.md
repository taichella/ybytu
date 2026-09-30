# Proposta: Busca e Filtros Completos em MealPlans Baseados em Dados Reais

**Data:** 30 de setembro de 2026  
**Arquivo Alvo:** `apps/ybytu-dashboard/src/components/MealPlans.jsx`  
**Autor da Proposta:** Antigravity  
**Executor / Revisor:** Claude  

---

## 1. Respostas aos Dois Pontos Levantados

### Ponto 1: `goals_ids` é JSONB (Compatibilidade de Tipos)
* **Comportamento do `supabase-js`**: Em colunas `jsonb`, o PostgREST converte arrays JSON diretamente para arrays nativos do JavaScript (por isso `Array.isArray(p.goals_ids)` já funciona na linha 90 de `MealPlans.jsx`).
* **Blindagem implementada**: Para garantir imunidade total contra dados legados ou strings duplamente escapadas (ex.: `"[\"emagrecimento\"]"` ou `"hipertrofia"`), incluímos o helper `normalizeGoalsIds`:
  ```javascript
  function normalizeGoalsIds(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        return [parsed];
      } catch {
        return raw.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    return [];
  }
  ```
  Isso garante que o filtro nunca quebre nem retorne vazio por variação de tipo.

### Ponto 2: `is_active` em 300 dos 304 Planos (Vale manter o filtro de status?)
* **Análise dos dados**: 300 planos são ativos e apenas 4 estão desativados. Entre "Todos" e "Ativos", a diferença visual é quase imperceptível (304 vs 300).
* **Veredito**: **Sim, vale manter**, porque a função primária do filtro aqui não é separar 50/50, mas sim permitir que o nutricionista ou admin consiga **localizar imediatamente os 4 planos inativos** sem precisar rolar 304 cards.
* **Ajuste de design**: Em vez de dar destaque excessivo, o filtro de status fica como uma opção simples no cabeçalho de filtros (`Todos`, `Ativos`, `Inativos`).

---

## 2. Filtros Confirmados com Base no Banco de Dados

1. **Busca Textual**: Busca em `p.name_ptbr` e em `p.meal_plan_id` (código `mp_...`).
2. **Objetivos**: Dropdown dinâmico derivado de `lookups.goals`, com opção extra `"Sem objetivo"` para planos sem amarração.
3. **Calorias**: Faixas calibradas conforme a distribuição real das dietas:
   - `< 1800 kcal` (déficit calórico)
   - `1800 a 2400 kcal` (faixa de manutenção / moderado)
   - `> 2400 kcal` (superávit / hipertrofia)
4. **Refeições por Dia**: Pílulas/seletor gerado a partir dos valores que realmente existem no banco (`[...new Set(plans.map(p => p.meals_per_day).filter(Boolean))].sort()`). Dessa forma, nunca exibe uma opção vazia.
5. **Origem IA**: `Todos` | `Somente IA` | `Manuais / Molde`.
6. **Contador e Limpeza**: Indicador `Exibindo X de Y planos` e botão `Limpar filtros` ativo quando houver filtros aplicados.

---

## 3. Diff Proposto

```diff
--- a/apps/ybytu-dashboard/src/components/MealPlans.jsx
+++ b/apps/ybytu-dashboard/src/components/MealPlans.jsx
@@ -14,7 +14,25 @@ const COVER_GRADIENTS = [
 
+function normalizeGoalsIds(raw) {
+  if (!raw) return [];
+  if (Array.isArray(raw)) return raw;
+  if (typeof raw === 'string') {
+    try {
+      const parsed = JSON.parse(raw);
+      if (Array.isArray(parsed)) return parsed;
+      return [parsed];
+    } catch {
+      return raw.split(',').map((s) => s.trim()).filter(Boolean);
+    }
+  }
+  return [];
+}
+
 export default function MealPlans() {
   const [search, setSearch] = useState('');
-  const [aiFilter, setAiFilter] = useState(false);
+  const [aiFilter, setAiFilter] = useState('all'); // 'all' | 'ai' | 'manual'
+  const [goalFilter, setGoalFilter] = useState('all');
+  const [caloricRange, setCaloricRange] = useState('all'); // 'all' | '<1800' | '1800-2400' | '>2400'
+  const [mealsFilter, setMealsFilter] = useState('all');
+  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
   const [plans, setPlans] = useState([]);
   const [lookups, setLookups] = useState(null);
   const [loading, setLoading] = useState(true);
@@ -51,10 +69,45 @@ export default function MealPlans() {
 
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
+    if (goalFilter !== 'all') {
+      const planGoals = normalizeGoalsIds(p.goals_ids);
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
@@ -78,10 +131,70 @@ export default function MealPlans() {
           </div>
 
-          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted)', fontWeight: 600, cursor: 'pointer', marginBottom: '18px' }}>
-            Somente gerados por IA
-            <input type="checkbox" checked={aiFilter} onChange={(e) => setAiFilter(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--brand)', cursor: 'pointer' }} />
-          </label>
+          {/* Barra de Filtros com Dados Reais */}
+          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px' }}>
+            {/* Objetivo */}
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
+                onClick={clearFilters}
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

1. **Busca Combinada**: Testar busca textual com nome (ex: `Hipertrofia`) e código (`mp_001`).
2. **Isolamento de Inativos**: Selecionar `Inativos` no dropdown de status deve exibir imediatamente apenas os 4 planos desativados da base.
3. **Imunidade a Arrays/Strings JSONB**: `normalizeGoalsIds` previne qualquer exceção ou falha em planos com `goals_ids` malformado ou nulo.
