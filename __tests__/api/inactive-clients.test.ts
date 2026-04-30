jest.mock("next/headers", () => ({ cookies: jest.fn() }));

import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/inactive-clients/route";
import { GET as getDueRecontact } from "@/app/api/inactive-clients/due-recontact/route";
import { GET as getById } from "@/app/api/inactive-clients/[id]/route";
import { POST as deactivate } from "@/app/api/inactive-clients/[id]/deactivate/route";
import { POST as reactivate } from "@/app/api/inactive-clients/[id]/reactivate/route";
import { PATCH as updateRecontactStatus } from "@/app/api/inactive-clients/[id]/recontact-status/route";

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

// ─── GET /api/inactive-clients ────────────────────────────────────────────────

describe("GET /api/inactive-clients", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    expect((await GET()).status).toBe(401);
  });

  it("returns inactive clients from backend", async () => {
    const list = [{ id: 1, personName: "Ana", recontactStatus: "PENDING" }];
    ok(list);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(list);
  });

  it("propagates backend error", async () => {
    fail(500);
    expect((await GET()).status).toBe(500);
  });
});

// ─── GET /api/inactive-clients/due-recontact ─────────────────────────────────

describe("GET /api/inactive-clients/due-recontact", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    expect((await getDueRecontact()).status).toBe(401);
  });

  it("returns clients due for recontact", async () => {
    const list = [{ id: 2, personName: "Carlos" }];
    ok(list);
    const res = await getDueRecontact();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(list);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/inactive-clients/due-recontact",
      expect.anything(),
    );
  });
});

// ─── GET /api/inactive-clients/[id] ──────────────────────────────────────────

describe("GET /api/inactive-clients/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const req = new NextRequest("http://localhost/api/inactive-clients/1");
    expect((await getById(req, { params: { id: "1" } })).status).toBe(401);
  });

  it("returns a single inactive client", async () => {
    const client = { id: 1, personName: "Ana" };
    ok(client);
    const req = new NextRequest("http://localhost/api/inactive-clients/1");
    const res = await getById(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(client);
  });

  it("propagates 404", async () => {
    fail(404);
    const req = new NextRequest("http://localhost/api/inactive-clients/99");
    expect((await getById(req, { params: { id: "99" } })).status).toBe(404);
  });
});

// ─── POST /api/inactive-clients/[id]/deactivate ───────────────────────────────

describe("POST /api/inactive-clients/[id]/deactivate", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const req = new NextRequest("http://localhost/api/inactive-clients/1/deactivate", {
      method: "POST",
      body: JSON.stringify({ exitDate: "2024-06-01" }),
      headers: { "Content-Type": "application/json" },
    });
    expect((await deactivate(req, { params: { id: "1" } })).status).toBe(401);
  });

  it("deactivates client with given exit data", async () => {
    const body = { exitDate: "2024-06-01", exitReason: "Moved abroad" };
    ok({ id: 1, ...body });
    const req = new NextRequest("http://localhost/api/inactive-clients/1/deactivate", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const res = await deactivate(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/inactive-clients/1/deactivate",
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) }),
    );
  });
});

// ─── POST /api/inactive-clients/[id]/reactivate ───────────────────────────────

describe("POST /api/inactive-clients/[id]/reactivate", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const req = new NextRequest("http://localhost/api/inactive-clients/1/reactivate", { method: "POST" });
    expect((await reactivate(req, { params: { id: "1" } })).status).toBe(401);
  });

  it("reactivates the client", async () => {
    ok({ id: 1, status: "active" });
    const req = new NextRequest("http://localhost/api/inactive-clients/1/reactivate", { method: "POST" });
    const res = await reactivate(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/inactive-clients/1/reactivate",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// ─── PATCH /api/inactive-clients/[id]/recontact-status ───────────────────────

describe("PATCH /api/inactive-clients/[id]/recontact-status", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const req = new NextRequest("http://localhost/api/inactive-clients/1/recontact-status", {
      method: "PATCH",
      body: JSON.stringify({ recontactStatus: "CONTACTED" }),
      headers: { "Content-Type": "application/json" },
    });
    expect((await updateRecontactStatus(req, { params: { id: "1" } })).status).toBe(401);
  });

  it("updates recontact status", async () => {
    ok({ id: 1, recontactStatus: "CONTACTED" });
    const req = new NextRequest("http://localhost/api/inactive-clients/1/recontact-status", {
      method: "PATCH",
      body: JSON.stringify({ recontactStatus: "CONTACTED" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await updateRecontactStatus(req, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/inactive-clients/1/recontact-status",
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});
