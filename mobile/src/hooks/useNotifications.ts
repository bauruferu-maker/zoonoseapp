import { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { supabase } from '../lib/supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'ZoonoseApp',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#14532d',
    })
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  if (!projectId) return null

  const token = await Notifications.getExpoPushTokenAsync({ projectId })
  return token.data
}

export function useNotifications(userId: string | null) {
  const [pushToken, setPushToken] = useState<string | null>(null)
  const notificationListener = useRef<Notifications.EventSubscription>(undefined)
  const responseListener = useRef<Notifications.EventSubscription>(undefined)

  useEffect(() => {
    if (!userId) return

    registerForPushNotifications().then(async (token) => {
      if (!token) return
      setPushToken(token)

      // Salvar token no perfil do usuário
      await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId)
    })

    // Listener para notificações recebidas (app em foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Silencioso — a notificação é exibida pelo handler acima
    })

    // Listener para quando o usuário toca na notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      // Futuro: navegar para a tela relevante
    })

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove()
      }
      if (responseListener.current) {
        responseListener.current.remove()
      }
    }
  }, [userId])

  return { pushToken }
}
