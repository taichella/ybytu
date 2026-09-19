# Classificação de carga dos exercícios (`exercises.load_type`) — para o personal preencher

Gerado em 2026-09-19. **A coluna já está aplicada em produção** (migration `20260919180000`, aprovada em 2026-09-19): os 298 exercícios têm um valor. Os 240 decididos pelo equipamento são definitivos; os **58 ambíguos estão com a sugestão provisória** abaixo até o personal decidir. Reverter a coluna: ver `docs/ROLLBACK_PILOTO.md`.

## O que é e por que existe

Hoje o sistema não sabe se um exercício usa carga. O resultado: o staff pode digitar "3 kg" num exercício de peso corporal, e o aluno não vê a carga em lugar nenhum (nem na tela nem no PDF). `load_type` resolve as duas pontas: a tela só oferece o campo de kg quando o exercício admite carga, e o aluno passa a ver a carga prescrita (ou "a definir" quando o personal ainda não preencheu — nunca "0 kg").

| Valor | Significa | Campo de kg? |
|---|---|---|
| `bodyweight` | peso do corpo, acessório (caixa, step, TRX, parede) ou cardio | não |
| `weighted` | peso livre: halter, barra, kettlebell, anilha, medicine ball | sim |
| `machine` | máquina ou polia | sim |
| `band` | elástico / miniband | não (resistência por cor, não por kg) |

## Como foi preenchido

- **240 exercícios decididos pelo equipamento cadastrado** (regra objetiva, sem IA): 106 `bodyweight`, 60 `weighted`, 46 `machine`, 28 `band`. A lista completa está no apêndice, para conferência.
- **58 exercícios AMBÍGUOS: são o que precisa de você.** O equipamento cadastrado é `barra/barra fixa`, `banco` ou `banco de hiperextensão`, e cada um desses admite as duas leituras (barra fixa de pull-up × barra olímpica com anilha; banco de supino com carga × banco só de apoio). Eu deixei uma **sugestão por nome**, marcada com o grau de confiança, só para você não começar do zero. **A IA não classifica isto e a sugestão não vale como decisão.**
- Regra de segurança da sugestão: **na dúvida, `weighted`** (o campo aparece vazio, "a definir"). Errar para `bodyweight` esconderia a carga de um exercício que precisa dela.

## Como preencher

Na coluna **Decisão do personal**, escreva um destes: `bodyweight`, `weighted`, `machine` ou `band`. Se a sugestão estiver certa, escreva o mesmo valor (ou "ok"). Devolva a lista e eu aplico com um único UPDATE, mostrando o resultado antes.

## Os 58 ambíguos

