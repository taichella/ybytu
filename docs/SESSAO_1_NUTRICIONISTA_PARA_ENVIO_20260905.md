# Revisão de segurança alimentar — sua ajuda é necessária antes do lançamento

*Atualizado 2026-09-13 — coco está no documento, no Bloco 3 e numa nota própria abaixo; duas
divulgações novas (Whey e piso de proteína); alguns itens do Bloco 3 original mudaram de bloco
depois de revisão interna. Se você já tinha visto uma versão anterior deste documento, use esta.*

## O que é isso

O app monta o cardápio de cada aluno automaticamente, escolhendo receitas de um catálogo. Cada
alimento do catálogo tem um cadastro de alergênicos — mas boa parte desse catálogo ainda não foi
revisada por nenhuma nutricionista. **Hoje, nada impede que uma refeição com ingrediente ainda
não revisado chegue a um aluno.** A única coisa que existe é um aviso na tela do aluno dizendo
"Alergênicos não verificados" — é honesto, mas não diz se há risco real ou não, e não impede a
entrega da refeição.

Sua revisão é o que transforma esse "não sabemos" em informação de verdade. Não é uma trava
técnica que sua resposta libera — é a diferença entre o aluno saber ou não saber o que está
comendo.

## Três decisões já tomadas sem sua revisão formal

Nenhuma delas mudou o que já estava no cadastro, mas um documento que existe pra registrar
proveniência não pode esconder isso.

**Whey Protein Concentrado (soja).** Decidido: mantemos o cadastro atual (contém soja), com base
em análise preliminar sem validação de CRN. É o alimento mais usado de todo o lote — **7
refeições ativas**. Aplicação ainda pendente: só entra em vigor quando o restante deste lote for
respondido e tudo rodar junto.

**Piso mínimo de proteína numa refeição principal.** Decidido: 20g como padrão, 15g valendo
durante o piloto, 10g como piso absoluto. Também com base em análise preliminar sem CRN.
Substitui uma categoria de auditoria antiga ("Refeição Incompleta") que tinha 80% de falso
positivo. Aplicação ainda pendente: ainda não implementado em código.

**Coco.** Os 7 produtos de coco seguem marcados como castanha, como sempre estiveram — não mudamos
nada. Criamos, em paralelo, uma opção "Sem Coco" no cadastro, porque a marcação de castanha
protegia a pessoa errada: quem é alérgico só a coco não tinha como se declarar.

Fica registrado que a análise preliminar recomendou remover a marcação de castanha, com este
argumento: coco não está na lista de alergênicos obrigatórios da Anvisa (RDC 727/2022), que nomeia
individualmente amêndoa, avelã, caju, castanha-do-pará, macadâmia, nozes, pecã, pistache e pinoli.
A classificação americana inclui coco, mas por herança de nomenclatura. Não seguimos essa
recomendação sem você — é pauta da sessão 2. Se quiser decidir já, é só dizer.

Nenhuma outra mudança deste documento entrou em vigor ainda — está tudo esperando suas respostas
abaixo pra aplicar tudo de uma vez.

---

## Bloco 1 — 31 alimentos simples onde a análise preliminar não encontrou nenhum alergênico

Se concorda com todos, responda **"Confirmo os 31, sem alergênico"** — não precisa escrever
linha por linha. Se discordar de algum, escreva o nome dele e o que ele contém.

Banana · Cacau em pó (sem açúcar) · Peito de frango grelhado · Azeite de oliva extravirgem ·
Tapioca (goma preparada) · Morango · Grão-de-bico cozido · Mel de abelha · Abacate · Batata doce
cozida · Chia hidratada (Pudim de Chia base) · Limonada sem açúcar · Ervilha em conserva · Canela
em pó · Aipo (Salsão) · Alface · Mamão · Feijão preto cozido · Biscoito de arroz · Farinha de
linhaça · Farinha de grão-de-bico · Geleia de morango · Café sem açúcar · Chá verde sem açúcar ·
Kombucha (tradicional) · Cúrcuma (Açafrão-da-terra) · Orégano seco · Gengibre em pó · Spirulina
em pó · Açaí com xarope de guaraná · Batata frita Fast-Food

---

## Bloco 2 — 2 alimentos onde a análise preliminar tem baixa confiança

Bacon de peru e peito de peru defumado são embutidos industrializados. A análise preliminar
**marcou soja nos dois**, mas com **baixa confiança**, porque depende da marca do fabricante —
nem todo produto usa proteína de soja como aglutinante, mas é prática comum o bastante pra não
aceitar a marcação automática sem confirmação sua.

