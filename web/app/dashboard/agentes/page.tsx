import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '../../../lib/supabase-server'
import AutoToast from '../../../components/AutoToast'

export const dynamic = 'force-dynamic'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gestor',
  coordinator: 'Coordenador',
  agent: 'Agente',
}

export default async function AgentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Role check: only admin and manager can access this page (P002, P003)
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!currentProfile || !['admin', 'manager'].includes(currentProfile.role)) {
    redirect('/dashboard?acesso=negado')
  }

  // Use aggregate approach to avoid the .limit(1000) silent under-count (P013)
  // First fetch all agents, then use a count-based approach via a separate query
  const [{ data: agents }, { data: visitCounts }] = await Promise.all([
    supabase.from('profiles').select('id, name, role, sector_id, sectors(name, code)').order('name'),
    supabase
      .from('visits')
      .select('agent_id, status')
      .not('agent_id', 'is', null),
  ])

  const visitsByAgent = new Map<string, { total: number; findings: number }>()
  for (const visit of visitCounts ?? []) {
    const current = visitsByAgent.get(visit.agent_id) ?? { total: 0, findings: 0 }
    current.total += 1
    if (visit.status === 'visitado_com_achado') current.findings += 1
    visitsByAgent.set(visit.agent_id, current)
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <Suspense fallback={null}><AutoToast /></Suspense>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Dashboard</p>
            <h1 className="text-3xl font-black text-slate-900">Agentes e perfis</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/admin/usuarios" className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition">
              Gerenciar Usuários
            </Link>
            <Link href="/dashboard" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              Voltar
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Nome</th>
                <th className="px-5 py-4 font-semibold">Cargo</th>
                <th className="px-5 py-4 font-semibold">Setor</th>
                <th className="px-5 py-4 font-semibold">Visitas</th>
                <th className="px-5 py-4 font-semibold">Com achado</th>
                <th className="px-5 py-4 font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody>
              {(agents ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    Nenhum agente encontrado
                  </td>
                </tr>
              ) : (
                (agents ?? []).map((agent) => {
                  const agentStats = visitsByAgent.get(agent.id) ?? { total: 0, findings: 0 }
                  const sector = (agent as any).sectors // eslint-disable-line @typescript-eslint/no-explicit-any
                  return (
                    <tr key={agent.id} className="border-t border-slate-100">
                      <td className="px-5 py-4 font-medium text-slate-900">{agent.name}</td>
                      <td className="px-5 py-4 text-slate-600">{ROLE_LABELS[agent.role] ?? agent.role}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {sector ? `${sector.name}${sector.code ? ` (${sector.code})` : ''}` : <span className="text-slate-400 italic text-xs">Sem setor</span>}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{agentStats.total}</td>
                      <td className="px-5 py-4 text-slate-600">{agentStats.findings}</td>
                      <td className="px-5 py-4">
                        <Link href={`/dashboard/admin/usuarios/${agent.id}`} className="font-semibold text-emerald-700 hover:underline text-sm">
                          Editar
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
