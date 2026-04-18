'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '../../lib/supabase-browser'
import DashboardClient from '../../components/DashboardClient'

function getTodayBR(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any[]>([])
  const [sectors, setSectors] = useState<any[]>([])
  const [coverage, setCoverage] = useState<any[]>([])
  const [todayRoutes, setTodayRoutes] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const visibleRef = useRef(true)

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient()
      const today = getTodayBR()

      const { data: { user } } = await supabase.auth.getUser()
      let role = 'coordinator'
      let sectorId: string | null = null
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, sector_id')
          .eq('id', user.id)
          .single()
        if (profile) {
          role = profile.role
          sectorId = profile.sector_id
        }
      }

      const [statsRes, sectorsRes, coverageRes, routesRes, agentsRes] = await Promise.all([
        supabase.from('vw_sector_stats').select('*').order('day', { ascending: false }).limit(100),
        supabase.from('sectors').select('*'),
        supabase.from('vw_sector_coverage').select('*'),
        supabase.from('daily_routes').select('*').eq('route_date', today),
        supabase.from('profiles').select('id, name, role, sector_id'),
      ])

      let filteredStats = statsRes.data ?? []
      let filteredCoverage = coverageRes.data ?? []
      let filteredRoutes = routesRes.data ?? []
      let filteredAgents = agentsRes.data ?? []

      if (role === 'coordinator' && sectorId) {
        filteredStats = filteredStats.filter((s: any) => s.sector_id === sectorId)
        filteredCoverage = filteredCoverage.filter((c: any) => c.sector_id === sectorId)
        filteredRoutes = filteredRoutes.filter((r: any) => {
          const agent = filteredAgents.find((a: any) => a.id === r.agent_id)
          return agent?.sector_id === sectorId
        })
        filteredAgents = filteredAgents.filter((a: any) => a.sector_id === sectorId)
      }

      setStats(filteredStats)
      setSectors(sectorsRes.data ?? [])
      setCoverage(filteredCoverage)
      setTodayRoutes(filteredRoutes)
      setAgents(filteredAgents)
      setLastUpdated(new Date())
    } catch { /* silently handle */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()

    // Pausar polling quando tab nao esta visivel
    const handleVisibility = () => {
      visibleRef.current = document.visibilityState === 'visible'
      if (visibleRef.current) fetchData()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const interval = setInterval(() => {
      if (visibleRef.current) fetchData()
    }, 30000)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchData])

  if (loading) return <div className="p-8 text-gray-400">Carregando...</div>

  return (
    <DashboardClient
      stats={stats}
      sectors={sectors}
      coverage={coverage}
      todayRoutes={todayRoutes}
      agents={agents}
      lastUpdated={lastUpdated}
      onRefresh={fetchData}
    />
  )
}
