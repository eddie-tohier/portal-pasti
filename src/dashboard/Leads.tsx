import { useEffect, useRef, useState, type FormEvent } from 'react'
import { LEAD_STATUSES, searchLeads, type LeadData, type LeadStatus } from '../api/portal'
import { navigate } from '../router'
import { ErrorState, fmtDate, fmtNumber, PageHeader, RefreshButton, STATUS_META, StatusBadge, useAsync } from './shared'

const PAGE_SIZES = [10, 20, 50, 100]
const DEFAULT_SORT = 'dateCreate,desc'

function readParams(params: URLSearchParams) {
  const status = (params.get('status') ?? '')
    .split(',')
    .filter((s): s is LeadStatus => (LEAD_STATUSES as readonly string[]).includes(s))
  const size = Number(params.get('size'))
  return {
    status,
    q: params.get('q') ?? '',
    page: Math.max(0, Number(params.get('page')) || 0),
    size: PAGE_SIZES.includes(size) ? size : 20,
    sort: params.get('sort') || DEFAULT_SORT,
    open: params.get('open') ?? '',
  }
}

type Filters = ReturnType<typeof readParams>

function splitIds(q: string) {
  return q
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function Leads({ params }: { params: URLSearchParams }) {
  const f = readParams(params)

  const update = (patch: Partial<Filters>) => {
    const next = { ...f, open: '', ...patch }
    navigate('leads', {
      status: next.status.join(','),
      q: next.q,
      page: next.page || undefined,
      size: next.size === 20 ? undefined : next.size,
      sort: next.sort === DEFAULT_SORT ? undefined : next.sort,
      open: next.open,
    })
  }

  const result = useAsync(
    () => searchLeads({ status: f.status, sourceRefIds: splitIds(f.q) }, { page: f.page, size: f.size, sort: [f.sort] }),
    // "open" only toggles the drawer; it must not refetch.
    [f.status.join(), f.q, f.page, f.size, f.sort],
  )

  const [query, setQuery] = useState(f.q)
  useEffect(() => setQuery(f.q), [f.q])

  const page = result.data
  const selected = page?.content.find((l) => l.id === f.open) ?? null

  function toggleStatus(s: LeadStatus) {
    const status = f.status.includes(s) ? f.status.filter((x) => x !== s) : [...f.status, s]
    update({ status, page: 0 })
  }

  function onSearch(e: FormEvent) {
    e.preventDefault()
    update({ q: query.trim(), page: 0 })
  }

  const sortDesc = f.sort.endsWith(',desc')
  const from = page && page.totalElements ? page.number * page.size + 1 : 0
  const to = page ? page.number * page.size + page.numberOfElements : 0

  return (
    <>
      <PageHeader
        title="Data Lead"
        subtitle="Data lead yang tersimpan di INT-Hub beserta status pengirimannya ke Portal PASTI."
        actions={<RefreshButton onClick={result.reload} loading={result.loading} />}
      />

      <div className="filter-bar">
        <div className="chips" role="group" aria-label="Filter status">
          <button type="button" className="chip" aria-pressed={f.status.length === 0} onClick={() => update({ status: [], page: 0 })}>
            Semua
          </button>
          {LEAD_STATUSES.map((s) => (
            <button key={s} type="button" className={`chip chip-${STATUS_META[s].tone}`} aria-pressed={f.status.includes(s)} onClick={() => toggleStatus(s)}>
              <span className="chip-dot" aria-hidden="true" />
              {STATUS_META[s].label}
            </button>
          ))}
        </div>

        <form className="search" onSubmit={onSearch} role="search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <label className="sr-only" htmlFor="lead-search">
            Cari Source Ref ID
          </label>
          <input id="lead-search" type="search" placeholder="Source Ref ID (pisahkan dengan koma)" value={query} onChange={(e) => setQuery(e.target.value)} />
          {f.q && (
            <button type="button" className="link" onClick={() => update({ q: '', page: 0 })}>
              Hapus
            </button>
          )}
        </form>
      </div>

      {result.error ? (
        <ErrorState error={result.error} onRetry={result.reload} />
      ) : (
        <div className="table-card" aria-busy={result.loading}>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Source Ref ID</th>
                  <th scope="col">Pelanggan</th>
                  <th scope="col">Kota</th>
                  <th scope="col">Motor</th>
                  <th scope="col">Dealer</th>
                  <th scope="col" aria-sort={sortDesc ? 'descending' : 'ascending'}>
                    <button type="button" className="th-sort" onClick={() => update({ sort: sortDesc ? 'dateCreate,asc' : DEFAULT_SORT, page: 0 })}>
                      Dibuat {sortDesc ? '↓' : '↑'}
                    </button>
                  </th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {!page && result.loading
                  ? Array.from({ length: 6 }, (_, i) => (
                      <tr key={i} className="row-skeleton">
                        {Array.from({ length: 7 }, (_, j) => (
                          <td key={j}>
                            <span className="skeleton skeleton-line" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : page?.content.map((lead) => (
                      <tr key={lead.id} className="row-click" onClick={() => update({ open: lead.id, page: f.page })}>
                        <td className="mono">
                          <button type="button" className="row-link" onClick={(e) => (e.stopPropagation(), update({ open: lead.id, page: f.page }))}>
                            {lead.sourceRefId || '—'}
                          </button>
                        </td>
                        <td>
                          <strong>{lead.nameCust || '—'}</strong>
                          <span className="cell-sub">{lead.phoneCust1 || lead.emailCust || ''}</span>
                        </td>
                        <td>{lead.cityCust || '—'}</td>
                        <td>
                          {lead.seriesMtr || '—'}
                          <span className="cell-sub">{lead.proMtrCol}</span>
                        </td>
                        <td>{lead.asgnDealer || '—'}</td>
                        <td className="nowrap">{fmtDate(lead.dateCreate)}</td>
                        <td>
                          <StatusBadge status={lead.status} />
                          {lead.errorMsg && (
                            <span className="cell-error" title={lead.errorMsg}>
                              {lead.errorMsg}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {page && page.empty && <p className="state">Tidak ada data lead yang cocok dengan filter ini.</p>}

          {page && !page.empty && (
            <div className="pager">
              <span className="muted">
                Menampilkan {fmtNumber(from)}–{fmtNumber(to)} dari {fmtNumber(page.totalElements)}
              </span>
              <label className="pager-size">
                Baris
                <select value={f.size} onChange={(e) => update({ size: Number(e.target.value), page: 0 })}>
                  {PAGE_SIZES.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
              <div className="pager-nav">
                <button type="button" className="btn-secondary" disabled={page.first} onClick={() => update({ page: f.page - 1 })}>
                  ← Sebelumnya
                </button>
                <span className="muted">
                  Hal. {page.number + 1} / {Math.max(1, page.totalPages)}
                </span>
                <button type="button" className="btn-secondary" disabled={page.last} onClick={() => update({ page: f.page + 1 })}>
                  Berikutnya →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selected && <LeadDrawer lead={selected} onClose={() => update({ open: '', page: f.page })} />}
    </>
  )
}

const DETAIL_GROUPS: { title: string; fields: [keyof LeadData, string][] }[] = [
  {
    title: 'Pelanggan',
    fields: [
      ['nameCust', 'Nama'],
      ['genderCust', 'Jenis kelamin'],
      ['phoneCust1', 'Telepon 1'],
      ['phoneCust2', 'Telepon 2'],
      ['emailCust', 'Email'],
      ['facebookCust', 'Facebook'],
      ['instagramCust', 'Instagram'],
      ['twitterCust', 'Twitter'],
    ],
  },
  {
    title: 'Alamat',
    fields: [
      ['addressCust', 'Alamat'],
      ['kelCust', 'Kelurahan'],
      ['kecCust', 'Kecamatan'],
      ['cityCust', 'Kota'],
      ['provCust', 'Provinsi'],
      ['postalCode', 'Kode pos'],
    ],
  },
  {
    title: 'Motor & prospek',
    fields: [
      ['seriesMtr', 'Seri motor'],
      ['proMtrID', 'ID motor'],
      ['proMtrCol', 'Warna'],
      ['frameNo', 'No. rangka'],
      ['propensity', 'Propensity'],
      ['progProspect', 'Program prospek'],
      ['proFlag', 'Flag'],
      ['desc', 'Deskripsi'],
    ],
  },
  {
    title: 'Dealer',
    fields: [
      ['asgnMD', 'Main dealer'],
      ['asgnDealer', 'Dealer ditugaskan'],
      ['prevDealer', 'Dealer sebelumnya'],
      ['reaprevDealer', 'Alasan dealer sebelumnya'],
      ['reaprevDealerDesc', 'Keterangan alasan'],
    ],
  },
  {
    title: 'Sistem',
    fields: [
      ['sourceRefId', 'Source Ref ID'],
      ['id', 'ID internal'],
      ['srcCode', 'Kode sumber'],
      ['plaCode', 'Kode platform'],
      ['agent', 'Agen'],
      ['validator', 'Validator'],
      ['dateValid', 'Tanggal valid'],
      ['dateCreate', 'Tanggal dibuat'],
    ],
  },
]

function LeadDrawer({ lead, onClose }: { lead: LeadData; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const value = (k: keyof LeadData) => {
    const v = lead[k]
    if (v == null || v === '') return '—'
    if (k === 'dateValid' || k === 'dateCreate') return fmtDate(String(v))
    return String(v)
  }

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby="drawer-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      <div className="drawer-inner">
        <header className="drawer-head">
          <div>
            <p className="muted mono">{lead.sourceRefId}</p>
            <h2 id="drawer-title">{lead.nameCust || 'Tanpa nama'}</h2>
            <StatusBadge status={lead.status} />
          </div>
          <button type="button" className="icon-btn" aria-label="Tutup" onClick={() => ref.current?.close()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        {lead.errorMsg && (
          <div className="alert" role="note">
            <span>
              <strong>Pesan error:</strong> {lead.errorMsg}
            </span>
          </div>
        )}

        {DETAIL_GROUPS.map((g) => (
          <section key={g.title} className="detail-group">
            <h3>{g.title}</h3>
            <dl>
              {g.fields.map(([k, label]) => (
                <div key={k}>
                  <dt>{label}</dt>
                  <dd>{value(k)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </dialog>
  )
}
