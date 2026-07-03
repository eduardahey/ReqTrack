import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfileMenu from '../components/ProfileMenu'
import api from '../services/api'

// Ícones rotativos para os workspaces (decorativo, baseado no índice)
const ICONS = [
  // share/nodes icon
  <svg key="0" width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="4" cy="9" r="2" stroke="white" strokeWidth="1.4" />
    <circle cx="14" cy="4" r="2" stroke="white" strokeWidth="1.4" />
    <circle cx="14" cy="14" r="2" stroke="white" strokeWidth="1.4" />
    <path d="M6 8l6-3M6 10l6 3" stroke="white" strokeWidth="1.4" />
  </svg>,
  // bookmark/tag icon
  <svg key="1" width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M4 3h7l4 4v7a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="#45464d" strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="7" cy="8" r="1" fill="#45464d" />
  </svg>,
  // terminal icon
  <svg key="2" width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="3" width="14" height="12" rx="1.5" stroke="#45464d" strokeWidth="1.4" />
    <path d="M5 7l2.5 2.5L5 12M9 12h4" stroke="#45464d" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
]

function getIcon(index) {
  return ICONS[index % ICONS.length]
}

export default function WorkspaceSelectorPage() {
  const navigate = useNavigate()

  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accessingId, setAccessingId] = useState(null)

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        const { data } = await api.get('/workspaces')
        setWorkspaces(data)
      } catch (err) {
        setError('Não foi possível carregar seus workspaces.')
      } finally {
        setLoading(false)
      }
    }
    loadWorkspaces()
  }, [])

  function handleAccess(workspaceId) {
    setAccessingId(workspaceId)
    setTimeout(() => navigate(`/workspaces/${workspaceId}`), 150)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header className="w-full border-b border-[#e5e7eb]">
        <div className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <svg width="26" height="26" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="30" height="30" rx="4" fill="black" />
              <path d="M15.5 12V6H23.5V12H15.5V12M5.5 16V6H13.5V16H5.5V16M15.5 24V14H23.5V24H15.5V24M5.5 24V18H13.5V24H5.5V24M7.5 14H11.5V8H7.5V14V14M17.5 22H21.5V16H17.5V22V22M17.5 10H21.5V8H17.5V10V10M7.5 22H11.5V20H7.5V22V22M11.5 14V14V14V14V14V14M17.5 10V10V10V10V10V10M17.5 16V16V16V16V16V16M11.5 20V20V20V20V20V20"
              fill="white" />
            </svg>
            <span className="text-base font-bold text-black tracking-tight">ReqTrack</span>
          </div>

          <div className="flex items-center gap-5">
            <button className="text-sm text-[#45464d] hover:text-black transition-colors">
              Ajuda
            </button>
            <ProfileMenu />
          </div>
        </div>
      </header>

      {/* Background gradient blob */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[420px] bg-[#fafbfc]" />
        <div className="absolute top-[60px] right-0 w-[600px] h-[400px] bg-gradient-to-br from-[#dae2fd]/40 to-transparent blur-[100px]" />
      </div>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-[560px]">

          <div className="text-center mb-9">
            <h1 className="text-[32px] font-bold text-[#191c1e] tracking-tight mb-2">
              Selecione o Workspace
            </h1>
            <p className="text-[15px] text-[#6b7280]">
              Escolha qual ambiente de trabalho você deseja acessar agora.
            </p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[76px] bg-[#f7f9fb] border border-[#e5e7eb] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workspaces.length === 0 ? (
                <div className="bg-[#fafbfc] border border-[#e5e7eb] rounded-xl p-10 text-center">
                  <p className="text-sm text-[#6b7280]">Você ainda não participa de nenhum workspace.</p>
                </div>
              ) : (
                workspaces.map((ws, i) => (
                  <button
                    key={ws.id}
                    onClick={() => handleAccess(ws.id)}
                    disabled={accessingId === ws.id}
                    className="w-full bg-white border border-[#e5e7eb] rounded-xl px-6 py-5 flex items-center justify-between hover:border-[#191c1e] hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all text-left disabled:opacity-60"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Icon box — admin gets dark, members get light */}
                      <div
                        className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: ws.role === 'ADMIN' ? '#191c1e' : '#f2f4f6' }}
                      >
                        {getIcon(i)}
                      </div>

                      <div className="min-w-0">
                        <p className="text-[17px] font-semibold text-[#191c1e] truncate">{ws.name}</p>
                        <span
                          className="inline-flex items-center mt-1 text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
                          style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            backgroundColor: ws.role === 'ADMIN' ? '#eef2ff' : '#f2f4f6',
                            color: ws.role === 'ADMIN' ? '#4338ca' : '#6b7280',
                          }}
                        >
                          {ws.role === 'ADMIN' ? 'Administrador' : 'Membro'}
                        </span>
                      </div>
                    </div>

                    {accessingId === ws.id && (
                      <svg className="animate-spin w-5 h-5 text-[#9ca3af] shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    )}
                  </button>
                ))
              )}

              {/* Criar novo workspace */}
              <button
                onClick={() => navigate('/register')}
                className="w-full border border-dashed border-[#d1d5db] rounded-xl px-6 py-5 flex items-center justify-center gap-2 hover:border-[#191c1e] hover:bg-[#fafbfc] transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7.5" stroke="#45464d" strokeWidth="1.3" />
                  <path d="M9 6v6M6 9h6" stroke="#45464d" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <span className="text-[15px] font-semibold text-[#191c1e]">Criar novo workspace</span>
              </button>
            </div>
          )}

          {/* Decorative bottom bars */}
          <div className="mt-10 flex gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex-1 h-1 rounded-full bg-[#e5e7eb]" />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#e5e7eb] bg-white">
        <div className="flex flex-col md:flex-row items-center justify-between px-8 py-5 max-w-7xl mx-auto gap-3">
          <span className="text-xs text-[#9ca3af]">© 2026 ReqTrack Systems. Todos os direitos reservados.</span>
          <div className="flex gap-5">
            {['Política de Privacidade', 'Termos de Serviço', 'Suporte'].map((item) => (
              <a key={item} href="#" className="text-xs text-[#9ca3af] hover:text-black transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}