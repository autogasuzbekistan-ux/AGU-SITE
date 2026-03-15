// =========================================================
// AUTO GAS UZBEKISTAN — Korporativ Sayt
// Versiya: 3.0 — Faqat UI / Animatsiya
// =========================================================

// =========================================================
// LOADING SCREEN
// =========================================================

function runLoadingAnimation() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent   = document.getElementById('main-content');
    const logoWrap      = document.querySelector('.agu-logo-loader');
    const subtitle      = document.getElementById('subtitle-text-loader');

    function showMain() {
        loadingScreen.style.display = 'none';
        mainContent.style.opacity = '1';
        initFadeObserver();
    }

    if (!window.gsap) {
        showMain();
        return;
    }

    const tl = gsap.timeline();

    // Logo bloki ko'rinadi
    tl.to(logoWrap, { opacity: 1, duration: 0.01 })
    // AG chapdan, U o'ngdan keladi
      .from('#ag-loader', { x: -50, opacity: 0, duration: 0.55, ease: 'back.out(2)' })
      .from('#u-loader',  { x:  50, opacity: 0, duration: 0.55, ease: 'back.out(2)' }, '-=0.35')
      .from('#reg-loader',{ scale: 0, opacity: 0, duration: 0.3, ease: 'back.out(3)' }, '-=0.15')
    // Subtitle pastdan chiqadi
      .to(subtitle, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.1')
    // Biroz turadi, keyin silliq yo'qoladi
      .to(loadingScreen, { opacity: 0, duration: 0.55, delay: 0.7, ease: 'power2.inOut' })
      .call(() => {
          showMain();
          gsap.from(mainContent, { opacity: 0, duration: 0.4 });
      });
}

// GSAP CDN yuklanishini kutish
if (document.readyState === 'complete') {
    runLoadingAnimation();
} else {
    window.addEventListener('load', runLoadingAnimation);
}

// =========================================================
// FADE-IN ON SCROLL
// =========================================================

function initFadeObserver() {
    const fadeEls = document.querySelectorAll('.fade-in');
    if (!fadeEls.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    fadeEls.forEach(el => observer.observe(el));
}

// =========================================================
// HEADER SCROLL EFFECT
// =========================================================

window.addEventListener('scroll', () => {
    const header = document.getElementById('main-header');
    if (!header) return;
    if (window.scrollY > 50) {
        header.classList.add('header-scrolled');
    } else {
        header.classList.remove('header-scrolled');
    }
});

// =========================================================
// MOBILE MENU
// =========================================================

const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const closeMenuBtn = document.getElementById('close-menu');
const mobileOverlay = document.getElementById('mobile-overlay');

function openMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('open');
    mobileOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('open');
    mobileOverlay.classList.add('hidden');
    document.body.style.overflow = '';
}

mobileMenuBtn?.addEventListener('click', openMobileMenu);
closeMenuBtn?.addEventListener('click', closeMobileMenu);
mobileOverlay?.addEventListener('click', closeMobileMenu);

// Close menu when nav link clicked
document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
});

// =========================================================
// FAQ ACCORDION
// =========================================================

document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const answer = item.querySelector('.faq-answer');
        const isOpen = item.classList.contains('active');

        // Close all
        document.querySelectorAll('.faq-item').forEach(i => {
            i.classList.remove('active');
            i.querySelector('.faq-answer').style.maxHeight = null;
        });

        // Open clicked if it was closed
        if (!isOpen) {
            item.classList.add('active');
            answer.style.maxHeight = answer.scrollHeight + 'px';
        }
    });
});

// =========================================================
// CONTACT FORM — TELEGRAM BOT
// =========================================================

const TG_TOKEN = '8714281179:AAEdKaZeFolzivxokqLaCGkanC8hScD8-RE';
const TG_CHAT_ID = '7012145516';

const contactForm = document.getElementById('contact-form');
const formMessage = document.getElementById('form-message');
const submitBtn = contactForm?.querySelector('button[type="submit"]');

contactForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name')?.value.trim();
    const phone = document.getElementById('contact-phone')?.value.trim();
    const message = document.getElementById('contact-message')?.value.trim();

    if (!name || !phone) {
        showFormMessage('Iltimos, ism va telefon raqamini kiriting.', false);
        return;
    }

    // Tugmani bloklash
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Yuborilmoqda...';
    }

    const now = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

    const text = [
        '📩 <b>Yangi murojaat — AGU Sayt</b>',
        '',
        `👤 <b>Ism:</b> ${name}`,
        `📞 <b>Telefon:</b> ${phone}`,
        message ? `💬 <b>Xabar:</b> ${message}` : '',
        '',
        `🕐 <i>${now}</i>`,
    ].filter(Boolean).join('\n');

    try {
        const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TG_CHAT_ID,
                text,
                parse_mode: 'HTML',
            }),
        });

        const data = await res.json();

        if (data.ok) {
            showFormMessage('✅ Xabaringiz yuborildi! Tez orada siz bilan bog\'lanamiz.', true);
            contactForm.reset();
        } else {
            showFormMessage('Xatolik yuz berdi. Iltimos, telefon orqali bog\'laning.', false);
        }
    } catch {
        showFormMessage('Internet xatosi. Iltimos, qayta urinib ko\'ring.', false);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Xabar Yuborish';
        }
    }
});

function showFormMessage(text, isSuccess) {
    if (!formMessage) return;
    formMessage.textContent = text;
    formMessage.className = `mt-4 p-4 rounded-xl ${isSuccess ? 'bg-green-500/20 border border-green-400 text-green-100' : 'bg-red-500/20 border border-red-400 text-red-100'}`;
    formMessage.classList.remove('hidden');

    setTimeout(() => formMessage.classList.add('hidden'), 6000);
}

// =========================================================
// MINTAQALAR — INTERAKTIV XARITA
// =========================================================

const CITIES = [
    {
        id: 'qoqon', name: "AGU Qo'qon", x: 702, y: 300, hq: true,
        type: 'hq',
        phone: '+998 (87) 001-07-77',
        phone2: '+998 (87) 002-07-77',
        address: "Qo'qon shahar, Burkchilik ko'chasi",
        shops: 3,
        hasService: true,
        services: [
            "Metan va propan balonlarni tekshirish (laboratoriya)",
            "Gaz uskunalarini o'rnatish (2026-yildan)",
            "Konsultatsiya berish",
            "Premium metan va propan service xizmati"
        ]
    },
    {
        id: 'toshkent', name: "AGU Toshkent", x: 618, y: 248, hq: false,
        type: 'shop',
        phone: '+998 XX XXX XX XX',
        address: "Toshkent shahar",
        shops: 2
    },
    { id: 'andijon',   name: "AGU Andijon",   x: 762, y: 285, type: 'shop', hq: false, phone: '+998 XX XXX XX XX', address: "Andijon shahar", shops: 1 },
    { id: 'namangan',  name: "AGU Namangan",  x: 736, y: 268, type: 'shop', hq: false, phone: '+998 XX XXX XX XX', address: "Namangan shahar", shops: 1 },
    { id: 'guliston',  name: "AGU Guliston",  x: 588, y: 278, type: 'shop', hq: false, phone: '+998 XX XXX XX XX', address: "Guliston shahar, Sirdaryo viloyati", shops: 1 },
    { id: 'samarqand', name: "AGU Samarqand", x: 510, y: 342, type: 'shop', hq: false, phone: '+998 XX XXX XX XX', address: "Samarqand shahar", shops: 1 },
    { id: 'buxoro',    name: "AGU Buxoro",    x: 386, y: 336, type: 'shop', hq: false, phone: '+998 XX XXX XX XX', address: "Buxoro shahar", shops: 1 },
    { id: 'qarshi',    name: "AGU Qarshi",    x: 455, y: 386, type: 'shop', hq: false, phone: '+998 XX XXX XX XX', address: "Qarshi shahar, Qashqadaryo viloyati", shops: 1 },
    { id: 'denov',     name: "AGU Denov",     x: 558, y: 418, type: 'shop', hq: false, phone: '+998 XX XXX XX XX', address: "Denov shahar, Surxondaryo viloyati", shops: 1 },
    { id: 'xorazm',    name: "AGU Xorazm",   x: 210, y: 236, type: 'shop', hq: false, phone: '+998 XX XXX XX XX', address: "Urganch shahar, Xorazm viloyati", shops: 1 },
    { id: 'nukus',     name: "AGU Nukus",     x: 165, y: 190, type: 'shop', hq: false, phone: '+998 XX XXX XX XX', address: "Nukus shahar, Qoraqalpog'iston", shops: 1 },
];

