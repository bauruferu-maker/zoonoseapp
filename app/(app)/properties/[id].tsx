import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { useProperty } from '../../../src/hooks/useProperties'
import { usePropertyVisits } from '../../../src/hooks/useVisits'

const STATUS_LABEL: Record<string, string> = {
  visitado_sem_foco: 'Sem foco',
  visitado_com_achado: 'Com achado',
  fechado: 'Fechado',
  recusado: 'Recusado',
  nao_localizado: 'Nao localizado',
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
        <Text style={s.loadingText}>Carregando imovel...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.hero}>
        <Text style={s.heroTitle}>{property.address}</Text>
        <Text style={s.heroMeta}>{property.owner_name ?? 'Responsavel nao informado'}</Text>
        <Text style={s.heroMeta}>{property.owner_phone ?? 'Telefone nao informado'}</Text>
      </View>

      <TouchableOpacity
        style={s.actionBtn}
        onPress={() =>
          router.push({
            pathname: '/(app)/visit/new',
            params: { propertyId: property.id },
          })
        }
      >
        <MaterialIcons name="add-circle" size={20} color="#fff" />
        <Text style={s.actionText}>Registrar visita neste imovel</Text>
      </TouchableOpacity>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Historico de Visitas</Text>
        {(visits ?? []).length === 0 && <Text style={s.emptyText}>Ainda nao ha visitas registradas.</Text>}
        {(visits ?? []).map((visit) => (
          <TouchableOpacity key={visit.id} style={s.visitCard} onPress={() => router.push(`/(app)/visit/${visit.id}`)}>
            <View style={s.visitHeader}>
              <Text style={s.visitStatus}>{STATUS_LABEL[visit.status] ?? visit.status}</Text>
              <MaterialIcons name="chevron-right" size={18} color="#9ca3af" />
            </View>
            <Text style={s.visitMeta}>{visit.visited_at ? new Date(visit.visited_at).toLocaleString('pt-BR') : 'Sem data'}</Text>
            {visit.notes ? <Text style={s.visitNotes}>{visit.notes}</Text> : null}
          </TouchableOpacity>
        ))}
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
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#111827', borderRadius: 12, padding: 16 },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  emptyText: { color: '#9ca3af', fontSize: 13 },
  visitCard: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, marginBottom: 8 },
  visitHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  visitStatus: { fontSize: 13, fontWeight: '700', color: '#006B3F' },
  visitMeta: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  visitNotes: { fontSize: 13, color: '#374151', marginTop: 6 },
})
