/**
 * @typedef {import("../../generate-site/schema.mts").Establishment} Establishment
 * @typedef {{ businessTypes: Array<{ BusinessTypeId: string | number; BusinessTypeName: string }> }} BusinessTypesResponse
 * @typedef {{ ratings: Array<{ ratingKeyName: string; ratingName: string }> }} RatingsResponse
 * @typedef {{ authorities: Array<{ LocalAuthorityId: string | number; Name: string }> }} AuthoritiesResponse
 * @typedef {{ establishments: Array<Establishment>; meta: { totalCount: number } }} EstablishmentsResponse
 */

/* eslint-disable unicorn/no-top-level-side-effects */
import { EstablishmentList } from "components/establishment-list/establishment-list.mjs";
import { getReference } from "utils/dom.mjs";

// FHRS API Configuration
const API_BASE = "https://api.ratings.food.gov.uk";
const API_HEADERS = {
  accept: "application/json",
  "x-api-version": "2",
};

// DOM Elements
const references = {
  advancedSearch: getReference("#advanced-search", HTMLDivElement),
  advancedToggle: getReference("#advanced-toggle", HTMLButtonElement),
  consentSection: getReference("#consent-section", HTMLDivElement),
  consentToggle: getReference("#consent-toggle", HTMLInputElement),
  loadingIndicator: getReference("#loading", HTMLDivElement),
  resultsContainer: getReference("#results-container", HTMLDivElement),
  resultsCount: getReference("#results-count", HTMLParagraphElement),
  resultsSection: getReference("#results", HTMLDivElement),
  searchForm: getReference("#search-form", HTMLFormElement),
};

// Consent state
const CONSENT_STORAGE_KEY = "fhrs_api_consent";

// Search state
const state = {
  /**
  @type {number | null}
   */
  attentionEffectTimeout: null,
  /**
  @type {EstablishmentList | null}
   */
  establishmentList: null,
  currentPage: 1,
  hasUserConsent: false,
  pageSize: 10,
  searchParams: new URLSearchParams(location.search),
};

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the establishment list component
  // Note: Search results come from the API with server-side pagination,
  // so we don't need client-side filtering/sorting
  state.establishmentList = new EstablishmentList({
    container: references.resultsContainer,
    loadingElement: references.loadingIndicator,
    emptyElement: document.createElement("div"), // We'll handle empty state manually
    errorElement: document.createElement("div"), // We'll handle errors manually
    countElement: references.resultsCount,
    enableDisplay: false, // Disable display component - API handles filtering/sorting
  });

  setupConsentHandling();
  setupEventListeners();

  // Always populate form from URL parameters immediately, regardless of consent
  if (state.searchParams.toString()) {
    populateFormFromURL();
  }

  // Only proceed with API calls if consent is already given
  if (!state.hasUserConsent) {
    return;
  }

  loadReferenceData();

  // Only perform search if consent is given
  if (state.searchParams.toString()) {
    performSearch();
  }
});

/**
 * Sets up consent handling by checking for existing consent,
 * updating the UI accordingly, and adding event listeners for consent changes.
 */
function setupConsentHandling() {
  // Check for existing consent
  const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
  state.hasUserConsent = storedConsent === "true";

  // Update UI based on existing consent
  if (state.hasUserConsent) {
    references.consentToggle.checked = true;
    updateUIForConsent(true);
  } else {
    updateUIForConsent(false);
  }

  // Add event listener for consent toggle
  references.consentToggle.addEventListener("change", () => {
    state.hasUserConsent = references.consentToggle.checked;

    // Store user's choice
    localStorage.setItem(CONSENT_STORAGE_KEY, String(state.hasUserConsent));

    updateUIForConsent(state.hasUserConsent);

    if (!state.hasUserConsent) {
      return;
    }

    loadReferenceData();

    // If search params don't exist, we don't need to perform a search
    if (!state.searchParams.toString()) {
      return;
    }

    populateFormFromURL();
    performSearch();
  });
}

/**
 * Updates the UI based on whether the user has given consent
 *
 * @param {boolean} hasConsent - Whether the user has given consent
 */
function updateUIForConsent(hasConsent) {
  // Update form styling to show active state
  if (hasConsent) {
    references.searchForm.classList.add("consent-given");
    references.searchForm.classList.remove("disabled");
    references.consentSection.classList.add("consent-given");
  } else {
    references.searchForm.classList.remove("consent-given");
    references.searchForm.classList.add("disabled");
    references.consentSection.classList.remove("consent-given");
  }

  // Enable/disable form fields based on consent
  disableFormElements(!hasConsent);
}

/**
 * Enables or disables all form elements based on consent status
 *
 * @param {boolean} disabled - Whether the form elements should be disabled
 */
