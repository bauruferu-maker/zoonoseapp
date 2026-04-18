import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useAuthStore } from '../../src/store/auth'
import { useSyncStore } from '../../src/store/sync'
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'

const ROLE_LABEL: Record<string, string> = {
  agent: 'Agente de Campo',
  coordinator: 'Coordenador',
  manager: 'Gestor',
  admin: 'Administrador',
}

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore()
  const { pendingCount, isSyncing, sync, isOnline } = useSyncStore()

  const handleSignOut = () => {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/login') } },
    ])
  }

  return (
    <View style={s.container}>
      <View style={s.profileCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={s.name}>{user?.name}</Text>
        <Text style={s.role}>{ROLE_LABEL[user?.role ?? ''] ?? user?.role}</Text>
        <Text style={s.email}>{user?.email}</Text>
      </View>

      <View style={s.section}>
        <View style={s.syncRow}>
          <View style={[s.dot, { backgroundColor: isOnline ? '#10b981' : '#ef4444' }]} />
          <Text style={s.syncLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
          {pendingCount > 0 && <Text style={s.pendingBadge}>{pendingCount} pendentes</Text>}
          <TouchableOpacity style={s.syncBtn} onPress={sync} disabled={!isOnline || isSyncing}>
            <MaterialIcons name="sync" size={18} color={isOnline ? '#006B3F' : '#9ca3af'} />
            <Text style={[s.syncBtnText, !isOnline && s.disabledText]}>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleSignOut}>
        <MaterialIcons name="logout" size={20} color="#ef4444" />
        <Text style={s.logoutText}>Sair</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  profileCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#006B3F', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  role: { fontSize: 13, color: '#006B3F', fontWeight: '600', marginTop: 4 },
  email: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  syncLabel: { fontSize: 13, color: '#374151', flex: 1 },
  pendingBadge: { fontSize: 11, color: '#d97706', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, fontWeight: '600' },
  syncBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  syncBtnText: { fontSize: 13, color: '#006B3F', fontWeight: '600' },
  disabledText: { color: '#9ca3af' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 12, padding: 16, marginTop: 8 },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
})