| id | Exercício | Equipamento cadastrado | Sugestão | Confiança | Por quê | Decisão do personal |
|---|---|---|---|---|---|---|
| ex_010 | Agachamento frontal com barra | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_011 | Avanço com barra | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_014 | Front squat com barra olímpica | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_015 | Box step-up com peso | caixa + banco | `weighted` | alta | nome cita barra/peso externo | |
| ex_017 | Agachamento búlgaro com barra | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_020 | Agachamento búlgaro | peso do corpo + banco | `bodyweight` | media | nome sugere peso corporal / barra fixa | |
| ex_023 | Step-up no degrau | step + banco | `bodyweight` | media | nome sugere peso corporal / barra fixa | |
| ex_033 | Back Squat | barra/barra fixa | `weighted` | alta | exercício tipicamente feito com barra/peso | |
| ex_034 | Box Squat (peso corporal) | caixa + banco | `bodyweight` | media | nome sugere peso corporal / barra fixa | |
| ex_036 | Box Squat com barra | barra/barra fixa + caixa + banco | `weighted` | alta | nome cita barra/peso externo | |
| ex_037 | Box Squat com elástico | elástico/miniband + caixa + banco | `band` | media | nome cita elástico (o equipamento também lista caixa/banco) | |
| ex_038 | Box Squat Unilateral (peso corporal) | caixa + banco | `bodyweight` | media | nome sugere peso corporal / barra fixa | |
| ex_041 | Thruster com barra | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_051 | Agachamento com barra | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_052 | Levantamento terra | barra/barra fixa | `weighted` | alta | exercício tipicamente feito com barra/peso | |
| ex_055 | Deadlift com barra olímpica | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_056 | Step-up no box com peso | caixa + banco | `weighted` | alta | nome cita barra/peso externo | |
| ex_069 | Deadlift tradicional com barra | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_070 | Romanian Deadlift com barra | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_071 | Stiff com barra | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_072 | Sumô Deadlift com barra | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_079 | Stiff com barra | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_080 | Levantamento terra romeno | barra/barra fixa | `weighted` | alta | exercício tipicamente feito com barra/peso | |
| ex_083 | Deadlift com barra olímpica | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_089 | Good morning com barra | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_100 | Panturrilha no step com pausa isométrica | step + banco | `bodyweight` | media | nome sugere peso corporal / barra fixa | |
| ex_123 | Abdominal L-sit | barra/barra fixa | `bodyweight` | media | nome sugere peso corporal / barra fixa | |
| ex_128 | Joelho no peito na barra | barra/barra fixa | `bodyweight` | media | nome sugere peso corporal / barra fixa | |
| ex_130 | GHD Sit-up | banco de hiperextensão | `weighted` | baixa | sem pista clara no nome; equipamento (hyperextension_bench) admite as duas leituras | |
| ex_131 | Abdominal declinado no banco | banco | `weighted` | baixa | sem pista clara no nome; equipamento (bench) admite as duas leituras | |
| ex_145 | Knee raise pendurado | barra/barra fixa | `bodyweight` | media | nome sugere peso corporal / barra fixa | |
| ex_156 | Desenvolvimento com barra | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_160 | Push press com barra | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_170 | Elevação frontal com anilha | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_171 | Remada alta com barra | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_172 | Press militar com barra | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_176 | Flexão declinada (pés elevados) | banco + step | `bodyweight` | media | nome sugere peso corporal / barra fixa | |
| ex_180 | Supino reto com barra | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_181 | Supino inclinado com barra | barra/barra fixa + banco | `weighted` | alta | nome cita barra/peso externo | |
| ex_184 | Supino declinado com barra | barra/barra fixa + banco | `weighted` | alta | nome cita barra/peso externo | |
| ex_191 | Supino declinado com barra | barra/barra fixa + banco | `weighted` | alta | nome cita barra/peso externo | |
| ex_199 | Rosca direta com barra | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_200 | ROSCA SCOTT COM BARRA W | barra/barra fixa + banco | `weighted` | alta | nome cita barra/peso externo | |
| ex_202 | Rosca inversa | barra/barra fixa | `weighted` | alta | exercício tipicamente feito com barra/peso | |
| ex_203 | Chin-up (barra com pegada supinada) | barra/barra fixa | `bodyweight` | media | nome sugere peso corporal / barra fixa | |
| ex_204 | Body row com pegada fechada | barra/barra fixa | `bodyweight` | media | nome sugere peso corporal / barra fixa | |
| ex_205 | Flexão australiana em mesa baixa | barra/barra fixa | `bodyweight` | media | nome sugere peso corporal / barra fixa | |
| ex_213 | Rosca 21 na barra W | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_221 | Tríceps testa com barra | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_223 | Tríceps na barra paralela (Graviton) | barra/barra fixa | `bodyweight` | media | nome sugere peso corporal / barra fixa | |
| ex_224 | Flexão declinada com pegada estreita | banco | `bodyweight` | media | nome sugere peso corporal / barra fixa | |
| ex_228 | Tríceps testa com barra W | barra/barra fixa | `weighted` | alta | nome cita barra/peso externo | |
| ex_230 | Tríceps banco | banco | `weighted` | baixa | sem pista clara no nome; equipamento (bench) admite as duas leituras | |
| ex_245 | Deadlift (levantamento terra) | barra/barra fixa | `weighted` | alta | exercício tipicamente feito com barra/peso | |
| ex_246 | Barra fixa pronada (pull-up) | barra/barra fixa | `bodyweight` | media | nome sugere peso corporal / barra fixa | |
| ex_247 | Body row com pegada aberta | TRX + barra/barra fixa | `bodyweight` | media | nome sugere peso corporal / barra fixa | |
| ex_248 | Kipping pull-up | barra/barra fixa | `bodyweight` | media | nome sugere peso corporal / barra fixa | |
| ex_259 | Back Extension 45° (Roman Chair) | banco de hiperextensão | `weighted` | baixa | sem pista clara no nome; equipamento (hyperextension_bench) admite as duas leituras | |

