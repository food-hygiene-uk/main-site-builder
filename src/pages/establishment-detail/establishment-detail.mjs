document.addEventListener('DOMContentLoaded', () => {
  // Find the establishment element and extract data
  const establishmentElement = document.querySelector('.establishment');
  if (!establishmentElement) return;
  
  const establishmentId = establishmentElement.getAttribute('data-establishment-id');
  const establishmentName = establishmentElement.querySelector('.name')?.textContent;
  
  if (!establishmentId || !establishmentName) return;
  
  // Construct the URL for this establishment
  const url = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || window.location.pathname;
  
  // Add this establishment to the recently viewed list
  recentEstablishmentsService.addEstablishment({
    id: establishmentId,
    name: establishmentName,
    url: url
  });
});
