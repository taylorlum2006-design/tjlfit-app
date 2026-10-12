import { useEffect, useRef, useState } from 'react'
import { api } from '../../data'
import { emptyPlan } from '../../data/api'
import { useClient } from '../../state'
import { Card, CardTitle, Field, useToast } from '../../components/ui'
import SummaryView from '../../components/SummaryView'
import { applyPlan, type ProcessResult } from '../../lib/ai'
import type { Plan } from '../../types'

/** Strips timestamps and cue numbers from .vtt / .srt exports so only the words are sent. */
function cleanTranscript(raw: string) {
  return raw
    .replace(/^WEBVTT.*$/m, '')
    .split('\n')
    .filter(l => !/^\d+$/.test(l.trim()) && !/-->/.test(l))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export default function ImportCall({ onDone }: { onDone: () => void }) {
  const { profile, plan, reload } = useClient()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [transcript, setTranscript] = useState('')
  const [fileName, setFileName] = useState('')
  const [recording, setRecording] = useState('')
  const [updatePlan, setUpdatePlan] = useState(true)
  const [share, setShare] = useState(true)
  const [busy, setBusy] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [result, setResult] = useState<{ r: ProcessResult; before: Plan | null; planUpdated: boolean } | null>(null)

  useEffect(() => {
    if (!busy) return
    setSeconds(0)
    const t = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [busy])

  async function pickFile(f: File) {
    setFileName(f.name)
    setTranscript(cleanTranscript(await f.text()))
  }

  async function run() {
    if (transcript.trim().length < 50) return toast('Add the transcript first')
    setBusy(true)
    try {
      const current = plan ?? emptyPlan(profile.id)
      const r = await api.processCall(transcript, profile.name, current)
      const changed = r.changes.length > 0 || Object.values(r.plan).some(v => v != null)
      let planUpdated = false
      if (updatePlan && changed) { await api.savePlan(applyPlan(current, r.plan)); await reload(); planUpdated = true }
      const id = crypto.randomUUID()
      await api.saveCall({ id, client_id: profile.id, title: r.title, scheduled_at: new Date().toISOString(), meeting_link: '', recording_link: recording.trim(), summary: share ? r.summary : null, client_visible: true })
      await api.saveCallPrivate({ call_id: id, client_id: profile.id, transcript, notes: '', summary_draft: r.summary })
      setResult({ r, before: current, planUpdated })
      setTranscript(''); setFileName(''); setRecording('')
      onDone()
    } catch (e: any) { toast(e.message) } finally { setBusy(false) }
  }

  async function undo() {
    if (!result?.before) return
    await api.savePlan(result.before); await reload()
    setResult({ ...result, planUpdated: false })
    toast('Plan changes undone')
  }

  if (result) {
    const { r, planUpdated } = result
    return (
      <Card className="border-gold/40">
        <CardTitle>Done: {r.title}</CardTitle>
        <p className="label mb-2">{planUpdated ? 'Plan changes made' : 'Plan'}</p>
        {r.changes.length ? (
          <ul className="space-y-1.5 mb-4">{r.changes.map((c, i) => <li key={i} className="flex gap-2.5 text-[15px]"><span className="text-gold">•</span><span className={planUpdated ? '' : 'line-through text-mute'}>{c}</span></li>)}</ul>
        ) : <p className="text-sm text-mute mb-4">Nothing in the plan needed changing.</p>}
        {planUpdated && <p className="text-xs text-mute mb-4">Check the numbers in the Plan tab. Macros are worked out by the AI from standard values, so glance over anything that looks off.</p>}
        <div className="rounded-xl border border-line p-4"><p className="label mb-3">Recap {share ? '(shared with client)' : '(coach only)'}</p><SummaryView s={r.summary} /></div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button className="btn" onClick={() => setResult(null)}>Done</button>
          {planUpdated ? <button className="btn-ghost" onClick={undo}>Undo plan changes</button> : <span />}
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardTitle>New call from Fathom</CardTitle>
      <div className="space-y-4">
        <button type="button" onClick={() => fileRef.current?.click()} className="w-full rounded-xl border border-dashed border-line bg-raised py-6 text-center">
          {fileName ? <><p className="font-semibold">{fileName}</p><p className="text-sm text-mute">Tap to choose a different file</p></> : <><p className="text-gold font-semibold">Upload transcript</p><p className="text-sm text-mute">.txt, .vtt or .srt from Fathom or Granola</p></>}
        </button>
        <input ref={fileRef} type="file" accept=".txt,.vtt,.srt,.md,text/plain" className="hidden" onChange={e => e.target.files?.[0] && pickFile(e.target.files[0])} />
        <Field label="Or paste it" hint="In Fathom: open the call, Transcript, Copy.">
          <textarea className="input min-h-[110px] text-sm" value={transcript} onChange={e => { setTranscript(e.target.value); setFileName('') }} placeholder="Paste the full transcript" />
        </Field>
        <Field label="Recording link (optional)"><input className="input" value={recording} onChange={e => setRecording(e.target.value)} placeholder="Fathom share link" /></Field>
        <div className="space-y-2">
          {[[updatePlan, setUpdatePlan, 'Update their plan from the call', 'Meals, macros, supplements, step and water targets, coach note'], [share, setShare, 'Share the recap with them', 'Shows on their Calls page']].map(([v, set, label, sub]) => (
            <button key={label as string} type="button" onClick={() => (set as (b: boolean) => void)(!(v as boolean))} className="w-full flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-left" aria-pressed={v as boolean}>
              <span className={`h-6 w-6 shrink-0 rounded-md border-2 flex items-center justify-center ${v ? 'bg-gold border-gold text-black' : 'border-line'}`}>{v ? '✓' : ''}</span>
              <span><span className="block text-sm font-medium">{label as string}</span><span className="block text-xs text-mute">{sub as string}</span></span>
            </button>
          ))}
        </div>
        <button className="btn" disabled={busy || transcript.trim().length < 50} onClick={run}>
          {busy ? `Reading the call… ${seconds}s` : 'Process call'}
        </button>
        {busy && <p className="text-xs text-mute text-center">Usually 30 to 90 seconds. Keep this page open.</p>}
      </div>
    </Card>
  )
}
