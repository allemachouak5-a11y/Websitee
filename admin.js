let adminCurrentUser = null;

let pendingProperties = [];
let allProperties = [];
let allUsers = [];
let allBookings = [];

let bookingsChart = null;
let revenueChart = null;

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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

function getCurrentAdminUser() {
    const session = localStorage.getItem('dreamhome_session') || sessionStorage.getItem('dreamhome_session');
    if (session) {
        try {
            const user = JSON.parse(session);
            if (user.role === 'admin') {
                adminCurrentUser = user;
                return user;
            }
        } catch(e) {
            console.error('Error parsing session:', e);
        }
    }
    return null;
}

function checkAdminAuth() {
    const user = getCurrentAdminUser();
    if (!user || user.role !== 'admin') {
        showToast('Admin access required. Please login as admin.', true);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return false;
    }
    return true;
}

async function loadAdminStats() {
    try {
        const response = await fetch('api-admin.php?action=stats');
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('statTotalProperties').textContent = result.total_properties || 0;
            document.getElementById('statPendingProperties').textContent = result.pending_properties || 0;
            document.getElementById('statActiveUsers').textContent = result.active_users || 0;
            document.getElementById('statTotalBookings').textContent = result.total_bookings || 0;
            
            const pendingCount = document.getElementById('pendingCount');
            if (pendingCount) pendingCount.textContent = result.pending_properties || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadPendingProperties() {
    const container = document.getElementById('pendingPropertiesTable');
    if (!container) return;
    
    container.innerHTML = `<tr><td colspan="8" class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>`;
    
    try {
        const response = await fetch('api-admin.php?action=pending_properties');
        const result = await response.json();
        
        if (result.success && result.properties) {
            pendingProperties = result.properties;
            renderPendingProperties();
        } else {
            container.innerHTML = `<tr><td colspan="8" class="empty-state"><i class="fas fa-check-circle"></i><p>No pending properties</p></td></tr>`;
        }
    } catch (error) {
        console.error('Error loading pending properties:', error);
        container.innerHTML = `<tr><td colspan="8" class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading data</p></td></tr>`;
    }
}

function renderPendingProperties() {
    const container = document.getElementById('pendingPropertiesTable');
    if (!container) return;
    
    if (pendingProperties.length === 0) {
        container.innerHTML = `<tr><td colspan="8" class="empty-state"><i class="fas fa-check-circle"></i><p>No pending properties</p></td></tr>`;
        return;
    }
    
    container.innerHTML = pendingProperties.map(prop => `
        <tr>
            <td><img src="${prop.main_image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=80&h=60&fit=crop'}" class="property-image" onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=80&h=60&fit=crop'"></td>
            <td><strong>${escapeHtml(prop.name)}</strong></td>
            <td>${escapeHtml(prop.owner_name || 'Unknown')}</td>
            <td>${escapeHtml(prop.district || prop.location || '-')}</td>
            <td>${formatPrice(prop.price_dzd)} DA</td>
            <td><span class="status-badge status-pending">Pending</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn action-approve" onclick="approveProperty(${prop.id})" title="Approve"><i class="fas fa-check"></i></button>
                    <button class="action-btn action-reject" onclick="rejectProperty(${prop.id})" title="Reject"><i class="fas fa-times"></i></button>
                    <button class="action-btn action-view" onclick="viewPropertyDetails(${prop.id})" title="View Details"><i class="fas fa-eye"></i></button>
                </div>
             </td>
         </tr>
    `).join('');
}

async function approveProperty(id) {
    try {
        const response = await fetch('api-admin.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'approve_property', property_id: id })
        });
        const result = await response.json();
        
        if (result.success) {
            showToast('Property approved successfully');
            loadPendingProperties();
            loadAllProperties();
            loadAdminStats();
        } else {
            showToast(result.message || 'Failed to approve property', true);
        }
    } catch (error) {
        console.error('Error approving property:', error);
        showToast('Connection error', true);
    }
}

async function rejectProperty(id) {
    if (confirm('Are you sure you want to reject this property?')) {
        try {
            const response = await fetch('api-admin.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject_property', property_id: id })
            });
            const result = await response.json();
            
            if (result.success) {
                showToast('Property rejected');
                loadPendingProperties();
                loadAllProperties();
                loadAdminStats();
            } else {
                showToast(result.message || 'Failed to reject property', true);
            }
        } catch (error) {
            console.error('Error rejecting property:', error);
            showToast('Connection error', true);
        }
    }
}

