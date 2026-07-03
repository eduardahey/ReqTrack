import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProjectLayout from '../components/ProjectLayout'
import ChecklistEditor from '../components/ChecklistEditor'
import api from '../services/api'
import { getRequirementCodeMap, getUserStoryCodeMap } from '../utils/codes'

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

export default function RequirementDetailPage() {
  const { workspaceId, projectId, requirementId } = useParams()

  const [requirement, setRequirement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [allRequirements, setAllRequirements] = useState([])
  const [allUserStories, setAllUserStories] = useState([])

  const requirementCodeMap = useMemo(() => getRequirementCodeMap(allRequirements), [allRequirements])
  const userStoryCodeMap = useMemo(() => getUserStoryCodeMap(allUserStories), [allUserStories])

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get(`/projects/${projectId}/requirements/${requirementId}`)
        setRequirement(data)
      } catch (err) {
        console.error(err)
        setError(err.response?.data?.error || 'Erro ao carregar requisito')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId, requirementId])

  useEffect(() => {
    api.get(`/projects/${projectId}/requirements`).then(({ data }) => setAllRequirements(data)).catch((err) => console.error(err))
    api.get(`/projects/${projectId}/user-stories`).then(({ data }) => setAllUserStories(data)).catch((err) => console.error(err))
  }, [projectId])

  function startEditing() {
    setEditForm({
      title: requirement.title,
      description: requirement.description || '',
      actor: requirement.actor || '',
      category: requirement.category || '',
      priority: requirement.priority,
      status: requirement.status,
      acceptanceCriteria: requirement.acceptanceCriteria.map((c) => c.text),
      userStoryIds: requirement.userStories.map((s) => s.id),
      prerequisiteIds: requirement.prerequisites.map((r) => r.id),
    })
    setSaveError('')
    setIsEditing(true)
  }

  function toggleEditMultiSelect(field, id) {
    setEditForm((p) => {
      const current = p[field] || []
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
      return { ...p, [field]: next }
    })
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    setSaveError('')

    if (!editForm.title?.trim()) {
      setSaveError('Título é obrigatório')
      return
    }

    setSaving(true)
    try {
      const { data } = await api.put(`/projects/${projectId}/requirements/${requirementId}`, editForm)
      setRequirement(data)
      setIsEditing(false)
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Erro ao salvar requisito')
    } finally {
      setSaving(false)
    }
  }

  async function toggleCriterion(criterionId, done) {
    setRequirement((prev) => ({
      ...prev,
      acceptanceCriteria: prev.acceptanceCriteria.map((c) => (c.id === criterionId ? { ...c, done } : c)),
    }))
    try {
      await api.patch(`/projects/${projectId}/requirements/${requirementId}/acceptance-criteria/${criterionId}`, { done })
    } catch (err) {
      console.error(err)
      setRequirement((prev) => ({
        ...prev,
        acceptanceCriteria: prev.acceptanceCriteria.map((c) => (c.id === criterionId ? { ...c, done: !done } : c)),
      }))
    }
  }

  const basePath = `/workspaces/${workspaceId}/projects/${projectId}/requirements`
  const priority = requirement ? PRIORITY_CONFIG[requirement.priority] || PRIORITY_CONFIG.MEDIUM : null
  const status = requirement ? STATUS_CONFIG[requirement.status] || STATUS_CONFIG.OPEN : null

  return (
    <ProjectLayout
      title="Detalhes do Requisito"
      subtitle="Informações completas do requisito selecionado."
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
            Voltar para Requisitos
          </Link>
          {requirement && !isEditing && (
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
          <p className="text-sm font-semibold text-[#191c1e] mb-1">Não foi possível carregar o requisito</p>
          <p className="text-sm text-[#6b7280]">{error}</p>
        </div>
      ) : isEditing ? (
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#191c1e] mb-5">Editar Requisito</h2>

          {saveError && <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{saveError}</div>}

          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Título</label>
              <input
                type="text"
                value={editForm.title || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Descrição</label>
              <textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full px-3.5 py-2.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] resize-none"
              />
            </div>

            {requirement.type === 'FUNCTIONAL' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Ator envolvido</label>
                  <input
                    type="text"
                    value={editForm.actor || ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, actor: e.target.value }))}
                    className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Critérios de aceitação</label>
                  <ChecklistEditor
                    items={editForm.acceptanceCriteria || []}
                    onChange={(items) => setEditForm((p) => ({ ...p, acceptanceCriteria: items }))}
                    placeholder="Ex: Usuário deve receber e-mail de confirmação"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Categoria</label>
                <input
                  type="text"
                  value={editForm.category || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Pré-requisitos</label>
              <p className="text-xs text-[#6b7280] mb-2">Outros requisitos que precisam estar concluídos antes deste.</p>
              <div className="max-h-32 overflow-y-auto border border-[#d1d5db] rounded-lg p-2 space-y-1">
                {allRequirements.filter((r) => r.id !== requirementId).length === 0 ? (
                  <p className="text-xs text-[#9ca3af] px-1 py-1">Nenhum outro requisito no projeto.</p>
                ) : (
                  allRequirements.filter((r) => r.id !== requirementId).map((req) => (
                    <label key={req.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-[#f7f9fb] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(editForm.prerequisiteIds || []).includes(req.id)}
                        onChange={() => toggleEditMultiSelect('prerequisiteIds', req.id)}
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
                {allUserStories.length === 0 ? (
                  <p className="text-xs text-[#9ca3af] px-1 py-1">Nenhuma história de usuário no projeto ainda.</p>
                ) : (
                  allUserStories.map((story) => (
                    <label key={story.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-[#f7f9fb] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(editForm.userStoryIds || []).includes(story.id)}
                        onChange={() => toggleEditMultiSelect('userStoryIds', story.id)}
                        className="accent-black"
                      />
                      <span className="text-xs text-[#9ca3af] font-mono mr-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{userStoryCodeMap[story.id]}</span>
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
                  value={editForm.priority || 'MEDIUM'}
                  onChange={(e) => setEditForm((p) => ({ ...p, priority: e.target.value }))}
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
                  value={editForm.status || 'OPEN'}
                  onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                  className="w-full h-11 px-3 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] bg-white"
                >
                  <option value="OPEN">Aberto</option>
                  <option value="IN_PROGRESS">Em Análise</option>
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
          <div className="px-6 py-5 border-b border-[#e5e7eb]" style={{ borderLeft: `3px solid ${priority.bar}` }}>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-flex text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md"
                style={{ backgroundColor: priority.badgeBg, color: priority.badgeText }}
              >
                {priority.label}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm text-[#45464d]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
                {status.label}
              </span>
              <span className="text-xs text-[#9ca3af] font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {requirementCodeMap[requirement.id] || requirement.id}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#191c1e]">{requirement.title}</h2>
          </div>

          <div className="p-6 space-y-6">
            <Field label="Descrição">
              {requirement.description ? (
                <p className="whitespace-pre-wrap">{requirement.description}</p>
              ) : (
                <span className="text-[#9ca3af]">Nenhuma descrição informada.</span>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-6">
              <Field label="Tipo">{TYPE_LABELS[requirement.type] || requirement.type}</Field>
              <Field label="Status">{status.label}</Field>
            </div>

            {requirement.type === 'FUNCTIONAL' ? (
              <>
                <Field label="Ator envolvido">
                  {requirement.actor || <span className="text-[#9ca3af]">Não informado</span>}
                </Field>
                <Field label="Critérios de aceitação">
                  {requirement.acceptanceCriteria?.length > 0 ? (
                    <ul className="space-y-1.5">
                      {requirement.acceptanceCriteria.map((c) => (
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
              </>
            ) : (
              <Field label="Categoria">
                {requirement.category || <span className="text-[#9ca3af]">Não informado</span>}
              </Field>
            )}

            <div className="grid grid-cols-2 gap-6">
              <Field label="Pré-requisitos">
                {requirement.prerequisites?.length > 0 ? (
                  <ul className="space-y-1.5">
                    {requirement.prerequisites.map((req) => (
                      <li key={req.id}>
                        <Link to={`${basePath}/${req.id}`} className="inline-flex items-center gap-2 hover:underline">
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
              <Field label="Pré-requisito de">
                {requirement.requiredBy?.length > 0 ? (
                  <ul className="space-y-1.5">
                    {requirement.requiredBy.map((req) => (
                      <li key={req.id}>
                        <Link to={`${basePath}/${req.id}`} className="inline-flex items-center gap-2 hover:underline">
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
            </div>

            {requirement.userStories?.length > 0 && (
              <Field label="Histórias de usuário vinculadas">
                <ul className="space-y-1.5">
                  {requirement.userStories.map((story) => (
                    <li key={story.id}>
                      <Link
                        to={`/workspaces/${workspaceId}/projects/${projectId}/user-stories/${story.id}`}
                        className="inline-flex items-center gap-2 hover:underline"
                      >
                        <span className="text-xs text-[#9ca3af] font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{userStoryCodeMap[story.id] || story.id}</span>
                        <span className="text-[#0058be]">Como {story.userType}, quero {story.feature}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#f3f4f6]">
              <Field label="Criado em">{formatDate(requirement.createdAt)}</Field>
              <Field label="Atualizado em">{formatDate(requirement.updatedAt)}</Field>
            </div>
          </div>
        </div>
      )}
    </ProjectLayout>
  )
}
