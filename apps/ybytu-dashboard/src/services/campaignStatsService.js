import { invokeFunction } from './apiClient.js';

export const campaignStatsService = {
  async getAll() {
    return invokeFunction('ybytu-campaign-stats');
  },
};
