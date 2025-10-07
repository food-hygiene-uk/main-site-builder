/**
 * @typedef {import("components/establishment-card/establishment-card.mjs").Establishment} Establishment
 * @typedef {object} SortOption
 * @property {string} value - The value to identify this sort option
 * @property {string} label - The display label for this sort option
 * @property {(a: Establishment, b: Establishment) => number} comparator - Function to compare establishments for sorting
 */

/**
 * Adds the CSS link for the component to the document head.
 */
{
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/components/establishment-display/establishment-display.css";
  document.head.append(link);
}

/**
 * A component for filtering and sorting establishment lists
 */
export class EstablishmentDisplay {
  /**
   * Creates a new establishment display instance
   *
   * @param {object} options - Configuration options
   * @param {HTMLElement} options.container - The container element to render the controls in
   * @param {import("components/establishment-list/establishment-list.mjs").EstablishmentList} options.establishmentList - The establishment list component to control
   * @param {Array<SortOption>} [options.sortOptions] - Available sort options
   * @param {string} [options.defaultSortOption] - Default sort option value
   * @param {boolean} [options.defaultSortDirection] - Default sort direction (true for ascending, false for descending)
   * @param {boolean} [options.enableFiltering] - Whether to enable name filtering
   * @param {(filterText: string) => void} options.onFilterChange - Callback when filter changes
   * @param {(sortOption: string, sortDirection: boolean) => void} options.onSortChange - Callback when sort changes
   */
  constructor(options) {
    this.container = options.container;
    this.establishmentList = options.establishmentList;
    this.sortOptions = options.sortOptions || this._getDefaultSortOptions();
    this.defaultSortOption = options.defaultSortOption || "name";
    this.defaultSortDirection = options.defaultSortDirection !== false; // Default to ascending if not specified
    this.enableFiltering = options.enableFiltering !== false; // Default to true if not specified

    // Callbacks
    this.onFilterChange = options.onFilterChange;
    this.onSortChange = options.onSortChange;

    // State
    this.currentSortOption = this.defaultSortOption;
    this.currentSortDirection = this.defaultSortDirection;
    this.filterText = "";
    this.originalEstablishments = [];

    // UI elements
    this.wrapper = null;
    this.filterInput = null;
    this.sortSelect = null;
    this.directionButton = null;

    // Initialize
    this._createElements();
  }

  /**
   * Create the necessary DOM elements
   *
   * @private
   */
  _createElements() {
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

      this.filterInput = document.createElement("input");
      this.filterInput.type = "text";
      this.filterInput.id = "establishment-filter";
      this.filterInput.placeholder = "Enter name to filter...";
      this.filterInput.addEventListener("input", () => {
        this.filterText = this.filterInput.value.trim();
        this.onFilterChange(this.filterText);
      });

      filterContainer.append(filterLabel, this.filterInput);
      controlsContainer.append(filterContainer);
    }

    // Add sort controls
    const sortContainer = document.createElement("div");
    sortContainer.className = "sort-container";

    const sortLabel = document.createElement("label");
    sortLabel.htmlFor = "establishment-sort";
    sortLabel.textContent = "Sort by:";

    this.sortSelect = document.createElement("select");
    this.sortSelect.id = "establishment-sort";

    // Add options to select
    for (const option of this.sortOptions) {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      this.sortSelect.append(optionElement);
    }

    this.sortSelect.value = this.defaultSortOption;
    this.sortSelect.addEventListener("change", () => {
      this.currentSortOption = this.sortSelect.value;
      this.onSortChange(this.currentSortOption, this.currentSortDirection);
    });

    // Direction button
    this.directionButton = document.createElement("button");
    this.directionButton.className = "direction-button";
    this._updateDirectionButton();
    this.directionButton.addEventListener("click", () => {
      this.currentSortDirection = !this.currentSortDirection;
      this._updateDirectionButton();
      this.onSortChange(this.currentSortOption, this.currentSortDirection);
    });

