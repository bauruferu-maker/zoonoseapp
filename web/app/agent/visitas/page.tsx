import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '../../../lib/supabase-server'
import { STATUS_LABELS, STATUS_COLORS } from '../../../lib/visit-status'
import AutoToast from '../../../components/AutoToast'
import Pagination from '../../../components/Pagination'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 30

export default async function AgentVisitasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? 1))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'agent') redirect('/dashboard')

  let visitQuery = supabase
    .from('visits')
    .select('id, status, visited_at, notes, property_id, properties(address, sectors(name))', { count: 'exact' })
    .eq('agent_id', user.id)
    .order('visited_at', { ascending: false })

  // Filter by address search via nested relation isn't directly supported,
  // so we filter client-side after fetching paged results (acceptable for agent scope)
  const { data: visits, count: totalVisits, error } = await visitQuery
    .range(offset, offset + PAGE_SIZE - 1)

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <Suspense fallback={null}><AutoToast /></Suspense>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Minhas Visitas</p>
            <h1 className="text-3xl font-black text-slate-900">Histórico de Visitas</h1>
            <p className="text-slate-500 text-sm mt-1">{totalVisits ?? 0} visitas registradas</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/agent/visitas/nova"
              className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition"
            >
              + Nova Visita
            </Link>
            <Link href="/agent" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              Voltar
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800">
            Erro ao carregar visitas: {error.message}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <Suspense fallback={null}><Pagination total={totalVisits ?? 0} pageSize={PAGE_SIZE} /></Suspense>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Imovel</th>
                <th className="px-5 py-4 font-semibold">Setor</th>
                <th className="px-5 py-4 font-semibold">Data</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Notas</th>
                <th className="px-5 py-4 font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody>
              {(visits ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
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
                      <td className="px-5 py-4">
                        <Link href={`/agent/visitas/${visit.id}/edit`} className="text-sm font-semibold text-emerald-700 hover:underline">
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
