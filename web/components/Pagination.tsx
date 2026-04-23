'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface PaginationProps {
  total: number
  pageSize?: number
}

export default function Pagination({ total, pageSize = 30 }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const totalPages = Math.ceil(total / pageSize)

  if (totalPages <= 1) return null

  const go = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
      <p className="text-xs text-slate-500">
        Página {page} de {totalPages} · {total} registro{total !== 1 ? 's' : ''}
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
        >
          ← Anterior
        </button>
        <button
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
        >
          Próxima →
        </button>
      </div>
    </div>
  )
}
