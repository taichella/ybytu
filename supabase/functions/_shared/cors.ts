// Allowlist de origens do frontend -- fecha o débito "CORS liberado geral (*)"
// registrado em cada function antes do go-live. Duas origens reais: o
// WordPress do onboarding (ybytu.app) e o painel React (dashboard.ybytu.app).
// CORS só é aplicado por navegadores -- não afeta chamadas do app mobile
// (Expo/React Native), que não passa pelo motor de enforcement de CORS.
const ALLOWED_ORIGINS = ['https://ybytu.app', 'https://dashboard.ybytu.app']

export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get('origin')
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  }
}
