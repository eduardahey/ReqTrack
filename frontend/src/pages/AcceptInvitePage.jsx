import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthHeader, AuthFooter } from './ForgotPasswordPage'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function AcceptInvitePage() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [searchParams] = useSearchParams()

  const [form, setForm] = useState({
    email: searchParams.get('email') || '',
    code: '',
    name: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
    if (error) setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.email.trim() || !form.code.trim() || !form.name.trim() || !form.password) {
      setError('Preencha todos os campos')
      return
    }
    if (form.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/workspace-invites/accept', {
        email: form.email,
        code: form.code,
        name: form.name,
        password: form.password,
      })
      setSession(data.token, data.user)
      navigate(`/workspaces/${data.workspaces[0].id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao aceitar convite. Verifique o código.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] focus:ring-2 focus:ring-[#0058be]/10 transition-all'

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fb]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <AuthHeader />

      <main className="flex-grow flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[440px] bg-white border border-[#e2e8f0] rounded-xl shadow-sm p-10">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[#f2f4f6] border border-[#e2e8f0] flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="8" r="3" stroke="#191c1e" strokeWidth="1.4" />
                <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" stroke="#191c1e" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M16 5v6M13 8h6" stroke="#191c1e" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-[22px] font-bold text-[#191c1e] tracking-tight mb-2">Aceitar convite</h1>
            <p className="text-sm text-[#45464d] max-w-[320px]">
              Insira o e-mail, o código recebido e crie sua senha para entrar no workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-[#191c1e] mb-1.5" htmlFor="email">E-mail</label>
              <input id="email" type="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="nome@empresa.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#191c1e] mb-1.5" htmlFor="code">Código do convite</label>
              <input id="code" type="text" value={form.code} onChange={handleChange} className={inputClass} placeholder="123456" maxLength={6} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#191c1e] mb-1.5" htmlFor="name">Seu nome</label>
              <input id="name" type="text" value={form.name} onChange={handleChange} className={inputClass} placeholder="Ex: Maria Santos" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#191c1e] mb-1.5" htmlFor="password">Senha</label>
              <input id="password" type="password" value={form.password} onChange={handleChange} className={inputClass} placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#191c1e] mb-1.5" htmlFor="confirmPassword">Confirmar senha</label>
              <input id="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} className={inputClass} />
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
              disabled={loading}
              className="w-full h-11 bg-black text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Aceitar convite e entrar'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#e2e8f0] text-center">
            <Link to="/login" className="inline-flex items-center gap-1 text-xs text-[#45464d] hover:text-black transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M11 7H3M6.5 3L3 7l3.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Já tenho uma conta
            </Link>
          </div>
        </div>
      </main>

      <AuthFooter />
    </div>
  )
}
