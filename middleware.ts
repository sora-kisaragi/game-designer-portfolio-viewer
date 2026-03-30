import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const user = process.env.BASIC_AUTH_USER
  const password = process.env.BASIC_AUTH_PASSWORD

  if (!user || !password) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('authorization')

  if (authHeader?.startsWith('Basic ')) {
    const decoded = atob(authHeader.slice(6))
    const colonIndex = decoded.indexOf(':')
    const inputUser = decoded.slice(0, colonIndex)
    const inputPassword = decoded.slice(colonIndex + 1)

    if (inputUser === user && inputPassword === password) {
      return NextResponse.next()
    }
  }

  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Portfolio"',
    },
  })
}

export const config = {
  matcher: '/:path*',
}
