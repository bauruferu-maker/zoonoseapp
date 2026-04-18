import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function usePropertiesBySector(sectorId: string) {
  return useQuery({
    queryKey: ['properties', sectorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('sector_id', sectorId)
        .order('address')
      if (error) throw error
      return data
    },
    enabled: !!sectorId,
  })
}

export function usePropertySearch(query: string) {
  return useQuery({
    queryKey: ['properties', 'search', query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .ilike('address', `%${query}%`)
        .limit(20)
      if (error) throw error
      return data
    },
    enabled: query.length > 2,
  })
}

export function useProperty(propertyId: string) {
  return useQuery({
    queryKey: ['properties', 'detail', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!propertyId,
  })
}
