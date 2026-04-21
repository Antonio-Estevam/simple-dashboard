import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const token = (await cookies()).get("user_session_coachingos_v0")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch("http://localhost:8080/api/leads/due-today", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: response.status });
  }

  return NextResponse.json(await response.json());
}