Confiança da sugestão: 36 alta (nome cita barra/peso externo ou é um exercício de barra), 18 média (nome sugere peso corporal/elástico), 4 baixa (sem pista no nome — caem em `weighted` por segurança).

## Pontos que dependem de decisão sua (além da lista)

1. **Cardio (decisão de 2026-09-19: por ora fica `bodyweight`; o personal pode pedir uma 5ª categoria).** 12 exercícios de cardio (esteira, bicicleta, elíptico, remo, simulador de escada, corda de pular, corda naval) ficaram como `bodyweight` porque não têm kg. Se você quiser tratar cardio como categoria própria (velocidade, nível de resistência), é um 5º valor — hoje a coluna aceita só os 4 acordados.
2. **Elástico.** `band` esconde o campo de kg. Se o elástico deve ter uma prescrição (cor/nível), é outro campo, não a carga.
3. **Pares duplicados do catálogo.** ex_055/ex_083, ex_071/ex_079 e ex_184/ex_191 estão na lista acima e também em `docs/POS_PILOTO.md` (fusão dos 19 pares). Classifique os dois lados do mesmo jeito.

4. **Nome e equipamento discordam (achado 2026-09-19, ao testar a tela).** Só um caso entre os classificados sem kg: **ex_132 "Abdominal declinado no banco com peso"** tem equipamento cadastrado só `none_bodyweight`, então saiu `bodyweight` (sem campo de carga) e a tag de ambiente mostra "Casa (sem equipamento)". Pelo nome, deveria levar banco + peso, ou seja, provavelmente `weighted` e ambiente "Casa (com equipamento)". Corrigir o equipamento do exercício resolve as duas coisas; ex_128 e ex_203 (barra fixa) estão certos como `bodyweight`.

## Apêndice — decididos pelo equipamento (para conferência)

### `weighted` — halter, kettlebell ou medicine ball (60)

ex_004 Agachamento com halteres · ex_005 lunge Passada com halteres · ex_006 Agachamento frontal com kettlebell · ex_012 Thruster (agachamento com push press) · ex_013 Wall ball · ex_016 Agachamento búlgaro com halteres · ex_026 Avanço com halteres · ex_030 Agachamento frontal com halteres · ex_035 Box Squat com halteres · ex_039 Box Squat Unilateral com halteres · ex_048 Avanço com halteres · ex_054 Kettlebell swing · ex_057 Agachamento búlgaro com o tronco projetado à frente com halteres · ex_065 Romanian Deadlift com halteres · ex_066 Stiff com halteres · ex_067 Deadlift unilateral com halter · ex_068 Sumô Deadlift com halteres · ex_075 Stiff com halteres · ex_082 Kettlebell swing · ex_085 Avanço reverso com halteres · ex_086 Deadlift unilateral com halteres · ex_090 Peso morto romeno com halteres · ex_092 Stiff unilateral com halteres · ex_095 Elevação de panturrilha com halteres · ex_111 Abdominal com peso (halter ou kettlebell) · ex_112 Russian twist com peso · ex_115 Sit-up com bola medicinal · ex_126 Sit-up com as pernas elevadas com peso · ex_134 Toes to Kettlebell · ex_146 Farmer's carry unilateral · ex_153 Elevação lateral com halteres · ex_154 Desenvolvimento com halteres · ex_157 Elevação frontal com halteres · ex_159 Arnold press · ex_173 Elevação frontal/ lateral com halteres · ex_177 Supino com halteres no chão · ex_179 Crucifixo com halteres deitado · ex_189 Flexão com apoio de halteres · ex_190 Supino inclinado com halteres · ex_193 Flexão com pés elevados e mãos sobre halteres · ex_195 Rosca direta com halteres · ex_196 Rosca alternada com halteres · ex_197 Rosca martelo com halteres · ex_201 Rosca concentrada · ex_206 Rosca 21 com halteres · ex_207 Rosca martelo alternada com halteres · ex_211 Rosca martelo alternada com isometria · ex_212 Rosca Zottman com halteres · ex_214 Rosca spider com halteres · ex_217 Tríceps testa com halteres · ex_218 Tríceps francês com halteres · ex_222 Tríceps coice com halteres · ex_229 Tríceps francês unilateral com halteres sentado · ex_233 Tríceps testa com halteres alternado · ex_238 Remada curvada com halteres · ex_239 Remada unilateral com halteres · ex_254 Crucifixo inverso no banco inclinado · ex_256 Pullover com halteres · ex_285 Wall Ball · ex_291 Kettlebell swing (ou com halter)

