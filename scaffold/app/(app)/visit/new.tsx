import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Image } from 'react-native'
import * as Location from 'expo-location'
import * as ImagePicker from 'expo-image-picker'
import { useCreateVisit } from '../../../src/hooks/useVisits'
import { usePropertySearch } from '../../../src/hooks/useProperties'
import { useVisitTypes, useFocusTypes, useActionsTaken } from '../../../src/hooks/useLookups'
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import type { VisitStatus, Property } from '../../../src/types'

const STATUSES: { value: VisitStatus; label: string; icon: string; color: string }[] = [
  { value: 'visitado_sem_foco', label: 'Visitado s/ Foco', icon: 'check-circle', color: '#10b981' },
  { value: 'visitado_com_achado', label: 'Visitado c/ Achado', icon: 'warning', color: '#f97316' },
  { value: 'fechado', label: 'Fechado', icon: 'lock', color: '#6b7280' },
  { value: 'recusado', label: 'Recusado', icon: 'block', color: '#ef4444' },
  { value: 'nao_localizado', label: 'Não Localizado', icon: 'location-off', color: '#f59e0b' },
  { value: 'pendente_revisao', label: 'Pendente Revisão', icon: 'schedule', color: '#8b5cf6' },
]

const VISIT_TYPE_LABELS: Record<string, string> = {
  rotina: 'Rotina',
  retorno: 'Retorno',
  denuncia: 'Denúncia',
}

