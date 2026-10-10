import type { CallSummary } from '../types'

const SECTIONS: [keyof CallSummary, string][] = [['decisions', 'Decisions'], ['wins', 'Wins'], ['concerns', 'Concerns'], ['action_items', 'Your action items']]

export default function SummaryView({ s }: { s: CallSummary }) {
  return (
    <div className="space-y-4">
      {s.summary && <p className="leading-relaxed">{s.summary}</p>}
      {SECTIONS.map(([k, label]) => {
        const items = s[k] as string[]
        if (!items?.length) return null
        return (
          <div key={k}>
            <p className="label mb-1.5">{label}</p>
            <ul className="space-y-1.5">{items.map((t, i) => <li key={i} className="flex gap-2.5 text-[15px]"><span className="text-gold mt-0.5">•</span><span>{t}</span></li>)}</ul>
          </div>
        )
      })}
    </div>
  )
}
