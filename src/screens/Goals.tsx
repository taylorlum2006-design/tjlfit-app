import { useClient } from '../state'
import { Bar, Card, CardTitle, Empty } from '../components/ui'

export default function GoalsSection() {
  const { plan, todayRow, today, saveDay, readOnly } = useClient()
  const goals = plan?.goals ?? []
  const done = new Set(todayRow.goals_done)
  if (!goals.length) return <Card><CardTitle>Today's goals</CardTitle><Empty>Your coach hasn't set daily goals yet.</Empty></Card>
  const toggle = (id: string) => saveDay(today, { goals_done: done.has(id) ? [...done].filter(x => x !== id) : [...done, id] })
  return (
    <div id="goals" className="space-y-4 scroll-mt-24">
      <Card>
        <CardTitle>Today's goals</CardTitle>
        <div className="flex justify-between items-baseline mb-3"><p className="num text-4xl">{done.size}<span className="text-mute">/{goals.length}</span></p><p className="text-sm text-mute">done today</p></div>
        <Bar value={done.size} max={goals.length} />
      </Card>
      <Card>
        <ul className="divide-y divide-line">
          {goals.map(g => (
            <li key={g.id}>
              <button disabled={readOnly} onClick={() => toggle(g.id)} className="w-full flex items-center gap-4 py-4 text-left" aria-pressed={done.has(g.id)}>
                <span className={`h-7 w-7 shrink-0 rounded-lg border-2 flex items-center justify-center ${done.has(g.id) ? 'bg-gold border-gold text-black' : 'border-line'}`}>{done.has(g.id) ? '✓' : ''}</span>
                <span className={done.has(g.id) ? 'text-mute line-through decoration-gold/60' : ''}>{g.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