### `machine` — máquina ou polia (46)

ex_007 Leg press · ex_008 Cadeira extensora · ex_009 Agachamento no smith · ex_027 Cadeira extensora unilateral · ex_028 Leg Press 45° · ex_029 Hack Squat · ex_031 Avanço com step  no Smith Machine · ex_049 Cadeira abdutora · ex_050 Cadeira flexora · ex_053 Avanço unilateral Smith · ex_064 Extensão de quadril no cross · ex_078 Mesa flexora · ex_081 Cadeira flexora · ex_087 Mesa flexora · ex_088 Cadeira flexora unilateral · ex_096 Elevação de panturrilha em pé na máquina · ex_097 Panturrilha sentado na máquina · ex_098 Panturrilha no leg press 45 · ex_101 Panturrilha no Leg Press · ex_102 Elevação de panturrilha no Smith · ex_143 Cable anti-rotação (Pallof Press) · ex_144 Woodchopper no cross · ex_158 Crucifixo invertido no peck deck · ex_167 Desenvolvimento no Smith · ex_168 Elevação lateral na polia · ex_169 Face pull no cross · ex_182 Crossover no cross · ex_183 Crucifixo no peck deck · ex_192 Cross over na polia alta · ex_208 Rosca unilateral na polia baixa · ex_209 Rosca corda na polia baixa · ex_210 Rosca martelo na polia com corda · ex_215 Rosca na polia com barra reta (pegada supinada) · ex_220 Tríceps corda na polia · ex_227 Tríceps corda WRISTS · ex_234 Extensão de tríceps na polia alta com barra reta · ex_241 Puxada frontal aberta · ex_242 Remada baixa na máquina · ex_243 Pulldown com triângulo · ex_244 Remada cavalinho na maquina pegada aberta · ex_253 Remada unilateral na maquina · ex_257 Pullover no cross ou na máquina · ex_258 Remada cavalinho (T-Bar Row) · ex_260 Remada cavalinho na maquina pegada neutra · ex_261 Pull Up (Graviton) · ex_262 Remada baixa aberta pronada

### `band` — só elástico (28)

ex_025 Agachamento com elástico (miniband) · ex_040 Passada lateral em posição de agachamento com mini band · ex_047 Abdução de quadril deitada com mini band · ex_062 Abdução em pé com miniband · ex_063 Agachamento com miniband nos joelhos · ex_077 Good morning com elastico · ex_110 Prancha com miniband · ex_122 Abdomina biciletal com miniband nos pés · ex_124 Prancha com elástico · ex_140 Prancha com miniband · ex_142 Anti-rotação com elástico · ex_149 Dead bug com miniband · ex_155 Remada alta com elástico · ex_164 Desenvolvimento com elástico · ex_165 Elevação lateral com miniband · ex_166 Face pull com elástico · ex_178 Flexão com elástico de resistência · ex_198 Rosca com elástico · ex_219 Extensão de tríceps com elástico · ex_226 Extensão de tríceps com elástico (acima da cabeça) · ex_231 Kickback com elástico · ex_232 Tríceps coice com elástico unilateral · ex_240 Pull apart com elástico · ex_249 Prancha com puxada unilateral com elastcio · ex_251 Remada com elástico (pegada fechada) · ex_252 Pulldown com elástico fixado em cima · ex_255 Face Pull com elástico · ex_289 Thruster com elastico

### `bodyweight` — peso do corpo, acessório ou cardio (106)

