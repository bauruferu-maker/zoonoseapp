import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useSyncStore } from '../store/sync'
import type { Visit, VisitStatus } from '../types'

type VisitListItem = Visit & {
  properties?: {
    address: string
    sector_id: string
  } | null
}

type VisitDetail = Visit & {
  properties?: {
    id: string
    address: string
    owner_name: string | null
    owner_phone: string | null
  } | null
  profiles?: {
    name: string
    email: string
  } | null
}

export function useMyVisits(agentId: string) {
  return useQuery<VisitListItem[]>({
    queryKey: ['visits', agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select(`*, properties(address, sector_id)`)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as VisitListItem[]
    },
    enabled: !!agentId,
  })
}

export function usePropertyVisits(propertyId: string) {
  return useQuery<Visit[]>({
    queryKey: ['visits', 'property', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('property_id', propertyId)
        .order('visited_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Visit[]
    },
    enabled: !!propertyId,
  })
}

export function useVisitDetail(visitId: string) {
  return useQuery<VisitDetail | null>({
    queryKey: ['visits', 'detail', visitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          properties(*),
          profiles:agent_id(name, email)
        `)
        .eq('id', visitId)
        .single()
      if (error) throw error
      return data as VisitDetail
    },
    enabled: !!visitId,
  })
}

export function useCreateVisit() {
  const qc = useQueryClient()
  const { enqueue, isOnline, sync } = useSyncStore()

  return useMutation({
    mutationFn: async (payload: {
      propertyId: string
      status: VisitStatus
      notes: string | null
      lat: number | null
      lng: number | null
      photos: string[]
    }) => {
      if (!isOnline) {
        enqueue({ ...payload, visitedAt: new Date().toISOString() })
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('visits').insert({
        property_id: payload.propertyId,
        agent_id: user!.id,
        status: payload.status,
        notes: payload.notes,
        lat: payload.lat,
        lng: payload.lng,
        visited_at: new Date().toISOString(),
        synced_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] })
      if (isOnline) sync()
    },
  })
}
