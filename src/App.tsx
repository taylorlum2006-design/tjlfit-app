import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ClientProvider, SessionProvider, useSession } from './state'
import { ToastProvider } from './components/ui'
import Splash from './components/Splash'
import { basename } from './lib/link'
import Greeting from './components/Greeting'
import ClientLayout from './components/ClientLayout'
import Login from './screens/Login'
import Home from './screens/Home'
import CheckIn from './screens/CheckIn'
import Nutrition from './screens/Nutrition'
import Progress from './screens/Progress'
import Supplements from './screens/Supplements'
import Steps from './screens/Steps'
import Photos from './screens/Photos'
import Me from './screens/Me'
import Calls from './screens/Calls'
import CoachHome from './screens/coach/CoachHome'
import CoachClient from './screens/coach/CoachClient'

function Routed() {
  const { me, loading } = useSession()
  if (loading) return <Splash />
  if (!me) return <Login />
  if (me.role === 'coach') {
    return (
      <Routes>
        <Route path="/coach" element={<CoachHome />} />
        <Route path="/coach/:id" element={<CoachClient />} />
        <Route path="*" element={<Navigate to="/coach" replace />} />
      </Routes>
    )
  }
  return (
    <ClientProvider profile={me} fallback={<Splash />}>
      <Greeting />
      <Routes>
        <Route element={<ClientLayout />}>
          <Route index element={<Home />} />
          <Route path="checkin" element={<CheckIn />} />
          <Route path="nutrition" element={<Nutrition />} />
          <Route path="progress" element={<Progress />} />
          <Route path="goals" element={<Navigate to="/progress" replace />} />
          <Route path="supplements" element={<Supplements />} />
          <Route path="steps" element={<Steps />} />
          <Route path="photos" element={<Photos />} />
          <Route path="calls" element={<Calls />} />
          <Route path="files" element={<Navigate to="/calls" replace />} />
          <Route path="me" element={<Me />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ClientProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <ToastProvider>
        <SessionProvider><Routed /></SessionProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
