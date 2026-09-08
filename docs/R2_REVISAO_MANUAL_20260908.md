# Revisão manual do casamento R2 x Drive -- 2026-09-08

Nada aqui foi aplicado automaticamente -- toda linha precisa de decisão humana antes de virar UPDATE de video_url. Ver docs/R2_MATCH_LIMPO_20260908.csv para os 185 que casaram limpo (1 exercicio, 1 arquivo, sem ambiguidade) e docs/R2_SEM_CORRESPONDENCIA_20260908.md para o que nao tem pista nenhuma.

## ACHADO CRÍTICO -- os 3 exercícios zerados como "arquivo Drive inexistente" (2026-09-06) têm candidato quase idêntico no R2

`ex_062` (Abdução em pé com miniband), `ex_068` (Sumô Deadlift com halteres) e `ex_179` (Crucifixo com
halteres deitado) tiveram `video_url` zerado em 2026-09-06 porque o link do Drive dava HTTP 404 puro
("arquivo deletado/ID inválido", ver `scripts/video_url_null_404_drive_20260906.sql`). Cruzando o
`name_ptbr` desses 3 contra a listagem do R2 (o CSV não tinha `arquivo_original_drive` pra eles --
já estava vazio quando o export rodou, por isso o casamento por nome de arquivo não os pegou),
apareceram candidatos no R2:

- `ex_179` → `CRUCIFIXO COM HALTERES DEITADO_2.mp4` -- **nome idêntico, distância zero**.
- `ex_068` → `SUMO DEADELIFT COM HALTERES_2.mp4` / `SUMO DEADELIFT COM HALTERES(1)_2.mp4` -- só
  difere por um typo ("DEADELIFT" em vez de "DEADLIFT") já presente no nome do arquivo no R2;
  **dois candidatos, ambíguo qual dos dois usar**.
- `ex_062` → `ABDUCAO EM PE COM BAND_2.mp4` -- falta "MINI" no nome (miniband → band), mesmo assim
  é o candidato mais forte disponível, único.

**Isso pode significar que os 3 vídeos não estão perdidos** -- o arquivo pode ter sido migrado pro
R2 antes do link do Drive quebrar, ou nunca dependeu do Drive pra além do nome. Não confirmei
abrindo os vídeos (não tenho acesso de reprodução daqui) -- antes de reverter o `video_url = NULL`
desses 3 e apontar pro R2, alguém precisa abrir os 3 arquivos do R2 acima e confirmar visualmente
que é o exercício certo (principalmente `ex_068`, que tem 2 candidatos -- pode ser 2 takes do mesmo
exercício ou 2 coisas diferentes).

## Parte 1 -- quase-match (nome quase idêntico, provável mesmo arquivo, mas NÃO auto-aplicado)

Motivo em cada caso: erro de digitacao ou palavra faltando no nome gravado no Drive/R2, nao diferenca real de exercicio. Confirme abrindo o video antes de gravar a URL.

