# Revisão Nutricionista — Catálogo de Refeições Ybytu

## ⚠️ CRÍTICO — leia isto primeiro

**99 de 200 refeições do catálogo (49,5%) têm ingredientes que não batem com o nome ou
o preparo.** Isso não é "alguns casos pontuais" — é metade do catálogo. E os 99 são só
o que uma varredura manual por texto conseguiu confirmar com alta confiança; pode haver
mais casos que exigem julgamento nutricional pra perceber (um ingrediente plausível mas
errado, que não soa estranho de cara). **Recomendação da equipe: trate isto como
necessidade de revisão COMPLETA do catálogo, não amostral.**

Em 2026-08-26, desativamos as 25 refeições da Tabela B (as que ainda estavam ativas)
assim que confirmamos o problema — mesmo tratamento que as 74 da Tabela A já tinham
recebido em 2026-08-24. Antes de desativar, simulamos o impacto na geração de planos
(RPC `ybytu_match_meals`): nenhuma combinação perfil×tipo de refeição zerou, mas
**jantar vegano caiu para exatamente 3 opções** (de 4), e uma delas (Purê de Abóbora
Simples) é fraca como refeição completa — prioridade #1 pra você repor.

## 1. Contexto (leia antes de tudo)

O Ybytu monta planos alimentares automaticamente combinando refeições de um catálogo
fixo (tabela `meals`, hoje com 200 refeições). Cada refeição tem: um nome, uma lista de
ingredientes com quantidade (`ingredients_json`), e um texto de preparo
(`instruction_ptbr`). Esses três campos foram gerados por IA em lote, sem revisão de um
nutricionista, e **nunca foram auditados por um humano até agora**.

