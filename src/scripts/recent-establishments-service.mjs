/**
 * @typedef {Object} MinimalEstablishment
 * @property {string} FHRSID - Unique identifier for the establishment
 * @property {string} lastVisited - ISO date string of when the establishment page was last visited
 */

/**
 * Service to manage the tracking of recently viewed establishments
 */
class RecentEstablishmentsService {
  /**
   * Initialize the service with default storage key and maximum items
   */
  constructor() {
    this.STORAGE_KEY = "recent-establishments";
    this.MAX_ITEMS = 30;
  }

  /**
   * Add an establishment to the recent list
   * @param {MinimalEstablishment} establishment
   */
  addEstablishment(establishment) {
    // Don't run in server-side code
    if (typeof globalThis.localStorage === "undefined") return;

    const recentItems = this.getRecentEstablishments();

    // Check if the establishment is already in the list
    const existingIndex = recentItems.findIndex((item) =>
      item.FHRSID === establishment.FHRSID
    );

    if (existingIndex !== -1) {
      // Remove the existing item so we can add it to the top (most recent)
      recentItems.splice(existingIndex, 1);
    }

    // Add the establishment with the current timestamp
    recentItems.unshift({
      ...establishment,
      lastVisited: new Date().toISOString(),
    });

    // Trim the list if it exceeds the maximum number of items
    if (recentItems.length > this.MAX_ITEMS) {
      recentItems.length = this.MAX_ITEMS;
    }

    // Save the updated list to localStorage
    try {
      const serializedData = JSON.stringify(recentItems);
      globalThis.localStorage.setItem(this.STORAGE_KEY, serializedData);
      console.log(`Saved ${recentItems.length} establishments to localStorage`);
    } catch (error) {
      console.error(
        "Error saving recent establishments to localStorage:",
        error,
      );
    }
  }

  /**
   * Get all recent establishments, ordered by most recent first
   * @returns {Array<MinimalEstablishment>} Array of establishment objects
   */
  getRecentEstablishments() {
    // Don't run in server-side code
    if (typeof globalThis.localStorage === "undefined") {
      console.log("localStorage is not available, returning empty array");
      return [];
    }

    try {
      const storedItems = globalThis.localStorage.getItem(this.STORAGE_KEY);

      if (!storedItems) {
        console.log("No stored items found in localStorage");
        return [];
      }

      const parsedItems = JSON.parse(storedItems);

      return parsedItems;
    } catch (error) {
      console.error("Error parsing recent establishments:", error);
      return [];
    }
  }

  /**
   * Clear all recent establishments
   */
  clearRecentEstablishments() {
    // Don't run in server-side code
    if (typeof globalThis.localStorage === "undefined") return;

    globalThis.localStorage.removeItem(this.STORAGE_KEY);
    console.log("Cleared all recent establishments from localStorage");
  }

  /**
   * Get the last visited time for a specific establishment
   *
   * @param {string} FHRSID - The FHRSID of the establishment to lookup
   * @returns {string|null} ISO date string of when the establishment was last visited, or null if not found
   */
  getLastVisitedTime(FHRSID) {
    const recentItems = this.getRecentEstablishments();
    const item = recentItems.find((item) => item.FHRSID === FHRSID);

    return item?.lastVisited || null;
  }
}

// Create a singleton instance
const recentEstablishmentsService = new RecentEstablishmentsService();

export default recentEstablishmentsService;
