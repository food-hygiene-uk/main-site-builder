document.addEventListener("DOMContentLoaded", () => {
  const userListsContainer = document.getElementById("userLists");
  const noListsMessage = document.getElementById("noLists");

  // This would be expanded in the future to support user-created lists
  // For now, we just show the default "Recent" list

  // Show the no-lists message since there are no user-created lists yet
  userListsContainer.style.display = "none";
  noListsMessage.style.display = "block";
});
