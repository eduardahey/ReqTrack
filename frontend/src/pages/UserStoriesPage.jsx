import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ProjectLayout from '../components/ProjectLayout'
import ChecklistEditor from '../components/ChecklistEditor'
import api from '../services/api'
import { getRequirementCodeMap, getUserStoryCodeMap } from '../utils/codes'
import { usePagination } from '../hooks/usePagination'

const PRIORITY_CONFIG = {
  P0: { label: 'P0', color: '#dc2626' },
  P1: { label: 'P1', color: '#2563eb' },
  P2: { label: 'P2', color: '#9ca3af' },
}
const STATUS_CONFIG = {
  DRAFT:       { label: 'RASCUNHO',     bg: '#f3f4f6', text: '#4b5563' },
  IN_REVIEW:   { label: 'EM REVISÃO',   bg: '#fef3c7', text: '#92400e' },
  APPROVED:    { label: 'APROVADO',     bg: '#dcfce7', text: '#166534' },
  IN_PROGRESS: { label: 'EM EXECUÇÃO',  bg: '#dbeafe', text: '#1d4ed8' },
  DONE:        { label: 'CONCLUÍDO',    bg: '#dcfce7', text: '#166534' },
}
const PAGE_SIZE = 10

export default function UserStoriesPage() {
  const { workspaceId, projectId } = useParams()
  const navigate = useNavigate()

  const [stories, setStories] = useState([])
  const [allStories, setAllStories] = useState([])
  const [allRequirements, setAllRequirements] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ priority: '', status: '' })
  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const userStoryCodeMap = useMemo(() => getUserStoryCodeMap(allStories), [allStories])
  const requirementCodeMap = useMemo(() => getRequirementCodeMap(allRequirements), [allRequirements])

  useEffect(() => {
    loadStories()
  }, [filters])

  useEffect(() => {
    setPage(1)
  }, [filters, search])

  useEffect(() => {
    api.get(`/projects/${projectId}/user-stories`).then(({ data }) => setAllStories(data)).catch((err) => console.error(err))
    api.get(`/projects/${projectId}/requirements`).then(({ data }) => setAllRequirements(data)).catch((err) => console.error(err))
  }, [projectId])

  async function loadStories() {
    setLoading(true)
    try {
      const params = {}
      if (filters.priority) params.priority = filters.priority
      if (filters.status) params.status = filters.status

      const { data } = await api.get(`/projects/${projectId}/user-stories`, { params })
      setStories(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function openModal() {
    setForm({ priority: 'P2', status: 'DRAFT', acceptanceCriteria: [] })
    setFormError('')
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setFormError('')

    if (!form.userType?.trim() || !form.feature?.trim() || !form.benefit?.trim()) {
      setFormError('Persona, ação e valor são obrigatórios')
      return
    }

    setSaving(true)
    try {
      const { data } = await api.post(`/projects/${projectId}/user-stories`, form)
      setStories((prev) => [data, ...prev])
      setAllStories((prev) => [data, ...prev])
      setShowModal(false)
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erro ao salvar história')
    } finally {
      setSaving(false)
    }
  }

  async function toggleCriterion(storyId, criterionId, done) {
    setStories((prev) => prev.map((s) => (
      s.id === storyId
        ? { ...s, acceptanceCriteria: s.acceptanceCriteria.map((c) => (c.id === criterionId ? { ...c, done } : c)) }
        : s
    )))
    try {
      await api.patch(`/projects/${projectId}/user-stories/${storyId}/acceptance-criteria/${criterionId}`, { done })
    } catch (err) {
      console.error(err)
      setStories((prev) => prev.map((s) => (
        s.id === storyId
          ? { ...s, acceptanceCriteria: s.acceptanceCriteria.map((c) => (c.id === criterionId ? { ...c, done: !done } : c)) }
          : s
      )))
    }
  }

  function clearFilters() {
    setFilters({ priority: '', status: '' })
    setSearch('')
  }

  const visibleStories = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return stories
    return stories.filter((story) => {
      const code = (userStoryCodeMap[story.id] || '').toLowerCase()
      const text = `${story.userType} ${story.feature} ${story.benefit}`.toLowerCase()
      return code.includes(term) || text.includes(term)
    })
  }, [stories, search, userStoryCodeMap])

  const { page, setPage, totalPages, pageItems: pagedStories } = usePagination(visibleStories, PAGE_SIZE)

  const pageNumbers = useMemo(() => {
    const windowSize = 5
    let start = Math.max(1, page - Math.floor(windowSize / 2))
    const end = Math.min(totalPages, start + windowSize - 1)
    start = Math.max(1, end - windowSize + 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [page, totalPages])

  return (
    <ProjectLayout
      title="Histórias de Usuário"
      subtitle="Gerencie o backlog de histórias de usuário do projeto."
      hideHeader
      actions={
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 h-10 px-4 bg-black text-white text-sm font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Nova História
        </button>
      }
    >
      {/* Filters */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-5 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[220px]">
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
              placeholder="Buscar por ID (US01) ou título..."
              className="w-full h-10 pl-9 pr-3 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#45464d] mb-1.5">Prioridade</label>
          <select
            value={filters.priority}
            onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))}
            className="h-10 px-3 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] bg-white min-w-[140px]"
          >
            <option value="">Todas</option>
            <option value="P0">P0</option>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#45464d] mb-1.5">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            className="h-10 px-3 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] bg-white min-w-[160px]"
          >
            <option value="">Qualquer Status</option>
            <option value="DRAFT">Rascunho</option>
            <option value="IN_REVIEW">Em Revisão</option>
            <option value="APPROVED">Aprovado</option>
            <option value="IN_PROGRESS">Em Execução</option>
            <option value="DONE">Concluído</option>
          </select>
        </div>
        <button
          onClick={clearFilters}
          className="h-10 px-4 border border-[#d1d5db] rounded-lg text-sm font-medium text-[#45464d] hover:bg-[#f7f9fb] transition-colors flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4h10M4 7h6M5.5 10h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Limpar Filtros
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-[#9ca3af]">Carregando...</div>
        ) : visibleStories.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-sm font-semibold text-[#191c1e] mb-1">Nenhuma história encontrada</p>
            <p className="text-sm text-[#6b7280]">
              {search.trim() ? 'Nenhum resultado para essa busca.' : 'Crie a primeira história de usuário do projeto.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#fafbfc]">
                <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">ID</th>
                <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">História (Persona &gt; Ação &gt; Valor)</th>
                <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">Prioridade</th>
                <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedStories.map((story) => {
                const priority = PRIORITY_CONFIG[story.priority] || PRIORITY_CONFIG.P2
                const status = STATUS_CONFIG[story.status] || STATUS_CONFIG.DRAFT
                return (
                  <tr
                    key={story.id}
                    onClick={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}/user-stories/${story.id}`)}
                    className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#fafbfc] transition-colors align-top cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center justify-center border border-[#e5e7eb] rounded-md px-2 py-1 text-xs font-mono font-semibold text-[#191c1e] bg-[#fafbfc]"
                        style={{ fontFamily: 'JetBrains Mono, monospace' }}
                      >
                        {userStoryCodeMap[story.id] || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-xl">
                      <p className="text-sm">
                        <span className="font-bold text-[#191c1e]">Como </span>
                        <span className="font-semibold text-[#2563eb]">{story.userType}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-bold text-[#191c1e]">Quero </span>
                        <span className="text-[#191c1e]">{story.feature}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-bold text-[#2563eb]">Para </span>
                        <span className="text-[#6b7280]">{story.benefit}</span>
                      </p>

                      {story.requirements?.length > 0 && (
                        <p className="text-xs text-[#6b7280] mt-2">
                          <span className="font-semibold">Requisitos: </span>
                          {story.requirements.map((r) => `${requirementCodeMap[r.id] || ''} ${r.title}`).join(', ')}
                        </p>
                      )}

                      {story.inheritedPrerequisites?.length > 0 && (
                        <p className="text-xs text-[#6b7280] mt-1">
                          <span className="font-semibold">Pré-requisitos herdados: </span>
                          {story.inheritedPrerequisites.map((r) => `${requirementCodeMap[r.id] || ''} ${r.title}`).join(', ')}
                        </p>
                      )}

                      {story.acceptanceCriteria?.length > 0 && (
                        <ul className="mt-2 space-y-1" onClick={(e) => e.stopPropagation()}>
                          {story.acceptanceCriteria.map((c) => (
                            <li key={c.id} className="flex items-start gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={c.done}
                                onChange={(e) => toggleCriterion(story.id, c.id, e.target.checked)}
                                className="mt-0.5 accent-black cursor-pointer"
                              />
                              <span className={c.done ? 'line-through text-[#9ca3af]' : 'text-[#45464d]'}>{c.text}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className="w-6 h-[3px] rounded-full" style={{ backgroundColor: priority.color }} />
                        <span className="text-xs font-bold" style={{ color: priority.color }}>{priority.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: status.bg, color: status.text }}
                      >
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {visibleStories.length > 0 && (
          <div className="px-5 py-3 border-t border-[#e5e7eb] flex items-center justify-between">
            <span className="text-xs text-[#9ca3af]">
              Mostrando {pagedStories.length} de {visibleStories.length} histórias de usuário
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 px-3 border border-[#d1d5db] rounded-lg text-xs font-medium text-[#45464d] hover:bg-[#f7f9fb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                      n === page ? 'bg-black text-white' : 'border border-[#d1d5db] text-[#45464d] hover:bg-[#f7f9fb]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 px-3 border border-[#d1d5db] rounded-lg text-xs font-medium text-[#45464d] hover:bg-[#f7f9fb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Próximo
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-[520px] p-7 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#191c1e]">Nova História de Usuário</h2>
              <button onClick={() => setShowModal(false)} className="text-[#9ca3af] hover:text-black">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>

            <p className="text-xs text-[#6b7280] mb-4">
              Para vincular esta história a requisitos, edite o requisito desejado e selecione a história em "Histórias relacionadas".
            </p>

            {formError && <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Como (persona)</label>
                <input
                  type="text"
                  value={form.userType || ''}
                  onChange={(e) => setForm((p) => ({ ...p, userType: e.target.value }))}
                  className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
                  placeholder="Ex: Analista de Dados"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Quero (ação)</label>
                <input
                  type="text"
                  value={form.feature || ''}
                  onChange={(e) => setForm((p) => ({ ...p, feature: e.target.value }))}
                  className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
                  placeholder="Ex: exportar relatórios em CSV"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Para (valor)</label>
                <input
                  type="text"
                  value={form.benefit || ''}
                  onChange={(e) => setForm((p) => ({ ...p, benefit: e.target.value }))}
                  className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
                  placeholder="Ex: processar dados em ferramentas externas"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Critérios de aceitação</label>
                <ChecklistEditor
                  items={form.acceptanceCriteria || []}
                  onChange={(items) => setForm((p) => ({ ...p, acceptanceCriteria: items }))}
                  placeholder="Ex: Arquivo exportado deve abrir no Excel"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Prioridade</label>
                  <select
                    value={form.priority || 'P2'}
                    onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                    className="w-full h-11 px-3 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] bg-white"
                  >
                    <option value="P0">P0</option>
                    <option value="P1">P1</option>
                    <option value="P2">P2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Status</label>
                  <select
                    value={form.status || 'DRAFT'}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full h-11 px-3 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] bg-white"
                  >
                    <option value="DRAFT">Rascunho</option>
                    <option value="IN_REVIEW">Em Revisão</option>
                    <option value="APPROVED">Aprovado</option>
                    <option value="IN_PROGRESS">Em Execução</option>
                    <option value="DONE">Concluído</option>
                  </select>
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
