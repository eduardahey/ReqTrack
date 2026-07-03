import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProfileMenu from '../components/ProfileMenu'
import api from '../services/api'

// ── Mapeamento de status → cor da barra superior + badge ──────────────────
const STATUS_CONFIG = {
  EM_ANDAMENTO:  { label: 'EM ANDAMENTO',  bar: '#2563eb', badgeBg: '#dcfce7', badgeText: '#15803d' },
  PLANEJAMENTO:  { label: 'PLANEJAMENTO',  bar: '#dc2626', badgeBg: '#fef9c3', badgeText: '#854d0e' },
  DOCUMENTACAO:  { label: 'DOCUMENTAÇÃO',  bar: '#191c1e', badgeBg: '#dbeafe', badgeText: '#1d4ed8' },
  CONCLUIDO:     { label: 'CONCLUÍDO',     bar: '#16a34a', badgeBg: '#dcfce7', badgeText: '#15803d' },
  default:       { label: 'ATIVO',         bar: '#6b7280', badgeBg: '#f3f4f6', badgeText: '#4b5563' },
}

function getStatusConfig(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.default
}

export default function DashboardPage() {
  const { workspaceId } = useParams()
  const navigate = useNavigate()

  const [workspace, setWorkspace] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  // Modal form state
  const [form, setForm] = useState({ name: '', description: '' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [wsRes, projectsRes] = await Promise.all([
          api.get(`/workspaces/${workspaceId}`),
          api.get(`/workspaces/${workspaceId}/projects`),
        ])
        setWorkspace(wsRes.data)
        setProjects(projectsRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [workspaceId])

  async function handleCreateProject(e) {
    e.preventDefault()
    setFormError('')

    if (!form.name.trim()) {
      setFormError('Nome do projeto é obrigatório')
      return
    }

    setSaving(true)
    try {
      const { data } = await api.post(`/workspaces/${workspaceId}/projects`, form)
      setProjects((prev) => [data, ...prev])
      setShowModal(false)
      setForm({ name: '', description: '' })
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erro ao criar projeto')
    } finally {
      setSaving(false)
    }
  }

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header className="w-full bg-white border-b border-[#e5e7eb] sticky top-0 z-40">
        <div className="flex items-center justify-between px-8 py-3 max-w-7xl mx-auto gap-6">
          {/* Brand + breadcrumb */}
          <Link to="/workspaces" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
            <svg width="26" height="26" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="30" height="30" rx="4" fill="black" />
              <path d="M15.5 12V6H23.5V12H15.5V12M5.5 16V6H13.5V16H5.5V16M15.5 24V14H23.5V24H15.5V24M5.5 24V18H13.5V24H5.5V24M7.5 14H11.5V8H7.5V14V14M17.5 22H21.5V16H17.5V22V22M17.5 10H21.5V8H17.5V10V10M7.5 22H11.5V20H7.5V22V22M11.5 14V14V14V14V14V14M17.5 10V10V10V10V10V10M17.5 16V16V16V16V16V16M11.5 20V20V20V20V20V20"
              fill="white" />
            </svg>
            <div className="leading-tight">
              <p className="text-[15px] font-bold text-black">ReqTrack</p>
              <p className="text-[11px] text-[#9ca3af]">
                {workspace?.name || '...'} • PO Portal
              </p>
            </div>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-md relative hidden md:block">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3.5 top-1/2 -translate-y-1/2">
              <circle cx="7" cy="7" r="5" stroke="#9ca3af" strokeWidth="1.4" />
              <path d="M11 11l3.5 3.5" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Procurar projetos..."
              className="w-full h-10 pl-10 pr-4 bg-[#f3f4f6] border border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-[#d1d5db] transition-all"
            />
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-4 shrink-0">
            <button className="relative w-9 h-9 rounded-full hover:bg-[#f3f4f6] flex items-center justify-center transition-colors">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M14 7c0-2.76-2.24-5-5-5S4 4.24 4 7c0 3-1.5 4.5-1.5 5.5h13C15.5 11.5 14 10 14 7z" stroke="#45464d" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M7.5 15.5a1.5 1.5 0 003 0" stroke="#45464d" strokeWidth="1.4" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="w-9 h-9 rounded-full hover:bg-[#f3f4f6] flex items-center justify-center transition-colors">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7.5" stroke="#45464d" strokeWidth="1.4" />
                <path d="M7 7a2 2 0 113 1.7c-.5.3-.8.8-.8 1.3" stroke="#45464d" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="9" cy="13" r="0.6" fill="#45464d" />
              </svg>
            </button>
            <ProfileMenu />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow px-8 py-10 max-w-7xl mx-auto w-full">

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[28px] font-bold text-[#191c1e] tracking-tight mb-1">Projetos</h1>
            <p className="text-sm text-[#6b7280]">Gerencie e acompanhe o progresso de seus backlogs técnicos.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 h-10 px-4 bg-black text-white text-sm font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            New Project
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[180px] bg-white border border-[#e5e7eb] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f3f4f6] flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M3 7l8-4 8 4-8 4-8-4z" stroke="#9ca3af" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M3 7v8l8 4 8-4V7" stroke="#9ca3af" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#191c1e] mb-1">
              {search ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
            </p>
            <p className="text-sm text-[#6b7280]">
              {search ? 'Tente buscar por outro termo.' : 'Crie seu primeiro projeto para começar.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => {
              const status = getStatusConfig(project.status)
              return (
                <div
                  key={project.id}
                  className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow"
                >
                  {/* Colored top bar */}
                  <div className="h-[3px]" style={{ backgroundColor: status.bar }} />

                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
                        style={{ fontFamily: 'JetBrains Mono, monospace', backgroundColor: status.badgeBg, color: status.badgeText }}
                      >
                        {status.label}
                      </span>
                      <span className="text-xs font-mono text-[#9ca3af]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {project._count?.requirements || 0} req.
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-[#191c1e] mb-1.5 truncate">{project.name}</h3>
                    <p className="text-sm text-[#6b7280] line-clamp-2 min-h-[40px]">
                      {project.description || 'Sem descrição.'}
                    </p>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#f3f4f6]">
                      <span className="text-xs text-[#9ca3af]">
                        {new Date(project.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <button
                        onClick={() => navigate(`/workspaces/${workspaceId}/projects/${project.id}/requirements`)}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-[#0058be] hover:underline"
                      >
                        Manage
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M5.5 3.5l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ── Modal: Novo Projeto ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div
            className="bg-white rounded-xl w-full max-w-[440px] p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#191c1e]">Novo Projeto</h2>
              <button onClick={() => setShowModal(false)} className="text-[#9ca3af] hover:text-black transition-colors">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Nome do projeto</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Módulo de Vendas"
                  className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] focus:ring-2 focus:ring-[#0058be]/10 transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">
                  Descrição <span className="text-[#9ca3af] font-normal">(opcional)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Breve descrição do projeto..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] focus:ring-2 focus:ring-[#0058be]/10 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-10 border border-[#d1d5db] rounded-lg text-sm font-semibold text-[#45464d] hover:bg-[#f7f9fb] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-10 bg-black text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}