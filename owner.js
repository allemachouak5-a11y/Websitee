let bookings = [];
let reviews = [];
let ownerProperties = [];
let pendingRequests = [];

let bookingsChartInstance = null;
let chartPeriod = 'week'; 

function getCurrentUser() {
    const session = localStorage.getItem('dreamhome_session') || sessionStorage.getItem('dreamhome_session');
    if (session) {
        try {
            return JSON.parse(session);
        } catch(e) {
            return null;
        }
    }
    return null;
}

function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
        
        const style = document.createElement('style');
        style.textContent = `
            #toastContainer {
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                z-index: 3000;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            .toast {
                background: white;
                padding: 0.8rem 1.2rem;
                border-radius: 12px;
                display: flex;
                align-items: center;
                gap: 0.6rem;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideIn 0.3s ease;
            }
            .toast-success {
                border-left: 4px solid #2e7d32;
            }
            .toast-success i {
                color: #2e7d32;
            }
            .toast-error {
                border-left: 4px solid #c25b4a;
            }
            .toast-error i {
                color: #c25b4a;
            }
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(30px); }
                to { opacity: 1; transform: translateX(0); }
            }
            @keyframes slideOut {
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(30px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatPrice(price) {
    if (!price) return '0';
    return parseInt(price).toLocaleString();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getStarsHtml(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
    if (hasHalfStar) stars += '<i class="fas fa-star-half-alt"></i>';
    for (let i = Math.ceil(rating); i < 5; i++) stars += '<i class="far fa-star"></i>';
    return stars;
}

async function loadOwnerProperties() {
    const user = getCurrentUser();
    if (!user || user.role !== 'owner') {
        console.log('Not an owner or not logged in');
        return;
    }
    
    try {
        const response = await fetch('api-owner-properties.php');
        const result = await response.json();
        
        if (result.success) {
            ownerProperties = result.properties || [];
            console.log(`Loaded ${ownerProperties.length} properties for owner`);
            
            await loadAllBookingsForOwner();
            await loadPendingRequests();
        } else {
            console.error('Error loading properties:', result.message);
        }
    } catch (error) {
        console.error('Error loading properties:', error);
    }
}

async function loadAllBookingsForOwner() {
    try {
        const response = await fetch('api-admin.php?action=bookings');
        const result = await response.json();
        
        if (result.success && result.bookings) {
            const ownerPropertyIds = ownerProperties.map(p => p.id);
            
            bookings = result.bookings.filter(b => ownerPropertyIds.includes(b.property_id));
            
            console.log(`Loaded ${bookings.length} bookings for owner's properties`);
            
            updateDashboardStats();
            
            updateCharts();
            
            renderRecentRequestsOnDashboard();
        } else {
            console.log('No bookings found or API error');
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

async function loadPendingRequests() {
    const user = getCurrentUser();
    if (!user || user.role !== 'owner') return;
    
    try {
        const response = await fetch('api-admin.php?action=owner_pending_requests');
        const result = await response.json();
        
        if (result.success && result.requests && result.requests.length > 0) {
            pendingRequests = result.requests;
            console.log(`Loaded ${pendingRequests.length} pending requests`);
        } else {
            pendingRequests = [];
            console.log('No pending requests');
        }
        
        renderRecentRequestsOnDashboard();
        
        const requestsContainer = document.getElementById('requestsContainer');
        if (requestsContainer) {
            renderAllRequests(requestsContainer, pendingRequests);
        }
    } catch (error) {
        console.error('Error loading pending requests:', error);
        pendingRequests = [];
        renderRecentRequestsOnDashboard();
    }
}

function renderRecentRequestsOnDashboard() {
    const container = document.getElementById('recentRequests');
    if (!container) return;
    
    const recentRequests = pendingRequests.slice(0, 5);
    
    if (recentRequests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No pending booking requests</p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem;">When tenants request to book your properties, they will appear here.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentRequests.map(request => `
        <div class="request-item" data-id="${request.id}">
            <div class="request-info">
                <h4>${escapeHtml(request.tenant_name || 'Tenant')}</h4>
                <p>${escapeHtml(request.property_name)} • ${formatDate(request.start_date)} - ${formatDate(request.end_date)}</p>
                <p class="request-details">
                    <small><i class="fas fa-envelope"></i> ${escapeHtml(request.tenant_email || '-')}</small>
                    ${request.tenant_phone ? `<small><i class="fas fa-phone"></i> ${escapeHtml(request.tenant_phone)}</small>` : ''}
                </p>
                <p class="request-amount">💰 ${formatPrice(request.total_amount_dzd)} DA</p>
            </div>
            <div class="request-status status-pending">Pending</div>
            <div class="request-actions">
                <button class="btn-accept" onclick="updateBookingRequest(${request.id}, 'confirmed')">
                    <i class="fas fa-check"></i> Accept
                </button>
                <button class="btn-reject" onclick="updateBookingRequest(${request.id}, 'cancelled')">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        </div>
    `).join('');
}

function renderAllRequests(container, requests) {
    if (!container) return;
    
    if (requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No pending booking requests</p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem;">When tenants request to book your properties, they will appear here.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = requests.map(request => `
        <div class="request-card" data-id="${request.id}">
            <div class="request-image">
                <img src="${request.property_image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=100&auto=format'}" 
                     alt="${escapeHtml(request.property_name)}" 
                     onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=100&auto=format'">
            </div>
            <div class="request-info">
                <div class="request-property">${escapeHtml(request.property_name)}</div>
                <div class="request-tenant">
                    <span><i class="fas fa-user"></i> ${escapeHtml(request.tenant_name || 'Tenant')}</span>
                    <span><i class="fas fa-envelope"></i> ${escapeHtml(request.tenant_email || '-')}</span>
                    ${request.tenant_phone ? `<span><i class="fas fa-phone"></i> ${escapeHtml(request.tenant_phone)}</span>` : ''}
                </div>
                <div class="request-dates">
                    📅 ${formatDate(request.start_date)} → ${formatDate(request.end_date)} (${request.number_of_days || 1} nights)
                </div>
            </div>
            <div class="request-amount">
                ${formatPrice(request.total_amount_dzd)} DA
            </div>
            <div class="request-actions">
                <button class="request-btn-approve" onclick="updateBookingRequest(${request.id}, 'confirmed')">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="request-btn-reject" onclick="updateBookingRequest(${request.id}, 'cancelled')">
                    <i class="fas fa-times"></i> Decline
                </button>
            </div>
        </div>
    `).join('');
}

async function updateBookingRequest(bookingId, status) {
    const isApprove = status === 'confirmed';
    const confirmMsg = isApprove ? 'Are you sure you want to approve this booking request?' : 'Are you sure you want to decline this booking request?';
    
    if (!confirm(confirmMsg)) return;
    
    const buttons = document.querySelectorAll(`.request-item[data-id="${bookingId}"] .request-actions button, .request-card[data-id="${bookingId}"] .request-actions button`);
    buttons.forEach(btn => btn.disabled = true);
    
    try {
        const response = await fetch('api-admin.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'update_booking_by_owner', 
                booking_id: bookingId, 
                status: status 
            })
        });
        const result = await response.json();
        
        if (result.success) {
            showToast(isApprove ? 'Booking approved successfully!' : 'Booking declined');
            await loadPendingRequests();
            await loadAllBookingsForOwner();
        } else {
            showToast(result.message || 'Failed to update booking', 'error');
            buttons.forEach(btn => btn.disabled = false);
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Connection error. Please try again.', 'error');
        buttons.forEach(btn => btn.disabled = false);
    }
}

function updateDashboardStats() {
    const totalProperties = ownerProperties.length;
    const activeProperties = ownerProperties.filter(p => p.status === 'available').length;
    const totalBookings = bookings.length;
    const pendingCount = pendingRequests.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (parseFloat(b.total_amount_dzd) || 0), 0);
    
    console.log(`Stats: ${totalProperties} properties, ${activeProperties} active, ${totalBookings} bookings, ${pendingCount} pending, ${totalRevenue.toLocaleString()} DA revenue`);
    
    const pendingCountBadge = document.querySelector('.pending-count-badge');
    if (pendingCountBadge) pendingCountBadge.textContent = pendingCount;
}

function initCharts() {
    const periodSelect = document.getElementById('chartPeriod');
    if (periodSelect) {
        periodSelect.addEventListener('change', (e) => {
            chartPeriod = e.target.value;
            updateCharts();
        });
    }
    updateCharts();
}

function updateCharts() {
    if (bookings.length === 0) {
        console.log('No bookings data for chart');
        const ctx = document.getElementById('bookingsChart')?.getContext('2d');
        if (ctx && bookingsChartInstance) {
            bookingsChartInstance.destroy();
            bookingsChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Number of Bookings',
                        data: [],
                        borderColor: '#c9a96e',
                        backgroundColor: 'rgba(201, 169, 110, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { position: 'top' }
                    }
                }
            });
        }
        return;
    }
    
    let labels = [];
    let data = [];
    const now = new Date();
    
    if (chartPeriod === 'week') {
        labels = [];
        data = Array(7).fill(0);
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            labels.push(d.toLocaleDateString('en-GB', { weekday: 'short' }));
        }
        
        bookings.forEach(booking => {
            const date = new Date(booking.created_at);
            const dayDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            if (dayDiff >= 0 && dayDiff < 7) {
                data[6 - dayDiff]++;
            }
        });
    } else if (chartPeriod === 'month') {
        labels = [];
        data = Array(30).fill(0);
        
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            labels.push(d.getDate().toString());
        }
        
        bookings.forEach(booking => {
            const date = new Date(booking.created_at);
            const dayDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            if (dayDiff >= 0 && dayDiff < 30) {
                data[29 - dayDiff]++;
            }
        });
    } else {
        labels = [];
        data = Array(12).fill(0);
        
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now);
            d.setMonth(now.getMonth() - i);
            labels.push(d.toLocaleDateString('en-GB', { month: 'short' }));
        }
        
        bookings.forEach(booking => {
            const date = new Date(booking.created_at);
            const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
            if (monthDiff >= 0 && monthDiff < 12) {
                data[11 - monthDiff]++;
            }
        });
    }
    
    const ctx = document.getElementById('bookingsChart')?.getContext('2d');
    if (ctx) {
        if (bookingsChartInstance) bookingsChartInstance.destroy();
        bookingsChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Bookings',
                    data: data,
                    borderColor: '#c9a96e',
                    backgroundColor: 'rgba(201, 169, 110, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#c9a96e',
                    pointBorderColor: '#fff',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    }
                }
            }
        });
    }
}

async function loadReviews() {
    try {
        const response = await fetch('api-admin.php?action=reviews');
        const result = await response.json();
        
        if (result.success && result.reviews) {
            const ownerPropertyIds = ownerProperties.map(p => p.id);
            reviews = result.reviews.filter(r => ownerPropertyIds.includes(r.property_id));
            renderReviews();
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

function renderReviews() {
    const container = document.getElementById('reviewsList');
    if (!container) return;
    
    const avgStarsSpan = document.getElementById('avgStars');
    const ratingBreakdown = document.getElementById('ratingBreakdown');
    
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 ? reviews.reduce((sum, r) => sum + parseFloat(r.rating), 0) / totalReviews : 0;
    
    if (avgStarsSpan) {
        avgStarsSpan.innerHTML = getStarsHtml(avgRating);
        const ratingNumberSpan = document.querySelector('.rating-number');
        if (ratingNumberSpan) ratingNumberSpan.textContent = avgRating.toFixed(1);
    }
    
    if (ratingBreakdown) {
        ratingBreakdown.innerHTML = `<div>Based on ${totalReviews} reviews</div>`;
    }
    
    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-star"></i>
                <p>No reviews yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div>
                    <div class="reviewer-name">${escapeHtml(review.reviewer_name || 'Guest')}</div>
                    <div class="stars">${getStarsHtml(parseFloat(review.rating))}</div>
                </div>
                <div class="review-date">${formatDate(review.created_at)}</div>
            </div>
            <div class="review-text">${escapeHtml(review.comment || 'No comment')}</div>
            <div class="review-property">
                <small><i class="fas fa-home"></i> ${escapeHtml(review.property_name)}</small>
            </div>
        </div>
    `).join('');
}

function renderBookings(filter = 'all') {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;
    
    let filtered = bookings;
    if (filter !== 'all') {
        filtered = bookings.filter(b => b.status === filter);
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No bookings found</td></tr>`;
        return;
    }
    
    tbody.innerHTML = filtered.map(booking => `
        <tr>
            <td>
                <strong>${escapeHtml(booking.user_name || 'Tenant')}</strong><br>
                <small>${escapeHtml(booking.user_email || '-')}</small>
            </td>
            <td>${escapeHtml(booking.property_name || '-')}</td>
            <td>${formatDate(booking.start_date)}</td>
            <td>${formatDate(booking.end_date)}</td>
            <td>${formatPrice(booking.total_amount_dzd)} DA</td>
            <td>
                <span class="status-badge status-${booking.status}">
                    ${booking.status === 'pending' ? 'Pending' : booking.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    ${booking.status === 'pending' ? `
                        <button class="btn-icon accept" onclick="updateBookingRequest(${booking.id}, 'confirmed')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-icon reject" onclick="updateBookingRequest(${booking.id}, 'cancelled')">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadTopCities() {
    const container = document.getElementById('topCitiesList');
    if (!container) return;
    
    try {
        const cityCount = {};
        ownerProperties.forEach(prop => {
            const city = prop.district || prop.location || 'Annaba';
            cityCount[city] = (cityCount[city] || 0) + 1;
        });
        
        const cities = Object.entries(cityCount).map(([city, count]) => ({ city, count }));
        cities.sort((a, b) => b.count - a.count);
        
        if (cities.length > 0) {
            const maxCount = Math.max(...cities.map(c => c.count));
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                    ${cities.map(city => `
                        <div style="display: flex; align-items: center; gap: 0.8rem;">
                            <div style="width: 100px; font-size: 0.85rem; color: var(--brown-dark);">
                                <i class="fas fa-map-marker-alt" style="color: var(--gold); width: 16px;"></i>
                                ${escapeHtml(city.city)}
                            </div>
                            <div style="flex: 1;">
                                <div style="height: 32px; background: var(--cream-dark); border-radius: 20px; overflow: hidden;">
                                    <div style="width: ${(city.count / maxCount) * 100}%; height: 100%; background: linear-gradient(90deg, var(--gold), var(--gold-lt)); border-radius: 20px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; color: var(--brown-dark); font-size: 0.7rem; font-weight: 600;">
                                        ${city.count}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            container.innerHTML = `<div class="empty-message">No data available</div>`;
        }
    } catch (error) {
        console.error('Error loading city stats:', error);
        container.innerHTML = `<div class="empty-message">Unable to load statistics</div>`;
    }
}

async function loadUserStats() {
    const container = document.getElementById('userStats');
    if (!container) return;
    
    try {
        const response = await fetch('api-stats.php?type=users');
        const data = await response.json();
        
        if (data.success) {
            container.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div style="background: var(--cream); border-radius: 12px; padding: 0.8rem; text-align: center;">
                        <div style="font-size: 1.8rem; font-weight: 700; color: var(--gold);">${data.total_users || 0}</div>
                        <div style="font-size: 0.7rem; color: var(--gray);">Total Users</div>
                    </div>
                    <div style="background: var(--cream); border-radius: 12px; padding: 0.8rem; text-align: center;">
                        <div style="font-size: 1.8rem; font-weight: 700; color: var(--gold);">${data.owners_count || 0}</div>
                        <div style="font-size: 0.7rem; color: var(--gray);"><i class="fas fa-building"></i> Property Owners</div>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div style="background: var(--cream); border-radius: 12px; padding: 0.8rem; text-align: center;">
                        <div style="font-size: 1.8rem; font-weight: 700; color: var(--gold);">${data.tenants_count || 0}</div>
                        <div style="font-size: 0.7rem; color: var(--gray);"><i class="fas fa-user"></i> Tenants</div>
                    </div>
                    <div style="background: var(--cream); border-radius: 12px; padding: 0.8rem; text-align: center;">
                        <div style="font-size: 1.8rem; font-weight: 700; color: var(--gold);">${data.admins_count || 0}</div>
                        <div style="font-size: 0.7rem; color: var(--gray);"><i class="fas fa-user-shield"></i> Admins</div>
                    </div>
                </div>
                <div style="margin-top: 0.8rem; padding-top: 0.8rem; border-top: 1px solid var(--cream-mid); font-size: 0.7rem; color: var(--gray); text-align: center;">
                    <i class="fas fa-chart-line"></i> Last 30 days: <strong>${data.new_users_last_month || 0}</strong> new users
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
        container.innerHTML = `<div class="empty-message">Unable to load statistics</div>`;
    }
}

function showDashboard() {
    document.querySelectorAll('.page-container').forEach(page => {
        page.style.display = 'none';
    });
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.style.display = 'block';
    
    loadPendingRequests();
}

function showPage(pageName) {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.style.display = 'none';
    
    document.querySelectorAll('.page-container').forEach(page => {
        page.style.display = 'none';
    });
    
    const activePage = document.getElementById(`${pageName}Page`);
    if (activePage) activePage.style.display = 'block';
    
    if (pageName === 'bookings') {
        renderBookings();
    } else if (pageName === 'requests') {
        renderAllRequests(document.getElementById('requestsContainer'), pendingRequests);
    } else if (pageName === 'reviews') {
        loadReviews();
    }
}

async function loadOwnerProfile() {
    try {
        const response = await fetch('api-profile.php');
        const data = await response.json();
        
        if (data.success && data.user) {
            const firstNameInput = document.getElementById('firstName');
            const lastNameInput = document.getElementById('lastName');
            const emailInput = document.getElementById('email');
            const phoneInput = document.getElementById('phone');
            const citySelect = document.getElementById('city');
            const bioTextarea = document.getElementById('bio');
            
            if (firstNameInput) firstNameInput.value = data.user.first_name || '';
            if (lastNameInput) lastNameInput.value = data.user.last_name || '';
            if (emailInput) emailInput.value = data.user.email || '';
            if (phoneInput) phoneInput.value = data.user.phone || '';
            if (citySelect) citySelect.value = data.user.city || '';
            if (bioTextarea) bioTextarea.value = data.user.bio || '';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function saveProfile(e) {
    if (e) e.preventDefault();
    
    const userData = {
        first_name: document.getElementById('firstName')?.value || '',
        last_name: document.getElementById('lastName')?.value || '',
        phone: document.getElementById('phone')?.value || '',
        city: document.getElementById('city')?.value || '',
        bio: document.getElementById('bio')?.value || ''
    };
    
    fetch('api-profile.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Profile saved successfully!');
            const user = getCurrentUser();
            if (user) {
                user.first_name = userData.first_name;
                user.last_name = userData.last_name;
                localStorage.setItem('dreamhome_session', JSON.stringify(user));
            }
        } else {
            showToast('Failed to save profile', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Connection error', 'error');
    });
}

function updatePassword(e) {
    if (e) e.preventDefault();
    
    const currentPass = document.getElementById('currentPassword')?.value;
    const newPass = document.getElementById('newPassword')?.value;
    const confirmPass = document.getElementById('confirmPassword')?.value;
    const errorMsg = document.getElementById('passwordMatchError');
    
    if (!errorMsg) return;
    
    if (newPass !== confirmPass) {
        errorMsg.classList.add('show');
        return;
    }
    
    errorMsg.classList.remove('show');
    
    if (newPass.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    const saveBtn = document.querySelector('#passwordForm .btn-save');
    if (saveBtn) {
        const originalText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        fetch('api-profile.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                current_password: currentPass,
                new_password: newPass
            })
        })
        .then(response => response.json())
        .then(data => {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
            
            if (data.success) {
                showToast('Password changed successfully!');
                const form = document.getElementById('passwordForm');
                if (form) form.reset();
                const strengthFill = document.getElementById('strengthFill');
                const strengthLabel = document.getElementById('strengthLabel');
                if (strengthFill) strengthFill.style.width = '0%';
                if (strengthLabel) strengthLabel.textContent = '';
            } else {
                showToast(data.message || 'Failed to change password', 'error');
            }
        })
        .catch(error => {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
            showToast('Connection error', 'error');
        });
    }
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const btn = input.nextElementSibling;
    if (input.type === 'password') {
        input.type = 'text';
        if (btn) btn.innerHTML = '<i class="far fa-eye-slash"></i>';
    } else {
        input.type = 'password';
        if (btn) btn.innerHTML = '<i class="far fa-eye"></i>';
    }
}

function checkPasswordStrength() {
    const password = document.getElementById('newPassword')?.value || '';
    const fill = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    
    if (!fill || !label) return;
    
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    const levels = [
        { w: '0%', color: '', text: '' },
        { w: '20%', color: '#e07a5f', text: 'Very Weak' },
        { w: '40%', color: '#e9b35f', text: 'Weak' },
        { w: '60%', color: '#f4d03f', text: 'Fair' },
        { w: '80%', color: '#2ecc71', text: 'Good' },
        { w: '100%', color: '#27ae60', text: 'Strong ✓' }
    ];
    
    const level = Math.min(score, 5);
    fill.style.width = levels[level].w;
    fill.style.backgroundColor = levels[level].color;
    label.textContent = levels[level].text;
}

function saveNotificationSettings() {
    const settings = {
        bookings: document.getElementById('notifyBookings')?.checked || false,
        email: document.getElementById('notifyEmail')?.checked || false,
        sms: document.getElementById('notifySms')?.checked || false,
        reviews: document.getElementById('notifyReviews')?.checked || false,
        marketing: document.getElementById('notifyMarketing')?.checked || false
    };
    
    localStorage.setItem('dreamhome_notification_settings', JSON.stringify(settings));
    showToast('Notification preferences saved!');
}

function loadNotificationSettings() {
    const settings = localStorage.getItem('dreamhome_notification_settings');
    if (settings) {
        const prefs = JSON.parse(settings);
        const notifyBookings = document.getElementById('notifyBookings');
        const notifyEmail = document.getElementById('notifyEmail');
        const notifySms = document.getElementById('notifySms');
        const notifyReviews = document.getElementById('notifyReviews');
        const notifyMarketing = document.getElementById('notifyMarketing');
        
        if (notifyBookings) notifyBookings.checked = prefs.bookings;
        if (notifyEmail) notifyEmail.checked = prefs.email;
        if (notifySms) notifySms.checked = prefs.sms;
        if (notifyReviews) notifyReviews.checked = prefs.reviews;
        if (notifyMarketing) notifyMarketing.checked = prefs.marketing;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    if (user.role !== 'owner') {
        showToast('Access denied. Owner dashboard only.', 'error');
        setTimeout(() => { window.location.href = 'index.php'; }, 2000);
        return;
    }
    
    await loadOwnerProperties();
    await loadPendingRequests();
    await loadReviews();
    await loadTopCities();
    await loadUserStats();
    
    initCharts();
    
    loadOwnerProfile();
    loadNotificationSettings();
    
    const viewAllBtns = document.querySelectorAll('.view-all');
    viewAllBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            if (page) showPage(page);
        });
    });
    
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            renderBookings(filter);
        });
    });
    
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', saveProfile);
    }
    
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', updatePassword);
    }
    
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', checkPasswordStrength);
    }
    
    setInterval(() => {
        if (document.getElementById('recentRequests') && document.getElementById('recentRequests').offsetParent !== null) {
            loadPendingRequests();
        }
        if (bookings.length > 0) {
            updateCharts();
        }
    }, 30000);
});

