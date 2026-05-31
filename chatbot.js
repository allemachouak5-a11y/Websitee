class DreamChatbot {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || 'api-chatbot.php';
    this.userId = options.userId || null;
    this.propertyId = options.propertyId || null;
    this.isOpen = false;
    this.messages = [];
    this.suggestions = [
      { text: "🏠 Voir les propriétés", action: "list_properties" },
      { text: "💰 Budget 15000 DA", action: "budget_15000" },
      { text: "📍 Seraïdi", action: "location_seraidi" },
      { text: "📝 Comment réserver ?", action: "help_booking" }
    ];
    this.render();
    this.attachEvents();
  }

  render() {
    const el = document.createElement('div');
    el.id = 'dream-chatbot';
    el.innerHTML = `
      <button id="chat-toggle" class="chat-toggle-btn" aria-label="Ouvrir le chat">
        <div class="chat-toggle-icon">
          <i class="fas fa-comment-dots"></i>
        </div>
        <span class="chat-notification" id="chatNotification" style="display:none;">1</span>
      </button>
      <div id="chat-window" class="chat-window chat-hidden">
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="chat-avatar">
              <i class="fas fa-robot"></i>
            </div>
            <div>
              <div class="chat-title">Assistant DreamHome</div>
              <div class="chat-status">En ligne</div>
            </div>
          </div>
          <button id="chat-close" class="chat-close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="chat-messages" id="chat-messages">
          <div class="message bot">
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-bubble">
              <div class="message-text">
                Bonjour ! 👋 Je suis l'assistant DreamHome.<br>
                Comment puis-je vous aider aujourd'hui ?
              </div>
              <div class="message-time">${new Date().toLocaleTimeString()}</div>
            </div>
          </div>
          <div class="message-suggestions" id="messageSuggestions"></div>
        </div>
        <div class="chat-input-area">
          <input type="text" id="chat-input" class="chat-input" placeholder="Écrivez votre message..." autocomplete="off">
          <button id="chat-send" class="chat-send-btn">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(el);
    this.renderSuggestions();
  }

  renderSuggestions() {
    const container = document.getElementById('messageSuggestions');
    if (!container) return;
    
    container.innerHTML = `
      <div class="suggestions-title">Suggestions rapides :</div>
      <div class="suggestions-buttons">
        ${this.suggestions.map(s => `
          <button class="suggestion-btn" data-action="${s.action}">
            ${s.text}
          </button>
        `).join('')}
      </div>
    `;
    
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        const text = btn.textContent.trim();
        this.handleSuggestionAction(action, text);
      });
    });
  }

  handleSuggestionAction(action, text) {
    const input = document.getElementById('chat-input');
    if (input) {
      input.value = text;
      this.sendMessage();
    }
  }

  attachEvents() {
    document.getElementById('chat-toggle').onclick = () => this.toggle();
    document.getElementById('chat-close').onclick = () => this.toggle(false);
    document.getElementById('chat-send').onclick = () => this.sendMessage();
    document.getElementById('chat-input').onkeydown = (e) => {
      if (e.key === 'Enter') this.sendMessage();
    };
  }

  toggle(force) {
    this.isOpen = force !== undefined ? force : !this.isOpen;
    const windowEl = document.getElementById('chat-window');
    if (windowEl) {
      windowEl.className = `chat-window ${this.isOpen ? '' : 'chat-hidden'}`;
    }
    if (this.isOpen) {
      const inputEl = document.getElementById('chat-input');
      if (inputEl) inputEl.focus();
      this.clearNotification();
    }
  }

  showNotification() {
    const notif = document.getElementById('chatNotification');
    if (notif && !this.isOpen) {
      notif.style.display = 'flex';
    }
  }

  clearNotification() {
    const notif = document.getElementById('chatNotification');
    if (notif) notif.style.display = 'none';
  }

  addMessage(text, role, extra = {}) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    
    const suggestionsContainer = document.getElementById('messageSuggestions');
    if (suggestionsContainer && role === 'user') {
      suggestionsContainer.style.display = 'none';
    }
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.innerHTML = `
      <div class="message-avatar">
        <i class="fas ${role === 'user' ? 'fa-user' : 'fa-robot'}"></i>
      </div>
      <div class="message-bubble">
        <div class="message-text">${this.formatMessage(text)}</div>
        <div class="message-time">${time}</div>
      </div>
    `;
    messagesContainer.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
  }

  formatMessage(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    text = text.replace(urlRegex, (url) => `<a href="${url}" target="_blank" style="color: #c9a96e;">${url}</a>`);
    
    text = text.replace(/\n/g, '<br>');
    
    text = text.replace(/(\d{1,3}(?:[.,]\d{3})*\s*DA)/g, '<span class="highlight-price">$1</span>');
    
    return text;
  }

  async sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    
    input.value = '';
    this.addMessage(text, 'user');
    this.showTypingIndicator();

    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          user_id: this.userId,
          property_id: this.propertyId
        })
      });
      const data = await res.json();
      this.removeTypingIndicator();
      this.addMessage(data.reply || 'Désolé, une erreur est survenue.', 'bot');
      
      if (data.show_suggestions) {
        const suggestionsContainer = document.getElementById('messageSuggestions');
        if (suggestionsContainer) {
          suggestionsContainer.style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      this.removeTypingIndicator();
      this.addMessage('Connexion impossible. Veuillez réessayer.', 'bot');
    }
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    this.removeTypingIndicator();
    this.typingIndicator = document.createElement('div');
    this.typingIndicator.className = 'message bot typing';
    this.typingIndicator.innerHTML = `
      <div class="message-avatar"><i class="fas fa-robot"></i></div>
      <div class="message-bubble">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    messagesContainer.appendChild(this.typingIndicator);
    this.typingIndicator.scrollIntoView({ behavior: 'smooth' });
  }

  removeTypingIndicator() {
    if (this.typingIndicator && this.typingIndicator.parentNode) {
      this.typingIndicator.remove();
    }
  }
}

