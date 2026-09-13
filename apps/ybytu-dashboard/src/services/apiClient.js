import { supabase } from '../lib/supabase.js';

export class ApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.details = details;
  }
}

export async function getAuthHeaders() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new ApiError('Sessão expirada ou usuário não autenticado.', { code: 'not_authenticated' });
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

export async function invokeFunction(functionName, options = {}) {
  const headers = await getAuthHeaders();
  const { data, error } = await supabase.functions.invoke(functionName, {
    headers: { ...headers, ...(options.headers || {}) },
    body: options.body,
  });

  if (error) {
    throw new ApiError(error.message || 'Erro de comunicação com o servidor.', { originalError: error });
  }

  if (data?.error) {
    let friendlyMessage = data.error;
    if (options.errorMap && options.errorMap[data.error]) {
      friendlyMessage = options.errorMap[data.error];
    } else if (typeof options.formatError === 'function') {
      friendlyMessage = options.formatError(data) || data.error;
    }
    throw new ApiError(friendlyMessage, data);
  }

  return data;
}
