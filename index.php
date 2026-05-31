<?php
require_once 'config/database.php';

$currentUser = getCurrentUser($pdo);
?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DreamHome | Luxury Real Estate</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="stylesheet" href="navbar.css">
    <link rel="stylesheet" href="index.css">
    
    <style>
    #dream-chatbot {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
    }

    #chat-toggle {
        width: 54px;
        height: 54px;
        border-radius: 50%;
        background: #1a6bff;
        color: #fff;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(26,107,255,0.35);
        transition: transform 0.15s;
    }

    #chat-toggle:hover {
        transform: scale(1.07);
    }

    #chat-window {
        position: absolute;
        bottom: 68px;
        right: 0;
        width: 350px;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.14);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 0.5px solid #e5e7eb;
        transition: opacity 0.2s, transform 0.2s;
    }

    #chat-window.chat-hidden {
        opacity: 0;
        pointer-events: none;
        transform: translateY(12px);
    }

    #chat-header {
        background: #1a6bff;
        color: #fff;
        padding: 14px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 500;
        font-size: 14px;
    }

    #chat-close {
        background: none;
        border: none;
        color: #fff;
        font-size: 20px;
        cursor: pointer;
        line-height: 1;
    }

    #chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 14px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 350px;
        min-height: 250px;
        background: #f8f9fb;
    }

    .msg {
        max-width: 85%;
        padding: 9px 13px;
        border-radius: 12px;
        font-size: 13px;
        line-height: 1.5;
        word-break: break-word;
        white-space: pre-wrap;
    }

    .msg.user {
        align-self: flex-end;
        background: #1a6bff;
        color: #fff;
        border-bottom-right-radius: 4px;
    }

    .msg.bot {
        align-self: flex-start;
        background: #fff;
        color: #111;
        border: 0.5px solid #e5e7eb;
        border-bottom-left-radius: 4px;
    }

    .msg.typing {
        color: #999;
        font-style: italic;
    }

    #chat-input-area {
        display: flex;
        gap: 8px;
        padding: 10px 12px;
        border-top: 0.5px solid #e5e7eb;
        background: #fff;
    }

    #chat-input {
        flex: 1;
        border: 0.5px solid #d1d5db;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 13px;
        outline: none;
    }

    #chat-input:focus {
        border-color: #1a6bff;
    }

    #chat-send {
        background: #1a6bff;
        border: none;
        border-radius: 8px;
        color: #fff;
        padding: 8px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    #chat-send:hover {
        background: #0f5ce0;
    }

    .recommendations-section {
        padding: 4rem 0;
        background: linear-gradient(135deg, var(--cream-dark) 0%, var(--cream) 100%);
        margin-top: 2rem;
    }

    .recommendations-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 2rem;
    }

    .recommendation-reasons {
        margin-top: 0.5rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem;
    }

    .recommendation-reasons span {
        background: rgba(201, 169, 110, 0.1);
        padding: 0.2rem 0.5rem;
        border-radius: 20px;
        font-size: 0.65rem;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .recommendation-reasons span:hover {
        background: rgba(201, 169, 110, 0.2);
        transform: translateY(-1px);
    }

    .loading-spinner {
        text-align: center;
        padding: 3rem;
        color: var(--gray);
    }

    .loading-spinner i {
        font-size: 2rem;
        margin-bottom: 1rem;
        color: var(--gold);
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
        .recommendations-grid {
            grid-template-columns: 1fr;
        }
        .recommendations-section {
            padding: 2rem 0;
        }
    }
    </style>
</head>
<body>

<nav class="navbar" id="navbar">
    <div class="nav-container">
        <a href="index.php" class="nav-logo">DREAMHOME</a>
        <div class="nav-links" id="navLinks"></div>
        <div class="nav-right" id="navRight"></div>
        <button class="nav-hamburger" id="hamburger"><i class="fas fa-bars"></i></button>
    </div>
</nav>

<section class="hero">
    <div class="hero-bg">
        <img src="https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1600&auto=format" alt="Luxury Home">
        <div class="hero-overlay"></div>
    </div>
    <div class="hero-content">
        <div class="hero-eyebrow">
            <span class="eyebrow-line"></span>
            <span class="eyebrow-text">LUXURY REAL ESTATE</span>
        </div>
        <h1 class="hero-title">
            <span class="hero-title-line">Find Your</span>
            <span class="hero-title-gold">Dream Home</span>
        </h1>
        <p class="hero-desc">Discover exceptional properties in the most prestigious locations across Algeria. Experience luxury living with our curated collection of premium real estate.</p>
        <div class="hero-buttons">
            <button class="btn-primary" id="explorePropertiesBtn">Explore Properties</button>
        </div>
    </div>
</section>

<section class="recommendations-section" id="recommendationsSection" style="display: none;">
    <div class="container">
        <div class="section-header">
            <div>
                <span class="section-subtitle" id="recSubtitle">✨ RECOMMENDED FOR YOU</span>
                <h2 class="section-title">Properties You'll <span>Love</span></h2>
                <p id="recDescription" style="color: var(--gray);">Based on your search and preferences</p>
            </div>
            <a href="listining.html" class="section-link">View All <i class="fas fa-arrow-right"></i></a>
        </div>
        <div class="recommendations-grid" id="recommendationsGrid">
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Finding properties you'll love...</p>
            </div>
        </div>
    </div>
</section>

<footer class="footer">
    <div class="container">
        <div class="footer-grid">
            <div class="footer-col">
                <h3 class="footer-logo">DREAMHOME</h3>
                <p class="footer-desc">Luxury real estate agency specializing in premium properties across Algeria.</p>
                <div class="footer-socials">
                    <a href="#"><i class="fab fa-facebook-f"></i></a>
                    <a href="#"><i class="fab fa-instagram"></i></a>
                    <a href="#"><i class="fab fa-twitter"></i></a>
                    <a href="#"><i class="fab fa-linkedin-in"></i></a>
                </div>
            </div>
            <div class="footer-col">
                <h4>Quick Links</h4>
                <ul>
                    <li><a href="index.php">Home</a></li>
                    <li><a href="listining.html">Properties</a></li>
                    <li><a href="#">Agents</a></li>
                    <li><a href="#">About Us</a></li>
                </ul>
            </div>
            <div class="footer-col">
                <h4>Resources</h4>
                <ul>
                    <li><a href="#">FAQ</a></li>
                    <li><a href="#">Privacy Policy</a></li>
                    <li><a href="#">Terms of Service</a></li>
                    <li><a href="#">Support</a></li>
                </ul>
            </div>
            <div class="footer-col">
                <h4>Contact Info</h4>
                <ul class="contact-info">
                    <li><i class="fas fa-phone"></i> +213 123 456 789</li>
                    <li><i class="fas fa-envelope"></i> info@dreamhome.com</li>
                    <li><i class="fas fa-map-marker-alt"></i> Annaba, Algeria</li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom"><p>&copy; <?php echo date('Y'); ?> DreamHome. All rights reserved.</p></div>
    </div>
</footer>

<div id="toastContainer"></div>

<script src="navbar.js"></script>
<script src="index.js"></script>

<script>
class DreamChatbot {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || 'api-chatbot.php';
    this.userId = options.userId || null;
    this.propertyId = options.propertyId || null;
    this.isOpen = false;
    this.messages = [];
    this.render();
    this.attachEvents();
  }

  render() {
    const el = document.createElement('div');
    el.id = 'dream-chatbot';
    el.innerHTML = `
      <button id="chat-toggle" aria-label="Ouvrir le chat">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
      <div id="chat-window" class="chat-hidden">
        <div id="chat-header">
          <span>Assistant DreamStay</span>
          <button id="chat-close" aria-label="Fermer">&times;</button>
        </div>
        <div id="chat-messages">
          <div class="msg bot">Bonjour ! Comment puis-je vous aider ? 🏠</div>
        </div>
        <div id="chat-input-area">
          <input type="text" id="chat-input" placeholder="Posez votre question..." />
          <button id="chat-send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>`;
    document.body.appendChild(el);
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
      windowEl.className = this.isOpen ? '' : 'chat-hidden';
    }
    if (this.isOpen) {
      const inputEl = document.getElementById('chat-input');
      if (inputEl) inputEl.focus();
    }
  }

  addMessage(text, role) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    const div = document.createElement('div');
    div.className = 'msg ' + role;
    div.textContent = text;
    messagesContainer.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
  }

  async sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    this.addMessage(text, 'user');

    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    const typing = document.createElement('div');
    typing.className = 'msg bot typing';
    typing.textContent = '...';
    messagesContainer.appendChild(typing);

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
      typing.remove();
      this.addMessage(data.reply || 'Désolé, une erreur est survenue.', 'bot');
    } catch (error) {
      console.error('Chatbot error:', error);
      typing.remove();
      this.addMessage('Connexion impossible. Réessayez.', 'bot');
    }
  }
}

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
  
  window.chatbot = new DreamChatbot({ 
    userId: userId, 
    propertyId: propertyId,
    apiUrl: 'api-chatbot.php'
  });
});

