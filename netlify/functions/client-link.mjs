// Coach-only: makes a new personal link for one of the coach's clients. The old link stops working.
import { adminClient, json, newLink, requireCoach } from '../lib/server.mjs'

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Use POST' })
  try {
    const admin = adminClient()
    const coachId = await requireCoach(admin, req)
    const { clientId, origin } = await req.json()
    const { data: c } = await admin.from('profiles').select('coach_id').eq('id', clientId).single()
    if (c?.coach_id !== coachId) return json(403, { error: 'Not your client' })
    return json(200, { link: await newLink(admin, clientId, origin) })
  } catch (e) { return e instanceof Response ? e : json(500, { error: String(e.message || e) }) }
}
