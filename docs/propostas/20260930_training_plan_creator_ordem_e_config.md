# Proposta: Ordem dos Exercícios e Configurações no TrainingPlanCreator

**Data:** 30 de setembro de 2026  
**Arquivo Alvo:** `apps/ybytu-dashboard/src/components/TrainingPlanCreator.jsx`  
**Autor da Proposta:** Antigravity  
**Executor / Revisor:** Claude  

---

## 1. Contexto e Objetivos

1. **Reordenação dos Exercícios na Ficha do Dia**:
   - Atualmente, novos exercícios só podem ser inseridos ao final da ficha. Para alterar a ordem de execução do treino, o profissional precisa excluir e reinserir todos os exercícios seguintes.
   - **Solução**: Adicionar botões discretos **Subir (▲)** e **Descer (▼)** em cada card de exercício.
   - O array no estado `slotsByDay[day]` é reordenado e a propriedade `order_within_day` é atualizada sequencialmente (`1, 2, 3...`). No salvamento (`handleSave`), `order_within_day` e `exercise_order` já utilizam o índice do array, garantindo persistência imediata e correta no Supabase.

2. **Configurações do Plano**:
   - Manter as configurações recolhidas por padrão ao abrir um plano existente (`isNew ? true : false`), apresentando a barra de resumo compacta de 36px (`planSettingsSummary`) com o botão `Editar ▼`.
   - Ao criar um plano novo (`isNew`), o painel de configurações inicia aberto para facilitar o preenchimento inicial.

---

## 2. Diff Proposto

```diff
--- a/apps/ybytu-dashboard/src/components/TrainingPlanCreator.jsx
+++ b/apps/ybytu-dashboard/src/components/TrainingPlanCreator.jsx
@@ -285,6 +285,19 @@ export default function TrainingPlanCreator() {
     });
   };
 
+  const moveSlot = (fromIndex, toIndex) => {
+    setSlotsByDay((prev) => {
+      const list = [...(prev[day] ?? [])];
+      if (toIndex < 0 || toIndex >= list.length) return prev;
+      const [moved] = list.splice(fromIndex, 1);
+      list.splice(toIndex, 0, moved);
+      return {
+        ...prev,
+        [day]: list.map((slot, idx) => ({ ...slot, order_within_day: idx + 1 })),
+      };
+    });
+  };
+
   const removeSlot = (uniqueId) => {
     setSlotsByDay((prev) => ({ ...prev, [day]: (prev[day] ?? []).filter((s) => s.uniqueId !== uniqueId) }));
   };
@@ -976,6 +989,30 @@ export default function TrainingPlanCreator() {
                       <p style={{ margin: 0, fontWeight: 800, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                         {s.exercise?.name_ptbr ?? s.exercise_id}
                       </p>
                     </div>
+                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
+                      <button
+                        type="button"
+                        disabled={i === 0}
+                        onClick={() => moveSlot(i, i - 1)}
+                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '3px 7px', cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.3 : 1, color: 'var(--text)', fontSize: '11px', lineHeight: 1 }}
+                        title="Mover exercício para cima"
+                        aria-label="Mover exercício para cima"
+                      >
+                        ▲
+                      </button>
+                      <button
+                        type="button"
+                        disabled={i === currentSlots.length - 1}
+                        onClick={() => moveSlot(i, i + 1)}
+                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '3px 7px', cursor: i === currentSlots.length - 1 ? 'not-allowed' : 'pointer', opacity: i === currentSlots.length - 1 ? 0.3 : 1, color: 'var(--text)', fontSize: '11px', lineHeight: 1 }}
+                        title="Mover exercício para baixo"
+                        aria-label="Mover exercício para baixo"
+                      >
+                        ▼
+                      </button>
+                    </div>
                     <button
                       type="button"
                       onClick={() => removeSlot(s.uniqueId)}
```

---

## 3. Validação

1. **Reordenação**: Ao clicar em ▲ ou ▼, a letra do exercício (`A`, `B`, `C`...) atualiza imediatamente e a ordem visual troca de posição.
2. **Extremos**: O botão ▲ no primeiro exercício e o botão ▼ no último ficam visualmente desabilitados (`opacity: 0.3`, `cursor: not-allowed`).
3. **Persistência**: Ao clicar em "Salvar", os slots são gravados em `training_plan_exercises` com `order_within_day` de `1` a `N` na ordem resultante.
