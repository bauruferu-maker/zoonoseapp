import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase-server'
import { STATUS_LABELS, STATUS_COLORS } from '../../lib/visit-status'

export const dynamic = 'force-dynamic'

export default async function AgentHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role, sector_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'agent') redirect('/dashboard')

  // Fetch sector
  const { data: sector } = profile.sector_id
    ? await supabase.from('sectors').select('name, code').eq('id', profile.sector_id).single()
    : { data: null }

  // Fetch recent visits
  const { data: recentVisits } = await supabase
    .from('visits')
    .select('id, status, visited_at, notes, property_id, properties(address)')
    .eq('agent_id', user.id)
    .order('visited_at', { ascending: false })
    .limit(5)

  // Count total visits
  const { count: totalVisits } = await supabase
    .from('visits')
    .select('id', { count: 'exact', head: true })
    .eq('agent_id', user.id)

  // Count visits today
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { count: todayVisits } = await supabase
    .from('visits')
    .select('id', { count: 'exact', head: true })
    .eq('agent_id', user.id)
    .gte('visited_at', todayStart.toISOString())

  // Count properties in sector
  let pendingCount = 0
  if (profile.sector_id) {
    const { count } = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('sector_id', profile.sector_id)
    pendingCount = count ?? 0
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Painel do Agente</p>
          <h1 className="text-3xl font-black text-slate-900">
            Ola, {profile.name ?? 'Agente'}
          </h1>
          {sector ? (
            <p className="text-slate-500 text-sm mt-1">
              Setor: <span className="font-semibold text-slate-700">{sector.name}</span>
              {sector.code && <span className="ml-1 text-slate-400">({sector.code})</span>}
            </p>
          ) : (
            <p className="text-sm text-orange-600 mt-1">Nenhum setor atribuido — fale com seu coordenador</p>
          )}
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Visitas Hoje</p>
            <p className="text-3xl font-black text-emerald-700">{todayVisits ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Total de Visitas</p>
            <p className="text-3xl font-black text-slate-900">{totalVisits ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Imoveis no Setor</p>
            <p className="text-3xl font-black text-slate-900">{pendingCount}</p>
          </div>
        </div>

        {/* Quick links */}
        <div className="mb-8 flex gap-3 flex-wrap">
          <Link href="/agent/imoveis" className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition">
            Ver meus imoveis
          </Link>
          <Link href="/agent/visitas" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            Ver minhas visitas
          </Link>
        </div>

        {/* Recent visits */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Visitas Recentes</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Imovel</th>
                <th className="px-5 py-4 font-semibold">Data</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Notas</th>
              </tr>
            </thead>
            <tbody>
              {(recentVisits ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                    Nenhuma visita registrada ainda
                  </td>
                </tr>
              ) : (
                (recentVisits ?? []).map((visit) => {
                  const address = (visit as any).properties?.address ?? '—' // eslint-disable-line @typescript-eslint/no-explicit-any
                  const color = STATUS_COLORS[visit.status] ?? 'bg-slate-100 text-slate-600'
                  const label = STATUS_LABELS[visit.status] ?? visit.status
                  return (
                    <tr key={visit.id} className="border-t border-slate-100">
                      <td className="px-5 py-4 font-medium text-slate-900">
                        <Link href={`/agent/imoveis/${visit.property_id}`} className="hover:underline text-emerald-700">
                          {address}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {visit.visited_at
                          ? new Date(visit.visited_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs max-w-[200px] truncate">
                        {visit.notes ?? '—'}
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
