import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

async function getToken() {
  return cookies().get("user_session_coachingos_v0")?.value;
}

export async function GET(request: NextRequest) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = request.nextUrl.searchParams.get("status");
  const url = status
    ? `http://localhost:8080/api/leads?status=${status}`
    : `http://localhost:8080/api/leads`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });

  if (!response.ok) return NextResponse.json({ error: "Failed to fetch leads" }, { status: response.status });
  return NextResponse.json(await response.json());
}

export async function POST(request: NextRequest) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const response = await fetch("http://localhost:8080/api/leads", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) return NextResponse.json({ error: "Failed to create lead" }, { status: response.status });
  return NextResponse.json(await response.json());
}
