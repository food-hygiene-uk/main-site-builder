import { join } from "@std/path";
import { dataSchema, ratingValue } from "./schema.ts";
import { slugify } from "./slugify.ts";

const scoreToText = (score: number) => {
  if (score <= 5) {
    return ratingValue.FHRS[5].text;
  }
  if (score <= 10) {
    return ratingValue.FHRS[4].text;
  }
  if (score <= 15) {
    return ratingValue.FHRS[2].text;
  }
  if (score <= 20) {
    return ratingValue.FHRS[1].text;
  }
  return ratingValue.FHRS[0].text;
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

  // Generate HTML for each establishment and save to a file
  await Promise.all(establishments.map(async (establishment) => {
    const businessName = encodeURIComponent(establishment.BusinessName);
    const latitude = establishment.Geocode?.Latitude;
    const longitude = establishment.Geocode?.Longitude;
    const locationLink =
      `https://geohack.toolforge.org/geohack.php?title=${businessName}&params=${latitude}_N_${longitude}_E_type:landmark_dim:20`;

    const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>${establishment.BusinessName} - FHRS Info</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }
      .container {
        max-width: 800px;
        margin: 20px;
        padding: 20px;
        background-color: #fff;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
      }
      .establishment {
        border-bottom: 1px solid #ccc;
        padding-bottom: 20px;
        margin-bottom: 20px;
      }
      h1 {
        font-size: 24px;
        color: #333;
      }
      p {
        font-size: 16px;
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
    </style>
  </head>
  <body>
    <div class="container">
      <div class="establishment">
        <h1>${establishment.BusinessName}</h1>
        <img src="${
      ratingValue[establishment.SchemeType][
        establishment.RatingValue as
          & keyof typeof ratingValue.FHRS
          & keyof typeof ratingValue.FHIS
      ].image_en
    }" alt="Rating Image" style="width: 100%; max-width: 400px; height: auto;">
        ${
      establishment.Geocode !== null
        ? `
        <p>
          Address:
          <address>
            ${establishment.AddressLine1}
            ${
          establishment.AddressLine2 ? `<br>${establishment.AddressLine2}` : ""
        }
            ${
          establishment.AddressLine3 ? `<br>${establishment.AddressLine3}` : ""
        }
            ${
          establishment.AddressLine4 ? `<br>${establishment.AddressLine4}` : ""
        }
            ${establishment.PostCode ? `<br>${establishment.PostCode}` : ""}
            ${
          !(establishment.AddressLine1 ||
              establishment.AddressLine2 ||
              establishment.AddressLine3 ||
              establishment.AddressLine4 ||
              establishment.PostCode)
            ? "No address information available"
            : ""
        }
          </address>
          <a href="${locationLink}" target="_blank">View on Map</a>
        </p>`
        : ""
    }
        <p>Business Type: ${establishment.BusinessType}</p>
        <p>Rating: ${establishment.RatingValue}</p>
        ${
      establishment.RatingDate !== null
        ? `
        <p>Rating Date: <time datetime="${establishment.RatingDate}">${establishment.RatingDate}</time></p>
        `
        : ""
    }
        ${
      establishment.Scores
        ? `
        <p>Hygiene score: ${establishment.Scores.Hygiene} - ${
          scoreToText(establishment.Scores.Hygiene)
        }</p>
        <p>Structural score: ${establishment.Scores.Structural} - ${
          scoreToText(establishment.Scores.Structural)
        }</p>
        <p>Confidence in management score: ${establishment.Scores.ConfidenceInManagement} - ${
          scoreToText(establishment.Scores.ConfidenceInManagement)
        }</p>
        `
        : ""
    }
      </div>
    </div>
  </body>
</html>
`;

    const sanitizedBusinessName = slugify(establishment.BusinessName);
    const filename = `${sanitizedBusinessName}-${establishment.FHRSID}.html`;
    await Deno.writeTextFile(join("dist", filename), html);
  }));
};
