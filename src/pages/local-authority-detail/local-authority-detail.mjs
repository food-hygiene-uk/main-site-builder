const classSuffix = "__CLASS_SUFFIX__";

// Cache DOM queries and use more specific selectors
const searchInput = document.querySelector(
  `.content-${classSuffix} #filter-input`,
);
const container = document.querySelector(".establishments-container");

const establishments = Array.from(container.querySelectorAll(".establishment"));

// Pre-cache establishment data to avoid DOM queries during search
const establishmentData = establishments.map((establishment) => ({
  element: establishment,
  name: (establishment.querySelector("h3")?.textContent || "").toLowerCase(),
  address: (
    establishment.querySelector("address")?.textContent || ""
  ).toLowerCase(),
  clone: establishment.cloneNode(true), // Store a clone for the fragment
}));

/**
 * Debounces a function, delaying its execution until after a certain amount of time has passed
 * since the last invocation.
 *
 * @param {(args: any[]) => void} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to wait before executing the function.
 * @returns {(args: any[]) => void} A debounced version of the function.
 */
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Parses a search string into individual search terms, handling quoted phrases.
 *
 * @param {string} searchTerm - The search string to parse.
 * @returns {string[]} An array of lowercase search terms.
 */
const parseSearchTerms = (searchTerm) => {
  const regex = /"([^"]+)"|(\S+)/g;
  const terms = [];
  let match;
  while ((match = regex.exec(searchTerm)) !== null) {
    let term = (match[1] || match[2]).toLowerCase();
    // Remove stray quotes from beginning and end of the term
    term = term.replace(/^"+|"+$/g, "");
    terms.push(term);
  }
  return terms;
};

/**
 * Appends a list of establishments to a container, clearing the container's existing content.
 * Each establishment is added with a horizontal rule separator.
 *
 * @param {HTMLElement} container - The container to append the establishments to.
 * @param {Array<{clone: Node}>} establishments - An array of establishment data objects, each containing a clone of the establishment's DOM node.
 */
const appendEstablishments = (container, establishments) => {
  // Remove all current establishments
  container.innerHTML = "";

  // Add visible establishments from fragment
  const visibleFragment = document.createDocumentFragment();
  const hrTemplate = document.createElement("hr");
  establishments.forEach((data) => {
    visibleFragment.appendChild(data.clone);
    visibleFragment.appendChild(hrTemplate.cloneNode());
  });
  // Remove the last hr
  if (visibleFragment.lastChild) {
    visibleFragment.lastChild.remove();
  }
  container.appendChild(visibleFragment);
};

const updates = new Set(); // Store visibility updates

/**
 * Processes a batch of establishments, determining their visibility based on search terms.
 *
 * @param {number} index - The starting index of the batch.
 * @param {number} batchSize - The size of the batch.
 * @param {string[]} searchTerms - The array of search terms.
 * @param {Function} resolve - The resolve function of the promise.
 * @returns {void}
 */
const processBatch = (index, batchSize, searchTerms, resolve) => {
  const end = Math.min(index + batchSize, establishmentData.length);

  for (let i = index; i < end; i++) {
    const data = establishmentData[i];
    const matchesAll = searchTerms.every(
      (term) => data.name.includes(term) || data.address.includes(term),
    );
    if (matchesAll) {
      updates.add(data);
    }
  }

  // Apply updates in a batch
  if (end >= establishmentData.length) {
    // Final batch - update the real DOM
    requestAnimationFrame(() => {
      appendEstablishments(container, updates);

      resolve();
    });
  } else {
    // Continue processing
    const nextBatch = () => processBatch(end, batchSize, searchTerms, resolve);
    if (globalThis.requestIdleCallback) {
      requestIdleCallback(nextBatch);
    } else {
      requestAnimationFrame(nextBatch);
    }
  }
};

/**
 * Handles the search functionality, filtering establishments based on the search term.
 *
 * @param {string} searchTerm - The search term to filter by.
 * @returns {Promise<void>} A promise that resolves when the search is complete.
 * @async
 */
const handleSearch = async (searchTerm) => {
  const searchTerms = parseSearchTerms(searchTerm);

  // If search is empty, restore all establishments
  if (searchTerms.length === 0) {
    requestAnimationFrame(() => {
      appendEstablishments(container, establishmentData);
    });
    return;
  }

  return new Promise((resolve) => {
    const batchSize = Math.min(50, Math.ceil(establishmentData.length / 4));
    requestAnimationFrame(() => {
      updates.clear();
      processBatch(0, batchSize, searchTerms, resolve);
    });
  });
};

// Attach debounced event listener
searchInput.addEventListener(
  "input",
  debounce((e) => {
    handleSearch(e.target.value.toLowerCase());
  }, 150),
);
