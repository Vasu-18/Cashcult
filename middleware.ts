import { clerkClient, clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Routes that don't require authentication at all
const isAuthRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
])

// The homepage is public (viewable without login) but should still redirect signed-in new users
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
])

const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  // If the user is not signed in and the route is not public, protect it
  if (!userId && !isPublicRoute(req)) {
    await auth.protect()
  }

  // For signed-in users, check onboarding status
  if (userId) {
    // Skip onboarding check for auth routes (sign-in/sign-up)
    if (isAuthRoute(req)) return

    try {
      // 1. Try to check session claims first (fastest, no API call needed if configured in dashboard)
      const claimMetadata = sessionClaims?.unsafeMetadata as Record<string, unknown> | undefined
      let onboardingComplete = claimMetadata?.onboardingComplete

      // 2. If not found in tokens, fetch from Clerk API
      if (onboardingComplete === undefined) {
        const client = await clerkClient()
        const user = await client.users.getUser(userId)
        onboardingComplete = user.unsafeMetadata?.onboardingComplete
      }

      // If NOT onboarded and NOT already on onboarding page → redirect to /onboarding
      if (!onboardingComplete && !isOnboardingRoute(req)) {
        const onboardingUrl = new URL('/onboarding', req.url)
        return NextResponse.redirect(onboardingUrl)
      }

      // If already onboarded and on /onboarding → redirect to /dashboard
      if (onboardingComplete && isOnboardingRoute(req)) {
        const dashboardUrl = new URL('/dashboard', req.url)
        return NextResponse.redirect(dashboardUrl)
      }
    } catch (error) {
      console.error("Middleware Clerk user fetch error:", error)
      // On error, let the user proceed to avoid locking them out of the app
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