async function loadAllProperties() {
    const container = document.getElementById('allPropertiesTable');
    if (!container) return;
    
    container.innerHTML = `<table><td colspan="9" class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>`;
    
    try {
        const response = await fetch('api-admin.php?action=all_properties');
        const result = await response.json();
        
        if (result.success && result.properties) {
            allProperties = result.properties;
            renderAllProperties();
        } else {
            container.innerHTML = `<tr><td colspan="9" class="empty-state"><i class="fas fa-building"></i><p>No properties found</p></td></tr>`;
        }
    } catch (error) {
        console.error('Error loading properties:', error);
        container.innerHTML = `<tr><td colspan="9" class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading data</p></td></tr>`;
    }
}

function renderAllProperties() {
    const container = document.getElementById('allPropertiesTable');
    const searchTerm = document.getElementById('propSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('propStatusFilter')?.value || 'all';
    
    let filtered = [...allProperties];
    
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            (p.owner_name && p.owner_name.toLowerCase().includes(searchTerm))
        );
    }
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(p => p.admin_status === statusFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `<tr><td colspan="9" class="empty-state"><i class="fas fa-building"></i><p>No properties found</p></td></tr>`;
        return;
    }
    
    container.innerHTML = filtered.map(prop => `
        <tr>
            <td><img src="${prop.main_image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=80&h=60&fit=crop'}" class="property-image" onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=80&h=60&fit=crop'"></td>
            <td><strong>${escapeHtml(prop.name)}</strong></td>
            <td>${escapeHtml(prop.owner_name || 'Unknown')}</td>
            <td>${escapeHtml(prop.district || prop.location || '-')}</td>
            <td>${formatPrice(prop.price_dzd)} DA</td>
            <td>${prop.bedrooms || '-'} beds</td>
            <td><span class="status-badge ${prop.admin_status === 'approved' ? 'status-approved' : prop.admin_status === 'pending' ? 'status-pending' : 'status-rejected'}">${prop.admin_status || 'pending'}</span></td>
            <td>
                <div class="action-buttons">
                    ${prop.admin_status === 'pending' ? `
                        <button class="action-btn action-approve" onclick="approveProperty(${prop.id})"><i class="fas fa-check"></i></button>
                        <button class="action-btn action-reject" onclick="rejectProperty(${prop.id})"><i class="fas fa-times"></i></button>
                    ` : ''}
                    <button class="action-btn action-edit" onclick="editProperty(${prop.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn action-delete" onclick="deleteProperty(${prop.id})"><i class="fas fa-trash"></i></button>
                    <button class="action-btn action-view" onclick="viewPropertyDetails(${prop.id})"><i class="fas fa-eye"></i></button>
                </div>
             </td>
         </tr>
    `).join('');
}

async function deleteProperty(id) {
    if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
        try {
            const response = await fetch('api-admin.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_property', property_id: id })
            });
            const result = await response.json();
            
            if (result.success) {
                showToast('Property deleted successfully');
                loadAllProperties();
                loadAdminStats();
            } else {
                showToast(result.message || 'Failed to delete property', true);
            }
        } catch (error) {
            console.error('Error deleting property:', error);
            showToast('Connection error', true);
        }
    }
}

