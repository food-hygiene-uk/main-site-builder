import { z } from "zod";

export const ratingValue = {
  "FHRS": {
    "5": {
      text: "Very Good",
      image_cy: "images/fhrs/fhrs_5_cy-gb.svg",
      image_en: "images/fhrs/fhrs_5_en-gb.svg",
      ratingKey_en: "fhrs_5_en-GB",
      ratingKey_cy: "fhrs_5_cy-gb",
    },
    "4": {
      text: "Good",
      image_cy: "images/fhrs/fhrs_4_cy-gb.svg",
      image_en: "images/fhrs/fhrs_4_en-gb.svg",
      ratingKey_en: "fhrs_4_en-GB",
      ratingKey_cy: "fhrs_4_cy-gb",
    },
    "3": {
      text: "Generally Satisfactory",
      image_cy: "images/fhrs/fhrs_3_cy-gb.svg",
      image_en: "images/fhrs/fhrs_3_en-gb.svg",
      ratingKey_en: "fhrs_3_en-GB",
      ratingKey_cy: "fhrs_3_cy-gb",
    },
    "2": {
      text: "Improvement Necessary",
      image_cy: "images/fhrs/fhrs_2_cy-gb.svg",
      image_en: "images/fhrs/fhrs_2_en-gb.svg",
      ratingKey_en: "fhrs_2_en-GB",
      ratingKey_cy: "fhrs_2_cy-gb",
    },
    "1": {
      text: "Major Improvement Necessary",
      image_cy: "images/fhrs/fhrs_1_cy-gb.svg",
      image_en: "images/fhrs/fhrs_1_en-gb.svg",
      ratingKey_en: "fhrs_1_en-GB",
      ratingKey_cy: "fhrs_1_cy-gb",
    },
    "0": {
      text: "Urgent Improvement Necessary",
      image_cy: "images/fhrs/fhrs_0_cy-gb.svg",
      image_en: "images/fhrs/fhrs_0_en-gb.svg",
      ratingKey_en: "fhrs_0_en-GB",
      ratingKey_cy: "fhrs_0_cy-gb",
    },
    AwaitingInspection: {
      text: "Awaiting Inspection",
      image_cy: "images/fhrs/fhrs_awaitinginspection_cy-gb.svg",
      image_en: "images/fhrs/fhrs_awaitinginspection_en-gb.svg",
      ratingKey_en: "fhrs_awaitinginspection_en-GB",
      ratingKey_cy: "fhrs_ratingawaited_cy-gb",
    },
    AwaitingPublication: {
      text: "Awaiting Publication",
      image_cy: "images/fhrs/fhrs_awaitingpublication_cy-gb.svg",
      image_en: "images/fhrs/fhrs_awaitingpublication_en-gb.svg",
      ratingKey_en: "fhrs_awaitingpublication_en-GB",
      ratingKey_cy: "fhrs_awaitingpublication_cy-gb",
    },
    Exempt: {
      text: "Exempt",
      image_cy: "images/fhrs/fhrs_exempt_cy-gb.svg",
      image_en: "images/fhrs/fhrs_exempt_en-gb.svg",
      ratingKey_en: "fhrs_exempt_en-GB",
      ratingKey_cy: "fhrs_exempt_cy-gb",
    },
  },
  "FHIS": {
    "Awaiting Inspection": {
      text: "Awaiting Inspection",
      image_en: "images/fhis/fhis_awaiting_inspection.jpg",
      ratingKey: "fhis_awaiting_inspection_en-GB",
    },
    "Awaiting Publication": {
      text: "Awaiting Publication",
      image_en: "images/fhis/fhis_awaiting_publication.jpg",
      ratingKey: "fhis_awaiting_publication_en-GB",
    },
    Exempt: {
      text: "Exempt",
      image_en: "images/fhis/fhis_exempt.jpg",
      ratingKey: "fhis_exempt_en-GB",
    },
    "Improvement Required": {
      text: "Improvement Required",
      image_en: "images/fhis/fhis_improvement_required.jpg",
      ratingKey: "fhis_improvement_required_en-GB",
    },
    Pass: {
      text: "Pass",
      image_en: "images/fhis/fhis_pass.jpg",
      ratingKey: "fhis_pass_en-GB",
    },
    "Pass and Eat Safe": {
      text: "Pass and Eat Safe",
      image_en: "images/fhis/fhis_pass_and_eat_safe.jpg",
      ratingKey: "fhis_pass_and_eat_safe_en-GB",
    },
  },
};

