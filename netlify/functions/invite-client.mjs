// Coach-only: creates a client account and returns their personal login link. Sends no email.
import { adminClient, json, newLink, requireCoach } from '../lib/server.mjs'
import { randomUUID } from 'node:crypto'

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Use POST' })
  try {
    const admin = adminClient()
    const coachId = await requireCoach(admin, req)
    const { email, name, origin } = await req.json()
    if (!name?.trim()) return json(400, { error: 'Add their name' })
    // Email is optional. Without one, the client gets a private placeholder address they never see.
    const address = (email || '').trim().toLowerCase() || `client-${randomUUID()}@clients.tjlfit.app`
    const { data, error } = await admin.auth.admin.createUser({
      email: address, email_confirm: true, user_metadata: { name: name.trim(), coach_id: coachId },
    })
    if (error) return json(400, { error: error.message.includes('already') ? 'There is already an account with that email' : error.message })
    await admin.from('plans').upsert({ client_id: data.user.id })
    const link = await newLink(admin, data.user.id, origin)
    return json(200, { link, clientId: data.user.id })
  } catch (e) { return e instanceof Response ? e : json(500, { error: String(e.message || e) }) }
}
