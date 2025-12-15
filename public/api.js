/**
 * API Service Module
 * Centralized API communication layer for MaidTrack application
 */

// Use relative URL so it works in both development and production
const API_BASE_URL = '/api';

// ============================================================
// Token Management
// ============================================================

/**
 * Get JWT token from localStorage
 * @returns {string|null} The stored JWT token
 */
function getToken() {
    return localStorage.getItem('token');
}

/**
 * Set JWT token in localStorage
 * @param {string} token - The JWT token to store
 */
function setToken(token) {
    localStorage.setItem('token', token);
}

/**
 * Remove JWT token from localStorage
 */
function removeToken() {
    localStorage.removeItem('token');
}

/**
 * Get user data from localStorage
 * @returns {Object|null} The stored user object
 */
function getUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
}

/**
 * Set user data in localStorage
 * @param {Object} user - The user object to store
 */
function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Remove user data from localStorage
 */
function removeUser() {
    localStorage.removeItem('user');
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has a valid token
 */
function isAuthenticated() {
    return !!getToken();
}

/**
 * Logout user - clear all auth data and redirect
 */
function logout() {
    removeToken();
    removeUser();
    localStorage.removeItem('rememberMe');
    window.location.href = 'home.html';
}

// ============================================================
// HTTP Request Helper
// ============================================================

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (e.g., '/auth/login')
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Default headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    // Add Authorization header if token exists
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });
        
        // Parse response
        const data = await response.json().catch(() => ({}));
        
        // Handle unauthorized (401)
        // Only treat as "session expired" if we're not on a login/register endpoint
        if (response.status === 401) {
            const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
            
            if (!isAuthEndpoint) {
                // This is a protected endpoint - session actually expired
                removeToken();
                removeUser();
                showApiError('Session expired. Please login again.');
                window.location.href = 'login.html';
                throw new Error('Unauthorized');
            }
            // For login/register, just throw the error with the message from backend
            const errorMessage = data.message || 'Invalid credentials';
            throw new Error(errorMessage);
        }
        
        // Handle other errors
        if (!response.ok) {
            const errorMessage = data.message || data.error || 'An error occurred';
            throw new Error(errorMessage);
        }
        
        return data;
    } catch (error) {
        // Network error or fetch failure
        if (error.message === 'Failed to fetch') {
            showApiError('Unable to connect to server. Please check your connection.');
        }
        throw error;
    }
}

// ============================================================
// Authentication API
// ============================================================

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Response with token and user data
 */
async function apiLogin(email, password) {
    const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    
    // Store token and user data
    if (data.token) {
        setToken(data.token);
    }
    if (data.user) {
        setUser(data.user);
    }
    
    return data;
}

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Response with token and user data
 */
async function apiRegister(userData) {
    const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
    
    // Store token and user data
    if (data.token) {
        setToken(data.token);
    }
    if (data.user) {
        setUser(data.user);
    }
    
    return data;
}

// ============================================================
// Menu API
// ============================================================

/**
 * Get menu items for current user's role
 * @returns {Promise<Object>} Menu items based on user role
 */
async function apiGetMenu() {
    return await apiRequest('/menu/my', {
        method: 'GET',
    });
}

// ============================================================
// Jobs API
// ============================================================

/**
 * Create a new job (homeowner only)
 * @param {Object} jobData - Job details
 * @returns {Promise<Object>} Created job data
 */
async function apiCreateJob(jobData) {
    return await apiRequest('/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
    });
}

/**
 * Get jobs for current user
 * @returns {Promise<Object>} List of jobs
 */
async function apiGetMyJobs() {
    return await apiRequest('/jobs/my', {
        method: 'GET',
    });
}

/**
 * Maid check-in to job
 * @param {number} jobId - Job ID
 * @returns {Promise<Object>} Check-in response
 */
async function apiCheckIn(jobId) {
    return await apiRequest('/jobs/checkin', {
        method: 'POST',
        body: JSON.stringify({ jobId }),
    });
}

/**
 * Maid check-out from job
 * @param {number} attendanceId - Attendance record ID
 * @param {number} jobId - Job ID
 * @returns {Promise<Object>} Check-out response
 */
async function apiCheckOut(attendanceId, jobId) {
    return await apiRequest('/jobs/checkout', {
        method: 'POST',
        body: JSON.stringify({ attendanceId, jobId }),
    });
}

// ============================================================
// Maids API
// ============================================================

/**
 * Get pending maids for approval (admin only)
 * @returns {Promise<Object>} List of pending maids
 */
