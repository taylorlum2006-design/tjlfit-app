// Coach-only: invites a client by email and creates their starting plan.
// Needs SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_URL in Netlify environment variables.
import { createClient } from '@supabase/supabase-js'

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Use POST' })
  const url = process.env.VITE_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) return json(500, { error: 'Server is missing Supabase settings' })
  const admin = createClient(url, service, { auth: { persistSession: false } })

  const token = (req.headers.get('authorization') || '').replace('Bearer ', '')
  const { data: who } = await admin.auth.getUser(token)
  if (!who?.user) return json(401, { error: 'Sign in again' })
  const { data: me } = await admin.from('profiles').select('role').eq('id', who.user.id).single()
  if (me?.role !== 'coach') return json(403, { error: 'Only coaches can invite clients' })

  const { email, name, redirectTo } = await req.json()
  if (!email) return json(400, { error: 'Email is required' })
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email.trim().toLowerCase(), {
    data: { name: name || '', coach_id: who.user.id },
    redirectTo,
  })
  if (error) return json(400, { error: error.message })
  await admin.from('plans').upsert({ client_id: data.user.id })
  return json(200, { ok: true })
}
