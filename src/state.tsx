import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from './data'
import { emptyDaily } from './data/api'
import type { DailyCheckin, Plan, Profile, WeeklyCheckin } from './types'
import { todayIn } from './lib/dates'

// Signed-in user -------------------------------------------------------------
interface SessionState { me: Profile | null; loading: boolean; refresh: () => Promise<void> }
const SessionCtx = createContext<SessionState>({ me: null, loading: true, refresh: async () => {} })
export const useSession = () => useContext(SessionCtx)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => {
    const id = await api.currentUserId()
    setMe(id ? await api.getProfile(id) : null)
  }, [])
  useEffect(() => {
    const minSplash = new Promise(r => setTimeout(r, 1300))
    Promise.all([refresh(), minSplash]).then(() => setLoading(false))
    return api.onAuthChange(() => { refresh() })
  }, [refresh])
  return <SessionCtx.Provider value={{ me, loading, refresh }}>{children}</SessionCtx.Provider>
}

// One client's data (used by the client app and by the coach viewing a client)
export interface ClientState {
  profile: Profile
  plan: Plan | null
  daily: DailyCheckin[]
  weekly: WeeklyCheckin[]
  today: string
  todayRow: DailyCheckin
  readOnly: boolean
  saveDay: (date: string, patch: Partial<DailyCheckin>) => Promise<void>
  saveWeekly: (row: WeeklyCheckin) => Promise<void>
  reload: () => Promise<void>
}
const ClientCtx = createContext<ClientState | null>(null)
export const useClient = () => { const c = useContext(ClientCtx); if (!c) throw new Error('No client'); return c }

export function ClientProvider({ profile, readOnly = false, children, fallback }: { profile: Profile; readOnly?: boolean; children: ReactNode; fallback: ReactNode }) {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [daily, setDaily] = useState<DailyCheckin[]>([])
  const [weekly, setWeekly] = useState<WeeklyCheckin[]>([])
  const [ready, setReady] = useState(false)
  const today = todayIn(profile.timezone)

  const reload = useCallback(async () => {
    const [p, d, w] = await Promise.all([api.getPlan(profile.id), api.listDaily(profile.id), api.listWeekly(profile.id)])
    setPlan(p); setDaily(d); setWeekly(w); setReady(true)
  }, [profile.id])

  useEffect(() => {
    reload()
    const onFocus = () => { if (document.visibilityState === 'visible') reload() }
    document.addEventListener('visibilitychange', onFocus)
    return () => document.removeEventListener('visibilitychange', onFocus)
  }, [reload])

  const saveDay = useCallback(async (date: string, patch: Partial<DailyCheckin>) => {
    const existing = daily.find(r => r.date === date) ?? emptyDaily(profile.id, date)
    const row = { ...existing, ...patch }
    setDaily(ds => [...ds.filter(r => r.date !== date), row].sort((a, b) => a.date.localeCompare(b.date)))
    await api.saveDaily(row)
  }, [daily, profile.id])

  const saveWeekly = useCallback(async (row: WeeklyCheckin) => {
    setWeekly(ws => [...ws.filter(w => w.week_start !== row.week_start), row].sort((a, b) => a.week_start.localeCompare(b.week_start)))
    await api.saveWeekly(row)
  }, [])

  const value = useMemo<ClientState>(() => ({
    profile, plan, daily, weekly, today, readOnly,
    todayRow: daily.find(r => r.date === today) ?? emptyDaily(profile.id, today),
    saveDay, saveWeekly, reload,
  }), [profile, plan, daily, weekly, today, readOnly, saveDay, saveWeekly, reload])

  if (!ready) return <>{fallback}</>
  return <ClientCtx.Provider value={value}>{children}</ClientCtx.Provider>
}
