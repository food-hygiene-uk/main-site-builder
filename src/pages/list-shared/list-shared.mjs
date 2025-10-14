import { EstablishmentList } from "components/establishment-list/establishment-list.mjs";
import { DEFAULT_SORT_CONFIG } from "components/establishment-display/establishment-display.mjs";
import { openModal } from "components/modal/modal.mjs";
import {
  fetchEstablishmentDetails,
  sortEstablishments,
} from "scripts/establishment.mjs";
import {
  filterEstablishments,
  sliceEstablishments,
} from "scripts/list-utilities.mjs";

// Storage key for saved lists
const SAVED_LISTS_STORAGE_KEY = "saved-establishment-lists";
const PAGE_SIZE = 10;

// module scope variables
const establishmentView = {
  page: 1,
  filterText: "",
  sortOption: DEFAULT_SORT_CONFIG.defaultSortOption,
  sortDirection: DEFAULT_SORT_CONFIG.defaultSortDirection,
};

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
    const dataObject = JSON.parse(jsonString);

    // Convert the base36 ids back to decimal
    return dataObject.i.map((id) => Number.parseInt(id, 36).toString());
  } catch (error) {
    console.error("Error decoding establishment IDs:", error);
    return [];
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const listTitle = document.querySelector("#listTitle");
  const listDescription = document.querySelector("#listDescription");
  const establishmentsContainer = document.querySelector("#establishmentsList");
  const emptyListMessage = document.querySelector("#emptyList");
  const errorMessage = document.querySelector("#errorMessage");
  const loadingIndicator = document.querySelector("#loading");
  const saveListButton = document.querySelector("#saveListButton");

  // Store loaded establishments for saving
  let loadedEstablishments = [];

  // Get shared list parameters from URL
  const urlParameters = new URLSearchParams(globalThis.location.search);
  const sharedTitle = urlParameters.get("title") || "Shared List";

  // Get the encoded data and decode it
  let establishmentIds = [];
  if (urlParameters.has("data")) {
    const encodedData = urlParameters.get("data");
    establishmentIds = decodeEstablishmentIds(encodedData);
  }

  // Store loaded establishments for filtering/sorting/pagination
  let allEstablishments = [];

  const handleClientPageChange = async (page) => {
    establishmentView.page = page;
    renderEstablishments();
  };

  const handleFilterChange = async (filterText) => {
    establishmentView.filterText = filterText;
    establishmentView.page = 1; // Reset to first page on filter change
    renderEstablishments();
  };

  const handleSortChange = async (sortOption, sortDirection) => {
    establishmentView.sortOption = sortOption;
    establishmentView.sortDirection = sortDirection;
    establishmentView.page = 1; // Reset to first page on sort change
    renderEstablishments();
  };

  /**
   * Renders establishments based on current state (filter, sort, page)
   */
  const renderEstablishments = async () => {
    const filteredEstablishments = filterEstablishments(
      allEstablishments,
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
      PAGE_SIZE,
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
  };

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
    defaultSortOption: establishmentView.sortOption,
    defaultSortDirection: establishmentView.sortDirection,
  });

  /**
   * Saves a list of establishments to localStorage
   *
   * @param {string} listName - The name of the list to save
   * @param {Array<object>} establishments - Array of establishment objects to save
   * @returns {string | null} The ID of the saved list or null on error
   */
  const saveList = (listName, establishments) => {
    // Don't run in server-side code
    if (globalThis.localStorage === undefined) return null;

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
   * Handles saving the list and redirecting to the saved list page
   *
   * @param {string} listName - The name for the new list.
   * @param {() => void} closeModalCallback - Callback to close the modal.
   */
  const handleSaveList = (listName, closeModalCallback) => {
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
    if (closeModalCallback) {
      closeModalCallback();
    }
  };

  /**
   * Shows the save list modal
   */
  const showSaveModal = () => {
    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    const instruction = document.createElement("p");
    instruction.textContent = "Give this list a name to save it to your lists:";
    modalContent.append(instruction);

    const listNameInput = document.createElement("input");
    listNameInput.type = "text";
    listNameInput.placeholder = "Enter a name for this list";
    listNameInput.value = sharedTitle; // Pre-populate
    listNameInput.className = "styled-input";
    modalContent.append(listNameInput);

    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "button-group";

    const confirmSaveButton = document.createElement("button");
    confirmSaveButton.textContent = "Save";
    confirmSaveButton.className = "primary-button";

    const cancelSaveButton = document.createElement("button");
    cancelSaveButton.textContent = "Cancel";
    cancelSaveButton.className = "secondary-button";

    buttonsContainer.append(confirmSaveButton);
    buttonsContainer.append(cancelSaveButton);
    modalContent.append(buttonsContainer);

    let dialogElement; // To store the reference to the modal dialog element

    const closeDialog = () => {
      if (dialogElement) {
        dialogElement.close(); // This will trigger the 'close' event on the dialog
        // The dialog removes itself on the 'close' event (handled in openModal)
      }
    };

    // The onCloseCallback for openModal, called when the dialog is closed.
    const onModalClosed = () => {
      dialogElement = null; // Clear the reference
    };

    dialogElement = openModal("Save This List", modalContent, onModalClosed);

    confirmSaveButton.addEventListener("click", () => {
      const listName = listNameInput.value.trim() || sharedTitle;
      handleSaveList(listName, closeDialog); // handleSaveList will call closeDialog
    });

    cancelSaveButton.addEventListener("click", closeDialog);

    listNameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault(); // Prevent form submission if it were in a form
        const listName = listNameInput.value.trim() || sharedTitle;
        handleSaveList(listName, closeDialog); // handleSaveList will call closeDialog
      }
    });
    listNameInput.focus();
    listNameInput.select();
  };

  // Set up event listeners for the save functionality
  if (saveListButton) {
    saveListButton.addEventListener("click", showSaveModal);
  }

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
    if (establishmentIds.length === 0) {
      establishmentList.showError("No establishments found in the shared list");
      return;
    }

    try {
      // Load all establishments in parallel
      const establishmentPromises = establishmentIds.map((id) =>
        fetchEstablishmentDetails(id)
      );
      const establishments = await Promise.all(establishmentPromises);

      // Filter out any failed loads (nulls)
      const validEstablishments = establishments.filter(
        (establishment) => establishment !== null,
      );

      // Store the loaded establishments for saving later
      loadedEstablishments = validEstablishments;
      allEstablishments = validEstablishments;

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

      // Reset view state
      establishmentView.page = 1;
      establishmentView.filterText = "";
      establishmentView.sortOption = DEFAULT_SORT_CONFIG.defaultSortOption;
      establishmentView.sortDirection =
        DEFAULT_SORT_CONFIG.defaultSortDirection;

      // Render establishments using the new pattern
      await renderEstablishments();

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
