
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// By default, clerkMiddleware does not protect any routes. 
// All routes are public and you must opt-in to protection for specific routes.
// See https://clerk.com/docs/references/nextjs/clerk-middleware for more information about configuring your Middleware

const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhook(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
