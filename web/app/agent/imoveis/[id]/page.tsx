import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../../lib/supabase-server'
import { STATUS_LABELS, STATUS_COLORS } from '../../../../lib/visit-status'

export const dynamic = 'force-dynamic'

interface PropertyRow {
  id: string
  address: string | null
  owner_name: string | null
  owner_phone: string | null
  created_at: string | null
  latitude: number | null
  longitude: number | null
  sectors: { id: string; name: string; code: string | null } | null
}

interface VisitRow {
  id: string
  status: string
  visited_at: string | null
  notes: string | null
  agent_id: string
  profiles: { name: string } | null
}

export default async function AgentPropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, sector_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'agent') redirect('/dashboard')

  const { data: propertyRaw } = await supabase
    .from('properties')
    .select('*, sectors(id, name, code)')
    .eq('id', id)
    .single()

  const property = propertyRaw as PropertyRow | null

  if (!property) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <Link href="/agent/imoveis" className="text-emerald-700 font-semibold hover:underline text-sm">
            ← Voltar aos imóveis
          </Link>
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
            <p className="text-slate-500">Imóvel não encontrado.</p>
            <Link href="/agent/imoveis" className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline">
              Ver lista de imóveis
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const { data: visitsRaw } = await supabase
    .from('visits')
    .select('id, status, visited_at, notes, agent_id, profiles(name)')
    .eq('property_id', id)
    .order('visited_at', { ascending: false })
    .limit(20)

  const visits = (visitsRaw ?? []) as unknown as VisitRow[]
  const sector = property.sectors

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Meus Imóveis</p>
            <h1 className="text-3xl font-black text-slate-900">Detalhe do Imóvel</h1>
          </div>
          <Link
            href="/agent/imoveis"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            ← Voltar
          </Link>
        </div>

        {/* Property info */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Informações do Imóvel</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <dt className="font-semibold text-slate-500 uppercase tracking-wide text-xs mb-1">Endereço</dt>
              <dd className="text-slate-900 font-medium">{property.address ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500 uppercase tracking-wide text-xs mb-1">Setor</dt>
              <dd className="text-slate-900">
                {sector ? `${sector.name}${sector.code ? ` (${sector.code})` : ''}` : '—'}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500 uppercase tracking-wide text-xs mb-1">Responsável</dt>
              <dd className="text-slate-900">{property.owner_name ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500 uppercase tracking-wide text-xs mb-1">Telefone</dt>
              <dd className="text-slate-900">{property.owner_phone ?? '—'}</dd>
            </div>
            {property.latitude != null && property.longitude != null && (
              <div>
                <dt className="font-semibold text-slate-500 uppercase tracking-wide text-xs mb-1">Coordenadas</dt>
                <dd className="text-slate-900 font-mono text-xs">{property.latitude}, {property.longitude}</dd>
              </div>
            )}
            <div>
              <dt className="font-semibold text-slate-500 uppercase tracking-wide text-xs mb-1">Cadastrado em</dt>
              <dd className="text-slate-900">
                {property.created_at
                  ? new Date(property.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  : '—'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Register visit CTA */}
        <div className="mb-6 flex gap-3">
          <Link
            href={`/agent/visitas/nova?property_id=${property.id}`}
            className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition"
          >
            + Registrar Visita
          </Link>
        </div>

        {/* Visit history */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Histórico de Visitas</h2>
            <p className="text-sm text-slate-500">{visits.length} visita{visits.length !== 1 ? 's' : ''} registrada{visits.length !== 1 ? 's' : ''}</p>
          </div>
          {visits.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-slate-400">Nenhuma visita registrada para este imóvel.</p>
              <Link
                href={`/agent/visitas/nova?property_id=${property.id}`}
                className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline"
              >
                Registrar a primeira visita
              </Link>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Data</th>
                  <th className="px-5 py-4 font-semibold">Agente</th>
                  <th className="px-5 py-4 font-semibold">Observações</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit) => (
                  <tr key={visit.id} className="border-t border-slate-100">
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[visit.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABELS[visit.status] ?? visit.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {visit.visited_at
                        ? new Date(visit.visited_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{visit.profiles?.name ?? '—'}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs max-w-[200px] truncate">{visit.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </main>
  )
}
