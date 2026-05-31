const urlParams = new URLSearchParams(window.location.search);
let detailCurrentLang = 'en';
let currentReviews = [];
let currentProperty = null;
let galleryImages = [];
let currentUser = null;

const detailTranslations = {
    en: { 
        'back': 'Back to Properties', 
        'description': 'Description', 
        'amenities': 'Amenities',
        'bedrooms': 'Bedrooms',
        'bathrooms': 'Bathrooms',
        'area': 'Area',
        'max-guests': 'Max Guests',
        'price-per-night': 'PRICE PER NIGHT', 
        'excluding-fees': 'excluding fees', 
        'reserve': 'Reserve Now', 
        'hosted-by': 'HOSTED BY', 
        'verified-host': 'Verified Host', 
        'trust-badge': 'Secure booking · No hidden fees',
        'reviews': 'Guest Reviews', 
        'write-review': 'Share Your Experience', 
        'your-rating': 'Your Rating:', 
        'your-review': 'Your Review', 
        'submit': 'Submit Review', 
        'please-login': 'Please login to write a review', 
        'login-to-review': 'Login to Review',
        'loading': 'Loading property details...'
    },
    ar: { 
        'back': 'العودة إلى العقارات', 
        'description': 'الوصف', 
        'amenities': 'المرافق',
        'bedrooms': 'غرف نوم',
        'bathrooms': 'حمامات',
        'area': 'المساحة',
        'max-guests': 'الحد الأقصى للضيوف',
        'price-per-night': 'السعر لكل ليلة', 
        'excluding-fees': 'باستثناء الرسوم', 
        'reserve': 'احجز الآن', 
        'hosted-by': 'المضيف', 
        'verified-host': 'مضيف موثوق', 
        'trust-badge': 'حجز آمن · لا رسوم مخفية',
        'reviews': 'تقييمات الضيوف', 
        'write-review': 'شارك تجربتك', 
        'your-rating': 'تقييمك:', 
        'your-review': 'تعليقك', 
        'submit': 'إرسال التقييم', 
        'please-login': 'الرجاء تسجيل الدخول لكتابة تعليق', 
        'login-to-review': 'تسجيل الدخول للتعليق',
        'loading': 'جاري تحميل تفاصيل العقار...'
    }
};

function saveLastViewedProperty(propertyId) { 
    if (!propertyId) return; 
    localStorage.setItem('last_viewed_property', propertyId); 
    const user = getCurrentUserForDetail(); 
    if (user && user.id) { 
        fetch('api-recommendations.php', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ user_id: user.id, property_id: propertyId, action: 'view' }) 
        }).catch(e => console.error('Error saving interaction:', e)); 
    } 
}

function loadCurrentUser() { 
    const session = localStorage.getItem('dreamhome_session') || sessionStorage.getItem('dreamhome_session'); 
    if (session) { 
        try { 
            currentUser = JSON.parse(session); 
        } catch (e) { 
            currentUser = null; 
        } 
    } 
    return currentUser;
}

