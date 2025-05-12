import { EstablishmentList } from "components/establishment-list/establishment-list.mjs";

// FHRS API Configuration
const API_BASE = "https://api.ratings.food.gov.uk";
const API_HEADERS = {
  accept: "application/json",
  "x-api-version": "2",
};

// DOM Elements
const searchForm = document.querySelector("#search-form");
const advancedToggle = document.querySelector("#advanced-toggle");
const advancedSearch = document.querySelector("#advanced-search");
const loadingIndicator = document.querySelector("#loading");
const resultsContainer = document.querySelector("#results-container");
const resultsSection = document.querySelector("#results");
const resultsCount = document.querySelector("#results-count");
const consentSection = document.querySelector("#consent-section");
const consentToggle = document.querySelector("#consent-toggle");

// Establishment list component
let establishmentList;

// Consent state
const CONSENT_STORAGE_KEY = "fhrs_api_consent";
let userConsent = false;

// Search state
const state = {
  currentPage: 1,
  pageSize: 10,
  searchParams: new URLSearchParams(globalThis.location.search),
};

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the establishment list component
  establishmentList = new EstablishmentList({
    container: resultsContainer,
    loadingElement: loadingIndicator,
    emptyElement: document.createElement("div"), // We'll handle empty state manually
    errorElement: document.createElement("div"), // We'll handle errors manually
    countElement: resultsCount,
    pageSize: state.pageSize,
  });

  setupConsentHandling();
  setupEventListeners();

  // Always populate form from URL parameters immediately, regardless of consent
  if (state.searchParams.toString()) {
    populateFormFromURL();
  }

  // Only proceed with API calls if consent is already given
  if (userConsent) {
    loadReferenceData();

    // Only perform search if consent is given
    if (state.searchParams.toString()) {
      performSearch();
    }
  }
});

/**
 * Sets up consent handling by checking for existing consent,
 * updating the UI accordingly, and adding event listeners for consent changes.
 */
