// Corpo de erro de uma Edge Function chamada via supabase.functions.invoke.
//
// Em resposta não-2xx o supabase-js devolve data=null e error.message genérico
// ("Edge Function returned a non-2xx status code"); o corpo { error, message }
// que a function mandou fica em error.context (Response). Sem ler esse corpo,
// o aluno vê sempre a mesma frase técnica, seja código errado, expirado ou
// falha de WhatsApp. Mesmo conserto do apiClient do dashboard (2026-09-25,
// apps/ybytu-dashboard/src/services/apiClient.js).
//
// Devolve { body, httpStatus }: body é o JSON da resposta (ou null se não
// houver/não for JSON), httpStatus o status HTTP (ou null).
export async function readFunctionError(error) {
  const httpStatus = error?.context?.status ?? null;
  let body = null;
  try {
    if (error?.context && typeof error.context.json === 'function') body = await error.context.json();
  } catch { /* corpo não-JSON: fica só o status */ }
  return { body, httpStatus };
}
