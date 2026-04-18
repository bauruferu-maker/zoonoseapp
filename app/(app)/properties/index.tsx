import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '../../../src/store/auth'
import { usePropertiesBySector } from '../../../src/hooks/useProperties'

export default function PropertiesScreen() {
  const user = useAuthStore((s) => s.user)
  const { data: properties, isLoading, refetch } = usePropertiesBySector(user?.sector_id ?? '')

  return (
    <FlatList
      style={s.container}
      data={properties}
      keyExtractor={(item) => item.id}
      refreshing={isLoading}
      onRefresh={refetch}
      contentContainerStyle={s.content}
      ListHeaderComponent={
        <View style={s.header}>
          <Text style={s.title}>Imoveis do Setor</Text>
          <Text style={s.subtitle}>Selecione um endereco para ver o historico e iniciar uma visita.</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={s.empty}>
          <MaterialIcons name="location-city" size={44} color="#d1d5db" />
          <Text style={s.emptyText}>Nenhum imovel encontrado para este setor.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={s.card} onPress={() => router.push(`/(app)/properties/${item.id}`)}>
          <View style={s.iconBox}>
            <MaterialIcons name="home-work" size={20} color="#006B3F" />
          </View>
          <View style={s.info}>
            <Text style={s.address}>{item.address}</Text>
            <Text style={s.meta}>
              {item.owner_name ? `Responsavel: ${item.owner_name}` : 'Responsavel nao informado'}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>
      )}
    />
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 24 },
  header: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  address: { fontSize: 14, fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 64 },
  emptyText: { color: '#9ca3af', fontSize: 14, marginTop: 12, textAlign: 'center' },
})
