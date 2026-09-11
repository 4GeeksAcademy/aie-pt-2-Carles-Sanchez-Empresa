/**
 * Jest tests for API utilities (FE-019)
 *
 * Tests: buildQueryString
 * Coverage: happy path + failure/edge cases
 */

import { buildQueryString } from "../services/api";

describe("buildQueryString", () => {
  // ── Happy path ──────────────────────────────────────────

  test("builds query string with all params", () => {
    const qs = buildQueryString({
      status: "received",
      stage: "review",
      search: "John",
      page: 2,
      limit: 10,
    });
    expect(qs).toContain("status=received");
    expect(qs).toContain("stage=review");
    expect(qs).toContain("search=John");
    expect(qs).toContain("page=2");
    expect(qs).toContain("limit=10");
    expect(qs.startsWith("?")).toBe(true);
  });

  test("builds query string with only status", () => {
    const qs = buildQueryString({ status: "discarded" });
    expect(qs).toBe("?status=discarded");
  });

  test("builds query string with only search", () => {
    const qs = buildQueryString({ search: "Maria" });
    expect(qs).toBe("?search=Maria");
  });

  test("builds query string with only pagination", () => {
    const qs = buildQueryString({ page: 1, limit: 50 });
    expect(qs).toContain("page=1");
    expect(qs).toContain("limit=50");
    expect(qs.startsWith("?")).toBe(true);
  });

  // ── Failure / edge cases ────────────────────────────────

  test("returns empty string when no params provided", () => {
    expect(buildQueryString({})).toBe("");
  });

  test("returns empty string when all params are undefined", () => {
    expect(buildQueryString({
      status: undefined,
      stage: undefined,
      search: undefined,
      page: undefined,
      limit: undefined,
    })).toBe("");
  });

  test("encodes special characters in search", () => {
    const qs = buildQueryString({ search: "O'Brien & Son" });
    // URLSearchParams encodes differently: ' is NOT encoded, space → +, & → %26
    expect(qs).toContain("search=O%27Brien+%26+Son");
  });

  test("builds query string correctly with page=0 (edge case)", () => {
    const qs = buildQueryString({ page: 0 });
    expect(qs).toBe("?page=0");
  });
});