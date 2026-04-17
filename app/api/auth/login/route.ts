import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendResponse = await fetch("http://localhost:8080/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!backendResponse.ok) {
    const error = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(
      { message: error.message ?? "Credenciais inválidas" },
      { status: backendResponse.status }
    );
  }

  const { token } = await backendResponse.json();

  const response = NextResponse.json({ success: true });

  response.cookies.set("user_session_coachingos_v0", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return response;
}
