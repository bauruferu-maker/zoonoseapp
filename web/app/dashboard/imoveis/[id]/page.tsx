import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../../lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: property } = await supabase
    .from('properties')
    .select('*, sectors(*)')
    .eq('id', id)
    .single()

  const { data: visits } = await supabase
    .from('visits')
    .select('*')
    .eq('property_id', id)
    .order('visited_at', { ascending: false })
    .limit(10)

  if (!property) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <Link href="/dashboard/imoveis" className="text-emerald-700 font-semibold hover:underline text-sm">
            ← Voltar aos imoveis
          </Link>
          <p className="mt-8 text-slate-500">Imovel nao encontrado.</p>
        </div>
      </main>
    )
  }

  const sector = (property as any).sectors

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Imoveis</p>
            <h1 className="text-3xl font-black text-slate-900">Detalhe do Imovel</h1>
          </div>
          <Link
            href="/dashboard/imoveis"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            ← Voltar
          </Link>
        </div>

        {/* Property Info Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Informacoes do Imovel</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <dt className="font-semibold text-slate-500 uppercase tracking-wide text-xs mb-1">Endereco</dt>
              <dd className="text-slate-900">{property.address ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500 uppercase tracking-wide text-xs mb-1">Codigo</dt>
              <dd className="text-slate-900">{property.code ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500 uppercase tracking-wide text-xs mb-1">Tipo</dt>
              <dd className="text-slate-900">{property.type ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500 uppercase tracking-wide text-xs mb-1">Setor</dt>
              <dd className="text-slate-900">
                {sector ? `${sector.name}${sector.code ? ` (${sector.code})` : ''}` : '—'}
              </dd>
            </div>
            {property.latitude != null && property.longitude != null && (
              <div>
                <dt className="font-semibold text-slate-500 uppercase tracking-wide text-xs mb-1">Coordenadas</dt>
                <dd className="text-slate-900">{property.latitude}, {property.longitude}</dd>
              </div>
            )}
            <div>
              <dt className="font-semibold text-slate-500 uppercase tracking-wide text-xs mb-1">Responsavel</dt>
              <dd className="text-slate-900">{property.owner_name ?? property.owner_phone ?? '—'}</dd>
            </div>
          </dl>
        </div>

        {/* Visit History Table */}
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Historico de Visitas</h2>
            <p className="text-sm text-slate-500">Ultimas 10 visitas registradas</p>
          </div>
          {visits && visits.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Data</th>
                  <th className="px-5 py-4 font-semibold">Agente</th>
                  <th className="px-5 py-4 font-semibold">Observacoes</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit: any) => (
                  <tr key={visit.id} className="border-t border-slate-100">
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        visit.status === 'visited'
                          ? 'bg-emerald-50 text-emerald-700'
                          : visit.status === 'closed'
                          ? 'bg-slate-100 text-slate-600'
                          : visit.status === 'refused'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {visit.status ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {visit.visited_at
                        ? new Date(visit.visited_at).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{visit.agent_id ?? '—'}</td>
                    <td className="px-5 py-4 text-slate-600">{visit.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-6 py-8 text-sm text-slate-400">Nenhuma visita registrada para este imovel.</p>
          )}
        </div>
      </div>
    </main>
  )
}
