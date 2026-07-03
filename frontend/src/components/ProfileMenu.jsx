import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

function initials(name) {
  return (name || '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function ProfileMenu() {
  const { user, logout, updateUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [form, setForm] = useState({ name: '', email: '', currentPassword: '', newPassword: '', confirmNewPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  function openEditModal() {
    setOpen(false)
    setForm({ name: user?.name || '', email: user?.email || '', currentPassword: '', newPassword: '', confirmNewPassword: '' })
    setError('')
    setSuccess(false)
    setShowEditModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!form.name.trim() || !form.email.trim()) {
      setError('Nome e e-mail são obrigatórios')
      return
    }
    if (form.newPassword && form.newPassword !== form.confirmNewPassword) {
      setError('As senhas não coincidem')
      return
    }

    setSaving(true)
    try {
      const { data } = await api.put('/auth/me', {
        name: form.name,
        email: form.email,
        currentPassword: form.currentPassword || undefined,
        newPassword: form.newPassword || undefined,
      })
      updateUser(data.user)
      setSuccess(true)
      setForm((p) => ({ ...p, currentPassword: '', newPassword: '', confirmNewPassword: '' }))
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full h-10 px-3.5 border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#0058be]'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full bg-[#191c1e] flex items-center justify-center text-white text-xs font-semibold hover:opacity-90 transition-opacity"
      >
        {initials(user?.name) || '··'}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-30 bg-white border border-[#e5e7eb] rounded-xl shadow-lg py-1 w-48 text-left">
          <div className="px-3 py-2 border-b border-[#f3f4f6]">
            <p className="text-sm font-semibold text-[#191c1e] truncate">{user?.name}</p>
            <p className="text-xs text-[#6b7280] truncate">{user?.email}</p>
          </div>
          <button onClick={openEditModal} className="w-full text-left px-3 py-2 text-sm text-[#191c1e] hover:bg-[#f7f9fb] flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9.5 2L12 4.5 5 11.5 2 12l0.5-3L9.5 2z" stroke="#45464d" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            Editar perfil
          </button>
          <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5.5 12.5H3a1 1 0 01-1-1v-9a1 1 0 011-1h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9.5 9.5L13 6 9.5 2.5M13 6H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sair
          </button>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-[440px] p-7 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#191c1e]">Editar perfil</h2>
              <button onClick={() => setShowEditModal(false)} className="text-[#9ca3af] hover:text-black">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>

            {error && <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
            {success && <div className="mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">Perfil atualizado com sucesso.</div>}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Nome</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">E-mail</label>
                <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className={inputClass} />
              </div>

              <div className="pt-2 border-t border-[#f3f4f6]">
                <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">Trocar senha (opcional)</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Senha atual</label>
                    <input type="password" value={form.currentPassword} onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Nova senha</label>
                    <input type="password" value={form.newPassword} onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))} className={inputClass} placeholder="Mínimo 6 caracteres" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Confirmar nova senha</label>
                    <input type="password" value={form.confirmNewPassword} onChange={(e) => setForm((p) => ({ ...p, confirmNewPassword: e.target.value }))} className={inputClass} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 h-10 border border-[#d1d5db] rounded-lg text-sm font-semibold text-[#45464d] hover:bg-[#f7f9fb]">
                  Fechar
                </button>
                <button type="submit" disabled={saving} className="flex-1 h-10 bg-black text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
