import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useClient } from '../state'
import { Badge, Card, CardTitle, Field, PageTitle, useToast } from '../components/ui'
import DailyForm from '../components/DailyForm'
import { useWeeklyDue } from './Home'
import { last7 } from '../lib/stats'
import { fromInput, toDisplay } from '../lib/units'
import { shortDate, addDays } from '../lib/dates'
import { IconChevron } from '../components/icons'

const PREP = [
  { key: 'sessions', label: 'Training sessions completed' },
  { key: 'meals', label: 'Days fully on plan (out of 7)' },
  { key: 'prep', label: 'Meal prep done? What got made' },
]

export function WeeklyForm() {
  const { daily, weekly, today, profile, saveWeekly, readOnly, plan } = useClient()
  const { thisWeek, done } = useWeeklyDue()
  const u = profile.units
  const existing = weekly.find(w => w.week_start === thisWeek)
  const avg = last7(daily, 'weight', today)
  const [weight, setWeight] = useState('')
  const [bf, setBf] = useState('')
  const [energy, setEnergy] = useState(7)
  const [sleep, setSleep] = useState(7)
  const [win, setWin] = useState('')
  const [improve, setImprove] = useState('')
  const [notes, setNotes] = useState('')
  const [prep, setPrep] = useState<Record<string, string>>({})
  const [showPrep, setShowPrep] = useState(false)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const w = existing?.weight ?? avg.value
    const d = toDisplay(w, u)
    setWeight(d == null ? '' : String(+d.toFixed(1)))
    if (existing) {
      setBf(existing.body_fat == null ? '' : String(existing.body_fat)); setEnergy(existing.energy); setSleep(existing.sleep)
      setWin(existing.win); setImprove(existing.improve); setNotes(existing.notes); setPrep(existing.prep || {})
    }
  }, [existing?.week_start]) // eslint-disable-line

  async function submit() {
    setBusy(true)
    const n = parseFloat(weight), b = parseFloat(bf)
    try {
      await saveWeekly({ client_id: profile.id, week_start: thisWeek, weight: Number.isFinite(n) ? +fromInput(n, u).toFixed(2) : null, body_fat: Number.isFinite(b) ? b : null, energy, sleep, win: win.trim(), improve: improve.trim(), notes: notes.trim(), prep })
      toast(done ? 'Check-in updated' : 'Weekly check-in sent')
    } catch (e: any) { toast(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      {plan?.photos_enabled !== false && (
        <Link to="/photos" className="card flex items-center justify-between">
          <div><p className="font-semibold">Add this week's photos</p><p className="text-sm text-mute">Front, side and back</p></div>
          <span className="text-gold"><IconChevron /></span>
        </Link>
      )}
      <Card>
        <CardTitle right={done ? <Badge>Sent</Badge> : <Badge tone="mute">Week of {shortDate(thisWeek)}</Badge>}>Weekly check-in</CardTitle>
        <fieldset disabled={readOnly} className="space-y-5">
          <Field label={`Weight (${u})`} hint={avg.value != null ? `Filled in from your 7-day average (${avg.days} ${avg.days === 1 ? 'day' : 'days'} logged since ${shortDate(addDays(today, -6))}). Edit if needed.` : 'Log daily weights and this fills in automatically.'}>
            <input className="input" inputMode="decimal" placeholder={u === 'kg' ? 'e.g. 75.4' : 'e.g. 166.2'} value={weight} onChange={e => setWeight(e.target.value.replace(',', '.'))} />
          </Field>
          <Field label="Body fat %, optional">
            <input className="input" inputMode="decimal" placeholder="e.g. 14.5" value={bf} onChange={e => setBf(e.target.value.replace(',', '.'))} />
          </Field>
          {[['Energy this week', energy, setEnergy], ['Sleep quality', sleep, setSleep]].map(([label, v, set]) => (
            <div key={label as string}>
              <div className="flex justify-between mb-2"><span className="label">{label as string}</span><span className="text-sm"><span className="text-gold font-semibold">{v as number}</span><span className="text-mute">/10</span></span></div>
              <input type="range" min={1} max={10} value={v as number} onChange={e => (set as (n: number) => void)(+e.target.value)} className="w-full" aria-label={label as string} />
            </div>
          ))}
          <Field label="Win of the week"><textarea className="input min-h-[88px]" placeholder="A PR, a streak, sticking to the plan…" value={win} onChange={e => setWin(e.target.value)} /></Field>
          <Field label="What will you improve next week?"><textarea className="input min-h-[88px]" placeholder="One thing. Naming it makes it stick." value={improve} onChange={e => setImprove(e.target.value)} /></Field>
          <Field label="How did the week go?"><textarea className="input min-h-[88px]" placeholder="Adherence, energy, anything your coach should know" value={notes} onChange={e => setNotes(e.target.value)} /></Field>
          <div className="rounded-xl border border-line">
            <button type="button" className="w-full text-left px-4 py-3 text-sm font-medium flex justify-between" onClick={() => setShowPrep(s => !s)} aria-expanded={showPrep}>
              <span>Prep tracking, optional</span><span className="text-gold">{showPrep ? '−' : '+'}</span>
            </button>
            {showPrep && (
              <div className="px-4 pb-4 space-y-4">
                {PREP.map(p => (
                  <Field key={p.key} label={p.label}><input className="input" value={prep[p.key] || ''} onChange={e => setPrep(x => ({ ...x, [p.key]: e.target.value }))} /></Field>
                ))}
              </div>
            )}
          </div>
          {!readOnly && <button type="button" className="btn" onClick={submit} disabled={busy}>{busy ? 'Sending…' : done ? 'Update check-in' : 'Send check-in'}</button>}
        </fieldset>
      </Card>
    </div>
  )
}

export default function CheckIn() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'weekly' ? 'weekly' : 'daily'
  const { due } = useWeeklyDue()
  return (
    <div>
      <PageTitle>Check-in</PageTitle>
      <div className="grid grid-cols-2 gap-2 mb-4 p-1 rounded-xl bg-surface border border-line" role="tablist">
        {(['daily', 'weekly'] as const).map(t => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setParams(t === 'weekly' ? { tab: t } : {})}
            className={`rounded-lg py-2.5 text-sm font-medium ${tab === t ? 'bg-bone text-black' : 'text-mute'}`}>
            {t === 'daily' ? 'Daily' : <>Weekly{due && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-gold align-middle" />}</>}
          </button>
        ))}
      </div>
      {tab === 'daily' ? <DailyForm /> : <WeeklyForm />}
    </div>
  )
}
