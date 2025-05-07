import { copy, emptyDir, ensureDir } from "@std/fs";
import { mapConcurrent } from "./generate-site/max-concurrent.mts";
import { outputEstablishmentDetailPage } from "./pages/establishment-detail/establishment-detail.mts";
import { fetchLocalAuthorityData } from "./generate-site/fetch-data.mts";
import { generateSitemap } from "./generate-site/output-sitemap.mts";
import { outputHomepagePage } from "./pages/homepage/homepage.mts";
import * as api from "./ratings-api/rest.mts";
import { outputLocalAuthorityListPage } from "./pages/local-authority-list/local-authority-list.mts";
import { outputLocalAuthoritySitemap } from "./generate-site/output-local-authority-sitemap.mts";
import { outputLocalAuthorityDetailPage } from "./pages/local-authority-detail/local-authority-detail.mts";
import { readLocalAuthorityData } from "./lib/local-authority/local-authority.mts";
import { config } from "./lib/config/config.mts";
import { outputAboutPage } from "./pages/about/about.mts";
import { outputSearchPage } from "./pages/search/search.mts";
import { outputListsPage } from "./pages/lists/lists.mts";
import { outputListDetailPage } from "./pages/list-detail/list-detail.mts";
import { outputListSharedPage } from "./pages/list-shared/list-shared.mts";

// Ensure build/dist directories exist
await ensureDir("build");

await emptyDir("dist");
await ensureDir("dist/about");
await ensureDir("dist/search");
await ensureDir("dist/e");
await ensureDir("dist/l");
await ensureDir("dist/lists");
await ensureDir("dist/lists/detail");
await ensureDir("dist/lists/shared");
await ensureDir("dist/scripts");
await ensureDir("dist/sitemap");
await ensureDir("dist/components");
await ensureDir("dist/components/establishment-card");
await ensureDir("dist/components/establishment-list");

// Copy needed files to dist directory
await copy("assets", "dist", { overwrite: true });
await copy("src/scripts", "dist/scripts", { overwrite: true });

const components = [
  "establishment-card",
  "establishment-list",
  "list-selection-button",
  "modal",
];

for (const component of components) {
  await copy(`src/components/${component}`, `dist/components/${component}`, {
    overwrite: true,
  });
}

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
sitemapXmlContent = sitemapXmlContent.replaceAll("<loc>/", `<loc>${baseURL}/`);
await Deno.writeTextFile(sitemapXmlPath, sitemapXmlContent);

const authoritiesResponse = await api.authorities();
// Use all authorities in CI, otherwise just use the first one
const apiAuthorities = Deno.env.get("CI") ? authoritiesResponse.authorities : [
  authoritiesResponse.authorities.find(
    (authority) => authority.RegionName === "Northern Ireland",
  )!,
  authoritiesResponse.authorities.find(
    (authority) => authority.RegionName === "Scotland",
  )!,
  authoritiesResponse.authorities.find(
    (authority) => authority.RegionName === "Wales",
  )!,
  authoritiesResponse.authorities.find(
    (authority) =>
      ["Northern Ireland", "Scotland", "Wales"].includes(
        authority.RegionName,
      ) === false,
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
  await outputEstablishmentDetailPage(localAuthority, establishments);
  await outputLocalAuthorityDetailPage(localAuthority, establishments);
  await outputLocalAuthoritySitemap(localAuthority, establishments);
  console.timeEnd(timerName);
});
console.timeEnd("mapConcurrent");

console.time("generateSitemap");
await generateSitemap(localAuthorities);
console.timeEnd("generateSitemap");

console.time("outputHomepage");
await outputHomepagePage();
console.timeEnd("outputHomepage");

console.time("outputAbout");
await outputAboutPage();
console.timeEnd("outputAbout");

console.time("outputSearch");
await outputSearchPage();
console.timeEnd("outputSearch");

console.time("outputRegionIndex");
await outputLocalAuthorityListPage(localAuthorities);
console.timeEnd("outputRegionIndex");

console.time("outputListsPages");
await outputListsPage();
await outputListDetailPage();
await outputListSharedPage();
console.timeEnd("outputListsPages");
