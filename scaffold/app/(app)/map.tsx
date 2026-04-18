import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '../../src/store/auth'
import { useMyVisits } from '../../src/hooks/useVisits'
import { LoadingView, EmptyView } from '../../src/components/StateViews'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  visitado_sem_foco: { label: 'Sem Foco', color: '#10b981' },
  visitado_com_achado: { label: 'Com Achado', color: '#f97316' },
  fechado: { label: 'Fechado', color: '#6b7280' },
  recusado: { label: 'Recusado', color: '#ef4444' },
  nao_localizado: { label: 'Não Localizado', color: '#f59e0b' },
  pendente_revisao: { label: 'Pendente', color: '#8b5cf6' },
}

// Bauru-SP — cidade piloto
const INITIAL_REGION = {
  latitude: -22.3246,
  longitude: -49.0871,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
}

export default function MapScreen() {
  const user = useAuthStore((s) => s.user)
  const { data: visits, isLoading } = useMyVisits(user?.id ?? '')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  if (isLoading) return <LoadingView message="Carregando mapa..." />

  const withCoords = visits?.filter((v) => v.lat && v.lng) ?? []

  if (withCoords.length === 0) {
    return (
      <EmptyView
        icon="map"
        title="Sem dados no mapa"
        description="Suas visitas com geolocalização aparecerão aqui."
      />
    )
  }

  const filtered = activeFilter
    ? withCoords.filter((v) => v.status === activeFilter)
    : withCoords

  // Contagem por status
  const counts: Record<string, number> = {}
  for (const v of withCoords) {
    counts[v.status] = (counts[v.status] ?? 0) + 1
  }

  return (
    <View style={s.container}>
      <MapView
        style={s.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton
      >
        {filtered.map((v) => (
          <Marker
            key={v.id}
            coordinate={{ latitude: v.lat!, longitude: v.lng! }}
            pinColor={STATUS_CONFIG[v.status]?.color ?? '#006B3F'}
            title={(v as any).properties?.address}
            description={STATUS_CONFIG[v.status]?.label ?? v.status}
          />
        ))}
      </MapView>

      {/* Contador flutuante */}
      <View style={s.counterBadge}>
        <Text style={s.counterText}>{filtered.length} visita(s)</Text>
      </View>

      {/* Filtro de status flutuante */}
      <View style={s.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          <TouchableOpacity
            style={[s.filterChip, !activeFilter && s.filterChipActive]}
            onPress={() => setActiveFilter(null)}
          >
            <Text style={[s.filterChipText, !activeFilter && s.filterChipTextActive]}>
              Todos ({withCoords.length})
            </Text>
          </TouchableOpacity>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = counts[key] ?? 0
            if (count === 0) return null
            const isActive = activeFilter === key
            return (
              <TouchableOpacity
                key={key}
                style={[s.filterChip, isActive && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                onPress={() => setActiveFilter(isActive ? null : key)}
              >
                <View style={[s.filterDot, { backgroundColor: isActive ? '#fff' : cfg.color }]} />
                <Text style={[s.filterChipText, isActive && { color: '#fff' }]}>
                  {cfg.label} ({count})
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  counterBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: 'rgba(0,0,0,.7)', paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20,
  },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  filterBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,.95)', borderTopWidth: 1, borderTopColor: '#e5e7eb',
    paddingVertical: 10,
  },
  filterScroll: { paddingHorizontal: 12, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff',
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  filterChipTextActive: { color: '#fff' },
  filterDot: { width: 8, height: 8, borderRadius: 4 },
})
