import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase-server'
import { STATUS_LABELS, STATUS_COLORS } from '../../../lib/visit-status'

export const dynamic = 'force-dynamic'

export default async function AgentVisitasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'agent') redirect('/dashboard')

  const { data: visits, error } = await supabase
    .from('visits')
    .select('id, status, visited_at, notes, property_id, properties(address, sectors(name))')
    .eq('agent_id', user.id)
    .order('visited_at', { ascending: false })
    .limit(200)

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Minhas Visitas</p>
            <h1 className="text-3xl font-black text-slate-900">Historico de Visitas</h1>
            <p className="text-slate-500 text-sm mt-1">{(visits ?? []).length} visitas registradas</p>
          </div>
          <Link href="/agent" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            Voltar
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800">
            Erro ao carregar visitas: {error.message}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Imovel</th>
                <th className="px-5 py-4 font-semibold">Setor</th>
                <th className="px-5 py-4 font-semibold">Data</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Notas</th>
              </tr>
            </thead>
            <tbody>
              {(visits ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    Nenhuma visita registrada ainda
                  </td>
                </tr>
              ) : (
                (visits ?? []).map((visit) => {
                  const prop = (visit as any).properties // eslint-disable-line @typescript-eslint/no-explicit-any
                  const address = prop?.address ?? '—'
                  const sectorName = prop?.sectors?.name ?? '—'
                  const color = STATUS_COLORS[visit.status] ?? 'bg-slate-100 text-slate-600'
                  const label = STATUS_LABELS[visit.status] ?? visit.status
                  return (
                    <tr key={visit.id} className="border-t border-slate-100">
                      <td className="px-5 py-4 font-medium text-slate-900">
                        <Link href={`/agent/imoveis/${visit.property_id}`} className="hover:underline text-emerald-700">
                          {address}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{sectorName}</td>
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
                      <td className="px-5 py-4 text-slate-500 text-xs max-w-[180px] truncate">
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
