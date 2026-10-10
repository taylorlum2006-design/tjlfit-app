import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Api } from './api'
import type { Photo } from '../types'

export function supabaseApi(url: string, key: string): Api {
  const sb: SupabaseClient = createClient(url, key)
  const must = <T>({ data, error }: { data: T; error: any }): T => { if (error) throw new Error(error.message); return data }

  return {
    mode: 'live',
    async currentUserId() { const { data } = await sb.auth.getSession(); return data.session?.user.id ?? null },
    onAuthChange(cb) { const { data } = sb.auth.onAuthStateChange(() => cb()); return () => data.subscription.unsubscribe() },
    async signIn(email) {
      const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin, shouldCreateUser: false } })
      if (error) throw new Error(error.message.includes('Signups not allowed') ? 'No account for that email yet. Ask your coach to invite you.' : error.message)
    },
    async signOut() { await sb.auth.signOut() },
    async getProfile(id) { return must(await sb.from('profiles').select('*').eq('id', id).maybeSingle()) },
    async updateProfile(id, patch) { const { role, coach_id, email, ...safe } = patch as any; must(await sb.from('profiles').update(safe).eq('id', id)) },
    async listClients(coachId) { return must(await sb.from('profiles').select('*').eq('coach_id', coachId).order('name')) ?? [] },
    async getPlan(clientId) { return must(await sb.from('plans').select('*').eq('client_id', clientId).maybeSingle()) },
    async savePlan(plan) { must(await sb.from('plans').upsert({ ...plan, updated_at: new Date().toISOString() })) },
    async listDaily(clientId) { return must(await sb.from('daily_checkins').select('*').eq('client_id', clientId).order('date')) ?? [] },
    async saveDaily(row) { must(await sb.from('daily_checkins').upsert(row, { onConflict: 'client_id,date' })) },
    async listWeekly(clientId) { return must(await sb.from('weekly_checkins').select('*').eq('client_id', clientId).order('week_start')) ?? [] },
    async saveWeekly(row) { must(await sb.from('weekly_checkins').upsert(row, { onConflict: 'client_id,week_start' })) },
    async listPhotos(clientId) {
      const rows: any[] = must(await sb.from('photos').select('*').eq('client_id', clientId).order('date', { ascending: false })) ?? []
      if (!rows.length) return []
      const { data } = await sb.storage.from('photos').createSignedUrls(rows.map(r => r.storage_path), 3600)
      return rows.map((r, i): Photo => ({ id: r.id, client_id: r.client_id, date: r.date, angle: r.angle, url: data?.[i]?.signedUrl ?? '' }))
    },
    async uploadPhoto(clientId, date, angle, blob) {
      const path = `${clientId}/${date}-${angle}-${Date.now()}.jpg`
      const up = await sb.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg' })
      if (up.error) throw new Error(up.error.message)
      must(await sb.from('photos').insert({ client_id: clientId, date, angle, storage_path: path }))
    },
    async inviteClient(email, name) {
      const { data } = await sb.auth.getSession()
      const res = await fetch('/.netlify/functions/invite-client', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${data.session?.access_token}` },
        body: JSON.stringify({ email, name, redirectTo: window.location.origin }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Invite failed')
    },
  }
}
