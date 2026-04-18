import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import { useAuthStore } from '../../src/store/auth'
import { useMyVisits } from '../../src/hooks/useVisits'
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'

const STATUS_COLOR: Record<string, string> = {
  visitado_sem_foco: '#10b981',
  visitado_com_achado: '#f97316',
  fechado: '#6b7280',
  recusado: '#ef4444',
  nao_localizado: '#f59e0b',
  pendente_revisao: '#8b5cf6',
}

const STATUS_LABEL: Record<string, string> = {
  visitado_sem_foco: 'Sem Foco',
  visitado_com_achado: 'Com Achado',
  fechado: 'Fechado',
  recusado: 'Recusado',
  nao_localizado: 'Não Localizado',
  pendente_revisao: 'Pendente',
}

export default function HistoryScreen() {
  const user = useAuthStore((s) => s.user)
  const { data: visits, isLoading, refetch } = useMyVisits(user?.id ?? '')

  return (
    <FlatList
      style={s.container}
      data={visits}
      keyExtractor={(item) => item.id}
      refreshing={isLoading}
      onRefresh={refetch}
      contentContainerStyle={s.content}
      ListHeaderComponent={<Text style={s.title}>Minhas Visitas ({visits?.length ?? 0})</Text>}
      ListEmptyComponent={
        <View style={s.empty}>
          <MaterialIcons name="history" size={48} color="#d1d5db" />
          <Text style={s.emptyText}>Nenhuma visita registrada</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={s.card} onPress={() => router.push(`/(app)/visit/${item.id}`)}>
          <View style={[s.badge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
            <Text style={[s.badgeText, { color: STATUS_COLOR[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
          </View>
          <Text style={s.address} numberOfLines={1}>{(item as any).properties?.address ?? '—'}</Text>
          <Text style={s.meta}>{item.visited_at ? new Date(item.visited_at).toLocaleString('pt-BR') : '—'}</Text>
        </TouchableOpacity>
      )}
    />
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  address: { fontSize: 14, fontWeight: '500', color: '#111827' },
  meta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#9ca3af', fontSize: 14, marginTop: 12 },
})
