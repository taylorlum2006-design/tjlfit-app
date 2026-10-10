import { useState } from 'react'
import { api, demoApi } from '../data'
import { brand } from '../brand'
import Constellation from '../components/Constellation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setBusy(true)
    try { await api.signIn(email.trim()); setSent(true) } catch (err: any) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col px-6 pt-[max(env(safe-area-inset-top),2rem)] pb-10">
      <Constellation seed={11} />
      <img src={brand.logo} alt={brand.appName} className="relative w-14 logo-in" />
      <div className="relative mt-auto mb-10">
        <h1 className="h-display text-[64px] glow">Show up.</h1>
        <p className="mt-1 text-[40px] leading-none em">every day.</p>
        <p className="mt-5 text-mute max-w-xs">Your plan, your check-ins and your progress, in one place with {brand.coachName}.</p>
      </div>

      <div className="relative">
        {api.mode === 'live' ? (
          sent ? (
            <div className="card">
              <p className="font-semibold">Check your email</p>
              <p className="text-mute text-sm mt-1">We sent a login link to {email}. Open it on this device.</p>
              <button className="text-sm text-gold mt-4" onClick={() => setSent(false)}>Use a different email</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <input className="input" type="email" required autoComplete="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} />
              {error && <p className="text-sm text-danger">{error}</p>}
              <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send login link'}</button>
            </form>
          )
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-mute">Preview mode. Sample data lives in this browser only until Supabase is connected.</p>
            <button className="btn" onClick={() => demoApi.signInAs('alex')}>Preview as a client</button>
            <button className="btn-ghost w-full" onClick={() => demoApi.signInAs('coach')}>Preview as the coach</button>
          </div>
        )}
      </div>
    </div>
  )
}
