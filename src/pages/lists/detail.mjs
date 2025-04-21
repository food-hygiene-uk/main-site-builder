import { EstablishmentList } from "components/establishment-list/establishment-list.mjs";
import recentEstablishmentsService from "scripts/recent-establishments-service.mjs";

// Storage key for saved lists
const SAVED_LISTS_STORAGE_KEY = "saved-establishment-lists";

document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const listTitle = document.getElementById("listTitle");
  const listDescription = document.getElementById("listDescription");
  const establishmentsContainer = document.getElementById("establishmentsList");
  const emptyListMessage = document.getElementById("emptyList");
  const errorMessage = document.getElementById("errorMessage");
  const loadingIndicator = document.getElementById("loading");
  const shareButton = document.getElementById("shareButton");
  const clearButton = document.getElementById("clearButton");
  const deleteButton = document.getElementById("deleteButton");
  const shareModal = document.getElementById("shareModal");
  const shareUrlInput = document.getElementById("shareUrl");
  const copyShareUrlButton = document.getElementById("copyShareUrl");
  const closeShareModalButton = document.getElementById("closeShareModal");

  // Get list ID from URL
  const urlParams = new URLSearchParams(globalThis.location.search);
  const listId = urlParams.get("id") || "recent";

  // Initialize the establishment list component with explicit defaultView
  const establishmentList = new EstablishmentList({
    container: establishmentsContainer,
    loadingElement: loadingIndicator,
    emptyElement: emptyListMessage,
    errorElement: errorMessage,
    pageSize: 10,
    enableViewToggle: true,
  });

  // Stores the current list of establishments for sharing
  let currentEstablishments = [];
  let currentListTitle = "";

  /**
   * Encodes an array of establishment IDs into a compact string representation
   *
   * @param {Array<string>} ids - Array of establishment IDs to encode
   * @returns {string} Encoded string representation
   */
  const encodeEstablishmentIds = (ids) => {
    // Convert to base36 representation for more compact encoding
    const base36Ids = ids.map((id) => parseInt(id).toString(36));

    // Create a compact JSON object with the ids
    const dataObj = { i: base36Ids };

    // Convert to JSON and then to base64 for URL safety
    const jsonString = JSON.stringify(dataObj);

    // Use built-in btoa for base64 encoding (browser-compatible)
    return btoa(jsonString);
  };

  /**
   * Gets a saved list by ID
   *
   * @param {string} id - The ID of the saved list to retrieve
   * @returns {object|null} The saved list or null if not found
   */
  const getSavedList = (id) => {
    if (typeof globalThis.localStorage === "undefined") return null;

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
    if (typeof globalThis.localStorage === "undefined") return false;

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
      generateShareUrl();
      shareModal.style.display = "flex";
    });
  }

  if (closeShareModalButton) {
    closeShareModalButton.addEventListener("click", () => {
      shareModal.style.display = "none";
    });
  }

  if (copyShareUrlButton && shareUrlInput) {
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

  // Also close modal when clicking outside
  if (shareModal) {
    shareModal.addEventListener("click", (e) => {
      if (e.target === shareModal) {
        shareModal.style.display = "none";
      }
    });
  }

  /**
   * Generates a shareable URL containing the list title and establishment IDs
   */
  const generateShareUrl = () => {
    if (currentEstablishments.length === 0) return;

    // Extract just the FHRSID from each establishment
    const ids = currentEstablishments.map((est) => est.FHRSID);

    // Create URL parameters with efficient encoding
    const params = new URLSearchParams();
    params.set("title", currentListTitle);
    params.set("data", encodeEstablishmentIds(ids));

    // Generate the complete share URL
    const shareUrl =
      `${globalThis.location.origin}/lists/shared/?${params.toString()}`;

    // Set the URL in the input field
    if (shareUrlInput) {
      shareUrlInput.value = shareUrl;
    }
  };

  // Function to load and display establishments from the specified list
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
      establishments = recentEstablishmentsService.getRecentEstablishments();

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

        establishments = savedList.establishments;

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

    // For client-side pagination, we need a page change handler that updates the view
    // without loading new data from the server
    const handleClientPageChange = async (page) => {
      // Make sure container stays visible
      establishmentsContainer.style.display = "block";

      // Just re-render the current page with the existing establishments
      await establishmentList.loadEstablishments(
        {
          establishments: establishments,
          totalResults: establishments.length,
          currentPage: page,
          pageSize: 10,
        },
        false,
        handleClientPageChange,
      );
    };

    // Load all establishments at once for client-side pagination
    await establishmentList.loadEstablishments(
      {
        establishments: establishments,
        totalResults: establishments.length,
        currentPage: 1,
        pageSize: 10,
      },
      false,
      handleClientPageChange,
    );

    // Double-check visibility after loading
    establishmentsContainer.style.display = "block";
  }

  // Load establishments when the page loads
  loadEstablishments();
});
