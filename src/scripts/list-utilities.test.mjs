/**
 * @import { Establishment } from "components/establishment-card/establishment-card.mjs"
 */

import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import fc from "fast-check";
import {
  filterEstablishments,
  sliceEstablishments,
} from "./list-utilities.mjs";

/**
 * Creates a test establishment with minimal required fields
 *
 * @param {string} businessName - The business name
 * @param {number} id - The establishment ID
 * @returns {Establishment} A test establishment object
 */
const createTestEstablishment = (businessName, id) => ({
  FHRSID: id,
  BusinessName: businessName,
  RatingValue: "5",
  RatingDate: "2024-01-01",
  LocalAuthorityName: "Test Authority",
  LocalAuthorityCode: 123,
});

describe("filterEstablishments", () => {
  describe("Example-based tests", () => {
    it("should return all establishments when filterText is empty string", () => {
      const establishments = [
        createTestEstablishment("Pizza Place", 1),
        createTestEstablishment("Burger Joint", 2),
        createTestEstablishment("Coffee Shop", 3),
      ];

      const result = filterEstablishments(establishments, "");

      assertEquals(result.length, 3);
      assertEquals(result, establishments);
    });

    it("should return all establishments when filterText is undefined", () => {
      const establishments = [
        createTestEstablishment("Pizza Place", 1),
        createTestEstablishment("Burger Joint", 2),
      ];

      const result = filterEstablishments(establishments);

      assertEquals(result.length, 2);
      assertEquals(result, establishments);
    });

    it("should return all establishments when filterText is null", () => {
      const establishments = [
        createTestEstablishment("Pizza Place", 1),
        createTestEstablishment("Burger Joint", 2),
      ];

      const result = filterEstablishments(establishments, null);

      assertEquals(result.length, 2);
      assertEquals(result, establishments);
    });

    it("should filter establishments by exact name match", () => {
      const establishments = [
        createTestEstablishment("Pizza Place", 1),
        createTestEstablishment("Burger Joint", 2),
        createTestEstablishment("Coffee Shop", 3),
      ];

      const result = filterEstablishments(establishments, "Burger Joint");

      assertEquals(result.length, 1);
      assertEquals(result[0].BusinessName, "Burger Joint");
    });

    it("should filter establishments by partial name match", () => {
      const establishments = [
        createTestEstablishment("Pizza Place", 1),
        createTestEstablishment("Burger Joint", 2),
        createTestEstablishment("Coffee Shop", 3),
      ];

      const result = filterEstablishments(establishments, "Pizza");

      assertEquals(result.length, 1);
      assertEquals(result[0].BusinessName, "Pizza Place");
    });

    it("should be case-insensitive when filtering", () => {
      const establishments = [
        createTestEstablishment("Pizza Place", 1),
        createTestEstablishment("Burger Joint", 2),
        createTestEstablishment("Coffee Shop", 3),
      ];

      const result = filterEstablishments(establishments, "pizza");

      assertEquals(result.length, 1);
      assertEquals(result[0].BusinessName, "Pizza Place");
    });

    it("should filter establishments with uppercase search text", () => {
      const establishments = [
        createTestEstablishment("Pizza Place", 1),
        createTestEstablishment("Burger Joint", 2),
        createTestEstablishment("Coffee Shop", 3),
      ];

      const result = filterEstablishments(establishments, "BURGER");

      assertEquals(result.length, 1);
      assertEquals(result[0].BusinessName, "Burger Joint");
    });

    it("should return multiple matches when filter text matches multiple names", () => {
      const establishments = [
        createTestEstablishment("The Pizza Place", 1),
        createTestEstablishment("The Burger Joint", 2),
        createTestEstablishment("The Coffee Shop", 3),
      ];

      const result = filterEstablishments(establishments, "The");

      assertEquals(result.length, 3);
      assertEquals(result[0].BusinessName, "The Pizza Place");
      assertEquals(result[1].BusinessName, "The Burger Joint");
      assertEquals(result[2].BusinessName, "The Coffee Shop");
    });

    it("should return empty array when no matches found", () => {
      const establishments = [
        createTestEstablishment("Pizza Place", 1),
        createTestEstablishment("Burger Joint", 2),
        createTestEstablishment("Coffee Shop", 3),
      ];

      const result = filterEstablishments(establishments, "Sushi");

      assertEquals(result.length, 0);
      assertEquals(result, []);
    });

    it("should return empty array when filtering empty array", () => {
      const result = filterEstablishments([], "Pizza");

      assertEquals(result.length, 0);
      assertEquals(result, []);
    });

    it("should not modify the original array", () => {
      const establishments = [
        createTestEstablishment("Pizza Place", 1),
        createTestEstablishment("Burger Joint", 2),
        createTestEstablishment("Coffee Shop", 3),
      ];
      const originalLength = establishments.length;

      filterEstablishments(establishments, "Pizza");

      assertEquals(establishments.length, originalLength);
      assertEquals(establishments[0].BusinessName, "Pizza Place");
      assertEquals(establishments[1].BusinessName, "Burger Joint");
      assertEquals(establishments[2].BusinessName, "Coffee Shop");
    });

    it("should handle filter text with special characters", () => {
      const establishments = [
        createTestEstablishment("McDonald's Restaurant", 1),
        createTestEstablishment("Joe's Café", 2),
        createTestEstablishment("The (Original) Pizza Place", 3),
      ];

      const result = filterEstablishments(establishments, "McDonald's");

      assertEquals(result.length, 1);
      assertEquals(result[0].BusinessName, "McDonald's Restaurant");
    });
  });

  describe("Property-based tests", () => {
    it("should always return an array", () => {
      fc.assert(
        fc.property(fc.array(fc.string()), fc.string(), (names, filterText) => {
          const establishments = names.map((name, index) =>
            createTestEstablishment(name, index)
          );
          const result = filterEstablishments(establishments, filterText);
          return Array.isArray(result);
        }),
        { numRuns: 100 },
      );
    });

    it("should never return more items than the input array", () => {
      fc.assert(
        fc.property(fc.array(fc.string()), fc.string(), (names, filterText) => {
          const establishments = names.map((name, index) =>
            createTestEstablishment(name, index)
          );
          const result = filterEstablishments(establishments, filterText);
          return result.length <= establishments.length;
        }),
        { numRuns: 100 },
      );
    });

    it("should return all items when filterText is empty", () => {
      fc.assert(
        fc.property(fc.array(fc.string()), (names) => {
          const establishments = names.map((name, index) =>
            createTestEstablishment(name, index)
          );
          const result = filterEstablishments(establishments, "");
          return result.length === establishments.length;
        }),
        { numRuns: 100 },
      );
    });

    it("should only include establishments with matching business names", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 })),
          fc.string({ minLength: 1 }),
          (names, filterText) => {
            const establishments = names.map((name, index) =>
              createTestEstablishment(name, index)
            );
            const result = filterEstablishments(establishments, filterText);
            return result.every((est) =>
              est.BusinessName.toLowerCase().includes(filterText.toLowerCase())
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should preserve the original order of establishments", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 })),
          fc.string({ minLength: 1 }),
          (names, filterText) => {
            const establishments = names.map((name, index) =>
              createTestEstablishment(name, index)
            );
            const result = filterEstablishments(establishments, filterText);

            // Verify that the order is preserved by checking IDs are in ascending order
            for (let index = 1; index < result.length; index++) {
              if (result[index].FHRSID < result[index - 1].FHRSID) {
                return false;
              }
            }
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should not mutate the original array", () => {
      fc.assert(
        fc.property(fc.array(fc.string()), fc.string(), (names, filterText) => {
          const establishments = names.map((name, index) =>
            createTestEstablishment(name, index)
          );
          const originalLength = establishments.length;
          const firstItem = establishments[0];

          filterEstablishments(establishments, filterText);

          return (
            establishments.length === originalLength &&
            establishments[0] === firstItem
          );
        }),
        { numRuns: 100 },
      );
    });
  });
});

