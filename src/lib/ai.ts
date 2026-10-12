import type { CallSummary, Meal, Plan, Supplement } from '../types'

export interface ProcessResult {
  title: string
  summary: CallSummary
  plan: { phase: string | null; coach_note: string | null; step_goal: number | null; water_goal: number | null; meals: Meal[] | null; supplements: Supplement[] | null }
  changes: string[]
}

/** Reads Claude's streamed answer (server-sent events) and returns the full text. */
export async function readStream(res: Response, onProgress?: (chars: number) => void): Promise<string> {
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'The AI service failed, try again')
  }
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = '', text = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n'); buf = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      let ev: any
      try { ev = JSON.parse(line.slice(5).trim()) } catch { continue }
      if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') { text += ev.delta.text; onProgress?.(text.length) }
      else if (ev.type === 'error') throw new Error(ev.error?.message || 'The AI service failed, try again')
    }
  }
  return text
}

/** Pulls the JSON object out of the model's text, even if it added stray words. */
export function parseJson<T>(text: string): T {
  const start = text.indexOf('{'), end = text.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error('Could not read the AI answer, try again')
  try { return JSON.parse(text.slice(start, end + 1)) } catch { throw new Error('Could not read the AI answer, try again') }
}

const list = (v: unknown) => (Array.isArray(v) ? v.map(String).filter(Boolean) : [])
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const uid = () => Math.random().toString(36).slice(2, 9)

export function cleanSummary(s: any): CallSummary {
  return { summary: String(s?.summary || ''), decisions: list(s?.decisions), wins: list(s?.wins), concerns: list(s?.concerns), action_items: list(s?.action_items) }
}

function cleanMeals(v: any): Meal[] | null {
  if (!Array.isArray(v)) return null
  return v.map((m: any) => ({
    id: String(m.id || uid()), name: String(m.name || 'Meal'), note: m.note ? String(m.note) : undefined,
    days: Array.isArray(m.days) && m.days.length ? m.days.map(Number).filter((d: number) => d >= 0 && d <= 6) : undefined,
    group: m.group ? String(m.group) : undefined,
    items: (Array.isArray(m.items) ? m.items : []).map((i: any) => ({ name: String(i.name || ''), grams: num(i.grams), kcal: Math.round(num(i.kcal)), p: +num(i.p).toFixed(1), c: +num(i.c).toFixed(1), f: +num(i.f).toFixed(1) })),
  }))
}

function cleanSupps(v: any): Supplement[] | null {
  if (!Array.isArray(v)) return null
  return v.map((s: any) => ({ id: String(s.id || uid()), name: String(s.name || ''), dose: String(s.dose || ''), timing: String(s.timing || 'Any time'), note: s.note ? String(s.note) : undefined }))
}

export function cleanResult(r: any): ProcessResult {
  const p = r?.plan || {}
  const n = (v: any) => (v == null || v === '' ? null : num(v) || null)
  return {
    title: String(r?.title || 'Coaching call'),
    summary: cleanSummary(r?.summary),
    plan: { phase: p.phase ? String(p.phase) : null, coach_note: p.coach_note ? String(p.coach_note) : null, step_goal: n(p.step_goal), water_goal: n(p.water_goal), meals: cleanMeals(p.meals), supplements: cleanSupps(p.supplements) },
    changes: list(r?.changes),
  }
}

/** Applies the AI's plan changes on top of the current plan. Nulls mean "leave as is". */
export function applyPlan(current: Plan, u: ProcessResult['plan']): Plan {
  return {
    ...current,
    phase: u.phase ?? current.phase,
    coach_note: u.coach_note ?? current.coach_note,
    step_goal: u.step_goal ?? current.step_goal,
    water_goal: u.water_goal ?? current.water_goal,
    meals: u.meals ?? current.meals,
    supplements: u.supplements ?? current.supplements,
  }
}
