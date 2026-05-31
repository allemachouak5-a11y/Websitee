let allProperties = [];
let currentView = "grid";
let currentFilter = { location: "", type: "", price: 50000000, guests: 0 };
let currentPage = 1;
const ITEMS_PER_PAGE = 12;
let userLocation = null;
let isLocating = false;

let map = null;
let propertyMarkers = [];
let userMarker = null;
let currentMapCenter = { lat: 36.9022, lng: 7.7559 };

const districtCoordinates = {
    'annaba': { lat: 36.9022, lng: 7.7559, name: 'Annaba Centre' },
    'seraidi': { lat: 36.9100, lng: 7.7700, name: 'Seraidi' },
    'el-hadjar': { lat: 36.8000, lng: 7.7200, name: 'El Hadjar' },
    'sidi-amar': { lat: 36.8800, lng: 7.7100, name: 'Sidi Amar' },
    'berrahal': { lat: 36.8500, lng: 7.4500, name: 'Berrahal' },
    'oued-el-aneb': { lat: 36.7800, lng: 7.6000, name: 'Oued El Aneb' },
    'ettarf': { lat: 36.7500, lng: 7.5500, name: 'Ettarf' },
    'el-bouni': { lat: 36.8550, lng: 7.7150, name: 'El Bouni' },
    'ain-berda': { lat: 36.8200, lng: 7.6900, name: 'Ain Berda' },
    'el-alma': { lat: 36.7200, lng: 7.5800, name: 'El Alma' },
    'cheria': { lat: 36.7000, lng: 7.5200, name: 'Cheria' },
    'chetaibi': { lat: 36.9600, lng: 7.8500, name: 'Chetaibi' },
    'boulimat': { lat: 36.9200, lng: 7.7800, name: 'Boulimat' },
    'plateau': { lat: 36.8950, lng: 7.7500, name: 'Plateau' },
    'st-cloud': { lat: 36.8850, lng: 7.7400, name: 'Saint Cloud' }
};

function getDistrictCoordinates(district) {
    const key = (district || '').toLowerCase().trim();
    if (districtCoordinates[key]) return districtCoordinates[key];
    for (const [d, coords] of Object.entries(districtCoordinates)) {
        if (key.includes(d) || d.includes(key)) return coords;
    }
    return null;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getStarsHtml(rating) {
    let stars = "";
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) stars += "★";
        else if (i - 0.5 <= rating && hasHalfStar) stars += "½";
        else stars += "☆";
    }
    return stars;
}

