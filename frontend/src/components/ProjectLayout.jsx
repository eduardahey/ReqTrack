import { useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import api from '../services/api'

const NAV_ITEMS = [
  { key: 'stakeholders', label: 'Stakeholders', path: 'stakeholders', icon: 'people' },
  { key: 'requirements', label: 'Requisitos', path: 'requirements', icon: 'doc' },
  { key: 'user-stories', label: 'Histórias', path: 'user-stories', icon: 'stories' },
  { key: 'meetings', label: 'Reuniões', path: 'meetings', icon: 'list' },
  { key: 'settings', label: 'Configurações', path: 'settings', icon: 'gear' },
]

function NavIcon({ name, active }) {
  const color = active ? 'white' : '#45464d'
  switch (name) {
    case 'people':
      return (
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
          <circle cx="6" cy="5.5" r="2.2" stroke={color} strokeWidth="1.4" />
          <path d="M2 14c0-2.5 1.8-4 4-4s4 1.5 4 4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="12.5" cy="6" r="1.8" stroke={color} strokeWidth="1.3" />
          <path d="M10.5 14c0-2 1.3-3.5 3-3.7" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      )
    case 'doc':
      return (
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
          <rect x="3" y="2" width="11" height="13" rx="1.3" stroke={color} strokeWidth="1.4" />
          <path d="M5.5 6h6M5.5 9h6M5.5 12h3.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      )
    case 'list':
      return (
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
          <rect x="2.5" y="2.5" width="12" height="12" rx="1.3" stroke={color} strokeWidth="1.4" />
          <path d="M5.5 6.5h6M5.5 9h6M5.5 11.5h4" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      )
    case 'stories':
      return (
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
          <path d="M3 3.5c1.5-.7 3.3-.7 4.5 0v10c-1.2-.7-3-.7-4.5 0v-10z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M14 3.5c-1.5-.7-3.3-.7-4.5 0v10c1.2-.7 3-.7 4.5 0v-10z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      )
    case 'gear':
      return (
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
          <circle cx="8.5" cy="8.5" r="2.3" stroke={color} strokeWidth="1.4" />
          <path d="M8.5 2.5v1.8M8.5 12.2V14M3.5 8.5h1.8M11.7 8.5h1.8M5 5l1.2 1.2M12 5l-1.2 1.2M5 12l1.2-1.2M12 12l-1.2-1.2" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

export default function ProjectLayout({ children, title, subtitle, actions, hideHeader = false }) {
  const { workspaceId, projectId } = useParams()
  const location = useLocation()

  const [workspace, setWorkspace] = useState(null)
  const [project, setProject] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [wsRes] = await Promise.all([api.get(`/workspaces/${workspaceId}`)])
        setWorkspace(wsRes.data)
        const { data: projects } = await api.get(`/workspaces/${workspaceId}/projects`)
        const found = projects.find((p) => p.id === projectId)
        setProject(found)
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [workspaceId, projectId])

  const basePath = `/workspaces/${workspaceId}/projects/${projectId}`

  return (
    <div className="min-h-screen flex bg-[#f7f9fb]" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Sidebar */}
      <aside className="w-[280px] bg-white border-r border-[#e5e7eb] flex flex-col shrink-0 min-h-screen">
        <div className="px-6 py-5 border-b border-[#e5e7eb]">
          <Link to="/workspaces" className="flex items-center gap-2 mb-1 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-md bg-[#00000] flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="30" height="30" rx="4" fill="black" />
                <path d="M15.5 12V6H23.5V12H15.5V12M5.5 16V6H13.5V16H5.5V16M15.5 24V14H23.5V24H15.5V24M5.5 24V18H13.5V24H5.5V24M7.5 14H11.5V8H7.5V14V14M17.5 22H21.5V16H17.5V22V22M17.5 10H21.5V8H17.5V10V10M7.5 22H11.5V20H7.5V22V22M11.5 14V14V14V14V14V14M17.5 10V10V10V10V10V10M17.5 16V16V16V16V16V16M11.5 20V20V20V20V20V20"
                fill="white" />
              </svg>
            </div>
            <span className="text-lg font-bold text-[#00000]">ReqTrack</span>
          </Link>
          <p className="text-xs text-[#6b7280] truncate">
            {project?.name || '...'} • PO Portal
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.filter((item) => item.key !== 'settings' || workspace?.role === 'ADMIN').map((item) => {
            const fullPath = `${basePath}/${item.path}`
            const isActive = location.pathname.startsWith(fullPath)
            return (
              <Link
                key={item.key}
                to={fullPath}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#2563eb] text-white' : 'text-[#45464d] hover:bg-[#f3f4f6]'
                }`}
              >
                <NavIcon name={item.icon} active={isActive} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top header */}
        {!hideHeader && (
          <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-30">
            <div className="flex items-center justify-between px-8 py-3.5 gap-6">
              <div className="flex-1 max-w-md relative">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <circle cx="7" cy="7" r="5" stroke="#9ca3af" strokeWidth="1.4" />
                  <path d="M11 11l3.5 3.5" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  placeholder="Procurar..."
                  className="w-full h-10 pl-10 pr-4 bg-[#f3f4f6] border border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-[#d1d5db] transition-all"
                />
              </div>

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
                <div className="w-9 h-9 rounded-full bg-[#191c1e] overflow-hidden flex items-center justify-center text-white text-xs font-semibold">
                  {workspace?.name?.charAt(0).toUpperCase() || '·'}
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Page content */}
        <main className="flex-grow px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
            <div>
              <h1 className="text-[26px] font-bold text-[#191c1e] tracking-tight mb-1">{title}</h1>
              {subtitle && <p className="text-sm text-[#6b7280] max-w-2xl">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
          </div>

          {children}
        </main>
      </div>
    </div>
  )
}