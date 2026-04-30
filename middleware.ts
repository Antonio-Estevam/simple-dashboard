import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("user_session_coachingos_v0")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
  try {
    const backendResponse = await fetch("http://localhost:8080/", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (backendResponse.status !== 200) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
      console.log(backendResponse.body);
    }
  } catch {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
