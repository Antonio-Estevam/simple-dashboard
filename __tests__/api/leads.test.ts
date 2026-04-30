jest.mock("next/headers", () => ({ cookies: jest.fn() }));

import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/leads/route";
import { PUT, DELETE } from "@/app/api/leads/[id]/route";
import { GET as getDueToday } from "@/app/api/leads/due-today/route";

const mockCookies = cookies as jest.Mock;
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

const TOKEN = "test-token";

function withToken() {
  mockCookies.mockReturnValue({ get: jest.fn().mockReturnValue({ value: TOKEN }) });
}
function noToken() {
  mockCookies.mockReturnValueOnce({ get: jest.fn().mockReturnValue(undefined) });
}
function ok(data: unknown) {
  mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => data } as Response);
}
function fail(status: number) {
  mockFetch.mockResolvedValueOnce({ ok: false, status, json: async () => ({ error: "err" }) } as Response);
}

beforeEach(() => {
  withToken();
  mockFetch.mockReset();
});

// ─── GET /api/leads ───────────────────────────────────────────────────────────

describe("GET /api/leads", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const res = await GET(new NextRequest("http://localhost/api/leads"));
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: "Unauthorized" });
  });

  it("returns leads from backend", async () => {
    const leads = [{ id: 1, personName: "Ana" }];
    ok(leads);
    const res = await GET(new NextRequest("http://localhost/api/leads"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(leads);
  });

  it("forwards the Authorization header", async () => {
    ok([]);
    await GET(new NextRequest("http://localhost/api/leads"));
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/leads",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }) }),
    );
  });

  it("forwards the ?status query param", async () => {
    ok([]);
    await GET(new NextRequest("http://localhost/api/leads?status=CONTACTED"));
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/leads?status=CONTACTED",
      expect.anything(),
    );
  });

  it("propagates backend error status", async () => {
    fail(503);
    const res = await GET(new NextRequest("http://localhost/api/leads"));
    expect(res.status).toBe(503);
  });
});

// ─── POST /api/leads ──────────────────────────────────────────────────────────

describe("POST /api/leads", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const req = new NextRequest("http://localhost/api/leads", {
      method: "POST",
      body: JSON.stringify({ personName: "João" }),
      headers: { "Content-Type": "application/json" },
    });
    expect((await POST(req)).status).toBe(401);
  });

  it("creates a lead and returns the created record", async () => {
    const created = { id: 5, personName: "João", status: "NEW" };
    ok(created);
    const req = new NextRequest("http://localhost/api/leads", {
      method: "POST",
      body: JSON.stringify({ personName: "João" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(created);
  });

  it("forwards the request body to the backend", async () => {
    ok({ id: 1 });
    const body = { personName: "Maria", whatsapp: "351910000000" };
    const req = new NextRequest("http://localhost/api/leads", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    await POST(req);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/leads",
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) }),
    );
  });
});

// ─── PUT /api/leads/[id] ─────────────────────────────────────────────────────

describe("PUT /api/leads/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const req = new NextRequest("http://localhost/api/leads/1", {
      method: "PUT",
      body: JSON.stringify({ status: "CONTACTED" }),
      headers: { "Content-Type": "application/json" },
    });
    expect((await PUT(req, { params: { id: "1" } })).status).toBe(401);
  });

  it("updates lead and returns updated record", async () => {
    const updated = { id: 1, status: "CONTACTED" };
    ok(updated);
    const req = new NextRequest("http://localhost/api/leads/1", {
      method: "PUT",
      body: JSON.stringify({ status: "CONTACTED" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PUT(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(updated);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/leads/1",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("propagates 404 when lead not found", async () => {
    fail(404);
    const req = new NextRequest("http://localhost/api/leads/99", {
      method: "PUT",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    expect((await PUT(req, { params: { id: "99" } })).status).toBe(404);
  });
});

// ─── DELETE /api/leads/[id] ──────────────────────────────────────────────────

describe("DELETE /api/leads/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const req = new NextRequest("http://localhost/api/leads/1", { method: "DELETE" });
    expect((await DELETE(req, { params: { id: "1" } })).status).toBe(401);
  });

  it("deletes lead and returns success", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) } as Response);
    const req = new NextRequest("http://localhost/api/leads/1", { method: "DELETE" });
    const res = await DELETE(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/leads/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── GET /api/leads/due-today ─────────────────────────────────────────────────

describe("GET /api/leads/due-today", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    expect((await getDueToday()).status).toBe(401);
  });

  it("returns leads due today", async () => {
    const leads = [{ id: 2, personName: "Carlos" }];
    ok(leads);
    const res = await getDueToday();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(leads);
  });
});
