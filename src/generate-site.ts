import { copy, emptyDir, ensureDir } from "@std/fs";
import { mapConcurrent } from "./generate-site/max-concurrent.ts";
import { outputLocalAuthorityEstablishments } from "./generate-site/output-local-authority-establishments.ts";
import { fetchLocalAuthorityData } from "./generate-site/fetch-data.ts";
import { generateSitemap } from "./generate-site/output-sitemap.ts";
import { outputHomepage } from "./generate-site/output-homepage.ts";
import * as api from "./ratings-api/rest.ts";
import { outputRegionIndex } from "./generate-site/output-region-index.ts";
import { outputLocalAuthoritySitemap } from "./generate-site/output-local-authority-sitemap.ts";
import { outputLocalAuthorityIndex } from "./generate-site/output-local-authority-index.ts";
import { readLocalAuthorityData } from "./lib/local-authority/local-authority.ts";

// Ensure build/dist directories exist
await ensureDir("build");

await emptyDir("dist");
await ensureDir("dist/e");
await ensureDir("dist/l");
await ensureDir("dist/sitemap");

await copy("assets", "dist", { overwrite: true });

const authoritiesResponse = await api.authorities();
// Use all authorities in CI, otherwise just use the first one
const apiAuthorities = Deno.env.get("CI")
  ? authoritiesResponse.authorities
  : [authoritiesResponse.authorities[0]];

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
