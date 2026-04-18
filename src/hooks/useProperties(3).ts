import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Property } from '../types'

export function usePropertiesBySector(sectorId: string) {
  return useQuery<Property[]>({
    queryKey: ['properties', sectorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('sector_id', sectorId)
        .order('address')
      if (error) throw error
      return (data ?? []) as Property[]
    },
    enabled: !!sectorId,
  })
}

export function usePropertySearch(query: string) {
  return useQuery<Property[]>({
    queryKey: ['properties', 'search', query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .ilike('address', `%${query}%`)
        .limit(20)
      if (error) throw error
      return (data ?? []) as Property[]
    },
    enabled: query.length > 2,
  })
}

export function useProperty(propertyId: string) {
  return useQuery<Property | null>({
    queryKey: ['properties', 'detail', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()
      if (error) throw error
      return data as Property
    },
    enabled: !!propertyId,
  })
}
