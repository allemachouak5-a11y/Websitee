let currentLang = 'en';

const translations = {
    en: { 'nav-home': 'Home', 'nav-properties': 'Properties', 'nav-agents': 'Agents', 'nav-about': 'About', 'nav-signin': 'Sign In', 'nav-register': 'Register', 'nav-logout': 'Logout', 'hero-eyebrow': 'LUXURY REAL ESTATE', 'hero-title-line': 'Find Your', 'hero-title-gold': 'Dream Home', 'hero-desc': 'Discover exceptional properties in the most prestigious locations across Algeria.', 'hero-btn-explore': 'Explore Properties', 'footer-quick-links': 'Quick Links', 'footer-resources': 'Resources', 'footer-contact-info': 'Contact Info', 'footer-home': 'Home', 'footer-properties': 'Properties', 'footer-agents': 'Agents', 'footer-about': 'About Us', 'footer-blog': 'Blog', 'footer-faq': 'FAQ', 'footer-privacy': 'Privacy Policy', 'footer-terms': 'Terms of Service', 'footer-support': 'Support', 'footer-copyright': 'All rights reserved.', 'footer-logo-desc': 'Luxury real estate agency specializing in premium properties across Algeria.', 'footer-contact-phone': '+213 123 456 789', 'footer-contact-email': 'info@dreamhome.com', 'footer-contact-address': 'Annaba, Algeria' },
    ar: { 'nav-home': 'الرئيسية', 'nav-properties': 'العقارات', 'nav-agents': 'الوكلاء', 'nav-about': 'من نحن', 'nav-signin': 'تسجيل الدخول', 'nav-register': 'إنشاء حساب', 'nav-logout': 'تسجيل الخروج', 'hero-eyebrow': 'عقارات فاخرة', 'hero-title-line': 'ابحث عن', 'hero-title-gold': 'منزلك المثالي', 'hero-desc': 'اكتشف عقارات استثنائية في أرقى المواقع في الجزائر.', 'hero-btn-explore': 'استكشف العقارات', 'footer-quick-links': 'روابط سريعة', 'footer-resources': 'موارد', 'footer-contact-info': 'معلومات الاتصال', 'footer-home': 'الرئيسية', 'footer-properties': 'العقارات', 'footer-agents': 'الوكلاء', 'footer-about': 'من نحن', 'footer-blog': 'المدونة', 'footer-faq': 'الأسئلة الشائعة', 'footer-privacy': 'سياسة الخصوصية', 'footer-terms': 'شروط الخدمة', 'footer-support': 'الدعم', 'footer-copyright': 'جميع الحقوق محفوظة', 'footer-logo-desc': 'وكالة عقارات فاخرة متخصصة في العقارات الراقية في جميع أنحاء الجزائر.', 'footer-contact-phone': '+213 123 456 789', 'footer-contact-email': 'info@dreamhome.com', 'footer-contact-address': 'عنابة، الجزائر' }
};

function getCurrentUser() { const session = localStorage.getItem('dreamhome_session') || sessionStorage.getItem('dreamhome_session'); if (session) { try { return JSON.parse(session); } catch(e) { return null; } } return null; }