function showToast(message, isError = false) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'toast-error' : 'toast-success'}`;
    toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOutToast 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function initListingMap() {
    const mapContainer = document.getElementById('listingMap');
    if (!mapContainer) return;
    
    map = L.map('listingMap').setView([currentMapCenter.lat, currentMapCenter.lng], 12);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    
    L.control.scale({ metric: true, imperial: false }).addTo(map);
    
    const geocoder = L.Control.Geocoder.nominatim();
    const searchControl = L.Control.geocoder({
        geocoder: geocoder,
        position: 'topleft',
        placeholder: 'Search in Annaba...',
        defaultMarkGeocode: false
    }).addTo(map);
    
    searchControl.on('markgeocode', function(e) {
        const center = e.geocode.center;
        map.setView(center, 14);
        const searchIcon = L.divIcon({
            html: '<i class="fas fa-search" style="font-size: 28px; color: #3498db;"></i>',
            iconSize: [28, 28],
            className: 'search-marker'
        });
        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.marker([center.lat, center.lng], { icon: searchIcon }).addTo(map);
        userMarker.bindPopup(e.geocode.name).openPopup();
    });
}

function updateMapMarkers(properties) {
    if (!map) return;
    propertyMarkers.forEach(marker => map.removeLayer(marker));
    propertyMarkers = [];
    if (!properties || properties.length === 0) return;
    
    const propertyIcon = L.divIcon({
        html: '<i class="fas fa-home" style="font-size: 28px; color: #c9a96e; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"></i>',
        iconSize: [28, 28],
        className: 'property-marker'
    });
    
    const bounds = [];
    properties.forEach(prop => {
        let coords = getDistrictCoordinates(prop.district || prop.location);
        if (coords) {
            bounds.push([coords.lat, coords.lng]);
            const marker = L.marker([coords.lat, coords.lng], { icon: propertyIcon })
                .addTo(map)
                .bindPopup(`
                    <div style="font-family: 'DM Sans', sans-serif; text-align: center; min-width: 200px;">
                        <strong style="color: #3b2314;">${escapeHtml(prop.name)}</strong><br>
                        <span style="color: #c9a96e;">${escapeHtml(prop.district || prop.location)}</span><br>
                        <span style="color: #2ecc71; font-weight: bold; font-size: 1.1rem;">${prop.price_da.toLocaleString()} DA</span><br>
                        <button onclick="goToDetail(${prop.id})" style="margin-top: 8px; padding: 5px 15px; background: #c9a96e; border: none; border-radius: 25px; cursor: pointer; color: #3b2314; font-weight: bold;">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                    </div>
                `);
            propertyMarkers.push(marker);
        }
    });
    
    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
        if (bounds.length === 1) map.setZoom(15);
    }
}

function locateUserOnMap() {
    if (!map) return;
    const statusDiv = document.getElementById('mapStatusText');
    if (statusDiv) statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Locating...';
    if (!navigator.geolocation) {
        if (statusDiv) statusDiv.innerHTML = 'Geolocation not supported';
        showToast('Geolocation not supported', true);
        return;
    }
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            if (userMarker) map.removeLayer(userMarker);
            const userIcon = L.divIcon({
                html: '<i class="fas fa-user-circle" style="font-size: 36px; color: #2ecc71;"></i>',
                iconSize: [36, 36],
                className: 'user-marker'
            });
            userMarker = L.marker([userLat, userLng], { icon: userIcon })
                .addTo(map)
                .bindPopup('Your current location')
                .openPopup();
            map.setView([userLat, userLng], 14);
            if (statusDiv) statusDiv.innerHTML = 'You are here';
        },
        function(error) {
            let errorMsg = 'Unable to get location';
            if (error.code === error.PERMISSION_DENIED) errorMsg = 'Please allow location access';
            if (statusDiv) statusDiv.innerHTML = errorMsg;
            showToast(errorMsg, true);
        }
    );
}

function resetMapView() {
    if (!map) return;
    map.setView([currentMapCenter.lat, currentMapCenter.lng], 12);
    if (userMarker) map.removeLayer(userMarker);
    userMarker = null;
    updateMapMarkers(getCurrentlyFilteredProperties());
    showToast('Map reset to Annaba center');
}

function loadProperties() {
    const container = document.getElementById('cardsGrid');
    if (container) {
        container.innerHTML = `<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Loading properties in Annaba...</p></div>`;
    }
    
    fetch('api-properties.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.properties && data.properties.length > 0) {
                allProperties = data.properties.map(prop => ({
                    id: prop.id,
                    name: prop.name,
                    location: prop.location,
                    district: prop.district,
                    type: prop.type || 'apartment',
                    price_da: parseFloat(prop.price_dzd),
                    rating: parseFloat(prop.rating) || 4.5,
                    reviews: prop.reviews_count || 0,
                    beds: prop.bedrooms || 2,
                    baths: prop.bathrooms || 2,
                    area: prop.area || 100,
                    maxGuests: prop.max_guests || 4,
                    image: prop.main_image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format',
                    latitude: prop.latitude,
                    longitude: prop.longitude,
                    status: prop.status || 'available',
                    description: prop.description || ''
                }));
            } else {
                allProperties = getDemoProperties();
            }
            filterAndRenderProperties();
            initListingMap();
            setTimeout(() => updateMapMarkers(getCurrentlyFilteredProperties()), 500);
        })
        .catch(() => {
            allProperties = getDemoProperties();
            filterAndRenderProperties();
            initListingMap();
            setTimeout(() => updateMapMarkers(getCurrentlyFilteredProperties()), 500);
        });
}

function getDemoProperties() {
    return [
        { id: 1, name: "Appartement Luxe Annaba Centre", location: "annaba", district: "ANNABA CENTRE", type: "apartment", price_da: 18500000, rating: 4.8, reviews: 45, beds: 3, baths: 2, area: 145, maxGuests: 6, image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&auto=format", status: 'available', latitude: 36.9022, longitude: 7.7559, description: "Magnifique appartement en plein coeur d'Annaba." },
        { id: 2, name: "Studio Moderne Annaba", location: "annaba", district: "ANNABA CENTRE", type: "studio", price_da: 5500000, rating: 4.5, reviews: 28, beds: 1, baths: 1, area: 48, maxGuests: 2, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format", status: 'available', latitude: 36.9022, longitude: 7.7559, description: "Studio moderne ideal pour etudiants." },
        { id: 3, name: "Penthouse Vue Mer", location: "annaba", district: "ANNABA CENTRE", type: "penthouse", price_da: 35000000, rating: 4.9, reviews: 52, beds: 4, baths: 3, area: 220, maxGuests: 8, image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&auto=format", status: 'available', latitude: 36.9022, longitude: 7.7559, description: "Penthouse exceptionnel avec terrasse panoramique." },
        { id: 4, name: "Villa de Luxe Seraidi", location: "seraidi", district: "SERAIDI", type: "villa", price_da: 75000000, rating: 5.0, reviews: 89, beds: 6, baths: 5, area: 550, maxGuests: 14, image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&auto=format", status: 'available', latitude: 36.9100, longitude: 7.7700, description: "Magnifique villa avec vue imprenable sur la mer." },
        { id: 5, name: "Duplex Vue Mer Seraidi", location: "seraidi", district: "SERAIDI", type: "duplex", price_da: 28000000, rating: 4.85, reviews: 41, beds: 4, baths: 3, area: 195, maxGuests: 8, image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format", status: 'available', latitude: 36.9100, longitude: 7.7700, description: "Duplex moderne avec terrasse et vue panoramique." },
        { id: 6, name: "Villa Contemporaine El Hadjar", location: "el-hadjar", district: "EL HADJAR", type: "villa", price_da: 38000000, rating: 4.75, reviews: 44, beds: 5, baths: 4, area: 380, maxGuests: 12, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format", status: 'available', latitude: 36.8000, longitude: 7.7200, description: "Villa moderne avec piscine et grand jardin." },
        { id: 7, name: "Appartement El Hadjar", location: "el-hadjar", district: "EL HADJAR", type: "apartment", price_da: 9800000, rating: 4.5, reviews: 26, beds: 3, baths: 2, area: 125, maxGuests: 6, image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&auto=format", status: 'available', latitude: 36.8000, longitude: 7.7200, description: "Appartement spacieux proche de toutes les commodites." },
        { id: 8, name: "Villa Sidi Amar", location: "sidi-amar", district: "SIDI AMAR", type: "villa", price_da: 25000000, rating: 4.65, reviews: 31, beds: 4, baths: 3, area: 280, maxGuests: 10, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format", status: 'available', latitude: 36.8800, longitude: 7.7100, description: "Villa familiale dans un quartier residentiel calme." },
        { id: 9, name: "Studio Etudiant Sidi Amar", location: "sidi-amar", district: "SIDI AMAR", type: "studio", price_da: 2900000, rating: 4.2, reviews: 18, beds: 1, baths: 1, area: 35, maxGuests: 2, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format", status: 'available', latitude: 36.8800, longitude: 7.7100, description: "Studio economique pour etudiants." },
        { id: 10, name: "Villa El Bouni", location: "el-bouni", district: "EL BOUNI", type: "villa", price_da: 42000000, rating: 4.9, reviews: 67, beds: 5, baths: 4, area: 400, maxGuests: 12, image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&auto=format", status: 'available', latitude: 36.8550, longitude: 7.7150, description: "Superbe villa avec grand jardin et piscine." },
        { id: 11, name: "Loft El Bouni", location: "el-bouni", district: "EL BOUNI", type: "loft", price_da: 18500000, rating: 4.8, reviews: 29, beds: 2, baths: 2, area: 140, maxGuests: 5, image: "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=600&auto=format", status: 'available', latitude: 36.8550, longitude: 7.7150, description: "Loft contemporain design." },
        { id: 12, name: "Villa Ain Berda", location: "ain-berda", district: "AIN BERDA", type: "villa", price_da: 32000000, rating: 4.75, reviews: 35, beds: 4, baths: 3, area: 280, maxGuests: 10, image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&auto=format", status: 'available', latitude: 36.8200, longitude: 7.6900, description: "Villa au coeur de la nature avec vue sur les montagnes." },
        { id: 13, name: "Villa de Plage Chetaibi", location: "chetaibi", district: "CHETAIBI", type: "villa", price_da: 85000000, rating: 5.0, reviews: 112, beds: 6, baths: 5, area: 500, maxGuests: 14, image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&auto=format", status: 'available', latitude: 36.9600, longitude: 7.8500, description: "Magnifique villa en premiere ligne de mer." },
        { id: 14, name: "Appartement Vue Mer Chetaibi", location: "chetaibi", district: "CHETAIBI", type: "apartment", price_da: 16500000, rating: 4.8, reviews: 34, beds: 3, baths: 2, area: 125, maxGuests: 6, image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&auto=format", status: 'available', latitude: 36.9600, longitude: 7.8500, description: "Appartement avec vue imprenable sur la mer." },
        { id: 15, name: "Villa Boulimat", location: "boulimat", district: "BOULIMAT", type: "villa", price_da: 45000000, rating: 4.9, reviews: 61, beds: 5, baths: 4, area: 400, maxGuests: 12, image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&auto=format", status: 'available', latitude: 36.9200, longitude: 7.7800, description: "Villa de luxe dans un quartier residentiel calme." },
        { id: 16, name: "Villa Plateau Annaba", location: "plateau", district: "PLATEAU", type: "villa", price_da: 52000000, rating: 4.95, reviews: 73, beds: 5, baths: 4, area: 450, maxGuests: 12, image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&auto=format", status: 'available', latitude: 36.8950, longitude: 7.7500, description: "Villa de prestige sur le plateau d'Annaba." },
        { id: 17, name: "Villa Saint Cloud", location: "st-cloud", district: "SAINT CLOUD", type: "villa", price_da: 29000000, rating: 4.75, reviews: 39, beds: 4, baths: 3, area: 260, maxGuests: 10, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format", status: 'available', latitude: 36.8850, longitude: 7.7400, description: "Villa traditionnelle renovee dans le quartier historique." },
        { id: 18, name: "Ferme Berrahal", location: "berrahal", district: "BERRAHAL", type: "villa", price_da: 18500000, rating: 4.6, reviews: 28, beds: 4, baths: 3, area: 350, maxGuests: 10, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format", status: 'available', latitude: 36.8500, longitude: 7.4500, description: "Ferme authentique avec grand terrain agricole." },
        { id: 19, name: "Villa Oued El Aneb", location: "oued-el-aneb", district: "OUED EL ANEB", type: "villa", price_da: 22000000, rating: 4.7, reviews: 25, beds: 4, baths: 3, area: 260, maxGuests: 10, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format", status: 'available', latitude: 36.7800, longitude: 7.6000, description: "Villa moderne dans la region viticole." },
        { id: 20, name: "Maison Ettarf", location: "ettarf", district: "ETTARF", type: "villa", price_da: 12000000, rating: 4.5, reviews: 14, beds: 3, baths: 2, area: 180, maxGuests: 7, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format", status: 'available', latitude: 36.7500, longitude: 7.5500, description: "Maison traditionnelle renovee." },
        { id: 21, name: "Ferme El Alma", location: "el-alma", district: "EL ALMA", type: "villa", price_da: 16500000, rating: 4.55, reviews: 16, beds: 3, baths: 2, area: 220, maxGuests: 8, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format", status: 'available', latitude: 36.7200, longitude: 7.5800, description: "Ferme agricole avec maison traditionnelle." },
        { id: 22, name: "Villa Cheria", location: "cheria", district: "CHERIA", type: "villa", price_da: 19500000, rating: 4.6, reviews: 19, beds: 3, baths: 2, area: 200, maxGuests: 8, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format", status: 'available', latitude: 36.7000, longitude: 7.5200, description: "Villa avec vue panoramique sur la region." }
    ];
}

function getCurrentlyFilteredProperties() {
    let filtered = [...allProperties];
    if (currentFilter.location && currentFilter.location !== "") {
        filtered = filtered.filter(p => {
            const propLocation = (p.location || '').toLowerCase();
            const propDistrict = (p.district || '').toLowerCase();
            const filterLoc = currentFilter.location.toLowerCase();
            return propLocation.includes(filterLoc) || propDistrict.includes(filterLoc);
        });
    }
    if (currentFilter.type && currentFilter.type !== "") {
        filtered = filtered.filter(p => (p.type || '').toLowerCase() === currentFilter.type.toLowerCase());
    }
    if (currentFilter.price && currentFilter.price < 50000000) {
        filtered = filtered.filter(p => p.price_da <= currentFilter.price);
    }
    if (currentFilter.guests && currentFilter.guests > 0) {
        filtered = filtered.filter(p => (p.maxGuests || 0) >= currentFilter.guests);
    }
    filtered.sort((a, b) => (a.price_da || 0) - (b.price_da || 0));
    return filtered;
}

function filterAndRenderProperties() {
    const filtered = getCurrentlyFilteredProperties();
    renderProperties(filtered);
    updateMapMarkers(filtered);
}

function renderProperties(properties) {
    const container = document.getElementById('cardsGrid');
    if (!container) return;
    const end = currentPage * ITEMS_PER_PAGE;
    const visibleProperties = properties.slice(0, end);
    const resultCount = document.getElementById("resultCount");
    const displayCount = document.getElementById("displayCount");
    if (resultCount) resultCount.textContent = properties.length;
    if (displayCount) displayCount.textContent = visibleProperties.length;
    
    if (visibleProperties.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-building"></i><p>No properties match your criteria in Annaba.</p><button class="clear-search" id="emptyClearBtn">Clear Filters</button></div>`;
        const emptyClear = document.getElementById('emptyClearBtn');
        if (emptyClear) emptyClear.addEventListener('click', clearAllFilters);
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) loadMoreBtn.style.display = "none";
        return;
    }
    
    container.className = `cards-grid ${currentView === 'list' ? 'list-mode' : ''}`;
    container.innerHTML = visibleProperties.map(prop => `
        <article class="prop-card" data-id="${prop.id}" onclick="goToDetail(${prop.id})">
            <div class="card-img-wrap">
                <img src="${prop.image}" alt="${escapeHtml(prop.name)}" onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format'">
                <div class="price-tag">${prop.price_da.toLocaleString()} DA</div>
                <div class="guest-badge"><i class="fas fa-user-friends"></i> ${prop.maxGuests} guests</div>
            </div>
            <div class="card-body">
                <p class="card-district">${escapeHtml(prop.district || prop.location)}</p>
                <h3 class="card-title">${escapeHtml(prop.name)}</h3>
                <div class="card-meta">
                    <span><i class="fas fa-bed"></i> ${prop.beds} beds</span>
                    <span><i class="fas fa-bath"></i> ${prop.baths} baths</span>
                    <span><i class="fas fa-vector-square"></i> ${prop.area} m²</span>
                </div>
                <div class="card-footer">
                    <div class="stars">${getStarsHtml(prop.rating)} <span class="rating-num">${prop.rating} (${prop.reviews})</span></div>
                    <button class="btn-arrow" onclick="event.stopPropagation(); goToDetail(${prop.id})"><i class="fas fa-arrow-right"></i></button>
                </div>
            </div>
        </article>
    `).join('');
    
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = visibleProperties.length >= properties.length ? "none" : "flex";
    }
}

