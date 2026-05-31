let manageCurrentLang = 'en';

const manageTranslations = {
  en: {
    'title': 'Manage Spaces',
    'subtitle': 'Manage all your properties and listings',
    'add-space': 'Add Space',
    'all': 'All',
    'active': 'Active',
    'inactive': 'Inactive',
    'draft': 'Draft',
    'search-placeholder': 'Search by name or location...',
    'all-statuses': 'All Statuses',
    'available': 'Available',
    'booked': 'Booked',
    'select-elements': 'element(s) selected',
    'activate': 'Activate',
    'deactivate': 'Deactivate',
    'delete': 'Delete',
    'cancel': 'Cancel',
    'new': 'New',
    'reservations': 'reservations',
    'next-checkin': 'Next check-in',
    'edit': 'Edit',
    'disable': 'Disable',
    'enable': 'Enable',
    'remove': 'Remove',
    'no-spaces': 'No spaces found',
    'add-space-btn': 'Add Space',
    'add-space-title': 'Add Space',
    'edit-space-title': 'Edit Space',
    'space-name': 'Space Name',
    'location-label': 'Location',
    'price-label': 'Price (DA/night)',
    'image-url': 'Image URL',
    'description-label': 'Description',
    'status-label': 'Status',
    'save': 'Save',
    'confirm-delete': 'Confirm Deletion',
    'delete-confirm': 'Are you sure you want to delete',
    'irreversible': 'This action is irreversible.',
    'price-updated': 'Price updated',
    'space-deactivated': 'has been deactivated',
    'space-activated': 'has been activated',
    'space-published': 'has been published',
    'space-modified': 'Space modified successfully',
    'space-added': 'Space added successfully',
    'space-deleted': 'has been deleted',
    'spaces-activated': 'space(s) activated',
    'spaces-deactivated': 'space(s) deactivated',
    'spaces-deleted': 'space(s) deleted',
    'order-updated': 'Space order updated',
    'booking-requests': 'Booking Requests',
    'booking-subtitle': 'Approve or decline booking requests for your properties',
    'no-requests': 'No pending booking requests',
    'no-requests-desc': 'When tenants request to book your properties, they will appear here.',
    'approve': 'Approve',
    'decline': 'Decline',
    'request-approved': 'Booking approved successfully',
    'request-declined': 'Booking declined',
    'confirm-approve': 'Are you sure you want to approve this booking request?',
    'confirm-decline': 'Are you sure you want to decline this booking request?'
  },
  ar: {
    'title': 'إدارة المساحات',
    'subtitle': 'إدارة جميع عقاراتك وقوائمك',
    'add-space': 'إضافة مساحة',
    'all': 'الكل',
    'active': 'نشط',
    'inactive': 'غير نشط',
    'draft': 'مسودة',
    'search-placeholder': 'بحث بالاسم أو الموقع...',
    'all-statuses': 'جميع الحالات',
    'available': 'متاح',
    'booked': 'محجوز',
    'select-elements': 'عنصر(عناصر) محدد',
    'activate': 'تفعيل',
    'deactivate': 'إلغاء التفعيل',
    'delete': 'حذف',
    'cancel': 'إلغاء',
    'new': 'جديد',
    'reservations': 'حجز',
    'next-checkin': 'موعد الوصول القادم',
    'edit': 'تعديل',
    'disable': 'تعطيل',
    'enable': 'تمكين',
    'remove': 'إزالة',
    'no-spaces': 'لم يتم العثور على مساحات',
    'add-space-btn': 'إضافة مساحة',
    'add-space-title': 'إضافة مساحة',
    'edit-space-title': 'تعديل المساحة',
    'space-name': 'اسم المساحة',
    'location-label': 'الموقع',
    'price-label': 'السعر (دينار/ليلة)',
    'image-url': 'رابط الصورة',
    'description-label': 'الوصف',
    'status-label': 'الحالة',
    'save': 'حفظ',
    'confirm-delete': 'تأكيد الحذف',
    'delete-confirm': 'هل أنت متأكد من حذف',
    'irreversible': 'هذا الإجراء لا يمكن التراجع عنه.',
    'price-updated': 'تم تحديث السعر',
    'space-deactivated': 'تم إلغاء تفعيل',
    'space-activated': 'تم تفعيل',
    'space-published': 'تم نشر',
    'space-modified': 'تم تعديل المساحة بنجاح',
    'space-added': 'تم إضافة المساحة بنجاح',
    'space-deleted': 'تم حذف',
    'spaces-activated': 'مساحة(مساحات) تم تفعيلها',
    'spaces-deactivated': 'مساحة(مساحات) تم إلغاء تفعيلها',
    'spaces-deleted': 'مساحة(مساحات) تم حذفها',
    'order-updated': 'تم تحديث ترتيب المساحات',
    // طلبات الحجز
    'booking-requests': 'طلبات الحجز',
    'booking-subtitle': 'قبول أو رفض طلبات حجز عقاراتك',
    'no-requests': 'لا توجد طلبات حجز معلقة',
    'no-requests-desc': 'عندما يطلب المستأجرون حجز عقاراتك، ستظهر هنا.',
    'approve': 'قبول',
    'decline': 'رفض',
    'request-approved': 'تم قبول الحجز بنجاح',
    'request-declined': 'تم رفض الحجز',
    'confirm-approve': 'هل أنت متأكد من قبول طلب الحجز هذا؟',
    'confirm-decline': 'هل أنت متأكد من رفض طلب الحجز هذا؟'
  }
};

