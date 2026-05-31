let notificationPollingInterval = null;
let currentUnreadCount = 0;
let notificationsList = [];
let currentUserNotifications = null;
let welcomeShown = false;

async function initNotificationSystem() {
    console.log('Initializing notification system...');
    currentUserNotifications = getCurrentUserFromNotifications();
    setupNotificationUI();
    
    if (currentUserNotifications && currentUserNotifications.id) {
        showWelcomeNotification();
    } else {
        showGuestGuidance();
    }
    
    startNotificationPolling();
    checkForPendingMessages();
    checkUrlForNotifications();
}

function getCurrentUserFromNotifications() {
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

function setupNotificationUI() {
    if (!document.getElementById('notificationBell')) {
        const bell = document.createElement('button');
        bell.id = 'notificationBell';
        bell.innerHTML = '<i class="fas fa-bell"></i><span id="unreadBadge" style="display: none;">0</span>';
        bell.style.cssText = 'position: fixed; bottom: 90px; right: 24px; width: 56px; height: 56px; border-radius: 50%; background: #c9a96e; border: none; color: #3b2314; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.15); z-index: 1999; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;';
        bell.onclick = (e) => { e.stopPropagation(); toggleNotificationCenter(); };
        document.body.appendChild(bell);
    }
    
    if (!document.getElementById('notificationCenter')) {
        const center = document.createElement('div');
        center.id = 'notificationCenter';
        center.innerHTML = `
            <div style="padding: 1rem; background: #c9a96e; color: #3b2314; display: flex; justify-content: space-between; align-items: center; font-weight: 600;">
                <span><i class="fas fa-bell"></i> Notifications</span>
                <button id="closeNotifications" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #3b2314;">&times;</button>
            </div>
            <div id="notificationList" style="flex: 1; overflow-y: auto; max-height: 400px; min-height: 200px;">
                <div style="text-align: center; padding: 2rem; color: #a0876e;">
                    <i class="fas fa-bell-slash" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                    <p>No notifications yet</p>
                </div>
            </div>
        `;
        center.style.cssText = 'position: fixed; top: 90px; right: 24px; width: 380px; max-height: 500px; background: white; border-radius: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); z-index: 2000; overflow: hidden; display: none; flex-direction: column; border: 1px solid #e8ddd0;';
        document.body.appendChild(center);
        document.getElementById('closeNotifications').onclick = () => { center.style.display = 'none'; };
    }
    
    document.addEventListener('click', (e) => {
        const center = document.getElementById('notificationCenter');
        const bell = document.getElementById('notificationBell');
        if (center && center.style.display === 'flex' && !center.contains(e.target) && bell && !bell.contains(e.target)) {
            center.style.display = 'none';
        }
    });
}

function toggleNotificationCenter() {
    const center = document.getElementById('notificationCenter');
    if (center) {
        center.style.display = center.style.display === 'flex' ? 'none' : 'flex';
        if (center.style.display === 'flex') markAllNotificationsAsRead();
    }
}

function startNotificationPolling() {
    if (notificationPollingInterval) clearInterval(notificationPollingInterval);
    notificationPollingInterval = setInterval(async () => { await checkForNewMessages(); }, 15000);
    setTimeout(() => { checkForNewMessages(); }, 2000);
}

async function checkForNewMessages() {
    const user = getCurrentUserFromNotifications();
    if (!user || !user.id) return;
    
    try {
        const response = await fetch('api-messages.php?type=conversations');
        const result = await response.json();
        
        if (result.success && result.conversations) {
            let totalUnread = 0;
            const newNotifications = [];
            
            result.conversations.forEach(conv => {
                const unreadCount = parseInt(conv.unread_count) || 0;
                if (unreadCount > 0) {
                    totalUnread += unreadCount;
                    const otherName = conv.first_name || conv.last_name ? `${conv.first_name || ''} ${conv.last_name || ''}`.trim() : (conv.email ? conv.email.split('@')[0] : 'Someone');
                    const lastMessage = conv.last_message || 'Sent you a message';
                    const notifId = `msg_${conv.other_user_id}`;
                    const existingIndex = notificationsList.findIndex(n => n.id === notifId);
                    
                    const notification = {
                        id: notifId,
                        type: 'message',
                        title: `📩 New message from ${otherName}`,
                        message: lastMessage.length > 60 ? lastMessage.substring(0, 60) + '...' : lastMessage,
                        time: new Date().toISOString(),
                        user_id: conv.other_user_id,
                        user_name: otherName,
                        unread_count: unreadCount,
                        read: false
                    };
                    
                    if (existingIndex === -1) newNotifications.push(notification);
                    else if (notificationsList[existingIndex].unread_count !== unreadCount) notificationsList[existingIndex] = notification;
                }
            });
            
            updateUnreadBadge(totalUnread);
            if (newNotifications.length > 0) {
                addNotifications(newNotifications);
                showFloatingNotification(newNotifications[0]);
                playNotificationSound();
            }
        }
    } catch (error) {
        console.error('Error checking messages:', error);
    }
}

function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.3;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch(e) {}
}

