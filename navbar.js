const navbarTranslations = {
    en: { 
        'nav-home': 'Home', 
        'nav-properties': 'Properties', 
        'nav-dashboard': 'Dashboard', 
        'nav-manage': 'Manage', 
        'nav-messages': 'Messages', 
        'nav-wishlist': 'Favorites', 
        'nav-signin': 'Sign In', 
        'nav-register': 'Register', 
        'nav-logout': 'Logout', 
        'nav-profile': 'Profile', 
        'nav-reservations': 'My Reservations', 
        'nav-welcome': 'Welcome' 
    },
    ar: { 
        'nav-home': 'الرئيسية', 
        'nav-properties': 'العقارات', 
        'nav-dashboard': 'لوحة التحكم', 
        'nav-manage': 'إدارة العقارات', 
        'nav-messages': 'الرسائل', 
        'nav-wishlist': 'المفضلة', 
        'nav-signin': 'تسجيل الدخول', 
        'nav-register': 'إنشاء حساب', 
        'nav-logout': 'تسجيل الخروج', 
        'nav-profile': 'الملف الشخصي', 
        'nav-reservations': 'حجوزاتي', 
        'nav-welcome': 'مرحباً' 
    }
};

let navbarCurrentLang = 'en';
let navbarMobileMenuOpen = false;

function getNavbarUser() { 
    let localData = localStorage.getItem('dreamhome_session'); 
    let sessionData = sessionStorage.getItem('dreamhome_session'); 
    if (localData && sessionData) { 
        try { 
            const localUser = JSON.parse(localData); 
            const sessionUser = JSON.parse(sessionData); 
            if (localUser.id !== sessionUser.id) return sessionUser; 
        } catch(e) {} 
    } 
    let session = sessionStorage.getItem('dreamhome_session'); 
    if (session) { 
        try { 
            return JSON.parse(session); 
        } catch(e) {} 
    } 
    session = localStorage.getItem('dreamhome_session'); 
    if (session) { 
        try { 
            return JSON.parse(session); 
        } catch(e) {} 
    } 
    return null; 
}

function updateUserSession(userData) { 
    if (!userData || !userData.role) return; 
    sessionStorage.setItem('dreamhome_session', JSON.stringify(userData)); 
    localStorage.setItem('dreamhome_session', JSON.stringify(userData)); 
}

function logoutUser() { 
    sessionStorage.removeItem('dreamhome_session'); 
    localStorage.removeItem('dreamhome_session'); 
    window.location.href = 'index.php'; 
}

