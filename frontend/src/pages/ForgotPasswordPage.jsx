import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

// ── Shared layout — reutilizado por VerifyCodePage e ResetPasswordPage ────────

export function AuthHeader() {
  return (
    <header className="w-full sticky top-0 bg-white border-b border-[#e2e8f0] z-50" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect width="22" height="22" rx="4" fill="#000" />
            <rect x="4" y="4" width="6" height="6" rx="1" fill="white" />
            <rect x="12" y="4" width="6" height="6" rx="1" fill="white" opacity="0.55" />
            <rect x="4" y="12" width="6" height="6" rx="1" fill="white" opacity="0.55" />
            <rect x="12" y="12" width="6" height="6" rx="1" fill="white" opacity="0.25" />
          </svg>
          <span className="text-[15px] font-bold text-black tracking-tight">ReqTrack</span>
        </div>

        <div className="flex items-center gap-4">
          <a href="#" className="text-sm text-[#45464d] hover:text-black transition-colors">
            Ajuda
          </a>
          <div className="w-8 h-8 rounded-full bg-[#eceef0] flex items-center justify-center">
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <circle cx="8.5" cy="5.5" r="3" stroke="#45464d" strokeWidth="1.4" />
              <path d="M2 15c0-3.314 2.91-5.5 6.5-5.5S15 11.686 15 15" stroke="#45464d" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  )
}

export function AuthFooter() {
  return (
    <footer className="w-full mt-auto border-t border-[#e2e8f0] bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 max-w-7xl mx-auto gap-3">
        <span className="text-xs text-[#76777d]">© 2026 ReqTrack Systems. Todos os direitos reservados.</span>
        <div className="flex gap-5">
          {['Política de Privacidade', 'Termos de Serviço', 'Suporte'].map((item) => (
            <a key={item} href="#" className="text-xs text-[#76777d] hover:text-black transition-colors">
              {item}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ── ForgotPasswordPage ────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('E-mail é obrigatório')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Informe um e-mail válido')
      return
    }

    setLoading(true)
    try {
      await api.post('/password-recovery/request', { email })
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao enviar e-mail. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fb]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <AuthHeader />

      <main className="flex-grow flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px] bg-white border border-[#e2e8f0] rounded-xl shadow-sm">

          {submitted ? (
            <div className="p-10 flex flex-col items-center text-center gap-5">
              <div className="w-14 h-14 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div>
                <p className="text-base font-semibold text-[#191c1e] mb-1">Código enviado!</p>
                <p className="text-sm text-[#45464d]">
                  Se o e-mail{' '}
                  <span className="font-semibold text-[#191c1e]">{email}</span>{' '}
                  estiver cadastrado, você receberá um código em poucos instantes.
                </p>
              </div>

              <button
                onClick={() => navigate('/forgot-password/verify', { state: { email } })}
                className="w-full h-11 bg-black text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Inserir código de verificação
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M3 7.5h9M8 3.5l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <Link to="/login" className="text-sm text-[#0058be] hover:underline flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M11 7H3M6.5 3L3 7l3.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Voltar para o login
              </Link>
            </div>

          ) : (
            <div className="p-10">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 rounded-full bg-[#f2f4f6] border border-[#e2e8f0] flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="#191c1e" strokeWidth="1.4" />
                    <path d="M11 7v4l2.5 2.5" stroke="#191c1e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5.5 5.5a8 8 0 00-1.3 3" stroke="#191c1e" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M4 6.5V4h2.5" stroke="#191c1e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <div className="text-center mb-7">
                <h1 className="text-[22px] font-bold text-[#191c1e] tracking-tight mb-2">
                  Recuperar senha
                </h1>
                <p className="text-sm text-[#45464d] leading-relaxed">
                  Informe seu e-mail cadastrado e enviaremos as instruções para redefinir sua senha.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[11px] font-mono font-medium tracking-widest uppercase mb-2"
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      color: focused ? '#0058be' : '#45464d',
                    }}
                  >
                    E-mail Profissional
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    className={`w-full h-12 px-4 bg-white text-sm rounded-lg outline-none transition-all border ${
                      error
                        ? 'border-red-400 ring-2 ring-red-100'
                        : focused
                        ? 'border-[#0058be] ring-2 ring-[#0058be]/10'
                        : 'border-[#d1d5db]'
                    }`}
                  />
                  {error && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="5" stroke="#ef4444" strokeWidth="1.2" />
                        <path d="M6 4v3M6 8.5v.2" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                      {error}
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
                      <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                        <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    'Enviar código de recuperação'
                  )}
                </button>

                <div className="pt-1 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-sm text-[#0058be] hover:underline transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M11 7H3M6.5 3L3 7l3.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Voltar para o login
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <AuthFooter />
    </div>
  )
}