function updateUnreadBadge(count) {
    currentUnreadCount = count;
    const badge = document.getElementById('unreadBadge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
            badge.style.cssText = 'position: absolute; top: -5px; right: -5px; background: #e74c3c; color: white; border-radius: 50%; min-width: 20px; height: 20px; font-size: 10px; font-weight: bold; display: flex; align-items: center; justify-content: center; padding: 0 4px;';
        } else {
            badge.style.display = 'none';
        }
    }
}

function addNotifications(newNotifications) {
    for (const notif of newNotifications.reverse()) {
        const existingIndex = notificationsList.findIndex(n => n.id === notif.id);
        if (existingIndex === -1) notificationsList.unshift(notif);
        else notificationsList[existingIndex] = notif;
    }
    if (notificationsList.length > 30) notificationsList = notificationsList.slice(0, 30);
    renderNotificationList();
}

function renderNotificationList() {
    const container = document.getElementById('notificationList');
    if (!container) return;
    
    if (notificationsList.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #a0876e;"><i class="fas fa-bell-slash" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i><p>No notifications yet</p></div>';
        return;
    }
    
    container.innerHTML = notificationsList.map(notif => `
        <div class="notif-item" data-id="${notif.id}" style="padding: 0.8rem 1rem; border-bottom: 1px solid #e8ddd0; cursor: pointer; ${notif.read ? '' : 'background: rgba(201,169,110,0.1);'}" onclick="handleNotificationClick('${notif.id}')">
            <div style="display: flex; gap: 0.8rem; align-items: flex-start;">
                <div style="width: 36px; height: 36px; border-radius: 50%; background: #f0e8dc; display: flex; align-items: center; justify-content: center; color: #c9a96e;">
                    <i class="fas ${notif.type === 'message' ? 'fa-envelope' : 'fa-bell'}"></i>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.2rem;">${escapeHtml(notif.title)}</div>
                    <div style="font-size: 0.75rem; color: #a0876e;">${escapeHtml(notif.message)}</div>
                    <div style="font-size: 0.65rem; color: #d4c9bc; margin-top: 0.2rem;">${formatTimeAgo(notif.time)}</div>
                </div>
                ${notif.unread_count ? `<div style="background: #c9a96e; color: #3b2314; font-size: 0.6rem; font-weight: bold; padding: 0.15rem 0.4rem; border-radius: 20px;">${notif.unread_count}</div>` : ''}
            </div>
        </div>
    `).join('');
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hour${Math.floor(diffMins / 60) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showFloatingNotification(notification) {
    if (document.hidden && Notification.permission === 'granted') {
        new Notification(notification.title, { body: notification.message, icon: '/favicon.ico' });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    showToastNotification(notification.title, notification.message);
}

function showToastNotification(title, message) {
    const existingToast = document.querySelector('.toast-notif');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notif';
    toast.innerHTML = `<div style="display: flex; align-items: center; gap: 0.8rem;"><i class="fas fa-envelope" style="color: #c9a96e;"></i><div><div style="font-weight: 600;">${escapeHtml(title)}</div><div style="font-size: 0.75rem;">${escapeHtml(message)}</div></div></div>`;
    toast.style.cssText = 'position: fixed; bottom: 160px; right: 24px; background: #3b2314; color: white; padding: 0.8rem 1.2rem; border-radius: 12px; font-size: 0.85rem; z-index: 2001; animation: slideIn 0.3s ease; box-shadow: 0 4px 16px rgba(0,0,0,0.2); max-width: 320px; cursor: pointer; border-left: 4px solid #c9a96e;';
    toast.onclick = () => { toast.remove(); toggleNotificationCenter(); };
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 5000);
}

function markAllNotificationsAsRead() {
    let hasChanges = false;
    notificationsList.forEach(notif => { if (!notif.read) { notif.read = true; hasChanges = true; } });
    if (hasChanges) { renderNotificationList(); updateUnreadBadge(0); }
}

async function handleNotificationClick(notifId) {
    const notification = notificationsList.find(n => n.id === notifId);
    if (notification) {
        notification.read = true;
        renderNotificationList();
        updateUnreadBadge(notificationsList.filter(n => !n.read).length);
        document.getElementById('notificationCenter').style.display = 'none';
        if (notification.type === 'message' && notification.user_id) {
            window.location.href = `messages.html?to=${notification.user_id}`;
        }
    }
}

function checkForPendingMessages() {
    const pending = localStorage.getItem('pending_conversation');
    if (pending) {
        try {
            const data = JSON.parse(pending);
            if (Date.now() - data.timestamp < 10000) {
                addNotifications([{
                    id: `pending_${Date.now()}`,
                    type: 'message',
                    title: `💬 Conversation with ${data.receiver_name || 'Owner'}`,
                    message: data.message.substring(0, 60),
                    time: new Date().toISOString(),
                    user_id: data.receiver_id,
                    user_name: data.receiver_name,
                    read: false
                }]);
                showToastNotification('Conversation Started', `You can now message ${data.receiver_name || 'the owner'}`);
            }
            setTimeout(() => localStorage.removeItem('pending_conversation'), 5000);
        } catch(e) {}
    }
}

function checkUrlForNotifications() {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const message = urlParams.get('message');
    if (success === 'true' && message) {
        setTimeout(() => {
            addNotifications([{
                id: `action_${Date.now()}`,
                type: 'success',
                title: '✅ Success!',
                message: decodeURIComponent(message),
                time: new Date().toISOString(),
                read: false
            }]);
            showToastNotification('Success', decodeURIComponent(message));
        }, 500);
    }
}

function showWelcomeNotification() {
    if (welcomeShown) return;
    welcomeShown = true;
    const userName = currentUserNotifications?.name || currentUserNotifications?.first_name || currentUserNotifications?.email?.split('@')[0] || 'Guest';
    setTimeout(() => {
        addNotifications([{
            id: `welcome_${Date.now()}`,
            type: 'welcome',
            title: '👋 Welcome to DreamHome!',
            message: `Hello ${userName}! Start exploring luxury properties in Annaba.`,
            time: new Date().toISOString(),
            read: false
        }]);
        showToastNotification('Welcome to DreamHome!', `Hello ${userName}! Find your perfect property today.`);
    }, 1000);
}

function showGuestGuidance() {
    const guidanceShown = sessionStorage.getItem('guidance_shown');
    if (guidanceShown) return;
    setTimeout(() => {
        addNotifications([{
            id: `guidance_${Date.now()}`,
            type: 'guidance',
            title: '🔍 Find Your Dream Home',
            message: 'Search properties in Annaba, save favorites, and sign up to contact owners!',
            time: new Date().toISOString(),
            read: false
        }]);
        showToastNotification('Looking for a property?', 'Explore our luxury listings in Annaba today!');
        sessionStorage.setItem('guidance_shown', 'true');
    }, 2000);
}

const notifStyles = document.createElement('style');
notifStyles.textContent = `@keyframes slideIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}.toast-notif{animation:slideIn 0.3s ease;}.notif-item:hover{background:#fdf8f3!important}`;
document.head.appendChild(notifStyles);

if ('Notification' in window && Notification.permission === 'default') {
    setTimeout(() => Notification.requestPermission(), 3000);
}

window.initNotificationSystem = initNotificationSystem;
window.handleNotificationClick = handleNotificationClick;
window.showToastNotification = showToastNotification;