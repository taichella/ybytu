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
   - **Solução**: Iniciar com `settings = isNew` (recolhido em planos existentes) e exibir uma barra de resumo compacta idêntica à do `TrainingPlanCreator`:
     - Exibe: *Objetivos · Metas calóricas · Refeições/dia · Dias/sem · Preferência alimentar*.
     - Botão `Editar ▼` para expandir suavemente.

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
@@ -88,6 +88,32 @@ export default function MealPlanCreator() {
 
   const mealTypeName = (code) => (lookups?.meal_types ?? []).find((mt) => mt.meal_type_id === code)?.name_ptbr ?? code;
 
+  const planSettingsSummary = useMemo(() => {
+    const parts = [];
+    const goals = (plan.goals_ids ?? []).map(g => (lookups?.goals ?? []).find(gl => gl.goal_id === g)?.name_ptbr || g).filter(Boolean);
+    if (goals.length > 0) parts.push(`Objetivos: ${goals.join(', ')}`);
+    if (plan.calories) parts.push(`${plan.calories} kcal/dia`);
+    if (plan.meals_per_day) parts.push(`${plan.meals_per_day} ref/dia`);
+    if (plan.days_per_week) parts.push(`${plan.days_per_week} dias/sem`);
+    if (plan.dietary_preference) {
+      const pref = (lookups?.dietary_preferences ?? []).find(p => p.dietary_preference_id === plan.dietary_preference);
+      if (pref) parts.push(`Pref: ${pref.name_ptbr}`);
+    }
+    return parts.length > 0 ? parts.join(' · ') : 'Nenhuma configuração preenchida';
+  }, [plan, lookups]);
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
@@ -207,6 +233,18 @@ export default function MealPlanCreator() {
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
@@ -255,6 +293,24 @@ export default function MealPlanCreator() {
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

1. **Reordenação de Refeições**: Ao clicar em ▲ ou ▼, os itens mudam de posição vertical imediatamente. O total diário de calorias e macros na lateral permanece idêntico (a soma não é alterada).
2. **Salvamento**: `allSlots` mapeia `meal_order: i + 1`. A ordem resultante é persistida diretamente em `meal_plan_meals`.
3. **Resumo das Configurações**: Ao carregar um plano existente, a barra fina de resumo é exibida. Clicar nela abre as opções completas.
