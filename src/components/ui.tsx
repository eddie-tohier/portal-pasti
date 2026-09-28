import { useEffect, useId, useState, type InputHTMLAttributes } from 'react'
import { checkConnection } from '../api/auth'

export function Logo({ variant = 'color', className = '' }: { variant?: 'color' | 'white'; className?: string }) {
  return (
    <img
      className={`logo ${className}`}
      src={variant === 'white' ? '/logo-pasti-white.png' : '/logo-pasti.png'}
      alt="AHM Pasti"
      width={439}
      height={184}
    />
  )
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  label: string
  /** Show the label above the field; otherwise it is visually hidden and the placeholder carries it. */
  showLabel?: boolean
  error?: string
  onValueChange: (value: string) => void
  labelAside?: React.ReactNode
  trailing?: React.ReactNode
}

export function TextField({ label, showLabel = true, error, onValueChange, labelAside, trailing, ...rest }: InputProps) {
  const id = useId()
  return (
    <div className="field">
      <div className={showLabel ? 'field-label-row' : 'sr-only'}>
        <label htmlFor={id}>{label}</label>
        {labelAside}
      </div>
      <div className="input-wrap">
        <input
          id={id}
          className={`input ${trailing ? 'input-has-trailing' : ''} ${error ? 'input-invalid' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          onChange={(e) => onValueChange(e.target.value)}
          {...rest}
        />
        {trailing}
      </div>
      {error && (
        <p id={`${id}-err`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}

export function PasswordField(props: Omit<InputProps, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      autoComplete="current-password"
      trailing={
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          aria-pressed={visible}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  )
}

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="checkbox">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  )
}

export function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" className="btn-primary" disabled={loading} aria-busy={loading}>
      {loading ? (
        <>
          <span className="spinner" aria-hidden="true" /> Memproses…
        </>
      ) : (
        children
      )}
    </button>
  )
}

export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="alert" role="alert">
      <AlertIcon />
      <span>{message}</span>
    </div>
  )
}

/**
 * There is no password-reset endpoint in the API; resets go through an admin.
 */
export function ForgotPassword() {
  const [open, setOpen] = useState(false)
  return (
    <span className="forgot">
      <button type="button" className="link" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        Lupa kata sandi?
      </button>
      {open && (
        <span className="forgot-pop" role="status">
          Reset kata sandi dilakukan oleh administrator INT-Hub. Hubungi admin tim Anda.
        </span>
      )}
    </span>
  )
}

/** Pings GET /int/v1/auth/test. */
export function ApiStatus({ className = '' }: { className?: string }) {
  const [state, setState] = useState<'checking' | 'up' | 'down'>('checking')
  useEffect(() => {
    let alive = true
    checkConnection().then((ok) => alive && setState(ok ? 'up' : 'down'))
    return () => {
      alive = false
    }
  }, [])
  const text = { checking: 'Memeriksa server…', up: 'Server INT-Hub terhubung', down: 'Server INT-Hub tidak terjangkau' }[state]
  return (
    <span className={`api-status api-status-${state} ${className}`} role="status">
      <span className="dot" aria-hidden="true" />
      {text}
    </span>
  )
}

export function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

export function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.6 3.6M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  )
}
