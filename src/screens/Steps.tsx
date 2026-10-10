import { useEffect, useState } from 'react'
import { useClient } from '../state'
import { Bar, Card, CardTitle, PageTitle, useToast } from '../components/ui'
import { addDays } from '../lib/dates'
import { last7 } from '../lib/stats'

export default function Steps() {
  const { plan, todayRow, today, daily, saveDay, readOnly } = useClient()
  const goal = plan?.step_goal ?? 10000
  const steps = todayRow.steps ?? 0
  const [val, setVal] = useState('')
  const toast = useToast()
  useEffect(() => setVal(todayRow.steps ? String(todayRow.steps) : ''), [todayRow.steps])
  const avg = last7(daily, 'steps', today)
  const from = addDays(today, -6)
  const week = daily.filter(r => r.date >= from && r.date <= today && r.steps != null)
  const hit = week.filter(r => (r.steps ?? 0) >= goal).length

  async function save() {
    const n = parseInt(val.replace(/[^\d]/g, ''), 10)
    if (!Number.isFinite(n)) return toast('Enter a step count')
    await saveDay(today, { steps: n }); toast('Steps saved')
  }

  return (
    <div className="space-y-4">
      <PageTitle>Steps</PageTitle>
      <Card>
        <div className="flex items-baseline justify-between mb-4">
          <p className="num text-[56px]">{steps.toLocaleString()}</p>
          <p className="text-mute">/ {goal.toLocaleString()}</p>
        </div>
        <Bar value={steps} max={goal} />
        <p className="text-sm text-mute mt-3">{Math.round(Math.min(100, (steps / goal) * 100))}% of today's goal</p>
      </Card>
      {!readOnly && (
        <Card>
          <CardTitle>Log today's steps</CardTitle>
          <input className="input text-lg" inputMode="numeric" placeholder="e.g. 8500" value={val} onChange={e => setVal(e.target.value)} />
          <button className="btn mt-3" onClick={save}>Save steps</button>
          <p className="text-xs text-mute mt-3">Copy the number from your phone's health app at the end of the day.</p>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Card><p className="label">7-day average</p><p className="num text-4xl mt-3">{avg.value == null ? '–' : Math.round(avg.value).toLocaleString()}</p><p className="text-xs text-mute mt-2">steps per day logged</p></Card>
        <Card><p className="label">Goal hit</p><p className="num text-4xl mt-3">{hit}<span className="text-mute">/{week.length}</span></p><p className="text-xs text-mute mt-2">days this past week</p></Card>
      </div>
    </div>
  )
}