function updateDetailLanguage(lang) { 
    const t = detailTranslations[lang]; 
    if (!t) return; 
    const backBtn = document.querySelector('.back-btn'); 
    if (backBtn) backBtn.innerHTML = `<i class="fas fa-arrow-left"></i> ${t['back']}`; 
    const descTitle = document.querySelector('.property-description .section-title'); 
    if (descTitle) descTitle.textContent = t['description']; 
    const amenitiesTitle = document.querySelector('.property-amenities .section-title');
    if (amenitiesTitle) amenitiesTitle.textContent = t['amenities'];
    const reviewsTitle = document.querySelector('.reviews-section .section-title'); 
    if (reviewsTitle) reviewsTitle.textContent = t['reviews']; 
    const priceLabel = document.querySelector('.price-label'); 
    if (priceLabel) priceLabel.textContent = t['price-per-night']; 
    const pricePeriod = document.querySelector('.price-period'); 
    if (pricePeriod) pricePeriod.textContent = t['excluding-fees']; 
    const reserveBtn = document.getElementById('reserveBtn'); 
    if (reserveBtn) reserveBtn.innerHTML = `<i class="fas fa-calendar-check"></i> ${t['reserve']}`; 
    const hostTitle = document.querySelector('.host-info h4'); 
    if (hostTitle) hostTitle.textContent = t['hosted-by']; 
    const hostBadge = document.querySelector('.host-badge'); 
    if (hostBadge) hostBadge.innerHTML = `<i class="fas fa-check-circle"></i> ${t['verified-host']}`; 
    const trustBadgeSpan = document.querySelector('.trust-badge span'); 
    if (trustBadgeSpan) trustBadgeSpan.textContent = t['trust-badge']; 
    const writeReviewTitle = document.querySelector('.write-review h4'); 
    if (writeReviewTitle) writeReviewTitle.textContent = t['write-review']; 
    const ratingLabel = document.querySelector('.rating-input label'); 
    if (ratingLabel) ratingLabel.textContent = t['your-rating']; 
    const reviewLabel = document.getElementById('reviewComment')?.previousElementSibling; 
    if (reviewLabel) reviewLabel.textContent = t['your-review']; 
    const submitBtn = document.querySelector('.btn-submit-review'); 
    if (submitBtn) submitBtn.textContent = t['submit']; 
    
    const specLabels = document.querySelectorAll('.spec-item .spec-label');
    const specTexts = [t['bedrooms'], t['bathrooms'], t['area'], t['max-guests']];
    specLabels.forEach((label, idx) => {
        if (specTexts[idx]) label.textContent = specTexts[idx];
    });
    
    updateReviewFormForLoginStatus(); 
}

function updateReviewFormForLoginStatus() { 
    const writeReviewDiv = document.getElementById('writeReviewSection'); 
    if (!writeReviewDiv) return; 
    const t = detailTranslations[detailCurrentLang]; 
    const authMessageDiv = document.getElementById('reviewAuthMessage'); 
    const reviewForm = document.getElementById('reviewForm'); 
    if (!currentUser) { 
        if (reviewForm) reviewForm.style.display = 'none'; 
        if (authMessageDiv) { 
            authMessageDiv.innerHTML = `<div class="login-prompt"><i class="fas fa-lock"></i><p>${t['please-login']}</p><button onclick="window.location.href='login.html'" class="btn-login-review"><i class="fas fa-sign-in-alt"></i> ${t['login-to-review']}</button></div>`; 
        } 
    } else { 
        if (reviewForm) reviewForm.style.display = 'block'; 
        if (authMessageDiv) authMessageDiv.innerHTML = ''; 
    } 
}

async function contactOwner() {
    const user = getCurrentUserForDetail();
    
    if (!user || !user.id) {
        showReviewToast('Please login to contact the owner', true);
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }
    
    if (!currentProperty || !currentProperty.id) {
        showReviewToast('Loading property information...', false);
        await loadPropertyFromDB();
        if (!currentProperty) {
            showReviewToast('Unable to load property information', true);
            return;
        }
    }
    
    let ownerId = null;
    let ownerName = 'Property Owner';
    
    if (currentProperty.owner_id) {
        ownerId = currentProperty.owner_id;
        ownerName = currentProperty.owner_name || 'Property Owner';
    }
    
    if (!ownerId && currentProperty.id) {
        try {
            const response = await fetch(`api-properties.php?id=${currentProperty.id}`);
            const result = await response.json();
            if (result.success && result.properties && result.properties[0]) {
                ownerId = result.properties[0].owner_id;
                currentProperty.owner_id = ownerId;
            }
        } catch(e) {
            console.error('Error fetching owner info:', e);
        }
    }
    
    if (ownerId && ownerId == user.id) {
        showReviewToast('You cannot message yourself (you are the owner of this property)', true);
        return;
    }
    
    if (!ownerId) {
        showReviewToast('Owner information not available. Please try again later.', true);
        return;
    }
    
    const propertyName = currentProperty.name || 'Property';
    const propertyId = currentProperty.id;
    
    showReviewToast('Creating conversation with owner...', false);
    
    try {
        const response = await fetch('api-messages.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender_id: user.id,
                receiver_id: ownerId,
                property_id: propertyId,
                subject: `Interest in: ${propertyName}`,
                message: `Hello! I'm interested in your property "${propertyName}". I would like to get more information about it.\n\nProperty ID: ${propertyId}\n\nThank you!`
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showReviewToast('Message sent! Redirecting to messages...', false);
            setTimeout(() => {
                window.location.href = `messages.html?to=${ownerId}&property=${propertyId}&property_name=${encodeURIComponent(propertyName)}`;
            }, 1500);
        } else {
            const conversationData = {
                receiver_id: ownerId,
                receiver_name: ownerName,
                property_id: propertyId,
                property_name: propertyName,
                timestamp: Date.now(),
                message: `Hello! I'm interested in your property "${propertyName}". I would like to get more information about it.`
            };
            localStorage.setItem('pending_conversation', JSON.stringify(conversationData));
            window.location.href = `messages.html?to=${ownerId}&property=${propertyId}&property_name=${encodeURIComponent(propertyName)}`;
        }
    } catch (error) {
        console.error('Error:', error);
        const conversationData = {
            receiver_id: ownerId,
            receiver_name: ownerName,
            property_id: propertyId,
            property_name: propertyName,
            timestamp: Date.now(),
            message: `Hello! I'm interested in your property "${propertyName}". I would like to get more information about it.`
        };
        localStorage.setItem('pending_conversation', JSON.stringify(conversationData));
        window.location.href = `messages.html?to=${ownerId}&property=${propertyId}&property_name=${encodeURIComponent(propertyName)}`;
    }
}

