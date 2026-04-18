import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useAuthStore } from '../../src/store/auth'
import { router } from 'expo-router'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const signIn = useAuthStore((s) => s.signIn)

  const handleLogin = async () => {
    if (!email || !password) return
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
      router.replace('/(app)')
    } catch (e: any) {
      setError('Email ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
      <View style={s.card}>
        <View style={s.logoBox}>
          <Text style={s.logoText}>🦟</Text>
          <Text style={s.appName}>ZoonoseApp</Text>
          <Text style={s.appSub}>Sistema de Vigilância</Text>
        </View>

        {error && <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>}

        <TextInput
          style={s.input}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={s.input}
          placeholder="Senha"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Entrar</Text>}
        </TouchableOpacity>

        <Text style={s.version}>v1.0 MVP</Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#006B3F', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 32, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  logoBox: { alignItems: 'center', marginBottom: 32 },
  logoText: { fontSize: 48 },
  appName: { fontSize: 26, fontWeight: '700', color: '#006B3F', marginTop: 8 },
  appSub: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 8, padding: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#ef4444' },
  errorText: { color: '#dc2626', fontSize: 13 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 12, color: '#111827' },
  btn: { backgroundColor: '#006B3F', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  version: { textAlign: 'center', color: '#9ca3af', fontSize: 11, marginTop: 24 },
})
