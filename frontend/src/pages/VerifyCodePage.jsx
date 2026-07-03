import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AuthHeader, AuthFooter } from './ForgotPasswordPage'
import api from '../services/api'

export default function VerifyCodePage() {
  const navigate = useNavigate()
  const location = useLocation()

  // E-mail vem da tela anterior via navigate state
  const email = location.state?.email

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)
  const inputRefs = useRef([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Se não tem e-mail no state (ex: usuário acessou a URL direto), volta pro início
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true })
    }
  }, [email, navigate])

  function handleChange(index, value) {
    if (!/^[0-9]?$/.test(value)) return
    const newDigits = [...digits]
    newDigits[index] = value
    setDigits(newDigits)
    setError('')
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus()
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const newDigits = [...digits]
    pasted.split('').forEach((char, i) => { newDigits[i] = char })
    setDigits(newDigits)
    const nextEmpty = newDigits.findIndex((d) => !d)
    const focusIndex = nextEmpty === -1 ? 5 : nextEmpty
    inputRefs.current[focusIndex]?.focus()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const code = digits.join('')
    if (code.length < 6) {
      setError('Preencha todos os 6 dígitos')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/password-recovery/verify', { email, code })
      // resetToken vem da API e é necessário na próxima tela
      navigate('/forgot-password/reset', { state: { resetToken: data.resetToken } })
    } catch (err) {
      setError(err.response?.data?.error || 'Código inválido. Tente novamente.')
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResent(true)
    try {
      await api.post('/password-recovery/resend', { email })
    } catch (err) {
      // Mesmo se der erro, não revela ao usuário por segurança
    } finally {
      setTimeout(() => setResent(false), 3000)
    }
  }

  const allFilled = digits.every(Boolean)

  if (!email) return null // evita flash antes do redirect

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fb]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <AuthHeader />

      <main className="flex-grow flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[440px] bg-white border border-[#e2e8f0] rounded-xl shadow-sm p-10">

          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[#f2f4f6] border border-[#e2e8f0] flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 3l7 3v5c0 5-3 8-7 9-4-1-7-4-7-9V6l7-3z" stroke="#191c1e" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M9 12l2.2 2.2L15.5 9.5" stroke="#191c1e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-[22px] font-bold text-[#191c1e] tracking-tight mb-2">Verificar código</h1>
            <p className="text-sm text-[#45464d] max-w-[300px]">
              Insira o código de 6 dígitos enviado para{' '}
              <span className="font-semibold text-[#191c1e]">{email}</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold bg-white border rounded-lg outline-none transition-all select-none ${
                    error
                      ? 'border-red-400 ring-2 ring-red-100 text-red-500'
                      : digit
                      ? 'border-[#0058be] bg-[#eff6ff] text-[#0058be]'
                      : 'border-[#d1d5db] focus:border-[#0058be] focus:ring-2 focus:ring-[#0058be]/10'
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center flex items-center justify-center gap-1">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="#ef4444" strokeWidth="1.2" />
                  <path d="M6 4v3M6 8.5v.2" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !allFilled}
              className="w-full h-11 bg-black text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Verificando...
                </>
              ) : 'Confirmar código'}
            </button>
          </form>

          <div className="mt-6 space-y-4 text-center">
            <p className="text-xs text-[#45464d]">
              Não recebeu o código?{' '}
              <button
                onClick={handleResend}
                className={`text-xs font-semibold transition-colors ${
                  resent ? 'text-green-600 cursor-default' : 'text-[#0058be] hover:underline'
                }`}
                disabled={resent}
              >
                {resent ? '✓ Código reenviado!' : 'Reenviar código'}
              </button>
            </p>
            <div className="pt-4 border-t border-[#e2e8f0]">
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
          </div>
        </div>
      </main>

      <AuthFooter />
    </div>
  )
}