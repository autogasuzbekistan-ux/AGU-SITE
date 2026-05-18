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
      .fromTo(subtitle, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.1')
    // Biroz turadi, keyin silliq yo'qoladi
      .to(loadingScreen, { opacity: 0, duration: 0.55, delay: 0.7, ease: 'power2.inOut' })
      .call(() => {
          showMain();
          gsap.from(mainContent, { opacity: 0, duration: 0.4 });
      });
}

// GSAP CDN yuklanishini kutish — faqat asosiy sahifada ishlaydi
if (document.getElementById('loading-screen')) {
    if (document.readyState === 'complete') {
        runLoadingAnimation();
    } else {
        window.addEventListener('load', runLoadingAnimation);
    }
}
// Xavfsizlik: 4 soniyadan keyin asosiy kontent har holda ko'rinsin
(function() {
    var mc = document.getElementById('main-content');
    if (!mc) return;
    setTimeout(function() {
        if (mc.style.opacity !== '1') {
            mc.style.opacity = '1';
            var ls = document.getElementById('loading-screen');
            if (ls) ls.style.display = 'none';
            if (typeof initFadeObserver === 'function') initFadeObserver();
        }
    }, 4000);
})();

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
        lat: 40.5288, lng: 70.9428,
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
        lat: 41.2995, lng: 69.2401,
        type: 'shop',
        phone: '+998 XX XXX XX XX',
        address: "Toshkent shahar",
        shops: 2
    },
    { id: 'andijon',   name: "AGU Andijon",   x: 762, y: 285, lat: 40.7829, lng: 72.3442, type: 'shop', hq: false, phone: '+998 XX XXX XX XX', address: "Andijon shahar", shops: 1 },
    { id: 'namangan',  name: "AGU Namangan",  x: 736, y: 268, lat: 41.0011, lng: 71.6723, type: 'shop', hq: false, phone: '+998 XX XXX XX XX', address: "Namangan shahar", shops: 1 },
    { id: 'guliston',  name: "AGU Guliston",  x: 588, y: 278, lat: 40.4900, lng: 68.7800, type: 'shop', hq: false, phone: '+998 XX XXX XX XX', address: "Guliston shahar, Sirdaryo viloyati", shops: 1 },
    { id: 'samarqand', name: "AGU Samarqand", x: 510, y: 342, lat: 39.6542, lng: 66.9597, type: 'shop', hq: false, phone: '+998 XX XXX XX XX', address: "Samarqand shahar", shops: 1 },
    { id: 'buxoro',    name: "AGU Buxoro",    x: 386, y: 336, lat: 39.7747, lng: 64.4286, type: 'shop', hq: false, phone: '+998 XX XXX XX XX', address: "Buxoro shahar", shops: 1 },
    { id: 'qarshi',    name: "AGU Qarshi",    x: 455, y: 386, lat: 38.8610, lng: 65.7881, type: 'shop', hq: false, phone: '+998 XX XXX XX XX', address: "Qarshi shahar, Qashqadaryo viloyati", shops: 1 },
    { id: 'denov',     name: "AGU Denov",     x: 558, y: 418, lat: 38.2759, lng: 67.8900, type: 'shop', hq: false, phone: '+998 XX XXX XX XX', address: "Denov shahar, Surxondaryo viloyati", shops: 1 },
    { id: 'xorazm',    name: "AGU Xorazm",   x: 210, y: 236, lat: 41.5500, lng: 60.6400, type: 'shop', hq: false, phone: '+998 XX XXX XX XX', address: "Urganch shahar, Xorazm viloyati", shops: 1 },
    { id: 'nukus',     name: "AGU Nukus",     x: 165, y: 190, lat: 42.4600, lng: 59.6000, type: 'shop', hq: false, phone: '+998 XX XXX XX XX', address: "Nukus shahar, Qoraqalpog'iston", shops: 1 },
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

