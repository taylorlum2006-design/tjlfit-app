// Shared helpers for Netlify functions. Not a function itself (lives outside netlify/functions).
import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'node:crypto'

export const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

export function adminClient() {
  const url = process.env.VITE_SUPABASE_URL, service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) throw new Error('Server is missing Supabase settings')
  return createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
}

export const hashToken = t => createHash('sha256').update(t).digest('hex')

/** Returns the signed-in coach's id, or throws a Response. */
export async function requireCoach(admin, req) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '')
  const { data: who } = await admin.auth.getUser(token)
  if (!who?.user) throw json(401, { error: 'Sign in again' })
  const { data: me } = await admin.from('profiles').select('role').eq('id', who.user.id).single()
  if (me?.role !== 'coach') throw json(403, { error: 'Coach only' })
  return who.user.id
}

/** Makes a fresh personal link for a user. Any previous link for them stops working. */
export async function newLink(admin, userId, origin) {
  const token = randomBytes(24).toString('base64url')
  const { error } = await admin.from('access_links').upsert({ user_id: userId, token_hash: hashToken(token), created_at: new Date().toISOString() })
  if (error) throw json(500, { error: error.message })
  return `${origin}/c/${token}`
}