function updateAllTexts(lang) { const t = translations[lang]; if (!t) return; const eyebrowText = document.querySelector('.eyebrow-text'); if (eyebrowText) eyebrowText.textContent = t['hero-eyebrow']; const heroTitleLine = document.querySelector('.hero-title-line'); if (heroTitleLine) heroTitleLine.textContent = t['hero-title-line']; const heroTitleGold = document.querySelector('.hero-title-gold'); if (heroTitleGold) heroTitleGold.textContent = t['hero-title-gold']; const heroDesc = document.querySelector('.hero-desc'); if (heroDesc) heroDesc.textContent = t['hero-desc']; const exploreBtn = document.querySelector('.hero-buttons .btn-primary'); if (exploreBtn) exploreBtn.textContent = t['hero-btn-explore']; const footerHeadings = document.querySelectorAll('.footer-col h4'); if (footerHeadings[0]) footerHeadings[0].textContent = t['footer-quick-links']; if (footerHeadings[1]) footerHeadings[1].textContent = t['footer-resources']; if (footerHeadings[2]) footerHeadings[2].textContent = t['footer-contact-info']; const quickLinksContainer = document.querySelector('.footer-col:nth-child(2) ul'); if (quickLinksContainer) { const links = quickLinksContainer.querySelectorAll('li a'); const quickLinkKeys = ['footer-home', 'footer-properties', 'footer-agents', 'footer-about', 'footer-blog']; links.forEach((link, index) => { if (quickLinkKeys[index] && t[quickLinkKeys[index]]) link.textContent = t[quickLinkKeys[index]]; }); } const resourcesContainer = document.querySelector('.footer-col:nth-child(3) ul'); const resourceKeys = ['footer-faq', 'footer-privacy', 'footer-terms', 'footer-support']; if (resourcesContainer) { const links = resourcesContainer.querySelectorAll('li a'); links.forEach((link, index) => { if (resourceKeys[index] && t[resourceKeys[index]]) link.textContent = t[resourceKeys[index]]; }); } const footerDesc = document.querySelector('.footer-desc'); if (footerDesc) footerDesc.textContent = t['footer-logo-desc']; const contactItems = document.querySelectorAll('.contact-info li'); if (contactItems.length >= 3) { if (t['footer-contact-phone']) contactItems[0].innerHTML = '<i class="fas fa-phone"></i> ' + t['footer-contact-phone']; if (t['footer-contact-email']) contactItems[1].innerHTML = '<i class="fas fa-envelope"></i> ' + t['footer-contact-email']; if (t['footer-contact-address']) contactItems[2].innerHTML = '<i class="fas fa-map-marker-alt"></i> ' + t['footer-contact-address']; } const footerBottom = document.querySelector('.footer-bottom p'); if (footerBottom && t['footer-copyright']) footerBottom.innerHTML = `&copy; ${new Date().getFullYear()} DreamHome. ${t['footer-copyright']}`; }

const navbar = document.getElementById('navbar');
if (navbar) { window.addEventListener('scroll', () => { navbar.classList.toggle('scrolled', window.scrollY > 20); }); }

let mobileMenuOpen = false;
const hamburger = document.getElementById('hamburger');

function createMobileMenu() { const user = getCurrentUser(); const isLoggedIn = user !== null; const t = translations[currentLang]; const menu = document.createElement('div'); menu.id = 'mobileMenu'; let menuHTML = `<a href="index.php">${t['nav-home']}</a><a href="listining.html">${t['nav-properties']}</a><a href="#">${t['nav-agents']}</a><a href="#">${t['nav-about']}</a>`; if (isLoggedIn) { menuHTML += `<div class="mobile-buttons"><button class="btn-signin-mobile">${t['nav-logout']}</button></div>`; } else { menuHTML += `<div class="mobile-buttons"><button class="btn-contact-mobile">Contact</button><button class="btn-signin-mobile">${t['nav-signin']}</button><button class="btn-register-mobile">${t['nav-register']}</button></div>`; } menu.innerHTML = menuHTML; const style = document.createElement('style'); style.textContent = `#mobileMenu{position:fixed;top:82px;left:0;right:0;background:rgba(59,35,20,0.98);backdrop-filter:blur(20px);padding:1.5rem;z-index:998;border-bottom:1px solid rgba(201,169,110,0.2);animation:slideDown 0.3s ease}@keyframes slideDown{from{transform:translateY(-20px);opacity:0}to{transform:translateY(0);opacity:1}}#mobileMenu a{display:block;color:rgba(253,248,243,0.8);text-decoration:none;padding:0.8rem 0;border-bottom:1px solid rgba(201,169,110,0.1);font-size:1rem}#mobileMenu a:hover{color:#c9a96e}.mobile-buttons{display:flex;gap:1rem;margin-top:1rem;padding-top:0.5rem;flex-wrap:wrap}.btn-contact-mobile,.btn-signin-mobile,.btn-register-mobile{flex:1;padding:0.8rem;border-radius:50px;font-weight:600;cursor:pointer;font-size:0.9rem;text-align:center}.btn-contact-mobile{background:transparent;border:1px solid rgba(201,169,110,0.3);color:#fdf8f3}.btn-signin-mobile,.btn-register-mobile{background:#c9a96e;border:none;color:#3b2314}`; document.head.appendChild(style); document.body.appendChild(menu); if (isLoggedIn) { const logoutBtn = menu.querySelector('.btn-signin-mobile'); if (logoutBtn) logoutBtn.onclick = () => { localStorage.removeItem('dreamhome_session'); sessionStorage.removeItem('dreamhome_session'); window.location.reload(); }; } else { const contactBtn = menu.querySelector('.btn-contact-mobile'); const signinBtn = menu.querySelector('.btn-signin-mobile'); const registerBtn = menu.querySelector('.btn-register-mobile'); if (contactBtn) contactBtn.onclick = () => window.location.href = 'login.html'; if (signinBtn) signinBtn.onclick = () => window.location.href = 'login.html'; if (registerBtn) registerBtn.onclick = () => window.location.href = 'regist.html'; } }

