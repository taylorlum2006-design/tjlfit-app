import { useEffect, useState } from 'react'
import { api } from '../../data'
import { emptySummary } from '../../data/api'
import { useClient } from '../../state'
import { Badge, Card, Empty, Field, Spinner, useToast } from '../../components/ui'
import { callTime, isUpcoming, toLocalInput } from '../../lib/calls'
import type { Call, CallPrivate, CallSummary } from '../../types'

const LISTS: [keyof CallSummary, string][] = [['decisions', 'Decisions'], ['wins', 'Wins'], ['concerns', 'Concerns'], ['action_items', 'Action items']]
const lines = (s: string) => s.split('\n').map(x => x.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)

// Keeps the raw text while typing (so Enter works), and passes clean lines up.
function ListField({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [raw, setRaw] = useState(value.join('\n'))
  return (
    <Field label={`${label}, one per line`}>
      <textarea className="input min-h-[80px] text-sm" value={raw} onChange={e => { setRaw(e.target.value); onChange(lines(e.target.value)) }} />
    </Field>
  )
}

export default function CoachCalls() {
  const { profile } = useClient()
  const [calls, setCalls] = useState<Call[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const load = () => api.listCalls(profile.id).then(setCalls)
  useEffect(() => { load() }, [profile.id]) // eslint-disable-line

  async function addCall() {
    const c: Call = { id: crypto.randomUUID(), client_id: profile.id, title: 'Check-in call', scheduled_at: new Date().toISOString(), meeting_link: '', recording_link: '', summary: null, client_visible: true }
    await api.saveCall(c); await load(); setOpenId(c.id)
  }

  if (!calls) return <Spinner />
  return (
    <div className="space-y-3">
      <button className="btn" onClick={addCall}>Add a call</button>
      <p className="text-xs text-mute">Add upcoming calls with the meeting link, or past calls with the recording link and a recap.</p>
      {!calls.length && <Card><Empty>No calls yet.</Empty></Card>}
      {calls.map(c => <CallItem key={c.id} call={c} open={openId === c.id} onToggle={() => setOpenId(openId === c.id ? null : c.id)} onChange={load} />)}
    </div>
  )
}

function CallItem({ call, open, onToggle, onChange }: { call: Call; open: boolean; onToggle: () => void; onChange: () => void }) {
  const { profile } = useClient()
  const toast = useToast()
  const [c, setC] = useState(call)
  const [priv, setPriv] = useState<CallPrivate | null>(null)
  const [draft, setDraft] = useState<CallSummary>(call.summary ?? emptySummary())
  const [busy, setBusy] = useState('')
  const [version, setVersion] = useState(0) // bumps when the summary is replaced, to refresh the list boxes
  const [, setDirty] = useState(false)

  useEffect(() => {
    if (!open || priv) return
    api.getCallPrivate(call.id).then(p => {
      const row = p ?? { call_id: call.id, client_id: call.client_id, transcript: '', notes: '', summary_draft: null }
      setPriv(row)
      if (row.summary_draft && !call.summary) { setDraft(row.summary_draft); setVersion(v => v + 1) }
    })
  }, [open]) // eslint-disable-line

  const upC = (patch: Partial<Call>) => { setC(x => ({ ...x, ...patch })); setDirty(true) }
  const upP = (patch: Partial<CallPrivate>) => { setPriv(x => ({ ...x!, ...patch })); setDirty(true) }
  const upD = (patch: Partial<CallSummary>) => { setDraft(x => ({ ...x, ...patch })); setDirty(true) }
  const shared = !!c.summary

  async function save(share?: boolean) {
    setBusy('save')
    try {
      const sharing = share ?? shared
      await api.saveCall({ ...c, summary: sharing ? draft : null })
      if (priv) await api.saveCallPrivate({ ...priv, summary_draft: draft })
      setC(x => ({ ...x, summary: sharing ? draft : null })); setDirty(false); onChange()
      toast(share === true ? 'Summary shared with client' : share === false ? 'Summary hidden from client' : 'Call saved')
    } catch (e: any) { toast(e.message) } finally { setBusy('') }
  }

  async function summarize() {
    if (!priv?.transcript.trim()) return toast('Paste the transcript first')
    setBusy('ai')
    try { const s = await api.summarize(priv.transcript, profile.name); setDraft(s); setVersion(v => v + 1); setDirty(true); toast('Summary ready. Review it, then save.') }
    catch (e: any) { toast(e.message) } finally { setBusy('') }
  }

  async function remove() {
    if (!confirm('Delete this call, its transcript and notes?')) return
    await api.deleteCall(call.id); onChange()
  }

  return (
    <Card className="p-0">
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left" aria-expanded={open}>
        <div className="min-w-0">
          <p className="font-semibold truncate">{c.title || 'Untitled call'}</p>
          <p className="text-sm text-mute">{callTime(c.scheduled_at)}</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {isUpcoming(c) ? <Badge>Upcoming</Badge> : shared ? <Badge>Summary shared</Badge> : <Badge tone="mute">Not shared</Badge>}
          {!c.client_visible && <Badge tone="mute">Hidden</Badge>}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-line pt-4">
          {!priv ? <Spinner /> : (<>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Title"><input className="input" value={c.title} onChange={e => upC({ title: e.target.value })} /></Field>
              <Field label="Date and time"><input type="datetime-local" className="input" value={toLocalInput(c.scheduled_at)} onChange={e => e.target.value && upC({ scheduled_at: new Date(e.target.value).toISOString() })} /></Field>
              <Field label="Meeting link"><input className="input" placeholder="Zoom or Google Meet link" value={c.meeting_link} onChange={e => upC({ meeting_link: e.target.value.trim() })} /></Field>
              <Field label="Recording link"><input className="input" placeholder="Fathom or Granola share link" value={c.recording_link} onChange={e => upC({ recording_link: e.target.value.trim() })} /></Field>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
              <div><p className="text-sm font-medium">Show this call to the client</p><p className="text-xs text-mute">Title, time, meeting and recording links</p></div>
              <button type="button" onClick={() => upC({ client_visible: !c.client_visible })} className={`relative h-7 w-12 rounded-full transition ${c.client_visible ? 'bg-gold' : 'bg-raised border border-line'}`} aria-pressed={c.client_visible} aria-label="Show this call to the client">
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-black transition-all ${c.client_visible ? 'left-6' : 'left-1 bg-mute'}`} />
              </button>
            </div>

            <Field label="Transcript (coach only)" hint="In Fathom: open the call, Transcript, Copy. Paste it here. Clients never see this.">
              <textarea className="input min-h-[140px] text-sm font-mono" value={priv.transcript} onChange={e => upP({ transcript: e.target.value })} placeholder="Paste the full transcript" />
            </Field>
            <button className="btn-ghost w-full" disabled={busy === 'ai'} onClick={summarize}>{busy === 'ai' ? 'Summarizing… (about 20 seconds)' : 'Summarize with AI'}</button>

            <div className="rounded-xl border border-line p-4 space-y-4">
              <p className="font-semibold">Summary</p>
              <Field label="Main summary"><textarea key={version} className="input min-h-[90px]" value={draft.summary} onChange={e => upD({ summary: e.target.value })} /></Field>
              {LISTS.map(([k, label]) => (
                <ListField key={`${k}-${version}`} label={label} value={draft[k] as string[]} onChange={v => upD({ [k]: v } as any)} />
              ))}
            </div>

            <Field label="Private notes (coach only)"><textarea className="input min-h-[80px]" value={priv.notes} onChange={e => upP({ notes: e.target.value })} placeholder="Only you see this" /></Field>

            <div className="grid grid-cols-2 gap-2">
              <button className="btn" disabled={busy === 'save'} onClick={() => save(true)}>{shared ? 'Update shared summary' : 'Save and share summary'}</button>
              <button className="btn-ghost" disabled={busy === 'save'} onClick={() => save(false)}>{shared ? 'Stop sharing' : 'Save, keep private'}</button>
            </div>
            <button className="text-sm text-danger w-full pt-1" onClick={remove}>Delete call</button>
          </>)}
        </div>
      )}
    </Card>
  )
}
