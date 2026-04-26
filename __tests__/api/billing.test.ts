jest.mock("next/headers", () => ({ cookies: jest.fn() }));

import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/billing/route";
import { GET as getById, PUT, DELETE } from "@/app/api/billing/[id]/route";
import { PATCH as markPaid } from "@/app/api/billing/[id]/pay/route";
import { PATCH as markOverdue } from "@/app/api/billing/[id]/overdue/route";
import { POST as batchGenerate } from "@/app/api/billing/batch/route";
import { GET as getMrr } from "@/app/api/billing/mrr/route";
import { GET as getMrrYearly } from "@/app/api/billing/mrr/yearly/route";
import { GET as getOverdue } from "@/app/api/billing/overdue/route";
import { GET as searchPersons } from "@/app/api/billing/persons/search/route";

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
function req(url: string, init?: RequestInit) {
  return new NextRequest(`http://localhost${url}`, init);
}

beforeEach(() => {
  withToken();
  mockFetch.mockReset();
});

// ─── GET /api/billing ─────────────────────────────────────────────────────────

describe("GET /api/billing", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    expect((await GET(req("/api/billing"))).status).toBe(401);
  });

  it("returns billing records from backend", async () => {
    const records = [{ id: 1, personName: "Ana", amount: 55 }];
    ok(records);
    const res = await GET(req("/api/billing?month=4&year=2025"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(records);
  });

  it("forwards month, year and status params", async () => {
    ok([]);
    await GET(req("/api/billing?month=3&year=2025&status=PAID"));
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("month=3");
    expect(url).toContain("year=2025");
    expect(url).toContain("status=PAID");
  });

  it("omits absent params from the upstream URL", async () => {
    ok([]);
    await GET(req("/api/billing?month=1&year=2025"));
    const [url] = mockFetch.mock.calls[0];
    expect(url).not.toContain("status=");
  });

  it("propagates backend error", async () => {
    fail(500);
    expect((await GET(req("/api/billing"))).status).toBe(500);
  });
});

// ─── POST /api/billing ────────────────────────────────────────────────────────

describe("POST /api/billing", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    expect((await POST(req("/api/billing", { method: "POST", body: "{}" }))).status).toBe(401);
  });

  it("creates a billing record and returns it", async () => {
    const created = { id: 10, personId: 3, amount: 55, currency: "EUR" };
    ok(created);
    const body = { personId: 3, month: 4, year: 2025, amount: 55, currency: "EUR" };
    const res = await POST(req("/api/billing", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(created);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/billing",
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) }),
    );
  });
});

// ─── GET /api/billing/[id] ────────────────────────────────────────────────────

describe("GET /api/billing/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    expect((await getById(req("/api/billing/1"), { params: { id: "1" } })).status).toBe(401);
  });

  it("returns a single billing record", async () => {
    const record = { id: 1, amount: 55 };
    ok(record);
    const res = await getById(req("/api/billing/1"), { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(record);
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:8080/api/billing/1", expect.anything());
  });
});

// ─── PUT /api/billing/[id] ────────────────────────────────────────────────────

describe("PUT /api/billing/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    expect((await PUT(req("/api/billing/1", { method: "PUT", body: "{}" }), { params: { id: "1" } })).status).toBe(401);
  });

  it("updates and returns the billing record", async () => {
    const updated = { id: 1, amount: 60 };
    ok(updated);
    const body = { amount: 60 };
    const res = await PUT(
      req("/api/billing/1", { method: "PUT", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
      { params: { id: "1" } },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(updated);
  });
});

// ─── DELETE /api/billing/[id] ─────────────────────────────────────────────────

describe("DELETE /api/billing/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    expect((await DELETE(req("/api/billing/1", { method: "DELETE" }), { params: { id: "1" } })).status).toBe(401);
  });

  it("deletes the record and returns success", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) } as Response);
    const res = await DELETE(req("/api/billing/1", { method: "DELETE" }), { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });
});

// ─── PATCH /api/billing/[id]/pay ─────────────────────────────────────────────

