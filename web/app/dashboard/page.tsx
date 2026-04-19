import { createClient } from '../../lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardClient from '../../components/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ acesso?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Role check: agents do not have dashboard access (P002)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'agent') {
    redirect('/login?msg=sem-acesso')
  }

  const [{ data: stats, error: statsError }, { data: sectors }] = await Promise.all([
    supabase.from('vw_sector_stats').select('*').order('day', { ascending: false }).limit(100),
    supabase.from('sectors').select('*'),
  ])

  const resolvedSearchParams = await searchParams
  const accessDenied = resolvedSearchParams?.acesso === 'negado'

  // P021: surface statsError to the user via the client component
  return (
    <DashboardClient
      stats={stats ?? []}
      sectors={sectors ?? []}
      statsError={statsError?.message ?? null}
      accessDenied={accessDenied}
    />
  )
}
