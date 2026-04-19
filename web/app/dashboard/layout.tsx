'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase-browser'
import Sidebar from '../../components/Sidebar'

// Note: Server-side protection is handled by middleware.ts (P001).
// This layout keeps a client-side check as a secondary guard to avoid
// flash-of-content on client transitions (P005, P032).
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Start with null (unknown) so we show a minimal skeleton instead of content flash
  const [ready, setReady] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser()
      .then(({ data: { user } }) => {
        if (!user) {
          router.replace('/login')
        } else {
          setReady(true)
        }
      })
      .catch(() => {
        router.replace('/login')
      })
  }, [router])

  // Show nothing (no flash) until auth is confirmed
  if (ready === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700" />
          <p className="text-sm text-slate-400">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!ready) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="md:ml-64">
        <main className="flex-1 bg-gray-50 overflow-auto min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
