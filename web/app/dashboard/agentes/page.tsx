import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function AgentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // NOTE: Ideally replace this with a DB-side view (e.g. vw_agent_stats) that
  // returns pre-aggregated totals per agent. The .limit(1000) below prevents OOM
  // on serverless but will silently under-count on large datasets.
  const [{ data: agents }, { data: visits }] = await Promise.all([
    supabase.from('profiles').select('id, name, role').order('name'),
    supabase.from('visits').select('agent_id, status').limit(1000),
  ])

  const visitsByAgent = new Map<string, { total: number; findings: number }>()
  for (const visit of visits ?? []) {
    const current = visitsByAgent.get(visit.agent_id) ?? { total: 0, findings: 0 }
    current.total += 1
    if (visit.status === 'visitado_com_achado') current.findings += 1
    visitsByAgent.set(visit.agent_id, current)
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Dashboard</p>
            <h1 className="text-3xl font-black text-slate-900">Agentes e perfis</h1>
          </div>
          <Link href="/dashboard" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            Voltar ao dashboard
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Nome</th>
                <th className="px-5 py-4 font-semibold">Role</th>
                <th className="px-5 py-4 font-semibold">Perfil</th>
                <th className="px-5 py-4 font-semibold">Visitas</th>
                <th className="px-5 py-4 font-semibold">Com achado</th>
              </tr>
            </thead>
            <tbody>
              {(agents ?? []).map((agent) => {
                const agentStats = visitsByAgent.get(agent.id) ?? { total: 0, findings: 0 }
                return (
                  <tr key={agent.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-medium text-slate-900">{agent.name}</td>
                    <td className="px-5 py-4 text-slate-600">{agent.role}</td>
                    <td className="px-5 py-4 text-slate-600">{agent.id.slice(0, 8)}…</td>
                    <td className="px-5 py-4 text-slate-600">{agentStats.total}</td>
                    <td className="px-5 py-4 text-slate-600">{agentStats.findings}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
