import { useEffect, useState } from 'react'

// Minimal hash router: "#/leads?status=REJ,ERR&page=2" -> { path: 'leads', params }

export interface Route {
  path: string
  params: URLSearchParams
}

function parseHash(): Route {
  const [path = '', query = ''] = location.hash.replace(/^#\/?/, '').split('?')
  return { path, params: new URLSearchParams(query) }
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState(parseHash)
  useEffect(() => {
    const onChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function href(path: string, params?: Record<string, string | number | undefined>) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined && v !== '') q.set(k, String(v))
  const qs = q.toString()
  return `#/${path}${qs ? `?${qs}` : ''}`
}

export function navigate(path: string, params?: Record<string, string | number | undefined>) {
  location.hash = href(path, params)
}