async function apiGetPendingMaids() {
    return await apiRequest('/maids/pending', {
        method: 'GET',
    });
}

/**
 * Approve a maid (admin only)
 * @param {number} maidId - Maid user ID
 * @returns {Promise<Object>} Approval response
 */
async function apiApproveMaid(maidId) {
    return await apiRequest('/maids/approve', {
        method: 'POST',
        body: JSON.stringify({ maidId }),
    });
}

/**
 * Get recommended maids for homeowner
 * @returns {Promise<Object>} List of recommended maids
 */
async function apiGetRecommendedMaids() {
    return await apiRequest('/maids/recommend', {
        method: 'GET',
    });
}

// ============================================================
// Dashboard API
// ============================================================

/**
 * Get dashboard statistics for current user
 * @returns {Promise<Object>} Dashboard stats
 */
async function apiGetDashboardStats() {
    return await apiRequest('/dashboard/my', {
        method: 'GET',
    });
}

// ============================================================
// Location API
// ============================================================

/**
 * Update maid location
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<Object>} Location update response
 */
async function apiUpdateLocation(latitude, longitude) {
    return await apiRequest('/location/update', {
        method: 'POST',
        body: JSON.stringify({ latitude, longitude }),
    });
}

/**
 * Get maid location for a job
 * @param {number} jobId - Job ID
 * @returns {Promise<Object>} Location data
 */
async function apiGetMaidLocation(jobId) {
    return await apiRequest(`/location/job/${jobId}`, {
        method: 'GET',
    });
}

// ============================================================
// Profile API
// ============================================================

/**
 * Upload profile photo
 * @param {FormData} formData - FormData with photo file
 * @returns {Promise<Object>} Upload response
 */
async function apiUploadPhoto(formData) {
    // For file uploads, we need to omit Content-Type header so browser sets it with boundary
    return await apiRequest('/profile/photo', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type
    });
}

/**
 * Submit identity verification documents
 * @param {FormData} formData - FormData with idDocument and selfie files
 * @returns {Promise<Object>} Verification response
 */
async function apiSubmitVerification(formData) {
    // For file uploads, we need to omit Content-Type header so browser sets it with boundary
    return await apiRequest('/profile/verify', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type
    });
}

/**
 * Get current user profile
 * @returns {Promise<Object>} User profile
 */
async function apiGetProfile() {
    return await apiRequest('/profile', {
        method: 'GET',
    });
}

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Update response
 */
async function apiUpdateProfile(profileData) {
    return await apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
    });
}

// ============================================================
// Notifications API
// ============================================================

/**
 * Get notifications for current user (paginated)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Notifications data with unreadCount
 */
async function apiGetNotifications(options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.unreadOnly) params.append('unreadOnly', 'true');
    
    const queryString = params.toString();
    return await apiRequest(`/notifications${queryString ? '?' + queryString : ''}`, {
        method: 'GET',
    });
}

/**
 * Get unread notification count
 * @returns {Promise<Object>} Object with unreadCount
 */
async function apiGetUnreadCount() {
    return await apiRequest('/notifications/unread-count', {
        method: 'GET',
    });
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Response
 */
async function apiMarkNotificationRead(notificationId) {
    return await apiRequest(`/notifications/${notificationId}/read`, {
        method: 'PUT',
    });
}

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} Response
 */
async function apiMarkAllNotificationsRead() {
    return await apiRequest('/notifications/read-all', {
        method: 'PUT',
    });
}

/**
 * Connect to notification stream (SSE)
 * @param {Function} onNotification - Callback for new notifications
 * @param {Function} onUnreadCount - Callback for unread count updates
 * @returns {EventSource} The SSE connection
 */
