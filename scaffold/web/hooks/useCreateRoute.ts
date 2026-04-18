import { createClient } from '../lib/supabase-browser'
import { useState } from 'react'

export function useCreateRoute() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const createRoute = async ({
    agentId,
    routeDate,
    propertyIds,
    notes,
  }: {
    agentId: string
    routeDate: string
    propertyIds: string[]
    notes?: string
  }) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('daily_routes')
        .upsert(
          {
            agent_id: agentId,
            route_date: routeDate,
            property_ids: propertyIds,
            completed_ids: [],
            notes: notes ?? null,
          },
          { onConflict: 'agent_id,route_date' }
        )
        .select()
        .single()

      if (error) throw error
      return data
    } finally {
      setLoading(false)
    }
  }

  return { createRoute, loading }
}
