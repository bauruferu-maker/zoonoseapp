import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase-server'

export const dynamic = 'force-dynamic'

interface PropertyRow {
  id: string
  address: string | null
  owner_name: string | null
  sectors: { name: string; code: string | null } | null
}

export default async function PropertiesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Role check: coordinator, manager, admin can access properties (P002)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['coordinator', 'manager', 'admin'].includes(profile.role)) {
    redirect('/dashboard?acesso=negado')
  }

  const { data: propertiesRaw } = await supabase
    .from('properties')
    .select('id, address, owner_name, sectors(name, code)')
    .order('address')
    .limit(200)

  const properties = (propertiesRaw ?? []) as unknown as PropertyRow[]

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Dashboard</p>
            <h1 className="text-3xl font-black text-slate-900">Imoveis</h1>
            <p className="text-slate-500 text-sm mt-1">Exibindo ate 200 imoveis</p>
          </div>
          <Link href="/dashboard" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            Voltar ao dashboard
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Endereco</th>
                <th className="px-5 py-4 font-semibold">Setor</th>
                <th className="px-5 py-4 font-semibold">Responsavel</th>
                <th className="px-5 py-4 font-semibold">Acao</th>
              </tr>
            </thead>
            <tbody>
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                    Nenhum imovel cadastrado
                  </td>
                </tr>
              ) : (
                properties.map((property) => (
                  <tr key={property.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-medium text-slate-900">{property.address ?? '—'}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {property.sectors?.name ?? 'Sem setor'}
                      {property.sectors?.code ? ` (${property.sectors.code})` : ''}
                    </td>
                    {/* P030: show only owner_name, not phone number */}
                    <td className="px-5 py-4 text-slate-600">{property.owner_name ?? 'Proprietario nao informado'}</td>
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/imoveis/${property.id}`} className="font-semibold text-emerald-700">
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
