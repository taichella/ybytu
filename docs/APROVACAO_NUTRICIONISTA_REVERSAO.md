# Aprovação — Reversão de Ingredientes Errados (99 refeições)

Este documento é pra você aprovar, refeição por refeição e padrão por padrão, a
correção do problema descrito em `REVISAO_NUTRICIONISTA.md`. Nada foi alterado no
sistema ainda — só depois da sua aprovação aqui é que a equipe técnica aplica.

## Contexto rápido

Encontramos que em 99 refeições do catálogo, a lista de ingredientes está errada —
foi trocada por outro ingrediente, sempre de forma consistente (o mesmo ingrediente
errado aparece toda vez que o mesmo ingrediente correto deveria estar ali). Isso
parece ter sido um bug técnico na carga dos dados (não um erro de nutrição em si) —
os ingredientes "certos" que identificamos já existem no sistema na maioria dos
casos, só precisam ser trocados de volta.

**Para cada linha abaixo:** confirme se o ingrediente correto proposto faz sentido
nutricionalmente para aquela receita. Se achar que outro ingrediente serviria melhor,
escreva na coluna de observação.

## Padrões (marque ✅ pra aprovar a troca em todas as refeições da linha)

| ☐ Aprovado | Nas refeições... | O ingrediente atual é | Deveria ser | Sua observação |
|---|---|---|---|---|
| ☐ | meal_017, 034, 045, 075, 104, 110, 143, 149, 150, 169, 182, 185 (12 refeições) | **Polenta cozida** | **Cenoura** | |
| ☐ | meal_027, 032, 036, 058, 066, 074, 093, 119, 140, 142 (10 refeições) | **Alface** (no lugar do tomate) | **Tomate** | meal_140 e meal_142 têm sinal mais fraco — dá uma olhada extra nessas duas |
| ☐ | meal_011, 020, 035, 078, 102, 109, 145, 150 (8 refeições) | **Farinha de trigo** | **Brócolis** | |
| ☐ | meal_013, 034, 088, 104, 143, 155, 182, 190 (8 refeições) | **Pão integral / Pão francês** | **Batata inglesa cozida** (batata comum) | |
| ☐ | meal_017, 036, 047, 067, 110, 117, 152, 189 (8 refeições) | **Cuscuz de milho cozido** | **Quinoa cozida** | |
| ☐ | meal_023, 030, 047, 098, 122, 128, 171, 175 (8 refeições) | **Laranja** | **Maçã** | |
| ☐ | meal_019, 030, 039, 055, 073, 090, 111, 123, 128, 171 (10 refeições) | **Araruta cozida** | **Espinafre** (uma delas, meal_111, deveria ser Aspargos — mesmo ingrediente errado, outro correto) | |
| ☐ | meal_011, 037, 065, 083, 101, 124, 167 (7 refeições) | **Arroz integral cozido** | **Batata doce cozida** | ⚠️ ver nota da troca de mão-dupla abaixo |
| ☐ | meal_012, 015, 090, 153, 159, 183, 197 (7 refeições) | **Batata doce cozida** | **Arroz integral cozido** (meal_183 especificamente: Arroz branco cozido) | ⚠️ ver nota da troca de mão-dupla abaixo |
| ☐ | meal_033, 061, 072, 079, 139, 146, 148 (7 refeições) | **Aipo (Salsão)** | **Alface** | meal_146 tem sinal mais fraco |
| ☐ | meal_012, 034, 067, 159, 197 (5 refeições) | **Macarrão cozido** | **Feijão carioca** | Pode ser outro tipo de feijão (preto, etc) — sua escolha |
| ☐ | meal_014, 066, 113, 133, 195 (5 refeições) | **Quinoa cozida** | **Macarrão cozido** | |
| ☐ | meal_073, 080, 116, 117, 153 (5 refeições) | **Pipoca (sem óleo, sem sal)** | **Cogumelo Paris** (ou Shimeji/Shitake, sua escolha) | |
| ☐ | meal_071, 106, 134, 181 (4 refeições) | **Farinha de aveia** | **Mandioca cozida** | |
| ☐ | meal_020, 062, 158 (3 refeições) | **Milho cozido** | **Arroz integral cozido** | |
| ☐ | meal_038, 069, 157 (3 refeições) | **Arroz parboilizado cozido** | **Abobrinha** | |
| ☐ | meal_149, 171, 077 (3 refeições) | **Trigo sarraceno cozido** | **Couve** (meal_149, 171) / **Repolho** (meal_077) | |
| ☐ | meal_105, 119 (2 refeições) | **Cevada em grãos cozida** | **Pimentão** (só existe a variedade amarela cadastrada) | |
| ☐ | meal_115, 135 (2 refeições) | **Batata inglesa cozida** | **Couve-flor** | |