export const schemeNoRatingScoreFHRS: (keyof typeof ratingValue.FHRS)[] = [
  "AwaitingInspection",
  "AwaitingPublication",
  "Exempt",
];

const fhrsValidRatingKeys = (key: keyof typeof ratingValue.FHRS) => {
  return z.literal(
    ratingValue.FHRS[key].ratingKey_en,
  ).or(z.literal(
    ratingValue.FHRS[key].ratingKey_cy,
  ));
};

const ratingValueFHRS = z.object({
  SchemeType: z.literal("FHRS"),
}).and(
  z.discriminatedUnion("RatingValue", [
    z.object({
      RatingValue: z.literal("never"),
      RatingKey: z.string(),
      RatingDate: z.literal("never"),
      Scores: z.literal(null),
    }),
    ...schemeNoRatingScoreFHRS.map((key) =>
      z.object({
        RatingValue: z.literal(key),
        RatingKey: fhrsValidRatingKeys(key),
        RatingDate: z.literal(null),
        Scores: z.literal(null),
      })
    ),
    ...Object.keys(ratingValue.FHRS)
      .filter((key) => schemeNoRatingScoreFHRS.includes(key as keyof typeof ratingValue.FHRS) === false)
      .map((key) =>
        z.object({
          RatingValue: z.literal(key),
          RatingKey: fhrsValidRatingKeys(key as keyof typeof ratingValue.FHRS),
          RatingDate: z.string(),
          // FHRSID 351094 has a rating, but no scores. So Scores needs to be nullable. (last checked 2024-11-23)
          Scores: z.object({
            Hygiene: z.number(),
            Structural: z.number(),
            ConfidenceInManagement: z.number(),
          }).nullable(),
        })
      ),
  ]),
);

const ratingValueFHIS = z.object({
  SchemeType: z.literal("FHIS"),
}).and(
  z.discriminatedUnion("RatingValue", [
    z.object({
      RatingValue: z.literal("never"),
      RatingKey: z.string(),
      RatingDate: z.literal("never"),
      Scores: z.literal(null),
    }),
    ...Object.keys(ratingValue.FHIS)
      .map((key) =>
        z.object({
          RatingValue: z.literal(key),
          RatingKey: z.literal(
            ratingValue.FHIS[key as keyof typeof ratingValue.FHIS]
              .ratingKey,
          ),
          // FHRSID 1436677 is Exempt, but has a rating date. So it can be null or a string. (last checked 2024-11-20)
          RatingDate: z.string().nullable(),
          Scores: z.literal(null),
        })
      ),
  ]),
);

export const dataSchema = z.object({
  FHRSEstablishment: z.object({
    EstablishmentCollection: z.array(
      z.object({
        FHRSID: z.number(),
        BusinessName: z.string(),
        BusinessType: z.string(),
      }).and(z.union([
        z.object({
          Geocode: z.object({
            Latitude: z.string(),
            Longitude: z.string(),
          }),
          // FHRSID 1714030 is missing AddressLine1, but has AddressLine2. So AddressLine1 needs to be optional. (last checked 2024-11-23)
          AddressLine1: z.string().optional(),
          // FHRSID 1385728 is missing the real first line of the address, so the second line is in AddressLine1.
          // So AddressLine2, AddressLine3, and AddressLine4 need to be optional. (last checed 2024-11-20)
          AddressLine2: z.string().optional(),
          AddressLine3: z.string().optional(),
          AddressLine4: z.string().optional(),
          // FHRSID 1496369 is a mobile caterer, it has an address, but no postcode.
          // So PostCode needs to be optional. (last checked 2024-11-20)
          PostCode: z.string().optional(),
        }),
        z.object({
          Geocode: z.literal(null),
        }),
      ])).and(z.union([ratingValueFHRS, ratingValueFHIS])),
    ),
  }),
});