function updateHostCard(property) { 
    const hostCard = document.querySelector('.host-card'); 
    if (!hostCard) return; 
    let ownerId = null; 
    let ownerName = 'Property Owner'; 
    
    if (property.owner_name) {
        ownerName = property.owner_name;
        ownerId = property.owner_id;
    } else if (property.owner && property.owner.name) {
        ownerName = property.owner.name;
        ownerId = property.owner.id;
    } else if (property.owner_first_name || property.owner_last_name) {
        ownerName = `${property.owner_first_name || ''} ${property.owner_last_name || ''}`.trim();
        if (ownerName === '') ownerName = 'Property Owner';
        ownerId = property.owner_id;
    } else if (property.owner_id) {
        ownerId = property.owner_id;
        fetchOwnerName(ownerId).then(name => {
            if (name) {
                const hostNameEl = hostCard.querySelector('.host-name');
                if (hostNameEl) hostNameEl.textContent = name;
                const avatarImg = hostCard.querySelector('.host-avatar img');
                if (avatarImg) {
                    avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=c9a96e&color=3b2314&bold=true`;
                }
            }
        });
    }
    
    const hostNameEl = hostCard.querySelector('.host-name'); 
    if (hostNameEl && ownerName !== 'Property Owner') {
        hostNameEl.textContent = ownerName;
    } else if (hostNameEl && ownerId) {
        hostNameEl.textContent = `Owner #${ownerId}`;
    }
    
    const avatarImg = hostCard.querySelector('.host-avatar img'); 
    if (avatarImg && ownerName !== 'Property Owner') { 
        avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}&background=c9a96e&color=3b2314&bold=true`; 
        avatarImg.alt = ownerName; 
    }
    
    if (ownerId && !property.owner_id) property.owner_id = ownerId; 
    
    const currentUserLocal = getCurrentUserForDetail(); 
    const contactBtn = hostCard.parentElement?.querySelector('.btn-contact-owner') || document.querySelector('.btn-contact-owner');
    if (contactBtn) {
        const newBtn = contactBtn.cloneNode(true);
        contactBtn.parentNode.replaceChild(newBtn, contactBtn);
        newBtn.onclick = contactOwner;
        if (currentUserLocal && currentUserLocal.id == ownerId) { 
            newBtn.style.opacity = '0.5'; 
            newBtn.style.cursor = 'not-allowed'; 
            newBtn.title = 'You are the owner of this property'; 
            newBtn.disabled = true; 
        }
    }
}

async function fetchOwnerName(ownerId) {
    if (!ownerId) return null;
    try {
        const response = await fetch(`api-user.php?id=${ownerId}`);
        const result = await response.json();
        if (result.success && result.user) {
            return `${result.user.first_name || ''} ${result.user.last_name || ''}`.trim() || 'Property Owner';
        }
    } catch(e) {
        console.error('Error fetching owner name:', e);
    }
    return null;
}

function updateSpecs(property) {
    const bedroomsEl = document.getElementById('specBedrooms');
    const bathroomsEl = document.getElementById('specBathrooms');
    const areaEl = document.getElementById('specArea');
    const guestsEl = document.getElementById('specGuests');
    
    if (bedroomsEl) bedroomsEl.textContent = property.bedrooms || 2;
    if (bathroomsEl) bathroomsEl.textContent = property.bathrooms || 2;
    if (areaEl) areaEl.textContent = `${property.area || 100} m²`;
    if (guestsEl) guestsEl.textContent = property.max_guests || 4;
}

function populatePropertyData(property) { 
    if (!property) return; 
    currentProperty = property; 
    document.getElementById('propertyTitle').textContent = property.name || 'Property'; 
    document.getElementById('propertyDistrict').textContent = (property.district || property.location || 'Annaba').toUpperCase(); 
    const descElement = document.getElementById('propertyDesc'); 
    if (descElement) descElement.textContent = property.description || `Beautiful ${property.bedrooms || 2}-bedroom, ${property.bathrooms || 2}-bathroom property with stunning views.`; 
    
    const priceDzdEl = document.querySelector('.price-dzd'); 
    if (priceDzdEl) { 
        const price = property.price_dzd || property.price_usd * 140 || 2170000; 
        priceDzdEl.textContent = `${parseInt(price).toLocaleString()} DA`; 
    }
    
    updateSpecs(property);
    
    const rating = property.rating || 4.5; 
    const reviewsCount = property.reviews_count || currentReviews.length || 0; 
    const starsContainer = document.getElementById('starsContainer'); 
    const ratingValueSpan = document.getElementById('ratingValue'); 
    const reviewCountSpan = document.getElementById('reviewCount'); 
    if (starsContainer) { 
        starsContainer.innerHTML = ''; 
        const fullStars = Math.floor(rating); 
        const hasHalfStar = rating % 1 >= 0.5; 
        for (let i = 0; i < fullStars; i++) starsContainer.innerHTML += '<i class="fas fa-star"></i>'; 
        if (hasHalfStar) starsContainer.innerHTML += '<i class="fas fa-star-half-alt"></i>'; 
        for (let i = Math.ceil(rating); i < 5; i++) starsContainer.innerHTML += '<i class="far fa-star"></i>'; 
    } 
    if (ratingValueSpan) ratingValueSpan.textContent = rating.toFixed(1); 
    if (reviewCountSpan) reviewCountSpan.textContent = `(${reviewsCount} reviews)`; 
    
    const heroBadge = document.getElementById('heroBadge'); 
    if (heroBadge && property.status) heroBadge.textContent = property.status === 'available' ? 'AVAILABLE' : property.status.toUpperCase(); 
    
    const mainImage = property.main_image || 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format'; 
    const mainHeroImage = document.getElementById('mainHeroImage'); 
    if (mainHeroImage) mainHeroImage.src = mainImage; 
    
    galleryImages = [mainImage]; 
    if (property.images && property.images.length > 0) { 
        property.images.forEach(img => { 
            if (img.image_url && img.image_url !== mainImage) galleryImages.push(img.image_url); 
        }); 
    } 
    
    const defaultImages = ["https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&auto=format", "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&auto=format", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format"]; 
    while (galleryImages.length < 4) galleryImages.push(defaultImages[galleryImages.length % defaultImages.length]); 
    
    const thumbnails = document.getElementById('thumbnails'); 
    if (thumbnails) { 
        thumbnails.innerHTML = galleryImages.map((img, index) => `<div class="thumb ${index === 0 ? 'active' : ''}" data-img="${img}"><img src="${img}" alt="Thumbnail ${index + 1}" onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format'"></div>`).join(''); 
        document.querySelectorAll('.thumb').forEach(thumb => { 
            thumb.addEventListener('click', () => { 
                const imgSrc = thumb.getAttribute('data-img'); 
                const mainImageEl = document.getElementById('mainHeroImage'); 
                if (mainImageEl) mainImageEl.src = imgSrc; 
                document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active')); 
                thumb.classList.add('active'); 
            }); 
        }); 
    } 
    updateHostCard(property); 
    loadReviews(); 
    initSaveButton(); 
    saveLastViewedProperty(property.id); 
}

async function toggleWishlist(propertyId) { 
    const user = getCurrentUserForDetail(); 
    if (!user || !user.id) { 
        showReviewToast('Please login to save favorites', true); 
        setTimeout(() => window.location.href = 'login.html', 1500); 
        return false; 
    } 
    const saveBtn = document.getElementById('saveHeroBtn'); 
    const isActive = saveBtn?.classList.contains('active'); 
    try { 
        if (isActive) { 
            const response = await fetch(`api-wishlist.php?property_id=${propertyId}`, { 
                method: 'DELETE', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ user_id: user.id, property_id: propertyId }) 
            }); 
            const result = await response.json(); 
            if (result.success) { 
                saveBtn.classList.remove('active'); 
                const icon = saveBtn.querySelector('i'); 
                if (icon) icon.className = 'far fa-heart'; 
                showReviewToast('Removed from favorites'); 
                return false; 
            } else { 
                showReviewToast(result.message || 'Failed to remove', true); 
                return true; 
            } 
        } else { 
            const response = await fetch('api-wishlist.php', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ user_id: user.id, property_id: propertyId }) 
            }); 
            const result = await response.json(); 
            if (result.success) { 
                saveBtn.classList.add('active'); 
                const icon = saveBtn.querySelector('i'); 
                if (icon) icon.className = 'fas fa-heart'; 
                showReviewToast('Added to favorites'); 
                return true; 
            } else { 
                showReviewToast(result.message || 'Failed to add', true); 
                return false; 
            } 
        } 
    } catch (error) { 
        showReviewToast('Connection error', true); 
        return false; 
    } 
}

