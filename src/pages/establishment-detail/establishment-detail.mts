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

const env = vento();
env.use(autoTrim());
env.cache.clear();

const pageTemplatePath = fromFileUrl(
  import.meta.resolve("./establishment-detail.vto"),
);
const templatePromise = env.load(pageTemplatePath);

const Root = forgeRoot();
const HeaderPromise = forgeHeader();
const FooterPromise = forgeFooter();
const address = Address();

type ScoreType = keyof typeof scoreDescriptors.scoreDescriptors;
type ScoreKey = keyof typeof scoreDescriptors.scoreDescriptors[ScoreType];
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

// const renderMap = (establishment: Establishment): string => {
//   return `<iframe
//     src="https://www.openstreetmap.org/export/embed.html?bbox=-0.438755750656128%2C53.7223738716068%2C-0.43555855751037603%2C53.72388631148097&amp;layer=mapnik"
//     style="border: 1px solid black">
//   </iframe><br/><small><a href="https://www.openstreetmap.org/#map=19/53.723130/-0.437157">View Larger Map</a></small>`;
// };

const getRatingDate = (
  ratingDate: string | null,
): { iso: string; formatted: string } | null => {
  if (ratingDate === null) return null;

  const date = new Date(ratingDate);
  const options = { year: "numeric", month: "long", day: "numeric" } as const;
  const formattedDate = date.toLocaleDateString("en-GB", options).replace(
    /(\d{2}) (\w{3}) (\d{4})/,
    "$1 $2 $3",
  );

  return {
    iso: ratingDate,
    formatted: formattedDate,
  };
};

const getScoreData = (scores: Establishment["Scores"]) => {
  if (scores === null) return null;

  // TODO: Don't be sloppy with the types here
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
    },
    {
      title: "Structural",
      description: scoreToDescription(
        scores.Hygiene.toString() as ScoreKey,
        "Hygiene",
        "en",
      ),
      value: scoreToText(
        scores.Structural.toString() as ScoreKey,
        "Structural",
        "en",
      ),
    },
    {
      title: "Confidence in Management",
      description: scoreToDescription(
        scores.Hygiene.toString() as ScoreKey,
        "Hygiene",
        "en",
      ),
      value: scoreToText(
        scores.ConfidenceInManagement.toString() as ScoreKey,
        "Confidence",
        "en",
      ),
    },
  ];
};

const cssPath = fromFileUrl(
  import.meta.resolve("./establishment-detail.css"),
);
const cssContent = Deno.readTextFileSync(cssPath);

const [template, Header, Footer] = await Promise.all([
  templatePromise,
  HeaderPromise,
  FooterPromise,
]);

export const outputEstablishmentDetailPage = async (
  localAuthority: EnrichedLocalAuthority,
  establishments: Establishment[],
): Promise<void> => {
  const classSuffix = getClassSuffix();

  const processedCss = cssContent.replace(/__CLASS_SUFFIX__/g, classSuffix)
    .replace(/\/\* __ADDITIONAL_CSS__ \*\//g, `\n${address.css}`);

  const pageCSS = processedCss;

  // Generate HTML for each establishment and save to a file
  await Promise.all(establishments.map(async (establishment) => {
    const ratingValueObj = ratingValue[establishment.SchemeType][
      establishment.RatingValue as
        & keyof typeof ratingValue.FHRS
        & keyof typeof ratingValue.FHIS
    ];
    const ratingText = ratingValueObj.text;
    const ratingDisplayText = !isNaN(Number(establishment.RatingValue))
      ? `${establishment.RatingValue} out of 5. ${ratingText}`
      : ratingText;

    const ratingImage = {
      alt: `Food Hygiene Rating: ${ratingDisplayText}`,
      url: ratingValueObj.image_en,
    };

    const ratingDate = getRatingDate(establishment.RatingDate);
    const scoreData = getScoreData(establishment.Scores);
    const addressHtml = address.render(establishment);

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
      addressHtml: (await addressHtml).content,
      ratingDate,
      scoreData,
    });

    const filename = getHtmlFilename(establishment);
    await Deno.writeTextFile(join("dist", filename), html.content);
  }));
};
