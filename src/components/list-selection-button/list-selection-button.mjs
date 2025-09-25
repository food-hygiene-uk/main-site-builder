import { isEstablishmentOnList } from "scripts/list-service.mjs";
import { openListSelectionModal } from "components/modal/list-selection.mjs";

/**
 * Adds the CSS link for the component to the document head.
 */
{
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/components/list-selection-button/list-selection-button.css";
  document.head.append(link);
}

/**
 * Renders an "Add to List" button with a bookmark icon and "Save" text.
 * The button changes appearance to indicate if the establishment is already on a list.
 *
 * @param {string} FHRSID - The unique identifier of the establishment.
 * @returns {HTMLElement} The rendered "Add to List" button element.
 */
export const renderListSelectionButton = (FHRSID) => {
  const listSelectionButton = document.createElement("button");
  listSelectionButton.className = "list-selection-button";

  // Add the bookmark icon and text
  listSelectionButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="bookmark-icon">
      <g>
        <path d="M18 4v15.06l-5.42-3.87-.58-.42-.58.42L6 19.06V4h12m1-1H5v18l7-5 7 5V3z"></path>
        <path class="interior" d="M18 4v15.06l-5.42-3.87-.58-.42-.58.42L6 19.06V4h12z" fill="transparent"></path>
      </g>
    </svg>
  `;

  const buttonText = document.createElement("span");
  buttonText.textContent = "Save";
  listSelectionButton.append(buttonText);

  // Check if the establishment is already on a list (excluding recent)
  const isOnList = isEstablishmentOnList(FHRSID);
  if (isOnList) {
    listSelectionButton.classList.add("on-list"); // Apply a visual indicator
  }

  // Add event listener to open the modal
  listSelectionButton.addEventListener("click", () => {
    openListSelectionModal(FHRSID, () => {
      // Reevaluate if the establishment is on the list after the modal is closed
      const updatedIsOnList = isEstablishmentOnList(FHRSID);
      listSelectionButton.classList.toggle("on-list", updatedIsOnList);
    });
  });

  return listSelectionButton;
};