export default function NewVisitScreen() {
  const [query, setQuery] = useState('')
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [status, setStatus] = useState<VisitStatus | null>(null)
  const [visitTypeId, setVisitTypeId] = useState<string | null>(null)
  const [focusTypeId, setFocusTypeId] = useState<string | null>(null)
  const [actionTakenId, setActionTakenId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  const { data: properties } = usePropertySearch(query)
  const { data: visitTypes } = useVisitTypes()
  const { data: focusTypes } = useFocusTypes()
  const { data: actionsTaken } = useActionsTaken()
  const createVisit = useCreateVisit()

  const hasFinding = status === 'visitado_com_achado'

  const captureLocation = async () => {
    const { status: permStatus } = await Location.requestForegroundPermissionsAsync()
    if (permStatus !== 'granted') return
    const loc = await Location.getCurrentPositionAsync({})
    setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude })
  }

  const pickPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 })
    if (!result.canceled) setPhotos((p) => [...p, result.assets[0].uri])
  }

  const removePhoto = (index: number) => {
    setPhotos((p) => p.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!selectedProperty || !status) {
      Alert.alert('Atenção', 'Selecione o imóvel e o status da visita.')
      return
    }
    if (!visitTypeId) {
      Alert.alert('Atenção', 'Selecione o tipo de visita.')
      return
    }
    if (hasFinding && !focusTypeId) {
      Alert.alert('Atenção', 'Selecione o tipo de foco encontrado.')
      return
    }
    if (hasFinding && !actionTakenId) {
      Alert.alert('Atenção', 'Selecione a ação tomada.')
      return
    }
    if (hasFinding && photos.length === 0) {
      Alert.alert('Atenção', 'Tire pelo menos uma foto quando há foco encontrado.')
      return
    }
    await captureLocation()
    try {
      await createVisit.mutateAsync({
        propertyId: selectedProperty.id,
        status,
        visitTypeId,
        focusTypeId: hasFinding ? focusTypeId : null,
        actionTakenId: hasFinding ? actionTakenId : null,
        notes: notes || null,
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
        photos,
      })
      Alert.alert('Sucesso', 'Visita registrada!', [{ text: 'OK', onPress: () => router.back() }])
    } catch (e) {
      Alert.alert('Erro', 'Falha ao registrar visita.')
    }
  }

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      {/* Buscar Imóvel */}
      <View style={s.section}>
        <Text style={s.label}>Buscar Imóvel</Text>
        <TextInput
          style={s.input}
          placeholder="Digite o endereço..."
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
        />
        {properties && query.length > 2 && !selectedProperty && (
          <View style={s.dropdown}>
            {properties.map((p) => (
              <TouchableOpacity key={p.id} style={s.dropdownItem} onPress={() => { setSelectedProperty(p); setQuery(p.address) }}>
                <MaterialIcons name="home" size={16} color="#6b7280" />
                <Text style={s.dropdownText}>{p.address}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {selectedProperty && (
          <View style={s.selectedBox}>
            <MaterialIcons name="check-circle" size={16} color="#10b981" />
            <Text style={s.selectedText}>{selectedProperty.address}</Text>
            <TouchableOpacity onPress={() => { setSelectedProperty(null); setQuery('') }}>
              <MaterialIcons name="close" size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity style={s.browseBtn} onPress={() => router.push('/(app)/properties')}>
          <MaterialIcons name="format-list-bulleted" size={18} color="#006B3F" />
          <Text style={s.browseBtnText}>Ver lista de imóveis</Text>
        </TouchableOpacity>
      </View>

      {/* Tipo de Visita */}
      <View style={s.section}>
        <Text style={s.label}>Tipo de Visita</Text>
        <View style={s.chipRow}>
          {visitTypes?.map((vt) => (
            <TouchableOpacity
              key={vt.id}
              style={[s.chip, visitTypeId === vt.id && s.chipActive]}
              onPress={() => setVisitTypeId(vt.id)}
            >
              <Text style={[s.chipText, visitTypeId === vt.id && s.chipTextActive]}>
                {VISIT_TYPE_LABELS[vt.name] ?? vt.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Status da Visita */}
      <View style={s.section}>
        <Text style={s.label}>Status da Visita</Text>
        <View style={s.statusGrid}>
          {STATUSES.map((st) => (
            <TouchableOpacity
              key={st.value}
              style={[s.statusBtn, status === st.value && { borderColor: st.color, backgroundColor: st.color + '15' }]}
              onPress={() => setStatus(st.value)}
            >
              <MaterialIcons name={st.icon as any} size={20} color={status === st.value ? st.color : '#9ca3af'} />
              <Text style={[s.statusLabel, status === st.value && { color: st.color }]}>{st.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tipo de Foco (condicional) */}
      {hasFinding && (
        <View style={s.section}>
          <Text style={s.label}>Tipo de Foco Encontrado</Text>
          <View style={s.chipRow}>
            {focusTypes?.map((ft) => (
              <TouchableOpacity
                key={ft.id}
                style={[s.chip, focusTypeId === ft.id && s.chipActiveOrange]}
                onPress={() => setFocusTypeId(ft.id)}
              >
                <Text style={[s.chipText, focusTypeId === ft.id && s.chipTextActiveOrange]}>
                  {ft.description ?? ft.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Ação Tomada (condicional) */}
      {hasFinding && (
        <View style={s.section}>
          <Text style={s.label}>Ação Tomada</Text>
          <View style={s.chipRow}>
            {actionsTaken?.map((at) => (
              <TouchableOpacity
                key={at.id}
                style={[s.chip, actionTakenId === at.id && s.chipActive]}
                onPress={() => setActionTakenId(at.id)}
              >
                <Text style={[s.chipText, actionTakenId === at.id && s.chipTextActive]}>
                  {at.description ?? at.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Observações */}
      <View style={s.section}>
        <Text style={s.label}>Observações</Text>
        <TextInput
          style={[s.input, s.textarea]}
          placeholder="Focos encontrados, situação do imóvel..."
          placeholderTextColor="#9ca3af"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Evidências Fotográficas */}
      <View style={s.section}>
        <Text style={s.label}>
          Evidências Fotográficas ({photos.length})
          {hasFinding && photos.length === 0 && <Text style={s.required}> — obrigatória</Text>}
        </Text>
        <TouchableOpacity style={s.photoBtn} onPress={pickPhoto}>
          <MaterialIcons name="camera-alt" size={22} color="#006B3F" />
          <Text style={s.photoBtnText}>Tirar Foto</Text>
        </TouchableOpacity>
        {photos.length > 0 && (
          <View style={s.photoGrid}>
            {photos.map((uri, i) => (
              <View key={i} style={s.photoThumb}>
                <Image source={{ uri }} style={s.photoImage} />
                <TouchableOpacity style={s.photoRemove} onPress={() => removePhoto(i)}>
                  <MaterialIcons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[s.submitBtn, createVisit.isPending && s.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={createVisit.isPending}
      >
        <Text style={s.submitText}>{createVisit.isPending ? 'Registrando...' : 'Registrar Visita'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  section: { padding: 16, marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  required: { color: '#ef4444', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', backgroundColor: '#fff' },
  textarea: { height: 100 },
  dropdown: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginTop: 4 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  dropdownText: { fontSize: 14, color: '#374151', flex: 1 },
  selectedBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ecfdf5', padding: 10, borderRadius: 8, marginTop: 6 },
  selectedText: { flex: 1, fontSize: 13, color: '#065f46' },
  browseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#d1fae5', backgroundColor: '#f0fdf4', borderRadius: 8, padding: 12, marginTop: 8 },
  browseBtnText: { color: '#006B3F', fontSize: 13, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff' },
  chipActive: { borderColor: '#006B3F', backgroundColor: '#ecfdf5' },
  chipActiveOrange: { borderColor: '#f97316', backgroundColor: '#fff7ed' },
  chipText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  chipTextActive: { color: '#006B3F', fontWeight: '700' },
  chipTextActiveOrange: { color: '#f97316', fontWeight: '700' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, backgroundColor: '#fff', minWidth: '47%' },
  statusLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '500', flex: 1 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#006B3F', borderRadius: 10, padding: 14, justifyContent: 'center' },
  photoBtnText: { color: '#006B3F', fontWeight: '600', fontSize: 14 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  photoThumb: { width: 72, height: 72, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  photoImage: { width: '100%', height: '100%' },
  photoRemove: { position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  submitBtn: { margin: 16, backgroundColor: '#006B3F', borderRadius: 12, padding: 18, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
