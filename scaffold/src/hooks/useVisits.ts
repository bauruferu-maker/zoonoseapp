import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { uploadVisitPhotos } from '../lib/upload'
import { useSyncStore } from '../store/sync'
import type { Visit, VisitStatus } from '../types'

export function useMyVisits(agentId: string) {
  return useQuery({
    queryKey: ['visits', agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select(`*, properties(address, sector_id)`)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!agentId,
  })
}

export function usePropertyVisits(propertyId: string) {
  return useQuery({
    queryKey: ['visits', 'property', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('property_id', propertyId)
        .order('visited_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!propertyId,
  })
}

export function useVisitDetail(visitId: string) {
  return useQuery({
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
      return data
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
      visitTypeId: string | null
      focusTypeId: string | null
      actionTakenId: string | null
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
      const { data: visit, error } = await supabase.from('visits').insert({
        property_id: payload.propertyId,
        agent_id: user!.id,
        status: payload.status,
        visit_type_id: payload.visitTypeId,
        focus_type_id: payload.focusTypeId,
        action_taken_id: payload.actionTakenId,
        notes: payload.notes,
        lat: payload.lat,
        lng: payload.lng,
        visited_at: new Date().toISOString(),
        synced_at: new Date().toISOString(),
      }).select('id').single()
      if (error) throw error

      // Upload fotos e registrar evidências
      if (payload.photos.length > 0 && visit) {
        const urls = await uploadVisitPhotos(visit.id, payload.photos)
        for (const url of urls) {
          await supabase.from('evidences').insert({
            visit_id: visit.id,
            type: 'photo',
            url,
            thumbnail_url: null,
          })
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] })
      if (isOnline) sync()
    },
  })
}
