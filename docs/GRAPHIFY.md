# graphify-out/

Mapa visual do projeto (grafo de código, comunidades, relações entre arquivos/funções),
gerado pela skill `graphify` para uso de dev, PM e PO — não é código, é documentação viva
da arquitetura.

## Como abrir

Abra `graphify-out/graph.html` direto no navegador (arquivo estático, sem servidor).
`graphify-out/GRAPH_REPORT.md` tem o mesmo conteúdo em texto, mais fácil de ler/linkar em
PR ou conversa. `graphify-out/graph.json` é o dado bruto por trás dos dois.

## Como regenerar

1. Rode a skill `/graphify` na raiz do repo.
2. **Antes de commitar**, rode `scripts/sanitize-graphify.sh` — remove e-mails reais que
   apareçam em rótulos de nó (ex.: contas de teste/admin citadas em achados de bug) e
   falha (`exit 1`) se sobrar e-mail, telefone ou padrão de chave/token nos três arquivos
   versionados. Sem isso, não commite.
3. Confira o diff antes de subir — se `graph.json`/`graph.html` mudarem muito além do
   esperado, rode a verificação de novo.

Passo obrigatório, nessa ordem: **regenerar → rodar `scripts/sanitize-graphify.sh` → só então commitar.**

## O que é versionado e o que não é

Versionado: `graph.json`, `graph.html`, `GRAPH_REPORT.md`, `.graphify_root`,
`.graphify_labels.json`.

Ignorado (`.gitignore`): `graphify-out/cache/`, `manifest.json`, `cost.json`,
`.graphify_python` — são cache/estado local (hashes, timestamps, path absoluto da máquina)
que muda a cada rodada e só gera ruído no diff.

## Quando atualizar

Depois de mudanças de arquitetura relevantes: novas Edge Functions, reestruturação de
pastas, mudança grande de fluxo entre frontend/backend/banco. Não precisa regenerar pra
cada commit pequeno.
