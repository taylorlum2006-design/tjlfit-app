import { useEffect, useState } from 'react'
import { useClient } from '../state'
import { Badge, Card, CardTitle, Field, useToast } from './ui'
import { fromInput, toDisplay } from '../lib/units'

export default function DailyForm() {
  const { todayRow, saveDay, today, profile, readOnly } = useClient()
  const u = profile.units
  const [weight, setWeight] = useState('')
  const [rested, setRested] = useState<boolean | null>(null)
  const [desire, setDesire] = useState<number | null>(null)
  const [digestion, setDigestion] = useState('')
  const [untracked, setUntracked] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const w = toDisplay(todayRow.weight, u)
    setWeight(w == null ? '' : String(+w.toFixed(1)))
    setRested(todayRow.rested); setDesire(todayRow.train_desire)
    setDigestion(todayRow.digestion); setUntracked(todayRow.untracked_food)
  }, [todayRow.date, todayRow.submitted]) // eslint-disable-line

  async function save() {
    setBusy(true)
    const n = parseFloat(weight)
    try {
      await saveDay(today, { weight: Number.isFinite(n) ? +fromInput(n, u).toFixed(2) : null, rested, train_desire: desire, digestion: digestion.trim(), untracked_food: untracked.trim(), submitted: true })
      toast(todayRow.submitted ? 'Today updated' : 'Check-in logged')
    } catch (e: any) { toast(e.message) } finally { setBusy(false) }
  }

  return (
    <Card>
      <CardTitle right={todayRow.submitted ? <Badge>Logged</Badge> : <Badge tone="mute">30 seconds</Badge>}>Today's check-in</CardTitle>
      <fieldset disabled={readOnly} className="space-y-5">
        <Field label={`Morning weight (${u}), optional`} hint="Same time daily: after the toilet, before food or water.">
          <input className="input text-lg" inputMode="decimal" placeholder={u === 'kg' ? 'e.g. 75.4' : 'e.g. 166.2'} value={weight} onChange={e => setWeight(e.target.value.replace(',', '.'))} />
        </Field>
        <div>
          <span className="label block mb-2">Woke up feeling rested?</span>
          <div className="grid grid-cols-2 gap-2">
            {[true, false].map(v => (
              <button key={String(v)} type="button" onClick={() => setRested(v)} className={`chip ${rested === v ? 'chip-on' : ''}`} aria-pressed={rested === v}>{v ? 'Yes' : 'No'}</button>
            ))}
          </div>
        </div>
        <div>
          <span className="label block mb-2">Desire to train today</span>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => setDesire(n)} className={`chip ${desire === n ? 'chip-on' : ''}`} aria-pressed={desire === n}>{n}</button>
            ))}
          </div>
        </div>
        <Field label="Any digestive issues? Which meal?">
          <input className="input" placeholder="e.g. bloated after meal 2, optional" value={digestion} onChange={e => setDigestion(e.target.value)} />
        </Field>
        <Field label="Any untracked food?">
          <input className="input" placeholder="e.g. handful of nuts, optional" value={untracked} onChange={e => setUntracked(e.target.value)} />
        </Field>
        {!readOnly && <button type="button" className="btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : todayRow.submitted ? 'Update today' : 'Log today'}</button>}
      </fieldset>
    </Card>
  )
}
