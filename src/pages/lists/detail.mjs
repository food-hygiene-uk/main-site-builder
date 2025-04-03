import { EstablishmentList } from "components/establishment-list/establishment-list.mjs";
import recentEstablishmentsService from "scripts/recent-establishments-service.mjs";

document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const listTitle = document.getElementById("listTitle");
  const listDescription = document.getElementById("listDescription");
  const establishmentsContainer = document.getElementById("establishmentsList");
  const emptyListMessage = document.getElementById("emptyList");
  const errorMessage = document.getElementById("errorMessage");
  const loadingIndicator = document.getElementById("loading");

  // Get list ID from URL
  const urlParams = new URLSearchParams(globalThis.location.search);
  const listId = urlParams.get("id") || "recent";

  // Initialize the establishment list component with explicit defaultView
  const establishmentList = new EstablishmentList({
    container: establishmentsContainer,
    loadingElement: loadingIndicator,
    emptyElement: emptyListMessage,
    errorElement: errorMessage,
    pageSize: 10,
    enableViewToggle: true,
  });

  // Function to load and display establishments from the specified list
  async function loadEstablishments() {
    // Show loading state
    await establishmentList.loadEstablishments({ establishments: [] }, true);

    // Initialize list info
    let listInfo = { title: "", description: "" };
    let establishments = [];

    // Set list details based on ID
    if (listId === "recent") {
      listInfo = {
        title: "Recent Establishments",
        description: "Establishments you've recently viewed",
      };

      // Get recent establishments from service
      establishments = recentEstablishmentsService.getRecentEstablishments();
    } else {
      // In the future, this would handle custom user lists
      // For now, we'll just show an error for non-recent lists
      establishmentList.showError("The requested list could not be found");
      return;
    }

    // Update page title and description
    listTitle.textContent = listInfo.title;
    listDescription.textContent = listInfo.description;
    document.title = `${listInfo.title} - Food Hygiene Ratings`;

    // Make sure the container is visible before loading establishments
    establishmentsContainer.style.display = "block";

    // For client-side pagination, we need a page change handler that updates the view
    // without loading new data from the server
    const handleClientPageChange = async (page) => {
      // Make sure container stays visible
      establishmentsContainer.style.display = "block";

      // Just re-render the current page with the existing establishments
      await establishmentList.loadEstablishments(
        {
          establishments: establishments,
          totalResults: establishments.length,
          currentPage: page,
          pageSize: 10,
        },
        false,
        handleClientPageChange,
      );
    };

    // Load all establishments at once for client-side pagination
    await establishmentList.loadEstablishments(
      {
        establishments: establishments,
        totalResults: establishments.length,
        currentPage: 1,
        pageSize: 10,
      },
      false,
      handleClientPageChange,
    );

    // Double-check visibility after loading
    establishmentsContainer.style.display = "block";
  }

  // Load establishments when the page loads
  loadEstablishments();
});
