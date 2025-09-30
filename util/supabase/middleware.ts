import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            })
          );
        },
      },
    }
  );

  // CRITICAL: Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser() - it refreshes the session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define public routes that don't require authentication
  const publicRoutes = [
    "/", 
    "/terms-and-conditions", 
    "/privacy-policy", 
    "/waitlist"
  ];

  const pathname = request.nextUrl.pathname;

  // Check if route is public
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/error");

  // Redirect unauthenticated users trying to access protected routes
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Preserve the original destination for redirect after login
    url.searchParams.set("redirect", pathname);
    
    const response = NextResponse.redirect(url);
    // Preserve Supabase session cookies
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    });
    return response;
  }

  // Redirect authenticated users from root to home
  if (user && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    const redirectResponse = NextResponse.redirect(url);
    
    // Preserve all session cookies
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    });
    return redirectResponse;
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname.startsWith("/login") || pathname.startsWith("/signup"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    const redirectResponse = NextResponse.redirect(url);
    
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    });
    return redirectResponse;
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
