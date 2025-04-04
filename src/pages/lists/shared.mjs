import { EstablishmentList } from "components/establishment-list/establishment-list.mjs";

// FHRS API Configuration
const API_BASE = "https://api.ratings.food.gov.uk";
const API_HEADERS = {
  "accept": "application/json",
  "x-api-version": "2",
};

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
  const saveListButton = document.getElementById("saveListButton");
  const saveModal = document.getElementById("saveModal");
  const listNameInput = document.getElementById("listNameInput");
  const confirmSaveButton = document.getElementById("confirmSaveButton");
  const cancelSaveButton = document.getElementById("cancelSaveButton");

  // Store loaded establishments for saving
  let loadedEstablishments = [];

  // Get shared list parameters from URL
  const urlParams = new URLSearchParams(globalThis.location.search);
  const sharedTitle = urlParams.get("title") || "Shared List";

  /**
   * Decodes a compact string representation back into an array of establishment IDs
   *
   * @param {string} encoded - The encoded string to decode
   * @returns {Array<string>} Array of decoded establishment IDs
   */
  const decodeEstablishmentIds = (encoded) => {
    try {
      // Decode the base64 string
      const jsonString = atob(encoded);

      // Parse the JSON
      const dataObj = JSON.parse(jsonString);

      // Convert the base36 ids back to decimal
      return dataObj.i.map((id) => parseInt(id, 36).toString());
    } catch (error) {
      console.error("Error decoding establishment IDs:", error);
      return [];
    }
  };

  // Get the encoded data and decode it
  let establishmentIds = [];
  if (urlParams.has("data")) {
    const encodedData = urlParams.get("data");
    establishmentIds = decodeEstablishmentIds(encodedData);
  }

  // Initialize the establishment list component
  const establishmentList = new EstablishmentList({
    container: establishmentsContainer,
    loadingElement: loadingIndicator,
    emptyElement: emptyListMessage,
    errorElement: errorMessage,
    pageSize: 10,
    enableViewToggle: true,
  });

  /**
   * Loads establishment details for a single establishment by ID
   *
   * @param {string} id - The FHRSID of the establishment to load
   * @returns {Promise<object|null>} The establishment data or null if not found
   */
  const loadEstablishmentById = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/Establishments/${id}`, {
        headers: API_HEADERS,
      });

      if (!response.ok) {
        console.error(
          `Failed to fetch establishment ${id}: ${response.status}`,
        );
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching establishment ${id}:`, error);
      return null;
    }
  };

  /**
   * Saves a list of establishments to localStorage
   *
   * @param {string} listName - The name of the list to save
   * @param {Array<object>} establishments - Array of establishment objects to save
   * @returns {string} The ID of the saved list
   */
  const saveList = (listName, establishments) => {
    // Don't run in server-side code
    if (typeof globalThis.localStorage === "undefined") return null;

    try {
      // Get existing saved lists
      let savedLists = {};
      const savedListsJson = globalThis.localStorage.getItem(
        SAVED_LISTS_STORAGE_KEY,
      );

      if (savedListsJson) {
        savedLists = JSON.parse(savedListsJson);
      }

      // Create a unique ID for the list
      const listId = `list_${Date.now()}`;

      // Create minimal establishment objects (just essential data)
      const minimalEstablishments = establishments.map((est) => ({
        FHRSID: est.FHRSID,
        BusinessName: est.BusinessName,
        BusinessType: est.BusinessType,
        AddressLine1: est.AddressLine1,
        PostCode: est.PostCode,
        RatingValue: est.RatingValue,
        RatingDate: est.RatingDate,
      }));

      // Save the list
      savedLists[listId] = {
        name: listName,
        created: new Date().toISOString(),
        establishments: minimalEstablishments,
      };

      // Store back to localStorage
      globalThis.localStorage.setItem(
        SAVED_LISTS_STORAGE_KEY,
        JSON.stringify(savedLists),
      );

      console.log(
        `Saved list "${listName}" with ${establishments.length} establishments`,
      );
      return listId;
    } catch (error) {
      console.error("Error saving list:", error);
      return null;
    }
  };

  /**
   * Shows the save list modal
   */
  const showSaveModal = () => {
    // Pre-populate with the shared title
    listNameInput.value = sharedTitle;
    saveModal.style.display = "flex";
    listNameInput.focus();
    listNameInput.select();
  };

  /**
   * Hides the save list modal
   */
  const hideSaveModal = () => {
    saveModal.style.display = "none";
  };

  /**
   * Handles saving the list and redirecting to the saved list page
   */
  const handleSaveList = () => {
    const listName = listNameInput.value.trim() || sharedTitle;

    if (loadedEstablishments.length === 0) {
      alert("Cannot save an empty list.");
      return;
    }

    const listId = saveList(listName, loadedEstablishments);

    if (listId) {
      // Redirect to the saved list
      globalThis.location.href = `/lists/detail/?id=${listId}`;
    } else {
      alert("Sorry, there was an error saving your list. Please try again.");
    }
  };

  // Set up event listeners for the save functionality
  if (saveListButton) {
    saveListButton.addEventListener("click", showSaveModal);
  }

  if (confirmSaveButton) {
    confirmSaveButton.addEventListener("click", handleSaveList);
  }

  if (cancelSaveButton) {
    cancelSaveButton.addEventListener("click", hideSaveModal);
  }

  if (listNameInput) {
    // Allow pressing Enter to save
    listNameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleSaveList();
      }
    });
  }

  // Close modal when clicking outside
  saveModal.addEventListener("click", (e) => {
    if (e.target === saveModal) {
      hideSaveModal();
    }
  });

  /**
   * Loads all establishments from the shared list
   */
  const loadSharedList = async () => {
    // Show loading state
    await establishmentList.loadEstablishments({ establishments: [] }, true);

    // Update page title and description
    listTitle.textContent = sharedTitle;
    listDescription.textContent = "Loading shared establishments...";
    document.title = `${sharedTitle} - Food Hygiene Ratings`;

    // Check if we have IDs to load
    if (!establishmentIds.length) {
      establishmentList.showError("No establishments found in the shared list");
      return;
    }

    try {
      // Load all establishments in parallel
      const establishmentPromises = establishmentIds.map((id) =>
        loadEstablishmentById(id)
      );
      const establishments = await Promise.all(establishmentPromises);

      // Filter out any failed loads (nulls)
      const validEstablishments = establishments.filter((e) => e !== null);

      // Store the loaded establishments for saving later
      loadedEstablishments = validEstablishments;

      // Update description
      listDescription.textContent =
        `${validEstablishments.length} establishments shared with you`;

      // Show save button if we have establishments
      if (validEstablishments.length > 0 && saveListButton) {
        saveListButton.style.display = "inline-flex";
      }

      // Handle empty result
      if (validEstablishments.length === 0) {
        if (emptyListMessage) {
          emptyListMessage.style.display = "block";
        }
        if (establishmentsContainer) {
          establishmentsContainer.style.display = "none";
        }
        return;
      }

      // For client-side pagination
      const handleClientPageChange = async (page) => {
        establishmentsContainer.style.display = "block";

        await establishmentList.loadEstablishments(
          {
            establishments: validEstablishments,
            totalResults: validEstablishments.length,
            currentPage: page,
            pageSize: 10,
          },
          false,
          handleClientPageChange,
        );
      };

      // Load all establishments for client-side pagination
      await establishmentList.loadEstablishments(
        {
          establishments: validEstablishments,
          totalResults: validEstablishments.length,
          currentPage: 1,
          pageSize: 10,
        },
        false,
        handleClientPageChange,
      );

      // Ensure visibility
      establishmentsContainer.style.display = "block";
    } catch (error) {
      console.error("Error loading shared list:", error);
      establishmentList.showError("Failed to load the shared establishments");
    }
  };

  // Load shared list on page load
  loadSharedList();
});
