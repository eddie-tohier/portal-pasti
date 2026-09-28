import { useState, type FormEvent } from 'react'
import { ApiError } from '../api/auth'
import { addUser, type User } from '../api/portal'
import { FormAlert, TextField } from '../components/ui'
import { errorText, PageHeader } from './shared'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Users() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof User, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState<User[]>([])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Nama wajib diisi.'
    if (!email.trim()) next.email = 'Email wajib diisi.'
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Format email tidak valid.'
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    try {
      const user = await addUser({ name: name.trim(), email: email.trim() })
      setCreated((list) => [user, ...list])
      setName('')
      setEmail('')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setErrors({ email: 'Email ini sudah terdaftar.' })
      else if (err instanceof ApiError && err.fieldErrors.length)
        setErrors(Object.fromEntries(err.fieldErrors.map((f) => [f.field, f.message])))
      else setError(errorText(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader title="Pengguna" subtitle="Tambahkan pengguna INT-Hub baru. Pengguna baru langsung berstatus aktif." />

      <div className="two-col two-col-narrow">
        <section className="card-panel">
          <div className="panel-head">
            <h2>Tambah pengguna</h2>
          </div>
          <form className="form" onSubmit={onSubmit} noValidate>
            <FormAlert message={error} />
            <TextField label="Nama lengkap" placeholder="Nama pengguna" value={name} onValueChange={setName} error={errors.name} autoComplete="off" />
            <TextField label="Email" type="email" placeholder="nama@perusahaan.co.id" value={email} onValueChange={setEmail} error={errors.email} autoComplete="off" />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Menyimpan…' : 'Tambah pengguna'}
            </button>
          </form>
        </section>

        <section className="card-panel">
          <div className="panel-head">
            <h2>Ditambahkan di sesi ini</h2>
          </div>
          {created.length ? (
            <ul className="user-list">
              {created.map((u) => (
                <li key={u.email}>
                  <span className="avatar" aria-hidden="true">
                    {(u.name || u.email).charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <strong>{u.name}</strong>
                    <p className="muted">{u.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="state">Belum ada pengguna yang ditambahkan. API belum menyediakan daftar pengguna, jadi hanya penambahan di sesi ini yang tampil.</p>
          )}
        </section>
      </div>
    </>
  )
}