// Label offset: har shahar uchun belgi ustidagi yozuv yo'nalishi
const LABEL_OFFSET = {
    qoqon:     { dx: 0,   dy: -18 },
    andijon:   { dx: 16,  dy: 0   },
    namangan:  { dx: 0,   dy: -18 },
    toshkent:  { dx: -16, dy: -18 },
    guliston:  { dx: -20, dy: 12  },
    samarqand: { dx: 0,   dy: -18 },
    buxoro:    { dx: 0,   dy: -18 },
    qarshi:    { dx: 0,   dy: -18 },
    denov:     { dx: 16,  dy: 0   },
    xorazm:    { dx: 0,   dy: -18 },
    nukus:     { dx: 0,   dy: -18 },
};

let activeCityId = null;

function buildCityMarkers() {
    const mapG = document.getElementById('city-markers');
    const panelList = document.getElementById('panel-city-list');
    if (!mapG) return;

    getActiveCities().forEach(city => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'city-marker');
        g.setAttribute('data-id', city.id);
        g.style.cursor = 'pointer';

        const color = city.hq ? '#E30613' : '#1b5bb5';
        const off = LABEL_OFFSET[city.id] || { dx: 0, dy: -18 };

        // Pulse ring
        const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pulse.setAttribute('cx', city.x);
        pulse.setAttribute('cy', city.y);
        pulse.setAttribute('r', '12');
        pulse.setAttribute('fill', color);
        pulse.setAttribute('fill-opacity', '0.2');
        pulse.innerHTML = `<animate attributeName="r" values="10;22;10" dur="2.5s" repeatCount="indefinite"/>
                           <animate attributeName="fill-opacity" values="0.3;0;0.3" dur="2.5s" repeatCount="indefinite"/>`;

        // Main circle (pin)
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', city.x);
        circle.setAttribute('cy', city.y);
        circle.setAttribute('r', city.hq ? '10' : '8');
        circle.setAttribute('fill', color);
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('filter', 'url(#pin-glow)');

        // HQ star
        if (city.hq) {
            const star = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            star.setAttribute('x', city.x);
            star.setAttribute('y', city.y + 4);
            star.setAttribute('text-anchor', 'middle');
            star.setAttribute('font-size', '10');
            star.setAttribute('fill', 'white');
            star.textContent = '★';
            g.appendChild(star);
        }

        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', city.x + off.dx);
        label.setAttribute('y', city.y + off.dy);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '9');
        label.setAttribute('font-weight', 'bold');
        label.setAttribute('fill', color);
        label.setAttribute('font-family', 'Arial, sans-serif');
        label.setAttribute('paint-order', 'stroke');
        label.setAttribute('stroke', 'white');
        label.setAttribute('stroke-width', '3');
        label.textContent = city.name;

        g.appendChild(pulse);
        g.appendChild(circle);
        g.appendChild(label);
        mapG.appendChild(g);

        // Click handler
        g.addEventListener('click', () => {
            setActiveCity(city.id);
            showCityCard(city);
        });

        // Panel list item
        if (panelList) {
            const btn = document.createElement('button');
            btn.className = 'panel-city-item';
            btn.setAttribute('data-city-id', city.id);
            btn.innerHTML = `
                <span class="panel-city-dot" style="background:${color};"></span>
                <span class="panel-city-name">${city.name}</span>
                ${city.shops && city.shops > 1 ? `<span class="panel-city-branches">${city.shops} do'kon</span>` : ''}
                ${city.hasService ? `<span class="panel-city-branches" style="background:#dcfce7;color:#166534;">service</span>` : ''}
            `;
            btn.addEventListener('click', () => {
                setActiveCity(city.id);
                showCityCard(city);
            });
            panelList.appendChild(btn);
        }
    });

    // Search filter
    const searchInput = document.getElementById('city-search');
    searchInput?.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        const items = panelList?.querySelectorAll('.panel-city-item');
        let anyVisible = false;
        items?.forEach(item => {
            const id = item.getAttribute('data-city-id');
            const city = CITIES.find(c => c.id === id);
            const match = !q || city.name.toLowerCase().includes(q) || city.address.toLowerCase().includes(q);
            item.style.display = match ? '' : 'none';
            if (match) anyVisible = true;
        });
        // Show/hide no-results
        let noRes = panelList?.querySelector('.panel-no-results');
        if (!anyVisible) {
            if (!noRes) {
                noRes = document.createElement('p');
                noRes.className = 'panel-no-results';
                noRes.textContent = 'Topilmadi';
                panelList.appendChild(noRes);
            }
            noRes.style.display = '';
        } else if (noRes) {
            noRes.style.display = 'none';
        }
    });
}

function setActiveCity(id) {
    activeCityId = id;
    // Update panel items
    document.querySelectorAll('.panel-city-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-city-id') === id);
    });
}

function showCityCard(city) {
    const card = document.getElementById('city-card');
    if (!card) return;

    const color = city.hq ? '#E30613' : '#1b5bb5';

    document.getElementById('city-card-badge').style.background = color;
    document.getElementById('city-card-badge').textContent = city.hq ? '★ Bosh ofis' : 'Savdo do\'koni';
    document.getElementById('city-card-name').textContent = city.name;
    document.getElementById('city-card-phone').innerHTML =
        city.phone + (city.phone2 ? `<br><a href="tel:${city.phone2.replace(/\D/g,'')}" style="color:inherit">${city.phone2}</a>` : '');
    document.getElementById('city-card-address').textContent = city.address;

    // Do'konlar soni va service
    const branchEl = document.getElementById('city-card-branches');
    if (branchEl) {
        const shopCount = city.shops || 1;
        const parts = [];
        if (shopCount > 1) parts.push(`${shopCount} ta do'kon`);
        if (city.hasService) parts.push('+ service markazi');
        if (parts.length) {
            branchEl.textContent = parts.join(' ');
            branchEl.classList.remove('hidden');
        } else {
            branchEl.classList.add('hidden');
        }
    }

    // Xizmatlar
    const servEl = document.getElementById('city-card-services');
    if (servEl) {
        if (city.services && city.services.length) {
            servEl.innerHTML = city.services.map(s => `<li>• ${s}</li>`).join('');
            servEl.parentElement.classList.remove('hidden');
        } else {
            servEl.parentElement?.classList.add('hidden');
        }
    }

    card.classList.remove('hidden');
}

