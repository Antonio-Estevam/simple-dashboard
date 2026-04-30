import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function getToken() {
  return cookies().get("user_session_coachingos_v0")?.value;
}

export async function GET(request: NextRequest) {
  const token = getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const name = request.nextUrl.searchParams.get("name") ?? "";
  const response = await fetch(
    `http://localhost:8080/api/clients/persons/search?name=${encodeURIComponent(name)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!response.ok) return NextResponse.json({ error: "Failed to search persons" }, { status: response.status });
  return NextResponse.json(await response.json());
}