let allProperties = [];
let currentFilter = 'all';
let currentStatusFilter = 'all';
let currentSearchTerm = '';
let currentView = 'grid';
let selectedProperties = new Set();
let pendingDeleteId = null;
let isEditMode = false;

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

function updateManageLanguage(lang) {
  const t = manageTranslations[lang];
  if (!t) return;
  
  const title = document.querySelector('.manage-header h1');
  if (title) title.textContent = t['title'];
  
  const subtitle = document.querySelector('.manage-header .subtitle');
  if (subtitle) subtitle.textContent = t['subtitle'];
  
  const addBtn = document.querySelector('.btn-add');
  if (addBtn) addBtn.innerHTML = `<i class="fas fa-plus"></i> ${t['add-space']}`;
  
  const statBtns = document.querySelectorAll('.stat-filter-btn');
  if (statBtns[0]) statBtns[0].innerHTML = `<i class="fas fa-layer-group"></i> ${t['all']} <span id="statAll">0</span>`;
  if (statBtns[1]) statBtns[1].innerHTML = `<i class="fas fa-check-circle"></i> ${t['active']} <span id="statActive">0</span>`;
  if (statBtns[2]) statBtns[2].innerHTML = `<i class="fas fa-pause-circle"></i> ${t['inactive']} <span id="statInactive">0</span>`;
  if (statBtns[3]) statBtns[3].innerHTML = `<i class="fas fa-file-alt"></i> ${t['draft']} <span id="statDraft">0</span>`;
  
  const requestsTitle = document.querySelector('.requests-section .manage-header h2');
  if (requestsTitle) requestsTitle.innerHTML = `<i class="fas fa-calendar-check" style="color: var(--gold);"></i> ${t['booking-requests']}`;
  
  const requestsSubtitle = document.querySelector('.requests-section .manage-header .subtitle');
  if (requestsSubtitle) requestsSubtitle.textContent = t['booking-subtitle'];
  
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.placeholder = t['search-placeholder'];
  
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.options[0].text = t['all-statuses'];
    statusFilter.options[1].text = t['available'];
    statusFilter.options[2].text = t['booked'];
    statusFilter.options[3].text = t['inactive'];
    statusFilter.options[4].text = t['draft'];
  }
  
  const bulkActivateBtn = document.querySelector('.bulk-activate');
  if (bulkActivateBtn) bulkActivateBtn.innerHTML = `<i class="fas fa-play"></i> ${t['activate']}`;
  
  const bulkDeactivateBtn = document.querySelector('.bulk-deactivate');
  if (bulkDeactivateBtn) bulkDeactivateBtn.innerHTML = `<i class="fas fa-pause"></i> ${t['deactivate']}`;
  
  const bulkDeleteBtn = document.querySelector('.bulk-delete');
  if (bulkDeleteBtn) bulkDeleteBtn.innerHTML = `<i class="fas fa-trash"></i> ${t['delete']}`;
  
  const bulkCancelBtn = document.querySelector('.bulk-cancel');
  if (bulkCancelBtn) bulkCancelBtn.innerHTML = `<i class="fas fa-times"></i> ${t['cancel']}`;
  
  const modalTitle = document.getElementById('modalTitle');
  if (modalTitle) modalTitle.textContent = isEditMode ? t['edit-space-title'] : t['add-space-title'];
  
  const saveBtn = document.querySelector('.btn-save');
  if (saveBtn) saveBtn.textContent = t['save'];
  
  const cancelBtn = document.querySelector('.btn-cancel');
  if (cancelBtn) cancelBtn.textContent = t['cancel'];
  
  const deleteModalTitle = document.querySelector('#deleteModal .modal-header h3');
  if (deleteModalTitle) deleteModalTitle.textContent = t['confirm-delete'];
  
  const deleteConfirmText = document.querySelector('#deleteModal .modal-body p:first-child');
  if (deleteConfirmText) deleteConfirmText.innerHTML = `${t['delete-confirm']} <strong id="deleteItemName"></strong> ?`;
  
  const irreversibleText = document.querySelector('.text-danger');
  if (irreversibleText) irreversibleText.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${t['irreversible']}`;
  
  const nameLabel = document.querySelector('#propertyModal .form-group:first-child label');
  if (nameLabel) nameLabel.innerHTML = `<i class="fas fa-tag"></i> ${t['space-name']} *`;
  
  const locationLabel = document.querySelector('#propertyModal .form-group:nth-child(2) label');
  if (locationLabel) locationLabel.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${t['location-label']} *`;
  
  const priceLabel = document.querySelector('#propertyModal .form-group:nth-child(3) label');
  if (priceLabel) priceLabel.innerHTML = `<i class="fas fa-dollar-sign"></i> ${t['price-label']} *`;
  
  const imageLabel = document.querySelector('#propertyModal .form-group:nth-child(4) label');
  if (imageLabel) imageLabel.innerHTML = `<i class="fas fa-image"></i> ${t['image-url']}`;
  
  const descLabel = document.querySelector('#propertyModal .form-group:nth-child(5) label');
  if (descLabel) descLabel.innerHTML = `<i class="fas fa-align-left"></i> ${t['description-label']}`;
  
  const statusLabel = document.querySelector('#propertyModal .form-group:nth-child(6) label');
  if (statusLabel) statusLabel.innerHTML = `<i class="fas fa-circle"></i> ${t['status-label']}`;
  
  const statusSelect = document.getElementById('propStatus');
  if (statusSelect) {
    statusSelect.options[0].text = t['available'];
    statusSelect.options[1].text = t['booked'];
    statusSelect.options[2].text = t['inactive'];
    statusSelect.options[3].text = t['draft'];
  }
}

