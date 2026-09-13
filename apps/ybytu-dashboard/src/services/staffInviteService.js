import { invokeFunction } from './apiClient.js';

export const staffInviteService = {
  async create(email, role) {
    return invokeFunction('ybytu-create-staff-invite', {
      body: { email, role },
    });
  },
};
