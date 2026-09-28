import { useState } from 'react'
import { checkBatchStatus, type BatchStatusCheck } from '../api/portal'
import { BatchBadge, ErrorState, fmtDate, fmtNumber, PageHeader } from './shared'

// GET /data/status is not a plain read: every call triggers an async status check
// against Portal PASTI, so it runs on demand instead of on page load.
export default function Batches() {
  const [result, setResult] = useState<BatchStatusCheck | null>(null)
  const [checkedAt, setCheckedAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)

  async function run() {
    setLoading(true)
    setError(null)
    try {
      setResult(await checkBatchStatus())
      setCheckedAt(new Date())
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Status Batch"
        subtitle="Batch yang masih PENDING, IN PROGRESS, atau FAILED di Portal PASTI."
        actions={
          <button type="button" className="btn-accent" onClick={run} disabled={loading}>
            {loading ? 'Memeriksa…' : result ? 'Periksa lagi' : 'Periksa status batch'}
          </button>
        }
      />

      <div className="note">
        Setiap pemeriksaan memicu pengecekan status ke Portal PASTI secara asinkron. Hasil di bawah adalah status terakhir yang diketahui saat tombol
        ditekan. Periksa lagi beberapa saat kemudian untuk melihat pembaruan.
      </div>

      {error ? (
        <ErrorState error={error} onRetry={run} />
      ) : !result ? (
        <div className="state state-empty card-panel">
          <p>Belum ada pemeriksaan pada sesi ini.</p>
          <button type="button" className="btn-secondary" onClick={run} disabled={loading}>
            {loading ? 'Memeriksa…' : 'Periksa sekarang'}
          </button>
        </div>
      ) : (
        <>
          <p className="muted result-meta">
            {fmtNumber(result.batchesChecked)} batch diperiksa · status: <strong>{result.status}</strong>
            {checkedAt && ` · ${checkedAt.toLocaleTimeString('id-ID')}`}
          </p>

          {result.batches.length === 0 ? (
            <div className="state card-panel">Tidak ada batch yang sedang diproses atau gagal. Semua batch sudah selesai.</div>
          ) : (
            <div className="table-card">
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Batch</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="num">Dikirim</th>
                      <th scope="col" className="num">Diterima</th>
                      <th scope="col" className="num">Gagal</th>
                      <th scope="col">Progres respons</th>
                      <th scope="col">Waktu kirim</th>
                      <th scope="col">Respons terakhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.batches.map((b) => {
                      const sent = b.sent ?? 0
                      const done = (b.accepted ?? 0) + (b.failed ?? 0)
                      return (
                        <tr key={b.id}>
                          <td>
                            <span className="mono">{b.id}</span>
                            <span className="cell-sub">{b.idHdr ? `Header PASTI: ${b.idHdr}` : 'Belum ada header PASTI'}</span>
                          </td>
                          <td>
                            <BatchBadge status={b.status} />
                          </td>
                          <td className="num">{fmtNumber(b.sent)}</td>
                          <td className="num">{fmtNumber(b.accepted)}</td>
                          <td className="num">{fmtNumber(b.failed)}</td>
                          <td>
                            <div className="meter meter-sm" role="meter" aria-label={`Batch ${b.id} sudah direspons`} aria-valuemin={0} aria-valuemax={sent} aria-valuenow={done}>
                              <span style={{ width: sent ? `${Math.min(100, (done / sent) * 100)}%` : 0 }} />
                            </div>
                            <span className="cell-sub">
                              {fmtNumber(done)} / {fmtNumber(sent)}
                            </span>
                          </td>
                          <td className="nowrap">{fmtDate(b.sentTime)}</td>
                          <td className="nowrap">{fmtDate(b.responseTime)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
