import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { useProperty } from '../../../src/hooks/useProperties'
import { usePropertyVisits } from '../../../src/hooks/useVisits'

const STATUS_COLORS: Record<string, string> = {
  visitado_sem_foco: '#10b981',
  visitado_com_achado: '#f97316',
  fechado: '#6b7280',
  recusado: '#ef4444',
  nao_localizado: '#f59e0b',
  pendente_revisao: '#8b5cf6',
}

const STATUS_LABEL: Record<string, string> = {
  visitado_sem_foco: 'Sem foco',
  visitado_com_achado: 'Com achado',
  fechado: 'Fechado',
  recusado: 'Recusado',
  nao_localizado: 'Não localizado',
  pendente_revisao: 'Pendente',
}

export default function PropertyDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>()
  const propertyId = Array.isArray(params.id) ? params.id[0] : params.id
  const { data: property } = useProperty(propertyId ?? '')
  const { data: visits } = usePropertyVisits(propertyId ?? '')

  if (!property) {
    return (
      <View style={s.centered}>
        <Text style={s.loadingText}>Carregando imóvel...</Text>
      </View>
    )
  }

  const recentVisits = visits?.slice(0, 3) ?? []
  const allVisits = visits ?? []
  const lastVisit = allVisits[0]
  const hasFindingHistory = allVisits.filter(v => v.status === 'visitado_com_achado').length
  const isRecurringFocus = hasFindingHistory >= 2

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.hero}>
        <Text style={s.heroTitle}>{property.address}</Text>
        <Text style={s.heroMeta}>{property.owner_name ?? 'Responsável não informado'}</Text>
        <Text style={s.heroMeta}>{property.owner_phone ?? 'Telefone não informado'}</Text>
        {isRecurringFocus && (
          <View style={s.warningBadge}>
            <MaterialIcons name="warning" size={14} color="#92400e" />
            <Text style={s.warningText}>Foco recorrente ({hasFindingHistory} ocorrências)</Text>
          </View>
        )}
      </View>

      {/* Resumo rápido */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statNum}>{allVisits.length}</Text>
          <Text style={s.statLabel}>Total visitas</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statNum}>{hasFindingHistory}</Text>
          <Text style={s.statLabel}>Com achado</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statNum}>{lastVisit ? new Date(lastVisit.visited_at ?? lastVisit.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'}</Text>
          <Text style={s.statLabel}>Última visita</Text>
        </View>
      </View>

      <TouchableOpacity style={s.actionBtn} onPress={() => router.push('/(app)/visit/new')}>
        <MaterialIcons name="add-circle" size={20} color="#fff" />
        <Text style={s.actionText}>Registrar visita neste imóvel</Text>
      </TouchableOpacity>

      {/* Últimas 3 visitas */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Últimas Visitas</Text>
        {recentVisits.length === 0 && <Text style={s.emptyText}>Ainda não há visitas registradas.</Text>}
        {recentVisits.map((visit) => (
          <TouchableOpacity key={visit.id} style={s.visitCard} onPress={() => router.push(`/(app)/visit/${visit.id}`)}>
            <View style={s.visitHeader}>
              <View style={s.visitStatusRow}>
                <View style={[s.statusDot, { backgroundColor: STATUS_COLORS[visit.status] ?? '#9ca3af' }]} />
                <Text style={s.visitStatus}>{STATUS_LABEL[visit.status] ?? visit.status}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color="#9ca3af" />
            </View>
            <Text style={s.visitMeta}>{visit.visited_at ? new Date(visit.visited_at).toLocaleString('pt-BR') : 'Sem data'}</Text>
            {visit.notes ? <Text style={s.visitNotes} numberOfLines={2}>{visit.notes}</Text> : null}
          </TouchableOpacity>
        ))}
        {allVisits.length > 3 && (
          <Text style={s.moreText}>+ {allVisits.length - 3} visitas anteriores</Text>
        )}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  loadingText: { color: '#6b7280', fontSize: 14 },
  hero: { backgroundColor: '#006B3F', borderRadius: 16, padding: 20 },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  heroMeta: { color: '#d1fae5', fontSize: 13, marginTop: 4 },
  warningBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef3c7', borderRadius: 8, padding: 8, marginTop: 12 },
  warningText: { fontSize: 12, color: '#92400e', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statNum: { fontSize: 20, fontWeight: '800', color: '#006B3F' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#111827', borderRadius: 12, padding: 16 },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  emptyText: { color: '#9ca3af', fontSize: 13 },
  visitCard: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, marginBottom: 8 },
  visitHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  visitStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  visitStatus: { fontSize: 13, fontWeight: '700', color: '#111827' },
  visitMeta: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  visitNotes: { fontSize: 13, color: '#374151', marginTop: 6 },
  moreText: { color: '#006B3F', fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 8 },
})
