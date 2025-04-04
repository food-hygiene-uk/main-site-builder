// Storage key for saved lists
const SAVED_LISTS_STORAGE_KEY = "saved-establishment-lists";

document.addEventListener("DOMContentLoaded", () => {
  const userListsContainer = document.getElementById("userLists");
  const noListsMessage = document.getElementById("noLists");

  /**
   * Gets all saved lists from localStorage
   *
   * @returns {Object} Object containing all saved lists
   */
  const getSavedLists = () => {
    if (typeof globalThis.localStorage === "undefined") return {};

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
    if (typeof globalThis.localStorage === "undefined") return false;

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
    listEntries.forEach(([listId, listData]) => {
      const listItem = document.createElement("div");
      listItem.className = "list-item user-list";

      const listName = document.createElement("h2");
      listName.textContent = listData.name;

      const listDescription = document.createElement("p");
      listDescription.textContent =
        `${listData.establishments.length} establishments • Saved on ${
          new Date(listData.created).toLocaleDateString()
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
        (e) => handleDeleteClick(e, listId),
      );

      listActions.appendChild(viewButton);
      listActions.appendChild(deleteButton);

      listItem.appendChild(listName);
      listItem.appendChild(listDescription);
      listItem.appendChild(listActions);

      userListsContainer.appendChild(listItem);
    });
  };

  // Render saved lists when the page loads
  renderSavedLists();
});
