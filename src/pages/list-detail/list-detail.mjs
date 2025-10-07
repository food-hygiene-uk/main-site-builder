import { EstablishmentList } from "components/establishment-list/establishment-list.mjs";
import recentEstablishmentsService from "scripts/recent-establishments-service.mjs";
import { openModal } from "components/modal/modal.mjs";
import { fetchEstablishmentDetails } from "scripts/establishment.mjs";

/*
 * @typedef {import("components/establishment-card/establishment-card.mjs").Establishment} Establishment
 */

// Storage key for saved lists
const SAVED_LISTS_STORAGE_KEY = "saved-establishment-lists";
const PAGE_SIZE = 10;

// module scope variables
const establishmentView = {
  page: 1,
  filterText: "",
  sortOption: "",
  sortDirection: true, // true = ascending, false = descending
};

/**
 * Encodes an array of establishment IDs into a compact string representation
 *
 * @param {Array<string>} ids - Array of establishment IDs to encode
 * @returns {string} Encoded string representation
 */
const encodeEstablishmentIds = (ids) => {
  // Convert to base36 representation for more compact encoding
  const base36Ids = ids.map((id) => Number.parseInt(id).toString(36));

  // Create a compact JSON object with the ids
  const dataObject = { i: base36Ids };

  // Convert to JSON and then to base64 for URL safety
  const jsonString = JSON.stringify(dataObject);

  // Use built-in btoa for base64 encoding (browser-compatible)
  return btoa(jsonString);
};

/**
 * Filter establishments by name
 *
 * @param {Array<Establishment>} establishments - Establishments to filter
 * @param {string} filterText - Text to filter by
 * @returns {Array<Establishment>} Filtered establishments
 */
const filterEstablishments = (establishments, filterText) => {
  if (!filterText) return establishments;

  const filterTextLower = filterText.toLowerCase();
  return establishments.filter((establishment) =>
    establishment.BusinessName.toLowerCase().includes(filterTextLower)
  );
};

/**
 * Sort establishments by the given option and direction
 *
 * @param {Array<Establishment>} establishments - Establishments to sort
 * @param {string} sortOption - Sort option to use
 * @param {boolean} sortDirection - Sort direction (true for ascending, false for descending)
 * @returns {Array<Establishment>} Sorted establishments
 */
const sortEstablishments = (establishments, sortOption, sortDirection) => {
  if (!sortOption) return establishments;

  const sortedEstablishments = [...establishments]; // Create a copy to avoid mutating original

  switch (sortOption) {
    case "name": {
      sortedEstablishments.sort((a, b) => {
        const result = a.BusinessName.localeCompare(b.BusinessName);
        return sortDirection ? result : -result;
      });
      break;
    }
    case "rating": {
      sortedEstablishments.sort((a, b) => {
        const ratingA = a.RatingValue ? Number(a.RatingValue) : -1;
        const ratingB = b.RatingValue ? Number(b.RatingValue) : -1;
        const result = ratingA - ratingB;
        return sortDirection ? result : -result;
      });
      break;
    }
    case "date": {
      sortedEstablishments.sort((a, b) => {
        if (!a.RatingDate) return sortDirection ? 1 : -1;
        if (!b.RatingDate) return sortDirection ? -1 : 1;
        const result = new Date(a.RatingDate) - new Date(b.RatingDate);
        return sortDirection ? result : -result;
      });
      break;
    }
    default: {
      // No sorting
      break;
    }
  }

  return sortedEstablishments;
};

/**
 * Slices an array of establishments to get the items for a specific page.
 *
 * @param {Array<Establishment>} establishments - The full array of establishments to paginate.
 * @param {number} page - The current page number (1-based).
 * @returns {Array<Establishment>} A new array containing the establishments for the specified page.
 */
const sliceEstablishments = (establishments, page) => {
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  return establishments.slice(startIndex, endIndex);
};

