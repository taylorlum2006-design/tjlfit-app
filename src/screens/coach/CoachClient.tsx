import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../data'
import { ClientProvider, useClient } from '../../state'
import { Card, CardTitle, Empty, Spinner } from '../../components/ui'
import { StepsChart, WeightChart } from '../../components/WeeklyCharts'
import PlanEditor from './PlanEditor'
import Photos from '../Photos'
import { shortDate } from '../../lib/dates'
import { last7, latestWeight } from '../../lib/stats'
import { fmtW } from '../../lib/units'
import type { Profile } from '../../types'
import { IconBack } from '../../components/icons'

const TABS = ['Overview', 'Check-ins', 'Plan', 'Photos'] as const

export default function CoachClient() {
  const { id } = useParams()
  const [p, setP] = useState<Profile | null | undefined>(undefined)
  useEffect(() => { api.getProfile(id!).then(setP) }, [id])
  if (p === undefined) return <Spinner />
  if (!p) return <div className="p-6"><Empty>Client not found.</Empty></div>
  return <ClientProvider profile={p} readOnly fallback={<Spinner />}><Detail /></ClientProvider>
}

function Detail() {
  const { profile } = useClient()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview')
  return (
    <div className="min-h-screen max-w-3xl mx-auto px-4 pb-16">
      <header className="py-4 pt-[max(env(safe-area-inset-top),1rem)]">
        <Link to="/coach" className="inline-flex items-center gap-1 text-sm text-mute"><IconBack />Clients</Link>
      </header>
      <h1 className="h-display text-[48px]">{profile.name || profile.email}</h1>
      <p className="text-mute mt-1">{profile.email} · started {shortDate(profile.start_date)} · {profile.timezone}</p>
      <div className="flex gap-1 mt-6 mb-5 p-1 rounded-xl bg-surface border border-line overflow-x-auto" role="tablist">
        {TABS.map(t => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`flex-1 shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium ${tab === t ? 'bg-bone text-black' : 'text-mute'}`}>{t}</button>)}
      </div>
      {tab === 'Overview' && <Overview />}
      {tab === 'Check-ins' && <CheckIns />}
      {tab === 'Plan' && <PlanEditor />}
      {tab === 'Photos' && <Photos />}
    </div>
  )
}

function Overview() {
  const { daily, plan, profile, today } = useClient()
  const w = latestWeight(daily)
  const s = last7(daily, 'steps', today)
  const wt = last7(daily, 'weight', today)
  const u = profile.units
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><p className="label">7-day avg weight</p><p className="num text-3xl mt-3">{fmtW(wt.value, u) ?? '–'}</p><p className="text-xs text-mute mt-1">{wt.days} days logged</p></Card>
        <Card><p className="label">Since start</p><p className="num text-3xl mt-3 text-bone">{w.first != null && w.last != null ? `${w.last - w.first > 0 ? '+' : ''}${fmtW(w.last - w.first, u)}` : '–'}</p><p className="text-xs text-mute mt-1">{u}</p></Card>
        <Card><p className="label">7-day steps</p><p className="num text-3xl mt-3">{s.value == null ? '–' : Math.round(s.value).toLocaleString()}</p><p className="text-xs text-mute mt-1">goal {(plan?.step_goal ?? 10000).toLocaleString()}</p></Card>
      </div>
      <WeightChart rows={daily} units={u} />
      <StepsChart rows={daily} goal={plan?.step_goal ?? 10000} />
    </div>
  )
}

function CheckIns() {
  const { daily, weekly, profile, plan } = useClient()
  const u = profile.units
  const recent = [...daily].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 21)
  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Daily, last 3 weeks</CardTitle>
        {!recent.length ? <Empty>No daily check-ins yet.</Empty> : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[560px]">
              <thead><tr className="text-left text-xs text-mute">{['Date', 'Weight', 'Rested', 'Train', 'Steps', 'Goals', 'Notes'].map(h => <th key={h} className="font-medium pb-2 pr-3">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {recent.map(r => (
                  <tr key={r.date}>
                    <td className="py-2.5 pr-3 whitespace-nowrap">{shortDate(r.date)}</td>
                    <td className="pr-3">{fmtW(r.weight, u) ?? '–'}</td>
                    <td className="pr-3">{r.rested == null ? '–' : r.rested ? 'Yes' : <span className="text-danger">No</span>}</td>
                    <td className="pr-3">{r.train_desire ?? '–'}</td>
                    <td className="pr-3">{r.steps?.toLocaleString() ?? '–'}</td>
                    <td className="pr-3">{r.goals_done.length}/{plan?.goals.length ?? 0}</td>
                    <td className="text-mute">{[r.digestion && `Digestion: ${r.digestion}`, r.untracked_food && `Untracked: ${r.untracked_food}`].filter(Boolean).join(' · ') || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Card>
        <CardTitle>Weekly check-ins</CardTitle>
        {!weekly.length ? <Empty>No weekly check-ins yet.</Empty> : [...weekly].reverse().map(w => (
          <div key={w.week_start} className="py-4 border-b border-line last:border-0">
            <div className="flex justify-between flex-wrap gap-2"><p className="font-semibold">Week of {shortDate(w.week_start)}</p><p className="text-sm text-mute">{w.weight ? `${fmtW(w.weight, u)} ${u} · ` : ''}{w.body_fat ? `${w.body_fat}% BF · ` : ''}Energy {w.energy}/10 · Sleep {w.sleep}/10</p></div>
            {w.win && <p className="text-sm mt-2"><span className="text-gold">Win:</span> {w.win}</p>}
            {w.improve && <p className="text-sm mt-1"><span className="text-gold">Improve:</span> {w.improve}</p>}
            {w.notes && <p className="text-sm text-mute mt-1">{w.notes}</p>}
            {Object.entries(w.prep || {}).filter(([, v]) => v).map(([k, v]) => <p key={k} className="text-xs text-mute mt-1">{k}: {v}</p>)}
          </div>
        ))}
      </Card>
    </div>
  )
}
