import { useState } from 'react'
import { useClient } from '../state'
import { Card, Empty, PageTitle } from '../components/ui'
import { dayTotal, mealsFor, r, sumItems } from '../lib/macros'
import { WEEKDAYS, weekday } from '../lib/dates'
import type { Meal } from '../types'

function Macro({ k, v, big }: { k: string; v: number; big?: boolean }) {
  return <div className="rounded-xl bg-raised py-3 text-center"><p className={`${big ? 'text-xl' : 'text-lg'} font-semibold`}>{r(v)}g</p><p className="text-xs text-mute mt-0.5">{k}</p></div>
}

function MealCard({ m, option }: { m: Meal; option?: string }) {
  const s = sumItems(m.items)
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-semibold text-[17px]">{m.name}</h3>
        {option && <span className="text-xs text-gold whitespace-nowrap">{option}</span>}
      </div>
      {m.note && <p className="text-sm text-mute mt-1.5 leading-relaxed">{m.note}</p>}
      <p className="text-xs text-mute mt-2">{r(s.kcal)} kcal · P {r(s.p)}g · C {r(s.c)}g · F {r(s.f)}g</p>
      <ul className="mt-3 divide-y divide-line">
        {m.items.map((i, k) => (
          <li key={k} className="flex justify-between gap-4 py-2.5">
            <span className="text-[15px]">{i.name}</span>
            <span className="text-sm text-mute whitespace-nowrap">{i.grams}g · {r(i.kcal)} kcal</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default function Nutrition() {
  const { plan, today } = useClient()
  const [day, setDay] = useState(weekday(today))
  if (!plan || !plan.meals.length) return <><PageTitle>Nutrition</PageTitle><Empty>Your coach is still building your plan.</Empty></>
  const hasDayVariants = plan.meals.some(m => m.days && m.days.length)
  const meals = mealsFor(plan.meals, day)
  const t = dayTotal(meals)
  const groupCount: Record<string, number> = {}
  const groupSize: Record<string, number> = {}
  meals.forEach(m => { if (m.group) groupSize[m.group] = (groupSize[m.group] || 0) + 1 })

  return (
    <div className="space-y-4">
      <PageTitle sub={plan.phase}>Nutrition</PageTitle>
      {hasDayVariants && (
        <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1" role="tablist" aria-label="Day">
          {WEEKDAYS.map((d, i) => (
            <button key={d} role="tab" aria-selected={day === i} onClick={() => setDay(i)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-sm border ${day === i ? 'border-gold text-gold bg-gold/10' : 'border-line text-mute'}`}>
              {d}{i === weekday(today) ? ' · today' : ''}
            </button>
          ))}
        </div>
      )}
      <Card>
        <p className="label">Daily targets</p>
        <p className="num text-[56px] mt-3">{r(t.kcal).toLocaleString()}<span className="text-mute text-2xl ml-2 font-sans normal-case">kcal</span></p>
        <div className="grid grid-cols-3 gap-2 mt-4"><Macro k="Protein" v={t.p} big /><Macro k="Carbs" v={t.c} big /><Macro k="Fat" v={t.f} big /></div>
      </Card>
      {meals.map(m => {
        let option: string | undefined
        if (m.group && groupSize[m.group] > 1) { groupCount[m.group] = (groupCount[m.group] || 0) + 1; option = `Option ${groupCount[m.group]} of ${groupSize[m.group]}` }
        return <MealCard key={m.id} m={m} option={option} />
      })}
      <Card className="border-gold/40">
        <p className="label">Day total</p>
        <p className="num text-4xl mt-3">{r(t.kcal).toLocaleString()} kcal</p>
        <p className="text-sm text-mute mt-2">P {r(t.p)}g · C {r(t.c)}g · F {r(t.f)}g{Object.keys(groupSize).length ? '. Totals count option 1 of any pick-one meal.' : ''}</p>
      </Card>
    </div>
  )
}
