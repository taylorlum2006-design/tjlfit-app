// Coach-only AI for calls. Streams Claude's answer straight through so long calls never time out.
// Modes: "summary" (recap only) and "process" (recap + updated plan).
// Needs ANTHROPIC_API_KEY, VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify environment variables.

declare const Netlify: { env: { get(k: string): string | undefined } }

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const STYLE = `Be specific: include numbers, foods, exercises, dates and targets that were agreed. Plain, direct language, no filler, no em dashes.`

const SUMMARY_SHAPE = `"summary": {
  "summary": 2 to 4 sentences, written to the client, on what the call covered and where they are at,
  "decisions": changes agreed on the call (macros, meals, training, schedule),
  "wins": progress and things going well,
  "concerns": problems, blockers or risks raised,
  "action_items": concrete things the client should do, each short, starting with a verb
}
Each list is an array of short strings, empty if nothing fits. The summary is shown to the client, so never include anything the coach said privately about them.`

function summaryPrompt(transcript: string, clientName: string) {
  return `You are summarizing a fitness coaching call between a coach and their client${clientName ? ` (${clientName})` : ''}.
${STYLE}

Return ONLY a JSON object of this shape (no code fences):
{ ${SUMMARY_SHAPE} }

<transcript>
${transcript}
</transcript>`
}

function processPrompt(transcript: string, clientName: string, plan: unknown) {
  return `You are the assistant of a fitness coach. Read this coaching call with their client${clientName ? ` (${clientName})` : ''} and update the client's plan to match what was agreed on the call.
${STYLE}

The client's current plan (JSON):
<plan>
${JSON.stringify(plan)}
</plan>

Plan format:
- "phase": short name like "Cut 1" or "Lean bulk"
- "coach_note": shown on the client's Home screen. The current key instructions in the coach's voice, 2 to 5 sentences, second person.
- "step_goal": daily steps (number). "water_goal": litres per day (number).
- "meals": full list of meals in order. Each meal: { "id", "name", "note" (timing and how to eat it), "days" (optional array of weekdays this meal is for, 0 = Sunday, 6 = Saturday; omit for every day; a day-specific meal with the same name as an everyday meal replaces it on those days), "group" (optional: meals sharing a group are pick-one options, e.g. three dinner options share "dinner"), "items": [{ "name", "grams", "kcal", "p", "c", "f" }] }.
  Ingredient names should say raw or dry weight where it matters (e.g. "Chicken breast, raw weight", "Rice, dry weight"). Work out kcal, protein, carbs and fat for each ingredient from standard nutrition values for that weight. Round to whole numbers, except protein, carbs and fat can use one decimal. kcal should roughly equal 4*p + 4*c + 9*f.
- "supplements": full list. Each: { "id", "name", "dose", "timing" (e.g. "With breakfast", "Post-workout", "Before bed"), "note" }.

Rules:
- Only change what the call actually covered. Keep everything else exactly as it is, including ids.
- If the call did not change meals, return "meals": null. Same for "supplements". For phase, coach_note, step_goal and water_goal, return null to leave them unchanged.
- When you change a meal, return the whole meals list with the change applied. New meals and supplements get a new short id.
- If the coach said they will send the plan later, or nothing concrete was agreed, leave the plan unchanged.

Return ONLY a JSON object of this shape (no code fences):
{
  "title": short call title like "Week 4 check-in",
  ${SUMMARY_SHAPE},
  "plan": { "phase", "coach_note", "step_goal", "water_goal", "meals", "supplements" },
  "changes": list of short plain-English lines describing each plan change you made, for the coach to review (e.g. "Dinner: rice 150g -> 100g dry"). Empty list if the plan is unchanged.
}

<transcript>
${transcript}
</transcript>`
}

async function isCoach(token: string) {
  const url = Netlify.env.get('VITE_SUPABASE_URL'), service = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !service || !token) return false
  const u = await fetch(`${url}/auth/v1/user`, { headers: { apikey: service, authorization: `Bearer ${token}` } })
  if (!u.ok) return false
  const { id } = await u.json()
  const p = await fetch(`${url}/rest/v1/profiles?id=eq.${id}&select=role`, { headers: { apikey: service } })
  if (!p.ok) return false
  const rows = await p.json()
  return rows?.[0]?.role === 'coach'
}

export default async (req: Request) => {
  if (req.method !== 'POST') return json(405, { error: 'Use POST' })
  const key = Netlify.env.get('ANTHROPIC_API_KEY')
  if (!key) return json(500, { error: 'Add ANTHROPIC_API_KEY in Netlify to turn on AI for calls' })
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '')
  if (!(await isCoach(token))) return json(403, { error: 'Sign in as the coach again' })

  const { mode, transcript, clientName, plan } = await req.json()
  if (typeof transcript !== 'string' || transcript.trim().length < 50) return json(400, { error: 'Add the full transcript first' })
  const text = transcript.slice(0, 200000)
  const prompt = mode === 'process' ? processPrompt(text, clientName || '', plan ?? {}) : summaryPrompt(text, clientName || '')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: Netlify.env.get('ANTHROPIC_MODEL') || 'claude-sonnet-5-5',
      max_tokens: mode === 'process' ? 16000 : 2000,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({}))
    return json(502, { error: err?.error?.message || 'The AI service failed, try again' })
  }
  // Pass the stream straight through; the browser assembles the text.
  return new Response(res.body, { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' } })
}

export const config = { path: '/api/ai-call' }
