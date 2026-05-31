let currentUser = null;
let currentConversation = null;
let conversations = [];
let messages = [];
let messagePollingInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('Please login to access messages', true);
        setTimeout(() => window.location.href = 'login.html', 2000);
        return;
    }
    
    await loadConversations();
    checkPendingConversation();
    checkUrlParams();
    setupEventListeners();
    startMessagePolling();
});

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

function setupEventListeners() {
    const sendBtn = document.getElementById('sendMessageBtn');
    const messageInput = document.getElementById('messageInput');
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

function checkPendingConversation() {
    const pending = localStorage.getItem('pending_conversation');
    if (pending) {
        try {
            const data = JSON.parse(pending);
            if (Date.now() - data.timestamp < 10000) {
                localStorage.removeItem('pending_conversation');
                findOrCreateConversation(data.receiver_id, data.property_id, data.property_name, data.message);
            } else {
                localStorage.removeItem('pending_conversation');
            }
        } catch(e) {
            localStorage.removeItem('pending_conversation');
        }
    }
}

function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const toUserId = urlParams.get('to');
    const propertyId = urlParams.get('property');
    const propertyName = urlParams.get('property_name');
    
    if (toUserId && toUserId != currentUser.id) {
        findOrCreateConversation(toUserId, propertyId, propertyName);
    }
}

async function findOrCreateConversation(receiverId, propertyId, propertyName, customMessage = null) {
    if (!receiverId || receiverId == currentUser.id) {
        showToast('Cannot start conversation with yourself', true);
        return;
    }
    
    const existingConversation = conversations.find(c => c.other_user_id == receiverId);
    
    if (existingConversation) {
        await openConversation(existingConversation.other_user_id);
    } else {
        await createNewConversation(receiverId, propertyId, propertyName, customMessage);
    }
}

async function createNewConversation(receiverId, propertyId, propertyName, customMessage = null) {
    if (!receiverId || receiverId == currentUser.id) {
        showToast('Cannot start conversation with yourself', true);
        return;
    }
    
    showToast('Starting new conversation...');
    
    const welcomeMessage = customMessage || (propertyName ? 
        `Hello! I'm interested in your property "${propertyName}". I would like to get more information.` :
        `Hello! I would like to get in touch regarding your property listing.`);
    
    try {
        const response = await fetch('api-messages.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender_id: currentUser.id,
                receiver_id: receiverId,
                property_id: propertyId,
                subject: `Interest in Property${propertyName ? `: ${propertyName}` : ''}`,
                message: welcomeMessage
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Conversation started successfully!');
            await loadConversations();
            await openConversation(receiverId);
        } else {
            showToast(result.message || 'Failed to start conversation', true);
        }
    } catch (error) {
        console.error('Error creating conversation:', error);
        showToast('Connection error. Please try again.', true);
    }
}

