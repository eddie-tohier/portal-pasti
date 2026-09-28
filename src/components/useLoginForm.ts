import { useState, type FormEvent } from 'react'
import { ApiError, login, loginErrorMessage, type Session } from '../api/auth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Field = 'email' | 'password'

/** Form state and submit logic shared by all three login designs. */
export function useLoginForm(onSuccess: (session: Session) => void, notice?: string | null) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(notice ?? null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({})

  function validate() {
    const errors: Partial<Record<Field, string>> = {}
    if (!email.trim()) errors.email = 'Email wajib diisi.'
    else if (!EMAIL_RE.test(email.trim())) errors.email = 'Format email tidak valid.'
    if (!password) errors.password = 'Kata sandi wajib diisi.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!validate()) return

    setLoading(true)
    try {
      onSuccess(await login(email.trim(), password, remember))
    } catch (err) {
      setError(loginErrorMessage(err))
      if (err instanceof ApiError && err.fieldErrors.length) {
        setFieldErrors(Object.fromEntries(err.fieldErrors.map((f) => [f.field, f.message])))
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    email,
    setEmail: (v: string) => {
      setEmail(v)
      setFieldErrors((f) => ({ ...f, email: undefined }))
    },
    password,
    setPassword: (v: string) => {
      setPassword(v)
      setFieldErrors((f) => ({ ...f, password: undefined }))
    },
    remember,
    setRemember,
    loading,
    error,
    fieldErrors,
    handleSubmit,
  }
}
