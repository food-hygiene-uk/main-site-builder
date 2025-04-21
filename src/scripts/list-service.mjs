/**
 * Service to manage saved lists and their operations.
 */

/**
 * Retrieves all saved lists from localStorage.
 * @returns {Object} An object containing all saved lists.
 */
export const getSavedLists = () => {
  try {
    const savedLists = JSON.parse(
      globalThis.localStorage.getItem("saved-establishment-lists"),
    ) || {};
    return savedLists;
  } catch (error) {
    console.error("Error retrieving saved lists:", error);
    return {};
  }
};

/**
 * Checks if an establishment is on any saved list.
 * @param {string} FHRSID - The unique identifier of the establishment.
 * @returns {boolean} True if the establishment is on any list, false otherwise.
 */
export const isEstablishmentOnList = (FHRSID) => {
  const savedLists = getSavedLists();
  return Object.values(savedLists).some((list) =>
    list.establishments.some((est) => est.FHRSID === FHRSID)
  );
};

/**
 * Updates the saved lists by adding or removing an establishment.
 * @param {string} FHRSID - The unique identifier of the establishment.
 * @param {string} listId - The ID of the list to update.
 * @param {boolean} add - Whether to add (true) or remove (false) the establishment.
 */
export const updateList = (FHRSID, listId, add) => {
  const savedLists = getSavedLists();
  const list = savedLists[listId];

  if (add) {
    // If the list doesn't exist, create it and add the establishment
    if (!list) {
      createNewList(listId, FHRSID);
      return;
    }

    if (!list.establishments.some((est) => est.FHRSID === FHRSID)) {
      list.establishments.push({ FHRSID });
    }
  } else {
    // If the list doesn't exist, there's nothing to do
    if (!list) return;

    list.establishments = list.establishments.filter(
      (est) => est.FHRSID !== FHRSID,
    );
  }

  globalThis.localStorage.setItem(
    "saved-establishment-lists",
    JSON.stringify(savedLists),
  );
};

/**
 * Saves a new list with the given name and establishments.
 * @param {string} listName - The name of the list.
 * @param {Array} establishments - The establishments to include in the list.
 * @returns {string|null} The ID of the saved list, or null if an error occurred.
 */
export const saveList = (listName, establishments) => {
  if (typeof globalThis.localStorage === "undefined") return null;

  try {
    const savedLists = getSavedLists();

    // Create a unique ID for the list
    const listId = `list_${Date.now()}`;

    // Create minimal establishment objects (just essential data)
    const minimalEstablishments = establishments.map((est) => ({
      FHRSID: est.FHRSID,
      BusinessName: est.BusinessName || "Unknown Establishment",
    }));

    // Save the list
    savedLists[listId] = {
      name: listName,
      establishments: minimalEstablishments,
    };

    globalThis.localStorage.setItem(
      "saved-establishment-lists",
      JSON.stringify(savedLists),
    );

    return listId;
  } catch (error) {
    console.error("Error saving list:", error);
    return null;
  }
};

/**
 * Creates a new list with the given name and adds an establishment to it.
 * @param {string} listName - The name of the new list.
 * @param {string} FHRSID - The unique identifier of the establishment to add.
 */
export const createNewList = (listName, FHRSID) => {
  const savedLists = getSavedLists();
  const listId = `list_${Date.now()}`;
  savedLists[listId] = {
    name: listName,
    establishments: [{ FHRSID }],
  };
  globalThis.localStorage.setItem(
    "saved-establishment-lists",
    JSON.stringify(savedLists),
  );
  return listId;
};

/**
 * Derives the creation date from the list ID.
 * @param {string} listId - The ID of the list.
 * @returns {Date} The creation date of the list.
 */
export const getListCreationDate = (listId) => {
  const timestamp = Number(listId.replace("list_", ""));
  return new Date(timestamp);
};
