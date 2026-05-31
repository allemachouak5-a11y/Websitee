let wishlistItems = [];
let wishlistCurrentLang = 'en';

const wishlistTranslations = {
  en: {
    'title': 'My Favorites',
    'subtitle': 'Properties you\'ve saved for later',
    'saved': 'saved properties',
    'remove': 'Remove',
    'view': 'View Details',
    'no-favorites': 'No favorites yet',
    'explore': 'Explore Properties',
    'loading': 'Loading your favorites...',
    'beds': 'beds',
    'baths': 'baths',
    'area': 'm²',
    'removed': 'Removed from favorites',
    'error': 'Connection error. Please try again.'
  },
  ar: {
    'title': 'المفضلة',
    'subtitle': 'العقارات التي قمت بحفظها لوقت لاحق',
    'saved': 'عقار محفوظ',
    'remove': 'إزالة',
    'view': 'عرض التفاصيل',
    'no-favorites': 'لا توجد مفضلات بعد',
    'explore': 'استكشف العقارات',
    'loading': 'جاري تحميل المفضلة...',
    'beds': 'أسرّة',
    'baths': 'حمامات',
    'area': 'م²',
    'removed': 'تمت الإزالة من المفضلة',
    'error': 'خطأ في الاتصال. الرجاء المحاولة مرة أخرى.'
  }
};

function getCurrentUser() {
  let session = localStorage.getItem('dreamhome_session');
  if (!session) {
    session = sessionStorage.getItem('dreamhome_session');
  }
  
  console.log('Session data in wishlist:', session ? 'Found' : 'Not found');
  
  if (session) {
    try {
      const user = JSON.parse(session);
      console.log('User found in wishlist:', user.id, user.email);
      return user;
    } catch(e) {
      console.error('Error parsing session:', e);
      return null;
    }
  }
  console.log('No session found in wishlist');
  return null;
}

function showToast(message, isError = false) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position: fixed; bottom: 2rem; right: 2rem; z-index: 1100; display: flex; flex-direction: column; gap: 0.5rem;';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'toast-error' : 'toast-success'}`;
  toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${message}`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(30px); }
  }
`;
document.head.appendChild(style);

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatPrice(price) {
  if (!price) return '0';
  return parseInt(price).toLocaleString();
}

function getStarsHtml(rating) {
  if (!rating) rating = 0;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let stars = '';
  for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
  if (hasHalfStar) stars += '<i class="fas fa-star-half-alt"></i>';
  for (let i = Math.ceil(rating); i < 5; i++) stars += '<i class="far fa-star"></i>';
  return stars;
}

