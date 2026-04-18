import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AuthProvider, useAuth } from './src/contexts/AuthContext'
import { SyncProvider } from './src/contexts/SyncContext'
import { useNotifications } from './src/hooks/useNotifications'
import LoginScreen from './src/screens/LoginScreen'
import QueueScreen from './src/screens/QueueScreen'
import RegisterVisitScreen from './src/screens/RegisterVisitScreen'

const Stack = createNativeStackNavigator()

function NotificationRegistrar({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  useNotifications(profile?.id ?? null)
  return <>{children}</>
}

function AppNavigator() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#14532d' }}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    )
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!session ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Queue" component={QueueScreen} />
          <Stack.Screen
            name="RegisterVisit"
            component={RegisterVisitScreen}
            options={{
              headerShown: true,
              title: 'Registrar Visita',
              headerStyle: { backgroundColor: '#14532d' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: '600' },
            }}
          />
        </>
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationRegistrar>
        <SyncProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <AppNavigator />
          </NavigationContainer>
        </SyncProvider>
      </NotificationRegistrar>
    </AuthProvider>
  )
}
