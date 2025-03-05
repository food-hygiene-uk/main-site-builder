import { copy, emptyDir, ensureDir } from "@std/fs";
import { mapConcurrent } from "./generate-site/max-concurrent.mts";
import { outputLocalAuthorityEstablishments } from "./generate-site/output-local-authority-establishments.mts";
import { fetchLocalAuthorityData } from "./generate-site/fetch-data.mts";
import { generateSitemap } from "./generate-site/output-sitemap.mts";
import { outputHomepage } from "./generate-site/output-homepage.mts";
import * as api from "./ratings-api/rest.mts";
import { outputRegionIndex } from "./generate-site/output-region-index.mts";
import { outputLocalAuthoritySitemap } from "./generate-site/output-local-authority-sitemap.mts";
import { outputLocalAuthorityIndex } from "./generate-site/output-local-authority-index.mts";
import { readLocalAuthorityData } from "./lib/local-authority/local-authority.mts";
import { config } from "./lib/config/config.mts";

// Ensure build/dist directories exist
await ensureDir("build");

await emptyDir("dist");
await ensureDir("dist/e");
await ensureDir("dist/l");
await ensureDir("dist/sitemap");

await copy("assets", "dist", { overwrite: true });

const baseURL = config.BASE_URL;

// Update robots.txt to include BASE_URL
const robotsTxtPath = "dist/robots.txt";
let robotsTxtContent = await Deno.readTextFile(robotsTxtPath);
robotsTxtContent = robotsTxtContent.replace(
  /Sitemap: \//,
  `Sitemap: ${baseURL}/`,
);
await Deno.writeTextFile(robotsTxtPath, robotsTxtContent);

// Update sitemap.xml to include BASE_URL
const sitemapXmlPath = "dist/sitemap.xml";
let sitemapXmlContent = await Deno.readTextFile(sitemapXmlPath);
sitemapXmlContent = sitemapXmlContent.replaceAll(
  /<loc>\//g,
  `<loc>${baseURL}/`,
);
await Deno.writeTextFile(sitemapXmlPath, sitemapXmlContent);

const authoritiesResponse = await api.authorities();
// Use all authorities in CI, otherwise just use the first one
const apiAuthorities = Deno.env.get("CI") ? authoritiesResponse.authorities : [
  authoritiesResponse.authorities.find((authority) =>
    authority.RegionName === "Northern Ireland"
  )!,
  authoritiesResponse.authorities.find((authority) =>
    authority.RegionName === "Scotland"
  )!,
  authoritiesResponse.authorities.find((authority) =>
    authority.RegionName === "Wales"
  )!,
  authoritiesResponse.authorities.find((authority) =>
    ["Northern Ireland", "Scotland", "Wales"].includes(authority.RegionName) ===
      false
  )!,
];

console.time("fetchLocalAuthorityData");
const localAuthorities = await fetchLocalAuthorityData(apiAuthorities);
console.timeEnd("fetchLocalAuthorityData");

console.time("mapConcurrent");
await mapConcurrent(localAuthorities, 10, async (localAuthority) => {
  const name = localAuthority.Name;
  const establishments = await readLocalAuthorityData(localAuthority);

  const timerName = `outputLocalAuthority-${name}`;
  console.time(timerName);
  await outputLocalAuthorityEstablishments(localAuthority, establishments);
  await outputLocalAuthorityIndex(localAuthority, establishments);
  await outputLocalAuthoritySitemap(localAuthority, establishments);
  console.timeEnd(timerName);
});
console.timeEnd("mapConcurrent");

console.time("generateSitemap");
await generateSitemap(localAuthorities);
console.timeEnd("generateSitemap");

console.time("outputHomepage");
await outputHomepage();
console.timeEnd("outputHomepage");

console.time("outputRegionIndex");
await outputRegionIndex(localAuthorities);
console.timeEnd("outputRegionIndex");
