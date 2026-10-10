import type { Api } from './api'
import type { DailyCheckin, Photo, Plan, Profile, WeeklyCheckin } from '../types'
import { samplePlan } from './sample'
import { addDays, mondayOf, todayIn } from '../lib/dates'

// Demo mode: runs entirely in this browser so the app can be previewed before Supabase is connected.
const KEY = 'tjl-demo-v1'
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

interface Store { session: string | null; profiles: Profile[]; plans: Plan[]; daily: DailyCheckin[]; weekly: WeeklyCheckin[]; photos: Photo[] }

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
      rows.push({ client_id: id, date, weight: +(w0 + trend * t + Math.sin(t * 1.7) * 0.9).toFixed(1), rested: t % 4 !== 0, train_desire: 3 + (t % 3), digestion: '', untracked_food: '', steps: Math.round(stepBase + Math.sin(t) * 2200 + (t % 5) * 300), water: 3 + (t % 2), goals_done: [], supplements_taken: [], submitted: true })
    }
    const weeks: WeeklyCheckin[] = []
    for (let w = mondayOf(addDays(today, -start + 7)); w < mondayOf(today); w = addDays(w, 7)) {
      weeks.push({ client_id: id, week_start: w, weight: null, body_fat: null, energy: 7, sleep: 7, win: 'Hit every session', improve: 'Steps on weekends', notes: '', prep: {} })
    }
    return { p, rows, weeks }
  }
  const a = mk('alex', 'Alex Morgan', 42, 168, -0.06, 9200)
  const b = mk('sam', 'Sam Reid', 28, 151, 0.08, 7400)
  return { session: null, profiles: [coach, a.p, b.p], plans: [samplePlan('alex'), samplePlan('sam')], daily: [...a.rows, ...b.rows], weekly: [...a.weeks, ...b.weeks], photos: [] }
}

function load(): Store { try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s) } catch {} return seed() }
let db = load()
const listeners = new Set<() => void>()
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch {} }
const wait = () => new Promise(r => setTimeout(r, 120))

export function resetDemo() { db = seed(); save(); location.reload() }

export const demoApi: Api & { signInAs(id: string): void } = {
  mode: 'demo',
  async currentUserId() { return db.session },
  onAuthChange(cb) { listeners.add(cb); return () => listeners.delete(cb) },
  signInAs(id) { db.session = id; save(); listeners.forEach(l => l()) },
  async signIn() { throw new Error('Demo mode: pick client or coach below.') },
  async signOut() { db.session = null; save(); listeners.forEach(l => l()) },
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
    db.profiles.push({ id, role: 'client', coach_id: db.session, name, email, timezone: tz, units: 'lbs', start_date: todayIn(tz), daily_reminder_time: '08:00', weekly_checkin_day: 0 })
    db.plans.push(samplePlan(id)); save()
  },
}
