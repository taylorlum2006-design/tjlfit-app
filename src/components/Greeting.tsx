import { useState } from 'react'
import { brand } from '../brand'
import { useClient } from '../state'
import Constellation from './Constellation'

function partOfDay(tz: string) {
  let h = new Date().getHours()
  try { h = +new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).format(new Date()) } catch {}
  return h < 5 ? 'Up early' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

const KEY = (id: string) => `tjl-greeted-${id}`

/** Full-screen welcome, shown the first time the client opens the app each day. */
export default function Greeting() {
  const { profile, today, todayRow, plan } = useClient()
  const [show, setShow] = useState(() => { try { return localStorage.getItem(KEY(profile.id)) !== today } catch { return true } })
  const [leaving, setLeaving] = useState(false)
  if (!show) return null

  const name = profile.name.split(' ')[0]
  const close = () => {
    try { localStorage.setItem(KEY(profile.id), today) } catch {}
    setLeaving(true); setTimeout(() => setShow(false), 350)
  }
  const todo = [
    !todayRow.submitted && 'Log your morning check-in',
    plan?.step_goal && `Hit ${plan.step_goal.toLocaleString()} steps`,
    plan?.water_goal && `Drink ${plan.water_goal} L of water`,
  ].filter(Boolean) as string[]

  return (
    <div onClick={close} className={`fixed inset-0 z-50 bg-ink overflow-hidden flex flex-col px-7 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),2rem)] transition-opacity duration-300 ${leaving ? 'opacity-0' : 'opacity-100'}`}>
      <Constellation seed={23} />
      <img src={brand.logo} alt="" className="relative w-12 logo-in" />
      <div className="relative mt-auto logo-in">
        <h1 className="h-display text-[68px] glow">{partOfDay(profile.timezone)}{name ? ',' : '.'}</h1>
        {name && <h1 className="h-display text-[68px] glow">{name}.</h1>}
        <p className="mt-3 text-[38px] leading-[1.05] em">ready to kill it today?</p>
        {todo.length > 0 && (
          <ul className="mt-8 space-y-2.5">
            {todo.map(t => <li key={t} className="flex items-center gap-3 text-mute"><span className="h-1.5 w-1.5 rounded-full bg-gold" />{t}</li>)}
          </ul>
        )}
      </div>
      <button className="relative btn mt-10" onClick={e => { e.stopPropagation(); close() }}>Let's go</button>
    </div>
  )
}
