// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookieStore),
}));

import { createSession, getSession, deleteSession, verifySession } from "@/lib/auth";
import { NextRequest } from "next/server";

beforeEach(() => {
  vi.clearAllMocks();
});

test("createSession sets an httpOnly cookie with a JWT", async () => {
  await createSession("user-1", "user@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  const [name, token, options] = mockCookieStore.set.mock.calls[0];
  expect(name).toBe("auth-token");
  expect(typeof token).toBe("string");
  expect(token.split(".")).toHaveLength(3); // valid JWT structure
  expect(options.httpOnly).toBe(true);
  expect(options.expires).toBeInstanceOf(Date);
});

test("createSession sets expiry ~7 days in the future", async () => {
  const before = Date.now();
  await createSession("user-1", "user@example.com");
  const after = Date.now();

  const expires: Date = mockCookieStore.set.mock.calls[0][2].expires;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("getSession returns null when no cookie is present", async () => {
  mockCookieStore.get.mockReturnValue(undefined);

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for an invalid token", async () => {
  mockCookieStore.get.mockReturnValue({ value: "not.a.valid.jwt" });

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns session payload for a valid token", async () => {
  await createSession("user-42", "hello@example.com");
  const token: string = mockCookieStore.set.mock.calls[0][1];

  vi.clearAllMocks();
  mockCookieStore.get.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session).not.toBeNull();
  expect(session?.userId).toBe("user-42");
  expect(session?.email).toBe("hello@example.com");
});

test("deleteSession removes the auth-token cookie", async () => {
  await deleteSession();

  expect(mockCookieStore.delete).toHaveBeenCalledOnce();
  expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
});

test("verifySession returns null when request has no auth cookie", async () => {
  const req = new NextRequest("http://localhost/");
  const session = await verifySession(req);
  expect(session).toBeNull();
});

test("verifySession returns null for an invalid token in the request", async () => {
  const req = new NextRequest("http://localhost/", {
    headers: { cookie: "auth-token=bad.token.here" },
  });
  const session = await verifySession(req);
  expect(session).toBeNull();
});

test("verifySession returns session payload for a valid token in the request", async () => {
  await createSession("user-99", "verified@example.com");
  const token: string = mockCookieStore.set.mock.calls[0][1];

  const req = new NextRequest("http://localhost/", {
    headers: { cookie: `auth-token=${token}` },
  });
  const session = await verifySession(req);
  expect(session).not.toBeNull();
  expect(session?.userId).toBe("user-99");
  expect(session?.email).toBe("verified@example.com");
});
