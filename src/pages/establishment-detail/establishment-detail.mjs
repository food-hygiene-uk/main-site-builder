import recentEstablishmentsService from "scripts/recent-establishments-service.mjs";
import { renderListSelectionButton } from "components/list-selection-button/list-selection-button.mjs";

document.addEventListener("DOMContentLoaded", () => {
  // Find the establishment element and extract data
  const establishmentElement = document.querySelector(".establishment");
  if (!establishmentElement) return;

  const establishmentId = establishmentElement.getAttribute(
    "data-establishment-id",
  );

  if (!establishmentId) return;

  // Get the business name from the h1 element
  const businessNameElement = establishmentElement.querySelector("h1.name");
  const businessName = businessNameElement
    ? businessNameElement.textContent.trim()
    : "";

  // Get the business type if available
  const businessTypeElement = establishmentElement.querySelector(
    "div[itemprop='servesCuisine']",
  );
  const businessType = businessTypeElement
    ? businessTypeElement.textContent.trim()
    : "";

  // Add this establishment to the recently viewed list with name and type
  recentEstablishmentsService.addEstablishment({
    FHRSID: establishmentId,
    BusinessName: businessName,
    BusinessType: businessType,
  });

  // Load and display recently viewed establishments (excluding current one)
  displayRecentlyViewed(establishmentId);

  // Update the "Add to List" button to match the new design with a bookmark icon and "Save" text
  if (businessNameElement) {
    const wrapper = document.querySelector(".establishment-header");
    const listSelectionButton = renderListSelectionButton(establishmentId);

    wrapper.appendChild(listSelectionButton);
  }
});

/**
 * Displays recently viewed establishments excluding the current one
 *
 * @param {string} currentId - The ID of the current establishment to exclude
 */
const displayRecentlyViewed = (currentId) => {
  const recentSection = document.getElementById("recentlyViewed");
  const recentContainer = document.getElementById("recentEstablishments");

  if (!recentSection || !recentContainer) return;

  // Get all recent establishments and filter out the current one
  const allRecent = recentEstablishmentsService.getRecentEstablishments();
  const recentToShow = allRecent.filter((est) => est.FHRSID !== currentId);

  // Only show section if we have other recent establishments
  if (recentToShow.length === 0) return;

  // Show maximum 4 recent establishments
  const recentLimit = recentToShow.slice(0, 4);

  // Create HTML for each recent establishment
  recentLimit.forEach((establishment) => {
    // Create link that will wrap the entire item
    const link = document.createElement("a");
    link.href = `/e/${
      slugify(establishment.BusinessName)
    }-${establishment.FHRSID}`;
    link.className = "establishment-link";

    // Create container
    const item = document.createElement("div");
    item.className = "recent-establishment-item";

    // Create content wrapper to help with consistent height
    const contentWrapper = document.createElement("div");
    contentWrapper.className = "content-wrapper";

    // Add content - Use the stored name or a fallback
    const name = document.createElement("h3");
    name.className = "establishment-name";
    name.textContent = establishment.BusinessName || "Unknown Establishment";

    // business type
    const type = document.createElement("p");
    type.className = "business-type";
    type.textContent = establishment.BusinessType;

    // Footer section for the visited time
    const footer = document.createElement("div");
    footer.className = "card-footer";

    const visitedTime = document.createElement("p");
    visitedTime.className = "visited-time";
    visitedTime.textContent = formatRelativeTime(establishment.lastVisited);

    // Assemble the structure
    contentWrapper.appendChild(name);
    contentWrapper.appendChild(type);

    footer.appendChild(visitedTime);

    item.appendChild(contentWrapper);
    item.appendChild(footer);

    // Add item to link (making the entire card clickable)
    link.appendChild(item);

    // Add to container
    recentContainer.appendChild(link);
  });

  // Show the recently viewed section
  recentSection.style.display = "block";
};

/**
 * Formats a date as a relative time (e.g., "2 days ago")
 *
 * @param {string} date - ISO date string to format
 * @returns {string} Formatted relative time string
 */
const formatRelativeTime = (date) => {
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
};

/**
 * Creates a URL-friendly slug from a text string
 *
 * @param {string} text - The text to convert to a slug
 * @returns {string} URL-friendly slug
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};
