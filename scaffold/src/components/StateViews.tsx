import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'

interface LoadingViewProps {
  message?: string
}

export function LoadingView({ message = 'Carregando...' }: LoadingViewProps) {
  return (
    <View style={s.centered}>
      <ActivityIndicator size="large" color="#006B3F" />
      <Text style={s.loadingText}>{message}</Text>
    </View>
  )
}

interface EmptyViewProps {
  icon?: keyof typeof MaterialIcons.glyphMap
  title: string
  description?: string
}

export function EmptyView({ icon = 'inbox', title, description }: EmptyViewProps) {
  return (
    <View style={s.centered}>
      <View style={s.iconCircle}>
        <MaterialIcons name={icon} size={40} color="#d1d5db" />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      {description && <Text style={s.emptyDesc}>{description}</Text>}
    </View>
  )
}

interface ErrorViewProps {
  message?: string
  onRetry?: () => void
}

export function ErrorView({ message = 'Algo deu errado.', onRetry }: ErrorViewProps) {
  return (
    <View style={s.centered}>
      <View style={[s.iconCircle, s.iconCircleError]}>
        <MaterialIcons name="error-outline" size={40} color="#ef4444" />
      </View>
      <Text style={s.emptyTitle}>Erro</Text>
      <Text style={s.emptyDesc}>{message}</Text>
      {onRetry && (
        <Text style={s.retryBtn} onPress={onRetry}>Tentar novamente</Text>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f9fafb', padding: 32, gap: 8,
  },
  loadingText: { color: '#6b7280', fontSize: 14, marginTop: 8 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  iconCircleError: { backgroundColor: '#fef2f2' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptyDesc: { fontSize: 14, color: '#9ca3af', textAlign: 'center', maxWidth: 260 },
  retryBtn: { color: '#006B3F', fontWeight: '700', fontSize: 14, marginTop: 8 },
})
