import { fromFileUrl, join } from "@std/path";
import { forgeRoot } from "../../components/root/forge.mts";
import { forgeHeader } from "../../components/header/forge.mts";
import { forgeFooter } from "../../components/footer/forge.mts";
import { Address } from "../../components/address/forge.mts";
import { getClassSuffix } from "../../lib/template/template.mts";

const Root = forgeRoot();
const Header = forgeHeader();
const Footer = forgeFooter();
const address = Address();

export const outputSearchPage = async () => {
  const classSuffix = getClassSuffix();

  // Read the CSS and JS files
  const cssPath = fromFileUrl(import.meta.resolve("./styles.css"));
  const cssContent = Deno.readTextFileSync(cssPath);

  const jsPath = fromFileUrl(import.meta.resolve("./script.mjs"));
  const jsContent = Deno.readTextFileSync(jsPath);

  const processedCss = cssContent.replace(/__CLASS_SUFFIX__/g, classSuffix)
    .replace(/\/\* __ADDITIONAL_CSS__ \*\//g, `\n${address.css}`);

  const pageCSS = processedCss;
  const processedJs = jsContent.replace(/__CLASS_SUFFIX__/g, classSuffix);

  const html = `
<!DOCTYPE html>
<html lang="en">
${
    Root.renderHead({
      canonical: "https://food-hygiene-ratings.uk/search",
      title: "Search Food Hygiene Ratings",
      pageCSS,
      headerCSS: Header.css,
      footerCSS: Footer.css,
    })
  }
  <body>
    ${Header.html}
    <div class="content-${classSuffix}">
      <div class="container">
        <h1>Search Food Establishments</h1>
        
        <form id="searchForm" class="search-form">
          <div class="search-fields basic-search">
            <div class="search-field">
              <label for="name">Business Name:</label>
              <input type="text" id="name" name="name" placeholder="e.g. Cafe, Restaurant">
            </div>
            
            <div class="search-field">
              <label for="address">Address:</label>
              <input type="text" id="address" name="address" placeholder="e.g. High Street, Birmingham">
            </div>

            <div class="search-actions">
              <button type="submit">Search</button>
              <button type="button" id="advancedToggle">Advanced Options</button>
            </div>
          </div>
          
          <div class="search-fields advanced-search" id="advancedSearch">
            <div class="search-field">
              <label for="businessTypeId">Business Type:</label>
              <select id="businessTypeId" name="businessTypeId">
                <option value="">Any business type</option>
                <!-- Will be populated via JS -->
              </select>
            </div>
            
            <div class="search-field">
              <label for="ratingKey">Rating:</label>
              <select id="ratingKey" name="ratingKey">
                <option value="">Any rating</option>
                <!-- Will be populated via JS -->
              </select>
            </div>
            
            <div class="search-field">
              <label for="localAuthorityId">Local Authority:</label>
              <select id="localAuthorityId" name="localAuthorityId">
                <option value="">Any authority</option>
                <!-- Will be populated via JS -->
              </select>
            </div>
          </div>
        </form>
        
        <!-- Consent section (inline) -->
        <div id="consentSection" class="consent-section">
          <div class="consent-container">
            <h2>External Data Connection Required</h2>
            <div class="consent-details">
              <p>When you use this search form, your queries and IP address will be sent to the Food Standards Agency's servers. In return, you'll receive establishment details matching your search criteria.</p>
            </div>
            <div class="privacy-notice">
              Please review the <a href="https://www.food.gov.uk/about-us/privacy-policy" target="_blank" rel="noopener">Food Standards Agency Privacy Policy</a> for information on how your data is processed.
            </div>
            
            <div class="consent-toggle">
              <label for="consentToggle" class="toggle-switch">
                <span class="toggle-label">I consent to connect to the external API:</span>
                <div class="toggle-container">
                  <input type="checkbox" id="consentToggle">
                  <span class="toggle-slider"></span>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <div id="loading" class="loading">Searching...</div>
        
        <div id="results" class="results">
          <div class="results-info">
            <p id="resultsCount"></p>
            <div id="pagination" class="pagination"></div>
          </div>
          <div id="resultsContainer" class="establishments-container"></div>
        </div>
      </div>
    </div>
    ${Footer.html}
    
    <script type="module">
      ${processedJs}
    </script>
  </body>
</html>
`;

  // Write the main search page
  await Deno.writeTextFile(join("dist", "search", "index.html"), html);
};
