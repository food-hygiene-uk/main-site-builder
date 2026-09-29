/**
 * List Selection Modal Component
 * Provides a modal interface for selecting lists to add or remove an establishment.
 */

/**
 * @typedef {import("../../generate-site/schema.mts").Establishment} Establishment
 */

import {
  createNewList,
  getSavedLists,
  updateList,
} from "scripts/list-service.mjs";
import { openModal } from "components/modal/modal.mjs";

/**
 * Initializes the list selection modal content and attaches event listeners.
 *
 * @param {Establishment} establishment - Establishment record
 * @param {HTMLDialogElement} modalElement - The dialog element for the modal.
 */
const initializeListSelectionModal = (establishment, modalElement) => {
  const modalBody = modalElement.querySelector(".modal-body");
  if (!modalBody) return;

  // Clear existing content
  modalBody.replaceChildren();

  // Add a form to create a new list
  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const newListGroup = document.createElement("form");
  newListGroup.className = "new-list-group";

  const newListInput = document.createElement("input");
  newListInput.type = "text";
  newListInput.placeholder = "Enter new list name";
  newListInput.required = true;
  newListInput.className = "styled-input";

  const newListButton = document.createElement("button");
  newListButton.type = "submit";
  newListButton.textContent = "Create New List";
  newListButton.className = "primary-button";

  newListGroup.append(newListInput);
  newListGroup.append(newListButton);
  modalContent.append(newListGroup);
  modalBody.append(modalContent);

  const savedList = document.createElement("div");
  savedList.className = "saved-list";
  modalBody.append(savedList);

  const buttonGroup = document.createElement("div");
  buttonGroup.className = "button-group";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "Close";
  closeButton.className = "primary-button";

  buttonGroup.append(closeButton);
  modalBody.append(buttonGroup);

  closeButton.addEventListener("click", () => {
    modalElement.close();
  });

  newListGroup.addEventListener("submit", (event) => {
    event.preventDefault();
    const listName = newListInput.value.trim();
    if (!listName) {
      return; // Do not create a list with an empty name
    }

    createNewList(listName, establishment.FHRSID);
    newListInput.value = "";
    updateCheckboxStates(establishment.FHRSID, modalElement);
  });

  // Attach a single event listener to the modal body for checkbox changes
  modalBody.addEventListener("change", (event) => {
    const target = event.target;
    if (!target.classList.contains("styled-checkbox")) {
      return;
    }

    const listId = target.dataset.listId;
    const isChecked = target.checked;
    updateList(establishment, listId, isChecked);
    // After updating the list, refresh the checkbox states within this specific modal
    updateCheckboxStates(establishment.FHRSID, modalElement);
  });
};

/**
 * Updates the state of the checkboxes in the modal.
 *
 * @param {string} FHRSID - The unique identifier of the establishment.
 * @param {HTMLDialogElement} modalElement - The dialog element for the modal.
 */
const updateCheckboxStates = (FHRSID, modalElement) => {
  const savedLists = getSavedLists();
  const savedListContainer = modalElement.querySelector(".saved-list");

  if (!savedListContainer) return;

  // Clear existing content
  savedListContainer.replaceChildren();

  // Re-render the saved lists
  for (const [listId, list] of Object.entries(savedLists)) {
    const listItem = document.createElement("div");
    listItem.className = "list-item styled-list-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "styled-checkbox";
    checkbox.id = `list-${listId}`;
    checkbox.dataset.listId = listId;
    checkbox.checked = list.establishments.some((est) => est.FHRSID === FHRSID);

    const label = document.createElement("label");
    label.htmlFor = `list-${listId}`;
    label.textContent = list.name;

    listItem.append(checkbox);
    listItem.append(label);
    savedListContainer.append(listItem);
  }
};

/**
 * Opens a list selection modal for managing an establishment's lists.
 *
 * @param {Establishment} establishment - Establishment record
 * @param {() => void} onClose - Callback function invoked when the modal is closed.
 */
export const openListSelectionModal = async (establishment, onClose) => {
  // Create a placeholder div. openModal will place this inside its own .modal-body.
  // initializeListSelectionModal will then populate that .modal-body.
  const contentPlaceholder = document.createElement("div");

  const dialogElement = await openModal(
    "Manage Lists",
    contentPlaceholder,
    onClose,
  );

  // Initialize the modal content and attach event listeners, scoped to the dialog
  initializeListSelectionModal(establishment.FHRSID, dialogElement);

  // Update checkbox states dynamically, scoped to the dialog
  updateCheckboxStates(establishment.FHRSID, dialogElement);
};
