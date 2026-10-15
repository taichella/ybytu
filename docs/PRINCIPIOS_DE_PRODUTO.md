# Princípios de produto

Regras decididas pela Taina que valem para qualquer tela ou função nova, não só para a que as originou.
Antes de desenhar ou implementar algo que mostre dado do aluno, conferir esta lista.

## 1. Dia sem registro não é dia sem comer (2026-10-15)

O sistema só sabe o que o aluno **registrou**. Ausência de registro não é dado: não quer dizer que ele
pulou a refeição, comeu menos ou saiu do plano.

- Nunca transformar falta de registro em afirmação sobre o aluno ("comeu 1.240 de 1.800 kcal",
  "pulou o lanche", "dia parcial").
- **Sem comparação com a meta de kcal** em nenhuma tela, nem do aluno nem do profissional: com registro
  incompleto, a comparação sugere que o aluno comeu menos, e o sistema não sabe disso.
- Kcal mostradas são sempre "kcal **registradas**".
- Dia sem nenhum registro aparece como "sem registros" (neutro), nunca como falha.

## 2. Registrar é acompanhar, não cumprir (alimentação, 2026-10-15)

Ninguém come tudo todo dia, e um aluno que pulou o lanche não fez nada de errado.

- Para o aluno: sem fração, sem porcentagem, sem "faltam N", sem cor de alerta. "3 refeições registradas
  hoje", com indicação neutra de quais foram registradas.
- Sem "fechamento do dia" e sem aviso no dia seguinte sobre o que não foi registrado.
- Para o profissional pode ser factual ("3 de 5 refeições registradas"), sempre com "registradas", nunca
  "feitas" ou "cumpridas".
- No treino é diferente: a sessão aberta é um estado que precisa de desfecho, e não concluir é informação
  real (treino parcial, fechado na virada do dia no fuso do aluno).

## 3. Nunca gravar sugestão como se fosse registro do aluno (2026-10-15)

Valor pré-preenchido (última carga, carga prescrita) é sugestão. Só vira registro quando o aluno confirma.
Prescrição e execução aparecem separadas: "Prescrito: 20 kg" x "✓ Registrado por você: 23,5 kg".

## 4. Não inventar dado para preencher o desenho (recorrente desde 2026-09)

Se o dado não existe (kcal do treino, SLA de parecer, objetivo resumido), o bloco sai da tela. Bloco vazio
ou com número inventado é pior que bloco nenhum. Exemplos: barra de progresso fixa do template 03, SLA do
template 09, "🔥 340 kcal" do treino.

## 5. Histórico do aluno não se reescreve (2026-10-15)

Check-in gravado não é alterado nem apagado pelo aluno; a hora é sempre a do servidor. Desfazer só existe
por função com regra explícita e prazo curto (treino: reabrir até 3h; refeição: só no mesmo dia, no fuso
do aluno). Depois disso, o registro é histórico. O profissional toma decisão com base nele.
