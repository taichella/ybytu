import { invokeFunction } from './apiClient.js';

export const failedPlansService = {
  async getAll() {
    return invokeFunction('ybytu-admin-failed-plans');
  },
  async retry(userId) {
    return invokeFunction('ybytu-admin-retry-plan-generation', {
      body: { user_id: userId },
    });
  },
};
