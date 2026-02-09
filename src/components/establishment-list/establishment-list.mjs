import { renderEstablishmentCard } from "components/establishment-card/establishment-card.mjs";
import { createEstablishmentDisplay } from "components/establishment-display/establishment-display.mjs";

/*
 * @typedef {import("components/establishment-card/establishment-card.mjs").Establishment} Establishment
 */

/**
 * Adds the CSS link for the component to the document head.
 */
const cssReady = new Promise((resolve, reject) => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/components/establishment-list/establishment-list.css";

  link.addEventListener('load', () => resolve("donkey"));
  link.addEventListener('error', () => reject(new Error("Failed to load CSS")));

  document.head.append(link);
});

/**
 * A reusable component for rendering lists of establishments with pagination
 */
export class EstablishmentList {
  /**
   * Creates a new establishment list instance
   *
   * @param {object} options - Configuration options
   * @param {HTMLElement} options.container - The container element to render the list in
   * @param {HTMLElement} [options.loadingElement] - Element to show/hide during loading
   * @param {HTMLElement} [options.emptyElement] - Element to show when list is empty
   * @param {HTMLElement} [options.errorElement] - Element to show when an error occurs
   * @param {HTMLElement} [options.countElement] - Element to show result count
   * @param {boolean} [options.enableDisplay] - Whether to add the establishment-display component for filtering and sorting
   * @param {Array<object>} [options.sortOptions] - Custom sort options for the display component
   * @param {string} [options.defaultSortOption] - Default sort option for the display component
   * @param {boolean} [options.defaultSortDirection] - Default sort direction for the display component
   * @param {boolean} [options.enableFiltering] - Whether to enable name filtering in the display component
   * @param {(filterText: string) => Array<Establishment>} [options.filterCallback] - Custom function to filter establishments
   * @param {(sortOption: string, sortDirection: boolean) => Array<Establishment>} [options.sortCallback] - Custom function to sort establishments
   */
  constructor(options) {
    this.container = options.container;
    this.loadingElement = options.loadingElement;
    this.emptyElement = options.emptyElement;
    this.errorElement = options.errorElement;
    this.countElement = options.countElement;
    this.enableDisplay = options.enableDisplay !== false; // Default to true
    this.sortOptions = options.sortOptions;
    this.defaultSortOption = options.defaultSortOption;
    this.defaultSortDirection = options.defaultSortDirection;
    this.enableFiltering = options.enableFiltering;

    // Callbacks - will be set when loadEstablishments is called
    this._onPageChangeCallback = null;
    this._onFilterChangeCallback = null;
    this._onSortChangeCallback = null;

    // Original unfiltered and unsorted establishments
    this.originalEstablishments = [];

    // State
    this.establishments = [];
    this.currentPage = 1;
    this.totalResults = 0;
    this.totalPages = 0;

    // UI elements
    this.wrapper = null;
    this.listElement = null;
    this.paginationElement = null;
    this.displayComponent = null;

    // Initialize
    this._createElements();
  }

  /**
   * Shows only the specified section and hides all others
   *
   * @param {string} section - The section to show
   * @private
   */
  showSection(section) {
    const sections = {
      loading: this.loadingElement,
      empty: this.emptyElement,
      error: this.errorElement,
      list: this.wrapper,
    };

    for (const [key, sec] of Object.entries(sections)) {
      if (sec) {
        if (key === section) {
          sec.removeAttribute("hidden");
        } else {
          sec.setAttribute("hidden", "hidden");
        }
      }
    }
  }

  /**
   * Create the necessary DOM elements
   *
   * @private
   */
  async _createElements() {
    // Wrapper for the entire component
    this.wrapper = document.createElement("div");
    this.wrapper.className = "establishment-list-component";

    // Create display component if enabled
    if (this.enableDisplay) {
      // Create container for the display component
      const displayContainer = document.createElement("div");
      displayContainer.className = "establishment-display-container";
      this.wrapper.append(displayContainer);

      // Initialize the display component with appropriate callbacks
      this.displayComponent = await createEstablishmentDisplay({
        container: displayContainer,
        establishmentList: this,
        sortOptions: this.sortOptions,
        defaultSortOption: this.defaultSortOption,
        defaultSortDirection: this.defaultSortDirection,
        enableFiltering: this.enableFiltering,
        onFilterChange: (filterText) => {
          this._onFilterChangeCallback(filterText);
        },
        onSortChange: (sortOption, sortDirection) => {
          this._onSortChangeCallback(sortOption, sortDirection);
        },
      });
    }

    // Establishments container - always use list view
    this.listElement = document.createElement("div");
    this.listElement.className = "establishments-list";
    this.wrapper.append(this.listElement);

    // Pagination
    this.paginationElement = document.createElement("div");
    this.paginationElement.className = "pagination";
    this.wrapper.append(this.paginationElement);

    // Add to container
    this.container.append(this.wrapper);
  }

  /**
   * Render the pagination controls
   *
   * @param {(page: number) => void} [onPageChange] - Callback to execute when page changes
   * @private
   */
  _renderPagination(onPageChange) {
    this.paginationElement.innerHTML = "";

    if (this.totalPages <= 1) return;

    // Previous button
    if (this.currentPage > 1) {
      const previousButton = this._createPaginationButton(
        "Previous",
        this.currentPage - 1,
        onPageChange,
      );
      this.paginationElement.append(previousButton);
    }

    // Page numbers
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, startPage + 4);

