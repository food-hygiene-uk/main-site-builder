import {
  getCanonicalLinkURL,
  getLinkName,
} from "../lib/authority/authority.mts";
import { config } from "../lib/config/config.mts";
import { EnrichedLocalAuthority } from "./schema-app.mts";

// Function to generate sitemap
export const generateSitemap = async (
  localAuthorities: EnrichedLocalAuthority[],
) => {
  const baseUrl = config.BASE_URL;

  const localAuthoritySitemaps = [];
  const localAuthorityIndexes = [];

  for await (const localAuthority of localAuthorities) {
    localAuthoritySitemaps.push(
      `<sitemap><loc>${baseUrl}/sitemap/l-${
        getLinkName(
          localAuthority,
        )
      }.xml</loc></sitemap>`,
    );

    localAuthorityIndexes.push(
      `<url><loc>${getCanonicalLinkURL(localAuthority)}</loc></url>`,
    );
  }

  let sitemap =
    `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  sitemap += localAuthoritySitemaps.join("");
  sitemap += `</sitemapindex>`;
  await Deno.writeTextFile(
    "dist/sitemap/local-authority-establishments.xml",
    sitemap,
  );

  sitemap =
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  sitemap += localAuthorityIndexes.join("");
  sitemap += `</urlset>`;
  await Deno.writeTextFile("dist/sitemap/local-authority-indexes.xml", sitemap);

  console.log("Sitemap generated successfully!");
};
