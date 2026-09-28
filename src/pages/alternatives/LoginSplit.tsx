import type { Session } from '../../api/auth'
import { useLoginForm } from '../../components/useLoginForm'
import { ApiStatus, Checkbox, ForgotPassword, FormAlert, Logo, PasswordField, SubmitButton, TextField } from '../../components/ui'

/** Design 2 — "Split screen": dark brand panel on the left, form on the right. */
export default function LoginSplit({ onSuccess, notice }: { onSuccess: (s: Session) => void; notice?: string | null }) {
  const f = useLoginForm(onSuccess, notice)

  return (
    <div className="split-page">
      <aside className="split-aside">
        <span className="split-ring" aria-hidden="true" />
        <span className="split-blob" aria-hidden="true" />
        <Logo variant="white" />

        <div className="split-pitch">
          <h2>
            Data lead,
            <br />
            terkirim tanpa hambatan.
          </h2>
          <p>Validasi, revisi, dan kirim ulang batch data lead ke Portal PASTI — dengan status yang selalu terpantau.</p>
        </div>

        <div className="split-bottom">
          <ApiStatus className="api-status-dark" />
          <p className="split-caption">INT-Hub · Astra Honda Motor</p>
        </div>
      </aside>

      <main className="split-main">
        <div className="split-form">
          <h1 className="title">Masuk ke akun Anda</h1>
          <p className="subtitle">Gunakan email dan kata sandi INT-Hub Anda.</p>

          <form onSubmit={f.handleSubmit} noValidate className="form">
            <FormAlert message={f.error} />
            <TextField
              label="Email kerja"
              placeholder="nama@perusahaan.co.id"
              type="email"
              autoComplete="username"
              value={f.email}
              onValueChange={f.setEmail}
              error={f.fieldErrors.email}
            />
            <PasswordField
              label="Kata sandi"
              placeholder="Masukkan kata sandi"
              value={f.password}
              onValueChange={f.setPassword}
              error={f.fieldErrors.password}
              labelAside={<ForgotPassword />}
            />
            <Checkbox checked={f.remember} onChange={f.setRemember}>
              Tetap masuk di perangkat ini
            </Checkbox>
            <SubmitButton loading={f.loading}>Masuk</SubmitButton>
          </form>

          <p className="foot-note">
            Belum punya akun? <strong>Hubungi administrator</strong>
          </p>
        </div>
      </main>
    </div>
  )
}
