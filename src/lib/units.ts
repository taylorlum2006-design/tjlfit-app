// Weights are stored in lbs. Displayed and entered in the client's chosen unit.
export type Units = 'lbs' | 'kg'
export const toDisplay = (lbs: number | null | undefined, u: Units) => (lbs == null ? null : u === 'kg' ? lbs / 2.20462 : lbs)
export const fromInput = (v: number, u: Units) => (u === 'kg' ? v * 2.20462 : v)
export const fmtW = (lbs: number | null | undefined, u: Units, digits = 1) => {
  const v = toDisplay(lbs, u)
  return v == null ? null : v.toFixed(digits)
}
