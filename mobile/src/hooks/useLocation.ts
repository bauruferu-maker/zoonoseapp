import { useState, useEffect, useCallback } from 'react'
import * as Location from 'expo-location'

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number | null
}

interface UseLocationResult {
  location: LocationData | null
  loading: boolean
  error: string | null
  refresh: () => Promise<LocationData | null>
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          setError('Permissão de localização não concedida')
          setHasPermission(false)
          setLoading(false)
          return
        }
        setHasPermission(true)
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
      } catch {
        setError('Não foi possível obter localização')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const refresh = useCallback(async (): Promise<LocationData | null> => {
    if (!hasPermission) return null
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      const data: LocationData = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }
      setLocation(data)
      return data
    } catch {
      return location
    }
  }, [hasPermission, location])

  return { location, loading, error, refresh }
}

// Haversine: distância em metros entre dois pontos
export function distanceMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
