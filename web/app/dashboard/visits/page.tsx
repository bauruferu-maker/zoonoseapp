import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase-server'
import { STATUS_LABELS, STATUS_COLORS } from '../../../lib/visit-status'

export const dynamic = 'force-dynamic'

interface VisitRow {
  id: string
  status: string
  visited_at: string | null
  notes: string | null
  properties: { address: string } | null
  profiles: { name: string } | null
}

export default async function VisitsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Role check: coordinator, manager, admin only
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['coordinator', 'manager', 'admin'].includes(profile.role)) {
    redirect('/dashboard?acesso=negado')
  }

  const { data: visits, error } = await supabase
    .from('visits')
    .select('id, status, visited_at, notes, properties(address), profiles(name)')
    .order('visited_at', { ascending: false })
    .limit(200)

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Dashboard</p>
            <h1 className="text-3xl font-black text-slate-900">Visitas</h1>
            <p className="text-slate-500 text-sm mt-1">Historico de visitas registradas (ultimas 200)</p>
          </div>
          <Link href="/dashboard" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            Voltar ao dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            Erro ao carregar visitas: {error.message}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Data</th>
                <th className="px-5 py-4 font-semibold">Imovel</th>
                <th className="px-5 py-4 font-semibold">Agente</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Observacoes</th>
              </tr>
            </thead>
            <tbody>
              {(visits ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    Nenhuma visita registrada
                  </td>
                </tr>
              ) : (
                (visits as unknown as VisitRow[]).map((visit) => (
                  <tr key={visit.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                      {visit.visited_at
                        ? new Date(visit.visited_at).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {visit.properties?.address ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {visit.profiles?.name ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[visit.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[visit.status] ?? visit.status ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs max-w-xs truncate">
                      {visit.notes ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
