// Chamada interna function->function (ou cron->function): autentica pelo
// SERVICE_ROLE_KEY no header Authorization, nunca por telefone/user_id livre
// no body. Mesmo nível de confiança que qualquer outro uso de service_role
// nestas functions -- o segredo nunca sai do backend (client não tem acesso
// a ele; a página de onboarding usa a sessão do próprio usuário, não isto).
export function isInternalServiceCall(req: Request): boolean {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  return !!token && !!serviceKey && token === serviceKey
}
