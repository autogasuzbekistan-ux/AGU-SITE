// AGU Admin Navbar Component
// Barcha admin sahifalari uchun bir xil navbar

const AGU_ADMIN_NAVBAR = {
    // Current page detection
    getCurrentPage: () => {
        const path = window.location.pathname;
        if (path.includes('dashboard')) return 'dashboard';
        if (path.includes('warehouses')) return 'warehouses';
        if (path.includes('inventory')) return 'inventory';
        if (path.includes('transfers')) return 'transfers';
        if (path.includes('transactions')) return 'transactions';
        if (path.includes('shipments')) return 'shipments';
        if (path.includes('kontragents')) return 'kontragents';
        if (path.includes('notifications')) return 'notifications';
        if (path.includes('products')) return 'products';
        if (path.includes('orders')) return 'orders';
        return 'dashboard';
    },

    // Menu items
    menuItems: [
        { id: 'dashboard', label: 'Bosh sahifa', icon: 'fa-home', url: 'dashboard.html' },
        { id: 'kontragents', label: 'Kontragentlar', icon: 'fa-users', url: 'kontragents.html' },
        { id: 'warehouses', label: 'Omborlar', icon: 'fa-warehouse', url: 'warehouses.html' },
        { id: 'inventory', label: 'Inventar', icon: 'fa-boxes', url: 'inventory.html' },
        { id: 'transfers', label: 'Transferlar', icon: 'fa-exchange-alt', url: 'transfers.html' },
        { id: 'transactions', label: 'Tranzaksiyalar', icon: 'fa-money-bill-wave', url: 'transactions.html' },
        { id: 'shipments', label: 'Jo\'natmalar', icon: 'fa-truck', url: 'shipments.html' },
        { id: 'notifications', label: 'Bildirishnomalar', icon: 'fa-bell', url: 'notifications.html' }
    ],

    // Mobile menu toggle
    toggleMobileMenu: () => {
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('hidden');
        }
    },

    // Generate navbar HTML
    getNavbarHTML: (userName = '') => {
        const currentPage = AGU_ADMIN_NAVBAR.getCurrentPage();

        let menuHTML = '';
        let mobileMenuHTML = '';

        AGU_ADMIN_NAVBAR.menuItems.forEach(item => {
            const isActive = item.id === currentPage;
            const activeClass = isActive ? 'text-white font-semibold' : 'text-gray-300 hover:text-white';
            const mobileActiveClass = isActive ? 'bg-blue-700 text-white font-semibold' : 'text-gray-300 hover:bg-blue-800 hover:text-white';

            // Desktop menu
            menuHTML += `
                <a href="${item.url}" class="${activeClass} transition-colors hidden lg:block">
                    <i class="fas ${item.icon} mr-1"></i><span class="hidden xl:inline">${item.label}</span>
                </a>
            `;

            // Mobile menu
            mobileMenuHTML += `
                <a href="${item.url}" class="${mobileActiveClass} px-4 py-3 rounded-lg transition-colors flex items-center space-x-3">
                    <i class="fas ${item.icon} w-5"></i>
                    <span>${item.label}</span>
                </a>
            `;
        });

        return `
            <nav class="bg-gradient-to-r from-blue-900 via-gray-800 to-red-900 shadow-lg sticky top-0 z-50">
                <div class="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div class="flex items-center justify-between">
                        <!-- Logo -->
                        <a href="dashboard.html" class="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
                            <div class="text-2xl sm:text-3xl font-extrabold agu-logo-navbar">
                                <span style="color: #E30613">AG</span><span style="color: #1b5bb5">U</span><sup style="font-size: 0.5em; color: #fff">®</sup>
                            </div>
                            <div class="hidden sm:block">
                                <div class="text-white font-semibold text-xs sm:text-sm">Auto Gas Uzbekistan</div>
                                <div class="text-yellow-300 text-xs">
                                    <i class="fas fa-shield-alt mr-1"></i>Admin Panel
                                </div>
                            </div>
                        </a>

                        <!-- Desktop Menu -->
                        <div class="hidden lg:flex items-center space-x-4 xl:space-x-6">
                            ${menuHTML}
                            <span id="userName" class="text-white font-medium text-sm">${userName}</span>
                            <button onclick="logout()" class="px-3 py-2 xl:px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm">
                                <i class="fas fa-sign-out-alt mr-1 xl:mr-2"></i><span class="hidden xl:inline">Chiqish</span>
                            </button>
                        </div>

                        <!-- Mobile Menu Button -->
                        <button onclick="AGU_ADMIN_NAVBAR.toggleMobileMenu()" class="lg:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <i class="fas fa-bars text-2xl"></i>
                        </button>
                    </div>

                    <!-- Mobile Menu -->
                    <div id="mobileMenu" class="hidden lg:hidden mt-4 pb-4 space-y-2">
                        ${mobileMenuHTML}
                        <div class="px-4 py-3 text-white border-t border-gray-600 mt-2 pt-3">
                            <span id="userNameMobile" class="block text-sm font-medium mb-2">${userName}</span>
                            <button onclick="logout()" class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center justify-center space-x-2">
                                <i class="fas fa-sign-out-alt"></i>
                                <span>Chiqish</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    },

    // Initialize navbar
    init: () => {
        // Check authentication
        const token = localStorage.getItem('token');
        if (!token && !window.location.pathname.includes('index.html')) {
            window.location.href = '../index.html';
            return;
        }

        // Load user info
        AGU_ADMIN_NAVBAR.loadUserInfo();

        // Add navbar styles
        document.head.insertAdjacentHTML('beforeend', `
            <style>
                @keyframes slideDown {
                    from {
                        transform: translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                nav {
                    animation: slideDown 0.5s ease-out;
                }

                .agu-logo-navbar:hover {
                    animation: pulse 0.6s ease-in-out;
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            </style>
        `);
    },

    // Load user info
    loadUserInfo: async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('http://127.0.0.1:8000/api/user', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    userNameElement.textContent = data.name;
                }
            }
        } catch (error) {
            console.error('User info load error:', error);
        }
    },

    // Render navbar
    render: () => {
        const navbarContainer = document.getElementById('agu-navbar');
        if (navbarContainer) {
            navbarContainer.innerHTML = AGU_ADMIN_NAVBAR.getNavbarHTML();
            AGU_ADMIN_NAVBAR.loadUserInfo();
        }
    }
};

// Logout function (global)
function logout() {
    if (confirm('Tizimdan chiqishga ishonchingiz komilmi?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../index.html';
    }
}

// Auto-initialize
if (typeof window !== 'undefined' && !window.location.pathname.includes('index.html')) {
    window.AGU_ADMIN_NAVBAR = AGU_ADMIN_NAVBAR;
    document.addEventListener('DOMContentLoaded', () => {
        AGU_ADMIN_NAVBAR.init();
        AGU_ADMIN_NAVBAR.render();
    });
}
