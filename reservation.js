let selectedUsage = null;
let selectedUsageAdditionalPrice = 0;
let selectedUsagePerDay = true;
let selectedUsageUnit = "night";
let selectedUsageName = "";
let currentStep = 1;
let selectedPayment = null;
let bookedDates = [];

let currentMonth = new Date();
let selectedStartDate = null;
let selectedEndDate = null;

let currentPropertyMaxGuests = 50;
let currentPropertyBasePrice = 15000;
let currentPropertyTotalPrice = 15000;

const urlParams = new URLSearchParams(window.location.search);
const propertyId = urlParams.get('id') || '1';
const propertyName = decodeURIComponent(urlParams.get('name_en') || urlParams.get('name') || 'DreamHome Property');

const urlPrice = urlParams.get('price_dzd') || urlParams.get('price');
if (urlPrice && !isNaN(parseFloat(urlPrice))) {
    currentPropertyBasePrice = parseFloat(urlPrice);
    currentPropertyTotalPrice = currentPropertyBasePrice;
}

const urlMaxGuests = urlParams.get('max_guests');
if (urlMaxGuests && !isNaN(parseInt(urlMaxGuests))) {
    currentPropertyMaxGuests = parseInt(urlMaxGuests);
}

const conversionSpaces = [
    { type_key: "residence", name: "Residential (No Conversion)", description: "Rent as-is, no changes", additional_price: 0, unit: "night", per_day: 1, image_url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&auto=format", icon: "🏠" },
    { type_key: "studio", name: "Photo Studio Conversion", description: "Convert to shooting, content creation space", additional_price: 8000, unit: "night", per_day: 1, image_url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format", icon: "📸" },
    { type_key: "kitchen", name: "Professional Kitchen Conversion", description: "Convert to cooking classes, catering space", additional_price: 12000, unit: "night", per_day: 1, image_url: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&auto=format", icon: "🍳" },
    { type_key: "event", name: "Event Space Conversion", description: "Convert to workshops, training, parties", additional_price: 15000, unit: "night", per_day: 1, image_url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400&auto=format", icon: "🎉" },
    { type_key: "workspace", name: "Workspace Conversion", description: "Convert to coworking, remote work space", additional_price: 2500, unit: "night", per_day: 1, image_url: "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=400&auto=format", icon: "💼" },
    { type_key: "art-studio", name: "Art Studio Conversion", description: "Convert to painting, sculpture, crafts", additional_price: 6000, unit: "night", per_day: 1, image_url: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=400&auto=format", icon: "🎨" },
    { type_key: "gym", name: "Gym & Sports Hall Conversion", description: "Convert to weight training, cardio", additional_price: 10000, unit: "night", per_day: 1, image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format", icon: "🏋️" },
    { type_key: "fitness", name: "Fitness Studio Conversion", description: "Convert to Zumba, aerobics, crossfit", additional_price: 7000, unit: "night", per_day: 1, image_url: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&auto=format", icon: "💪" },
    { type_key: "wellness", name: "Wellness Center Conversion", description: "Convert to spa, massage, relaxation", additional_price: 18000, unit: "night", per_day: 1, image_url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&auto=format", icon: "🧘" },
    { type_key: "yoga", name: "Yoga Studio Conversion", description: "Convert to yoga, meditation, pilates", additional_price: 5000, unit: "night", per_day: 1, image_url: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=400&auto=format", icon: "🧘‍♀️" },
    { type_key: "dance", name: "Dance Studio Conversion", description: "Convert to ballet, modern, hip-hop", additional_price: 6500, unit: "night", per_day: 1, image_url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format", icon: "💃" },
    { type_key: "meeting-hall", name: "Meeting Hall Conversion", description: "Convert to large gatherings, conferences", additional_price: 25000, unit: "night", per_day: 1, image_url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&auto=format", icon: "🏛️" },
    { type_key: "conference", name: "Conference Room Conversion", description: "Convert to business meetings, seminars", additional_price: 20000, unit: "night", per_day: 1, image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&auto=format", icon: "📊" },
    { type_key: "cafeteria", name: "Cafeteria / Restaurant Conversion", description: "Convert to food service, events", additional_price: 14000, unit: "night", per_day: 1, image_url: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&auto=format", icon: "☕" },
    { type_key: "exhibition", name: "Exhibition Hall Conversion", description: "Convert to art shows, trade fairs", additional_price: 30000, unit: "night", per_day: 1, image_url: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400&auto=format", icon: "🖼️" },
    { type_key: "play-area", name: "Children's Play Area Conversion", description: "Convert to birthday parties, indoor play", additional_price: 4000, unit: "hour", per_day: 0, image_url: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&auto=format", icon: "🎪" }
];

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showToast(message, isError = false) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
        
        const style = document.createElement('style');
        style.textContent = `
            #toastContainer {
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                z-index: 2100;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            .toast {
                padding: 0.7rem 1.2rem;
                border-radius: 40px;
                font-size: 0.8rem;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideInToast 0.3s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .toast-success {
                background: #3b2314;
                color: white;
            }
            .toast-error {
                background: #c25b4a;
                color: white;
            }
            @keyframes slideInToast {
                from { opacity: 0; transform: translateX(30px); }
                to { opacity: 1; transform: translateX(0); }
            }
            @keyframes slideOutToast {
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(30px); }
            }
        `;
        document.head.appendChild(style);
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

function getTotalPricePerNight() {
    return currentPropertyBasePrice + selectedUsageAdditionalPrice;
}

function renderOptionsGrid() {
    const container = document.getElementById('optionsGrid');
    if (!container) return;
    
    container.innerHTML = conversionSpaces.map(space => {
        const totalPriceForDisplay = currentPropertyBasePrice + space.additional_price;
        
        return `
            <div class="option-card" data-type="${space.type_key}" data-additional-price="${space.additional_price}" data-per-day="${space.per_day}" data-unit="${space.unit}" data-name="${space.name}">
                <div class="card-image">
                    <img src="${space.image_url}" alt="${space.name}" onerror="this.src='https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&auto=format'">
                    <div class="card-badge">${space.icon}</div>
                </div>
                <div class="card-content">
                    <h3>${space.name}</h3>
                    <p>${space.description}</p>
                    <div class="card-price">${totalPriceForDisplay.toLocaleString()} DA <span>/ ${space.unit}</span></div>
                    ${space.additional_price > 0 ? `<small style="color: var(--gold); font-size: 0.65rem;">+${space.additional_price.toLocaleString()} DA conversion fee</small>` : '<small style="color: var(--gray); font-size: 0.65rem;">Keep original price</small>'}
                </div>
                <div class="card-check">✓</div>
            </div>
        `;
    }).join('');
    
    initSpaceCards();
}

function initSpaceCards() {
    const cards = document.querySelectorAll(".option-card");
    cards.forEach((card) => {
        card.addEventListener("click", function () {
            cards.forEach((c) => c.classList.remove("selected"));
            this.classList.add("selected");
            
            selectedUsage = this.getAttribute("data-type");
            selectedUsageAdditionalPrice = parseInt(this.getAttribute("data-additional-price"));
            selectedUsagePerDay = this.getAttribute("data-per-day") === '1';
            selectedUsageUnit = this.getAttribute("data-unit");
            selectedUsageName = this.getAttribute("data-name");
            
            currentPropertyTotalPrice = getTotalPricePerNight();
            
            const summaryType = document.getElementById("summaryType");
            if (summaryType) {
                if (selectedUsage === 'residence') {
                    summaryType.innerHTML = `${selectedUsageName} (No conversion - keep as is)`;
                } else {
                    summaryType.innerHTML = `${selectedUsageName} (Converted from ${propertyName})`;
                }
            }
            
            const btnNext = document.getElementById("btnNext1");
            if (btnNext) btnNext.disabled = false;
            
            updateStep3Summary();
        });
    });
}

async function fetchBookedDates(propertyId) {
    try {
        const response = await fetch(`api-bookings.php?property_id=${propertyId}`);
        const data = await response.json();
        if (data.success && data.booked_dates) {
            bookedDates = data.booked_dates;
        }
        return bookedDates;
    } catch (error) {
        console.error('Error fetching booked dates:', error);
        return [];
    }
}

function isDateBooked(dateString) {
    return bookedDates.includes(dateString);
}

function isDatePast(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
}

function validateDateRange(startDate, endDate) {
    if (!startDate || !endDate) return { valid: false, message: 'Please select dates' };
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
        return { valid: false, message: 'Check-out date must be after check-in date' };
    }
    
    const checkDate = new Date(start);
    const bookedDays = [];
    while (checkDate < end) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (isDateBooked(dateStr)) {
            bookedDays.push(dateStr);
        }
        checkDate.setDate(checkDate.getDate() + 1);
    }
    
    if (bookedDays.length > 0) {
        return { 
            valid: false, 
            message: `The following dates are already booked: ${bookedDays.join(', ')}. Please select different dates.`
        };
    }
    
    return { valid: true };
}

function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const calendarDays = document.getElementById('calendarDays');
    const currentMonthYear = document.getElementById('currentMonthYear');
    
    if (!calendarDays) return;
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    currentMonthYear.textContent = `${monthNames[month]} ${year}`;
    
    calendarDays.innerHTML = '';
    
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'calendar-day disabled-day';
        emptyDiv.style.visibility = 'hidden';
        calendarDays.appendChild(emptyDiv);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        const isBooked = isDateBooked(dateStr);
        const isPast = isDatePast(date);
        const isDisabled = isBooked || isPast;
        
        const dayDiv = document.createElement('div');
        dayDiv.className = `calendar-day ${isDisabled ? (isBooked ? 'booked-day' : 'disabled-day') : 'available-day'}`;
        dayDiv.textContent = day;
        
        if (selectedStartDate && dateStr === selectedStartDate) {
            dayDiv.classList.add('selected-start');
        }
        else if (selectedEndDate && dateStr === selectedEndDate) {
            dayDiv.classList.add('selected-end');
        }
        else if (selectedStartDate && selectedEndDate) {
            const start = new Date(selectedStartDate);
            const end = new Date(selectedEndDate);
            if (date > start && date < end) {
                dayDiv.classList.add('in-range');
            }
        }
        
        if (!isDisabled) {
            dayDiv.style.cursor = 'pointer';
            dayDiv.addEventListener('click', (function(d) {
                return function() { selectDate(d); };
            })(dateStr));
        }
        
        calendarDays.appendChild(dayDiv);
    }
}

function selectDate(dateStr) {
    const checkInInput = document.getElementById('checkInDate');
    const checkOutInput = document.getElementById('checkOutDate');
    
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
        selectedStartDate = dateStr;
        selectedEndDate = null;
        checkInInput.value = dateStr;
        checkOutInput.value = '';
    } 
    else if (selectedStartDate && !selectedEndDate) {
        if (dateStr > selectedStartDate) {
            let allAvailable = true;
            const start = new Date(selectedStartDate);
            const end = new Date(dateStr);
            const checkDate = new Date(start);
            checkDate.setDate(checkDate.getDate() + 1);
            
            while (checkDate < end) {
                const checkStr = checkDate.toISOString().split('T')[0];
                if (isDateBooked(checkStr)) {
                    allAvailable = false;
                    break;
                }
                checkDate.setDate(checkDate.getDate() + 1);
            }
            
            if (allAvailable && !isDateBooked(dateStr)) {
                selectedEndDate = dateStr;
                checkOutInput.value = dateStr;
            } else {
                alert('Some dates in this range are already booked. Please select different dates.');
                selectedStartDate = dateStr;
                selectedEndDate = null;
                checkInInput.value = dateStr;
                checkOutInput.value = '';
            }
        } else {
            selectedStartDate = dateStr;
            selectedEndDate = null;
            checkInInput.value = dateStr;
            checkOutInput.value = '';
        }
    }
    
    renderCalendar();
    updateNightsInfo();
    validateStep2();
    updateStep3Summary();
}

function changeMonth(delta) {
    currentMonth.setMonth(currentMonth.getMonth() + delta);
    renderCalendar();
}

function initGuestSelector() {
    const minusBtn = document.getElementById('guestMinus');
    const plusBtn = document.getElementById('guestPlus');
    const guestCountSpan = document.getElementById('guestCount');
    const guestError = document.getElementById('guestError');
    
    if (!minusBtn || !plusBtn || !guestCountSpan) return;
    
    let count = 2;
    guestCountSpan.textContent = count;
    
    function updateGuestDisplay() {
        guestCountSpan.textContent = count;
        
        if (count > currentPropertyMaxGuests) {
            if (guestError) {
                guestError.textContent = `⚠️ Maximum ${currentPropertyMaxGuests} guests allowed for this space!`;
                guestError.classList.add('show');
            }
            guestCountSpan.classList.add('error');
        } else {
            if (guestError) {
                guestError.classList.remove('show');
            }
            guestCountSpan.classList.remove('error');
            validateStep2();
        }
        updateStep3Summary();
        if (currentStep === 4) {
            updateContractPreview();
        }
    }
    
    minusBtn.addEventListener('click', () => {
        if (count > 1) {
            count--;
            updateGuestDisplay();
        }
    });
    
    plusBtn.addEventListener('click', () => {
        if (count < 50) {
            count++;
            updateGuestDisplay();
        }
    });
    
    updateGuestDisplay();
}

function updateNightsInfo() {
    const checkIn = document.getElementById('checkInDate')?.value;
    const checkOut = document.getElementById('checkOutDate')?.value;
    const nightsSpan = document.getElementById('nightsCount');
    
    if (checkIn && checkOut) {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        let units = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
        if (selectedUsageUnit === "hour") {
            units = units * 24;
        }
        if (nightsSpan) nightsSpan.textContent = units;
        return units;
    }
    return 0;
}

function validateStep2() {
    const checkIn = document.getElementById('checkInDate')?.value;
    const checkOut = document.getElementById('checkOutDate')?.value;
    const guestCount = parseInt(document.getElementById('guestCount')?.textContent) || 2;
    const btnNext = document.getElementById('btnNext2');
    
    let isValid = true;
    
    if (checkIn && checkOut && checkOut > checkIn) {
        const validation = validateDateRange(checkIn, checkOut);
        isValid = validation.valid;
    } else {
        isValid = false;
    }
    
    if (guestCount > currentPropertyMaxGuests) {
        isValid = false;
    }
    
    if (btnNext) {
        btnNext.disabled = !isValid;
    }
    
    return isValid;
}

function validateStep3() {
    const isValid = selectedPayment !== null;
    const btnNext = document.getElementById('btnNext3');
    if (btnNext) btnNext.disabled = !isValid;
    return isValid;
}

function validateCardDetails() {
    const cardNumber = document.getElementById('cardNumber')?.value.replace(/\s/g, '');
    const cardName = document.getElementById('cardName')?.value.trim();
    const cardExpiry = document.getElementById('cardExpiry')?.value;
    const cardCvv = document.getElementById('cardCvv')?.value;
    const cardError = document.getElementById('cardError');
    
    const cardNumberRegex = /^[0-9]{16}$/;
    if (!cardNumber || !cardNumberRegex.test(cardNumber)) {
        if (cardError) {
            cardError.textContent = "Invalid card number. Must be 16 digits";
            cardError.classList.add('show');
        }
        return false;
    }
    
    if (!cardName || cardName.length < 3) {
        if (cardError) {
            cardError.textContent = "Please enter the full name on the card";
            cardError.classList.add('show');
        }
        return false;
    }
    
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!cardExpiry || !expiryRegex.test(cardExpiry)) {
        if (cardError) {
            cardError.textContent = "Invalid expiry date. Use MM/YY format";
            cardError.classList.add('show');
        }
        return false;
    }
    
    const cvvRegex = /^[0-9]{3}$/;
    if (!cardCvv || !cvvRegex.test(cardCvv)) {
        if (cardError) {
            cardError.textContent = "Invalid CVV. Must be 3 digits";
            cardError.classList.add('show');
        }
        return false;
    }
    
    if (cardError) cardError.classList.remove('show');
    return true;
}


function formatPhone(input) {
    let val = input.value.replace(/\D/g, "");
    
    if (val.length > 10) {
        val = val.substring(0, 10);
    }
    
    let formatted = "";
    for (let i = 0; i < val.length; i++) {
        if (i === 2 || i === 4 || i === 6 || i === 8) {
            formatted += " ";
        }
        formatted += val[i];
    }
    input.value = formatted;
}

function validateBaridiMobDetails() {
    const phoneInput = document.getElementById('baridiPhone');
    const codeInput = document.getElementById('baridiCode');
    const baridiError = document.getElementById('baridiError');
    
    if (!phoneInput || !codeInput) return false;
    
    let phoneNumber = phoneInput.value.replace(/\s/g, "");
    let baridiCode = codeInput.value.trim();
    
    const phoneRegex = /^(05|06|07)[0-9]{8}$/;
    
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
        if (baridiError) {
            baridiError.textContent = "رقم الهاتف غير صحيح. يجب أن يكون 10 أرقام ويبدأ بـ 05 أو 06 أو 07";
            baridiError.classList.add('show');
        }
        return false;
    }
    
    const codeRegex = /^[0-9]{6}$/;
    if (!baridiCode || !codeRegex.test(baridiCode)) {
        if (baridiError) {
            baridiError.textContent = "رمز BaridiMob غير صحيح. يجب أن يكون 6 أرقام";
            baridiError.classList.add('show');
        }
        return false;
    }
    
    if (baridiError) baridiError.classList.remove('show');
    return true;
}

function validateBankTransferDetails() {
    const accountHolder = document.getElementById('bankHolder')?.value.trim();
    const iban = document.getElementById('bankIban')?.value.replace(/\s/g, '').toUpperCase();
    const bankName = document.getElementById('bankName')?.value.trim();
    const bankError = document.getElementById('bankError');
    
    if (!accountHolder || accountHolder.length < 3) {
        if (bankError) {
            bankError.textContent = "Please enter the full account holder name";
            bankError.classList.add('show');
        }
        return false;
    }
    
    if (!iban || iban.length < 10) {
        if (bankError) {
            bankError.textContent = "Please enter a valid IBAN";
            bankError.classList.add('show');
        }
        return false;
    }
    
    if (!bankName || bankName.length < 3) {
        if (bankError) {
            bankError.textContent = "Please enter the bank name";
            bankError.classList.add('show');
        }
        return false;
    }
    
    if (bankError) bankError.classList.remove('show');
    return true;
}

function updateStep3Summary() {
    if (!selectedUsage) return;
    
    const checkIn = document.getElementById('checkInDate')?.value;
    const checkOut = document.getElementById('checkOutDate')?.value;
    let units = 1;
    
    if (checkIn && checkOut) {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        units = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
        if (selectedUsageUnit === "hour") {
            units = units * 24;
        }
    }
    
    const pricePerUnit = currentPropertyBasePrice + selectedUsageAdditionalPrice;
    const total = pricePerUnit * units;
    
    const summaryCheckIn = document.getElementById("summaryCheckIn");
    const summaryCheckOut = document.getElementById("summaryCheckOut");
    const summaryGuests = document.getElementById("summaryGuests");
    const unitPriceSpan = document.getElementById("unitPrice");
    const unitCountSpan = document.getElementById("unitCount");
    const totalAmountSpan = document.getElementById("totalAmount");
    
    if (summaryCheckIn && checkIn) summaryCheckIn.innerHTML = new Date(checkIn).toLocaleDateString();
    if (summaryCheckOut && checkOut) summaryCheckOut.innerHTML = new Date(checkOut).toLocaleDateString();
    if (summaryGuests) summaryGuests.innerHTML = document.getElementById('guestCount')?.textContent || "2";
    
    if (unitPriceSpan) {
        if (selectedUsageAdditionalPrice > 0) {
            unitPriceSpan.innerHTML = `${currentPropertyBasePrice.toLocaleString()} DA (base) + ${selectedUsageAdditionalPrice.toLocaleString()} DA (conversion) = ${pricePerUnit.toLocaleString()} DA / ${selectedUsageUnit}`;
        } else {
            unitPriceSpan.innerHTML = `${pricePerUnit.toLocaleString()} DA / ${selectedUsageUnit} (no conversion fee)`;
        }
    }
    
    if (unitCountSpan) {
        unitCountSpan.innerHTML = `${units} ${selectedUsageUnit}(s)`;
    }
    
    if (totalAmountSpan) {
        totalAmountSpan.innerHTML = `${total.toLocaleString()} DA`;
    }
    
    updatePaymentAmounts(total);
}

function updatePaymentAmounts(total) {
    const baridiAmount = document.getElementById("baridiAmount");
    const bankAmount = document.getElementById("bankAmount");
    
    const formattedTotal = `${total.toLocaleString()} DA`;
    if (baridiAmount) baridiAmount.innerHTML = formattedTotal;
    if (bankAmount) bankAmount.innerHTML = formattedTotal;
}

function selectPayment(type, element) {
    selectedPayment = type;
    document.querySelectorAll(".method-card").forEach((c) => c.classList.remove("selected"));
    element.classList.add("selected");
    
    document.querySelectorAll(".payment-details").forEach((d) => d.classList.add("hidden"));
    
    if (type === "card") {
        document.getElementById("payCardDetails").classList.remove("hidden");
    } else if (type === "baridimob") {
        document.getElementById("payBaridiDetails").classList.remove("hidden");
    } else if (type === "bank") {
        document.getElementById("payBankDetails").classList.remove("hidden");
    }
    
    validateStep3();
}

function formatCard(input) {
    let val = input.value.replace(/\D/g, "").substring(0, 16);
    let formatted = "";
    for (let i = 0; i < val.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += " ";
        formatted += val[i];
    }
    input.value = formatted;
}

function formatExpiry(input) {
    let val = input.value.replace(/\D/g, "").substring(0, 4);
    if (val.length >= 3) {
        val = val.substring(0, 2) + "/" + val.substring(2);
    }
    input.value = val;
}

function formatIban(input) {
    let val = input.value.replace(/\s/g, '').toUpperCase();
    val = val.replace(/[^A-Z0-9]/g, '').substring(0, 26);
    let formatted = "";
    for (let i = 0; i < val.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += " ";
        formatted += val[i];
    }
    input.value = formatted;
}

function generateContractHTML() {
    const checkIn = document.getElementById('checkInDate')?.value;
    const checkOut = document.getElementById('checkOutDate')?.value;
    const guestCount = parseInt(document.getElementById('guestCount')?.textContent) || 2;
    const totalAmount = document.getElementById('totalAmount')?.innerHTML || '0 DA';
    const contractNumber = "DREAM-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    
    const pricePerUnit = currentPropertyBasePrice + selectedUsageAdditionalPrice;
    
    const today = new Date();
    const signatureDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    let userName = "Guest";
    let userEmail = "guest@example.com";
    const session = localStorage.getItem('dreamhome_session') || sessionStorage.getItem('dreamhome_session');
    if (session) {
        try {
            const user = JSON.parse(session);
            userName = user.name || user.first_name || user.email?.split('@')[0] || "Guest";
            userEmail = user.email || "guest@example.com";
        } catch(e) {}
    }
    
    const contractNumberSpan = document.getElementById('contractNumber');
    if (contractNumberSpan) contractNumberSpan.textContent = contractNumber;
    
    const paymentMethod = selectedPayment === 'card' ? 'Credit Card' : selectedPayment === 'baridimob' ? 'BaridiMob' : 'Bank Transfer';
    
    let conversionText = '';
    if (selectedUsage === 'residence') {
        conversionText = '<p><strong>Conversion Type:</strong> No conversion - Property rented as-is</p>';
    } else {
        conversionText = `<p><strong>Conversion Type:</strong> Property converted to ${selectedUsageName}</p>
        <p><strong>Conversion Fee:</strong> ${selectedUsageAdditionalPrice.toLocaleString()} DA per night</p>`;
    }
    
    return `
        <div class="contract-section">
            <h4><i class="fas fa-file-signature"></i> 1. PARTIES</h4>
            <p><strong>Owner/Lessor:</strong> DreamHome Properties SARL, Algiers, Algeria</p>
            <p><strong>Tenant/Lessee:</strong> ${escapeHtml(userName)} (${escapeHtml(userEmail)})</p>
            <p><strong>Original Property:</strong> ${escapeHtml(propertyName)} (ID: ${propertyId})</p>
            ${conversionText}
        </div>
        
        <div class="contract-section">
            <h4><i class="fas fa-calendar-alt"></i> 2. RENTAL PERIOD</h4>
            <p><strong>Check-in Date:</strong> ${new Date(checkIn).toLocaleDateString()}</p>
            <p><strong>Check-out Date:</strong> ${new Date(checkOut).toLocaleDateString()}</p>
            <p><strong>Number of ${selectedUsageUnit}s:</strong> ${nights} ${selectedUsageUnit}(s)</p>
            <p><strong>Number of Guests:</strong> ${guestCount} person(s)</p>
        </div>
        
        <div class="contract-section">
            <h4><i class="fas fa-money-bill-wave"></i> 3. PAYMENT TERMS</h4>
            <p><strong>Base Price per ${selectedUsageUnit}:</strong> ${currentPropertyBasePrice.toLocaleString()} DA</p>
            ${selectedUsageAdditionalPrice > 0 ? `<p><strong>Conversion Fee per ${selectedUsageUnit}:</strong> ${selectedUsageAdditionalPrice.toLocaleString()} DA</p>` : ''}
            <p><strong>Total Price per ${selectedUsageUnit}:</strong> ${pricePerUnit.toLocaleString()} DA</p>
            <p><strong>Total Amount (${nights} ${selectedUsageUnit}s):</strong> ${totalAmount}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
            <div class="contract-highlight">
                <strong>Cancellation Policy:</strong> Free cancellation up to 48 hours before check-in.
            </div>
        </div>
        
        <div class="contract-section">
            <h4><i class="fas fa-gavel"></i> 4. TERMS AND CONDITIONS</h4>
            <ul>
                <li>The space is for the intended purpose only.</li>
                <li>No parties or events without written permission.</li>
                <li>Smoking is prohibited inside the space.</li>
                <li>Pets are not allowed unless authorized.</li>
                <li>Respect neighbors and keep noise minimal (10 PM - 8 AM).</li>
                <li>Report any damages immediately.</li>
                ${selectedUsage !== 'residence' ? '<li><strong>Conversion Agreement:</strong> The property will be temporarily converted to the requested space type for the duration of the booking.</li>' : ''}
            </ul>
        </div>
        
        <div class="contract-section">
            <h4><i class="fas fa-user-shield"></i> 5. LIABILITY</h4>
            <p>The Lessee assumes responsibility for all guests. DreamHome is not liable for personal belongings.</p>
        </div>
        
        <div class="contract-section">
            <h4><i class="fas fa-handshake"></i> 6. GOVERNING LAW</h4>
            <p>This contract is governed by the laws of Algeria.</p>
        </div>
        
        <div class="contract-signature-block">
            <div class="contract-signature-line">
                <p><strong>Owner/Lessor Representative</strong></p>
                <div class="signature-line">DreamHome Properties SARL</div>
                <p>Date: ${signatureDate}</p>
            </div>
            <div class="contract-signature-line">
                <p><strong>Tenant/Lessee Signature</strong></p>
                <div class="signature-line">[Electronically signed by: <span id="signaturePreview">________</span>]</div>
                <p>Date: ${signatureDate}</p>
            </div>
        </div>
    `;
}

function updateContractPreview() {
    const contractContent = document.getElementById('contractContent');
    if (contractContent) {
        contractContent.innerHTML = generateContractHTML();
        
        const signatureInput = document.getElementById('signatureName');
        const signaturePreview = document.getElementById('signaturePreview');
        if (signatureInput && signaturePreview) {
            const newSignatureInput = signatureInput.cloneNode(true);
            signatureInput.parentNode.replaceChild(newSignatureInput, signatureInput);
            
            newSignatureInput.addEventListener('input', function() {
                if (signaturePreview) {
                    signaturePreview.textContent = this.value || '________';
                }
                validateContract();
            });
        }
        
        const acceptCheckbox = document.getElementById('acceptContract');
        if (acceptCheckbox) {
            const newCheckbox = acceptCheckbox.cloneNode(true);
            acceptCheckbox.parentNode.replaceChild(newCheckbox, acceptCheckbox);
            newCheckbox.addEventListener('change', validateContract);
        }
    }
}

function validateContract() {
    const acceptCheckbox = document.getElementById('acceptContract');
    const signatureName = document.getElementById('signatureName');
    const confirmBtn = document.getElementById('btnConfirmBooking');
    
    let isValid = true;
    
    if (!acceptCheckbox || !acceptCheckbox.checked) {
        isValid = false;
    }
    
    if (!signatureName || !signatureName.value.trim() || signatureName.value.trim().length < 3) {
        isValid = false;
    }
    
    if (confirmBtn) {
        confirmBtn.disabled = !isValid;
    }
    
    return isValid;
}

function downloadContractPDF() {
    const contractNumber = document.getElementById('contractNumber')?.textContent || 'DREAM-XXXX';
    const signatureName = document.getElementById('signatureName')?.value.trim() || '[Not signed yet]';
    
    const contractHTML = generateContractHTML();
    
    const fullHtml = `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Rental Contract ${contractNumber}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Helvetica Neue', Arial, sans-serif;
                background: white;
                padding: 40px;
                color: #333;
            }
            .contract { max-width: 800px; margin: 0 auto; background: white; }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #c9a96e;
            }
            .header h1 { color: #3b2314; font-size: 24px; margin-bottom: 5px; }
            .header h2 { color: #c9a96e; font-size: 18px; font-weight: normal; }
            .section {
                margin-bottom: 20px;
                border-bottom: 1px solid #eee;
                padding-bottom: 15px;
            }
            .section h3 {
                color: #c9a96e;
                font-size: 16px;
                margin-bottom: 10px;
                border-left: 3px solid #c9a96e;
                padding-left: 10px;
            }
            .section p { margin-bottom: 8px; font-size: 13px; line-height: 1.5; }
            .highlight {
                background: #fdf8f3;
                padding: 12px;
                border-radius: 8px;
                margin: 10px 0;
                border-left: 3px solid #c9a96e;
            }
            ul { margin: 8px 0 8px 20px; }
            li { margin-bottom: 5px; font-size: 13px; }
            .signature-block {
                margin-top: 30px;
                display: flex;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 20px;
            }
            .signature-line { flex: 1; }
            .signature-line p { font-size: 12px; margin-bottom: 5px; }
            .signature-line .line {
                border-bottom: 1px solid #ccc;
                margin-top: 20px;
                padding-bottom: 5px;
            }
            .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 10px;
                color: #999;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }
        </style>
    </head>
    <body>
        <div class="contract">
            <div class="header">
                <h1>SHORT-TERM RENTAL AGREEMENT</h1>
                <h2>DreamHome Properties</h2>
                <p>Contract #: ${contractNumber}</p>
            </div>
            ${contractHTML.replace(/<div class="contract-signature-block">[\s\S]*?<\/div>/, '')}
            <div class="signature-block">
                <div class="signature-line">
                    <p><strong>Owner/Lessor Representative</strong></p>
                    <div class="line">DreamHome Properties SARL</div>
                </div>
                <div class="signature-line">
                    <p><strong>Tenant/Lessee Signature</strong></p>
                    <div class="line">${signatureName}</div>
                </div>
            </div>
            <div class="footer">
                <p>This is a legally binding contract. Please keep a copy for your records.</p>
            </div>
        </div>
    </body>
    </html>`;
    
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DreamHome_Contract_${contractNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function getCurrentUser() {
    const session = sessionStorage.getItem('dreamhome_session') || localStorage.getItem('dreamhome_session');
    if (session) {
        try {
            return JSON.parse(session);
        } catch(e) {
            return null;
        }
    }
    return null;
}

function generateBookingRef() {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `DREAM-${year}${month}${day}-${random}`;
}

function saveReservationToLocalStorage(bookingData) {
    const user = getCurrentUser();
    if (!user || !user.id) {
        console.log('No user found, cannot save locally');
        return null;
    }
    
    let existingBookings = JSON.parse(localStorage.getItem(`dreamhome_bookings_${user.id}`) || '[]');
    
    const newBooking = {
        id: Date.now(),
        booking_ref: bookingData.booking_ref,
        property_id: parseInt(bookingData.property_id),
        property_name: propertyName,
        space_type: selectedUsageName,
        conversion_type: selectedUsage,
        conversion_fee: selectedUsageAdditionalPrice,
        location: 'Annaba, Algeria',
        main_image: `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop`,
        usage_type: bookingData.usage_type || selectedUsage,
        start_date: bookingData.start_date,
        end_date: bookingData.end_date,
        number_of_days: bookingData.number_of_days,
        total_amount_dzd: bookingData.total_amount_dzd,
        total_amount: bookingData.total_amount_dzd,
        payment_method: bookingData.payment_method,
        special_requests: bookingData.special_requests,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        guests: bookingData.guests,
        price_per_unit: currentPropertyBasePrice + selectedUsageAdditionalPrice,
        base_price: currentPropertyBasePrice,
        unit_type: selectedUsageUnit
    };
    
    existingBookings.unshift(newBooking);
    localStorage.setItem(`dreamhome_bookings_${user.id}`, JSON.stringify(existingBookings));
    
    let allReservations = JSON.parse(localStorage.getItem('dreamhome_all_reservations') || '[]');
    allReservations.unshift(newBooking);
    localStorage.setItem('dreamhome_all_reservations', JSON.stringify(allReservations));
    
    console.log('✅ Reservation saved to localStorage:', newBooking);
    return newBooking;
}

async function confirmReservation() {
    const acceptCheckbox = document.getElementById("acceptContract");
    const signatureName = document.getElementById("signatureName");
    
    if (!acceptCheckbox || !acceptCheckbox.checked) {
        alert("Please accept the Rental Contract terms");
        return;
    }
    
    if (!signatureName || !signatureName.value.trim() || signatureName.value.trim().length < 3) {
        alert("Please enter your full name as electronic signature");
        return;
    }
    
    if (!selectedUsage) {
        alert("Please select a conversion type");
        return;
    }
    
    const checkIn = document.getElementById('checkInDate')?.value;
    const checkOut = document.getElementById('checkOutDate')?.value;
    
    if (!checkIn || !checkOut || checkOut <= checkIn) {
        alert("Please select valid dates");
        return;
    }
    
    const validation = validateDateRange(checkIn, checkOut);
    if (!validation.valid) {
        alert(validation.message);
        return;
    }
    
    const guestCount = parseInt(document.getElementById('guestCount')?.textContent) || 2;
    if (guestCount > currentPropertyMaxGuests) {
        alert(`⚠️ This space can only accommodate up to ${currentPropertyMaxGuests} guests.`);
        return;
    }
    
    if (!selectedPayment) {
        alert("Please select a payment method");
        return;
    }
    
    let isValid = false;
    if (selectedPayment === 'card') {
        isValid = validateCardDetails();
    } else if (selectedPayment === 'baridimob') {
        isValid = validateBaridiMobDetails();
    } else if (selectedPayment === 'bank') {
        isValid = validateBankTransferDetails();
    }
    
    if (!isValid) {
        alert("Please complete your payment details correctly");
        return;
    }
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    let units = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    if (selectedUsageUnit === "hour") {
        units = units * 24;
    }
    
    const pricePerUnit = currentPropertyBasePrice + selectedUsageAdditionalPrice;
    const total = pricePerUnit * units;
    
    let user = getCurrentUser();
    
    if (!user || !user.id) {
        alert("Please login to make a reservation");
        window.location.href = 'login.html';
        return;
    }
    
    let finalPropertyId = propertyId;
    if (!finalPropertyId || isNaN(parseInt(finalPropertyId))) {
        finalPropertyId = 1;
    }
    
    const bookingRef = generateBookingRef();
    
    const bookingData = {
        booking_ref: bookingRef,
        property_id: parseInt(finalPropertyId),
        usage_type: selectedUsage,
        start_date: checkIn,
        end_date: checkOut,
        number_of_days: units,
        total_amount_dzd: total,
        price_per_unit: pricePerUnit,
        base_price: currentPropertyBasePrice,
        conversion_fee: selectedUsageAdditionalPrice,
        unit_type: selectedUsageUnit,
        payment_method: selectedPayment,
        special_requests: document.getElementById("specialRequests")?.value || null,
        user_id: user.id,
        guests: guestCount
    };
    
    const btn = document.querySelector('.btn-confirm');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        const response = await fetch('api-bookings.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                booking_ref: bookingData.booking_ref,
                property_id: bookingData.property_id,
                user_id: bookingData.user_id,
                usage_type: bookingData.usage_type,
                start_date: bookingData.start_date,
                end_date: bookingData.end_date,
                number_of_days: bookingData.number_of_days,
                total_amount_dzd: bookingData.total_amount_dzd,
                payment_method: bookingData.payment_method,
                special_requests: bookingData.special_requests
            })
        });
        
        const result = await response.json();
        if (result.success) {
            console.log('✅ Booking saved to database with ID:', result.id);
        }
    } catch (error) {
        console.error('Error saving to API:', error);
    }
    
    saveReservationToLocalStorage(bookingData);
    
    btn.disabled = false;
    btn.innerHTML = originalText;
    
    const bookingRefElement = document.getElementById("bookingRef");
    if (bookingRefElement) bookingRefElement.innerHTML = bookingRef;
    
    const successDownloadBtn = document.getElementById("successDownloadContract");
    if (successDownloadBtn) {
        successDownloadBtn.onclick = () => downloadContractPDF();
    }
    
    showToast("✅ Booking confirmed successfully!", false);
    
    document.querySelectorAll(".step-container").forEach((s) => s.classList.remove("active-step"));
    const stepSuccess = document.getElementById("stepSuccess");
    if (stepSuccess) stepSuccess.classList.add("active-step");
    
    document.querySelectorAll(".step-progress").forEach((el) => {
        el.classList.add("completed");
        el.classList.remove("active");
    });
    
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function goToStep(step) {
    if (step === 2 && !selectedUsage) {
        alert("Please select a conversion type first");
        return;
    }
    
    if (step === 3) {
        const isValid = validateStep2();
        if (!isValid) {
            alert("Please select valid check-in and check-out dates");
            return;
        }
        updateStep3Summary();
        validateStep3();
    }
    
    if (step === 4) {
        const paymentValid = validateStep3();
        if (!paymentValid) {
            alert("Please select a payment method");
            return;
        }
        
        let paymentDetailsValid = false;
        if (selectedPayment === 'card') {
            paymentDetailsValid = validateCardDetails();
        } else if (selectedPayment === 'baridimob') {
            paymentDetailsValid = validateBaridiMobDetails();
        } else if (selectedPayment === 'bank') {
            paymentDetailsValid = validateBankTransferDetails();
        }
        
        if (!paymentDetailsValid) {
            alert("Please complete your payment details correctly");
            return;
        }
        
        updateContractPreview();
    }
    
    document.querySelectorAll(".step-container").forEach((s) => s.classList.remove("active-step"));
    const targetStep = document.getElementById(`step${step}`);
    if (targetStep) targetStep.classList.add("active-step");
    
    document.querySelectorAll(".step-progress").forEach((el, idx) => {
        if (idx + 1 <= step) {
            el.classList.add("completed");
            el.classList.remove("active");
        } else {
            el.classList.remove("completed");
            el.classList.remove("active");
        }
        if (idx + 1 === step) {
            el.classList.add("active");
        }
    });
    
    currentStep = step;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function setupRealtimeValidation() {
    const cardNumber = document.getElementById('cardNumber');
    const cardName = document.getElementById('cardName');
    const cardExpiry = document.getElementById('cardExpiry');
    const cardCvv = document.getElementById('cardCvv');
    if (cardNumber) cardNumber.addEventListener('input', () => validateCardDetails());
    if (cardName) cardName.addEventListener('input', () => validateCardDetails());
    if (cardExpiry) cardExpiry.addEventListener('input', () => validateCardDetails());
    if (cardCvv) cardCvv.addEventListener('input', () => validateCardDetails());
    
    const baridiPhone = document.getElementById('baridiPhone');
    const baridiCode = document.getElementById('baridiCode');
    if (baridiPhone) baridiPhone.addEventListener('input', () => validateBaridiMobDetails());
    if (baridiCode) baridiCode.addEventListener('input', () => validateBaridiMobDetails());
    
    const bankHolder = document.getElementById('bankHolder');
    const bankIban = document.getElementById('bankIban');
    const bankNameInput = document.getElementById('bankName');
    if (bankHolder) bankHolder.addEventListener('input', () => validateBankTransferDetails());
    if (bankIban) bankIban.addEventListener('input', () => validateBankTransferDetails());
    if (bankNameInput) bankNameInput.addEventListener('input', () => validateBankTransferDetails());
}

function setupDatePickers() {
    const checkIn = document.getElementById('checkInDate');
    const checkOut = document.getElementById('checkOutDate');
    
    if (!checkIn || !checkOut) return;
    
    checkIn.addEventListener('change', function() {
        if (this.value) {
            selectedStartDate = this.value;
            selectedEndDate = null;
            checkOut.value = '';
            renderCalendar();
            updateNightsInfo();
            validateStep2();
            updateStep3Summary();
        }
    });
    
    checkOut.addEventListener('change', function() {
        if (this.value && checkIn.value) {
            if (this.value > checkIn.value) {
                selectedEndDate = this.value;
                renderCalendar();
                updateNightsInfo();
                validateStep2();
                updateStep3Summary();
            } else {
                alert('Check-out date must be after check-in date');
                this.value = '';
            }
        }
    });
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekLater = new Date(today);
    weekLater.setDate(weekLater.getDate() + 7);
    
    checkIn.min = today.toISOString().split('T')[0];
    checkOut.min = tomorrow.toISOString().split('T')[0];
    
    checkIn.value = weekLater.toISOString().split('T')[0];
    const weekLaterPlus2 = new Date(weekLater);
    weekLaterPlus2.setDate(weekLaterPlus2.getDate() + 2);
    checkOut.value = weekLaterPlus2.toISOString().split('T')[0];
    
    selectedStartDate = checkIn.value;
    selectedEndDate = checkOut.value;
}

document.addEventListener("DOMContentLoaded", async function () {
    renderOptionsGrid();
    await fetchBookedDates(propertyId);
    
    setupDatePickers();
    initGuestSelector();
    setupRealtimeValidation();
    renderCalendar();
    updateStep3Summary();
    
    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => changeMonth(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changeMonth(1));
    
    const downloadBtn = document.getElementById('downloadContractBtn');
    if (downloadBtn) downloadBtn.addEventListener('click', downloadContractPDF);
    
    const maxGuestsHint = document.getElementById('maxGuestsHint');
    if (maxGuestsHint) {
        maxGuestsHint.textContent = `(Max: ${currentPropertyMaxGuests} guests)`;
    }
    
    document.getElementById("stepProgress1").classList.add("active");
});

window.goToStep = goToStep;
window.selectPayment = selectPayment;
window.confirmReservation = confirmReservation;
window.formatCard = formatCard;
window.formatExpiry = formatExpiry;
window.formatPhone = formatPhone;
window.formatIban = formatIban;