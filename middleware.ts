import { NextResponse, type NextRequest } from "next/server";

// Auth gate disabled for the demo build — every page runs on lib/store.tsx
// mock data, so there's nothing behind Supabase worth gating here.
export async function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
