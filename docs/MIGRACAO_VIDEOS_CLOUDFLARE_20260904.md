# Vídeos: migração Drive → Cloudflare R2 (2026-09-04)

Desenho fechado, aprovado, nada implementado ainda. Este doc existe pra alguém que retomar isso
depois entender o **porquê** de cada decisão, não só o quê — várias delas não são óbvias e foram
corrigidas em cima de uma suposição errada no meio do caminho (ver "Correção de rota" abaixo).

## Ordem: migração primeiro, card em grade depois

`image_url` está vazio em 298 de 298 exercícios — 0%. Só `video_url` está populado (297/298),
hoje como link de Google Drive. Link de Drive não gera thumbnail nem player embutido — abre em
aba nova, sem imagem de capa. O slot de mídia de 150px do design (`Exercicios.dc.html`,
placeholder "Arraste vídeo/foto", badge de saúde sobreposto, contagem) pressupõe uma capa que não
existe pra nenhum exercício hoje. Construir o card em grade antes da migração resultaria em 298
placeholders vazios — mesma classe de "tela pronta, dado ausente" da Aderência (30d) em
UserDetail.

## Correção de rota (registrado pra não repetir o raciocínio errado)

O plano original assumia Cloudflare **Stream** (transcodificação + thumbnail automático,
import por URL direto do Drive). Isso foi corrigido: os vídeos já foram convertidos pra MP4 e
subidos manualmente num bucket **R2** (armazenamento puro, sem processamento de vídeo, sem
thumbnail automático). Duas consequências que mudaram o desenho inteiro:

1. **Não há upload nem conversão a fazer** — só falta casar cada arquivo do bucket com o
   exercício certo e escrever a referência no banco.
2. **O casamento automático por `video_url` (que a suposição de Stream permitia pular) volta a
   ser necessário**, porque os nomes de arquivo no R2 são soltos, sem vínculo com `exercise_id`.

## Casamento de arquivo — regra central: nada ambíguo vira match automático

**Correção 2026-09-05: caminho preferido não usa Drive API.** O plano original comparava o nome
do arquivo no R2 contra o nome original do arquivo no Drive (obtido via metadado da Drive API).
Substituído pelo caminho mais direto: comparar o nome do arquivo no R2 direto contra
`exercises.name_ptbr` — o nome real do exercício, que já temos pros 298 sem credencial nenhuma.
Faz sentido porque os arquivos originais já foram nomeados a partir do nome do exercício (ex:
"AGACHAMENTOLIVRE 2.MOV" para "Agachamento livre" — confirmado ao abrir amostras do Drive em
2026-09-04). Normalização precisa ser mais agressiva que a `normalizeExerciseName` original
(minúsculas, sem acento) — precisa também remover espaço e pontuação dos dois lados, já que
"AGACHAMENTOLIVRE" (sem espaço) precisa casar com "Agachamento livre" (com espaço). Só recorre à
Drive API (leitura de metadado, sem baixar vídeo) se o match direto por nome não tiver taxa de
acerto suficiente numa amostra — testado com 15-20 nomes reais do bucket antes de decidir.

**Dois riscos tratados como bloqueio de match automático, não como algo a resolver por
desempate:**

- **Nome de exercício duplicado** (os 19 pares já conhecidos, incluindo o caso `ex_194`/`ex_216`
  da Marina) — se dois exercícios normalizam pro mesmo nome, ou um nome bate em mais de um
  arquivo do bucket, isso NUNCA vira match automático, mesmo que um critério de desempate exista.
  Vai pra lista de revisão manual com a razão explícita.
- **Sufixo numérico no nome do arquivo** (ex: "AGACHAMENTOLIVRE 2.MOV") — sugere regravação ou
  variação; mesmo com match único e limpo, entra em revisão manual, porque a dúvida não é "bateu
  ou não", é "essa é a versão certa".

**Tamanho de arquivo é pista fraca, não critério.** Motivo: duração se preserva exatamente numa
conversão de codec (é o mesmo tempo de vídeo); tamanho não — depende de bitrate/resolução
escolhidos na conversão, dois arquivos do mesmo exercício podem sair com tamanhos bem diferentes
sem nada estar errado. Usado só como coluna informativa na lista de ambíguos, nunca pra decidir
sozinho. Ordem alfabética/posição de listagem foi descartada como pista — sem garantia de
correspondência estável entre as duas origens, risco de desalinhar tudo a partir de um erro.

**Entrega: três listas, sem `UPDATE` nenhum.** Confiável (match único, sem sufixo suspeito) /
Ambíguo (motivo + tamanhos como referência) / Sem correspondência. Quem decide os ambíguos é
quem está pilotando o produto, não um proxy automático.

## Acesso ao bucket: público, Public Development URL do R2 (`r2.dev`) — decisão fechada

**Decisão de controle de acesso (permanente): público, sem URL assinada.** Vídeo de demonstração
de execução de exercício não é o produto — tem equivalente grátis em qualquer plataforma de
vídeo. O que se vende é o plano personalizado e a validação profissional. Custo de
super-proteger (URL assinada, bucket privado) supera o benefício aqui: o modo de falha de
proteção a mais é "vídeo não carrega pro aluno pagante", pior que o modo de falha de proteção a
menos ("alguém consegue baixar um vídeo de agachamento"). **Isso não é a mesma categoria de
decisão que o registro de entrega do PDF** (`PENDENCIAS_USERDETAIL_...md`) — lá o risco cresce
com o volume porque envolve responsabilidade clínica assinada por profissional; aqui não, então
não se aplica a mesma régua de "resolver antes de escalar".

