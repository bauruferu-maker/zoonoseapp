import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase-server'

export const dynamic = 'force-dynamic'

interface WorkQueueRow {
  property_id: string
  address: string
  sector_name: string | null
  sector_code: string | null
  last_visited_at: string | null
  priority: number | null
  status: string | null
}

export default async function RoutesPage() {
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

  // Try vw_work_queue view first; fall back to properties without recent visits
  const { data: queue, error: queueError } = await supabase
    .from('vw_work_queue')
    .select('*')
    .limit(200)

  let fallbackData: WorkQueueRow[] = []
  let usedFallback = false

  if (queueError || !queue) {
    usedFallback = true
    // Fallback: list properties joined with their most recent visit
    const { data: properties } = await supabase
      .from('properties')
      .select('id, address, sectors(name, code)')
      .order('address')
      .limit(200)

    fallbackData = (properties ?? []).map((p) => ({
      property_id: p.id,
      address: p.address,
      sector_name: (p as unknown as { sectors?: { name: string } }).sectors?.name ?? null,
      sector_code: (p as unknown as { sectors?: { code: string } }).sectors?.code ?? null,
      last_visited_at: null,
      priority: null,
      status: null,
    }))
  }

  const rows: WorkQueueRow[] = usedFallback ? fallbackData : (queue as unknown as WorkQueueRow[])

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Dashboard</p>
            <h1 className="text-3xl font-black text-slate-900">Fila de Trabalho</h1>
            <p className="text-slate-500 text-sm mt-1">Imoveis que precisam de visita ou revisita</p>
          </div>
          <Link href="/dashboard" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            Voltar ao dashboard
          </Link>
        </div>

        {usedFallback && (
          <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-3 text-sm text-yellow-800">
            A visao vw_work_queue nao esta disponivel. Exibindo lista geral de imoveis como alternativa.
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Endereco</th>
                <th className="px-5 py-4 font-semibold">Setor</th>
                <th className="px-5 py-4 font-semibold">Ultima visita</th>
                {!usedFallback && <th className="px-5 py-4 font-semibold">Prioridade</th>}
                <th className="px-5 py-4 font-semibold">Acao</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    Nenhum imovel na fila de trabalho
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.property_id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-medium text-slate-900">{row.address}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {row.sector_name ?? '—'}
                      {row.sector_code ? <span className="ml-1 text-xs text-slate-400">({row.sector_code})</span> : null}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {row.last_visited_at
                        ? new Date(row.last_visited_at).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                          })
                        : <span className="text-slate-400 italic">Nunca visitado</span>}
                    </td>
                    {!usedFallback && (
                      <td className="px-5 py-4 text-slate-600">
                        {row.priority != null ? (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${row.priority >= 8 ? 'bg-red-50 text-red-700' : row.priority >= 5 ? 'bg-yellow-50 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                            {row.priority}
                          </span>
                        ) : '—'}
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/imoveis/${row.property_id}`}
                        className="font-semibold text-emerald-700 hover:underline"
                      >
                        Abrir
                      </Link>
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
