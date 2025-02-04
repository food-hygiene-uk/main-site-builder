import { EnrichedLocalAuthority } from "./schema-app.ts";

// Function to generate sitemap
export const generateSitemap = async (
  localAuthorities: EnrichedLocalAuthority[],
) => {
  const baseUrl = "https://food-hygiene-ratings-uk.github.io";

  const localAuthoritySitemaps = [];
  const localAuthorityIndexes = [];

  for await (const localAuthority of localAuthorities) {
    localAuthoritySitemaps.push(
      `  <sitemap>\n    <loc>${baseUrl}/sitemap/l-${localAuthority.FriendlyName}.xml</loc>\n  </sitemap>`,
    );

    localAuthorityIndexes.push(
      `  <url>\n    <loc>${baseUrl}/l/${localAuthority.FriendlyName}.html</loc>\n  </url>\n`,
    );
  }

  let sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  sitemap += localAuthoritySitemaps.join("");
  sitemap += `</sitemapindex>`;
  await Deno.writeTextFile(
    "dist/sitemap/local-authority-establishments.xml",
    sitemap,
  );

  sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  sitemap += localAuthorityIndexes.join("");
  sitemap += `</urlset>`;
  await Deno.writeTextFile("dist/sitemap/local-authority-indexes.xml", sitemap);

  console.log("Sitemap generated successfully!");
};