async function loadProperties() {
  const user = getCurrentUser();
  
  if (!user || !user.id) {
    console.log('No user logged in');
    return;
  }
  
  if (user.role !== 'owner') {
    showToast('Only property owners can manage properties', 'error');
    return;
  }
  
  try {
    const response = await fetch('api-owner-properties.php');
    const result = await response.json();
    
    if (result.success) {
      allProperties = result.properties || [];
      updateStats();
      renderProperties();
    } else {
      console.error('Error loading properties:', result.message);
      allProperties = getSampleProperties();
      renderProperties();
    }
  } catch (error) {
    console.error('Error loading properties:', error);
    allProperties = getSampleProperties();
    renderProperties();
  }
}

function getSampleProperties() {
  return [
    { id: 1, name: 'Villa de Luxe à Seraïdi', location: 'seraidi', district: 'SERAÏDI', type: 'villa', price_dzd: 2170000, bedrooms: 5, bathrooms: 4, area: 380, max_guests: 10, status: 'available', main_image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&auto=format', description: 'Beautiful luxury villa with stunning sea views' },
    { id: 2, name: 'Appartement Moderne El Bouni', location: 'el-bouni', district: 'EL BOUNI', type: 'apartment', price_dzd: 399000, bedrooms: 2, bathrooms: 2, area: 120, max_guests: 4, status: 'available', main_image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format', description: 'Modern apartment in the heart of El Bouni' },
    { id: 3, name: 'Loft Créatif Sidi Amar', location: 'sidi-amar', district: 'SIDI AMAR', type: 'loft', price_dzd: 1218000, bedrooms: 3, bathrooms: 2, area: 180, max_guests: 6, status: 'booked', main_image: 'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=600&auto=format', description: 'Creative loft space perfect for artists' }
  ];
}

function updateStats() {
  const total = allProperties.length;
  const active = allProperties.filter(p => p.status === 'available').length;
  const inactive = allProperties.filter(p => p.status === 'inactive').length;
  const draft = allProperties.filter(p => p.status === 'draft').length;
  
  const statAll = document.getElementById('statAll');
  const statActive = document.getElementById('statActive');
  const statInactive = document.getElementById('statInactive');
  const statDraft = document.getElementById('statDraft');
  
  if (statAll) statAll.textContent = total;
  if (statActive) statActive.textContent = active;
  if (statInactive) statInactive.textContent = inactive;
  if (statDraft) statDraft.textContent = draft;
}

function renderProperties() {
  const container = document.getElementById('propertiesContainer');
  if (!container) return;
  
  let filtered = [...allProperties];
  
  if (currentStatusFilter !== 'all') {
    filtered = filtered.filter(p => p.status === currentStatusFilter);
  }
  
  if (currentFilter !== 'all') {
    if (currentFilter === 'active') {
      filtered = filtered.filter(p => p.status === 'available');
    } else if (currentFilter === 'inactive') {
      filtered = filtered.filter(p => p.status === 'inactive');
    } else if (currentFilter === 'draft') {
      filtered = filtered.filter(p => p.status === 'draft');
    }
  }
  
  if (currentSearchTerm) {
    const term = currentSearchTerm.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(term) || (p.district && p.district.toLowerCase().includes(term)) || (p.location && p.location.toLowerCase().includes(term)));
  }
  
  if (filtered.length === 0) {
    const t = manageTranslations[manageCurrentLang];
    container.innerHTML = `<div class="empty-state"><i class="fas fa-building"></i><p>${t['no-spaces']}</p><button class="btn-add" onclick="openAddModal()" style="margin-top: 1rem;"><i class="fas fa-plus"></i> ${t['add-space-btn']}</button></div>`;
    return;
  }
  
  container.className = `properties-container ${currentView === 'grid' ? 'grid-view' : 'list-view'}`;
  
  container.innerHTML = filtered.map(property => `
    <div class="property-card" data-id="${property.id}">
      <div class="card-select"><input type="checkbox" class="property-select" value="${property.id}" ${selectedProperties.has(property.id) ? 'checked' : ''}></div>
      <div class="property-card-img" onclick="openEditModal(${property.id})"><img src="${property.main_image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&auto=format'}" alt="${escapeHtml(property.name)}" onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&auto=format'"></div>
      <div class="property-card-content">
        <div class="property-title"><span onclick="openEditModal(${property.id})">${escapeHtml(property.name)}</span><span class="drag-handle"><i class="fas fa-grip-vertical"></i></span></div>
        <div class="property-location" onclick="openEditModal(${property.id})"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(property.district || property.location || 'Annaba')}</div>
        <div class="property-price"><span>${parseInt(property.price_dzd).toLocaleString()} DA</span><button class="edit-price-btn" onclick="event.stopPropagation(); editPriceInline(${property.id})"><i class="fas fa-pen"></i></button></div>
        <div class="property-quick-stats"><span><i class="fas fa-bed"></i> ${property.bedrooms || 2} beds</span><span><i class="fas fa-bath"></i> ${property.bathrooms || 2} baths</span><span><i class="fas fa-vector-square"></i> ${property.area || 100} m²</span></div>
        <span class="status-badge ${getStatusClass(property.status)}">${getStatusText(property.status)}</span>
        <div class="property-actions">
          <button class="action-btn btn-edit" onclick="openEditModal(${property.id})"><i class="fas fa-edit"></i> Edit</button>
          <button class="action-btn btn-toggle" onclick="togglePropertyStatus(${property.id})"><i class="fas ${property.status === 'available' ? 'fa-pause' : 'fa-play'}"></i> ${property.status === 'available' ? 'Disable' : 'Enable'}</button>
          <button class="action-btn btn-delete-card" onclick="confirmDeleteProperty(${property.id}, '${escapeHtml(property.name)}')"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>
    </div>
  `).join('');
  
  document.querySelectorAll('.property-select').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = parseInt(e.target.value);
      if (e.target.checked) { selectedProperties.add(id); } else { selectedProperties.delete(id); }
      updateBulkActionsBar();
    });
  });
}

