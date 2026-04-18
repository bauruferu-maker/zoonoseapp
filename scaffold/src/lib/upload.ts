import { supabase } from './supabase'
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'

const BUCKET = 'evidences'

export async function uploadVisitPhotos(visitId: string, photoUris: string[]): Promise<string[]> {
  const urls: string[] = []

  for (let i = 0; i < photoUris.length; i++) {
    const uri = photoUris[i]
    const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `visits/${visitId}/${Date.now()}_${i}.${ext}`

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, decode(base64), {
        contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
        upsert: false,
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path)

    urls.push(publicUrl)
  }

  return urls
}
