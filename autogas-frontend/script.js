// =========================================================
// AUTO GAS UZBEKISTAN - TO'LIQ BACKEND INTEGRATSIYASI
// Versiya: 2.1 - Production Ready - Wishlist + Fixes
// =========================================================

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000/api';
let authToken = localStorage.getItem('authToken');

// Global State
let allProductsCache = [];
let currentUser = null;
let currentPage = 1;
let userWishlist = [];
let localCart = { items: [] };

// Constants
const regions = [
    "Toshkent", "Samarqand", "Buxoro", "Andijon", "Farg'ona", "Namangan",
    "Qashqadaryo", "Surxondaryo", "Jizzax", "Sirdaryo", "Xorazm", "Navoiy", "Qoraqalpog'iston"
];

// =========================================================
// UTILITY FUNCTIONS
// =========================================================

function debounce(fn, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            fn(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

let toastTimeout;
function showToast(message, isError = true) {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    toast.className = `fixed top-5 right-5 text-white py-3 px-6 rounded-lg shadow-lg transform transition-transform duration-500 ease-in-out z-[100] ${isError ? 'bg-red-600' : 'bg-green-600'}`;

    toast.classList.remove('translate-x-[120%]');
    toast.classList.add('translate-x-0');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('translate-x-0');
        toast.classList.add('translate-x-[120%]');
    }, 4000);
}

// =========================================================
// API CALLS - AUTHENTICATION
// =========================================================

async function handleLogin(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Email yoki parol noto\'g\'ri!');
        }

        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        authToken = data.token;
        currentUser = data.user;

        return { success: true, user: data.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function handleRegister(name, email, phone, password, confirmPassword) {
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                name, email, phone, password,
                password_confirmation: confirmPassword,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.errors 
                ? Object.values(data.errors).flat().join(' ') 
                : (data.message || 'Ro\'yxatdan o\'tishda xatolik.');
            throw new Error(errorMessage);
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function logout() {
    const token = authToken;
    if (token) {
        try {
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    clearUserSession();
}

function clearUserSession() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    userWishlist = [];
    authToken = null;
    currentUser = null;
    window.location.reload();
}

// =========================================================
// API CALLS - PRODUCTS
// =========================================================

async function fetchProducts(page = 1, searchTerm = '', sortOrder = 'default') {
    const params = new URLSearchParams({
        page: page,
        search: searchTerm,
        sort: sortOrder
    });

    try {
        const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error(`Server xatosi: ${response.status}`);
        }

        const data = await response.json();
        allProductsCache = data.data || [];
        return data;
    } catch (error) {
        console.error('Fetch Products Error:', error);
        showToast("Mahsulotlarni yuklashda xatolik: " + error.message);
        return { data: [], current_page: 1, last_page: 1 };
    }
}

// =========================================================
// API CALLS - CART
// =========================================================

function getCart() {
    return localCart.items || [];
}

function updateLocalCart(serverCart) {
    localCart = serverCart || { items: [] };
    updateCartIcon();
    renderCartItems();
}

async function loadCartFromServer() {
    if (!authToken) {
        updateLocalCart({ items: [] });
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/cart`, {
            headers: { 
                'Authorization': `Bearer ${authToken}`, 
                'Accept': 'application/json' 
            }
        });
        
        if (!response.ok) throw new Error("Savatni yuklab bo'lmadi");
        
        const serverCart = await response.json();
        updateLocalCart(serverCart);
    } catch (err) {
        console.error('Cart load error:', err);
        updateLocalCart({ items: [] });
    }
}

async function addToCart(productId) {
    if (!currentUser) {
        showLoginModal();
        return;
    }

    const product = allProductsCache.find(p => p.id === productId);
    if (!product) {
        showToast("Mahsulot topilmadi!");
        return;
    }

    if (product.stockStatus === 'out_of_stock') {
        showToast("Ushbu mahsulot hozirda stokda mavjud emas.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ product_id: productId, quantity: 1 })
        });

        const updatedCart = await response.json();

        if (!response.ok) {
            throw new Error(updatedCart.message || "Savatga qo'shishda xatolik.");
        }

        updateLocalCart(updatedCart);
        showToast(`${product.name} savatga qo'shildi!`, false);
        showCartModal();

    } catch (error) {
        showToast(error.message, true);
    }
}

async function updateCartItemQuantity(productId, newQuantity) {
    newQuantity = parseInt(newQuantity);

    try {
        let response;
        if (newQuantity > 0) {
            response = await fetch(`${API_BASE_URL}/cart/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ quantity: newQuantity })
            });
        } else {
            response = await fetch(`${API_BASE_URL}/cart/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
        }

        const updatedCart = await response.json();

        if (!response.ok) {
            throw new Error(updatedCart.message || "Savatni yangilashda xatolik.");
        }

        updateLocalCart(updatedCart);

    } catch (error) {
        showToast(error.message, true);
        loadCartFromServer();
    }
}

function updateCartIcon() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountEl = document.getElementById('cart-item-count');
    const mobileCartCountEl = document.getElementById('mobile-cart-item-count');
    
    if (cartCountEl) cartCountEl.textContent = totalItems;
    if (mobileCartCountEl) mobileCartCountEl.textContent = totalItems;
}

function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalPriceEl = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');
    const cart = getCart();

    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-center text-gray-500">Savatingiz bo\'sh.</p>';
        if (cartTotalPriceEl) cartTotalPriceEl.textContent = '$0.00';
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }

    let totalPrice = 0;
    cart.forEach(item => {
        const product = item.product;
        if (!product) return;

        const itemTotalPrice = product.price * item.quantity;
        totalPrice += itemTotalPrice;

        const itemElement = document.createElement('div');
        itemElement.className = 'flex items-center justify-between py-4 border-b border-gray-200';
        itemElement.innerHTML = `
            <div class="flex items-center space-x-4">
                <img src="${product.imageUrl || 'https://via.placeholder.com/64'}" alt="${product.name}" class="w-16 h-16 object-cover rounded-lg">
                <div>
                    <h4 class="font-semibold text-gray-800">${product.name}</h4>
                    <p class="text-sm text-gray-500">$${parseFloat(product.price).toFixed(2)}</p>
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <input type="number" value="${item.quantity}" min="1" 
                       onchange="updateCartItemQuantity(${product.id}, this.value)"
                       class="w-16 text-center border border-gray-300 rounded-md p-1">
                <button onclick="updateCartItemQuantity(${product.id}, 0)" class="text-red-500 hover:text-red-700">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    if (cartTotalPriceEl) cartTotalPriceEl.textContent = `$${totalPrice.toFixed(2)}`;
    if (checkoutBtn) checkoutBtn.disabled = false;
}

// =========================================================
// API CALLS - WISHLIST
// =========================================================

async function loadWishlistFromServer() {
    if (!authToken) {
        userWishlist = [];
        updateWishlistUI();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/wishlist`, {
            headers: { 
                'Authorization': `Bearer ${authToken}`, 
                'Accept': 'application/json' 
            }
        });
        
        if (!response.ok) {
            console.warn('Wishlist yuklanmadi, lekin davom ettirilmoqda');
            userWishlist = [];
            updateWishlistUI();
            return;
        }
        
        const wishlistData = await response.json();
        userWishlist = wishlistData || [];
        updateWishlistUI();
        updateProductView(currentPage);
    } catch (error) {
        console.warn('Wishlist xatosi:', error.message);
        userWishlist = [];
        updateWishlistUI();
    }
}

