// Mock API Service for Hatch Social - COMPLETE MOCK IMPLEMENTATION
class MockAPIService {
    constructor() {
        this.mockDelay = 500;
        this.mockData = this.generateMockData();
        this.token = 'mock_jwt_token_1234567890';
        this.user = {
            id: 1,
            name: "Admin User",
            email: "admin@gmail.com",
            type: "admin",
            status: "active",
            created_at: "2024-01-01T00:00:00Z"
        };
    }

    generateMockData() {
        const mockUsers = [];
        const mockInterests = [];
        const mockPosts = [];
        const mockCommunities = [];
        const mockTransactions = [];
        const mockEvents = [];
        const mockFeeds = [];
        const mockStreams = [];
        const mockProducts = [];
        const mockComments = [];

        // Generate 50 mock users
        for (let i = 1; i <= 50; i++) {
            const types = ['explorer', 'creator', 'admin'];
            const statuses = ['active', 'inactive', 'pending'];
            mockUsers.push({
                id: i,
                name: `User ${i}`,
                email: `user${i}@example.com`,
                type: types[Math.floor(Math.random() * types.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
                last_login: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
                profile_picture: `https://i.pravatar.cc/150?img=${i}`,
                bio: `This is the bio of user ${i}`,
                location: ['New York', 'London', 'Tokyo', 'Sydney', 'Berlin'][Math.floor(Math.random() * 5)],
                followers_count: Math.floor(Math.random() * 1000),
                following_count: Math.floor(Math.random() * 500)
            });
        }

        // Generate 20 mock interests
        const interestCategories = ['Technology', 'Arts', 'Health', 'Food', 'Sports', 'Music', 'Travel', 'Business'];
        for (let i = 1; i <= 20; i++) {
            const category = interestCategories[Math.floor(Math.random() * interestCategories.length)];
            mockInterests.push({
                id: i,
                name: `${category} Interest ${i}`,
                category: category,
                description: `This is a ${category.toLowerCase()} interest`,
                user_count: Math.floor(Math.random() * 1000),
                engagement: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
                status: Math.random() > 0.2 ? 'active' : 'inactive',
                created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
                trending_score: Math.floor(Math.random() * 100),
                icon: `fas fa-${['heart', 'star', 'flag', 'book', 'music'][Math.floor(Math.random() * 5)]}`
            });
        }

        // Generate 30 mock posts
        const postTypes = ['text', 'image', 'video', 'poll', 'event'];
        for (let i = 1; i <= 30; i++) {
            const type = postTypes[Math.floor(Math.random() * postTypes.length)];
            mockPosts.push({
                id: i,
                user_id: Math.floor(Math.random() * 50) + 1,
                content: `This is post content ${i} of type ${type}`,
                type: type,
                likes_count: Math.floor(Math.random() * 500),
                comments_count: Math.floor(Math.random() * 100),
                shares_count: Math.floor(Math.random() * 50),
                created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
                status: Math.random() > 0.1 ? 'active' : 'reported',
                reported_count: Math.random() > 0.8 ? Math.floor(Math.random() * 5) : 0,
                media_url: type === 'image' ? `https://picsum.photos/800/600?random=${i}` : 
                           type === 'video' ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' : null,
                hashtags: [`#hashtag${i}`, `#social`, `#community`]
            });
        }

        // Generate 15 mock communities
        for (let i = 1; i <= 15; i++) {
            const category = interestCategories[Math.floor(Math.random() * interestCategories.length)];
            mockCommunities.push({
                id: i,
                name: `${category} Community ${i}`,
                description: `This is a community for ${category.toLowerCase()} enthusiasts`,
                category: category,
                member_count: Math.floor(Math.random() * 5000),
                post_count: Math.floor(Math.random() * 1000),
                created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
                status: Math.random() > 0.1 ? 'active' : 'inactive',
                privacy: ['public', 'private', 'protected'][Math.floor(Math.random() * 3)],
                cover_image: `https://picsum.photos/1200/400?random=${i}`,
                rules: ['Be respectful', 'No spam', 'Stay on topic']
            });
        }

        // Generate 40 mock transactions
        const transactionTypes = ['subscription', 'purchase', 'refund', 'withdrawal'];
        const plans = ['Basic', 'Pro', 'Enterprise', 'Premium'];
        for (let i = 1; i <= 40; i++) {
            const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
            mockTransactions.push({
                id: i,
                user_id: Math.floor(Math.random() * 50) + 1,
                amount: parseFloat((Math.random() * 100).toFixed(2)),
                type: type,
                plan: type === 'subscription' ? plans[Math.floor(Math.random() * plans.length)] : null,
                status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)],
                created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
                transaction_id: `txn_${Math.random().toString(36).substr(2, 9)}`,
                payment_method: ['credit_card', 'paypal', 'bank_transfer'][Math.floor(Math.random() * 3)]
            });
        }

        // Generate 10 mock events
        for (let i = 1; i <= 10; i++) {
            const startDate = new Date(Date.now() + Math.random() * 10000000000);
            mockEvents.push({
                id: i,
                title: `Event ${i}: Community Meetup`,
                description: `This is event ${i} description`,
                start_date: startDate.toISOString(),
                end_date: new Date(startDate.getTime() + 7200000).toISOString(), // 2 hours later
                location: ['Virtual', 'New York', 'London', 'Tokyo'][Math.floor(Math.random() * 4)],
                organizer_id: Math.floor(Math.random() * 50) + 1,
                attendees_count: Math.floor(Math.random() * 200),
                status: ['upcoming', 'ongoing', 'completed'][Math.floor(Math.random() * 3)],
                created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
                cover_image: `https://picsum.photos/800/400?random=${i + 100}`
            });
        }

        // Generate 25 mock feeds
        for (let i = 1; i <= 25; i++) {
            mockFeeds.push({
                id: i,
                name: `Feed ${i}`,
                description: `This is feed ${i} for curated content`,
                follower_count: Math.floor(Math.random() * 1000),
                post_count: Math.floor(Math.random() * 100),
                created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
                status: 'active',
                category: interestCategories[Math.floor(Math.random() * interestCategories.length)],
                curator_id: Math.floor(Math.random() * 50) + 1,
                is_featured: Math.random() > 0.7
            });
        }

        // Generate 8 mock streams
        for (let i = 1; i <= 8; i++) {
            const isLive = Math.random() > 0.5;
            mockStreams.push({
                id: i,
                title: `Live Stream ${i}`,
                description: `This is live stream ${i}`,
                host_id: Math.floor(Math.random() * 50) + 1,
                viewer_count: Math.floor(Math.random() * 1000),
                status: isLive ? 'live' : 'ended',
                started_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
                ended_at: isLive ? null : new Date(Date.now() - Math.random() * 1800000).toISOString(),
                thumbnail: `https://picsum.photos/800/450?random=${i + 200}`,
                category: interestCategories[Math.floor(Math.random() * interestCategories.length)]
            });
        }

        // Generate 20 mock products
        for (let i = 1; i <= 20; i++) {
            mockProducts.push({
                id: i,
                name: `Product ${i}`,
                description: `This is product ${i} description`,
                price: parseFloat((Math.random() * 100).toFixed(2)),
                community_id: Math.floor(Math.random() * 15) + 1,
                seller_id: Math.floor(Math.random() * 50) + 1,
                stock: Math.floor(Math.random() * 100),
                sold_count: Math.floor(Math.random() * 50),
                status: Math.random() > 0.1 ? 'available' : 'out_of_stock',
                created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
                images: [`https://picsum.photos/400/400?random=${i + 300}`]
            });
        }

        // Generate 100 mock comments
        for (let i = 1; i <= 100; i++) {
            mockComments.push({
                id: i,
                post_id: Math.floor(Math.random() * 30) + 1,
                user_id: Math.floor(Math.random() * 50) + 1,
                content: `This is comment ${i} on the post`,
                likes_count: Math.floor(Math.random() * 50),
                created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
                status: 'active',
                parent_id: Math.random() > 0.7 ? Math.floor(Math.random() * i) : null
            });
        }

        return {
            users: mockUsers,
            interests: mockInterests,
            posts: mockPosts,
            communities: mockCommunities,
            transactions: mockTransactions,
            events: mockEvents,
            feeds: mockFeeds,
            streams: mockStreams,
            products: mockProducts,
            comments: mockComments
        };
    }

