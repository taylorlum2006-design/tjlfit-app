import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>
}

export function CardTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <h2 className="text-[15px] font-semibold text-bone">{children}</h2>
      {right}
    </div>
  )
}

export function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-2 rounded-full bg-raised overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-gold rounded-full transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Badge({ children, tone = 'gold' }: { children: ReactNode; tone?: 'gold' | 'mute' | 'danger' }) {
  const c = tone === 'gold' ? 'text-gold bg-gold/10 border-gold/30' : tone === 'danger' ? 'text-danger bg-danger/10 border-danger/30' : 'text-mute bg-raised border-line'
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${c}`}>{children}</span>
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <header className="mb-6 mt-2">
      <h1 className="h-display text-[44px]">{children}</h1>
      {sub && <p className="mt-2 text-mute">{sub}</p>}
    </header>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label block mb-2">{label}</span>
      {children}
      {hint && <span className="block mt-2 text-xs text-mute/80">{hint}</span>}
    </label>
  )
}

export function Spinner() {
  return <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-2 border-line border-t-gold animate-spin" /></div>
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-mute text-sm py-2">{children}</p>
}

const ToastCtx = createContext<(msg: string) => void>(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)
  const show = useCallback((m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2400) }, [])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div aria-live="polite" className="fixed inset-x-0 bottom-24 flex justify-center pointer-events-none z-50">
        {msg && <div className="rounded-full bg-bone text-black px-4 py-2 text-sm font-medium shadow-lg">{msg}</div>}
      </div>
    </ToastCtx.Provider>
  )
}
