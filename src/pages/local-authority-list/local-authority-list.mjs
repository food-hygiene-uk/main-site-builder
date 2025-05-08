document.addEventListener("DOMContentLoaded", () => {
  const filterGroup = document.querySelector(".filter-group");
  const filterInput = filterGroup.querySelector("#filterInput");

  filterInput.addEventListener("input", (event) => {
    const filterValue = event.target.value.toLowerCase();

    const regions = document.querySelectorAll(".authorities");

    for (const region of regions) {
      const listItems = region.querySelectorAll(".authority-link");

      // If region matches filter, show all region authorities
      const regionName = region.querySelector("h3").textContent.toLowerCase();
      if (regionName.includes(filterValue)) {
        region.style.display = "block";
        for (const item of listItems) {
          item.style.display = "block";
        }

        continue;
      }

      // Otherwise, filter the region authorities
      for (const item of listItems) {
        const itemText = item.textContent.toLowerCase();
        item.style.display = itemText.includes(filterValue) ? "block" : "none";
      }

      // Hide the region if all its authorities are hidden
      const allLocalAuthoritiesHidden =
        region.querySelectorAll(".authority-link:not([style*='display: none'])")
          .length === 0;
      region.style.display = allLocalAuthoritiesHidden ? "none" : "block";
    }

    // Check if all regions are hidden
    const allRegionsHidden =
      document.querySelectorAll(".authorities:not([style*='display: none'])")
        .length === 0;

    const noMatchesMessage = document.querySelector("#noMatchesMessage");

    if (allRegionsHidden) {
      if (!noMatchesMessage) {
        const message = document.createElement("p");
        message.id = "noMatchesMessage";
        message.textContent = "No matches found.";
        message.style.textAlign = "center";
        message.style.marginTop = "1rem";
        filterGroup.parentNode.append(message);
      }
    } else if (noMatchesMessage) {
      noMatchesMessage.remove();
    }
  });

  filterGroup.removeAttribute("inert");
});
