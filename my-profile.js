let profileCurrentLang = 'en';
let currentUser = null;

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
  toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${message}`;
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
  .toast {
    padding: 0.7rem 1.2rem;
    border-radius: 40px;
    font-size: 0.8rem;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    animation: slideIn 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .toast-success {
    background: var(--brown-dark);
    color: white;
  }
  .toast-error {
    background: #c25b4a;
    color: white;
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;
document.head.appendChild(style);

function loadUserData() {
  let sessionData = sessionStorage.getItem('dreamhome_session');
  
  if (!sessionData) {
    sessionData = localStorage.getItem('dreamhome_session');
  }
  
  console.log('Session data:', sessionData);
  
  if (sessionData) {
    try {
      currentUser = JSON.parse(sessionData);
      console.log('User loaded:', currentUser);
      
      const profileName = document.getElementById('profileName');
      const profileEmail = document.getElementById('profileEmail');
      const firstNameInput = document.getElementById('firstName');
      const lastNameInput = document.getElementById('lastName');
      const emailInput = document.getElementById('email');
      const phoneInput = document.getElementById('phone');
      const citySelect = document.getElementById('city');
      const bioTextarea = document.getElementById('bio');
      
      if (profileName) {
        profileName.textContent = currentUser.name || 
          (currentUser.first_name && currentUser.last_name ? `${currentUser.first_name} ${currentUser.last_name}` : 'User');
      }
      if (profileEmail) profileEmail.textContent = currentUser.email || '-';
      if (firstNameInput) firstNameInput.value = currentUser.first_name || currentUser.name?.split(' ')[0] || '';
      if (lastNameInput) lastNameInput.value = currentUser.last_name || (currentUser.name?.split(' ')[1] || '');
      if (emailInput) emailInput.value = currentUser.email || '';
      if (phoneInput) phoneInput.value = currentUser.phone || '';
      if (citySelect && currentUser.city) citySelect.value = currentUser.city;
      if (bioTextarea) bioTextarea.value = currentUser.bio || '';
      
      return true;
    } catch (e) {
      console.error('Error parsing session:', e);
    }
  }
  
  loadUserFromAPI();
  return false;
}

async function loadUserFromAPI() {
  try {
    const response = await fetch('api-profile.php', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    
    if (data.success && data.user) {
      currentUser = data.user;
      console.log('User loaded from API:', currentUser);
      
      const profileName = document.getElementById('profileName');
      const profileEmail = document.getElementById('profileEmail');
      const firstNameInput = document.getElementById('firstName');
      const lastNameInput = document.getElementById('lastName');
      const emailInput = document.getElementById('email');
      const phoneInput = document.getElementById('phone');
      const citySelect = document.getElementById('city');
      const bioTextarea = document.getElementById('bio');
      
      if (profileName) profileName.textContent = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'User';
      if (profileEmail) profileEmail.textContent = currentUser.email || '-';
      if (firstNameInput) firstNameInput.value = currentUser.first_name || '';
      if (lastNameInput) lastNameInput.value = currentUser.last_name || '';
      if (emailInput) emailInput.value = currentUser.email || '';
      if (phoneInput) phoneInput.value = currentUser.phone || '';
      if (citySelect && currentUser.city) citySelect.value = currentUser.city;
      if (bioTextarea) bioTextarea.value = currentUser.bio || '';
    }
  } catch (error) {
    console.error('Error loading from API:', error);
  }
}

async function saveProfile() {
  const firstName = document.getElementById('firstName')?.value.trim() || '';
  const lastName = document.getElementById('lastName')?.value.trim() || '';
  const phone = document.getElementById('phone')?.value.trim() || '';
  const city = document.getElementById('city')?.value || '';
  const bio = document.getElementById('bio')?.value.trim() || '';
  
  const saveBtn = document.querySelector('#profileForm .btn-save');
  const originalText = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  
  try {
    const response = await fetch('api-profile.php', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        city: city,
        bio: bio
      })
    });
    
    const data = await response.json();
    
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
    
    if (data.success) {
      showToast('Profile saved successfully!');
      
      if (currentUser) {
        currentUser.first_name = firstName;
        currentUser.last_name = lastName;
        currentUser.phone = phone;
        currentUser.city = city;
        currentUser.bio = bio;
        currentUser.name = `${firstName} ${lastName}`.trim();
        
        const sessionData = {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          city: city,
          role: currentUser.role
        };
        sessionStorage.setItem('dreamhome_session', JSON.stringify(sessionData));
        if (localStorage.getItem('dreamhome_session')) {
          localStorage.setItem('dreamhome_session', JSON.stringify(sessionData));
        }
      }
      
      const profileName = document.getElementById('profileName');
      if (profileName) {
        profileName.textContent = `${firstName} ${lastName}`.trim() || currentUser?.name || 'User';
      }
    } else {
      showToast(data.message || 'Failed to save profile', true);
    }
  } catch (error) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
    console.error('Error:', error);
    showToast('Connection error', true);
  }
}

async function updatePassword() {
  const currentPassword = document.getElementById('currentPassword')?.value;
  const newPassword = document.getElementById('newPassword')?.value;
  const confirmPassword = document.getElementById('confirmPassword')?.value;
  const matchError = document.getElementById('passwordMatchError');
  
  if (!currentPassword) {
    showToast('Please enter current password', true);
    return;
  }
  
  if (!newPassword || newPassword.length < 6) {
    showToast('New password must be at least 6 characters', true);
    return;
  }
  
  if (newPassword !== confirmPassword) {
    if (matchError) matchError.classList.add('show');
    showToast('Passwords do not match', true);
    return;
  }
  
  if (matchError) matchError.classList.remove('show');
  
  const saveBtn = document.querySelector('#securityForm .btn-save');
  const originalText = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
  
  try {
    const response = await fetch('api-profile.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });
    
    const data = await response.json();
    
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
    
    if (data.success) {
      showToast('Password changed successfully!');
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
      const fill = document.getElementById('strengthFill');
      const label = document.getElementById('strengthLabel');
      if (fill) fill.style.width = '0%';
      if (label) label.textContent = '';
    } else {
      showToast(data.message || 'Failed to change password', true);
    }
  } catch (error) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
    console.error('Error:', error);
    showToast('Connection error', true);
  }
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
    
    const button = event?.target?.closest('.toggle-password');
    if (button) {
      const icon = button.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
      }
    }
  }
}

function checkPasswordStrength(password) {
  const fill = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  let score = 0;
  
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  const levels = [
    { w: '0%', color: '', text: '' },
    { w: '25%', color: '#e07a5f', text: 'Weak' },
    { w: '50%', color: '#e9b35f', text: 'Medium' },
    { w: '75%', color: '#a07850', text: 'Good' },
    { w: '100%', color: '#4a8a4a', text: 'Strong ✓' },
  ];
  
  if (fill) {
    fill.style.width = levels[score].w;
    fill.style.background = levels[score].color;
  }
  if (label) label.textContent = levels[score].text;
}

function logout() {
  sessionStorage.removeItem('dreamhome_session');
  localStorage.removeItem('dreamhome_session');
  
  showToast('Logged out successfully');
  setTimeout(() => {
    window.location.href = 'index.php';
  }, 1000);
}

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-nav-btn');
  const tabs = document.querySelectorAll('.profile-tab');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      tabs.forEach(tab => tab.classList.remove('active'));
      
      const targetTab = document.getElementById(`tab-${tabId}`);
      if (targetTab) targetTab.classList.add('active');
    });
  });
}

function initPasswordStrength() {
  const newPassword = document.getElementById('newPassword');
  if (newPassword) {
    newPassword.addEventListener('input', (e) => {
      checkPasswordStrength(e.target.value);
      
      const confirm = document.getElementById('confirmPassword');
      const matchError = document.getElementById('passwordMatchError');
      if (confirm && confirm.value) {
        if (e.target.value !== confirm.value) {
          if (matchError) matchError.classList.add('show');
        } else {
          if (matchError) matchError.classList.remove('show');
        }
      }
    });
  }
  
  const confirmPassword = document.getElementById('confirmPassword');
  if (confirmPassword) {
    confirmPassword.addEventListener('input', (e) => {
      const newPw = document.getElementById('newPassword')?.value || '';
      const matchError = document.getElementById('passwordMatchError');
      if (e.target.value !== newPw) {
        if (matchError) matchError.classList.add('show');
      } else {
        if (matchError) matchError.classList.remove('show');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('Profile page loaded');
  
  loadUserData();
  
  initTabs();
  
  initPasswordStrength();
  
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
});

window.saveProfile = saveProfile;
window.updatePassword = updatePassword;
window.togglePassword = togglePassword;