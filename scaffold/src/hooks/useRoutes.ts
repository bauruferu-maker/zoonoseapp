import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface DailyRoute {
  id: string
  agent_id: string
  route_date: string
  property_ids: string[]
  completed_ids: string[]
  notes: string | null
  created_by: string | null
  created_at: string
}

export function useMyRouteToday(agentId: string) {
  const today = new Date().toISOString().slice(0, 10)
  return useQuery({
    queryKey: ['routes', agentId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_routes')
        .select('*')
        .eq('agent_id', agentId)
        .eq('route_date', today)
        .maybeSingle()
      if (error) throw error
      return data as DailyRoute | null
    },
    enabled: !!agentId,
  })
}

export function useRouteProperties(propertyIds: string[]) {
  return useQuery({
    queryKey: ['routes', 'properties', propertyIds],
    queryFn: async () => {
      if (propertyIds.length === 0) return []
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .in('id', propertyIds)
      if (error) throw error
      return data
    },
    enabled: propertyIds.length > 0,
  })
}

export function useMarkPropertyCompleted() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ routeId, propertyId }: { routeId: string; propertyId: string }) => {
      // Busca a rota atual para pegar completed_ids
      const { data: route, error: fetchError } = await supabase
        .from('daily_routes')
        .select('completed_ids')
        .eq('id', routeId)
        .single()
      if (fetchError) throw fetchError

      const updated = [...new Set([...route.completed_ids, propertyId])]

      const { error } = await supabase
        .from('daily_routes')
        .update({ completed_ids: updated })
        .eq('id', routeId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routes'] })
    },
  })
}
