import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../../../lib/supabase-server'

export const dynamic = 'force-dynamic'

const ROLE_OPTIONS = [
  { value: 'agent',       label: 'Agente' },
  { value: 'coordinator', label: 'Coordenador' },
  { value: 'manager',     label: 'Gestor' },
  { value: 'admin',       label: 'Administrador' },
]

export default async function EditarUsuarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!currentProfile || !['manager', 'admin'].includes(currentProfile.role)) {
    redirect('/dashboard?acesso=negado')
  }

  const { data: targetUser } = await supabase
    .from('profiles')
    .select('id, name, role, sector_id')
    .eq('id', id)
    .single()

  if (!targetUser) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
            <p className="text-slate-500">Usuário não encontrado.</p>
            <Link href="/dashboard/admin/usuarios" className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline">
              Voltar à lista
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const { data: sectors } = await supabase
    .from('sectors')
    .select('id, name, code')
    .order('name')

  async function saveUser(formData: FormData) {
    'use server'
    const supabaseServer = await createClient()
    const { data: { user: serverUser } } = await supabaseServer.auth.getUser()
    if (!serverUser) redirect('/login')

    // Re-check permission server-side
    const { data: serverProfile } = await supabaseServer
      .from('profiles')
      .select('role')
      .eq('id', serverUser.id)
      .single()
    if (!serverProfile || !['manager', 'admin'].includes(serverProfile.role)) {
      redirect('/dashboard?acesso=negado')
    }

    const name = (formData.get('name') as string)?.trim()
    const role = formData.get('role') as string
    const sector_id = (formData.get('sector_id') as string) || null

    if (!name || !role) {
      redirect(`/dashboard/admin/usuarios/${id}?error=campos_obrigatorios`)
    }

    const { error: updateError } = await supabaseServer
      .from('profiles')
      .update({ name, role, sector_id })
      .eq('id', id)

    if (updateError) {
      redirect(`/dashboard/admin/usuarios/${id}?error=falha_ao_salvar`)
    }

    redirect('/dashboard/admin/usuarios?sucesso=usuario_salvo')
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-2xl">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Administração</p>
            <h1 className="text-3xl font-black text-slate-900">Editar Usuário</h1>
          </div>
          <Link href="/dashboard/admin/usuarios" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            ← Cancelar
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
            {error === 'campos_obrigatorios' && 'Preencha todos os campos obrigatórios.'}
            {error === 'falha_ao_salvar' && 'Erro ao salvar. Tente novamente.'}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <form action={saveUser} className="space-y-5">

            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={targetUser.name ?? ''}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Cargo <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                required
                defaultValue={targetUser.role}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sector_id" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Setor <span className="text-slate-400 font-normal">(somente agentes)</span>
              </label>
              <select
                id="sector_id"
                name="sector_id"
                defaultValue={targetUser.sector_id ?? ''}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Sem setor atribuído</option>
                {(sectors ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.code ? ` (${s.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition"
              >
                Salvar Alterações
              </button>
              <Link
                href="/dashboard/admin/usuarios"
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition text-center"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>

      </div>
    </main>
  )
}