document.getElementById('city-card-close')?.addEventListener('click', () => {
    document.getElementById('city-card')?.classList.add('hidden');
});

// Build markers on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildCityMarkers);
} else {
    buildCityMarkers();
}

// =========================================================
// HAMKOR BRANDLAR — PARTNERS CAROUSEL
// =========================================================

const PARTNERS = [
    // ── TURKIYA ──────────────────────────────────────────
    {
        name: 'ATIKER', flag: '🇹🇷', country: 'Turkiya', countryColor: '#E30613',
        city: 'Konya, Turkiya',
        products: ['LPG/CNG to\'liq konversiya to\'plamlari', 'Ketma-ket inyeksiya tizimi', 'ECU boshqaruv bloki', 'Bug\'latgich-reduktorlar', 'LPG injektorlar va rampalar'],
        desc: 'ATIKER Otomotiv A.Ş. — Turkiyaning eng yirik va mashhur LPG/CNG uskunalari ishlab chiqaruvchisi. 1980-yillardan buyon 50+ mamlakatga eksport qiladi.',
        search: 'ATIKER auto gas',
    },
    {
        name: 'SAKA', flag: '🇹🇷', country: 'Turkiya', countryColor: '#E30613',
        city: 'Turkiya',
        products: ['LPG vaporizer (bug\'latgich)', 'Bosim regulyatorlari', 'LPG reduktorlar', 'Gaz filtrlari'],
        desc: 'SAKA — yuqori sifatli LPG bug\'latgich va reduktor tizimlari ishlab chiqaruvchisi. Avtomobil gaz uskunalari sohasida ishonchli turkiya brendi.',
        search: 'SAKA LPG auto gas',
    },
    {
        name: 'FESA', flag: '🇹🇷', country: 'Turkiya', countryColor: '#E30613',
        city: 'Turkiya',
        products: ['LPG injektorlar', 'Inyeksiya rampalari (rail)', 'Gaz filtrlari', 'Bosim sensorlari'],
        desc: 'FESA — LPG ketma-ket inyeksiya tizimi uchun yuqori aniqlikdagi injektorlar va rampalar ishlab chiqaruvchi turkiya kompaniyasi.',
        search: 'FESA LPG auto gas',
    },
    {
        name: 'ALBIEN', flag: '🇹🇷', country: 'Turkiya', countryColor: '#E30613',
        city: 'Turkiya',
        products: ['LPG avtomobil uskunalari', 'Konversiya to\'plamlari', 'Gaz armaturalari'],
        desc: 'ALBIEN — avtomobil LPG uskunalari sohasida tajribali turkiya ishlab chiqaruvchisi. Markaziy Osiyo bozorida keng tarqalgan.',
        search: 'ALBIEN LPG auto gas',
    },
    {
        name: 'TORELLI', flag: '🇹🇷', country: 'Turkiya', countryColor: '#E30613',
        city: 'Turkiya',
        products: ['Silindrli LPG ballonlar', 'Toroidal (halqasimon) ballonlar', 'Tank klapanlari', 'Multivalve'],
        desc: 'TORELLI — avtomobil LPG ballonlari (silindrli va toroidal) hamda armatura ishlab chiqaruvchi brend. ECE R67 standartiga sertifikatlangan.',
        search: 'TORELLI LPG balloon auto gas',
    },
    {
        name: 'STEP', flag: '🇹🇷', country: 'Turkiya', countryColor: '#E30613',
        city: 'Turkiya',
        products: ['LPG boshqaruv modullari', 'Gaz boshlash tizimlari', 'Solenoyd klapanlar', 'Elektron komponentlar'],
        desc: 'STEP — LPG avtomobil tizimining elektron boshqaruv va kommutatsiya komponentlarini ishlab chiqaruvchi turkiya kompaniyasi.',
        search: 'STEP LPG auto gas',
    },

    // ── ITALIYA ───────────────────────────────────────────
    {
        name: 'ALEX OPTIMA', flag: '🇮🇹', country: 'Italiya', countryColor: '#1b5bb5',
        city: 'Modena, Italiya',
        products: ['Ketma-ket LPG inyeksiya tizimi', 'AEB ECU boshqaruv bloki', 'LPG inyektorlar', 'OBD diagnostika moduli'],
        desc: 'Alex Optima (AEB Group) — Italiyaning Modena shahridagi zamonaviy LPG ketma-ket inyeksiya tizimlari ishlab chiqaruvchisi. Butun dunyo bo\'ylab 80+ davlatga eksport qiladi.',
        search: 'AEB Alex Optima LPG auto gas',
    },
    {
        name: 'LAVATO', flag: '🇮🇹', country: 'Italiya', countryColor: '#1b5bb5',
        city: 'Ferrara, Italiya',
        products: ['LPG ketma-ket inyeksiya', 'CNG konversiya to\'plamlari', 'Reduktorlar', 'Tank bosim sensori'],
        desc: 'Landi Lavato — Italiyaning Ferrara shahridagi eng qadimiy LPG brendi (1954-yildan). Birinchi LPG ketma-ket inyeksiya tizimini ishlab chiqqan kompaniya.',
        search: 'Landi Lavato LPG auto gas',
    },
    {
        name: 'RAIL', flag: '🇮🇹', country: 'Italiya', countryColor: '#1b5bb5',
        city: 'Italiya',
        products: ['LPG inyeksiya rampalari', 'Yuqori aniqlikdagi injektorlar', 'Gaz filtrlari'],
        desc: 'RAIL — italiya ishlab chiqaruvchisi, LPG ketma-ket inyeksiya uchun yuqori sifatli rampalar va injektorlar tayyorlaydi.',
        search: 'RAIL LPG injector auto gas',
    },
    {
        name: 'TAMOSETTE', flag: '🇮🇹', country: 'Italiya', countryColor: '#1b5bb5',
        city: 'Italiya',
        products: ['LPG inyektor nozzles', 'Plastik inyeksiya komponentlari', 'Gaz filtrlari'],
        desc: 'TAMOSETTE — LPG inyeksiya tizimi uchun yuqori sifatli nozzle va injektorlar ishlab chiqaruvchi italiya kompaniyasi.',
        search: 'TAMOSETTE LPG nozzle auto gas',
    },

    // ── NIDERLANDIYA ──────────────────────────────────────
    {
        name: 'PRINS', flag: '🇳🇱', country: 'Niderlandiya', countryColor: '#1b5bb5',
        city: 'Eindhoven, Niderlandiya',
        products: ['VSI — Bug\'simon inyeksiya tizimi', 'VSI-2.0 — Zamonaviy LPG', 'DI — To\'g\'ridan-to\'g\'ri inyeksiya', 'ECU va kalibrovka dasturi'],
        desc: 'PRINS Autogassystemen — Gollandiyaning Eindhoven shahridagi yetakchi LPG ishlab chiqaruvchisi. VSI (Vapour Sequential Injection) tizimini ixtiro qilgan kompaniya. 30+ yillik tajriba.',
        search: 'PRINS VSI LPG auto gas',
    },

    // ── POLSHA ────────────────────────────────────────────
    {
        name: 'FAGUMIT', flag: '🇵🇱', country: 'Polsha', countryColor: '#1b5bb5',
        city: 'Połaniec, Polsha',
        products: ['LPG bug\'latgich-reduktorlar', 'Bosim regulyatorlari', 'Menbranali reduktorlar'],
        desc: 'FAGUMIT — Polshaning Połaniec shahridagi LPG bug\'latgich va reduktor ishlab chiqaruvchisi. Barqaror sifat va arzon narxi bilan tanilgan.',
        search: 'FAGUMIT LPG reducer auto gas',
    },
    {
        name: 'SZAJA', flag: '🇵🇱', country: 'Polsha', countryColor: '#1b5bb5',
        city: 'Polsha',
        products: ['LPG starter modullari', 'Klapan boshqaruv tizimlari', 'Elektron kommutatorlar'],
        desc: 'SZAJA — LPG boshqaruv va starterlar sohasida ixtisoslashgan polsha kompaniyasi. Sodda va ishonchli elektronika bilan mashhur.',
        search: 'SZAJA LPG auto gas',
    },

    // ── YEVROPA (BOSHQA) ──────────────────────────────────
    {
        name: 'GREENGAS', flag: '🇪🇺', country: 'Yevropa', countryColor: '#1b5bb5',
        city: 'Yevropa',
        products: ['CNG/LPG uskunalari', 'Yashil energiya echimlari', 'Kompozit tsilindrlar'],
        desc: 'GREENGAS — CNG va LPG texnologiyalari asosida yashil transport yechimlarini taqdim etuvchi yevropa kompaniyasi.',
        search: 'GREENGAS CNG LPG auto gas',
    },

    // ── BELARUS ───────────────────────────────────────────
    {
        name: 'NOVOZGAZ', flag: '🇧🇾', country: 'Belarus', countryColor: '#166534',
        city: 'Belarus',
        products: ['LPG avtomobil reduktorlari', 'Gaz solenoyd klapanlari', 'Menbranali reduktorlar'],
        desc: 'NOVOZGAZ — Belarus ishlab chiqaruvchisi, avtomobil LPG reduktor va boshqaruv klapanlari tayyorlaydi. MDH mamlakatlarida keng tarqalgan.',
        search: 'NOVOZGAZ LPG auto gas Belarus',
    },
    {
        name: 'CVETLIT', flag: '🇧🇾', country: 'Belarus', countryColor: '#166534',
        city: 'Belarus',
        products: ['Po\'lat LPG tsilindrlar', 'Kompozit CNG tsilindrlar', 'Tank klapanlari', 'Gaz quvurlari'],
        desc: 'CVETLIT — Belarus metall va kompozit material ishlab chiqaruvchisi. CNG va LPG tsilindrlar, armatura va gaz quvurlari sohasida ixtisoslashgan.',
        search: 'CVETLIT CNG cylinder auto gas Belarus',
    },

    // ── XITOY ─────────────────────────────────────────────
    {
        name: 'ANHUI', flag: '🇨🇳', country: 'Xitoy', countryColor: '#c41e3a',
        city: 'Anhui viloyati, Xitoy',
        products: ['CNG po\'lat tsilindrlar (Tip-1)', 'Kompozit CNG tsilindrlar (Tip-2, Tip-3)', 'Yuqori bosimli ballonlar (200-300 bar)'],
        desc: 'Anhui viloyati Xitoyning CNG tsilindr ishlab chiqarishda yetakchi hududlaridan biri. ISO 11439 va ECE R110 standartlariga sertifikatlangan silindrlar.',
        search: 'Anhui CNG cylinder auto gas China',
    },
    {
        name: 'ANHUI DAPAN', flag: '🇨🇳', country: 'Xitoy', countryColor: '#c41e3a',
        city: 'Anhui viloyati, Xitoy',
        products: ['CNG uskunalar to\'plami', 'Gaz bosim regulyatorlari', 'CNG tsilindr klapanlari', 'Bosim ko\'rsatgichlari'],
        desc: 'Anhui Dapan Industrial — CNG va LPG uskunalari ishlab chiqaruvchi xitoy kompaniyasi. Keng assortiment va raqobatbardosh narxlar bilan tanilgan.',
        search: 'Anhui Dapan CNG auto gas China',
    },
    {
        name: 'TIANEN', flag: '🇨🇳', country: 'Xitoy', countryColor: '#c41e3a',
        city: 'Tianjin, Xitoy',
        products: ['Yuqori bosimli CNG tsilindrlar', 'Po\'lat va alyuminiy tsilindrlar', 'Klapan va fitinglar'],
        desc: 'Tianjin area CNG tsilindr ishlab chiqaruvchisi. Avtomobil va sanoat uchun yuqori bosimga chidamli tsilindrlar tayyorlaydi.',
        search: 'Tianen CNG cylinder auto gas Tianjin',
    },
    {
        name: 'YONH NUO', flag: '🇨🇳', country: 'Xitoy', countryColor: '#c41e3a',
        city: 'Xitoy',
        products: ['CNG tsilindr klapanlari', 'Yuqori bosimli fitinglar', 'Gaz to\'ldirish klapanlari', 'Xavfsizlik ventillari'],
        desc: 'YONH NUO — CNG tizimi uchun klapan va fitinglar ishlab chiqaruvchi xitoy kompaniyasi. ISO 9001 sertifikatiga ega.',
        search: 'Yonh Nuo CNG valve auto gas China',
    },
    {
        name: 'SINOMA', flag: '🇨🇳', country: 'Xitoy', countryColor: '#c41e3a',
        city: 'Xitoy',
        products: ['Karbon tolali CNG tsilindrlar (Tip-4)', 'Kompozit yuqori bosim ballonlari', 'Yengil va mustahkam konstruksiya'],
        desc: 'SINOMA (China National Materials Corp.) — kompozit material sohasidagi Xitoy davlat korxonasi. Eng yengil va mustahkam CNG tsilindrlar ishlab chiqaradi.',
        search: 'SINOMA CNG composite cylinder China',
    },
];

