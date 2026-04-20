import { redirect } from 'next/navigation'
import { createClient } from '../../../../lib/supabase-server'

export const dynamic = 'force-dynamic'

const STATUS_OPTIONS = [
  { value: 'visitado_sem_foco', label: 'Sem achado' },
  { value: 'visitado_com_achado', label: 'Com achado' },
  { value: 'recusado', label: 'Recusado' },
  { value: 'fechado', label: 'Fechado' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'pendente_revisao', label: 'Pendente de revisão' },
]

export default async function NovaVisitaPage({
  searchParams,
}: {
  searchParams: Promise<{ property_id?: string; error?: string }>
}) {
  const { property_id, error } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, sector_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'agent') redirect('/dashboard')

  if (!profile.sector_id) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 px-6 py-8 text-center">
            <p className="text-orange-800 font-semibold">Nenhum setor atribuído</p>
            <p className="text-orange-600 text-sm mt-1">Fale com seu coordenador para ser atribuído a um setor.</p>
          </div>
        </div>
      </main>
    )
  }

  const { data: properties } = await supabase
    .from('properties')
    .select('id, address')
    .eq('sector_id', profile.sector_id)
    .order('address')

  const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  async function registerVisit(formData: FormData) {
    'use server'
    const supabaseServer = await createClient()
    const { data: { user: serverUser } } = await supabaseServer.auth.getUser()
    if (!serverUser) redirect('/login')

    const property_id_val = formData.get('property_id') as string
    const status = formData.get('status') as string
    const visited_at = formData.get('visited_at') as string
    const notes = (formData.get('notes') as string) || null

    if (!property_id_val || !status || !visited_at) {
      redirect('/agent/visitas/nova?error=campos_obrigatorios')
    }

    const { error: insertError } = await supabaseServer.from('visits').insert({
      property_id: property_id_val,
      agent_id: serverUser.id,
      status,
      visited_at: new Date(visited_at).toISOString(),
      notes,
    })

    if (insertError) {
      redirect(`/agent/visitas/nova?error=falha_ao_salvar`)
    }

    redirect('/agent?sucesso=visita_registrada')
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Registrar Visita</p>
            <h1 className="text-3xl font-black text-slate-900">Nova Visita</h1>
          </div>
          <a
            href={property_id ? `/agent/imoveis/${property_id}` : '/agent/imoveis'}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            ← Voltar
          </a>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
            {error === 'campos_obrigatorios' && 'Preencha todos os campos obrigatórios.'}
            {error === 'falha_ao_salvar' && 'Erro ao salvar visita. Tente novamente.'}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <form action={registerVisit} className="space-y-5">

            {/* Property */}
            <div>
              <label htmlFor="property_id" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Imóvel <span className="text-red-500">*</span>
              </label>
              <select
                id="property_id"
                name="property_id"
                required
                defaultValue={property_id ?? ''}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="" disabled>Selecione um imóvel</option>
                {(properties ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.address}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                required
                defaultValue=""
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="" disabled>Selecione o resultado</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Date/time */}
            <div>
              <label htmlFor="visited_at" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Data e Hora <span className="text-red-500">*</span>
              </label>
              <input
                id="visited_at"
                name="visited_at"
                type="datetime-local"
                required
                defaultValue={nowLocal}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Observações
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Descreva o que foi encontrado, condições do imóvel, etc."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition"
            >
              Registrar Visita
            </button>
          </form>
        </div>

      </div>
    </main>
  )
}
