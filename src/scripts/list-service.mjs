/**
Service to manage saved lists and their operations.
*/

/**
@typedef {object} ListEstablishment
@property {number} FHRSID - Establishment ID
@property {string} BusinessName - Name of the business
*/

/**
@typedef {object} SavedList
@property {string} name - Friendly name of the list
@property {ListEstablishment[]} establishments - Array of establishment ids
*/

/**
@typedef {
    { status: "deleted" }
  | { status: "not-found" }
  | { status: "storage-unavailable" }
  | { status: "error"; error: unknown }
} DeleteListResult
*/

/**
Retrieves all saved lists from localStorage.

@returns {Record<string, SavedList>} An object containing all saved lists.
*/
export const getSavedLists = () => {
  try {
    const savedLists = JSON.parse(
      localStorage.getItem("saved-establishment-lists") ?? "{}",
    );
    return savedLists;
  } catch (error) {
    console.error("Error retrieving saved lists:", error);
    return {};
  }
};

/**
Deletes a saved list by ID.

@param {string} listId - The ID of the list to delete.
@returns {DeleteListResult} The outcome of the deletion.
*/
export const deleteSavedList = (listId) => {
  if (localStorage === undefined) {
    return { status: "storage-unavailable" };
  }

  try {
    const savedListsJson = localStorage.getItem("saved-establishment-lists");
    if (!savedListsJson) return { status: "not-found" };

    const savedLists = /** @type {Record<string, SavedList>} */ (
      JSON.parse(savedListsJson)
    );

    if (!Object.hasOwn(savedLists, listId)) {
      return { status: "not-found" };
    }

    delete savedLists[listId];
    localStorage.setItem(
      "saved-establishment-lists",
      JSON.stringify(savedLists),
    );

    return { status: "deleted" };
  } catch (error) {
    console.error("Error deleting list:", error);
    return { status: "error", error };
  }
};

/**
Checks if an establishment is on any saved list.

@param {number} FHRSID - The unique identifier of the establishment.
@returns {boolean} True if the establishment is on any list, false otherwise.
*/
export const isEstablishmentOnList = (FHRSID) => {
  const savedLists = getSavedLists();
  return Object.values(savedLists).some((list) =>
    list.establishments.some((est) => est.FHRSID === FHRSID)
  );
};

/**
Updates the saved lists by adding or removing an establishment.

@param {ListEstablishment} establishment - Establishment record
@param {string} listId - The ID of the list to update.
@param {"add" | "delete"} task - Whether to add or delete the establishment.
*/
export const updateList = (establishment, listId, task) => {
  const savedLists = getSavedLists();
  const list = savedLists[listId];

  if (task === "add") {
    // If the list doesn't exist, create it and add the establishment
    if (!list) {
      createNewList(listId, establishment);
      return;
    }

    if (
      list.establishments.every((est) => est.FHRSID !== establishment.FHRSID)
    ) {
      list.establishments.push({
        FHRSID: establishment.FHRSID,
        BusinessName: establishment.BusinessName,
      });
    }
  } else {
    // If the list doesn't exist, there's nothing to do
    if (!list) return;

    list.establishments = list.establishments.filter(
      (est) => est.FHRSID !== establishment.FHRSID,
    );
  }

  localStorage.setItem("saved-establishment-lists", JSON.stringify(savedLists));
};

/**
Saves a new list with the given name and establishments.

@param {string} listName - The name of the list.
@param {ListEstablishment[]} establishments - The establishments to include in the list.
@returns {string|null} The ID of the saved list, or null if an error occurred.
*/
export const saveList = (listName, establishments) => {
  if (localStorage === undefined) return null;

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

    localStorage.setItem(
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
Creates a new list with the given name and adds an establishment to it.

@param {string} listName - The name of the new list.
@param {ListEstablishment} establishment - Establishment record
@returns {string} The ID of the new list.
*/
export const createNewList = (listName, establishment) => {
  const savedLists = getSavedLists();
  const listId = `list_${Date.now()}`;
  savedLists[listId] = {
    name: listName,
    establishments: [
      {
        FHRSID: establishment.FHRSID,
        BusinessName: establishment.BusinessName,
      },
    ],
  };
  localStorage.setItem("saved-establishment-lists", JSON.stringify(savedLists));
  return listId;
};

/**
Derives the creation date from the list ID.

@param {string} listId - The ID of the list.
@returns {Date} The creation date of the list.
*/
export const getListCreationDate = (listId) => {
  const timestamp = Number(listId.replace("list_", ""));
  return new Date(timestamp);
};
