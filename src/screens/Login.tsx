import { brand } from '../brand'
import { useSession } from '../state'
import Constellation from '../components/Constellation'

// Shown only when someone opens the app without their personal link (or with an old one).
export default function Login() {
  const { linkError } = useSession()
  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col px-6 pt-[max(env(safe-area-inset-top),2rem)] pb-12">
      <Constellation seed={11} />
      <img src={brand.logo} alt={brand.appName} className="relative w-14 logo-in" />
      <div className="relative mt-auto">
        <h1 className="h-display text-[64px] glow">Welcome.</h1>
        <p className="mt-1 text-[40px] leading-none em">let's get to work.</p>
        {linkError
          ? <p className="mt-6 text-danger max-w-xs">{linkError}</p>
          : <p className="mt-6 text-mute max-w-xs">Open the personal link {brand.coachName} sent you to get into your plan.</p>}
      </div>
    </div>
  )
}
