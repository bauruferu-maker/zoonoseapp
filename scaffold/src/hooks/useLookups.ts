import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { VisitType, FocusType, ActionTaken } from '../types'

export function useVisitTypes() {
  return useQuery({
    queryKey: ['visit_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visit_types')
        .select('*')
        .order('name')
      if (error) throw error
      return data as VisitType[]
    },
    staleTime: 1000 * 60 * 60, // 1h — muda raramente
  })
}

export function useFocusTypes() {
  return useQuery({
    queryKey: ['focus_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('focus_types')
        .select('*')
        .order('name')
      if (error) throw error
      return data as FocusType[]
    },
    staleTime: 1000 * 60 * 60,
  })
}

export function useActionsTaken() {
  return useQuery({
    queryKey: ['actions_taken'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('actions_taken')
        .select('*')
        .order('name')
      if (error) throw error
      return data as ActionTaken[]
    },
    staleTime: 1000 * 60 * 60,
  })
}