ex_001 Agachamento livre · ex_002 Avanço (afundo) com peso corporal · ex_003 Agachamento sumô isométrico · ex_018 Agachamento isométrico (cadeirinha) · ex_019 Cossack squat · ex_021 Agachamento com salto (Jump Squat) · ex_022 Wall Sit (agachamento isométrico na parede) · ex_024 lunge Passada · ex_032 Passada lateral em posição de agachamento · ex_042 Agachamento unilateral · ex_043 Jump Lunge · ex_044 Ponte de glúteos · ex_045 Agachamento livre · ex_046 Avanço (afundo) · ex_058 Agachamento isométrico (cadeirinha) · ex_059 Agachamento búlgaro com o tronco projetado à frente · ex_060 Avanço reverso · ex_061 Ponte unilateral com perna elevada · ex_073 Ponte de glúteos unilateral · ex_074 Good morning com peso corporal · ex_076 Leg curl com bola suíça · ex_084 Avanço reverso (peso corporal) · ex_091 Stiff unilateral com peso corporal · ex_093 Elevação de panturrilha no chão · ex_094 Elevação unilateral de panturrilha · ex_099 Corrida no lugar em ponta dos pés · ex_103 Pular corda · ex_104 Corrida em inclinação (esteira inclinada) · ex_105 Abdominal tradicional · ex_106 Abdominal bicicleta · ex_107 Prancha frontal · ex_108 Prancha lateral · ex_109 Elevação de pernas deitado · ex_113 Abdominal na máquina · ex_114 V-up · ex_116 V-up unilateral · ex_117 Mountain climber crossbody · ex_118 Prancha com toque no ombro · ex_119 Abdominal remador · ex_120 Prancha com elevação de perna · ex_121 Hollow hold (posição de barco) · ex_125 Sit-up com as pernas elevadas · ex_127 Remador · ex_129 Joelho no peito na máquina · ex_132 Abdominal declinado no banco com peso · ex_133 Abdominal Reloginho · ex_135 Prancha frontal · ex_136 Prancha lateral · ex_137 Bird dog · ex_138 Dead bug · ex_139 Hollow hold · ex_141 Rollout com roda abdominal · ex_147 Prancha com elevação alternada de pernas · ex_148 Prancha com toque nos ombros · ex_151 Pike push-up · ex_152 Prancha com toque de ombro · ex_161 Prancha pike walk · ex_162 Prancha com giro de tronco · ex_163 Toque alternado em parede na prancha · ex_174 Flexão de braço tradicional · ex_175 Flexão de braço com pegada aberta · ex_185 Push-up explosivo com palmas · ex_186 Burpee com push-up · ex_187 Flexão diamante · ex_188 Flexão isométrica (segurando embaixo) · ex_194 Flexão de braço com pegada fechada · ex_216 Flexão de braço com pegada fechada · ex_225 Extensão de tríceps apoiado na parede · ex_235 Superman · ex_236 Bird dog · ex_237 Good morning com peso corporal · ex_250 Y-W-T Raise no chão · ex_263 Remada no TRX · ex_264 Polichinelo · ex_265 Burpee · ex_266 Mountain climber · ex_267 Pular corda · ex_268 Esteira (corrida) · ex_269 Bicicleta ergométrica · ex_270 Elíptico · ex_271 Treino intervalado na escada · ex_272 Battle rope · ex_273 Bike ergométrica de alta intensidade (assault bike) · ex_274 Half Burpee · ex_275 Half Burpee com Step · ex_276 Corrida estacionária com calcanhar no glúteo · ex_277 Salto de corda simples · ex_278 Remada em máquina (Row) · ex_279 Skaters (saltos laterais) · ex_280 Jumping lunge (afundo com salto) · ex_281 Sprints na esteira · ex_282 Subida e descida no step rápido · ex_283 Box Jump · ex_284 Box Jump Over · ex_286 Corrida lateral com toques no chão · ex_287 High knees (elevação rápida dos joelhos) · ex_288 Escalador crossbody · ex_290 Bear crawl (deslocamento em 4 apoios) · ex_292 Polichinelo com agachamento · ex_293 Polichinelo com toque no chão · ex_294 Polichinelo cruzado · ex_295 Polichinelo frontal · ex_296 Passos de pato · ex_297 Passos de caranguejo · ex_298 Passos de jacaré · ex_299 Salto de sapo