async function loadUsers() {
    const container = document.getElementById('usersTable');
    if (!container) return;
    
    container.innerHTML = `<tr><td colspan="7" class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>`;
    
    try {
        const response = await fetch('api-admin.php?action=users');
        const result = await response.json();
        
        if (result.success && result.users) {
            allUsers = result.users;
            renderUsers();
        } else {
            container.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-users"></i><p>No users found</p></td></tr>`;
        }
    } catch (error) {
        console.error('Error loading users:', error);
        container.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading data</p></td></tr>`;
    }
}

function renderUsers() {
    const container = document.getElementById('usersTable');
    const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('userRoleFilter')?.value || 'all';
    
    let filtered = [...allUsers];
    
    if (searchTerm) {
        filtered = filtered.filter(u => 
            (u.first_name && u.first_name.toLowerCase().includes(searchTerm)) ||
            (u.last_name && u.last_name.toLowerCase().includes(searchTerm)) ||
            (u.email && u.email.toLowerCase().includes(searchTerm))
        );
    }
    
    if (roleFilter !== 'all') {
        filtered = filtered.filter(u => u.role === roleFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-users"></i><p>No users found</p></td></tr>`;
        return;
    }
    
    container.innerHTML = filtered.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${escapeHtml(user.first_name || '')} ${escapeHtml(user.last_name || '')}</td>
            <td>${escapeHtml(user.email || '-')}</td>
            <td>${escapeHtml(user.phone || '-')}</td>
            <td>${escapeHtml(user.city || '-')}</td>
            <td><span class="status-badge ${user.role === 'admin' ? 'status-approved' : user.role === 'owner' ? 'status-active' : 'status-pending'}">${user.role || 'tenant'}</span></td>
            <td>
                <div class="action-buttons">
                    ${user.role !== 'admin' ? `
                        <button class="action-btn action-delete" onclick="deleteUser(${user.id})"><i class="fas fa-trash"></i></button>
                    ` : ''}
                </div>
             </td>
         </tr>
    `).join('');
}

async function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            const response = await fetch('api-admin.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_user', user_id: id })
            });
            const result = await response.json();
            
            if (result.success) {
                showToast('User deleted successfully');
                loadUsers();
                loadAdminStats();
            } else {
                showToast(result.message || 'Failed to delete user', true);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            showToast('Connection error', true);
        }
    }
}

async function loadBookings() {
    const container = document.getElementById('bookingsTable');
    if (!container) return;
    
    container.innerHTML = `<tr><td colspan="8" class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>`;
    
    try {
        const response = await fetch('api-admin.php?action=bookings');
        const result = await response.json();
        
        if (result.success && result.bookings) {
            allBookings = result.bookings;
            renderBookings();
        } else {
            container.innerHTML = `<tr><td colspan="8" class="empty-state"><i class="fas fa-calendar-alt"></i><p>No bookings found</p></td></tr>`;
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        container.innerHTML = `<tr><td colspan="8" class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading data</p></td></tr>`;
    }
}

function renderBookings() {
    const container = document.getElementById('bookingsTable');
    const searchTerm = document.getElementById('bookingSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('bookingStatusFilter')?.value || 'all';
    
    let filtered = [...allBookings];
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(b => b.status === statusFilter);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(b => 
            (b.booking_ref && b.booking_ref.toLowerCase().includes(searchTerm)) ||
            (b.property_name && b.property_name.toLowerCase().includes(searchTerm)) ||
            (b.user_name && b.user_name.toLowerCase().includes(searchTerm))
        );
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `<tr><td colspan="8" class="empty-state"><i class="fas fa-calendar-alt"></i><p>No bookings found</p></td></tr>`;
        return;
    }
    
    container.innerHTML = filtered.map(booking => `
        <tr>
            <td>${escapeHtml(booking.booking_ref || '-')}</td>
            <td>${escapeHtml(booking.property_name || '-')}</td>
            <td>${escapeHtml(booking.user_name || `User ${booking.user_id}`)}</td>
            <td>${formatDate(booking.start_date)} - ${formatDate(booking.end_date)}</td>
            <td>${booking.number_of_days || 1} days</td>
            <td>${formatPrice(booking.total_amount_dzd)} DA</td>
            <td><span class="status-badge ${booking.status === 'confirmed' ? 'status-approved' : booking.status === 'pending' ? 'status-pending' : 'status-rejected'}">${booking.status || 'pending'}</span></td>
            <td>
                <div class="action-buttons">
                    ${booking.status === 'pending' ? `
                        <button class="action-btn action-approve" onclick="updateBookingStatus(${booking.id}, 'confirmed')"><i class="fas fa-check"></i></button>
                        <button class="action-btn action-reject" onclick="updateBookingStatus(${booking.id}, 'cancelled')"><i class="fas fa-times"></i></button>
                    ` : ''}
                    <button class="action-btn action-view" onclick="viewBookingDetails(${booking.id})"><i class="fas fa-eye"></i></button>
                </div>
             </td>
         </tr>
    `).join('');
}

async function updateBookingStatus(id, status) {
    try {
        const response = await fetch('api-admin.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_booking', booking_id: id, status: status })
        });
        const result = await response.json();
        
        if (result.success) {
            showToast(`Booking ${status}`);
            loadBookings();
            loadAdminStats();
        } else {
            showToast(result.message || 'Failed to update booking', true);
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        showToast('Connection error', true);
    }
}

async function loadReviews() {
    const container = document.getElementById('reviewsTable');
    if (!container) return;
    
    container.innerHTML = `<tr><td colspan="6" class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>`;
    
    try {
        const response = await fetch('api-admin.php?action=reviews');
        const result = await response.json();
        
        if (result.success && result.reviews) {
            renderReviews(result.reviews);
        } else {
            container.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fas fa-star"></i><p>No reviews found</p></td></tr>`;
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        container.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading data</p></td></tr>`;
    }
}

function renderReviews(reviews) {
    const container = document.getElementById('reviewsTable');
    
    if (reviews.length === 0) {
        container.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fas fa-star"></i><p>No reviews found</p></td></tr>`;
        return;
    }
    
    container.innerHTML = reviews.map(review => `
        <tr>
            <td>${escapeHtml(review.reviewer_name || `User ${review.user_id}`)}</td>
            <td>${escapeHtml(review.property_name || 'Unknown Property')}</td>
            <td><div class="stars-small">${getStarsHtml(review.rating)}</div></td>
            <td>${escapeHtml(review.comment?.substring(0, 80) || '-')}${review.comment?.length > 80 ? '...' : ''}</td>
            <td>${formatDate(review.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn action-delete" onclick="deleteReview(${review.id})"><i class="fas fa-trash"></i></button>
                </div>
             </td>
         </tr>
    `).join('');
}

