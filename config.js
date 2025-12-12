// Configuration for Hatch Social Admin Dashboard
const CONFIG = {
    // API Configuration
    API: {
        BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000/api'
            : '/api',
        TIMEOUT: 30000,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000
    },
    
    // App Configuration
    APP: {
        NAME: 'Hatch Social',
        VERSION: '1.2.0',
        DESCRIPTION: 'Professional Admin Dashboard',
        COPYRIGHT: '© 2025 Hatch Social. All rights reserved.',
        SUPPORT_EMAIL: 'support@hatchsocial.com'
    },
    
    // Feature Flags
    FEATURES: {
        OFFLINE_MODE: true,
        REAL_TIME_UPDATES: true,
        EXPORT_FUNCTIONALITY: true,
        BULK_ACTIONS: true,
        ADVANCED_FILTERS: true
    },
    
    // Pagination
    PAGINATION: {
        DEFAULT_LIMIT: 20,
        LIMIT_OPTIONS: [10, 20, 50, 100],
        MAX_PAGES_SHOWN: 5
    },
    
    // Charts Configuration
    CHARTS: {
        COLORS: {
            PRIMARY: '#3A57E8',
            SECONDARY: '#7C4DFF',
            SUCCESS: '#2ED573',
            WARNING: '#FFA502',
            DANGER: '#FF4757',
            INFO: '#2D8CF0'
        },
        ANIMATION_DURATION: 1000
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        AUTH_TOKEN: 'hatch_admin_token',
        USER_DATA: 'hatch_admin_user',
        SETTINGS: 'hatch_settings',
        OFFLINE_DATA: 'hatch_offline_data',
        CACHE: 'hatch_cache'
    },
    
    // Default Settings
    DEFAULT_SETTINGS: {
        THEME: 'dark',
        NOTIFICATIONS: true,
        AUTO_REFRESH: true,
        REFRESH_INTERVAL: 30000,
        LANGUAGE: 'en',
        TIMEZONE: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    
    // Notification Types
    NOTIFICATION_TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    },
    
    // User Types
    USER_TYPES: {
        ADMIN: 'admin',
        CREATOR: 'creator',
        EXPLORER: 'explorer',
        MODERATOR: 'moderator'
    },
    
    // Status Types
    STATUS_TYPES: {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        PENDING: 'pending',
        SUSPENDED: 'suspended',
        BANNED: 'banned'
    },
    
    // Content Types
    CONTENT_TYPES: {
        POST: 'post',
        COMMENT: 'comment',
        MESSAGE: 'message',
        EVENT: 'event',
        PRODUCT: 'product'
    },
    
    // Report Types
    REPORT_TYPES: {
        SPAM: 'spam',
        INAPPROPRIATE: 'inappropriate',
        HARASSMENT: 'harassment',
        COPYRIGHT: 'copyright',
        OTHER: 'other'
    },
    
    // Subscription Plans
    SUBSCRIPTION_PLANS: {
        BASIC: {
            id: 1,
            name: 'Basic',
            price: 9.99,
            duration: 'monthly',
            features: ['Basic features', 'Limited storage', 'Standard support']
        },
        PRO: {
            id: 2,
            name: 'Pro',
            price: 19.99,
            duration: 'monthly',
            features: ['All features', 'More storage', 'Priority support']
        },
        ENTERPRISE: {
            id: 3,
            name: 'Enterprise',
            price: 49.99,
            duration: 'monthly',
            features: ['Enterprise features', 'Unlimited storage', '24/7 support']
        }
    },
    
    // Date & Time Formats
    DATE_FORMATS: {
        SHORT: 'MMM dd, yyyy',
        MEDIUM: 'MMMM dd, yyyy',
        LONG: 'EEEE, MMMM dd, yyyy',
        TIME: 'hh:mm a',
        DATETIME: 'MMM dd, yyyy hh:mm a'
    },
    
    // Validation Rules
    VALIDATION: {
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PASSWORD: {
            MIN_LENGTH: 6,
            REQUIRE_UPPERCASE: true,
            REQUIRE_LOWERCASE: true,
            REQUIRE_NUMBER: true,
            REQUIRE_SPECIAL: false
        },
        USERNAME: {
            MIN_LENGTH: 3,
            MAX_LENGTH: 30,
            ALLOWED_CHARS: /^[a-zA-Z0-9_.-]+$/
        }
    },
    
    // Error Messages
    ERROR_MESSAGES: {
        NETWORK_ERROR: 'Network error. Please check your internet connection.',
        SERVER_ERROR: 'Server error. Please try again later.',
        UNAUTHORIZED: 'Your session has expired. Please login again.',
        FORBIDDEN: 'You do not have permission to perform this action.',
        NOT_FOUND: 'The requested resource was not found.',
        VALIDATION_ERROR: 'Please check your input and try again.',
        UNKNOWN_ERROR: 'An unknown error occurred. Please try again.'
    },
    
    // Success Messages
    SUCCESS_MESSAGES: {
        LOGIN: 'Login successful!',
        LOGOUT: 'Logged out successfully!',
        CREATE: 'Item created successfully!',
        UPDATE: 'Item updated successfully!',
        DELETE: 'Item deleted successfully!',
        SAVE: 'Changes saved successfully!',
        IMPORT: 'Data imported successfully!',
        EXPORT: 'Data exported successfully!'
    },
    
    // Loading Messages
    LOADING_MESSAGES: [
        'Loading your data...',
        'Almost there...',
        'Fetching the latest information...',
        'Preparing your dashboard...',
        'Just a moment...'
    ],
    
    // Demo Credentials (for development only)
    DEMO_CREDENTIALS: {
        EMAIL: 'admin@hatchsocial.com',
        PASSWORD: 'admin123',
        USER: {
            id: 1,
            name: 'Admin User',
            email: 'admin@hatchsocial.com',
            type: 'admin',
            status: 'active',
            created_at: '2024-01-01T00:00:00Z'
        }
    }
};

// Export configuration
window.CONFIG = CONFIG;

// Utility functions
CONFIG.formatDate = function(dateString, format = 'SHORT') {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const formats = this.DATE_FORMATS;
    
    switch(format) {
        case 'SHORT':
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        case 'MEDIUM':
            return date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        case 'LONG':
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        case 'TIME':
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        case 'DATETIME':
            return `${this.formatDate(dateString, 'SHORT')} ${this.formatDate(dateString, 'TIME')}`;
        default:
            return date.toLocaleDateString();
    }
};

CONFIG.formatCurrency = function(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

CONFIG.getRandomLoadingMessage = function() {
    return this.LOADING_MESSAGES[
        Math.floor(Math.random() * this.LOADING_MESSAGES.length)
    ];
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    console.log(`${CONFIG.APP.NAME} v${CONFIG.APP.VERSION} initialized`);
});