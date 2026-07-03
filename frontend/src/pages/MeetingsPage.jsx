import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import ProjectLayout from '../components/ProjectLayout'
import api from '../services/api'
import { usePagination } from '../hooks/usePagination'

const TAG_PALETTE = [
  { bg: '#dcfce7', text: '#166534' },
  { bg: '#f3e8ff', text: '#7e22ce' },
  { bg: '#fee2e2', text: '#991b1b' },
  { bg: '#e5e7eb', text: '#374151' },
  { bg: '#dbeafe', text: '#1d4ed8' },
  { bg: '#fef3c7', text: '#92400e' },
]

const AVATAR_COLORS = [
  { bg: '#dbeafe', text: '#1d4ed8' },
  { bg: '#f3e8ff', text: '#7e22ce' },
  { bg: '#e5e7eb', text: '#374151' },
  { bg: '#ffedd5', text: '#c2410c' },
  { bg: '#dcfce7', text: '#166534' },
  { bg: '#fee2e2', text: '#991b1b' },
]

const PAGE_SIZE = 10

function hashColor(str, palette) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  return palette[hash % palette.length]
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

function formatDateParts(value) {
  const date = new Date(value)
  const dayMonth = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
  const year = date.getFullYear()
  return { dayMonth: dayMonth.charAt(0).toUpperCase() + dayMonth.slice(1), year }
}

