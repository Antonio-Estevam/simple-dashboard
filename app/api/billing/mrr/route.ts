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
  if (sp.get("month")) params.set("month", sp.get("month")!);
  if (sp.get("year"))  params.set("year",  sp.get("year")!);

  const response = await fetch(`http://localhost:8080/api/billing/mrr?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return NextResponse.json({ error: "Failed to fetch MRR" }, { status: response.status });
  return NextResponse.json(await response.json());
}
