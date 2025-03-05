import { join } from "@std/path";
import { type Establishment, ratingValue } from "./schema.mts";
import scoreDescriptors from "./score-descriptors.json" with { type: "json" };
import { getClassSuffix } from "../lib/template/template.mts";
import { forgeRoot } from "../components/root/forge.mts";
import { forgeHeader } from "../components/header/forge.mts";
import { forgeFooter } from "../components/footer/forge.mts";
import { EnrichedLocalAuthority } from "./schema-app.mts";
import {
  getCanonicalLinkURL,
  getHtmlFilename,
} from "../lib/establishment/establishment.mts";
import { Address } from "../components/address/forge.mts";

const Root = forgeRoot();
const Header = forgeHeader();
const Footer = forgeFooter();
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

const renderAddress = (establishment: Establishment): string => {
  return `
    <h2>Address</h2>
    ${address.render(establishment)}
  `;
};

// const renderMap = (establishment: Establishment): string => {
//   return `<iframe
//     src="https://www.openstreetmap.org/export/embed.html?bbox=-0.438755750656128%2C53.7223738716068%2C-0.43555855751037603%2C53.72388631148097&amp;layer=mapnik"
//     style="border: 1px solid black">
//   </iframe><br/><small><a href="https://www.openstreetmap.org/#map=19/53.723130/-0.437157">View Larger Map</a></small>`;
// };

const renderRatingDate = (ratingDate: string | null): string => {
  if (ratingDate === null) return "";

  const date = new Date(ratingDate);
  const options = { year: "numeric", month: "long", day: "numeric" } as const;
  const formattedDate = date.toLocaleDateString("en-GB", options).replace(
    /(\d{2}) (\w{3}) (\d{4})/,
    "$1 $2 $3",
  );

  return `
  <h2>Rating Date</h2>
  <time datetime="${ratingDate}" itemprop="fhrsRatingDate">${formattedDate}</time>
  `;
};

const renderScores = (scores: Establishment["Scores"]): string => {
  if (scores === null) return "";

  // TODO: Don't be sloppy with the types here
  const scoreData = [
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

  return `
      <h2>Score parts</h2>
      <table class="scores">
        <thead>
          <th>Category</th>
          <th>Score</th>
          <th>Description</th>
        </thead>
        <tbody>
        ${
    scoreData.map((score) => `
          <tr>
            <td class="title">${score.title}</td>
            <td class="score">${score.value}</td>
            <td>${score.description}</td>
          </tr>
        `).join("")
  }
        </tbody>
      </table>
      `;
};

const renderLocalAuthority = (
  localAuthority: EnrichedLocalAuthority,
): string => {
  return `
    <h2>Local Authority</h2>
    <div itemprop="department" itemscope itemtype="https://schema.org/GovernmentOrganization">
      <span itemprop="name">${localAuthority.Name}</span><br>
      <a href="${localAuthority.Url}" itemprop="url">${localAuthority.Url}</a>
    </div>
  `;
};

export const outputLocalAuthorityEstablishments = async (
  localAuthority: EnrichedLocalAuthority,
  establishments: Establishment[],
) => {
  const classSuffix = getClassSuffix();

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

    const html = `
<!DOCTYPE html>
<html lang="en">
${
      Root.renderHead({
        canonical: getCanonicalLinkURL(establishment),
        title: establishment.BusinessName,
        pageCSS: `
        .content-${classSuffix} {
            display: contents;

          .establishment {
              border-bottom: 1px solid #ccc;
              padding: 1rem;
              margin: 20px 0;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              border-radius: 8px;
          }

          h1 {
              font-size: 2em;
              border-bottom: 1px solid var(--hygiene-green);
          }

          h2 {
              font-size: 1.2em;
              margin: 1em 0 0 0;
          }

          h2::after {
              content: ":";
          }


          p, address, td, th {
              font-size: 1em;
              line-height: 1.5;
          }

          img.rating-image {
              max-width: 400px;
              height: auto;
              display: block;
              margin: 10px 0;
              box-shadow: white 0 0 0 1px;
              border-radius: 9px;
          }

          table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 1em;
          }

          th {
              background-color: #1b5f7b;
              color: #ffffff;
              font-weight: bold;
          }

          .scores tbody tr:hover {
            background-color: #f0f0f0;
            color: #333;
          }

          th, td {
              border: 1px solid #ddd;
              padding: 0.5em;
              text-align: left;
              vertical-align: top;
          }

          .title,
          .score {
              white-space: nowrap;

              @media screen and (max-width: 820px) { 
                  & {
                      white-space: normal;
                  }
              }
          }
        }
        ${address.css}
  `,
        headerCSS: Header.css,
        footerCSS: Footer.css,
      })
    }
  <body>
    ${Header.html}
    <div class="content-${classSuffix}">
      <div class="container">
        <article class="establishment" itemscope itemtype="https://schema.org/FoodEstablishment" data-establishment-id="${establishment.FHRSID}">
          <h1 class="name" itemprop="name">${establishment.BusinessName}</h1>
          <h2>Business Type</h2>
          <div itemprop="servesCuisine">${establishment.BusinessType}</div>
          <h2>Rating</h2>
          <div>${ratingDisplayText}</div>
          <img src="${ratingImage.url}" alt="${ratingImage.alt}" class="rating-image" itemprop="image">
          ${renderAddress(establishment)}
          ${/* renderMap(establishment) */ ""}
          ${renderRatingDate(establishment.RatingDate)}
          ${renderScores(establishment.Scores)}
          ${renderLocalAuthority(localAuthority)}
        </article>
      </div>
    </div>
    ${Footer.html}
  </body>
</html>
`;

    const filename = getHtmlFilename(establishment);
    await Deno.writeTextFile(join("dist", filename), html);
  }));
};
