// =========================================================
// AUTO GAS UZBEKISTAN — Korporativ Sayt
// Versiya: 3.0 — Faqat UI / Animatsiya
// =========================================================

// =========================================================
// LOADING SCREEN (GSAP)
// =========================================================

window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    const subtitleEl = document.getElementById('subtitle-text-loader');

    const subtitleText = 'Auto Gas Uzbekistan';

    // GSAP loading animation
    if (window.gsap && loadingScreen) {
        const tl = gsap.timeline();

        // Animate "AG" letters
        tl.from('#ag-loader', { opacity: 0, x: -60, duration: 0.6, ease: 'back.out(1.7)' })
          .from('#u-loader', { opacity: 0, x: 60, duration: 0.6, ease: 'back.out(1.7)' }, '-=0.3')
          .from('#reg-loader', { opacity: 0, scale: 0, duration: 0.4 }, '-=0.1');

        // Typewriter subtitle
        if (subtitleEl) {
            let i = 0;
            const typeInterval = setInterval(() => {
                if (i < subtitleText.length) {
                    const span = document.createElement('span');
                    span.textContent = subtitleText[i];
                    subtitleEl.appendChild(span);
                    gsap.from(span, { opacity: 0, y: 10, duration: 0.2 });
                    i++;
                } else {
                    clearInterval(typeInterval);
                }
            }, 80);
        }

        // Hide loading screen after animation
        tl.to(loadingScreen, {
            opacity: 0,
            duration: 0.6,
            delay: 1.4,
            onComplete: () => {
                loadingScreen.classList.add('hidden');
                mainContent.style.opacity = '1';
                initFadeObserver();
            }
        });
    } else {
        // Fallback without GSAP
        setTimeout(() => {
            if (loadingScreen) loadingScreen.classList.add('hidden');
            if (mainContent) mainContent.style.opacity = '1';
            initFadeObserver();
        }, 800);
    }
});

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
