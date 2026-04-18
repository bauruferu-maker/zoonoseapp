'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Nao foi possivel entrar. Verifique email e senha.')
      setIsLoading(false)
      return
    }

    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12 lg:flex-row lg:items-center lg:gap-16">
        <section className="mb-10 lg:mb-0 lg:w-1/2">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-emerald-300">ZoonoseApp</p>
          <h1 className="max-w-xl text-4xl font-black leading-tight text-white md:text-5xl">
            Vigilancia de campo e gestao municipal no mesmo fluxo.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Entre para acompanhar visitas, focos encontrados e indicadores por setor em um unico dashboard.
          </p>
        </section>

        <section className="lg:w-[420px]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white p-8 text-slate-900 shadow-2xl shadow-emerald-950/30">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Acessar dashboard</h2>
              <p className="mt-2 text-sm text-slate-500">Use sua conta Supabase com permissao de coordenacao, gestao ou administracao.</p>
            </div>

            <label className="mb-4 block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
                placeholder="voce@prefeitura.gov.br"
                required
              />
            </label>

            <label className="mb-2 block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Senha</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
                placeholder="Sua senha"
                required
              />
            </label>
            <div className="mb-4 text-right">
              <a href="/forgot-password" className="text-sm text-emerald-700 hover:underline">
                Esqueceu sua senha?
              </a>
            </div>

            {error ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