function buildUnifiedNavbar() {
    const user = getNavbarUser();
    const isLoggedIn = user !== null;
    const userRole = isLoggedIn ? (user.role || 'tenant') : null;
    const t = navbarTranslations[navbarCurrentLang];
    const navLinksContainer = document.getElementById('navLinks');
    const navRightContainer = document.getElementById('navRight');
    
    if (!navLinksContainer || !navRightContainer) return;
    
    navLinksContainer.innerHTML = '';
    navRightContainer.innerHTML = '';
    
    const commonLinks = [
        { href: 'index.php', text: t['nav-home'] }, 
        { href: 'listining.html', text: t['nav-properties'] }
    ];
    
    commonLinks.forEach(link => { 
        const a = document.createElement('a'); 
        a.href = link.href; 
        a.textContent = link.text; 
        if (window.location.pathname.includes(link.href.replace('.php', '').replace('.html', ''))) a.classList.add('active'); 
        navLinksContainer.appendChild(a); 
    });
    
    if (isLoggedIn) {
        // Messages link - IMPORTANT for communication
        const messagesLink = document.createElement('a'); 
        messagesLink.href = 'messages.html'; 
        messagesLink.textContent = t['nav-messages']; 
        navLinksContainer.appendChild(messagesLink);
        
        if (userRole === 'admin') {
            const adminLink = document.createElement('a'); 
            adminLink.href = 'admin.html'; 
            adminLink.textContent = 'Admin'; 
            navLinksContainer.appendChild(adminLink);
            
            const manageLink = document.createElement('a'); 
            manageLink.href = 'manage.html'; 
            manageLink.textContent = t['nav-manage']; 
            navLinksContainer.appendChild(manageLink);
        } else if (userRole === 'owner') {
            const dashboardLink = document.createElement('a'); 
            dashboardLink.href = 'owner.html'; 
            dashboardLink.textContent = t['nav-dashboard']; 
            navLinksContainer.appendChild(dashboardLink);
            
            const manageLink = document.createElement('a'); 
            manageLink.href = 'manage.html'; 
            manageLink.textContent = t['nav-manage']; 
            navLinksContainer.appendChild(manageLink);
        } else {
            const reservationsLink = document.createElement('a'); 
            reservationsLink.href = 'my-reservations.html'; 
            reservationsLink.textContent = t['nav-reservations']; 
            navLinksContainer.appendChild(reservationsLink);
            
            const wishlistLink = document.createElement('a'); 
            wishlistLink.href = 'wishlist.html'; 
            wishlistLink.textContent = t['nav-wishlist']; 
            navLinksContainer.appendChild(wishlistLink);
            
            const profileLink = document.createElement('a'); 
            profileLink.href = 'my-profile.html'; 
            profileLink.textContent = t['nav-profile']; 
            navLinksContainer.appendChild(profileLink);
        }
    }
    
    const agentAvatars = document.createElement('div'); 
    agentAvatars.className = 'agent-avatars'; 
    agentAvatars.innerHTML = `<span class="avatar av-a">A</span><span class="avatar av-b">B</span><span class="avatar av-c">C</span><span class="avatar av-more">2.5K+</span>`; 
    navRightContainer.appendChild(agentAvatars);
    
    if (isLoggedIn) {
        const userName = user.name || (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email || 'User');
        const userInfo = document.createElement('span'); 
        userInfo.style.cssText = 'color: var(--gold-lt); font-size: 0.85rem; margin-right: 0.5rem;'; 
        userInfo.textContent = `${t['nav-welcome']} ${userName}`; 
        navRightContainer.appendChild(userInfo);
        
        const logoutBtn = document.createElement('button'); 
        logoutBtn.className = 'btn-signin'; 
        logoutBtn.textContent = t['nav-logout']; 
        logoutBtn.onclick = logoutUser; 
        navRightContainer.appendChild(logoutBtn);
    } else {
        const contactBtn = document.createElement('button'); 
        contactBtn.className = 'btn-contact'; 
        contactBtn.textContent = 'Contact'; 
        contactBtn.onclick = () => window.location.href = 'login.html'; 
        navRightContainer.appendChild(contactBtn);
        
        const signinBtn = document.createElement('button'); 
        signinBtn.className = 'btn-signin'; 
        signinBtn.textContent = t['nav-signin']; 
        signinBtn.onclick = () => window.location.href = 'login.html'; 
        navRightContainer.appendChild(signinBtn);
        
        const registerBtn = document.createElement('button'); 
        registerBtn.className = 'btn-register'; 
        registerBtn.textContent = t['nav-register']; 
        registerBtn.onclick = () => window.location.href = 'regist.html'; 
        navRightContainer.appendChild(registerBtn);
    }
    
    const langToggle = document.createElement('div'); 
    langToggle.className = 'lang-toggle'; 
    langToggle.innerHTML = `<button class="lang-btn ${navbarCurrentLang === 'en' ? 'active' : ''}" data-lang="en">EN</button><button class="lang-btn ${navbarCurrentLang === 'ar' ? 'active' : ''}" data-lang="ar">عربي</button>`; 
    navRightContainer.appendChild(langToggle);
    
    langToggle.querySelectorAll('.lang-btn').forEach(btn => { 
        btn.addEventListener('click', function(e) { 
            setNavbarLanguage(this.getAttribute('data-lang')); 
        }); 
    });
}

function setNavbarLanguage(lang) { 
    navbarCurrentLang = lang; 
    document.documentElement.lang = lang; 
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr'; 
    localStorage.setItem('navbar_language', lang); 
    localStorage.setItem('language', lang); 
    buildUnifiedNavbar(); 
    const event = new CustomEvent('languageChanged', { detail: { lang: lang } }); 
    window.dispatchEvent(event); 
}

function initNavbarMobileMenu() { 
    const hamburger = document.getElementById('hamburger'); 
    if (!hamburger) return; 
    
    hamburger.addEventListener('click', () => { 
        navbarMobileMenuOpen = !navbarMobileMenuOpen; 
        if (navbarMobileMenuOpen) { 
            if (!document.getElementById('mobileMenu')) createNavbarMobileMenu(); 
            hamburger.innerHTML = '<i class="fas fa-times"></i>'; 
        } else { 
            const menu = document.getElementById('mobileMenu'); 
            if (menu) menu.remove(); 
            hamburger.innerHTML = '<i class="fas fa-bars"></i>'; 
        } 
    }); 
    
    document.addEventListener('click', (e) => { 
        if (navbarMobileMenuOpen && !document.querySelector('.navbar')?.contains(e.target) && !document.getElementById('mobileMenu')?.contains(e.target)) { 
            const menu = document.getElementById('mobileMenu'); 
            if (menu) menu.remove(); 
            if (hamburger) hamburger.innerHTML = '<i class="fas fa-bars"></i>'; 
            navbarMobileMenuOpen = false; 
        } 
    }); 
}

