import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase-server'

export const dynamic = 'force-dynamic'

interface SectorCoverageRow {
  sector_id: string
  sector_name: string
  sector_code: string | null
  total_properties: number
  visited_properties: number
  coverage_pct: number | null
}

export default async function MapPage() {
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

  // Try vw_sector_coverage first; fall back to sectors table
  const { data: coverage, error: coverageError } = await supabase
    .from('vw_sector_coverage')
    .select('*')

  const { data: sectors } = await supabase.from('sectors').select('*').order('name')

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Dashboard</p>
            <h1 className="text-3xl font-black text-slate-900">Mapa Operacional</h1>
            <p className="text-slate-500 text-sm mt-1">Visualizacao geografica — Em desenvolvimento</p>
          </div>
          <Link href="/dashboard" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            Voltar ao dashboard
          </Link>
        </div>

        {/* Notice banner */}
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-bold text-blue-900 mb-1">Mapa interativo em desenvolvimento</h2>
          <p className="text-sm text-blue-700">
            A visualizacao geografica sobre mapa sera implementada em breve. Por enquanto, consulte a cobertura por setor na tabela abaixo.
          </p>
        </div>

        {/* Sector coverage table */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Cobertura por Setor</h2>
            <p className="text-sm text-slate-500">Imoveis visitados vs total de imoveis cadastrados por setor</p>
          </div>

          {coverageError && !coverage ? (
            // Fallback: show sectors list without coverage stats
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Setor</th>
                  <th className="px-5 py-4 font-semibold">Codigo</th>
                </tr>
              </thead>
              <tbody>
                {(sectors ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-5 py-10 text-center text-slate-400">
                      Nenhum setor cadastrado
                    </td>
                  </tr>
                ) : (
                  (sectors ?? []).map((sector) => (
                    <tr key={sector.id} className="border-t border-slate-100">
                      <td className="px-5 py-4 font-medium text-slate-900">{sector.name}</td>
                      <td className="px-5 py-4 text-slate-600">{sector.code ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Setor</th>
                  <th className="px-5 py-4 font-semibold">Codigo</th>
                  <th className="px-5 py-4 font-semibold">Imoveis</th>
                  <th className="px-5 py-4 font-semibold">Visitados</th>
                  <th className="px-5 py-4 font-semibold">Cobertura</th>
                </tr>
              </thead>
              <tbody>
                {(coverage ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                      Nenhum dado de cobertura disponivel
                    </td>
                  </tr>
                ) : (
                  (coverage as unknown as SectorCoverageRow[]).map((row) => {
                    const pct = row.coverage_pct ?? (row.total_properties > 0 ? Math.round((row.visited_properties / row.total_properties) * 100) : 0)
                    return (
                      <tr key={row.sector_id} className="border-t border-slate-100">
                        <td className="px-5 py-4 font-medium text-slate-900">{row.sector_name}</td>
                        <td className="px-5 py-4 text-slate-600">{row.sector_code ?? '—'}</td>
                        <td className="px-5 py-4 text-slate-600">{row.total_properties ?? '—'}</td>
                        <td className="px-5 py-4 text-slate-600">{row.visited_properties ?? '—'}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold ${pct >= 80 ? 'text-emerald-700' : pct >= 50 ? 'text-yellow-700' : 'text-red-700'}`}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  )
}