    sortContainer.append(sortLabel, this.sortSelect, this.directionButton);
    controlsContainer.append(sortContainer);

    // Add to wrapper
    this.wrapper.append(controlsContainer);

    // Add to container
    this.container.prepend(this.wrapper);
  }

  /**
   * Update the direction button icon and title based on current sort direction
   *
   * @private
   */
  _updateDirectionButton() {
    this.directionButton.title = this.currentSortDirection
      ? "Sort Descending"
      : "Sort Ascending";
    this.directionButton.innerHTML = this.currentSortDirection
      ? "&#8595;" // Down arrow for ascending (A->Z means values go down)
      : "&#8593;"; // Up arrow for descending (Z->A means values go up)
  }

  /**
   * Get default sort options
   *
   * @private
   * @returns {Array<SortOption>} Default sort options
   */
  _getDefaultSortOptions() {
    return [
      {
        value: "name",
        label: "Name",
        comparator: (a, b) => a.BusinessName.localeCompare(b.BusinessName),
      },
      {
        value: "rating",
        label: "Rating",
        comparator: (a, b) => {
          // Handle potential missing ratings
          const ratingA = a.RatingValue ? Number(a.RatingValue) : -1;
          const ratingB = b.RatingValue ? Number(b.RatingValue) : -1;
          return ratingA - ratingB;
        },
      },
      {
        value: "date",
        label: "Last Inspection",
        comparator: (a, b) => {
          // Handle potential missing dates
          if (!a.RatingDate) return 1;
          if (!b.RatingDate) return -1;
          return new Date(a.RatingDate) - new Date(b.RatingDate);
        },
      },
    ];
  }

  /**
   * Set the establishments data and apply current filters and sorting
   *
   * @param {Array<Establishment>} establishments - Array of establishment objects
   * @param {string} [filterText] - Current filter text to display (optional)
   * @param {string} [sortOption] - Current sort option to use (optional)
   * @param {boolean} [sortDirection] - Current sort direction to use (optional)
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

    if (sortDirection !== null && sortDirection !== undefined) {
      this.currentSortDirection = sortDirection;
      this._updateDirectionButton();
    }
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
      if (this.sortSelect) {
        const optionElement = document.createElement("option");
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        this.sortSelect.append(optionElement);
      }
    }
  }

  /**
   * Reset all filters and sorting to defaults
   */
  reset() {
    // Track which callbacks need to be called
    let filterChanged = false;
    let sortChanged = false;

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

      this._updateDirectionButton();
      sortChanged = true;
    }

    // Clear filter if enabled
    if (this.enableFiltering && this.filterInput && this.filterInput.value) {
      this.filterInput.value = "";
      this.filterText = "";
      filterChanged = true;
    }

    // Call only the necessary callbacks
    if (filterChanged) {
      this.onFilterChange(this.filterText);
    }

    if (sortChanged) {
      this.onSortChange(this.currentSortOption, this.currentSortDirection);
    }
  }
}

/**
 * Creates a new establishment display instance
 *
 * @param {object} options - Configuration options
 * @param {HTMLElement} options.container - The container element to render the display in
 * @param {import("components/establishment-list/establishment-list.mjs").EstablishmentList} options.establishmentList - The establishment list to control
 * @param {Array<import("./establishment-display.mjs").SortOption>} [options.sortOptions] - Custom sort options
 * @param {string} [options.defaultSortOption] - Default sort option value
 * @param {boolean} [options.defaultSortDirection] - Default sort direction (true for ascending, false for descending)
 * @param {boolean} [options.enableFiltering] - Whether to enable name filtering
 * @param {(filterText: string) => void} options.onFilterChange - Callback when filter changes
 * @param {(sortOption: string, sortDirection: boolean) => void} options.onSortChange - Callback when sort changes
 * @returns {EstablishmentDisplay} A new EstablishmentDisplay instance
 */
export function createEstablishmentDisplay(options) {
  return new EstablishmentDisplay(options);
}
