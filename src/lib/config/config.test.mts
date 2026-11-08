import { assertEquals, assertMatch } from "@std/assert";
import { describe, it } from "node:test";
import { config } from "./config.mts";

const BASE_URL_REGEX = /^https:\/\/[^/]+$/;

describe("BASE_URL", () => {
  const { BASE_URL } = config;

  it("should be a valid HTTPS URL without a trailing slash", () => {
    assertEquals(typeof BASE_URL, "string", "BASE_URL should be a string.");
    assertMatch(
      BASE_URL,
      BASE_URL_REGEX,
      `Expected BASE_URL ('${BASE_URL}') to be a valid HTTPS URL without a trailing slash.`,
    );
  });
});
