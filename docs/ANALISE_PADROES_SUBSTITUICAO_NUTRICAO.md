# Análise de Padrões — Substituição de Ingredientes (99 refeições)

Análise pedida antes de decidir a estratégia de correção do problema descrito em
`REVISAO_NUTRICIONISTA.md`. **Nenhuma refeição foi alterada** — isto é só leitura e
comparação de dados já existentes no banco (as 99 linhas com `is_active=false`).

## Resposta curta

- **Direção do erro: 99/99 casos são "ingrediente errado"**, não "texto desatualizado".
  Em nenhum dos 99 casos o texto (nome + preparo) descreve um prato diferente e
  coerente com os ingredientes atuais — o texto SEMPRE conta uma história coerente, e
  os ingredientes SEMPRE contradizem essa história.
- **É sistemático, não aleatório.** Os 10 padrões principais cobrem ~85 das 99
  refeições, cada um com mapeamento A→B **consistente** (nunca encontrei uma exceção
  onde o mesmo ingrediente correto foi substituído por dois ingredientes errados
  diferentes).
- **Reversível em lote, com cuidado**: os padrões de 1 via (ex: cenoura→polenta) são
  simples de reverter. Mas achei **duas cadeias de 2-3 ingredientes** (não pares
  simples) que precisam ser corrigidas na ordem certa, e **um par que trocou de lugar
  nos dois sentidos** (arroz↔batata doce) — reverter errado essas pode piorar o
  problema.
- **Os ingredientes corretos quase todos já existem no catálogo `foods`** — não
  precisa cadastrar nada novo pros padrões principais. Só 3 casos isolados
  (banana-da-terra, amido de milho cru, milho de pipoca cru) precisariam de um
  alimento novo ou de uma aproximação aceita pela nutricionista.

## 1. Mapa de padrões de substituição

Ordenado por frequência. "Consistência" = todas as ocorrências desse ingrediente
faltante foram substituídas pelo MESMO ingrediente errado (sem exceção encontrada).

| Ingrediente correto (esperado) | Ingrediente errado (encontrado) | Nº refeições | Consistência |
|---|---|---|---|
| Cenoura | Polenta cozida | 12 | 100% consistente |
| Tomate | Alface | 10 | 100% consistente |
| Brócolis | Farinha de trigo | 8 | 100% consistente |
| Maçã | Laranja | 8 | 100% consistente |
| Espinafre | Araruta cozida | 8 | 100% consistente |
| Arroz (integral/branco/parboilizado) | Batata doce cozida | 7 | ⚠️ ver seção 2 (troca nos dois sentidos) |
| Batata (branca, genérica) | Pão integral / Pão francês | 7 | 100% consistente |
| Alface (como ingrediente central) | Aipo (Salsão) | 7 | 100% consistente |
| Batata doce | Arroz integral cozido | 6 | ⚠️ ver seção 2 (troca nos dois sentidos) |
| Quinoa | Cuscuz de milho cozido | 7 | 100% consistente |
| Macarrão / massa | Quinoa cozida | 5 | 100% consistente — ver seção 2 (cadeia) |
| Cogumelos / Funghi | Pipoca (sem óleo, sem sal) | 5 | 100% consistente |
| Feijão (genérico/preto) | Macarrão cozido | 5 | 100% consistente |
| Mandioca | Farinha de aveia | 4 | 100% consistente |
| Abobrinha | Arroz parboilizado cozido | 3 | 100% consistente |
| Arroz | Milho cozido | 2 | 100% consistente (casos distintos do par arroz↔batata doce) |
| Couve-flor | Batata inglesa cozida | 2 | 100% consistente |
| Pimentão | Cevada em grãos cozida | 2 | 100% consistente |
| Couve / Repolho | Trigo sarraceno cozido | 2-3 | 100% consistente |
| Feijão fradinho (específico) | Lentilha comum cozida | 1 | — |
| Aspargos | Araruta cozida | 1 | mesmo destino do espinafre — ver seção 2 |
| Banana-da-terra | Maçã | 1 | ⚠️ ver seção 2 (cadeia) |
| Melancia | Abacaxi | 1 | — |
| Nozes | Farinha de amêndoas | 1 | — |
| Milho de pipoca (grão cru) | Pão francês | 1 | caso isolado, severo |
| Amido de milho / maizena | Arroz branco cozido | 1 | caso isolado |

Total de ocorrências mapeadas acima: ~110 (uma refeição pode ter mais de um
ingrediente errado — por isso a soma passa de 99).

## 2. Achado importante: não são só pares — tem CADEIAS

Isso muda a estratégia de correção. Três casos onde o mesmo ingrediente aparece como
"correto perdido" numa refeição e como "errado inserido" em outra:

- **Cadeia arroz/massa → quinoa → cuscuz de milho**: `Macarrão` (correto) foi
  substituído por `Quinoa cozida` em 5 refeições — mas `Quinoa cozida` (correto) foi
  substituída por `Cuscuz de milho cozido` em 7 OUTRAS refeições. Não é um substituto
  único: parece um deslocamento numa lista ordenada de alimentos, onde cada receita
  recebeu o alimento "vizinho" errado.
- **Cadeia banana-da-terra → maçã → laranja**: mesma lógica — `Banana-da-terra`
  (correto, meal_112) virou `Maçã`, enquanto em 8 OUTRAS refeições `Maçã` (correto)
  virou `Laranja`.
