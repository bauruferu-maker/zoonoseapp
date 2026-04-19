'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { createClient } from '../lib/supabase-browser'
import {
  IconDashboard, IconMap, IconClipboard, IconBuilding,
  IconUsers, IconListTodo, IconTrendingUp, IconSearch,
} from './Icons'

interface NavItem {
  href: string
  label: string
  icon: ReactNode
  roles: string[]
}

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <IconDashboard size={18} />, roles: ['manager', 'coordinator', 'admin'] },
  { href: '/dashboard/map', label: 'Mapa Operacional', icon: <IconMap size={18} />, roles: ['manager', 'coordinator', 'admin'] },
  { href: '/dashboard/visits', label: 'Visitas', icon: <IconClipboard size={18} />, roles: ['manager', 'coordinator', 'admin'] },
  { href: '/dashboard/imoveis', label: 'Imoveis', icon: <IconBuilding size={18} />, roles: ['manager', 'coordinator', 'admin'] },
  { href: '/dashboard/agentes', label: 'Agentes', icon: <IconUsers size={18} />, roles: ['manager', 'admin'] },
  { href: '/dashboard/routes', label: 'Fila de Trabalho', icon: <IconListTodo size={18} />, roles: ['manager', 'coordinator', 'admin'] },
  { href: '/dashboard/reports', label: 'Relatorios', icon: <IconTrendingUp size={18} />, roles: ['manager', 'admin'] },
  { href: '/dashboard/quality', label: 'Qualidade', icon: <IconSearch size={18} />, roles: ['manager', 'admin'] },
]

const ROLE_TITLES: Record<string, string> = {
  manager: 'Painel do Gestor',
  coordinator: 'Painel do Coordenador',
  admin: 'Painel Administrativo',
  agent: 'Painel do Agente',
}

const ROLE_LABELS: Record<string, string> = {
  manager: 'Gestor',
  coordinator: 'Coordenador',
  admin: 'Administrador',
  agent: 'Agente',
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<{ name: string; role: string; sector_id: string | null } | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('name, role, sector_id').eq('id', user.id).single()
          .then(({ data }) => { if (data) setProfile(data) })
      }
    })
  }, [])

  // Fechar sidebar ao navegar (mobile)
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const role = profile?.role ?? null
  const visibleNav = role ? NAV.filter(item => item.roles.includes(role)) : []

  const handleLogout = async () => {
    if (!confirm('Deseja sair do sistema?')) return
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Botao hamburger — visivel so no mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 bg-green-800 text-white rounded-lg p-2 shadow-lg"
        aria-label="Abrir menu"
      >
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay escuro — mobile only */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-64 bg-green-900 text-white min-h-screen flex flex-col print:hidden
          transform transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        `}
      >
        <div className="p-5 border-b border-green-800 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">ZoonoseApp</h1>
            <p className="text-green-300 text-xs mt-1">{ROLE_TITLES[role ?? ''] ?? 'Painel'}</p>
          </div>
          {/* Botao fechar — mobile only */}
          <button
            onClick={() => setOpen(false)}
            className="md:hidden text-green-300 hover:text-white"
            aria-label="Fechar menu"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-700 text-white'
                    : 'text-green-200 hover:bg-green-800 hover:text-white'
                }`}
              >
                <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-green-800">
          {profile && (
            <div className="mb-3">
              <p className="text-sm font-medium text-green-100 truncate">{profile.name}</p>
              <p className="text-xs text-green-400">{ROLE_LABELS[role ?? ''] ?? role ?? ''}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs text-green-400 hover:text-white transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
