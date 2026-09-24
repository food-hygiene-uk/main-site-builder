import fc from "fast-check";
import type { Establishment } from "./schema.mts";

const ratingDateArbitrary = fc.oneof(
  fc.constant(null),
  fc
    .date({ min: new Date("2020-01-01"), max: new Date("2025-12-31") })
    .filter((date) => !Number.isNaN(date.getTime()))
    .map((date) => date.toISOString().split("T", 1)[0]),
);

const ratingArbitrary = fc.constantFrom(
  { RatingValue: "0", RatingKey: "fhrs_0_en-GB" },
  { RatingValue: "1", RatingKey: "fhrs_1_en-GB" },
  { RatingValue: "2", RatingKey: "fhrs_2_en-GB" },
  { RatingValue: "3", RatingKey: "fhrs_3_en-GB" },
  { RatingValue: "4", RatingKey: "fhrs_4_en-GB" },
  { RatingValue: "5", RatingKey: "fhrs_5_en-GB" },
).chain(({ RatingValue, RatingKey }) =>
  fc.record({
    RatingValue: fc.constant(RatingValue),
    RatingKey: fc.constant(RatingKey),
    RatingDate: ratingDateArbitrary,
  })
);

export const establishmentArbitrary: fc.Arbitrary<Establishment> = fc
  .record({
    FHRSID: fc.nat(),
    BusinessName: fc.string({ minLength: 1, maxLength: 50 }),
    BusinessType: fc.string({ minLength: 1, maxLength: 50 }),
    LocalAuthorityBusinessID: fc.oneof(
      fc.string({ minLength: 1, maxLength: 20 }),
      fc.nat(),
    ),
    BusinessTypeID: fc.nat(),
    LocalAuthorityCode: fc.string({ minLength: 1, maxLength: 20 }),
    LocalAuthorityName: fc.string({ minLength: 1, maxLength: 50 }),
    LocalAuthorityWebSite: fc.string({ minLength: 1, maxLength: 100 }),
    NewRatingPending: fc.boolean(),
    AddressLine1: fc.string({ minLength: 1, maxLength: 50 }),
    AddressLine2: fc.string({ minLength: 1, maxLength: 50 }),
    AddressLine3: fc.string({ minLength: 1, maxLength: 50 }),
    AddressLine4: fc.string({ minLength: 1, maxLength: 50 }),
    PostCode: fc.string({ minLength: 1, maxLength: 10 }),
    Geocode: fc.record({
      Latitude: fc.string({ minLength: 1, maxLength: 20 }),
      Longitude: fc.string({ minLength: 1, maxLength: 20 }),
    }),
    rating: ratingArbitrary,
  })
  .map(({ rating, ...establishment }) => ({
    ...establishment,
    ...rating,
    SchemeType: "FHRS",
    Scores: {
      Hygiene: 0,
      Structural: 0,
      ConfidenceInManagement: 0,
    },
  }));
