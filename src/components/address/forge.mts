import { fromFileUrl } from "@std/path";
import { Establishment } from "../../generate-site/schema.mts";
import { getClassSuffix } from "../../lib/template/template.mts";

// Read the file using the absolute path
const cssPath = fromFileUrl(
  import.meta.resolve("./styles.css"),
);
const cssContent = Deno.readTextFileSync(cssPath);

export const Address = () => {
  const classSuffix = getClassSuffix();
  const processedCss = cssContent.replace(/__CLASS_SUFFIX__/g, classSuffix);

  const css = processedCss;

  const render = (establishment: Establishment): string => {
    let address = "<div>No address information available</div>";

    if (establishment.Geocode !== null) {
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

      address = `
        <address itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">
            ${
        addressLines.length > 0
          ? addressLines
          : "No address information available"
      }
        </address>
        <a href="${locationLink}" target="_blank" rel="noopener noreferrer" class="map-link">View on Map</a>
        `;
    }

    return `
        <div class="component-address-${classSuffix}" data-suffix="${classSuffix}">
            ${address}
        </div>
    `;
  };

  return {
    css,
    render,
  };
};
