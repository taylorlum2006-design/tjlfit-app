import { useEffect, useState } from 'react'
import { useClient } from '../state'
import { Badge, Card, CardTitle, Field, useToast } from './ui'
import { fromInput, toDisplay } from '../lib/units'


function Choice<T>({ value, options, onChange, cols, label }: { value: T | null; options: { v: T; label: string }[]; onChange: (v: T) => void; cols: number; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {options.map(o => (
        <button key={String(o.v)} type="button" role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)} className={`chip ${value === o.v ? 'chip-on' : ''}`}>{o.label}</button>
      ))}
    </div>
  )
}

function Q({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <span className="label block mb-2">{label}{!required && <span className="text-mute/70"> (optional)</span>}</span>
      {children}
      {hint && <span className="block mt-2 text-xs text-mute/80">{hint}</span>}
    </div>
  )
}

export default function DailyForm() {
  const { todayRow, saveDay, today, profile, readOnly } = useClient()
  const u = profile.units
  const [weight, setWeight] = useState('')
  const [rested, setRested] = useState<boolean | null>(null)
  const [trainingDay, setTrainingDay] = useState<boolean | null>(null)
  const [desire, setDesire] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [untracked, setUntracked] = useState('')
  const [busy, setBusy] = useState(false)
  const [tried, setTried] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const w = toDisplay(todayRow.weight, u)
    setWeight(w == null ? '' : String(+w.toFixed(1)))
    setRested(todayRow.rested); setTrainingDay(todayRow.training_day); setDesire(todayRow.train_desire)
    setEnergy(todayRow.energy); setUntracked(todayRow.untracked_food)
  }, [todayRow.date, todayRow.submitted]) // eslint-disable-line

  const n = parseFloat(weight)
  const missing = [
    !Number.isFinite(n) && 'morning weight',
    rested == null && 'rested',
    energy == null && 'energy',
    trainingDay == null && 'training today',
    trainingDay && desire == null && 'desire to train',
  ].filter(Boolean) as string[]

  async function save() {
    setTried(true)
    if (missing.length) return toast(`Still need: ${missing.join(', ')}`)
    setBusy(true)
    try {
      await saveDay(today, {
        weight: +fromInput(n, u).toFixed(2), rested, training_day: trainingDay,
        train_desire: trainingDay ? desire : null, energy, untracked_food: untracked.trim(), submitted: true,
      })
      toast(todayRow.submitted ? 'Today updated' : 'Check-in logged')
    } catch (e: any) { toast(e.message) } finally { setBusy(false) }
  }

  const flag = (bad: boolean) => (tried && bad ? 'ring-1 ring-danger/60 rounded-xl' : '')

  return (
    <Card>
      <CardTitle right={todayRow.submitted ? <Badge>Logged</Badge> : <Badge tone="mute">30 seconds</Badge>}>Today's check-in</CardTitle>
      <fieldset disabled={readOnly} className="space-y-5">
        <Field label={`Morning weight (${u})`} hint="After the toilet, before food or water. Same time every day.">
          <input className={`input text-lg ${tried && !Number.isFinite(n) ? 'border-danger/70' : ''}`} inputMode="decimal" placeholder={u === 'kg' ? 'e.g. 75.4' : 'e.g. 166.2'} value={weight} onChange={e => setWeight(e.target.value.replace(',', '.'))} />
        </Field>
        <Q label="Woke up feeling rested?" required>
          <div className={flag(rested == null)}><Choice label="Rested" value={rested} onChange={setRested} cols={2} options={[{ v: true, label: 'Yes' }, { v: false, label: 'No' }]} /></div>
        </Q>
        <Q label="Energy levels today" required>
          <div className={flag(energy == null)}><Choice label="Energy" value={energy} onChange={setEnergy} cols={5} options={[1, 2, 3, 4, 5].map(v => ({ v, label: String(v) }))} /></div>
          <div className="flex justify-between text-[11px] text-mute/80 mt-1.5 px-1"><span>Running on empty</span><span>Fully charged</span></div>
        </Q>
        <Q label="Are you scheduled to train today?" required>
          <div className={flag(trainingDay == null)}><Choice label="Scheduled to train" value={trainingDay} onChange={setTrainingDay} cols={2} options={[{ v: true, label: 'Yes' }, { v: false, label: 'Rest day' }]} /></div>
        </Q>
        {trainingDay && (
          <Q label="Desire to train today" required hint="1 = dragging yourself in, 5 = can't wait">
            <div className={flag(desire == null)}><Choice label="Desire to train" value={desire} onChange={setDesire} cols={5} options={[1, 2, 3, 4, 5].map(v => ({ v, label: String(v) }))} /></div>
          </Q>
        )}
        <Field label="Anything you ate that's not in the plan? (optional)">
          <input className="input" placeholder="e.g. handful of nuts" value={untracked} onChange={e => setUntracked(e.target.value)} />
        </Field>
        {!readOnly && <button type="button" className="btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : todayRow.submitted ? 'Update today' : 'Log today'}</button>}
      </fieldset>
    </Card>
  )
}
