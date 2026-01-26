import { fromFileUrl, join } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import {
  type Establishment,
  ratingValue,
} from "../../generate-site/schema.mts";
import scoreDescriptors from "../../generate-site/score-descriptors.json" with {
  type: "json",
};
import { getClassSuffix } from "../../lib/template/template.mts";
import { forgeRoot } from "../../components/root/forge.mts";
import { forgeHeader } from "../../components/header/forge.mts";
import { forgeFooter } from "../../components/footer/forge.mts";
import { EnrichedLocalAuthority } from "../../generate-site/schema-app.mts";
import {
  getCanonicalLinkURL,
  getHtmlFilename,
} from "../../lib/establishment/establishment.mts";
import { Address } from "../../components/address/forge.mts";
import { jsAddSuffix, processJsFile } from "../../lib/js/js.mts";
import { cssAddSuffix, processCssFile } from "../../lib/css/css.mts";

const environment = vento();
environment.use(autoTrim());
environment.cache.clear();

const pageTemplatePath = fromFileUrl(
  import.meta.resolve("./establishment-detail.vto"),
);
const templatePromise = environment.load(pageTemplatePath);

const Root = forgeRoot();
const HeaderPromise = forgeHeader();
const FooterPromise = forgeFooter();
const address = Address();

type ScoreType = keyof typeof scoreDescriptors.scoreDescriptors;
type ScoreKey = keyof (typeof scoreDescriptors.scoreDescriptors)[ScoreType];
type Language = "en" | "cy";

const scoreToText = (
  score: ScoreKey,
  scoreType: ScoreType,
  language: Language,
): string => {
  const descriptors = scoreDescriptors.scoreDescriptors[scoreType];
  const descriptor = descriptors[score];
  if (descriptor) {
    return descriptor.description[language];
  }
  return "Unknown score";
};

/**
 * Converts a score value to a detailed description
 *
 * @param score - The score key
 * @param scoreType - The type of score
 * @param language - The language for the description
 * @returns The detailed score description
 */
const scoreToDescription = (
  score: ScoreKey,
  scoreType: ScoreType,
  language: Language,
): string => {
  const descriptors = scoreDescriptors.scoreDescriptors[scoreType];
  const descriptor = descriptors[score];
  if (descriptor) {
    return descriptor.detail[language] ?? descriptor.detail["en"];
  }
  return "Unknown score";
};

/**
 * Precomputes and caches a Map of scores for each score type.
 */
const cachedScoreMaps: Record<ScoreType, Map<number, number>> = {
  Hygiene: new Map(
    Object.keys(scoreDescriptors.scoreDescriptors.Hygiene)
      .map(Number)
      // eslint-disable-next-line unicorn/no-array-sort
      .sort((a, b) => b - a)
      .map((score, index) => [score, index + 1]),
  ),
  Structural: new Map(
    Object.keys(scoreDescriptors.scoreDescriptors.Structural)
      .map(Number)
      // eslint-disable-next-line unicorn/no-array-sort
      .sort((a, b) => b - a)
      .map((score, index) => [score, index + 1]),
  ),
  Confidence: new Map(
    Object.keys(scoreDescriptors.scoreDescriptors.Confidence)
      .map(Number)
      // eslint-disable-next-line unicorn/no-array-sort
      .sort((a, b) => b - a)
      .map((score, index) => [score, index + 1]),
  ),
};

/**
 * Converts a raw score value to a simplified subscore using a cached Map.
 *
 * @param rawScore - The raw score value
 * @param scoreType - The type of score
 * @returns The simplified subscore
 */
const calculateSubscore = (rawScore: number, scoreType: ScoreType): number => {
  return cachedScoreMaps[scoreType].get(rawScore) ?? -1;
};

/**
 * Formats a rating date into ISO and human-readable formats
 *
 * @param ratingDate - The rating date string
 * @returns Object containing ISO and formatted date strings, or null if no date
 */
const getRatingDate = (
  ratingDate: string | null,
): { iso: string; formatted: string } | null => {
  if (ratingDate === null) return null;

  const date = new Date(ratingDate);
  const options = { year: "numeric", month: "long", day: "numeric" } as const;
  const formattedDate = date
    .toLocaleDateString("en-GB", options)
    .replace(/(\d{2}) (\w{3}) (\d{4})/, "$1 $2 $3");

  return {
    iso: ratingDate,
    formatted: formattedDate,
  };
};

/**
 * Extracts and formats score data with subscores from an establishment's scores
 *
 * @param scores - The scores object from an establishment
 * @returns Array of score data objects, or null if no scores
 */
