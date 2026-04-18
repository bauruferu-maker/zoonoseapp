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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarLabel: 'Mapa',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="map" size={size} color={color} />,
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
        name="history"
        options={{
          title: 'Histórico',
          tabBarLabel: 'Histórico',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="history" size={size} color={color} />,
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
      <Tabs.Screen
        name="visit/[id]"
        options={{
          href: null,
          title: 'Detalhes da Visita',
        }}
      />
      <Tabs.Screen
        name="properties/index"
        options={{
          href: null,
          title: 'Imoveis',
        }}
      />
      <Tabs.Screen
        name="properties/[id]"
        options={{
          href: null,
          title: 'Detalhes do Imovel',
        }}
      />
    </Tabs>
  )
}
