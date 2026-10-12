// Public: exchanges a personal link for a one-time sign-in. Sends no email.
import { adminClient, hashToken, json } from '../lib/server.mjs'

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Use POST' })
  try {
    const { token } = await req.json()
    if (typeof token !== 'string' || token.length < 20) return json(400, { error: 'This link is not valid' })
    const admin = adminClient()
    const { data: row } = await admin.from('access_links').select('user_id').eq('token_hash', hashToken(token)).maybeSingle()
    if (!row) return json(404, { error: "This link doesn't work anymore. Ask your coach for a new one." })
    const { data: u } = await admin.auth.admin.getUserById(row.user_id)
    if (!u?.user?.email) return json(404, { error: "This link doesn't work anymore. Ask your coach for a new one." })
    const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: u.user.email })
    if (error) return json(500, { error: error.message })
    return json(200, { userId: row.user_id, tokenHash: data.properties.hashed_token })
  } catch (e) { return json(500, { error: String(e.message || e) }) }
}
