// Get-or-create de plan_share_tokens -- extraído de ybytu-send-user-whatsapp
// (2026-08-06) pra ser reusado por ybytu-create-plan-share-token também, sem
// duplicar a lógica de "reaproveita token válido em vez de gerar um novo".
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function generatePlanShareToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function getOrCreatePlanShareToken(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data: existingToken, error: lookupError } = await supabase
    .from('plan_share_tokens')
    .select('token')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (lookupError) throw new Error(`Lookup de plan_share_tokens falhou: ${lookupError.message}`)

  if (existingToken?.token) return existingToken.token

  const token = generatePlanShareToken()
  const { error: insertError } = await supabase
    .from('plan_share_tokens')
    .insert({ user_id: userId, token })
  if (insertError) throw new Error(`Criação de plan_share_token falhou: ${insertError.message}`)

  return token
}
