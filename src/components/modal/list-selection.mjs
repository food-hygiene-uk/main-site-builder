/**
 * List Selection Modal Component
 * Provides a modal interface for selecting lists to add or remove an establishment.
 */

import {
  createNewList,
  getSavedLists,
  updateList,
} from "scripts/list-service.mjs";
import { openModal } from "components/modal/modal.mjs";

/**
 * Initializes the list selection modal content and attaches event listeners.
 * @param {string} FHRSID - The unique identifier of the establishment.
 */
const initializeListSelectionModal = (FHRSID) => {
  const modalBody = document.querySelector(".modal-body");
  if (!modalBody) return;

  // Clear existing content
  modalBody.innerHTML = "";

  const savedLists = getSavedLists();

  // Add a form to create a new list
  const newListForm = document.createElement("form");
  newListForm.className = "new-list-form styled-form";

  const newListInput = document.createElement("input");
  newListInput.type = "text";
  newListInput.placeholder = "Enter new list name";
  newListInput.required = true;
  newListInput.className = "styled-input";

  const newListButton = document.createElement("button");
  newListButton.type = "submit";
  newListButton.textContent = "Create List";
  newListButton.className = "styled-button";

  newListForm.appendChild(newListInput);
  newListForm.appendChild(newListButton);
  modalBody.appendChild(newListForm);

  newListForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const listName = newListInput.value.trim();
    if (listName) {
      createNewList(listName, FHRSID);
      newListInput.value = "";
      updateCheckboxStates(FHRSID);
    }
  });

  // Add existing lists with checkboxes
  Object.entries(savedLists).forEach(([listId, list]) => {
    const listItem = document.createElement("div");
    listItem.className = "list-item styled-list-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "styled-checkbox";
    checkbox.dataset.listId = listId; // Store the list ID for reference

    listItem.appendChild(checkbox);
    listItem.appendChild(document.createTextNode(list.name));
    modalBody.appendChild(listItem);
  });

  // Attach a single event listener to the modal body for checkbox changes
  modalBody.addEventListener("change", (event) => {
    const target = event.target;
    if (target.classList.contains("styled-checkbox")) {
      const listId = target.dataset.listId;
      const isChecked = target.checked;
      updateList(FHRSID, listId, isChecked);
    }
  });
};

/**
 * Updates the state of the checkboxes in the modal.
 * @param {string} FHRSID - The unique identifier of the establishment.
 */
const updateCheckboxStates = (FHRSID) => {
  const savedLists = getSavedLists();
  const checkboxes = document.querySelectorAll(".styled-checkbox");

  checkboxes.forEach((checkbox) => {
    const listId = checkbox.dataset.listId;
    const list = savedLists[listId];
    checkbox.checked = list &&
      list.establishments.some((est) => est.FHRSID === FHRSID);
  });
};

/**
 * Opens a list selection modal for managing an establishment's lists.
 * @param {string} FHRSID - The unique identifier of the establishment.
 * @param {function} onClose - Callback function invoked when the modal is closed.
 */
export const openListSelectionModal = (FHRSID, onClose) => {
  const content = document.createElement("div");
  content.className = "modal-body";

  // Open the modal with an empty body initially
  openModal("Manage Lists", content, onClose);

  // Initialize the modal content and attach event listeners
  initializeListSelectionModal(FHRSID);

  // Update checkbox states dynamically
  updateCheckboxStates(FHRSID);
};
