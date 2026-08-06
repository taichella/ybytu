// Allowlist de origens do frontend -- fecha o débito "CORS liberado geral (*)"
// registrado em cada function antes do go-live. Origens reais: o WordPress do
// onboarding (ybytu.app, com e sem www) e o painel React dos profissionais
// (pro.ybytu.app -- migração de dashboard.ybytu.app em andamento 2026-08-05,
// ver [[project_cors_www_origin_gap]]; dashboard.ybytu.app fica na lista até
// o pro.ybytu.app estar estável, aí sai).
// CORS só é aplicado por navegadores -- não afeta chamadas do app mobile
// (Expo/React Native).
const ALLOWED_ORIGINS = [
  'https://ybytu.app',
  'https://www.ybytu.app',
  'https://pro.ybytu.app',
  'https://dashboard.ybytu.app',
]

export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get('origin')
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  }
  // Sem fallback para ALLOWED_ORIGINS[0]: uma origem fora da lista não recebe
  // Access-Control-Allow-Origin nenhum, então o navegador bloqueia de forma
  // clara em vez de um header "mentiroso" que parece sucesso no server mas
  // falha silenciosamente no client.
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}