function getStatusClass(status) {
  switch(status) {
    case 'available': return 'available';
    case 'booked': return 'booked';
    case 'inactive': return 'inactive';
    case 'draft': return 'draft';
    default: return '';
  }
}

function getStatusText(status) {
  const t = manageTranslations[manageCurrentLang];
  switch(status) {
    case 'available': return t['available'];
    case 'booked': return t['booked'];
    case 'inactive': return t['inactive'];
    case 'draft': return t['draft'];
    default: return status;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateBulkActionsBar() {
  const bar = document.getElementById('bulkActionsBar');
  const countSpan = document.getElementById('selectedCount');
  if (selectedProperties.size > 0) {
    bar.style.display = 'flex';
    if (countSpan) countSpan.textContent = selectedProperties.size;
  } else {
    bar.style.display = 'none';
  }
}

function clearSelection() {
  selectedProperties.clear();
  document.querySelectorAll('.property-select').forEach(cb => { cb.checked = false; });
  updateBulkActionsBar();
}

function openAddModal() {
  isEditMode = false;
  const t = manageTranslations[manageCurrentLang];
  const modalTitle = document.getElementById('modalTitle');
  if (modalTitle) modalTitle.textContent = t['add-space-title'];
  
  document.getElementById('editId').value = '';
  document.getElementById('propName').value = '';
  document.getElementById('propLocation').value = '';
  document.getElementById('propPrice').value = '';
  document.getElementById('propImage').value = '';
  document.getElementById('propDesc').value = '';
  document.getElementById('propStatus').value = 'available';
  
  document.getElementById('propertyModal').classList.add('open');
}

function openEditModal(id) {
  const property = allProperties.find(p => p.id == id);
  if (!property) return;
  
  isEditMode = true;
  const t = manageTranslations[manageCurrentLang];
  const modalTitle = document.getElementById('modalTitle');
  if (modalTitle) modalTitle.textContent = t['edit-space-title'];
  
  document.getElementById('editId').value = property.id;
  document.getElementById('propName').value = property.name || '';
  document.getElementById('propLocation').value = property.district || property.location || '';
  document.getElementById('propPrice').value = property.price_dzd || '';
  document.getElementById('propImage').value = property.main_image || '';
  document.getElementById('propDesc').value = property.description || '';
  document.getElementById('propStatus').value = property.status || 'available';
  
  document.getElementById('propertyModal').classList.add('open');
}

function closePropertyModal() {
  document.getElementById('propertyModal').classList.remove('open');
}

function saveProperty() {
  const id = document.getElementById('editId').value;
  const name = document.getElementById('propName').value.trim();
  const location = document.getElementById('propLocation').value.trim();
  const price = document.getElementById('propPrice').value;
  const image = document.getElementById('propImage').value.trim();
  const description = document.getElementById('propDesc').value.trim();
  const status = document.getElementById('propStatus').value;
  
  const t = manageTranslations[manageCurrentLang];
  
  if (!name) { showToast('Please enter property name', 'error'); return; }
  if (!location) { showToast('Please enter location', 'error'); return; }
  if (!price || price <= 0) { showToast('Please enter a valid price', 'error'); return; }
  
  const user = getCurrentUser();
  if (!user || user.role !== 'owner') { showToast('Only property owners can add properties', 'error'); return; }
  
  const propertyData = {
    name: name,
    location: location,
    district: location.toUpperCase(),
    price_dzd: parseInt(price),
    image: image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&auto=format',
    description: description || `Beautiful ${name} in ${location}`,
    status: status,
    bedrooms: 2,
    bathrooms: 2,
    area: 100,
    max_guests: 4
  };
  
  const saveBtn = document.querySelector('#propertyModal .btn-save');
  const originalText = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  
  let url = 'api-owner-properties.php';
  let method = 'POST';
  
  if (id) {
    method = 'PUT';
    propertyData.id = parseInt(id);
  }
  
  fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(propertyData)
  })
  .then(response => response.json())
  .then(data => {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
    if (data.success) {
      showToast(id ? t['space-modified'] : t['space-added']);
      closePropertyModal();
      loadProperties();
    } else {
      showToast(data.message || 'Failed to save property', 'error');
    }
  })
  .catch(error => {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
    if (id) {
      const index = allProperties.findIndex(p => p.id == id);
      if (index !== -1) { allProperties[index] = { ...allProperties[index], ...propertyData }; }
    } else {
      const newId = Date.now();
      allProperties.unshift({ id: newId, ...propertyData });
    }
    renderProperties();
    updateStats();
    closePropertyModal();
    showToast(id ? t['space-modified'] : t['space-added']);
  });
}

