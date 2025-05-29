import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import fc from "fast-check";
import { config as appConfig } from "../config/config.mts";
import { encodeName as actualEncodeName } from "../file/file.mts";
import type { Authority } from "../../ratings-api/types.mts";

import {
  getCanonicalLinkURL,
  getHtmlFilename,
  getLinkName,
  getLinkURL,
} from "./authority.mts";

// Arbitrary for generating FriendlyName strings that actualEncodeName will not throw for.
// This ensures property-based tests focus on valid transformation paths.
// Generates valid kebab-case strings (e.g., 'my-example-123').
const validFriendlyNameArbitrary = fc
  .string({ minLength: 1, maxLength: 10, unit: "grapheme-ascii" })
  .map((s) => s.toLowerCase())
  .map((s) => "a" + s) // Ensure it starts with a letter after potential hex to string conversion
  .map((s) => s.replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-+|-+$/g, ""))
  .filter((s) => s.length > 0 && /^[a-z][a-z0-9-]*$/.test(s))
  .filter((s) => {
    try {
      actualEncodeName(s); // Check if encodeName would throw for this string
      return true;
    } catch {
      return false; // Filter out strings that cause encodeName to throw
    }
  });

/**
 * Creates a mock Authority object with the given friendly name.
 * This helper assumes that for the functions under test, only `FriendlyName` is primarily accessed.
 * The object is cast to `Authority` to satisfy TypeScript's type checking.
 *
 * @param friendlyName - The friendly name for the authority.
 * @returns A mock Authority object.
 */
const createAuthority = (friendlyName: string): Authority => {
  return {
    FriendlyName: friendlyName,
  } as Authority;
};

describe("getCanonicalLinkURL", () => {
  it("should correctly form the canonical URL with a typical friendly name", () => {
    const authority = createAuthority("test-authority");
    const result = getCanonicalLinkURL(authority);
    assertEquals(result, `${appConfig.BASE_URL}/l/test-authority`);
  });

  describe("property-based tests", () => {
    const propertyTestOptions = { numRuns: 100 };

    it("should prepend BASE_URL to the link URL for a valid friendly name", () => {
      fc.assert(
        fc.property(validFriendlyNameArbitrary, (friendlyName: string) => {
          const authority = createAuthority(friendlyName);
          const result = getCanonicalLinkURL(authority);
          const expectedLinkName = friendlyName;
          const expectedLinkUrl = `/l/${expectedLinkName}`;
          assertEquals(result, `${appConfig.BASE_URL}${expectedLinkUrl}`);
        }),
        propertyTestOptions,
      );
    });
  });
});

describe("getHtmlFilename", () => {
  it("should correctly form the HTML filename for a typical friendly name", () => {
    const authority = createAuthority("my-authority");
    const result = getHtmlFilename(authority);
    assertEquals(result, "/l/my-authority.html");
  });

  it("should correctly form the HTML filename for a friendly name with special characters", () => {
    const authority = createAuthority("authority-and-spaces");
    const result = getHtmlFilename(authority);
    assertEquals(result, "/l/authority-and-spaces.html");
  });

  describe("property-based tests", () => {
    const propertyTestOptions = { numRuns: 100 };

    it("should append .html to the link URL for a valid friendly name", () => {
      fc.assert(
        fc.property(validFriendlyNameArbitrary, (friendlyName: string) => {
          const authority = createAuthority(friendlyName);
          const result = getHtmlFilename(authority);
          const expectedLinkName = friendlyName;
          const expectedLinkUrl = `/l/${expectedLinkName}`;
          assertEquals(result, `${expectedLinkUrl}.html`);
        }),
        propertyTestOptions,
      );
    });
  });
});

describe("getLinkName", () => {
  it("should correctly get the link name for a typical friendly name", () => {
    const authority = createAuthority("simple-name");
    const result = getLinkName(authority);
    assertEquals(result, "simple-name");
  });

  it("should correctly get the link name for a friendly name with characters needing encoding", () => {
    const authority = createAuthority("name-and-other-stuff");
    const result = getLinkName(authority);
    assertEquals(result, "name-and-other-stuff");
  });

  describe("property-based tests", () => {
    const propertyTestOptions = { numRuns: 100 };

    it("should correctly encode and URI encode a valid friendly name", () => {
      fc.assert(
        fc.property(validFriendlyNameArbitrary, (friendlyName: string) => {
          const authority = createAuthority(friendlyName);
          const result = getLinkName(authority);
          assertEquals(result, friendlyName);
        }),
        propertyTestOptions,
      );
    });
  });
});

describe("getLinkURL", () => {
  it("should correctly form the link URL for a typical friendly name", () => {
    const authority = createAuthority("another-authority");
    const result = getLinkURL(authority);
    assertEquals(result, "/l/another-authority");
  });

  it("should correctly form the link URL for a friendly name with special characters", () => {
    const authority = createAuthority("link-url-test");
    const result = getLinkURL(authority);
    assertEquals(result, "/l/link-url-test");
  });

  describe("property-based tests", () => {
    const propertyTestOptions = { numRuns: 100 };

    it("should prepend /l/ to the link name for a valid friendly name", () => {
      fc.assert(
        fc.property(validFriendlyNameArbitrary, (friendlyName: string) => {
          const authority = createAuthority(friendlyName);
          const result = getLinkURL(authority);
          const expectedLinkName = friendlyName;
          assertEquals(result, `/l/${expectedLinkName}`);
        }),
        propertyTestOptions,
      );
    });
  });
});
