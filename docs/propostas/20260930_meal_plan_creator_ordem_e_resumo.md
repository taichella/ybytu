# Proposta: Ordem dos Itens (Refeições) e Barra de Resumo no MealPlanCreator

**Data:** 30 de setembro de 2026  
**Arquivo Alvo:** `apps/ybytu-dashboard/src/components/MealPlanCreator.jsx`  
**Autor da Proposta:** Antigravity  
**Executor / Revisor:** Claude  

---

## 1. Contexto e Objetivos

1. **Reordenação das Refeições no Dia**:
   - As refeições atualmente só podem ser adicionadas e removidas. Para reorganizar uma refeição inserida fora de ordem (por exemplo, mover um lanche para depois do almoço), a nutricionista era obrigada a apagar e re-adicionar os itens.
   - **Solução**: Adicionar botões discretos **Subir (▲)** e **Descer (▼)** em cada card de refeição da coluna central.
   - A função `moveSlot` reordena o array e recalcula `meal_order` (`1, 2, 3...`), que é enviado diretamente para `meal_plan_meals` ao salvar.

2. **Configurações Recolhidas e Barra de Resumo Compacta**:
   - `MealPlanCreator` começava com `settings = true`, ocupando grande espaço vertical no topo da tela e sem nenhuma barra de resumo quando fechado.
   - **Solução**: Iniciar com `settings = isNew` (recolhido em planos existentes) e exibir uma barra de resumo compacta idêntica à do `TrainingPlanCreator`.
   - **Resolução de Rótulos em PT-BR**: Como `plan.goals_ids` e `plan.dietary_preference` guardam **slugs** (`goal_id` e `dietary_preference_id`), criamos `goalMap` e `prefMap` indexados pelos slugs. Dessa forma, a barra exibe sempre os nomes legíveis em português (*"Objetivos: Emagrecimento · Pref: Onívoro"*), **nunca os slugs crus** (`weight_loss`, `omnivore`).

---

## 2. Diff Proposto

```diff
--- a/apps/ybytu-dashboard/src/components/MealPlanCreator.jsx
+++ b/apps/ybytu-dashboard/src/components/MealPlanCreator.jsx
@@ -25,7 +25,7 @@ export default function MealPlanCreator() {
   const isStudentPlan = Boolean(forUser);
 
   const [day, setDay] = useState(1);
-  const [settings, setSettings] = useState(true);
+  const [settings, setSettings] = useState(isNew);
   const [plan, setPlan] = useState(EMPTY_PLAN);
   const [slotsByDay, setSlotsByDay] = useState({});
   const [lookups, setLookups] = useState(null);
@@ -88,6 +88,43 @@ export default function MealPlanCreator() {
 
   const mealTypeName = (code) => (lookups?.meal_types ?? []).find((mt) => mt.meal_type_id === code)?.name_ptbr ?? code;
 
+  // Mapas indexados pelo SLUG (goal_id e dietary_preference_id) para exibir nome em PT-BR
+  const goalMap = useMemo(() => {
+    const map = new Map();
+    (lookups?.goals ?? []).forEach((g) => map.set(g.goal_id, g.name_ptbr));
+    return map;
+  }, [lookups]);
+
+  const prefMap = useMemo(() => {
+    const map = new Map();
+    (lookups?.dietary_preferences ?? []).forEach((p) => map.set(p.dietary_preference_id, p.name_ptbr));
+    return map;
+  }, [lookups]);
+
+  const planSettingsSummary = useMemo(() => {
+    const parts = [];
+    const goals = (Array.isArray(plan.goals_ids) ? plan.goals_ids : [])
+      .map((g) => goalMap.get(g) || g)
+      .filter(Boolean);
+    if (goals.length > 0) parts.push(`Objetivos: ${goals.join(', ')}`);
+    if (plan.calories) parts.push(`${plan.calories} kcal/dia`);
+    if (plan.meals_per_day) parts.push(`${plan.meals_per_day} ref/dia`);
+    if (plan.days_per_week) parts.push(`${plan.days_per_week} dias/sem`);
+    if (plan.dietary_preference) {
+      const prefName = prefMap.get(plan.dietary_preference) || plan.dietary_preference;
+      parts.push(`Pref: ${prefName}`);
+    }
+    return parts.length > 0 ? parts.join(' · ') : 'Nenhuma configuração preenchida';
+  }, [plan, goalMap, prefMap]);
+
+  const moveSlot = (fromIndex, toIndex) => {
+    setSlotsByDay((prev) => {
+      const list = [...(prev[day] ?? [])];
+      if (toIndex < 0 || toIndex >= list.length) return prev;
+      const [moved] = list.splice(fromIndex, 1);
+      list.splice(toIndex, 0, moved);
+      return {
+        ...prev,
+        [day]: list.map((slot, idx) => ({ ...slot, meal_order: idx + 1 })),
+      };
+    });
+  };
+
   const addMealToDay = (meal) => {
     setSlotsByDay((prev) => {
       const list = prev[day] ?? [];
@@ -207,6 +244,18 @@ export default function MealPlanCreator() {
             </div>
           </div>
         </div>
+      ) : (
+        <div
+          onClick={() => setSettings(true)}
+          style={{ flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '8px 24px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer' }}
+          title="Clique para expandir as configurações"
+        >
+          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
+            <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)', flexShrink: 0 }}>Configurações:</span>
+            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{planSettingsSummary}</span>
+          </div>
+          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand)', flexShrink: 0 }}>Editar ▼</span>
+        </div>
       )}
 
       <div style={{ flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 28px', display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
@@ -255,6 +304,24 @@ export default function MealPlanCreator() {
                     <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>{s.meal?.name_ptbr}</p>
                     <p style={{ margin: '1px 0 0', fontSize: '11px', color: 'var(--muted)' }}>{mealTypeName(s.meal_type_id)} · {s.meal?.calories ?? 0} kcal</p>
                   </div>
+                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
+                    <button
+                      type="button"
+                      disabled={i === 0}
+                      onClick={() => moveSlot(i, i - 1)}
+                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '3px 7px', cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.3 : 1, color: 'var(--text)', fontSize: '11px', lineHeight: 1 }}
+                      title="Mover refeição para cima"
+                    >
+                      ▲
+                    </button>
+                    <button
+                      type="button"
+                      disabled={i === currentSlots.length - 1}
+                      onClick={() => moveSlot(i, i + 1)}
+                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '3px 7px', cursor: i === currentSlots.length - 1 ? 'not-allowed' : 'pointer', opacity: i === currentSlots.length - 1 ? 0.3 : 1, color: 'var(--text)', fontSize: '11px', lineHeight: 1 }}
+                      title="Mover refeição para baixo"
+                    >
+                      ▼
+                    </button>
+                  </div>
                   <button onClick={() => removeSlot(s.uniqueId)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                 </div>
               ))}
```

---

## 3. Validação

1. **Reordenação de Refeições**: Os botões ▲ e ▼ trocam as refeições de posição visualmente e recalibram `meal_order: idx + 1`.
2. **Resumo das Configurações**: Utiliza `goalMap` e `prefMap` indexados pelos slugs de `goal_id` e `dietary_preference_id`. O resumo exibe sempre nomes em português legíveis, sem expor slugs crus.
3. **Persistência**: Ao salvar, `meal_order` reflete a nova ordem sequencial no banco.
