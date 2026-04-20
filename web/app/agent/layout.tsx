'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase-browser'
import AgentSidebar from '../../components/AgentSidebar'

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace('/login')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (!profile || profile.role !== 'agent') {
        router.replace('/dashboard')
      } else {
        setReady(true)
      }
    })
  }, [router])

  if (ready === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AgentSidebar />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
