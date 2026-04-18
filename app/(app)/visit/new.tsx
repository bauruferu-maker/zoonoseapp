import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native'
import * as Location from 'expo-location'
import * as ImagePicker from 'expo-image-picker'
import { router, useLocalSearchParams } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { useCreateVisit } from '../../../src/hooks/useVisits'
import { useProperty, usePropertySearch } from '../../../src/hooks/useProperties'
import type { VisitStatus, Property } from '../../../src/types'

const STATUSES: { value: VisitStatus; label: string; icon: string; color: string }[] = [
  { value: 'visitado_sem_foco', label: 'Visitado sem foco', icon: 'check-circle', color: '#10b981' },
  { value: 'visitado_com_achado', label: 'Visitado com achado', icon: 'warning', color: '#f97316' },
  { value: 'fechado', label: 'Fechado', icon: 'lock', color: '#6b7280' },
  { value: 'recusado', label: 'Recusado', icon: 'block', color: '#ef4444' },
  { value: 'nao_localizado', label: 'Nao localizado', icon: 'location-off', color: '#f59e0b' },
  { value: 'pendente_revisao', label: 'Pendente revisao', icon: 'schedule', color: '#8b5cf6' },
]

export default function NewVisitScreen() {
  const params = useLocalSearchParams<{ propertyId?: string }>()
  const preselectedPropertyId = Array.isArray(params.propertyId) ? params.propertyId[0] : params.propertyId
  const [query, setQuery] = useState('')
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [status, setStatus] = useState<VisitStatus | null>(null)
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<string[]>([])

  const { data: properties } = usePropertySearch(query)
  const { data: preselectedProperty } = useProperty(preselectedPropertyId ?? '')
  const createVisit = useCreateVisit()

  useEffect(() => {
    if (preselectedProperty && !selectedProperty) {
      setSelectedProperty(preselectedProperty)
      setQuery(preselectedProperty.address)
    }
  }, [preselectedProperty, selectedProperty])

  async function captureLocation() {
    const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync()
    if (permissionStatus !== 'granted') return null

    const currentPosition = await Location.getCurrentPositionAsync({})
    return {
      lat: currentPosition.coords.latitude,
      lng: currentPosition.coords.longitude,
    }
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    })

    if (!result.canceled) {
      setPhotos((currentPhotos) => [...currentPhotos, result.assets[0].uri])
    }
  }

  async function handleSubmit() {
    if (!selectedProperty || !status) {
      Alert.alert('Atencao', 'Selecione o imovel e o status da visita.')
      return
    }

    const capturedLocation = await captureLocation()

    try {
      await createVisit.mutateAsync({
        propertyId: selectedProperty.id,
        status,
        notes: notes || null,
        lat: capturedLocation?.lat ?? null,
        lng: capturedLocation?.lng ?? null,
        photos,
      })

      Alert.alert('Sucesso', 'Visita registrada.', [{ text: 'OK', onPress: () => router.back() }])
    } catch {
      Alert.alert('Erro', 'Falha ao registrar visita.')
    }
  }

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <View style={s.section}>
        <Text style={s.label}>Buscar imovel</Text>
        <TextInput
          style={s.input}
          placeholder="Digite o endereco..."
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
        />

        {properties && query.length > 2 && !selectedProperty ? (
          <View style={s.dropdown}>
            {properties.map((property) => (
              <TouchableOpacity
                key={property.id}
                style={s.dropdownItem}
                onPress={() => {
                  setSelectedProperty(property)
                  setQuery(property.address)
                }}
              >
                <MaterialIcons name="home" size={16} color="#6b7280" />
                <Text style={s.dropdownText}>{property.address}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {selectedProperty ? (
          <View style={s.selectedBox}>
            <MaterialIcons name="check-circle" size={16} color="#10b981" />
            <Text style={s.selectedText}>{selectedProperty.address}</Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedProperty(null)
                setQuery('')
              }}
            >
              <MaterialIcons name="close" size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity style={s.browseBtn} onPress={() => router.push('/(app)/properties')}>
          <MaterialIcons name="format-list-bulleted" size={18} color="#006B3F" />
          <Text style={s.browseBtnText}>Ver lista de imoveis</Text>
        </TouchableOpacity>
      </View>

      <View style={s.section}>
        <Text style={s.label}>Status da visita</Text>
        <View style={s.statusGrid}>
          {STATUSES.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[s.statusBtn, status === item.value && { borderColor: item.color, backgroundColor: `${item.color}15` }]}
              onPress={() => setStatus(item.value)}
            >
              <MaterialIcons name={item.icon as any} size={20} color={status === item.value ? item.color : '#9ca3af'} />
              <Text style={[s.statusLabel, status === item.value && { color: item.color }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.label}>Observacoes</Text>
        <TextInput
          style={[s.input, s.textarea]}
          placeholder="Focos encontrados, situacao do imovel..."
          placeholderTextColor="#9ca3af"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={s.section}>
        <Text style={s.label}>Evidencias fotograficas ({photos.length})</Text>
        <TouchableOpacity style={s.photoBtn} onPress={pickPhoto}>
          <MaterialIcons name="camera-alt" size={22} color="#006B3F" />
          <Text style={s.photoBtnText}>Tirar foto</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[s.submitBtn, createVisit.isPending && s.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={createVisit.isPending}
      >
        <Text style={s.submitText}>{createVisit.isPending ? 'Registrando...' : 'Registrar visita'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  section: { padding: 16, marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', backgroundColor: '#fff' },
  textarea: { height: 100 },
  dropdown: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginTop: 4 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  dropdownText: { fontSize: 14, color: '#374151', flex: 1 },
  selectedBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ecfdf5', padding: 10, borderRadius: 8, marginTop: 6 },
  selectedText: { flex: 1, fontSize: 13, color: '#065f46' },
  browseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#d1fae5', backgroundColor: '#f0fdf4', borderRadius: 8, padding: 12, marginTop: 8 },
  browseBtnText: { color: '#006B3F', fontSize: 13, fontWeight: '600' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, backgroundColor: '#fff', minWidth: '47%' },
  statusLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '500', flex: 1 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#006B3F', borderRadius: 10, padding: 14, justifyContent: 'center' },
  photoBtnText: { color: '#006B3F', fontWeight: '600', fontSize: 14 },
  submitBtn: { margin: 16, backgroundColor: '#006B3F', borderRadius: 12, padding: 18, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
