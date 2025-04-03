import { renderEstablishmentCard } from "components/establishment-card/establishment-card.mjs";

/*
 * @typedef {import("components/establishment-card/establishment-card.mjs").Establishment} Establishment
 */

/**
 * A reusable component for rendering lists of establishments with pagination
 */
export class EstablishmentList {
  /**
   * Creates a new establishment list instance
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - The container element to render the list in
   * @param {HTMLElement} [options.loadingElement] - Element to show/hide during loading
   * @param {HTMLElement} [options.emptyElement] - Element to show when list is empty
   * @param {HTMLElement} [options.errorElement] - Element to show when an error occurs
   * @param {HTMLElement} [options.countElement] - Element to show result count
   * @param {number} [options.pageSize=10] - Number of items per page
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
   * @private
   */
  _createElements() {
    // Wrapper for the entire component
    this.wrapper = document.createElement("div");
    this.wrapper.className = "establishment-list-component";

    // Establishments container - always use list view
    this.listElement = document.createElement("div");
    this.listElement.className = "establishments-list";
    this.wrapper.appendChild(this.listElement);

    // Pagination
    this.paginationElement = document.createElement("div");
    this.paginationElement.className = "pagination";
    this.wrapper.appendChild(this.paginationElement);

    // Add to container
    this.container.appendChild(this.wrapper);
  }

  /**
   * Get establishments for the current page
   * @returns {Array} Array of establishments for the current page
   * @private
   */
  _getCurrentPageItems() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.establishments.slice(startIndex, endIndex);
  }

  /**
   * Render the pagination controls
   * @param {Function} [onPageChange] - Callback to execute when page changes
   * @private
   */
  _renderPagination(onPageChange) {
    this.paginationElement.innerHTML = "";

    if (this.totalPages <= 1) return;

    // Previous button
    if (this.currentPage > 1) {
      const prevButton = this._createPaginationButton(
        "Previous",
        this.currentPage - 1,
        onPageChange,
      );
      this.paginationElement.appendChild(prevButton);
    }

    // Page numbers
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
      const button = this._createPaginationButton(i, i, onPageChange);
      if (i === this.currentPage) {
        button.classList.add("active");
      }
      this.paginationElement.appendChild(button);
    }

    // Next button
    if (this.currentPage < this.totalPages) {
      const nextButton = this._createPaginationButton(
        "Next",
        this.currentPage + 1,
        onPageChange,
      );
      this.paginationElement.appendChild(nextButton);
    }
  }

  /**
   * Creates a pagination button with the specified text and page number
   * @param {string|number} text - The text to display on the button
   * @param {number} page - The page number this button should navigate to
   * @param {Function} [onPageChange] - Callback to execute when page changes
   * @returns {HTMLButtonElement} The created button element
   * @private
   */
  _createPaginationButton(text, page, onPageChange) {
    const button = document.createElement("button");
    button.textContent = text;
    button.addEventListener("click", () => {
      this.goToPage(page);
      if (onPageChange) {
        onPageChange(page);
      }
    });
    return button;
  }

  /**
   * Go to a specific page
   * @param {number} page - The page number to go to
   * @returns {Promise<void>} Promise that resolves when the page is rendered
   */
  async goToPage(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;

    // Only re-render if we're handling the data locally
    if (this.establishments.length > 0) {
      await this._renderCurrentPage();
    }
  }

  /**
   * Render the establishments for the current page
   * @private
   * @returns {Promise<void>} Promise that resolves when rendering is complete
   */
  async _renderCurrentPage() {
    const currentItems = this._getCurrentPageItems();
    this.listElement.innerHTML = "";

    // Render items in list view
    for (const [index, establishment] of currentItems.entries()) {
      try {
        const item = await renderEstablishmentCard(establishment);
        this.listElement.appendChild(item);

        // Add a horizontal rule if this isn't the last item
        if (index < currentItems.length - 1) {
          const hr = document.createElement("hr");
          this.listElement.appendChild(hr);
        }
      } catch (err) {
        console.error(
          "Error rendering establishment card:",
          err,
          establishment,
        );
      }
    }
  }

  /**
   * Load and display establishments
   * @param {Object} data - Data object with establishments and metadata
   * @param {Array<Establishment>} data.establishments - Array of establishment objects to display
   * @param {number} [data.totalResults] - Total number of results (for pagination)
   * @param {number} [data.currentPage] - Current page number
   * @param {number} [data.pageSize] - Page size
   * @param {boolean} [isLoading=false] - Whether the data is still loading
   * @param {Function} [onPageChange] - Callback to execute when page changes
   * @returns {Promise<void>} Promise that resolves when establishments are loaded and rendered
   */
  async loadEstablishments(data, isLoading = false, onPageChange = null) {
    if (isLoading) {
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

    if (data.totalResults !== undefined) {
      this.totalResults = data.totalResults;
      this.totalPages = Math.ceil(this.totalResults / this.pageSize);
    } else {
      this.totalResults = this.establishments.length;
      this.totalPages = Math.ceil(this.totalResults / this.pageSize);
    }

    // Show/hide appropriate elements
    if (this.loadingElement) this.loadingElement.style.display = "none";

    if (this.establishments.length === 0) {
      if (this.emptyElement) this.emptyElement.style.display = "block";
      this.wrapper.style.display = "none";
      if (this.countElement) {
        this.countElement.textContent = "0 results found";
      }
    } else {
      if (this.emptyElement) this.emptyElement.style.display = "none";
      this.wrapper.style.display = "block";

      // Update count element if it exists
      if (this.countElement) {
        this.countElement.textContent = `Showing ${
          Math.min(this.pageSize, this.establishments.length)
        } of ${this.totalResults} results`;
      }

      // Render establishments and pagination
      await this._renderCurrentPage();
      this._renderPagination(onPageChange);
    }
  }

  /**
   * Show an error message
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