| Alimento | O que a análise preliminar marcou |
| --- | --- |
| Bacon de peru | Contém soja (baixa confiança) |
| Peito de peru defumado | Contém soja (baixa confiança) |

**Sua resposta por linha:** "Confirmo, contém soja" ou "Não, está correto, sem alergênico"

---

## Bloco 3 — 9 alimentos que a análise preliminar não conseguiu decidir só pelo nome

Aqui não tem recomendação de bulk — cada um precisa de uma resposta sua: **"Sem alergênico"** ou
**"Contém: ______"**. Se realmente não der pra saber sem mais informação do fornecedor, pode
responder **"Não dá pra saber, precisa de mais dado"** — isso é uma resposta válida, não vamos
forçar um chute.

| Alimento | Por que não deu pra decidir só pelo nome |
| --- | --- |
| Colágeno hidrolisado | A alergenicidade muda conforme a fonte (bovino, suíno, peixe ou marinho), e isso não está registrado hoje |
| Salgadinho de pacote (tipo chips de milho) | Composição industrializada, nome não diz tudo |
| Extrato de baunilha | Composição industrializada, nome não diz tudo |
| Molho de tomate caseiro | Prato composto, molhos costumam esconder ingrediente |
| Ketchup | Prato composto, molhos costumam esconder ingrediente |
| Guacamole | Prato composto, molhos costumam esconder ingrediente |
| Hambúrguer vegetal (tipo carne) | Prato composto, composição depende da marca |
| Purê de abóbora (preparado) | É item preparado, não ingrediente cru — mesmo cuidado dos molhos acima |
| Água de coco | Os outros produtos de coco do catálogo (seco, ralado, óleo, farinha, açúcar, leite, iogurte) estão marcados com alergênico de castanha; esta nunca foi revisada e merece atenção individual, não confirmação em bulk |

---

## Bloco 4 — 12 alimentos onde já existe um cadastro, mas uma segunda análise discorda

Diferente do bloco 3, estes já têm alergênico confirmado no cadastro. Uma segunda análise propõe
remover o(s) alergênico(s) de cada linha — mas essa segunda fonte já errou bem mais vezes
removendo alergênico que deveria estar do que adicionando um que faltava, numa checagem anterior.
Não é uma segunda opinião equilibrada, então a pergunta de cada linha é: **o cadastro atual está
certo, ou a segunda análise está certa?**

Se o cadastro estiver errado, o aluno já está recebendo essa refeição hoje achando que o
alergênico está confirmado — o que é pior que "não verificado", porque parece verificado sem
estar.

Formato de resposta por linha: **"Confirmo, o cadastro está certo"** ou **"A segunda análise está
certa, pode remover"**.

| Alimento | Aparece em quantas refeições ativas | Hoje está registrado como contendo | A segunda análise quer remover |
| --- | --- | --- | --- |
| Presunto cozido | 3 | carne de porco | carne de porco (ficaria sem nenhum alergênico) |
| Pão de hambúrguer | 2 | glúten, gergelim, trigo | gergelim |
| Purê de batata (preparado) | 2 | leite | leite (ficaria sem nenhum alergênico) |
| Massa de panqueca (simples) | 2 | ovo, glúten, leite, trigo | ovo, leite |
| Creme de ricota | 2 | leite | leite (ficaria sem nenhum alergênico) |
| Granola tradicional | 1 | glúten, castanhas | castanhas |
| Pão de queijo | 1 | ovo, leite | ovo |
| Cuscuz marroquino (cozido) | 1 | glúten, trigo | glúten, trigo (ficaria sem nenhum alergênico) |
| Farinha de rosca | 1 | glúten, trigo | glúten, trigo (ficaria sem nenhum alergênico) |
| Tahine (Pasta de gergelim) | 1 | gergelim | gergelim (ficaria sem nenhum alergênico) |
| Nuggets vegetais | 1 | glúten, soja, trigo | soja |
| Maionese vegana | 1 | soja | soja (ficaria sem nenhum alergênico) |

---

## O que NÃO precisa da sua atenção agora

Dos 486 alimentos do catálogo, 190 não aparecem em nenhuma refeição ativa hoje — ficam pra uma
próxima sessão, sem urgência, e não foram esquecidos. O mesmo vale pra receitas novas pedidas,
correções de catálogo e revisão de instruções de preparo. Você não está aprovando o catálogo pela
metade — está resolvendo só a fatia mais urgente pro aluno agora.

---

*Versão de envio, em linguagem simples, sem termos técnicos do sistema. A versão técnica completa
— com a justificativa de cada decisão e achados registrados pra ação nossa (não perguntas pra
nutricionista) — está em `docs/SESSAO_1_NUTRICIONISTA_20260902.md`.*
