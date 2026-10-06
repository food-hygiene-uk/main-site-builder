/**
 * @typedef {import("scripts/recent-establishments-service.mjs").MinimalEstablishment} MinimalEstablishment
 * @typedef {import("../../../generate-site/schema.mts").Establishment} Establishment
 */

import recentEstablishmentsService from "scripts/recent-establishments-service.mjs";
import { renderListSelectionButton } from "components/list-selection-button/list-selection-button.mjs";
import { lacToRegionSlug } from "scripts/region.mjs";

/**
 * Formats a date as a relative time (e.g., "2 days ago")
 *
 * @param {string} date - ISO date string to format
 * @returns {string} Formatted relative time string
 */
export function formatRelativeTime(date) {
  const now = Date.now();
  const diffMs = now - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 30) {
    return `${Math.floor(diffDay / 30)} months ago`;
  }
  if (diffDay > 0) {
    return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  }
  if (diffHour > 0) {
    return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  }
  return diffMin > 0
    ? `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`
    : "just now";
}

/**
 * Formats a date string into a human-readable format
 *
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string or "Not available" if no date
 */
export function formatDate(dateString) {
  if (!dateString) return "Not available";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Creates a URL-friendly slug from a text string
 *
 * @param {string} text - The text to convert to a slug
 * @returns {string} URL-friendly slug
 */
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replaceAll(/\s+/g, "-")
    .replaceAll(/[^\w\-]+/g, "")
    .replaceAll(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Establishment Card custom element
 */
export class EstablishmentCard extends HTMLElement {
  /**
   * @type {Establishment | MinimalEstablishment | null}
   */
  #establishment = null;

  /**
   * Creates a new EstablishmentCard element.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  /**
   * Renders the establishment card content inside Shadow DOM
   *
   * @returns {Promise<void>}
   */
  async #render() {
    const establishment = this.#establishment;
    const shadow = this.shadowRoot;
    if (!shadow || !establishment) {
      return;
    }

    const FHRSID = establishment.FHRSID;
    if (!FHRSID) {
      console.error("Missing FHRSID for establishment:", establishment);
      shadow.replaceChildren();
      return;
    }

    const lastVisited = recentEstablishmentsService.getLastVisitedTime(FHRSID);

    shadow.replaceChildren();

    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = "/components/establishment-card/establishment-card.css";
    shadow.append(linkElement);

    const nameElement = document.createElement("h3");
    nameElement.textContent = establishment.BusinessName;
    shadow.append(nameElement);

    const details = document.createElement("div");
    details.className = "establishment-details";

    // Left column
    const leftCol = document.createElement("div");

    if (establishment.BusinessType) {
      const typeElement = document.createElement("p");
      typeElement.className = "business-type";
      typeElement.textContent = establishment.BusinessType;
      leftCol.append(typeElement);
    }

    // Address if available
    if (
      establishment.AddressLine1 ||
      establishment.AddressLine2 ||
      establishment.AddressLine3 ||
      establishment.AddressLine4 ||
      establishment.PostCode
    ) {
      const addressParts = [
        ...(establishment.AddressLine1 ? [establishment.AddressLine1] : []),
        ...(establishment.AddressLine2 ? [establishment.AddressLine2] : []),
        ...(establishment.AddressLine3 ? [establishment.AddressLine3] : []),
        ...(establishment.AddressLine4 ? [establishment.AddressLine4] : []),
        ...(establishment.PostCode ? [establishment.PostCode] : []),
      ];

      if (addressParts.length > 0) {
        const addressElement = document.createElement("address");
        addressElement.textContent = addressParts.join(", ");
        leftCol.append(addressElement);
      }
    }

    // Right column
    const rightCol = document.createElement("div");

    // Rating information
    const rating = establishment.RatingValue;
    if (rating) {
      const ratingClass = `rating-${rating}`;
      const ratingText = `Rating: ${rating}`;

      const ratingP = document.createElement("p");
      const badge = document.createElement("span");
      badge.className = `rating-badge ${ratingClass}`;
      badge.textContent = ratingText;
      ratingP.append(badge);
      rightCol.append(ratingP);

      const ratingDate = establishment.RatingDate;
      if (ratingDate) {
        const dateP = document.createElement("p");
        dateP.textContent = `Last inspection: ${formatDate(ratingDate)}`;
        rightCol.append(dateP);
      }
    }

    // Last visited info
    if (lastVisited) {
      const visitedP = document.createElement("p");
      visitedP.className = "viewed-time";
      visitedP.textContent = `Viewed ${formatRelativeTime(lastVisited)}`;
      rightCol.append(visitedP);
    }

    details.append(leftCol, rightCol);
    shadow.append(details);

    // Detail link covering entire card
    const link = document.createElement("a");
    const regionSlug = lacToRegionSlug[establishment.LocalAuthorityCode];
    link.href = regionSlug
      ? `/region-${regionSlug}/${
        slugify(
          establishment.BusinessName,
        )
      }-${establishment.FHRSID}`
      : `#`;
    link.className = "details-link";
    link.textContent = "View details";
    shadow.append(link);

    // Button container with slot for actions
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "button-container";
    const slot = document.createElement("slot");
    slot.name = "action";
    buttonContainer.append(slot);
    shadow.append(buttonContainer);

    // Provide default list-selection-button if no action is provided and not disabled
    if (
      this.hasAttribute("no-action") ||
      this.querySelector('[slot="action"]')
    ) {
      return;
    }

    const listSelectionButton = await renderListSelectionButton(establishment);
    listSelectionButton.slot = "action";
    this.append(listSelectionButton);
  }

  /**
   * Invoked when the element is connected to the DOM.
   */
  connectedCallback() {
    if (this.#establishment && this.shadowRoot?.children.length === 0) {
      this.#render();
    }
  }

  /**
   * Gets the establishment data
   *
   * @returns {Establishment | MinimalEstablishment | null} The establishment data
   */
  get establishment() {
    return this.#establishment;
  }

  /**
   * Sets the establishment data and updates the card display
   *
   * @param {Establishment | MinimalEstablishment | null} value - Establishment data
   */
  set establishment(value) {
    this.#establishment = value;

    if (value?.FHRSID) {
      this.dataset.establishmentId = String(value.FHRSID);
      this.setAttribute("establishment-id", String(value.FHRSID));
    }

    this.#render();
  }
}

// Safely register custom element
if (!customElements.get("establishment-card")) {
  customElements.define("establishment-card", EstablishmentCard);
}

/**
 * Renders an establishment card custom element
 *
 * @param {Establishment|MinimalEstablishment} establishment - The establishment to render
 * @returns {Promise<EstablishmentCard>} Promise resolving to the rendered establishment card element
 */
export async function renderEstablishmentCard(establishment) {
  const card = new EstablishmentCard();
  card.establishment = establishment;
  return card;
}
