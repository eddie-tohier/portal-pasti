import type { Session } from '../../api/auth'
import { useLoginForm } from '../../components/useLoginForm'
import { ApiStatus, Checkbox, ForgotPassword, FormAlert, GlobeIcon, LockIcon, Logo, PasswordField, SubmitButton, TextField } from '../../components/ui'

/** Design 1 — "Hero overlap": colored hero band with the card straddling it. */
export default function LoginHero({ onSuccess, notice }: { onSuccess: (s: Session) => void; notice?: string | null }) {
  const f = useLoginForm(onSuccess, notice)

  return (
    <div className="hero-page">
      <div className="hero-band" aria-hidden="true">
        <span className="hero-ring" />
        <span className="hero-bubble" />
        <span className="hero-tile" />
      </div>

      <header className="hero-top">
        <Logo variant="white" />
        <span className="hero-help">Butuh bantuan? Hubungi administrator →</span>
      </header>

      <main className="hero-card card">
        <div className="hero-icon">
          <LockIcon />
        </div>
        <h1 className="title">Masuk ke Portal PASTI</h1>
        <p className="subtitle">Ingest, revisi, dan pantau data lead ke Portal PASTI — semua dalam satu tempat.</p>

        <form onSubmit={f.handleSubmit} noValidate className="form">
          <FormAlert message={f.error} />
          <TextField
            label="Alamat email"
            showLabel={false}
            placeholder="Alamat email"
            type="email"
            autoComplete="username"
            value={f.email}
            onValueChange={f.setEmail}
            error={f.fieldErrors.email}
          />
          <PasswordField
            label="Kata sandi"
            showLabel={false}
            placeholder="Kata sandi"
            value={f.password}
            onValueChange={f.setPassword}
            error={f.fieldErrors.password}
          />
          <div className="row-between">
            <Checkbox checked={f.remember} onChange={f.setRemember}>
              Tetap masuk
            </Checkbox>
            <ForgotPassword />
          </div>
          <SubmitButton loading={f.loading}>Masuk →</SubmitButton>
        </form>

        <p className="foot-note">
          Belum punya akun? <strong>Minta akses ke administrator</strong>
        </p>
      </main>

      <footer className="hero-footer">
        <ApiStatus />
        <span className="lang">
          <GlobeIcon /> Bahasa Indonesia
        </span>
      </footer>
    </div>
  )
}