- **Par que trocou de lugar nos dois sentidos — arroz ↔ batata doce**: em 6 refeições
  faltava batata doce e apareceu arroz; em 7 OUTRAS faltava arroz e apareceu batata
  doce. Os dois alimentos parecem ter sido literalmente transpostos entre si em vez de
  cada um ter ido para um alimento diferente.

**Por que isso importa pra reversão em lote:** um "find and replace" ingênuo (ex:
"todo `laranja` vira `maçã`") pode corrigir a cadeia errada — teria que ser scoped
exatamente às 99 linhas identificadas e seguir o mapeamento específico de CADA
refeição, não um replace genérico por nome de alimento em toda a tabela (`laranja` e
`batata doce`, por exemplo, também aparecem corretamente em refeições que NÃO estão
nesta lista de 99, e não podem ser tocadas).

## 3. Direção do erro — por que é sempre "ingrediente errado", nunca "texto velho"

Reli as 99 comparando: será que o texto (nome + preparo) é que ficou desatualizado, e
os ingredientes atuais formam uma receita alternativa coerente? Em **nenhum** dos 99
casos isso acontece. Alguns exemplos do padrão universal:

- "Sopa de Tomate Rústica" com preparo "asse os tomates..." → ingrediente é **alface**.
  Uma sopa de alface assada não é uma receita alternativa coerente — é só o tomate
  faltando.
- "Batata Frita Rústica no Forno" com preparo "corte a batata em palitos..." →
  ingrediente é **pão integral**. Não existe uma receita real de "batata frita" feita
  só de pão.
- "Strogonoff de Cogumelos" com preparo "refogue os cogumelos frescos..." →
  ingrediente é **pipoca**. Pipoca não vira strogonoff de jeito nenhum.

Em todos os 99, bastaria trocar de volta o ingrediente errado pelo esperado (segundo o
próprio nome/preparo da refeição) para a receita fazer sentido de novo. Isso é uma
evidência forte de que o bug está na etapa de **atribuição de ingredientes**, não na
geração de nome/texto — os dois foram gerados a partir da MESMA descrição de receita
(por isso nome e texto sempre combinam entre si), e só a lista de ingredientes foi
populada a partir de uma fonte diferente/deslocada.

## 4. Os ingredientes corretos existem no catálogo `foods`?

Verifiquei um por um. **Quase todos já existem**, com nome e id reais:

| Ingrediente correto | Existe? | food_id |
|---|---|---|
| Quinoa cozida | ✅ | food_008 |
| Batata doce cozida | ✅ | food_002 |
| Cogumelo (Paris/Shimeji/Shitake) | ✅ | food_051 / food_052 / food_053 |
| Tomate | ✅ | food_077 |
| Maçã | ✅ | food_080 |
| Brócolis | ✅ | food_044 / food_154 (cozido) |
| Cenoura | ✅ | food_049 |
| Mandioca cozida | ✅ | food_006 |
| Couve-flor | ✅ | food_055 |
| Abobrinha | ✅ | food_032 |
| Espinafre | ✅ | food_058 / food_155 (cozido) |
| Feijão fradinho | ✅ | food_119 |
| Melancia | ✅ | food_083 |
| Repolho / Couve | ✅ | food_074 / food_054 |
| Nozes | ✅ | food_114 |
| Aspargos | ✅ | food_040 |
| Pimentão (amarelo) | ✅ (só a variante amarela cadastrada) | food_069 |
| **Banana-da-terra (plátano)** | ❌ **não existe** — só "Banana" comum (food_079) | — |
| **Amido de milho / maizena cru** | ❌ **não existe** — só um biscoito com maizena (food_374) | — |
| **Milho de pipoca (grão cru, não estourado)** | ❌ **não existe** — só "Pipoca (sem óleo, sem sal)" já estourada (food_025) | — |

**Conclusão:** para ~97 das 99 refeições, a correção é só trocar o `food_id` errado
pelo certo em `ingredients_json` — não precisa cadastrar nada. Só 3 casos
(`meal_112` banana-da-terra, `meal_184` maizena, `meal_089` milho de pipoca) exigem
decisão: cadastrar o alimento certo, ou aceitar uma aproximação com o que já existe
(ex: usar "Banana" comum em vez de banana-da-terra — nutricionalmente diferente, mas
evita cadastro novo).

## 5. Recomendação (não implementada — aguardando sua decisão)

Dado que:
1. o erro é sempre "ingrediente errado" (nunca texto velho),
2. os padrões são consistentes (mesmo A sempre vira o mesmo B),
3. os ingredientes corretos quase todos já existem no catálogo,

isso favorece **reverter em lote** os 10 padrões principais (cobre ~85 das 99) como
correção rápida, com a nutricionista aprovando cada mapeamento antes (ela pode achar
que algum "errado" às vezes é aceitável, ex: polenta em vez de cenoura numa sopa,
mesmo não sendo o que o texto diz). Os casos de cadeia (arroz↔batata doce,
macarrão→quinoa→cuscuz, banana-da-terra→maçã→laranja) precisam ser tratados
explicitamente por refeição, não por um replace genérico de nome de alimento. Os 3
casos sem alimento cadastrado (banana-da-terra, maizena, milho de pipoca) ficam para
decisão separada.

Não implementei nada — só esta análise, conforme pedido.
