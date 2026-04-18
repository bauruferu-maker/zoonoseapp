import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function LoginScreen() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showReset, setShowReset] = useState(false)

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Preencha e-mail e senha')
      return
    }
    setLoading(true)
    const { error } = await signIn(email.trim(), password)
    setLoading(false)
    if (error) Alert.alert('Erro ao entrar', error)
  }

  async function handleResetPassword() {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Digite seu e-mail no campo acima.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    setLoading(false)
    if (error) {
      Alert.alert('Erro', 'Não foi possível enviar o e-mail. Verifique e tente novamente.')
    } else {
      Alert.alert('E-mail enviado', 'Verifique sua caixa de entrada para redefinir a senha.')
      setShowReset(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>Z</Text>
        </View>
        <Text style={styles.title}>ZoonoseApp</Text>
        <Text style={styles.subtitle}>App do Agente de Campo</Text>

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="seu@email.com"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {showReset ? (
          <>
            <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Enviar link de recuperação</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowReset(false)} style={styles.linkBtn}>
              <Text style={styles.linkText}>Voltar ao login</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Sua senha"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowReset(true)} style={styles.linkBtn}>
              <Text style={styles.linkText}>Esqueci minha senha</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#14532d', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28 },
  iconContainer: {
    width: 56, height: 56, borderRadius: 12, backgroundColor: '#16a34a',
    alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  icon: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 13, color: '#374151', fontWeight: '600', marginBottom: 4, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 14,
    fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB',
  },
  button: {
    backgroundColor: '#16a34a', borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 24,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtn: { alignItems: 'center', marginTop: 16 },
  linkText: { color: '#6B7280', fontSize: 13, fontWeight: '500' },
})
