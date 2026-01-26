import recentEstablishmentsService from "scripts/recent-establishments-service.mjs";
import { renderListSelectionButton } from "components/list-selection-button/list-selection-button.mjs";
import { lacToRegionSlug } from "scripts/region.mjs";

/**
 * Dynamically loads a CSS file into the document
 *
 * @param {string} href - URL of the CSS file to load
 * @returns {Promise<void>} Promise that resolves when the CSS is loaded
 */
const loadCSS = (href) => {
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.addEventListener("load", () => resolve());
    link.addEventListener(
      "error",
      () => reject(new Error(`Failed to load CSS: ${href}`)),
    );
    document.head.append(link);
  });
};

/**
 * Dynamically loads a JavaScript file
 *
 * @param {string} source - URL of the JavaScript file to load
 * @returns {Promise<void>} Promise that resolves when the script is loaded
 */
const loadScript = (source) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = source;
    script.addEventListener("load", () => resolve());
    script.addEventListener(
      "error",
      () => reject(new Error(`Failed to load script: ${source}`)),
    );
    document.head.append(script);
  });
};

/**
 * Initializes and displays a Leaflet map with OpenStreetMap tiles
 *
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 */
const initializeMap = async (latitude, longitude) => {
  const mapContainer = document.querySelector("#map");

  if (!mapContainer) return;

  // Initialize the map centered on the establishment
  const map = globalThis.L.map("map").setView([latitude, longitude], 17);

  // Add OpenStreetMap tiles
  globalThis.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  }).addTo(map);

  // Show scale bar
  globalThis.L.control.scale({ imperial: true, metric: true }).addTo(map);

  // Add a marker at the establishment location
  globalThis.L.marker([latitude, longitude])
    .bindPopup("Establishment Location")
    .addTo(map);

  mapContainer.classList.add("loaded");
};

/**
 * Loads Leaflet library and initializes the map
 *
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 */
const loadAndInitializeMap = async (latitude, longitude) => {
  try {
    // Load Leaflet CSS and JS
    await loadCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
    await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");

    // Initialize the map once Leaflet is loaded
    await initializeMap(latitude, longitude);
  } catch (error) {
    console.error("Error loading map:", error);
    alert("Failed to load map. Please try again later.");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Find the establishment element and extract data
  const establishmentElement = document.querySelector(".establishment");
  if (!establishmentElement) return;

  const establishmentId = establishmentElement.dataset.establishmentId;

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

    wrapper.append(listSelectionButton);
  }

  // Set up map loading
  const loadMapButton = document.querySelector("#loadMapBtn");
  const alwaysLoadCheckbox = document.querySelector("#alwaysLoadMaps");
  const mapConsentBox = document.querySelector(".map-consent-box");

  if (loadMapButton && alwaysLoadCheckbox) {
    // Check if user has set preference to always load maps
    const alwaysLoadMaps = localStorage.getItem("alwaysLoadMaps") === "true";
    alwaysLoadCheckbox.checked = alwaysLoadMaps;

    // Handle checkbox change
    alwaysLoadCheckbox.addEventListener("change", () => {
      localStorage.setItem(
        "alwaysLoadMaps",
        alwaysLoadCheckbox.checked.toString(),
      );
    });

    /**
     * Loads the map and handles UI cleanup
     */
    const loadMap = async () => {
      const latitude = Number(loadMapButton.dataset.lat);
      const longitude = Number(loadMapButton.dataset.lon);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        console.error("Invalid coordinates");
        return;
      }

      // Show loading state
      if (mapConsentBox) {
        mapConsentBox.style.opacity = "0.6";
        loadMapButton.disabled = true;
        loadMapButton.textContent = "Loading Map...";
      }

      await loadAndInitializeMap(latitude, longitude);

      // Remove consent box after map loads (Leaflet replaces the container content)
      if (mapConsentBox) {
        mapConsentBox.remove();
      }
    };

    // Auto-load if preference is set
    if (alwaysLoadMaps) {
      loadMap();
    } else {
      // Set up manual load button
      loadMapButton.addEventListener("click", loadMap);
    }
  }
});

/**
 * Displays recently viewed establishments excluding the current one
 *
 * @param {string} currentId - The ID of the current establishment to exclude
 */
const displayRecentlyViewed = (currentId) => {
  const recentSection = document.querySelector("#recentlyViewed");
  const recentContainer = document.querySelector("#recentEstablishments");

  if (!recentSection || !recentContainer) return;

  // Get all recent establishments and filter out the current one
  const allRecent = recentEstablishmentsService.getRecentEstablishments();
  const recentToShow = allRecent.filter((est) => est.FHRSID !== currentId);

  // Only show section if we have other recent establishments
  if (recentToShow.length === 0) return;

  // Show maximum 4 recent establishments
  const recentLimit = recentToShow.slice(0, 4);

  // Create HTML for each recent establishment
  for (const establishment of recentLimit) {
    // Create link that will wrap the entire item
    const link = document.createElement("a");
    link.href = `/region-${lacToRegionSlug[establishment.LocalAuthorityCode]}/${
      slugify(
        establishment.BusinessName,
      )
    }-${establishment.FHRSID}`;
    link.className = "establishment-link";

    // Create container
    const item = document.createElement("div");
    item.className = "recent-establishment-item box-shadow-hover";
    item.dataset.establishmentId = establishment.FHRSID;

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
    contentWrapper.append(name);
    contentWrapper.append(type);

    footer.append(visitedTime);

    item.append(contentWrapper);
    item.append(footer);

    // Add item to link (making the entire card clickable)
    link.append(item);

    // Add to container
    recentContainer.append(link);
  }

  // Show the recently viewed section
  recentSection.hidden = false;
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
    .replaceAll(/\s+/g, "-")
    .replaceAll(/[^\w\-]+/g, "")
    .replaceAll(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};
