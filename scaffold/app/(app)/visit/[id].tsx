import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { useVisitDetail } from '../../../src/hooks/useVisits'

const STATUS_LABEL: Record<string, string> = {
  visitado_sem_foco: 'Visitado sem foco',
  visitado_com_achado: 'Visitado com achado',
  fechado: 'Fechado',
  recusado: 'Recusado',
  nao_localizado: 'Não localizado',
  pendente_revisao: 'Pendente de revisão',
}

export default function VisitDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>()
  const visitId = Array.isArray(params.id) ? params.id[0] : params.id
  const { data: visit } = useVisitDetail(visitId ?? '')

  if (!visit) {
    return (
      <View style={s.centered}>
        <Text style={s.loadingText}>Carregando visita...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.statusCard}>
        <Text style={s.statusLabel}>Status</Text>
        <Text style={s.statusValue}>{STATUS_LABEL[visit.status] ?? visit.status}</Text>
        <Text style={s.dateText}>
          {visit.visited_at ? new Date(visit.visited_at).toLocaleString('pt-BR') : 'Data não registrada'}
        </Text>
      </View>

      <View style={s.section}>
        <SectionRow icon="place" label="Imóvel" value={(visit as any).properties?.address ?? 'Endereço não informado'} />
        <SectionRow icon="person" label="Agente" value={(visit as any).profiles?.name ?? 'Agente não informado'} />
        <SectionRow icon="mail" label="Contato" value={(visit as any).profiles?.email ?? 'E-mail não informado'} />
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Observações</Text>
        <Text style={s.notesText}>{visit.notes ?? 'Nenhuma observação registrada.'}</Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Geolocalização</Text>
        <Text style={s.geoText}>Latitude: {visit.lat ?? 'Não capturada'}</Text>
        <Text style={s.geoText}>Longitude: {visit.lng ?? 'Não capturada'}</Text>
      </View>
    </ScrollView>
  )
}

function SectionRow({ icon, label, value }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string }) {
  return (
    <View style={s.row}>
      <View style={s.rowIcon}>
        <MaterialIcons name={icon} size={18} color="#006B3F" />
      </View>
      <View style={s.rowContent}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowValue}>{value}</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  loadingText: { color: '#6b7280', fontSize: 14 },
  statusCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderLeftWidth: 5, borderLeftColor: '#006B3F' },
  statusLabel: { fontSize: 12, color: '#6b7280', textTransform: 'uppercase' },
  statusValue: { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 4 },
  dateText: { fontSize: 13, color: '#6b7280', marginTop: 8 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  notesText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  geoText: { fontSize: 13, color: '#374151', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 12, color: '#6b7280' },
  rowValue: { fontSize: 14, color: '#111827', fontWeight: '600', marginTop: 2 },
})
