import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Image,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../contexts/AuthContext'
import { useSyncState } from '../contexts/SyncContext'
import { supabase } from '../lib/supabase'
import { savePendingVisit, updateCachedRouteCompleted, getCachedRoute } from '../lib/localDb'
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native'
import Toast from '../components/Toast'
import { useLocation, distanceMeters } from '../hooks/useLocation'

type Params = {
  RegisterVisit: {
    propertyId: string
    address: string
    sectorName: string
    ownerName: string | null
    propertyLat?: number | null
    propertyLng?: number | null
  }
}

const STATUS_OPTIONS = [
  { value: 'visitado_sem_foco', label: 'Sem Foco', icon: '✅', color: '#16a34a', photoHint: 'Tire uma foto da área inspecionada' },
  { value: 'visitado_com_achado', label: 'Com Achado', icon: '🔴', color: '#DC2626', photoHint: 'Tire uma foto do foco encontrado' },
  { value: 'fechado', label: 'Fechado', icon: '🔒', color: '#9333EA', photoHint: 'Tire uma foto mostrando o imóvel fechado' },
  { value: 'recusado', label: 'Recusado', icon: '🚫', color: '#EA580C', photoHint: 'Tire uma foto da fachada para registro' },
  { value: 'nao_localizado', label: 'Não Localizado', icon: '❓', color: '#6B7280', photoHint: 'Tire uma foto do local para referência' },
]

const FOCUS_TYPES = [
  'Caixa d\'água destampada ou com foco',
  'Ralo sem vedação',
  'Lixo ou entulho acumulando água',
  'Piscina sem tratamento',
  'Pneu acumulando água',
  'Vaso de planta com água parada',
  'Outro',
]

const ACTIONS = [
  'Morador orientado para eliminação',
  'Larvicida aplicado',
  'Foco eliminado no local',
  'Encaminhado para equipe especializada',
  'Notificação emitida',
]

// Constantes
const WORK_HOURS_START = 7
const WORK_HOURS_END = 18
const QUICK_VISIT_THRESHOLD_SECONDS = 60

// Score de confiança (0-100)
function calculateConfidenceScore(params: {
  hasGps: boolean
  gpsDistanceMeters: number | null
  durationSeconds: number
  hasPhoto: boolean
  hasNotes: boolean
  isWorkHours: boolean
}): number {
  let score = 0
  // GPS dentro de 100m do imóvel (25pts) — 0 pts se distância não calculada
  if (params.hasGps && params.gpsDistanceMeters !== null) {
    score += params.gpsDistanceMeters <= 100 ? 25 : params.gpsDistanceMeters <= 300 ? 15 : 5
  }
  // Sem GPS ou sem coords do imóvel = 0 pts (não dá pontos por falta de dado)
  // Duração >= 3min (20pts)
  if (params.durationSeconds >= 180) score += 20
  else if (params.durationSeconds >= 60) score += 10
  // Foto (20pts)
  if (params.hasPhoto) score += 20
  // Horário expediente (10pts)
  if (params.isWorkHours) score += 10
  // Notas preenchidas >10 chars (10pts)
  if (params.hasNotes) score += 10
  // Bônus: todos critérios atendidos (15pts)
  if (params.hasGps && params.gpsDistanceMeters !== null && params.gpsDistanceMeters <= 100 && params.durationSeconds >= 180 && params.hasPhoto && params.hasNotes) score += 15
  return Math.min(100, score)
}