// =========================================================
// ADMIN OVERRIDES — localStorage integration
// =========================================================

function getActiveBrands() {
    try {
        const stored = localStorage.getItem('agu_brands_override');
        if (!stored) return PARTNERS;
        const overrides = JSON.parse(stored);
        return PARTNERS.map(p => {
            const ov = overrides.find(o => o.name === p.name);
            return ov ? Object.assign({}, p, ov) : p;
        });
    } catch (e) { return PARTNERS; }
}

function getActiveCities() {
    try {
        const stored = localStorage.getItem('agu_cities_override');
        if (!stored) return CITIES;
        const overrides = JSON.parse(stored);
        return CITIES.map(c => {
            const ov = overrides.find(o => o.id === c.id);
            return ov ? Object.assign({}, c, ov) : c;
        });
    } catch (e) { return CITIES; }
}

function buildBrandsCarousel() {
    const track = document.getElementById('brands-track');
    if (!track) return;
    const activeBrands = getActiveBrands();

    // Render cards twice for seamless infinite loop
    [0, 1].forEach(() => {
        activeBrands.forEach(p => {
            const card = document.createElement('div');
            card.className = 'brand-card';
            const initials = p.name.replace(/[^A-Z0-9]/g, '').substring(0, 3) || p.name.substring(0, 3).toUpperCase();
            const logoHtml = p.logo
                ? `<img src="${p.logo}" style="width:52px;height:52px;object-fit:contain;border-radius:12px;margin:0 auto 8px;display:block;border:1.5px solid #e2e8f0;" alt="${p.name}">`
                : `<div class="brand-lm" style="background:linear-gradient(135deg,${p.countryColor}1a 0%,${p.countryColor}33 100%);border:2px solid ${p.countryColor}44;"><span style="color:${p.countryColor};font-weight:900;font-size:0.82rem;letter-spacing:-0.3px;">${initials}</span></div>`;
            card.innerHTML = `
                ${logoHtml}
                <span class="brand-card-flag">${p.flag}</span>
                <div class="brand-card-name">${p.name}</div>
                <span class="brand-card-country" style="background:${p.countryColor};">${p.country}</span>
                <div class="brand-card-products">${p.products[0]}</div>
            `;
            card.addEventListener('click', () => openBrandModal(p));
            track.appendChild(card);
        });
    });
}

