/**
 * Modal component for displaying dynamic content using HTMLDialogElement.
 */

/**
 * Adds the CSS link for the component to the document head.
 */
const cssReady = new Promise((resolve, reject) => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/components/modal/modal.css";

  link.addEventListener("load", () => resolve());
  link.addEventListener("error", () => reject(new Error("Failed to load CSS")));

  document.head.append(link);
});

/**
 * Opens a modal with the specified content.
 *
 * @param {string} title - The title of the modal.
 * @param {HTMLElement} content - The content to display inside the modal.
 * @param {() => void} [onCloseCallback] - Optional callback invoked when the modal is closed.
 * @returns {HTMLDialogElement} The created modal dialog element.
 */
export const openModal = async (title, content, onCloseCallback) => {
  // Create the dialog element
  const dialog = document.createElement("dialog");
  dialog.className = "modal-dialog box-shadow";

  // Modal content structure
  dialog.innerHTML = `
    <form method="dialog" class="modal-form">
      <header class="modal-header">
        <h2>${title}</h2>
        <button type="button" aria-label="Close" class="modal-close-button">×</button>
      </header>
      <div class="modal-body"></div>
    </form>
  `;

  const closeButton = dialog.querySelector(".modal-close-button");
  closeButton.addEventListener("click", () => {
    dialog.close();
  });

  // Append the dynamic content to the modal body
  const modalBody = dialog.querySelector(".modal-body");
  modalBody.append(content);

  // Handle the close event
  dialog.addEventListener("close", () => {
    // Remove the dialog from the DOM when it's closed
    dialog.remove();

    if (typeof onCloseCallback === "function") {
      onCloseCallback();
    }
  });

  // Append dialog to the body and show it
  document.body.append(dialog);
  dialog.showModal();

  return cssReady.then(() => dialog);
};
