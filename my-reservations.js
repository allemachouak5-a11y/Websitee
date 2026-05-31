let currentFilter = 'all';
let pendingCancelId = null;
let reservationsCurrentLang = 'en';

const reservationsTranslations = {
  en: {
    'title': 'My Reservations',
    'subtitle': 'Manage your upcoming and past stays',
    'all': 'All',
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'total-bookings': 'Total Bookings',
    'pending-label': 'Pending',
    'confirmed-label': 'Confirmed',
    'completed-label': 'Completed',
    'start': 'Start',
    'end': 'End',
    'details': 'Details',
    'cancel': 'Cancel',
    'no-reservations': 'No reservations yet',
    'explore-properties': 'Explore Properties',
    'reservation-details': 'Reservation Details',
    'property': 'Property',
    'usage-type': 'Usage Type',
    'total-amount': 'Total Amount',
    'status': 'Status',
    'booking-ref': 'Booking Reference',
    'booked-on': 'Booked On',
    'cancel-reservation': 'Cancel Reservation',
    'cancel-confirm': 'Are you sure you want to cancel this reservation?',
    'action-irreversible': 'This action cannot be undone.',
    'keep-reservation': 'Keep Reservation'
  },
  ar: {
    'title': 'حجوزاتي',
    'subtitle': 'إدارة حجوزاتك القادمة والسابقة',
    'all': 'الكل',
    'pending': 'قيد الانتظار',
    'confirmed': 'مؤكدة',
    'completed': 'منتهية',
    'cancelled': 'ملغية',
    'total-bookings': 'إجمالي الحجوزات',
    'pending-label': 'قيد الانتظار',
    'confirmed-label': 'مؤكدة',
    'completed-label': 'منتهية',
    'start': 'تاريخ البدء',
    'end': 'تاريخ الانتهاء',
    'details': 'التفاصيل',
    'cancel': 'إلغاء',
    'no-reservations': 'لا توجد حجوزات بعد',
    'explore-properties': 'استكشف العقارات',
    'reservation-details': 'تفاصيل الحجز',
    'property': 'العقار',
    'usage-type': 'نوع الاستخدام',
    'total-amount': 'المبلغ الإجمالي',
    'status': 'الحالة',
    'booking-ref': 'رقم الحجز',
    'booked-on': 'تاريخ الحجز',
    'cancel-reservation': 'إلغاء الحجز',
    'cancel-confirm': 'هل أنت متأكد من إلغاء هذا الحجز؟',
    'action-irreversible': 'هذا الإجراء لا يمكن التراجع عنه.',
    'keep-reservation': 'الاحتفاظ بالحجز'
  }
};

function getCurrentUser() {
  const session = sessionStorage.getItem('dreamhome_session') || localStorage.getItem('dreamhome_session');
  console.log('Session data:', session);
  
  if (session) {
    try {
      const user = JSON.parse(session);
      console.log('User found:', user);
      return user;
    } catch(e) {
      console.error('Error parsing session:', e);
      return null;
    }
  }
  console.log('No session found');
  return null;
}

async function loadBookingsFromDB() {
  const user = getCurrentUser();
  
  if (!user || !user.id) {
    console.log('No user ID found');
    return loadLocalBookings();
  }
  
  try {
    console.log('Fetching bookings for user ID:', user.id);
    const response = await fetch(`api-bookings.php?user_id=${user.id}`);
    const result = await response.json();
    console.log('API Response:', result);
    
    if (result.success) {
      console.log('Bookings found:', result.bookings.length);
      localStorage.setItem(`dreamhome_bookings_${user.id}`, JSON.stringify(result.bookings));
      return result.bookings;
    } else {
      console.log('API Error:', result.message);
      return loadLocalBookings();
    }
  } catch (error) {
    console.error('Error loading bookings:', error);
    return loadLocalBookings();
  }
}

function loadLocalBookings() {
  const user = getCurrentUser();
  if (!user || !user.id) return [];
  
  const localBookings = JSON.parse(localStorage.getItem(`dreamhome_bookings_${user.id}`) || '[]');
  console.log('Local bookings found:', localBookings.length);
  return localBookings;
}

async function cancelBookingInDB(id) {
  try {
    const response = await fetch('api-bookings.php', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: id, status: 'cancelled' })
    });
    const result = await response.json();
    console.log('Cancel response:', result);
    return result.success;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return false;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getStatusClass(status) {
  switch(status) {
    case 'pending': return 'status-pending';
    case 'confirmed': return 'status-confirmed';
    case 'completed': return 'status-completed';
    case 'cancelled': return 'status-cancelled';
    default: return '';
  }
}

function getStatusText(status) {
  const statusMap = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  return statusMap[status] || status;
}

