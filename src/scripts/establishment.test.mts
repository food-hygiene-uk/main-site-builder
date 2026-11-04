import { assertEquals } from "@std/assert";
import { describe, it } from "node:test";
import fc from "fast-check";
import { sortEstablishments } from "./establishment.mjs";
import { sort } from "../sort/sort.mts";
import type { Establishment } from "../generate-site/schema.mts";
import { establishmentArbitrary } from "../generate-site/fast-check-arbitrary.mts";

/**
Creates a mock establishment object.

@param params - Parameters for the establishment
@param params.businessName - The business name
@param params.ratingValue - The rating value
@param params.ratingDate - The rating date
@returns A mock establishment object
*/
const createEstablishment = ({
  businessName,
  ratingValue,
  ratingDate,
}: {
  businessName: Establishment["BusinessName"];
  ratingValue: Establishment["RatingValue"];
  ratingDate: Establishment["RatingDate"];
}): Establishment => {
  return {
    FHRSID: 1,
    BusinessName: businessName,
    RatingValue: ratingValue,
    RatingDate: ratingDate,
    BusinessType: "",
    LocalAuthorityBusinessID: "",
    BusinessTypeID: 7843,
    LocalAuthorityCode: "",
    LocalAuthorityName: "",
    LocalAuthorityWebSite: "",
    NewRatingPending: false,
    LocalAuthorityEmailAddress: "",
    Geocode: null,
    AddressLine1: undefined,
    AddressLine2: undefined,
    AddressLine3: undefined,
    AddressLine4: undefined,
    PostCode: undefined,
    SchemeType: "FHRS",
    RatingKey: "fhrs_5_cy-gb",
    Scores: {
      Hygiene: 0,
      Structural: 5,
      ConfidenceInManagement: 5,
    },
  };
};

describe("sortEstablishments", () => {
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

      const result = sortEstablishments(establishments, "name", "natural");

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

      const result = sortEstablishments(establishments, "name", "reverse");

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

      const result = sortEstablishments(establishments, "name", "natural");

      assertEquals(result[0].BusinessName, "Apple Restaurant");
      assertEquals(result[1].BusinessName, "zebra cafe");
    });
  });

  describe("when sortOption is 'rating'", () => {
    it("should sort establishments by rating value in NATURAL order (descending)", () => {
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

      const result = sortEstablishments(establishments, "rating", "natural");

      assertEquals(result[0].RatingValue, "5");
      assertEquals(result[1].RatingValue, "4");
      assertEquals(result[2].RatingValue, "3");
    });

    it("should sort establishments by rating value in REVERSE order (ascending)", () => {
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

      const result = sortEstablishments(establishments, "rating", "reverse");

      assertEquals(result[0].RatingValue, "3");
      assertEquals(result[1].RatingValue, "4");
      assertEquals(result[2].RatingValue, "5");
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

      const resultNatural = sortEstablishments(
        establishments,
        "rating",
        "natural",
      );
      const resultReverse = sortEstablishments(
        establishments,
        "rating",
        "reverse",
      );

      // With the natural direction, dateComparison is used as-is, which is descending (most recent first)
      assertEquals(resultNatural[0].RatingDate, "2025-01-01");
      assertEquals(resultNatural[1].RatingDate, "2024-06-01");
      assertEquals(resultNatural[2].RatingDate, "2024-01-01");

      // With the reverse direction, dateComparison is negated, becoming ascending (oldest first)
      assertEquals(resultReverse[0].RatingDate, "2024-01-01");
      assertEquals(resultReverse[1].RatingDate, "2024-06-01");
      assertEquals(resultReverse[2].RatingDate, "2025-01-01");
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

      const resultNatural = sortEstablishments(
        establishments,
        "rating",
        "natural",
      );
      const resultReverse = sortEstablishments(
        establishments,
        "rating",
        "reverse",
      );

      // When sorting ascending, names should be alphabetical
      assertEquals(resultNatural[0].BusinessName, "Apple Restaurant");
      assertEquals(resultNatural[1].BusinessName, "Burger Restaurant");
      assertEquals(resultNatural[2].BusinessName, "Zebra Restaurant");

      // When sorting descending, names should be reverse alphabetical
      assertEquals(resultReverse[0].BusinessName, "Zebra Restaurant");
      assertEquals(resultReverse[1].BusinessName, "Burger Restaurant");
      assertEquals(resultReverse[2].BusinessName, "Apple Restaurant");
    });
  });

  describe("when sortOption is 'date'", () => {
    it("should sort establishments by date in NATURAL order (descending)", () => {
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

      const result = sortEstablishments(establishments, "date", "natural");

      assertEquals(result[0].RatingDate, "2025-01-01");
      assertEquals(result[1].RatingDate, "2024-06-01");
      assertEquals(result[2].RatingDate, "2024-01-01");
    });

    it("should sort establishments by date in REVERSE order (ascending)", () => {
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

      const result = sortEstablishments(establishments, "date", "reverse");

      assertEquals(result[0].RatingDate, "2024-01-01");
      assertEquals(result[1].RatingDate, "2024-06-01");
      assertEquals(result[2].RatingDate, "2025-01-01");
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

      const result = sortEstablishments(establishments, "date", "natural");

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

      const result = sortEstablishments(establishments, "date", "natural");

      assertEquals(result[0].BusinessName, "Has Date");
      assertEquals(result[1].BusinessName, "No Date");
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
      sortEstablishments(establishments, "name", "natural");

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

      const result = sortEstablishments(establishments, "name", "natural");

      // Check that it's a different array reference
      assertEquals(result === establishments, false);
    });
  });

  describe("property-based tests", () => {
    const propertyTestOptions = { numRuns: 100 };

    it("should always return an array of the same length", () => {
      fc.assert(
        fc.property(
          fc.array(establishmentArbitrary, { minLength: 0, maxLength: 20 }),
          fc.constantFrom("name", "rating", "date"),
          fc.constantFrom("natural", "reverse"),
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
          fc.constantFrom("natural", "reverse"),
          (establishments, sortOption, sortDirection) => {
            const result = sortEstablishments(
              establishments,
              sortOption,
              sortDirection,
            );

            const originalNames = establishments
              .map((establishment) => establishment.BusinessName)
              .toSorted(sort.caseInsensitiveSort);
            const resultNames = result
              .map((establishment) => establishment.BusinessName)
              .toSorted(sort.caseInsensitiveSort);

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
          fc.constantFrom("natural", "reverse"),
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
            const result = sortEstablishments(
              establishments,
              "name",
              "natural",
            );

            for (let index = 1; index < result.length; index++) {
              const current = result[index].BusinessName;
              const previous = result[index - 1].BusinessName;
              const comparison = current.localeCompare(previous, undefined, {
                sensitivity: "base",
              });

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
            const result = sortEstablishments(
              establishments,
              "name",
              "reverse",
            );

            for (let index = 1; index < result.length; index++) {
              const current = result[index].BusinessName;
              const previous = result[index - 1].BusinessName;
              const comparison = current.localeCompare(previous, undefined, {
                sensitivity: "base",
              });

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
          fc.constantFrom("natural", "reverse"),
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
          fc.constantFrom("natural", "reverse"),
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
          fc.constantFrom("natural", "reverse"),
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
            const ascResult = sortEstablishments(
              establishments,
              "name",
              "natural",
            );
            const descResult = sortEstablishments(
              establishments,
              "name",
              "reverse",
            );

            assertEquals(ascResult.toReversed(), descResult);
          },
        ),
        propertyTestOptions,
      );
    });
  });
});
