import { getReference } from "utils/dom.mjs";

document.addEventListener("DOMContentLoaded", () => {
  const filterGroup = getReference(".filter-group", HTMLDivElement);
  const filterInput = getReference(
    "#filterInput",
    HTMLInputElement,
    filterGroup,
  );

  filterInput.addEventListener("input", () => {
    const filterValue = filterInput.value.toLowerCase();

    const regions = /** @type {NodeListOf<HTMLElement>} */ (
      document.querySelectorAll(".authorities")
    );

    for (const region of regions) {
      const listItems = /** @type {NodeListOf<HTMLElement>} */ (
        region.querySelectorAll(".authority-link")
      );

      // If region matches filter, show all region authorities
      const regionName =
        region.querySelector("h3")?.textContent?.toLowerCase() ?? "";
      if (regionName.includes(filterValue)) {
        region.hidden = false;
        region.style.display = "block";
        for (const item of listItems) {
          item.style.display = "block";
        }

        continue;
      }

      // Otherwise, filter the region authorities
      for (const item of listItems) {
        const itemText = item.textContent?.toLowerCase() ?? "";
        item.style.display = itemText.includes(filterValue) ? "block" : "none";
      }

      // Hide the region if all its authorities are hidden
      region.hidden = [...listItems].every(
        (item) => !item.textContent?.toLowerCase().includes(filterValue),
      );
    }

    // Check if all regions are hidden
    const areAllRegionsHidden = [...regions].every((region) => region.hidden);

    const noMatchesMessage = document.querySelector("#noMatchesMessage");

    if (areAllRegionsHidden) {
      if (!noMatchesMessage) {
        const message = document.createElement("p");
        message.id = "noMatchesMessage";
        message.textContent = "No matches found.";
        message.style.textAlign = "center";
        message.style.marginTop = "1rem";
        filterGroup.parentNode?.append(message);
      }
    } else if (noMatchesMessage) {
      noMatchesMessage.remove();
    }
  });

  filterGroup.removeAttribute("inert");
});
