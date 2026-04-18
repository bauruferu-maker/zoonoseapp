import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useAuthStore } from '../../src/store/auth'
import { useSyncStore } from '../../src/store/sync'
import { useMyVisits } from '../../src/hooks/useVisits'
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  visitado_sem_foco: { label: 'Sem Foco', color: '#10b981' },
  visitado_com_achado: { label: 'Com Achado', color: '#f97316' },
  fechado: { label: 'Fechado', color: '#6b7280' },
  recusado: { label: 'Recusado', color: '#ef4444' },
  nao_localizado: { label: 'Não Localizado', color: '#f59e0b' },
  pendente_revisao: { label: 'Pendente', color: '#8b5cf6' },
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user)
  const { pendingCount, isOnline } = useSyncStore()
  const { data: visits, isLoading } = useMyVisits(user?.id ?? '')

  const today = visits?.filter(v => v.visited_at?.startsWith(new Date().toISOString().slice(0, 10))) ?? []

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {!isOnline && (
        <View style={s.offlineBanner}>
          <MaterialIcons name="wifi-off" size={16} color="#92400e" />
          <Text style={s.offlineText}>Offline — {pendingCount} visita(s) aguardando sincronização</Text>
        </View>
      )}

      <View style={s.header}>
        <Text style={s.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
        <Text style={s.date}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
      </View>

      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statNum}>{today.length}</Text>
          <Text style={s.statLabel}>Hoje</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statNum}>{visits?.length ?? 0}</Text>
          <Text style={s.statLabel}>Total</Text>
        </View>
        <View style={[s.statCard, pendingCount > 0 && s.statCardWarning]}>
          <Text style={s.statNum}>{pendingCount}</Text>
          <Text style={s.statLabel}>Pendentes</Text>
        </View>
      </View>

      <TouchableOpacity style={s.ctaBtn} onPress={() => router.push('/(app)/visit/new')}>
        <MaterialIcons name="add" size={22} color="#fff" />
        <Text style={s.ctaBtnText}>Registrar Nova Visita</Text>
      </TouchableOpacity>

      <View style={s.quickActions}>
        <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/(app)/map')}>
          <MaterialIcons name="map" size={20} color="#006B3F" />
          <Text style={s.quickBtnText}>Mapa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/(app)/history')}>
          <MaterialIcons name="history" size={20} color="#006B3F" />
          <Text style={s.quickBtnText}>Histórico</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/(app)/properties')}>
          <MaterialIcons name="home-work" size={20} color="#006B3F" />
          <Text style={s.quickBtnText}>Imóveis</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sectionTitle}>Visitas Recentes</Text>
      {isLoading && <Text style={s.loadingText}>Carregando...</Text>}
      {visits?.slice(0, 10).map((v: any) => (
        <TouchableOpacity key={v.id} style={s.visitCard} onPress={() => router.push(`/(app)/visit/${v.id}`)}>
          <View style={[s.statusDot, { backgroundColor: STATUS_LABELS[v.status]?.color }]} />
          <View style={s.visitInfo}>
            <Text style={s.visitAddress} numberOfLines={1}>{v.properties?.address ?? '—'}</Text>
            <Text style={s.visitMeta}>{STATUS_LABELS[v.status]?.label} · {v.visited_at ? new Date(v.visited_at).toLocaleDateString('pt-BR') : '—'}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  offlineBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef3c7', padding: 10, borderRadius: 8, marginBottom: 12 },
  offlineText: { fontSize: 12, color: '#92400e', flex: 1 },
  header: { marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#111827' },
  date: { fontSize: 13, color: '#6b7280', marginTop: 2, textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statCardWarning: { backgroundColor: '#fef3c7' },
  statNum: { fontSize: 28, fontWeight: '800', color: '#006B3F' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#006B3F', borderRadius: 12, padding: 16, marginBottom: 24 },
  ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', borderRadius: 10, padding: 12 },
  quickBtnText: { color: '#065f46', fontWeight: '600', fontSize: 13 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  loadingText: { color: '#9ca3af', textAlign: 'center', padding: 20 },
  visitCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  visitInfo: { flex: 1 },
  visitAddress: { fontSize: 14, fontWeight: '500', color: '#111827' },
  visitMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
})
