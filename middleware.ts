import { NextRequest, NextResponse } from 'next/server'

// List of routes that require authentication
const protectedRoutes = ['/projects', '/dashboard']

export async function middleware(request: NextRequest) {
  // Check for auth cookie instead of using auth() function directly
  const authCookie = request.cookies.get('next-auth.session-token')?.value || 
                    request.cookies.get('__Secure-next-auth.session-token')?.value
  
  const isLoggedIn = !!authCookie
  const { pathname } = request.nextUrl

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  // If it's a protected route and there's no session, redirect to login
  if (isProtectedRoute && !isLoggedIn) {
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', encodeURI(pathname))
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// See: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 