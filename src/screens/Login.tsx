import { useState } from 'react'
import { api } from '../data'
import { brand } from '../brand'
import Constellation from '../components/Constellation'

// Clients see this once, the first time they open the app on a device.
// After that they stay signed in and go straight to their plan.
export default function Login() {
  const isCoach = location.pathname.startsWith('/coach')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function sendCode(e: React.FormEvent) {
    e.preventDefault(); setError(''); setBusy(true)
    try { await api.signIn(email.trim()); setStep('code') } catch (err: any) { setError(err.message) } finally { setBusy(false) }
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault(); setError(''); setBusy(true)
    try { await api.verifyCode(email.trim(), code) } catch (err: any) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col px-6 pt-[max(env(safe-area-inset-top),2rem)] pb-10">
      <Constellation seed={11} />
      <img src={brand.logo} alt={brand.appName} className="relative w-14 logo-in" />
      <div className="relative mt-auto mb-10">
        <h1 className="h-display text-[64px] glow">{isCoach ? 'Coach.' : 'Welcome.'}</h1>
        {!isCoach && <p className="mt-1 text-[40px] leading-none em">let's get to work.</p>}
        <p className="mt-5 text-mute max-w-xs">{isCoach ? 'Sign in to manage your clients.' : `Sign in once with the email ${brand.coachName} invited. After that the app opens straight to your plan.`}</p>
      </div>

      <div className="relative">
        {step === 'email' ? (
          <form onSubmit={sendCode} className="space-y-3">
            <input className="input" type="email" required autoComplete="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} />
            {error && <p className="text-sm text-danger">{error}</p>}
            <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send my code'}</button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-3">
            <p className="text-sm text-mute">We emailed a 6-digit code to <span className="text-bone">{email}</span>. Enter it here. You can also tap the link in that email.</p>
            <input className="input text-center text-2xl tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required placeholder="000000" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} />
            {error && <p className="text-sm text-danger">{error}</p>}
            <button className="btn" disabled={busy || code.length < 6}>{busy ? 'Checking…' : 'Sign in'}</button>
            <button type="button" className="text-sm text-mute w-full py-2" onClick={() => { setStep('email'); setCode(''); setError('') }}>Use a different email</button>
          </form>
        )}
      </div>
    </div>
  )
}
