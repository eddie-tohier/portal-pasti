import type { Session } from '../api/auth'
import { useLoginForm } from '../components/useLoginForm'
import { Checkbox, ForgotPassword, FormAlert, Logo, PasswordField, SubmitButton, TextField } from '../components/ui'

/** Design 3 — "Minimal": a single bordered card on a neutral background. */
export default function LoginMinimal({ onSuccess, notice }: { onSuccess: (s: Session) => void; notice?: string | null }) {
  const f = useLoginForm(onSuccess, notice)

  return (
    <div className="minimal-page">
      <header className="minimal-top">
        <Logo />
      </header>

      <main className="minimal-card card">
        <h1 className="sr-only">Masuk ke Portal PASTI</h1>

        <form onSubmit={f.handleSubmit} noValidate className="form">
          <FormAlert message={f.error} />
          <TextField
            label="Alamat email"
            placeholder="anda@perusahaan.co.id"
            type="email"
            autoComplete="username"
            value={f.email}
            onValueChange={f.setEmail}
            error={f.fieldErrors.email}
          />
          <PasswordField
            label="Kata sandi"
            placeholder="••••••••••"
            value={f.password}
            onValueChange={f.setPassword}
            error={f.fieldErrors.password}
            labelAside={<ForgotPassword />}
          />
          <Checkbox checked={f.remember} onChange={f.setRemember}>
            Tetap masuk
          </Checkbox>
          <SubmitButton loading={f.loading}>Masuk</SubmitButton>
        </form>
      </main>
    </div>
  )
}
