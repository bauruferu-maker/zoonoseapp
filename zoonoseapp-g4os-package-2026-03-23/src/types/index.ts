export * from './database'
import type { VisitStatus } from './database'

export interface OfflineVisit {
  localId: string
  propertyId: string
  status: VisitStatus
  notes: string | null
  lat: number | null
  lng: number | null
  photos: string[]
  visitedAt: string
  synced: boolean
}

export interface SyncQueue {
  pending: OfflineVisit[]
  lastSyncAt: string | null
}
