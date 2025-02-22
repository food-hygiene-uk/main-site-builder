import { getLinkName } from "../lib/authority/authority.mts";
import { config } from "../lib/config/config.ts";
import { getCanonicalLinkURL } from "../lib/establishment/establishment.ts";
import { EnrichedLocalAuthority } from "./schema-app.ts";
import { Establishment } from "./schema.ts";

// Function to generate sitemap
export const outputLocalAuthoritySitemap = async (
  localAuthority: EnrichedLocalAuthority,
  establishments: Establishment[],
) => {
  const baseUrl = config.BASE_URL;

  let sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const establishment of establishments) {
    sitemap += `  <url>\n    <loc>${baseUrl}${
      getCanonicalLinkURL(establishment)
    }</loc>\n  </url>\n`;
  }

  sitemap += `</urlset>`;
  await Deno.writeTextFile(
    `dist/sitemap/l-${getLinkName(localAuthority)}.xml`,
    sitemap,
  );
  console.log("Sitemap generated successfully!");
};
