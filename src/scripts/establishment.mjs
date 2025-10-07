// FHRS API Configuration
const API_BASE = "https://api.ratings.food.gov.uk";
const API_HEADERS = {
  accept: "application/json",
  "x-api-version": "2",
};

/* Basic cache of establishment details to avoid repeated API calls */
const establishmentCache = new Map();

/**
 * Fetches establishment details from the FHRS API
 *
 * @param {string|number} FHRSID - The FHRSID of the establishment
 * @returns {Promise<Establishment|null>} The establishment data or null if not found
 */
export const fetchEstablishmentDetails = async (FHRSID) => {
  // Check cache first
  if (establishmentCache.has(FHRSID)) {
    return establishmentCache.get(FHRSID);
  }

  // Fetch from API
  try {
    const response = await fetch(`${API_BASE}/Establishments/${FHRSID}`, {
      headers: API_HEADERS,
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch establishment ${FHRSID}: ${response.status}`,
      );
      return null;
    }

    const data = await response.json();
    establishmentCache.set(FHRSID, data);

    return data;
  } catch (error) {
    console.error(`Error fetching establishment ${FHRSID}:`, error);

    return null;
  }
};
