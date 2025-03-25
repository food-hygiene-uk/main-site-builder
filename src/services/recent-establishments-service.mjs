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
   * @param {Object} establishment - The establishment to add
   * @param {string} establishment.id - Unique identifier for the establishment
   * @param {string} establishment.name - Name of the establishment
   * @param {string} [establishment.url] - Optional URL to the establishment details
   * @param {string} [establishment.imageUrl] - Optional image URL
   * @param {string} [establishment.description] - Optional description
   */
  addEstablishment(establishment) {
    // Don't run in server-side code
    if (typeof window === "undefined") return;

    const recentItems = this.getRecentEstablishments();

    // Check if the establishment is already in the list
    const existingIndex = recentItems.findIndex((item) =>
      item.id === establishment.id
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
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentItems));
  }

  /**
   * Get all recent establishments, ordered by most recent first
   * @returns {Array} Array of establishment objects
   */
  getRecentEstablishments() {
    // Don't run in server-side code
    if (typeof window === "undefined") return [];

    const storedItems = localStorage.getItem(this.STORAGE_KEY);
    if (!storedItems) {
      return [];
    }

    try {
      return JSON.parse(storedItems);
    } catch (error) {
      console.error("Error parsing recent establishments", error);
      return [];
    }
  }

  /**
   * Clear all recent establishments
   */
  clearRecentEstablishments() {
    // Don't run in server-side code
    if (typeof window === "undefined") return;

    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// Create a singleton instance
const recentEstablishmentsService = new RecentEstablishmentsService();

export default recentEstablishmentsService;