async function checkWishlistStatus(propertyId) { 
    const user = getCurrentUserForDetail(); 
    if (!user || !user.id) return false; 
    try { 
        const response = await fetch(`api-wishlist.php?user_id=${user.id}`); 
        const result = await response.json(); 
        if (result.success && result.wishlist) return result.wishlist.some(item => item.id == propertyId); 
        return false; 
    } catch (error) { 
        return false; 
    } 
}

async function initSaveButton() { 
    const saveBtn = document.getElementById('saveHeroBtn'); 
    if (!saveBtn) return; 
    const propertyId = currentProperty?.id || urlParams.get('id'); 
    const isSaved = await checkWishlistStatus(propertyId); 
    if (isSaved) { 
        saveBtn.classList.add('active'); 
        const icon = saveBtn.querySelector('i'); 
        if (icon) icon.className = 'fas fa-heart'; 
    } else { 
        saveBtn.classList.remove('active'); 
        const icon = saveBtn.querySelector('i'); 
        if (icon) icon.className = 'far fa-heart'; 
    } 
    const newSaveBtn = saveBtn.cloneNode(true); 
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn); 
    newSaveBtn.addEventListener('click', async (e) => { 
        e.preventDefault(); 
        await toggleWishlist(propertyId); 
    }); 
}

