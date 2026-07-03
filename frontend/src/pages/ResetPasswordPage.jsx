import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AuthHeader, AuthFooter } from './ForgotPasswordPage'
import api from '../services/api'

function PasswordStrength({ password }) {
  const checks = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Letra maiúscula', ok: /[A-Z]/.test(password) },
    { label: 'Número', ok: /[0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.ok).length
  const colors = ['bg-red-400', 'bg-amber-400', 'bg-green-400']
  const labels = ['Fraca', 'Média', 'Forte']

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : 'bg-[#e2e8f0]'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {checks.map((c) => (
            <span key={c.label} className={`flex items-center gap-1 text-[10px] ${c.ok ? 'text-green-600' : 'text-[#76777d]'}`}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                {c.ok
                  ? <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  : <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" />
                }
              </svg>
              {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={`text-[10px] font-semibold ${colors[score - 1].replace('bg-', 'text-')}`}>
            {labels[score - 1]}
          </span>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // resetToken vem da tela de verificação via navigate state
  const resetToken = location.state?.resetToken

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [show, setShow] = useState({ password: false, confirm: false })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [focused, setFocused] = useState(null)

  // Se não tem token (acesso direto pela URL), volta pro início do fluxo
  useEffect(() => {
    if (!resetToken) {
      navigate('/forgot-password', { replace: true })
    }
  }, [resetToken, navigate])

  function handleChange(e) {
    const { id, value } = e.target
    setForm((p) => ({ ...p, [id]: value }))
    if (errors[id]) setErrors((p) => ({ ...p, [id]: '' }))
    if (apiError) setApiError('')
  }

  function validate() {
    const errs = {}
    if (!form.password) errs.password = 'Senha é obrigatória'
    else if (form.password.length < 8) errs.password = 'Mínimo de 8 caracteres'
    if (!form.confirm) errs.confirm = 'Confirmação é obrigatória'
    else if (form.password !== form.confirm) errs.confirm = 'As senhas não coincidem'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      await api.post('/password-recovery/reset', {
        resetToken,
        password: form.password,
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2200)
    } catch (err) {
      setApiError(err.response?.data?.error || 'Erro ao redefinir senha. Refaça o processo de recuperação.')
    } finally {
      setLoading(false)
    }
  }

  function inputClass(id) {
    const base = 'w-full h-12 px-4 pr-11 bg-white border rounded-lg outline-none transition-all text-sm'
    if (errors[id]) return `${base} border-red-400 ring-2 ring-red-100`
    if (focused === id) return `${base} border-[#0058be] ring-2 ring-[#0058be]/10`
    return `${base} border-[#d1d5db]`
  }

  if (!resetToken) return null // evita flash antes do redirect

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fb]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <AuthHeader />

      <main className="flex-grow flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[440px] bg-white border border-[#e2e8f0] rounded-xl shadow-sm p-10">

          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f2f4f6] border border-[#e2e8f0] flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="5" y="10" width="12" height="8" rx="1.5" stroke="#191c1e" strokeWidth="1.4" />
                <path d="M8 10V7a3 3 0 016 0v3" stroke="#191c1e" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="11" cy="14" r="1.2" fill="#191c1e" />
              </svg>
            </div>
            <h1 className="text-[22px] font-bold text-[#191c1e] tracking-tight mb-2">Redefinir senha</h1>
            <p className="text-sm text-[#45464d] max-w-[300px]">
              Crie uma nova senha forte para acessar sua conta.
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center mx-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#191c1e] mb-1">Senha redefinida com sucesso!</p>
                <p className="text-sm text-[#45464d]">Redirecionando para o login...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>

              {apiError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {apiError}
                </div>
              )}

              <div>
                <label
                  htmlFor="password"
                  className="block text-[11px] font-mono font-medium tracking-widest uppercase mb-2"
                  style={{ fontFamily: 'JetBrains Mono, monospace', color: focused === 'password' ? '#0058be' : '#45464d' }}
                >
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={show.password ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    className={inputClass('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((p) => ({ ...p, password: !p.password }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#76777d] hover:text-[#45464d] transition-colors"
                    tabIndex={-1}
                  >
                    {show.password ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M3 3l18 18M10.5 10.677A2 2 0 0013.323 13.5M6.362 6.362C4.387 7.72 3 9.694 3 12c0 3 4.03 7 9 7 1.79 0 3.44-.54 4.82-1.41M9.773 4.773A9.4 9.4 0 0112 4.5c4.97 0 9 4 9 7.5 0 1.43-.67 2.92-1.8 4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5C7.03 5 3 9 3 12c0 3 4.03 7 9 7s9-4 9-7c0-3-4.03-7-9-7z" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                <PasswordStrength password={form.password} />
              </div>

              <div>
                <label
                  htmlFor="confirm"
                  className="block text-[11px] font-mono font-medium tracking-widest uppercase mb-2"
                  style={{ fontFamily: 'JetBrains Mono, monospace', color: focused === 'confirm' ? '#0058be' : '#45464d' }}
                >
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <input
                    id="confirm"
                    type={show.confirm ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={handleChange}
                    onFocus={() => setFocused('confirm')}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    className={inputClass('confirm')}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((p) => ({ ...p, confirm: !p.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#76777d] hover:text-[#45464d] transition-colors"
                    tabIndex={-1}
                  >
                    {show.confirm ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M3 3l18 18M10.5 10.677A2 2 0 0013.323 13.5M6.362 6.362C4.387 7.72 3 9.694 3 12c0 3 4.03 7 9 7 1.79 0 3.44-.54 4.82-1.41M9.773 4.773A9.4 9.4 0 0112 4.5c4.97 0 9 4 9 7.5 0 1.43-.67 2.92-1.8 4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5C7.03 5 3 9 3 12c0 3 4.03 7 9 7s9-4 9-7c0-3-4.03-7-9-7z" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirm && <p className="mt-1 text-xs text-red-500">{errors.confirm}</p>}
                {form.confirm && form.password && !errors.confirm && (
                  <p className={`mt-1 text-[11px] flex items-center gap-1 ${form.password === form.confirm ? 'text-green-600' : 'text-[#76777d]'}`}>
                    {form.password === form.confirm ? (
                      <><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> Senhas coincidem</>
                    ) : (
                      <><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" /></svg> Senhas não coincidem</>
                    )}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-black text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Salvando...
                  </>
                ) : 'Salvar nova senha'}
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-6 pt-6 border-t border-[#e2e8f0] flex justify-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs text-[#45464d] hover:text-black transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M11 7H3M6.5 3L3 7l3.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Voltar para o login
              </Link>
            </div>
          )}
        </div>
      </main>

      <AuthFooter />
    </div>
  )
}