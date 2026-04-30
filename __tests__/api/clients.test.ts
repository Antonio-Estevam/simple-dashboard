jest.mock("next/headers", () => ({ cookies: jest.fn() }));

import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/clients/route";
import { GET as getById, PUT, DELETE } from "@/app/api/clients/[id]/route";
import { POST as convertPerson } from "@/app/api/clients/convert/[personId]/route";
import { GET as searchPersons } from "@/app/api/clients/persons/search/route";

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
function ok(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({ ok: true, status, json: async () => data } as Response);
}
function fail(status: number) {
  mockFetch.mockResolvedValueOnce({ ok: false, status, json: async () => ({ error: "err" }) } as Response);
}

beforeEach(() => {
  withToken();
  mockFetch.mockReset();
});

// ─── GET /api/clients ─────────────────────────────────────────────────────────

describe("GET /api/clients", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    expect((await GET()).status).toBe(401);
  });

  it("returns client list from backend", async () => {
    const clients = [{ id: 1, personName: "Ana", plan: "PREMIUM" }];
    ok(clients);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(clients);
  });

  it("forwards Authorization header", async () => {
    ok([]);
    await GET();
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/clients",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }) }),
    );
  });

  it("propagates backend error", async () => {
    fail(502);
    expect((await GET()).status).toBe(502);
  });
});

// ─── POST /api/clients ────────────────────────────────────────────────────────

describe("POST /api/clients", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const req = new NextRequest("http://localhost/api/clients", {
      method: "POST",
      body: JSON.stringify({ personName: "Carlos", plan: "BASIC" }),
      headers: { "Content-Type": "application/json" },
    });
    expect((await POST(req)).status).toBe(401);
  });

  it("creates a client and returns it", async () => {
    const created = { id: 10, personName: "Carlos", plan: "BASIC" };
    ok(created);
    const req = new NextRequest("http://localhost/api/clients", {
      method: "POST",
      body: JSON.stringify({ personName: "Carlos", plan: "BASIC" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(created);
  });

  it("forwards the full body to backend", async () => {
    ok({ id: 1 });
    const body = { personName: "Luís", plan: "PREMIUM", startDate: "2024-01-01" };
    const req = new NextRequest("http://localhost/api/clients", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    await POST(req);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/clients",
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) }),
    );
  });
});

// ─── GET /api/clients/[id] ────────────────────────────────────────────────────

describe("GET /api/clients/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const req = new NextRequest("http://localhost/api/clients/1");
    expect((await getById(req, { params: { id: "1" } })).status).toBe(401);
  });

  it("returns a single client", async () => {
    const client = { id: 1, personName: "Ana" };
    ok(client);
    const req = new NextRequest("http://localhost/api/clients/1");
    const res = await getById(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(client);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/clients/1",
      expect.anything(),
    );
  });

  it("propagates 404 when not found", async () => {
    fail(404);
    const req = new NextRequest("http://localhost/api/clients/99");
    expect((await getById(req, { params: { id: "99" } })).status).toBe(404);
  });
});

// ─── PUT /api/clients/[id] ────────────────────────────────────────────────────

describe("PUT /api/clients/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const req = new NextRequest("http://localhost/api/clients/1", {
      method: "PUT",
      body: JSON.stringify({ plan: "PREMIUM" }),
      headers: { "Content-Type": "application/json" },
    });
    expect((await PUT(req, { params: { id: "1" } })).status).toBe(401);
  });

  it("updates and returns the client", async () => {
    const updated = { id: 1, plan: "PREMIUM" };
    ok(updated);
    const req = new NextRequest("http://localhost/api/clients/1", {
      method: "PUT",
      body: JSON.stringify({ plan: "PREMIUM" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PUT(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(updated);
  });
});

// ─── DELETE /api/clients/[id] ─────────────────────────────────────────────────

describe("DELETE /api/clients/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const req = new NextRequest("http://localhost/api/clients/1", { method: "DELETE" });
    expect((await DELETE(req, { params: { id: "1" } })).status).toBe(401);
  });

  it("deletes and returns success", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) } as Response);
    const req = new NextRequest("http://localhost/api/clients/1", { method: "DELETE" });
    const res = await DELETE(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });
});

// ─── POST /api/clients/convert/[personId] ────────────────────────────────────

describe("POST /api/clients/convert/[personId]", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const req = new NextRequest("http://localhost/api/clients/convert/42", {
      method: "POST",
      body: JSON.stringify({ plan: "BASIC", startDate: "2024-01-01" }),
      headers: { "Content-Type": "application/json" },
    });
    expect((await convertPerson(req, { params: { personId: "42" } })).status).toBe(401);
  });

  it("converts person to client and returns the new client", async () => {
    const newClient = { id: 7, personId: 42, plan: "BASIC" };
    ok(newClient);
    const req = new NextRequest("http://localhost/api/clients/convert/42", {
      method: "POST",
      body: JSON.stringify({ plan: "BASIC", startDate: "2024-01-01" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await convertPerson(req, { params: { personId: "42" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(newClient);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/clients/convert/42",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// ─── GET /api/clients/persons/search ─────────────────────────────────────────

describe("GET /api/clients/persons/search", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const req = new NextRequest("http://localhost/api/clients/persons/search?name=Ana");
    expect((await searchPersons(req)).status).toBe(401);
  });

  it("searches persons by name and returns results", async () => {
    const persons = [{ id: 3, name: "Ana Paula" }];
    ok(persons);
    const req = new NextRequest("http://localhost/api/clients/persons/search?name=Ana");
    const res = await searchPersons(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(persons);
  });

  it("forwards the name param to the backend", async () => {
    ok([]);
    const req = new NextRequest("http://localhost/api/clients/persons/search?name=Maria");
    await searchPersons(req);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("name=Maria");
  });
});
