import { type NextRequest } from "next/server";
import { updateSession } from "./util/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Skip middleware for opengraph-image and icon routes
  if (
    request.nextUrl.pathname.includes("/opengraph-image") ||
    request.nextUrl.pathname.includes("/icon")
  ) {
    return;
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static image files (svg, png, jpg, jpeg, gif, webp)
     */
    "/",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