| exercise_id | nome | fonte da comparacao | valor no CSV (Drive) | arquivo no R2 | distancia | observacao |
|---|---|---|---|---|---|---|
| ex_039 | Box Squat Unilateral com halteres | arquivo_original_drive | BOX SQUAT UNILATERAL COM HALTER.MOV | BOX SQUAT UNILATERAL COM HALTERES_2.mp4 | 2 |  |
| ex_062 | Abdução em pé com miniband | name_ptbr | Abdução em pé com miniband | ABDUCAO EM PE COM BAND_2.mp4 | 4 | **ACHADO CRITICO: este exercicio foi zerado como "arquivo Drive inexistente" -- mas existe candidato no R2 com nome quase identico. Ver secao ACHADO CRITICO acima antes de decidir.** |
| ex_068 | Sumô Deadlift com halteres | name_ptbr | Sumô Deadlift com halteres | SUMO DEADELIFT COM HALTERES(1)_2.mp4 | 1 | **ACHADO CRITICO: este exercicio foi zerado como "arquivo Drive inexistente" -- mas existe candidato no R2 com nome quase identico. Ver secao ACHADO CRITICO acima antes de decidir.** |
| ex_068 | Sumô Deadlift com halteres | name_ptbr | Sumô Deadlift com halteres | SUMO DEADELIFT COM HALTERES_2.mp4 | 1 | **ACHADO CRITICO: este exercicio foi zerado como "arquivo Drive inexistente" -- mas existe candidato no R2 com nome quase identico. Ver secao ACHADO CRITICO acima antes de decidir.** |
| ex_179 | Crucifixo com halteres deitado | name_ptbr | Crucifixo com halteres deitado | CRUCIFIXO COM HALTERES DEITADO_2.mp4 | 0 | **ACHADO CRITICO: este exercicio foi zerado como "arquivo Drive inexistente" -- mas existe candidato no R2 com nome quase identico. Ver secao ACHADO CRITICO acima antes de decidir.** |
| ex_141 | Rollout com roda abdominal | arquivo_original_drive | IMG_8934 - cópia.MOV | IMG_8934 - c�pia_2.mp4 | 1 |  |

## Parte 2 -- ambiguo por colisao de nome (multiplos exercicios ou multiplos arquivos disputando a mesma chave)

Total: 48 grupos, 96 linhas do CSV, 73 arquivos do R2.

A maioria repete um padrao ja conhecido do catalogo: varios exercise_id diferentes sempre apontaram pro MESMO arquivo original no Drive (curadoria antiga reaproveitou 1 video pra exercicios parecidos, ou e um dos pares de nome duplicado ja registrados). Nao e falha do casamento -- e o estado real do catalogo. Decisao necessaria por grupo: qual exercise_id fica com qual arquivo do R2 (quando ha mais de 1), e se os exercicios que sobrarem sem arquivo proprio continuam compartilhando video ou entram na fila de video pendente.

### AGACHAMENTOLIVRE
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada; 3 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_001 (Agachamento livre), ex_045 (Agachamento livre)
- Drive original: AGACHAMENTOLIVRE 2.MOV
- R2: AGACHAMENTOLIVRE 2(1)_2.mp4, AGACHAMENTOLIVRE 2_2.mp4, AGACHAMENTOLIVRE_1_2.mp4

### AVANCOCOMPESOCORPORAL
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada; 2 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_002 (Avanço (afundo) com peso corporal), ex_046 (Avanço (afundo))
- Drive original: AVANCOCOMPESOCORPORAL.MOV
- R2: AVANCOCOMPESOCORPORAL_1_2.mp4, AVANCOCOMPESOCORPORAL_3.mp4

### LEGPRESS
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada; 3 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_007 (Leg press), ex_028 (Leg Press 45°)
- Drive original: LEG PRESS.MOV
- R2: LEG PRESS 45_2.mp4, LEG PRESS_2.mp4, LEGPRESS_1_2.mp4

### WALLBALL
**Motivo:** 2 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_013 (Wall ball)
- Drive original: WALLBALL.MOV
- R2: WALLBALL(1)_2.mp4, WALLBALL_2.mp4

### BOXSTEPUPCOMPESO
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada; 2 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_015 (Box step-up com peso), ex_056 (Step-up no box com peso)
- Drive original: BOXSTEPUPCOMPESO.MOV
- R2: BOXSTEPUPCOMPESO_1_2.mp4, BOXSTEPUPCOMPESO_3.mp4

### AGACHAMENTOISIOMETRICO
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_018 (Agachamento isométrico (cadeirinha)), ex_058 (Agachamento isométrico (cadeirinha))
- Drive original: AGACHAMENTOISIOMETRICO.MOV
- R2: AGACHAMENTOISIOMETRICO_1_2.mp4

### AGACHAMENTOCOMELASTICO
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada; 2 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_025 (Agachamento com elástico (miniband)), ex_063 (Agachamento com miniband nos joelhos)
- Drive original: AGACHAMENTOCOMELASTICO.MOV
- R2: AGACHAMENTOCOMELASTICO_1_2.mp4, AGACHAMENTOCOMELASTICO_3.mp4