    // Simulate delay
    async delay(ms = null) {
        return new Promise(resolve => setTimeout(resolve, ms || this.mockDelay));
    }

    // Mock response
    mockResponse(data, success = true, message = null) {
        return {
            status: success ? 'success' : 'error',
            message: message || (success ? 'Operation successful' : 'Operation failed'),
            data: data,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    // ==================== AUTHENTICATION ====================
    async login(email, password) {
        await this.delay();
        
        // Demo credentials
        if (email === 'admin@hatchsocial.com' && password === 'admin123') {
            return this.mockResponse({
                token: this.token,
                user: this.user
            });
        }
        
        return this.mockResponse(null, false, 'Invalid credentials');
    }

    async logout() {
        await this.delay();
        return this.mockResponse({ message: 'Logged out successfully' });
    }

    async getCurrentUser() {
        await this.delay();
        return this.mockResponse(this.user);
    }

    // ==================== USERS ====================
    async getUsers(params = {}) {
        await this.delay();
        let users = [...this.mockData.users];
        
        // Apply filters
        if (params.status) {
            users = users.filter(user => user.status === params.status);
        }
        
        if (params.type) {
            users = users.filter(user => user.type === params.type);
        }
        
        if (params.search) {
            const search = params.search.toLowerCase();
            users = users.filter(user => 
                user.name.toLowerCase().includes(search) || 
                user.email.toLowerCase().includes(search)
            );
        }
        
        // Pagination
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 20;
        const start = (page - 1) * limit;
        const end = start + limit;
        
        return this.mockResponse({
            data: users.slice(start, end),
            total: users.length,
            page: page,
            limit: limit,
            total_pages: Math.ceil(users.length / limit)
        });
    }

    async getUserById(id) {
        await this.delay();
        const user = this.mockData.users.find(u => u.id === parseInt(id));
        if (!user) {
            return this.mockResponse(null, false, 'User not found');
        }
        return this.mockResponse(user);
    }

    async createUser(userData) {
        await this.delay();
        const newId = this.mockData.users.length + 1;
        const newUser = {
            id: newId,
            ...userData,
            created_at: new Date().toISOString(),
            last_login: null,
            followers_count: 0,
            following_count: 0
        };
        this.mockData.users.push(newUser);
        return this.mockResponse(newUser, true, 'User created successfully');
    }

    async updateUser(id, userData) {
        await this.delay();
        const index = this.mockData.users.findIndex(u => u.id === parseInt(id));
        if (index === -1) {
            return this.mockResponse(null, false, 'User not found');
        }
        this.mockData.users[index] = { ...this.mockData.users[index], ...userData };
        return this.mockResponse(this.mockData.users[index], true, 'User updated successfully');
    }

    async deleteUser(id) {
        await this.delay();
        const index = this.mockData.users.findIndex(u => u.id === parseInt(id));
        if (index === -1) {
            return this.mockResponse(null, false, 'User not found');
        }
        this.mockData.users.splice(index, 1);
        return this.mockResponse({ id: parseInt(id) }, true, 'User deleted successfully');
    }

    // ==================== INTERESTS ====================
    async getInterests(params = {}) {
        await this.delay();
        let interests = [...this.mockData.interests];
        
        if (params.category) {
            interests = interests.filter(interest => interest.category === params.category);
        }
        
        if (params.status) {
            interests = interests.filter(interest => interest.status === params.status);
        }
        
        return this.mockResponse(interests);
    }

    async getInterestById(id) {
        await this.delay();
        const interest = this.mockData.interests.find(i => i.id === parseInt(id));
        if (!interest) {
            return this.mockResponse(null, false, 'Interest not found');
        }
        return this.mockResponse(interest);
    }

    // ==================== POSTS ====================
    async getPosts(params = {}) {
        await this.delay();
        let posts = [...this.mockData.posts];
        
        if (params.type) {
            posts = posts.filter(post => post.type === params.type);
        }
        
        if (params.status) {
            posts = posts.filter(post => post.status === params.status);
        }
        
        if (params.user_id) {
            posts = posts.filter(post => post.user_id === parseInt(params.user_id));
        }
        
        // Pagination
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 20;
        const start = (page - 1) * limit;
        const end = start + limit;
        
        return this.mockResponse({
            data: posts.slice(start, end),
            total: posts.length,
            page: page,
            limit: limit
        });
    }

    // ==================== COMMUNITIES ====================
    async getCommunities(params = {}) {
        await this.delay();
        let communities = [...this.mockData.communities];
        
        if (params.category) {
            communities = communities.filter(community => community.category === params.category);
        }
        
        if (params.privacy) {
            communities = communities.filter(community => community.privacy === params.privacy);
        }
        
        return this.mockResponse(communities);
    }

    // ==================== TRANSACTIONS ====================
    async getTransactions(params = {}) {
        await this.delay();
        let transactions = [...this.mockData.transactions];
        
        if (params.type) {
            transactions = transactions.filter(t => t.type === params.type);
        }
        
        if (params.status) {
            transactions = transactions.filter(t => t.status === params.status);
        }
        
        // Calculate totals
        const totalRevenue = transactions
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const monthlyRevenue = transactions
            .filter(t => t.status === 'completed' && 
                   new Date(t.created_at).getMonth() === new Date().getMonth())
            .reduce((sum, t) => sum + t.amount, 0);
        
        const activeSubscriptions = transactions
            .filter(t => t.type === 'subscription' && t.status === 'completed')
            .length;
        
        return this.mockResponse({
            data: transactions,
            totals: {
                total_revenue: parseFloat(totalRevenue.toFixed(2)),
                monthly_revenue: parseFloat(monthlyRevenue.toFixed(2)),
                active_subscriptions: activeSubscriptions,
                avg_transaction: transactions.length > 0 ? 
                    parseFloat((totalRevenue / transactions.length).toFixed(2)) : 0
            }
        });
    }

    // ==================== EVENTS ====================
    async getEvents(params = {}) {
        await this.delay();
        let events = [...this.mockData.events];
        
        if (params.status) {
            events = events.filter(event => event.status === params.status);
        }
        
        return this.mockResponse(events);
    }

    // ==================== FEEDS ====================
    async getFeeds(params = {}) {
        await this.delay();
        return this.mockResponse(this.mockData.feeds);
    }

    // ==================== STREAMS ====================
    async getStreamingData(params = {}) {
        await this.delay();
        return this.mockResponse(this.mockData.streams);
    }

    // ==================== PRODUCTS ====================
    async getProducts(communityId) {
        await this.delay();
        const products = this.mockData.products.filter(p => p.community_id === parseInt(communityId));
        return this.mockResponse(products);
    }

    // ==================== COMMENTS ====================
    async getComments(params = {}) {
        await this.delay();
        let comments = [...this.mockData.comments];
        
        if (params.post_id) {
            comments = comments.filter(comment => comment.post_id === parseInt(params.post_id));
        }
        
        return this.mockResponse(comments);
    }

    // ==================== NOTIFICATIONS ====================
    async getNotifications(profileId) {
        await this.delay();
        const notifications = [
            { id: 1, type: 'new_user', message: 'New user registered', read: false, created_at: new Date().toISOString() },
            { id: 2, type: 'new_post', message: 'New post created', read: false, created_at: new Date().toISOString() },
            { id: 3, type: 'report', message: 'Content reported', read: true, created_at: new Date().toISOString() },
            { id: 4, type: 'subscription', message: 'New subscription', read: false, created_at: new Date().toISOString() },
            { id: 5, type: 'warning', message: 'System maintenance scheduled', read: true, created_at: new Date().toISOString() }
        ];
        return this.mockResponse(notifications);
    }

    // ==================== SUBSCRIPTION PLANS ====================
    async getSubscriptionPlans() {
        await this.delay();
        const plans = [
            { id: 1, name: 'Basic', price: 9.99, duration: 'monthly', features: ['Basic features', 'Limited storage'], active_users: 125 },
            { id: 2, name: 'Pro', price: 19.99, duration: 'monthly', features: ['All features', 'More storage'], active_users: 68 },
            { id: 3, name: 'Enterprise', price: 49.99, duration: 'monthly', features: ['Enterprise features', 'Unlimited storage'], active_users: 12 }
        ];
        return this.mockResponse(plans);
    }

    // ==================== DASHBOARD STATS ====================
    async getDashboardStats() {
        await this.delay();
        const today = new Date();
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const recentUsers = this.mockData.users.filter(u => 
            new Date(u.created_at) > lastWeek
        ).length;
        
        const recentPosts = this.mockData.posts.filter(p => 
            new Date(p.created_at) > lastWeek
        ).length;
        
        const reportedPosts = this.mockData.posts.filter(p => 
            p.status === 'reported'
        ).length;
        
        const totalRevenue = this.mockData.transactions
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const monthlyRevenue = this.mockData.transactions
            .filter(t => t.status === 'completed' && new Date(t.created_at) > lastMonth)
            .reduce((sum, t) => sum + t.amount, 0);
        
        return this.mockResponse({
            total_users: this.mockData.users.length,
            total_interests: this.mockData.interests.length,
            total_posts: this.mockData.posts.length,
            total_communities: this.mockData.communities.length,
            reported_posts: reportedPosts,
            recent_users: recentUsers,
            recent_posts: recentPosts,
            total_revenue: parseFloat(totalRevenue.toFixed(2)),
            monthly_revenue: parseFloat(monthlyRevenue.toFixed(2)),
            active_subscriptions: this.mockData.transactions.filter(t => 
                t.type === 'subscription' && t.status === 'completed'
            ).length,
            engagement_rate: '75%',
            growth_rate: '12.5%'
        });
    }

    // ==================== ACTIVITIES ====================
    async getActivities() {
        await this.delay();
        const activities = [
            { id: 1, user: 'John Doe', action: 'User registered', type: 'user', time: '10 min ago', status: 'completed' },
            { id: 2, user: 'Sarah Williams', action: 'Upgraded to Pro plan', type: 'subscription', time: '45 min ago', status: 'completed' },
            { id: 3, user: 'System', action: 'Daily backup completed', type: 'system', time: '2 hours ago', status: 'completed' },
            { id: 4, user: 'Michael Chen', action: 'Content reported', type: 'moderation', time: '3 hours ago', status: 'pending' },
            { id: 5, user: 'Admin', action: 'Banned user for violation', type: 'moderation', time: '5 hours ago', status: 'completed' },
            { id: 6, user: 'Emma Johnson', action: 'Created new community', type: 'community', time: '1 day ago', status: 'completed' },
            { id: 7, user: 'David Brown', action: 'Added new product', type: 'product', time: '2 days ago', status: 'completed' },
            { id: 8, user: 'System', action: 'Monthly report generated', type: 'report', time: '3 days ago', status: 'completed' }
        ];
        return this.mockResponse(activities);
    }

    // ==================== MODERATION ====================
    async getModerationLogs() {
        await this.delay();
        const logs = [
            { id: 1, content: 'Post #1234', user: 'user123', action: 'Flagged', moderator: 'admin', date: '2024-03-10', status: 'pending' },
            { id: 2, content: 'Comment #5678', user: 'user456', action: 'Removed', moderator: 'auto-mod', date: '2024-03-09', status: 'resolved' },
            { id: 3, content: 'Profile #9012', user: 'user789', action: 'Suspended', moderator: 'admin', date: '2024-03-08', status: 'active' },
            { id: 4, content: 'Post #3456', user: 'user101', action: 'Warned', moderator: 'admin', date: '2024-03-07', status: 'resolved' },
            { id: 5, content: 'Comment #7890', user: 'user202', action: 'Approved', moderator: 'auto-mod', date: '2024-03-06', status: 'resolved' }
        ];
        return this.mockResponse(logs);
    }

    // ==================== OTHER APIS ====================
    async searchUsers(searchTerm) {
        await this.delay();
        const users = this.mockData.users.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return this.mockResponse(users);
    }

    async searchCommunities(searchTerm) {
        await this.delay();
        const communities = this.mockData.communities.filter(community => 
            community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            community.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return this.mockResponse(communities);
    }

    async getHashtagsList() {
        await this.delay();
        const hashtags = ['#social', '#community', '#tech', '#art', '#health', '#food', '#sports', '#music'];
        return this.mockResponse(hashtags);
    }

    async clearCache() {
        await this.delay();
        return this.mockResponse({ message: 'Cache cleared successfully' });
    }

    async runCron() {
        await this.delay();
        return this.mockResponse({ message: 'Cron job executed successfully' });
    }
}

// Mock fetch function for development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const mockService = new MockAPIService();
    const originalFetch = window.fetch;
    
    // Mock API endpoints
    const mockEndpoints = {
        // Authentication
        '/api/login': async (options) => {
            const body = JSON.parse(options.body || '{}');
            return mockService.login(body.email, body.password);
        },
        
        '/api/auth/logout': async () => {
            return mockService.logout();
        },
        
        '/api/auth/me': async () => {
            return mockService.getCurrentUser();
        },
        
        // Users
        '/api/auth/profile': async (options, params) => {
            if (options.method === 'GET') {
                return mockService.getUsers(params);
            } else if (options.method === 'POST') {
                const body = JSON.parse(options.body || '{}');
                return mockService.createUser(body);
            }
        },
        
        '/api/auth/profile/:id': async (options, params, id) => {
            if (options.method === 'GET') {
                return mockService.getUserById(id);
            } else if (options.method === 'PUT') {
                const body = JSON.parse(options.body || '{}');
                return mockService.updateUser(id, body);
            } else if (options.method === 'DELETE') {
                return mockService.deleteUser(id);
            }
        },
        
        // Interests
        '/api/auth/interest_list': async (options, params) => {
            return mockService.getInterests(params);
        },
        
        '/api/auth/interest_detail/:id': async (options, params, id) => {
            return mockService.getInterestById(id);
        },
        
        // Posts
        '/api/auth/post': async (options, params) => {
            return mockService.getPosts(params);
        },
        
        // Communities
        '/api/auth/community': async (options, params) => {
            return mockService.getCommunities(params);
        },
        
        // Transactions
        '/api/auth/transaction': async (options, params) => {
            return mockService.getTransactions(params);
        },
        
        // Events
        '/api/auth/event': async (options, params) => {
            return mockService.getEvents(params);
        },
        
        // Feeds
        '/api/auth/show-feed': async (options, params) => {
            return mockService.getFeeds(params);
        },
        
        // Streaming
        '/api/auth/streaming': async (options, params) => {
            return mockService.getStreamingData(params);
        },
        
        // Products
        '/api/auth/products/:communityId': async (options, params, communityId) => {
            return mockService.getProducts(communityId);
        },
        
        // Comments
        '/api/auth/comment': async (options, params) => {
            return mockService.getComments(params);
        },
        
        // Notifications
        '/api/auth/notification-list/:profileId': async (options, params, profileId) => {
            return mockService.getNotifications(profileId);
        },
        
        // Subscription plans
        '/api/auth/package_list': async () => {
            return mockService.getSubscriptionPlans();
        },
        
        // Search
        '/api/auth/member_search': async (options) => {
            const body = JSON.parse(options.body || '{}');
            return mockService.searchUsers(body.search);
        },
        
        '/api/auth/search': async (options) => {
            const body = JSON.parse(options.body || '{}');
            return mockService.searchCommunities(body.search);
        },
        
        // Hashtags
        '/api/auth/hashtags_list': async () => {
            return mockService.getHashtagsList();
        },
        
        // Dashboard stats
        '/api/auth/dashboard-stats': async () => {
            return mockService.getDashboardStats();
        },
        
        // Activities
        '/api/auth/activities': async () => {
            return mockService.getActivities();
        },
        
        // Moderation
        '/api/auth/moderation-logs': async () => {
            return mockService.getModerationLogs();
        },
        
        // Utility
        '/api/clear-cache': async () => {
            return mockService.clearCache();
        },
        
        '/api/cron': async () => {
            return mockService.runCron();
        }
    };
    
    window.fetch = async function(url, options = {}) {
        // Parse query parameters
        const urlObj = new URL(url, window.location.origin);
        const path = urlObj.pathname;
        const params = Object.fromEntries(urlObj.searchParams.entries());
        
        // Check if this is a mock endpoint
        for (const [endpointPattern, handler] of Object.entries(mockEndpoints)) {
            const pattern = endpointPattern.replace(/:[^/]+/g, '([^/]+)');
            const regex = new RegExp(`^${pattern}$`);
            const match = path.match(regex);
            
            if (match) {
                const id = match[1];
                try {
                    const response = await handler(options, params, id);
                    return {
                        ok: response.status === 'success',
                        status: response.status === 'success' ? 200 : 400,
                        statusText: response.status === 'success' ? 'OK' : 'Bad Request',
                        json: () => Promise.resolve(response),
                        text: () => Promise.resolve(JSON.stringify(response))
                    };
                } catch (error) {
                    return {
                        ok: false,
                        status: 500,
                        statusText: 'Internal Server Error',
                        json: () => Promise.resolve({ 
                            status: 'error', 
                            message: error.message 
                        })
                    };
                }
            }
        }
        
        // If not a mock endpoint, use original fetch
        return originalFetch(url, options);
    };
    
    // Make mock service available globally
    window.mockService = mockService;
    
    // Auto-login for demo
    setTimeout(() => {
        if (!localStorage.getItem('hatch_admin_token')) {
            mockService.login('admin@gmail.com', '12345678').then(response => {
                if (response.status === 'success') {
                    localStorage.setItem('hatch_admin_token', response.data.token);
                    localStorage.setItem('hatch_admin_user', JSON.stringify(response.data.user));
                    console.log('Auto-logged in with demo credentials');
                }
            });
        }
    }, 1000);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MockAPIService;
}