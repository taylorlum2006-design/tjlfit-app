import { useClient } from '../state'
import { PageTitle } from '../components/ui'
import { EnergyChart, StepsChart, WeightChart } from '../components/WeeklyCharts'

export default function Progress() {
  const { daily, plan, profile } = useClient()
  return (
    <div className="space-y-4">
      <PageTitle sub="Weekly averages. One day means nothing, the trend is what counts.">Progress</PageTitle>
      <WeightChart rows={daily} units={profile.units} />
      <StepsChart rows={daily} goal={plan?.step_goal ?? 10000} />
      <EnergyChart rows={daily} />
    </div>
  )
}
