import { useEffect, useState } from 'react'
import { getSession, logout, SESSION_EXPIRED_EVENT, type Session } from './api/auth'
import DashboardLayout, { isSection } from './dashboard/DashboardLayout'
// Active login design. Alternatives are kept in ./pages/alternatives.
import LoginPage from './pages/LoginMinimal'
import { navigate, useHashRoute } from './router'

export default function App() {
  const route = useHashRoute()
  const [session, setSession] = useState<Session | null>(getSession)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const onExpired = () => {
      setSession(null)
      setNotice('Sesi Anda telah berakhir. Silakan masuk kembali.')
    }
    // Keeps several tabs in sync when one logs in or out.
    const onStorage = () => setSession(getSession())
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  if (session) {
    return (
      <DashboardLayout
        session={session}
        route={route}
        onLogout={async () => {
          await logout()
          setSession(null)
          navigate('login')
        }}
      />
    )
  }

  return (
    <LoginPage
      key={notice ?? ''}
      notice={notice}
      onSuccess={(s) => {
        setNotice(null)
        setSession(s)
        // Deep links (e.g. #/leads?status=REJ) survive the login redirect.
        if (!isSection(route.path)) navigate('overview')
      }}
    />
  )
}