function createNavbarMobileMenu() { 
    const user = getNavbarUser(); 
    const isLoggedIn = user !== null; 
    const userRole = isLoggedIn ? (user.role || 'tenant') : null; 
    const t = navbarTranslations[navbarCurrentLang]; 
    const menu = document.createElement('div'); 
    menu.id = 'mobileMenu'; 
    let menuHTML = `<a href="index.php">${t['nav-home']}</a><a href="listining.html">${t['nav-properties']}</a>`; 
    
    if (isLoggedIn) { 
        menuHTML += `<a href="messages.html">${t['nav-messages']}</a>`; 
        if (userRole === 'admin') { 
            menuHTML += `<a href="admin.html">Admin</a><a href="manage.html">${t['nav-manage']}</a>`; 
        } else if (userRole === 'owner') { 
            menuHTML += `<a href="owner.html">${t['nav-dashboard']}</a><a href="manage.html">${t['nav-manage']}</a>`; 
        } else { 
            menuHTML += `<a href="my-reservations.html">${t['nav-reservations']}</a><a href="wishlist.html">${t['nav-wishlist']}</a><a href="my-profile.html">${t['nav-profile']}</a>`; 
        } 
        const userName = user.name || (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email || 'User'); 
        menuHTML += `<div style="padding: 0.8rem 0; color: var(--gold); border-bottom: 1px solid rgba(201,169,110,0.1);"><i class="fas fa-user-circle"></i> ${userName}</div>`; 
        menuHTML += `<div class="mobile-buttons"><button class="btn-signin-mobile">${t['nav-logout']}</button></div>`; 
    } else { 
        menuHTML += `<div class="mobile-buttons"><button class="btn-contact-mobile">Contact</button><button class="btn-signin-mobile">${t['nav-signin']}</button><button class="btn-register-mobile">${t['nav-register']}</button></div>`; 
    } 
    menu.innerHTML = menuHTML; 
    document.body.appendChild(menu); 
    
    if (isLoggedIn) { 
        const logoutBtn = menu.querySelector('.btn-signin-mobile'); 
        if (logoutBtn) logoutBtn.onclick = logoutUser; 
    } else { 
        const contactBtn = menu.querySelector('.btn-contact-mobile'); 
        const signinBtn = menu.querySelector('.btn-signin-mobile'); 
        const registerBtn = menu.querySelector('.btn-register-mobile'); 
        if (contactBtn) contactBtn.onclick = () => window.location.href = 'login.html'; 
        if (signinBtn) signinBtn.onclick = () => window.location.href = 'login.html'; 
        if (registerBtn) registerBtn.onclick = () => window.location.href = 'regist.html'; 
    } 
}

function initNavbarScrollEffect() { 
    const navbar = document.getElementById('navbar'); 
    if (navbar) { 
        window.addEventListener('scroll', () => { 
            navbar.classList.toggle('scrolled', window.scrollY > 20); 
        }); 
    } 
}

function initUnifiedNavbar() { 
    const savedLang = localStorage.getItem('navbar_language') || localStorage.getItem('language'); 
    navbarCurrentLang = (savedLang === 'ar') ? 'ar' : 'en'; 
    document.body.dir = navbarCurrentLang === 'ar' ? 'rtl' : 'ltr'; 
    document.documentElement.lang = navbarCurrentLang; 
    buildUnifiedNavbar(); 
    initNavbarScrollEffect(); 
    initNavbarMobileMenu(); 
    
    setInterval(() => { 
        const sessionUser = getNavbarUser(); 
        if (sessionUser && sessionUser.role) { 
            const currentUserSpan = document.querySelector('.nav-right span'); 
            if (currentUserSpan && !currentUserSpan.innerHTML.includes(sessionUser.name || sessionUser.email)) buildUnifiedNavbar(); 
        } 
    }, 5000); 
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUnifiedNavbar); 
else initUnifiedNavbar();

window.setNavbarLanguage = setNavbarLanguage;
window.getNavbarUser = getNavbarUser;
window.updateUserSession = updateUserSession;
window.logoutUser = logoutUser;