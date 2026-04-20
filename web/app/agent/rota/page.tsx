import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase-server'
import { STATUS_LABELS } from '../../../lib/visit-status'

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
  alta:  'bg-red-50 text-red-700',
  media: 'bg-yellow-50 text-yellow-700',
  baixa: 'bg-slate-100 text-slate-600',
}

const PRIORITY_LABEL: Record<string, string> = {
  alta:  'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

export default async function AgentRotaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, sector_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'agent') redirect('/dashboard')

  if (!profile.sector_id) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Rota do Dia</p>
            <h1 className="text-3xl font-black text-slate-900">Fila Priorizada</h1>
          </div>
          <div className="rounded-2xl border border-orange-200 bg-orange-50 px-6 py-8 text-center">
            <p className="text-orange-800 font-semibold">Nenhum setor atribuído</p>
            <p className="text-orange-600 text-sm mt-1">Fale com seu coordenador para ser atribuído a um setor.</p>
          </div>
        </div>
      </main>
    )
  }

  const { data: queueRaw, error: queueError } = await supabase
    .from('vw_work_queue')
    .select('property_id, address, sector_name, owner_name, last_visited_at, last_status, priority, priority_reason, total_visits, focus_count')
    .eq('sector_name', profile.sector_id) // will filter by sector below
    .order('priority_order', { ascending: true })
    .limit(100)

  // vw_work_queue doesn't expose sector_id directly — fetch sector name first then filter
  const { data: sector } = await supabase
    .from('sectors')
    .select('name')
    .eq('id', profile.sector_id)
    .single()

  const { data: allQueue, error: allQueueError } = await supabase
    .from('vw_work_queue')
    .select('property_id, address, sector_name, owner_name, last_visited_at, last_status, priority, priority_reason, total_visits, focus_count')
    .order('priority_order', { ascending: true })
    .limit(500)

  const rows: WorkQueueRow[] = ((allQueue ?? []) as WorkQueueRow[]).filter(
    (r) => r.sector_name === sector?.name
  )

  const finalError = queueError ?? allQueueError

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Rota do Dia</p>
            <h1 className="text-3xl font-black text-slate-900">Fila Priorizada</h1>
            <p className="text-slate-500 text-sm mt-1">
              {rows.length} imóvel{rows.length !== 1 ? 'is' : ''} — ordenados por prioridade
            </p>
          </div>
          <Link href="/agent" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            ← Voltar
          </Link>
        </div>

        {finalError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800">
            Erro ao carregar fila: {finalError.message}
          </div>
        )}

        {rows.length === 0 && !finalError ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-slate-400 font-medium">Fila vazia — nenhum imóvel pendente no seu setor.</p>
            <Link href="/agent/imoveis" className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline">
              Ver todos os imóveis
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Endereço</th>
                  <th className="px-5 py-4 font-semibold">Responsável</th>
                  <th className="px-5 py-4 font-semibold">Última Visita</th>
                  <th className="px-5 py-4 font-semibold">Prioridade</th>
                  <th className="px-5 py-4 font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.property_id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-medium text-slate-900">{row.address}</td>
                    <td className="px-5 py-4 text-slate-600">{row.owner_name ?? '—'}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {row.last_visited_at
                        ? new Date(row.last_visited_at).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                          })
                        : <span className="text-slate-400 italic">Nunca visitado</span>}
                    </td>
                    <td className="px-5 py-4">
                      {row.priority ? (
                        <div>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${PRIORITY_STYLE[row.priority] ?? 'bg-slate-100 text-slate-600'}`}>
                            {PRIORITY_LABEL[row.priority] ?? row.priority}
                          </span>
                          {row.priority_reason && (
                            <p className="text-xs text-slate-400 mt-0.5">{row.priority_reason}</p>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/agent/visitas/nova?property_id=${row.property_id}`}
                        className="font-semibold text-emerald-700 hover:underline"
                      >
                        Registrar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </main>
  )
}
