import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-7xl font-black text-emerald-700 mb-4">404</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Pagina nao encontrada</h1>
        <p className="text-slate-500 mb-8">
          A pagina que voce esta procurando nao existe ou foi movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition"
          >
            Ir ao Dashboard
          </Link>
          <Link
            href="/dashboard/imoveis"
            className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Ver Imoveis
          </Link>
        </div>
      </div>
    </div>
  )
}
