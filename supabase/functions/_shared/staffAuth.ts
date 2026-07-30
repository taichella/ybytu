// Resolve "quem é staff" a partir do JWT do caller. Usado por toda function
// que precisa saber se quem chama é admin/personal/nutricionista — nunca lê
// user_metadata (o próprio usuário controla isso), sempre consulta staff/
// staff_roles via service_role. Ver [[project_staff_role_system_design]].
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export type StaffInfo = {
  userId: string
  fullName: string
  roles: string[]
}

export type StaffResolution =
  | { ok: true; staff: StaffInfo }
  | { ok: false; status: number; reason: string }

export async function resolveStaffFromRequest(
  req: Request,
  supabase: SupabaseClient,
): Promise<StaffResolution> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return { ok: false, status: 401, reason: 'missing_token' }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return { ok: false, status: 401, reason: 'invalid_token' }

  const { data: staffRow, error: staffError } = await supabase
    .from('staff')
    .select('user_id, full_name, revoked_at')
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .maybeSingle()

  if (staffError) return { ok: false, status: 500, reason: 'staff_lookup_failed' }
  if (!staffRow) return { ok: false, status: 403, reason: 'not_staff' }

  const { data: roleRows, error: rolesError } = await supabase
    .from('staff_roles')
    .select('role')
    .eq('user_id', user.id)
    .is('revoked_at', null)

  if (rolesError) return { ok: false, status: 500, reason: 'roles_lookup_failed' }

  const roles = (roleRows ?? []).map((r) => r.role as string)
  if (roles.length === 0) return { ok: false, status: 403, reason: 'no_active_roles' }

  return { ok: true, staff: { userId: user.id, fullName: staffRow.full_name, roles } }
}

export function requireRole(staff: StaffInfo, role: string): boolean {
  return staff.roles.includes(role)
}
