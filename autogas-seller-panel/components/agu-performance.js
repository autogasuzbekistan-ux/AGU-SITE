// AGU Performance Optimizer v2.0
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
            console.log("📦 Cache hit:", url);
            return cached;
        }

        // Fetch from API
        console.log("🌐 API call:", url);
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
    showLoading: (elementId = "loading-indicator") => {
        let indicator = document.getElementById(elementId);
        if (!indicator) {
            indicator = document.createElement("div");
            indicator.id = elementId;
            indicator.className = "fixed top-20 right-5 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2";
            indicator.innerHTML = `
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Yuklanmoqda...</span>
            `;
            document.body.appendChild(indicator);
        }
        indicator.style.display = "flex";
    },

    hideLoading: (elementId = "loading-indicator") => {
        const indicator = document.getElementById(elementId);
        if (indicator) {
            indicator.style.display = "none";
        }
    },

    // Network error handler
    handleNetworkError: (error) => {
        console.error("Network Error:", error);

        let message = "Tarmoq xatosi yuz berdi";

        if (error.message.includes("401")) {
            message = "Avtorizatsiya xatosi. Qaytadan kiring!";
            setTimeout(() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "login.html";
            }, 2000);
        } else if (error.message.includes("403")) {
            message = "Ruxsat yo\'q!";
        } else if (error.message.includes("404")) {
            message = "Ma\'lumot topilmadi";
        } else if (error.message.includes("500")) {
            message = "Server xatosi";
        } else if (error.message.includes("Failed to fetch")) {
            message = "Serverga ulanishda muammo. Internetni tekshiring!";
        }

        return message;
    },

    // Optimized API wrapper
    api: {
        get: async (endpoint, useCache = true) => {
            const API_URL = "http://127.0.0.1:8000/api";
            const token = localStorage.getItem("token");

            const url = `${API_URL}${endpoint}`;
            const options = {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            };

            AGU_PERFORMANCE.showLoading();

            try {
                const data = useCache
                    ? await AGU_PERFORMANCE.fetchWithCache(url, options)
                    : await (await fetch(url, options)).json();

                return data;
            } catch (error) {
                const errorMessage = AGU_PERFORMANCE.handleNetworkError(error);
                throw new Error(errorMessage);
            } finally {
                AGU_PERFORMANCE.hideLoading();
            }
        },

        post: async (endpoint, body) => {
            const API_URL = "http://127.0.0.1:8000/api";
            const token = localStorage.getItem("token");

            AGU_PERFORMANCE.showLoading();

            try {
                const response = await fetch(`${API_URL}${endpoint}`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Clear cache
                AGU_PERFORMANCE.cache.clear();

                return await response.json();
            } catch (error) {
                const errorMessage = AGU_PERFORMANCE.handleNetworkError(error);
                throw new Error(errorMessage);
            } finally {
                AGU_PERFORMANCE.hideLoading();
            }
        },

        put: async (endpoint, body) => {
            const API_URL = "http://127.0.0.1:8000/api";
            const token = localStorage.getItem("token");

            AGU_PERFORMANCE.showLoading();

            try {
                const response = await fetch(`${API_URL}${endpoint}`, {
                    method: "PUT",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Clear cache
                AGU_PERFORMANCE.cache.clear();

                return await response.json();
            } catch (error) {
                const errorMessage = AGU_PERFORMANCE.handleNetworkError(error);
                throw new Error(errorMessage);
            } finally {
                AGU_PERFORMANCE.hideLoading();
            }
        },

        delete: async (endpoint) => {
            const API_URL = "http://127.0.0.1:8000/api";
            const token = localStorage.getItem("token");

            AGU_PERFORMANCE.showLoading();

            try {
                const response = await fetch(`${API_URL}${endpoint}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Clear cache
                AGU_PERFORMANCE.cache.clear();

                return await response.json();
            } catch (error) {
                const errorMessage = AGU_PERFORMANCE.handleNetworkError(error);
                throw new Error(errorMessage);
            } finally {
                AGU_PERFORMANCE.hideLoading();
            }
        }
    },

    // Image lazy loading
    lazyLoadImages: () => {
        const images = document.querySelectorAll("img[data-src]");
        if (images.length === 0) return;

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute("data-src");
                    observer.unobserve(img);
                    console.log("🖼️ Image loaded:", img.src);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    },

    // LocalStorage manager with expiry
    storage: {
        set: (key, value, expiryMinutes = null) => {
            const item = {
                value: value,
                timestamp: Date.now(),
                expiry: expiryMinutes ? Date.now() + (expiryMinutes * 60 * 1000) : null
            };
            localStorage.setItem(key, JSON.stringify(item));
        },

        get: (key) => {
            const itemStr = localStorage.getItem(key);
            if (!itemStr) return null;

            try {
                const item = JSON.parse(itemStr);

                // Check expiry
                if (item.expiry && Date.now() > item.expiry) {
                    localStorage.removeItem(key);
                    return null;
                }

                return item.value;
            } catch (e) {
                // If not JSON, return as is
                return itemStr;
            }
        },

        remove: (key) => {
            localStorage.removeItem(key);
        },

        clear: () => {
            localStorage.clear();
        },

        // Clean expired items
        cleanExpired: () => {
            Object.keys(localStorage).forEach(key => {
                AGU_PERFORMANCE.storage.get(key);
            });
        }
    },

    // Clear all cache
    clearCache: () => {
        AGU_PERFORMANCE.cache.clear();
        console.log("🗑️ Cache cleared");
    },

    // Performance monitoring
    monitor: {
        startTime: null,

        start: (label = "Operation") => {
            AGU_PERFORMANCE.monitor.startTime = performance.now();
            console.log(`⏱️ ${label} started`);
        },

        end: (label = "Operation") => {
            if (!AGU_PERFORMANCE.monitor.startTime) return;

            const duration = performance.now() - AGU_PERFORMANCE.monitor.startTime;
            console.log(`✅ ${label} completed in ${duration.toFixed(2)}ms`);

            AGU_PERFORMANCE.monitor.startTime = null;
            return duration;
        }
    },

    // Initialize
    init: () => {
        // Clear cache every 10 minutes
        setInterval(() => {
            console.log("🧹 Auto-clearing old cache...");
            AGU_PERFORMANCE.cache.clear();
        }, 10 * 60 * 1000);

        // Clean expired localStorage items
        AGU_PERFORMANCE.storage.cleanExpired();

        // Initialize lazy loading after DOM loaded
        setTimeout(() => {
            AGU_PERFORMANCE.lazyLoadImages();
        }, 100);

        console.log("⚡ AGU Performance Optimizer v2.0 initialized");
        console.log("📊 Cache expiry: 5 minutes");
        console.log("🔄 Auto-clear interval: 10 minutes");
    }
};

// Auto-initialize
if (typeof window !== "undefined") {
    window.AGU_PERFORMANCE = AGU_PERFORMANCE;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            AGU_PERFORMANCE.init();
        });
    } else {
        AGU_PERFORMANCE.init();
    }
}