function connectNotificationStream(onNotification, onUnreadCount) {
    const token = getToken();
    if (!token) return null;
    
    // Use polling as fallback since SSE requires special handling
    let pollInterval = null;
    let lastUnreadCount = -1;
    
    const poll = async () => {
        try {
            const data = await apiGetUnreadCount();
            if (data.unreadCount !== lastUnreadCount) {
                lastUnreadCount = data.unreadCount;
                if (onUnreadCount) onUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error('Notification poll error:', error);
        }
    };
    
    // Initial poll
    poll();
    
    // Poll every 30 seconds
    pollInterval = setInterval(poll, 30000);
    
    // Return cleanup function
    return {
        close: () => {
            if (pollInterval) clearInterval(pollInterval);
        }
    };
}

// ============================================================
// Homeowner API
// ============================================================

/**
 * Get homeowner dashboard data (stats, schedule, activity)
 * @returns {Promise<Object>} Dashboard data
 */
async function apiGetHomeownerDashboard() {
    return await apiRequest('/homeowner/dashboard', {
        method: 'GET',
    });
}

/**
 * Search maids with filters
 * @param {Object} filters - Search filters (location, specialization, availability, minRating)
 * @returns {Promise<Object>} List of maids
 */
async function apiSearchMaids(filters = {}) {
    const params = new URLSearchParams();
    if (filters.location) params.append('location', filters.location);
    if (filters.specialization) params.append('specialization', filters.specialization);
    if (filters.availability) params.append('availability', filters.availability);
    if (filters.minRating) params.append('minRating', filters.minRating);
    
    const queryString = params.toString();
    return await apiRequest(`/homeowner/maids${queryString ? '?' + queryString : ''}`, {
        method: 'GET',
    });
}

/**
 * Get maid profile details
 * @param {string} maidId - Maid ID
 * @returns {Promise<Object>} Maid profile
 */
async function apiGetMaidProfile(maidId) {
    return await apiRequest(`/homeowner/maids/${maidId}`, {
        method: 'GET',
    });
}

/**
 * Get homeowner bookings with optional status filter
 * @param {string} status - Filter by status (all, upcoming, active, completed, cancelled)
 * @returns {Promise<Object>} List of bookings
 */
async function apiGetHomeownerBookings(status = 'all') {
    return await apiRequest(`/homeowner/bookings?status=${status}`, {
        method: 'GET',
    });
}

/**
 * Get single booking details
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Booking details
 */
async function apiGetBookingDetails(bookingId) {
    return await apiRequest(`/homeowner/bookings/${bookingId}`, {
        method: 'GET',
    });
}

/**
 * Get service history
 * @param {string} startDate - Start date filter (optional)
 * @param {string} endDate - End date filter (optional)
 * @returns {Promise<Object>} Service history
 */
async function apiGetServiceHistory(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    return await apiRequest(`/homeowner/history${queryString ? '?' + queryString : ''}`, {
        method: 'GET',
    });
}

/**
 * Submit a review for a completed job
 * @param {Object} reviewData - Review data (jobId, rating, comment)
 * @returns {Promise<Object>} Review response
 */
async function apiSubmitReview(reviewData) {
    return await apiRequest('/reviews', {
        method: 'POST',
        body: JSON.stringify(reviewData),
    });
}

// ============================================================
// Maid API
// ============================================================

/**
 * Get maid dashboard data
 * @returns {Promise<Object>} Dashboard data (stats, schedule, reviews)
 */
async function apiGetMaidDashboard() {
    return await apiRequest('/maid/dashboard', { method: 'GET' });
}

/**
 * Get pending job requests
 * @returns {Promise<Object>} Job requests
 */
async function apiGetJobRequests() {
    return await apiRequest('/maid/job-requests', { method: 'GET' });
}

/**
 * Get maid's jobs with optional status filter
 * @param {string} status - Filter by status (active, upcoming, completed)
 * @returns {Promise<Object>} Jobs list
 */
async function apiGetMaidJobs(status = '') {
    const query = status ? `?status=${status}` : '';
    return await apiRequest(`/maid/jobs${query}`, { method: 'GET' });
}

/**
 * Update maid availability (online/offline)
 * @param {boolean} isOnline - Online status
 * @returns {Promise<Object>} Response
 */
async function apiUpdateAvailability(isOnline) {
    return await apiRequest('/maid/availability', {
        method: 'PUT',
        body: JSON.stringify({ isOnline })
    });
}

/**
 * Get maid earnings
 * @param {string} range - Time range (week, month, all)
 * @returns {Promise<Object>} Earnings data
 */
async function apiGetMaidEarnings(range = 'month') {
    return await apiRequest(`/maid/earnings?range=${range}`, { method: 'GET' });
}

/**
 * Get maid reviews
 * @returns {Promise<Object>} Reviews data
 */
async function apiGetMaidReviews() {
    return await apiRequest('/maid/reviews', { method: 'GET' });
}

/**
 * Accept a job request
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Response
 */
async function apiAcceptJob(jobId) {
    return await apiRequest('/maid/jobs/accept', {
        method: 'POST',
        body: JSON.stringify({ jobId })
    });
}

/**
 * Decline a job request
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Response
 */
async function apiDeclineJob(jobId) {
    return await apiRequest('/maid/jobs/decline', {
        method: 'POST',
        body: JSON.stringify({ jobId })
    });
}

// ============================================================
// Error Display Helper
// ============================================================

/**
 * Display API error message to user
 * @param {string} message - Error message
 */
function showApiError(message) {
    // Check if showNotification exists (from other scripts)
    if (typeof showNotification === 'function') {
        showNotification(message, 'error');
    } else if (typeof showMaidNotification === 'function') {
        showMaidNotification(message, 'error');
    } else {
        alert('Error: ' + message);
    }
}

/**
 * Display API success message to user
 * @param {string} message - Success message
 */
function showApiSuccess(message) {
    if (typeof showNotification === 'function') {
        showNotification(message, 'success');
    } else if (typeof showMaidNotification === 'function') {
        showMaidNotification(message, 'success');
    } else {
        alert(message);
    }
}

// ============================================================
// Page Protection & Redirect Helpers
// ============================================================

/**
 * Redirect to appropriate dashboard based on user role
 */
function redirectToDashboard() {
    const user = getUser();
    if (!user) {
        window.location.href = 'home.html';
        return;
    }
    
    switch (user.role) {
        case 'admin':
            window.location.href = 'index.html';
            break;
        case 'homeowner':
            window.location.href = 'homeowner.html';
            break;
        case 'maid':
            window.location.href = 'maid.html';
            break;
        default:
            window.location.href = 'home.html';
    }
}

/**
 * Protect page - redirect to login if not authenticated
 * @param {string[]} allowedRoles - Optional array of allowed roles
 */
function protectPage(allowedRoles = []) {
    if (!isAuthenticated()) {
        window.location.href = 'home.html';
        return false;
    }
    
    if (allowedRoles.length > 0) {
        const user = getUser();
        if (!user || !allowedRoles.includes(user.role)) {
            redirectToDashboard();
            return false;
        }
    }
    
    return true;
}

/**
 * Update user display in header
 */
function updateUserDisplay() {
    const user = getUser();
    if (user) {
        // Update user profile display if elements exist
        const userNameEl = document.querySelector('.user-profile span');
        if (userNameEl) {
            userNameEl.textContent = user.name || 'User';
        }
    }
}

// ============================================================
// Initialize on page load
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Update user display if authenticated
    if (isAuthenticated()) {
        updateUserDisplay();
    }
    
    // Setup logout handlers
    const logoutLinks = document.querySelectorAll('a[href="#logout"], a[href="index.html"]:has(i.fa-sign-out-alt)');
    logoutLinks.forEach(link => {
        if (link.querySelector('.fa-sign-out-alt') || link.textContent.toLowerCase().includes('logout')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        }
    });
});

