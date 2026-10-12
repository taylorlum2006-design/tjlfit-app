import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../data'
import { ClientProvider, useClient } from '../../state'
import { Card, CardTitle, Empty, Spinner, useToast } from '../../components/ui'
import { EnergyChart, StepsChart, WeightChart } from '../../components/WeeklyCharts'
import PlanEditor from './PlanEditor'
import Photos from '../Photos'
import CoachCalls from './CoachCalls'
import PlanAI from './PlanAI'
import CoachFiles from './CoachFiles'
import { shortDate } from '../../lib/dates'
import { last7, latestWeight } from '../../lib/stats'
import { fmtW } from '../../lib/units'
import type { Profile } from '../../types'
import { IconBack } from '../../components/icons'
import LinkShare from '../../components/LinkShare'

const TABS = ['Overview', 'Check-ins', 'Plan', 'Calls', 'Files', 'Photos'] as const

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
      <p className="text-mute mt-1">{profile.email.endsWith('@clients.tjlfit.app') ? 'No email' : profile.email} · started {shortDate(profile.start_date)} · {profile.timezone}</p>
      <div className="flex gap-1 mt-6 mb-5 p-1 rounded-xl bg-surface border border-line overflow-x-auto" role="tablist">
        {TABS.map(t => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`flex-1 shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium ${tab === t ? 'bg-bone text-black' : 'text-mute'}`}>{t}</button>)}
      </div>
      {tab === 'Overview' && <Overview />}
      {tab === 'Check-ins' && <CheckIns />}
      {tab === 'Plan' && <><PlanAI /><PlanEditorFresh /></>}
      {tab === 'Calls' && <CoachCalls />}
      {tab === 'Files' && <CoachFiles />}
      {tab === 'Photos' && <Photos />}
      {tab === 'Overview' && <ClientLink />}
      {tab === 'Overview' && <RemoveClient />}
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
      <EnergyChart rows={daily} />
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
              <thead><tr className="text-left text-xs text-mute">{['Date', 'Weight', 'Rested', 'Energy', 'Training', 'Steps', 'Notes'].map(h => <th key={h} className="font-medium pb-2 pr-3">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {recent.map(r => (
                  <tr key={r.date}>
                    <td className="py-2.5 pr-3 whitespace-nowrap">{shortDate(r.date)}</td>
                    <td className="pr-3">{fmtW(r.weight, u) ?? '–'}</td>
                    <td className="pr-3">{r.rested == null ? '–' : r.rested ? 'Yes' : <span className="text-danger">No</span>}</td>
                    <td className="pr-3">{r.energy ? `${r.energy}/5` : '–'}</td>
                    <td className="pr-3 whitespace-nowrap">{r.training_day == null ? '–' : r.training_day ? `Yes${r.train_desire ? ` · desire ${r.train_desire}/5` : ''}` : 'Rest'}</td>
                    <td className="pr-3">{r.steps?.toLocaleString() ?? '–'}</td>
                    <td className="text-mute">{[r.untracked_food && `Off plan: ${r.untracked_food}`, r.digestion && `Digestion: ${r.digestion}`].filter(Boolean).join(' · ') || ''}</td>
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

function RemoveClient() {
  const { profile } = useClient()
  const nav = useNavigate()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  async function remove() {
    const label = profile.name || profile.email
    const typed = prompt(`This permanently deletes ${label}'s account, check-ins, photos, calls and files. It can't be undone.\n\nType DELETE to confirm.`)
    if (typed?.trim().toUpperCase() !== 'DELETE') return
    setBusy(true)
    try { await api.removeClient(profile.id); toast(`${label} removed`); nav('/coach') }
    catch (e: any) { toast(e.message); setBusy(false) }
  }
  return (
    <div className="mt-10 pt-6 border-t border-line">
      <button className="text-sm text-danger" disabled={busy} onClick={remove}>{busy ? 'Removing…' : 'Remove client and delete all their data'}</button>
    </div>
  )
}

function ClientLink() {
  const { profile } = useClient()
  const toast = useToast()
  const [link, setLink] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  async function make() {
    if (!confirm(`Make a new link for ${profile.name || 'this client'}? Their current link will stop working, so you'll need to send them the new one.`)) return
    setBusy(true)
    try { setLink(await api.newClientLink(profile.id)) } catch (e: any) { toast(e.message) } finally { setBusy(false) }
  }
  return (
    <Card className="mt-4">
      <CardTitle>Login link</CardTitle>
      {link ? <LinkShare name={profile.name || 'Client'} link={link} onDone={() => setLink(null)} /> : (
        <>
          <p className="text-sm text-mute">For security, links are only shown once. If they lost it, or you think someone else has it, make a new one. The old one stops working.</p>
          <button className="btn-ghost w-full mt-4" disabled={busy} onClick={make}>{busy ? 'Making…' : 'Make a new link'}</button>
        </>
      )}
    </Card>
  )
}

/** Remounts the editor whenever the saved plan changes (e.g. after the AI updates it). */
function PlanEditorFresh() {
  const { plan } = useClient()
  return <PlanEditor key={plan?.updated_at ?? 'new'} />
}