function updateWishlistUI() {
    const count = userWishlist.length;
    const wishlistCountEl = document.getElementById('wishlist-item-count');
    const mobileWishlistCountEl = document.getElementById('mobile-wishlist-item-count');
    
    if (wishlistCountEl) wishlistCountEl.textContent = count;
    if (mobileWishlistCountEl) mobileWishlistCountEl.textContent = count;
}

async function toggleWishlist(productId) {
    if (!currentUser) {
        showLoginModal();
        return;
    }

    const isWishlisted = userWishlist.some(product => product.id === productId);
    const method = isWishlisted ? 'DELETE' : 'POST';
    const url = isWishlisted 
        ? `${API_BASE_URL}/wishlist/${productId}` 
        : `${API_BASE_URL}/wishlist`;

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: isWishlisted ? null : JSON.stringify({ product_id: productId })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Amalni bajarishda xatolik.');
        }

        if (isWishlisted) {
            userWishlist = userWishlist.filter(p => p.id !== productId);
            showToast(result.message || 'Mahsulot sevimlilardan o\'chirildi.', false);
        } else {
            await loadWishlistFromServer();
            showToast(result.message || 'Mahsulot sevimlilarga qo\'shildi.', false);
        }

        updateWishlistUI();
        updateProductView(currentPage);
        renderWishlistItems();

    } catch (error) {
        showToast(error.message, true);
    }
}

function renderWishlistItems() {
    const container = document.getElementById('wishlist-items-container');
    if (!container) return;
    
    container.innerHTML = '';

    if (userWishlist.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">Sevimlilar ro\'yxati bo\'sh.</p>';
        return;
    }

    userWishlist.forEach(product => {
        const itemElement = document.createElement('div');
        itemElement.className = 'flex items-center justify-between py-4 border-b border-gray-200';
        itemElement.innerHTML = `
            <div class="flex items-center space-x-4 cursor-pointer" onclick="showProductDetailModal(${product.id}); closeWishlistModal();">
                <img src="${product.imageUrl || 'https://via.placeholder.com/64'}" alt="${product.name}" class="w-16 h-16 object-cover rounded-lg">
                <div>
                    <h4 class="font-semibold text-gray-800">${product.name}</h4>
                    <p class="text-sm text-gray-500">$${parseFloat(product.price).toFixed(2)}</p>
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <button onclick="addToCart(${product.id});" class="text-orange-500 hover:text-orange-700" title="Savatga qo'shish">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                </button>
            </div>
        `;
        container.appendChild(itemElement);
    });
}

