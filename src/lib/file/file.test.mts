import { assertEquals, assertThrows } from "@std/assert";
import { encodeName } from "./file.mts";

Deno.test("encodeName keeps valid characters unchanged", () => {
  const input = "valid-filename-123";
  const expected = "valid-filename-123";
  const result = encodeName(input);
  assertEquals(result, expected);
});

Deno.test("encodeName handles empty string", () => {
  const input = "";
  const expected = "";
  const result = encodeName(input);
  assertEquals(result, expected);
});

Deno.test("encodeName replaces invalid characters with underscores", () => {
  const input = 'invalid<>:"/\\|?*\u0000-\u001Ffilename';
  const expected = "invalid------------filename";
  const result = encodeName(input);
  assertEquals(result, expected);
});

Deno.test("encodeName handles string with only invalid characters", () => {
  const input = '<>:"/\\|?*\u0000-\u001F';
  const expected = "------------";
  const result = encodeName(input);
  assertEquals(result, expected);
});

Deno.test("encodeName throws an error for reserved names", () => {
  const name = "com5";
  assertThrows(
    () => {
      encodeName(name);
    },
    Error,
    `Filename "${name}" is disallowed.`,
  );
});

Deno.test("encodeName throws an error for reserved names - Uppercase", () => {
  const name = "COM5";
  assertThrows(
    () => {
      encodeName(name);
    },
    Error,
    `Filename "${name.toLowerCase()}" is disallowed.`,
  );
});
