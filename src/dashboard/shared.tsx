import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/auth'
import type { LeadStatus } from '../api/portal'

// Status colors follow the fixed status palette (good / warning / serious / critical)
// and always ship with an icon + label, never color alone.
type Tone = 'good' | 'warning' | 'serious' | 'critical' | 'neutral' | 'info'

export const STATUS_META: Record<LeadStatus, { label: string; hint: string; tone: Tone }> = {
  SIP: { label: 'Sedang dikirim', hint: 'Dalam proses pengiriman ke Portal PASTI', tone: 'info' },
  ACP: { label: 'Diterima', hint: 'Diterima oleh Portal PASTI', tone: 'good' },
  REJ: { label: 'Ditolak', hint: 'Ditolak Portal PASTI, perlu revisi', tone: 'serious' },
  URV: { label: 'Dalam revisi', hint: 'Sedang direvisi', tone: 'warning' },
  REV: { label: 'Sudah direvisi', hint: 'Revisi selesai, menunggu kirim ulang', tone: 'neutral' },
  ERR: { label: 'Gagal kirim', hint: 'Terjadi error saat pengiriman', tone: 'critical' },
}

const BATCH_TONES: Record<string, Tone> = { PENDING: 'warning', 'IN PROGRESS': 'info', FAILED: 'critical', SUCCESS: 'good', DONE: 'good' }

export function StatusBadge({ status }: { status?: LeadStatus }) {
  if (!status) return <span className="badge badge-neutral">—</span>
  const meta = STATUS_META[status]
  return (
    <span className={`badge badge-${meta.tone}`} title={meta.hint}>
      <ToneIcon tone={meta.tone} />
      {meta.label}
    </span>
  )
}

export function BatchBadge({ status }: { status: string }) {
  const tone = BATCH_TONES[status.toUpperCase()] ?? 'neutral'
  return (
    <span className={`badge badge-${tone}`}>
      <ToneIcon tone={tone} />
      {status}
    </span>
  )
}

export function ToneIcon({ tone }: { tone: Tone }) {
  const common = { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  switch (tone) {
    case 'good':
      return <svg {...common}><path d="M5 12l5 5L20 7" /></svg>
    case 'critical':
      return <svg {...common}><path d="M6 6l12 12M18 6L6 18" /></svg>
    case 'serious':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></svg>
    case 'warning':
      return <svg {...common}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
    case 'info':
      return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    default:
      return <svg {...common}><circle cx="12" cy="12" r="4" /></svg>
  }
}

const numberFmt = new Intl.NumberFormat('id-ID')
export const fmtNumber = (n?: number | null) => (n == null ? '—' : numberFmt.format(n))

export function fmtPercent(part: number, total: number) {
  if (!total) return '0%'
  const pct = (part / total) * 100
  return `${pct < 10 && pct > 0 ? pct.toFixed(1).replace('.', ',') : Math.round(pct)}%`
}

export function fmtDate(value?: string, withTime = true) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

export function errorText(err: unknown) {
  if (err instanceof ApiError) {
    if (err.status === 0) return err.message
    return `${err.message} (HTTP ${err.status})`
  }
  return 'Terjadi kesalahan tak terduga.'
}

/** Runs an async loader, re-running whenever `deps` change; ignores stale results. */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [loadedAt, setLoadedAt] = useState<Date | null>(null)
  const seq = useRef(0)

  const run = useCallback(load, deps)

  const reload = useCallback(() => {
    const id = ++seq.current
    setLoading(true)
    setError(null)
    run()
      .then((d) => {
        if (id !== seq.current) return
        setData(d)
        setLoadedAt(new Date())
      })
      .catch((e) => id === seq.current && setError(e))
      .finally(() => id === seq.current && setLoading(false))
  }, [run])

  useEffect(reload, [reload])

  return { data, error, loading, loadedAt, reload }
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="state state-error" role="alert">
      <p>
        <strong>Gagal memuat data.</strong> {errorText(error)}
      </p>
      {onRetry && (
        <button type="button" className="btn-secondary" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </div>
  )
}

export function RefreshButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button type="button" className="btn-secondary" onClick={onClick} disabled={loading}>
      <svg className={loading ? 'spin' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" />
      </svg>
      {loading ? 'Memuat…' : 'Muat ulang'}
    </button>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}