function getActiveCities() {  // legacy alias — kept for external compatibility
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
                ? `<img src="${p.logo}" style="width:96px;height:96px;object-fit:contain;border-radius:14px;margin:0 auto 10px;display:block;" alt="${p.name}">`
                : `<div class="brand-lm" style="background:linear-gradient(135deg,${p.countryColor}1a 0%,${p.countryColor}33 100%);"><span style="color:${p.countryColor};font-weight:900;font-size:0.9rem;letter-spacing:-0.3px;">${initials}</span></div>`;
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

// =========================================================
// KUN MAHSULOTLARI — DAILY PRODUCTS
// =========================================================

const DEFAULT_DAILY_PRODUCTS = [
    {
        id: 1, featured: true, icon: '⛽',
        name: "ATIKER LPG To'liq O'rnatish To'plami",
        brand: 'ATIKER (Turkiya)',
        desc: "Zamonaviy ketma-ket inyeksiya tizimi. ECU boshqaruv bloki, bug'latgich, injektorlar — barchasi komplekt.",
        priceFrom: "1 200 000", unit: "so'm",
        tag: "Eng mashhur"
    },
    {
        id: 2, icon: '🔧',
        name: "PRINS VSI 2.0 LPG Tizimi",
        brand: 'PRINS (Gollandiya)',
        desc: "Yevropa standartidagi yuqori samarali vapour sequential injection tizimi.",
        priceFrom: "2 200 000", unit: "so'm",
        tag: "Premium"
    },
    {
        id: 3, icon: '🛢',
        name: "CNG Tsilindr Kompozit 70L",
        brand: 'SINOMA (Xitoy)',
        desc: "Karbon tolali engil tsilindr. ISO 11439 va ECE R110 sertifikatlangan.",
        priceFrom: "850 000", unit: "so'm",
        tag: "Iqtisodiy"
    },
    {
        id: 4, icon: '⚙️',
        name: "FAGUMIT LPG Reduktor",
        brand: 'FAGUMIT (Polsha)',
        desc: "Ishonchli menbranali reduktor, barqaror bosim regulyatsiyasi, uzoq xizmat muddati.",
        priceFrom: "280 000", unit: "so'm",
        tag: null
    }
];

function renderDailyProducts() {
    const grid = document.getElementById('daily-products-grid');
    if (!grid) return;

    let products;
    try {
        products = JSON.parse(localStorage.getItem('agu_daily_products')) || DEFAULT_DAILY_PRODUCTS;
    } catch (e) {
        products = DEFAULT_DAILY_PRODUCTS;
    }
    if (!products || !products.length) { grid.innerHTML = ''; return; }

    const featured = products.find(p => p.featured) || products[0];
    const rest     = products.filter(p => p !== featured).slice(0, 3);

    const tagHtml = (tag, cls) => tag
        ? `<span class="dp-tag ${cls || ''}">${tag}</span>`
        : '';

    const price = p => p.priceFrom || p.price || '';

    const featuredHtml = `
        <div class="daily-featured">
            ${featured.img ? `<img src="${featured.img}" style="width:100%;max-height:160px;object-fit:cover;border-radius:12px;margin-bottom:12px;" alt="${featured.name}">` : `<div class="dp-icon">${featured.icon || '📦'}</div>`}
            ${tagHtml(featured.tag, 'dp-tag-featured')}
            <div class="dp-name">${featured.name}</div>
            <div class="dp-brand">${featured.brand}</div>
            <div class="dp-desc">${featured.desc}</div>
            <div class="dp-price">
                <span class="dp-from">dan </span>
                <span class="dp-amount">${price(featured)} ${featured.unit || ''}</span>
            </div>
            <a href="#contact" class="dp-cta">Buyurtma berish &#8594;</a>
        </div>`;

    const cardsHtml = `<div class="daily-cards">${
        rest.map(p => `
            <div class="dp-card">
                ${p.tag ? `<span class="dp-card-badge">${p.tag}</span>` : ''}
                ${p.img ? `<img src="${p.img}" style="width:100%;height:90px;object-fit:cover;border-radius:10px;margin-bottom:8px;" alt="${p.name}">` : `<div class="dp-card-icon">${p.icon || '📦'}</div>`}
                <div class="dp-card-body">
                    <div class="dp-card-name">${p.name}</div>
                    <div class="dp-card-brand">${p.brand}</div>
                    <div class="dp-card-desc">${p.desc}</div>
                    <div class="dp-card-price">dan ${price(p)} ${p.unit || ''}</div>
                    <a href="#contact" class="dp-card-cta">Bog&#8217;lanish &#8594;</a>
                </div>
            </div>`
        ).join('')
    }</div>`;

    grid.innerHTML = featuredHtml + cardsHtml;
}

// =========================================================
// SVG INTERAKTIV XARITA — tashqi CDN talab qilmaydi
// =========================================================

function _getActiveCitiesSvg() {
    try {
        var overrides = JSON.parse(localStorage.getItem('agu_cities_override')) || [];
        return CITIES.map(function(c) {
            var ov = overrides.find(function(o) { return o.id === c.id; });
            return ov ? Object.assign({}, c, ov) : Object.assign({}, c);
        });
    } catch (e) { return CITIES.slice(); }
}

function buildSvgMap(svgId, cardId) {
    var svgEl = document.getElementById(svgId);
    var markersG = svgEl && svgEl.querySelector('g[id^="city-markers"]');
    if (!markersG) return;

    var cities = _getActiveCitiesSvg();
    var ns = 'http://www.w3.org/2000/svg';

    cities.forEach(function(city) {
        var cx = city.x, cy = city.y;
        var isHQ  = !!city.hq;
        var isSvc = !!city.hasService;
        var color = isHQ ? '#ef4444' : '#3b82f6';
        var r     = isHQ ? 11 : 9;

        var g = document.createElementNS(ns, 'g');
        g.setAttribute('class', 'city-pin');
        g.setAttribute('data-id', city.id);
        g.style.cursor = 'pointer';

        // Pulse halqa
        var pulse = document.createElementNS(ns, 'circle');
        pulse.setAttribute('cx', cx); pulse.setAttribute('cy', cy);
        pulse.setAttribute('r', String(r + 4));
        pulse.setAttribute('fill', color);
        pulse.setAttribute('fill-opacity', '0.2');
        pulse.setAttribute('pointer-events', 'none');
        var anim1 = document.createElementNS(ns, 'animate');
        anim1.setAttribute('attributeName', 'r');
        anim1.setAttribute('values', (r+2) + ';' + (r+14) + ';' + (r+2));
        anim1.setAttribute('dur', '2.4s');
        anim1.setAttribute('repeatCount', 'indefinite');
        var anim2 = document.createElementNS(ns, 'animate');
        anim2.setAttribute('attributeName', 'fill-opacity');
        anim2.setAttribute('values', '0.25;0;0.25');
        anim2.setAttribute('dur', '2.4s');
        anim2.setAttribute('repeatCount', 'indefinite');
        pulse.appendChild(anim1);
        pulse.appendChild(anim2);

        // Asosiy doira
        var circle = document.createElementNS(ns, 'circle');
        circle.setAttribute('cx', cx); circle.setAttribute('cy', cy);
        circle.setAttribute('r', r);
        circle.setAttribute('fill', color);
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '2.5');
        circle.setAttribute('filter', svgId === 'uzbek-map' ? 'url(#pin-shadow)' : 'url(#pin-shadow2)');

        // Markaz belgisi
        var sym = document.createElementNS(ns, 'text');
        sym.setAttribute('x', cx); sym.setAttribute('y', cy + 4);
        sym.setAttribute('text-anchor', 'middle');
        sym.setAttribute('font-size', isHQ ? '9' : '7');
        sym.setAttribute('fill', 'white');
        sym.setAttribute('font-weight', '900');
        sym.setAttribute('pointer-events', 'none');
        sym.textContent = isHQ ? '\u2605' : (isSvc ? '\u2692' : '\u25CF');

        // Shahar nomi
        var off = LABEL_OFFSET[city.id] || { dx: 0, dy: -16 };
        var lbl = document.createElementNS(ns, 'text');
        lbl.setAttribute('x', cx + off.dx);
        lbl.setAttribute('y', cy + off.dy);
        lbl.setAttribute('text-anchor', 'middle');
        lbl.setAttribute('font-size', '9');
        lbl.setAttribute('font-weight', '800');
        lbl.setAttribute('fill', '#0f172a');
        lbl.setAttribute('font-family', 'system-ui, sans-serif');
        lbl.setAttribute('paint-order', 'stroke');
        lbl.setAttribute('stroke', 'white');
        lbl.setAttribute('stroke-width', '3');
        lbl.setAttribute('pointer-events', 'none');
        lbl.textContent = city.name;

        g.appendChild(pulse);
        g.appendChild(circle);
        g.appendChild(sym);
        g.appendChild(lbl);
        markersG.appendChild(g);

        // Klik — city card ko'rsatish
        g.addEventListener('click', function(e) {
            e.stopPropagation();
            _svgSetActive(svgId, city.id);
            if (cardId) _showSvgCard(cardId, city, color);
        });
    });

    // SVG fonga bos — cardni yop
    svgEl.addEventListener('click', function() {
        if (cardId) {
            var card = document.getElementById(cardId);
            if (card) card.classList.add('hidden');
        }
    });
}

