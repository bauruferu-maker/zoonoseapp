import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../../../lib/supabase-server'
import PhotoUpload from '../../../../../components/PhotoUpload'

export const dynamic = 'force-dynamic'

const STATUS_OPTIONS = [
  { value: 'visitado_sem_foco',   label: 'Sem achado' },
  { value: 'visitado_com_achado', label: 'Com achado' },
  { value: 'recusado',            label: 'Recusado' },
  { value: 'fechado',             label: 'Fechado' },
  { value: 'pendente',            label: 'Pendente' },
  { value: 'pendente_revisao',    label: 'Pendente de revisão' },
]

export default async function EditarVisitaPage({
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'agent') redirect('/dashboard')

  // Fetch visit — only if owned by this agent
  const { data: visit } = await supabase
    .from('visits')
    .select('id, status, visited_at, notes, photo_url, property_id, properties(address)')
    .eq('id', id)
    .eq('agent_id', user.id)
    .single()

  if (!visit) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
            <p className="text-slate-500">Visita não encontrada ou sem permissão de edição.</p>
            <Link href="/agent/visitas" className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline">
              Voltar às visitas
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const address = (visit as any).properties?.address ?? '—' // eslint-disable-line @typescript-eslint/no-explicit-any

  const visitedAtLocal = visit.visited_at
    ? new Date(new Date(visit.visited_at).getTime() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : ''

  async function updateVisit(formData: FormData) {
    'use server'
    const supabaseServer = await createClient()
    const { data: { user: serverUser } } = await supabaseServer.auth.getUser()
    if (!serverUser) redirect('/login')

    const status = formData.get('status') as string
    const visited_at = formData.get('visited_at') as string
    const notes = (formData.get('notes') as string) || null
    const photo_url = (formData.get('photo_url') as string) || null

    if (!status || !visited_at) {
      redirect(`/agent/visitas/${id}/edit?error=campos_obrigatorios`)
    }

    const { error: updateError } = await supabaseServer
      .from('visits')
      .update({ status, visited_at: new Date(visited_at).toISOString(), notes, photo_url })
      .eq('id', id)
      .eq('agent_id', serverUser.id) // guard: só o dono pode editar

    if (updateError) {
      redirect(`/agent/visitas/${id}/edit?error=falha_ao_salvar`)
    }

    redirect('/agent/visitas?sucesso=visita_atualizada')
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-2xl">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Minhas Visitas</p>
            <h1 className="text-3xl font-black text-slate-900">Editar Visita</h1>
            <p className="text-slate-500 text-sm mt-1">{address}</p>
          </div>
          <Link href="/agent/visitas" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            ← Cancelar
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
            {error === 'campos_obrigatorios' && 'Preencha todos os campos obrigatórios.'}
            {error === 'falha_ao_salvar' && 'Erro ao salvar visita. Tente novamente.'}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <form action={updateVisit} className="space-y-5">

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Imóvel
              </label>
              <p className="text-sm font-medium text-slate-900 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
                {address}
              </p>
            </div>

            <div>
              <label htmlFor="status" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                required
                defaultValue={visit.status}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="visited_at" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Data e Hora <span className="text-red-500">*</span>
              </label>
              <input
                id="visited_at"
                name="visited_at"
                type="datetime-local"
                required
                defaultValue={visitedAtLocal}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Observações
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={visit.notes ?? ''}
                placeholder="Descreva o que foi encontrado, condições do imóvel, etc."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Photo */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Foto / Evidência
              </label>
              <PhotoUpload name="photo_url" agentId={user.id} initialUrl={(visit as any).photo_url ?? undefined} />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition"
            >
              Salvar Alterações
            </button>
          </form>
        </div>

      </div>
    </main>
  )
}
