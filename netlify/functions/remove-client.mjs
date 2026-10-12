// Coach-only: permanently deletes one of the coach's clients, their files and all their data.
import { adminClient, json } from '../lib/server.mjs'

async function emptyFolder(admin, bucket, folder) {
  for (;;) {
    const { data } = await admin.storage.from(bucket).list(folder, { limit: 1000 })
    if (!data?.length) return
    await admin.storage.from(bucket).remove(data.map(f => `${folder}/${f.name}`))
    if (data.length < 1000) return
  }
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Use POST' })
  let admin
  try { admin = adminClient() } catch (e) { return json(500, { error: e.message }) }

  const token = (req.headers.get('authorization') || '').replace('Bearer ', '')
  const { data: who } = await admin.auth.getUser(token)
  if (!who?.user) return json(401, { error: 'Sign in again' })

  const { clientId } = await req.json()
  const { data: client } = await admin.from('profiles').select('id, coach_id, role').eq('id', clientId).single()
  if (!client || client.coach_id !== who.user.id || client.role !== 'client') return json(403, { error: 'You can only remove your own clients' })

  await emptyFolder(admin, 'photos', clientId)
  await emptyFolder(admin, 'documents', clientId)
  // Deleting the login cascades to the profile, plan, check-ins, photos, calls and files rows.
  const { error } = await admin.auth.admin.deleteUser(clientId)
  if (error) return json(400, { error: error.message })
  return json(200, { ok: true })
}