function confirmDeleteProperty(id, name) {
  pendingDeleteId = id;
  document.getElementById('deleteItemName').textContent = name;
  document.getElementById('deleteModal').classList.add('open');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('open');
  pendingDeleteId = null;
}

function executeDeleteProperty() {
  if (!pendingDeleteId) return;
  
  const t = manageTranslations[manageCurrentLang];
  const property = allProperties.find(p => p.id == pendingDeleteId);
  const propertyName = property ? property.name : '';
  
  fetch(`api-owner-properties.php?id=${pendingDeleteId}`, { method: 'DELETE' })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showToast(`${propertyName} ${t['space-deleted']}`);
      loadProperties();
    } else {
      allProperties = allProperties.filter(p => p.id !== pendingDeleteId);
      renderProperties();
      updateStats();
      showToast(`${propertyName} ${t['space-deleted']}`);
    }
    closeDeleteModal();
  })
  .catch(error => {
    allProperties = allProperties.filter(p => p.id !== pendingDeleteId);
    renderProperties();
    updateStats();
    showToast(`${propertyName} ${t['space-deleted']}`);
    closeDeleteModal();
  });
}

function togglePropertyStatus(id) {
  const property = allProperties.find(p => p.id == id);
  if (!property) return;
  
  const t = manageTranslations[manageCurrentLang];
  const newStatus = property.status === 'available' ? 'inactive' : 'available';
  
  fetch('api-owner-properties.php', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: id, status: newStatus, name: property.name, description: property.description, location: property.location, district: property.district, price_usd: property.price_usd || Math.round(property.price_dzd / 140), price_dzd: property.price_dzd, bedrooms: property.bedrooms, bathrooms: property.bathrooms, area: property.area })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showToast(`${property.name} ${newStatus === 'available' ? t['space-activated'] : t['space-deactivated']}`);
      loadProperties();
    } else {
      property.status = newStatus;
      renderProperties();
      updateStats();
    }
  })
  .catch(error => {
    property.status = newStatus;
    renderProperties();
    updateStats();
  });
}

