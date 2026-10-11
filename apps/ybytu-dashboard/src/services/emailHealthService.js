import { invokeFunction } from './apiClient.js';

// Saúde do envio de e-mails (ybytu-admin-email-health, admin-only): falhas
// recentes do Resend e alunos com plano aprovado sem o link. Alimenta o
// banner do DashboardLayout e a tela /campaign/email-alerts.
export const emailHealthService = {
  async get() {
    return invokeFunction('ybytu-admin-email-health');
  },
};