describe("sliceEstablishments", () => {
  describe("Example-based tests", () => {
    it("should return first page of establishments with pageSize 10", () => {
      const establishments = Array.from(
        { length: 25 },
        (_, index) => createTestEstablishment(`Business ${index}`, index),
      );

      const result = sliceEstablishments(establishments, 1, 10);

      assertEquals(result.length, 10);
      assertEquals(result[0].BusinessName, "Business 0");
      assertEquals(result[9].BusinessName, "Business 9");
    });

    it("should return second page of establishments with pageSize 10", () => {
      const establishments = Array.from(
        { length: 25 },
        (_, index) => createTestEstablishment(`Business ${index}`, index),
      );

      const result = sliceEstablishments(establishments, 2, 10);

      assertEquals(result.length, 10);
      assertEquals(result[0].BusinessName, "Business 10");
      assertEquals(result[9].BusinessName, "Business 19");
    });

    it("should return partial page when fewer items remain", () => {
      const establishments = Array.from(
        { length: 25 },
        (_, index) => createTestEstablishment(`Business ${index}`, index),
      );

      const result = sliceEstablishments(establishments, 3, 10);

      assertEquals(result.length, 5);
      assertEquals(result[0].BusinessName, "Business 20");
      assertEquals(result[4].BusinessName, "Business 24");
    });

    it("should return empty array when page exceeds total items", () => {
      const establishments = Array.from(
        { length: 10 },
        (_, index) => createTestEstablishment(`Business ${index}`, index),
      );

      const result = sliceEstablishments(establishments, 5, 10);

      assertEquals(result.length, 0);
      assertEquals(result, []);
    });

    it("should handle pageSize of 1", () => {
      const establishments = Array.from(
        { length: 5 },
        (_, index) => createTestEstablishment(`Business ${index}`, index),
      );

      const result = sliceEstablishments(establishments, 3, 1);

      assertEquals(result.length, 1);
      assertEquals(result[0].BusinessName, "Business 2");
    });

    it("should handle pageSize larger than array length", () => {
      const establishments = Array.from(
        { length: 5 },
        (_, index) => createTestEstablishment(`Business ${index}`, index),
      );

      const result = sliceEstablishments(establishments, 1, 100);

      assertEquals(result.length, 5);
      assertEquals(result[0].BusinessName, "Business 0");
      assertEquals(result[4].BusinessName, "Business 4");
    });

    it("should return empty array when slicing empty array", () => {
      const result = sliceEstablishments([], 1, 10);

      assertEquals(result.length, 0);
      assertEquals(result, []);
    });

    it("should not modify the original array", () => {
      const establishments = Array.from(
        { length: 15 },
        (_, index) => createTestEstablishment(`Business ${index}`, index),
      );
      const originalLength = establishments.length;

      sliceEstablishments(establishments, 2, 5);

      assertEquals(establishments.length, originalLength);
      assertEquals(establishments[0].BusinessName, "Business 0");
      assertEquals(establishments[14].BusinessName, "Business 14");
    });

    it("should return correct items for multiple pages with pageSize 5", () => {
      const establishments = Array.from(
        { length: 12 },
        (_, index) => createTestEstablishment(`Business ${index}`, index),
      );

      const page1 = sliceEstablishments(establishments, 1, 5);
      const page2 = sliceEstablishments(establishments, 2, 5);
      const page3 = sliceEstablishments(establishments, 3, 5);

      assertEquals(page1.length, 5);
      assertEquals(page1[0].BusinessName, "Business 0");
      assertEquals(page1[4].BusinessName, "Business 4");

      assertEquals(page2.length, 5);
      assertEquals(page2[0].BusinessName, "Business 5");
      assertEquals(page2[4].BusinessName, "Business 9");

      assertEquals(page3.length, 2);
      assertEquals(page3[0].BusinessName, "Business 10");
      assertEquals(page3[1].BusinessName, "Business 11");
    });
  });

  describe("Property-based tests", () => {
    it("should always return an array", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string()),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (names, page, pageSize) => {
            const establishments = names.map((name, index) =>
              createTestEstablishment(name, index)
            );
            const result = sliceEstablishments(establishments, page, pageSize);
            return Array.isArray(result);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should never return more items than pageSize", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string()),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (names, page, pageSize) => {
            const establishments = names.map((name, index) =>
              createTestEstablishment(name, index)
            );
            const result = sliceEstablishments(establishments, page, pageSize);
            return result.length <= pageSize;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should never return more items than the input array", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string()),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (names, page, pageSize) => {
            const establishments = names.map((name, index) =>
              createTestEstablishment(name, index)
            );
            const result = sliceEstablishments(establishments, page, pageSize);
            return result.length <= establishments.length;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should return correct slice based on page and pageSize", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { minLength: 1 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 20 }),
          (ids, page, pageSize) => {
            const establishments = ids.map((id) =>
              createTestEstablishment(`Business ${id}`, id)
            );
            const result = sliceEstablishments(establishments, page, pageSize);

            const startIndex = (page - 1) * pageSize;
            const endIndex = Math.min(startIndex + pageSize, ids.length);

            if (startIndex >= ids.length) {
              return result.length === 0;
            }

            return result.length === endIndex - startIndex;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should preserve the order of establishments in the slice", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { minLength: 1 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 20 }),
          (ids, page, pageSize) => {
            const establishments = ids.map((id) =>
              createTestEstablishment(`Business ${id}`, id)
            );
            const result = sliceEstablishments(establishments, page, pageSize);

            // Verify that the order is preserved
            for (let index = 1; index < result.length; index++) {
              const previousIndex = establishments.indexOf(result[index - 1]);
              const currentIndex = establishments.indexOf(result[index]);
              if (currentIndex !== previousIndex + 1) {
                return false;
              }
            }
            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should not mutate the original array", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string()),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (names, page, pageSize) => {
            const establishments = names.map((name, index) =>
              createTestEstablishment(name, index)
            );
            const originalLength = establishments.length;
            const firstItem = establishments[0];

            sliceEstablishments(establishments, page, pageSize);

            return (
              establishments.length === originalLength &&
              establishments[0] === firstItem
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should return empty array for pages beyond the data", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { maxLength: 50 }),
          fc.integer({ min: 1, max: 100 }),
          (names, pageSize) => {
            const establishments = names.map((name, index) =>
              createTestEstablishment(name, index)
            );
            const totalPages = Math.ceil(establishments.length / pageSize);
            const beyondLastPage = totalPages + 10;

            const result = sliceEstablishments(
              establishments,
              beyondLastPage,
              pageSize,
            );
            return result.length === 0;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