async function deleteReview(id) {
    if (confirm('Are you sure you want to delete this review?')) {
        try {
            const response = await fetch('api-admin.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_review', review_id: id })
            });
            const result = await response.json();
            
            if (result.success) {
                showToast('Review deleted');
                loadReviews();
            } else {
                showToast(result.message || 'Failed to delete review', true);
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            showToast('Connection error', true);
        }
    }
}

async function loadCharts() {
    try {
        const response = await fetch('api-admin.php?action=chart_data');
        const result = await response.json();
        
        if (result.success) {
            const bookingsCtx = document.getElementById('bookingsChart')?.getContext('2d');
            if (bookingsCtx) {
                if (bookingsChart) bookingsChart.destroy();
                bookingsChart = new Chart(bookingsCtx, {
                    type: 'line',
                    data: {
                        labels: result.month_labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            label: 'Bookings',
                            data: result.monthly_bookings || [0, 0, 0, 0, 0, 0],
                            borderColor: '#c9a96e',
                            backgroundColor: 'rgba(201, 169, 110, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' } } }
                });
            }
            
            const revenueCtx = document.getElementById('revenueChart')?.getContext('2d');
            if (revenueCtx) {
                if (revenueChart) revenueChart.destroy();
                revenueChart = new Chart(revenueCtx, {
                    type: 'bar',
                    data: {
                        labels: result.month_labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            label: 'Revenue (DA)',
                            data: result.monthly_revenue || [0, 0, 0, 0, 0, 0],
                            backgroundColor: '#c9a96e',
                            borderRadius: 8
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
                });
            }
        }
    } catch (error) {
        console.error('Error loading charts:', error);
    }
}

function openAddPropertyModal() {
    document.getElementById('modalTitle').textContent = 'Add New Property';
    document.getElementById('editPropertyId').value = '';
    document.getElementById('propName').value = '';
    document.getElementById('propDescription').value = '';
    document.getElementById('propLocation').value = '';
    document.getElementById('propDistrict').value = '';
    document.getElementById('propType').value = 'apartment';
    document.getElementById('propPrice').value = '';
    document.getElementById('propBedrooms').value = '2';
    document.getElementById('propBathrooms').value = '2';
    document.getElementById('propArea').value = '100';
    document.getElementById('propMaxGuests').value = '4';
    document.getElementById('propImage').value = '';
    document.getElementById('propFeatured').checked = false;
    document.getElementById('propertyModal').classList.add('open');
}

