'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface SectorStat {
  sector_id: string
  sector_name: string
  sector_code: string | null
  day: string
  total_visits: number
  with_findings: number
  without_findings: number
  refused: number
  not_found: number
  closed: number
}

interface Sector {
  id: string
  name: string
  code: string | null
}

export default function DashboardClient({
  stats,
  sectors,
  statsError,
  accessDenied,
}: {
  stats: SectorStat[]
  sectors: Sector[]
  statsError?: string | null
  accessDenied?: boolean
}) {
  const [selectedSector, setSelectedSector] = useState<string>('all')

  const filtered = selectedSector === 'all' ? stats : stats.filter((item) => item.sector_id === selectedSector)

  const totals = filtered.reduce(
    (accumulator, item) => ({
      total: accumulator.total + (item.total_visits || 0),
      findings: accumulator.findings + (item.with_findings || 0),
      refused: accumulator.refused + (item.refused || 0),
      notFound: accumulator.notFound + (item.not_found || 0),
    }),
    { total: 0, findings: 0, refused: 0, notFound: 0 }
  )

  const chartData = filtered.slice(0, 30).map((item) => ({
    day: new Date(item.day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    'Com Achado': item.with_findings,
    'Sem Foco': item.without_findings,
    Fechado: item.closed,
    Recusado: item.refused,
  }))

  if (stats.length === 0 && sectors.length === 0 && !statsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-2xl font-bold text-slate-500">Sem dados disponíveis</p>
        <p className="text-sm text-slate-400">Nenhum dado de visitas foi encontrado. Verifique a conexão com o banco de dados ou aguarde a sincronização dos agentes.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between bg-green-800 px-6 py-4 text-white">
        <div>
          <h1 className="text-xl font-bold">ZoonoseApp</h1>
          <p className="text-sm text-green-200">Dashboard de vigilancia</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/imoveis" className="rounded-lg border border-green-600 bg-green-700 px-3 py-2 text-sm font-semibold text-white">
            Imoveis
          </Link>
          <Link href="/dashboard/agentes" className="rounded-lg border border-green-600 bg-green-700 px-3 py-2 text-sm font-semibold text-white">
            Agentes
          </Link>
          <a href="/api/export" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
            Exportar CSV
          </a>
          <select
            className="rounded-lg border border-green-600 bg-green-700 px-3 py-1.5 text-sm text-white"
            value={selectedSector}
            onChange={(event) => setSelectedSector(event.target.value)}
          >
            <option value="all">Todos os setores</option>
            {sectors.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        {/* Access denied notice (P002) */}
        {accessDenied && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            Acesso negado: voce nao tem permissao para acessar essa pagina.
          </div>
        )}
        {/* Stats error banner (P021) */}
        {statsError && (
          <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm font-medium text-yellow-800">
            Aviso: nao foi possivel carregar os dados estatisticos ({statsError}). Verifique a configuracao do banco de dados.
          </div>
        )}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total de Visitas" value={totals.total} color="blue" />
          <StatCard label="Com Achado" value={totals.findings} color="orange" />
          <StatCard label="Recusados" value={totals.refused} color="red" />
          <StatCard label="Nao Localizados" value={totals.notFound} color="yellow" />
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Visitas por dia</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Com Achado" fill="#f97316" />
              <Bar dataKey="Sem Foco" fill="#10b981" />
              <Bar dataKey="Fechado" fill="#9ca3af" />
              <Bar dataKey="Recusado" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Setores em foco</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {sectors.map((sector) => {
              const sectorStats = stats.filter((item) => item.sector_id === sector.id)
              const totalVisits = sectorStats.reduce((sum, item) => sum + item.total_visits, 0)
              const findings = sectorStats.reduce((sum, item) => sum + item.with_findings, 0)

              return (
                <div key={sector.id} className="rounded-2xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{sector.name}</p>
                      <p className="text-sm text-slate-500">{sector.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-700">{totalVisits}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-400">visitas</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    Achados registrados: <span className="font-semibold text-orange-600">{findings}</span>
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-3xl font-bold ${colors[color]}`}>{(value == null || isNaN(value) ? 0 : value).toLocaleString('pt-BR')}</p>
    </div>
  )
}