function clearAllFilters() {
    currentFilter = { location: "", type: "", price: 50000000, guests: 0 };
    currentPage = 1;
    const locationSelect = document.getElementById('filterLocation');
    const typeSelect = document.getElementById('filterType');
    const guestsSelect = document.getElementById('filterGuests');
    const priceSlider = document.getElementById('priceSlider');
    if (locationSelect) locationSelect.value = "";
    if (typeSelect) typeSelect.value = "";
    if (guestsSelect) guestsSelect.value = "0";
    if (priceSlider) {
        priceSlider.value = "50000000";
        updateSliderGradient(priceSlider, 50000000);
        updatePriceDisplay(50000000);
    }
    filterAndRenderProperties();
    showToast('All filters cleared');
}

function updateSliderGradient(slider, value) {
    const percent = (value / 50000000) * 100;
    slider.style.background = `linear-gradient(90deg, #c9a96e 0%, #c9a96e ${percent}%, #e8ddd0 ${percent}%, #e8ddd0 100%)`;
}

function updatePriceDisplay(value) {
    const priceRangeValue = document.getElementById('priceRangeValue');
    if (!priceRangeValue) return;
    const val = parseInt(value);
    if (val >= 50000000) {
        priceRangeValue.innerHTML = `<span class="price-min">0 DA</span><i class="fas fa-arrow-right"></i><span class="price-max">50M+ DA</span>`;
    } else {
        priceRangeValue.innerHTML = `<span class="price-min">0 DA</span><i class="fas fa-arrow-right"></i><span class="price-max">${val.toLocaleString()} DA</span>`;
    }
}

