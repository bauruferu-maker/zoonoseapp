import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '../src/store/auth'
import { router } from 'expo-router'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

export default function RootLayout() {
  const { loadSession, user, loading } = useAuthStore()

  useEffect(() => {
    loadSession()
  }, [])

  useEffect(() => {
    if (!loading) {
      if (user) router.replace('/(app)')
      else router.replace('/(auth)/login')
    }
  }, [user, loading])

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  )
}
