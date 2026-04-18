'use client'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { IconCircleRed, IconLock, IconAlertTriangle } from './Icons'

interface SectorStat {
  sector_name: string
  day: string
  total_visits: number
  with_findings: number
  without_findings: number
  refused: number
  not_found: number
  closed: number
}

interface SectorCoverage {
  sector_id: string
  sector_name: string
  total_properties: number
  visited_properties: number
  coverage_pct: number
  pending_properties: number
  closed_properties: number
  focus_properties: number
  complaint_properties: number
}

interface DailyRoute {
  id: string
  agent_id: string
  route_date: string
  property_ids: string[]
  completed_ids: string[]
}

interface Agent {
  id: string
  name: string
  role: string
  sector_id: string
}

interface Props {
  stats: SectorStat[]
  sectors: any[]
  coverage?: SectorCoverage[]
  todayRoutes?: DailyRoute[]
  agents?: Agent[]
  lastUpdated?: Date | null
  onRefresh?: () => void
}

export default function DashboardClient({ stats, sectors, coverage = [], todayRoutes = [], agents = [], lastUpdated, onRefresh }: Props) {
  const [selectedSector, setSelectedSector] = useState<string>('all')

  const filtered = selectedSector === 'all' ? stats : stats.filter(s => s.sector_name === selectedSector)

  const totals = filtered.reduce((acc, s) => ({
    total: acc.total + s.total_visits,
    findings: acc.findings + s.with_findings,
    refused: acc.refused + s.refused,
    notFound: acc.notFound + s.not_found,
  }), { total: 0, findings: 0, refused: 0, notFound: 0 })

  // Aggregate stats by day
  const byDay: Record<string, { findings: number; noFocus: number; closed: number; refused: number }> = {}
  for (const s of filtered) {
    // Normalizar day: pode vir como "2026-03-11T00:00:00+00:00" ou "2026-03-11"
    const key = typeof s.day === 'string' ? s.day.slice(0, 10) : s.day
    if (!byDay[key]) byDay[key] = { findings: 0, noFocus: 0, closed: 0, refused: 0 }
    byDay[key].findings += s.with_findings
    byDay[key].noFocus += s.without_findings
    byDay[key].closed += s.closed
    byDay[key].refused += s.refused
  }
  const chartData = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([day, d]) => ({
      day: (() => {
        const d2 = new Date(day + 'T12:00:00')
        return isNaN(d2.getTime()) ? day : d2.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })
      })(),
      'Com Achado': d.findings,
      'Sem Foco': d.noFocus,
      'Fechado': d.closed,
      'Recusado': d.refused,
    }))

  // Progresso do dia
  const totalQueued = todayRoutes.reduce((sum, r) => sum + (r.property_ids?.length ?? 0), 0)
  const totalCompleted = todayRoutes.reduce((sum, r) => sum + (r.completed_ids?.length ?? 0), 0)
  const dayProgress = totalQueued > 0 ? Math.round((totalCompleted / totalQueued) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-800 text-white px-4 md:px-6 py-4 space-y-3 md:space-y-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="pl-10 md:pl-0">
            <h1 className="text-lg md:text-xl font-bold">ZoonoseApp</h1>
            <p className="text-green-200 text-xs md:text-sm">Dashboard de Vigilância</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {lastUpdated && (
              <span className="text-green-300 text-xs hidden sm:inline">
                Atualizado {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
              </span>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="bg-green-700 hover:bg-green-600 text-white border border-green-600 rounded-lg px-2.5 py-1.5 text-xs md:text-sm transition-colors"
                title="Atualizar dados"
              >
                Atualizar
              </button>
            )}
            <select
              className="bg-green-700 text-white border border-green-600 rounded-lg px-2 py-1.5 text-xs md:text-sm max-w-[180px] md:max-w-none"
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
            >
              <option value="all">Todos os Setores</option>
              {sectors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </header>

      <main className="p-3 md:p-6 max-w-6xl mx-auto">
        {/* Cards de resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total de Visitas" value={totals.total} color="blue" />
          <StatCard label="Com Achado" value={totals.findings} color="orange" />
          <StatCard label="Recusados" value={totals.refused} color="red" />
          <StatCard label="Não Localizados" value={totals.notFound} color="yellow" />
        </div>

        {/* Progresso do Dia */}
        {todayRoutes.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Progresso do Dia
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">{dayProgress}%</span>
                <span className="text-sm text-gray-500">
                  {totalCompleted}/{totalQueued} imóveis
                </span>
              </div>
            </div>

            {/* Barra de progresso geral */}
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-4 rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${dayProgress}%` }}
              />
            </div>

            {/* Cards por agente */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {todayRoutes.map(route => {
                const agent = agents.find(a => a.id === route.agent_id)
                const total = route.property_ids?.length ?? 0
                const completed = route.completed_ids?.length ?? 0
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0
                const isDone = pct === 100

                return (
                  <div
                    key={route.id}
                    className={`rounded-lg border p-4 ${isDone ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 text-sm">
                        {agent?.name ?? 'Agente'}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isDone ? 'bg-green-100 text-green-700' :
                        pct > 0 ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {isDone ? 'Concluída' : pct > 0 ? `${pct}%` : 'Pendente'}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${isDone ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{completed}/{total} imóveis visitados</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Cobertura por setor */}
        {coverage.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Cobertura nos Últimos 2 Meses
            </h2>
            <div className="space-y-4">
              {coverage.map(c => (
                <div key={c.sector_id}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 gap-1">
                    <span className="text-sm font-medium text-gray-900">{c.sector_name}</span>
                    <div className="flex items-center gap-2 md:gap-3 text-xs text-gray-500 flex-wrap">
                      <span>{c.visited_properties}/{c.total_properties} imóveis</span>
                      {c.focus_properties > 0 && <span className="text-orange-600 font-medium inline-flex items-center gap-1"><IconCircleRed size={12} /> {c.focus_properties} foco</span>}
                      {c.closed_properties > 0 && <span className="text-gray-500 inline-flex items-center gap-1"><IconLock size={12} /> {c.closed_properties} fech.</span>}
                      {c.complaint_properties > 0 && <span className="text-red-600 font-medium inline-flex items-center gap-1"><IconAlertTriangle size={12} /> {c.complaint_properties} den.</span>}
                      <span className="font-semibold text-gray-900">{c.coverage_pct ?? 0}%</span>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        (c.coverage_pct ?? 0) >= 80 ? 'bg-green-500' :
                        (c.coverage_pct ?? 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(c.coverage_pct ?? 0, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grafico de visitas por dia */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Visitas por Dia</h2>
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
      </main>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50',
    yellow: 'text-yellow-600 bg-yellow-50',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-3xl font-bold ${colors[color]?.split(' ')[0]}`}>{value.toLocaleString('pt-BR')}</p>
    </div>
  )
}
