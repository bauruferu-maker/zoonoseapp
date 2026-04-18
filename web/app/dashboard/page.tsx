import { createClient } from '../../lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardClient from '../../components/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: stats }, { data: sectors }] = await Promise.all([
    supabase.from('vw_sector_stats').select('*').order('day', { ascending: false }).limit(100),
    supabase.from('sectors').select('*'),
  ])

  return <DashboardClient stats={stats ?? []} sectors={sectors ?? []} />
}
