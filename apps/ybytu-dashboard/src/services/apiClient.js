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
    // Resposta não-2xx (FunctionsHttpError): o supabase-js devolve data=null e
    // uma mensagem genérica, mas o corpo { error: 'codigo' } da function está
    // em error.context (Response). Lê o corpo pra mostrar o motivo real em vez
    // de "Edge Function returned a non-2xx status code" (2026-09-25).
    let body = null;
    try {
      if (error.context && typeof error.context.json === 'function') body = await error.context.json();
    } catch { /* corpo não-JSON: fica a mensagem genérica */ }
    if (body?.error) {
      const code = body.error;
      const friendly = (options.errorMap && options.errorMap[code])
        || (typeof options.formatError === 'function' && options.formatError(body))
        || code;
      throw new ApiError(friendly, { ...body, httpStatus: error.context?.status, originalError: error });
    }
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

  // Achado 2026-09-17 (revisão Antigravity): ybytu-generate-training-plan e
  // ybytu-generate-meal-plan respondem success:false com HTTP 200 (sem
  // status: setado) quando não há exercícios/refeições seguros pro perfil --
  // só o check de data?.error acima não pegava esse formato, o erro
  // desaparecia em silêncio. Verificado: nenhum service do dashboard lê
  // .success/.ok hoje, e ybytu-admin-retry-plan-generation sempre devolve
  // success:true no nível dele mesmo quando algum gerador interno falha --
  // este check não muda nenhum comportamento existente.
  if (data?.success === false || data?.ok === false) {
    let friendlyMessage = data.message || data.status || 'Operação falhou.';
    if (options.errorMap && options.errorMap[data.status]) {
      friendlyMessage = options.errorMap[data.status];
    } else if (typeof options.formatError === 'function') {
      friendlyMessage = options.formatError(data) || friendlyMessage;
    }
    throw new ApiError(friendlyMessage, data);
  }

  return data;
}