function openBrandModal(p) {
    const modal = document.getElementById('brand-modal');
    const body  = document.getElementById('brand-modal-body');
    if (!modal || !body) return;

    const logoEl = p.logo
        ? `<img src="${p.logo}" style="width:64px;height:64px;object-fit:contain;border-radius:14px;border:2px solid #e2e8f0;flex-shrink:0;" alt="${p.name}">`
        : `<span style="font-size:2.5rem;">${p.flag}</span>`;
    body.innerHTML = `
        <div class="flex items-start gap-4 mb-5">
            ${logoEl}
            <div>
                <h3 style="font-size:1.5rem;font-weight:800;color:var(--dark-gray);margin:0 0 4px;">${p.name}</h3>
                <span style="background:${p.countryColor};color:white;font-size:0.7rem;font-weight:700;padding:3px 10px;border-radius:20px;">${p.country}</span>
                <span style="color:#9ca3af;font-size:0.75rem;margin-left:8px;">📍 ${p.city}</span>
            </div>
        </div>
        <p style="color:#4b5563;font-size:0.9rem;line-height:1.7;margin-bottom:16px;">${p.desc}</p>
        <div style="background:#f8fafc;border-radius:12px;padding:14px 16px;margin-bottom:16px;">
            <div style="font-size:0.75rem;font-weight:700;color:var(--dark-gray);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">Mahsulotlar</div>
            <ul style="margin:0;padding:0;list-style:none;">
                ${p.products.map(pr => `<li style="font-size:0.82rem;color:#374151;padding:4px 0;border-bottom:1px solid #e5e7eb;">
                    <span style="color:${p.countryColor};margin-right:6px;">▸</span>${pr}
                </li>`).join('')}
            </ul>
        </div>
        <div style="background:#eff6ff;border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:8px;">
            <span style="font-size:1rem;">🔍</span>
            <div>
                <div style="font-size:0.65rem;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Qidiruv uchun</div>
                <div style="font-size:0.8rem;color:var(--primary-blue);font-weight:700;">"${p.search}"</div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

document.getElementById('brand-modal-close')?.addEventListener('click', () => {
    document.getElementById('brand-modal')?.classList.add('hidden');
    document.body.style.overflow = '';
});

document.getElementById('brand-modal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('brand-modal')) {
        document.getElementById('brand-modal').classList.add('hidden');
        document.body.style.overflow = '';
    }
});

// Build carousel on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildBrandsCarousel);
} else {
    buildBrandsCarousel();
}

// =========================================================
// SMOOTH SCROLL FOR NAV LINKS
// =========================================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const headerHeight = document.getElementById('main-header')?.offsetHeight || 80;
        const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({ top, behavior: 'smooth' });
    });
});

// =========================================================
// ACTIVE NAV LINK HIGHLIGHT ON SCROLL
// =========================================================

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    const headerHeight = document.getElementById('main-header')?.offsetHeight || 80;

    sections.forEach(section => {
        if (window.pageYOffset >= section.offsetTop - headerHeight - 20) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('text-blue-600', 'font-bold');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('text-blue-600', 'font-bold');
        }
    });
});
