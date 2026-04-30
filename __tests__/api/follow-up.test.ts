jest.mock("next/headers", () => ({ cookies: jest.fn() }));

import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/follow-up/route";
import { GET as getById, PUT, DELETE } from "@/app/api/follow-up/[id]/route";
import { PATCH as convertFollowUp } from "@/app/api/follow-up/[id]/convert/route";
import { PATCH as discardFollowUp } from "@/app/api/follow-up/[id]/discard/route";
import { GET as getDueToday } from "@/app/api/follow-up/due-today/route";

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

// ─── GET /api/follow-up ───────────────────────────────────────────────────────

describe("GET /api/follow-up", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    expect((await GET(new NextRequest("http://localhost/api/follow-up"))).status).toBe(401);
  });

  it("returns all follow-ups with no filter", async () => {
    const list = [{ id: 1, personName: "Ana", status: "WAITING" }];
    ok(list);
    const res = await GET(new NextRequest("http://localhost/api/follow-up"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(list);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/follow-up",
      expect.anything(),
    );
  });

  it("forwards ?status filter to backend", async () => {
    ok([]);
    await GET(new NextRequest("http://localhost/api/follow-up?status=IN_PROGRESS"));
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/follow-up?status=IN_PROGRESS",
      expect.anything(),
    );
  });

  it("forwards ?type filter to backend", async () => {
    ok([]);
    await GET(new NextRequest("http://localhost/api/follow-up?type=COLD_LEAD"));
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/follow-up?type=COLD_LEAD",
      expect.anything(),
    );
  });

  it("prioritises ?status over ?type when both are present", async () => {
    ok([]);
    await GET(new NextRequest("http://localhost/api/follow-up?status=WAITING&type=COLD_LEAD"));
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("status=WAITING");
    expect(url).not.toContain("type=");
  });

  it("propagates backend error", async () => {
    fail(500);
    expect((await GET(new NextRequest("http://localhost/api/follow-up"))).status).toBe(500);
  });
});

// ─── POST /api/follow-up ──────────────────────────────────────────────────────

describe("POST /api/follow-up", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const req = new NextRequest("http://localhost/api/follow-up", {
      method: "POST",
      body: JSON.stringify({ personName: "João", type: "COLD_LEAD" }),
      headers: { "Content-Type": "application/json" },
    });
    expect((await POST(req)).status).toBe(401);
  });

  it("creates a follow-up and returns it", async () => {
    const created = { id: 3, personName: "João", status: "WAITING" };
    ok(created);
    const req = new NextRequest("http://localhost/api/follow-up", {
      method: "POST",
      body: JSON.stringify({ personName: "João", type: "COLD_LEAD" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(created);
  });
});

// ─── GET /api/follow-up/[id] ──────────────────────────────────────────────────

describe("GET /api/follow-up/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const req = new NextRequest("http://localhost/api/follow-up/1");
    expect((await getById(req, { params: { id: "1" } })).status).toBe(401);
  });

  it("returns a single follow-up", async () => {
    const record = { id: 1, status: "IN_PROGRESS" };
    ok(record);
    const req = new NextRequest("http://localhost/api/follow-up/1");
    const res = await getById(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(record);
  });
});

// ─── PUT /api/follow-up/[id] ──────────────────────────────────────────────────

describe("PUT /api/follow-up/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const req = new NextRequest("http://localhost/api/follow-up/1", {
      method: "PUT",
      body: JSON.stringify({ notes: "Called once" }),
      headers: { "Content-Type": "application/json" },
    });
    expect((await PUT(req, { params: { id: "1" } })).status).toBe(401);
  });

  it("updates and returns the follow-up", async () => {
    const updated = { id: 1, notes: "Called once" };
    ok(updated);
    const req = new NextRequest("http://localhost/api/follow-up/1", {
      method: "PUT",
      body: JSON.stringify({ notes: "Called once" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PUT(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(updated);
  });
});

// ─── DELETE /api/follow-up/[id] ───────────────────────────────────────────────

describe("DELETE /api/follow-up/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const req = new NextRequest("http://localhost/api/follow-up/1", { method: "DELETE" });
    expect((await DELETE(req, { params: { id: "1" } })).status).toBe(401);
  });

  it("deletes and returns success", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) } as Response);
    const req = new NextRequest("http://localhost/api/follow-up/1", { method: "DELETE" });
    const res = await DELETE(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });
});

// ─── PATCH /api/follow-up/[id]/convert ───────────────────────────────────────

describe("PATCH /api/follow-up/[id]/convert", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const req = new NextRequest("http://localhost/api/follow-up/1/convert", { method: "PATCH" });
    expect((await convertFollowUp(req, { params: { id: "1" } })).status).toBe(401);
  });

  it("converts follow-up to active client", async () => {
    ok({ id: 1, status: "CONVERTED" });
    const req = new NextRequest("http://localhost/api/follow-up/1/convert", { method: "PATCH" });
    const res = await convertFollowUp(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/follow-up/1/convert",
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});

// ─── PATCH /api/follow-up/[id]/discard ───────────────────────────────────────

describe("PATCH /api/follow-up/[id]/discard", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const req = new NextRequest("http://localhost/api/follow-up/1/discard", { method: "PATCH" });
    expect((await discardFollowUp(req, { params: { id: "1" } })).status).toBe(401);
  });

  it("discards the follow-up", async () => {
    ok({ id: 1, status: "DISCARDED" });
    const req = new NextRequest("http://localhost/api/follow-up/1/discard", { method: "PATCH" });
    const res = await discardFollowUp(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/follow-up/1/discard",
      expect.anything(),
    );
  });
});

// ─── GET /api/follow-up/due-today ────────────────────────────────────────────

describe("GET /api/follow-up/due-today", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    expect((await getDueToday()).status).toBe(401);
  });

  it("returns follow-ups scheduled for today", async () => {
    const list = [{ id: 5, personName: "Maria" }];
    ok(list);
    const res = await getDueToday();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(list);
  });
});
