import { renderEstablishmentCard } from "components/establishment-card/establishment-card.mjs";

/*
 * @typedef {import("components/establishment-card/establishment-card.mjs").Establishment} Establishment
 */

/**
 * Adds the CSS link for the component to the document head.
 */
{
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/components/establishment-list/establishment-list.css";
  document.head.append(link);
}

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
   * @param {number} [options.pageSize] - Number of items per page
   */
  constructor(options) {
    this.container = options.container;
    this.loadingElement = options.loadingElement;
    this.emptyElement = options.emptyElement;
    this.errorElement = options.errorElement;
    this.countElement = options.countElement;
    this.pageSize = options.pageSize || 10;

    // State
    this.establishments = [];
    this.currentPage = 1;
    this.totalResults = 0;
    this.totalPages = 0;

    // UI elements
    this.wrapper = null;
    this.listElement = null;
    this.paginationElement = null;

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
    this.wrapper.className = "establishment-list-component";

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
   * Get establishments for the current page
   *
   * @returns {Array} Array of establishments for the current page
   * @private
   */
  _getCurrentPageItems() {
    // For server-side pagination, we've already received just the items for this page
    // so we should return all items rather than trying to slice them
    if (this.establishments.length <= this.pageSize) {
      return this.establishments;
    }

    // For client-side pagination, we calculate the slice
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.establishments.slice(startIndex, endIndex);
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
    const currentItems = this._getCurrentPageItems();
    this.listElement.innerHTML = "";

    // Show loading state while rendering
    if (this.loadingElement) {
      this.loadingElement.style.display = "block";
    }

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
      // Hide loading indicator when done
      if (this.loadingElement) {
        this.loadingElement.style.display = "none";
      }

      // Ensure our wrapper is visible
      if (this.wrapper) {
        this.wrapper.style.display = "block";
      }

      // Ensure our list element is visible
      if (this.listElement) {
        this.listElement.style.display = "flex";
      }
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
   * @param {boolean} [isLoading] - Whether the data is still loading
   * @param {(page: number) => void} [onPageChange] - Callback to execute when page changes
   * @returns {Promise<void>} Promise that resolves when establishments are loaded and rendered
   */
  async loadEstablishments(data, isLoading = false, onPageChange = null) {
    if (isLoading) {
      // Only show loading and hide results when explicitly in loading state
      if (this.loadingElement) this.loadingElement.style.display = "block";
      if (this.emptyElement) this.emptyElement.style.display = "none";
      if (this.errorElement) this.errorElement.style.display = "none";
      if (this.wrapper) this.wrapper.style.display = "none";
      return;
    }

    this.establishments = data.establishments || [];

    // Update pagination state if provided
    if (data.currentPage !== undefined) {
      this.currentPage = data.currentPage;
    }

    if (data.pageSize !== undefined) {
      this.pageSize = data.pageSize;
    }

    if (data.totalResults === undefined) {
      this.totalResults = this.establishments.length;
      this.totalPages = Math.ceil(this.totalResults / this.pageSize);
    } else {
      this.totalResults = data.totalResults;
      this.totalPages = Math.ceil(this.totalResults / this.pageSize);
    }

    // Store the onPageChange callback for future use
    this._onPageChangeCallback = onPageChange;

    // Hide loading indicator now that we have data
    if (this.loadingElement) this.loadingElement.style.display = "none";

    if (this.establishments.length === 0) {
      if (this.emptyElement) this.emptyElement.style.display = "block";
      if (this.wrapper) this.wrapper.style.display = "none";
      if (this.countElement) {
        this.countElement.textContent = "0 results found";
      }
    } else {
      if (this.emptyElement) this.emptyElement.style.display = "none";

      // Make sure wrapper is visible when we have results
      if (this.wrapper) {
        this.wrapper.style.display = "block";
      }

      // Update count element if it exists
      if (this.countElement) {
        const start = (this.currentPage - 1) * this.pageSize + 1;
        const end = Math.min(
          start + this.establishments.length - 1,
          this.totalResults,
        );
        this.countElement.textContent =
          `Showing ${start}-${end} of ${this.totalResults} results`;
      }

      // Render establishments and pagination
      await this._renderCurrentPage();
      this._renderPagination(onPageChange);
    }
  }

  /**
   * Show an error message
   *
   * @param {string} message - The error message to display
   */
  showError(message) {
    if (this.loadingElement) this.loadingElement.style.display = "none";
    if (this.emptyElement) this.emptyElement.style.display = "none";

    if (this.errorElement) {
      this.errorElement.style.display = "block";
      this.errorElement.innerHTML = `
        <div class="error-message">
          <p>${message || "An error occurred"}</p>
        </div>
      `;
    }

    this.wrapper.style.display = "none";
  }
}
