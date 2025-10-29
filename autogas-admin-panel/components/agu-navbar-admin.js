// AGU Admin Navbar Component
// Barcha admin sahifalari uchun bir xil navbar
// Improved: Grouped dropdown menu

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

    // Grouped menu items
    menuGroups: [
        {
            id: 'main',
            label: 'Asosiy',
            icon: 'fa-home',
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt', url: 'dashboard.html' },
                { id: 'kontragents', label: 'Kontragentlar', icon: 'fa-users', url: 'kontragents.html' }
            ]
        },
        {
            id: 'warehouse',
            label: 'Ombor',
            icon: 'fa-warehouse',
            items: [
                { id: 'warehouses', label: 'Omborlar', icon: 'fa-warehouse', url: 'warehouses.html' },
                { id: 'inventory', label: 'Inventar', icon: 'fa-boxes', url: 'inventory.html' }
            ]
        },
        {
            id: 'logistics',
            label: 'Logistika',
            icon: 'fa-truck',
            items: [
                { id: 'transfers', label: 'Transferlar', icon: 'fa-exchange-alt', url: 'transfers.html' },
                { id: 'shipments', label: 'Jo\'natmalar', icon: 'fa-shipping-fast', url: 'shipments.html' }
            ]
        },
        {
            id: 'finance',
            label: 'Moliya',
            icon: 'fa-money-bill-wave',
            items: [
                { id: 'transactions', label: 'Tranzaksiyalar', icon: 'fa-dollar-sign', url: 'transactions.html' },
                { id: 'notifications', label: 'Bildirishnomalar', icon: 'fa-bell', url: 'notifications.html' }
            ]
        }
    ],

    // Check if group contains current page
    isGroupActive: (group) => {
        const currentPage = AGU_ADMIN_NAVBAR.getCurrentPage();
        return group.items.some(item => item.id === currentPage);
    },

    // Mobile menu toggle
    toggleMobileMenu: () => {
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('hidden');
        }
    },

    // Toggle dropdown
    toggleDropdown: (groupId) => {
        const dropdown = document.getElementById(`dropdown-${groupId}`);
        const icon = document.getElementById(`icon-${groupId}`);
        if (dropdown) {
            dropdown.classList.toggle('hidden');
            if (icon) {
                icon.style.transform = dropdown.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        }
    },

    // Generate navbar HTML
    getNavbarHTML: (userName = '') => {
        const currentPage = AGU_ADMIN_NAVBAR.getCurrentPage();

        let menuHTML = '';
        let mobileMenuHTML = '';

        // Desktop menu - Dropdown groups
        AGU_ADMIN_NAVBAR.menuGroups.forEach(group => {
            const isGroupActive = AGU_ADMIN_NAVBAR.isGroupActive(group);
            const activeClass = isGroupActive ? 'text-white font-semibold' : 'text-gray-300 hover:text-white';

            menuHTML += `
                <div class="relative group hidden lg:block">
                    <button class="${activeClass} px-3 py-2 rounded-lg transition-all flex items-center space-x-2">
                        <i class="fas ${group.icon}"></i>
                        <span class="hidden xl:inline">${group.label}</span>
                        <i class="fas fa-chevron-down text-xs"></i>
                    </button>
                    <div class="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        ${group.items.map(item => {
                            const isActive = item.id === currentPage;
                            const itemActiveClass = isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50';
                            return `
                                <a href="${item.url}" class="${itemActiveClass} px-4 py-3 flex items-center space-x-3 transition-colors first:rounded-t-lg last:rounded-b-lg">
                                    <i class="fas ${item.icon} w-5 text-sm"></i>
                                    <span class="text-sm">${item.label}</span>
                                </a>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });

        // Mobile menu - Expandable groups
        AGU_ADMIN_NAVBAR.menuGroups.forEach(group => {
            const isGroupActive = AGU_ADMIN_NAVBAR.isGroupActive(group);
            const groupActiveClass = isGroupActive ? 'bg-blue-700 text-white' : 'text-gray-300 hover:bg-blue-800 hover:text-white';

            mobileMenuHTML += `
                <div class="border-b border-gray-700 last:border-0">
                    <button onclick="AGU_ADMIN_NAVBAR.toggleDropdown('${group.id}')" class="${groupActiveClass} w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <i class="fas ${group.icon} w-5"></i>
                            <span class="font-medium">${group.label}</span>
                        </div>
                        <i class="fas fa-chevron-down text-xs transition-transform" id="icon-${group.id}"></i>
                    </button>
                    <div id="dropdown-${group.id}" class="hidden pl-8 py-2 space-y-1">
                        ${group.items.map(item => {
                            const isActive = item.id === currentPage;
                            const itemActiveClass = isActive ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:bg-blue-700 hover:text-white';
                            return `
                                <a href="${item.url}" class="${itemActiveClass} px-4 py-2 rounded-lg transition-colors flex items-center space-x-3 text-sm">
                                    <i class="fas ${item.icon} w-4 text-xs"></i>
                                    <span>${item.label}</span>
                                </a>
                            `;
                        }).join('')}
                    </div>
                </div>
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
                        <div class="hidden lg:flex items-center space-x-2 xl:space-x-3">
                            ${menuHTML}
                            <div class="border-l border-gray-600 pl-3 ml-2 flex items-center space-x-3">
                                <span id="userName" class="text-white font-medium text-sm">${userName}</span>
                                <button onclick="logout()" class="px-3 py-2 xl:px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm flex items-center space-x-2">
                                    <i class="fas fa-sign-out-alt"></i>
                                    <span class="hidden xl:inline">Chiqish</span>
                                </button>
                            </div>
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

                /* Dropdown hover effects */
                .group:hover > div {
                    display: block;
                }

                /* Smooth dropdown animation */
                @keyframes dropdownFade {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .group:hover > div {
                    animation: dropdownFade 0.2s ease-out;
                }

                /* Mobile dropdown animation */
                .dropdown-enter {
                    animation: slideDown 0.3s ease-out;
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
