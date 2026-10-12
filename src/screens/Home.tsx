import { Link } from 'react-router-dom'
import { useClient } from '../state'
import { Bar, Card, CardTitle } from '../components/ui'
import DailyForm from '../components/DailyForm'
import { dayTotal, mealsFor, r } from '../lib/macros'
import { longDate, mondayOf, weekday } from '../lib/dates'
import { latestWeight } from '../lib/stats'
import { fmtW } from '../lib/units'
import { IconChevron } from '../components/icons'

export function useWeeklyDue() {
  const { profile, weekly, today } = useClient()
  const thisWeek = mondayOf(today)
  const done = weekly.some(w => w.week_start === thisWeek)
  const wd = weekday(today)
  const day = profile.weekly_checkin_day
  // Due from check-in day until the end of the week (Sunday)
  const due = !done && (wd === day || (day !== 0 && (wd === 0 || wd > day)))
  return { due, done, thisWeek }
}

export default function Home() {
  const c = useClient()
  const { plan, daily, todayRow, today, profile, saveDay } = c
  const { due } = useWeeklyDue()
  const meals = plan ? mealsFor(plan.meals, weekday(today)) : []
  const t = dayTotal(meals)
  const w = latestWeight(daily)
  const u = profile.units
  const change = w.first != null && w.last != null ? w.last - w.first : null
  const goalsTotal = plan?.goals.length ?? 0
  const suppTotal = plan?.supplements.length ?? 0
  const water = todayRow.water ?? 0
  const waterGoal = plan?.water_goal ?? 3
  const steps = todayRow.steps ?? 0
  const stepGoal = plan?.step_goal ?? 10000

  return (
    <div className="space-y-4">
      <div className="pt-2 pb-2">
        <p className="text-mute text-sm">{longDate(today)}</p>
        <h1 className="h-display text-[52px] mt-1">{todayRow.submitted ? <>Logged. <span className="em text-[44px]">keep going.</span></> : 'Today'}</h1>
      </div>

      {due && (
        <Link to="/checkin?tab=weekly" className="flex items-center justify-between rounded-2xl border border-gold/40 bg-gold/10 px-5 py-4">
          <div><p className="font-semibold text-gold">Weekly check-in is due</p><p className="text-sm text-mute">Five minutes. Photos too, if you can.</p></div>
          <span className="text-gold"><IconChevron /></span>
        </Link>
      )}

      <DailyForm />

      {plan && meals.length > 0 && (
        <Card>
          <CardTitle right={<Link to="/nutrition" className="text-sm text-gold">View plan</Link>}>Today's targets</CardTitle>
          <p className="num text-[56px]">{r(t.kcal).toLocaleString()}<span className="text-mute text-2xl ml-2 font-sans normal-case">kcal</span></p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[['Protein', t.p], ['Carbs', t.c], ['Fat', t.f]].map(([k, v]) => (
              <div key={k as string} className="rounded-xl bg-raised py-3 text-center">
                <p className="text-xl font-semibold">{r(v as number)}g</p><p className="text-xs text-mute mt-0.5">{k}</p>
              </div>
            ))}
          </div>
          {plan.coach_note && <p className="mt-4 text-sm text-mute leading-relaxed whitespace-pre-line">{plan.coach_note}</p>}
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="label">Latest weight</p>
          <p className="num text-4xl mt-3">{fmtW(w.last, u) ?? '–'}<span className="text-mute text-base font-sans ml-1">{w.last != null ? u : ''}</span></p>
          <p className="text-xs text-mute mt-2">{w.last == null ? 'Log a morning weight' : w.lastDate === today ? 'This morning' : 'Last logged'}</p>
        </Card>
        <Card>
          <p className="label">Change</p>
          <p className="num text-4xl mt-3 text-bone">{change == null ? '–' : `${change > 0 ? '+' : ''}${fmtW(change, u)}`}</p>
          <p className="text-xs text-mute mt-2">since you started</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/progress#goals" className="card block">
          <p className="label">Goals</p>
          <p className="num text-4xl mt-3">{todayRow.goals_done.length}<span className="text-mute">/{goalsTotal}</span></p>
          <p className="text-xs text-mute mt-2">done today</p>
        </Link>
        <Link to="/supplements" className="card block">
          <p className="label">Supplements</p>
          <p className="num text-4xl mt-3">{todayRow.supplements_taken.length}<span className="text-mute">/{suppTotal}</span></p>
          <p className="text-xs text-mute mt-2">taken today</p>
        </Link>
      </div>

      <Card>
        <CardTitle right={<span className="text-sm text-mute">goal {waterGoal} L</span>}>Water</CardTitle>
        <div className="flex items-center gap-4">
          <button className="btn-ghost w-12 h-12 p-0 text-xl" aria-label="Remove 250 ml" disabled={c.readOnly || water <= 0} onClick={() => saveDay(today, { water: Math.max(0, +(water - 0.25).toFixed(2)) })}>−</button>
          <p className="flex-1 text-center num text-4xl">{water.toFixed(2).replace(/\.?0+$/, '')}<span className="text-mute text-base font-sans ml-1">L</span></p>
          <button className="btn-ghost w-12 h-12 p-0 text-xl" aria-label="Add 250 ml" disabled={c.readOnly} onClick={() => saveDay(today, { water: +(water + 0.25).toFixed(2) })}>+</button>
        </div>
        <div className="mt-4"><Bar value={water} max={waterGoal} /></div>
      </Card>

      <Link to="/steps" className="card block">
        <CardTitle right={<span className="text-sm text-mute">goal {stepGoal.toLocaleString()}</span>}>Steps</CardTitle>
        <p className="num text-4xl mb-4">{steps.toLocaleString()}</p>
        <Bar value={steps} max={stepGoal} />
      </Link>
    </div>
  )
}
