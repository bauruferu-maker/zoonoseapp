import { create } from 'zustand'
import { MMKV } from 'react-native-mmkv'
import NetInfo from '@react-native-community/netinfo'
import { supabase } from '../lib/supabase'
import type { OfflineVisit, SyncQueue } from '../types'

const storage = new MMKV()
const QUEUE_KEY = 'sync_queue'

function getQueue(): SyncQueue {
  const raw = storage.getString(QUEUE_KEY)
  return raw ? JSON.parse(raw) : { pending: [], lastSyncAt: null }
}

function saveQueue(q: SyncQueue) {
  storage.set(QUEUE_KEY, JSON.stringify(q))
}

interface SyncState {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  enqueue: (visit: Omit<OfflineVisit, 'localId' | 'synced'>) => void
  sync: () => Promise<void>
  watchConnectivity: () => () => void
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: true,
  isSyncing: false,
  pendingCount: getQueue().pending.length,

  enqueue: (visit) => {
    const q = getQueue()
    const entry: OfflineVisit = {
      ...visit,
      localId: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      synced: false,
    }
    q.pending.push(entry)
    saveQueue(q)
    set({ pendingCount: q.pending.length })
  },

  sync: async () => {
    const { isOnline, isSyncing } = get()
    if (!isOnline || isSyncing) return
    set({ isSyncing: true })

    const q = getQueue()
    const stillPending: OfflineVisit[] = []

    for (const item of q.pending) {
      try {
        const { error } = await supabase.from('visits').insert({
          property_id: item.propertyId,
          agent_id: (await supabase.auth.getUser()).data.user!.id,
          status: item.status,
          notes: item.notes,
          lat: item.lat,
          lng: item.lng,
          visited_at: item.visitedAt,
          synced_at: new Date().toISOString(),
        })
        if (error) throw error
      } catch {
        stillPending.push(item)
      }
    }

    q.pending = stillPending
    q.lastSyncAt = new Date().toISOString()
    saveQueue(q)
    set({ isSyncing: false, pendingCount: stillPending.length })
  },

  watchConnectivity: () => {
    const unsub = NetInfo.addEventListener((state) => {
      const online = !!(state.isConnected && state.isInternetReachable)
      set({ isOnline: online })
      if (online) get().sync()
    })
    return unsub
  },
}))
