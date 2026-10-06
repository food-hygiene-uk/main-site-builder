import { assertEquals, assertInstanceOf } from "@std/assert";
import { describe, it } from "node:test";

const globalObject = globalThis as Record<string, unknown>;

// Polyfill minimal browser globals for Deno test environment
if (globalObject.document === undefined) {
  globalObject.HTMLElement = class HTMLElement {
    dataset = {};
    attachShadow() {
      return {
        replaceChildren: () => {},
        append: () => {},
      };
    }
    setAttribute() {}
  };
  globalObject.customElements = {
    get: () => {},
    define: () => {},
  };
  globalObject.document = {
    createElement: () => ({
      rel: "",
      href: "",
      addEventListener: (
        _event: string,
        callback: (value?: unknown) => void,
      ) => {
        callback();
      },
    }),
    head: {
      append: () => {},
    },
  };
}

const {
  EstablishmentCard,
  formatDate,
  formatRelativeTime,
  renderEstablishmentCard,
  slugify,
} = await import("./establishment-card.mjs");

describe("EstablishmentCard Web Component", () => {
  it("should define EstablishmentCard class", () => {
    const card = new EstablishmentCard();
    assertInstanceOf(card, EstablishmentCard);
  });

  it("should set and get establishment property", () => {
    const card = new EstablishmentCard();
    const mockEstablishment = {
      FHRSID: 12_345,
      BusinessName: "Test Cafe",
      BusinessType: "Restaurant/Cafe",
      RatingValue: "5",
      RatingDate: "2024-01-01",
      LocalAuthorityCode: "216",
    };

    card.establishment = mockEstablishment;
    assertEquals(card.establishment, mockEstablishment);
  });

  it("should return an EstablishmentCard instance from renderEstablishmentCard", async () => {
    const mockEstablishment = {
      FHRSID: 99_999,
      BusinessName: "Quick Bites",
      BusinessType: "Takeaway",
      RatingValue: "4",
      RatingDate: "2023-05-15",
      LocalAuthorityCode: "216",
    };

    const card = await renderEstablishmentCard(mockEstablishment);
    assertInstanceOf(card, EstablishmentCard);
    assertEquals(card.establishment, mockEstablishment);
  });
});

describe("Utility functions", () => {
  describe("slugify", () => {
    it("should convert names to url-friendly slugs", () => {
      assertEquals(slugify("Costa Coffee & Tea"), "costa-coffee-tea");
      assertEquals(slugify("McDonald's"), "mcdonalds");
      assertEquals(slugify("  Spaced  Out  "), "spaced-out");
    });
  });

  describe("formatDate", () => {
    it("should format valid ISO date strings", () => {
      const formatted = formatDate("2023-05-15");
      assertEquals(formatted.includes("2023"), true);
      assertEquals(formatted.includes("May"), true);
    });

    it("should return 'Not available' for empty date strings", () => {
      assertEquals(formatDate(""), "Not available");
    });
  });

  describe("formatRelativeTime", () => {
    it("should format recent dates", () => {
      const now = new Date().toISOString();
      assertEquals(formatRelativeTime(now), "just now");
    });

    it("should format dates from days ago", () => {
      const threeDaysAgo = new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000,
      ).toISOString();
      assertEquals(formatRelativeTime(threeDaysAgo), "3 days ago");
    });
  });
});