async function loadConversations() {
    const container = document.getElementById('conversationsList');
    if (!container) return;
    
    try {
        const response = await fetch(`api-messages.php?type=conversations`);
        const result = await response.json();
        
        if (result.success && result.conversations) {
            conversations = result.conversations;
            renderConversations();
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>No conversations yet</p>
                    <p style="font-size: 0.8rem; margin-top: 0.5rem;">Browse properties and contact owners to start messaging</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading conversations:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load conversations</p>
            </div>
        `;
    }
}

function renderConversations() {
    const container = document.getElementById('conversationsList');
    if (!container) return;
    
    if (conversations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <p>No conversations yet</p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem;">Browse properties and contact owners to start messaging</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = conversations.map(conv => {
        const otherUserName = conv.first_name || conv.last_name ? 
            `${conv.first_name || ''} ${conv.last_name || ''}`.trim() : 
            (conv.email ? conv.email.split('@')[0] : 'User');
        const initial = otherUserName.charAt(0).toUpperCase();
        const unreadCount = conv.unread_count || 0;
        const lastMessage = conv.last_message || 'No messages yet';
        const lastMessageTime = conv.last_message_time ? new Date(conv.last_message_time).toLocaleDateString() : '';
        
        return `
            <div class="conversation-item ${currentConversation?.other_user_id === conv.other_user_id ? 'active' : ''}" 
                 data-user-id="${conv.other_user_id}"
                 onclick="openConversation(${conv.other_user_id})">
                <div class="conversation-avatar">${initial}</div>
                <div class="conversation-info">
                    <div class="conversation-name">
                        <span>${escapeHtml(otherUserName)}</span>
                        ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
                    </div>
                    <div class="conversation-last-message">${escapeHtml(lastMessage.substring(0, 50))}${lastMessage.length > 50 ? '...' : ''}</div>
                </div>
                ${lastMessageTime ? `<div class="conversation-time">${lastMessageTime}</div>` : ''}
            </div>
        `;
    }).join('');
}

async function openConversation(otherUserId) {
    if (!otherUserId) return;
    
    const conversation = conversations.find(c => c.other_user_id == otherUserId);
    if (!conversation) return;
    
    currentConversation = {
        other_user_id: otherUserId,
        other_user_name: conversation.first_name || conversation.last_name ? 
            `${conversation.first_name || ''} ${conversation.last_name || ''}`.trim() : 
            (conversation.email ? conversation.email.split('@')[0] : 'User'),
        other_user_role: conversation.other_role || 'User'
    };
    
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.userId == otherUserId) {
            item.classList.add('active');
        }
    });
    
    updateChatHeader();
    await loadMessages(otherUserId);
    
    const chatInputArea = document.getElementById('chatInputArea');
    const chatHeader = document.getElementById('chatHeader');
    if (chatInputArea) chatInputArea.style.display = 'flex';
    if (chatHeader) chatHeader.style.display = 'flex';
}

function updateChatHeader() {
    const chatHeader = document.getElementById('chatHeader');
    const chatAvatar = document.getElementById('chatAvatar');
    const chatUserName = document.getElementById('chatUserName');
    const chatUserRole = document.getElementById('chatUserRole');
    
    if (chatHeader && currentConversation) {
        const initial = currentConversation.other_user_name.charAt(0).toUpperCase();
        if (chatAvatar) chatAvatar.textContent = initial;
        if (chatUserName) chatUserName.textContent = currentConversation.other_user_name;
        if (chatUserRole) {
            const roleText = currentConversation.other_user_role === 'owner' ? 'Property Owner' : 
                            (currentConversation.other_user_role === 'admin' ? 'Administrator' : 'Tenant');
            const roleIcon = currentConversation.other_user_role === 'owner' ? 'fa-building' : 
                            (currentConversation.other_user_role === 'admin' ? 'fa-user-shield' : 'fa-user');
            chatUserRole.innerHTML = `<i class="fas ${roleIcon}"></i> ${roleText}`;
        }
    }
}

async function loadMessages(otherUserId) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    container.innerHTML = `<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Loading messages...</p></div>`;
    
    try {
        const response = await fetch(`api-messages.php?type=messages&other_user_id=${otherUserId}`);
        const result = await response.json();
        
        if (result.success && result.messages) {
            messages = result.messages;
            renderMessages();
            await markMessagesAsRead(otherUserId);
        } else {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-comment-dots"></i><p>No messages yet</p><p style="font-size: 0.8rem; margin-top: 0.5rem;">Send a message to start the conversation</p></div>`;
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load messages</p></div>`;
    }
}

async function markMessagesAsRead(senderId) {
    try {
        await fetch('api-messages.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender_id: senderId })
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

function renderMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    if (messages.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-comment-dots"></i><p>No messages yet</p><p style="font-size: 0.8rem; margin-top: 0.5rem;">Send a message to start the conversation</p></div>`;
        return;
    }
    
    container.innerHTML = messages.map(msg => {
        const isSent = msg.sender_id == currentUser.id;
        const messageTime = new Date(msg.created_at).toLocaleString();
        
        return `
            <div class="message ${isSent ? 'sent' : 'received'}">
                <div class="message-bubble">${escapeHtml(msg.message)}</div>
                <div class="message-time">${messageTime}</div>
            </div>
        `;
    }).join('');
    
    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) {
        showToast('Please enter a message', true);
        return;
    }
    
    if (!currentConversation) {
        showToast('No conversation selected', true);
        return;
    }
    
    const sendBtn = document.getElementById('sendMessageBtn');
    sendBtn.disabled = true;
    const originalHtml = sendBtn.innerHTML;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
        const response = await fetch('api-messages.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender_id: currentUser.id,
                receiver_id: currentConversation.other_user_id,
                message: message,
                subject: 'New Message'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            messageInput.value = '';
            await loadMessages(currentConversation.other_user_id);
            await loadConversations();
        } else {
            showToast(result.message || 'Failed to send message', true);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Failed to send message. Please try again.', true);
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalHtml;
        messageInput.focus();
    }
}

function startMessagePolling() {
    if (messagePollingInterval) clearInterval(messagePollingInterval);
    
    messagePollingInterval = setInterval(async () => {
        if (currentConversation) {
            await loadMessages(currentConversation.other_user_id);
            await loadConversations();
        }
    }, 5000);
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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.openConversation = openConversation;