function disableFormElements(disabled) {
  // Disable/enable all form inputs
  const formElements =
    /** @type {NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>} */ (
      references.searchForm.querySelectorAll("input, select, button")
    );
  for (const element of formElements) {
    element.disabled = disabled;
  }

  // Also disable the advanced toggle
  if (references.advancedToggle) {
    references.advancedToggle.disabled = disabled;
  }
}

/**
 * Highlights the consent section with animation and scrolls to it
 * Cancels any existing animation and starts a new one
 */
function highlightConsentSection() {
  // Instead of preventing multiple animations, cancel any existing one and start a new one

  // Scroll to consent section
  references.consentSection.scrollIntoView({ behavior: "smooth" });

  // Remove any existing animation class first
  references.consentSection.classList.remove("attention-effect");

  // Force a reflow to ensure animations restart properly
  void references.consentSection.offsetWidth;

  // Add combined animation class for attention effect
  references.consentSection.classList.add("attention-effect");

  // Clear any existing timeout
  if (state.attentionEffectTimeout) {
    clearTimeout(state.attentionEffectTimeout);
  }

  // Remove class after animation completes
  state.attentionEffectTimeout = setTimeout(() => {
    references.consentSection.classList.remove("attention-effect");
  }, 6000); // Match the animation duration
}

/**
 * Sets up all event listeners for the search form
 */
function setupEventListeners() {
  // Toggle advanced search options
  references.advancedToggle.addEventListener("click", () => {
    if (!state.hasUserConsent) {
      highlightConsentSection();
      return;
    }

    references.advancedSearch.removeAttribute("hidden");
    references.advancedToggle.textContent =
      references.advancedSearch.hasAttribute("hidden")
        ? "Advanced Options"
        : "Hide Advanced Options";
  });

  // Search form submission
  references.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    // Only proceed if user has given consent
    if (state.hasUserConsent) {
      state.currentPage = 1;
      updateURLFromForm();
      performSearch();
    } else {
      highlightConsentSection();
    }
  });

  // Add a click event for the entire form
  references.searchForm.addEventListener("click", (event) => {
    if (state.hasUserConsent) {
      return;
    }

    // Call highlight animation when clicking anywhere on the disabled form
    highlightConsentSection();

    // Prevent default actions only for interactive elements (but still allow the click)
    if (
      event.target instanceof Element &&
      ["INPUT", "SELECT", "BUTTON"].includes(event.target.tagName)
    ) {
      event.preventDefault();
    }
  });

  // Make form focusable for keyboard navigation
  references.searchForm.setAttribute("tabindex", "0");

  // Add focus handler for the form
  references.searchForm.addEventListener("focus", () => {
    if (!state.hasUserConsent) {
      highlightConsentSection();
    }
  });
}

/**
 * Loads reference data from the API and populates select dropdowns
 *
 * @returns {Promise<void>}
 */
async function loadReferenceData() {
  // Only proceed if user has given consent
  if (!state.hasUserConsent) return;

  try {
    // Load business types
    const businessTypes = /** @type {BusinessTypesResponse} */ (
      await fetchAPI("/BusinessTypes")
    );
    populateSelect(
      "businessTypeId",
      businessTypes.businessTypes,
      "BusinessTypeId",
      "BusinessTypeName",
    );

    // Load ratings
    const ratings = /** @type {RatingsResponse} */ (await fetchAPI("/Ratings"));
    populateSelect("ratingKey", ratings.ratings, "ratingKeyName", "ratingName");

    // Load authorities
    const authorities = /** @type {AuthoritiesResponse} */ (
      await fetchAPI("/Authorities")
    );
    populateSelect(
      "localAuthorityId",
      authorities.authorities,
      "LocalAuthorityId",
      "Name",
    );
  } catch (error) {
    console.error("Error loading reference data:", error);
  }
}

/**
 * Populates a select element with options from an array of objects
 *
 * @param {string} selectId - The ID of the select element to populate
 * @param {Array<Record<string, string | number>>} options - Array of objects containing option data
 * @param {string} valueKey - The key in each object to use as the option value
 * @param {string} textKey - The key in each object to use as the option text
 */
function populateSelect(selectId, options, valueKey, textKey) {
  const select = document.querySelector(`#${selectId}`);
  if (select) {
    for (const option of options) {
      const element = document.createElement("option");
      element.value = String(option[valueKey]);
      element.textContent = String(option[textKey]);
      select.append(element);
    }
  }
}

/**
 * Updates the URL based on the current form values
 * Creates a query string and updates browser history without reloading
 */
