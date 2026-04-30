import { POST } from "@/app/api/auth/logout/route";

describe("POST /api/auth/logout", () => {
  it("returns success", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  it("clears the session cookie", async () => {
    const res = await POST();
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("user_session_coachingos_v0");
    expect(setCookie).toMatch(/Max-Age=0/i);
  });
});
