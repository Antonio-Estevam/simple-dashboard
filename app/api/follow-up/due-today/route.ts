import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getToken() {
  return cookies().get("user_session_coachingos_v0")?.value;
}

export async function GET() {
  const token = getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const response = await fetch("http://localhost:8080/api/follow-up/due-today", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return NextResponse.json({ error: "Failed to fetch due-today follow-ups" }, { status: response.status });
  return NextResponse.json(await response.json());
}