window.showDashboard = showDashboard;
window.showPage = showPage;
window.updateBookingRequest = updateBookingRequest;
window.togglePasswordVisibility = togglePasswordVisibility;
window.checkPasswordStrength = checkPasswordStrength;
window.saveNotificationSettings = saveNotificationSettings;

const style = document.createElement('style');
style.textContent = `
    .empty-message {
        text-align: center;
        padding: 1rem;
        color: var(--gray);
    }
    .request-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: var(--bg-light);
        border-radius: var(--radius-sm);
        transition: var(--transition);
        flex-wrap: wrap;
        gap: 1rem;
        border: 1px solid var(--border-light);
    }
    .request-item:hover {
        background: var(--border-light);
    }
    .request-info {
        flex: 2;
    }
    .request-info h4 {
        font-size: 0.95rem;
        margin-bottom: 0.25rem;
        color: var(--dark);
    }
    .request-info p {
        font-size: 0.8rem;
        color: var(--text-gray);
    }
    .request-details {
        margin-top: 0.3rem;
    }
    .request-details small {
        margin-right: 0.8rem;
    }
    .request-amount {
        font-weight: 600;
        color: var(--gold);
    }
    .request-status {
        padding: 0.25rem 0.75rem;
        border-radius: 30px;
        font-size: 0.7rem;
        font-weight: 600;
    }
    .status-pending {
        background: var(--warning-light);
        color: var(--warning);
    }
    .request-actions {
        display: flex;
        gap: 0.5rem;
    }
    .btn-accept, .btn-reject {
        padding: 0.4rem 0.8rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-family: inherit;
        font-size: 0.75rem;
        transition: var(--transition);
    }
    .btn-accept {
        background: var(--success-light);
        color: var(--success);
    }
    .btn-accept:hover {
        background: var(--success);
        color: white;
    }
    .btn-reject {
        background: var(--danger-light);
        color: var(--danger);
    }
    .btn-reject:hover {
        background: var(--danger);
        color: white;
    }
    .empty-state {
        text-align: center;
        padding: 2rem;
        background: var(--white);
        border-radius: var(--radius);
    }
    .empty-state i {
        font-size: 3rem;
        color: var(--text-gray);
        margin-bottom: 1rem;
    }
    .empty-state p {
        color: var(--text-gray);
    }
    .request-card {
        display: flex;
        padding: 1.2rem;
        border-bottom: 1px solid var(--border-light);
        gap: 1rem;
        flex-wrap: wrap;
        align-items: center;
    }
    .request-image {
        width: 80px;
        height: 80px;
        border-radius: 12px;
        overflow: hidden;
        flex-shrink: 0;
    }
    .request-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .request-property {
        font-weight: 700;
        margin-bottom: 0.3rem;
    }
    .request-tenant {
        font-size: 0.8rem;
        color: var(--gray);
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 0.3rem;
    }
    .request-dates {
        font-size: 0.75rem;
        color: var(--brown-mid);
    }
    .request-btn-approve, .request-btn-reject {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 30px;
        cursor: pointer;
        font-family: inherit;
        font-weight: 600;
        transition: var(--transition);
    }
    .request-btn-approve {
        background: #e8f5e9;
        color: #2e7d32;
    }
    .request-btn-approve:hover {
        background: #2e7d32;
        color: white;
    }
    .request-btn-reject {
        background: #feeaea;
        color: #c25b4a;
    }
    .request-btn-reject:hover {
        background: #c25b4a;
        color: white;
    }
    @media (max-width: 768px) {
        .request-item {
            flex-direction: column;
            align-items: flex-start;
        }
        .request-card {
            flex-direction: column;
            text-align: center;
        }
        .request-image {
            width: 100%;
            height: 150px;
        }
        .request-actions {
            justify-content: center;
        }
        .request-tenant {
            justify-content: center;
        }
    }
`;
document.head.appendChild(style);