/**
 * @typedef {import("../../generate-site/schema.mts").Establishment} Establishment
 * @typedef {import("components/establishment-list/establishment-list.mjs").EstablishmentList} EstablishmentList
 * @typedef { "order" | "name" | "rating" | "date" } SortKeys
 * @typedef {boolean} SortDirections
 * @typedef {Record<SortKeys, SortDirections>} DefaultSortDirections
 */

/**
 * @typedef {object} SortOption
 * @property {SortKeys} value - The value to identify this sort option
 * @property {string} label - The display label for this sort option
 */

/**
 * @typedef {object} SortConfig
 * @property {SortKeys} defaultSortOption - The default sort option to use
 * @property {SortDirections} defaultSortDirection - The default sort direction (true for ascending, false for descending)
 * @property {Array<SortOption>} sortOptions - Available sort options
 * @property {DefaultSortDirections} sortDirections - Default directions for each sort option
 */

/**
 * Adds the CSS link for the component to the document head.
 *
 * @type {Promise<void>}
 */
const cssReady = new Promise((resolve, reject) => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/components/establishment-display/establishment-display.css";

  link.addEventListener("load", () => resolve());
  link.addEventListener("error", () => reject(new Error("Failed to load CSS")));

  document.head.append(link);
});

const defaultSortKey = "order";

/**
 * @type {DefaultSortDirections}
 */
const defaultSortDirections = {
  order: false, // Descending
  name: true, // Ascending
  rating: false, // Descending
  date: false, // Descending
};

/**
 * Default sort configuration for establishment lists
 *
 * @type {SortConfig}
 */
export const DEFAULT_SORT_CONFIG = {
  defaultSortOption: defaultSortKey,
  defaultSortDirection: defaultSortDirections[defaultSortKey],
  sortOptions: [
    { value: "order", label: "Order Added" },
    { value: "name", label: "Name" },
    { value: "rating", label: "Rating" },
    { value: "date", label: "Last Inspection" },
  ],
  sortDirections: defaultSortDirections,
};

/**
 * A component for filtering and sorting establishment lists
 */
export class EstablishmentDisplay {
  /**
   * Creates a new establishment display instance
   *
   * @param {object} options - Configuration options
   * @param {HTMLElement} options.container - The container element to render the controls in
   * @param {EstablishmentList} options.establishmentList - The establishment list component to control
   * @param {Array<SortOption>} [options.sortOptions] - Available sort options
   * @param {SortKeys} [options.defaultSortOption] - Default sort option value
   * @param {boolean} [options.defaultSortDirection] - Default sort direction (true for ascending, false for descending)
   * @param {boolean} [options.enableFiltering] - Whether to enable name filtering
   * @param {(filterText: string) => void} options.onFilterChange - Callback when filter changes
   * @param {(sortOption: SortKeys, sortDirection: SortDirections) => void} options.onSortChange - Callback when sort changes
   */
  constructor(options) {
    this.container = options.container;
    this.establishmentList = options.establishmentList;
    this.sortOptions = options.sortOptions ?? DEFAULT_SORT_CONFIG.sortOptions;
    this.defaultSortOption = options.defaultSortOption ??
      DEFAULT_SORT_CONFIG.defaultSortOption;
    this.defaultSortDirection = options.defaultSortDirection ??
      DEFAULT_SORT_CONFIG.defaultSortDirection;
    this.enableFiltering = options.enableFiltering !== false; // Default to true if not specified

    // Callbacks
    this.onFilterChange = options.onFilterChange;
    this.onSortChange = options.onSortChange;

    // State
    this.currentSortOption = this.defaultSortOption;
    this.currentSortDirection = this.defaultSortDirection;
    this.filterText = "";
    /**
    @type {Array<Establishment>}
    */
    this.originalEstablishments = [];

    // UI elements
    this.wrapper = null;
    this.filterInput = null;
    this.sortSelect = null;
    this.directionButton = null;

    // Initialize
    this.#createElements();
  }

  /**
   * Create the necessary DOM elements
   */
  #createElements() {
    // Wrapper for the entire component
    this.wrapper = document.createElement("div");
    this.wrapper.className = "establishment-display-component";

    // Create controls container
    const controlsContainer = document.createElement("div");
    controlsContainer.className = "controls-container";

    // Add filter input if enabled
    if (this.enableFiltering) {
      const filterContainer = document.createElement("div");
      filterContainer.className = "filter-container";

      const filterLabel = document.createElement("label");
      filterLabel.htmlFor = "establishment-filter";
      filterLabel.textContent = "Filter by name:";

      const filterInput = document.createElement("input");
      this.filterInput = filterInput;
      filterInput.type = "text";
      filterInput.id = "establishment-filter";
      filterInput.placeholder = "Enter name to filter...";
      filterInput.addEventListener("input", () => {
        this.filterText = filterInput.value.trim();
        this.onFilterChange(this.filterText);
      });

      filterContainer.append(filterLabel, filterInput);
      controlsContainer.append(filterContainer);
    }

    // Add sort controls
    const sortContainer = document.createElement("div");
    sortContainer.className = "sort-container";

    const sortLabel = document.createElement("label");
    sortLabel.htmlFor = "establishment-sort";
    sortLabel.textContent = "Sort by:";

    const sortSelect = document.createElement("select");
    this.sortSelect = sortSelect;
    sortSelect.id = "establishment-sort";

    // Add options to select
    for (const option of this.sortOptions) {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      sortSelect.append(optionElement);
    }

