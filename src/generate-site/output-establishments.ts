import { join } from "@std/path";
import { dataSchema, type Establishment, ratingValue } from "./schema.ts";
import scoreDescriptors from "./score-descriptors.json" with { type: "json" };
import { slugify } from "./slugify.ts";
import { getClassSuffix } from "../lib/template/template.ts";
import { forgeRoot } from "../components/root/forge.ts";
import { forgeHeader } from "../components/header/forge.ts";
import { forgeFooter } from "../components/footer/forge.ts";

const Root = forgeRoot();
const Header = forgeHeader();
const Footer = forgeFooter();

type ScoreType = keyof typeof scoreDescriptors.scoreDescriptors;
type Language = "en" | "cy";
type ScoreKey = keyof typeof scoreDescriptors.scoreDescriptors[ScoreType];

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

const renderAddress = (establishment: Establishment): string => {
  if (establishment.Geocode === null) return "";

  const businessName = encodeURIComponent(establishment.BusinessName);
  const latitude = establishment.Geocode?.Latitude;
  const longitude = establishment.Geocode?.Longitude;
  const locationLink =
    `https://geohack.toolforge.org/geohack.php?title=${businessName}&params=${latitude}_N_${longitude}_E_type:landmark_dim:20`;

  const addressLines = [
    establishment.AddressLine1
      ? `<span>${establishment.AddressLine1}</span>`
      : null,
    establishment.AddressLine2
      ? `<span>${establishment.AddressLine2}</span>`
      : null,
    establishment.AddressLine3
      ? `<span>${establishment.AddressLine3}</span>`
      : null,
    establishment.AddressLine4
      ? `<span>${establishment.AddressLine4}</span>`
      : null,
    establishment.PostCode
      ? `<span itemprop="postalCode">${establishment.PostCode}</span>`
      : null,
  ].filter(Boolean).join("<br>");

  return `
      <p>
        Address:
        <address itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">
          ${addressLines || "No address information available"}
        </address>
        <a href="${locationLink}" target="_blank" rel="noopener noreferrer">View on Map</a>
      </p>`;
};

const renderRatingDate = (ratingDate: string | null): string => {
  if (ratingDate === null) return "";

  return `
  <p>Rating Date: <time datetime="${ratingDate}" itemprop="fhrsRatingDate">${ratingDate}</time></p>
  `;
};

const renderScores = (scores: Establishment["Scores"]): string => {
  if (scores === null) return "";

  // TODO: Don't be sloppy with the types here
  const scoreData = [
    {
      title: "Hygiene",
      value: scoreToText(
        scores.Hygiene.toString() as ScoreKey,
        "Hygiene",
        "en",
      ),
    },
    {
      title: "Structural",
      value: scoreToText(
        scores.Structural.toString() as ScoreKey,
        "Structural",
        "en",
      ),
    },
    {
      title: "Confidence in Management",
      value: scoreToText(
        scores.ConfidenceInManagement.toString() as ScoreKey,
        "Confidence",
        "en",
      ),
    },
  ];

  return `
      <table>
        ${
    scoreData.map((score) => `
        <tr>
          <th>${score.title}</th>
          <td>${score.value}</td>
        </tr>
        `).join("")
  }
      </table>
      `;
};

export const outputEstablishments = async (filename: string) => {
  console.log(`Processing ${filename}...`);

  const module = await import(`../../${filename}`, {
    with: { type: "json" },
  });
  let jsonData;
  try {
    jsonData = dataSchema.parse(module.default);
  } catch (error) {
    console.error("Error:", error);
    throw new Error(`Failed to parse data from ${filename}`);
  }
  const establishments = jsonData.FHRSEstablishment.EstablishmentCollection;

  const classSuffix = getClassSuffix();

  // Generate HTML for each establishment and save to a file
  await Promise.all(establishments.map(async (establishment) => {
    const ratingImage = {
      alt: !isNaN(Number(establishment.RatingValue))
        ? `Food Hygiene Rating: ${establishment.RatingValue} out of 5`
        : ratingValue[establishment.SchemeType][
          establishment.RatingValue as
            & keyof typeof ratingValue.FHRS
            & keyof typeof ratingValue.FHIS
        ].text,
      url: ratingValue[establishment.SchemeType][
        establishment.RatingValue as
          & keyof typeof ratingValue.FHRS
          & keyof typeof ratingValue.FHIS
      ].image_en,
    };

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${establishment.BusinessName} - Food Hygiene Rating</title>
    <style>
        ${Root.css}

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
              color: #333;
          }

          p, address, td, th {
              font-size: 1em;
              color: #666;
              line-height: 1.5;
          }

          a {
              color: #1e90ff;
              text-decoration: none;
          }

          a:hover {
              text-decoration: underline;
          }

          img.rating-image {
              width: 100%;
              max-width: 400px;
              height: auto;
              display: block;
              margin: 10px auto;
          }

          table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 1em;
          }

          th, td {
              border: 1px solid #ddd;
              padding: 0.5em;
              text-align: left;
          }
        }  

        ${Header.css}
        ${Footer.css}
    </style>
  </head>
  <body>
    ${Header.html}
    <div class="content-${classSuffix}">
      <div class="container">
        <article class="establishment" itemscope itemtype="https://schema.org/FoodEstablishment" data-establishment-id="${establishment.FHRSID}">
          <h1 class="name" itemprop="name">${establishment.BusinessName}</h1>
          <img src="${ratingImage.url}" alt="${ratingImage.alt}" class="rating-image" itemprop="image">
          ${renderAddress(establishment)}
          <p>Business Type: <span itemprop="servesCuisine">${establishment.BusinessType}</span></p>
          <p>Rating: ${establishment.RatingValue}</p>
          ${renderRatingDate(establishment.RatingDate)}
          ${renderScores(establishment.Scores)}
        </article>
      </div>
    </div>
    ${Footer.html}
  </body>
</html>
`;

    const sanitizedBusinessName = slugify(establishment.BusinessName);
    const filename = `${sanitizedBusinessName}-${establishment.FHRSID}.html`;
    await Deno.writeTextFile(join("dist", "e", filename), html);
  }));
};
