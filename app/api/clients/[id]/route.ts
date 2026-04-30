import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function getToken() {
  return cookies().get("user_session_coachingos_v0")?.value;
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const token = getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const response = await fetch(`http://localhost:8080/api/clients/${params.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return NextResponse.json({ error: "Client not found" }, { status: response.status });
  return NextResponse.json(await response.json());
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const token = getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const response = await fetch(`http://localhost:8080/api/clients/${params.id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) return NextResponse.json({ error: "Failed to update client" }, { status: response.status });
  return NextResponse.json(await response.json());
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const token = getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const response = await fetch(`http://localhost:8080/api/clients/${params.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return NextResponse.json({ error: "Failed to delete client" }, { status: response.status });
  return NextResponse.json({ success: true });
}
