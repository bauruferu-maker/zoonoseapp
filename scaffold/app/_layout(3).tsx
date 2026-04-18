import { useEffect } from 'react'
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { View, ActivityIndicator } from 'react-native'
import { useAuthStore } from '../src/store/auth'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

function AuthGuard() {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()
  const navigationState = useRootNavigationState()

  useEffect(() => {
    // Aguarda o navigator estar pronto antes de redirecionar
    if (!navigationState?.key || loading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (user && inAuthGroup) {
      router.replace('/(app)')
    } else if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
    }
  }, [user, loading, segments, navigationState?.key])

  return null
}

export default function RootLayout() {
  const { loadSession, loading } = useAuthStore()

  useEffect(() => {
    loadSession()
  }, [])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a472a' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  )
}