function _svgSetActive(svgId, cityId) {
    var svgEl = document.getElementById(svgId);
    if (!svgEl) return;
    // Reset all main circles (second circle in each pin = index 1)
    svgEl.querySelectorAll('.city-pin').forEach(function(pinG) {
        var circles = pinG.querySelectorAll('circle');
        if (circles[1]) circles[1].setAttribute('stroke-width', '2.5');
    });
    var g = svgEl.querySelector('.city-pin[data-id="' + cityId + '"]');
    if (g) {
        var circles = g.querySelectorAll('circle');
        var mainCircle = circles[1] || circles[0];
        if (mainCircle) mainCircle.setAttribute('stroke-width', '5');
    }
    // Panel sinxronlashtirish
    document.querySelectorAll('.panel-city-item').forEach(function(i) {
        i.classList.toggle('active', i.getAttribute('data-city-id') === cityId);
    });
}

function _showSvgCard(cardId, city, color) {
    var card = document.getElementById(cardId);
    if (!card) return;
    var el = function(id) { return document.getElementById(id); };
    el('city-card-badge').style.background = color;
    el('city-card-badge').textContent = city.hq ? '\u2605 Bosh ofis' : (city.hasService ? 'Service' : 'Savdo do\u02BCkoni');
    el('city-card-name').textContent = city.name;
    el('city-card-phone').innerHTML = city.phone + (city.phone2
        ? '<br><a href="tel:' + city.phone2.replace(/\D/g,'') + '" style="color:inherit">' + city.phone2 + '</a>' : '');
    el('city-card-address').textContent = city.address || '';

    var brEl = el('city-card-branches');
    if (brEl) {
        var parts = [];
        if (city.shops && city.shops > 1) parts.push(city.shops + ' ta do\u02BCkon');
        if (city.hasService) parts.push('+ service');
        if (parts.length) { brEl.textContent = parts.join(' '); brEl.classList.remove('hidden'); }
        else brEl.classList.add('hidden');
    }
    var svcWrap = el('city-card-services-wrap');
    var svcList = el('city-card-services');
    if (svcWrap && svcList) {
        if (city.services && city.services.length) {
            svcList.innerHTML = city.services.map(function(s) { return '<li>\u2022 ' + s + '</li>'; }).join('');
            svcWrap.classList.remove('hidden');
        } else {
            svcWrap.classList.add('hidden');
        }
    }
    card.classList.remove('hidden');
}

