import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)

  const handleScan = ({ data }: { data: string }) => {
    if (scanned) return
    setScanned(true)

    // QR code contém o property_id (UUID)
    const propertyId = data.trim()
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(propertyId)) {
      router.push(`/(app)/properties/${propertyId}`)
    } else {
      // Tenta extrair UUID de uma URL ou texto
      const match = data.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
      if (match) {
        router.push(`/(app)/properties/${match[0]}`)
      } else {
        setScanned(false)
      }
    }
  }

  if (!permission) {
    return (
      <View style={s.centered}>
        <Text style={s.loadingText}>Carregando câmera...</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={s.centered}>
        <MaterialIcons name="qr-code-scanner" size={64} color="#9ca3af" />
        <Text style={s.permTitle}>Acesso à Câmera</Text>
        <Text style={s.permText}>Precisamos da câmera para escanear o QR code do imóvel.</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <Text style={s.permBtnText}>Permitir Câmera</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <CameraView
        style={s.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      >
        <View style={s.overlay}>
          <View style={s.scanArea}>
            <View style={[s.corner, s.topLeft]} />
            <View style={[s.corner, s.topRight]} />
            <View style={[s.corner, s.bottomLeft]} />
            <View style={[s.corner, s.bottomRight]} />
          </View>
          <Text style={s.hint}>Aponte a câmera para o QR code do imóvel</Text>
          {scanned && (
            <TouchableOpacity style={s.rescanBtn} onPress={() => setScanned(false)}>
              <Text style={s.rescanText}>Escanear novamente</Text>
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </View>
  )
}

const SCAN_SIZE = 250

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanArea: { width: SCAN_SIZE, height: SCAN_SIZE, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#006B3F' },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },
  hint: { color: '#fff', fontSize: 14, marginTop: 24, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 4 },
  rescanBtn: { marginTop: 16, backgroundColor: '#006B3F', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  rescanText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: 32, gap: 12 },
  loadingText: { color: '#6b7280', fontSize: 14 },
  permTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  permText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  permBtn: { backgroundColor: '#006B3F', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
