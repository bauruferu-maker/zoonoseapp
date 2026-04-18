import { View, Text, StyleSheet } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { useAuthStore } from '../../src/store/auth'
import { useMyVisits } from '../../src/hooks/useVisits'

const STATUS_COLOR: Record<string, string> = {
  visitado_sem_foco: '#10b981',
  visitado_com_achado: '#f97316',
  fechado: '#6b7280',
  recusado: '#ef4444',
  nao_localizado: '#f59e0b',
  pendente_revisao: '#8b5cf6',
}

export default function MapScreen() {
  const user = useAuthStore((s) => s.user)
  const { data: visits } = useMyVisits(user?.id ?? '')

  const withCoords = visits?.filter((v) => v.lat && v.lng) ?? []

  return (
    <View style={s.container}>
      <MapView
        style={s.map}
        initialRegion={{ latitude: -22.9068, longitude: -47.0626, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      >
        {withCoords.map((v) => (
          <Marker
            key={v.id}
            coordinate={{ latitude: v.lat!, longitude: v.lng! }}
            pinColor={STATUS_COLOR[v.status] ?? '#006B3F'}
            title={(v as any).properties?.address}
            description={v.status}
          />
        ))}
      </MapView>
      <View style={s.counter}>
        <Text style={s.counterText}>{withCoords.length} visita(s) no mapa</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  counter: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '600' },
})
