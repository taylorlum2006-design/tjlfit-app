// Dates are stored as YYYY-MM-DD strings in the client's own time zone.
export function todayIn(tz: string): string {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date()) }
  catch { return new Intl.DateTimeFormat('en-CA').format(new Date()) }
}
export function parse(d: string): Date { const [y, m, dd] = d.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd)) }
export function fmt(d: Date): string { return d.toISOString().slice(0, 10) }
export function addDays(d: string, n: number): string { const x = parse(d); x.setUTCDate(x.getUTCDate() + n); return fmt(x) }
export function weekday(d: string): number { return parse(d).getUTCDay() }
export function mondayOf(d: string): string { const wd = weekday(d); return addDays(d, wd === 0 ? -6 : 1 - wd) }
export function daysBetween(a: string, b: string): number { return Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000) }
export function shortDate(d: string): string {
  return parse(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}
export function longDate(d: string): string {
  return parse(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })
}
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
