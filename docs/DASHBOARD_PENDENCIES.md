# Pendências do Dashboard (Telas Mockadas)

Auditoria das telas em `src/components/` que ainda utilizam dados mockados (hardcoded arrays) em vez de consumir dados reais do backend.

## 1. Dashboard.jsx (`/dashboard`)
*   **O que mostra:** Métricas gerais da plataforma (Total de usuários, MRR, gráfico de crescimento, distribuição de planos, novos usuários e atividade recente). Atualmente foi alterado por outro desenvolvedor para mostrar as métricas reais da Campanha em vez das genéricas, mas há blocos/ações que podem precisar de integração final.
*   **Decisão:** **Necessária.** A home do painel é essencial. Precisa ser conectada para carregar estatísticas reais administrativas ou mantida com a lógica atual de campanha (se essa for a decisão permanente).

## 2. Subscriptions.jsx (`/subscriptions`)
*   **O que mostra:** Histórico de faturamento, transações, status de pagamento (Pago, Pendente, Falhou) e listagem dos tipos de assinaturas (Free, Start, Pro).
*   **Decisão:** **Necessária.** Crítico para acompanhamento financeiro, análise de conversões e saúde do negócio. A listagem de planos também precisa vir do banco (tabela `subscription_types`).

## Ordem de Prioridade Proposta para Implementação

1.  **Subscriptions.jsx:** Fundamental para visualizar receita, retenção, lidar com faturamento falho e gerenciar os planos/tipos de assinatura.
2.  **Dashboard.jsx:** Se os blocos originais (além da campanha) precisarem voltar, integrá-los após os endpoints de faturamento e engajamento estarem bem mapeados.
