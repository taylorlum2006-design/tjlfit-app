import { useEffect, useRef, useState } from 'react'
import { api } from '../data'
import { useClient } from '../state'
import { Card, CardTitle, Empty, PageTitle, useToast } from '../components/ui'
import { compressImage } from '../lib/image'
import { longDate } from '../lib/dates'
import type { Photo } from '../types'
import { IconPlus } from '../components/icons'

const ANGLES: Photo['angle'][] = ['front', 'side', 'back']

export default function Photos() {
  const { profile, today, readOnly, plan } = useClient()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [files, setFiles] = useState<Partial<Record<Photo['angle'], File>>>({})
  const [date, setDate] = useState(today)
  const [busy, setBusy] = useState(false)
  const [compare, setCompare] = useState<[string, string] | null>(null)
  const toast = useToast()
  const load = () => api.listPhotos(profile.id).then(setPhotos)
  useEffect(() => { load() }, [profile.id]) // eslint-disable-line

  if (plan?.photos_enabled === false) return <><PageTitle>Photos</PageTitle><Empty>Progress photos are turned off for your plan.</Empty></>

  const dates = [...new Set(photos.map(p => p.date))]
  const ready = Object.keys(files).length > 0

  async function upload() {
    setBusy(true)
    try {
      for (const a of ANGLES) { const f = files[a]; if (f) await api.uploadPhoto(profile.id, date, a, await compressImage(f)) }
      setFiles({}); await load(); toast('Photos uploaded')
    } catch (e: any) { toast(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      <PageTitle>Photos</PageTitle>
      {!readOnly && (
        <Card>
          <CardTitle>New photo check-in</CardTitle>
          <div className="grid grid-cols-3 gap-2">
            {ANGLES.map(a => <Slot key={a} angle={a} file={files[a]} onPick={f => setFiles(x => ({ ...x, [a]: f }))} />)}
          </div>
          <p className="text-sm text-mute mt-4 leading-relaxed">Same spot, same lighting, same time of day (morning, before food). It's the only way the comparison is honest.</p>
          <label className="block mt-4"><span className="label block mb-2">Date taken</span><input type="date" className="input" value={date} max={today} onChange={e => setDate(e.target.value)} /></label>
          <button className="btn mt-4" disabled={!ready || busy} onClick={upload}>{busy ? 'Uploading…' : 'Upload photos'}</button>
        </Card>
      )}

      {dates.length >= 2 && (
        <Card>
          <CardTitle>Compare</CardTitle>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1].map(i => (
              <select key={i} className="input" value={(compare ?? [dates[dates.length - 1], dates[0]])[i]}
                onChange={e => { const c = [...(compare ?? [dates[dates.length - 1], dates[0]])] as [string, string]; c[i] = e.target.value; setCompare(c) }}>
                {dates.map(d => <option key={d} value={d}>{longDate(d)}</option>)}
              </select>
            ))}
          </div>
          {ANGLES.map(a => {
            const [d1, d2] = compare ?? [dates[dates.length - 1], dates[0]]
            const p1 = photos.find(p => p.date === d1 && p.angle === a), p2 = photos.find(p => p.date === d2 && p.angle === a)
            if (!p1 && !p2) return null
            return (
              <div key={a} className="mt-4">
                <p className="label capitalize mb-2">{a}</p>
                <div className="grid grid-cols-2 gap-2">{[p1, p2].map((p, k) => p ? <img key={k} src={p.url} alt="" className="rounded-xl aspect-[3/4] object-cover w-full" /> : <div key={k} className="rounded-xl aspect-[3/4] bg-raised" />)}</div>
              </div>
            )
          })}
        </Card>
      )}

      <Card>
        <CardTitle>History</CardTitle>
        {!dates.length ? <Empty>No photos yet. Front, side and back, once a week.</Empty> : dates.map(d => (
          <div key={d} className="mb-5 last:mb-0">
            <p className="text-sm text-mute mb-2">{longDate(d)}</p>
            <div className="grid grid-cols-3 gap-2">
              {ANGLES.map(a => { const p = photos.find(x => x.date === d && x.angle === a); return p ? <a key={a} href={p.url} target="_blank" rel="noreferrer"><img src={p.url} alt={`${a} ${d}`} className="rounded-xl aspect-[3/4] object-cover w-full" /></a> : <div key={a} className="rounded-xl aspect-[3/4] bg-raised" /> })}
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}

function Slot({ angle, file, onPick }: { angle: string; file?: File; onPick: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState<string>()
  useEffect(() => { if (!file) { setUrl(undefined); return } const u = URL.createObjectURL(file); setUrl(u); return () => URL.revokeObjectURL(u) }, [file])
  return (
    <button type="button" onClick={() => ref.current?.click()} className="relative rounded-xl border border-dashed border-line bg-raised aspect-[3/4] overflow-hidden flex flex-col items-center justify-center text-mute">
      {url ? <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <><span className="text-gold"><IconPlus /></span><span className="text-xs mt-1">Add</span></>}
      <span className="absolute bottom-0 inset-x-0 bg-black/80 py-1.5 text-xs font-semibold text-bone capitalize">{angle}</span>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onPick(e.target.files[0])} />
    </button>
  )
}
