import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value, ...options } as Parameters<typeof request.cookies.set>[0])
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options } as Parameters<typeof response.cookies.set>[0])
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value: '', ...options } as Parameters<typeof request.cookies.set>[0])
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options } as Parameters<typeof response.cookies.set>[0])
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthPage   = pathname === '/login' || pathname === '/forgot-password'
  const isDashboard  = pathname.startsWith('/dashboard')
  const isAgentArea  = pathname.startsWith('/agent')

  // Block unauthenticated access to protected areas
  if (!user && (isDashboard || isAgentArea)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based routing — fetch profile once for any path that needs it
  if (user && (isAuthPage || isDashboard || isAgentArea)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAgent = profile?.role === 'agent'

    if (isAuthPage) {
      // After login: route by role
      return NextResponse.redirect(new URL(isAgent ? '/agent' : '/dashboard', request.url))
    }

    if (isDashboard && isAgent) {
      // Agents don't belong in /dashboard
      return NextResponse.redirect(new URL('/agent', request.url))
    }

    if (isAgentArea && !isAgent) {
      // Non-agents don't belong in /agent
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