// =========================================================
// UI RENDERING - PRODUCTS
// =========================================================

function showSkeletons(count = 24) {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const card = document.createElement('div');
        card.className = 'product-card p-6 rounded-2xl shadow-lg';
        card.innerHTML = `
            <div class="w-full h-48 bg-gray-200 rounded-xl mb-6 animate-pulse"></div>
            <div class="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div class="h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div class="flex justify-between items-center">
                <div class="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div class="h-10 w-32 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
        `;
        productsGrid.appendChild(card);
    }
}

function createProductCard(product) {
    const card = document.createElement('div');
    const isOutOfStock = product.stockStatus === 'out_of_stock';
    card.className = `product-card relative p-6 rounded-2xl shadow-lg card-hover fade-in h-full flex flex-col ${isOutOfStock ? 'opacity-60' : ''}`;

    const isWishlisted = userWishlist.some(item => item.id === product.id);
    const wishlistButton = currentUser ? `
        <button onclick="event.stopPropagation(); toggleWishlist(${product.id});" class="absolute top-4 right-4 z-10 p-2 bg-white/70 rounded-full hover:bg-white transition-colors duration-300">
            <svg class="w-6 h-6 ${isWishlisted ? 'text-red-500 fill-current' : 'text-gray-600'}" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.5l-7.682-7.682a4.5 4.5 0 010-6.364z"></path></svg>
        </button>` : '';

    const stockBadge = isOutOfStock 
        ? `<div class="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">STOKDA YO'Q</div>`
        : '';

    const gradients = [
        'from-orange-100 to-red-100',
        'from-blue-100 to-purple-100',
        'from-green-100 to-teal-100',
        'from-yellow-100 to-orange-100'
    ];
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

    const defaultIcon = `<svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;
    
    const imageHTML = product.imageUrl && !product.imageUrl.includes('placeholder')
        ? `<img src="${product.imageUrl}" alt="${product.name}" class="w-full h-full object-cover" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="hidden w-full h-full items-center justify-center">${defaultIcon}</div>`
        : `<div class="w-full h-full flex items-center justify-center">${defaultIcon}</div>`;

    card.innerHTML = `
        ${stockBadge}
        ${wishlistButton}
        <div class="w-full h-48 bg-gradient-to-br ${randomGradient} rounded-xl mb-6 flex items-center justify-center product-image overflow-hidden flex-shrink-0">
            ${imageHTML}
        </div>
        <h3 class="text-xl font-bold mb-2" style="color: var(--dark-gray);">${product.name}</h3>
        <p class="text-gray-600 mb-4 line-clamp-2 flex-grow">${product.description || ''}</p>
        <div class="flex justify-between items-center mt-auto">
            <span class="text-2xl font-bold" style="color: var(--secondary-orange);">$${parseFloat(product.price).toFixed(2)}</span>
            <button
                onclick="event.stopPropagation(); ${isOutOfStock ? '' : `addToCart(${product.id})`}"
                class="${isOutOfStock ? 'bg-gray-400 cursor-not-allowed' : 'btn-primary'} text-white px-6 py-2 rounded-full font-semibold"
                ${isOutOfStock ? 'disabled' : ''}
            >
                Savatga qo'shish
            </button>
        </div>
    `;

    card.addEventListener('click', () => showProductDetailModal(product.id));
    return card;
}

function renderProducts(products) {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    if (!products || products.length === 0) {
        productsGrid.innerHTML = '<p class="col-span-full text-center text-gray-500 py-10">Mahsulotlar topilmadi</p>';
        return;
    }
    
    products.forEach(product => {
        const card = createProductCard(product);
        productsGrid.appendChild(card);
    });
}

function renderPagination(currentPage, lastPage) {
    const container = document.getElementById('pagination-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (lastPage <= 1) return;
    
    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '←';
        prevBtn.className = 'px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors';
        prevBtn.onclick = () => updateProductView(currentPage - 1);
        container.appendChild(prevBtn);
    }
    
    for (let i = 1; i <= lastPage; i++) {
        if (i === 1 || i === lastPage || (i >= currentPage - 2 && i <= currentPage + 2)) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === currentPage 
                ? 'px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold'
                : 'px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors';
            pageBtn.onclick = () => updateProductView(i);
            container.appendChild(pageBtn);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.className = 'px-2 text-gray-500';
            container.appendChild(dots);
        }
    }
    
    if (currentPage < lastPage) {
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '→';
        nextBtn.className = 'px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors';
        nextBtn.onclick = () => updateProductView(currentPage + 1);
        container.appendChild(nextBtn);
    }
}

async function updateProductView(page = 1) {
    currentPage = page;
    const searchTerm = document.getElementById('search-input')?.value || '';
    const sortOrder = document.getElementById('sort-select')?.value || 'default';
    
    showSkeletons(24);
    
    const productsSection = document.getElementById('products');
    if (productsSection && page > 1) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    try {
        const data = await fetchProducts(page, searchTerm, sortOrder);
        renderProducts(data.data);
        renderPagination(data.current_page, data.last_page);
    } catch (error) {
        console.error('Product view update error:', error);
        showToast('Mahsulotlarni yuklashda xatolik yuz berdi', true);
    }
}

function filterByCategory(category) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = category;
        updateProductView(1);
    }
}

// =========================================================
// MODAL FUNCTIONS
// =========================================================

function showLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.add('hidden');
    
    const form = document.getElementById('login-form');
    if (form) form.reset();
    
    const message = document.getElementById('login-message');
    if (message) message.classList.add('hidden');
}

function showRegisterModal() {
    const modal = document.getElementById('register-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeRegisterModal() {
    const modal = document.getElementById('register-modal');
    if (modal) modal.classList.add('hidden');
    
    const form = document.getElementById('register-form');
    if (form) form.reset();
    
    const message = document.getElementById('register-message');
    if (message) message.classList.add('hidden');
}

function showCartModal() {
    renderCartItems();
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    
    const sidebar = modal.querySelector('.transform');
    modal.classList.remove('hidden');
    setTimeout(() => {
        if (sidebar) sidebar.classList.remove('translate-x-full');
    }, 10);
}

function closeCartModal() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    
    const sidebar = modal.querySelector('.transform');
    if (sidebar) sidebar.classList.add('translate-x-full');
    setTimeout(() => modal.classList.add('hidden'), 500);
}

function showWishlistModal() {
    renderWishlistItems();
    const modal = document.getElementById('wishlist-modal');
    if (!modal) return;
    
    const sidebar = modal.querySelector('.transform');
    modal.classList.remove('hidden');
    setTimeout(() => {
        if (sidebar) sidebar.classList.remove('translate-x-full');
    }, 10);
}

function closeWishlistModal() {
    const modal = document.getElementById('wishlist-modal');
    if (!modal) return;
    
    const sidebar = modal.querySelector('.transform');
    if (sidebar) sidebar.classList.add('translate-x-full');
    setTimeout(() => modal.classList.add('hidden'), 500);
}

function showProductDetailModal(productId) {
    const product = allProductsCache.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }

    console.log('Opening modal for product:', product.name);

    const modal = document.getElementById('product-detail-modal');
    if (!modal) {
        console.error('Modal element not found!');
        return;
    }

    // Update modal content
    const nameEl = document.getElementById('detail-modal-name');
    const descEl = document.getElementById('detail-modal-description');
    const categoryEl = document.getElementById('detail-modal-category');
    const priceEl = document.getElementById('detail-modal-price');
    const imageEl = document.getElementById('detail-modal-image');
    const stockStatusEl = document.getElementById('detail-modal-stock-status');
    const addToCartBtn = document.getElementById('detail-modal-add-to-cart-button');

    if (nameEl) nameEl.textContent = product.name;
    if (descEl) descEl.textContent = product.description || 'Tavsif mavjud emas';
    if (categoryEl) categoryEl.textContent = product.category || 'Noma\'lum';
    if (priceEl) priceEl.textContent = `$${parseFloat(product.price).toFixed(2)}`;
    
    if (imageEl) {
        const defaultIcon = `<svg class="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;
        
        imageEl.innerHTML = product.imageUrl && !product.imageUrl.includes('placeholder')
            ? `<img src="${product.imageUrl}" alt="${product.name}" class="w-full h-full object-cover md:rounded-l-2xl">`
            : `<div class="flex items-center justify-center w-full h-full">${defaultIcon}</div>`;
    }

    if (stockStatusEl && addToCartBtn) {
        if (product.stockStatus === 'out_of_stock') {
            addToCartBtn.disabled = true;
            addToCartBtn.textContent = "Stokda yo'q";
            stockStatusEl.classList.remove('hidden');
        } else {
            addToCartBtn.disabled = false;
            addToCartBtn.textContent = "Savatga qo'shish";
            stockStatusEl.classList.add('hidden');
        }
        addToCartBtn.onclick = () => addToCart(product.id);
    }

    // Show modal with animation
    const modalContent = modal.querySelector('.transform');
    modal.classList.remove('hidden');
    
    setTimeout(() => {
        if (modalContent) {
            modalContent.classList.remove('scale-95', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        }
    }, 10);
}

