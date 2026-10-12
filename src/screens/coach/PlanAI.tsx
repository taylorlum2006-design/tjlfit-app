import { useEffect, useRef, useState } from 'react'
import { api } from '../../data'
import { emptyPlan } from '../../data/api'
import { useClient } from '../../state'
import { Card, CardTitle, useToast } from '../../components/ui'
import { applyPlan, cleanTranscript } from '../../lib/ai'
import type { Plan } from '../../types'

const EXAMPLES = [
  'Cut. 2,400 kcal, 190 g protein, 70 g fat, rest carbs. 4 meals. Trains at 6am so carbs around training. Likes chicken, rice, eggs, oats. No dairy.',
  'Swap dinner rice for potatoes, same carbs.',
  'Drop carbs by 30 g, take it from the evening meals.',
]

/** Tell the AI what you want; it builds or edits the plan and saves it. */
export default function PlanAI() {
  const { profile, plan, reload } = useClient()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [transcript, setTranscript] = useState('')
  const [fileName, setFileName] = useState('')
  const [busy, setBusy] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [done, setDone] = useState<{ changes: string[]; before: Plan } | null>(null)

  useEffect(() => {
    if (!busy) return
    setSeconds(0)
    const t = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [busy])

  async function run() {
    if (!text.trim()) return toast('Tell it what you want first')
    setBusy(true)
    try {
      const before = plan ?? emptyPlan(profile.id)
      const r = await api.buildPlan(text.trim(), transcript, profile.name, before)
      await api.savePlan(applyPlan(before, r.plan))
      await reload()
      setDone({ changes: r.changes, before }); setText('')
    } catch (e: any) { toast(e.message) } finally { setBusy(false) }
  }

  async function undo() {
    if (!done) return
    await api.savePlan(done.before); await reload()
    setDone(null); toast('Changes undone')
  }

  return (
    <Card className="border-gold/40 mb-4">
      <CardTitle>Build with AI</CardTitle>
      {done && (
        <div className="rounded-xl bg-raised p-4 mb-4">
          <p className="font-semibold mb-2">Saved. The client sees it now.</p>
          <ul className="space-y-1.5">{done.changes.map((c, i) => <li key={i} className="flex gap-2.5 text-sm"><span className="text-gold">•</span><span>{c}</span></li>)}</ul>
          <div className="flex gap-4 mt-3">
            <button className="text-sm text-gold" onClick={undo}>Undo</button>
            <button className="text-sm text-mute" onClick={() => setDone(null)}>Hide</button>
          </div>
        </div>
      )}
      <textarea className="input min-h-[120px]" value={text} onChange={e => setText(e.target.value)} disabled={busy}
        placeholder="Tell it what you want. A whole plan, or one change." />
      <div className="flex flex-wrap gap-1.5 mt-2">
        {EXAMPLES.map(e => <button key={e} type="button" disabled={busy} onClick={() => setText(e)} className="rounded-full border border-line px-3 py-1.5 text-xs text-mute text-left">{e.length > 46 ? e.slice(0, 46) + '…' : e}</button>)}
      </div>
      <button type="button" disabled={busy} onClick={() => (transcript ? (setTranscript(''), setFileName('')) : fileRef.current?.click())} className="mt-3 text-sm text-gold">
        {transcript ? `Using ${fileName || 'call transcript'} for context. Remove` : '+ Add their onboarding call transcript (optional)'}
      </button>
      <input ref={fileRef} type="file" accept=".txt,.vtt,.srt,.md,text/plain" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) { setFileName(f.name); setTranscript(cleanTranscript(await f.text())) } e.target.value = '' }} />
      <button className="btn mt-4" disabled={busy || !text.trim()} onClick={run}>{busy ? `Building… ${seconds}s` : 'Build it'}</button>
      {busy && <p className="text-xs text-mute text-center mt-2">A full plan takes 30 to 90 seconds. Keep this page open.</p>}
      {!busy && <p className="text-xs text-mute mt-3">Saves straight to their plan. Macros come from standard nutrition values, so give the numbers below a quick look.</p>}
    </Card>
  )
}
