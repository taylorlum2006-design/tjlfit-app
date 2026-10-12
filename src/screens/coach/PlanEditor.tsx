import { useState } from 'react'
import { api } from '../../data'
import { useClient } from '../../state'
import { Card, CardTitle, Field, useToast } from '../../components/ui'
import { emptyPlan } from '../../data/api'
import { dayTotal, mealsFor, r, sumItems } from '../../lib/macros'
import { WEEKDAYS } from '../../lib/dates'
import type { Ingredient, Meal, Plan } from '../../types'

const uid = () => Math.random().toString(36).slice(2, 9)
const num = (v: string) => (v === '' ? 0 : +v)

export default function PlanEditor() {
  const { plan, profile, reload } = useClient()
  const [p, setP] = useState<Plan>(() => structuredClone(plan ?? emptyPlan(profile.id)))
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const toast = useToast()
  const up = (patch: Partial<Plan>) => { setP(x => ({ ...x, ...patch })); setDirty(true) }
  const upMeal = (id: string, patch: Partial<Meal>) => up({ meals: p.meals.map(m => (m.id === id ? { ...m, ...patch } : m)) })
  const upItem = (mid: string, k: number, patch: Partial<Ingredient>) => { const m = p.meals.find(x => x.id === mid)!; upMeal(mid, { items: m.items.map((it, i) => (i === k ? { ...it, ...patch } : it)) }) }
  const move = <T,>(arr: T[], i: number, d: number) => { const a = [...arr]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a }

  async function save() {
    setBusy(true)
    try { await api.savePlan(p); await reload(); setDirty(false); toast('Plan saved. The client sees it now.') }
    catch (e: any) { toast(e.message) } finally { setBusy(false) }
  }

  const everyday = dayTotal(mealsFor(p.meals, 1))
  const variantDays = [...new Set(p.meals.flatMap(m => m.days ?? []))]

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Overview</CardTitle>
        <p className="num text-4xl">{r(everyday.kcal).toLocaleString()} kcal</p>
        <p className="text-sm text-mute mt-2">P {r(everyday.p)}g · C {r(everyday.c)}g · F {r(everyday.f)}g on a standard day. Calculated from the meals below.</p>
        {variantDays.map(d => { const t = dayTotal(mealsFor(p.meals, d)); return <p key={d} className="text-sm text-mute mt-1">{WEEKDAYS[d]}: {r(t.kcal)} kcal · P {r(t.p)}g · C {r(t.c)}g · F {r(t.f)}g</p> })}
        <div className="grid sm:grid-cols-2 gap-4 mt-5">
          <Field label="Phase"><input className="input" value={p.phase} onChange={e => up({ phase: e.target.value })} /></Field>
          <Field label="Daily step goal"><input className="input" inputMode="numeric" value={p.step_goal} onChange={e => up({ step_goal: num(e.target.value) })} /></Field>
          <Field label="Daily water goal (L)"><input className="input" inputMode="decimal" value={p.water_goal} onChange={e => up({ water_goal: num(e.target.value) })} /></Field>
          <div><span className="label block mb-2">Progress photos</span>
            <div className="grid grid-cols-2 gap-2">{[true, false].map(v => <button key={String(v)} type="button" className={`chip ${p.photos_enabled === v ? 'chip-on' : ''}`} onClick={() => up({ photos_enabled: v })}>{v ? 'On' : 'Off'}</button>)}</div>
          </div>
        </div>
        <div className="mt-4"><Field label="Coach note (shown on the client's Home)"><textarea className="input min-h-[110px]" value={p.coach_note} onChange={e => up({ coach_note: e.target.value })} /></Field></div>
      </Card>

      <h3 className="h-display text-3xl pt-4">Meals</h3>
      {p.meals.map((m, mi) => {
        const s = sumItems(m.items)
        return (
          <Card key={m.id}>
            <div className="flex gap-2 items-start">
              <input className="input font-semibold" value={m.name} onChange={e => upMeal(m.id, { name: e.target.value })} aria-label="Meal name" />
              <div className="flex gap-1 shrink-0">
                <button className="btn-ghost px-3" onClick={() => up({ meals: move(p.meals, mi, -1) })} aria-label="Move up">↑</button>
                <button className="btn-ghost px-3" onClick={() => up({ meals: move(p.meals, mi, 1) })} aria-label="Move down">↓</button>
                <button className="btn-ghost px-3 text-danger" onClick={() => confirm(`Delete ${m.name}?`) && up({ meals: p.meals.filter(x => x.id !== m.id) })} aria-label="Delete meal">✕</button>
              </div>
            </div>
            <textarea className="input mt-2 min-h-[70px] text-sm" placeholder="Timing and coaching note" value={m.note ?? ''} onChange={e => upMeal(m.id, { note: e.target.value })} />
            <div className="mt-3">
              <span className="label block mb-2">Days (none selected = every day)</span>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((d, i) => { const on = m.days?.includes(i); return <button key={d} type="button" onClick={() => upMeal(m.id, { days: on ? m.days!.filter(x => x !== i) : [...(m.days ?? []), i] })} className={`rounded-full px-3 py-1.5 text-sm border ${on ? 'border-gold text-gold bg-gold/10' : 'border-line text-mute'}`}>{d}</button> })}
              </div>
              <p className="text-xs text-mute mt-2">A day-specific meal with the same name as an everyday meal replaces it on those days (e.g. vegan Wednesday breakfast).</p>
            </div>
            <div className="mt-3"><Field label="Pick-one group (meals with the same group are options)"><input className="input" placeholder="e.g. dinner" value={m.group ?? ''} onChange={e => upMeal(m.id, { group: e.target.value || undefined })} /></Field></div>

            <div className="mt-4 overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm min-w-[560px]">
                <thead><tr className="text-mute text-xs text-left"><th className="font-medium pb-2">Ingredient</th>{['g', 'kcal', 'P', 'C', 'F'].map(h => <th key={h} className="font-medium pb-2 w-16">{h}</th>)}<th className="w-8" /></tr></thead>
                <tbody>
                  {m.items.map((it, k) => (
                    <tr key={k}>
                      <td className="pr-1.5 py-1"><input className="input py-2 text-sm" value={it.name} onChange={e => upItem(m.id, k, { name: e.target.value })} /></td>
                      {(['grams', 'kcal', 'p', 'c', 'f'] as const).map(f => <td key={f} className="px-0.5 py-1"><input className="input py-2 px-2 text-sm" inputMode="decimal" value={it[f]} onChange={e => upItem(m.id, k, { [f]: num(e.target.value) } as any)} /></td>)}
                      <td><button className="text-mute px-2" aria-label="Remove ingredient" onClick={() => upMeal(m.id, { items: m.items.filter((_, i) => i !== k) })}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-3">
              <button className="text-sm text-gold" onClick={() => upMeal(m.id, { items: [...m.items, { name: '', grams: 0, kcal: 0, p: 0, c: 0, f: 0 }] })}>+ Add ingredient</button>
              <p className="text-sm text-mute">{r(s.kcal)} kcal · P {r(s.p)} · C {r(s.c)} · F {r(s.f)}</p>
            </div>
          </Card>
        )
      })}
      <button className="btn-ghost w-full" onClick={() => up({ meals: [...p.meals, { id: uid(), name: `Meal ${p.meals.length + 1}`, items: [] }] })}>+ Add meal</button>

      <h3 className="h-display text-3xl pt-4">Supplements</h3>
      <Card>
        <div className="space-y-4">
          {p.supplements.map((s, i) => (
            <div key={s.id} className="grid gap-2 sm:grid-cols-[1fr_120px_150px_auto] border-b border-line pb-4 last:border-0">
              <input className="input" placeholder="Name" value={s.name} onChange={e => up({ supplements: p.supplements.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
              <input className="input" placeholder="Dose" value={s.dose} onChange={e => up({ supplements: p.supplements.map((x, j) => (j === i ? { ...x, dose: e.target.value } : x)) })} />
              <input className="input" placeholder="When" list="timings" value={s.timing} onChange={e => up({ supplements: p.supplements.map((x, j) => (j === i ? { ...x, timing: e.target.value } : x)) })} />
              <button className="btn-ghost px-3 text-danger" aria-label="Remove supplement" onClick={() => up({ supplements: p.supplements.filter((_, j) => j !== i) })}>✕</button>
              <textarea className="input sm:col-span-4 text-sm min-h-[60px]" placeholder="Note" value={s.note ?? ''} onChange={e => up({ supplements: p.supplements.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)) })} />
            </div>
          ))}
          <datalist id="timings"><option>With breakfast</option><option>Pre-workout</option><option>Post-workout</option><option>With dinner</option><option>Before bed</option></datalist>
          <button className="text-sm text-gold" onClick={() => up({ supplements: [...p.supplements, { id: uid(), name: '', dose: '', timing: 'With breakfast' }] })}>+ Add supplement</button>
        </div>
      </Card>

      <div className="sticky bottom-4 pt-2">
        <button className="btn shadow-[0_8px_30px_rgba(0,0,0,.7)]" disabled={!dirty || busy} onClick={save}>{busy ? 'Saving…' : dirty ? 'Save plan' : 'All changes saved'}</button>
      </div>
    </div>
  )
}
