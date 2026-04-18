import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import NetInfo from '@react-native-community/netinfo'
import { supabase } from '../lib/supabase'
import { getPendingVisits, markVisitSynced, getPendingCount } from '../lib/localDb'

interface SyncState {
  isOnline: boolean
  pendingCount: number
  syncing: boolean
  syncProgress: string
  lastSyncAt: Date | null
  syncNow: () => Promise<void>
}

const SyncContext = createContext<SyncState>({
  isOnline: true,
  pendingCount: 0,
  syncing: false,
  syncProgress: '',
  lastSyncAt: null,
  syncNow: async () => {},
})

export function useSyncState() {
  return useContext(SyncContext)
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState('')
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const syncingRef = useRef(false)

  // Monitorar conectividade
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = !!(state.isConnected && state.isInternetReachable !== false)
      setIsOnline(online)
    })
    return () => unsubscribe()
  }, [])

  // Atualizar contagem de pendentes
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount()
      setPendingCount(count)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    refreshPendingCount()
    const interval = setInterval(refreshPendingCount, 5000)
    return () => clearInterval(interval)
  }, [refreshPendingCount])

  // Sincronizar visitas pendentes
  const syncNow = useCallback(async () => {
    if (syncingRef.current || !isOnline) return
    syncingRef.current = true
    setSyncing(true)

    try {
      const pending = await getPendingVisits()
      let synced = 0

      for (let i = 0; i < pending.length; i++) {
        const visit = pending[i]
        setSyncProgress(`Enviando ${i + 1} de ${pending.length}...`)
        try {
          const payload: any = {
            property_id: visit.property_id,
            agent_id: visit.agent_id,
            visited_at: visit.visited_at,
            status: visit.status,
            visit_type: visit.visit_type,
            focus_type: visit.focus_type,
            action_taken: visit.action_taken,
            notes: visit.notes,
            lat_start: visit.lat_start ?? null,
            lng_start: visit.lng_start ?? null,
            lat_end: visit.lat_end ?? null,
            lng_end: visit.lng_end ?? null,
            accuracy_meters: visit.accuracy_meters ?? null,
            started_at: visit.started_at ?? null,
            duration_seconds: visit.duration_seconds ?? null,
            confidence_score: visit.confidence_score ?? 0,
          }

          const { data: visitData, error } = await supabase
            .from('visits')
            .insert(payload)
            .select('id')
            .single()

          if (error) continue

          // Upload da foto offline se existir
          if (visit.photo_uri && visitData?.id) {
            try {
              const ext = visit.photo_uri.split('.').pop()?.toLowerCase() || 'jpg'
              const fileName = `${visit.agent_id}/${visitData.id}.${ext}`
              const response = await fetch(visit.photo_uri)
              const blob = await response.blob()

              const { error: uploadErr } = await supabase.storage
                .from('visit-photos')
                .upload(fileName, blob, {
                  contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
                  upsert: true,
                })

              if (!uploadErr) {
                const { data: urlData } = supabase.storage
                  .from('visit-photos')
                  .getPublicUrl(fileName)

                const photoUrl = urlData.publicUrl
                // Tenta photo_url, fallback para notes
                const { error: colErr } = await supabase
                  .from('visits')
                  .update({ photo_url: photoUrl })
                  .eq('id', visitData.id)

                if (colErr) {
                  const updatedNotes = visit.notes
                    ? `${visit.notes}\n[foto: ${photoUrl}]`
                    : `[foto: ${photoUrl}]`
                  await supabase.from('visits').update({ notes: updatedNotes }).eq('id', visitData.id)
                }
              }
            } catch {
              console.warn(`Foto da visita ${visitData.id} não foi enviada. Será tentada novamente.`)
            }
          }

          await markVisitSynced(visit.id)
          synced++
        } catch {
          // Continua com as demais
        }
      }

      if (synced > 0) {
        setLastSyncAt(new Date())
        await refreshPendingCount()
      }

      if (synced > 0 && synced === pending.length) {
        setSyncProgress(`${synced} visitas sincronizadas`)
      } else if (pending.length > 0 && synced < pending.length) {
        setSyncProgress(`${synced} de ${pending.length} sincronizadas. Restantes serão tentadas novamente.`)
      }
    } catch {
      // Silencioso
    } finally {
      syncingRef.current = false
      setSyncing(false)
      setSyncProgress('')
    }
  }, [isOnline, refreshPendingCount])

  // Auto-sync quando volta online (com debounce para evitar loop)
  const lastAutoSyncRef = useRef(0)
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      const now = Date.now()
      if (now - lastAutoSyncRef.current > 30000) {
        lastAutoSyncRef.current = now
        syncNow()
      }
    }
  }, [isOnline, syncNow]) // removido pendingCount para evitar loop

  return (
    <SyncContext.Provider value={{ isOnline, pendingCount, syncing, syncProgress, lastSyncAt, syncNow }}>
      {children}
    </SyncContext.Provider>
  )
}
