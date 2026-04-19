import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase-server'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  visitado_sem_foco: 'Visitado sem achado',
  visitado_com_achado: 'Visitado com achado',
  recusado: 'Recusado',
  fechado: 'Fechado',
  pendente: 'Pendente',
}

const STATUS_COLORS: Record<string, string> = {
  visitado_sem_foco: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  visitado_com_achado: 'bg-orange-50 text-orange-700 border-orange-200',
  recusado: 'bg-red-50 text-red-700 border-red-200',
  fechado: 'bg-slate-100 text-slate-600 border-slate-200',
  pendente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
}

interface SummaryRow {
  status: string
  total: number
  sector_name?: string
  agent_name?: string
}

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Role check: manager and admin only
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['manager', 'admin'].includes(profile.role)) {
    redirect('/dashboard?acesso=negado')
  }

  // Try vw_visit_summary for aggregate stats
  const { data: summary, error: summaryError } = await supabase
    .from('vw_visit_summary')
    .select('*')
    .limit(1000)

  // Also get visit counts by status as a fallback / supplement
  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select('status')

  // Aggregate by status from raw visits if summary is unavailable
  const statusCounts: Record<string, number> = {}
  for (const visit of visits ?? []) {
    statusCounts[visit.status] = (statusCounts[visit.status] ?? 0) + 1
  }
  const totalVisits = Object.values(statusCounts).reduce((a, b) => a + b, 0)

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Dashboard</p>
            <h1 className="text-3xl font-black text-slate-900">Relatorios</h1>
            <p className="text-slate-500 text-sm mt-1">Resumo estatistico e exportacao de dados</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/api/export"
              className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition"
            >
              Exportar CSV
            </a>
            <Link href="/dashboard" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              Voltar ao dashboard
            </Link>
          </div>
        </div>

        {(summaryError || visitsError) && (
          <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-3 text-sm text-yellow-800">
            Aviso: alguns dados podem estar incompletos. Erro: {summaryError?.message ?? visitsError?.message}
          </div>
        )}

        {/* Summary KPI Cards */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Total de Visitas</p>
            <p className="text-3xl font-black text-slate-900">{totalVisits.toLocaleString('pt-BR')}</p>
          </div>
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className={`rounded-2xl border p-5 ${STATUS_COLORS[status] ?? 'bg-white border-slate-200 text-slate-700'}`}>
              <p className="text-xs uppercase tracking-wide opacity-70 mb-2">{STATUS_LABELS[status] ?? status}</p>
              <p className="text-3xl font-black">{count.toLocaleString('pt-BR')}</p>
              {totalVisits > 0 && (
                <p className="text-xs mt-1 opacity-60">{Math.round((count / totalVisits) * 100)}% do total</p>
              )}
            </div>
          ))}
        </div>

        {/* Visit Summary Table (from view) */}
        {summary && summary.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white mb-8">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Resumo Detalhado de Visitas</h2>
              <p className="text-sm text-slate-500">Dados da visao vw_visit_summary (ultimas 1000 entradas)</p>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {Object.keys(summary[0] ?? {}).slice(0, 8).map((col) => (
                    <th key={col} className="px-5 py-4 font-semibold">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {Object.keys(summary[0] ?? {}).slice(0, 8).map((col) => (
                      <td key={col} className="px-5 py-3 text-slate-600 text-xs">
                        {String((row as Record<string, unknown>)[col] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {summary.length > 50 && (
              <p className="px-6 py-3 text-xs text-slate-400 border-t border-slate-100">
                Exibindo 50 de {summary.length} registros. Use &quot;Exportar CSV&quot; para ver todos.
              </p>
            )}
          </div>
        )}

        {/* Export section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-bold text-slate-900 mb-2">Exportar dados</h2>
          <p className="text-sm text-slate-500 mb-4">
            Exporte todos os dados de visitas em formato CSV para analise em Excel ou Google Sheets.
          </p>
          <a
            href="/api/export"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition"
          >
            Baixar CSV completo
          </a>
        </div>
      </div>
    </main>
  )
}
