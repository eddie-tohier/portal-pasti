import { useState } from 'react'
import { ApiError, type Session } from '../api/auth'
import { countLeadsByStatus, LEAD_STATUSES, searchLeads, testPastiConnection } from '../api/portal'
import { ApiStatus } from '../components/ui'
import { href } from '../router'
import { ErrorState, fmtDate, fmtNumber, fmtPercent, PageHeader, RefreshButton, STATUS_META, StatusBadge, ToneIcon, useAsync } from './shared'

export default function Overview({ session }: { session: Session }) {
  const counts = useAsync(countLeadsByStatus, [])
  const attention = useAsync(() => searchLeads({ status: ['REJ', 'ERR'] }, { size: 5, sort: ['dateCreate,desc'] }), [])
  const name = session.email.split('@')[0]

  const reload = () => {
    counts.reload()
    attention.reload()
  }

  const total = counts.data?.total ?? 0
  const accepted = counts.data?.byStatus.ACP ?? 0
  const needsAction = counts.data ? counts.data.byStatus.REJ + counts.data.byStatus.ERR + counts.data.byStatus.URV : null

  return (
    <>
      <PageHeader
        title={`Halo, ${name}`}
        subtitle={counts.loadedAt ? `Ringkasan data lead · diperbarui ${counts.loadedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : 'Ringkasan data lead yang dikirim ke Portal PASTI'}
        actions={<RefreshButton onClick={reload} loading={counts.loading || attention.loading} />}
      />

      {counts.error ? (
        <ErrorState error={counts.error} onRetry={counts.reload} />
      ) : (
        <>
          <section className="kpi-hero card-panel" aria-busy={counts.loading}>
            <div>
              <p className="kpi-label">Total data lead</p>
              <p className="kpi-hero-value">{counts.data ? fmtNumber(total) : <span className="skeleton skeleton-hero" />}</p>
            </div>
            <div className="kpi-hero-meter">
              <div className="meter-head">
                <span>Diterima Portal PASTI</span>
                <strong>{counts.data ? `${fmtPercent(accepted, total)} · ${fmtNumber(accepted)}` : '—'}</strong>
              </div>
              <div
                className="meter"
                role="meter"
                aria-label="Persentase lead diterima"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={accepted}
              >
                <span style={{ width: total ? `${(accepted / total) * 100}%` : 0 }} />
              </div>
              <p className="meter-foot">
                {needsAction != null ? (
                  <>
                    <strong>{fmtNumber(needsAction)}</strong> lead perlu tindakan (ditolak, gagal kirim, atau dalam revisi)
                  </>
                ) : (
                  ' '
                )}
              </p>
            </div>
          </section>

          <section className="kpi-grid" aria-label="Jumlah lead per status">
            {LEAD_STATUSES.map((s) => {
              const meta = STATUS_META[s]
              const n = counts.data?.byStatus[s]
              return (
                <a key={s} href={href('leads', { status: s })} className="kpi-tile">
                  <span className={`kpi-tile-label tone-${meta.tone}`}>
                    <span className="tone-chip">
                      <ToneIcon tone={meta.tone} />
                    </span>
                    {meta.label}
                  </span>
                  <span className="kpi-tile-value">{n != null ? fmtNumber(n) : <span className="skeleton skeleton-num" />}</span>
                  <span className="kpi-tile-foot">
                    {n != null ? `${fmtPercent(n, total)} dari total` : ' '} · <code>{s}</code>
                  </span>
                </a>
              )
            })}
          </section>
        </>
      )}

      <div className="two-col">
        <section className="card-panel">
          <div className="panel-head">
            <h2>Perlu tindakan</h2>
            <a className="panel-link" href={href('leads', { status: 'REJ,ERR' })}>
              Lihat semua →
            </a>
          </div>
          {attention.error ? (
            <ErrorState error={attention.error} onRetry={attention.reload} />
          ) : attention.loading && !attention.data ? (
            <ul className="attention-list">
              {[0, 1, 2].map((i) => (
                <li key={i}>
                  <span className="skeleton skeleton-line" />
                </li>
              ))}
            </ul>
          ) : attention.data?.content.length ? (
            <ul className="attention-list">
              {attention.data.content.map((lead) => (
                <li key={lead.id}>
                  <a href={href('leads', { q: lead.sourceRefId, open: lead.id })}>
                    <div className="attention-main">
                      <strong>{lead.nameCust || 'Tanpa nama'}</strong>
                      <span className="muted mono">{lead.sourceRefId}</span>
                    </div>
                    <p className="attention-msg">{lead.errorMsg || STATUS_META[lead.status ?? 'REJ'].hint}</p>
                    <div className="attention-meta">
                      <StatusBadge status={lead.status} />
                      <span className="muted">{fmtDate(lead.dateCreate)}</span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="state">Tidak ada lead yang ditolak atau gagal kirim. 🎉</p>
          )}
        </section>

        <ConnectionPanel />
      </div>
    </>
  )
}

function ConnectionPanel() {
  const [pasti, setPasti] = useState<{ state: 'idle' | 'loading' | 'ok' | 'fail'; message?: string; at?: Date }>({ state: 'idle' })

  async function runTest() {
    setPasti({ state: 'loading' })
    try {
      const msg = await testPastiConnection()
      setPasti({ state: 'ok', message: msg, at: new Date() })
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.status === 401
            ? 'Portal PASTI tidak mengembalikan access token.'
            : err.message || `HTTP ${err.status}`
          : 'Terjadi kesalahan.'
      setPasti({ state: 'fail', message, at: new Date() })
    }
  }

  return (
    <section className="card-panel">
      <div className="panel-head">
        <h2>Koneksi</h2>
      </div>
      <ul className="conn-list">
        <li>
          <div>
            <strong>INT-Hub API</strong>
            <p className="muted">Backend lead data AHM</p>
          </div>
          <ApiStatus />
        </li>
        <li>
          <div>
            <strong>Portal PASTI</strong>
            <p className="muted">
              {pasti.state === 'idle' && 'Uji login INT-Hub ke Portal PASTI.'}
              {pasti.state === 'loading' && 'Menguji koneksi…'}
              {(pasti.state === 'ok' || pasti.state === 'fail') && `${pasti.message} · ${pasti.at?.toLocaleTimeString('id-ID')}`}
            </p>
          </div>
          {pasti.state === 'ok' || pasti.state === 'fail' ? (
            <span className={`api-status api-status-${pasti.state === 'ok' ? 'up' : 'down'}`}>
              <span className="dot" aria-hidden="true" />
              {pasti.state === 'ok' ? 'Terhubung' : 'Gagal'}
            </span>
          ) : null}
          <button type="button" className="btn-secondary" onClick={runTest} disabled={pasti.state === 'loading'}>
            {pasti.state === 'loading' ? 'Menguji…' : pasti.state === 'idle' ? 'Tes koneksi' : 'Tes ulang'}
          </button>
        </li>
      </ul>
    </section>
  )
}
