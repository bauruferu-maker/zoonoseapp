import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '../../../../lib/supabase-server'
import AutoToast from '../../../../components/AutoToast'

export const dynamic = 'force-dynamic'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gestor',
  coordinator: 'Coordenador',
  agent: 'Agente',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-50 text-red-700',
  manager: 'bg-purple-50 text-purple-700',
  coordinator: 'bg-blue-50 text-blue-700',
  agent: 'bg-emerald-50 text-emerald-700',
}

export default async function AdminUsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['manager', 'admin'].includes(profile.role)) {
    redirect('/dashboard?acesso=negado')
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('id, name, role, sector_id, sectors(name, code)')
    .order('name')

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <Suspense fallback={null}><AutoToast /></Suspense>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Administração</p>
            <h1 className="text-3xl font-black text-slate-900">Usuários</h1>
            <p className="text-slate-500 text-sm mt-1">{(users ?? []).length} usuários cadastrados</p>
          </div>
          <Link href="/dashboard/admin" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            ← Admin
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Nome</th>
                <th className="px-5 py-4 font-semibold">Cargo</th>
                <th className="px-5 py-4 font-semibold">Setor</th>
                <th className="px-5 py-4 font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                (users ?? []).map((u) => {
                  const sector = (u as any).sectors // eslint-disable-line @typescript-eslint/no-explicit-any
                  return (
                    <tr key={u.id} className="border-t border-slate-100">
                      <td className="px-5 py-4 font-medium text-slate-900">{u.name ?? '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_COLORS[u.role] ?? 'bg-slate-100 text-slate-600'}`}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {sector ? `${sector.name}${sector.code ? ` (${sector.code})` : ''}` : <span className="text-slate-400 italic">Sem setor</span>}
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/dashboard/admin/usuarios/${u.id}`} className="font-semibold text-emerald-700 hover:underline">
                          Editar
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
