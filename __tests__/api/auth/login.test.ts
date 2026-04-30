import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/login/route";

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

beforeEach(() => mockFetch.mockReset());

describe("POST /api/auth/login", () => {
  it("sets session cookie and returns success on valid credentials", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ token: "jwt-abc" }),
    } as Response);

    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "user@test.com", password: "secret" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("user_session_coachingos_v0");
    expect(setCookie).toContain("jwt-abc");
  });

  it("forwards credentials to the backend", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok" }),
    } as Response);

    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "u@t.com", password: "pw" }),
      headers: { "Content-Type": "application/json" },
    });

    await POST(req);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "u@t.com", password: "pw" }),
      }),
    );
  });

  it("returns the backend error message on failed login", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: "Credenciais inválidas" }),
    } as Response);

    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "bad@test.com", password: "wrong" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
    expect((await res.json()).message).toBe("Credenciais inválidas");
  });

  it("falls back to a default error message when backend sends none", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "x", password: "y" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);

    expect(res.status).toBe(500);
    expect((await res.json()).message).toBe("Credenciais inválidas");
  });
});
