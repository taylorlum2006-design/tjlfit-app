import { Link } from 'react-router-dom'
import { useClient } from '../state'
import { PageTitle } from '../components/ui'
import { IconChevron } from '../components/icons'

export default function More() {
  const { plan, todayRow } = useClient()
  const items = [
    { to: '/goals', label: 'Goals', sub: `${todayRow.goals_done.length}/${plan?.goals.length ?? 0} done today` },
    { to: '/supplements', label: 'Supplements', sub: `${todayRow.supplements_taken.length}/${plan?.supplements.length ?? 0} taken today` },
    { to: '/steps', label: 'Steps', sub: `${(todayRow.steps ?? 0).toLocaleString()} today` },
    ...(plan?.photos_enabled === false ? [] : [{ to: '/photos', label: 'Photos', sub: 'Front, side and back' }]),
    { to: '/me', label: 'Me', sub: 'Units, time zone, reminders' },
  ]
  return (
    <div>
      <PageTitle>More</PageTitle>
      <ul className="card p-0 divide-y divide-line">
        {items.map(i => (
          <li key={i.to}><Link to={i.to} className="flex items-center justify-between px-5 py-4"><div><p className="font-semibold">{i.label}</p><p className="text-sm text-mute">{i.sub}</p></div><span className="text-mute"><IconChevron /></span></Link></li>
        ))}
      </ul>
    </div>
  )
}
