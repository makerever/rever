// Middleware setup for request handling and route protection

import { NextRequest, NextResponse } from "next/server";

// Publicly accessible routes
const PUBLIC_ROUTES = [
  "/",
  "/register",
  "/reset-password",
  "/user",
  "/terms-and-conditions",
  "/privacy-policy",
  "/eula",
  "/proxy/cors",
];
const MAIN_ROUTES = [
  "/home",
  "/settings",
  "/vendor",
  "/bill",
  "/404",
  "/not-access",
];
const PROFILE_ROUTES = [
  "/profile",
  "/security",
  "/appearance",
  "/notification",
];
const VALID_ROUTES = [...PUBLIC_ROUTES, ...MAIN_ROUTES, ...PROFILE_ROUTES];

// Ignore system/static paths
const IGNORED_PATH_PREFIXES = [
  "/_next",
  "/api",
  "/static",
  "/favicon.ico",
  "/images",
  "/icons",
  "/fonts",
  "/manifest.json",
  "/robots.txt",
];

// Role restrictions: define routes that are *restricted* per role
const ROLE_BASED_RESTRICTIONS: Record<string, string[]> = {
  admin: ["/bill/approvals/list"],
  member: ["/bill/approvals/list", "/settings/members/invite"],
  finance_manager: [
    "/vendor/add",
    "/vendor/update",
    "/bill/list",
    "/bill/add",
    "/bill/edit",
    "/settings/approvals",
    "/settings/members/invite",
  ],
};

const startsWithAny = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname.startsWith(prefix));

const matchesRoute = (pathname: string, routes: string[]) =>
  routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get("token")?.value;
  const role = req.cookies.get("role")?.value as
    | "admin"
    | "member"
    | "finance_manager"
    | undefined;

  // 1. Allow internal/static files
  if (startsWithAny(pathname, IGNORED_PATH_PREFIXES)) {
    return NextResponse.next();
  }

  // 2. Block unauthenticated users from protected routes
  if (!token && !matchesRoute(pathname, PUBLIC_ROUTES)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 3. Redirect authenticated user from root to dashboard
  if (pathname === "/" && token) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // 4. Role-based access restriction (if role is defined)
  if (role && ROLE_BASED_RESTRICTIONS[role]) {
    const restrictedRoutes = ROLE_BASED_RESTRICTIONS[role];
    if (matchesRoute(pathname, restrictedRoutes)) {
      return NextResponse.redirect(new URL("/not-access", req.url));
    }
  }

  // 5. Fallback to 404 if route is invalid
  if (!matchesRoute(pathname, VALID_ROUTES)) {
    return NextResponse.redirect(new URL("/404", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|api|static|favicon.ico|images|fonts|manifest.json|robots.txt).*)",
  ],
};