function editPriceInline(id) {
  const property = allProperties.find(p => p.id == id);
  if (!property) return;
  
  const newPrice = prompt('Enter new price in DA:', property.price_dzd);
  if (newPrice && !isNaN(newPrice) && parseInt(newPrice) > 0) {
    const t = manageTranslations[manageCurrentLang];
    
    fetch('api-owner-properties.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, price_dzd: parseInt(newPrice), name: property.name, description: property.description, location: property.location, district: property.district, price_usd: Math.round(parseInt(newPrice) / 140), bedrooms: property.bedrooms, bathrooms: property.bathrooms, area: property.area, status: property.status })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showToast(t['price-updated']);
        loadProperties();
      } else {
        property.price_dzd = parseInt(newPrice);
        renderProperties();
        showToast(t['price-updated']);
      }
    })
    .catch(error => {
      property.price_dzd = parseInt(newPrice);
      renderProperties();
      showToast(t['price-updated']);
    });
  }
}

function bulkActivate() {
  const t = manageTranslations[manageCurrentLang];
  const ids = Array.from(selectedProperties);
  
  Promise.all(ids.map(id => {
    const property = allProperties.find(p => p.id == id);
    if (property && property.status !== 'available') {
      return fetch('api-owner-properties.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, status: 'available', name: property.name, description: property.description, location: property.location, district: property.district, price_usd: property.price_usd, price_dzd: property.price_dzd, bedrooms: property.bedrooms, bathrooms: property.bathrooms, area: property.area })
      }).then(r => r.json());
    }
    return Promise.resolve({ success: true });
  })).then(() => {
    showToast(`${ids.length} ${t['spaces-activated']}`);
    loadProperties();
    clearSelection();
  });
}