// ============================================================
// Admin API
// ============================================================

/**
 * Get admin dashboard data
 * @returns {Promise<Object>} Dashboard stats and data
 */
async function apiGetAdminDashboard() {
    return await apiRequest('/admin/dashboard', { method: 'GET' });
}

/**
 * Get reports summary
 * @param {string} range - 'week' or 'month'
 * @returns {Promise<Object>} Reports summary
 */
async function apiGetReportsSummary(range = 'month') {
    return await apiRequest(`/admin/reports/summary?range=${range}`, { method: 'GET' });
}

/**
 * Get performance data for charts
 * @param {number} days - Number of days
 * @returns {Promise<Object>} Performance data
 */
async function apiGetPerformanceData(days = 30) {
    return await apiRequest(`/admin/reports/performance?days=${days}`, { method: 'GET' });
}

/**
 * Get schedule/calendar events
 * @param {string} from - Start date (YYYY-MM-DD)
 * @param {string} to - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Schedule events
 */
async function apiGetAdminSchedule(from, to) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const query = params.toString();
    return await apiRequest(`/admin/schedule${query ? '?' + query : ''}`, { method: 'GET' });
}

/**
 * Get attendance records
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Promise<Object>} Attendance records
 */
async function apiGetAdminAttendance(date) {
    const query = date ? `?date=${date}` : '';
    return await apiRequest(`/admin/attendance${query}`, { method: 'GET' });
}

/**
 * Get admin profile
 * @returns {Promise<Object>} Admin profile
 */
async function apiGetAdminProfile() {
    return await apiRequest('/admin/settings/profile', { method: 'GET' });
}

/**
 * Update admin profile
 * @param {Object} data - Profile data
 * @returns {Promise<Object>} Response
 */
async function apiUpdateAdminProfile(data) {
    return await apiRequest('/admin/settings/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

/**
 * Change admin password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Response
 */
async function apiChangeAdminPassword(currentPassword, newPassword) {
    return await apiRequest('/admin/settings/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
    });
}

console.log('API Service Module loaded');