function formatFullDateTime(value) {
  const date = new Date(value)
  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} • ${timeStr}`
}

function toDateTimeLocal(value) {
  const date = value ? new Date(value) : new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function matchesDate(value, term) {
  const date = new Date(value)
  const variants = [
    date.toLocaleDateString('pt-BR'),
    date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
    date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
    String(date.getFullYear()),
  ]
  return variants.some((v) => v.toLowerCase().includes(term))
}

function TagInput({ tags, onChange, placeholder }) {
  const [value, setValue] = useState('')

  function addTag() {
    const clean = value.trim()
    if (clean && !tags.includes(clean)) onChange([...tags, clean])
    setValue('')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => {
          const color = hashColor(tag, TAG_PALETTE)
          return (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
              style={{ backgroundColor: color.bg, color: color.text }}
            >
              #{tag}
              <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} className="hover:opacity-60">×</button>
            </span>
          )
        })}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag()
          }
        }}
        onBlur={addTag}
        placeholder={placeholder}
        className="w-full h-10 px-3 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
      />
    </div>
  )
}

export default function MeetingsPage() {
  const { projectId } = useParams()

  const [meetings, setMeetings] = useState([])
  const [stakeholders, setStakeholders] = useState([])
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
  const [viewingMeeting, setViewingMeeting] = useState(null)

  useEffect(() => {
    loadMeetings()
    api.get(`/projects/${projectId}/stakeholders`).then(({ data }) => setStakeholders(data)).catch((err) => console.error(err))
  }, [projectId])

  useEffect(() => {
    setPage(1)
  }, [search, tagFilter])

  async function loadMeetings() {
    setLoading(true)
    try {
      const { data } = await api.get(`/projects/${projectId}/meetings`)
      setMeetings(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const allTags = useMemo(() => {
    const set = new Set()
    meetings.forEach((m) => (m.tags || []).forEach((t) => set.add(t)))
    return Array.from(set)
  }, [meetings])

  function openCreateModal() {
    setEditingId(null)
    setForm({ date: toDateTimeLocal(), tags: [], participantIds: [] })
    setFormError('')
    setShowModal(true)
  }

  function openEditModal(meeting) {
    setOpenMenuId(null)
    setEditingId(meeting.id)
    setForm({
      title: meeting.title,
      date: toDateTimeLocal(meeting.date),
      summary: meeting.summary || '',
      points: meeting.points || '',
      decisions: meeting.decisions || '',
      tags: meeting.tags || [],
      participantIds: meeting.participants.map((p) => p.id),
    })
    setFormError('')
    setShowModal(true)
  }

  function toggleParticipant(id) {
    setForm((p) => {
      const current = p.participantIds || []
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
      return { ...p, participantIds: next }
    })
  }

  function toggleTagFilter(tag) {
    setTagFilter((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  async function handleSave(e) {
    e.preventDefault()
    setFormError('')

    if (!form.title?.trim() || !form.date) {
      setFormError('Título e data são obrigatórios')
      return
    }

    setSaving(true)
    try {
      const payload = { ...form, date: new Date(form.date).toISOString() }
      if (editingId) {
        const { data } = await api.put(`/projects/${projectId}/meetings/${editingId}`, payload)
        setMeetings((prev) => prev.map((m) => (m.id === editingId ? data : m)).sort((a, b) => new Date(b.date) - new Date(a.date)))
      } else {
        const { data } = await api.post(`/projects/${projectId}/meetings`, payload)
        setMeetings((prev) => [...prev, data].sort((a, b) => new Date(b.date) - new Date(a.date)))
      }
      setShowModal(false)
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erro ao salvar reunião')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(meeting) {
    setOpenMenuId(null)
    if (!window.confirm(`Remover a reunião "${meeting.title}"?`)) return
    try {
      await api.delete(`/projects/${projectId}/meetings/${meeting.id}`)
      setMeetings((prev) => prev.filter((m) => m.id !== meeting.id))
    } catch (err) {
      console.error(err)
    }
  }

  function clearFilters() {
    setSearch('')
    setTagFilter([])
  }

  function exportCsv() {
    const header = ['Título', 'Data', 'Resumo de Decisões', 'Tags']
    const rows = visibleMeetings.map((m) => [
      m.title,
      new Date(m.date).toLocaleString('pt-BR'),
      (m.decisions || '').replace(/\n/g, ' '),
      (m.tags || []).join('; '),
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'atas-de-reuniao.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const visibleMeetings = useMemo(() => {
    const term = search.trim().toLowerCase()
    return meetings.filter((m) => {
      const matchesTerm = !term ||
        m.title.toLowerCase().includes(term) ||
        (m.points || '').toLowerCase().includes(term) ||
        (m.tags || []).some((t) => t.toLowerCase().includes(term)) ||
        (m.participants || []).some((p) => p.name.toLowerCase().includes(term)) ||
        matchesDate(m.date, term)
      const matchesTags = tagFilter.length === 0 || tagFilter.some((t) => (m.tags || []).includes(t))
      return matchesTerm && matchesTags
    })
  }, [meetings, search, tagFilter])

  const featured = meetings[0]

  const monthlyStats = useMemo(() => {
    const now = new Date()
    const inThisMonth = meetings.filter((m) => {
      const d = new Date(m.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const documented = inThisMonth.filter((m) => m.decisions?.trim())
    const percent = inThisMonth.length === 0 ? 0 : Math.round((documented.length / inThisMonth.length) * 100)
    const monthName = now.toLocaleDateString('pt-BR', { month: 'long' })
    return { count: inThisMonth.length, percent, monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1) }
  }, [meetings])

  const { page, setPage, totalPages, pageItems: pagedMeetings, rangeStart, rangeEnd } = usePagination(visibleMeetings, PAGE_SIZE)

  return (
    <ProjectLayout
      title="Atas de Reunião"
      subtitle="Gestão centralizada de decisões, alinhamentos e documentação histórica das reuniões do projeto."
      hideHeader
      actions={
        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 h-10 px-4 bg-black text-white text-sm font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Nova Reunião
          </button>
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
              <div className="absolute right-0 top-12 z-20 bg-white border border-[#e5e7eb] rounded-xl shadow-lg p-3 w-64 space-y-2">
                <p className="text-xs font-semibold text-[#191c1e] px-1">Filtrar por tag</p>
                {allTags.length === 0 ? (
                  <p className="text-xs text-[#9ca3af] px-1">Nenhuma tag cadastrada ainda.</p>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {allTags.map((tag) => {
                      const color = hashColor(tag, TAG_PALETTE)
                      return (
                        <label key={tag} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#f7f9fb] cursor-pointer">
                          <input type="checkbox" checked={tagFilter.includes(tag)} onChange={() => toggleTagFilter(tag)} className="accent-black" />
                          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md" style={{ backgroundColor: color.bg, color: color.text }}>
                            #{tag}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}
                {(tagFilter.length > 0 || search) && (
                  <button onClick={clearFilters} className="w-full text-left text-xs text-[#0058be] hover:underline px-2">
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={exportCsv}
            className="h-10 px-4 border border-[#d1d5db] rounded-lg text-sm font-medium text-[#45464d] hover:bg-[#f7f9fb] transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5v8M4 6.5l3 3 3-3M2 12h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Exportar
          </button>
        </div>
      }
    >
      {/* Search */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-5">
        <label className="block text-xs font-semibold text-[#45464d] mb-1.5">Buscar</label>
        <div className="relative">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2">
            <circle cx="6" cy="6" r="4.3" stroke="#9ca3af" strokeWidth="1.4" />
            <path d="M9.5 9.5l3 3" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, data, tag, participante ou ponto discutido..."
            className="w-full h-10 pl-9 pr-3 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
          />
        </div>
      </div>

      {/* Featured meeting + monthly metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {featured ? (
          <div className="lg:col-span-2 bg-white border border-[#e5e7eb] rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#0058be] bg-[#dbeafe] px-2.5 py-1 rounded-md">
                Última Reunião
              </span>
              <span className="text-sm text-[#6b7280] font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {formatFullDateTime(featured.date)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#191c1e] mb-2">{featured.title}</h2>
            {featured.summary && <p className="text-sm text-[#45464d] mb-4">{featured.summary}</p>}

            {featured.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {featured.tags.map((tag) => {
                  const color = hashColor(tag, TAG_PALETTE)
                  return (
                    <span key={tag} className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md" style={{ backgroundColor: color.bg, color: color.text }}>
                      #{tag}
                    </span>
                  )
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[#f3f4f6]">
              <div className="flex items-center">
                {featured.participants.slice(0, 3).map((p, i) => {
                  const color = avatarColorFor(p.id)
                  return (
                    <div
                      key={p.id}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white"
                      style={{ backgroundColor: color.bg, color: color.text, marginLeft: i === 0 ? 0 : -8 }}
                    >
                      {initials(p.name)}
                    </div>
                  )
                })}
                {featured.participants.length > 3 && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white bg-[#f3f4f6] text-[#6b7280]" style={{ marginLeft: -8 }}>
                    +{featured.participants.length - 3}
                  </div>
                )}
              </div>
              <button onClick={() => setViewingMeeting(featured)} className="text-sm font-semibold text-[#0058be] hover:underline flex items-center gap-1">
                Ver Ata Completa
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 6h6M6 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white border border-[#e5e7eb] rounded-xl p-6 flex items-center justify-center text-sm text-[#9ca3af]">
            Nenhuma reunião registrada ainda.
          </div>
        )}

        <div className="bg-[#191c1e] rounded-xl p-6 flex flex-col justify-between text-white">
          <div>
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 14V8M8 14V4M13 14v-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-base font-bold mb-1">Métricas Mensais</p>
            <p className="text-sm text-white/70">
              {monthlyStats.count} reunião{monthlyStats.count !== 1 ? 'ões' : ''} realizada{monthlyStats.count !== 1 ? 's' : ''} em {monthlyStats.monthName}.
            </p>
          </div>
          <div className="mt-6">
            <div className="h-1.5 bg-white/15 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${monthlyStats.percent}%` }} />
            </div>
            <p className="text-xs text-white/60 font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {monthlyStats.percent}% das decisões documentadas
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-[#9ca3af]">Carregando...</div>
        ) : pagedMeetings.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-sm font-semibold text-[#191c1e] mb-1">Nenhuma reunião encontrada</p>
            <p className="text-sm text-[#6b7280]">
              {search.trim() || tagFilter.length > 0 ? 'Nenhum resultado para esse filtro.' : 'Registre a primeira reunião do projeto.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#fafbfc]">
                <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">Título da Reunião</th>
                <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">Data</th>
                <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">Resumo de Decisões</th>
                <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">Tags</th>
                <th className="text-right text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pagedMeetings.map((m) => {
                const { dayMonth, year } = formatDateParts(m.date)
                return (
                  <tr
                    key={m.id}
                    onClick={() => setViewingMeeting(m)}
                    className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#fafbfc] transition-colors align-top cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-[#191c1e]">{m.title}</p>
                      {m.participants.length > 0 && (
                        <p className="text-xs text-[#6b7280] mt-0.5">
                          Stakeholders: {m.participants.map((p) => p.department || p.name).join(', ')}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-[#191c1e]">{dayMonth}</p>
                      <p className="text-xs text-[#6b7280]">{year}</p>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-sm text-[#45464d] line-clamp-1">{m.decisions || <span className="text-[#9ca3af]">—</span>}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {(m.tags || []).map((tag) => {
                          const color = hashColor(tag, TAG_PALETTE)
                          return (
                            <span key={tag} className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md" style={{ backgroundColor: color.bg, color: color.text }}>
                              {tag}
                            </span>
                          )
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setOpenMenuId((id) => (id === m.id ? null : m.id))}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-[#f3f4f6] text-[#6b7280]"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <circle cx="7" cy="3" r="1.1" fill="currentColor" /><circle cx="7" cy="7" r="1.1" fill="currentColor" /><circle cx="7" cy="11" r="1.1" fill="currentColor" />
                        </svg>
                      </button>
                      {openMenuId === m.id && (
                        <div className="absolute right-5 top-11 z-20 bg-white border border-[#e5e7eb] rounded-lg shadow-lg py-1 w-32 text-left">
                          <button onClick={() => openEditModal(m)} className="w-full text-left px-3 py-2 text-sm text-[#191c1e] hover:bg-[#f7f9fb]">Editar</button>
                          <button onClick={() => handleDelete(m)} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Excluir</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {visibleMeetings.length > 0 && (
          <div className="px-5 py-3 border-t border-[#e5e7eb] flex items-center justify-between">
            <span className="text-xs text-[#9ca3af]">Exibindo {rangeStart}-{rangeEnd} de {visibleMeetings.length} reuniões</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
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
            )}
          </div>
        )}
      </div>

      {/* View meeting modal */}
      {viewingMeeting && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setViewingMeeting(null)}>
          <div className="bg-white rounded-xl w-full max-w-[560px] p-7 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-[#6b7280] font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {formatFullDateTime(viewingMeeting.date)}
              </span>
              <button onClick={() => setViewingMeeting(null)} className="text-[#9ca3af] hover:text-black">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
            <h2 className="text-lg font-bold text-[#191c1e] mb-4">{viewingMeeting.title}</h2>

            {viewingMeeting.summary && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1">Resumo</p>
                <p className="text-sm text-[#191c1e] whitespace-pre-wrap">{viewingMeeting.summary}</p>
              </div>
            )}
            {viewingMeeting.points && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1">Pontos Discutidos</p>
                <p className="text-sm text-[#191c1e] whitespace-pre-wrap">{viewingMeeting.points}</p>
              </div>
            )}
            {viewingMeeting.decisions && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1">Decisões</p>
                <p className="text-sm text-[#191c1e] whitespace-pre-wrap">{viewingMeeting.decisions}</p>
              </div>
            )}
            {viewingMeeting.participants?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1">Participantes</p>
                <div className="flex flex-wrap gap-2">
                  {viewingMeeting.participants.map((p) => (
                    <span key={p.id} className="text-sm text-[#191c1e] bg-[#f3f4f6] px-2.5 py-1 rounded-full">{p.name}</span>
                  ))}
                </div>
              </div>
            )}
            {viewingMeeting.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {viewingMeeting.tags.map((tag) => {
                  const color = hashColor(tag, TAG_PALETTE)
                  return (
                    <span key={tag} className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md" style={{ backgroundColor: color.bg, color: color.text }}>
                      #{tag}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-[560px] p-7 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#191c1e]">{editingId ? 'Editar Reunião' : 'Nova Reunião'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#9ca3af] hover:text-black">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>

            {formError && <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Título</label>
                <input
                  type="text"
                  value={form.title || ''}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
                  placeholder="Ex: Alinhamento de Arquitetura - API V3"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Data e hora</label>
                <input
                  type="datetime-local"
                  value={form.date || ''}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Resumo</label>
                <textarea
                  value={form.summary || ''}
                  onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Pontos discutidos</label>
                <textarea
                  value={form.points || ''}
                  onChange={(e) => setForm((p) => ({ ...p, points: e.target.value }))}
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Resumo de decisões</label>
                <textarea
                  value={form.decisions || ''}
                  onChange={(e) => setForm((p) => ({ ...p, decisions: e.target.value }))}
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Tags</label>
                <TagInput
                  tags={form.tags || []}
                  onChange={(tags) => setForm((p) => ({ ...p, tags }))}
                  placeholder="Digite e pressione Enter..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Participantes</label>
                <div className="max-h-32 overflow-y-auto border border-[#d1d5db] rounded-lg p-2 space-y-1">
                  {stakeholders.length === 0 ? (
                    <p className="text-xs text-[#9ca3af] px-1 py-1">Nenhum stakeholder cadastrado ainda.</p>
                  ) : (
                    stakeholders.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-[#f7f9fb] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(form.participantIds || []).includes(s.id)}
                          onChange={() => toggleParticipant(s.id)}
                          className="accent-black"
                        />
                        <span className="text-sm text-[#191c1e]">{s.name}</span>
                      </label>
                    ))
                  )}
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

function avatarColorFor(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}
