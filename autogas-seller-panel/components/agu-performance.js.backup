// AGU Performance Optimizer
// Barcha sahifalar uchun performance yaxshilash

const AGU_PERFORMANCE = {
    // Cache system
    cache: new Map(),
    cacheExpiry: 5 * 60 * 1000, // 5 minut

    // Get cached data
    getCached: (key) => {
        const cached = AGU_PERFORMANCE.cache.get(key);
        if (!cached) return null;

        const now = Date.now();
        if (now - cached.timestamp > AGU_PERFORMANCE.cacheExpiry) {
            AGU_PERFORMANCE.cache.delete(key);
            return null;
        }

        return cached.data;
    },

    // Set cache
    setCache: (key, data) => {
        AGU_PERFORMANCE.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    },

    // Optimized fetch with cache
    fetchWithCache: async (url, options = {}) => {
        const cacheKey = url + JSON.stringify(options);

        // Check cache first
        const cached = AGU_PERFORMANCE.getCached(cacheKey);
        if (cached) {
            console.log('📦 Cache hit:', url);
            return cached;
        }

        // Fetch from API
        console.log('🌐 API call:', url);
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Cache the result
        AGU_PERFORMANCE.setCache(cacheKey, data);

        return data;
    },

    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle: (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Loading indicator
    showLoading: (elementId = 'loading-indicator') => {
        let indicator = document.getElementById(elementId);
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = elementId;
            indicator.className = 'fixed top-20 right-5 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2';
            indicator.innerHTML = `
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Yuklanmoqda...</span>
            `;
            document.body.appendChild(indicator);
        }
        indicator.style.display = 'flex';
    },

    hideLoading: (elementId = 'loading-indicator') => {
        const indicator = document.getElementById(elementId);
        if (indicator) {
            indicator.style.display = 'none';
        }
    },

    // Optimized API wrapper
    api: {
        get: async (endpoint, useCache = true) => {
            const API_URL = 'http://127.0.0.1:8000/api';
            const token = localStorage.getItem('token');

            const url = `${API_URL}${endpoint}`;
            const options = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            AGU_PERFORMANCE.showLoading();

            try {
                const data = useCache
                    ? await AGU_PERFORMANCE.fetchWithCache(url, options)
                    : await (await fetch(url, options)).json();

                return data;
            } catch (error) {
                console.error('API Error:', error);
                throw error;
            } finally {
                AGU_PERFORMANCE.hideLoading();
            }
        },

        post: async (endpoint, body) => {
            const API_URL = 'http://127.0.0.1:8000/api';
            const token = localStorage.getItem('token');

            AGU_PERFORMANCE.showLoading();

            try {
                const response = await fetch(`${API_URL}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Clear cache for related endpoints
                AGU_PERFORMANCE.cache.clear();

                return await response.json();
            } finally {
                AGU_PERFORMANCE.hideLoading();
            }
        },

        put: async (endpoint, body) => {
            const API_URL = 'http://127.0.0.1:8000/api';
            const token = localStorage.getItem('token');

            AGU_PERFORMANCE.showLoading();

            try {
                const response = await fetch(`${API_URL}${endpoint}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Clear cache
                AGU_PERFORMANCE.cache.clear();

                return await response.json();
            } finally {
                AGU_PERFORMANCE.hideLoading();
            }
        },

        delete: async (endpoint) => {
            const API_URL = 'http://127.0.0.1:8000/api';
            const token = localStorage.getItem('token');

            AGU_PERFORMANCE.showLoading();

            try {
                const response = await fetch(`${API_URL}${endpoint}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Clear cache
                AGU_PERFORMANCE.cache.clear();

                return await response.json();
            } finally {
                AGU_PERFORMANCE.hideLoading();
            }
        }
    },

    // Clear all cache
    clearCache: () => {
        AGU_PERFORMANCE.cache.clear();
        console.log('🗑️ Cache cleared');
    },

    // Initialize
    init: () => {
        // Clear cache every 10 minutes
        setInterval(() => {
            console.log('🧹 Auto-clearing old cache...');
            AGU_PERFORMANCE.cache.clear();
        }, 10 * 60 * 1000);

        console.log('⚡ AGU Performance Optimizer initialized');
    }
};

// Auto-initialize
if (typeof window !== 'undefined') {
    window.AGU_PERFORMANCE = AGU_PERFORMANCE;
    document.addEventListener('DOMContentLoaded', () => {
        AGU_PERFORMANCE.init();
    });
}
