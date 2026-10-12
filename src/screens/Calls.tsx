import { useEffect, useState } from 'react'
import { api } from '../data'
import { brand } from '../brand'
import { useClient } from '../state'
import { Card, CardTitle, Empty, PageTitle, Spinner } from '../components/ui'
import SummaryView from '../components/SummaryView'
import FilesSection from './Files'
import { callTime, isUpcoming } from '../lib/calls'
import type { Call } from '../types'

export default function Calls() {
  const { profile } = useClient()
  const [calls, setCalls] = useState<Call[] | null>(null)
  useEffect(() => { api.listCalls(profile.id).then(c => setCalls(c.filter(x => x.client_visible))) }, [profile.id])
  if (!calls) return <Spinner />
  const upcoming = calls.filter(c => isUpcoming(c)).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
  const past = calls.filter(c => !isUpcoming(c))
  const next = upcoming[0]

  return (
    <div className="space-y-4">
      <PageTitle sub="Your calls, recaps and files from your coach">Calls & files</PageTitle>
      <Card>
        <CardTitle>Next call</CardTitle>
        {next ? (
          <>
            <p className="font-semibold text-lg">{next.title}</p>
            <p className="text-gold mt-1">{callTime(next.scheduled_at)}</p>
            {next.meeting_link && <a href={next.meeting_link} target="_blank" rel="noreferrer" className="btn block text-center mt-4">Join call</a>}
          </>
        ) : <Empty>No call booked yet.</Empty>}
        {brand.bookingLink && <a href={brand.bookingLink} target="_blank" rel="noreferrer" className="btn-ghost block text-center mt-3">Book a call with {brand.coachName}</a>}
      </Card>

      {past.length > 0 && <h2 className="h-display text-3xl pt-4">Past calls</h2>}
      {past.map(c => (
        <Card key={c.id}>
          <div className="flex justify-between gap-3 items-start mb-3">
            <div><p className="font-semibold">{c.title}</p><p className="text-sm text-mute">{callTime(c.scheduled_at)}</p></div>
            {c.recording_link && <a href={c.recording_link} target="_blank" rel="noreferrer" className="text-sm text-gold whitespace-nowrap">Watch recording</a>}
          </div>
          {c.summary ? <SummaryView s={c.summary} /> : <p className="text-sm text-mute">Summary coming soon.</p>}
        </Card>
      ))}
      <FilesSection />
    </div>
  )
}
