# Pendência: varredura de dado fabricado em `apps/ybytu-app` (não agora)

Registrado 2026-09-05, no mesmo dia da varredura que achou dado fabricado em `Users.jsx` e
`Login.jsx` (dashboard admin, `apps/ybytu-dashboard`).

## Por que não foi feita

`apps/ybytu-app` (o app do aluno) está fora do escopo do piloto atual, não bate com o schema
vigente, e é backlog de uma segunda etapa do produto. Varrer agora produziria uma lista de
problemas num código que ninguém vai rodar nem revisar tão cedo — custo sem retorno no momento.

## O que fazer quando esse app voltar à mesa

Repetir a mesma varredura já aplicada em `apps/ybytu-dashboard`, usando as duas técnicas
documentadas em `docs/PADRAO_SISTEMA_NAO_SABIA_QUE_NAO_SABIA_20260904.md` ("Técnicas de detecção
reutilizáveis"):

1. Grep por número/percentual formatado como texto literal em JSX (não dentro de `{}`) — pega
   fabricação numérica sem depender de comentário de quem escreveu.
2. Comparação tela por tela contra qualquer mockup de origem que exista pro app do aluno,
   perguntando pra cada valor exibido "isso tem fonte real, ou é o exemplo que ninguém trocou?" —
   mais lento, mas pega o que a primeira técnica não pega (fabricação em prosa: nome, data,
   depoimento de exemplo).

Vale rodar antes de qualquer decisão de retomar `apps/ybytu-app`, não depois — é mais barato
achar isso antes do app receber tráfego real do que depois.
