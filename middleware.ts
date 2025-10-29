import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      console.error('Missing Supabase environment variables in middleware')
      // Allow login page access without env vars to show error
      if (req.nextUrl.pathname === '/login') {
        return res
      }
      // Redirect to login to show error
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Create a Supabase client for Server-Side Rendering with proper cookie handling
    const supabase = createServerClient(
      url,
      key,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Validate the JWT token properly
    const { data: { session }, error } = await supabase.auth.getSession()

    // If session fetch fails, log error but allow request to proceed
    if (error) {
      console.error('Middleware auth error:', error.message)
      // Allow request to continue - client-side will handle auth state
      return res
    }

    // Public pages that don't require authentication
    const publicPages = ['/login', '/welcome', '/help']
    const publicPrefixes = ['/tools/'] // Public tool pages

    // If user is not signed in and the current path is not a public page,
    // redirect to the login page
    const isPublic = publicPages.includes(req.nextUrl.pathname) ||
                     publicPrefixes.some(prefix => req.nextUrl.pathname.startsWith(prefix))

    if (!session && !isPublic) {
      const redirectUrl = new URL('/login', req.url)
      // Add the original URL as a query parameter to redirect back after login
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is signed in and trying to access login page, redirect to home
    if (session && req.nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return res
  } catch (error) {
    // Catch any unexpected errors in middleware
    console.error('Middleware unexpected error:', error instanceof Error ? error.message : 'Unknown error')
    // Allow request to continue - client-side will handle auth state
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth callback
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|auth).*)',
  ],
}