import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  function handleChange(e) {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: '' }))
    if (apiError) setApiError('')
  }

  function validate() {
    const newErrors = {}
    if (!form.email.trim()) newErrors.email = 'E-mail é obrigatório'
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'E-mail inválido'
    if (!form.password) newErrors.password = 'Senha é obrigatória'
    return newErrors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setLoading(true)
    try {
      await login(form.email, form.password)
      // Sempre mostra a tela de seleção de workspace, mesmo com apenas 1
      navigate('/workspaces')
    } catch (err) {
      // ✅ Se o e-mail ainda não foi confirmado, redireciona para a verificação
      if (err.response?.data?.needsVerification) {
        navigate('/verify-email', { state: { email: err.response.data.email } })
        return
      }
      setApiError(err.response?.data?.error || 'Credenciais inválidas. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function inputClass(id) {
    const base = 'w-full h-12 bg-white border px-4 rounded-lg outline-none transition-all text-sm'
    if (errors[id]) return `${base} border-red-400 ring-2 ring-red-100`
    if (focusedField === id) return `${base} border-[#0058be] ring-2 ring-[#0058be]/10`
    return `${base} border-[#c6c6cd]`
  }

  return (
    <div
      className="min-h-screen flex flex-col text-[#191c1e] overflow-hidden"
      style={{
        fontFamily: 'Inter, sans-serif',
        background: 'radial-gradient(circle at top left, #f1f5f9 0%, #f7f9fb 50%, #ffffff 100%)',
      }}
    >
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[120px]" style={{ background: 'rgba(0,88,190,0.05)' }} />
        <div className="absolute -bottom-[5%] -left-[5%] w-[30%] h-[30%] rounded-full blur-[100px]" style={{ background: 'rgba(0,0,0,0.05)' }} />
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.03 }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#191c1e" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <main className="flex-grow flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-[420px]">

          <div className="flex flex-col items-center mb-10">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="1.5" fill="white" />
                <rect x="13" y="3" width="8" height="8" rx="1.5" fill="white" opacity="0.6" />
                <rect x="3" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.6" />
                <rect x="13" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.3" />
              </svg>
            </div>
            <h1 className="text-[28px] font-semibold tracking-tight text-black">ReqTrack</h1>
            <p className="text-sm text-[#45464d] mt-1">Gerenciamento sistemático de requisitos</p>
          </div>

          <div className="bg-white border border-[#c6c6cd] rounded-lg p-10 shadow-sm">

            {apiError && (
              <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                  <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5" />
                  <path d="M8 5v4M8 11v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div>
                <label
                  htmlFor="email"
                  className="block text-[11px] font-mono font-medium tracking-wider uppercase mb-1.5 px-0.5"
                  style={{ color: focusedField === 'email' ? '#0058be' : '#45464d' }}
                >
                  E-mail Profissional
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="seu@email.com"
                  className={inputClass('email')}
                  autoComplete="email"
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <label
                    htmlFor="password"
                    className="text-[11px] font-mono font-medium tracking-wider uppercase"
                    style={{ color: focusedField === 'password' ? '#0058be' : '#45464d' }}
                  >
                    Senha
                  </label>
                  <Link to="/forgot-password" className="text-[11px] font-mono text-[#0058be] hover:underline">
                    Esqueci a senha
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className={inputClass('password')}
                  autoComplete="current-password"
                />
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-black text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-6 border-t border-[#c6c6cd] flex flex-col items-center gap-3">
              <p className="text-xs text-[#45464d]">Novo no ReqTrack?</p>
              <Link
                to="/register"
                className="text-sm font-semibold text-[#0058be] hover:underline transition-colors"
              >
                Criar novo workspace
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-4 px-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-[#c6c6cd] bg-white">
        <span className="text-xs text-[#45464d]">© 2026 ReqTrack Systems. Todos os direitos reservados.</span>
        <div className="flex items-center gap-6">
          {['Política de Privacidade', 'Termos de Serviço', 'Suporte'].map((item) => (
            <a key={item} href="#" className="text-xs text-[#45464d] hover:text-[#0058be] transition-colors">
              {item}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}