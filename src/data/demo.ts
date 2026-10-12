import type { Api } from './api'
import type { Call, CallPrivate, DailyCheckin, Doc, Photo, Plan, Profile, WeeklyCheckin } from '../types'
import { samplePlan } from './sample'
import { addDays, mondayOf, todayIn } from '../lib/dates'
import { appPath } from '../lib/link'

// Demo mode: runs entirely in this browser so the app can be previewed before Supabase is connected.
const KEY = 'tjl-demo-v1'
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

interface Store { session: string | null; profiles: Profile[]; plans: Plan[]; daily: DailyCheckin[]; weekly: WeeklyCheckin[]; photos: Photo[]; calls: Call[]; callPrivate: CallPrivate[]; docs: Doc[] }

function seed(): Store {
  const today = todayIn(tz)
  const coach: Profile = { id: 'coach', role: 'coach', coach_id: null, name: 'Taylor', email: 'coach@example.com', timezone: tz, units: 'lbs', start_date: addDays(today, -60), daily_reminder_time: '08:00', weekly_checkin_day: 0 }
  const mk = (id: string, name: string, start: number, w0: number, trend: number, stepBase: number) => {
    const p: Profile = { id, role: 'client', coach_id: 'coach', name, email: `${id}@example.com`, timezone: tz, units: 'lbs', start_date: addDays(today, -start), daily_reminder_time: '08:00', weekly_checkin_day: 0 }
    const rows: DailyCheckin[] = []
    for (let d = start; d >= 1; d--) {
      if ((d * 7 + id.length) % 6 === 0) continue // some missed days
      const date = addDays(today, -d)
      const t = start - d
      rows.push({ client_id: id, date, weight: +(w0 + trend * t + Math.sin(t * 1.7) * 0.9).toFixed(1), rested: t % 4 !== 0, training_day: t % 7 < 5, train_desire: t % 7 < 5 ? 3 + (t % 3) : null, energy: 2 + (t % 4), digestion: '', untracked_food: '', steps: Math.round(stepBase + Math.sin(t) * 2200 + (t % 5) * 300), water: 3 + (t % 2), goals_done: [], supplements_taken: [], submitted: true })
    }
    const weeks: WeeklyCheckin[] = []
    for (let w = mondayOf(addDays(today, -start + 7)); w < mondayOf(today); w = addDays(w, 7)) {
      weeks.push({ client_id: id, week_start: w, weight: null, body_fat: null, energy: 7, sleep: 7, win: 'Hit every session', improve: 'Steps on weekends', notes: '', prep: {} })
    }
    return { p, rows, weeks }
  }
  const a = mk('alex', 'Alex Morgan', 42, 168, -0.06, 9200)
  const b = mk('sam', 'Sam Reid', 28, 151, 0.08, 7400)
  return { session: null, profiles: [coach, a.p, b.p], plans: [samplePlan('alex'), samplePlan('sam')], daily: [...a.rows, ...b.rows], weekly: [...a.weeks, ...b.weeks], photos: [], calls: sampleCalls(today), callPrivate: [], docs: [] }
}

function sampleCalls(today: string): Call[] {
  const at = (d: string, h: number) => new Date(`${d}T${String(h).padStart(2, '0')}:00:00`).toISOString()
  return [
    { id: 'c1', client_id: 'alex', title: 'Week 6 check-in call', scheduled_at: at(addDays(today, 4), 17), meeting_link: 'https://meet.google.com/', recording_link: '', summary: null, client_visible: true },
    { id: 'c2', client_id: 'alex', title: 'Week 4 check-in call', scheduled_at: at(addDays(today, -10), 17), meeting_link: '', recording_link: 'https://fathom.video/', client_visible: true,
      summary: { summary: 'Weight trending down about 0.4 lbs a week, right on target. Energy dips mid-afternoon on rest days.', decisions: ['Carbs stay at 370 g for two more weeks', 'Move Meal 3 earlier on rest days'], wins: ['Hit every session for 3 weeks straight'], concerns: ['Weekend steps drop under 6k'], action_items: ['Walk 20 minutes after lunch on weekends', 'Log weight every morning, even on weekends'] } },
  ]
}

function load(): Store {
  try { const s = localStorage.getItem(KEY); if (s) { const d = JSON.parse(s); return { calls: [], callPrivate: [], docs: [], ...d } } } catch {}
  return seed()
}
let db = load()
const listeners = new Set<() => void>()
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch {} }
const wait = () => new Promise(r => setTimeout(r, 120))

export function resetDemo() { db = seed(); save(); location.reload() }

