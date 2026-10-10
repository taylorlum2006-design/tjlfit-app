import { useClient } from '../state'
import { Card, Empty, PageTitle } from '../components/ui'

export default function Supplements() {
  const { plan, todayRow, today, saveDay, readOnly } = useClient()
  const list = plan?.supplements ?? []
  if (!list.length) return <><PageTitle>Supplements</PageTitle><Empty>No supplements in your plan.</Empty></>
  const taken = new Set(todayRow.supplements_taken)
  const groups = [...new Set(list.map(s => s.timing || 'Any time'))]
  const toggle = (id: string) => {
    const next = taken.has(id) ? [...taken].filter(x => x !== id) : [...taken, id]
    saveDay(today, { supplements_taken: next })
  }
  return (
    <div className="space-y-4">
      <PageTitle sub={`${taken.size} of ${list.length} taken today`}>Supplements</PageTitle>
      {groups.map(g => (
        <Card key={g}>
          <p className="label mb-1">{g}</p>
          <ul className="divide-y divide-line">
            {list.filter(s => (s.timing || 'Any time') === g).map(s => (
              <li key={s.id}>
                <button disabled={readOnly} onClick={() => toggle(s.id)} className="w-full flex gap-4 py-4 text-left" aria-pressed={taken.has(s.id)}>
                  <div className="flex-1">
                    <p className={`font-semibold ${taken.has(s.id) ? 'text-mute line-through decoration-gold/60' : ''}`}>{s.name}</p>
                    <p className="text-sm text-gold mt-0.5">{s.dose}</p>
                    {s.note && <p className="text-sm text-mute mt-1.5 leading-relaxed">{s.note}</p>}
                  </div>
                  <span className={`mt-1 h-7 w-7 shrink-0 rounded-full border-2 flex items-center justify-center ${taken.has(s.id) ? 'bg-gold border-gold text-black' : 'border-line'}`}>{taken.has(s.id) ? '✓' : ''}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  )
}
