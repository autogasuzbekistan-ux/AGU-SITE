/**
 * AGU Utilities Component
 * Common utility functions for AGU marketplace
 * Version: 1.0.0
 */

const AGU_UTILS = {
    /**
     * Debounce function - prevents excessive function calls
     * @param {Function} func - Function to debounce
     * @param {Number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce: function(func, wait = 300) {
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

    /**
     * Show toast notification
     * @param {String} message - Message to display
     * @param {Boolean} isError - Whether it's an error message
     * @param {Number} duration - Duration in milliseconds
     */
    showToast: function(message, isError = false, duration = 3000) {
        // Get or create toast element
        let toast = document.getElementById('agu-toast');

        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'agu-toast';
            document.body.appendChild(toast);
        }

        // Set classes and content
        toast.className = `fixed top-24 right-5 text-white py-3 px-6 rounded-lg shadow-lg transform transition-transform duration-500 z-50 ${
            isError ? 'bg-red-500' : 'bg-green-500'
        }`;
        toast.textContent = message;

        // Show toast
        toast.style.transform = 'translateX(0)';

        // Hide toast after duration
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
        }, duration);
    },

    /**
     * Show loading state
     * @param {String} elementId - Element ID to show loading in
     * @param {String} message - Loading message
     */
    showLoading: function(elementId, message = 'Yuklanmoqda...') {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.innerHTML = `
            <div class="text-center py-12">
                <div class="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
                <p class="text-gray-600 text-lg">${message}</p>
            </div>
        `;
    },

    /**
     * Show error state
     * @param {String} elementId - Element ID to show error in
     * @param {String} message - Error message
     * @param {Function} retryCallback - Retry function
     */
    showError: function(elementId, message = 'Ma\'lumotlarni yuklashda xatolik', retryCallback = null) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.innerHTML = `
            <div class="text-center py-12 bg-white rounded-xl shadow-lg">
                <i class="fas fa-exclamation-circle text-6xl text-red-400 mb-4"></i>
                <p class="text-gray-600 text-lg mb-4">${message}</p>
                ${retryCallback ? `
                    <button onclick="${retryCallback}" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                        <i class="fas fa-sync-alt mr-2"></i>Qayta urinish
                    </button>
                ` : ''}
            </div>
        `;
    },

    /**
     * Show empty state
     * @param {String} elementId - Element ID to show empty state in
     * @param {String} message - Empty state message
     * @param {String} icon - Font Awesome icon class
     */
    showEmpty: function(elementId, message = 'Ma\'lumot topilmadi', icon = 'fa-inbox') {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.innerHTML = `
            <div class="text-center py-16 bg-white rounded-xl shadow-lg">
                <i class="fas ${icon} text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-600 text-xl font-semibold">${message}</p>
            </div>
        `;
    },

    /**
     * Validate form field
     * @param {String} value - Field value
     * @param {Object} rules - Validation rules
     * @returns {Object} Validation result
     */
    validateField: function(value, rules = {}) {
        const result = { valid: true, error: null };

        // Required check
        if (rules.required && (!value || value.trim() === '')) {
            result.valid = false;
            result.error = rules.requiredMessage || 'Bu maydon to\'ldirilishi shart';
            return result;
        }

        // Min length check
        if (rules.minLength && value.length < rules.minLength) {
            result.valid = false;
            result.error = rules.minLengthMessage || `Kamida ${rules.minLength} ta belgi bo'lishi kerak`;
            return result;
        }

        // Max length check
        if (rules.maxLength && value.length > rules.maxLength) {
            result.valid = false;
            result.error = rules.maxLengthMessage || `Maksimal ${rules.maxLength} ta belgi`;
            return result;
        }

        // Number check
        if (rules.number) {
            const num = parseFloat(value);
            if (isNaN(num)) {
                result.valid = false;
                result.error = rules.numberMessage || 'Raqam kiriting';
                return result;
            }

            // Min value check
            if (rules.min !== undefined && num < rules.min) {
                result.valid = false;
                result.error = rules.minMessage || `Minimal qiymat: ${rules.min}`;
                return result;
            }

            // Max value check
            if (rules.max !== undefined && num > rules.max) {
                result.valid = false;
                result.error = rules.maxMessage || `Maksimal qiymat: ${rules.max}`;
                return result;
            }
        }

        // Email check
        if (rules.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                result.valid = false;
                result.error = rules.emailMessage || 'To\'g\'ri email kiriting';
                return result;
            }
        }

        // Phone check (Uzbekistan format)
        if (rules.phone) {
            const phoneRegex = /^(\+998)?[0-9]{9}$/;
            if (!phoneRegex.test(value.replace(/[\s-]/g, ''))) {
                result.valid = false;
                result.error = rules.phoneMessage || 'To\'g\'ri telefon raqam kiriting';
                return result;
            }
        }

        return result;
    },

    /**
     * Sanitize HTML to prevent XSS attacks
     * @param {String} html - HTML string to sanitize
     * @returns {String} Sanitized HTML
     */
    sanitizeHTML: function(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    },

    /**
     * Escape HTML special characters
     * @param {String} text - Text to escape
     * @returns {String} Escaped text
     */
    escapeHTML: function(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };
        return String(text).replace(/[&<>"'/]/g, (char) => map[char]);
    },

    /**
     * Format currency
     * @param {Number} amount - Amount to format
     * @param {String} currency - Currency symbol
     * @returns {String} Formatted currency
     */
    formatCurrency: function(amount, currency = 'so\'m') {
        return `${parseFloat(amount).toLocaleString('uz-UZ')} ${currency}`;
    },

    /**
     * Format date
     * @param {String|Date} date - Date to format
     * @param {String} locale - Locale
     * @returns {String} Formatted date
     */
    formatDate: function(date, locale = 'uz-UZ') {
        return new Date(date).toLocaleDateString(locale);
    },

    /**
     * Format date with time
     * @param {String|Date} date - Date to format
     * @param {String} locale - Locale
     * @returns {String} Formatted date and time
     */
    formatDateTime: function(date, locale = 'uz-UZ') {
        const d = new Date(date);
        return `${d.toLocaleDateString(locale)} ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
    },

    /**
     * Confirm dialog
     * @param {String} message - Confirmation message
     * @returns {Boolean} User's choice
     */
    confirm: function(message) {
        return confirm(message);
    },

    /**
     * Loading button state
     * @param {HTMLElement} button - Button element
     * @param {Boolean} loading - Loading state
     * @param {String} loadingText - Loading text
     */
    setButtonLoading: function(button, loading, loadingText = 'Yuklanmoqda...') {
        if (!button) return;

        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${loadingText}`;
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    },

    /**
     * Get status badge HTML
     * @param {String} status - Status value
     * @param {Object} statusConfig - Status configuration
     * @returns {String} Badge HTML
     */
    getStatusBadge: function(status, statusConfig = {}) {
        const config = {
            'pending': { text: 'Kutilmoqda', class: 'bg-yellow-100 text-yellow-800', icon: 'fa-clock' },
            'processing': { text: 'Tayyorlanmoqda', class: 'bg-blue-100 text-blue-800', icon: 'fa-cog' },
            'completed': { text: 'Yakunlandi', class: 'bg-green-100 text-green-800', icon: 'fa-check-circle' },
            'cancelled': { text: 'Bekor qilindi', class: 'bg-red-100 text-red-800', icon: 'fa-times-circle' },
            'in_stock': { text: 'Mavjud', class: 'bg-green-100 text-green-800', icon: 'fa-check' },
            'low_stock': { text: 'Kam', class: 'bg-yellow-100 text-yellow-800', icon: 'fa-exclamation' },
            'out_of_stock': { text: 'Tugagan', class: 'bg-red-100 text-red-800', icon: 'fa-times' },
            ...statusConfig
        };

        const statusInfo = config[status] || { text: status, class: 'bg-gray-100 text-gray-800', icon: 'fa-circle' };

        return `
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.class}">
                <i class="fas ${statusInfo.icon} mr-1"></i>
                ${statusInfo.text}
            </span>
        `;
    },

    /**
     * Copy to clipboard
     * @param {String} text - Text to copy
     * @returns {Promise<Boolean>} Success status
     */
    copyToClipboard: async function(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Nusxalandi', false);
            return true;
        } catch (err) {
            console.error('Copy failed:', err);
            this.showToast('Nusxalashda xatolik', true);
            return false;
        }
    },

    /**
     * Download file
     * @param {String} content - File content
     * @param {String} filename - File name
     * @param {String} type - MIME type
     */
    downloadFile: function(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }
};

// Make AGU_UTILS globally available
window.AGU_UTILS = AGU_UTILS;

console.log('✅ AGU Utils Component loaded');
