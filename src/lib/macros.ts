import type { Ingredient, Meal } from '../types'

export interface Macros { kcal: number; p: number; c: number; f: number }
export const zero = (): Macros => ({ kcal: 0, p: 0, c: 0, f: 0 })

export function sumItems(items: Ingredient[]): Macros {
  return items.reduce((a, i) => ({ kcal: a.kcal + (+i.kcal || 0), p: a.p + (+i.p || 0), c: a.c + (+i.c || 0), f: a.f + (+i.f || 0) }), zero())
}

/** Meals that apply on a given weekday. Meals without days apply every day. */
export function mealsFor(meals: Meal[], wd: number): Meal[] {
  const specific = meals.filter(m => m.days && m.days.length && m.days.includes(wd))
  const general = meals.filter(m => !m.days || !m.days.length)
  // If a weekday has its own version of a meal (same name), it replaces the everyday one.
  const names = new Set(specific.map(m => m.name))
  return meals.filter(m => specific.includes(m) || (general.includes(m) && !names.has(m.name)))
}

/** Day total: alternatives in the same group count once (the first option). */
export function dayTotal(meals: Meal[]): Macros {
  const seen = new Set<string>()
  return meals.reduce((a, m) => {
    if (m.group) { if (seen.has(m.group)) return a; seen.add(m.group) }
    const s = sumItems(m.items)
    return { kcal: a.kcal + s.kcal, p: a.p + s.p, c: a.c + s.c, f: a.f + s.f }
  }, zero())
}

export const r = (n: number) => Math.round(n)