const getScoreDataWithSubscores = (
  scores: Establishment["Scores"],
):
  | Array<{
    title: string;
    description: string;
    value: string;
    subscore: string;
  }>
  | null => {
  if (scores === null) return null;

  return [
    {
      title: "Hygiene",
      description: scoreToDescription(
        scores.Hygiene.toString() as ScoreKey,
        "Hygiene",
        "en",
      ),
      value: scoreToText(
        scores.Hygiene.toString() as ScoreKey,
        "Hygiene",
        "en",
      ),
      subscore: `${calculateSubscore(scores.Hygiene, "Hygiene")} out of ${
        Object.keys(scoreDescriptors.scoreDescriptors["Hygiene"]).length
      }`,
    },
    {
      title: "Structural",
      description: scoreToDescription(
        scores.Structural.toString() as ScoreKey,
        "Structural",
        "en",
      ),
      value: scoreToText(
        scores.Structural.toString() as ScoreKey,
        "Structural",
        "en",
      ),
      subscore: `${calculateSubscore(scores.Structural, "Structural")} out of ${
        Object.keys(scoreDescriptors.scoreDescriptors["Structural"]).length
      }`,
    },
    {
      title: "Confidence in Management",
      description: scoreToDescription(
        scores.ConfidenceInManagement.toString() as ScoreKey,
        "Confidence",
        "en",
      ),
      value: scoreToText(
        scores.ConfidenceInManagement.toString() as ScoreKey,
        "Confidence",
        "en",
      ),
      subscore: `${
        calculateSubscore(
          scores.ConfidenceInManagement,
          "Confidence",
        )
      } out of ${
        Object.keys(scoreDescriptors.scoreDescriptors["Confidence"]).length
      }`,
    },
  ];
};

const processedCssPromise = processCssFile({
  path: import.meta.resolve("./establishment-detail.css"),
  additionalCss: `\n${address.css}`,
});

const processedJsPromise = processJsFile({
  path: import.meta.resolve("./establishment-detail.mjs"),
});

const [template, Header, Footer, processedCss, processedJs] = await Promise.all(
  [
    templatePromise,
    HeaderPromise,
    FooterPromise,
    processedCssPromise,
    processedJsPromise,
  ],
);

/**
 * Generates HTML pages for each establishment in a local authority
 *
 * @param localAuthority - The local authority object
 * @param establishments - Array of establishments to generate pages for
 */
export const outputEstablishmentDetailPage = async (
  localAuthority: EnrichedLocalAuthority,
  establishments: Establishment[],
): Promise<void> => {
  const classSuffix = getClassSuffix();

  const pageCSS = cssAddSuffix(processedCss, classSuffix);
  const pageJs = jsAddSuffix(processedJs, classSuffix);

  // Generate HTML for each establishment and save to a file
  await Promise.all(
    establishments.map(async (establishment) => {
      const ratingValueObject = ratingValue[establishment.SchemeType][
        establishment.RatingValue as
          & keyof typeof ratingValue.FHRS
          & keyof typeof ratingValue.FHIS
      ];
      const ratingText = ratingValueObject.text;
      const ratingDisplayText = Number.isNaN(Number(establishment.RatingValue))
        ? ratingText
        : `${establishment.RatingValue} - ${ratingText}`;

      const ratingImage = {
        alt: `Food Hygiene Rating: ${ratingDisplayText}`,
        url: ratingValueObject.image_en,
      };

      const ratingDate = getRatingDate(establishment.RatingDate);
      const scoreData = getScoreDataWithSubscores(establishment.Scores);
      const addressHtml = await address.render(establishment);

      // Extract geocode data for map rendering
      const geocode =
        establishment.Geocode?.Latitude && establishment.Geocode?.Longitude
          ? {
            latitude: Number(establishment.Geocode.Latitude),
            longitude: Number(establishment.Geocode.Longitude),
          }
          : null;

      const businessName = encodeURIComponent(establishment.BusinessName);
      const locationLink = geocode
        ? `https://geohack.toolforge.org/geohack.php?title=${businessName}&params=${geocode.latitude}_N_${geocode.longitude}_E_type:landmark_dim:20`
        : null;

      const html = await template({
        headHtml: await Root.renderHead({
          canonical: getCanonicalLinkURL(establishment),
          title: establishment.BusinessName,
          pageCSS,
          headerCSS: Header.css,
          footerCSS: Footer.css,
        }),
        headerHtml: Header.html,
        classSuffix,
        establishment,
        localAuthority,
        ratingImage,
        ratingDisplayText,
        footerHtml: Footer.html,
        addressHtml: addressHtml.content,
        ratingDate,
        scoreData,
        geocode,
        processedJs: pageJs,
        locationLink,
      });

      const filename = getHtmlFilename(establishment);
      await Deno.writeTextFile(join("dist", filename), html.content);
    }),
  );
};
