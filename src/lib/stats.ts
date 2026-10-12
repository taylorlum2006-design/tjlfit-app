import type { DailyCheckin } from '../types'
import { addDays, mondayOf, shortDate } from './dates'

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

/** Weekly averages (Monday start), averaging only days that were actually logged. */
export function weeklyAverages(rows: DailyCheckin[], key: 'weight' | 'steps' | 'energy', weeks = 12) {
  const byWeek = new Map<string, number[]>()
  for (const r of rows) {
    const v = r[key]
    if (v == null || Number.isNaN(v)) continue
    const w = mondayOf(r.date)
    byWeek.set(w, [...(byWeek.get(w) || []), v])
  }
  const keys = [...byWeek.keys()].sort().slice(-weeks)
  return keys.map(w => ({ week: w, label: shortDate(w), value: avg(byWeek.get(w)!)!, days: byWeek.get(w)!.length }))
}

/** Average over the last 7 calendar days ending on `today`, logged days only. */
export function last7(rows: DailyCheckin[], key: 'weight' | 'steps' | 'energy', today: string) {
  const from = addDays(today, -6)
  const vals = rows.filter(r => r.date >= from && r.date <= today && r[key] != null).map(r => r[key] as number)
  return { value: avg(vals), days: vals.length }
}

export function latestWeight(rows: DailyCheckin[]) {
  const w = rows.filter(r => r.weight != null).sort((a, b) => a.date.localeCompare(b.date))
  return { first: w[0]?.weight ?? null, last: w[w.length - 1]?.weight ?? null, lastDate: w[w.length - 1]?.date ?? null }
}
