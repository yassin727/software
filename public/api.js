/**
 * API Service Module
 * Centralized API communication layer for MaidTrack application
 */

const API_BASE_URL = 'http://localhost:4000/api';

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
 * Get notifications for current user
 * @returns {Promise<Object>} Notifications data
 */
async function apiGetNotifications() {
    return await apiRequest('/notifications/my', {
        method: 'GET',
    });
}

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} Response
 */
async function apiMarkNotificationRead(notificationId) {
    return await apiRequest(`/notifications/${notificationId}/read`, {
        method: 'POST',
    });
}

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} Response
 */
async function apiMarkAllNotificationsRead() {
    return await apiRequest('/notifications/read-all', {
        method: 'POST',
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

console.log('API Service Module loaded');
