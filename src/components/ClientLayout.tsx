import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { brand } from '../brand'
import { useClient } from '../state'

export default function ClientLayout() {
  const { profile, plan } = useClient()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  const links = [
    { to: '/', label: 'Home', end: true },
    { to: '/checkin', label: 'Check-in' },
    { to: '/nutrition', label: 'Nutrition' },
    { to: '/progress', label: 'Progress' },
    { to: '/goals', label: 'Goals' },
    { to: '/supplements', label: 'Supplements' },
    { to: '/steps', label: 'Steps' },
    ...(plan?.photos_enabled === false ? [] : [{ to: '/photos', label: 'Photos' }]),
    { to: '/calls', label: 'Calls' },
    { to: '/files', label: 'Files' },
    { to: '/me', label: 'Me' },
  ]

  // Close on navigation, outside tap, or Escape
  useEffect(() => { setOpen(false); window.scrollTo(0, 0) }, [location.pathname])
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const current = links.find(l => (l.end ? location.pathname === l.to : location.pathname.startsWith(l.to)))

  return (
    <div className="min-h-screen max-w-[560px] mx-auto">
      <header className="sticky top-0 z-30 bg-ink/85 backdrop-blur border-b border-line/60 px-5 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 flex items-center justify-between">
        <NavLink to="/" aria-label="Home"><img src={brand.logo} alt={brand.appName} className="h-8" /></NavLink>
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            aria-haspopup="menu"
            className="flex items-center gap-2.5 rounded-full border border-line bg-surface pl-4 pr-3 py-2 text-sm font-medium"
          >
            <span>{current?.label ?? 'Menu'}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
          {open && (
            <nav role="menu" className="absolute right-0 mt-2 w-56 max-h-[75vh] overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-[0_20px_50px_rgba(0,0,0,.8)]">
              {links.map(l => (
                <NavLink key={l.to} to={l.to} end={l.end} role="menuitem"
                  className={({ isActive }) => `flex items-center justify-between rounded-xl px-4 py-3 text-[15px] ${isActive ? 'bg-raised text-gold' : 'text-bone hover:bg-raised'}`}>
                  {l.label}
                </NavLink>
              ))}
              <p className="px-4 pt-2 pb-2 text-xs text-mute border-t border-line mt-1">{profile.name || profile.email}</p>
            </nav>
          )}
        </div>
      </header>
      <main className="px-4 pt-4 pb-16"><Outlet /></main>
    </div>
  )
}
