import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const isConstructionMode = process.env.CONSTRUCTION_MODE === 'true'

    if (!isConstructionMode) return NextResponse.next()

    const { pathname } = request.nextUrl

    // Allow these paths even in construction mode
    const allowedPaths = [
        '/en-construccion',
        '/api/',
        '/_next/',
        '/images/',
        '/favicon.ico',
        '/robots.txt',
        '/sitemap.xml',
    ]

    const isAllowed = allowedPaths.some((path) => pathname.startsWith(path))
    if (isAllowed) return NextResponse.next()

    // Redirect everything else to construction page
    const url = request.nextUrl.clone()
    url.pathname = '/en-construccion'
    return NextResponse.rewrite(url)
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
