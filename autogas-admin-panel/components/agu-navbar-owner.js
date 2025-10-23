// AGU Owner Navbar Component
// Owner panel sahifalari uchun bir xil navbar

const AGU_NAVBAR_OWNER = {
    // Current page detection
    getCurrentPage: () => {
        const path = window.location.pathname;
        if (path.includes('dashboard')) return 'dashboard';
        if (path.includes('admins')) return 'admins';
        if (path.includes('kontragents')) return 'kontragents';
        if (path.includes('activities')) return 'activities';
        return 'dashboard';
    },

    // Menu items
    menuItems: [
        { id: 'dashboard', label: 'Bosh sahifa', icon: 'fa-chart-line', url: 'dashboard.html' },
        { id: 'admins', label: 'Adminlar', icon: 'fa-user-shield', url: 'admins.html' },
        { id: 'kontragents', label: 'Kontragentlar', icon: 'fa-users', url: 'kontragents.html' },
        { id: 'activities', label: 'Faoliyat', icon: 'fa-history', url: 'activities.html' }
    ],

    // Generate navbar HTML
    getNavbarHTML: (userName = '') => {
        const currentPage = AGU_NAVBAR_OWNER.getCurrentPage();

        let menuHTML = '';
        AGU_NAVBAR_OWNER.menuItems.forEach(item => {
            const isActive = item.id === currentPage;
            const activeClass = isActive ? 'text-white font-semibold' : 'text-gray-300 hover:text-white';

            menuHTML += `
                <a href="${item.url}" class="${activeClass} transition-colors">
                    <i class="fas ${item.icon} mr-1"></i>${item.label}
                </a>
            `;
        });

        return `
            <nav class="bg-gradient-to-r from-purple-900 via-gray-800 to-pink-900 shadow-lg sticky top-0 z-50">
                <div class="container mx-auto px-6 py-4">
                    <div class="flex items-center justify-between">
                        <!-- Logo -->
                        <a href="dashboard.html" class="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                            <div class="text-3xl font-extrabold agu-logo-navbar">
                                <span style="color: #E30613">AG</span><span style="color: #1b5bb5">U</span><sup style="font-size: 0.5em; color: #fff">®</sup>
                            </div>
                            <div>
                                <div class="text-white font-semibold text-sm">Auto Gas Uzbekistan</div>
                                <div class="text-gray-300 text-xs">Owner Panel</div>
                            </div>
                        </a>

                        <!-- Menu -->
                        <div class="flex items-center space-x-6">
                            ${menuHTML}
                            <span id="userName" class="text-white font-medium">${userName}</span>
                            <button onclick="logout()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all transform hover:scale-105">
                                <i class="fas fa-sign-out-alt mr-2"></i>Chiqish
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
        if (!token && !window.location.pathname.includes('login')) {
            window.location.href = '../index.html';
            return;
        }

        // Load user info
        AGU_NAVBAR_OWNER.loadUserInfo();

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
            navbarContainer.innerHTML = AGU_NAVBAR_OWNER.getNavbarHTML();
            AGU_NAVBAR_OWNER.loadUserInfo();
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
if (typeof window !== 'undefined' && !window.location.pathname.includes('login')) {
    window.AGU_NAVBAR_OWNER = AGU_NAVBAR_OWNER;
    document.addEventListener('DOMContentLoaded', () => {
        AGU_NAVBAR_OWNER.init();
        AGU_NAVBAR_OWNER.render();
    });
}
