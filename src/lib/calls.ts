export function callTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
export const isUpcoming = (iso: string) => new Date(iso).getTime() > Date.now() - 60 * 60 * 1000
export function toLocalInput(iso: string) {
  const d = new Date(iso); const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
export const fileSize = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`)

/**
 * Open a stored file in a new tab. Browsers block opening `data:` links directly
 * (what preview mode stores), so those are turned into a blob link first.
 * The tab is opened right away so the browser treats it as a tap, not a popup.
 */
export async function openFile(url: string) {
  if (!url.startsWith('data:')) { window.open(url, '_blank', 'noopener'); return }
  const w = window.open('', '_blank')
  const blob = await (await fetch(url)).blob()
  const href = URL.createObjectURL(blob)
  if (w) w.location.href = href
  else window.location.href = href
  setTimeout(() => URL.revokeObjectURL(href), 60_000)
}
