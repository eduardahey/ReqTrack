import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import ProjectLayout from '../components/ProjectLayout'
import api from '../services/api'
import { usePagination } from '../hooks/usePagination'

const TAG_OPTIONS = ['PO_PRIORITY', 'INFLUENCER', 'END_USER', 'HIGH_IMPACT', 'TECHNICAL', 'CONSULTED']
const TAG_CONFIG = {
  PO_PRIORITY:  { label: 'PO Priority',  bg: '#fee2e2', text: '#991b1b' },
  INFLUENCER:   { label: 'Influencer',   bg: '#f3f4f6', text: '#4b5563' },
  END_USER:     { label: 'End-user',     bg: '#dcfce7', text: '#166534' },
  HIGH_IMPACT:  { label: 'High Impact',  bg: '#fef3c7', text: '#92400e' },
  TECHNICAL:    { label: 'Technical',    bg: '#e5e7eb', text: '#374151' },
  CONSULTED:    { label: 'Consulted',    bg: '#dbeafe', text: '#1d4ed8' },
}

const AVATAR_COLORS = [
  { bg: '#dbeafe', text: '#1d4ed8' },
  { bg: '#f3e8ff', text: '#7e22ce' },
  { bg: '#e5e7eb', text: '#374151' },
  { bg: '#ffedd5', text: '#c2410c' },
  { bg: '#dcfce7', text: '#166534' },
  { bg: '#fee2e2', text: '#991b1b' },
]

const PAGE_SIZE = 10

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