    sortSelect.value = this.defaultSortOption;
    sortSelect.addEventListener("change", () => {
      this.currentSortOption = /** @type {SortKeys} */ (sortSelect.value);
      this.currentSortDirection =
        DEFAULT_SORT_CONFIG.sortDirections[this.currentSortOption] ??
          this.defaultSortDirection;
      this.onSortChange(this.currentSortOption, this.currentSortDirection);
    });

    // Direction button
    const directionButton = document.createElement("button");
    this.directionButton = directionButton;
    directionButton.className = "direction-button";
    this.#updateDirectionButton();
    directionButton.addEventListener("click", () => {
      this.currentSortDirection = !this.currentSortDirection;
      this.#updateDirectionButton();
      this.onSortChange(this.currentSortOption, this.currentSortDirection);
    });

    sortContainer.append(sortLabel, sortSelect, directionButton);
    controlsContainer.append(sortContainer);

    // Add to wrapper
    this.wrapper.append(controlsContainer);

    // Add to container
    this.container.prepend(this.wrapper);
  }

  /**
   * Update the direction button icon and title based on current sort direction
   */
  #updateDirectionButton() {
    if (!this.directionButton) return;

    this.directionButton.title = this.currentSortDirection
      ? "Sort Descending"
      : "Sort Ascending";
    this.directionButton.innerHTML = this.currentSortDirection
      ? "&#8595;" // Down arrow for ascending (A->Z means values go down)
      : "&#8593;"; // Up arrow for descending (Z->A means values go up)
  }

  /**
   * Set the establishments data and apply current filters and sorting
   *
   * @param {Array<Establishment>} establishments - Array of establishment objects
   * @param {string} [filterText] - Current filter text to display (optional)
   * @param {SortKeys} [sortOption] - Current sort option to use (optional)
   * @param {SortDirections} [sortDirection] - Current sort direction to use (optional)
   */
  setEstablishments(establishments, filterText, sortOption, sortDirection) {
    // Don't do anything if the data is the same (prevents unnecessary updates)
    if (this.originalEstablishments === establishments) {
      return;
    }

    // Store the original unfiltered and unsorted list
    this.originalEstablishments = establishments || [];

    // Update UI elements with provided values, if any
    if (filterText !== undefined && this.filterInput) {
      this.filterText = filterText;
      this.filterInput.value = filterText;
    }

    if (sortOption && this.sortSelect) {
      this.currentSortOption = sortOption;
      this.sortSelect.value = sortOption;
    }

    if (sortDirection === null || sortDirection === undefined) {
      return; // Do not change the current sort direction if not provided
    }

    this.currentSortDirection = sortDirection;
    this.#updateDirectionButton();
  }

  /**
   * Add custom sort options
   *
   * @param {Array<SortOption>} options - Additional sort options to add
   */
  addSortOptions(options) {
    if (!options || !Array.isArray(options)) return;

    // Add each new option
    for (const option of options) {
      // Skip if option already exists
      if (
        this.sortOptions.some((existing) => existing.value === option.value)
      ) {
        continue;
      }

      this.sortOptions.push(option);

      // Also add to the select element if it exists
      if (!this.sortSelect) {
        continue;
      }

      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      this.sortSelect.append(optionElement);
    }
  }

  /**
   * Reset all filters and sorting to defaults
   */
  reset() {
    // Track which callbacks need to be called
    let isFilterChanged = false;
    let isSortChanged = false;

    // Reset sort option and direction
    if (
      this.currentSortOption !== this.defaultSortOption ||
      this.currentSortDirection !== this.defaultSortDirection
    ) {
      this.currentSortOption = this.defaultSortOption;
      this.currentSortDirection = this.defaultSortDirection;

      if (this.sortSelect) {
        this.sortSelect.value = this.defaultSortOption;
      }

      this.#updateDirectionButton();
      isSortChanged = true;
    }

    // Clear filter if enabled
    if (this.enableFiltering && this.filterInput && this.filterInput.value) {
      this.filterInput.value = "";
      this.filterText = "";
      isFilterChanged = true;
    }

    // Call only the necessary callbacks
    if (isFilterChanged) {
      this.onFilterChange(this.filterText);
    }

    if (isSortChanged) {
      this.onSortChange(this.currentSortOption, this.currentSortDirection);
    }
  }
}

/**
 * Creates a new establishment display instance
 *
 * @param {object} options - Configuration options
 * @param {HTMLElement} options.container - The container element to render the display in
 * @param {EstablishmentList} options.establishmentList - The establishment list to control
 * @param {Array<SortOption>} [options.sortOptions] - Custom sort options
 * @param {SortKeys} [options.defaultSortOption] - Default sort option value
 * @param {SortDirections} [options.defaultSortDirection] - Default sort direction (true for ascending, false for descending)
 * @param {boolean} [options.enableFiltering] - Whether to enable name filtering
 * @param {(filterText: string) => void} options.onFilterChange - Callback when filter changes
 * @param {(sortOption: SortKeys, sortDirection: SortDirections) => void} options.onSortChange - Callback when sort changes
 * @returns {Promise<EstablishmentDisplay>} A new EstablishmentDisplay instance
 */
export async function createEstablishmentDisplay(options) {
  const establishmentDisplay = new EstablishmentDisplay(options);

  // eslint-disable-next-line unicorn/prefer-await
  return cssReady.then(() => establishmentDisplay);
}