function getUsageLabel(type) {
  const map = {
    residence: '🏠 Residence',
    workspace: '💼 Workspace',
    studio: '📸 Photo Studio',
    meeting: '🤝 Meeting Room'
  };
  return map[type] || type;
}

function updateStats(bookings) {
  const total = bookings.length;
  const pending = bookings.filter(b => b.status === 'pending').length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const completed = bookings.filter(b => b.status === 'completed').length;
  
  const totalEl = document.getElementById('totalBookings');
  const pendingEl = document.getElementById('pendingCount');
  const confirmedEl = document.getElementById('confirmedCount');
  const completedEl = document.getElementById('completedCount');
  
  if (totalEl) totalEl.textContent = total;
  if (pendingEl) pendingEl.textContent = pending;
  if (confirmedEl) confirmedEl.textContent = confirmed;
  if (completedEl) completedEl.textContent = completed;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getStatusTextAr(status) {
  const map = {
    'pending': 'قيد الانتظار',
    'confirmed': 'مؤكدة',
    'completed': 'منتهية',
    'cancelled': 'ملغية'
  };
  return map[status] || status;
}

async function renderReservations() {
  console.log('Rendering reservations...');
  
  const container = document.getElementById('reservationsList');
  if (container) {
    container.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading your reservations...</p>
      </div>
    `;
  }
  
  let bookings = await loadBookingsFromDB();
  console.log('Bookings loaded:', bookings);
  
  if (currentFilter !== 'all') {
    bookings = bookings.filter(b => b.status === currentFilter);
  }
  
  bookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  updateStats(bookings);
  
  const emptyState = document.getElementById('emptyState');
  
  if (bookings.length === 0) {
    if (container) container.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  
  if (container) container.style.display = 'flex';
  if (emptyState) emptyState.style.display = 'none';
  
  const isRTL = document.body.getAttribute('dir') === 'rtl';
  const statusTextFn = isRTL ? getStatusTextAr : getStatusText;
  
  if (container) {
    container.innerHTML = bookings.map(booking => `
      <div class="reservation-card" data-id="${booking.id}">
        <div class="reservation-card-inner">
          <div class="reservation-image">
            <img src="${booking.main_image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&h=150&fit=crop'}" alt="${escapeHtml(booking.property_name)}" onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&h=150&fit=crop'">
          </div>
          <div class="reservation-info">
            <h3 class="reservation-property">${escapeHtml(booking.property_name)}</h3>
            <div class="reservation-location">
              <i class="fas fa-map-marker-alt"></i> ${escapeHtml(booking.location || booking.district || 'Annaba, Algeria')}
            </div>
            <div class="reservation-dates">
              <div class="date-item">
                <i class="fas fa-calendar-check"></i>
                <span>Start: ${formatDate(booking.start_date)}</span>
              </div>
              <div class="date-item">
                <i class="fas fa-calendar-times"></i>
                <span>End: ${formatDate(booking.end_date)}</span>
              </div>
            </div>
            <div class="reservation-details">
              <span class="detail-item"><i class="fas fa-tag"></i> ${getUsageLabel(booking.usage_type)}</span>
              <span class="reservation-amount">${parseInt(booking.total_amount_dzd || booking.total_amount || 0).toLocaleString()} DA</span>
            </div>
            <span class="reservation-status ${getStatusClass(booking.status)}">${statusTextFn(booking.status)}</span>
          </div>
          <div class="reservation-actions">
            <button class="btn-view-details" onclick="showBookingDetails(${booking.id})">
              <i class="fas fa-eye"></i> Details
            </button>
            ${booking.status === 'pending' ? `
              <button class="btn-cancel-res" onclick="confirmCancelBooking(${booking.id})">
                <i class="fas fa-times"></i> Cancel
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }
}

async function showBookingDetails(id) {
  const bookings = await loadBookingsFromDB();
  const booking = bookings.find(b => b.id == id);
  if (!booking) return;
  
  const isRTL = document.body.getAttribute('dir') === 'rtl';
  const statusTextFn = isRTL ? getStatusTextAr : getStatusText;
  
  const modalBody = document.getElementById('modalBody');
  if (modalBody) {
    modalBody.innerHTML = `
      <div class="detail-row">
        <span class="detail-label">Property</span>
        <span class="detail-value">${escapeHtml(booking.property_name)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Usage Type</span>
        <span class="detail-value">${getUsageLabel(booking.usage_type)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Start Date</span>
        <span class="detail-value">${formatDate(booking.start_date)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">End Date</span>
        <span class="detail-value">${formatDate(booking.end_date)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Number of Days</span>
        <span class="detail-value">${booking.number_of_days || 1} day(s)</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Total Amount</span>
        <span class="detail-value">${parseInt(booking.total_amount_dzd || booking.total_amount || 0).toLocaleString()} DA</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span class="detail-value status ${getStatusClass(booking.status)}">${statusTextFn(booking.status)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Booking Reference</span>
        <span class="detail-value">${booking.booking_ref || '#DREAM-' + booking.id}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Booked On</span>
        <span class="detail-value">${formatDate(booking.created_at)}</span>
      </div>
      ${booking.special_requests ? `
      <div class="detail-row">
        <span class="detail-label">Special Requests</span>
        <span class="detail-value">${escapeHtml(booking.special_requests)}</span>
      </div>
      ` : ''}
    `;
  }
  
  document.getElementById('detailModal').classList.add('open');
}

function confirmCancelBooking(id) {
  pendingCancelId = id;
  document.getElementById('cancelModal').classList.add('open');
}

async function executeCancelBooking() {
  if (!pendingCancelId) return;
  
  const success = await cancelBookingInDB(pendingCancelId);
  if (success) {
    showToast('Reservation cancelled successfully');
    await renderReservations();
  } else {
    showToast('Failed to cancel reservation', true);
  }
  
  closeCancelModal();
}

function closeModal() {
  document.getElementById('detailModal').classList.remove('open');
}

function closeCancelModal() {
  document.getElementById('cancelModal').classList.remove('open');
  pendingCancelId = null;
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
  toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${message}`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function checkAuth() {
  const user = getCurrentUser();
  console.log('Auth check - user:', user);
  if (!user) {
    console.log('No user, redirecting to login');
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function updateReservationsLanguage(lang) {
  const t = reservationsTranslations[lang];
  if (!t) return;
  
  const title = document.querySelector('.reservations-header h1');
  if (title) title.textContent = t['title'];
  
  const subtitle = document.querySelector('.reservations-header p');
  if (subtitle) subtitle.textContent = t['subtitle'];
  
  const filterTabs = document.querySelectorAll('.filter-tab');
  if (filterTabs[0]) filterTabs[0].textContent = t['all'];
  if (filterTabs[1]) filterTabs[1].textContent = t['pending'];
  if (filterTabs[2]) filterTabs[2].textContent = t['confirmed'];
  if (filterTabs[3]) filterTabs[3].textContent = t['completed'];
  if (filterTabs[4]) filterTabs[4].textContent = t['cancelled'];
  
  const statLabels = document.querySelectorAll('.stat-label');
  if (statLabels[0]) statLabels[0].textContent = t['total-bookings'];
  if (statLabels[1]) statLabels[1].textContent = t['pending-label'];
  if (statLabels[2]) statLabels[2].textContent = t['confirmed-label'];
  if (statLabels[3]) statLabels[3].textContent = t['completed-label'];
  
  const exploreBtn = document.querySelector('.btn-explore');
  if (exploreBtn) exploreBtn.innerHTML = `<i class="fas fa-search"></i> ${t['explore-properties']}`;
  
  const modalTitle = document.querySelector('#detailModal .modal-header h3');
  if (modalTitle) modalTitle.textContent = t['reservation-details'];
  
  const cancelModalTitle = document.querySelector('#cancelModal .modal-header h3');
  if (cancelModalTitle) cancelModalTitle.textContent = t['cancel-reservation'];
  
  const cancelConfirmText = document.querySelector('#cancelModal .modal-body p:first-child');
  if (cancelConfirmText) cancelConfirmText.textContent = t['cancel-confirm'];
  
  const irreversibleText = document.querySelector('#cancelModal .text-danger');
  if (irreversibleText) irreversibleText.textContent = t['action-irreversible'];
  
  const keepBtn = document.querySelector('#cancelModal .btn-cancel');
  if (keepBtn) keepBtn.textContent = t['keep-reservation'];
  
  const cancelBtn = document.querySelector('#cancelModal .btn-delete');
  if (cancelBtn) cancelBtn.textContent = t['cancel'];
  
  renderReservations();
}

async function init() {
  console.log('Initializing my-reservations page...');
  
  if (!checkAuth()) return;
  
  const savedLang = localStorage.getItem('language') || 'en';
  reservationsCurrentLang = savedLang;
  updateReservationsLanguage(savedLang);
  
  await renderReservations();
  
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderReservations();
    });
  });
  
  const confirmBtn = document.getElementById('confirmCancelBtn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', executeCancelBooking);
  }
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(30px); }
  }
`;
document.head.appendChild(style);

window.addEventListener('languageChanged', (e) => {
  if (e.detail && e.detail.lang) {
    reservationsCurrentLang = e.detail.lang;
    updateReservationsLanguage(e.detail.lang);
    renderReservations();
  }
});

document.addEventListener('DOMContentLoaded', init);

window.showBookingDetails = showBookingDetails;
window.confirmCancelBooking = confirmCancelBooking;
window.closeModal = closeModal;
window.closeCancelModal = closeCancelModal;
window.executeCancelBooking = executeCancelBooking;