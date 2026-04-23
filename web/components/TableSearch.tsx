'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

interface TableSearchProps {
  placeholder?: string
  paramName?: string
}

export default function TableSearch({ placeholder = 'Buscar...', paramName = 'q' }: TableSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set(paramName, e.target.value)
    } else {
      params.delete(paramName)
    }
    params.delete('page')
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        defaultValue={searchParams.get(paramName) ?? ''}
        onChange={handleChange}
        placeholder={placeholder}
        className={`pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-56 transition ${isPending ? 'opacity-60' : ''}`}
      />
    </div>
  )
}
