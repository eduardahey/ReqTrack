import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    workspaceName: '',
    workspaceDescription: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  function handleChange(e) {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: '' }))
  }

  function validate() {
    const newErrors = {}
    if (!form.workspaceName.trim()) newErrors.workspaceName = 'Nome do workspace é obrigatório'
    if (!form.name.trim()) newErrors.name = 'Nome é obrigatório'
    if (!form.email.trim()) newErrors.email = 'E-mail é obrigatório'
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'E-mail inválido'
    if (!form.password) newErrors.password = 'Senha é obrigatória'
    else if (form.password.length < 6) newErrors.password = 'Mínimo de 6 caracteres'
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'As senhas não coincidem'
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
      const { data } = await api.post('/auth/register', {
        workspaceName: form.workspaceName,
        workspaceDescription: form.workspaceDescription,
        name: form.name,
        email: form.email,
        password: form.password,
      })

      navigate('/verify-email', { state: { email: data.email } })
    } catch (err) {
      setApiError(err.response?.data?.error || 'Erro ao criar workspace. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function inputClass(id) {
    const base =
      'w-full h-11 px-4 bg-white border rounded transition-all text-sm outline-none'
    const focused = focusedField === id ? 'border-[#0058be] ring-2 ring-[#0058be]/10' : 'border-[#c6c6cd]'
    const error = errors[id] ? 'border-red-400 ring-2 ring-red-100' : ''
    return `${base} ${error || focused}`
  }

  function labelClass(id) {
    return `block text-xs font-semibold mb-1 transition-colors ${
      focusedField === id ? 'text-[#0058be]' : 'text-[#191c1e]'
    }`
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Gradient blobs */}
      <div className="fixed top-0 right-0 -z-10 opacity-20 pointer-events-none">
        <div className="w-[600px] h-[600px] bg-gradient-to-br from-[#2170e4] to-transparent rounded-full blur-[100px] -mr-48 -mt-48" />
      </div>
      <div className="fixed bottom-0 left-0 -z-10 opacity-10 pointer-events-none">
        <div className="w-[400px] h-[400px] bg-gradient-to-tr from-[#dae2fd] to-transparent rounded-full blur-[80px] -ml-24 -mb-24" />
      </div>

      {/* Header */}
      <header className="w-full h-16 flex items-center justify-center px-6">
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#000" />
            <rect x="5" y="5" width="8" height="8" rx="1.5" fill="white" />
            <rect x="15" y="5" width="8" height="8" rx="1.5" fill="white" opacity="0.6" />
            <rect x="5" y="15" width="8" height="8" rx="1.5" fill="white" opacity="0.6" />
            <rect x="15" y="15" width="8" height="8" rx="1.5" fill="white" opacity="0.3" />
          </svg>
          <span className="text-xl font-bold text-[#000]">ReqTrack</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-[560px] bg-white border border-[#c6c6cd] rounded-lg p-6 md:p-10">
          <div className="mb-10 text-center">
            <h1 className="text-[28px] font-semibold leading-9 tracking-tight text-[#191c1e] mb-2">
              Criar novo Workspace
            </h1>
            <p className="text-sm text-[#45464d]">
              Configure seu ambiente de gerenciamento de requisitos em segundos.
            </p>
          </div>

          {apiError && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10" noValidate>

            {/* Workspace Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-[#c6c6cd]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 13V6l6-4 6 4v7H10V9H6v4H2z" fill="#0058be" opacity="0.9"/>
                </svg>
                <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-[#45464d]">
                  Informações do Workspace
                </span>
              </div>

              <div>
                <label htmlFor="workspaceName" className={labelClass('workspaceName')}>
                  Nome do Workspace ou Empresa
                </label>
                <input
                  id="workspaceName"
                  type="text"
                  value={form.workspaceName}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('workspaceName')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Ex: Engenharia Inovadora Ltda"
                  className={inputClass('workspaceName')}
                />
                {errors.workspaceName && (
                  <p className="mt-1 text-xs text-red-500">{errors.workspaceName}</p>
                )}
              </div>

              <div>
                <label htmlFor="workspaceDescription" className={labelClass('workspaceDescription')}>
                  Descrição <span className="font-normal text-[#76777d]">(Opcional)</span>
                </label>
                <textarea
                  id="workspaceDescription"
                  value={form.workspaceDescription}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('workspaceDescription')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Uma breve descrição sobre o propósito deste workspace..."
                  rows={3}
                  className={`w-full p-4 bg-white border rounded transition-all text-sm outline-none resize-none ${
                    focusedField === 'workspaceDescription'
                      ? 'border-[#0058be] ring-2 ring-[#0058be]/10'
                      : 'border-[#c6c6cd]'
                  }`}
                />
              </div>
            </section>

            {/* Admin Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-[#c6c6cd]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="5" r="3" fill="#0058be" opacity="0.9"/>
                  <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="#0058be" strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
                </svg>
                <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-[#45464d]">
                  Informações do Administrador
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className={labelClass('name')}>Nome Completo</label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Seu nome"
                    className={inputClass('name')}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="email" className={labelClass('email')}>E-mail Profissional</label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="nome@empresa.com"
                    className={inputClass('email')}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className={labelClass('password')}>Senha</label>
                  <input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className={inputClass('password')}
                  />
                  {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className={labelClass('confirmPassword')}>Confirmar Senha</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className={inputClass('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="pt-2 space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#000] text-white text-sm font-bold rounded hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Criando workspace...
                  </>
                ) : (
                  <>
                    Criar Workspace
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-[#45464d]">
                Já possui uma conta?{' '}
                <Link to="/login" className="text-[#0058be] font-semibold hover:underline">
                  Faça login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
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