function updateURLFromForm() {
  const formData = new FormData(references.searchForm);
  const parameters = new URLSearchParams();

  // Only add non-empty values
  for (const [key, value] of formData) {
    if (typeof value === "string" && value.trim()) {
      parameters.append(key, value.trim());
    }
  }

  // Add current page if not first page
  if (state.currentPage > 1) {
    parameters.append("pageNumber", String(state.currentPage));
  }

  // Update browser URL without reloading
  const newRelativePathQuery = location.pathname + "?" + parameters.toString();
  history.pushState(null, "", newRelativePathQuery);

  // Update state
  state.searchParams = parameters;
}

/**
 * Populates the form fields from URL parameters
 * Also sets the current page and determines if advanced search should be shown
 */
function populateFormFromURL() {
  // Populate form fields from URL parameters
  for (const [key, value] of state.searchParams.entries()) {
    const field = references.searchForm.elements.namedItem(key);
    if (
      key !== "pageNumber" &&
      (field instanceof HTMLInputElement ||
        field instanceof HTMLSelectElement ||
        field instanceof HTMLTextAreaElement)
    ) {
      field.value = value;
    }
  }

  // Check if we need to show advanced search
  const hasAdvancedParameters = [
    "businessTypeId",
    "ratingKey",
    "localAuthorityId",
  ].some((paramameter) => state.searchParams.has(paramameter));

  if (hasAdvancedParameters) {
    references.advancedSearch.removeAttribute("hidden");
    references.advancedToggle.textContent = "Hide Advanced Options";
  }

  // Set current page
  const pageParameter = state.searchParams.get("pageNumber");
  if (pageParameter) {
    state.currentPage = Number(pageParameter);
  }
}

/**
 * Performs a search using the current search parameters
 *
 * @returns {Promise<void>}
 */
async function performSearch() {
  // Only proceed if user has given consent
  if (!state.hasUserConsent) {
    highlightConsentSection();
    return;
  }

  // Show loading state
  references.resultsSection.removeAttribute("hidden");
  await state.establishmentList?.loadEstablishments(
    {
      establishments: [],
    },
    true,
    0,
  );

  try {
    // Build search query
    const queryParameters = new URLSearchParams(state.searchParams);
    queryParameters.set("pageNumber", state.currentPage.toString());
    queryParameters.set("pageSize", state.pageSize.toString());

    // Fetch results
    const response = /** @type {EstablishmentsResponse} */ (
      await fetchAPI(`/Establishments?${queryParameters.toString()}`)
    );

    const establishments = response.establishments || [];
    const totalResults = response.meta.totalCount;

    // Display results
    await displayResults({
      establishments,
      totalResults,
    });

    // Scroll to results
    references.resultsSection.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error("Search failed:", error);
    await state.establishmentList?.showError(
      "Sorry, there was an error performing your search. Please try again.",
    );
  }
}

/**
 * @typedef {object} DisplayResultsData
 * @property {Array<Establishment>} establishments - Array of establishment objects to display
 * @property {number} totalResults - Total number of results
 */

/**
 * Displays search results using the establishment list component
 *
 * @param {DisplayResultsData} data - Data containing establishments and pagination info
 * @returns {Promise<void>} Resolves when the results are displayed
 */
export const displayResults = async ({ establishments, totalResults }) => {
  // Make sure results section is visible
  references.resultsSection.removeAttribute("hidden");
  references.resultsContainer.removeAttribute("hidden");

  // Load the establishments into the list component
  // Server-side pagination: pass data as-is to the component
  await state.establishmentList?.loadEstablishments(
    {
      establishments,
      totalResults,
      currentPage: state.currentPage,
      pageSize: state.pageSize,
    },
    false,
    establishments.length,
    handlePageChange,
    // No filter callback - API handles filtering
    // No sort callback - API handles sorting
  );
};

/**
 * Handles page changes in the establishment list
 *
 * @param {number} page - The page number to navigate to
 */
export const handlePageChange = async (page) => {
  state.currentPage = page;

  // Update URL to reflect new page
  state.searchParams.set("pageNumber", page.toString());
  const newRelativePathQuery = location.pathname + "?" +
    state.searchParams.toString();
  history.pushState(null, "", newRelativePathQuery);

  // Show loading state but don't hide containing elements
  if (references.loadingIndicator) {
    references.loadingIndicator.removeAttribute("hidden");
  }

  // Fetch new results for this page
  await performSearch();
};

/**
 * Fetches data from the FHRS API
 *
 * @param {string} endpoint - The API endpoint to fetch
 * @returns {Promise<unknown>} The JSON response from the API
 * @throws {Error} If the request fails or user has not given consent
 */
export const fetchAPI = async (endpoint) => {
  // Safety check - don't fetch if no consent
  if (!state.hasUserConsent) {
    throw new Error("Cannot fetch API without user consent");
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: API_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return await response.json();
};
