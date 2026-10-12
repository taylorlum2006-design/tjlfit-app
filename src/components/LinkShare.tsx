import { useState } from 'react'
import { brand } from '../brand'
import { copyText } from '../lib/link'

/** Shows a client's personal link with one-tap copy of a ready-to-send message. */
export default function LinkShare({ name, link, onDone }: { name: string; link: string; onDone?: () => void }) {
  const [copied, setCopied] = useState<'msg' | 'link' | null>(null)
  const first = name.split(' ')[0] || 'there'
  const message = `Hey ${first}, your TJL Fit app is ready. Tap this link to open your plan:\n\n${link}\n\nOn iPhone: once it opens in Safari, tap the Share button, then "Add to Home Screen". On Android: tap the menu, then "Install app". Open it from your home screen every day from now on.\n\nThis link is just for you, don't share it.\n\n${brand.coachName}`
  const copy = async (what: 'msg' | 'link') => { if (await copyText(what === 'msg' ? message : link)) { setCopied(what); setTimeout(() => setCopied(null), 1800) } }
  return (
    <div className="rounded-xl border border-gold/40 bg-gold/5 p-4 space-y-3">
      <p className="font-semibold">{name}'s personal link</p>
      <p className="text-sm text-mute break-all select-all">{link}</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn" onClick={() => copy('msg')}>{copied === 'msg' ? 'Copied' : 'Copy message'}</button>
        <button type="button" className="btn-ghost" onClick={() => copy('link')}>{copied === 'link' ? 'Copied' : 'Copy link only'}</button>
      </div>
      <p className="text-xs text-mute">Send it by WhatsApp, Instagram or text. Anyone with this link can open their plan, so send it only to them.</p>
      {onDone && <button type="button" className="text-sm text-mute" onClick={onDone}>Done</button>}
    </div>
  )
}
