'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase-browser'
import Sidebar from '../../components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser()
      .then(({ data: { user } }) => {
        if (!user) router.replace('/login')
        else setReady(true)
      })
      .catch(() => {
        router.replace('/login')
      })
  }, [router])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700" />
      </div>
    )
  }

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
