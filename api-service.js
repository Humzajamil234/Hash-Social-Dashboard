// API Service for Hatch Social Admin Dashboard - COMPLETE IMPLEMENTATION
class APIService {
    constructor() {
        this.baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000/api'
            : '/api';
        this.token = localStorage.getItem('hatch_admin_token');
        this.user = JSON.parse(localStorage.getItem('hatch_admin_user') || '{}');
        this.isOnline = true;
        this.pendingRequests = [];
        
        // Check online status
        this.checkOnlineStatus();
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
    }

    // Set authentication token
    setAuth(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('hatch_admin_token', token);
        localStorage.setItem('hatch_admin_user', JSON.stringify(user));
        
        // Update all auth headers
        this.updateAuthHeaders();
    }

    // Clear authentication
    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('hatch_admin_token');
        localStorage.removeItem('hatch_admin_user');
    }

    // Check online status
    checkOnlineStatus() {
        this.isOnline = navigator.onLine;
    }

    handleOnlineStatus(online) {
        this.isOnline = online;
        if (online) {
            this.processPendingRequests();
            this.showToast('success', 'Back online! Syncing data...');
        } else {
            this.showToast('warning', 'You are offline. Changes will be saved locally.');
        }
    }

    // Show toast notification
    showToast(type, message) {
        if (typeof window.showToast === 'function') {
            window.showToast(type, message);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Update auth headers
    updateAuthHeaders() {
        // This will be used by fetch interceptor
        this.authHeaders = this.token ? {
            'Authorization': `Bearer ${this.token}`
        } : {};
    }

    // Get headers for API requests
    getHeaders(contentType = 'application/json') {
        const headers = {
            'Accept': 'application/json',
            'Content-Type': contentType,
            'X-Requested-With': 'XMLHttpRequest'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Handle API response with retry logic
    async handleResponse(response, retryCount = 0) {
        if (response.status === 401) {
            this.clearAuth();
            window.location.href = 'index.html';
            throw new Error('Session expired. Please login again.');
        }
        
        if (response.status === 429 && retryCount < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return this.request(response.url, response.init, retryCount + 1);
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw {
                status: response.status,
                message: errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
                data: errorData
            };
        }
        
        return response.json();
    }

    // Generic request method with retry logic
    async request(url, options = {}, retryCount = 0) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const defaultOptions = {
            ...options,
            signal: controller.signal,
            headers: { ...this.getHeaders(), ...options.headers }
        };
        
        try {
            const response = await fetch(url, defaultOptions);
            clearTimeout(timeoutId);
            return await this.handleResponse(response);
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout. Please try again.');
            }
            
            if (!this.isOnline) {
                // Store request for later when online
                this.pendingRequests.push({ url, options });
                throw new Error('You are offline. Request queued for later.');
            }
            
            if (retryCount < 2) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return this.request(url, options, retryCount + 1);
            }
            
            throw error;
        }
    }

    // Process pending requests when back online
    async processPendingRequests() {
        if (this.pendingRequests.length === 0 || !this.isOnline) return;
        
        this.showToast('info', `Syncing ${this.pendingRequests.length} pending requests...`);
        
        const requests = [...this.pendingRequests];
        this.pendingRequests = [];
        
        for (const req of requests) {
            try {
                await this.request(req.url, req.options);
            } catch (error) {
                console.error('Failed to process pending request:', error);
            }
        }
        
        this.showToast('success', 'Sync completed!');
    }

    // ==================== AUTHENTICATION APIS ====================
    
    async login(email, password) {
        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ email, password })
            });
            
            const data = await this.handleResponse(response);
            
            if (data.token || data.access_token) {
                const token = data.token || data.access_token;
                const user = data.user || data.data;
                this.setAuth(token, user);
                this.showToast('success', 'Login successful!');
            }
            
            return data;
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('error', error.message || 'Login failed. Please check your credentials.');
            throw error;
        }
    }

    async register(userData) {
        try {
            return await this.request(`${this.baseURL}/register`, {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        } catch (error) {
            console.error('Register error:', error);
            this.showToast('error', error.message || 'Registration failed.');
            throw error;
        }
    }

    async logout() {
        try {
            const response = await this.request(`${this.baseURL}/auth/logout`, {
                method: 'POST'
            });
            
            this.clearAuth();
            this.showToast('success', 'Logged out successfully!');
            return response;
        } catch (error) {
            console.error('Logout error:', error);
            this.clearAuth(); // Clear anyway
            throw error;
        }
    }

    async getCurrentUser() {
        try {
            return await this.request(`${this.baseURL}/auth/me`, {
                method: 'GET'
            });
        } catch (error) {
            console.error('Get current user error:', error);
            throw error;
        }
    }

    async changePassword(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/change_password`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.showToast('success', 'Password changed successfully!');
            return response;
        } catch (error) {
            console.error('Change password error:', error);
            this.showToast('error', error.message || 'Failed to change password.');
            throw error;
        }
    }

    async verifyEmail(code) {
        try {
            return await this.request(`${this.baseURL}/verify`, {
                method: 'POST',
                body: JSON.stringify({ code })
            });
        } catch (error) {
            console.error('Verify email error:', error);
            throw error;
        }
    }

    async forgotPassword(email) {
        try {
            return await this.request(`${this.baseURL}/password/email`, {
                method: 'POST',
                body: JSON.stringify({ email })
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            throw error;
        }
    }

    // ==================== USER MANAGEMENT APIS ====================
    
    async getUsers(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const data = await this.request(`${this.baseURL}/auth/profile${queryString ? `?${queryString}` : ''}`, {
                method: 'GET'
            });
            
            // Handle different response formats
            return Array.isArray(data) ? data : (data.data || data.users || []);
        } catch (error) {
            console.error('Get users error:', error);
            throw error;
        }
    }

    async getUserById(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/profile/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get user by ID error:', error);
            throw error;
        }
    }

    async createUser(userData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/profile`, {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            this.showToast('success', 'User created successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Create user error:', error);
            this.showToast('error', error.message || 'Failed to create user.');
            throw error;
        }
    }

    async updateUser(id, userData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/profile/${id}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
            
            this.showToast('success', 'User updated successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Update user error:', error);
            this.showToast('error', error.message || 'Failed to update user.');
            throw error;
        }
    }

    async deleteUser(id) {
        try {
            const response = await this.request(`${this.baseURL}/auth/profile/${id}`, {
                method: 'DELETE'
            });
            
            this.showToast('success', 'User deleted successfully!');
            return response;
        } catch (error) {
            console.error('Delete user error:', error);
            this.showToast('error', error.message || 'Failed to delete user.');
            throw error;
        }
    }

    async searchUsers(searchTerm) {
        try {
            const data = await this.request(`${this.baseURL}/auth/member_search`, {
                method: 'POST',
                body: JSON.stringify({ search: searchTerm })
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Search users error:', error);
            throw error;
        }
    }

    async getMemberList() {
        try {
            const data = await this.request(`${this.baseURL}/auth/member`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get member list error:', error);
            throw error;
        }
    }

    // ==================== PROFILE APIS ====================
    
    async getProfileMe(profileId) {
        try {
            const data = await this.request(`${this.baseURL}/auth/profile_me/${profileId}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get profile me error:', error);
            throw error;
        }
    }

    async profileLogin(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/profile_login`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            return response.data || response;
        } catch (error) {
            console.error('Profile login error:', error);
            throw error;
        }
    }

    async updateAccount(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/update_account`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.showToast('success', 'Account updated successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Update account error:', error);
            this.showToast('error', error.message || 'Failed to update account.');
            throw error;
        }
    }

    // ==================== COMMUNITY APIS ====================
    
    async getCommunities(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const data = await this.request(`${this.baseURL}/auth/community${queryString ? `?${queryString}` : ''}`, {
                method: 'GET'
            });
            
            return Array.isArray(data) ? data : (data.data || data.communities || []);
        } catch (error) {
            console.error('Get communities error:', error);
            throw error;
        }
    }

    async getCommunityById(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/community/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get community by ID error:', error);
            throw error;
        }
    }

    async createCommunity(communityData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/community`, {
                method: 'POST',
                body: JSON.stringify(communityData)
            });
            
            this.showToast('success', 'Community created successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Create community error:', error);
            this.showToast('error', error.message || 'Failed to create community.');
            throw error;
        }
    }

    async updateCommunity(id, communityData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/community/${id}`, {
                method: 'PUT',
                body: JSON.stringify(communityData)
            });
            
            this.showToast('success', 'Community updated successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Update community error:', error);
            this.showToast('error', error.message || 'Failed to update community.');
            throw error;
        }
    }

    async deleteCommunity(id) {
        try {
            const response = await this.request(`${this.baseURL}/auth/community/${id}`, {
                method: 'DELETE'
            });
            
            this.showToast('success', 'Community deleted successfully!');
            return response;
        } catch (error) {
            console.error('Delete community error:', error);
            this.showToast('error', error.message || 'Failed to delete community.');
            throw error;
        }
    }

    async getCommunityMembers(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/community_member/list/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get community members error:', error);
            throw error;
        }
    }

    async addCommunityMember(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/community_member/add`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.showToast('success', 'Member added to community!');
            return response.data || response;
        } catch (error) {
            console.error('Add community member error:', error);
            this.showToast('error', error.message || 'Failed to add member.');
            throw error;
        }
    }

    async removeCommunityMember(id) {
        try {
            const response = await this.request(`${this.baseURL}/auth/community_member/remove/${id}`, {
                method: 'DELETE'
            });
            
            this.showToast('success', 'Member removed from community!');
            return response;
        } catch (error) {
            console.error('Remove community member error:', error);
            this.showToast('error', error.message || 'Failed to remove member.');
            throw error;
        }
    }

    async searchCommunities(searchTerm) {
        try {
            const data = await this.request(`${this.baseURL}/auth/search`, {
                method: 'POST',
                body: JSON.stringify({ search: searchTerm })
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Search communities error:', error);
            throw error;
        }
    }

    async getCommunityByRoles(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/community_by_roles/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get community by roles error:', error);
            throw error;
        }
    }

    async getCommunityDetail(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/community_detail/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get community detail error:', error);
            throw error;
        }
    }

    async getCommunityInterest(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/community_interest/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get community interest error:', error);
            throw error;
        }
    }

    async getCommunityList(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/community_list/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get community list error:', error);
            throw error;
        }
    }

    // ==================== POST MANAGEMENT APIS ====================
    
    async getPosts(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const data = await this.request(`${this.baseURL}/auth/post${queryString ? `?${queryString}` : ''}`, {
                method: 'GET'
            });
            
            return Array.isArray(data) ? data : (data.data || data.posts || []);
        } catch (error) {
            console.error('Get posts error:', error);
            throw error;
        }
    }

    async getPostById(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/post/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get post by ID error:', error);
            throw error;
        }
    }

    async createPost(postData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/post`, {
                method: 'POST',
                body: JSON.stringify(postData)
            });
            
            this.showToast('success', 'Post created successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Create post error:', error);
            this.showToast('error', error.message || 'Failed to create post.');
            throw error;
        }
    }

    async updatePost(id, postData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/post/${id}`, {
                method: 'PUT',
                body: JSON.stringify(postData)
            });
            
            this.showToast('success', 'Post updated successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Update post error:', error);
            this.showToast('error', error.message || 'Failed to update post.');
            throw error;
        }
    }

    async deletePost(id) {
        try {
            const response = await this.request(`${this.baseURL}/auth/post/${id}`, {
                method: 'DELETE'
            });
            
            this.showToast('success', 'Post deleted successfully!');
            return response;
        } catch (error) {
            console.error('Delete post error:', error);
            this.showToast('error', error.message || 'Failed to delete post.');
            throw error;
        }
    }

    async reportPost(reportData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/report`, {
                method: 'POST',
                body: JSON.stringify(reportData)
            });
            
            this.showToast('success', 'Report submitted successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Report post error:', error);
            this.showToast('error', error.message || 'Failed to submit report.');
            throw error;
        }
    }

    async likePost(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/post_like`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            return response.data || response;
        } catch (error) {
            console.error('Like post error:', error);
            throw error;
        }
    }

    async getPostVideoDetail(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/post_video_detail/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get post video detail error:', error);
            throw error;
        }
    }

    async getPostVideoList(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/post_video_list/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get post video list error:', error);
            throw error;
        }
    }

    async getPendingPost(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/pending_post/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get pending post error:', error);
            throw error;
        }
    }

    async updatePendingPost(id, data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/pending_post_update/${id}`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.showToast('success', 'Pending post updated!');
            return response.data || response;
        } catch (error) {
            console.error('Update pending post error:', error);
            this.showToast('error', error.message || 'Failed to update pending post.');
            throw error;
        }
    }

    // ==================== FEED MANAGEMENT APIS ====================
    
    async getFeeds(params = {}) {
        try {
            const data = await this.request(`${this.baseURL}/auth/show-feed`, {
                method: 'POST',
                body: JSON.stringify(params)
            });
            
            return data.data || data.feeds || [];
        } catch (error) {
            console.error('Get feeds error:', error);
            throw error;
        }
    }

    async getFeedById(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/feed-detail/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get feed by ID error:', error);
            throw error;
        }
    }

    async createFeed(feedData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/feed`, {
                method: 'POST',
                body: JSON.stringify(feedData)
            });
            
            this.showToast('success', 'Feed created successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Create feed error:', error);
            this.showToast('error', error.message || 'Failed to create feed.');
            throw error;
        }
    }

    async updateFeed(id, feedData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/feed/${id}`, {
                method: 'POST',
                body: JSON.stringify(feedData)
            });
            
            this.showToast('success', 'Feed updated successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Update feed error:', error);
            this.showToast('error', error.message || 'Failed to update feed.');
            throw error;
        }
    }

    async deleteFeed(id) {
        try {
            const response = await this.request(`${this.baseURL}/auth/feed/${id}`, {
                method: 'DELETE'
            });
            
            this.showToast('success', 'Feed deleted successfully!');
            return response;
        } catch (error) {
            console.error('Delete feed error:', error);
            this.showToast('error', error.message || 'Failed to delete feed.');
            throw error;
        }
    }

    async getMyFeedList(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/my-feed-list/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get my feed list error:', error);
            throw error;
        }
    }

    async getAllFeedList() {
        try {
            const data = await this.request(`${this.baseURL}/auth/all-feed-list`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get all feed list error:', error);
            throw error;
        }
    }

    async getFeedPostList(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/feed-post-list/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get feed post list error:', error);
            throw error;
        }
    }

    async postByFeed(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/post-by-feed/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get post by feed error:', error);
            throw error;
        }
    }

    async postByProfile(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/post-by-profile/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get post by profile error:', error);
            throw error;
        }
    }

    async feedFollow(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/feed-follow`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            return response.data || response;
        } catch (error) {
            console.error('Feed follow error:', error);
            throw error;
        }
    }

    async updatePostByFeed(id, data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/update-post-by-feed/${id}`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.showToast('success', 'Feed post updated!');
            return response.data || response;
        } catch (error) {
            console.error('Update post by feed error:', error);
            this.showToast('error', error.message || 'Failed to update feed post.');
            throw error;
        }
    }

    // ==================== INTEREST MANAGEMENT APIS ====================
    
    async getInterests(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const data = await this.request(`${this.baseURL}/auth/interest_list${queryString ? `?${queryString}` : ''}`, {
                method: 'GET'
            });
            
            return Array.isArray(data) ? data : (data.data || data.interests || []);
        } catch (error) {
            console.error('Get interests error:', error);
            throw error;
        }
    }

    async getInterestById(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/interest_detail/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get interest by ID error:', error);
            throw error;
        }
    }

    async createInterest(interestData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/interest`, {
                method: 'POST',
                body: JSON.stringify(interestData)
            });
            
            this.showToast('success', 'Interest created successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Create interest error:', error);
            this.showToast('error', error.message || 'Failed to create interest.');
            throw error;
        }
    }

    async purchaseInterest(purchaseData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/interest_buy`, {
                method: 'POST',
                body: JSON.stringify(purchaseData)
            });
            
            this.showToast('success', 'Interest purchased successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Purchase interest error:', error);
            this.showToast('error', error.message || 'Failed to purchase interest.');
            throw error;
        }
    }

    async getProfileInterest(profileId, interestId = null) {
        try {
            const url = interestId 
                ? `${this.baseURL}/auth/interest/${profileId}/${interestId}`
                : `${this.baseURL}/auth/interest/${profileId}`;
            
            const data = await this.request(url, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get profile interest error:', error);
            throw error;
        }
    }

    async purchaseProfileInterest(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/purchase_interest`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.showToast('success', 'Interest purchased!');
            return response.data || response;
        } catch (error) {
            console.error('Purchase profile interest error:', error);
            this.showToast('error', error.message || 'Failed to purchase interest.');
            throw error;
        }
    }

    // ==================== EVENT MANAGEMENT APIS ====================
    
    async getEvents(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const data = await this.request(`${this.baseURL}/auth/event${queryString ? `?${queryString}` : ''}`, {
                method: 'GET'
            });
            
            return Array.isArray(data) ? data : (data.data || data.events || []);
        } catch (error) {
            console.error('Get events error:', error);
            throw error;
        }
    }

    async getEventById(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/event/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get event by ID error:', error);
            throw error;
        }
    }

    async createEvent(eventData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/event`, {
                method: 'POST',
                body: JSON.stringify(eventData)
            });
            
            this.showToast('success', 'Event created successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Create event error:', error);
            this.showToast('error', error.message || 'Failed to create event.');
            throw error;
        }
    }

    async updateEvent(id, eventData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/event/${id}`, {
                method: 'PUT',
                body: JSON.stringify(eventData)
            });
            
            this.showToast('success', 'Event updated successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Update event error:', error);
            this.showToast('error', error.message || 'Failed to update event.');
            throw error;
        }
    }

    async deleteEvent(id) {
        try {
            const response = await this.request(`${this.baseURL}/auth/event/${id}`, {
                method: 'DELETE'
            });
            
            this.showToast('success', 'Event deleted successfully!');
            return response;
        } catch (error) {
            console.error('Delete event error:', error);
            this.showToast('error', error.message || 'Failed to delete event.');
            throw error;
        }
    }

    async joinEvent(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/event_join`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.showToast('success', 'Joined event successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Join event error:', error);
            this.showToast('error', error.message || 'Failed to join event.');
            throw error;
        }
    }

    // ==================== COMMENT MANAGEMENT APIS ====================
    
    async getComments(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const data = await this.request(`${this.baseURL}/auth/comment${queryString ? `?${queryString}` : ''}`, {
                method: 'GET'
            });
            
            return Array.isArray(data) ? data : (data.data || data.comments || []);
        } catch (error) {
            console.error('Get comments error:', error);
            throw error;
        }
    }

    async createComment(commentData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/comment`, {
                method: 'POST',
                body: JSON.stringify(commentData)
            });
            
            this.showToast('success', 'Comment added successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Create comment error:', error);
            this.showToast('error', error.message || 'Failed to add comment.');
            throw error;
        }
    }

    async updateComment(id, commentData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/comment/${id}`, {
                method: 'PUT',
                body: JSON.stringify(commentData)
            });
            
            this.showToast('success', 'Comment updated successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Update comment error:', error);
            this.showToast('error', error.message || 'Failed to update comment.');
            throw error;
        }
    }

    async deleteComment(id) {
        try {
            const response = await this.request(`${this.baseURL}/auth/comment/${id}`, {
                method: 'DELETE'
            });
            
            this.showToast('success', 'Comment deleted successfully!');
            return response;
        } catch (error) {
            console.error('Delete comment error:', error);
            this.showToast('error', error.message || 'Failed to delete comment.');
            throw error;
        }
    }

    async feedPostComment(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/feed_post_comment`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            return response.data || response;
        } catch (error) {
            console.error('Feed post comment error:', error);
            throw error;
        }
    }

    async deleteFeedPostComment(commentId) {
        try {
            const response = await this.request(`${this.baseURL}/auth/feed_post_comment/${commentId}`, {
                method: 'DELETE'
            });
            
            this.showToast('success', 'Feed comment deleted!');
            return response;
        } catch (error) {
            console.error('Delete feed post comment error:', error);
            this.showToast('error', error.message || 'Failed to delete feed comment.');
            throw error;
        }
    }

    async feedPostLike(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/feed_post_like`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            return response.data || response;
        } catch (error) {
            console.error('Feed post like error:', error);
            throw error;
        }
    }

    async getStreamCommentList(roomId) {
        try {
            const data = await this.request(`${this.baseURL}/auth/stream_comment_list/${roomId}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get stream comment list error:', error);
            throw error;
        }
    }

    async streamingComment(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/streaming_comment`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            return response.data || response;
        } catch (error) {
            console.error('Streaming comment error:', error);
            throw error;
        }
    }

    // ==================== CHAT APIS ====================
    
    async getConversations(profileId) {
        try {
            const data = await this.request(`${this.baseURL}/auth/conversations-list/${profileId}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get conversations error:', error);
            throw error;
        }
    }

    async getChatroomMessages(chatroomId) {
        try {
            const data = await this.request(`${this.baseURL}/auth/chatroom-message-list/${chatroomId}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get chatroom messages error:', error);
            throw error;
        }
    }

    async sendChatMessage(chatroomId, messageData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/chatroom-send-message/${chatroomId}`, {
                method: 'POST',
                body: JSON.stringify(messageData)
            });
            
            return response.data || response;
        } catch (error) {
            console.error('Send chat message error:', error);
            throw error;
        }
    }

    async createChatroom(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/chatroom/create`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.showToast('success', 'Chatroom created successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Create chatroom error:', error);
            this.showToast('error', error.message || 'Failed to create chatroom.');
            throw error;
        }
    }

    async deleteChatroom(chatroomId) {
        try {
            const response = await this.request(`${this.baseURL}/auth/chatroom/delete/${chatroomId}`, {
                method: 'POST'
            });
            
            this.showToast('success', 'Chatroom deleted successfully!');
            return response;
        } catch (error) {
            console.error('Delete chatroom error:', error);
            this.showToast('error', error.message || 'Failed to delete chatroom.');
            throw error;
        }
    }

    async addUserToChatroom(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/chatroom/user/add`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.showToast('success', 'User added to chatroom!');
            return response.data || response;
        } catch (error) {
            console.error('Add user to chatroom error:', error);
            this.showToast('error', error.message || 'Failed to add user to chatroom.');
            throw error;
        }
    }

    async sendDirectMessage(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/send-message`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            return response.data || response;
        } catch (error) {
            console.error('Send direct message error:', error);
            throw error;
        }
    }

    async getMessageList(chatId) {
        try {
            const data = await this.request(`${this.baseURL}/auth/message-list/${chatId}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get message list error:', error);
            throw error;
        }
    }

    async deleteMessage(messageId) {
        try {
            const response = await this.request(`${this.baseURL}/auth/message-delete/${messageId}`, {
                method: 'POST'
            });
            
            this.showToast('success', 'Message deleted!');
            return response;
        } catch (error) {
            console.error('Delete message error:', error);
            this.showToast('error', error.message || 'Failed to delete message.');
            throw error;
        }
    }

    async deleteChat(chatId) {
        try {
            const response = await this.request(`${this.baseURL}/auth/chat-delete/${chatId}`, {
                method: 'POST'
            });
            
            this.showToast('success', 'Chat deleted!');
            return response;
        } catch (error) {
            console.error('Delete chat error:', error);
            this.showToast('error', error.message || 'Failed to delete chat.');
            throw error;
        }
    }

    async updateChatStatus(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/chat-status`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            return response.data || response;
        } catch (error) {
            console.error('Update chat status error:', error);
            throw error;
        }
    }

    // ==================== STREAMING APIS ====================
    
    async getStreamingData(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const data = await this.request(`${this.baseURL}/auth/streaming${queryString ? `?${queryString}` : ''}`, {
                method: 'GET'
            });
            
            return Array.isArray(data) ? data : (data.data || data.streams || []);
        } catch (error) {
            console.error('Get streaming data error:', error);
            throw error;
        }
    }

    async createStreaming(streamingData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/streaming`, {
                method: 'POST',
                body: JSON.stringify(streamingData)
            });
            
            this.showToast('success', 'Stream created successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Create streaming error:', error);
            this.showToast('error', error.message || 'Failed to create stream.');
            throw error;
        }
    }

    async updateStreaming(id, streamingData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/streaming/${id}`, {
                method: 'PUT',
                body: JSON.stringify(streamingData)
            });
            
            this.showToast('success', 'Stream updated successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Update streaming error:', error);
            this.showToast('error', error.message || 'Failed to update stream.');
            throw error;
        }
    }

    async deleteStreaming(id) {
        try {
            const response = await this.request(`${this.baseURL}/auth/streaming/${id}`, {
                method: 'DELETE'
            });
            
            this.showToast('success', 'Stream deleted successfully!');
            return response;
        } catch (error) {
            console.error('Delete streaming error:', error);
            this.showToast('error', error.message || 'Failed to delete stream.');
            throw error;
        }
    }

    async getStreamUsers() {
        try {
            const data = await this.request(`${this.baseURL}/auth/stream_users`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get stream users error:', error);
            throw error;
        }
    }

    async getAgoraToken(profileId, data = {}) {
        try {
            const response = await this.request(`${this.baseURL}/auth/generate-rtc-token/${profileId}`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            return response.data || response;
        } catch (error) {
            console.error('Get Agora token error:', error);
            throw error;
        }
    }

    async acquireAgora(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/agora/acquire`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            return response.data || response;
        } catch (error) {
            console.error('Acquire Agora error:', error);
            throw error;
        }
    }

    async startAgora(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/agora/start`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            return response.data || response;
        } catch (error) {
            console.error('Start Agora error:', error);
            throw error;
        }
    }

    async stopAgora(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/agora/stop`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            return response.data || response;
        } catch (error) {
            console.error('Stop Agora error:', error);
            throw error;
        }
    }

    // ==================== NOTIFICATION APIS ====================
    
    async getNotifications(profileId) {
        try {
            const data = await this.request(`${this.baseURL}/auth/notification-list/${profileId}`, {
                method: 'GET'
            });
            
            return data.data || data.notifications || [];
        } catch (error) {
            console.error('Get notifications error:', error);
            throw error;
        }
    }

    async markNotificationsAsRead() {
        try {
            const response = await this.request(`${this.baseURL}/auth/notifications/read`, {
                method: 'POST'
            });
            
            this.showToast('success', 'Notifications marked as read!');
            return response.data || response;
        } catch (error) {
            console.error('Mark notifications as read error:', error);
            this.showToast('error', error.message || 'Failed to mark notifications as read.');
            throw error;
        }
    }

    // ==================== TRANSACTION/REVENUE APIS ====================
    
    async getTransactions(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const data = await this.request(`${this.baseURL}/auth/transaction${queryString ? `?${queryString}` : ''}`, {
                method: 'GET'
            });
            
            return Array.isArray(data) ? data : (data.data || data.transactions || []);
        } catch (error) {
            console.error('Get transactions error:', error);
            throw error;
        }
    }

    async getSubscriptionPlans() {
        try {
            const data = await this.request(`${this.baseURL}/auth/package_list`, {
                method: 'GET'
            });
            
            return data.data || data.packages || [];
        } catch (error) {
            console.error('Get subscription plans error:', error);
            throw error;
        }
    }

    async updateSubscription(planData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/subscription`, {
                method: 'POST',
                body: JSON.stringify(planData)
            });
            
            this.showToast('success', 'Subscription updated successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Update subscription error:', error);
            this.showToast('error', error.message || 'Failed to update subscription.');
            throw error;
        }
    }

    async getCurrentPlan() {
        try {
            const data = await this.request(`${this.baseURL}/auth/current/plan`, {
                method: 'POST'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get current plan error:', error);
            throw error;
        }
    }

    async updatePlan(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/update/plan`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.showToast('success', 'Plan updated successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Update plan error:', error);
            this.showToast('error', error.message || 'Failed to update plan.');
            throw error;
        }
    }

    // ==================== PRODUCT MANAGEMENT APIS ====================
    
    async getProducts(communityId) {
        try {
            const data = await this.request(`${this.baseURL}/auth/products/${communityId}`, {
                method: 'GET'
            });
            
            return data.data || data.products || [];
        } catch (error) {
            console.error('Get products error:', error);
            throw error;
        }
    }

    async createProduct(productData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/products`, {
                method: 'POST',
                body: JSON.stringify(productData)
            });
            
            this.showToast('success', 'Product created successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Create product error:', error);
            this.showToast('error', error.message || 'Failed to create product.');
            throw error;
        }
    }

    async updateProduct(id, productData) {
        try {
            const response = await this.request(`${this.baseURL}/auth/products/${id}`, {
                method: 'POST',
                body: JSON.stringify(productData)
            });
            
            this.showToast('success', 'Product updated successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Update product error:', error);
            this.showToast('error', error.message || 'Failed to update product.');
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            const response = await this.request(`${this.baseURL}/auth/products/${id}`, {
                method: 'DELETE'
            });
            
            this.showToast('success', 'Product deleted successfully!');
            return response;
        } catch (error) {
            console.error('Delete product error:', error);
            this.showToast('error', error.message || 'Failed to delete product.');
            throw error;
        }
    }

    // ==================== FEED POST APIS ====================
    
    async createFeedPost(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/post-feed`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.showToast('success', 'Feed post created!');
            return response.data || response;
        } catch (error) {
            console.error('Create feed post error:', error);
            this.showToast('error', error.message || 'Failed to create feed post.');
            throw error;
        }
    }

    async deleteFeedPost(postId) {
        try {
            const response = await this.request(`${this.baseURL}/auth/post-feed/${postId}`, {
                method: 'DELETE'
            });
            
            this.showToast('success', 'Feed post deleted!');
            return response;
        } catch (error) {
            console.error('Delete feed post error:', error);
            this.showToast('error', error.message || 'Failed to delete feed post.');
            throw error;
        }
    }

    async bunnyPost(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/bunny_post`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            return response.data || response;
        } catch (error) {
            console.error('Bunny post error:', error);
            throw error;
        }
    }

    // ==================== CARD APIS ====================
    
    async addCard(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/addcard`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.showToast('success', 'Card added successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Add card error:', error);
            this.showToast('error', error.message || 'Failed to add card.');
            throw error;
        }
    }

    async updateCard(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/updatecard`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.showToast('success', 'Card updated successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Update card error:', error);
            this.showToast('error', error.message || 'Failed to update card.');
            throw error;
        }
    }

    // ==================== SUBSCRIPTION APIS ====================
    
    async subscribe(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/subscribe`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.showToast('success', 'Subscribed successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Subscribe error:', error);
            this.showToast('error', error.message || 'Failed to subscribe.');
            throw error;
        }
    }

    async unsubscribe(data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/unsubscribe`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.showToast('success', 'Unsubscribed successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Unsubscribe error:', error);
            this.showToast('error', error.message || 'Failed to unsubscribe.');
            throw error;
        }
    }

    // ==================== UTILITY APIS ====================
    
    async clearCache() {
        try {
            const response = await this.request(`${this.baseURL}/clear-cache`, {
                method: 'GET'
            });
            
            this.showToast('success', 'Cache cleared successfully!');
            return response;
        } catch (error) {
            console.error('Clear cache error:', error);
            this.showToast('error', error.message || 'Failed to clear cache.');
            throw error;
        }
    }

    async getHashtagsList() {
        try {
            const data = await this.request(`${this.baseURL}/auth/hashtags_list`, {
                method: 'POST'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get hashtags error:', error);
            throw error;
        }
    }

    async getMyCommunities(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/my_community/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get my communities error:', error);
            throw error;
        }
    }

    async getAllMyCommunities(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/my_all_communities/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get all my communities error:', error);
            throw error;
        }
    }

    async getHomeMultipleCommunity(id) {
        try {
            const data = await this.request(`${this.baseURL}/auth/home_multiple_community/${id}`, {
                method: 'GET'
            });
            
            return data.data || data;
        } catch (error) {
            console.error('Get home multiple community error:', error);
            throw error;
        }
    }

    // ==================== CRON/MAINTENANCE APIS ====================
    
    async runCron() {
        try {
            const response = await this.request(`${this.baseURL}/cron`, {
                method: 'GET'
            });
            
            this.showToast('success', 'Cron job executed successfully!');
            return response;
        } catch (error) {
            console.error('Run cron error:', error);
            this.showToast('error', error.message || 'Failed to run cron job.');
            throw error;
        }
    }

    async runCronPlane() {
        try {
            const response = await this.request(`${this.baseURL}/cron/plane`, {
                method: 'GET'
            });
            
            return response;
        } catch (error) {
            console.error('Run cron plane error:', error);
            throw error;
        }
    }

    async runRecurringPlan() {
        try {
            const response = await this.request(`${this.baseURL}/recurring/plane`, {
                method: 'GET'
            });
            
            return response;
        } catch (error) {
            console.error('Run recurring plan error:', error);
            throw error;
        }
    }

    async noAuth() {
        try {
            const response = await this.request(`${this.baseURL}/noauth`, {
                method: 'GET'
            });
            
            return response;
        } catch (error) {
            console.error('No auth error:', error);
            throw error;
        }
    }

    async saad(data) {
        try {
            const response = await this.request(`${this.baseURL}/saad`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            return response.data || response;
        } catch (error) {
            console.error('Saad error:', error);
            throw error;
        }
    }

    async registerWithChatAppToken(data) {
        try {
            const response = await this.request(`${this.baseURL}/registeruserwithchatapptoken`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            return response.data || response;
        } catch (error) {
            console.error('Register with chat app token error:', error);
            throw error;
        }
    }

    async changePasscode(id, data) {
        try {
            const response = await this.request(`${this.baseURL}/auth/change_passcode/${id}`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            this.showToast('success', 'Passcode changed successfully!');
            return response.data || response;
        } catch (error) {
            console.error('Change passcode error:', error);
            this.showToast('error', error.message || 'Failed to change passcode.');
            throw error;
        }
    }

    // ==================== OFFLINE DATA MANAGEMENT ====================
    
    async syncOfflineData() {
        if (!this.isOnline) {
            this.showToast('warning', 'Cannot sync while offline');
            return;
        }
        
        const offlineData = JSON.parse(localStorage.getItem('hatch_offline_data') || '{}');
        if (Object.keys(offlineData).length === 0) {
            this.showToast('info', 'No offline data to sync');
            return;
        }
        
        this.showToast('info', 'Syncing offline data...');
        
        for (const [endpoint, data] of Object.entries(offlineData)) {
            try {
                await this.request(`${this.baseURL}${endpoint}`, {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                
                // Remove from offline storage on success
                delete offlineData[endpoint];
            } catch (error) {
                console.error(`Failed to sync ${endpoint}:`, error);
            }
        }
        
        localStorage.setItem('hatch_offline_data', JSON.stringify(offlineData));
        this.showToast('success', 'Offline data synced successfully!');
    }

    // Store data offline
    storeOffline(endpoint, data) {
        const offlineData = JSON.parse(localStorage.getItem('hatch_offline_data') || '{}');
        offlineData[endpoint] = data;
        localStorage.setItem('hatch_offline_data', JSON.stringify(offlineData));
        
        this.showToast('info', 'Data saved offline. Will sync when online.');
    }
}

// Create global API instance
window.apiService = new APIService();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIService;
}