async function saveProperty() {
    const id = document.getElementById('editPropertyId').value;
    const propertyData = {
        name: document.getElementById('propName').value,
        description: document.getElementById('propDescription').value,
        location: document.getElementById('propLocation').value,
        district: document.getElementById('propDistrict').value,
        type: document.getElementById('propType').value,
        price_dzd: document.getElementById('propPrice').value,
        bedrooms: document.getElementById('propBedrooms').value,
        bathrooms: document.getElementById('propBathrooms').value,
        area: document.getElementById('propArea').value,
        max_guests: document.getElementById('propMaxGuests').value,
        main_image: document.getElementById('propImage').value,
        featured: document.getElementById('propFeatured').checked ? 1 : 0
    };
    
    if (id) {
        propertyData.id = id;
        propertyData.action = 'update_property';
    } else {
        propertyData.action = 'add_property';
    }
    
    try {
        const response = await fetch('api-admin.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(propertyData)
        });
        const result = await response.json();
        
        if (result.success) {
            showToast(id ? 'Property updated' : 'Property added');
            closePropertyModal();
            loadAllProperties();
            loadAdminStats();
        } else {
            showToast(result.message || 'Failed to save property', true);
        }
    } catch (error) {
        console.error('Error saving property:', error);
        showToast('Connection error', true);
    }
}

async function editProperty(id) {
    const property = allProperties.find(p => p.id === id);
    if (!property) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Property';
    document.getElementById('editPropertyId').value = property.id;
    document.getElementById('propName').value = property.name || '';
    document.getElementById('propDescription').value = property.description || '';
    document.getElementById('propLocation').value = property.location || '';
    document.getElementById('propDistrict').value = property.district || '';
    document.getElementById('propType').value = property.type || 'apartment';
    document.getElementById('propPrice').value = property.price_dzd || '';
    document.getElementById('propBedrooms').value = property.bedrooms || 2;
    document.getElementById('propBathrooms').value = property.bathrooms || 2;
    document.getElementById('propArea').value = property.area || 100;
    document.getElementById('propMaxGuests').value = property.max_guests || 4;
    document.getElementById('propImage').value = property.main_image || '';
    document.getElementById('propFeatured').checked = property.featured === 1;
    
    document.getElementById('propertyModal').classList.add('open');
}

function closePropertyModal() {
    document.getElementById('propertyModal').classList.remove('open');
}

function viewPropertyDetails(id) {
    const property = [...pendingProperties, ...allProperties].find(p => p.id === id);
    if (!property) return;
    
    const modalBody = document.getElementById('propertyDetailBody');
    modalBody.innerHTML = `
        <div style="margin-bottom: 1rem;"><img src="${property.main_image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&auto=format'}" style="width: 100%; border-radius: 12px; max-height: 250px; object-fit: cover;"></div>
        <div class="form-group"><label>Name</label><div style="background: var(--cream); padding: 0.5rem 1rem; border-radius: 12px;">${escapeHtml(property.name)}</div></div>
        <div class="form-group"><label>Owner</label><div style="background: var(--cream); padding: 0.5rem 1rem; border-radius: 12px;">${escapeHtml(property.owner_name || 'Unknown')}</div></div>
        <div class="form-group"><label>Location</label><div style="background: var(--cream); padding: 0.5rem 1rem; border-radius: 12px;">${escapeHtml(property.district || property.location)}</div></div>
        <div class="form-group"><label>Type</label><div style="background: var(--cream); padding: 0.5rem 1rem; border-radius: 12px;">${escapeHtml(property.type || 'apartment')}</div></div>
        <div class="form-group"><label>Price</label><div style="background: var(--cream); padding: 0.5rem 1rem; border-radius: 12px;">${formatPrice(property.price_dzd)} DA</div></div>
        <div class="form-group"><label>Details</label><div style="background: var(--cream); padding: 0.5rem 1rem; border-radius: 12px;">${property.bedrooms || 0} beds | ${property.bathrooms || 0} baths | ${property.area || 0} m² | Max ${property.max_guests || 0} guests</div></div>
        <div class="form-group"><label>Description</label><div style="background: var(--cream); padding: 0.5rem 1rem; border-radius: 12px;">${escapeHtml(property.description || 'No description')}</div></div>
    `;
    
    document.getElementById('propertyDetailModal').classList.add('open');
}

function closeDetailModal() {
    document.getElementById('propertyDetailModal').classList.remove('open');
}