document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const listTitle = document.querySelector("#listTitle");
  const listDescription = document.querySelector("#listDescription");
  const establishmentsContainer = document.querySelector("#establishmentsList");
  const emptyListMessage = document.querySelector("#emptyList");
  const errorMessage = document.querySelector("#errorMessage");
  const loadingIndicator = document.querySelector("#loading");
  const shareButton = document.querySelector("#shareButton");
  const clearButton = document.querySelector("#clearButton");
  const deleteButton = document.querySelector("#deleteButton");

  // Get list ID from URL
  const urlParameters = new URLSearchParams(globalThis.location.search);
  const listId = urlParameters.get("id") || "recent";

  // Initialize the establishment list component with display component for filtering and sorting
  const establishmentList = new EstablishmentList({
    container: establishmentsContainer,
    loadingElement: loadingIndicator,
    emptyElement: emptyListMessage,
    errorElement: errorMessage,
    pageSize: PAGE_SIZE,
    enableViewToggle: true,
    enableDisplay: true, // Enable the filter and sort functionality
    enableFiltering: true,
    defaultSortOption: "name", // Default sort by name
    defaultSortDirection: true, // Default ascending (A-Z)
  });

  // Stores the current list of establishments for sharing
  let currentEstablishments = [];
  let currentListTitle = "";

  /**
   * Gets a saved list by ID
   *
   * @param {string} id - The ID of the saved list to retrieve
   * @returns {object|null} The saved list or null if not found
   */
  const getSavedList = (id) => {
    if (globalThis.localStorage === undefined) return null;

    try {
      const savedListsJson = globalThis.localStorage.getItem(
        SAVED_LISTS_STORAGE_KEY,
      );
      if (!savedListsJson) return null;

      const savedLists = JSON.parse(savedListsJson);
      return savedLists[id] || null;
    } catch (error) {
      console.error("Error retrieving saved list:", error);
      return null;
    }
  };

  /**
   * Deletes a saved list by ID
   *
   * @param {string} id - The ID of the list to delete
   * @returns {boolean} True if deletion was successful
   */
  const deleteList = (id) => {
    if (globalThis.localStorage === undefined) return false;

    try {
      const savedListsJson = globalThis.localStorage.getItem(
        SAVED_LISTS_STORAGE_KEY,
      );
      if (!savedListsJson) return false;

      const savedLists = JSON.parse(savedListsJson);

      // Check if the list exists
      if (!savedLists[id]) {
        return false;
      }

      // Delete the list
      delete savedLists[id];

      // Save back to localStorage
      globalThis.localStorage.setItem(
        SAVED_LISTS_STORAGE_KEY,
        JSON.stringify(savedLists),
      );

      return true;
    } catch (error) {
      console.error("Error deleting list:", error);
      return false;
    }
  };

  // Share modal event handlers
  if (shareButton) {
    shareButton.addEventListener("click", () => {
      const modalContent = document.createElement("div");
      modalContent.className = "modal-content";

      const instruction = document.createElement("p");
      instruction.textContent = "Copy this link to share your list:";
      modalContent.append(instruction);

      const shareUrlContainer = document.createElement("div");
      shareUrlContainer.className = "share-url-container";

      const shareUrlInput = document.createElement("input");
      shareUrlInput.type = "text";
      shareUrlInput.id = "share-url";
      shareUrlInput.classList.add("input");
      shareUrlInput.readOnly = true;
      shareUrlContainer.append(shareUrlInput);

      const copyShareUrlButton = document.createElement("button");
      copyShareUrlButton.id = "copy-share-url";
      copyShareUrlButton.textContent = "Copy";
      shareUrlContainer.append(copyShareUrlButton);

      modalContent.append(shareUrlContainer);

      const buttonsContainer = document.createElement("div");
      buttonsContainer.className = "button-group"; // For styling buttons

      const closeModalButton = document.createElement("button");
      closeModalButton.className = "secondary-button";
      closeModalButton.textContent = "Close";

      buttonsContainer.append(closeModalButton);
      modalContent.append(buttonsContainer);

      const dialogElement = openModal("Share This List", modalContent, () => {
        // Optional cleanup logic when modal is closed
      });

      // Generate the share URL and set it in the input field
      const shareUrl = generateShareUrl();
      shareUrlInput.value = shareUrl;

      copyShareUrlButton.addEventListener("click", () => {
        shareUrlInput.select();
        document.execCommand("copy");

        // Provide feedback that the URL was copied
        const originalText = copyShareUrlButton.textContent;
        copyShareUrlButton.textContent = "Copied!";
        setTimeout(() => {
          copyShareUrlButton.textContent = originalText;
        }, 2000);
      });

      closeModalButton.addEventListener("click", () => {
        dialogElement.close();
      });
    });
  }

  // Clear button handler for Recent list
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      if (
        confirm(
          "Are you sure you want to clear your recent establishments list? This action cannot be undone.",
        )
      ) {
        // Clear the recent establishments
        recentEstablishmentsService.clearRecentEstablishments();

        // Reload the list to show empty state
        loadEstablishments();
      }
    });
  }

  // Delete button handler for saved lists
  if (deleteButton) {
    deleteButton.addEventListener("click", () => {
      if (
        confirm(
          "Are you sure you want to delete this list? This action cannot be undone.",
        )
      ) {
        if (deleteList(listId)) {
          // Redirect back to the lists page
          globalThis.location.href = "/lists/";
        } else {
          alert("There was a problem deleting the list. Please try again.");
        }
      }
    });
  }

  /**
   * Generates a shareable URL containing the list title and establishment IDs
   *
   * @returns {string|undefined} The generated shareable URL or undefined if no establishments exist
   */
  const generateShareUrl = () => {
    if (currentEstablishments.length === 0) return;

    // Extract just the FHRSID from each establishment
    const ids = currentEstablishments.map((est) => est.FHRSID);

    // Create URL parameters with efficient encoding
    const parameters = new URLSearchParams();
    parameters.set("title", currentListTitle);
    parameters.set("data", encodeEstablishmentIds(ids));

    // Generate the complete share URL
    const shareUrl =
      `${globalThis.location.origin}/lists/shared/?${parameters.toString()}`;

    return shareUrl;
  };

  /**
   * Loads and displays establishments from the specified list.
   * Handles recent establishments, saved lists, and updates the UI accordingly.
   */
  async function loadEstablishments() {
    // Show loading state
    await establishmentList.loadEstablishments({ establishments: [] }, true);

    // Initialize list info
    let listInfo = { title: "", description: "" };
    let establishments = [];

    // Hide all action buttons by default
    if (shareButton) shareButton.style.display = "none";
    if (clearButton) clearButton.style.display = "none";
    if (deleteButton) deleteButton.style.display = "none";

    // Set list details based on ID
    if (listId === "recent") {
      listInfo = {
        title: "Recent Establishments",
        description: "Establishments you've recently viewed",
      };

      // Get recent establishments from service
      establishments = await Promise.all(recentEstablishmentsService.getRecentEstablishments().map((item) =>
        fetchEstablishmentDetails(item.FHRSID)
      ));

      // Show the clear button for recent list
      if (clearButton) {
        clearButton.style.display = "inline-flex";
      }
    } else if (listId.startsWith("list_")) {
      // This is a saved list
      const savedList = getSavedList(listId);

      if (savedList) {
        listInfo = {
          title: savedList.name,
          description: `Saved on ${
            new Date(
              savedList.created,
            ).toLocaleDateString()
          }`,
        };

        establishments = await Promise.all(
          savedList.establishments.map((item) =>
            fetchEstablishmentDetails(item.FHRSID)
          )
        );

        // Show delete button for saved lists
        if (deleteButton) {
          deleteButton.style.display = "inline-flex";
        }
      } else {
        establishmentList.showError("The requested list could not be found");
        return;
      }
    } else {
      // In the future, this would handle other list types
      establishmentList.showError("The requested list could not be found");
      return;
    }

    // Store current establishments and title for sharing
    currentEstablishments = establishments;
    currentListTitle = listInfo.title;

    // Show share button if we have establishments
    if (establishments.length > 0 && shareButton) {
      shareButton.style.display = "inline-flex";
    }

    // Update page title and description
    listTitle.textContent = listInfo.title;
    listDescription.textContent = listInfo.description;
    document.title = `${listInfo.title} - Food Hygiene Ratings`;

    // Make sure the container is visible before loading establishments
    establishmentsContainer.style.display = "block";

    {
      const filteredEstablishments = filterEstablishments(
        establishments,
        establishmentView.filterText,
      );
      const establishmentsLength = filteredEstablishments.length;
      const sortedEstablishments = sortEstablishments(
        filteredEstablishments,
        establishmentView.sortOption,
        establishmentView.sortDirection,
      );

      const pageEstablishments = sliceEstablishments(
        sortedEstablishments,
        establishmentView.page,
      );
      await establishmentList.loadEstablishments(
        {
          establishments: pageEstablishments,
          totalResults: establishmentsLength,
          currentPage: establishmentView.page,
          pageSize: PAGE_SIZE,
          filterText: establishmentView.filterText,
          sortOption: establishmentView.sortOption,
          sortDirection: establishmentView.sortDirection,
        },
        false,
        handleClientPageChange,
        handleFilterChange,
        handleSortChange,
      );
    }

    // Double-check visibility after loading
    establishmentsContainer.style.display = "block";
  }

  // Load establishments when the page loads
  loadEstablishments();

  const handleClientPageChange = async (page) => {
    establishmentView.page = page;

    loadEstablishments();
  };

  const handleFilterChange = async (filterText) => {
    establishmentView.filterText = filterText;
    establishmentView.page = 1; // Reset to first page on filter change

    loadEstablishments();
  };

  const handleSortChange = async (sortOption, sortDirection) => {
    establishmentView.sortOption = sortOption;
    establishmentView.sortDirection = sortDirection;
    establishmentView.page = 1; // Reset to first page on sort change

    loadEstablishments();
  };

});