export default function RegisterVisitScreen() {
  const { profile } = useAuth()
  const { isOnline } = useSyncState()
  const navigation = useNavigation()
  const route = useRoute<RouteProp<Params, 'RegisterVisit'>>()
  const { propertyId, address, sectorName, ownerName, propertyLat, propertyLng } = route.params
  const { location, refresh: refreshLocation } = useLocation()

  // Capturar GPS de início separadamente (C2: GPS no mount)
  const startLocationRef = useRef<{ latitude: number; longitude: number; accuracy: number | null } | null>(null)
  const refreshLocationRef = useRef(refreshLocation)
  refreshLocationRef.current = refreshLocation

  useEffect(() => {
    if (location && !startLocationRef.current) {
      startLocationRef.current = location
    }
  }, [location])

  // Timer — registra momento de abertura + reset entre visitas (A1)
  const startedAtRef = useRef(new Date())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useFocusEffect(
    useCallback(() => {
      // Reset timer e GPS ref ao entrar na tela
      startedAtRef.current = new Date()
      setElapsedSeconds(0)
      startLocationRef.current = null
      // Força captura de GPS ao abrir
      refreshLocationRef.current()
    }, [])
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const [status, setStatus] = useState('')
  const [focusType, setFocusType] = useState('')
  const [action, setAction] = useState('')
  const [notes, setNotes] = useState('')
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning'; visible: boolean }>({ message: '', type: 'success', visible: false })

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning', autoBack = false) => {
    setToast({ message, type, visible: true })
    if (autoBack) {
      setTimeout(() => navigation.goBack(), 2000)
    }
  }, [navigation])

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }))
  }, [])

  const showFocusFields = status === 'visitado_com_achado'
  const currentPhotoHint = STATUS_OPTIONS.find(o => o.value === status)?.photoHint ?? 'Tire uma foto do local'

  async function pickPhoto(source: 'camera' | 'gallery') {
    const permResult = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permResult.granted) {
      showToast(`Permita o acesso à ${source === 'camera' ? 'câmera' : 'galeria'} nas configurações.`, 'warning')
      return
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: false })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: false })

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri)
    }
  }

  async function uploadPhoto(visitId: string): Promise<string | null> {
    if (!photoUri || !profile) return null
    try {
      const ext = photoUri.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${profile.id}/${visitId}.${ext}`
      const response = await fetch(photoUri)
      const blob = await response.blob()
      const { error } = await supabase.storage
        .from('evidences')
        .upload(fileName, blob, { contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`, upsert: true })
      if (error) {
        showToast('Foto não foi enviada. Será tentada depois.', 'warning')
        return null
      }
      const { data: urlData } = supabase.storage.from('evidences').getPublicUrl(fileName)
      return urlData.publicUrl
    } catch {
      showToast('Foto não foi enviada. Será tentada depois.', 'warning')
      return null
    }
  }

  async function handleSave() {
    if (!status) {
      showToast('Selecione o resultado da visita', 'warning')
      return
    }
    if (showFocusFields && !focusType) {
      showToast('Selecione o tipo de foco encontrado', 'warning')
      return
    }
    // Foto obrigatória
    if (!photoUri) {
      showToast('Foto obrigatória para registrar a visita', 'warning')
      return
    }

    // Alerta de visita rápida (M1 — toast warning, não bloqueia)
    const durationSeconds = Math.floor((Date.now() - startedAtRef.current.getTime()) / 1000)
    if (durationSeconds < QUICK_VISIT_THRESHOLD_SECONDS && status === 'visitado_sem_foco') {
      showToast(`Visita muito rápida (${durationSeconds}s). Confira se inspecionou tudo.`, 'warning')
    }

    setSaving(true)

    // Capturar GPS final
    const endLocation = await refreshLocation()
    const startLoc = startLocationRef.current ?? location

    // Calcular distância do imóvel (se temos coords do imóvel)
    let gpsDistance: number | null = null
    if (startLoc && propertyLat && propertyLng) {
      gpsDistance = distanceMeters(startLoc.latitude, startLoc.longitude, propertyLat, propertyLng)
    }

    // Calcular score
    const now = new Date()
    const hour = now.getHours()
    const score = calculateConfidenceScore({
      hasGps: !!startLoc,
      gpsDistanceMeters: gpsDistance,
      durationSeconds,
      hasPhoto: !!photoUri,
      hasNotes: (notes.trim().length > 10),
      isWorkHours: hour >= WORK_HOURS_START && hour <= WORK_HOURS_END,
    })

    // Look up UUID foreign keys for typed fields
    let visitTypeId: string | null = null
    let focusTypeId: string | null = null
    let actionTakenId: string | null = null

    if (isOnline) {
      const [vtResult, ftResult, atResult] = await Promise.all([
        supabase.from('visit_types').select('id').eq('name', 'rotina').single(),
        showFocusFields && focusType
          ? supabase.from('focus_types').select('id').eq('name', focusType).single()
          : Promise.resolve({ data: null }),
        showFocusFields && action
          ? supabase.from('action_takens').select('id').eq('name', action).single()
          : Promise.resolve({ data: null }),
      ])
      visitTypeId = vtResult.data?.id ?? null
      focusTypeId = (ftResult as any).data?.id ?? null
      actionTakenId = (atResult as any).data?.id ?? null
    }

    const visitPayload = {
      property_id: propertyId,
      agent_id: profile?.id ?? '',
      visited_at: new Date().toISOString(),
      status,
      visit_type: 'rotina',
      visit_type_id: visitTypeId,
      focus_type: showFocusFields ? focusType : null,
      focus_type_id: showFocusFields ? focusTypeId : null,
      action_taken: showFocusFields ? action : null,
      action_taken_id: showFocusFields ? actionTakenId : null,
      notes: notes.trim() || null,
      lat_start: startLoc?.latitude ?? null,
      lng_start: startLoc?.longitude ?? null,
      lat_end: endLocation?.latitude ?? null,
      lng_end: endLocation?.longitude ?? null,
      accuracy_meters: startLoc?.accuracy ?? null,
      started_at: startedAtRef.current.toISOString(),
      duration_seconds: durationSeconds,
      confidence_score: score,
    }

    try {
      if (isOnline) {
        const { data: visitData, error } = await supabase.from('visits').insert(visitPayload).select('id').single()
        if (error || !visitData) throw error ?? new Error('Falha ao registrar visita')

        let photoUrl: string | null = null
        if (photoUri && visitData?.id) {
          photoUrl = await uploadPhoto(visitData.id)
          if (photoUrl) {
            const { error: photoColError } = await supabase
              .from('visits').update({ photo_url: photoUrl }).eq('id', visitData.id)
            if (photoColError) {
              const updatedNotes = notes.trim() ? `${notes.trim()}\n[foto: ${photoUrl}]` : `[foto: ${photoUrl}]`
              await supabase.from('visits').update({ notes: updatedNotes }).eq('id', visitData.id)
            }
          }
        }

        const today = new Date().toISOString().slice(0, 10)
        const { data: routeData } = await supabase
          .from('daily_routes').select('id, completed_ids')
          .eq('agent_id', profile?.id ?? '').eq('route_date', today).single()
        if (routeData) {
          const updated = [...(routeData.completed_ids ?? []), propertyId]
          await supabase.from('daily_routes').update({ completed_ids: updated }).eq('id', routeData.id)
        }

        const statusLabel = STATUS_OPTIONS.find(s => s.value === status)?.label
        const photoMsg = photoUrl ? ' · Foto salva' : ''
        showToast(`${statusLabel}${photoMsg} — ${address}`, 'success', true)
      } else {
        await savePendingVisit({ ...visitPayload, photo_uri: photoUri })
        const today = new Date().toISOString().slice(0, 10)
        const cachedRoute = await getCachedRoute(profile?.id ?? '', today)
        if (cachedRoute) {
          const updated = [...(cachedRoute.completed_ids ?? []), propertyId]
          await updateCachedRouteCompleted(cachedRoute.id, updated)
        }
        const statusLabel = STATUS_OPTIONS.find(s => s.value === status)?.label
        showToast(`${statusLabel} — Salvo offline. Será sincronizado depois.`, 'success', true)
      }
    } catch (err: any) {
      try {
        await savePendingVisit({ ...visitPayload, photo_uri: photoUri })
        showToast('Salvo offline. Será sincronizado quando houver conexão.', 'warning', true)
      } catch {
        showToast(err.message ?? 'Não foi possível salvar', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Cabeçalho do imóvel + timer */}
        <View style={styles.propertyCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.propertyAddress}>{address}</Text>
              <Text style={styles.propertyMeta}>
                {sectorName}{ownerName ? ` · ${ownerName}` : ''}
              </Text>
            </View>
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>{formatTimer(elapsedSeconds)}</Text>
            </View>
          </View>
          {/* GPS status discreto */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <View style={[styles.gpsDot, { backgroundColor: location ? '#16a34a' : '#F59E0B' }]} />
            <Text style={styles.gpsText}>
              {location ? 'Localização capturada' : 'Obtendo localização...'}
            </Text>
          </View>
        </View>

        {/* Status da visita */}
        <Text style={styles.sectionTitle}>Resultado da visita</Text>
        <View style={styles.statusGrid}>
          {STATUS_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.statusBtn, status === opt.value && { borderColor: opt.color, backgroundColor: opt.color + '15' }]}
              onPress={() => setStatus(opt.value)}
            >
              <Text style={styles.statusIcon}>{opt.icon}</Text>
              <Text style={[styles.statusLabel, status === opt.value && { color: opt.color, fontWeight: '700' }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Campos de foco (só se "Com Achado") */}
        {showFocusFields && (
          <>
            <Text style={styles.sectionTitle}>Tipo de foco</Text>
            {FOCUS_TYPES.map(ft => (
              <TouchableOpacity
                key={ft}
                style={[styles.optionBtn, focusType === ft && styles.optionSelected]}
                onPress={() => setFocusType(ft)}
              >
                <View style={[styles.radio, focusType === ft && styles.radioSelected]} />
                <Text style={[styles.optionText, focusType === ft && styles.optionTextSelected]}>{ft}</Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>Ação tomada</Text>
            {ACTIONS.map(a => (
              <TouchableOpacity
                key={a}
                style={[styles.optionBtn, action === a && styles.optionSelected]}
                onPress={() => setAction(a)}
              >
                <View style={[styles.radio, action === a && styles.radioSelected]} />
                <Text style={[styles.optionText, action === a && styles.optionTextSelected]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Foto — obrigatória */}
        <Text style={styles.sectionTitle}>📷 Foto obrigatória</Text>
        {status ? (
          <Text style={styles.photoHint}>{currentPhotoHint}</Text>
        ) : null}
        <View style={styles.photoRow}>
          <TouchableOpacity style={styles.photoBtn} onPress={() => pickPhoto('camera')}>
            <Text style={styles.photoBtnIcon}>📷</Text>
            <Text style={styles.photoBtnText}>Câmera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} onPress={() => pickPhoto('gallery')}>
            <Text style={styles.photoBtnIcon}>🖼️</Text>
            <Text style={styles.photoBtnText}>Galeria</Text>
          </TouchableOpacity>
        </View>
        {!photoUri && status ? (
          <View style={styles.photoWarning}>
            <Text style={styles.photoWarningText}>⚠️ Foto necessária para salvar</Text>
          </View>
        ) : null}
        {photoUri && (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => setPhotoUri(null)}>
              <Text style={styles.photoRemoveText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Observações */}
        <Text style={styles.sectionTitle}>Observações</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Detalhes adicionais sobre a visita..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
        />

        {/* Botão salvar */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Registrar Visita</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 40 },
  propertyCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  propertyAddress: { fontSize: 17, fontWeight: '700', color: '#111827' },
  propertyMeta: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  timerBadge: {
    backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  timerText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF', fontVariant: ['tabular-nums'] },
  gpsDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  gpsText: { fontSize: 11, color: '#9CA3AF' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10, marginTop: 8 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statusBtn: {
    borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 14,
    paddingHorizontal: 12, alignItems: 'center', width: '31%',
  },
  statusIcon: { fontSize: 24, marginBottom: 4 },
  statusLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500', textAlign: 'center' },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 6, borderWidth: 1, borderColor: '#E5E7EB',
  },
  optionSelected: { borderColor: '#16a34a', backgroundColor: '#F0FDF4' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', marginRight: 12 },
  radioSelected: { borderColor: '#16a34a', backgroundColor: '#16a34a' },
  optionText: { fontSize: 14, color: '#374151', flex: 1 },
  optionTextSelected: { color: '#166534', fontWeight: '600' },
  photoHint: { fontSize: 12, color: '#6B7280', marginBottom: 8, fontStyle: 'italic' },
  photoRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed',
  },
  photoBtnIcon: { fontSize: 20, marginRight: 8 },
  photoBtnText: { fontSize: 14, color: '#374151', fontWeight: '600' },
  photoWarning: {
    backgroundColor: '#FEF3C7', borderRadius: 8, padding: 10, marginBottom: 12,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  photoWarningText: { fontSize: 12, color: '#92400E', textAlign: 'center', fontWeight: '500' },
  photoPreviewContainer: { position: 'relative', marginBottom: 16, borderRadius: 12, overflow: 'hidden' },
  photoPreview: { width: '100%', height: 200, borderRadius: 12 },
  photoRemoveBtn: {
    position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  photoRemoveText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  textArea: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1,
    borderColor: '#E5E7EB', fontSize: 14, color: '#111827', textAlignVertical: 'top',
    minHeight: 80, marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: '#16a34a', borderRadius: 12, padding: 18,
    alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
})
