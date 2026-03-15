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
        phone: '+998 (87) 001-07-77',
        phone2: '+998 (87) 002-07-77',
        address: "Qo'qon shahar, Burkchilik ko'chasi",
        branches: 3,
        branchList: ["Filial 1 — Markaziy ofis", "Filial 2 — Servís markazi", "Filial 3 — Do'kon"],
        services: ["Metan/Propan o'rnatish", "Gaz quyish stansiyasi", "Laboratoriya xizmatlari", "Diagnostika"]
    },
    {
        id: 'toshkent', name: "AGU Toshkent", x: 618, y: 248, hq: false,
        phone: '+998 XX XXX XX XX',
        address: "Toshkent shahar",
        branches: 2,
        branchList: ["Filial 1", "Filial 2"]
    },
    { id: 'andijon',   name: "AGU Andijon",   x: 762, y: 285, hq: false, phone: '+998 XX XXX XX XX', address: "Andijon shahar" },
    { id: 'namangan',  name: "AGU Namangan",  x: 736, y: 268, hq: false, phone: '+998 XX XXX XX XX', address: "Namangan shahar" },
    { id: 'guliston',  name: "AGU Guliston",  x: 588, y: 278, hq: false, phone: '+998 XX XXX XX XX', address: "Guliston shahar, Sirdaryo viloyati" },
    { id: 'samarqand', name: "AGU Samarqand", x: 510, y: 342, hq: false, phone: '+998 XX XXX XX XX', address: "Samarqand shahar" },
    { id: 'buxoro',    name: "AGU Buxoro",    x: 386, y: 336, hq: false, phone: '+998 XX XXX XX XX', address: "Buxoro shahar" },
    { id: 'qarshi',    name: "AGU Qarshi",    x: 455, y: 386, hq: false, phone: '+998 XX XXX XX XX', address: "Qarshi shahar, Qashqadaryo viloyati" },
    { id: 'denov',     name: "AGU Denov",     x: 558, y: 418, hq: false, phone: '+998 XX XXX XX XX', address: "Denov shahar, Surxondaryo viloyati" },
    { id: 'xorazm',    name: "AGU Xorazm",   x: 210, y: 236, hq: false, phone: '+998 XX XXX XX XX', address: "Urganch shahar, Xorazm viloyati" },
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
};

function buildCityMarkers() {
    const mapG = document.getElementById('city-markers');
    const cityList = document.getElementById('city-list');
    if (!mapG) return;

    CITIES.forEach(city => {
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
        g.addEventListener('click', () => showCityCard(city));

        // City list button (mobile)
        if (cityList) {
            const btn = document.createElement('button');
            btn.className = 'flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium text-left';
            btn.style.borderLeft = `3px solid ${color}`;
            btn.innerHTML = `<span style="color:${color}">●</span> ${city.name}`;
            btn.addEventListener('click', () => {
                showCityCard(city);
                document.getElementById('uzbek-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            cityList.appendChild(btn);
        }
    });
}

function showCityCard(city) {
    const card = document.getElementById('city-card');
    if (!card) return;

    const color = city.hq ? '#E30613' : '#1b5bb5';

    document.getElementById('city-card-badge').style.background = color;
    document.getElementById('city-card-badge').textContent = city.hq ? '★ Bosh ofis' : 'Filial';
    document.getElementById('city-card-name').textContent = city.name;
    document.getElementById('city-card-phone').innerHTML =
        city.phone + (city.phone2 ? `<br><a href="tel:${city.phone2.replace(/\D/g,'')}" style="color:inherit">${city.phone2}</a>` : '');
    document.getElementById('city-card-address').textContent = city.address;

    // Filiallar soni
    const branchEl = document.getElementById('city-card-branches');
    if (branchEl) {
        if (city.branches && city.branches > 1) {
            branchEl.textContent = `${city.branches} ta filial`;
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
