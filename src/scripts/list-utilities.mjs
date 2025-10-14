/**
 * @typedef {import("components/establishment-card/establishment-card.mjs").Establishment} Establishment
 */

/**
 * Filter establishments by name
 *
 * @param {Array<Establishment>} establishments - Establishments to filter
 * @param {string} filterText - Text to filter by
 * @returns {Array<Establishment>} Filtered establishments
 */
export const filterEstablishments = (establishments, filterText) => {
  if (!filterText) return establishments;

  const filterTextLower = filterText.toLowerCase();
  return establishments.filter((establishment) =>
    establishment.BusinessName.toLowerCase().includes(filterTextLower)
  );
};

/**
 * Slices an array of establishments to get the items for a specific page.
 *
 * @param {Array<Establishment>} establishments - The full array of establishments to paginate.
 * @param {number} page - The current page number (1-based).
 * @param {number} pageSize - The number of items per page.
 * @returns {Array<Establishment>} A new array containing the establishments for the specified page.
 */
export const sliceEstablishments = (establishments, page, pageSize) => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return establishments.slice(startIndex, endIndex);
};
