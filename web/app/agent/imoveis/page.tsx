import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '../../../lib/supabase-server'
import { STATUS_LABELS, STATUS_COLORS } from '../../../lib/visit-status'
import TableSearch from '../../../components/TableSearch'
import Pagination from '../../../components/Pagination'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 30

export default async function AgentImoveisPage({
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
    .select('role, sector_id, name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'agent') redirect('/dashboard')

  if (!profile.sector_id) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Meus Imoveis</p>
            <h1 className="text-3xl font-black text-slate-900">Imoveis do Setor</h1>
          </div>
          <div className="rounded-2xl border border-orange-200 bg-orange-50 px-6 py-8 text-center">
            <p className="text-orange-800 font-semibold">Nenhum setor atribuido</p>
            <p className="text-orange-600 text-sm mt-1">Fale com seu coordenador para ser atribuido a um setor.</p>
          </div>
        </div>
      </main>
    )
  }

  let propQuery = supabase
    .from('properties')
    .select('id, address, owner_name', { count: 'exact' })
    .eq('sector_id', profile.sector_id)
    .order('address')

  if (q) propQuery = propQuery.ilike('address', `%${q}%`)

  const { data: properties, count: totalProperties, error } = await propQuery
    .range(offset, offset + PAGE_SIZE - 1)

  // Get last visit per property for this agent
  const propertyIds = (properties ?? []).map((p) => p.id)
  const { data: lastVisits } = propertyIds.length > 0
    ? await supabase
        .from('visits')
        .select('property_id, status, visited_at')
        .in('property_id', propertyIds)
        .eq('agent_id', user.id)
        .order('visited_at', { ascending: false })
        .limit(500)
    : { data: [] }

  // Map: property_id -> last visit (first occurrence per property since ordered desc)
  const visitMap = new Map<string, { status: string; visited_at: string }>()
  for (const v of lastVisits ?? []) {
    if (!visitMap.has(v.property_id)) visitMap.set(v.property_id, v)
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Meus Imóveis</p>
            <h1 className="text-3xl font-black text-slate-900">Imóveis do Setor</h1>
            <p className="text-slate-500 text-sm mt-1">{totalProperties ?? 0} imóveis{q ? ` encontrados para "${q}"` : ''}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Suspense fallback={null}>
              <TableSearch placeholder="Buscar por endereço..." />
            </Suspense>
            <Link href="/agent" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              Voltar
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800">
            Erro ao carregar imoveis: {error.message}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Endereco</th>
                <th className="px-5 py-4 font-semibold">Responsavel</th>
                <th className="px-5 py-4 font-semibold">Ultima Visita</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Acao</th>
              </tr>
            </thead>
            <tbody>
              {(properties ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    Nenhum imovel encontrado no seu setor
                  </td>
                </tr>
              ) : (
                (properties ?? []).map((property) => {
                  const lastVisit = visitMap.get(property.id)
                  const color = lastVisit ? (STATUS_COLORS[lastVisit.status] ?? 'bg-slate-100 text-slate-600') : 'bg-yellow-50 text-yellow-700'
                  const label = lastVisit ? (STATUS_LABELS[lastVisit.status] ?? lastVisit.status) : 'Pendente'
                  return (
                    <tr key={property.id} className="border-t border-slate-100">
                      <td className="px-5 py-4 font-medium text-slate-900">{property.address}</td>
                      <td className="px-5 py-4 text-slate-600">{property.owner_name ?? '—'}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {lastVisit?.visited_at
                          ? new Date(lastVisit.visited_at).toLocaleDateString('pt-BR')
                          : <span className="text-slate-400 italic">Nunca visitado</span>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/agent/imoveis/${property.id}`} className="font-semibold text-emerald-700 hover:underline">
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          <Suspense fallback={null}>
            <Pagination total={totalProperties ?? 0} pageSize={PAGE_SIZE} />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
