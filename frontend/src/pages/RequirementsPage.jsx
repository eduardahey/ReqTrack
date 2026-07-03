import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ProjectLayout from '../components/ProjectLayout'
import ChecklistEditor from '../components/ChecklistEditor'
import api from '../services/api'
import { getRequirementCodeMap } from '../utils/codes'

const TYPE_LABELS = { FUNCTIONAL: 'Funcional', NON_FUNCTIONAL: 'Não Funcional' }
const PRIORITY_CONFIG = {
  HIGH:   { label: 'ALTA',  bar: '#dc2626', badgeBg: '#fee2e2', badgeText: '#991b1b' },
  MEDIUM: { label: 'MÉDIA', bar: '#2563eb', badgeBg: '#dbeafe', badgeText: '#1d4ed8' },
  LOW:    { label: 'BAIXA', bar: '#9ca3af', badgeBg: '#f3f4f6', badgeText: '#4b5563' },
}
const STATUS_CONFIG = {
  OPEN:        { label: 'Aberto',     dot: '#9ca3af' },
  IN_PROGRESS: { label: 'Em Análise', dot: '#2563eb' },
  DONE:        { label: 'Concluído',  dot: '#16a34a' },
}

export default function RequirementsPage() {
  const { workspaceId, projectId } = useParams()
  const navigate = useNavigate()

  const [requirements, setRequirements] = useState([])
  const [allRequirements, setAllRequirements] = useState([])
  const [userStories, setUserStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ type: '', priority: '', status: '' })
  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState('select') // 'select' | 'FUNCTIONAL' | 'NON_FUNCTIONAL'
  const [form, setForm] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const requirementCodeMap = useMemo(() => getRequirementCodeMap(allRequirements), [allRequirements])

  const visibleRequirements = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return requirements
    return requirements.filter((req) => {
      const code = (requirementCodeMap[req.id] || '').toLowerCase()
      return code.includes(term) || req.title.toLowerCase().includes(term)
    })
  }, [requirements, search, requirementCodeMap])

  useEffect(() => {
    loadRequirements()
  }, [filters])

  useEffect(() => {
    api.get(`/projects/${projectId}/user-stories`).then(({ data }) => setUserStories(data)).catch((err) => console.error(err))
    loadAllRequirements()
  }, [projectId])

  async function loadAllRequirements() {
    try {
      const { data } = await api.get(`/projects/${projectId}/requirements`)
      setAllRequirements(data)
    } catch (err) {
      console.error(err)
    }
  }

  async function loadRequirements() {
    setLoading(true)
    try {
      const params = {}
      if (filters.type) params.type = filters.type
      if (filters.priority) params.priority = filters.priority
      if (filters.status) params.status = filters.status

      const { data } = await api.get(`/projects/${projectId}/requirements`, { params })
      setRequirements(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function openModal() {
    setStep('select')
    setForm({ priority: 'MEDIUM', status: 'OPEN', acceptanceCriteria: [], userStoryIds: [], prerequisiteIds: [] })
    setFormError('')
    setShowModal(true)
  }

  function toggleMultiSelect(field, id) {
    setForm((p) => {
      const current = p[field] || []
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
      return { ...p, [field]: next }
    })
  }

  function selectTemplate(type) {
    setStep(type)
    setForm((prev) => ({ ...prev, type }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setFormError('')

    if (!form.title?.trim()) {
      setFormError('Título é obrigatório')
      return
    }

    setSaving(true)
    try {
      const { data } = await api.post(`/projects/${projectId}/requirements`, form)
      setRequirements((prev) => [data, ...prev])
      setAllRequirements((prev) => [data, ...prev])
      setShowModal(false)
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erro ao salvar requisito')
    } finally {
      setSaving(false)
    }
  }

  function clearFilters() {
    setFilters({ type: '', priority: '', status: '' })
    setSearch('')
  }

  return (
    <ProjectLayout
      title="Requisitos do Projeto"
      subtitle="Gerencie e priorize os requisitos técnicos e funcionais do projeto."
      hideHeader
      actions={
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 h-10 px-4 bg-black text-white text-sm font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Novo Requisito
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
              placeholder="Buscar por ID (RF01) ou título..."
              className="w-full h-10 pl-9 pr-3 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#45464d] mb-1.5">Tipo</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
            className="h-10 px-3 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] bg-white min-w-[160px]"
          >
            <option value="">Todos os Tipos</option>
            <option value="FUNCTIONAL">Funcional</option>
            <option value="NON_FUNCTIONAL">Não Funcional</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#45464d] mb-1.5">Prioridade</label>
          <select
            value={filters.priority}
            onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))}
            className="h-10 px-3 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] bg-white min-w-[140px]"
          >
            <option value="">Todas</option>
            <option value="HIGH">Alta</option>
            <option value="MEDIUM">Média</option>
            <option value="LOW">Baixa</option>
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
            <option value="OPEN">Aberto</option>
            <option value="IN_PROGRESS">Em Análise</option>
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
        ) : visibleRequirements.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-sm font-semibold text-[#191c1e] mb-1">Nenhum requisito encontrado</p>
            <p className="text-sm text-[#6b7280]">
              {search.trim() ? 'Nenhum resultado para essa busca.' : 'Crie o primeiro requisito do projeto.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#fafbfc]">
                <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">ID</th>
                <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">Título</th>
                <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">Tipo</th>
                <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">Prioridade</th>
                <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleRequirements.map((req) => {
                const priority = PRIORITY_CONFIG[req.priority] || PRIORITY_CONFIG.MEDIUM
                const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.OPEN
                return (
                  <tr
                    key={req.id}
                    onClick={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}/requirements/${req.id}`)}
                    className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#fafbfc] transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4" style={{ borderLeft: `3px solid ${priority.bar}` }}>
                      <span className="text-xs font-mono font-semibold text-[#191c1e]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {requirementCodeMap[req.id] || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-[#191c1e]">{req.title}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-[#45464d]">{TYPE_LABELS[req.type]}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md"
                        style={{ backgroundColor: priority.badgeBg, color: priority.badgeText }}
                      >
                        {priority.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-[#45464d]">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {visibleRequirements.length > 0 && (
          <div className="px-5 py-3 border-t border-[#e5e7eb] flex items-center justify-between">
            <span className="text-xs text-[#9ca3af]">Exibindo {visibleRequirements.length} de {requirements.length} requisitos</span>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-[520px] p-7 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

            {step === 'select' ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-[#191c1e]">Novo Requisito</h2>
                  <button onClick={() => setShowModal(false)} className="text-[#9ca3af] hover:text-black">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                </div>
                <p className="text-sm text-[#6b7280] mb-4">Selecione o tipo de requisito que deseja cadastrar:</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => selectTemplate('FUNCTIONAL')}
                    className="border border-[#d1d5db] rounded-xl p-5 text-left hover:border-[#191c1e] hover:bg-[#fafbfc] transition-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center mb-3">
                      <span className="text-red-600 text-xs font-bold">RF</span>
                    </div>
                    <p className="text-sm font-semibold text-[#191c1e]">Funcional</p>
                    <p className="text-xs text-[#6b7280] mt-0.5">O que o sistema deve fazer</p>
                  </button>
                  <button
                    onClick={() => selectTemplate('NON_FUNCTIONAL')}
                    className="border border-[#d1d5db] rounded-xl p-5 text-left hover:border-[#191c1e] hover:bg-[#fafbfc] transition-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                      <span className="text-blue-600 text-xs font-bold">RNF</span>
                    </div>
                    <p className="text-sm font-semibold text-[#191c1e]">Não Funcional</p>
                    <p className="text-xs text-[#6b7280] mt-0.5">Como o sistema deve se comportar</p>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <button onClick={() => setStep('select')} className="text-xs text-[#0058be] hover:underline mb-1 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 2L4 6l5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Voltar
                    </button>
                    <h2 className="text-lg font-bold text-[#191c1e]">
                      {step === 'FUNCTIONAL' ? 'Requisito Funcional' : 'Requisito Não Funcional'}
                    </h2>
                  </div>
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
                      placeholder="Ex: Autenticação de Usuário"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Descrição</label>
                    <textarea
                      value={form.description || ''}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3.5 py-2.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] resize-none"
                    />
                  </div>

                  {step === 'FUNCTIONAL' ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Ator envolvido</label>
                        <input
                          type="text"
                          value={form.actor || ''}
                          onChange={(e) => setForm((p) => ({ ...p, actor: e.target.value }))}
                          className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
                          placeholder="Ex: Usuário administrador"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Critérios de aceitação</label>
                        <ChecklistEditor
                          items={form.acceptanceCriteria || []}
                          onChange={(items) => setForm((p) => ({ ...p, acceptanceCriteria: items }))}
                          placeholder="Ex: Usuário deve receber e-mail de confirmação"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Categoria</label>
                      <input
                        type="text"
                        value={form.category || ''}
                        onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                        className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
                        placeholder="Ex: Performance, Segurança"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Pré-requisitos</label>
                    <p className="text-xs text-[#6b7280] mb-2">Outros requisitos que precisam estar concluídos antes deste.</p>
                    <div className="max-h-32 overflow-y-auto border border-[#d1d5db] rounded-lg p-2 space-y-1">
                      {allRequirements.length === 0 ? (
                        <p className="text-xs text-[#9ca3af] px-1 py-1">Nenhum outro requisito no projeto ainda.</p>
                      ) : (
                        allRequirements.map((req) => (
                          <label key={req.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-[#f7f9fb] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(form.prerequisiteIds || []).includes(req.id)}
                              onChange={() => toggleMultiSelect('prerequisiteIds', req.id)}
                              className="accent-black"
                            />
                            <span className="text-xs text-[#9ca3af] font-mono mr-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{requirementCodeMap[req.id]}</span>
                            <span className="text-sm text-[#191c1e]">{req.title}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Histórias relacionadas</label>
                    <div className="max-h-32 overflow-y-auto border border-[#d1d5db] rounded-lg p-2 space-y-1">
                      {userStories.length === 0 ? (
                        <p className="text-xs text-[#9ca3af] px-1 py-1">Nenhuma história de usuário no projeto ainda.</p>
                      ) : (
                        userStories.map((story) => (
                          <label key={story.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-[#f7f9fb] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(form.userStoryIds || []).includes(story.id)}
                              onChange={() => toggleMultiSelect('userStoryIds', story.id)}
                              className="accent-black"
                            />
                            <span className="text-sm text-[#191c1e]">Como {story.userType}, quero {story.feature}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Prioridade</label>
                      <select
                        value={form.priority || 'MEDIUM'}
                        onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                        className="w-full h-11 px-3 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] bg-white"
                      >
                        <option value="HIGH">Alta</option>
                        <option value="MEDIUM">Média</option>
                        <option value="LOW">Baixa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Status</label>
                      <select
                        value={form.status || 'OPEN'}
                        onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                        className="w-full h-11 px-3 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] bg-white"
                      >
                        <option value="OPEN">Aberto</option>
                        <option value="IN_PROGRESS">Em Análise</option>
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
              </>
            )}
          </div>
        </div>
      )}
    </ProjectLayout>
  )
}