function closeProductDetailModal() {
    const modal = document.getElementById('product-detail-modal');
    if (!modal) return;
    
    const modalContent = modal.querySelector('.transform');
    if (modalContent) {
        modalContent.classList.add('scale-95', 'opacity-0');
        modalContent.classList.remove('scale-100', 'opacity-100');
    }
    
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function showCheckoutModal() {
    const cart = getCart();
    if (cart.length === 0) {
        showToast("Xarid uchun savatingizda mahsulot bo'lishi kerak.");
        return;
    }
    
    closeCartModal();
    
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;
    
    const modalContent = modal.querySelector('.transform');
    const regionSelect = document.getElementById('checkout-region');
    
    if (regionSelect && regionSelect.options.length <= 1) {
        regionSelect.innerHTML = '<option value="">Viloyatni tanlang</option>';
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            regionSelect.appendChild(option);
        });
    }
    
    if (currentUser) {
        const nameInput = document.getElementById('checkout-name');
        const phoneInput = document.getElementById('checkout-phone');
        if (nameInput) nameInput.value = currentUser.name || '';
        if (phoneInput) phoneInput.value = currentUser.phone || '';
    }
    
    const totalPrice = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalPriceEl = document.getElementById('checkout-total-price');
    if (totalPriceEl) totalPriceEl.textContent = `$${totalPrice.toFixed(2)}`;
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        if (modalContent) {
            modalContent.classList.remove('scale-95', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        }
    }, 10);
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;
    
    const modalContent = modal.querySelector('.transform');
    if (modalContent) {
        modalContent.classList.add('scale-95', 'opacity-0');
        modalContent.classList.remove('scale-100', 'opacity-100');
    }
    
    setTimeout(() => {
        modal.classList.add('hidden');
        const successMsg = document.getElementById('checkout-success-message');
        const content = document.getElementById('checkout-content');
        if (successMsg) successMsg.classList.add('hidden');
        if (content) content.classList.remove('hidden');
    }, 300);
}

