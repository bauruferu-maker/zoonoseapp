import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase-server'
import { STATUS_LABELS, STATUS_COLORS } from '../../../lib/visit-status'

export const dynamic = 'force-dynamic'

interface WorkQueueRow {
  property_id: string
  address: string
  sector_name: string | null
  owner_name: string | null
  last_visited_at: string | null
  last_status: string | null
  priority: string | null
  priority_reason: string | null
  total_visits: number
  focus_count: number
}

const PRIORITY_STYLE: Record<string, string> = {
  alta:   'bg-red-50 text-red-700',
  media:  'bg-yellow-50 text-yellow-700',
  baixa:  'bg-slate-100 text-slate-600',
}

export default async function RoutesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['coordinator', 'manager', 'admin'].includes(profile.role)) {
    redirect('/dashboard?acesso=negado')
  }

  const { data: queue, error: queueError } = await supabase
    .from('vw_work_queue')
    .select('property_id, address, sector_name, owner_name, last_visited_at, last_status, priority, priority_reason, total_visits, focus_count')
    .order('priority_order', { ascending: true })
    .limit(200)

  const rows: WorkQueueRow[] = (queue ?? []) as WorkQueueRow[]

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Dashboard</p>
            <h1 className="text-3xl font-black text-slate-900">Fila de Trabalho</h1>
            <p className="text-slate-500 text-sm mt-1">
              {rows.length} imóveis — ordenados por prioridade
            </p>
          </div>
          <Link href="/dashboard" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            Voltar ao dashboard
          </Link>
        </div>

        {queueError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800">
            Erro ao carregar fila de trabalho: {queueError.message}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Endereço</th>
                <th className="px-5 py-4 font-semibold">Setor</th>
                <th className="px-5 py-4 font-semibold">Responsável</th>
                <th className="px-5 py-4 font-semibold">Última visita</th>
                <th className="px-5 py-4 font-semibold">Último status</th>
                <th className="px-5 py-4 font-semibold">Prioridade</th>
                <th className="px-5 py-4 font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    Nenhum imóvel na fila de trabalho
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.property_id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-medium text-slate-900">{row.address}</td>
                    <td className="px-5 py-4 text-slate-600">{row.sector_name ?? '—'}</td>
                    <td className="px-5 py-4 text-slate-600">{row.owner_name ?? '—'}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {row.last_visited_at
                        ? new Date(row.last_visited_at).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                          })
                        : <span className="text-slate-400 italic">Nunca visitado</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {row.last_status ? (STATUS_LABELS[row.last_status] ?? row.last_status) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {row.priority ? (
                        <div>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${PRIORITY_STYLE[row.priority] ?? 'bg-slate-100 text-slate-600'}`}>
                            {row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}
                          </span>
                          {row.priority_reason && (
                            <p className="text-xs text-slate-400 mt-0.5">{row.priority_reason}</p>
                          )}
                        </div>
                      ) : '—'}
                    </td>
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
