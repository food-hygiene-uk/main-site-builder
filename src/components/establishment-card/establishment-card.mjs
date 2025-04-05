import recentEstablishmentsService from "scripts/recent-establishments-service.mjs";

/**
 * @typedef {import("scripts/recent-establishments-service.mjs").MinimalEstablishment} MinimalEstablishment
 * @typedef {import("../../generate-site/schema.mts").Establishment} Establishment
 */

// FHRS API Configuration
const API_BASE = "https://api.ratings.food.gov.uk";
const API_HEADERS = {
  "accept": "application/json",
  "x-api-version": "2",
};

/**
 * Formats a date as a relative time (e.g., "2 days ago")
 * @param {string} date - ISO date string to format
 * @returns {string} Formatted relative time string
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 30) {
    return `${Math.floor(diffDay / 30)} months ago`;
  } else if (diffDay > 0) {
    return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  } else if (diffHour > 0) {
    return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  } else if (diffMin > 0) {
    return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  } else {
    return "just now";
  }
}

/**
 * Formats a date string into a human-readable format
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string or "Not available" if no date
 */
export function formatDate(dateString) {
  if (!dateString) return "Not available";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Creates a URL-friendly slug from a text string
 *
 * @param {string} text - The text to convert to a slug
 * @returns {string} URL-friendly slug
 */
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Encodes HTML special characters to prevent XSS
 *
 * @param {string} str - String to encode
 * @returns {string} HTML encoded string
 */
function htmlEncode(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Fetches establishment details from the FHRS API
 *
 * @param {string|number} FHRSID - The FHRSID of the establishment
 * @returns {Promise<Establishment|null>} The establishment data or null if not found
 */
const fetchEstablishmentDetails = async (FHRSID) => {
  try {
    const response = await fetch(`${API_BASE}/Establishments/${FHRSID}`, {
      headers: API_HEADERS,
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch establishment ${FHRSID}: ${response.status}`,
      );
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching establishment ${FHRSID}:`, error);
    return null;
  }
};

/**
 * Hydrates an establishment
 *
 * @param {Establishment|MinimalEstablishment} establishment - The establishment to hydrate
 * @returns {Promise<Establishment|null>} Promise resolving to the hydrated establishment details
 */
const getHydratedEstablishment = async (establishment) => {
  // Extract the FHRSID
  const FHRSID = establishment.FHRSID;

  // Check if we need to fetch additional data
  if (!establishment.RatingKey) {
    try {
      // Simply fetch and return the API data without modifications
      return await fetchEstablishmentDetails(FHRSID);
    } catch (error) {
      console.error("Error fetching establishment details:", error);
      return null;
    }
  }

  // Already have complete data
  return establishment;
};

/**
 * Renders an establishment card
 *
 * @param {Establishment|MinimalEstablishment} establishment - The establishment to render
 * @returns {Promise<HTMLElement>} Promise resolving to the rendered establishment card element
 */
export async function renderEstablishmentCard(establishment) {
  // Extract the FHRSID and any metadata before hydration
  const FHRSID = establishment.FHRSID;

  if (!FHRSID) {
    console.error("Missing FHRSID for establishment:", establishment);
    return document.createElement("div");
  }

  // Get last visited time from service or original data
  const lastVisited = recentEstablishmentsService.getLastVisitedTime(FHRSID);

  const hydratedEstablishment = await getHydratedEstablishment(establishment);

  if (!hydratedEstablishment) {
    console.error("Failed to get establishment details:", FHRSID);
    return document.createElement("div");
  }

  // Create the card element
  const item = document.createElement("div");
  item.className = "establishment";
  item.dataset.establishmentId = FHRSID;

  // Create content
  const nameElem = document.createElement("h3");
  nameElem.textContent = htmlEncode(hydratedEstablishment.BusinessName);
  item.appendChild(nameElem);

  const details = document.createElement("div");
  details.className = "establishment-details";

  // Left column
  const leftCol = document.createElement("div");

  if (hydratedEstablishment.BusinessType) {
    const typeElem = document.createElement("p");
    typeElem.className = "business-type";
    typeElem.textContent = hydratedEstablishment.BusinessType;
    leftCol.appendChild(typeElem);
  }

  // Address if available
  if (
    hydratedEstablishment.AddressLine1 || hydratedEstablishment.AddressLine2 ||
    hydratedEstablishment.AddressLine3 || hydratedEstablishment.AddressLine4 ||
    hydratedEstablishment.PostCode
  ) {
    // Create address from address lines
    const addressParts = [];
    if (hydratedEstablishment.AddressLine1) {
      addressParts.push(hydratedEstablishment.AddressLine1);
    }
    if (hydratedEstablishment.AddressLine2) {
      addressParts.push(hydratedEstablishment.AddressLine2);
    }
    if (hydratedEstablishment.AddressLine3) {
      addressParts.push(hydratedEstablishment.AddressLine3);
    }
    if (hydratedEstablishment.AddressLine4) {
      addressParts.push(hydratedEstablishment.AddressLine4);
    }
    if (hydratedEstablishment.PostCode) {
      addressParts.push(hydratedEstablishment.PostCode);
    }

    if (addressParts.length > 0) {
      const addressElem = document.createElement("address");
      addressElem.textContent = addressParts.join(", ");
      leftCol.appendChild(addressElem);
    }
  }

  // Right column
  const rightCol = document.createElement("div");

  // Rating information
  const rating = hydratedEstablishment.RatingValue;
  if (rating) {
    const ratingClass = `rating-${rating}`;
    const ratingText = `Rating: ${rating}`;

    const ratingP = document.createElement("p");
    const badge = document.createElement("span");
    badge.className = `rating-badge ${ratingClass}`;
    badge.textContent = ratingText;
    ratingP.appendChild(badge);
    rightCol.appendChild(ratingP);

    // Rating date if available
    const ratingDate = hydratedEstablishment.RatingDate;
    if (ratingDate) {
      const dateP = document.createElement("p");
      dateP.textContent = `Last inspection: ${formatDate(ratingDate)}`;
      rightCol.appendChild(dateP);
    }
  }

  // Last visited info
  if (lastVisited) {
    const visitedP = document.createElement("p");
    visitedP.className = "viewed-time";
    visitedP.textContent = `Viewed ${formatRelativeTime(lastVisited)}`;
    rightCol.appendChild(visitedP);
  }

  details.appendChild(leftCol);
  details.appendChild(rightCol);
  item.appendChild(details);

  // Create the link that covers the entire establishment
  const link = document.createElement("a");
  link.href = `/e/${
    slugify(hydratedEstablishment.BusinessName)
  }-${hydratedEstablishment.FHRSID}`;
  link.className = "details-link";
  link.textContent = "View details";
  item.appendChild(link);

  return item;
}