export const demoApi: Api = {
  mode: 'demo',
  // Preview: the coach view lives at /coach, everything else is the sample client's app.
  async currentUserId() { return appPath().startsWith('/coach') ? 'coach' : 'alex' },
  onAuthChange(cb) { listeners.add(cb); return () => listeners.delete(cb) },
  async loginWithLink() {},
  async signOut() { listeners.forEach(l => l()) },
  async getProfile(id) { return db.profiles.find(p => p.id === id) ?? null },
  async updateProfile(id, patch) { db.profiles = db.profiles.map(p => (p.id === id ? { ...p, ...patch } : p)); save() },
  async listClients(coachId) { return db.profiles.filter(p => p.coach_id === coachId) },
  async getPlan(clientId) { return db.plans.find(p => p.client_id === clientId) ?? null },
  async savePlan(plan) { await wait(); db.plans = [...db.plans.filter(p => p.client_id !== plan.client_id), { ...plan, updated_at: new Date().toISOString() }]; save() },
  async listDaily(clientId) { return db.daily.filter(r => r.client_id === clientId).sort((a, b) => a.date.localeCompare(b.date)) },
  async saveDaily(row) { await wait(); db.daily = [...db.daily.filter(r => !(r.client_id === row.client_id && r.date === row.date)), row]; save() },
  async listWeekly(clientId) { return db.weekly.filter(r => r.client_id === clientId).sort((a, b) => a.week_start.localeCompare(b.week_start)) },
  async saveWeekly(row) { await wait(); db.weekly = [...db.weekly.filter(r => !(r.client_id === row.client_id && r.week_start === row.week_start)), row]; save() },
  async listPhotos(clientId) { return db.photos.filter(p => p.client_id === clientId).sort((a, b) => b.date.localeCompare(a.date)) },
  async uploadPhoto(clientId, date, angle, blob) {
    const url: string = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result as string); fr.readAsDataURL(blob) })
    db.photos.push({ id: crypto.randomUUID(), client_id: clientId, date, angle, url }); save()
  },
  async inviteClient(email, name) {
    await wait()
    const id = crypto.randomUUID()
    db.profiles.push({ id, role: 'client', coach_id: 'coach', name, email, timezone: tz, units: 'lbs', start_date: todayIn(tz), daily_reminder_time: '08:00', weekly_checkin_day: 0 })
    db.plans.push(samplePlan(id)); save()
    return `${location.origin}/c/preview-link-for-${id.slice(0, 8)}`
  },
  async newClientLink(id) { return `${location.origin}/c/preview-link-for-${id.slice(0, 8)}-new` },
  async removeClient(id) {
    db.profiles = db.profiles.filter(p => p.id !== id); db.plans = db.plans.filter(p => p.client_id !== id)
    db.daily = db.daily.filter(r => r.client_id !== id); db.weekly = db.weekly.filter(r => r.client_id !== id)
    db.photos = db.photos.filter(r => r.client_id !== id); db.calls = db.calls.filter(r => r.client_id !== id)
    db.docs = db.docs.filter(r => r.client_id !== id); save()
  },
  async listCalls(clientId) { return db.calls.filter(c => c.client_id === clientId).sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at)) },
  async saveCall(call) { await wait(); db.calls = [...db.calls.filter(c => c.id !== call.id), call]; save() },
  async deleteCall(id) { db.calls = db.calls.filter(c => c.id !== id); db.callPrivate = db.callPrivate.filter(c => c.call_id !== id); save() },
  async getCallPrivate(callId) { return db.callPrivate.find(c => c.call_id === callId) ?? null },
  async saveCallPrivate(row) { db.callPrivate = [...db.callPrivate.filter(c => c.call_id !== row.call_id), row]; save() },
  async summarize() { throw new Error('AI summaries switch on once the app is connected to Supabase and your Anthropic key is added (see SETUP.md). You can still type a summary in by hand.') },
  async listDocs(clientId) { return db.docs.filter(d => d.client_id === clientId).sort((a, b) => b.created_at.localeCompare(a.created_at)) },
  async uploadDoc(clientId, title, file, visible) {
    if (file.size > 3_000_000) throw new Error('Preview mode only holds files under 3 MB. Real uploads allow much larger files.')
    const url: string = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result as string); fr.readAsDataURL(file) })
    db.docs.push({ id: crypto.randomUUID(), client_id: clientId, title, url, size: file.size, client_visible: visible, created_at: new Date().toISOString() })
    try { save() } catch { throw new Error('Preview storage is full. Delete a file first.') }
  },
  async updateDoc(id, patch) { db.docs = db.docs.map(d => (d.id === id ? { ...d, ...patch } : d)); save() },
  async deleteDoc(doc) { db.docs = db.docs.filter(d => d.id !== doc.id); save() },
}
