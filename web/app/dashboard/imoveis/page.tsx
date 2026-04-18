import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function PropertiesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: properties } = await supabase
    .from('properties')
    .select('id, address, owner_name, owner_phone, sectors(name, code)')
    .order('address')
    .limit(200)

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Dashboard</p>
            <h1 className="text-3xl font-black text-slate-900">Imoveis</h1>
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
              {(properties ?? []).map((property) => (
                <tr key={property.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-medium text-slate-900">{property.address}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {(property as any).sectors?.name ?? 'Sem setor'} {(property as any).sectors?.code ? `(${(property as any).sectors.code})` : ''}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{property.owner_name ?? property.owner_phone ?? 'Nao informado'}</td>
                  <td className="px-5 py-4">
                    <Link href={`/dashboard/imoveis/${property.id}`} className="font-semibold text-emerald-700">
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
