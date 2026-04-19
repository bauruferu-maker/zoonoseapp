import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase-server'

export const dynamic = 'force-dynamic'

interface CoverageRow {
  sector_id: string
  sector_name: string
  sector_code: string | null
  total_properties: number
  visited_properties: number
  coverage_pct: number | null
}

export default async function QualityPage() {
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

  const { data: coverage, error: coverageError } = await supabase
    .from('vw_sector_coverage')
    .select('*')

  // Fallback: calculate basic stats from properties + visits
  let fallbackRows: CoverageRow[] = []
  let usedFallback = false

  if (coverageError || !coverage || coverage.length === 0) {
    usedFallback = true
    const [{ data: sectors }, { data: properties }, { data: visits }] = await Promise.all([
      supabase.from('sectors').select('id, name, code').order('name'),
      supabase.from('properties').select('id, sector_id'),
      supabase.from('visits').select('property_id, status'),
    ])

    const visitedPropertyIds = new Set(
      (visits ?? [])
        .filter((v) => v.status !== 'pendente')
        .map((v) => v.property_id)
    )

    fallbackRows = (sectors ?? []).map((sector) => {
      const sectorProperties = (properties ?? []).filter((p) => p.sector_id === sector.id)
      const visited = sectorProperties.filter((p) => visitedPropertyIds.has(p.id))
      const pct = sectorProperties.length > 0
        ? Math.round((visited.length / sectorProperties.length) * 100)
        : 0
      return {
        sector_id: sector.id,
        sector_name: sector.name,
        sector_code: sector.code ?? null,
        total_properties: sectorProperties.length,
        visited_properties: visited.length,
        coverage_pct: pct,
      }
    })
  }

  const rows: CoverageRow[] = usedFallback ? fallbackRows : (coverage as unknown as CoverageRow[])

  // Compute summary stats
  const totalProperties = rows.reduce((s, r) => s + (r.total_properties ?? 0), 0)
  const totalVisited = rows.reduce((s, r) => s + (r.visited_properties ?? 0), 0)
  const overallPct = totalProperties > 0 ? Math.round((totalVisited / totalProperties) * 100) : 0
  const highCoverage = rows.filter((r) => (r.coverage_pct ?? 0) >= 80).length
  const lowCoverage = rows.filter((r) => (r.coverage_pct ?? 0) < 50).length

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Dashboard</p>
            <h1 className="text-3xl font-black text-slate-900">Controle de Qualidade</h1>
            <p className="text-slate-500 text-sm mt-1">Cobertura de visitas por setor</p>
          </div>
          <Link href="/dashboard" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            Voltar ao dashboard
          </Link>
        </div>

        {usedFallback && (
          <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-3 text-sm text-yellow-800">
            A visao vw_sector_coverage nao esta disponivel. Dados calculados diretamente das tabelas.
          </div>
        )}

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Cobertura Geral</p>
            <p className={`text-3xl font-black ${overallPct >= 80 ? 'text-emerald-700' : overallPct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {overallPct}%
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Total Imoveis</p>
            <p className="text-3xl font-black text-slate-900">{totalProperties.toLocaleString('pt-BR')}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Setores Alta Cobertura</p>
            <p className="text-3xl font-black text-emerald-700">{highCoverage}</p>
            <p className="text-xs text-slate-400 mt-1">≥ 80%</p>
          </div>
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
            <p className="text-xs uppercase tracking-wide text-red-400 mb-2">Setores Criticos</p>
            <p className="text-3xl font-black text-red-700">{lowCoverage}</p>
            <p className="text-xs text-red-400 mt-1">{'< 50%'}</p>
          </div>
        </div>

        {/* Coverage Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Cobertura por Setor</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Setor</th>
                <th className="px-5 py-4 font-semibold">Codigo</th>
                <th className="px-5 py-4 font-semibold">Total</th>
                <th className="px-5 py-4 font-semibold">Visitados</th>
                <th className="px-5 py-4 font-semibold">Cobertura</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                    Nenhum dado de cobertura disponivel
                  </td>
                </tr>
              ) : (
                [...rows]
                  .sort((a, b) => (a.coverage_pct ?? 0) - (b.coverage_pct ?? 0))
                  .map((row) => {
                    const pct = row.coverage_pct ?? 0
                    return (
                      <tr key={row.sector_id} className="border-t border-slate-100">
                        <td className="px-5 py-4 font-medium text-slate-900">{row.sector_name}</td>
                        <td className="px-5 py-4 text-slate-600">{row.sector_code ?? '—'}</td>
                        <td className="px-5 py-4 text-slate-600">{row.total_properties ?? '—'}</td>
                        <td className="px-5 py-4 text-slate-600">{row.visited_properties ?? '—'}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-28 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-2.5 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold min-w-[3rem] ${pct >= 80 ? 'text-emerald-700' : pct >= 50 ? 'text-yellow-700' : 'text-red-700'}`}>
                              {pct}%
                            </span>
                            {pct < 50 && (
                              <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                                Critico
                              </span>
                            )}
                          </div>
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