function getCurrentUserForDetail() { 
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

function initStarRating() { 
    const stars = document.querySelectorAll('#starRating i'); 
    const ratingInput = document.getElementById('reviewRating'); 
    if (!stars.length) return; 
    stars.forEach(star => { 
        star.addEventListener('click', () => { 
            const rating = parseInt(star.getAttribute('data-rating')); 
            if (ratingInput) ratingInput.value = rating; 
            stars.forEach(s => { 
                const starRating = parseInt(s.getAttribute('data-rating')); 
                if (starRating <= rating) { 
                    s.className = 'fas fa-star'; 
                    s.classList.add('active'); 
                } else { 
                    s.className = 'far fa-star'; 
                    s.classList.remove('active'); 
                } 
            }); 
        }); 
        star.addEventListener('mouseenter', () => { 
            const rating = parseInt(star.getAttribute('data-rating')); 
            stars.forEach(s => { 
                const starRating = parseInt(s.getAttribute('data-rating')); 
                if (starRating <= rating) s.className = 'fas fa-star'; 
                else s.className = 'far fa-star'; 
            }); 
        }); 
    }); 
    const starContainer = document.getElementById('starRating'); 
    if (starContainer) { 
        starContainer.addEventListener('mouseleave', () => { 
            const currentRating = ratingInput ? parseInt(ratingInput.value) : 0; 
            stars.forEach(s => { 
                const starRating = parseInt(s.getAttribute('data-rating')); 
                if (currentRating > 0 && starRating <= currentRating) s.className = 'fas fa-star'; 
                else s.className = 'far fa-star'; 
            }); 
        }); 
    } 
}

function loadReviews() { 
    const propertyId = currentProperty?.id || urlParams.get('id'); 
    const savedReviews = localStorage.getItem(`reviews_property_${propertyId}`); 
    if (savedReviews) { 
        currentReviews = JSON.parse(savedReviews); 
    } else { 
        currentReviews = [ 
            { id: 1, reviewerName: "Ahmed Benali", rating: 5, comment: "Absolutely stunning property! The views are incredible and the host was very accommodating.", date: new Date('2024-04-15').toISOString() }, 
            { id: 2, reviewerName: "Sarah Mansouri", rating: 4.5, comment: "Beautiful villa with amazing amenities. The pool area is perfect for relaxation.", date: new Date('2024-04-10').toISOString() }, 
            { id: 3, reviewerName: "Karim Hadj", rating: 5, comment: "One of the best properties I've stayed at. Clean, spacious, and great location.", date: new Date('2024-04-05').toISOString() } 
        ]; 
        localStorage.setItem(`reviews_property_${propertyId}`, JSON.stringify(currentReviews)); 
    } 
    updateReviewsDisplay(); 
}

function updateReviewsDisplay() { 
    const reviewsList = document.getElementById('reviewsList'); 
    if (!reviewsList) return; 
    const totalReviews = currentReviews.length; 
    if (totalReviews === 0) { 
        reviewsList.innerHTML = '<div class="loading-reviews">No reviews yet. Be the first to review!</div>'; 
        return; 
    } 
    
    const totalRating = currentReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / totalReviews;
    updateReviewsSummary(avgRating, totalReviews);
    
    reviewsList.innerHTML = currentReviews.map(review => `<div class="review-card"><div class="review-header"><div class="reviewer-name"><i class="fas fa-user-circle"></i> ${escapeHtml(review.reviewerName)}${review.isCurrentUser ? '<span style="font-size:0.7rem;color:var(--gold);margin-left:0.5rem;">(You)</span>' : ''}</div><div class="review-stars">${getReviewStarsHtml(review.rating)}</div><div class="review-date">${new Date(review.date).toLocaleDateString()}</div></div><div class="review-comment">${escapeHtml(review.comment)}</div></div>`).join(''); 
}

function updateReviewsSummary(avgRating, totalReviews) {
    const summaryDiv = document.getElementById('reviewsSummary');
    if (!summaryDiv) return;
    
    summaryDiv.style.display = 'flex';
    const avgRatingEl = document.getElementById('avgRating');
    const summaryStarsEl = document.getElementById('summaryStars');
    const ratingBarsEl = document.getElementById('ratingBars');
    
    if (avgRatingEl) avgRatingEl.textContent = avgRating.toFixed(1);
    if (summaryStarsEl) {
        const fullStars = Math.floor(avgRating);
        const hasHalfStar = avgRating % 1 >= 0.5;
        let starsHtml = '';
        for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fas fa-star"></i>';
        if (hasHalfStar) starsHtml += '<i class="fas fa-star-half-alt"></i>';
        for (let i = Math.ceil(avgRating); i < 5; i++) starsHtml += '<i class="far fa-star"></i>';
        summaryStarsEl.innerHTML = starsHtml;
    }
    
    if (ratingBarsEl) {
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        currentReviews.forEach(r => {
            const floorRating = Math.floor(r.rating);
            if (distribution[floorRating]) distribution[floorRating]++;
        });
        
        ratingBarsEl.innerHTML = '';
        for (let i = 5; i >= 1; i--) {
            const count = distribution[i];
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            ratingBarsEl.innerHTML += `
                <div class="rating-bar-item">
                    <span class="rating-bar-label">${i} ★</span>
                    <div class="rating-bar-track">
                        <div class="rating-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="rating-bar-count">${count}</span>
                </div>
            `;
        }
    }
}

function getReviewStarsHtml(rating) { 
    let stars = ''; 
    const fullStars = Math.floor(rating); 
    const hasHalfStar = rating % 1 >= 0.5; 
    for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>'; 
    if (hasHalfStar) stars += '<i class="fas fa-star-half-alt"></i>'; 
    for (let i = Math.ceil(rating); i < 5; i++) stars += '<i class="far fa-star"></i>'; 
    return stars; 
}

function escapeHtml(text) { 
    if (!text) return ''; 
    const div = document.createElement('div'); 
    div.textContent = text; 
    return div.innerHTML; 
}

function showReviewToast(message, isError = false) { 
    const existingToast = document.querySelector('.review-toast'); 
    if (existingToast) existingToast.remove(); 
    const toast = document.createElement('div'); 
    toast.className = `review-toast ${isError ? 'error' : 'success'}`; 
    toast.textContent = message; 
    document.body.appendChild(toast); 
    setTimeout(() => toast.remove(), 3000); 
}

function submitReview(event) { 
    event.preventDefault(); 
    if (!currentUser) { 
        showReviewToast('Please login to submit a review', true); 
        window.location.href = 'login.html'; 
        return; 
    } 
    const rating = parseInt(document.getElementById('reviewRating').value); 
    const comment = document.getElementById('reviewComment').value.trim(); 
    const reviewerName = currentUser.name || currentUser.full_name || currentUser.username || currentUser.email?.split('@')[0] || 'Guest'; 
    if (rating === 0) { 
        showReviewToast('Please select a rating', true); 
        return; 
    } 
    if (!comment || comment.length < 10) { 
        showReviewToast('Please write a review (minimum 10 characters)', true); 
        return; 
    } 
    const propertyId = currentProperty?.id || urlParams.get('id'); 
    const newReview = { id: Date.now(), reviewerName: reviewerName, rating: rating, comment: comment, date: new Date().toISOString(), isCurrentUser: true }; 
    currentReviews.unshift(newReview); 
    localStorage.setItem(`reviews_property_${propertyId}`, JSON.stringify(currentReviews)); 
    updateReviewsDisplay(); 
    document.getElementById('reviewRating').value = 0; 
    document.getElementById('reviewComment').value = ''; 
    const stars = document.querySelectorAll('#starRating i'); 
    stars.forEach(star => star.className = 'far fa-star'); 
    showReviewToast('Thank you for your review!'); 
}

function goToReservation() { 
    const session = localStorage.getItem('dreamhome_session') || sessionStorage.getItem('dreamhome_session'); 
    if (!session) { 
        window.location.href = 'login.html'; 
        return; 
    } 
    if (!currentProperty) return; 
    const params = new URLSearchParams(); 
    params.set('id', currentProperty.id); 
    params.set('name_en', currentProperty.name); 
    params.set('price_usd', currentProperty.price_usd || 0); 
    params.set('price_dzd', currentProperty.price_dzd || 0); 
    window.location.href = `reservation.html?${params.toString()}`; 
}

async function loadPropertyFromDB() { 
    const propertyId = urlParams.get('id'); 
    if (!propertyId) { 
        populatePropertyData({ id: propertyId || '1', name: decodeURIComponent(urlParams.get('name_en') || 'Oceanfront Luxury Villa'), price_usd: parseInt(urlParams.get('price_usd') || '1550'), price_dzd: parseInt(urlParams.get('price_dzd') || '2170000'), rating: parseFloat(urlParams.get('rating') || '4.8'), bedrooms: parseInt(urlParams.get('beds') || '5'), bathrooms: parseInt(urlParams.get('baths') || '4'), area: parseInt(urlParams.get('area') || '380'), reviews_count: parseInt(urlParams.get('reviews') || '213'), location: urlParams.get('location') || 'seraidi', main_image: urlParams.get('image') || 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format', status: 'available', owner_id: 2, owner_name: 'Demo Owner' }); 
        return; 
    } 
    try { 
        const response = await fetch(`api-properties.php?id=${propertyId}`); 
        const result = await response.json(); 
        if (result.success && result.properties && result.properties.length > 0) {
            const property = result.properties[0];
            populatePropertyData(property); 
        } else {
            populatePropertyData({ id: propertyId, name: decodeURIComponent(urlParams.get('name_en') || 'Property Not Found'), price_usd: parseInt(urlParams.get('price_usd') || '0'), price_dzd: parseInt(urlParams.get('price_dzd') || '0'), rating: 4.0, bedrooms: 2, bathrooms: 2, area: 100, reviews_count: 0, location: 'annaba', main_image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format', status: 'available', owner_id: 2, owner_name: 'Demo Owner' }); 
        }
    } catch (error) { 
        console.error('Error loading property:', error);
        populatePropertyData({ id: propertyId, name: decodeURIComponent(urlParams.get('name_en') || 'Luxury Property'), price_usd: parseInt(urlParams.get('price_usd') || '1000'), price_dzd: parseInt(urlParams.get('price_dzd') || '1400000'), rating: 4.5, bedrooms: parseInt(urlParams.get('beds') || '3'), bathrooms: parseInt(urlParams.get('baths') || '2'), area: parseInt(urlParams.get('area') || '150'), reviews_count: parseInt(urlParams.get('reviews') || '50'), location: urlParams.get('location') || 'annaba', main_image: urlParams.get('image') || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format', status: 'available', owner_id: 2, owner_name: 'Demo Owner' }); 
    } 
}

window.contactOwner = contactOwner;

document.addEventListener('DOMContentLoaded', () => { 
    const savedLang = localStorage.getItem('language') || 'en'; 
    detailCurrentLang = savedLang; 
    currentUser = loadCurrentUser();
    updateDetailLanguage(savedLang); 
    loadPropertyFromDB(); 
    initStarRating(); 
    const reserveBtn = document.getElementById('reserveBtn'); 
    if (reserveBtn) reserveBtn.addEventListener('click', goToReservation); 
    const reviewForm = document.getElementById('reviewForm'); 
    if (reviewForm) reviewForm.addEventListener('submit', submitReview); 
    
    setTimeout(() => {
        const contactBtn = document.getElementById('contactOwnerBtn');
        if (contactBtn) {
            const newBtn = contactBtn.cloneNode(true);
            contactBtn.parentNode.replaceChild(newBtn, contactBtn);
            newBtn.onclick = contactOwner;
        }
    }, 1000);
    
    window.addEventListener('languageChanged', (e) => { 
        if (e.detail && e.detail.lang) { 
            detailCurrentLang = e.detail.lang; 
            updateDetailLanguage(e.detail.lang); 
        } 
    }); 
});

async function trackPropertyInteraction(propertyId, action) {
    const user = getCurrentUserForDetail();
    if (!user || !user.id) return;
    
    try {
        await fetch('api-recommendations.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, property_id: propertyId, action: action })
        });
    } catch(e) {
        console.error('Error tracking interaction:', e);
    }
}

const originalSaveLastViewed = window.saveLastViewedProperty || function(id) {
    localStorage.setItem('last_viewed_property', id);
};

window.saveLastViewedProperty = function(propertyId) {
    originalSaveLastViewed(propertyId);
    trackPropertyInteraction(propertyId, 'view');
};

if (typeof window.goToReservation === 'function') {
    const originalGoToReservation = window.goToReservation;
    window.goToReservation = function() {
        if (currentProperty && currentProperty.id) {
            trackPropertyInteraction(currentProperty.id, 'booking_click');
        }
        originalGoToReservation();
    };
}

if (typeof window.contactOwner === 'function') {
    const originalContactOwner = window.contactOwner;
    window.contactOwner = function() {
        if (currentProperty && currentProperty.id) {
            trackPropertyInteraction(currentProperty.id, 'contact_click');
        }
        if (originalContactOwner) originalContactOwner();
    };
}