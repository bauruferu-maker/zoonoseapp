'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { createClient } from '../lib/supabase-browser'
import { IconClipboard, IconBuilding, IconDashboard } from './Icons'

interface NavItem {
  href: string
  label: string
  icon: ReactNode
}

const NAV: NavItem[] = [
  { href: '/agent', label: 'Minha Fila', icon: <IconDashboard size={18} /> },
  { href: '/agent/imoveis', label: 'Meus Imoveis', icon: <IconBuilding size={18} /> },
  { href: '/agent/visitas', label: 'Minhas Visitas', icon: <IconClipboard size={18} /> },
]

export default function AgentSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [agentName, setAgentName] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()
      if (profile?.name) setAgentName(profile.name)
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const navContent = (
    <>
      <div className="px-5 pt-6 pb-4 border-b border-slate-100">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">ZoonoseApp</p>
        <p className="text-base font-bold text-slate-900 mt-0.5">Painel do Agente</p>
        {agentName && <p className="text-xs text-slate-500 mt-1 truncate">{agentName}</p>}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== '/agent' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          Sair
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform md:static md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {navContent}
      </aside>
    </>
  )
}