function updateUIForLoggedInUser(user) {
    const authButtons = document.getElementById('auth-buttons');
    const mobileAuthButtons = document.getElementById('mobile-auth-buttons');
    const userProfile = document.getElementById('user-profile');
    const mobileUserProfile = document.getElementById('mobile-user-profile');
    const wishlistBtn = document.getElementById('wishlist-btn');
    const mobileWishlistLink = document.getElementById('mobile-wishlist-link');

    if (authButtons) authButtons.classList.add('hidden');
    if (mobileAuthButtons) mobileAuthButtons.classList.add('hidden');
    if (userProfile) userProfile.classList.remove('hidden');
    if (mobileUserProfile) mobileUserProfile.classList.remove('hidden');
    if (wishlistBtn) wishlistBtn.classList.remove('hidden');
    if (mobileWishlistLink) mobileWishlistLink.classList.remove('hidden');

    const userName = user?.name?.trim() || 'Foydalanuvchi';
    const initial = userName.charAt(0).toUpperCase();

    const userInitialEl = document.getElementById('user-initial');
    const userNameEl = document.getElementById('user-name');
    const mobileUserInitialEl = document.getElementById('mobile-user-initial');
    const mobileUserNameEl = document.getElementById('mobile-user-name');

    if (userInitialEl) userInitialEl.textContent = initial;
    if (userNameEl) userNameEl.textContent = userName;
    if (mobileUserInitialEl) mobileUserInitialEl.textContent = initial;
    if (mobileUserNameEl) mobileUserNameEl.textContent = userName;
}

// =========================================================
// CATEGORIES RENDERING
// =========================================================

function renderCategories() {
    const categoriesContainer = document.getElementById('categories-grid');
    if (!categoriesContainer) return;

    const products = allProductsCache;
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

    const categoryIcons = {
        'Elektronika': 'M13 10V3L4 14h7v7l9-11h-7z',
        'Filtrlar': 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
        'Reduktorlar': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
        'Gaz Ballonlari': 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
        'default': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    };

    categoriesContainer.innerHTML = '';
    categories.forEach(category => {
        const card = document.createElement('div');
        card.className = 'p-6 rounded-2xl text-center card-hover fade-in cursor-pointer';
        card.style.background = 'linear-gradient(145deg, #e2e8f0, #f8fafc)';
        card.onclick = () => filterByCategory(category);

        const iconPath = categoryIcons[category] || categoryIcons['default'];

        card.innerHTML = `
            <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style="background: var(--primary-blue);">
                <svg class="w-8 h-8 text-white interactive-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"></path>
                </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2" style="color: var(--dark-gray);">${category}</h3>
        `;
        categoriesContainer.appendChild(card);
    });
}

// =========================================================
// EVENT LISTENERS & INITIALIZATION
// =========================================================

