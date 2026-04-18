import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { MaterialIcons } from '@expo/vector-icons'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async () => {
    if (!email) {
      setError('Informe seu e-mail.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'zoonoseapp://reset-password',
      })
      if (resetError) throw resetError
      setSent(true)
    } catch (e: any) {
      setError(e.message ?? 'Erro ao enviar e-mail de recuperação.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
        <View style={s.card}>
          <View style={s.iconCircle}>
            <MaterialIcons name="mark-email-read" size={48} color="#006B3F" />
          </View>
          <Text style={s.sentTitle}>E-mail enviado!</Text>
          <Text style={s.sentText}>
            Enviamos um link de recuperação para{'\n'}
            <Text style={s.sentEmail}>{email}</Text>
          </Text>
          <Text style={s.sentHint}>
            Verifique sua caixa de entrada e spam. O link expira em 1 hora.
          </Text>
          <TouchableOpacity style={s.btn} onPress={() => router.back()}>
            <Text style={s.btnText}>Voltar para Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
      <View style={s.card}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color="#006B3F" />
        </TouchableOpacity>

        <View style={s.iconCircle}>
          <MaterialIcons name="lock-reset" size={48} color="#006B3F" />
        </View>

        <Text style={s.title}>Esqueceu a senha?</Text>
        <Text style={s.subtitle}>
          Informe o e-mail cadastrado e enviaremos um link para redefinir sua senha.
        </Text>

        {error && (
          <View style={s.errorBox}>
            <MaterialIcons name="error-outline" size={16} color="#dc2626" />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        <TextInput
          style={s.input}
          placeholder="Seu e-mail"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoFocus
        />

        <TouchableOpacity
          style={[s.btn, loading && s.btnDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.btnText}>Enviar Link de Recuperação</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#006B3F', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 32,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  backBtn: {
    position: 'absolute', top: 16, left: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center',
  },
  iconCircle: {
    alignSelf: 'center', width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, marginTop: 8,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 20 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: 8, padding: 12, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: '#ef4444',
  },
  errorText: { color: '#dc2626', fontSize: 13, flex: 1 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    padding: 14, fontSize: 15, marginBottom: 16, color: '#111827',
  },
  btn: { backgroundColor: '#006B3F', borderRadius: 10, padding: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  sentTitle: { fontSize: 22, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 8 },
  sentText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  sentEmail: { fontWeight: '700', color: '#006B3F' },
  sentHint: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 12, marginBottom: 24 },
})
