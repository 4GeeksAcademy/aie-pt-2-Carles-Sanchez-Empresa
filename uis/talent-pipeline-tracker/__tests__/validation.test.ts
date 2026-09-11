/**
 * Jest tests for validation utilities (FE-019)
 *
 * Tests: isValidPhone
 * Coverage: happy path + failure/edge cases
 */

import { isValidPhone } from "../lib/validation";

describe("isValidPhone", () => {
  // ── Happy path ──────────────────────────────────────────

  test("accepts Spanish mobile format: +34 600 000 000", () => {
    expect(isValidPhone("+34 600 000 000")).toBe(true);
  });

  test("accepts US format: +1 (234) 567-8900", () => {
    expect(isValidPhone("+1 (234) 567-8900")).toBe(true);
  });

  test("accepts plain digits: 600000000", () => {
    expect(isValidPhone("600000000")).toBe(true);
  });

  test("accepts exactly 7 digits (minimum)", () => {
    expect(isValidPhone("1234567")).toBe(true);
  });

  test("accepts exactly 15 digits (maximum)", () => {
    expect(isValidPhone("123456789012345")).toBe(true);
  });

  test("accepts international format with spaces: 44 20 7946 0958", () => {
    expect(isValidPhone("44 20 7946 0958")).toBe(true);
  });

  test("accepts phone with dashes: 555-1234", () => {
    expect(isValidPhone("555-1234")).toBe(true);
  });

  // ── Failure / edge cases ────────────────────────────────

  test("rejects empty string", () => {
    expect(isValidPhone("")).toBe(false);
  });

  test("rejects fewer than 7 digits: 123456", () => {
    expect(isValidPhone("123456")).toBe(false);
  });

  test("rejects more than 15 digits: 1234567890123456 (16 digits)", () => {
    expect(isValidPhone("1234567890123456")).toBe(false);
  });

  test("rejects string with no digits at all", () => {
    expect(isValidPhone("abc-def-ghij")).toBe(false);
  });

  test("rejects phone with only special characters and spaces", () => {
    expect(isValidPhone("  /- -()  ")).toBe(false);
  });

  test("rejects single-digit string", () => {
    expect(isValidPhone("1")).toBe(false);
  });
});