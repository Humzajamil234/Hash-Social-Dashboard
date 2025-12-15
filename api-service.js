// Complete API Service for Hatch Social - REAL + MOCK HYBRID
class HybridAPIService {
    constructor() {
        this.baseURL = CONFIG.API.BASE_URL;
        this.token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        this.user = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA) || '{}');
        this.useRealAPI = false;
        this.mockService = null;
        this.isOnline = navigator.onLine;
        this.pendingRequests = [];
        this.requestQueue = [];
        this.cache = new Map();
        
        // Auto-detect API mode
        this.detectAPIMode();
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    detectAPIMode() {
        // Try to connect to real API
        this.testRealAPI().then(connected => {
            this.useRealAPI = connected;
            console.log(`🌐 API Mode: ${this.useRealAPI ? 'REAL' : 'MOCK'}`);
            
            // Initialize mock service if needed
            if (!this.useRealAPI) {
                this.mockService = new MockAPIService();
            }
        });
    }
    
    async testRealAPI() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${this.baseURL}/health`, {
                signal: controller.signal,
                method: 'GET'
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processPendingRequests();
            this.showToast('success', 'Back online! Syncing data...');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showToast('warning', 'You are offline. Changes saved locally.');
        });
        
        // Auto-sync every 30 seconds
        setInterval(() => this.processPendingRequests(), 30000);
    }
    
    // ==================== SMART REQUEST HANDLER ====================
    async smartRequest(endpoint, options = {}, useCache = true) {
        const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
        
        // Check cache first
        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
                return cached.data;
            }
        }
        
        try {
            let response;
            
            if (this.useRealAPI && this.isOnline) {
                response = await this.realRequest(endpoint, options);
            } else {
                response = await this.mockRequest(endpoint, options);
            }
            
            // Cache the response
            this.cache.set(cacheKey, {
                data: response,
                timestamp: Date.now()
            });
            
            return response;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            
            // Fallback to mock
            try {
                const mockResponse = await this.mockRequest(endpoint, options);
                this.showToast('warning', 'Using mock data (API unavailable)');
                return mockResponse;
            } catch (mockError) {
                throw new Error(`API and Mock both failed: ${error.message}`);
            }
        }
    }
    
    async realRequest(endpoint, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT);
        
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': this.token ? `Bearer ${this.token}` : ''
            }
        };
        
        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            
            // Queue for retry
            if (error.name !== 'AbortError') {
                this.requestQueue.push({ endpoint, options });
            }
            
            throw error;
        }
    }
    
    async mockRequest(endpoint, options) {
        if (!this.mockService) {
            this.mockService = new MockAPIService();
        }
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, CONFIG.MOCK.DELAY));
        
        // Parse endpoint to determine which mock method to call
        const endpointMap = {
            // Authentication
            '/api/login': () => {
                const body = JSON.parse(options.body || '{}');
                return this.mockService.login(body.email, body.password);
            },
            '/api/auth/logout': () => this.mockService.logout(),
            '/api/auth/me': () => this.mockService.getCurrentUser(),
            
            // Users
            '/api/auth/profile': () => {
                if (options.method === 'GET') {
                    const params = new URLSearchParams(endpoint.split('?')[1] || '');
                    return this.mockService.getUsers(Object.fromEntries(params));
                } else if (options.method === 'POST') {
                    const body = JSON.parse(options.body || '{}');
                    return this.mockService.createUser(body);
                }
            },
            '/api/auth/profile/': (id) => {
                if (options.method === 'GET') {
                    return this.mockService.getUserById(id);
                } else if (options.method === 'PUT') {
                    const body = JSON.parse(options.body || '{}');
                    return this.mockService.updateUser(id, body);
                } else if (options.method === 'DELETE') {
                    return this.mockService.deleteUser(id);
                }
            },
            
            // Dashboard
            '/api/auth/dashboard-stats': () => this.mockService.getDashboardStats(),
            '/api/auth/activities': () => this.mockService.getActivities(),
            
            // Interests
            '/api/auth/interest_list': () => this.mockService.getInterests(),
            '/api/auth/interest_detail/': (id) => this.mockService.getInterestById(id),
            
            // Reports
            '/api/auth/reports': () => this.mockService.getReports(),
            
            // Revenue
            '/api/auth/transaction': () => this.mockService.getTransactions(),
            
            // Communities
            '/api/auth/community': () => this.mockService.getCommunities(),
            
            // Posts
            '/api/auth/post': () => this.mockService.getPosts(),
            
            // Default
            'default': () => ({ status: 'success', data: [], message: 'Mock response' })
        };
        
        // Find matching endpoint
        for (const [pattern, handler] of Object.entries(endpointMap)) {
            if (endpoint.startsWith(pattern)) {
                const id = endpoint.replace(pattern, '');
                return await handler(id || undefined);
            }
        }
        
        return await endpointMap['default']();
    }
    
    async processPendingRequests() {
        if (!this.isOnline || this.requestQueue.length === 0) return;
        
        const queue = [...this.requestQueue];
        this.requestQueue = [];
        
        for (const request of queue) {
            try {
                await this.realRequest(request.endpoint, request.options);
                console.log(`✅ Processed queued request: ${request.endpoint}`);
            } catch (error) {
                console.error(`❌ Failed queued request: ${request.endpoint}`, error);
                this.requestQueue.push(request); // Retry later
            }
        }
    }
    
    // ==================== AUTHENTICATION APIS ====================
    async login(email, password) {
        const response = await this.smartRequest('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        }, false); // Don't cache login
        
        if (response.token) {
            this.setAuth(response.token, response.user);
            this.showToast('success', 'Login successful!');
        }
        
        return response;
    }
    
    async logout() {
        try {
            await this.smartRequest('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            // Ignore errors for logout
        }
        
        this.clearAuth();
        this.showToast('success', 'Logged out successfully!');
        return { status: 'success' };
    }
    
    async getCurrentUser() {
        return await this.smartRequest('/api/auth/me');
    }
    
    setAuth(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    }
    
    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
    }
    
    // ==================== USER MANAGEMENT APIS ====================
    async getUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.smartRequest(`/api/auth/profile${queryString ? '?' + queryString : ''}`);
    }
    
    async getUserById(id) {
        return await this.smartRequest(`/api/auth/profile/${id}`);
    }
    
    async createUser(userData) {
        const response = await this.smartRequest('/api/auth/profile', {
            method: 'POST',
            body: JSON.stringify(userData)
        }, false);
        
        this.showToast('success', 'User created successfully!');
        this.clearCache('users');
        return response;
    }
    
    async updateUser(id, userData) {
        const response = await this.smartRequest(`/api/auth/profile/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        }, false);
        
        this.showToast('success', 'User updated successfully!');
        this.clearCache('users');
        return response;
    }
    
    async deleteUser(id) {
        const response = await this.smartRequest(`/api/auth/profile/${id}`, {
            method: 'DELETE'
        }, false);
        
        this.showToast('success', 'User deleted successfully!');
        this.clearCache('users');
        return response;
    }
    
    // ==================== INTERESTS APIS ====================
    async getInterests(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.smartRequest(`/api/auth/interest_list${queryString ? '?' + queryString : ''}`);
    }
    
    async getInterestById(id) {
        return await this.smartRequest(`/api/auth/interest_detail/${id}`);
    }
    
    async createInterest(interestData) {
        const response = await this.smartRequest('/api/auth/interest', {
            method: 'POST',
            body: JSON.stringify(interestData)
        }, false);
        
        this.showToast('success', 'Interest created successfully!');
        this.clearCache('interests');
        return response;
    }
    
    // ==================== DASHBOARD APIS ====================
    async getDashboardStats() {
        return await this.smartRequest('/api/auth/dashboard-stats');
    }
    
    async getActivities() {
        return await this.smartRequest('/api/auth/activities');
    }
    
    // ==================== REPORTS APIS ====================
    async getReports(params = {}) {
        return await this.smartRequest('/api/auth/reports');
    }
    
    // ==================== REVENUE APIS ====================
    async getTransactions(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.smartRequest(`/api/auth/transaction${queryString ? '?' + queryString : ''}`);
    }
    
    // ==================== COMMUNITY APIS ====================
    async getCommunities(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.smartRequest(`/api/auth/community${queryString ? '?' + queryString : ''}`);
    }
    
    // ==================== POST APIS ====================
    async getPosts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.smartRequest(`/api/auth/post${queryString ? '?' + queryString : ''}`);
    }
    
    // ==================== UTILITY METHODS ====================
    clearCache(pattern = '') {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }
    
    showToast(type, message) {
        if (typeof window.showToast === 'function') {
            window.showToast(type, message);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
    
    // Health check
    async healthCheck() {
        try {
            await this.smartRequest('/api/health', {}, false);
            return { healthy: true, mode: this.useRealAPI ? 'REAL' : 'MOCK' };
        } catch (error) {
            return { healthy: false, mode: 'MOCK', error: error.message };
        }
    }
}

// ==================== MOCK API SERVICE ====================
class MockAPIService {
    constructor() {
        this.data = this.generateMockData();
        this.delay = CONFIG.MOCK.DELAY;
    }
    
    generateMockData() {
        const data = {
            users: [],
            interests: [],
            posts: [],
            communities: [],
            transactions: [],
            reports: [],
            activities: [],
            dashboardStats: null
        };
        
        // Generate users
        for (let i = 1; i <= CONFIG.MOCK.TOTAL_USERS; i++) {
            data.users.push({
                id: i,
                name: `User ${i}`,
                email: `user${i}@example.com`,
                type: ['explorer', 'creator', 'admin'][Math.floor(Math.random() * 3)],
                status: ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)],
                joinDate: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0],
                lastLogin: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
                profilePicture: `https://i.pravatar.cc/150?img=${i}`,
                bio: `This is bio of user ${i}`,
                location: ['New York', 'London', 'Tokyo'][Math.floor(Math.random() * 3)],
                followers: Math.floor(Math.random() * 1000),
                following: Math.floor(Math.random() * 500),
                postsCount: Math.floor(Math.random() * 50)
            });
        }
        
        // Generate interests
        const categories = ['Technology', 'Arts', 'Health', 'Food', 'Sports', 'Music', 'Travel'];
        for (let i = 1; i <= CONFIG.MOCK.TOTAL_INTERESTS; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            data.interests.push({
                id: i,
                name: `${category} ${i}`,
                category: category,
                description: `This is ${category.toLowerCase()} interest ${i}`,
                users: Math.floor(Math.random() * 1000),
                engagement: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
                status: Math.random() > 0.2 ? 'active' : 'inactive',
                createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString()
            });
        }
        
        // Generate transactions
        for (let i = 1; i <= CONFIG.MOCK.TOTAL_TRANSACTIONS; i++) {
            data.transactions.push({
                id: i,
                userId: Math.floor(Math.random() * CONFIG.MOCK.TOTAL_USERS) + 1,
                amount: parseFloat((Math.random() * 100 + 10).toFixed(2)),
                type: ['subscription', 'purchase', 'refund'][Math.floor(Math.random() * 3)],
                plan: ['Basic', 'Pro', 'Enterprise'][Math.floor(Math.random() * 3)],
                status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)],
                createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
                transactionId: `txn_${Math.random().toString(36).substr(2, 9)}`
            });
        }
        
        // Generate activities
        const actions = ['registered', 'logged in', 'created post', 'updated profile', 'made purchase'];
        for (let i = 1; i <= 20; i++) {
            data.activities.push({
                id: i,
                userId: Math.floor(Math.random() * CONFIG.MOCK.TOTAL_USERS) + 1,
                action: actions[Math.floor(Math.random() * actions.length)],
                type: ['user', 'system', 'payment'][Math.floor(Math.random() * 3)],
                timestamp: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
                details: `Activity ${i} details`,
                ip: `192.168.1.${Math.floor(Math.random() * 255)}`
            });
        }
        
        // Generate dashboard stats
        const totalRevenue = data.transactions
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + t.amount, 0);
        
        data.dashboardStats = {
            totalUsers: data.users.length,
            activeUsers: data.users.filter(u => u.status === 'active').length,
            totalInterests: data.interests.length,
            activeInterests: data.interests.filter(i => i.status === 'active').length,
            totalRevenue: totalRevenue,
            monthlyRevenue: totalRevenue * 0.3,
            activeSubscriptions: data.transactions.filter(t => 
                t.type === 'subscription' && t.status === 'completed'
            ).length,
            pendingReports: Math.floor(Math.random() * 20),
            growthRate: `${(Math.random() * 30 + 5).toFixed(1)}%`,
            engagementRate: `${(Math.random() * 40 + 50).toFixed(1)}%`
        };
        
        return data;
    }
    
    async delayResponse() {
        return new Promise(resolve => setTimeout(resolve, this.delay));
    }
    
    // Mock responses
    async login(email, password) {
        await this.delayResponse();
        
        if (email === 'admin@gmail.com' && password === '12345678') {
            return {
                status: 'success',
                token: 'mock_jwt_token_' + Date.now(),
                user: {
                    id: 1,
                    name: 'Admin User',
                    email: 'admin@gmail.com',
                    type: 'admin',
                    status: 'active'
                },
                message: 'Login successful'
            };
        }
        
        throw new Error('Invalid credentials');
    }
    
    async logout() {
        await this.delayResponse();
        return { status: 'success', message: 'Logged out' };
    }
    
    async getCurrentUser() {
        await this.delayResponse();
        return {
            status: 'success',
            data: {
                id: 1,
                name: 'Admin User',
                email: 'admin@gmail.com',
                type: 'admin',
                status: 'active'
            }
        };
    }
    
    async getUsers(params = {}) {
        await this.delayResponse();
        let users = [...this.data.users];
        
        // Apply filters
        if (params.status) users = users.filter(u => u.status === params.status);
        if (params.type) users = users.filter(u => u.type === params.type);
        if (params.search) {
            const search = params.search.toLowerCase();
            users = users.filter(u => 
                u.name.toLowerCase().includes(search) || 
                u.email.toLowerCase().includes(search)
            );
        }
        
        // Pagination
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || CONFIG.PAGINATION.DEFAULT_LIMIT;
        const start = (page - 1) * limit;
        
        return {
            status: 'success',
            data: users.slice(start, start + limit),
            total: users.length,
            page: page,
            limit: limit,
            totalPages: Math.ceil(users.length / limit)
        };
    }
    
    async getUserById(id) {
        await this.delayResponse();
        const user = this.data.users.find(u => u.id === parseInt(id));
        
        if (!user) {
            throw new Error('User not found');
        }
        
        return { status: 'success', data: user };
    }
    
    async createUser(userData) {
        await this.delayResponse();
        
        const newUser = {
            id: this.data.users.length + 1,
            ...userData,
            joinDate: new Date().toISOString().split('T')[0],
            lastLogin: null,
            followers: 0,
            following: 0,
            postsCount: 0
        };
        
        this.data.users.push(newUser);
        
        return {
            status: 'success',
            data: newUser,
            message: 'User created successfully'
        };
    }
    
    async updateUser(id, userData) {
        await this.delayResponse();
        
        const index = this.data.users.findIndex(u => u.id === parseInt(id));
        if (index === -1) {
            throw new Error('User not found');
        }
        
        this.data.users[index] = { ...this.data.users[index], ...userData };
        
        return {
            status: 'success',
            data: this.data.users[index],
            message: 'User updated successfully'
        };
    }
    
    async deleteUser(id) {
        await this.delayResponse();
        
        const index = this.data.users.findIndex(u => u.id === parseInt(id));
        if (index === -1) {
            throw new Error('User not found');
        }
        
        this.data.users.splice(index, 1);
        
        return {
            status: 'success',
            message: 'User deleted successfully'
        };
    }
    
    async getInterests(params = {}) {
        await this.delayResponse();
        
        let interests = [...this.data.interests];
        if (params.category) {
            interests = interests.filter(i => i.category === params.category);
        }
        
        return {
            status: 'success',
            data: interests
        };
    }
    
    async getInterestById(id) {
        await this.delayResponse();
        
        const interest = this.data.interests.find(i => i.id === parseInt(id));
        if (!interest) {
            throw new Error('Interest not found');
        }
        
        return { status: 'success', data: interest };
    }
    
    async getDashboardStats() {
        await this.delayResponse();
        return { status: 'success', data: this.data.dashboardStats };
    }
    
    async getActivities() {
        await this.delayResponse();
        return { status: 'success', data: this.data.activities };
    }
    
    async getReports() {
        await this.delayResponse();
        
        const reports = [
            { id: 1, content: 'Inappropriate post', reporter: 'user1', status: 'pending', date: '2024-03-15' },
            { id: 2, content: 'Spam account', reporter: 'user2', status: 'investigating', date: '2024-03-14' },
            { id: 3, content: 'Copyright issue', reporter: 'user3', status: 'resolved', date: '2024-03-13' }
        ];
        
        return { status: 'success', data: reports };
    }
    
    async getTransactions(params = {}) {
        await this.delayResponse();
        
        let transactions = [...this.data.transactions];
        if (params.type) {
            transactions = transactions.filter(t => t.type === params.type);
        }
        
        return {
            status: 'success',
            data: transactions,
            totals: {
                total: transactions.length,
                totalRevenue: transactions
                    .filter(t => t.status === 'completed')
                    .reduce((sum, t) => sum + t.amount, 0),
                pending: transactions.filter(t => t.status === 'pending').length
            }
        };
    }
    
    async getCommunities(params = {}) {
        await this.delayResponse();
        
        const communities = [
            { id: 1, name: 'Tech Enthusiasts', members: 1250, posts: 320, category: 'Technology' },
            { id: 2, name: 'Art Lovers', members: 890, posts: 210, category: 'Arts' },
            { id: 3, name: 'Fitness Group', members: 2100, posts: 540, category: 'Health' }
        ];
        
        return { status: 'success', data: communities };
    }
    
    async getPosts(params = {}) {
        await this.delayResponse();
        
        const posts = [
            { id: 1, userId: 1, content: 'First post!', likes: 45, comments: 12, shares: 3 },
            { id: 2, userId: 2, content: 'Check out my new artwork', likes: 120, comments: 24, shares: 8 },
            { id: 3, userId: 3, content: 'Fitness tips for beginners', likes: 89, comments: 15, shares: 5 }
        ];
        
        return { status: 'success', data: posts };
    }
}

// Create global instance
window.apiService = new HybridAPIService();

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HybridAPIService, MockAPIService };
}
