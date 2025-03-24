document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  const listTitle = document.getElementById('listTitle');
  const listDescription = document.getElementById('listDescription');
  const establishmentsList = document.getElementById('establishmentsList');
  const emptyListMessage = document.getElementById('emptyList');
  const errorMessage = document.getElementById('errorMessage');
  const loadingIndicator = document.getElementById('loading');
  
  // Get list ID from URL
  const pathParts = window.location.pathname.split('/');
  let listId = '';
  
  // Try to extract list ID from different URL patterns
  // Pattern 1: /lists/detail/{listId}
  if (pathParts.length >= 4 && pathParts[1] === 'lists' && pathParts[2] === 'detail') {
    listId = pathParts[3] || '';
  }
  // Pattern 2: /lists/{listId}
  else if (pathParts.length >= 3 && pathParts[1] === 'lists') {
    listId = pathParts[2] || '';
  }
  
  // If list ID is missing from path, check URL parameters
  if (!listId) {
    const urlParams = new URLSearchParams(window.location.search);
    listId = urlParams.get('id') || '';
  }
  
  // If still no list ID, default to 'recent'
  if (!listId) {
    listId = 'recent';
  }
  
  // Function to format a date as a relative time (e.g., "2 days ago")
  function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 30) {
      return `${Math.floor(diffDay / 30)} months ago`;
    } else if (diffDay > 0) {
      return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    } else {
      return 'just now';
    }
  }

  // Function to render an establishment card
  function renderEstablishmentCard(establishment) {
    const card = document.createElement('div');
    card.className = 'establishment-card';
    
    // Add content
    const content = document.createElement('div');
    content.className = 'establishment-content';
    
    // Name
    const name = document.createElement('h3');
    name.className = 'establishment-name';
    name.textContent = establishment.name;
    content.appendChild(name);
    
    // Add visited time if available
    if (establishment.lastVisited) {
      const visitedTime = document.createElement('div');
      visitedTime.className = 'establishment-details';
      visitedTime.textContent = `Viewed ${formatRelativeTime(establishment.lastVisited)}`;
      content.appendChild(visitedTime);
    }
    
    // Link to details
    const link = document.createElement('a');
    link.href = establishment.url || `/e/${establishment.id}`;
    link.className = 'view-details';
    link.textContent = 'View Details';
    content.appendChild(link);
    
    card.appendChild(content);
    return card;
  }

  // Function to load and display establishments from the specified list
  function loadEstablishments() {
    loadingIndicator.style.display = 'block';
    establishmentsList.style.display = 'none';
    emptyListMessage.style.display = 'none';
    errorMessage.style.display = 'none';
    
    // Initialize list info
    let listInfo = { title: '', description: '' };
    let establishments = [];
    
    // Set list details based on ID
    if (listId === 'recent') {
      listInfo = {
        title: 'Recent Establishments',
        description: 'Establishments you\'ve recently viewed'
      };
      
      // Get recent establishments from service
      establishments = recentEstablishmentsService.getRecentEstablishments();
    } else {
      // In the future, this would handle custom user lists
      // For now, we'll just show an error for non-recent lists
      errorMessage.style.display = 'block';
      loadingIndicator.style.display = 'none';
      return;
    }
    
    // Update page title and description
    listTitle.textContent = listInfo.title;
    listDescription.textContent = listInfo.description;
    document.title = `${listInfo.title} - Food Hygiene Ratings`;
    
    // Simulate a short loading delay for better UX
    setTimeout(() => {
      loadingIndicator.style.display = 'none';
      
      if (establishments.length === 0) {
        emptyListMessage.style.display = 'block';
        return;
      }
      
      // Display the establishments
      establishmentsList.style.display = 'grid';
      establishmentsList.innerHTML = '';
      
      establishments.forEach(establishment => {
        const card = renderEstablishmentCard(establishment);
        establishmentsList.appendChild(card);
      });
    }, 300);
  }
  
  // Load establishments when the page loads
  loadEstablishments();
});
