import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function getToken() {
  return cookies().get("user_session_coachingos_v0")?.value;
}

export async function GET() {
  const token = getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const response = await fetch("http://localhost:8080/api/clients", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return NextResponse.json({ error: "Failed to fetch clients" }, { status: response.status });
  return NextResponse.json(await response.json());
}

export async function POST(request: NextRequest) {
  const token = getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const response = await fetch("http://localhost:8080/api/clients", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) return NextResponse.json({ error: "Failed to create client" }, { status: response.status });
  return NextResponse.json(await response.json());
}