### AVANCOCOMHALTERES
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada; 2 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_026 (Avanço com halteres), ex_048 (Avanço com halteres)
- Drive original: AVANCOCOMHALTERES.MOV
- R2: AVANCOCOMHALTERES_1_2.mp4, AVANCOCOMHALTERES_3.mp4

### AVANCOCOMSTEPNOSMITH
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada; 2 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_031 (Avanço com step  no Smith Machine), ex_053 (Avanço unilateral Smith)
- Drive original: AVANCOCOMSTEPNOSMITH.MOV
- R2: AVANCOCOMSTEPNOSMITH_1_2.mp4, AVANCOCOMSTEPNOSMITH_3.mp4

### BACKSQUATCOMBARRAOLIMPICA
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada; 2 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_033 (Back Squat), ex_051 (Agachamento com barra)
- Drive original: BACKSQUATCOMBARRAOLIMPICA.MOV
- R2: BACKSQUATCOMBARRAOLIMPICA_1_2.mp4, BACKSQUATCOMBARRAOLIMPICA_3.mp4

### CADEIRAFLEXORA
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada; 2 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_050 (Cadeira flexora), ex_081 (Cadeira flexora)
- Drive original: CADEIRA FLEXORA.MOV
- R2: CADEIRA FLEXORA(1)_2.mp4, CADEIRA FLEXORA_2.mp4

### KETTLEBELLSWING
**Motivo:** 3 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_054 (Kettlebell swing), ex_082 (Kettlebell swing), ex_291 (Kettlebell swing (ou com halter))
- Drive original: KETTLEBELL SWING.MOV
- R2: KETTLEBELL SWING(1)_2.mp4

### DEADLIFTTRADICIONALBARRA
**Motivo:** 4 exercicios do CSV compartilham a mesma chave normalizada; 2 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_055 (Deadlift com barra olímpica), ex_069 (Deadlift tradicional com barra), ex_083 (Deadlift com barra olímpica), ex_245 (Deadlift (levantamento terra))
- Drive original: DEADLIFT TRADICIONAL BARRA.MOV
- R2: DEADLIFT TRADICIONAL BARRA(1)_2.mp4, DEADLIFT TRADICIONAL BARRA_2.mp4

### AVANCOREVERSOCOMHALTERES
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_060 (Avanço reverso), ex_085 (Avanço reverso com halteres)
- Drive original: AVANCO REVERSO COM HALTERES.MOV
- R2: AVANCO REVERSO COM HALTERES_2.mp4

### PONTEUNILATERAL
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_061 (Ponte unilateral com perna elevada), ex_073 (Ponte de glúteos unilateral)
- Drive original: PONTE UNILATERAL .MOV
- R2: PONTE UNILATERAL-_1.mp4

### ROMANIANDEADLIFTCOMHALTERES
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_065 (Romanian Deadlift com halteres), ex_090 (Peso morto romeno com halteres)
- Drive original: ROMANIAN DEADLIFT COM HALTERES.MOV
- R2: ROMANIAN DEADLIFT COM HALTERES_2.mp4

### STIFFCOMHALTERES
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada; 2 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_066 (Stiff com halteres), ex_075 (Stiff com halteres)
- Drive original: STIFF COM HALTERES.MOV
- R2: STIFF COM HALTERES(1)_2.mp4, STIFF COM HALTERES_2.mp4

### DEADLIFTUNILATERAL
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada; 3 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_067 (Deadlift unilateral com halter), ex_086 (Deadlift unilateral com halteres)
- Drive original: DEADLIFT UNILATERAL.MOV
- R2: DEADLIFT UNILATERAL(1)_2.mp4, DEADLIFT UNILATERAL-_1.mp4, DEADLIFT UNILATERAL_2.mp4