document.addEventListener('DOMContentLoaded', async () => {
    // GSAP Loading Animation
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');

    if (loadingScreen && mainContent) {
        const subtitleText = "Auto Gas Uzbekistan";
        const subtitleContainer = document.getElementById('subtitle-text-loader');
        if (subtitleContainer) {
            subtitleText.split('').forEach(char => {
                const span = document.createElement('span');
                span.innerHTML = (char === ' ') ? '&nbsp;' : char;
                subtitleContainer.appendChild(span);
            });
        }

        if (typeof gsap !== 'undefined') {
            const tl = gsap.timeline({ defaults: { duration: 0.6, ease: "back.out(1.2)" } });
            tl.from('#ag-loader', { x: -50, opacity: 0, rotationY: -90 })
              .from('#u-loader', { x: 50, opacity: 0, rotationY: 90 }, "<0.1")
              .from('#reg-loader', { y: -100, opacity: 0, rotationZ: 360, ease: "power2.out" }, "<0.1")
              .from('#subtitle-text-loader span', {
                  y: 20, opacity: 0, scale: 0.5, duration: 0.3, ease: "power1.out", stagger: 0.03
              }, "-=0.3");
            
            tl.to(loadingScreen, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => loadingScreen.classList.add('hidden')
            }).to(mainContent, { opacity: 1, duration: 1 }, "-=0.5");
        }
    }

    // Check user session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateUIForLoggedInUser(currentUser);
            loadWishlistFromServer();
            loadCartFromServer();
        } catch (e) {
            console.error('Error parsing saved user:', e);
        }
    }
    updateCartIcon();

    // Load initial products
    await updateProductView(1);
    renderCategories();

    // Search and sort
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    if (searchInput) searchInput.addEventListener('input', debounce(() => updateProductView(1), 400));
    if (sortSelect) sortSelect.addEventListener('change', () => updateProductView(1));

    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.add('open'));
    }
    if (closeMenuBtn && mobileMenu) {
        closeMenuBtn.addEventListener('click', () => mobileMenu.classList.remove('open'));
    }

    // Auth buttons
    const showLoginBtn = document.getElementById('show-login-modal-btn');
    const mobileShowLoginBtn = document.getElementById('mobile-show-login-btn');
    const showRegisterBtn = document.getElementById('show-register-modal-btn');
    const mobileShowRegisterBtn = document.getElementById('mobile-show-register-btn');
    
    if (showLoginBtn) showLoginBtn.addEventListener('click', showLoginModal);
    if (mobileShowLoginBtn) mobileShowLoginBtn.addEventListener('click', showLoginModal);
    if (showRegisterBtn) showRegisterBtn.addEventListener('click', showRegisterModal);
    if (mobileShowRegisterBtn) mobileShowRegisterBtn.addEventListener('click', showRegisterModal);

    const closeLoginBtn = document.getElementById('close-login-modal-btn');
    const closeRegisterBtn = document.getElementById('close-register-modal-btn');
    const switchToRegisterBtn = document.getElementById('switch-to-register-btn');
    const switchToLoginBtn = document.getElementById('switch-to-login-btn');
    
    if (closeLoginBtn) closeLoginBtn.addEventListener('click', closeLoginModal);
    if (closeRegisterBtn) closeRegisterBtn.addEventListener('click', closeRegisterModal);
    if (switchToRegisterBtn) {
        switchToRegisterBtn.addEventListener('click', () => {
            closeLoginModal();
            showRegisterModal();
        });
    }
    if (switchToLoginBtn) {
        switchToLoginBtn.addEventListener('click', () => {
            closeRegisterModal();
            showLoginModal();
        });
    }

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const messageDiv = document.getElementById('login-message');

            const result = await handleLogin(email, password);

            if (result.success && messageDiv) {
                messageDiv.className = 'mt-4 p-3 rounded-xl bg-green-100 text-green-800';
                messageDiv.textContent = `Xush kelibsiz, ${result.user.name}!`;
                messageDiv.classList.remove('hidden');

                setTimeout(() => {
                    closeLoginModal();
                    updateUIForLoggedInUser(result.user);
                    loadCartFromServer();
                    loadWishlistFromServer();
                }, 1500);
            } else if (messageDiv) {
                messageDiv.className = 'mt-4 p-3 rounded-xl bg-red-100 text-red-800';
                messageDiv.textContent = result.error;
                messageDiv.classList.remove('hidden');
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const phone = document.getElementById('register-phone').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            const messageDiv = document.getElementById('register-message');

            if (password !== confirmPassword && messageDiv) {
                messageDiv.className = 'mt-4 p-3 rounded-xl bg-red-100 text-red-800';
                messageDiv.textContent = 'Parollar mos kelmaydi!';
                messageDiv.classList.remove('hidden');
                return;
            }

            const result = await handleRegister(name, email, phone, password, confirmPassword);

            if (result.success && messageDiv) {
                messageDiv.className = 'mt-4 p-3 rounded-xl bg-green-100 text-green-800';
                messageDiv.textContent = 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz! Endi tizimga kirishingiz mumkin.';
                messageDiv.classList.remove('hidden');
                setTimeout(() => {
                    closeRegisterModal();
                    showLoginModal();
                }, 2000);
            } else if (messageDiv) {
                messageDiv.className = 'mt-4 p-3 rounded-xl bg-red-100 text-red-800';
                messageDiv.textContent = result.error;
                messageDiv.classList.remove('hidden');
            }
        });
    }

    // Logout buttons
    const logoutBtn = document.getElementById('logout-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', logout);

    // Cart buttons
    const cartBtn = document.getElementById('cart-btn');
    const mobileCartLink = document.getElementById('mobile-cart-link');
    const closeCartBtn = document.getElementById('close-cart-modal-btn');
    const cartOverlay = document.getElementById('cart-overlay');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (cartBtn) cartBtn.addEventListener('click', showCartModal);
    if (mobileCartLink) {
        mobileCartLink.addEventListener('click', (e) => {
            e.preventDefault();
            showCartModal();
        });
    }
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartModal);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCartModal);
    if (checkoutBtn) checkoutBtn.addEventListener('click', showCheckoutModal);

    // Wishlist buttons
    const wishlistBtn = document.getElementById('wishlist-btn');
    const mobileWishlistLink = document.getElementById('mobile-wishlist-link');
    const closeWishlistBtn = document.getElementById('close-wishlist-modal-btn');
    const wishlistOverlay = document.getElementById('wishlist-overlay');
    
    if (wishlistBtn) wishlistBtn.addEventListener('click', showWishlistModal);
    if (mobileWishlistLink) {
        mobileWishlistLink.addEventListener('click', (e) => {
            e.preventDefault();
            showWishlistModal();
        });
    }
    if (closeWishlistBtn) closeWishlistBtn.addEventListener('click', closeWishlistModal);
    if (wishlistOverlay) wishlistOverlay.addEventListener('click', closeWishlistModal);

    // Product detail modal
    const closeProductDetailBtn = document.getElementById('close-product-detail-modal-btn');
    if (closeProductDetailBtn) closeProductDetailBtn.addEventListener('click', closeProductDetailModal);

    // Checkout modal
    const closeCheckoutBtn = document.getElementById('close-checkout-modal-btn');
    if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', closeCheckoutModal);

    // Checkout form
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('checkout-name').value;
            const phone = document.getElementById('checkout-phone').value;
            const address = document.getElementById('checkout-address').value;
            const region = document.getElementById('checkout-region').value;
            const cart = getCart();

            const orderData = {
                customer_name: name,
                customer_phone: phone,
                address: address,
                region: region,
                items: cart.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    price: item.product.price
                }))
            };

            try {
                const response = await fetch(`${API_BASE_URL}/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(orderData)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Buyurtma berishda xatolik yuz berdi.');
                }

                const checkoutContent = document.getElementById('checkout-content');
                const successMessage = document.getElementById('checkout-success-message');
                
                if (checkoutContent) checkoutContent.classList.add('hidden');
                if (successMessage) {
                    successMessage.innerHTML = `
                        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h4 class="text-xl font-semibold mb-2">Rahmat, ${name}!</h4>
                        <p class="text-gray-600">Buyurtmangiz muvaffaqiyatli qabul qilindi.</p>
                    `;
                    successMessage.classList.remove('hidden');
                }
                
                updateLocalCart({ items: [] });

                setTimeout(closeCheckoutModal, 4000);

            } catch (error) {
                showToast(error.message, true);
            }
        });
    }

    // Header scroll effect
    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (header) {
            if (window.scrollY > 100) {
                header.classList.add('header-scrolled');
            } else {
                header.classList.remove('header-scrolled');
            }
        }
    });

    // Smooth scrolling - FIXED querySelector issue
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Bo'sh href yoki faqat '#' bo'lsa, skip qiling
            if (!href || href === '#' || href.length <= 1) {
                return;
            }
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // FAQ Accordion
    document.querySelectorAll('.faq-item').forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        if (question && answer) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');

                document.querySelectorAll('.faq-item').forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const otherAnswer = otherItem.querySelector('.faq-answer');
                        if (otherAnswer) otherAnswer.style.maxHeight = null;
                    }
                });

                if (!isActive) {
                    item.classList.add('active');
                    answer.style.maxHeight = answer.scrollHeight + "px";
                } else {
                    item.classList.remove('active');
                    answer.style.maxHeight = null;
                }
            });
        }
    });

    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formMessage = document.getElementById('form-message');
            const name = document.getElementById('name').value;
            
            if (formMessage) {
                formMessage.className = 'mt-4 p-4 rounded-xl bg-green-100 text-green-800';
                formMessage.textContent = `Rahmat ${name}! Xabaringiz yuborildi.`;
                formMessage.classList.remove('hidden');
            }
            
            this.reset();
            setTimeout(() => {
                if (formMessage) formMessage.classList.add('hidden');
            }, 5000);
        });
    }

    // Escape key to close modals
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLoginModal();
            closeRegisterModal();
            closeCartModal();
            closeWishlistModal();
            closeProductDetailModal();
            closeCheckoutModal();
            closeAddProductModal();
        }
    });

    // =========================================================
    // ADD PRODUCT FUNCTIONALITY (Admin Only)
    // =========================================================

    const addProductBtn = document.getElementById('add-product-btn');
    const addProductModal = document.getElementById('add-product-modal');
    const closeAddProductModalBtn = document.getElementById('close-add-product-modal');
    const cancelAddProductBtn = document.getElementById('cancel-add-product');
    const addProductForm = document.getElementById('add-product-form');

    // Show "Add Product" button only for logged-in users (admin/owner)
    function checkAdminAccess() {
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');

        if (token && (userRole === 'admin' || userRole === 'owner')) {
            if (addProductBtn) addProductBtn.classList.remove('hidden');
        } else {
            if (addProductBtn) addProductBtn.classList.add('hidden');
        }
    }

    // Open add product modal
    function openAddProductModal() {
        if (addProductModal) {
            addProductModal.classList.remove('hidden');
            setTimeout(() => {
                const modalContent = addProductModal.querySelector('.bg-white');
                if (modalContent) {
                    modalContent.classList.remove('scale-95', 'opacity-0');
                    modalContent.classList.add('scale-100', 'opacity-100');
                }
            }, 10);
            document.body.style.overflow = 'hidden';
        }
    }

    // Close add product modal
    function closeAddProductModal() {
        if (addProductModal) {
            const modalContent = addProductModal.querySelector('.bg-white');
            if (modalContent) {
                modalContent.classList.remove('scale-100', 'opacity-100');
                modalContent.classList.add('scale-95', 'opacity-0');
            }
            setTimeout(() => {
                addProductModal.classList.add('hidden');
                document.body.style.overflow = '';
                if (addProductForm) addProductForm.reset();
            }, 300);
        }
    }

    // Event listeners for add product modal
    if (addProductBtn) {
        addProductBtn.addEventListener('click', openAddProductModal);
    }

    if (closeAddProductModalBtn) {
        closeAddProductModalBtn.addEventListener('click', closeAddProductModal);
    }

    if (cancelAddProductBtn) {
        cancelAddProductBtn.addEventListener('click', closeAddProductModal);
    }

    if (addProductModal) {
        addProductModal.addEventListener('click', (e) => {
            if (e.target === addProductModal) {
                closeAddProductModal();
            }
        });
    }

    // Submit add product form
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const token = localStorage.getItem('token');
            if (!token) {
                showNotification('Iltimos, tizimga kiring!', 'error');
                return;
            }

            const submitBtn = addProductForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<svg class="w-5 h-5 inline-block mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>Saqlanmoqda...';

            const productData = {
                name: document.getElementById('new-product-name').value.trim(),
                category: document.getElementById('new-product-category').value,
                price: parseFloat(document.getElementById('new-product-price').value),
                quantity: parseInt(document.getElementById('new-product-quantity').value) || 0,
                stockStatus: document.getElementById('new-product-status').value,
                imageUrl: document.getElementById('new-product-image').value.trim() || null,
                description: document.getElementById('new-product-description').value.trim() || null
            };

            try {
                const response = await fetch(`${API_BASE_URL}/admin/products`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(productData)
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showNotification('Mahsulot muvaffaqiyatli qo\'shildi!', 'success');
                    closeAddProductModal();
                    // Reload products
                    await fetchAndDisplayProducts();
                } else {
                    showNotification(data.message || 'Xatolik yuz berdi!', 'error');
                }
            } catch (error) {
                console.error('Add product error:', error);
                showNotification('Tarmoq xatosi yuz berdi!', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // Check admin access on page load and after login
    checkAdminAccess();

    // Re-check admin access after login/logout
    const originalShowLoginModal = showLoginModal;
    window.showLoginModal = function() {
        originalShowLoginModal();
        setTimeout(checkAdminAccess, 100);
    };

    const originalLogout = logout;
    window.logout = function() {
        originalLogout();
        checkAdminAccess();
    };

    // Fade-in animation observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
});

// =========================================================
// INITIALIZATION MESSAGE
// =========================================================
console.log('%c✅ Auto Gas Uzbekistan Frontend Loaded', 'color: #10b981; font-size: 16px; font-weight: bold;');
console.log('%cBackend API:', 'color: #3b82f6; font-weight: bold;', API_BASE_URL);
console.log('%cVersion:', 'color: #3b82f6; font-weight: bold;', '2.1 Production Ready - Wishlist + Fixes');