function bulkDeactivate() {
  const t = manageTranslations[manageCurrentLang];
  const ids = Array.from(selectedProperties);
  
  Promise.all(ids.map(id => {
    const property = allProperties.find(p => p.id == id);
    if (property && property.status !== 'inactive') {
      return fetch('api-owner-properties.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, status: 'inactive', name: property.name, description: property.description, location: property.location, district: property.district, price_usd: property.price_usd, price_dzd: property.price_dzd, bedrooms: property.bedrooms, bathrooms: property.bathrooms, area: property.area })
      }).then(r => r.json());
    }
    return Promise.resolve({ success: true });
  })).then(() => {
    showToast(`${ids.length} ${t['spaces-deactivated']}`);
    loadProperties();
    clearSelection();
  });
}

function bulkDelete() {
  const t = manageTranslations[manageCurrentLang];
  const ids = Array.from(selectedProperties);
  
  if (confirm(`Are you sure you want to delete ${ids.length} property(s)?`)) {
    Promise.all(ids.map(id => fetch(`api-owner-properties.php?id=${id}`, { method: 'DELETE' }).then(r => r.json()))).then(() => {
      showToast(`${ids.length} ${t['spaces-deleted']}`);
      loadProperties();
      clearSelection();
    });
  }
}

async function loadOwnerRequests() {
    const container = document.getElementById('ownerRequestsContainer');
    if (!container) return;
    
    container.innerHTML = `<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading requests...</div>`;
    
    try {
        const response = await fetch('api-admin.php?action=owner_pending_requests');
        const result = await response.json();
        
        if (result.success && result.requests && result.requests.length > 0) {
            renderOwnerRequests(result.requests);
        } else {
            const t = manageTranslations[manageCurrentLang];
            container.innerHTML = `<div class="empty-requests">
                <i class="fas fa-inbox"></i>
                <p>${t['no-requests']}</p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem;">${t['no-requests-desc']}</p>
            </div>`;
        }
    } catch (error) {
        console.error('Error loading requests:', error);
        container.innerHTML = `<div class="empty-requests">
            <i class="fas fa-exclamation-circle"></i>
            <p>Error loading requests</p>
        </div>`;
    }
}

