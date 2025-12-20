import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  // Public pages that don't require authentication
  const publicPages = ['/login', '/welcome', '/help']
  const publicPrefixes = ['/tools/', '/api/auth/']

  const isPublic = publicPages.includes(pathname) ||
                   publicPrefixes.some(prefix => pathname.startsWith(prefix))

  // If user is not signed in and the current path is not a public page,
  // redirect to the login page
  if (!isLoggedIn && !isPublic) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is signed in and trying to access login page, redirect to home
  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/today', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
