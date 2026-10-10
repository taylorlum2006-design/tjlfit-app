import { brand } from '../brand'
import Constellation from './Constellation'

export default function Splash() {
  return (
    <div className="fixed inset-0 bg-ink flex flex-col items-center justify-center overflow-hidden">
      <Constellation />
      <img src={brand.logo} alt={brand.appName} className="logo-in w-28 drop-shadow-[0_0_24px_rgba(255,255,255,.25)]" />
      <div className="mt-10 h-px w-32 bg-line overflow-hidden"><div className="bar-in h-full w-full bg-gold" /></div>
    </div>
  )
}
