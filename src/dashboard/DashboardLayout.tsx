import { useState } from 'react'
import type { Session } from '../api/auth'
import { Logo } from '../components/ui'
import { href, type Route } from '../router'
import Batches from './Batches'
import Leads from './Leads'
import Overview from './Overview'
import Users from './Users'

const SECTIONS = [
  { key: 'overview', label: 'Ringkasan', icon: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z' },
  { key: 'leads', label: 'Data Lead', icon: 'M4 6h16M4 12h16M4 18h10' },
  { key: 'batches', label: 'Status Batch', icon: 'M12 3v4M12 17v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M3 12h4M17 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8' },
  { key: 'users', label: 'Pengguna', icon: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19 8v6M22 11h-6' },
] as const

export type Section = (typeof SECTIONS)[number]['key']

export function isSection(path: string): path is Section {
  return SECTIONS.some((s) => s.key === path)
}

export default function DashboardLayout({ session, route, onLogout }: { session: Session; route: Route; onLogout: () => Promise<void> }) {
  const section: Section = isSection(route.path) ? route.path : 'overview'
  const [loggingOut, setLoggingOut] = useState(false)

  return (
    <div className="dash">
      <aside className="dash-sidebar">
        <a href={href('overview')} className="dash-logo" aria-label="Ringkasan">
          <Logo />
        </a>
        <nav className="dash-nav" aria-label="Navigasi utama">
          {SECTIONS.map((s) => (
            <a key={s.key} href={href(s.key)} className="dash-nav-item" aria-current={s.key === section ? 'page' : undefined}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={s.icon} />
              </svg>
              {s.label}
            </a>
          ))}
        </nav>

        <div className="dash-user">
          <span className="avatar" aria-hidden="true">
            {session.email.charAt(0).toUpperCase()}
          </span>
          <span className="dash-user-email" title={session.email}>
            {session.email}
          </span>
          <button
            type="button"
            className="icon-btn"
            aria-label="Keluar"
            title="Keluar"
            disabled={loggingOut}
            onClick={async () => {
              setLoggingOut(true)
              await onLogout()
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />
            </svg>
          </button>
        </div>
      </aside>

      <main className="dash-main">
        {section === 'overview' && <Overview session={session} />}
        {section === 'leads' && <Leads params={route.params} />}
        {section === 'batches' && <Batches />}
        {section === 'users' && <Users />}
      </main>
    </div>
  )
}
