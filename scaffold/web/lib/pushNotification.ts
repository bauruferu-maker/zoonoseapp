const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface PushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
}

export async function sendPushNotification(message: PushMessage): Promise<boolean> {
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })
    const result = await res.json()
    return result?.data?.status === 'ok'
  } catch {
    return false
  }
}

export async function sendPushToAgents(
  supabase: any,
  agentIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<number> {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('push_token')
    .in('id', agentIds)
    .not('push_token', 'is', null)

  if (!profiles || profiles.length === 0) return 0

  let sent = 0
  for (const p of profiles) {
    const ok = await sendPushNotification({ to: p.push_token, title, body, data })
    if (ok) sent++
  }
  return sent
}
