import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import fc from "fast-check";
import { sortEstablishments } from "./establishment.mjs";

/**
 * Creates a mock establishment object.
 *
 * @param {object} params - Parameters for the establishment
 * @param {string} params.businessName - The business name
 * @param {string} params.ratingValue - The rating value
 * @param {string} params.ratingDate - The rating date
 * @returns {object} A mock establishment object
 */
const createEstablishment = ({ businessName, ratingValue, ratingDate }) => {
  return {
    BusinessName: businessName,
    RatingValue: ratingValue,
    RatingDate: ratingDate,
  };
};

describe("sortEstablishments", () => {
  describe("when sortOption is empty or falsy", () => {
    it("should return the original array without sorting", () => {
      const establishments = [
        createEstablishment({
          businessName: "Zebra Cafe",
          ratingValue: "5",
          ratingDate: "2025-01-01",
        }),
        createEstablishment({
          businessName: "Apple Restaurant",
          ratingValue: "3",
          ratingDate: "2024-12-01",
        }),
      ];

      const result = sortEstablishments(establishments, "", true);
      assertEquals(result, establishments);
    });

    it("should return the original array when sortOption is null", () => {
      const establishments = [
        createEstablishment({
          businessName: "Test",
          ratingValue: "5",
          ratingDate: "2025-01-01",
        }),
      ];

      const result = sortEstablishments(establishments, null, true);
      assertEquals(result, establishments);
    });

    it("should return the original array when sortOption is undefined", () => {
      const establishments = [
        createEstablishment({
          businessName: "Test",
          ratingValue: "5",
          ratingDate: "2025-01-01",
        }),
      ];

      const result = sortEstablishments(establishments, undefined, true);
      assertEquals(result, establishments);
    });
  });

  describe("when sortOption is 'name'", () => {
    it("should sort establishments alphabetically by name in ascending order", () => {
      const establishments = [
        createEstablishment({
          businessName: "Zebra Cafe",
          ratingValue: "5",
          ratingDate: "2025-01-01",
        }),
        createEstablishment({
          businessName: "Apple Restaurant",
          ratingValue: "3",
          ratingDate: "2024-12-01",
        }),
        createEstablishment({
          businessName: "Burger Place",
          ratingValue: "4",
          ratingDate: "2024-11-01",
        }),
      ];

      const result = sortEstablishments(establishments, "name", true);

      assertEquals(result[0].BusinessName, "Apple Restaurant");
      assertEquals(result[1].BusinessName, "Burger Place");
      assertEquals(result[2].BusinessName, "Zebra Cafe");
    });

    it("should sort establishments alphabetically by name in descending order", () => {
      const establishments = [
        createEstablishment({
          businessName: "Apple Restaurant",
          ratingValue: "3",
          ratingDate: "2024-12-01",
        }),
        createEstablishment({
          businessName: "Zebra Cafe",
          ratingValue: "5",
          ratingDate: "2025-01-01",
        }),
        createEstablishment({
          businessName: "Burger Place",
          ratingValue: "4",
          ratingDate: "2024-11-01",
        }),
      ];

      const result = sortEstablishments(establishments, "name", false);

      assertEquals(result[0].BusinessName, "Zebra Cafe");
      assertEquals(result[1].BusinessName, "Burger Place");
      assertEquals(result[2].BusinessName, "Apple Restaurant");
    });

    it("should handle case-insensitive sorting", () => {
      const establishments = [
        createEstablishment({
          businessName: "zebra cafe",
          ratingValue: "5",
          ratingDate: "2025-01-01",
        }),
        createEstablishment({
          businessName: "Apple Restaurant",
          ratingValue: "3",
          ratingDate: "2024-12-01",
        }),
      ];

      const result = sortEstablishments(establishments, "name", true);

      assertEquals(result[0].BusinessName, "Apple Restaurant");
      assertEquals(result[1].BusinessName, "zebra cafe");
    });
  });

  describe("when sortOption is 'rating'", () => {
    it("should sort establishments by rating value in ascending order", () => {
      const establishments = [
        createEstablishment({
          businessName: "Five Star",
          ratingValue: "5",
          ratingDate: "2025-01-01",
        }),
        createEstablishment({
          businessName: "Three Star",
          ratingValue: "3",
          ratingDate: "2024-12-01",
        }),
        createEstablishment({
          businessName: "Four Star",
          ratingValue: "4",
          ratingDate: "2024-11-01",
        }),
      ];

      const result = sortEstablishments(establishments, "rating", true);

      assertEquals(result[0].RatingValue, "3");
      assertEquals(result[1].RatingValue, "4");
      assertEquals(result[2].RatingValue, "5");
    });

    it("should sort establishments by rating value in descending order", () => {
      const establishments = [
        createEstablishment({
          businessName: "Three Star",
          ratingValue: "3",
          ratingDate: "2024-12-01",
        }),
        createEstablishment({
          businessName: "Five Star",
          ratingValue: "5",
          ratingDate: "2025-01-01",
        }),
        createEstablishment({
          businessName: "Four Star",
          ratingValue: "4",
          ratingDate: "2024-11-01",
        }),
      ];

      const result = sortEstablishments(establishments, "rating", false);

      assertEquals(result[0].RatingValue, "5");
      assertEquals(result[1].RatingValue, "4");
      assertEquals(result[2].RatingValue, "3");
    });

    it("should use date as secondary sort when ratings are equal", () => {
      const establishments = [
        createEstablishment({
          businessName: "Restaurant A",
          ratingValue: "5",
          ratingDate: "2024-01-01",
        }),
        createEstablishment({
          businessName: "Restaurant B",
          ratingValue: "5",
          ratingDate: "2025-01-01",
        }),
        createEstablishment({
          businessName: "Restaurant C",
          ratingValue: "5",
          ratingDate: "2024-06-01",
        }),
      ];

      const resultAsc = sortEstablishments(establishments, "rating", true);
      const resultDesc = sortEstablishments(establishments, "rating", false);

      // When sorting ascending (true), dateComparison is used as-is, which is descending (most recent first)
      assertEquals(resultAsc[0].RatingDate, "2024-01-01");
      assertEquals(resultAsc[1].RatingDate, "2024-06-01");
      assertEquals(resultAsc[2].RatingDate, "2025-01-01");

      // When sorting descending (false), dateComparison is negated, becoming ascending (oldest first)
      assertEquals(resultDesc[0].RatingDate, "2025-01-01");
      assertEquals(resultDesc[1].RatingDate, "2024-06-01");
      assertEquals(resultDesc[2].RatingDate, "2024-01-01");
    });

    it("should use name as tertiary sort when ratings and dates are equal", () => {
      const establishments = [
        createEstablishment({
          businessName: "Zebra Restaurant",
          ratingValue: "5",
          ratingDate: "2025-01-01",
        }),
        createEstablishment({
          businessName: "Apple Restaurant",
          ratingValue: "5",
          ratingDate: "2025-01-01",
        }),
        createEstablishment({
          businessName: "Burger Restaurant",
          ratingValue: "5",
          ratingDate: "2025-01-01",
        }),
      ];

      const resultAsc = sortEstablishments(establishments, "rating", true);
      const resultDesc = sortEstablishments(establishments, "rating", false);

      // When sorting ascending, names should be alphabetical
      assertEquals(resultAsc[0].BusinessName, "Apple Restaurant");
      assertEquals(resultAsc[1].BusinessName, "Burger Restaurant");
      assertEquals(resultAsc[2].BusinessName, "Zebra Restaurant");

      // When sorting descending, names should be reverse alphabetical
      assertEquals(resultDesc[0].BusinessName, "Zebra Restaurant");
      assertEquals(resultDesc[1].BusinessName, "Burger Restaurant");
      assertEquals(resultDesc[2].BusinessName, "Apple Restaurant");
    });

    it("should handle missing rating values by treating them as -1", () => {
      const establishments = [
        createEstablishment({
          businessName: "Has Rating",
          ratingValue: "3",
          ratingDate: "2025-01-01",
        }),
        createEstablishment({
          businessName: "No Rating",
          ratingValue: null,
          ratingDate: "2025-01-01",
        }),
      ];

      const result = sortEstablishments(establishments, "rating", true);

      assertEquals(result[0].BusinessName, "No Rating");
      assertEquals(result[1].BusinessName, "Has Rating");
    });
  });

  describe("when sortOption is 'date'", () => {
    it("should sort establishments by date in ascending order (oldest first)", () => {
      const establishments = [
        createEstablishment({
          businessName: "Restaurant A",
          ratingValue: "5",
          ratingDate: "2025-01-01",
        }),
        createEstablishment({
          businessName: "Restaurant B",
          ratingValue: "3",
          ratingDate: "2024-01-01",
        }),
        createEstablishment({
          businessName: "Restaurant C",
          ratingValue: "4",
          ratingDate: "2024-06-01",
        }),
      ];

      const result = sortEstablishments(establishments, "date", true);

      assertEquals(result[0].RatingDate, "2024-01-01");
      assertEquals(result[1].RatingDate, "2024-06-01");
      assertEquals(result[2].RatingDate, "2025-01-01");
    });

    it("should sort establishments by date in descending order (newest first)", () => {
      const establishments = [
        createEstablishment({
          businessName: "Restaurant A",
          ratingValue: "5",
          ratingDate: "2024-01-01",
        }),
        createEstablishment({
          businessName: "Restaurant B",
          ratingValue: "3",
          ratingDate: "2025-01-01",
        }),
        createEstablishment({
          businessName: "Restaurant C",
          ratingValue: "4",
          ratingDate: "2024-06-01",
        }),
      ];

      const result = sortEstablishments(establishments, "date", false);

      assertEquals(result[0].RatingDate, "2025-01-01");
      assertEquals(result[1].RatingDate, "2024-06-01");
      assertEquals(result[2].RatingDate, "2024-01-01");
    });

    it("should use name as secondary sort when dates are equal", () => {
      const establishments = [
        createEstablishment({
          businessName: "Zebra Restaurant",
          ratingValue: "5",
          ratingDate: "2025-01-01",
        }),
        createEstablishment({
          businessName: "Apple Restaurant",
          ratingValue: "3",
          ratingDate: "2025-01-01",
        }),
        createEstablishment({
          businessName: "Burger Restaurant",
          ratingValue: "4",
          ratingDate: "2025-01-01",
        }),
      ];

      const result = sortEstablishments(establishments, "date", true);

      assertEquals(result[0].BusinessName, "Apple Restaurant");
      assertEquals(result[1].BusinessName, "Burger Restaurant");
      assertEquals(result[2].BusinessName, "Zebra Restaurant");
    });

    it("should handle missing dates by placing them last", () => {
      const establishments = [
        createEstablishment({
          businessName: "Has Date",
          ratingValue: "5",
          ratingDate: "2025-01-01",
        }),
        createEstablishment({
          businessName: "No Date",
          ratingValue: "3",
          ratingDate: null,
        }),
      ];

      const result = sortEstablishments(establishments, "date", true);

      assertEquals(result[0].BusinessName, "Has Date");
      assertEquals(result[1].BusinessName, "No Date");
    });
  });

  describe("when sortOption is unrecognized", () => {
    it("should return the array unchanged for unknown sort options", () => {
      const establishments = [
        createEstablishment({
          businessName: "Zebra Cafe",
          ratingValue: "5",
          ratingDate: "2025-01-01",
        }),
        createEstablishment({
          businessName: "Apple Restaurant",
          ratingValue: "3",
          ratingDate: "2024-12-01",
        }),
      ];

      const result = sortEstablishments(establishments, "unknown", true);

      assertEquals(result, establishments);
    });
  });

  describe("immutability", () => {
    it("should not mutate the original array", () => {
      const establishments = [
        createEstablishment({
          businessName: "Zebra Cafe",
          ratingValue: "5",
          ratingDate: "2025-01-01",
        }),
        createEstablishment({
          businessName: "Apple Restaurant",
          ratingValue: "3",
          ratingDate: "2024-12-01",
        }),
      ];

      const original = [...establishments];
      sortEstablishments(establishments, "name", true);

      assertEquals(establishments, original);
    });

    it("should return a new array instance", () => {
      const establishments = [
        createEstablishment({
          businessName: "Test",
          ratingValue: "5",
          ratingDate: "2025-01-01",
        }),
      ];

      const result = sortEstablishments(establishments, "name", true);

      // Check that it's a different array reference
      assertEquals(result === establishments, false);
    });
  });

  describe("property-based tests", () => {
    const propertyTestOptions = { numRuns: 100 };

    const establishmentArbitrary = fc.record({
      BusinessName: fc.string({ minLength: 1, maxLength: 50 }),
      RatingValue: fc.oneof(
        fc.constant(null),
        fc.integer({ min: 0, max: 5 }).map(String),
        fc.constant("AwaitingInspection"),
        fc.constant("Exempt"),
      ),
      RatingDate: fc.oneof(
        fc.constant(null),
        fc
          .date({ min: new Date("2020-01-01"), max: new Date("2025-12-31") })
          .filter((d) => !Number.isNaN(d.getTime()))
          .map((d) => d.toISOString().split("T")[0]),
      ),
    });

    it("should always return an array of the same length", () => {
      fc.assert(
        fc.property(
          fc.array(establishmentArbitrary, { minLength: 0, maxLength: 20 }),
          fc.constantFrom("name", "rating", "date"),
          fc.boolean(),
          (establishments, sortOption, sortDirection) => {
            const result = sortEstablishments(
              establishments,
              sortOption,
              sortDirection,
            );
            assertEquals(result.length, establishments.length);
          },
        ),
        propertyTestOptions,
      );
    });

    it("should preserve all establishments (no loss or duplication)", () => {
      fc.assert(
        fc.property(
          fc.array(establishmentArbitrary, { minLength: 1, maxLength: 20 }),
          fc.constantFrom("name", "rating", "date"),
          fc.boolean(),
          (establishments, sortOption, sortDirection) => {
            const result = sortEstablishments(
              establishments,
              sortOption,
              sortDirection,
            );

            const originalNames = establishments
              .map((establishment) => establishment.BusinessName)
              .toSorted();
            const resultNames = result
              .map((establishment) => establishment.BusinessName)
              .toSorted();

            assertEquals(resultNames, originalNames);
          },
        ),
        propertyTestOptions,
      );
    });

    it("should not mutate the original array", () => {
      fc.assert(
        fc.property(
          fc.array(establishmentArbitrary, { minLength: 1, maxLength: 20 }),
          fc.constantFrom("name", "rating", "date"),
          fc.boolean(),
          (establishments, sortOption, sortDirection) => {
            const originalCopy = structuredClone(establishments);
            sortEstablishments(establishments, sortOption, sortDirection);
            assertEquals(establishments, originalCopy);
          },
        ),
        propertyTestOptions,
      );
    });

    it("should maintain sort stability when sorting by name ascending", () => {
      fc.assert(
        fc.property(
          fc.array(establishmentArbitrary, { minLength: 2, maxLength: 10 }),
          (establishments) => {
            const result = sortEstablishments(establishments, "name", true);

            for (let index = 1; index < result.length; index++) {
              const current = result[index].BusinessName;
              const previous = result[index - 1].BusinessName;
              const comparison = current.localeCompare(previous);

              assertEquals(comparison >= 0, true);
            }
          },
        ),
        propertyTestOptions,
      );
    });

    it("should maintain sort stability when sorting by name descending", () => {
      fc.assert(
        fc.property(
          fc.array(establishmentArbitrary, { minLength: 2, maxLength: 10 }),
          (establishments) => {
            const result = sortEstablishments(establishments, "name", false);

            for (let index = 1; index < result.length; index++) {
              const current = result[index].BusinessName;
              const previous = result[index - 1].BusinessName;
              const comparison = current.localeCompare(previous);

              assertEquals(comparison <= 0, true);
            }
          },
        ),
        propertyTestOptions,
      );
    });

    it("should handle empty arrays", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("name", "rating", "date"),
          fc.boolean(),
          (sortOption, sortDirection) => {
            const result = sortEstablishments([], sortOption, sortDirection);
            assertEquals(result.length, 0);
          },
        ),
        propertyTestOptions,
      );
    });

    it("should handle single element arrays", () => {
      fc.assert(
        fc.property(
          establishmentArbitrary,
          fc.constantFrom("name", "rating", "date"),
          fc.boolean(),
          (establishment, sortOption, sortDirection) => {
            const result = sortEstablishments(
              [establishment],
              sortOption,
              sortDirection,
            );
            assertEquals(result.length, 1);
            assertEquals(result[0], establishment);
          },
        ),
        propertyTestOptions,
      );
    });

    it("should produce consistent results for the same input", () => {
      fc.assert(
        fc.property(
          fc.array(establishmentArbitrary, { minLength: 2, maxLength: 10 }),
          fc.constantFrom("name", "rating", "date"),
          fc.boolean(),
          (establishments, sortOption, sortDirection) => {
            const result1 = sortEstablishments(
              establishments,
              sortOption,
              sortDirection,
            );
            const result2 = sortEstablishments(
              establishments,
              sortOption,
              sortDirection,
            );

            assertEquals(result1, result2);
          },
        ),
        propertyTestOptions,
      );
    });

    it("should reverse the order when toggling sortDirection for name sort with unique names", () => {
      fc.assert(
        fc.property(
          fc
            .array(establishmentArbitrary, { minLength: 2, maxLength: 10 })
            .filter((establishments) => {
              // Only test with unique business names for proper reversal test
              const names = establishments.map(
                (establishment) => establishment.BusinessName,
              );
              return new Set(names).size === names.length;
            }),
          (establishments) => {
            const ascResult = sortEstablishments(establishments, "name", true);
            const descResult = sortEstablishments(
              establishments,
              "name",
              false,
            );

            assertEquals(ascResult.toReversed(), descResult);
          },
        ),
        propertyTestOptions,
      );
    });
  });
});
