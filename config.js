// Configuration for Hatch Social Admin Dashboard
const CONFIG = {
    // API Configuration
    API: {
        BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000/api'
            : '/api',
        TIMEOUT: 30000,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000,
        USE_MOCK: true  // Auto-detect mode
    },
    
    // App Configuration
    APP: {
        NAME: 'Hatch Social',
        VERSION: '2.0.0',
        DESCRIPTION: 'Professional Admin Dashboard with API Integration',
        COPYRIGHT: '© 2025 Hatch Social. All rights reserved.',
        SUPPORT_EMAIL: 'support@hatchsocial.com'
    },
    
    // Feature Flags
    FEATURES: {
        OFFLINE_MODE: true,
        REAL_TIME_UPDATES: true,
        EXPORT_FUNCTIONALITY: true,
        BULK_ACTIONS: true,
        ADVANCED_FILTERS: true,
        AUTO_SYNC: true
    },
    
    // Pagination
    PAGINATION: {
        DEFAULT_LIMIT: 20,
        LIMIT_OPTIONS: [10, 20, 50, 100],
        MAX_PAGES_SHOWN: 5
    },
    
    // Mock Data Settings
    MOCK: {
        TOTAL_USERS: 50,
        TOTAL_INTERESTS: 30,
        TOTAL_POSTS: 100,
        TOTAL_TRANSACTIONS: 40,
        TOTAL_COMMUNITIES: 15,
        DELAY: 300
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
        CACHE: 'hatch_cache',
        MOCK_DATA: 'hatch_mock_data'
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
    
    // Date & Time Formats
    DATE_FORMATS: {
        SHORT: 'MMM dd, yyyy',
        MEDIUM: 'MMMM dd, yyyy',
        LONG: 'EEEE, MMMM dd, yyyy',
        TIME: 'hh:mm a',
        DATETIME: 'MMM dd, yyyy hh:mm a'
    }
};

// Utility Functions
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

CONFIG.getRandomId = function() {
    return Date.now() + Math.floor(Math.random() * 1000);
};

// Initialize
window.CONFIG = CONFIG;
console.log(`${CONFIG.APP.NAME} v${CONFIG.APP.VERSION} Configuration Loaded`);
