/**
 * Notification Bell Component
 * Usage: Include this script in your HTML and call initNotificationBell()
 */

const NOTIFICATION_API_URL = 'http://localhost:8000/api';
let notificationDropdownOpen = false;

// Initialize notification bell
function initNotificationBell() {
    // Create notification bell HTML
    const bellHTML = `
        <div class="relative" id="notificationBellContainer">
            <button onclick="toggleNotificationDropdown()" class="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none">
                <i class="fas fa-bell text-xl"></i>
                <span id="notificationBadge" class="hidden absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    0
                </span>
            </button>

            <!-- Dropdown -->
            <div id="notificationDropdown" class="hidden absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
                <!-- Header -->
                <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-800">Bildirishnomalar</h3>
                    <button onclick="markAllNotificationsRead()" class="text-xs text-blue-600 hover:text-blue-800">
                        Barchasini o'qilgan
                    </button>
                </div>

                <!-- Notifications List -->
                <div id="notificationDropdownList" class="overflow-y-auto max-h-80">
                    <div class="flex items-center justify-center py-8">
                        <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
                    </div>
                </div>

                <!-- Footer -->
                <div class="px-4 py-3 border-t border-gray-200">
                    <a href="notifications.html" class="block text-center text-sm text-blue-600 hover:text-blue-800 font-semibold">
                        Barchasini ko'rish <i class="fas fa-arrow-right ml-1"></i>
                    </a>
                </div>
            </div>
        </div>
    `;

    // Find the placeholder or inject into navigation
    const placeholder = document.getElementById('notificationBellPlaceholder');
    if (placeholder) {
        placeholder.innerHTML = bellHTML;
    } else {
        console.warn('Notification bell placeholder not found');
    }

    // Load initial notifications
    loadNotificationCount();
    loadRecentNotifications();

    // Auto-refresh every 30 seconds
    setInterval(() => {
        loadNotificationCount();
        if (notificationDropdownOpen) {
            loadRecentNotifications();
        }
    }, 30000);

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const container = document.getElementById('notificationBellContainer');
        if (container && !container.contains(event.target)) {
            closeNotificationDropdown();
        }
    });
}

// Load notification count
async function loadNotificationCount() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${NOTIFICATION_API_URL}/notifications/unread-count`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateNotificationBadge(data.unread_count);
        }
    } catch (error) {
        console.error('Error loading notification count:', error);
    }
}

// Load recent notifications
async function loadRecentNotifications() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${NOTIFICATION_API_URL}/notifications/recent?limit=5`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayRecentNotifications(data.notifications);
        }
    } catch (error) {
        console.error('Error loading recent notifications:', error);
    }
}

// Update notification badge
function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;

    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// Display recent notifications
function displayRecentNotifications(notifications) {
    const container = document.getElementById('notificationDropdownList');
    if (!container) return;

    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8 text-gray-400">
                <i class="fas fa-bell-slash text-3xl mb-2"></i>
                <p class="text-sm">Bildirishnoma yo'q</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notifications.map(notification => {
        const iconColor = getNotificationIconColor(notification.color);
        const readClass = notification.is_read ? 'bg-white' : 'bg-blue-50';

        return `
            <div class="${readClass} px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition"
                 onclick="openNotification(${notification.id}, '${notification.action_url || ''}')">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 rounded-full ${iconColor} flex items-center justify-center">
                            <i class="fas ${notification.icon} text-white text-sm"></i>
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-gray-900 mb-1">${notification.title}</p>
                        <p class="text-xs text-gray-600 line-clamp-2">${notification.message}</p>
                        <p class="text-xs text-gray-400 mt-1">${notification.time_ago}</p>
                    </div>
                    ${!notification.is_read ? '<div class="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Toggle dropdown
function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;

    if (notificationDropdownOpen) {
        closeNotificationDropdown();
    } else {
        openNotificationDropdown();
    }
}

// Open dropdown
function openNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;

    dropdown.classList.remove('hidden');
    notificationDropdownOpen = true;
    loadRecentNotifications();
}

// Close dropdown
function closeNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;

    dropdown.classList.add('hidden');
    notificationDropdownOpen = false;
}

// Open notification
async function openNotification(id, actionUrl) {
    const token = localStorage.getItem('token');

    // Mark as read
    try {
        await fetch(`${NOTIFICATION_API_URL}/notifications/${id}/read`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Refresh count and list
        loadNotificationCount();
        loadRecentNotifications();

        // Navigate to action URL
        if (actionUrl && actionUrl !== 'null') {
            window.location.href = actionUrl;
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Mark all as read
async function markAllNotificationsRead() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${NOTIFICATION_API_URL}/notifications/mark-all-read`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            loadNotificationCount();
            loadRecentNotifications();
        }
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

// Helper function for icon color
function getNotificationIconColor(color) {
    const colors = {
        'green': 'bg-green-500',
        'blue': 'bg-blue-500',
        'red': 'bg-red-500',
        'orange': 'bg-orange-500',
        'purple': 'bg-purple-500',
        'gray': 'bg-gray-500'
    };
    return colors[color] || 'bg-gray-500';
}

// Auto-initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotificationBell);
} else {
    initNotificationBell();
}
