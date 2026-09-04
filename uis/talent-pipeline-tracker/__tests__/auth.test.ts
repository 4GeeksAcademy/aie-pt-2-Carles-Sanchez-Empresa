/**
 * Jest tests for auth utilities (FE-019)
 *
 * Tests: isExpiredJwt
 * Coverage: happy path + failure/edge cases
 */

import { isExpiredJwt } from "../services/auth";

// Helper: build a valid JWT with a given exp timestamp
function makeToken(exp: number): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub: "1", exp }));
  const signature = btoa("fakesignature");
  return `${header}.${payload}.${signature}`;
}

describe("isExpiredJwt", () => {
  // ── Happy path ──────────────────────────────────────────

  test("returns false for token expiring in the far future", () => {
    const farFuture = Math.floor(Date.now() / 1000) + 86_400; // +1 day
    expect(isExpiredJwt(makeToken(farFuture))).toBe(false);
  });

  test("returns false for token expiring in +1 hour", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    expect(isExpiredJwt(makeToken(future))).toBe(false);
  });

  // ── Failure / edge cases ────────────────────────────────

  test("returns true for empty string", () => {
    expect(isExpiredJwt("")).toBe(true);
  });

  test("returns true for malformed token (no dots)", () => {
    expect(isExpiredJwt("not-a-jwt")).toBe(true);
  });

  test("returns true for token with only 2 parts", () => {
    expect(isExpiredJwt("header.payload")).toBe(true);
  });

  test("returns true for already-expired token (exp in past)", () => {
    const past = Math.floor(Date.now() / 1000) - 3600; // -1 hour
    expect(isExpiredJwt(makeToken(past))).toBe(true);
  });

  test("returns true for token expiring exactly now", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(isExpiredJwt(makeToken(now))).toBe(true);
  });

  test("returns true when payload has no exp field", () => {
    const header = btoa(JSON.stringify({ alg: "HS256" }));
    const payload = btoa(JSON.stringify({ sub: "1" })); // no exp
    const signature = btoa("sig");
    expect(isExpiredJwt(`${header}.${payload}.${signature}`)).toBe(true);
  });

  test("returns true for completely invalid base64 payload", () => {
    expect(isExpiredJwt("header.%%%INVALID%%%.signature")).toBe(true);
  });

  test("returns true for null or undefined (type safety)", () => {
    // @ts-expect-error — testing runtime behaviour
    expect(isExpiredJwt(null)).toBe(true);
    // @ts-expect-error — testing runtime behaviour
    expect(isExpiredJwt(undefined)).toBe(true);
  });
});