### ROMANIANDEADLIFTBARRA
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada; 2 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_070 (Romanian Deadlift com barra), ex_080 (Levantamento terra romeno)
- Drive original: ROMANIAN DEADLIFT BARRA.MOV
- R2: ROMANIAN DEADLIFT BARRA(1)_2.mp4, ROMANIAN DEADLIFT BARRA_2.mp4

### STIFFCOMBARRA
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada; 2 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_071 (Stiff com barra), ex_079 (Stiff com barra)
- Drive original: STIFF COM BARRA.MOV
- R2: STIFF COM BARRA(1)_2.mp4, STIFF COM BARRA_2.mp4

### SUMODEADLIFTCOMBARRA
**Motivo:** 2 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_072 (Sumô Deadlift com barra)
- Drive original: SUMO DEADLIFT COM BARRA.MOV
- R2: SUMO DEADLIFT COM BARRA(1)_2.mp4, SUMO DEADLIFT COM BARRA_2.mp4

### GOODMORNING
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_074 (Good morning com peso corporal), ex_237 (Good morning com peso corporal)
- Drive original: GOOD MORNING.MOV
- R2: GOOD MORNING_2.mp4

### MESAFLEXORA
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_078 (Mesa flexora), ex_087 (Mesa flexora)
- Drive original: MESA FLEXORA.MOV
- R2: MESA FLEXORA_2.mp4

### GOODMORINGBARRA
**Motivo:** 2 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_089 (Good morning com barra)
- Drive original: GOODMORING BARRA.MOV
- R2: GOODMORING BARRA(1)_2.mp4, GOODMORING BARRA_2.mp4

### ELEVACAODEPANTURRILHANOCHAO
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_093 (Elevação de panturrilha no chão), ex_095 (Elevação de panturrilha com halteres)
- Drive original: ELEVACAO DE PANTURRILHA NO CHAO.MOV
- R2: ELEVACAO DE PANTURRILHA NO CHAO_2.mp4

### PANTURRILHANOLEGPRESS
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada; 2 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_098 (Panturrilha no leg press 45), ex_101 (Panturrilha no Leg Press)
- Drive original: PANTURRILHA NO LEG PRESS 45.MOV
- R2: PANTURRILHA NO LEG PRESS 45_2.mp4, PANTURRILHA NO LEG PRESS_2.mp4

### ELEVACAODEJOELHOS
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_099 (Corrida no lugar em ponta dos pés), ex_287 (High knees (elevação rápida dos joelhos))
- Drive original: ELEVACAODEJOELHOS.MOV
- R2: ELEVACAODEJOELHOS_2.mp4

### PULARCORDA
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_103 (Pular corda), ex_267 (Pular corda)
- Drive original: PULAR CORDA.MOV
- R2: PULAR CORDA_2.mp4

### PRANCHAFRONTAL
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_107 (Prancha frontal), ex_135 (Prancha frontal)
- Drive original: PRANCHA FRONTAL.MOV
- R2: PRANCHA FRONTAL_2.mp4

### PRANCHALATERAL
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_108 (Prancha lateral), ex_136 (Prancha lateral)
- Drive original: PRANCHA LATERAL.MOV
- R2: PRANCHA LATERAL_2.mp4

### PRANCHACOMELASTICO
**Motivo:** 3 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_110 (Prancha com miniband), ex_124 (Prancha com elástico), ex_140 (Prancha com miniband)
- Drive original: PRANCHA COM ELASTICO.MOV
- R2: PRANCHA COM ELASTICO_2.mp4

### CROSSBODYMONTAINCLIMBER
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_117 (Mountain climber crossbody), ex_288 (Escalador crossbody)
- Drive original: CROSSBODYMONTAINCLIMBER.MOV
- R2: CROSSBODYMONTAINCLIMBER_2.mp4

### PRANCHATAPANOOMBRO
**Motivo:** 3 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_118 (Prancha com toque no ombro), ex_148 (Prancha com toque nos ombros), ex_152 (Prancha com toque de ombro)
- Drive original: PRANCHA TAPA NO OMBRO.MOV
- R2: PRANCHA TAPA NO OMBRO_2.mp4