const localProperties = [
  { id: 1, name: "Villa de Luxe à Seraïdi", location: "seraidi", district: "SERAÏDI", type: "villa", price_dzd: 2170000, rating: 4.9, reviews: 213, bedrooms: 5, bathrooms: 4, area: 380, maxGuests: 10, image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&auto=format" },
  { id: 2, name: "Appartement Moderne El Bouni", location: "el-bouni", district: "EL BOUNI", type: "apartment", price_dzd: 399000, rating: 4.5, reviews: 96, bedrooms: 2, bathrooms: 2, area: 120, maxGuests: 4, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format" },
  { id: 3, name: "Loft Créatif Sidi Amar", location: "sidi-amar", district: "SIDI AMAR", type: "loft", price_dzd: 1218000, rating: 4.8, reviews: 112, bedrooms: 4, bathrooms: 3, area: 245, maxGuests: 8, image: "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=600&auto=format" },
  { id: 4, name: "Studio Annaba Centre", location: "annaba", district: "ANNABA", type: "studio", price_dzd: 180000, rating: 4.3, reviews: 45, bedrooms: 1, bathrooms: 1, area: 55, maxGuests: 2, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format" }
];

function saveWishlistToLocalStorage(propertyId) {
  const user = getCurrentUser();
  if (!user || !user.id) return;
  
  const storageKey = `wishlist_${user.id}`;
  let saved = localStorage.getItem(storageKey);
  let wishlistIds = saved ? JSON.parse(saved) : [];
  
  if (!wishlistIds.includes(propertyId)) {
    wishlistIds.push(propertyId);
    localStorage.setItem(storageKey, JSON.stringify(wishlistIds));
  }
}

function removeFromLocalStorage(propertyId) {
  const user = getCurrentUser();
  if (!user || !user.id) return;
  
  const storageKey = `wishlist_${user.id}`;
  let saved = localStorage.getItem(storageKey);
  let wishlistIds = saved ? JSON.parse(saved) : [];
  wishlistIds = wishlistIds.filter(id => id != propertyId);
  localStorage.setItem(storageKey, JSON.stringify(wishlistIds));
}

function getWishlistFromLocalStorage() {
  const user = getCurrentUser();
  if (!user || !user.id) return [];
  
  const storageKey = `wishlist_${user.id}`;
  const saved = localStorage.getItem(storageKey);
  return saved ? JSON.parse(saved) : [];
}

async function loadWishlist() {
  console.log('loadWishlist() called');
  
  const user = getCurrentUser();
  
  if (!user || !user.id) {
    console.log('No user found, redirecting to login');
    showToast('Please login to view your favorites', true);
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    return;
  }
  
  console.log('Loading wishlist for user ID:', user.id);
  
  const container = document.getElementById('wishlistGrid');
  const emptyState = document.getElementById('emptyState');
  const favCountSpan = document.getElementById('favCount');
  const t = wishlistTranslations[wishlistCurrentLang];
  
  if (container) {
    container.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>${t.loading}</p>
      </div>
    `;
    container.style.display = 'grid';
  }
  if (emptyState) emptyState.style.display = 'none';
  
  try {
  
    const response = await fetch(`api-wishlist.php?user_id=${user.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('API Response data:', result);
    
    if (result.success && result.wishlist && result.wishlist.length > 0) {
      wishlistItems = result.wishlist;
      console.log('Wishlist items found:', wishlistItems.length);
      
      if (favCountSpan) favCountSpan.textContent = wishlistItems.length;
      
      if (container) {
        container.innerHTML = wishlistItems.map(item => {
          return `
          <div class="wishlist-card" data-id="${item.id}">
            <div class="card-img" onclick="goToDetail(${item.id})">
              <img src="${item.main_image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&auto=format'}" alt="${escapeHtml(item.name)}" onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&auto=format'">
              <div class="card-badge">${escapeHtml(item.district || item.location || 'Annaba')}</div>
              <button class="btn-remove-fav" onclick="event.stopPropagation(); removeFromWishlist(${item.id})">
                <i class="fas fa-heart-broken"></i>
              </button>
            </div>
            <div class="card-content">
              <div class="card-location">
                <i class="fas fa-map-marker-alt"></i> ${escapeHtml(item.location || 'Annaba')}
              </div>
              <h3 class="card-title" onclick="goToDetail(${item.id})">${escapeHtml(item.name)}</h3>
              <div class="card-meta">
                <span><i class="fas fa-bed"></i> ${item.bedrooms || 2} ${t.beds}</span>
                <span><i class="fas fa-bath"></i> ${item.bathrooms || 2} ${t.baths}</span>
                <span><i class="fas fa-vector-square"></i> ${item.area || 100} ${t.area}</span>
              </div>
              <div class="card-price">${formatPrice(item.price_dzd)} DA <span>/ night</span></div>
              <div class="card-footer">
                <div class="card-rating">
                  ${getStarsHtml(item.rating || 4.5)}
                  <span>(${item.reviews_count || 0})</span>
                </div>
                <button class="btn-view" onclick="goToDetail(${item.id})">
                  ${t.view} <i class="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        `}).join('');
      }
      
      if (container) container.style.display = 'grid';
      if (emptyState) emptyState.style.display = 'none';
      
    } else if (result.success && (!result.wishlist || result.wishlist.length === 0)) {
      console.log('No wishlist items found');
      if (container) container.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      if (favCountSpan) favCountSpan.textContent = '0';
    } else {
      console.log('API returned error:', result.message);
      loadWishlistFromLocalStorage();
    }
  } catch (error) {
    console.error('Error loading wishlist from API:', error);
    loadWishlistFromLocalStorage();
  }
}

function loadWishlistFromLocalStorage() {
  console.log('Loading wishlist from localStorage fallback');
  
  const user = getCurrentUser();
  if (!user || !user.id) return;
  
  const container = document.getElementById('wishlistGrid');
  const emptyState = document.getElementById('emptyState');
  const favCountSpan = document.getElementById('favCount');
  const t = wishlistTranslations[wishlistCurrentLang];
  
  const savedWishlistIds = getWishlistFromLocalStorage();
  
  if (savedWishlistIds.length === 0) {
    if (container) container.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    if (favCountSpan) favCountSpan.textContent = '0';
    return;
  }
  
  const wishlistFromLocal = localProperties.filter(prop => savedWishlistIds.includes(prop.id));
  
  if (wishlistFromLocal.length === 0) {
    if (container) container.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    if (favCountSpan) favCountSpan.textContent = '0';
    return;
  }
  
  wishlistItems = wishlistFromLocal;
  
  if (favCountSpan) favCountSpan.textContent = wishlistItems.length;
  
  if (container) {
    container.innerHTML = wishlistItems.map(item => `
      <div class="wishlist-card" data-id="${item.id}">
        <div class="card-img" onclick="goToDetail(${item.id})">
          <img src="${item.image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&auto=format'}" alt="${escapeHtml(item.name)}" onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&auto=format'">
          <div class="card-badge">${escapeHtml(item.district || item.location || 'Annaba')}</div>
          <button class="btn-remove-fav" onclick="event.stopPropagation(); removeFromWishlistLocal(${item.id})">
            <i class="fas fa-heart-broken"></i>
          </button>
        </div>
        <div class="card-content">
          <div class="card-location">
            <i class="fas fa-map-marker-alt"></i> ${escapeHtml(item.location || 'Annaba')}
          </div>
          <h3 class="card-title" onclick="goToDetail(${item.id})">${escapeHtml(item.name)}</h3>
          <div class="card-meta">
            <span><i class="fas fa-bed"></i> ${item.bedrooms || 2} ${t.beds}</span>
            <span><i class="fas fa-bath"></i> ${item.bathrooms || 2} ${t.baths}</span>
            <span><i class="fas fa-vector-square"></i> ${item.area || 100} ${t.area}</span>
          </div>
          <div class="card-price">${formatPrice(item.price_dzd)} DA <span>/ night</span></div>
          <div class="card-footer">
            <div class="card-rating">
              ${getStarsHtml(item.rating || 4.5)}
              <span>(${item.reviews || 0})</span>
            </div>
            <button class="btn-view" onclick="goToDetail(${item.id})">
              ${t.view} <i class="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
    container.style.display = 'grid';
  }
  
  if (emptyState) emptyState.style.display = 'none';
}

async function removeFromWishlist(propertyId) {
  console.log('removeFromWishlist called for property ID:', propertyId);
  
  const user = getCurrentUser();
  
  if (!user || !user.id) {
    showToast('Please login first', true);
    return;
  }
  
  try {
    const response = await fetch(`api-wishlist.php?property_id=${propertyId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: user.id, property_id: propertyId })
    });
    const result = await response.json();
    console.log('Remove response:', result);
    
    if (result.success) {
      showToast(wishlistTranslations[wishlistCurrentLang]['removed']);
      loadWishlist(); // Refresh the list
    } else {
      removeFromLocalStorage(propertyId);
      showToast(wishlistTranslations[wishlistCurrentLang]['removed']);
      loadWishlistFromLocalStorage();
    }
  } catch (error) {
    console.error('Error removing from wishlist via API:', error);
    removeFromLocalStorage(propertyId);
    showToast(wishlistTranslations[wishlistCurrentLang]['removed']);
    loadWishlistFromLocalStorage();
  }
}

function removeFromWishlistLocal(propertyId) {
  removeFromLocalStorage(propertyId);
  showToast(wishlistTranslations[wishlistCurrentLang]['removed']);
  loadWishlistFromLocalStorage();
}

function goToDetail(id) {
  console.log('goToDetail called for property ID:', id);
  window.location.href = `detail.html?id=${id}`;
}

function updateWishlistLanguage(lang) {
  const t = wishlistTranslations[lang];
  if (!t) return;
  
  const title = document.querySelector('.wishlist-header h1');
  if (title) title.textContent = t['title'];
  
  const subtitle = document.querySelector('.wishlist-header p');
  if (subtitle) subtitle.textContent = t['subtitle'];
  
  const statsSpan = document.getElementById('favCount');
  const statsText = document.querySelector('.wishlist-stats');
  if (statsText && statsSpan) {
    const count = statsSpan.textContent;
    statsText.innerHTML = `<span>${count}</span> ${t['saved']}`;
  }
  
  const emptyTitle = document.querySelector('.empty-state h3');
  if (emptyTitle) emptyTitle.textContent = t['no-favorites'];
  
  const emptyBtn = document.querySelector('.btn-explore');
  if (emptyBtn) emptyBtn.innerHTML = `<i class="fas fa-search"></i> ${t['explore']}`;
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('Wishlist page loaded');
  
  const savedLang = localStorage.getItem('language') || 'en';
  wishlistCurrentLang = savedLang;
  updateWishlistLanguage(savedLang);
  
  loadWishlist();
  
  window.addEventListener('languageChanged', (e) => {
    if (e.detail && e.detail.lang) {
      wishlistCurrentLang = e.detail.lang;
      updateWishlistLanguage(e.detail.lang);
      loadWishlist();
    }
  });
});

window.removeFromWishlist = removeFromWishlist;
window.removeFromWishlistLocal = removeFromWishlistLocal;
window.goToDetail = goToDetail;