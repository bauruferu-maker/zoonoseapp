import { supabase } from './supabase'

const BUCKET = 'evidences'

export async function uploadVisitPhoto(visitId: string, photoUri: string): Promise<string> {
  const filename = `visits/${visitId}/${Date.now()}.jpg`

  // Convert URI to blob for React Native
  const response = await fetch(photoUri)
  if (!response.ok) {
    throw new Error(`Failed to fetch photo URI (status ${response.status}) — file may have been evicted from cache`)
  }
  const blob = await response.blob()

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, blob, { contentType: 'image/jpeg', upsert: false })

  if (error) throw error

  await supabase.from('evidences').insert({
    visit_id: visitId,
    url: data.path,
    type: 'photo' as const,
  })

  return data.path
}
