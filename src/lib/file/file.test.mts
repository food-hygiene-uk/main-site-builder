import { assert, assertEquals, assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import fc from "fast-check";
import { encodeName, forTestingOnly } from "./file.mts";

describe("encodeName", () => {
  it("keeps valid characters unchanged", () => {
    const input = "valid-filename-123";
    const expected = "valid-filename-123";
    const result = encodeName(input);
    assertEquals(result, expected);
  });

  it("handles empty string", () => {
    const input = "";
    const expected = "";
    const result = encodeName(input);
    assertEquals(result, expected);
  });

  it("replaces invalid characters with underscores", () => {
    const input = 'invalid<>:"/\\|?*\u0000-\u001Ffilename';
    const expected = "invalid------------filename";
    const result = encodeName(input);
    assertEquals(result, expected);
  });

  it("handles string with only invalid characters", () => {
    const input = '<>:"/\\|?*\u0000-\u001F';
    const expected = "------------";
    const result = encodeName(input);
    assertEquals(result, expected);
  });

  it("throws an error for reserved names", () => {
    const name = [...forTestingOnly.reservedNames][0];
    assertThrows(
      () => {
        encodeName(name);
      },
      Error,
      `Filename "${name}" is disallowed.`,
    );
  });

  it("throws an error for reserved names - Uppercase", () => {
    const name = [...forTestingOnly.reservedNames][0].toUpperCase();
    assertThrows(
      () => {
        encodeName(name);
      },
      Error,
      `Filename "${name.toLowerCase()}" is disallowed.`,
    );
  });

  describe("property-based tests", () => {
    // Arbitrary for generating strings that, when processed by encodeName,
    // will not result in a reserved name.
    const nonReservedStringArbitrary = fc.string().filter((s) => {
      try {
        const encoded = s.toLowerCase().replaceAll(/[^a-z0-9-]/g, "-"); // Mimic part of encodeName's logic for filtering
        return !forTestingOnly.reservedNames.has(encoded);
      } catch {
        // Should not happen with basic string arbitrary, but good practice
        return false;
      }
    });

    it("should produce valid filenames from various inputs (excluding reserved names)", () => {
      fc.assert(
        fc.property(nonReservedStringArbitrary, (inputString) => {
          const result = encodeName(inputString);

          // kebab-case
          assert(
            /^[a-z0-9-]*$/.test(result),
            `Result "${result}" contains invalid characters.`,
          );
        }),
        { numRuns: 100 }, // Configure fast-check runs
      );
    });
  });
});
