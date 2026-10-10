import { NavLink, Outlet } from 'react-router-dom'
import { brand } from '../brand'
import { useClient } from '../state'
import { IconChart, IconCheck, IconFood, IconHome, IconMore } from './icons'

const tabs = [
  { to: '/', label: 'Home', icon: IconHome, end: true },
  { to: '/checkin', label: 'Check-in', icon: IconCheck },
  { to: '/nutrition', label: 'Nutrition', icon: IconFood },
  { to: '/progress', label: 'Progress', icon: IconChart },
  { to: '/more', label: 'More', icon: IconMore },
]

export default function ClientLayout() {
  const { profile } = useClient()
  return (
    <div className="min-h-screen max-w-[560px] mx-auto">
      <header className="sticky top-0 z-20 bg-ink/85 backdrop-blur border-b border-line/60 px-5 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 flex items-center justify-between">
        <img src={brand.logo} alt={brand.appName} className="h-8" />
        <span className="text-sm text-mute">{profile.name.split(' ')[0] || 'Your plan'}</span>
      </header>
      <main className="px-4 pt-4 pb-32"><Outlet /></main>
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-ink/95 backdrop-blur border-t border-line pb-safe">
        <ul className="max-w-[560px] mx-auto grid grid-cols-5">
          {tabs.map(t => (
            <li key={t.to}>
              <NavLink to={t.to} end={t.end} className={({ isActive }) => `flex flex-col items-center gap-1 pt-3 pb-1 text-[11px] font-medium ${isActive ? 'text-gold' : 'text-mute'}`}>
                <t.icon />{t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
