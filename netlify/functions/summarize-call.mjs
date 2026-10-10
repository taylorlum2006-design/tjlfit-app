// Coach-only: turns a call transcript into a structured summary with Claude.
// Needs ANTHROPIC_API_KEY, VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify environment variables.
import { createClient } from '@supabase/supabase-js'

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5'

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Use POST' })
  const { VITE_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: service, ANTHROPIC_API_KEY: key } = process.env
  if (!key) return json(500, { error: 'Add ANTHROPIC_API_KEY in Netlify to turn on summaries' })
  if (!url || !service) return json(500, { error: 'Server is missing Supabase settings' })

  const admin = createClient(url, service, { auth: { persistSession: false } })
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '')
  const { data: who } = await admin.auth.getUser(token)
  if (!who?.user) return json(401, { error: 'Sign in again' })
  const { data: me } = await admin.from('profiles').select('role').eq('id', who.user.id).single()
  if (me?.role !== 'coach') return json(403, { error: 'Only coaches can summarize calls' })

  const { transcript, clientName } = await req.json()
  if (!transcript || transcript.trim().length < 50) return json(400, { error: 'Paste the full transcript first' })

  const prompt = `You are summarizing a fitness coaching call between a coach and their client${clientName ? ` (${clientName})` : ''}.
Write for the client and the coach to read later. Be specific: include numbers, foods, exercises, dates and targets that were agreed. Plain, direct language, no filler, no em dashes.

Return ONLY a JSON object with these keys:
- "summary": 2 to 4 sentences on what the call covered and where the client is at
- "decisions": changes agreed on the call (macros, meals, training, schedule)
- "wins": progress and things going well
- "concerns": problems, blockers or risks raised
- "action_items": concrete things the client should do, each short enough to be a daily checklist item, starting with a verb

Each list is an array of short strings. Use an empty array if nothing fits.

Transcript:
<transcript>
${transcript.slice(0, 180000)}
</transcript>`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
  })
  const out = await res.json().catch(() => ({}))
  if (!res.ok) return json(502, { error: out?.error?.message || 'The summary service failed, try again' })

  const text = (out.content || []).map(c => c.text || '').join('')
  const match = text.match(/\{[\s\S]*\}/)
  try {
    const s = JSON.parse(match ? match[0] : text)
    const list = v => (Array.isArray(v) ? v.map(String).filter(Boolean) : [])
    return json(200, { summary: { summary: String(s.summary || ''), decisions: list(s.decisions), wins: list(s.wins), concerns: list(s.concerns), action_items: list(s.action_items) } })
  } catch {
    return json(502, { error: 'Could not read the summary, try again' })
  }
}
