import { getListCreationDate } from "scripts/list-service.mjs";

// Storage key for saved lists
const SAVED_LISTS_STORAGE_KEY = "saved-establishment-lists";

/**
 * @typedef {object} Establishment
 * @property {string} id - The unique identifier for the establishment.
 * @property {string} name - The name of the establishment.
 */

/**
 * Gets all saved lists from localStorage
 *
 * @returns {{ [key: string]: { name: string; establishments: Establishment[] } }} Object containing all saved lists
 */
const getSavedLists = () => {
  if (globalThis.localStorage === "undefined") return {};

  try {
    const savedListsJson = globalThis.localStorage.getItem(
      SAVED_LISTS_STORAGE_KEY,
    );
    return savedListsJson ? JSON.parse(savedListsJson) : {};
  } catch (error) {
    console.error("Error retrieving saved lists:", error);
    return {};
  }
};

/**
 * Deletes a saved list by ID
 *
 * @param {string} listId - The ID of the list to delete
 * @returns {boolean} True if deletion was successful
 */
const deleteList = (listId) => {
  if (globalThis.localStorage === undefined) return false;

  try {
    const savedLists = getSavedLists();

    // Check if the list exists
    if (!savedLists[listId]) {
      return false;
    }

    // Delete the list
    delete savedLists[listId];

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

document.addEventListener("DOMContentLoaded", () => {
  const userListsContainer = document.querySelector("#userLists");
  const noListsMessage = document.querySelector("#noLists");

  /**
   * Handles the delete button click event
   *
   * @param {Event} event - The click event
   * @param {string} listId - The ID of the list to delete
   */
  const handleDeleteClick = (event, listId) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      confirm(
        "Are you sure you want to delete this list? This action cannot be undone.",
      )
    ) {
      if (deleteList(listId)) {
        // Refresh the list display
        renderSavedLists();
      } else {
        alert("There was a problem deleting the list. Please try again.");
      }
    }
  };

  /**
   * Renders the saved lists in the UI
   */
  const renderSavedLists = () => {
    // Get saved lists
    const savedLists = getSavedLists();
    const listEntries = Object.entries(savedLists);

    // Clear existing content
    if (userListsContainer) {
      userListsContainer.innerHTML = "";
    }

    // Show message if no lists
    if (listEntries.length === 0) {
      if (noListsMessage) {
        noListsMessage.style.display = "block";
      }
      return;
    }

    // Hide no lists message
    if (noListsMessage) {
      noListsMessage.style.display = "none";
    }

    // Create elements for each list
    for (const [listId, listData] of listEntries) {
      const listItem = document.createElement("div");
      listItem.className = "list-item user-list box-shadow-hover";

      const listName = document.createElement("h2");
      listName.textContent = listData.name;

      const listDescription = document.createElement("p");
      listDescription.textContent =
        `${listData.establishments.length} establishments • Saved on ${
          getListCreationDate(
            listId,
          ).toLocaleDateString()
        }`;

      const listActions = document.createElement("div");
      listActions.className = "list-actions";

      const viewButton = document.createElement("a");
      viewButton.href = `/lists/detail/?id=${listId}`;
      viewButton.className = "view-list-button";
      viewButton.textContent = "View List";

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-list-button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener(
        "click",
        (event) => handleDeleteClick(event, listId),
      );

      listActions.append(viewButton);
      listActions.append(deleteButton);

      listItem.append(listName);
      listItem.append(listDescription);
      listItem.append(listActions);

      userListsContainer.append(listItem);
    }
  };

  // Render saved lists when the page loads
  renderSavedLists();
});