describe("PATCH /api/billing/[id]/pay", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const request = req("/api/billing/1/pay", { method: "PATCH", body: "{}" });
    expect((await markPaid(request, { params: { id: "1" } })).status).toBe(401);
  });

  it("marks billing as paid with paidAt and paymentMethod", async () => {
    ok({ id: 1, status: "PAID" });
    const body = { paidAt: "2025-04-15T00:00:00.000Z", paymentMethod: "MBWAY" };
    const request = req("/api/billing/1/pay", {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const res = await markPaid(request, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/billing/1/pay",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify(body) }),
    );
  });
});

// ─── PATCH /api/billing/[id]/overdue ─────────────────────────────────────────

describe("PATCH /api/billing/[id]/overdue", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    const request = req("/api/billing/1/overdue", { method: "PATCH" });
    expect((await markOverdue(request, { params: { id: "1" } })).status).toBe(401);
  });

  it("marks billing as overdue", async () => {
    ok({ id: 1, status: "OVERDUE" });
    const request = req("/api/billing/1/overdue", { method: "PATCH" });
    const res = await markOverdue(request, { params: { id: "1" } });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/billing/1/overdue",
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});

// ─── POST /api/billing/batch ──────────────────────────────────────────────────

describe("POST /api/billing/batch", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    expect((await batchGenerate(req("/api/billing/batch", { method: "POST", body: "{}" }))).status).toBe(401);
  });

  it("generates batch billing for all active clients", async () => {
    const result = { generated: 12, skipped: 2, records: [] };
    ok(result);
    const body = { month: 4, year: 2025, amount: 55, currency: "EUR" };
    const res = await batchGenerate(req("/api/billing/batch", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(result);
  });

  it("forwards personIds when provided", async () => {
    ok({ generated: 2, skipped: 0, records: [] });
    const body = { month: 4, year: 2025, amount: 55, currency: "EUR", personIds: [1, 2] };
    await batchGenerate(req("/api/billing/batch", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }));
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/billing/batch",
      expect.objectContaining({ body: JSON.stringify(body) }),
    );
  });
});

// ─── GET /api/billing/mrr ─────────────────────────────────────────────────────

describe("GET /api/billing/mrr", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    expect((await getMrr(req("/api/billing/mrr?month=4&year=2025"))).status).toBe(401);
  });

  it("returns MRR data for the given month/year", async () => {
    const mrr = { month: 4, year: 2025, totalClients: 8, totalEur: 440, totalBrl: 2640 };
    ok(mrr);
    const res = await getMrr(req("/api/billing/mrr?month=4&year=2025"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mrr);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("month=4");
    expect(url).toContain("year=2025");
  });
});

// ─── GET /api/billing/mrr/yearly ─────────────────────────────────────────────

describe("GET /api/billing/mrr/yearly", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    expect((await getMrrYearly(req("/api/billing/mrr/yearly?year=2025"))).status).toBe(401);
  });

  it("returns yearly MRR breakdown", async () => {
    const yearly = { year: 2025, totalEur: 5280, totalBrl: 31680, months: [] };
    ok(yearly);
    const res = await getMrrYearly(req("/api/billing/mrr/yearly?year=2025"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(yearly);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("year=2025");
  });
});

// ─── GET /api/billing/overdue ─────────────────────────────────────────────────

describe("GET /api/billing/overdue", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    expect((await getOverdue()).status).toBe(401);
  });

  it("returns all overdue billing records", async () => {
    const records = [{ id: 3, personName: "Carlos", status: "OVERDUE" }];
    ok(records);
    const res = await getOverdue();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(records);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/billing/overdue",
      expect.anything(),
    );
  });
});

// ─── GET /api/billing/persons/search ─────────────────────────────────────────

describe("GET /api/billing/persons/search", () => {
  it("returns 401 when unauthenticated", async () => {
    noToken();
    expect((await searchPersons(req("/api/billing/persons/search?name=Ana"))).status).toBe(401);
  });

  it("searches persons and returns results", async () => {
    const persons = [{ id: 2, name: "Ana Lima" }];
    ok(persons);
    const res = await searchPersons(req("/api/billing/persons/search?name=Ana"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(persons);
  });

  it("forwards the name param to backend", async () => {
    ok([]);
    await searchPersons(req("/api/billing/persons/search?name=Carlos"));
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("name=Carlos");
  });
});