function buildSvgPanelList() {
    var panelList = document.getElementById('panel-city-list');
    if (!panelList) return;
    var cities = _getActiveCitiesSvg();

    cities.forEach(function(city) {
        var color = city.hq ? '#ef4444' : '#3b82f6';
        var btn = document.createElement('button');
        btn.className = 'panel-city-item';
        btn.setAttribute('data-city-id', city.id);
        var svcBadge = city.hasService
            ? '<span class="panel-city-branches" style="background:#dcfce7;color:#166534;">service</span>' : '';
        var shopBadge = (city.shops && city.shops > 1)
            ? '<span class="panel-city-branches">' + city.shops + ' do\u02BCkon</span>' : '';
        btn.innerHTML =
            '<span class="panel-city-dot" style="background:' + color + ';"></span>' +
            '<span class="panel-city-name">' + city.name + '</span>' +
            shopBadge + svcBadge;
        btn.addEventListener('click', function() {
            _svgSetActive('uzbek-map', city.id);
            _showSvgCard('city-card', city, color);
        });
        panelList.appendChild(btn);
    });

    var searchInput = document.getElementById('city-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            var q = this.value.trim().toLowerCase();
            panelList.querySelectorAll('.panel-city-item').forEach(function(item) {
                var id = item.getAttribute('data-city-id');
                var c = CITIES.find(function(x) { return x.id === id; });
                item.style.display = (!q || (c && c.name.toLowerCase().indexOf(q) !== -1)) ? '' : 'none';
            });
        });
    }
}

// =========================================================
// INIT ON DOM READY
// =========================================================

if (document.getElementById('daily-products-grid')) {
    renderDailyProducts();
}

(function() {
    function initMaps() {
        if (document.getElementById('uzbek-map')) buildSvgMap('uzbek-map', 'city-card');
        buildSvgPanelList();
        var closeBtn = document.getElementById('city-card-close');
        if (closeBtn) closeBtn.addEventListener('click', function() {
            var c = document.getElementById('city-card');
            if (c) c.classList.add('hidden');
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMaps);
    } else {
        initMaps();
    }
})();