Em 2026-08-24 encontramos um bug sistêmico: em uma fração grande do catálogo, a lista
de ingredientes **não bate** com o nome da refeição nem com o texto de preparo — parece
um bug de substituição em lote (ex: toda vez que devia entrar "quinoa" entrou "cuscuz de
milho"; toda vez que devia entrar "maçã" entrou "laranja"). O resultado prático: um
aluno abre o plano e vê "Sopa de Tomate Rústica" cujo único ingrediente rastreado é
alface — sem nenhum tomate.

**Por que isso importa pra você:** os macros (proteína/carbo/gordura/kcal) que o app
mostra pro aluno são calculados a partir do `ingredients_json`, não do nome nem do
texto. Ou seja, além de parecer estranho, os números nutricionais do plano podem estar
errados quando o ingrediente errado tem um perfil nutricional muito diferente do
ingrediente certo (ex: farinha de trigo no lugar de brócolis muda tudo).

74 refeições já tinham sido identificadas com esse problema e **desativadas** em
2026-08-24 (não aparecem mais em planos novos, mas ainda existem no banco). Preparando
este documento, fizemos uma segunda varredura nas 126 refeições que continuavam ativas
— e achamos **mais 25 com o mesmo problema, ainda em produção agora**, sendo servidas a
alunos reais. Isso muda a resposta pra sua pergunta principal (seção 4).

## 2. O que você precisa fazer

Para cada refeição nas tabelas abaixo, o "problema identificado" já foi mapeado por nós
(comparando nome × ingredientes × preparo). O que falta é o seu julgamento nutricional:

- **Ingredientes corretos**: o que deveria estar na lista (pode manter algum ingrediente
  que já está certo, e trocar só o errado).
- **Quantidades**: se souber de cabeça o valor razoável, ótimo; senão pode deixar em
  aberto que a equipe ajusta.
- Pode reescrever o nome ou o preparo também, se achar que precisa.

Não precisa se preocupar com nomenclatura de sistema (`meal_id`, `food_XXX`) — isso é só
pra rastrearmos a correção de volta ao banco. Preencha a coluna **"Correção sugerida"**
com texto livre.

## 3. Tabela A — 74 refeições já desativadas (não aparecem mais em planos novos)

Essas já foram tiradas de circulação, mas continuam erradas no banco — precisam da sua
correção antes de serem reativadas (ou podem ficar desativadas para sempre, sua
decisão).

| meal_id | Nome | Tipo | Ingredientes atuais | Preparo atual | Problema identificado | Correção sugerida |
|---|---|---|---|---|---|---|
| meal_011 | Frango com Batata Doce e Brócolis | almoço | Peito de frango grelhado, Arroz integral, Farinha de trigo | Grelhe o frango. Sirva com a batata doce cozida em cubos e os brócolis no vapor. | Nem batata doce nem brócolis estão na lista — tem arroz e farinha de trigo no lugar. | |
| meal_012 | Prato Feito (Arroz, Feijão e Bife) | almoço | Batata doce, Macarrão, Contrafilé grelhado | Aqueça o arroz e o feijão. Grelhe o contrafilé... | Nome e preparo falam de arroz+feijão; nenhum dos dois está na lista. | |
| meal_013 | Bacalhau com Batata e Ovo | almoço | Bacalhau, Pão integral, Ovo, Azeite | Cozinhe o bacalhau, as batatas e o ovo... | Pão integral no lugar de batata. | |
| meal_014 | Macarrão à Bolonhesa Saudável | almoço | Quinoa, Carne moída, Molho de tomate | Cozinhe o macarrão integral... | Quinoa no lugar de macarrão. | |
| meal_015 | Strogonoff de Frango com Arroz | almoço | Frango, Creme de leite, Molho de tomate, Batata doce | ...misture o creme de leite e sirva com o arroz. | Batata doce no lugar de arroz. | |
| meal_017 | Salmão Assado com Quinoa e Cenoura | almoço | Salmão, Cuscuz de milho, Polenta | ...sirva com a quinoa cozida e a cenoura. | Nem quinoa nem cenoura presentes. | |
| meal_019 | Omelete de Espinafre e Tomate Seco | almoço | Ovo, Queijo muçarela, Araruta, Tomate seco | Bata os ovos, adicione o espinafre... | Araruta no lugar de espinafre. | |
| meal_020 | Tofu Defumado com Arroz Integral | almoço | Tofu defumado, Milho, Farinha de trigo | ...sirva com o arroz integral e os brócolis. | Nem arroz nem brócolis presentes. | |
| meal_023 | Iogurte com Chia e Maçã | lanche | Iogurte, Chia, Laranja | ...adicione a maçã picada por cima. | Laranja no lugar de maçã. | |
| meal_027 | Torrada com Guacamole Caseiro | lanche | Abacate, Alface, Torrada | ...pique o tomate e tempere... | Alface no lugar de tomate. | |
| meal_032 | Omelete de Queijo Minas e Tomate | jantar | Ovo, Queijo minas, Alface | ...as rodelas de tomate. | Alface no lugar de tomate. | |
| meal_034 | Sopa de Legumes e Feijão | jantar | Pão integral, Polenta, Macarrão, Azeite | Cozinhe a batata e a cenoura... Junte o feijão... | Nenhum dos 3 ingredientes citados (batata/cenoura/feijão) está na lista. | |
| meal_035 | Filé de Pescada com Brócolis | jantar | Pescada, Farinha de trigo, Azeite | ...sirva com os brócolis no vapor... | Farinha de trigo no lugar de brócolis. | |
| meal_036 | Salada Refrescante de Quinoa e Atum | jantar | Cuscuz de milho, Atum, Alface, Azeite | ...misture a quinoa... o tomate picado. | Cuscuz no lugar de quinoa; alface no lugar de tomate. | |
| meal_037 | Carne Moída com Purê de Batata Doce | jantar | Carne moída, Arroz integral | Amasse a batata doce... purê... | Arroz no lugar de batata doce. | |
| meal_038 | Espaguete de Abobrinha com Pesto e Frango | jantar | Arroz parboilizado, Molho Pesto, Frango | Corte a abobrinha em formato de espaguete... | Arroz no lugar de abobrinha — prato inteiro é sobre "macarrão" de abobrinha. | |
| meal_039 | Creme de Espinafre com Tofu Defumado | jantar | Araruta, Tofu defumado, Leite de aveia | Refogue o espinafre... | Araruta no lugar de espinafre. | |
| meal_045 | Patê de Atum com Cenoura | lanche | Atum, Maionese, Polenta | ...a cenoura ralada finamente. | Polenta no lugar de cenoura. | |
| meal_047 | Mingau de Quinoa com Maçã e Canela | café da manhã | Cuscuz de milho, Leite de amêndoas, Laranja, Canela | Cozinhe a quinoa... a maçã picada... | Cuscuz no lugar de quinoa; laranja no lugar de maçã. | |
| meal_055 | Crepe Verde de Espinafre | café da manhã | Ovo, Araruta, Aveia | Bata os ovos, o espinafre cru... | Araruta no lugar de espinafre. | |
| meal_058 | Bruschetta Saudável de Tomate | lanche | Pão francês, Alface, Queijo minas, Azeite | ...tomate em cubos, o queijo minas... | Alface no lugar de tomate (nome do prato é "de Tomate"). | |
| meal_065 | Escondidinho de Batata Doce e Carne | almoço | Arroz integral, Carne moída, Muçarela | Faça um purê de batata doce... | Arroz no lugar de batata doce (nome explícito). | |
| meal_066 | Massa Integral com Pesto e Tomate | almoço | Quinoa, Molho Pesto, Alface | Cozinhe o macarrão... os tomates frescos... | Quinoa no lugar de macarrão; alface no lugar de tomate. | |
| meal_067 | Peito de Frango com Feijão e Quinoa | almoço | Frango, Macarrão, Cuscuz de milho | ...acompanhado da quinoa e do feijão... | Nem feijão nem quinoa — os dois itens do nome — estão presentes. | |
| meal_069 | Lasanha de Abobrinha com Carne | almoço | Arroz parboilizado, Carne moída, Molho de tomate, Muçarela | Corte a abobrinha em fatias finas... | Arroz no lugar de abobrinha. | |
| meal_071 | Sopa Creme de Mandioca e Frango | jantar | Farinha de aveia, Frango, Azeite | Bata a mandioca cozida... | Farinha de aveia no lugar de mandioca. | |
| meal_072 | Taco Low-Carb de Alface | jantar | Aipo (Salsão), Carne moída, Muçarela | Use folhas firmes de alface como base... | Alface — o ingrediente central do nome — nem aparece; tem aipo no lugar. | |
| meal_073 | Omelete de Cogumelos e Espinafre | jantar | Ovo, Pipoca, Araruta | Refogue os cogumelos e o espinafre... | Pipoca no lugar de cogumelos (sem sentido numa omelete); araruta no lugar de espinafre. | |
| meal_074 | Sopa de Tomate Rústica | jantar | Alface, Azeite, Orégano | Asse os tomates no azeite... | Zero tomate numa sopa que se chama "de Tomate" — tem alface no lugar. | |
| meal_075 | Peixe Assado no Papelote com Cenoura | jantar | Pescada, Polenta, Azeite | ...a cenoura fatiada num papel manteiga... | Polenta no lugar de cenoura. | |
| meal_076 | Salada Refrescante de Melancia e Feta | jantar | Abacaxi, Queijo feta | Corte a melancia e o queijo feta... | Abacaxi no lugar de melancia (frutas totalmente diferentes). | |
| meal_077 | Charuto de Repolho com Carne Moída | jantar | Trigo sarraceno, Carne moída | Amoleça as folhas de repolho... enrole... | Repolho (a "casca" do prato) não é um ingrediente rastreado — tem trigo sarraceno. | |
| meal_078 | Creme de Brócolis e Queijo | jantar | Farinha de trigo, Queijo minas, Azeite | Cozinhe bem o brócolis... | Farinha de trigo no lugar de brócolis. | |
| meal_083 | Coxinha Fit de Batata Doce | lanche | Arroz integral, Frango, Farinha de linhaça | Use o purê de batata doce como massa... | Arroz no lugar de batata doce (nome explícito). | |
| meal_088 | Batata Frita Rústica no Forno | lanche | Pão integral, Azeite, Orégano | Corte a batata em palitos... | Zero batata numa receita de "Batata Frita" — tem pão no lugar. | |
| meal_089 | Pipoca Feita na Água | lanche | Pão francês | Coloque o milho de pipoca... estoure sem óleo. | O único ingrediente é pão — não tem milho de pipoca nenhum. | |
| meal_090 | Sushi Bowl (Desconstruído) | almoço | Batata doce, Atum, Araruta, Shoyu | ...arroz na base... espinafre picado... | Batata doce no lugar de arroz; araruta no lugar de espinafre. | |
| meal_099 | Salada Rápida de Feijão Fradinho | almoço | Lentilha, Alface, Azeite | ...o feijão cozido escorrido com tomate... cebola... | Lentilha no lugar de feijão fradinho (leguminosas diferentes); alface no lugar de tomate/cebola. | |
| meal_101 | Bife a Cavalo com Batata Doce | almoço | Alcatra, Ovo, Arroz integral | ...sirva com batata doce cozida. | Arroz no lugar de batata doce. | |
| meal_105 | Espetinho de Frango e Pimentão | almoço | Frango, Cevada em grãos, Azeite | ...intercalando frango e pimentão... | Cevada (grão) no lugar de pimentão — não dá pra espetar cevada. | |
| meal_106 | Carne de Panela com Mandioca | almoço | Músculo bovino, Farinha de aveia, Alface | ...adicione a mandioca até derreter no caldo. | Farinha de aveia no lugar de mandioca; alface não faz sentido no prato. | |
| meal_109 | Iscas de Mignon com Shoyu e Brócolis | almoço | Filé mignon, Farinha de trigo, Shoyu | ...adicione os brócolis e o shoyu... | Farinha de trigo no lugar de brócolis. | |
| meal_110 | Peito de Peru com Salada Quente de Quinoa | jantar | Peru defumado, Cuscuz de milho, Polenta | ...com a quinoa... cenoura ralada... | Cuscuz no lugar de quinoa; polenta no lugar de cenoura. | |
| meal_111 | Salmão Grelhado com Aspargos | almoço | Salmão, Araruta, Azeite | ...salteie os aspargos... | Araruta no lugar de aspargos. | |
| meal_112 | Moqueca Leve de Cação e Banana-da-Terra | almoço | Cação, Maçã, Leite de coco, Dendê | ...a banana-da-terra e o leite de coco... | Maçã no lugar de banana-da-terra (frutas muito diferentes numa moqueca). | |
| meal_113 | Macarrão com Camarão e Alho | almoço | Quinoa, Camarão, Azeite | Cozinhe a massa integral... | Quinoa no lugar de macarrão. | |
| meal_115 | Arroz de Couve-Flor com Polvo | jantar | Batata inglesa, Polvo, Azeite | Triture a couve-flor e refogue como arroz... | Batata inglesa no lugar de couve-flor (o ingrediente do título). | |
| meal_116 | Lentilha Estufada com Cogumelos | almoço | Inhame, Pipoca, Azeite | Cozinhe as lentilhas. Refogue os cogumelos... | Nem lentilha nem cogumelo — tem inhame e pipoca. | |
| meal_117 | Risoto Falso de Quinoa e Funghi | almoço | Cuscuz de milho, Pipoca, Queijo minas | Cozinhe a quinoa. Adicione os cogumelos... | Cuscuz no lugar de quinoa; pipoca no lugar de cogumelos/funghi. | |
| meal_122 | Mingau de Aveia com Maçã e Canela | café da manhã | Aveia, Leite, Laranja, Canela | ...a maçã picada e a canela. | Laranja no lugar de maçã. | |
| meal_123 | Omelete de Claras com Espinafre | café da manhã | Albumina, Araruta, Azeite | ...recheando com espinafre fresco. | Araruta no lugar de espinafre. | |
| meal_124 | Panqueca de Batata Doce | café da manhã | Arroz integral, Ovo | Misture purê de batata doce... | Arroz no lugar de batata doce (nome explícito). | |
| meal_125 | Iogurte Natural com Nozes e Mel | lanche | Iogurte, Farinha de amêndoas, Mel | ...coberto com as nozes picadas... | Farinha de amêndoas (pó) no lugar de nozes (a fruta inteira). | |
| meal_133 | Macarrão com Sardinha e Molho de Tomate | almoço | Quinoa, Sardinha, Molho de tomate | ...envolva na massa integral cozida. | Quinoa no lugar de macarrão. | |
| meal_134 | Bife Acebolado com Mandioca Cozida | almoço | Contrafilé, Farinha de aveia, Azeite | ...acompanhado da mandioca bem cozida. | Farinha de aveia no lugar de mandioca. | |
| meal_135 | Risoto Falso de Frango e Couve-flor | almoço | Batata inglesa, Frango, Creme de ricota | ...com a couve-flor triturada... | Batata inglesa no lugar de couve-flor. | |
| meal_145 | Tofu Assado com Brócolis | jantar | Tofu defumado, Farinha de trigo, Shoyu | ...com floretes de brócolis. | Farinha de trigo no lugar de brócolis. | |
| meal_149 | Sopa Detox de Couve | jantar | Trigo sarraceno, Polenta, Gengibre | Cozinhe o repolho/couve com cenoura... | Nem couve nem cenoura — é uma "sopa detox de couve" sem folha verde nenhuma. | |
| meal_152 | Bowl Proteico Vegano (Quinoa e Tofu) | almoço | Cuscuz de milho, Tofu defumado, Grão-de-bico | Monte na tigela a quinoa... | Cuscuz no lugar de quinoa. | |
| meal_153 | Strogonoff de Cogumelos | almoço | Pipoca, Molho de tomate, Creme de leite, Batata doce | Refogue os cogumelos frescos... sirva com arroz. | Pipoca no lugar de cogumelos; batata doce no lugar de arroz. | |
| meal_155 | Salada de Batata e Ovo (Maionese Fit) | almoço | Pão integral, Ovo, Iogurte | Cozinhe as batatas e os ovos... | Pão no lugar de batata. | |
| meal_157 | Frango Grelhado com Abobrinha | jantar | Frango, Arroz parboilizado, Azeite | ...passe a abobrinha em rodelas... | Arroz no lugar de abobrinha. | |
| meal_158 | Bife de Patinho com Arroz Integral | almoço | Carne moída, Milho, Alface | ...com arroz integral e salada de tomate. | Milho no lugar de arroz (nome explícito diz "Arroz Integral"). | |
| meal_159 | Burrito Bowl (Sem Massa) | almoço | Batata doce, Frango, Macarrão, Guacamole | ...arroz, feijão, frango desfiado... | Macarrão contradiz o próprio nome ("Sem Massa"); batata doce no lugar de arroz, sem feijão. | |
| meal_167 | Ovo Cozido com Batata Doce Amassada | café da manhã | Ovo, Arroz integral | Amasse a batata doce cozida... | Arroz no lugar de batata doce. | |
| meal_169 | Salada Rápida de Cenoura e Ovo | almoço | Polenta, Ovo | Rale a cenoura... | Polenta no lugar de cenoura. | |
| meal_175 | Vitamina de Aveia e Maçã | café da manhã | Leite, Laranja, Aveia | ...a maçã com casca... | Laranja no lugar de maçã. | |
| meal_180 | Suco de Abacaxi com Hortelã e Gengibre | lanche | Suco de abacaxi, Gengibre | ...folhas de hortelã frescas... | Hortelã citada no preparo não é rastreada como ingrediente (severidade baixa — é só tempero). | |
| meal_181 | Frango Desfiado com Purê de Mandioca | almoço | Frango, Farinha de aveia | Cozinhe bem a mandioca e amasse... | Farinha de aveia no lugar de mandioca. | |
| meal_182 | Sopa Clara de Cenoura e Batata | jantar | Polenta, Pão integral, Azeite | Cozinhe a batata e a cenoura... | Nem batata nem cenoura — os dois itens do nome. | |
| meal_183 | Arroz Branco com Ovos Cozidos | almoço | Batata doce, Ovo | Aqueça o arroz branco simples... | Batata doce no lugar de arroz (inverso do padrão mais comum). | |
| meal_184 | Mingau de Maizena (Amido de Milho) | café da manhã | Leite, Arroz branco cozido | Dissolva o amido de milho (maizena)... | Arroz cozido no lugar de maizena — não dá pra fazer um mingau liso com grão de arroz inteiro. | |
| meal_189 | Salada Morna de Quinoa | jantar | Cuscuz de milho, Azeite | Aqueça a quinoa pré-cozida... | Cuscuz no lugar de quinoa. | |
| meal_190 | Ovos Escalfados com Batata | almoço | Ovo, Pão integral | Cozinhe as batatas... | Pão no lugar de batata. | |

## 4. Tabela B — 25 refeições AINDA ATIVAS com o mesmo problema (achado novo, 2026-08-25)

⚠️ **Estas ainda estão sendo servidas em planos de alunos reais agora.** Isso responde
sua pergunta "as outras 127 também foram criadas por IA e têm o mesmo problema?" — a
resposta é **sim, pelo menos em parte**: das 126 refeições que continuavam ativas depois
da limpeza de 2026-08-24, encontramos mais 25 (~20%) com o mesmo tipo de erro numa
segunda varredura manual. Não tivemos tempo de fazer uma checagem automatizada
confiável — o que fizemos foi ler as 126 uma a uma comparando nome × ingredientes ×
preparo, o mesmo método usado nas 74 da Tabela A. As outras ~101 pareceram consistentes,
mas recomendamos que você reveja pelo menos por amostragem, já que o critério final é
nutricional, não só textual.

**Recomendação da equipe:** considerando esse achado, a resposta à sua pergunta é
revisar as 99 linhas (74 + 25) como prioridade, e o restante do catálogo (101) por
amostragem quando tiver tempo — não dá pra confiar que só as 74 já sinalizadas tinham
problema.

| meal_id | Nome | Tipo | Ingredientes atuais | Preparo atual | Problema identificado | Correção sugerida |
|---|---|---|---|---|---|---|
| meal_030 | Batido Verde (Green Smoothie) | café da manhã | Araruta, Laranja, Leite de aveia, Farinha de linhaça | Bata o espinafre, a maçã, o leite de aveia... | Araruta no lugar de espinafre; laranja no lugar de maçã. | |
| meal_033 | Salada Caesar Saudável com Frango | café da manhã/lanche | Frango, Aipo (Salsão), Parmesão, Iogurte | Misture a alface, o frango grelhado e o parmesão... | Aipo no lugar de alface — ingrediente central de uma salada Caesar. | |
| meal_061 | Salada Caprese com Frango | almoço | Frango, Aipo, Torrada integral, Maionese | ...misture a alface picada, crutons... | Aipo no lugar de alface; e uma "Caprese" sem tomate nem muçarela de búfala rastreados. | |
| meal_062 | Bowl de Salmão e Abacate | almoço | Salmão, Abacate, Milho | ...arroz integral, o salmão... | Milho no lugar de arroz. | |
| meal_079 | Hambúrguer de Atum Sem Pão | almoço | Atum, Ovo, Aipo | ...numa cama de alface. | Aipo no lugar de alface (severidade baixa, é a "cama" do prato). | |
| meal_080 | Macarrão Konjac (Shirataki) ao Molho Shoyu | jantar | Macarrão konjac, Shoyu, Pipoca | ...Refogue com cogumelos... | Pipoca no lugar de cogumelos. | |
| meal_086 | Pizza de Berinjela (Low Carb) | jantar | Batata baroa (mandioquinha), Molho de tomate, Muçarela | Corte a berinjela em rodelas grossas... | Batata baroa no lugar de berinjela — o ingrediente do nome. | |
| meal_093 | Salada Caprese Expresso | almoço/lanche | Muçarela, Alface, Azeite | Corte o queijo muçarela e o tomate em cubos... | Alface no lugar de tomate — de novo, uma "Caprese" sem tomate. | |
| meal_098 | Wrap Doce de Pasta de Amendoim | café da manhã/lanche | Wrap, Pasta de amendoim, Laranja | ...fatias finas de maçã. | Laranja no lugar de maçã. | |
| meal_102 | Frango ao Curry com Leite de Coco | jantar | Frango, Leite de coco, Cúrcuma, Farinha de trigo | ...Sirva com brócolis. | Farinha de trigo no lugar de brócolis. | |
| meal_104 | Picadinho de Carne com Legumes | almoço | Alcatra, Polenta, Pão integral, Molho de tomate | ...adicione a cenoura, batata... | Nem cenoura nem batata — os "legumes" do nome. | |
| meal_119 | Salada Reforçada de Feijão Preto | almoço | Feijão preto, Alface, Cevada em grãos, Azeite | ...com tomate e pimentão picados. | Alface no lugar de tomate; cevada (grão) no lugar de pimentão. | |
| meal_128 | Smoothie Verde Energético | café da manhã | Leite de coco, Araruta, Banana, Laranja | ...espinafre, banana e maçã. | Araruta no lugar de espinafre; laranja no lugar de maçã. | |
| meal_132 | Frango Grelhado com Salada de Grão | jantar | Frango, Grão-de-bico, Alface, Azeite | ...salada fria de grão-de-bico, tomate... | Sem tomate rastreado (severidade baixa). | |
| meal_139 | Salada Caesar com Salmão | almoço | Salmão, Aipo, Parmesão, Maionese | ...coloque sobre a alface... | Aipo no lugar de alface. | |
| meal_140 | Omelete Recheada de Atum | almoço/jantar | Ovo, Atum, Alface | ...atum misturado com tomate como recheio... | Alface no lugar de tomate (severidade baixa). | |
| meal_142 | Ceviche de Salmão Saudável | jantar | Salmão, Limonada, Alface | ...misture com tomate, cebola roxa... | Alface no lugar de tomate/cebola. **Bug técnico à parte:** o campo de preparo está gravado como um JSON malformado (`{"pt":"...","en":"...","fr":"..."}` com aspas quebradas dentro do texto) em vez de texto puro — isso é bug de dado, não de nutrição; sinalizamos pro time técnico corrigir também. | |
| meal_143 | Sopa de Frango com Legumes | jantar | Frango, Pão integral, Polenta | Cozinhe a batata, cenoura... | Nem batata nem cenoura — pão e polenta no lugar. | |
| meal_146 | Wrap Leve de Queijo Branco | lanche | Wrap, Queijo minas, Aipo | ...folhas de alface... | Aipo no lugar de alface (severidade baixa). | |
| meal_148 | Filé Mignon com Salada Verde | jantar | Filé mignon, Aipo, Azeite | ...sirva com alface... | Aipo no lugar de alface (severidade baixa). | |
| meal_150 | Atum com Legumes no Vapor | jantar | Atum, Farinha de trigo, Polenta | Cozinhe brócolis e cenoura no vapor... | Nem brócolis nem cenoura. | |
| meal_171 | Suco Verde Detox Intenso | lanche | Trigo sarraceno, Araruta, Laranja, Limonada | Bata a couve, o espinafre e a maçã... | Nenhuma folha verde num "suco verde" — trigo sarraceno é um grão sólido, impossível de bater como suco. Um dos casos mais graves da lista. | |
| meal_185 | Peixe Branco Cozido no Caldo | jantar | Pescada, Polenta | ...rodelas finas de cenoura... | Polenta no lugar de cenoura (severidade baixa). | |
| meal_195 | Espaguete à Bolonhesa com Parmesão | almoço | Quinoa, Carne moída, Molho de tomate, Parmesão | Cozinhe a massa... | Quinoa no lugar de macarrão. | |
| meal_197 | Prato Feito Turbinado (Ovo e Fritas) | almoço | Batata doce, Macarrão, Contrafilé, Ovo, Batata frita | ...arroz, feijão, bife... | Batata doce no lugar de arroz; macarrão no lugar de feijão. | |

## 5. Resumo executivo

| | Quantidade | % do catálogo (200) |
|---|---|---|
| Já desativadas com problema confirmado (Tabela A) | 74 | 37% |
| Ainda ativas com problema confirmado (Tabela B) | 25 | 12,5% |
| **Total com problema confirmado** | **99** | **49,5%** |
| Ativas, revisadas, sem problema aparente | 101 | 50,5% |
| Ativas, ainda não revisadas por este processo | 0 (todas as 200 foram olhadas) | — |

*(números conferidos contra o banco em 2026-08-25: 74 refeições com `is_active=false`,
todas na Tabela A; 25 encontradas na segunda varredura das 126 ativas, Tabela B.)*

## 6. Padrões recorrentes (pra facilitar sua revisão)

Se ajudar a ir mais rápido, os erros se repetem em blocos — corrigir "de uma vez" pode
ser mais eficiente que ler cada linha isolada:

- **quinoa → cuscuz de milho** (aparece em ~10 refeições diferentes)
- **batata doce ↔ arroz (integral/branco/parboilizado)** (troca nos dois sentidos, ~15 refeições)
- **brócolis → farinha de trigo** (~6 refeições)
- **cenoura → polenta** (~7 refeições)
- **maçã → laranja** (~6 refeições)
- **mandioca → farinha de aveia** (~4 refeições)
- **cogumelos/funghi → pipoca** (~4 refeições)
- **couve-flor → batata inglesa** (2 refeições)
- **espinafre → araruta** (~6 refeições)
- **tomate → alface** (~10 refeições, geralmente severidade mais baixa por ser acompanhamento)
- **abobrinha → arroz (parboilizado)** (3 refeições)

Se você confirmar esses padrões, pode ser mais rápido pedir pro time técnico rodar uma
correção em lote pra cada padrão (ex: "toda vez que aparece X, virar Y") em vez de
editar uma por uma — mas confirme antes, porque nem toda ocorrência do padrão está
necessariamente errada da mesma forma.