⚠️ **Nota sobre a "troca de mão-dupla" arroz↔batata doce**: os dois ingredientes
parecem ter sido literalmente transpostos entre si — 7 refeições que deveriam ter
arroz receberam batata doce, e 6 refeições que deveriam ter batata doce receberam
arroz. São duas linhas separadas na tabela acima porque a correção é diferente pra
cada grupo (não é "sempre vira arroz" nem "sempre vira batata doce"), mas se você
aprovar uma dessas duas linhas normalmente já está aprovando a direção certa —
confira só se as listas de refeições fazem sentido.

## Casos individuais (fora dos padrões — cada um só acontece 1 vez)

| ☐ Aprovado | Refeição | Ingrediente atual | Deveria ser | Observação |
|---|---|---|---|---|
| ☐ | meal_076 (Salada de Melancia e Feta) | Abacaxi | Melancia | |
| ☐ | meal_099 (Salada de Feijão Fradinho) | Lentilha comum cozida | Feijão fradinho | Essa refeição também tem o padrão "alface→tomate" junto |
| ☐ | meal_116 (Lentilha Estufada com Cogumelos) | Inhame cozido | Lentilha comum cozida | Ligado ao caso do meal_099 — parece uma cadeia de 3 alimentos deslocados |
| ☐ | meal_125 (Iogurte com Nozes e Mel) | Farinha de amêndoas | Nozes | |

## Alimentos que não existem no catálogo — precisa da sua decisão

Essas 4 refeições precisam de um alimento que ainda não está cadastrado no sistema.
Pra cada uma, diga se cadastramos o alimento certo ou se você aprova uma aproximação
com o que já existe.

| Refeição | Precisa de | Não existe — aproximação disponível | Sua decisão |
|---|---|---|---|
| meal_112 (Moqueca de Cação e Banana-da-Terra) | Banana-da-terra (plátano) | Existe só "Banana" comum — nutricionalmente diferente | ☐ Cadastra banana-da-terra &nbsp; ☐ Aceita "Banana" comum |
| meal_086 (Pizza de Berinjela) | Berinjela | Nenhuma aproximação razoável no catálogo atual | ☐ Cadastra berinjela &nbsp; ☐ Outra sugestão: _______ |
| meal_089 (Pipoca Feita na Água) | Milho de pipoca (grão cru, antes de estourar) | Existe só "Pipoca" já estourada | ☐ Cadastra milho de pipoca cru &nbsp; ☐ Aceita usar a receita como está com "Pipoca" já pronta (muda o preparo) |
| meal_184 (Mingau de Maizena) | Amido de milho / maizena cru | Existe só um biscoito ("Biscoito tipo Maria / Maizena") | ☐ Cadastra amido de milho cru &nbsp; ☐ Outra sugestão: _______ |

## ⚠️ Pergunta importante: as outras 101 refeições "limpas" também precisam de olhar seu?

A varredura que fizemos (comparando nome × ingrediente × preparo) achou os 99 casos
acima — mas ela só detecta quando o texto e o ingrediente **contradizem um ao
outro**. As outras 101 refeições passaram nessa checagem porque o ingrediente listado
"faz sentido" com o nome e o preparo. **Mas essas 101 foram geradas pela mesma IA, sem
revisão sua até agora** — então pode haver problemas que só um olhar nutricional
percebe, mesmo com o ingrediente certo:

- **Quantidade errada** (ex: uma porção de proteína grande demais ou pequena demais
  pro objetivo da refeição)
- **Combinação nutricionalmente inadequada** mesmo com ingredientes corretos
  individualmente (ex: dois carboidratos pesados na mesma refeição, ou proporção de
  proteína/gordura desequilibrada)
- Coisas que exigem julgamento clínico, não comparação de texto

**Pergunta pra você:** dado que já revisamos os 99 problemas óbvios, você recomenda
revisar as 101 restantes também (mesmo que por amostragem) antes do catálogo ser
considerado seguro pro lançamento, ou a checagem de coerência texto×ingrediente já
é suficiente pra essas?

## Depois da sua aprovação

A equipe técnica tem um script pronto (`scripts/reversao_ingredientes_20260826.sql`)
que aplica exatamente os mapeamentos acima, refeição por refeição — com backup do
estado atual antes de qualquer mudança, pra poder desfazer se algo sair errado. Ele
só roda depois que você aprovar (ou ajustar) os mapeamentos aqui.
