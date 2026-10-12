import { useState } from 'react'
import { api } from '../data'
import { resetDemo } from '../data/demo'
import { useClient, useSession } from '../state'
import { Card, CardTitle, Field, PageTitle, useToast } from '../components/ui'
import { WEEKDAYS } from '../lib/dates'

const zones = (() => { try { return (Intl as any).supportedValuesOf('timeZone') as string[] } catch { return ['UTC'] } })()

export default function Me() {
  const { profile } = useClient()
  const { refresh } = useSession()
  const [f, setF] = useState(profile)
  const toast = useToast()
  const set = (k: keyof typeof f, v: any) => setF(x => ({ ...x, [k]: v }))
  async function save() { await api.updateProfile(profile.id, { name: f.name, units: f.units, timezone: f.timezone, daily_reminder_time: f.daily_reminder_time, weekly_checkin_day: f.weekly_checkin_day }); await refresh(); toast('Saved') }

  return (
    <div className="space-y-4">
      <PageTitle>Me</PageTitle>
      <Card>
        <div className="space-y-5">
          <Field label="Name"><input className="input" value={f.name} onChange={e => set('name', e.target.value)} /></Field>
          <div>
            <span className="label block mb-2">Units</span>
            <div className="grid grid-cols-2 gap-2">{(['lbs', 'kg'] as const).map(u => <button key={u} type="button" onClick={() => set('units', u)} className={`chip ${f.units === u ? 'chip-on' : ''}`}>{u}</button>)}</div>
          </div>
          <Field label="Time zone" hint="Reminders arrive at your local time.">
            <select className="input" value={f.timezone} onChange={e => set('timezone', e.target.value)}>{zones.map(z => <option key={z}>{z}</option>)}</select>
          </Field>
          <Field label="Daily check-in reminder"><input type="time" className="input" value={f.daily_reminder_time} onChange={e => set('daily_reminder_time', e.target.value)} /></Field>
          <Field label="Weekly check-in day">
            <select className="input" value={f.weekly_checkin_day} onChange={e => set('weekly_checkin_day', +e.target.value)}>{WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
          </Field>
          <button className="btn" onClick={save}>Save changes</button>
        </div>
      </Card>
      <Card>
        <CardTitle>Add the app to your home screen</CardTitle>
        <ul className="text-sm text-mute space-y-2 leading-relaxed">
          <li><span className="text-bone font-medium">iPhone:</span> open this page in Safari, tap Share, then Add to Home Screen. Open it from the icon from now on.</li>
          <li><span className="text-bone font-medium">Android:</span> in Chrome, tap the menu, then Install app.</li>
        </ul>
      </Card>
      {api.mode === 'demo' && <button className="text-sm text-mute w-full py-2" onClick={resetDemo}>Reset preview data</button>}
    </div>
  )
}