### PRANCHACOMELEVACAODEPERNA
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_120 (Prancha com elevação de perna), ex_147 (Prancha com elevação alternada de pernas)
- Drive original: PRANCHA COM ELEVACAO DE PERNA.MOV
- R2: PRANCHA COM ELEVACAO DE PERNA_2.mp4

### HOLLOWHOLD
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_121 (Hollow hold (posição de barco)), ex_139 (Hollow hold)
- Drive original: HOLLOW HOLD.MOV
- R2: HOLLOW HOLD_2.mp4

### SITUPCOMPERNASELEVADAS
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_125 (Sit-up com as pernas elevadas), ex_126 (Sit-up com as pernas elevadas com peso)
- Drive original: SIT-UP COM PERNAS ELEVADAS.MOV
- R2: SIT-UP COM PERNAS ELEVADAS_2.mp4

### JOELHONOPEITONABARRA
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_128 (Joelho no peito na barra), ex_145 (Knee raise pendurado)
- Drive original: JOELHO NO PEITO NA BARRA.MOV
- R2: JOELHO NO PEITO NA BARRA_2.mp4

### FACEPULLNOCROSS
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_169 (Face pull no cross), ex_170 (Elevação frontal com anilha)
- Drive original: FACE PULL NO CROSS.MOV
- R2: FACE PULL NO CROSS_2.mp4

### FLEXAODECLINADA
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada; 2 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_176 (Flexão declinada (pés elevados)), ex_224 (Flexão declinada com pegada estreita)
- Drive original: FLEXAO DECLINADA.MOV
- R2: FLEXAO DECLINADA(1)_2.mp4, FLEXAO DECLINADA_2.mp4

### SUPINODECLINADOCOMBARRA
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_184 (Supino declinado com barra), ex_191 (Supino declinado com barra)
- Drive original: SUPINO DECLINADO COM BARRA.MOV
- R2: SUPINO DECLINADO COM BARRA_2.mp4

### FLEXAOCOMPEGADAFECHADA
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_194 (Flexão de braço com pegada fechada), ex_216 (Flexão de braço com pegada fechada)
- Drive original: FLEXAO COM PEGADA FECHADA.MOV
- R2: FLEXAO COM PEGADA FECHADA_2.mp4

### ROSCASPIDERCOMHALTERES
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_214 (Rosca spider com halteres), ex_215 (Rosca na polia com barra reta (pegada supinada))
- Drive original: ROSCA SPIDER COM HALTERES.MOV
- R2: ROSCA SPIDER COM HALTERES_2.mp4

### SUPERMAN
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_235 (Superman), ex_236 (Bird dog)
- Drive original: SUPERMAN.MOV
- R2: SUPERMAN_2.mp4

### YTWRAISE
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_250 (Y-W-T Raise no chão), ex_251 (Remada com elástico (pegada fechada))
- Drive original: YTW RAISE.MOV
- R2: YTW RAISE_2.mp4

### ELIPTICO
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada

- CSV: ex_270 (Elíptico), ex_271 (Treino intervalado na escada)
- Drive original: ELIPTICO.MOV
- R2: ELIPTICO_2.mp4

### SALTOCORDA
**Motivo:** 2 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_277 (Salto de corda simples)
- Drive original: SALTO CORDA.MOV
- R2: SALTO CORDA_2.mp4, SALTOCORDA_2.mp4

### BOXJUMP
**Motivo:** 2 exercicios do CSV compartilham a mesma chave normalizada; 2 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_283 (Box Jump), ex_285 (Wall Ball)
- Drive original: BOX JUMP.MOV
- R2: BOX JUMP(1)_2.mp4, BOX JUMP_2.mp4

### BOXJUMPOVER
**Motivo:** 2 arquivos do R2 compartilham a mesma chave normalizada

- CSV: ex_284 (Box Jump Over)
- Drive original: BOX JUMP OVER.MOV
- R2: BOX JUMP OVER_2.mp4, BOXJUMPOVER_2.mp4