function renderOwnerRequests(requests) {
    const container = document.getElementById('ownerRequestsContainer');
    if (!container) return;
    const t = manageTranslations[manageCurrentLang];
    
    container.innerHTML = requests.map(request => `
        <div class="request-card" data-id="${request.id}">
            <div class="request-image">
                <img src="${request.property_image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=100&auto=format'}" alt="${escapeHtml(request.property_name)}" onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=100&auto=format'">
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
                    <i class="fas fa-check"></i> ${t['approve']}
                </button>
                <button class="request-btn-reject" onclick="updateBookingRequest(${request.id}, 'cancelled')">
                    <i class="fas fa-times"></i> ${t['decline']}
                </button>
            </div>
        </div>
    `).join('');
}

async function updateBookingRequest(bookingId, status) {
    const t = manageTranslations[manageCurrentLang];
    const isApprove = status === 'confirmed';
    const confirmMsg = isApprove ? t['confirm-approve'] : t['confirm-decline'];
    
    if (!confirm(confirmMsg)) return;
    
    const buttons = document.querySelectorAll(`.request-card[data-id="${bookingId}"] .request-actions button`);
    buttons.forEach(btn => btn.disabled = true);
    
    try {
        const response = await fetch('api-admin.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_booking_by_owner', booking_id: bookingId, status: status })
        });
        const result = await response.json();
        
        if (result.success) {
            showToast(isApprove ? t['request-approved'] : t['request-declined']);
            loadOwnerRequests();
            loadProperties();
        } else {
            showToast(result.message || 'Failed to update', 'error');
            buttons.forEach(btn => btn.disabled = false);
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Connection error', 'error');
        buttons.forEach(btn => btn.disabled = false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('language') || 'en';
  manageCurrentLang = savedLang;
  updateManageLanguage(savedLang);
  
  loadProperties();
  loadOwnerRequests();
  
  setInterval(() => {
    if (document.getElementById('ownerRequestsContainer')) {
      loadOwnerRequests();
    }
  }, 30000);
  
  document.querySelectorAll('.stat-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stat-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.statFilter;
      renderProperties();
    });
  });
  
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value;
      renderProperties();
    });
  }
  
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      currentStatusFilter = e.target.value;
      renderProperties();
    });
  }
  
  const viewBtns = document.querySelectorAll('.view-btn');
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      renderProperties();
    });
  });
  
  window.addEventListener('languageChanged', (e) => {
    if (e.detail && e.detail.lang) {
      manageCurrentLang = e.detail.lang;
      updateManageLanguage(e.detail.lang);
      renderProperties();
      loadOwnerRequests(); // إعادة تحميل طلبات الحجز باللغة الجديدة
    }
  });
});

window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.closePropertyModal = closePropertyModal;
window.saveProperty = saveProperty;
window.confirmDeleteProperty = confirmDeleteProperty;
window.closeDeleteModal = closeDeleteModal;
window.executeDeleteProperty = executeDeleteProperty;
window.togglePropertyStatus = togglePropertyStatus;
window.editPriceInline = editPriceInline;
window.bulkActivate = bulkActivate;
window.bulkDeactivate = bulkDeactivate;
window.bulkDelete = bulkDelete;
window.clearSelection = clearSelection;
window.updateBookingRequest = updateBookingRequest;

const style = document.createElement('style');
style.textContent = `@keyframes slideOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(30px); } }`;
document.head.appendChild(style);
