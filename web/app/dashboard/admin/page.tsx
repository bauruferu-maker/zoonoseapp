import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function AdminHubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['manager', 'admin'].includes(profile.role)) {
    redirect('/dashboard?acesso=negado')
  }

  // Quick stats
  const [{ count: totalUsers }, { count: totalAgents }] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'agent'),
  ])

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Administração</p>
          <h1 className="text-3xl font-black text-slate-900">Painel Admin</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie usuários, setores e configurações do sistema.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Total de Usuários</p>
            <p className="text-3xl font-black text-slate-900">{totalUsers ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Agentes de Campo</p>
            <p className="text-3xl font-black text-emerald-700">{totalAgents ?? 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/dashboard/admin/usuarios"
            className="rounded-3xl border border-slate-200 bg-white p-6 hover:border-emerald-300 hover:shadow-sm transition group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <svg className="h-5 w-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="font-bold text-slate-900 group-hover:text-emerald-700 transition">Gerenciar Usuários</h2>
            </div>
            <p className="text-sm text-slate-500">Editar perfis, alterar cargos e atribuir setores aos agentes.</p>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-3xl border border-slate-200 bg-white p-6 hover:border-slate-300 hover:shadow-sm transition group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h2 className="font-bold text-slate-900 group-hover:text-slate-700 transition">Voltar ao Dashboard</h2>
            </div>
            <p className="text-sm text-slate-500">Ver visitas, relatórios e métricas operacionais.</p>
          </Link>
        </div>
      </div>
    </main>
  )
}
