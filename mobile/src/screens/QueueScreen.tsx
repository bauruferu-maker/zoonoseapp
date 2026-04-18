import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { useSyncState } from '../contexts/SyncContext'
import { supabase } from '../lib/supabase'
import { cacheQueue, cacheRoute, getCachedQueue, getCachedRoute } from '../lib/localDb'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

interface QueueItem {
  property_id: string
  address: string
  sector_name: string
  owner_name: string | null
  priority: 'alta' | 'media' | 'baixa'
  priority_reason: string
  total_visits: number
  last_visited_at: string | null
  completed: boolean
  lat: number | null
  lng: number | null
}

const PRIORITY_COLORS = {
  alta: { bg: '#FEE2E2', border: '#FECACA', text: '#991B1B', dot: '#EF4444', icon: '🚨', label: 'Urgente' },
  media: { bg: '#FEF3C7', border: '#FDE68A', text: '#92400E', dot: '#F59E0B', icon: '⚠️', label: 'Atenção' },
  baixa: { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', dot: '#22C55E', icon: '✅', label: 'Normal' },
}

export default function QueueScreen() {
  const { profile, signOut } = useAuth()
  const { isOnline, pendingCount, syncing, syncProgress, syncNow } = useSyncState()
  const navigation = useNavigation<NativeStackNavigationProp<any>>()
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  const fetchQueue = useCallback(async () => {
    if (!profile) return

    try {
      if (isOnline) {
        // Online: buscar do Supabase e cachear
        const { data: route } = await supabase
          .from('daily_routes')
          .select('id, property_ids, completed_ids')
          .eq('agent_id', profile.id)
          .eq('route_date', today)
          .single()

        if (route && route.property_ids?.length > 0) {
          // Cachear rota
          await cacheRoute(route)

          const { data: queueData } = await supabase
            .from('vw_work_queue')
            .select('*')
            .in('property_id', route.property_ids)
            .order('priority_order')

          const completed = route.completed_ids ?? []
          const items = (queueData ?? []).map(item => ({
            ...item,
            completed: completed.includes(item.property_id),
          }))

          // Cachear fila
          await cacheQueue(queueData ?? [])
          setQueue(items)
        } else {
          const { data: queueData } = await supabase
            .from('vw_work_queue')
            .select('*')
            .eq('sector_id', profile.sector_id)
            .order('priority_order')
            .limit(20)

          await cacheQueue(queueData ?? [])
          setQueue((queueData ?? []).map(item => ({ ...item, completed: false })))
        }
      } else {
        // Offline: usar cache local
        const cachedRoute = await getCachedRoute(profile.id, today)
        const cachedQueue = await getCachedQueue()

        if (cachedRoute && cachedQueue.length > 0) {
          const routePropertyIds = cachedRoute.property_ids ?? []
          const completedIds = cachedRoute.completed_ids ?? []

          const filtered = cachedQueue.filter(q => routePropertyIds.includes(q.property_id))
          setQueue(filtered.map(item => ({
            ...item,
            completed: completedIds.includes(item.property_id),
          })))
        } else {
          setQueue(cachedQueue.map(item => ({ ...item, completed: false })))
        }
      }
    } catch {
      // Fallback para cache
      const cachedQueue = await getCachedQueue()
      setQueue(cachedQueue.map(item => ({ ...item, completed: false })))
    }

    setLoading(false)
  }, [profile, today, isOnline])

  useEffect(() => { fetchQueue() }, [fetchQueue])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    if (isOnline && pendingCount > 0) {
      await syncNow()
    }
    await fetchQueue()
    setRefreshing(false)
  }, [fetchQueue, isOnline, pendingCount, syncNow])

  const progress = queue.length > 0
    ? Math.round(queue.filter(q => q.completed).length / queue.length * 100)
    : 0

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Carregando fila...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {profile?.name?.split(' ')[0]}</Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Status bar: online/offline + sync */}
      <View style={[styles.statusBar, isOnline ? styles.statusOnline : styles.statusOffline]}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? '#22C55E' : '#EF4444' }]} />
          <Text style={styles.statusText}>
            {isOnline ? 'Online' : 'Offline — dados locais'}
          </Text>
        </View>
        {pendingCount > 0 && (
          <TouchableOpacity onPress={syncNow} disabled={syncing || !isOnline}>
            <Text style={styles.syncText}>
              {syncing && syncProgress ? syncProgress : syncing ? 'Sincronizando...' : `${pendingCount} pendente${pendingCount > 1 ? 's' : ''}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progresso */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Minha Fila do Dia</Text>
          <Text style={styles.progressCount}>
            {queue.filter(q => q.completed).length}/{queue.length}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressPercent}>{progress}% concluído</Text>
      </View>

      {/* Lista */}
      <FlatList
        data={queue}
        keyExtractor={item => item.property_id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum imóvel na fila hoje</Text>
            <Text style={styles.emptySubtext}>Solicite uma fila ao coordenador</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const colors = PRIORITY_COLORS[item.priority] ?? PRIORITY_COLORS.baixa
          return (
            <TouchableOpacity
              style={[styles.card, item.completed && styles.cardCompleted]}
              onPress={() => {
                if (!item.completed) {
                  navigation.navigate('RegisterVisit', {
                    propertyId: item.property_id,
                    address: item.address,
                    sectorName: item.sector_name,
                    ownerName: item.owner_name,
                    propertyLat: item.lat ?? null,
                    propertyLng: item.lng ?? null,
                  })
                }
              }}
              disabled={item.completed}
            >
              <View style={styles.cardRow}>
                <View style={[styles.dot, { backgroundColor: item.completed ? '#9CA3AF' : colors.dot }]} />
                <View style={styles.cardContent}>
                  <Text style={[styles.cardIndex, item.completed && styles.textMuted]}>
                    #{index + 1}
                  </Text>
                  <Text style={[styles.cardAddress, item.completed && styles.textStrike]}>
                    {item.address}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {item.sector_name}{item.owner_name ? ` · ${item.owner_name}` : ''}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: item.completed ? '#E5E7EB' : colors.bg }]}>
                    <Text style={[styles.badgeText, { color: item.completed ? '#6B7280' : colors.text }]}>
                      {item.completed ? 'Concluído' : `${colors.icon} ${item.priority_reason}`}
                    </Text>
                  </View>
                </View>
                {!item.completed && (
                  <Text style={styles.chevron}>›</Text>
                )}
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  header: {
    backgroundColor: '#14532d', paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  greeting: { color: '#fff', fontSize: 20, fontWeight: '700' },
  dateText: { color: '#86EFAC', fontSize: 13, marginTop: 2 },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' },
  logoutText: { color: '#D1FAE5', fontSize: 13, fontWeight: '600' },
  statusBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  statusOnline: { backgroundColor: '#F0FDF4' },
  statusOffline: { backgroundColor: '#FEF2F2' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  syncText: { fontSize: 12, fontWeight: '600', color: '#2563EB' },
  progressCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8, borderRadius: 12,
    padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  progressCount: { fontSize: 15, fontWeight: '700', color: '#16a34a' },
  progressBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#16a34a', borderRadius: 4 },
  progressPercent: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  emptySubtext: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 10, borderRadius: 12,
    padding: 14, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardCompleted: { opacity: 0.6 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  cardContent: { flex: 1 },
  cardIndex: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  cardAddress: { fontSize: 15, fontWeight: '600', color: '#111827', marginTop: 2 },
  textStrike: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  textMuted: { color: '#9CA3AF' },
  cardMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  chevron: { fontSize: 24, color: '#D1D5DB', marginLeft: 8 },
})
