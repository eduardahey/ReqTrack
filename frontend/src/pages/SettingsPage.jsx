import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ProjectLayout from '../components/ProjectLayout'
import api from '../services/api'

function formatDate(value) {
  return new Date(value).toLocaleDateString('pt-BR')
}

export default function SettingsPage() {
  const { workspaceId, projectId } = useParams()
  const navigate = useNavigate()

  const [myRole, setMyRole] = useState(null)
  const [loading, setLoading] = useState(true)

  const [project, setProject] = useState(null)
  const [projectForm, setProjectForm] = useState({ name: '', description: '' })
  const [projectSaving, setProjectSaving] = useState(false)
  const [projectError, setProjectError] = useState('')
  const [projectSaved, setProjectSaved] = useState(false)

  const [members, setMembers] = useState([])
  const [invites, setInvites] = useState([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [membersError, setMembersError] = useState('')

  const [inviteForm, setInviteForm] = useState({ email: '', role: 'MEMBER' })
  const [inviteSaving, setInviteSaving] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data: workspace } = await api.get(`/workspaces/${workspaceId}`)
        setMyRole(workspace.role)

        const { data: projects } = await api.get(`/workspaces/${workspaceId}/projects`)
        const found = projects.find((p) => p.id === projectId)
        setProject(found)
        if (found) setProjectForm({ name: found.name, description: found.description || '' })

        if (workspace.role === 'ADMIN') await loadMembers()
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [workspaceId, projectId])

  async function loadMembers() {
    setMembersLoading(true)
    setMembersError('')
    try {
      const { data } = await api.get(`/workspaces/${workspaceId}/members`)
      setMembers(data.members)
      setInvites(data.invites)
    } catch (err) {
      setMembersError(err.response?.data?.error || 'Erro ao carregar participantes')
    } finally {
      setMembersLoading(false)
    }
  }

  async function handleSaveProject(e) {
    e.preventDefault()
    setProjectError('')
    setProjectSaved(false)
    if (!projectForm.name.trim()) {
      setProjectError('Nome é obrigatório')
      return
    }
    setProjectSaving(true)
    try {
      const { data } = await api.put(`/workspaces/${workspaceId}/projects/${projectId}`, projectForm)
      setProject(data)
      setProjectSaved(true)
      setTimeout(() => setProjectSaved(false), 3000)
    } catch (err) {
      setProjectError(err.response?.data?.error || 'Erro ao salvar projeto')
    } finally {
      setProjectSaving(false)
    }
  }

  async function handleDeleteProject() {
    if (!window.confirm(`Excluir o projeto "${project?.name}"? Todos os requisitos, histórias, stakeholders e reuniões serão perdidos permanentemente.`)) return
    try {
      await api.delete(`/workspaces/${workspaceId}/projects/${projectId}`)
      navigate(`/workspaces/${workspaceId}`)
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao excluir projeto')
    }
  }

  async function handleRoleChange(memberId, role) {
    setMembersError('')
    try {
      const updated = await api.put(`/workspaces/${workspaceId}/members/${memberId}`, { role })
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: updated.data.role } : m)))
    } catch (err) {
      setMembersError(err.response?.data?.error || 'Erro ao atualizar cargo')
    }
  }

  async function handleRemoveMember(member) {
    if (!window.confirm(`Remover ${member.name} do workspace?`)) return
    setMembersError('')
    try {
      await api.delete(`/workspaces/${workspaceId}/members/${member.id}`)
      setMembers((prev) => prev.filter((m) => m.id !== member.id))
    } catch (err) {
      setMembersError(err.response?.data?.error || 'Erro ao remover participante')
    }
  }

  async function handleInvite(e) {
    e.preventDefault()
    setInviteError('')
    setInviteMessage('')
    if (!inviteForm.email.trim()) {
      setInviteError('E-mail é obrigatório')
      return
    }
    setInviteSaving(true)
    try {
      const { data } = await api.post(`/workspaces/${workspaceId}/invites`, inviteForm)
      if (data.type === 'member') {
        setInviteMessage(`${data.email} já tinha conta e foi adicionado(a) diretamente ao workspace.`)
      } else {
        setInviteMessage(`Convite enviado para ${data.email}.`)
      }
      setInviteForm({ email: '', role: 'MEMBER' })
      await loadMembers()
    } catch (err) {
      setInviteError(err.response?.data?.error || 'Erro ao convidar participante')
    } finally {
      setInviteSaving(false)
    }
  }

  async function handleResendInvite(invite) {
    setMembersError('')
    try {
      await api.post(`/workspaces/${workspaceId}/invites/${invite.id}/resend`)
      setInviteMessage(`Convite reenviado para ${invite.email}.`)
      setTimeout(() => setInviteMessage(''), 4000)
    } catch (err) {
      setMembersError(err.response?.data?.error || 'Erro ao reenviar convite')
    }
  }

  async function handleCancelInvite(invite) {
    if (!window.confirm(`Cancelar o convite para ${invite.email}?`)) return
    setMembersError('')
    try {
      await api.delete(`/workspaces/${workspaceId}/invites/${invite.id}`)
      setInvites((prev) => prev.filter((i) => i.id !== invite.id))
    } catch (err) {
      setMembersError(err.response?.data?.error || 'Erro ao cancelar convite')
    }
  }

  return (
    <ProjectLayout
      title="Configurações do Projeto"
      subtitle="Gerencie o projeto e os participantes do workspace."
      hideHeader
    >
      {loading ? (
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-10 text-center text-sm text-[#9ca3af]">Carregando...</div>
      ) : myRole !== 'ADMIN' ? (
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-10 text-center">
          <p className="text-sm font-semibold text-[#191c1e] mb-1">Acesso restrito</p>
          <p className="text-sm text-[#6b7280]">Apenas administradores do workspace podem acessar as configurações.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Project card */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
            <h2 className="text-base font-bold text-[#191c1e] mb-4">Projeto</h2>

            {projectError && <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{projectError}</div>}
            {projectSaved && <div className="mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">Projeto atualizado.</div>}

            <form onSubmit={handleSaveProject} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Nome do projeto</label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full h-11 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Descrição</label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={projectSaving} className="h-10 px-4 bg-black text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                  {projectSaving ? 'Salvando...' : 'Salvar alterações'}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProject}
                  className="h-10 px-4 border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors"
                >
                  Excluir projeto
                </button>
              </div>
            </form>
          </div>

          {/* Members card */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
            <h2 className="text-base font-bold text-[#191c1e] mb-1">Participantes do Workspace</h2>
            <p className="text-sm text-[#6b7280] mb-4">Pessoas com acesso a todos os projetos deste workspace.</p>

            {membersError && <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{membersError}</div>}
            {inviteMessage && <div className="mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{inviteMessage}</div>}

            <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-3 mb-5 pb-5 border-b border-[#f3f4f6]">
              <div className="flex-1 min-w-[220px]">
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Convidar por e-mail</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="nome@empresa.com"
                  className="w-full h-10 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Cargo</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value }))}
                  className="h-10 px-3 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be] bg-white"
                >
                  <option value="MEMBER">Membro</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <button type="submit" disabled={inviteSaving} className="h-10 px-4 bg-black text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                {inviteSaving ? 'Enviando...' : 'Convidar'}
              </button>
            </form>
            {inviteError && <div className="mb-4 -mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{inviteError}</div>}

            {membersLoading ? (
              <div className="p-6 text-center text-sm text-[#9ca3af]">Carregando participantes...</div>
            ) : (
              <>
                <table className="w-full mb-2">
                  <thead>
                    <tr className="border-b border-[#e5e7eb]">
                      <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-3 py-2">Nome</th>
                      <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-3 py-2">E-mail</th>
                      <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-3 py-2">Cargo</th>
                      <th className="text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-3 py-2">Desde</th>
                      <th className="text-right text-xs font-semibold text-[#6b7280] uppercase tracking-wide px-3 py-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id} className="border-b border-[#f3f4f6] last:border-0">
                        <td className="px-3 py-3 text-sm font-semibold text-[#191c1e]">
                          <div className="flex items-center gap-2">
                            {m.name}
                            {m.isOwner && (
                              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-[#dbeafe] text-[#1d4ed8]">
                                Criador
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-[#45464d]">{m.email}</td>
                        <td className="px-3 py-3">
                          {m.isOwner ? (
                            <span
                              title="O cargo do criador do workspace não pode ser alterado"
                              className="inline-flex h-8 items-center px-2 text-xs text-[#9ca3af]"
                            >
                              Administrador
                            </span>
                          ) : (
                            <select
                              value={m.role}
                              onChange={(e) => handleRoleChange(m.id, e.target.value)}
                              className="h-8 px-2 border border-[#d1d5db] rounded-md text-xs outline-none focus:border-[#0058be] bg-white"
                            >
                              <option value="MEMBER">Membro</option>
                              <option value="ADMIN">Administrador</option>
                            </select>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs text-[#9ca3af]">{formatDate(m.createdAt)}</td>
                        <td className="px-3 py-3 text-right">
                          {!m.isOwner && (
                            <button onClick={() => handleRemoveMember(m)} className="text-xs font-semibold text-red-600 hover:underline">
                              Remover
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {invites.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">Convites pendentes</p>
                    <table className="w-full">
                      <tbody>
                        {invites.map((invite) => (
                          <tr key={invite.id} className="border-b border-[#f3f4f6] last:border-0">
                            <td className="px-3 py-2.5 text-sm text-[#191c1e]">{invite.email}</td>
                            <td className="px-3 py-2.5">
                              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-[#fef3c7] text-[#92400e]">
                                {invite.role === 'ADMIN' ? 'Admin' : 'Membro'} · Pendente
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-[#9ca3af]">Expira em {formatDate(invite.expiresAt)}</td>
                            <td className="px-3 py-2.5 text-right space-x-3">
                              <button onClick={() => handleResendInvite(invite)} className="text-xs font-semibold text-[#0058be] hover:underline">
                                Reenviar
                              </button>
                              <button onClick={() => handleCancelInvite(invite)} className="text-xs font-semibold text-red-600 hover:underline">
                                Cancelar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </ProjectLayout>
  )
}
