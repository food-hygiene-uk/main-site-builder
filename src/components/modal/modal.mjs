/**
 * Modal component for displaying dynamic content.
 */

/**
 * Adds the CSS link for the component to the document head.
 */
{
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/components/modal/modal.css";
  document.head.appendChild(link);
}

/**
 * Opens a modal with the specified content.
 * @param {string} title - The title of the modal.
 * @param {HTMLElement} content - The content to display inside the modal.
 * @param {Function} [onClose] - Optional callback invoked when the modal is closed.
 */
export const openModal = (title, content, onClose) => {
  // Create the modal container
  const modal = document.createElement("div");
  modal.className = "modal-container";

  // Modal content
  modal.innerHTML = `
    <div class="modal-content">
      <h2>${title}</h2>
      <div class="modal-body"></div>
      <button id="close-modal">Close</button>
    </div>
  `;

  // Append the content to the modal body
  const modalBody = modal.querySelector(".modal-body");
  modalBody.appendChild(content);

  // Close modal functionality
  modal.querySelector("#close-modal").addEventListener("click", () => {
    modal.remove();
    if (typeof onClose === "function") {
      onClose();
    }
  });

  // Append modal to the body
  document.body.appendChild(modal);
};
