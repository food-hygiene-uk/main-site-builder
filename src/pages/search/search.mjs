// FHRS API Configuration
const API_BASE = "https://api.ratings.food.gov.uk";
const API_HEADERS = {
  "accept": "application/json",
  "x-api-version": "2",
};

// DOM Elements
const searchForm = document.getElementById("searchForm");
const advancedToggle = document.getElementById("advancedToggle");
const advancedSearch = document.getElementById("advancedSearch");
const loadingIndicator = document.getElementById("loading");
const resultsContainer = document.getElementById("resultsContainer");
const resultsSection = document.getElementById("results");
const resultsCount = document.getElementById("resultsCount");
const pagination = document.getElementById("pagination");
const consentSection = document.getElementById("consentSection");
const consentToggle = document.getElementById("consentToggle");

// Consent state
const CONSENT_STORAGE_KEY = "fhrs_api_consent";
let userConsent = false;

// Search state
const state = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  totalResults: 0,
  searchParams: new URLSearchParams(globalThis.location.search),
};

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
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
  formElements.forEach((element) => {
    element.disabled = disabled;
  });

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
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();

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
  searchForm.addEventListener("click", (e) => {
    if (!userConsent) {
      // Call highlight animation when clicking anywhere on the disabled form
      highlightConsentSection();

      // Prevent default actions only for interactive elements (but still allow the click)
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "SELECT" ||
        e.target.tagName === "BUTTON"
      ) {
        e.preventDefault();
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

  // Remove the individual focus handlers we added before
  // (The section below can be removed since we're replacing it with the form-level handlers)
  /*
    const formFields = searchForm.querySelectorAll("input, select");
    formFields.forEach((field) => {
      field.addEventListener("focus", () => {
        if (!userConsent) {
          highlightConsentSection();
        }
      });
    });
    */
}

// Rest of the JavaScript remains the same...
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
    populateSelect("ratingKey", ratings.ratings, "ratingKey", "ratingName");

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
  const select = document.getElementById(selectId);
  options.forEach((option) => {
    const el = document.createElement("option");
    el.value = option[valueKey];
    el.textContent = option[textKey];
    select.appendChild(el);
  });
}

/**
 * Updates the URL based on the current form values
 * Creates a query string and updates browser history without reloading
 */
function updateURLFromForm() {
  const formData = new FormData(searchForm);
  const params = new URLSearchParams();

  // Only add non-empty values
  for (const [key, value] of formData.entries()) {
    if (value.trim()) {
      params.append(key, value.trim());
    }
  }

  // Add current page if not first page
  if (state.currentPage > 1) {
    params.append("pageNumber", state.currentPage);
  }

  // Update browser URL without reloading
  const newRelativePathQuery = globalThis.location.pathname + "?" +
    params.toString();
  history.pushState(null, "", newRelativePathQuery);

  // Update state
  state.searchParams = params;
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
  const hasAdvancedParams = ["businessTypeId", "ratingKey", "localAuthorityId"]
    .some((param) => state.searchParams.has(param));

  if (hasAdvancedParams) {
    advancedSearch.style.display = "grid";
    advancedToggle.textContent = "Hide Advanced Options";
  }

  // Set current page
  const pageParam = state.searchParams.get("pageNumber");
  if (pageParam) {
    state.currentPage = parseInt(pageParam, 10);
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

  showLoading(true);

  try {
    // Build search query
    const queryParams = new URLSearchParams(state.searchParams);
    queryParams.set("pageNumber", state.currentPage.toString());
    queryParams.set("pageSize", state.pageSize.toString());

    // Fetch results
    const response = await fetchAPI(
      `/Establishments?${queryParams.toString()}`,
    );

    // Update state with pagination info
    state.totalResults = response.meta.totalCount;
    state.totalPages = Math.ceil(state.totalResults / state.pageSize);

    // Display results
    displayResults(response.establishments);
    updatePagination();

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error("Search failed:", error);
    resultsContainer.innerHTML = `
      <div class="error-message">
        <p>Sorry, there was an error performing your search. Please try again.</p>
      </div>
    `;
  } finally {
    showLoading(false);
  }
}

/**
 * Displays search results in the results container
 *
 * @param {Array<object>} establishments - Array of establishment objects to display
 */
function displayResults(establishments) {
  resultsSection.style.display = "block";

  if (establishments.length === 0) {
    resultsContainer.innerHTML = `
      <div class="no-results">
        <p>No establishments found matching your search criteria.</p>
      </div>
    `;
    resultsCount.textContent = "0 results found";
    return;
  }

  resultsCount.textContent =
    `Showing ${establishments.length} of ${state.totalResults} results`;

  // Generate HTML for each establishment
  const html = establishments.map((establishment) => {
    const ratingClass = establishment.RatingValue
      ? `rating-${establishment.RatingValue}`
      : "";
    const ratingText = establishment.RatingValue
      ? `Rating: ${establishment.RatingValue}`
      : "No rating";

    return `
      <div class="establishment" data-establishment-id="${establishment.FHRSID}">
        <h3>${establishment.BusinessName}</h3>
        <div class="establishment-details">
          <div>
            <p class="business-type">${establishment.BusinessType}</p>
            ${renderAddress(establishment)}
          </div>
          <div>
            <p><span class="rating-badge ${ratingClass}">${ratingText}</span></p>
            <p>Last inspection: ${formatDate(establishment.RatingDate)}</p>
            <a href="/e/${
      slugify(establishment.BusinessName)
    }-${establishment.FHRSID}" class="details-link">View Details</a>
          </div>
        </div>
      </div>
    `;
  }).join("");

  resultsContainer.innerHTML = html;
}

/**
 * Renders an address HTML from an establishment object
 *
 * @param {object} establishment - The establishment object containing address data
 * @returns {string} - HTML string representation of the address
 */
function renderAddress(establishment) {
  const addressParts = [];

  if (establishment.AddressLine1) addressParts.push(establishment.AddressLine1);
  if (establishment.AddressLine2) addressParts.push(establishment.AddressLine2);
  if (establishment.AddressLine3) addressParts.push(establishment.AddressLine3);
  if (establishment.AddressLine4) addressParts.push(establishment.AddressLine4);
  if (establishment.PostCode) addressParts.push(establishment.PostCode);

  return `<address>${addressParts.join(", ")}</address>`;
}

/**
 * Updates the pagination controls based on current state
 */
function updatePagination() {
  pagination.innerHTML = "";

  if (state.totalPages <= 1) return;

  // Previous button
  if (state.currentPage > 1) {
    const prevButton = createPaginationButton(
      "Previous",
      state.currentPage - 1,
    );
    pagination.appendChild(prevButton);
  }

  // Page numbers
  const startPage = Math.max(1, state.currentPage - 2);
  const endPage = Math.min(state.totalPages, startPage + 4);

  for (let i = startPage; i <= endPage; i++) {
    const button = createPaginationButton(i, i);
    if (i === state.currentPage) {
      button.classList.add("active");
    }
    pagination.appendChild(button);
  }

  // Next button
  if (state.currentPage < state.totalPages) {
    const nextButton = createPaginationButton("Next", state.currentPage + 1);
    pagination.appendChild(nextButton);
  }
}

/**
 * Creates a pagination button with the specified text and page number
 *
 * @param {string|number} text - The text to display on the button
 * @param {number} page - The page number this button should navigate to
 * @returns {HTMLButtonElement} The created button element
 */
function createPaginationButton(text, page) {
  const button = document.createElement("button");
  button.textContent = text;
  button.addEventListener("click", () => {
    // Only proceed if user has given consent
    if (!userConsent) {
      highlightConsentSection();
      return;
    }

    state.currentPage = page;
    state.searchParams.set("pageNumber", page);
    updateURLFromForm();
    performSearch();
  });
  return button;
}

/**
 * Shows or hides the loading indicator and results section
 *
 * @param {boolean} isLoading - Whether to show the loading state
 */
function showLoading(isLoading) {
  loadingIndicator.style.display = isLoading ? "block" : "none";
  resultsSection.style.display = isLoading ? "none" : "block";
}

/**
 * Fetches data from the FHRS API
 *
 * @param {string} endpoint - The API endpoint to fetch
 * @returns {Promise<object>} The JSON response from the API
 * @throws {Error} If the request fails or user has not given consent
 */
async function fetchAPI(endpoint) {
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
}

/**
 * Formats a date string into a human-readable format
 *
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string or "Not available" if no date
 */
function formatDate(dateString) {
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
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}