    for (let index = startPage; index <= endPage; index++) {
      const button = this._createPaginationButton(index, index, onPageChange);
      if (index === this.currentPage) {
        button.classList.add("active");
      }
      this.paginationElement.append(button);
    }

    // Next button
    if (this.currentPage < this.totalPages) {
      const nextButton = this._createPaginationButton(
        "Next",
        this.currentPage + 1,
        onPageChange,
      );
      this.paginationElement.append(nextButton);
    }
  }

  /**
   * Creates a pagination button with the specified text and page number
   *
   * @param {string|number} text - The text to display on the button
   * @param {number} page - The page number this button should navigate to
   * @param {(page: number) => void} [onPageChange] - Callback to execute when page changes
   * @returns {HTMLButtonElement} The created button element
   * @private
   */
  _createPaginationButton(text, page, onPageChange) {
    const button = document.createElement("button");
    button.textContent = text;
    button.addEventListener("click", (event) => {
      event.preventDefault(); // Prevent any default action

      // Always call external callback if provided (for server-side pagination)
      if (onPageChange) {
        onPageChange(page);
        return; // Let the callback handle everything
      }

      // Otherwise handle client-side pagination ourselves
      this.goToPage(page);
    });
    return button;
  }

  /**
   * Go to a specific page (only for client-side pagination)
   *
   * @param {number} page - The page number to go to
   * @returns {Promise<void>} Promise that resolves when the page is rendered
   */
  async goToPage(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    await this._renderCurrentPage();
  }

  /**
   * Render the establishments for the current page
   *
   * @private
   * @returns {Promise<void>} Promise that resolves when rendering is complete
   */
  async _renderCurrentPage() {
    const currentItems = this.establishments;
    this.listElement.innerHTML = "";

    // Show loading state while rendering
    this.showSection("loading");

    try {
      // Render items in list view
      for (const establishment of currentItems) {
        try {
          const item = await renderEstablishmentCard(establishment);
          this.listElement.append(item);
        } catch (error) {
          console.error(
            "Error rendering establishment card:",
            error,
            establishment,
          );
        }
      }
    } finally {
      this.showSection("list");
    }
  }

  /**
   * Load and display establishments
   *
   * @param {object} data - Data object with establishments and metadata
   * @param {Array<Establishment>} data.establishments - Array of establishment objects to display
   * @param {number} [data.totalResults] - Total number of results (for pagination)
   * @param {number} [data.currentPage] - Current page number
   * @param {number} [data.pageSize] - Page size
   * @param {string} [data.filterText] - Text to filter establishments by (if filter callback is provided)
   * @param {string} [data.sortOption] - Sort option to use (if sort callback is provided)
   * @param {boolean} [data.sortDirection] - Sort direction to use (if sort callback is provided)
   * @param {boolean} [isLoading] - Whether the data is still loading
   * @param {(page: number) => void} [onPageChange] - Callback to execute when page changes
   * @param {(filterText: string) => void} [onFilterChange] - Callback to execute when filter changes
   * @param {(sortOption: string, sortDirection: boolean) => void} [onSortChange] - Callback to execute when sort changes
   * @returns {Promise<void>} Promise that resolves when establishments are loaded and rendered
   */
  async loadEstablishments(
    data,
    isLoading = false,
    onPageChange = null,
    onFilterChange = null,
    onSortChange = null,
  ) {
    if (isLoading) {
      this.showSection("loading");

      return;
    }

    this.establishments = data.establishments || [];

    // Update pagination state if provided
    if (data.currentPage !== undefined) {
      this.currentPage = data.currentPage;
    }

    this.totalResults = data.totalResults;
    this.totalPages = Math.ceil(this.totalResults / data.pageSize);

    // Store the onPageChange callback for future use
    this._onPageChangeCallback = onPageChange;
    this._onFilterChangeCallback = onFilterChange;
    this._onSortChangeCallback = onSortChange;

    if (this.establishments.length === 0) {
      this.showSection("empty");
      if (this.countElement) {
        this.countElement.textContent = "0 results found";
      }
    } else {
      this.showSection("list");

      // Update count element if it exists
      if (this.countElement) {
        const start = (this.currentPage - 1) * data.pageSize + 1;
        const end = Math.min(
          start + this.establishments.length - 1,
          this.totalResults,
        );
        this.countElement.textContent =
          `Showing ${start}-${end} of ${this.totalResults} results`;
      }

      // Update the display component if it exists
      if (this.displayComponent) {
        this.displayComponent.setEstablishments(
          this.establishments,
          data.filterText,
          data.sortOption,
          data.sortDirection,
        );
      }

      // Render establishments and pagination
      await cssReady.then(() => this._renderCurrentPage());
      this._renderPagination(onPageChange);
    }
  }

  /**
   * Show an error message
   *
   * @param {string} message - The error message to display
   */
  showError(message) {
    if (this.errorElement) {
      this.showSection("error");

      this.errorElement.innerHTML = `
        <div class="error-message">
          <p>${message || "An error occurred"}</p>
        </div>
      `;
    }
  }
}
