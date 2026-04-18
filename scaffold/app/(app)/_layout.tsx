import { Tabs } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { useEffect } from 'react'
import { useSyncStore } from '../../src/store/sync'

export default function AppLayout() {
  const watchConnectivity = useSyncStore((s) => s.watchConnectivity)

  useEffect(() => {
    const unsub = watchConnectivity()
    return unsub
  }, [])

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#006B3F',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { borderTopColor: '#e5e7eb' },
        headerStyle: { backgroundColor: '#006B3F' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      {/* === 5 TABS VISÍVEIS === */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="route"
        options={{
          title: 'Minha Rota',
          tabBarLabel: 'Rota',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="route" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Escanear QR',
          tabBarLabel: 'Escanear',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="qr-code-scanner" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="visit/new"
        options={{
          title: 'Nova Visita',
          tabBarLabel: 'Visitar',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="add-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
        }}
      />

      {/* === TELAS OCULTAS (acessíveis via navegação) === */}
      <Tabs.Screen
        name="map"
        options={{ href: null, title: 'Mapa' }}
      />
      <Tabs.Screen
        name="history"
        options={{ href: null, title: 'Histórico' }}
      />
      <Tabs.Screen
        name="visit/[id]"
        options={{ href: null, title: 'Detalhes da Visita' }}
      />
      <Tabs.Screen
        name="properties/index"
        options={{ href: null, title: 'Imóveis' }}
      />
      <Tabs.Screen
        name="properties/[id]"
        options={{ href: null, title: 'Detalhes do Imóvel' }}
      />
    </Tabs>
  )
}
