document.addEventListener("DOMContentLoaded", () => {
  // Find the establishment element and extract data
  const establishmentElement = document.querySelector(".establishment");
  if (!establishmentElement) return;

  const establishmentId = establishmentElement.getAttribute(
    "data-establishment-id",
  );

  if (!establishmentId) return;

  // Add this establishment to the recently viewed list
  recentEstablishmentsService.addEstablishment({
    FHRSID: establishmentId,
  });
});
