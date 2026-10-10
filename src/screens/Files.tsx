import { useEffect, useState } from 'react'
import { api } from '../data'
import { useClient } from '../state'
import { Card, Empty, PageTitle, Spinner } from '../components/ui'
import { fileSize } from '../lib/calls'
import type { Doc } from '../types'

export default function Files() {
  const { profile } = useClient()
  const [docs, setDocs] = useState<Doc[] | null>(null)
  useEffect(() => { api.listDocs(profile.id).then(d => setDocs(d.filter(x => x.client_visible))) }, [profile.id])
  if (!docs) return <Spinner />
  return (
    <div className="space-y-4">
      <PageTitle sub="Plans and guides from your coach">Files</PageTitle>
      {!docs.length ? <Card><Empty>No files yet.</Empty></Card> : (
        <ul className="card p-0 divide-y divide-line">
          {docs.map(d => (
            <li key={d.id}>
              <a href={d.url} target="_blank" rel="noreferrer" className="flex items-center gap-4 px-5 py-4">
                <span className="h-11 w-9 shrink-0 rounded-md border border-line bg-raised flex items-center justify-center text-[10px] font-bold text-gold">PDF</span>
                <div className="flex-1 min-w-0"><p className="font-semibold truncate">{d.title}</p><p className="text-sm text-mute">{new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {fileSize(d.size)}</p></div>
                <span className="text-sm text-gold">Open</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
