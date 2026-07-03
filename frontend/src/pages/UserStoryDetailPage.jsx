import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProjectLayout from '../components/ProjectLayout'
import ChecklistEditor from '../components/ChecklistEditor'
import api from '../services/api'
import { getRequirementCodeMap, getUserStoryCodeMap } from '../utils/codes'

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

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR')
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5">{label}</p>
      <div className="text-sm text-[#191c1e]">{children}</div>
    </div>
  )
}

export default function UserStoryDetailPage() {
  const { workspaceId, projectId, storyId } = useParams()

  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [allStories, setAllStories] = useState([])
  const [allRequirements, setAllRequirements] = useState([])

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  const userStoryCodeMap = useMemo(() => getUserStoryCodeMap(allStories), [allStories])
  const requirementCodeMap = useMemo(() => getRequirementCodeMap(allRequirements), [allRequirements])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get(`/projects/${projectId}/user-stories/${storyId}`)
        setStory(data)
      } catch (err) {
        console.error(err)
        setError(err.response?.data?.error || 'Erro ao carregar história')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId, storyId])

  useEffect(() => {
    api.get(`/projects/${projectId}/user-stories`).then(({ data }) => setAllStories(data)).catch((err) => console.error(err))
    api.get(`/projects/${projectId}/requirements`).then(({ data }) => setAllRequirements(data)).catch((err) => console.error(err))
  }, [projectId])

  async function toggleCriterion(criterionId, done) {
    setStory((prev) => ({
      ...prev,
      acceptanceCriteria: prev.acceptanceCriteria.map((c) => (c.id === criterionId ? { ...c, done } : c)),
    }))
    try {
      await api.patch(`/projects/${projectId}/user-stories/${storyId}/acceptance-criteria/${criterionId}`, { done })
    } catch (err) {
      console.error(err)
      setStory((prev) => ({
        ...prev,
        acceptanceCriteria: prev.acceptanceCriteria.map((c) => (c.id === criterionId ? { ...c, done: !done } : c)),
      }))
    }
  }

  function startEditing() {
    setEditForm({
      userType: story.userType,
      feature: story.feature,
      benefit: story.benefit,
      priority: story.priority,
      status: story.status,
      acceptanceCriteria: story.acceptanceCriteria.map((c) => c.text),
      requirementIds: story.requirements.map((r) => r.id),
    })
    setSaveError('')
    setIsEditing(true)
  }

  function toggleEditRequirement(id) {
    setEditForm((p) => {
      const current = p.requirementIds || []
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
      return { ...p, requirementIds: next }
    })
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    setSaveError('')

    if (!editForm.userType?.trim() || !editForm.feature?.trim() || !editForm.benefit?.trim()) {
      setSaveError('Persona, ação e valor são obrigatórios')
      return
    }

    setSaving(true)
    try {
      const { data } = await api.put(`/projects/${projectId}/user-stories/${storyId}`, editForm)
      setStory(data)
      setIsEditing(false)
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Erro ao salvar história')
    } finally {
      setSaving(false)
    }
  }

  const basePath = `/workspaces/${workspaceId}/projects/${projectId}/user-stories`
  const requirementBasePath = `/workspaces/${workspaceId}/projects/${projectId}/requirements`
  const priority = story ? PRIORITY_CONFIG[story.priority] || PRIORITY_CONFIG.P2 : null
  const status = story ? STATUS_CONFIG[story.status] || STATUS_CONFIG.DRAFT : null

  return (
    <ProjectLayout
      title="Detalhes da História"
      subtitle="Informações completas da história de usuário selecionada."
      hideHeader
      actions={
        <div className="flex items-center gap-3">
          <Link
            to={basePath}
            className="h-10 px-4 border border-[#d1d5db] rounded-lg text-sm font-medium text-[#45464d] hover:bg-[#f7f9fb] transition-colors flex items-center gap-2"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M9 2L4 6l5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Voltar para Histórias
          </Link>
          {story && !isEditing && (
            <button
              onClick={startEditing}
              className="inline-flex items-center gap-2 h-10 px-4 bg-black text-white text-sm font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9.5 2L12 4.5 5 11.5 2 12l0.5-3L9.5 2z" stroke="white" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
              Editar
            </button>
          )}
        </div>
      }
    >
      {loading ? (
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-10 text-center text-sm text-[#9ca3af]">Carregando...</div>
      ) : error ? (
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-10 text-center">
          <p className="text-sm font-semibold text-[#191c1e] mb-1">Não foi possível carregar a história</p>
          <p className="text-sm text-[#6b7280]">{error}</p>
        </div>
      ) : isEditing ? (
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#191c1e] mb-5">Editar História</h2>

          {saveError && <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{saveError}</div>}

          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Como (persona)</label>
              <input
                type="text"
                value={editForm.userType || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, userType: e.target.value }))}
                className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Quero (ação)</label>
              <input
                type="text"
                value={editForm.feature || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, feature: e.target.value }))}
                className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Para (valor)</label>
              <input
                type="text"
                value={editForm.benefit || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, benefit: e.target.value }))}
                className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Critérios de aceitação</label>
              <ChecklistEditor
                items={editForm.acceptanceCriteria || []}
                onChange={(items) => setEditForm((p) => ({ ...p, acceptanceCriteria: items }))}
                placeholder="Ex: Arquivo exportado deve abrir no Excel"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Requisitos relacionados</label>
              <div className="max-h-32 overflow-y-auto border border-[#d1d5db] rounded-lg p-2 space-y-1">
                {allRequirements.length === 0 ? (
                  <p className="text-xs text-[#9ca3af] px-1 py-1">Nenhum requisito no projeto ainda.</p>
                ) : (
                  allRequirements.map((req) => (
                    <label key={req.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-[#f7f9fb] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(editForm.requirementIds || []).includes(req.id)}
                        onChange={() => toggleEditRequirement(req.id)}
                        className="accent-black"
                      />
                      <span className="text-xs text-[#9ca3af] font-mono mr-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{requirementCodeMap[req.id]}</span>
                      <span className="text-sm text-[#191c1e]">{req.title}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Prioridade</label>
                <select
                  value={editForm.priority || 'P2'}
                  onChange={(e) => setEditForm((p) => ({ ...p, priority: e.target.value }))}
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
                  value={editForm.status || 'DRAFT'}
                  onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
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
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 h-10 border border-[#d1d5db] rounded-lg text-sm font-semibold text-[#45464d] hover:bg-[#f7f9fb]">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="flex-1 h-10 bg-black text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[#e5e7eb]">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-flex text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
                style={{ backgroundColor: status.bg, color: status.text }}
              >
                {status.label}
              </span>
              <span className="text-xs font-bold" style={{ color: priority.color }}>{priority.label}</span>
              <span className="text-xs text-[#9ca3af] font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {userStoryCodeMap[story.id] || story.id}
              </span>
            </div>
            <p className="text-lg font-bold text-[#191c1e]">
              Como <span className="text-[#2563eb]">{story.userType}</span>, quero {story.feature}
            </p>
            <p className="text-sm text-[#6b7280] mt-1">Para {story.benefit}</p>
          </div>

          <div className="p-6 space-y-6">
            <Field label="Critérios de aceitação">
              {story.acceptanceCriteria?.length > 0 ? (
                <ul className="space-y-1.5">
                  {story.acceptanceCriteria.map((c) => (
                    <li key={c.id} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={c.done}
                        onChange={(e) => toggleCriterion(c.id, e.target.checked)}
                        className="mt-0.5 accent-black cursor-pointer"
                      />
                      <span className={c.done ? 'line-through text-[#9ca3af]' : ''}>{c.text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-[#9ca3af]">Não informado</span>
              )}
            </Field>

            <Field label="Requisitos relacionados">
              {story.requirements?.length > 0 ? (
                <ul className="space-y-1.5">
                  {story.requirements.map((req) => (
                    <li key={req.id}>
                      <Link to={`${requirementBasePath}/${req.id}`} className="inline-flex items-center gap-2 hover:underline">
                        <span className="text-xs text-[#9ca3af] font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{requirementCodeMap[req.id] || req.id}</span>
                        <span className="text-[#0058be]">{req.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-[#9ca3af]">Nenhum</span>
              )}
            </Field>

            <Field label="Pré-requisitos herdados">
              {story.inheritedPrerequisites?.length > 0 ? (
                <ul className="space-y-1.5">
                  {story.inheritedPrerequisites.map((req) => (
                    <li key={req.id}>
                      <Link to={`${requirementBasePath}/${req.id}`} className="inline-flex items-center gap-2 hover:underline">
                        <span className="text-xs text-[#9ca3af] font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{requirementCodeMap[req.id] || req.id}</span>
                        <span className="text-[#0058be]">{req.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-[#9ca3af]">Nenhum</span>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#f3f4f6]">
              <Field label="Criado em">{formatDate(story.createdAt)}</Field>
              <Field label="Atualizado em">{formatDate(story.updatedAt)}</Field>
            </div>
          </div>
        </div>
      )}
    </ProjectLayout>
  )
}