function avatarColor(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function quadrantPosition(power, interest) {
  const x = Math.min(100, Math.max(0, ((interest - 1) / 9) * 100))
  const yFromTop = 100 - Math.min(100, Math.max(0, ((power - 1) / 9) * 100))
  return { left: `${x}%`, top: `${yFromTop}%` }
}

function formatRelativeTime(value) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return 'Agora mesmo'
  if (diffMin < 60) return `Há ${diffMin} minuto${diffMin > 1 ? 's' : ''}`
  if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`
  if (diffDays === 1) return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  if (diffDays < 7) return `${diffDays} dias atrás`
  return date.toLocaleDateString('pt-BR')
}

export default function StakeholdersPage() {
  const { projectId } = useParams()

  const [stakeholders, setStakeholders] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [tagFilter, setTagFilter] = useState([])

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [openMenuId, setOpenMenuId] = useState(null)

  useEffect(() => {
    loadStakeholders()
    loadActivities()
  }, [projectId])

  useEffect(() => {
    setPage(1)
  }, [search, tagFilter])

  async function loadStakeholders() {
    setLoading(true)
    try {
      const { data } = await api.get(`/projects/${projectId}/stakeholders`)
      setStakeholders(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadActivities() {
    try {
      const { data } = await api.get(`/projects/${projectId}/activities`)
      setActivities(data)
    } catch (err) {
      console.error(err)
    }
  }

  function openCreateModal() {
    setEditingId(null)
    setForm({ tags: [], power: 5, interest: 5 })
    setFormError('')
    setShowModal(true)
  }

  function openEditModal(stakeholder) {
    setOpenMenuId(null)
    setEditingId(stakeholder.id)
    setForm({
      name: stakeholder.name,
      role: stakeholder.role || '',
      department: stakeholder.department || '',
      email: stakeholder.email || '',
      phone: stakeholder.phone || '',
      notes: stakeholder.notes || '',
      tags: stakeholder.tags || [],
      power: stakeholder.power,
      interest: stakeholder.interest,
    })
    setFormError('')
    setShowModal(true)
  }

  function toggleFormTag(tag) {
    setForm((p) => {
      const current = p.tags || []
      const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
      return { ...p, tags: next }
    })
  }

  function toggleTagFilter(tag) {
    setTagFilter((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  async function handleSave(e) {
    e.preventDefault()
    setFormError('')

    if (!form.name?.trim()) {
      setFormError('Nome é obrigatório')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        const { data } = await api.put(`/projects/${projectId}/stakeholders/${editingId}`, form)
        setStakeholders((prev) => prev.map((s) => (s.id === editingId ? data : s)))
      } else {
        const { data } = await api.post(`/projects/${projectId}/stakeholders`, form)
        setStakeholders((prev) => [data, ...prev])
        loadActivities()
      }
      setShowModal(false)
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erro ao salvar stakeholder')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(stakeholder) {
    setOpenMenuId(null)
    if (!window.confirm(`Remover ${stakeholder.name}?`)) return
    try {
      await api.delete(`/projects/${projectId}/stakeholders/${stakeholder.id}`)
      setStakeholders((prev) => prev.filter((s) => s.id !== stakeholder.id))
    } catch (err) {
      console.error(err)
    }
  }

  function clearFilters() {
    setSearch('')
    setTagFilter([])
  }

  const visibleStakeholders = useMemo(() => {
    const term = search.trim().toLowerCase()
    return stakeholders.filter((s) => {
      const matchesTerm = !term || s.name.toLowerCase().includes(term) || (s.role || '').toLowerCase().includes(term)
      const matchesTags = tagFilter.length === 0 || tagFilter.some((t) => (s.tags || []).includes(t))
      return matchesTerm && matchesTags
    })
  }, [stakeholders, search, tagFilter])

  const { page, setPage, totalPages, pageItems: pagedStakeholders, rangeStart, rangeEnd } = usePagination(visibleStakeholders, PAGE_SIZE)

  return (
    <ProjectLayout
      title="Stakeholders do Projeto"
      subtitle="Gerencie os interessados, influenciadores e tomadores de decisão do projeto."
      hideHeader
      actions={
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 h-10 px-4 bg-black text-white text-sm font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="5.5" cy="4.5" r="2.3" stroke="white" strokeWidth="1.3" />
            <path d="M1.5 12c0-2.3 1.8-3.8 4-3.8s4 1.5 4 3.8" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M11 4v4M9 6h4" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Novo Stakeholder
        </button>
      }
    >
      {/* Stats */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-5 inline-block min-w-[220px]">
        <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1">Total Stakeholders</p>
        <p className="text-3xl font-bold text-[#191c1e]">{stakeholders.length}</p>
      </div>

      {/* Table card */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden mb-5">
        <div className="p-5 border-b border-[#e5e7eb] flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px] relative">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2">
              <circle cx="6" cy="6" r="4.3" stroke="#9ca3af" strokeWidth="1.4" />
              <path d="M9.5 9.5l3 3" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por nome ou cargo..."
              className="w-full h-10 pl-9 pr-3 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilterPanel((v) => !v)}
              className="h-10 px-4 border border-[#d1d5db] rounded-lg text-sm font-medium text-[#45464d] hover:bg-[#f7f9fb] transition-colors flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 4h10M4 7h6M5.5 10h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              Filtros{tagFilter.length > 0 ? ` (${tagFilter.length})` : ''}
            </button>
            {showFilterPanel && (
              <div className="absolute right-0 top-12 z-20 bg-white border border-[#e5e7eb] rounded-xl shadow-lg p-3 w-56 space-y-1">
                {TAG_OPTIONS.map((tag) => (
                  <label key={tag} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#f7f9fb] cursor-pointer">
                    <input type="checkbox" checked={tagFilter.includes(tag)} onChange={() => toggleTagFilter(tag)} className="accent-black" />
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: TAG_CONFIG[tag].bg, color: TAG_CONFIG[tag].text }}
                    >
                      {TAG_CONFIG[tag].label}
                    </span>
                  </label>
                ))}
                {(tagFilter.length > 0 || search) && (
                  <button onClick={clearFilters} className="w-full text-left text-xs text-[#0058be] hover:underline px-2 pt-1">
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#9ca3af] shrink-0">
            <span>
              {visibleStakeholders.length === 0 ? 'Nenhum resultado' : `Exibindo ${rangeStart}-${rangeEnd} de ${visibleStakeholders.length}`}
            </span>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-[#d1d5db] hover:bg-[#f7f9fb] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-[#d1d5db] hover:bg-[#f7f9fb] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-[#9ca3af]">Carregando...</div>
        ) : pagedStakeholders.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-sm font-semibold text-[#191c1e] mb-1">Nenhum stakeholder encontrado</p>
            <p className="text-sm text-[#6b7280]">
              {search.trim() || tagFilter.length > 0 ? 'Nenhum resultado para esse filtro.' : 'Cadastre o primeiro stakeholder do projeto.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#fafbfc]">
                <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">Nome</th>
                <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">Cargo/Área</th>
                <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">Contato</th>
                <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">Observações</th>
                <th className="text-right text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pagedStakeholders.map((s) => {
                const color = avatarColor(s.id)
                return (
                  <tr key={s.id} className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#fafbfc] transition-colors align-top">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ backgroundColor: color.bg, color: color.text }}
                        >
                          {initials(s.name)}
                        </div>
                        <span className="text-sm font-semibold text-[#191c1e]">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-[#191c1e]">{s.role || <span className="text-[#9ca3af]">—</span>}</p>
                      {s.department && <p className="text-xs text-[#6b7280]">{s.department}</p>}
                    </td>
                    <td className="px-5 py-4">
                      {s.email && (
                        <p className="text-xs text-[#45464d] flex items-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 3h9v6h-9V3zM1.5 3l4.5 3.5L10.5 3" stroke="#9ca3af" strokeWidth="1.2" strokeLinejoin="round" /></svg>
                          {s.email}
                        </p>
                      )}
                      {s.phone && (
                        <p className="text-xs text-[#45464d] flex items-center gap-1.5 mt-1">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 2h2l1 2.5-1.3 1a6 6 0 003.3 3.3l1-1.3L11 8.5v2a1 1 0 01-1.1 1C5.5 11.1 1 6.6 1.5 2.5 1.5 2 2 2 2.5 2z" stroke="#9ca3af" strokeWidth="1" strokeLinejoin="round" /></svg>
                          {s.phone}
                        </p>
                      )}
                      {!s.email && !s.phone && <span className="text-xs text-[#9ca3af]">—</span>}
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      {s.notes && <p className="text-xs text-[#45464d] mb-1.5 line-clamp-2">{s.notes}</p>}
                      {s.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {s.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
                              style={{ backgroundColor: TAG_CONFIG[tag]?.bg || '#f3f4f6', color: TAG_CONFIG[tag]?.text || '#4b5563' }}
                            >
                              {TAG_CONFIG[tag]?.label || tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right relative">
                      <button
                        onClick={() => setOpenMenuId((id) => (id === s.id ? null : s.id))}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-[#f3f4f6] text-[#6b7280]"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <circle cx="7" cy="3" r="1.1" fill="currentColor" /><circle cx="7" cy="7" r="1.1" fill="currentColor" /><circle cx="7" cy="11" r="1.1" fill="currentColor" />
                        </svg>
                      </button>
                      {openMenuId === s.id && (
                        <div className="absolute right-5 top-11 z-20 bg-white border border-[#e5e7eb] rounded-lg shadow-lg py-1 w-32 text-left">
                          <button onClick={() => openEditModal(s)} className="w-full text-left px-3 py-2 text-sm text-[#191c1e] hover:bg-[#f7f9fb]">Editar</button>
                          <button onClick={() => handleDelete(s)} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Excluir</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Influence matrix + activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-[#e5e7eb] rounded-xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-[#191c1e]">Matriz de Influência</h2>
            <div className="w-5 h-5 rounded-full border border-[#d1d5db] flex items-center justify-center text-[10px] text-[#9ca3af]">i</div>
          </div>
          <p className="text-sm text-[#6b7280] mb-5">Distribuição de stakeholders por poder e interesse.</p>

          <div className="flex gap-2">
            <span className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wide [writing-mode:vertical-rl] rotate-180 py-4">
              Poder / Influência
            </span>
            <div className="flex-1">
              <div className="relative w-full aspect-[4/3] border border-[#e5e7eb] rounded-lg overflow-hidden bg-[#fafbfc]">
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                  <div className="p-2 flex items-start justify-start"><span className="text-[10px] font-bold uppercase tracking-wide text-red-400">Manage Closely</span></div>
                  <div className="p-2 flex items-start justify-end"><span className="text-[10px] font-bold uppercase tracking-wide text-green-500">Keep Satisfied</span></div>
                  <div className="p-2 flex items-end justify-start"><span className="text-[10px] font-bold uppercase tracking-wide text-blue-400">Keep Informed</span></div>
                  <div className="p-2 flex items-end justify-end text-right">
                    <span>
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-[#9ca3af]">Monitor</span>
                      <span className="block text-[9px] text-[#c6c6cd]">Low priority group</span>
                    </span>
                  </div>
                </div>
                <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-[#d1d5db]" />
                <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-[#d1d5db]" />

                {stakeholders.map((s) => {
                  const pos = quadrantPosition(s.power, s.interest)
                  const color = avatarColor(s.id)
                  return (
                    <div
                      key={s.id}
                      title={`${s.name} (Poder ${s.power}, Interesse ${s.interest})`}
                      className="absolute w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow -translate-x-1/2 -translate-y-1/2"
                      style={{ ...pos, backgroundColor: color.bg, color: color.text }}
                    >
                      {initials(s.name)}
                    </div>
                  )
                })}
              </div>
              <p className="text-center text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wide mt-2">Nível de Interesse</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 flex flex-col">
          <h2 className="text-base font-bold text-[#191c1e] mb-4">Atividades Recentes</h2>
          {activities.length === 0 ? (
            <p className="text-sm text-[#9ca3af] flex-1">Nenhuma atividade registrada ainda.</p>
          ) : (
            <ul className="space-y-4 flex-1">
              {activities.map((activity, i) => (
                <li key={activity.id} className="flex gap-2.5">
                  <span
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: i === 0 ? '#2563eb' : '#d1d5db' }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#191c1e]">{activity.title}</p>
                    {activity.description && <p className="text-xs text-[#6b7280] mt-0.5">{activity.description}</p>}
                    <p className="text-[11px] text-[#9ca3af] mt-0.5">{formatRelativeTime(activity.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-[520px] p-7 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#191c1e]">{editingId ? 'Editar Stakeholder' : 'Novo Stakeholder'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#9ca3af] hover:text-black">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>

            {formError && <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Nome</label>
                <input
                  type="text"
                  value={form.name || ''}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
                  placeholder="Ex: João Silva"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Cargo</label>
                  <input
                    type="text"
                    value={form.role || ''}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                    className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
                    placeholder="Ex: Diretor de Operações"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Área</label>
                  <input
                    type="text"
                    value={form.department || ''}
                    onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                    className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
                    placeholder="Ex: COO / Board"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">E-mail</label>
                  <input
                    type="email"
                    value={form.email || ''}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
                    placeholder="joao.silva@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Telefone</label>
                  <input
                    type="text"
                    value={form.phone || ''}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
                    placeholder="(11) 98765-4321"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Observações</label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((tag) => {
                    const active = (form.tags || []).includes(tag)
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleFormTag(tag)}
                        className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md border transition-all"
                        style={
                          active
                            ? { backgroundColor: TAG_CONFIG[tag].bg, color: TAG_CONFIG[tag].text, borderColor: TAG_CONFIG[tag].text }
                            : { backgroundColor: 'white', color: '#9ca3af', borderColor: '#d1d5db' }
                        }
                      >
                        {TAG_CONFIG[tag].label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">
                    Poder / Influência ({form.power ?? 5})
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={form.power ?? 5}
                    onChange={(e) => setForm((p) => ({ ...p, power: Number(e.target.value) }))}
                    className="w-full accent-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">
                    Nível de Interesse ({form.interest ?? 5})
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={form.interest ?? 5}
                    onChange={(e) => setForm((p) => ({ ...p, interest: Number(e.target.value) }))}
                    className="w-full accent-black"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-10 border border-[#d1d5db] rounded-lg text-sm font-semibold text-[#45464d] hover:bg-[#f7f9fb]">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 h-10 bg-black text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProjectLayout>
  )
}