function viewBookingDetails(id) {
    const booking = allBookings.find(b => b.id === id);
    if (!booking) return;
    
    const modalBody = document.getElementById('bookingDetailBody');
    modalBody.innerHTML = `
        <div class="form-group"><label>Booking Reference</label><div style="background: var(--cream); padding: 0.5rem 1rem; border-radius: 12px;">${escapeHtml(booking.booking_ref)}</div></div>
        <div class="form-group"><label>Property</label><div style="background: var(--cream); padding: 0.5rem 1rem; border-radius: 12px;">${escapeHtml(booking.property_name)}</div></div>
        <div class="form-group"><label>User</label><div style="background: var(--cream); padding: 0.5rem 1rem; border-radius: 12px;">${escapeHtml(booking.user_name || `User ${booking.user_id}`)}</div></div>
        <div class="form-group"><label>Dates</label><div style="background: var(--cream); padding: 0.5rem 1rem; border-radius: 12px;">${formatDate(booking.start_date)} - ${formatDate(booking.end_date)} (${booking.number_of_days} days)</div></div>
        <div class="form-group"><label>Total Amount</label><div style="background: var(--cream); padding: 0.5rem 1rem; border-radius: 12px;">${formatPrice(booking.total_amount_dzd)} DA</div></div>
        <div class="form-group"><label>Payment Method</label><div style="background: var(--cream); padding: 0.5rem 1rem; border-radius: 12px;">${booking.payment_method || '-'}</div></div>
        <div class="form-group"><label>Status</label><div style="background: var(--cream); padding: 0.5rem 1rem; border-radius: 12px;"><span class="status-badge ${booking.status === 'confirmed' ? 'status-approved' : booking.status === 'pending' ? 'status-pending' : 'status-rejected'}">${booking.status || 'pending'}</span></div></div>
        ${booking.special_requests ? `<div class="form-group"><label>Special Requests</label><div style="background: var(--cream); padding: 0.5rem 1rem; border-radius: 12px;">${escapeHtml(booking.special_requests)}</div></div>` : ''}
    `;
    
    document.getElementById('bookingDetailModal').classList.add('open');
}

function closeBookingDetailModal() {
    document.getElementById('bookingDetailModal').classList.remove('open');
}

function showPanel(panelId) {
    document.querySelectorAll('.admin-menu li a, .admin-menu li button').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`.admin-menu [data-panel="${panelId}"]`);
    if (activeItem) activeItem.classList.add('active');
    
    document.querySelectorAll('.admin-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const targetPanel = document.getElementById(`${panelId}Panel`);
    if (targetPanel) targetPanel.classList.add('active');
    
    switch(panelId) {
        case 'dashboard':
            loadAdminStats();
            loadCharts();
            break;
        case 'pending':
            loadPendingProperties();
            break;
        case 'properties':
            loadAllProperties();
            break;
        case 'users':
            loadUsers();
            break;
        case 'bookings':
            loadBookings();
            break;
        case 'reviews':
            loadReviews();
            break;
    }
}

function logout() {
    localStorage.removeItem('dreamhome_session');
    sessionStorage.removeItem('dreamhome_session');
    window.location.href = 'index.php';
}

function initAdmin() {
    if (!checkAdminAuth()) return;
    
    loadAdminStats();
    loadCharts();
    
    const propSearch = document.getElementById('propSearch');
    if (propSearch) propSearch.addEventListener('input', () => renderAllProperties());
    
    const propStatusFilter = document.getElementById('propStatusFilter');
    if (propStatusFilter) propStatusFilter.addEventListener('change', () => renderAllProperties());
    
    const userSearch = document.getElementById('userSearch');
    if (userSearch) userSearch.addEventListener('input', () => renderUsers());
    
    const userRoleFilter = document.getElementById('userRoleFilter');
    if (userRoleFilter) userRoleFilter.addEventListener('change', () => renderUsers());
    
    const bookingSearch = document.getElementById('bookingSearch');
    if (bookingSearch) bookingSearch.addEventListener('input', () => renderBookings());
    
    const bookingStatusFilter = document.getElementById('bookingStatusFilter');
    if (bookingStatusFilter) bookingStatusFilter.addEventListener('change', () => loadBookings());
}

document.addEventListener('DOMContentLoaded', initAdmin);

window.showPanel = showPanel;
window.logout = logout;
window.approveProperty = approveProperty;
window.rejectProperty = rejectProperty;
window.deleteProperty = deleteProperty;
window.editProperty = editProperty;
window.viewPropertyDetails = viewPropertyDetails;
window.deleteUser = deleteUser;
window.updateBookingStatus = updateBookingStatus;
window.viewBookingDetails = viewBookingDetails;
window.deleteReview = deleteReview;
window.openAddPropertyModal = openAddPropertyModal;
window.saveProperty = saveProperty;
window.closePropertyModal = closePropertyModal;
window.closeDetailModal = closeDetailModal;
window.closeBookingDetailModal = closeBookingDetailModal;