if (hamburger) { hamburger.addEventListener('click', () => { mobileMenuOpen = !mobileMenuOpen; if (mobileMenuOpen) { if (!document.getElementById('mobileMenu')) createMobileMenu(); hamburger.innerHTML = '<i class="fas fa-times"></i>'; } else { const menu = document.getElementById('mobileMenu'); if (menu) menu.remove(); hamburger.innerHTML = '<i class="fas fa-bars"></i>'; } }); }

document.addEventListener('click', (e) => { if (mobileMenuOpen && navbar && !navbar.contains(e.target) && !document.getElementById('mobileMenu')?.contains(e.target)) { const menu = document.getElementById('mobileMenu'); if (menu) menu.remove(); if (hamburger) hamburger.innerHTML = '<i class="fas fa-bars"></i>'; mobileMenuOpen = false; } });

function redirectToListings() { window.location.href = 'listining.html'; }

document.addEventListener('DOMContentLoaded', () => { const savedLang = localStorage.getItem('language'); currentLang = (savedLang === 'en' || savedLang === 'ar') ? savedLang : 'en'; document.body.dir = currentLang === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = currentLang; updateAllTexts(currentLang); const exploreBtn = document.getElementById('explorePropertiesBtn'); if (exploreBtn) exploreBtn.onclick = redirectToListings; window.addEventListener('languageChanged', (e) => { if (e.detail && e.detail.lang) { currentLang = e.detail.lang; updateAllTexts(e.detail.lang); } }); });

window.setLanguage = function(lang) { currentLang = lang; document.body.dir = lang === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = lang; updateAllTexts(lang); localStorage.setItem('language', lang); if (window.setNavbarLanguage) window.setNavbarLanguage(lang); };

window.getCurrentUser = getCurrentUser;