function initPriceSlider() {
    const slider = document.getElementById('priceSlider');
    if (!slider) return;
    updateSliderGradient(slider, slider.value);
    updatePriceDisplay(slider.value);
    slider.addEventListener('input', function(e) {
        const value = parseInt(e.target.value);
        updatePriceDisplay(value);
        updateSliderGradient(this, value);
        currentFilter.price = value;
        currentPage = 1;
        filterAndRenderProperties();
    });
}

function goToDetail(id) {
    const property = allProperties.find(p => p.id == id);
    if (property) {
        localStorage.setItem('last_viewed_property', id);
        const params = new URLSearchParams();
        params.set('id', property.id);
        params.set('name', property.name);
        params.set('price_dzd', property.price_da);
        params.set('price_usd', Math.round(property.price_da / 215));
        params.set('rating', property.rating);
        params.set('beds', property.beds);
        params.set('baths', property.baths);
        params.set('area', property.area);
        params.set('reviews', property.reviews);
        params.set('location', property.location || property.district);
        params.set('district', property.district || property.location);
        params.set('image', property.image);
        params.set('max_guests', property.maxGuests);
        params.set('type', property.type);
        params.set('status', property.status || 'available');
        params.set('description', property.description || '');
        window.location.href = `detail.html?${params.toString()}`;
    } else {
        window.location.href = `detail.html?id=${id}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProperties();
    initPriceSlider();
    const locateMeBtn = document.getElementById('mapLocateMeBtn');
    const findNearbyBtn = document.getElementById('mapFindNearbyBtn');
    const resetBtn = document.getElementById('mapResetBtn');
    if (locateMeBtn) locateMeBtn.addEventListener('click', locateUserOnMap);
    if (findNearbyBtn) findNearbyBtn.addEventListener('click', () => updateMapMarkers(getCurrentlyFilteredProperties()));
    if (resetBtn) resetBtn.addEventListener('click', resetMapView);
    const guestsSelect = document.getElementById('filterGuests');
    if (guestsSelect) {
        guestsSelect.addEventListener('change', (e) => {
            currentFilter.guests = parseInt(e.target.value) || 0;
            currentPage = 1;
            filterAndRenderProperties();
        });
    }
    const locationFilter = document.getElementById('filterLocation');
    if (locationFilter) {
        locationFilter.addEventListener('change', (e) => {
            currentFilter.location = e.target.value;
            currentPage = 1;
            filterAndRenderProperties();
        });
    }
    const typeFilter = document.getElementById('filterType');
    if (typeFilter) {
        typeFilter.addEventListener('change', (e) => {
            currentFilter.type = e.target.value;
            currentPage = 1;
            filterAndRenderProperties();
        });
    }
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', () => filterAndRenderProperties());
    const gridViewBtn = document.getElementById('gridView');
    const listViewBtn = document.getElementById('listView');
    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', () => {
            currentView = 'grid';
            gridViewBtn.classList.add('active');
            if (listViewBtn) listViewBtn.classList.remove('active');
            renderProperties(getCurrentlyFilteredProperties());
        });
    }
    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => {
            currentView = 'list';
            listViewBtn.classList.add('active');
            if (gridViewBtn) gridViewBtn.classList.remove('active');
            renderProperties(getCurrentlyFilteredProperties());
        });
    }
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            filterAndRenderProperties();
        });
    }
});

function saveSearchCriteriaToLocal() {
    const location = document.getElementById('filterLocation')?.value || '';
    const type = document.getElementById('filterType')?.value || '';
    const guests = parseInt(document.getElementById('filterGuests')?.value) || 0;
    const priceSlider = document.getElementById('priceSlider');
    const maxPrice = priceSlider ? parseInt(priceSlider.value) : 50000000;
    
    const searchData = {
        location: location,
        type: type,
        guests: guests,
        max_price: maxPrice < 50000000 ? maxPrice : null,
        timestamp: Date.now()
    };
    
    localStorage.setItem('dreamhome_last_search', JSON.stringify(searchData));
    
    if (typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('searchPerformed', { detail: searchData }));
    }
    
    return searchData;
}

function performSearchWithRecommendations() {
    const searchData = saveSearchCriteriaToLocal();
    
    currentFilter = {
        location: searchData.location,
        type: searchData.type,
        price: searchData.max_price || 50000000,
        guests: searchData.guests
    };
    currentPage = 1;
    filterAndRenderProperties();
    
    if (searchData.location || searchData.type) {
        showToast(`Search saved! We'll recommend similar properties.`);
    }
}

function initSearchWithRecommendations() {
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        const newBtn = searchBtn.cloneNode(true);
        searchBtn.parentNode.replaceChild(newBtn, searchBtn);
        newBtn.addEventListener('click', performSearchWithRecommendations);
    }
    
    const locationFilter = document.getElementById('filterLocation');
    const typeFilter = document.getElementById('filterType');
    const guestsFilter = document.getElementById('filterGuests');
    const priceSlider = document.getElementById('priceSlider');
    
    const autoSaveSearch = () => { saveSearchCriteriaToLocal(); };
    
    if (locationFilter) locationFilter.addEventListener('change', autoSaveSearch);
    if (typeFilter) typeFilter.addEventListener('change', autoSaveSearch);
    if (guestsFilter) guestsFilter.addEventListener('change', autoSaveSearch);
    if (priceSlider) priceSlider.addEventListener('change', autoSaveSearch);
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initSearchWithRecommendations, 500);
});

window.saveSearchCriteriaToLocal = saveSearchCriteriaToLocal;
window.performSearchWithRecommendations = performSearchWithRecommendations;
window.goToDetail = goToDetail;
window.clearAllFilters = clearAllFilters;
window.showToast = showToast;