let recommendationsCurrentLang = 'en';

function getCurrentUserForRec() {
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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getStarsHtml(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
    if (hasHalfStar) stars += '<i class="fas fa-star-half-alt"></i>';
    for (let i = Math.ceil(rating); i < 5; i++) stars += '<i class="far fa-star"></i>';
    return stars;
}

async function loadSmartRecommendations() {
    const section = document.getElementById('recommendationsSection');
    const grid = document.getElementById('recommendationsGrid');
    
    if (!section || !grid) return;
    
    let searchData = null;
    const lastSearch = localStorage.getItem('dreamhome_last_search');
    if (lastSearch) {
        try {
            searchData = JSON.parse(lastSearch);
            if (Date.now() - searchData.timestamp > 3600000) {
                searchData = null;
            }
        } catch(e) {}
    }
    
    const user = getCurrentUserForRec();
    const userId = user?.id || null;
    
    if ((!searchData || (!searchData.location && !searchData.type && !searchData.max_price && !searchData.guests)) && !userId) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    grid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Finding properties you\'ll love...</p></div>';
    
    let url = 'api-recommendations.php?limit=6&lang=' + recommendationsCurrentLang;
    
    if (searchData) {
        if (searchData.location && searchData.location !== '') {
            url += `&similar_location=${encodeURIComponent(searchData.location)}`;
        }
        if (searchData.type && searchData.type !== '') {
            url += `&similar_type=${encodeURIComponent(searchData.type)}`;
        }
        if (searchData.max_price && searchData.max_price > 0 && searchData.max_price < 50000000) {
            url += `&max_price=${searchData.max_price}`;
        }
        if (searchData.guests && searchData.guests > 0) {
            url += `&guests=${searchData.guests}`;
        }
    }
    
    if (userId) {
        url += `&user_id=${userId}`;
    }
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const subtitle = document.getElementById('recSubtitle');
        const description = document.getElementById('recDescription');
        
        if (data.success && data.recommendations && data.recommendations.length > 0) {
            if (searchData && (searchData.location || searchData.type || searchData.max_price)) {
                if (subtitle) subtitle.innerHTML = '🔍 BASED ON YOUR SEARCH';
                if (description) {
                    let searchDesc = 'Properties similar to what you were looking for';
                    if (searchData.location) searchDesc += ` in ${searchData.location}`;
                    if (searchData.type) searchDesc += ` (${searchData.type})`;
                    description.textContent = searchDesc;
                }
            } else if (userId) {
                if (subtitle) subtitle.innerHTML = '📌 RECOMMENDED FOR YOU';
                if (description) description.textContent = 'Based on your browsing history and preferences';
            } else {
                if (subtitle) subtitle.innerHTML = '✨ POPULAR PROPERTIES';
                if (description) description.textContent = 'Our most loved properties by guests';
            }
            
            grid.innerHTML = data.recommendations.map(rec => {
                const prop = rec.property;
                const reasons = rec.match_reasons || [];
                const score = rec.total_score || 70;
                return `
                    <div class="featured-card" onclick="goToPropertyDetail(${prop.id})" style="cursor: pointer; position: relative; overflow: hidden;">
                        <div class="card-img">
                            <img src="${prop.main_image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format'}" 
                                 alt="${escapeHtml(prop.name)}" 
                                 onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format'">
                            <div class="card-price">${parseInt(prop.price_dzd).toLocaleString()} DA</div>
                            ${score > 85 ? '<div style="position: absolute; top: 12px; left: 12px; background: var(--gold); border-radius: 20px; padding: 4px 10px; font-size: 0.7rem; font-weight: bold;"><i class="fas fa-star"></i> Best Match</div>' : ''}
                        </div>
                        <div class="card-content">
                            <div class="card-location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(prop.district || prop.location || 'Annaba')}</div>
                            <h3 class="card-title">${escapeHtml(prop.name)}</h3>
                            <div class="card-features">
                                <span><i class="fas fa-bed"></i> ${prop.bedrooms || 2} beds</span>
                                <span><i class="fas fa-bath"></i> ${prop.bathrooms || 2} baths</span>
                                <span><i class="fas fa-vector-square"></i> ${prop.area || 100} m²</span>
                                <span><i class="fas fa-users"></i> ${prop.max_guests || 4} guests</span>
                            </div>
                            ${reasons.length ? `
                                <div class="recommendation-reasons" style="margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.3rem;">
                                    ${reasons.map(r => `<span style="background: rgba(201, 169, 110, 0.1); padding: 0.2rem 0.5rem; border-radius: 20px; font-size: 0.65rem;">${escapeHtml(r)}</span>`).join('')}
                                </div>
                            ` : ''}
                            <div class="card-divider"></div>
                            <div class="card-footer">
                                <div class="card-rating">
                                    ${getStarsHtml(prop.rating || 4.5)}
                                    <span>(${prop.reviews_count || 0})</span>
                                </div>
                                <button class="btn-detail" onclick="event.stopPropagation(); goToPropertyDetail(${prop.id})">
                                    <i class="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                        <div style="position: absolute; bottom: 0; left: 0; height: 3px; background: linear-gradient(90deg, var(--gold) 0%, var(--cream-mid) ${score}%, var(--cream-mid) 100%); width: 100%;"></div>
                    </div>
                `;
            }).join('');
        } else {
            section.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading recommendations:', error);
        section.style.display = 'none';
    }
}

function saveUserSearch(searchData) {
    if (searchData && (searchData.location || searchData.type || searchData.max_price || searchData.guests)) {
        localStorage.setItem('dreamhome_last_search', JSON.stringify({
            location: searchData.location || '',
            type: searchData.type || '',
            max_price: searchData.max_price || null,
            guests: searchData.guests || null,
            timestamp: Date.now()
        }));
        setTimeout(loadSmartRecommendations, 500);
    }
}

async function trackPropertyView(propertyId) {
    if (!propertyId) return;
    const user = getCurrentUserForRec();
    if (!user || !user.id) return;
    try {
        await fetch('api-recommendations.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, property_id: propertyId, action: 'view' })
        });
    } catch(e) {
        console.error('Error tracking view:', e);
    }
}

window.goToPropertyDetail = function(id) {
    trackPropertyView(id);
    window.location.href = `detail.html?id=${id}`;
};

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

document.addEventListener('DOMContentLoaded', function() {
    recommendationsCurrentLang = localStorage.getItem('language') || 'en';
    loadFeaturedPropertiesFromAPI();
    setTimeout(loadSmartRecommendations, 1500);
    
    window.addEventListener('languageChanged', function(e) {
        if (e.detail && e.detail.lang) {
            recommendationsCurrentLang = e.detail.lang;
            loadSmartRecommendations();
        }
    });
    
    const exploreBtn = document.getElementById('explorePropertiesBtn');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
            window.location.href = 'listining.html';
        });
    }
});

window.loadSmartRecommendations = loadSmartRecommendations;
window.saveUserSearch = saveUserSearch;
window.trackPropertyView = trackPropertyView;
window.showToast = showToast;
window.getStarsHtml = getStarsHtml;
window.escapeHtml = escapeHtml;
</script>

</body>
</html>