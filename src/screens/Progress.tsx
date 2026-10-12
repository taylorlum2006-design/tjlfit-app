import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useClient } from '../state'
import GoalsSection from './Goals'
import { Card, CardTitle, Empty, PageTitle } from '../components/ui'
import { StepsChart, WeightChart } from '../components/WeeklyCharts'
import { shortDate } from '../lib/dates'
import { fmtW } from '../lib/units'

export default function Progress() {
  const { daily, weekly, plan, profile } = useClient()
  const recent = [...weekly].reverse().slice(0, 6)
  const { hash } = useLocation()
  useEffect(() => { if (hash === '#goals') setTimeout(() => document.getElementById('goals')?.scrollIntoView({ behavior: 'smooth' }), 50) }, [hash])
  return (
    <div className="space-y-4">
      <PageTitle sub="Weekly averages. One day means nothing, the trend is what counts.">Progress</PageTitle>
      <WeightChart rows={daily} units={profile.units} />
      <StepsChart rows={daily} goal={plan?.step_goal ?? 10000} />
      <GoalsSection />
      <Card>
        <CardTitle>Weekly check-ins</CardTitle>
        {!recent.length ? <Empty>Your weekly check-ins show here.</Empty> : (
          <ul className="divide-y divide-line">
            {recent.map(w => (
              <li key={w.week_start} className="py-3.5">
                <div className="flex justify-between text-sm"><span className="font-semibold">Week of {shortDate(w.week_start)}</span><span className="text-mute">Energy {w.energy} · Sleep {w.sleep}{w.weight ? ` · ${fmtW(w.weight, profile.units)} ${profile.units}` : ''}</span></div>
                {w.win && <p className="text-sm text-mute mt-1"><span className="text-gold">Win:</span> {w.win}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
