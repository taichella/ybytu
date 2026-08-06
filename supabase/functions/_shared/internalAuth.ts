// Chamada interna function->function (ou cron->function): autentica por um
// segredo PRÓPRIO (INTERNAL_FUNCTION_SECRET), não pelo SUPABASE_SERVICE_ROLE_KEY.
// Motivo: o service_role key muda de formato conforme a Supabase migra o
// esquema de API keys do projeto (aconteceu em 2026-08-05, quebrou a
// comparação direta -- Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') no runtime
// da function não bateu mais com o valor obtido via `projects api-keys`).
// Um segredo dedicado também tem blast radius menor: se vazar, só dispara
// estas duas notificações internas, não dá acesso total ao banco.
export function isInternalServiceCall(req: Request): boolean {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET')
  return !!token && !!internalSecret && token === internalSecret
}