function setupConsentHandling() {
  // Check for existing consent
  const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
  userConsent = storedConsent === "true";

  // Update UI based on existing consent
  if (userConsent) {
    consentToggle.checked = true;
    updateUIForConsent(true);
  } else {
    updateUIForConsent(false);
  }

  // Add event listener for consent toggle
  consentToggle.addEventListener("change", () => {
    userConsent = consentToggle.checked;

    // Store user's choice
    localStorage.setItem(CONSENT_STORAGE_KEY, userConsent);

    updateUIForConsent(userConsent);

    if (userConsent) {
      loadReferenceData();

      // If search params exist in URL, perform search
      if (state.searchParams.toString()) {
        populateFormFromURL();
        performSearch();
      }
    }
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
    searchForm.classList.add("consent-given");
    searchForm.classList.remove("disabled");
    consentSection.classList.add("consent-given");
  } else {
    searchForm.classList.remove("consent-given");
    searchForm.classList.add("disabled");
    consentSection.classList.remove("consent-given");
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
  const formElements = searchForm.querySelectorAll("input, select, button");
  for (const element of formElements) {
    element.disabled = disabled;
  }

  // Also disable the advanced toggle
  if (advancedToggle) {
    advancedToggle.disabled = disabled;
  }
}

/**
 * Highlights the consent section with animation and scrolls to it
 * Cancels any existing animation and starts a new one
 */
function highlightConsentSection() {
  // Instead of preventing multiple animations, cancel any existing one and start a new one

  // Scroll to consent section
  consentSection.scrollIntoView({ behavior: "smooth" });

  // Remove any existing animation class first
  consentSection.classList.remove("attention-effect");

  // Force a reflow to ensure animations restart properly
  void consentSection.offsetWidth;

  // Add combined animation class for attention effect
  consentSection.classList.add("attention-effect");

  // Clear any existing timeout
  if (globalThis.attentionEffectTimeout) {
    clearTimeout(globalThis.attentionEffectTimeout);
  }

  // Remove class after animation completes
  globalThis.attentionEffectTimeout = setTimeout(() => {
    consentSection.classList.remove("attention-effect");
  }, 6000); // Match the animation duration
}

/**
 * Sets up all event listeners for the search form
 */
function setupEventListeners() {
  // Toggle advanced search options
  advancedToggle.addEventListener("click", () => {
    if (!userConsent) {
      highlightConsentSection();
      return;
    }

    advancedSearch.style.display = advancedSearch.style.display === "grid"
      ? "none"
      : "grid";
    advancedToggle.textContent = advancedSearch.style.display === "grid"
      ? "Hide Advanced Options"
      : "Advanced Options";
  });

  // Search form submission
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    // Only proceed if user has given consent
    if (userConsent) {
      state.currentPage = 1;
      updateURLFromForm();
      performSearch();
    } else {
      highlightConsentSection();
    }
  });

  // Add a click event for the entire form
  searchForm.addEventListener("click", (event) => {
    if (!userConsent) {
      // Call highlight animation when clicking anywhere on the disabled form
      highlightConsentSection();

      // Prevent default actions only for interactive elements (but still allow the click)
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "SELECT" ||
        event.target.tagName === "BUTTON"
      ) {
        event.preventDefault();
      }
    }
  });

  // Make form focusable for keyboard navigation
  searchForm.setAttribute("tabindex", "0");

  // Add focus handler for the form
  searchForm.addEventListener("focus", () => {
    if (!userConsent) {
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
  if (!userConsent) return;

  try {
    // Load business types
    const businessTypes = await fetchAPI("/BusinessTypes");
    populateSelect(
      "businessTypeId",
      businessTypes.businessTypes,
      "BusinessTypeId",
      "BusinessTypeName",
    );

    // Load ratings
    const ratings = await fetchAPI("/Ratings");
    populateSelect("ratingKey", ratings.ratings, "ratingKeyName", "ratingName");

    // Load authorities
    const authorities = await fetchAPI("/Authorities");
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
 * @param {Array<object>} options - Array of objects containing option data
 * @param {string} valueKey - The key in each object to use as the option value
 * @param {string} textKey - The key in each object to use as the option text
 */
function populateSelect(selectId, options, valueKey, textKey) {
  const select = document.querySelector(`#${selectId}`);
  for (const option of options) {
    const element = document.createElement("option");
    element.value = option[valueKey];
    element.textContent = option[textKey];
    select.append(element);
  }
}

/**
 * Updates the URL based on the current form values
 * Creates a query string and updates browser history without reloading
 */
function updateURLFromForm() {
  const formData = new FormData(searchForm);
  const parameters = new URLSearchParams();

  // Only add non-empty values
  for (const [key, value] of formData.entries()) {
    if (value.trim()) {
      parameters.append(key, value.trim());
    }
  }

  // Add current page if not first page
  if (state.currentPage > 1) {
    parameters.append("pageNumber", state.currentPage);
  }

  // Update browser URL without reloading
  const newRelativePathQuery = globalThis.location.pathname + "?" +
    parameters.toString();
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
    const field = searchForm.elements[key];
    if (field && key !== "pageNumber") {
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
    advancedSearch.style.display = "grid";
    advancedToggle.textContent = "Hide Advanced Options";
  }

  // Set current page
  const pageParameter = state.searchParams.get("pageNumber");
  if (pageParameter) {
    state.currentPage = Number.parseInt(pageParameter, 10);
  }
}

/**
 * Performs a search using the current search parameters
 *
 * @returns {Promise<void>}
 */
async function performSearch() {
  // Only proceed if user has given consent
  if (!userConsent) {
    highlightConsentSection();
    return;
  }

  // Show loading state
  resultsSection.style.display = "block";
  await establishmentList.loadEstablishments(
    {
      establishments: [],
      totalResults: 0,
      currentPage: state.currentPage,
      pageSize: state.pageSize,
    },
    true,
  );

  try {
    // Build search query
    const queryParameters = new URLSearchParams(state.searchParams);
    queryParameters.set("pageNumber", state.currentPage.toString());
    queryParameters.set("pageSize", state.pageSize.toString());

    // Fetch results
    const response = await fetchAPI(
      `/Establishments?${queryParameters.toString()}`,
    );

    const establishments = response.establishments || [];
    const totalResults = response.meta.totalCount;

    // Display results
    await displayResults({
      establishments,
      totalResults,
    });

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error("Search failed:", error);
    establishmentList.showError(
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
  resultsSection.style.display = "block";
  resultsContainer.style.display = "block";

  // Load the establishments into the list component
  await establishmentList.loadEstablishments(
    {
      establishments,
      totalResults,
      currentPage: state.currentPage,
      pageSize: state.pageSize,
    },
    false,
    handlePageChange,
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
  const newRelativePathQuery = globalThis.location.pathname + "?" +
    state.searchParams.toString();
  history.pushState(null, "", newRelativePathQuery);

  // Show loading state but don't hide containing elements
  if (loadingIndicator) {
    loadingIndicator.style.display = "block";
  }

  // Fetch new results for this page
  await performSearch();
};

/**
 * Fetches data from the FHRS API
 *
 * @param {string} endpoint - The API endpoint to fetch
 * @returns {Promise<object>} The JSON response from the API
 * @throws {Error} If the request fails or user has not given consent
 */
export const fetchAPI = async (endpoint) => {
  // Safety check - don't fetch if no consent
  if (!userConsent) {
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
