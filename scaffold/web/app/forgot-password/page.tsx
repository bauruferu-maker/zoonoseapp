'use client'
import { useState } from 'react'
import { createClient } from '../../lib/supabase-browser'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Informe seu e-mail.'); return }
    setLoading(true)
    setError(null)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) throw resetError
      setSent(true)
    } catch (err: any) {
      setError(err.message ?? 'Erro ao enviar e-mail.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {sent ? (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">E-mail enviado!</h2>
            <p className="text-sm text-gray-500 mb-1">Enviamos um link de recuperação para</p>
            <p className="text-sm font-semibold text-green-700 mb-4">{email}</p>
            <p className="text-xs text-gray-400 mb-6">Verifique sua caixa de entrada e spam. O link expira em 1 hora.</p>
            <Link href="/login" className="block w-full bg-green-700 text-white text-center py-3 rounded-lg font-semibold hover:bg-green-800 transition">
              Voltar para Login
            </Link>
          </div>
        ) : (
          <>
            <Link href="/login" className="text-green-700 text-sm font-medium hover:underline mb-4 inline-flex items-center gap-1">
              ← Voltar
            </Link>
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 text-center mb-2">Esqueceu a senha?</h1>
            <p className="text-sm text-gray-500 text-center mb-6">Informe o e-mail cadastrado e enviaremos um link para redefinir sua senha.</p>
            {error && (
              <div className="bg-red-50 border-l-3 border-red-500 text-red-700 text-sm p-3 rounded mb-4">{error}</div>
            )}
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition disabled:opacity-60"
              >
                {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