const chatbotStyles = document.createElement('style');
chatbotStyles.textContent = `
  .chat-toggle-btn {
    position: fixed;
    bottom: 90px;
    right: 90px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--gold), var(--gold-dk, #b8945a));
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(201, 169, 110, 0.4);
    transition: all 0.3s ease;
    z-index: 9999;
  }
  
  .chat-toggle-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 25px rgba(201, 169, 110, 0.5);
  }
  
  .chat-toggle-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    color: var(--brown-dark);
  }
  
  .chat-notification {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #e74c3c;
    color: white;
    font-size: 0.7rem;
    font-weight: bold;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .chat-window {
    position: fixed;
    bottom: 160px;
    right: 20px;
    width: 380px;
    height: 550px;
    background: var(--white);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 9998;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid var(--cream-mid);
  }
  
  .chat-window.chat-hidden {
    opacity: 0;
    pointer-events: none;
    transform: translateY(20px) scale(0.95);
  }
  
  .chat-header {
    background: linear-gradient(135deg, var(--brown-dark), var(--brown-mid));
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(201, 169, 110, 0.3);
  }
  
  .chat-header-info {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
  
  .chat-avatar {
    width: 40px;
    height: 40px;
    background: var(--gold);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brown-dark);
    font-size: 1.2rem;
  }
  
  .chat-title {
    font-weight: 700;
    color: var(--white);
    font-size: 0.9rem;
  }
  
  .chat-status {
    font-size: 0.7rem;
    color: var(--gold-lt);
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  
  .chat-status::before {
    content: '';
    width: 8px;
    height: 8px;
    background: #2ecc71;
    border-radius: 50%;
    display: inline-block;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }
  
  .chat-close-btn {
    background: none;
    border: none;
    color: var(--white);
    font-size: 1.2rem;
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .chat-close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    background: var(--cream);
  }
  
  .message {
    display: flex;
    gap: 0.6rem;
    animation: fadeInUp 0.3s ease;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .message.user {
    flex-direction: row-reverse;
  }
  
  .message-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--cream-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    color: var(--gold);
    flex-shrink: 0;
  }
  
  .message.user .message-avatar {
    background: var(--gold);
    color: var(--brown-dark);
  }
  
  .message-bubble {
    max-width: 75%;
    padding: 0.6rem 1rem;
    border-radius: 18px;
    font-size: 0.85rem;
    line-height: 1.5;
  }
  
  .message.user .message-bubble {
    background: var(--gold);
    color: var(--brown-dark);
    border-bottom-right-radius: 4px;
  }
  
  .message.bot .message-bubble {
    background: var(--white);
    color: var(--brown-dark);
    border: 1px solid var(--cream-mid);
    border-bottom-left-radius: 4px;
  }
  
  .message-time {
    font-size: 0.6rem;
    color: var(--gray);
    margin-top: 0.2rem;
  }
  
  .message.user .message-time {
    text-align: right;
  }
  
  .highlight-price {
    color: var(--gold);
    font-weight: bold;
    background: rgba(201, 169, 110, 0.1);
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
  }
  
  .typing-dots {
    display: flex;
    gap: 4px;
    padding: 0.2rem 0;
  }
  
  .typing-dots span {
    width: 6px;
    height: 6px;
    background: var(--gray);
    border-radius: 50%;
    animation: typingBounce 1.4s infinite ease-in-out;
  }
  
  .typing-dots span:nth-child(1) { animation-delay: 0s; }
  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
  
  @keyframes typingBounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
  }
  
  .message-suggestions {
    margin-top: 0.5rem;
  }
  
  .suggestions-title {
    font-size: 0.7rem;
    color: var(--gray);
    margin-bottom: 0.5rem;
  }
  
  .suggestions-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .suggestion-btn {
    background: var(--white);
    border: 1px solid var(--cream-mid);
    border-radius: 20px;
    padding: 0.3rem 0.8rem;
    font-size: 0.7rem;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--brown-mid);
  }
  
  .suggestion-btn:hover {
    background: var(--gold);
    border-color: var(--gold);
    color: var(--brown-dark);
    transform: translateY(-1px);
  }
  
  .chat-input-area {
    padding: 0.8rem;
    background: var(--white);
    border-top: 1px solid var(--cream-mid);
    display: flex;
    gap: 0.5rem;
  }
  
  .chat-input {
    flex: 1;
    padding: 0.7rem 1rem;
    border: 1px solid var(--cream-mid);
    border-radius: 25px;
    font-family: inherit;
    font-size: 0.85rem;
    background: var(--cream);
    transition: all 0.2s;
  }
  
  .chat-input:focus {
    outline: none;
    border-color: var(--gold);
    background: var(--white);
  }
  
  .chat-send-btn {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: var(--gold);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brown-dark);
    transition: all 0.2s;
  }
  
  .chat-send-btn:hover {
    background: var(--gold-lt);
    transform: scale(1.05);
  }
  
  @media (max-width: 500px) {
    .chat-window {
      width: calc(100vw - 40px);
      right: 20px;
      left: 20px;
      bottom: 80px;
    }
    
    .chat-toggle-btn {
      bottom: 80px;
      right: 20px;
    }
  }
`;
document.head.appendChild(chatbotStyles);

document.addEventListener('DOMContentLoaded', () => {
  let userId = null;
  const session = localStorage.getItem('dreamhome_session') || sessionStorage.getItem('dreamhome_session');
  if (session) {
    try {
      const user = JSON.parse(session);
      userId = user.id;
    } catch(e) {
      console.error('Error parsing session:', e);
    }
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('id') || null;
  
  window.dreamChatbot = new DreamChatbot({ 
    userId: userId, 
    propertyId: propertyId,
    apiUrl: 'api-chatbot.php'
  });
});