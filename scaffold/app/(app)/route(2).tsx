import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuthStore } from '../../src/store/auth'
import { useMyRouteToday, useRouteProperties, useMarkPropertyCompleted } from '../../src/hooks/useRoutes'
import type { Property } from '../../src/types'

export default function RouteScreen() {
  const user = useAuthStore((s) => s.user)
  const { data: route, isLoading } = useMyRouteToday(user?.id ?? '')
  const { data: properties } = useRouteProperties(route?.property_ids ?? [])
  const markCompleted = useMarkPropertyCompleted()

  if (isLoading) {
    return (
      <View style={s.centered}>
        <Text style={s.loadingText}>Carregando rota...</Text>
      </View>
    )
  }

  if (!route) {
    return (
      <View style={s.centered}>
        <MaterialIcons name="route" size={64} color="#d1d5db" />
        <Text style={s.emptyTitle}>Sem rota para hoje</Text>
        <Text style={s.emptyText}>O coordenador ainda não definiu sua rota de visitas para hoje.</Text>
      </View>
    )
  }

  const completedSet = new Set(route.completed_ids)
  const total = route.property_ids.length
  const done = route.completed_ids.length
  const progress = total > 0 ? done / total : 0

  // Ordena: pendentes primeiro, completos no final
  const sorted = [...(properties ?? [])].sort((a, b) => {
    const aDone = completedSet.has(a.id) ? 1 : 0
    const bDone = completedSet.has(b.id) ? 1 : 0
    return aDone - bDone
  })

  const handleComplete = (propertyId: string) => {
    markCompleted.mutate({ routeId: route.id, propertyId })
  }

  const renderItem = ({ item, index }: { item: Property; index: number }) => {
    const isCompleted = completedSet.has(item.id)
    return (
      <View style={[s.card, isCompleted && s.cardCompleted]}>
        <View style={s.cardLeft}>
          <View style={[s.numBadge, isCompleted && s.numBadgeDone]}>
            {isCompleted ? (
              <MaterialIcons name="check" size={16} color="#fff" />
            ) : (
              <Text style={s.numText}>{index + 1}</Text>
            )}
          </View>
        </View>
        <View style={s.cardContent}>
          <Text style={[s.cardAddress, isCompleted && s.cardAddressDone]} numberOfLines={2}>
            {item.address}
          </Text>
          {item.owner_name && (
            <Text style={s.cardMeta}>{item.owner_name}</Text>
          )}
        </View>
        <View style={s.cardActions}>
          {!isCompleted && (
            <TouchableOpacity style={s.completeBtn} onPress={() => handleComplete(item.id)}>
              <MaterialIcons name="check-circle" size={28} color="#10b981" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.push(`/(app)/properties/${item.id}`)}>
            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={s.container}>
      {/* Header de progresso */}
      <View style={s.progressHeader}>
        <View style={s.progressInfo}>
          <Text style={s.progressTitle}>Minha Rota</Text>
          <Text style={s.progressText}>{done} de {total} imóveis visitados</Text>
        </View>
        <View style={s.progressRing}>
          <Text style={s.progressPct}>{Math.round(progress * 100)}%</Text>
        </View>
      </View>
      <View style={s.progressBarBg}>
        <View style={[s.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      {route.notes && (
        <View style={s.notesBanner}>
          <MaterialIcons name="info" size={16} color="#1d4ed8" />
          <Text style={s.notesText}>{route.notes}</Text>
        </View>
      )}

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: 32, gap: 8 },
  loadingText: { color: '#6b7280', fontSize: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8 },
  progressInfo: { flex: 1 },
  progressTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  progressText: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  progressRing: { width: 48, height: 48, borderRadius: 24, borderWidth: 4, borderColor: '#006B3F', alignItems: 'center', justifyContent: 'center' },
  progressPct: { fontSize: 13, fontWeight: '800', color: '#006B3F' },
  progressBarBg: { height: 6, backgroundColor: '#e5e7eb', marginHorizontal: 16, borderRadius: 3, marginBottom: 12 },
  progressBarFill: { height: 6, backgroundColor: '#006B3F', borderRadius: 3 },
  notesBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#eff6ff', marginHorizontal: 16, padding: 12, borderRadius: 10, marginBottom: 8 },
  notesText: { fontSize: 13, color: '#1d4ed8', flex: 1 },
  list: { padding: 16, paddingTop: 0 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardCompleted: { backgroundColor: '#f0fdf4', borderColor: '#a7f3d0' },
  cardLeft: {},
  numBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#006B3F', alignItems: 'center', justifyContent: 'center' },
  numBadgeDone: { backgroundColor: '#10b981' },
  numText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  cardContent: { flex: 1 },
  cardAddress: { fontSize: 14, fontWeight: '600', color: '#111827' },
  cardAddressDone: { color: '#6b7280', textDecorationLine: 'line-through' },
  cardMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  completeBtn: {},
})
