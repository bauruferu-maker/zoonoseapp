import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase-server'

function escapeCsv(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  // Role values in DB are English lowercase: 'admin', 'manager', 'coordinator', 'agent' (P018)
  const allowedRoles = ['coordinator', 'manager', 'admin']
  if (!profile) {
    return NextResponse.json(
      { error: 'Perfil de usuario nao encontrado. Contate o administrador.' },
      { status: 403 }
    )
  }
  if (!allowedRoles.includes(profile.role)) {
    return NextResponse.json(
      { error: `Acesso negado. Seu cargo (${profile.role}) nao tem permissao para exportar dados. Necessario: coordenador, gestor ou administrador.` },
      { status: 403 }
    )
  }

  const { data, error } = await supabase
    .from('vw_visit_summary')
    .select('*')
    .order('visited_at', { ascending: false })
    .limit(1000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const header = ['id', 'status', 'visited_at', 'synced_at', 'address', 'sector_name', 'sector_code', 'agent_name', 'agent_role', 'evidence_count']
  const rows = (data ?? []).map((item) =>
    [
      item.id,
      item.status,
      item.visited_at,
      item.synced_at,
      item.address,
      item.sector_name,
      item.sector_code,
      item.agent_name,
      item.agent_role,
      item.evidence_count,
    ]
      .map(escapeCsv)
      .join(',')
  )

  return new NextResponse([header.join(','), ...rows].join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="zoonoseapp-visitas.csv"',
    },
  })
}
