import { useEffect, useRef, useState } from 'react'
import { api } from '../../data'
import { useClient } from '../../state'
import { Badge, Card, CardTitle, Empty, Field, Spinner, useToast } from '../../components/ui'
import { fileSize } from '../../lib/calls'
import type { Doc } from '../../types'

export default function CoachFiles() {
  const { profile } = useClient()
  const [docs, setDocs] = useState<Doc[] | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [visible, setVisible] = useState(true)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const load = () => api.listDocs(profile.id).then(setDocs)
  useEffect(() => { load() }, [profile.id]) // eslint-disable-line

  async function upload() {
    if (!file) return
    setBusy(true)
    try { await api.uploadDoc(profile.id, title.trim() || file.name.replace(/\.[^.]+$/, ''), file, visible); setFile(null); setTitle(''); if (ref.current) ref.current.value = ''; await load(); toast('File uploaded') }
    catch (e: any) { toast(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Upload a file</CardTitle>
        <div className="space-y-4">
          <button type="button" onClick={() => ref.current?.click()} className="w-full rounded-xl border border-dashed border-line bg-raised py-8 text-center">
            {file ? <><p className="font-semibold">{file.name}</p><p className="text-sm text-mute">{fileSize(file.size)}, tap to change</p></> : <><p className="text-gold font-semibold">Choose a PDF</p><p className="text-sm text-mute">Meal plans, programs, guides. Up to 50 MB.</p></>}
          </button>
          <input ref={ref} type="file" accept="application/pdf,image/*,.doc,.docx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, '')) } }} />
          <Field label="Name"><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Meal plan v7" /></Field>
          <div className="grid grid-cols-2 gap-2">
            {[true, false].map(v => <button key={String(v)} type="button" className={`chip ${visible === v ? 'chip-on' : ''}`} onClick={() => setVisible(v)}>{v ? 'Share with client' : 'Coach only'}</button>)}
          </div>
          <button className="btn" disabled={!file || busy} onClick={upload}>{busy ? 'Uploading…' : 'Upload file'}</button>
        </div>
      </Card>

      <Card>
        <CardTitle>Files</CardTitle>
        {!docs ? <Spinner /> : !docs.length ? <Empty>No files yet.</Empty> : (
          <ul className="divide-y divide-line">
            {docs.map(d => (
              <li key={d.id} className="py-3.5 flex items-center gap-3">
                <a href={d.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{d.title}</p>
                  <p className="text-sm text-mute">{new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {fileSize(d.size)}</p>
                </a>
                <button onClick={async () => { await api.updateDoc(d.id, { client_visible: !d.client_visible }); load() }}>{d.client_visible ? <Badge>Shared</Badge> : <Badge tone="mute">Coach only</Badge>}</button>
                <button className="text-mute px-2" aria-label={`Delete ${d.title}`} onClick={async () => { if (confirm(`Delete ${d.title}?`)) { await api.deleteDoc(d); load() } }}>✕</button>
              </li>
            ))}
          </ul>
        )}
        {docs && docs.length > 0 && <p className="text-xs text-mute mt-3">Tap Shared or Coach only to switch who can see a file.</p>}
      </Card>
    </div>
  )
}