window.goToPropertyDetail = function(id) {
    const user = getCurrentUser();
    if (user && user.id) {
        fetch('api-recommendations.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id, property_id: id, action: 'click' }) }).catch(e => console.error('Error logging interaction:', e));
    }
    window.location.href = `detail.html?id=${id}`;
};

function initSearchListener() {
    const lastSearch = localStorage.getItem('dreamhome_last_search');
    if (lastSearch) {
        try {
            const searchData = JSON.parse(lastSearch);
            const searchAge = Date.now() - searchData.timestamp;
            
            if (searchAge < 3600000 && (searchData.location || searchData.type)) {
                console.log('Found recent search:', searchData);
                setTimeout(() => loadSmartRecommendations(searchData), 500);
            }
        } catch(e) {}
    }
    
    window.addEventListener('searchPerformed', (event) => {
        if (event.detail && (event.detail.location || event.detail.type)) {
            loadSmartRecommendations(event.detail);
        }
    });
    
    window.addEventListener('storage', (event) => {
        if (event.key === 'dreamhome_last_search' && event.newValue) {
            try {
                const searchData = JSON.parse(event.newValue);
                if (searchData.location || searchData.type) {
                    loadSmartRecommendations(searchData);
                }
            } catch(e) {}
        }
    });
}

async function loadSmartRecommendations(searchParams = null) {
    const section = document.getElementById('smartRecommendationsSection');
    const grid = document.getElementById('smartRecommendationsGrid');
    if (!section || !grid) return;
    
    if (!searchParams) {
        const lastSearch = localStorage.getItem('dreamhome_last_search');
        if (lastSearch) {
            try {
                searchParams = JSON.parse(lastSearch);
                const searchAge = Date.now() - searchParams.timestamp;
                if (searchAge > 3600000) {
                    searchParams = null;
                }
            } catch(e) {}
        }
    }
    
    const user = window.getCurrentUser ? window.getCurrentUser() : null;
    
    if ((!searchParams || (!searchParams.location && !searchParams.type)) && !user) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    grid.innerHTML = `<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Finding properties you'll love...</p></div>`;
    
    let url = 'api-recommendations.php?limit=6';
    if (searchParams) {
        if (searchParams.location) url += `&similar_location=${encodeURIComponent(searchParams.location)}`;
        if (searchParams.type) url += `&similar_type=${encodeURIComponent(searchParams.type)}`;
        if (searchParams.max_price && searchParams.max_price > 0) url += `&max_price=${searchParams.max_price}`;
    }
    if (user && user.id) url += `&user_id=${user.id}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.recommendations && data.recommendations.length > 0) {
            const subtitle = document.getElementById('recSubtitle');
            const description = document.getElementById('recDescription');
            
            if (searchParams && (searchParams.location || searchParams.type)) {
                if (subtitle) subtitle.textContent = '🔍 BASED ON YOUR SEARCH';
                if (description) {
                    let searchDesc = 'Properties similar to what you were looking for';
                    if (searchParams.location) searchDesc += ` in ${searchParams.location}`;
                    if (searchParams.type) searchDesc += ` (${searchParams.type})`;
                    description.textContent = searchDesc;
                }
            } else {
                if (subtitle) subtitle.textContent = '✨ RECOMMENDED FOR YOU';
                if (description) description.textContent = 'Based on your browsing history and preferences';
            }
            
            grid.innerHTML = data.recommendations.map(rec => {
                const prop = rec.property;
                const reasons = rec.match_reasons || [];
                const similarity = rec.similarity_score || 70;
                return `<div class="featured-card" onclick="goToPropertyDetail(${prop.id})" style="cursor: pointer; position: relative; overflow: hidden;">
                    <div class="card-img">
                        <img src="${prop.main_image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format'}" alt="${escapeHtml(prop.name)}" onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format'">
                        <div class="card-price">${parseInt(prop.price_dzd).toLocaleString()} DA</div>
                        ${similarity > 85 ? '<div style="position: absolute; top: 12px; left: 12px; background: var(--gold); border-radius: 20px; padding: 4px 10px; font-size: 0.7rem; font-weight: bold;"><i class="fas fa-star"></i> Best Match</div>' : ''}
                    </div>
                    <div class="card-content">
                        <div class="card-location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(prop.district || prop.location || 'Annaba')}</div>
                        <h3 class="card-title">${escapeHtml(prop.name)}</h3>
                        <div class="card-features">
                            <span><i class="fas fa-bed"></i> ${prop.bedrooms || 2} beds</span>
                            <span><i class="fas fa-bath"></i> ${prop.bathrooms || 2} baths</span>
                            <span><i class="fas fa-vector-square"></i> ${prop.area || 100} m²</span>
                        </div>
                        ${reasons.length ? `<div class="recommendation-reasons" style="margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.3rem;">
                            ${reasons.map(r => `<span style="background: rgba(201, 169, 110, 0.1); padding: 0.2rem 0.5rem; border-radius: 20px; font-size: 0.65rem;">${escapeHtml(r)}</span>`).join('')}
                        </div>` : ''}
                        <div class="card-divider"></div>
                        <div class="card-footer">
                            <div class="card-rating">${getStarsHtml(prop.rating || 4.5)}<span>(${prop.reviews_count || 0})</span></div>
                            <button class="btn-detail" onclick="event.stopPropagation(); goToPropertyDetail(${prop.id})"><i class="fas fa-arrow-right"></i></button>
                        </div>
                    </div>
                    <div style="position: absolute; bottom: 0; left: 0; height: 3px; background: linear-gradient(90deg, var(--gold) 0%, var(--cream-mid) ${similarity}%, var(--cream-mid) 100%); width: 100%; transition: width 0.5s ease;"></div>
                </div>`;
            }).join('');
        } else {
            section.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading recommendations:', error);
        section.style.display = 'none';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

document.addEventListener('DOMContentLoaded', function() {
    initSearchListener();
});