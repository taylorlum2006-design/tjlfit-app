import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../data'
import { useSession } from '../../state'
import { brand } from '../../brand'
import { Badge, Card, CardTitle, Empty, Field, Spinner, useToast } from '../../components/ui'
import type { DailyCheckin, Profile } from '../../types'
import { daysBetween, mondayOf, shortDate, todayIn } from '../../lib/dates'
import { last7, weeklyAverages } from '../../lib/stats'
import { fmtW } from '../../lib/units'
import { IconChevron } from '../../components/icons'

interface Row { p: Profile; daily: DailyCheckin[]; weeklyDone: boolean }

export default function CoachHome() {
  const { me } = useSession()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [busy, setBusy] = useState(false)
  const toast = useToast()

  async function load() {
    const clients = await api.listClients(me!.id)
    const out = await Promise.all(clients.map(async p => {
      const [daily, weekly] = await Promise.all([api.listDaily(p.id), api.listWeekly(p.id)])
      return { p, daily, weeklyDone: weekly.some(w => w.week_start === mondayOf(todayIn(p.timezone))) }
    }))
    setRows(out)
  }
  useEffect(() => { load() }, []) // eslint-disable-line

  async function invite(e: React.FormEvent) {
    e.preventDefault(); setBusy(true)
    try { await api.inviteClient(email.trim(), name.trim()); setEmail(''); setName(''); toast('Invite sent'); load() }
    catch (err: any) { toast(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-4 pb-16">
      <header className="flex items-center justify-between py-4 pt-[max(env(safe-area-inset-top),1rem)]">
        <img src={brand.logo} alt={brand.appName} className="h-9" />
        {api.mode === 'live' ? <button className="text-sm text-mute" onClick={() => api.signOut()}>Sign out</button> : <a href="/" className="text-sm text-mute">View client app</a>}
      </header>
      <h1 className="h-display text-[52px] mt-4">Clients</h1>
      <p className="text-mute mt-1 mb-6">Coach view for {me?.name || brand.coachName}</p>

      {!rows ? <Spinner /> : (
        <div className="space-y-3">
          {!rows.length && <Card><Empty>No clients yet. Invite your first one below.</Empty></Card>}
          {rows.map(({ p, daily, weeklyDone }) => {
            const today = todayIn(p.timezone)
            const last = [...daily].filter(d => d.submitted).sort((a, b) => b.date.localeCompare(a.date))[0]
            const since = last ? daysBetween(last.date, today) : null
            const wk = weeklyAverages(daily, 'weight')
            const trend = wk.length >= 2 ? wk[wk.length - 1].value - wk[wk.length - 2].value : null
            const steps = last7(daily, 'steps', today)
            return (
              <Link key={p.id} to={`/coach/${p.id}`} className="card flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[17px]">{p.name || p.email}</p>
                    {since == null ? <Badge tone="mute">No check-ins</Badge> : since === 0 ? <Badge>Logged today</Badge> : since >= 2 ? <Badge tone="danger">Missed {since} days</Badge> : <Badge tone="mute">Yesterday</Badge>}
                    {!weeklyDone && <Badge tone="mute">Weekly pending</Badge>}
                  </div>
                  <p className="text-sm text-mute mt-1.5">
                    {last ? `Last check-in ${shortDate(last.date)}` : `Started ${shortDate(p.start_date)}`}
                    {trend != null && (Math.abs(trend) < 0.05 ? ' · Weight steady' : ` · Weight ${trend > 0 ? '▲' : '▼'} ${fmtW(Math.abs(trend), p.units)} ${p.units}/wk`)}
                    {steps.value != null && ` · ${Math.round(steps.value).toLocaleString()} steps avg`}
                  </p>
                </div>
                <span className="text-mute"><IconChevron /></span>
              </Link>
            )
          })}
        </div>
      )}

      <Card className="mt-8">
        <CardTitle>Invite a client</CardTitle>
        <form onSubmit={invite} className="space-y-4">
          <Field label="Name"><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="First and last name" /></Field>
          <Field label="Email" hint="They get an email with a login link. No password needed."><input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="client@email.com" /></Field>
          <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send invite'}</button>
        </form>
      </Card>
      <p className="text-xs text-mute mt-4">Clients who miss 2 or more days of check-ins are flagged in red.</p>
    </div>
  )
}
