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

const compareRatingValue = (a, b) => {
  const ratingA = a.RatingValue ? Number(a.RatingValue) : -1;
  const ratingB = b.RatingValue ? Number(b.RatingValue) : -1;

  return ratingA - ratingB;
};

const compareRatingDate = (a, b) => {
  if (a.RatingDate !== b.RatingDate) {
    if (!a.RatingDate) return -1;
    if (!b.RatingDate) return -1;

    const dateA = new Date(a.RatingDate);
    const dateB = new Date(b.RatingDate);

    if (dateA !== dateB) {
      return dateB - dateA; // More recent date first
    }
  }

  return 0;
};

const compareBusinessName = (a, b) => {
  return a.BusinessName.localeCompare(b.BusinessName);
};

/**
 * Sort establishments by the given option and direction
 *
 * @param {Array<Establishment>} establishments - Establishments to sort
 * @param {string} sortOption - Sort option to use
 * @param {boolean} sortDirection - Sort direction (true for ascending, false for descending)
 * @returns {Array<Establishment>} Sorted establishments
 */
export const sortEstablishments = (
  establishments,
  sortOption,
  sortDirection,
) => {
  if (!sortOption) return establishments;

  const sortedEstablishments = [...establishments]; // Create a copy to avoid mutating original

  switch (sortOption) {
    case "name": {
      sortedEstablishments.sort((a, b) => {
        // Simply compare by business name
        const nameComparison = compareBusinessName(a, b);
        return sortDirection ? nameComparison : -nameComparison;
      });
      break;
    }
    case "rating": {
      sortedEstablishments.sort((a, b) => {
        // First compare the rating values
        const ratingValueComparison = compareRatingValue(a, b);
        if (ratingValueComparison !== 0) {
          return sortDirection ? ratingValueComparison : -ratingValueComparison;
        }

        // If ratings are equal, sort by most recent inspection date
        const dateComparison = compareRatingDate(a, b);
        if (dateComparison !== 0) {
          return sortDirection ? -dateComparison : dateComparison;
        }

        // If both rating and date are equal, sort by name
        const nameComparison = compareBusinessName(a, b);
        return sortDirection ? nameComparison : -nameComparison;
      });
      break;
    }
    case "date": {
      sortedEstablishments.sort((a, b) => {
        // First compare the inspection dates
        const dateComparison = compareRatingDate(a, b);
        if (dateComparison !== 0) {
          return sortDirection ? -dateComparison : dateComparison;
        }

        // If dates are equal, sort by name
        const nameComparison = compareBusinessName(a, b);
        return sortDirection ? nameComparison : -nameComparison;
      });
      break;
    }
    default: {
      // No sorting
      break;
    }
  }

  return sortedEstablishments;
};