**Domínio: Public Development URL do bucket** (`https://pub-b8a8c93fcde740fcb7ad36f410c9737f.r2.dev`,
bucket `videos`). Custom Domain (`videos.ybytu.app`) foi avaliado e descartado, não só adiado —
ver motivo abaixo.

**Por que Custom Domain está fora, não só adiado:** o R2 Custom Domain exige que o domínio já
seja uma zona ativa na conta Cloudflare. `ybytu.app` não é. Colocar `ybytu.app` no Cloudflare
exige um de dois caminhos: mover os nameservers do domínio inteiro pra lá (afeta WordPress,
Resend e Vercel, que já funcionam hoje via OVH/DNS atual — risco real por um ganho que é só
exibir vídeo de exercício), ou usar o modo de onboarding parcial (CNAME) — que a Cloudflare
restringe a planos pagos/Enterprise, não disponível no plano atual. Nenhum dos dois se justifica
pra este caso de uso. Fica registrado como opção futura caso o domínio inteiro venha a migrar pro
Cloudflare por outro motivo — não como próximo passo natural desta migração.

**`r2.dev` é domínio de teste da Cloudflare, com rate-limit mais agressivo e sem SLA — avaliado e
aceito pra este volume.** Piloto com poucos alunos, poucos vídeos por sessão fica bem abaixo de
qualquer limiar razoável de anti-abuso. Se algum dia isso deixar de ser verdade (sinal: erro 429
específico de rate-limit), a correção é uma linha (`getVideoUrl`/`getThumbnailUrl`), porque o
banco guarda só a chave do objeto, nunca a URL resolvida (ver seção abaixo) — nenhuma das 297
linhas muda.

Domínio não é decisão de custo — confirmado que R2 não cobra egresso em nenhum caminho (público
direto, domínio customizado, `r2.dev`, ou atrás de Worker/URL assinada); a escolha é só sobre
confiabilidade em produção, neutra em preço.

## Banco: chave do objeto, não URL completa — porta pra URL assinada aberta de graça

**`video_url` guarda a chave do objeto no bucket** (ex: `exercicios/ex_001.mp4`), não a URL
resolvida. Um resolver único no front-end monta a URL final:

```js
const R2_PUBLIC_BASE = 'https://pub-b8a8c93fcde740fcb7ad36f410c9737f.r2.dev'; // temporário, ver acima

function getVideoUrl(value) {
  if (!value) return null;
  if (value.startsWith('http')) return value;        // ainda no Drive, usa como está
  return `${R2_PUBLIC_BASE}/${value}`;                 // já migrado, chave de objeto R2
}
```

**Por quê guardar chave em vez de URL:** se um dia a decisão de acesso mudar (URL assinada,
trocar de domínio), só essa função muda — nenhum componente que exibe vídeo precisa ser tocado,
porque nenhum usa o valor cru do banco diretamente. Custa nada a mais fazer isso agora.

**Por que a detecção por prefixo `http`, e não coluna nova:** resolve a coexistência durante
migração parcial sem quebrar nada. Uma linha ainda não migrada continua com o link de Drive
funcionando (é uma URL completa, cai no primeiro `if`); no instante em que o `UPDATE` daquela
linha específica roda, o valor vira uma chave e o mesmo resolver já sabe montar a URL do R2 — sem
janela de quebra, sem precisar migrar as 297 linhas de uma vez.

**`image_url`: mesmo padrão (`getThumbnailUrl`), mas sem legado pra coexistir** — está vazio em
298/298, não existe link antigo de nenhum tipo nessa coluna. Grava chave desde a primeira linha
migrada.

## Ordem de execução

1. Casamento roda primeiro — gera as três listas.
2. Revisão humana dos ambíguos (aprova, corrige, ou deixa de fora).
3. Geração de thumbnail roda SÓ sobre o confirmado (confiável + ambíguos aprovados manualmente) —
   nunca sobre a lista bruta do bucket. Um vídeo sem match certo não ganha capa.
4. `video_url` e `image_url` de uma linha são escritos juntos, no mesmo `UPDATE`, só depois que
   os dois (match confirmado + frame gerado) estiverem prontos — evita estado intermediário onde
   uma linha aponta pro vídeo novo mas ainda não tem capa.

## Geração de thumbnail — frame a 40% da duração, automatizável sem assistir a nenhum vídeo

`ffmpeg` lê remoto por HTTP (testado, confirmado — busca só o trecho necessário, não baixa o
arquivo inteiro; teste rodado contra um MP4 público qualquer, não dos nossos). Frame por
**porcentagem da duração, não segundo fixo** — segundo fixo acerta pra vídeo longo e erra pra
curto (pega o frame de reset do fim do loop). `ffprobe` lê a duração (rápido, só metadado),
`ffmpeg` extrai o frame em ~40% dela — cedo o bastante pra passar da pose parada inicial, tarde o
bastante pra não pegar o fim/reset. Ressalva aceita: em casos raros pode sair uma capa mediana
(pausa no meio do movimento) — errar aqui custa estética, não segurança, não é o mesmo tipo de
risco do casamento de arquivo, não justifica análise de movimento pra escolher o frame "certo".

## Pré-requisitos pra rodar

- ~~`videos.ybytu.app` configurado~~ — descartado por agora, ver seção de domínio acima. Acesso
  já resolvido via Public Development URL do R2, nenhuma configuração de DNS pendente.
- Exportação da listagem de objetos do bucket `videos` (painel Cloudflare) — em andamento.
- Chave de API do Google com Drive API habilitada, só leitura de metadado (`name`, `size`) — em
  andamento.
