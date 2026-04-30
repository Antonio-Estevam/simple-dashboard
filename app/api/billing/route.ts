import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function getToken() {
  return cookies().get("user_session_coachingos_v0")?.value;
}

export async function GET(request: NextRequest) {
  const token = getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const params = new URLSearchParams();
  if (sp.get("month"))  params.set("month",  sp.get("month")!);
  if (sp.get("year"))   params.set("year",   sp.get("year")!);
  if (sp.get("status")) params.set("status", sp.get("status")!);

  const qs = params.toString();
  const response = await fetch(`http://localhost:8080/api/billing${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return NextResponse.json({ error: "Failed to fetch billing" }, { status: response.status });
  return NextResponse.json(await response.json());
}

export async function POST(request: NextRequest) {
  const token = getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const response = await fetch("http://localhost:8080/api/billing", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) return NextResponse.json(data, { status: response.status });
  return NextResponse.json(data);
}
