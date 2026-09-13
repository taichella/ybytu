import { invokeFunction } from './apiClient.js';

export const pendingReviewsService = {
  async getAll() {
    return invokeFunction('ybytu-pending-plan-reviews');
  },
};
