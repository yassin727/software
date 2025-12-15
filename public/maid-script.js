// Maid-specific functions

let isOnline = false;
let currentJobStartTime = null;
let myMaidJobs = [];
let currentAttendanceId = null;
let currentActiveJobId = null;
let dashboardData = null;
let notificationStream = null;

// ============================================================
// Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Maid Dashboard Loaded');
    
    // Check authentication
    if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Verify user role
    const user = typeof getUser === 'function' ? getUser() : null;
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    if (user.role !== 'maid') {
        if (typeof redirectToDashboard === 'function') {
            redirectToDashboard();
        } else {
            window.location.href = 'login.html';
        }
        return;
    }
    
    // Update user display
    const userNameEl = document.querySelector('.user-profile span');
    if (userNameEl) {
        userNameEl.textContent = user.name || 'Maid';
    }
    
    // Load dashboard data
    await loadMaidDashboard();
    
    // Initialize notifications
    initMaidNotifications();
    
    // Close notification panel when clicking outside
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('notificationPanel');
        const wrapper = e.target.closest('.notification-wrapper');
        if (panel && panel.classList.contains('active') && !wrapper) {
            panel.classList.remove('active');
        }
    });
});

// ============================================================
// Dashboard Loading
// ============================================================

async function loadMaidDashboard() {
    try {
        showLoadingState();
        dashboardData = await apiGetMaidDashboard();
        renderDashboard(dashboardData);
        hideLoadingState();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        hideLoadingState();
        showMaidNotification('Failed to load dashboard', 'error');
    }
}


function renderDashboard(data) {
    if (!data) return;
    
    // Update availability status
    isOnline = data.isOnline || false;
    updateAvailabilityUI(isOnline);
    
    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card .stat-details h3');
    if (statCards.length >= 4 && data.stats) {
        statCards[0].textContent = data.stats.activeJobsToday || 0;
        statCards[1].textContent = data.stats.completedThisMonth || 0;
        statCards[2].textContent = data.stats.averageRating?.toFixed(1) || '0.0';
        statCards[3].textContent = `$${data.stats.earnedThisMonth || 0}`;
    }
    
    // Update weekly stats
    if (data.weeklyStats) {
        const weeklyRows = document.querySelectorAll('.weekly-stats .stat-value');
        if (weeklyRows.length >= 4) {
            weeklyRows[0].textContent = data.weeklyStats.jobsCompleted || 0;
            weeklyRows[1].textContent = data.weeklyStats.hoursWorked || 0;
            weeklyRows[2].textContent = `$${data.weeklyStats.earnings || 0}`;
            weeklyRows[3].textContent = data.weeklyStats.newReviews || 0;
        }
    }
    
    // Update job requests badge
    const requestsBadge = document.querySelector('.nav-item[href="#job-requests"] .badge');
    if (requestsBadge) {
        requestsBadge.textContent = data.jobRequestsCount || 0;
        requestsBadge.style.display = data.jobRequestsCount > 0 ? 'inline' : 'none';
    }
    
    // Render today's schedule
    renderTodaySchedule(data.todaySchedule || []);
    
    // Render recent reviews
    renderRecentReviews(data.recentReviews || []);
}

function renderTodaySchedule(schedule) {
    const jobList = document.querySelector('#dashboard .job-list');
    if (!jobList) return;
    
    if (schedule.length === 0) {
        jobList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-check"></i>
                <p>No jobs scheduled for today</p>
            </div>
        `;
        return;
    }
    
    jobList.innerHTML = schedule.map(job => `
        <div class="job-item ${job.status === 'in_progress' ? 'active-job' : ''}">
            <div class="job-status">
                <span class="status-badge ${getStatusClass(job.status)}">${formatStatus(job.status)}</span>
            </div>
            <div class="job-details">
                <h4>${job.title}</h4>
                <p class="client-name"><i class="fas fa-user"></i> ${job.clientName}</p>
                <p><i class="fas fa-clock"></i> ${job.time} - ${job.endTime}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${job.address}</p>
                <p><i class="fas fa-dollar-sign"></i> $${job.estimatedPay} (${job.estimatedDuration} hours)</p>
            </div>
            <div class="job-actions">
                ${job.status === 'in_progress' ? `
                    <button class="btn-secondary" onclick="updateJobStatus()">
                        <i class="fas fa-tasks"></i> Update Tasks
                    </button>
                    <button class="btn-primary" onclick="checkOut()">
                        <i class="fas fa-sign-out-alt"></i> Check Out
                    </button>
                ` : job.status === 'accepted' ? `
                    <button class="btn-secondary" onclick="viewJobDetails('${job.id}')">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                    <button class="btn-primary" onclick="checkIn('${job.id}')">
                        <i class="fas fa-sign-in-alt"></i> Check In
                    </button>
                ` : `
                    <button class="btn-secondary" onclick="viewJobDetails('${job.id}')">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                `}
            </div>
        </div>
    `).join('');
}

function renderRecentReviews(reviews) {
    const reviewsList = document.querySelector('#dashboard .reviews-list');
    if (!reviewsList) return;
    
    if (reviews.length === 0) {
        reviewsList.innerHTML = `
            <div class="empty-state">
                <p>No reviews yet</p>
            </div>
        `;
        return;
    }
    
    reviewsList.innerHTML = reviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <img src="${review.clientPhoto || 'https://via.placeholder.com/45'}" alt="Client">
                <div>
                    <h4>${review.clientName}</h4>
                    <div class="rating">${renderStars(review.rating)}</div>
                </div>
                <span class="review-date">${review.date}</span>
            </div>
            <p class="review-text">"${review.comment || 'No comment'}"</p>
        </div>
    `).join('');
}

// ============================================================
// Job Requests
// ============================================================

async function loadJobRequests() {
    try {
        const data = await apiGetJobRequests();
        renderJobRequests(data.requests || []);
    } catch (error) {
        console.error('Error loading job requests:', error);
        showMaidNotification('Failed to load job requests', 'error');
    }
}

function renderJobRequests(requests) {
    const container = document.querySelector('.job-requests-list');
    if (!container) return;
    
    // Update badge
    const badge = document.querySelector('.badge-large');
    if (badge) badge.textContent = `${requests.length} Pending`;
    
    if (requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 40px; text-align: center;">
                <i class="fas fa-inbox" style="font-size: 48px; color: #ccc; margin-bottom: 16px;"></i>
                <p>No pending job requests</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = requests.map(req => `
        <div class="job-request-card ${req.isUrgent ? 'urgent' : ''}">
            ${req.isUrgent ? '<div class="urgent-badge"><i class="fas fa-bolt"></i> Urgent Request</div>' : ''}
            <div class="request-header">
                <div class="client-info">
                    <img src="${req.clientPhoto || 'https://via.placeholder.com/60'}" alt="Client">
                    <div>
                        <h4>${req.clientName}</h4>
                    </div>
                </div>
                <div class="request-time">
                    <i class="fas fa-clock"></i> ${formatTimeAgo(req.requestedAt)}
                </div>
            </div>
            <div class="request-body">
                <h4><i class="fas fa-broom"></i> ${req.title}</h4>
                <div class="request-details">
                    <p><i class="fas fa-calendar"></i> <strong>Date:</strong> ${formatDate(req.scheduledDate)}</p>
                    <p><i class="fas fa-clock"></i> <strong>Time:</strong> ${formatTime(req.scheduledDate)} (${req.estimatedDuration} hours)</p>
                    <p><i class="fas fa-map-marker-alt"></i> <strong>Location:</strong> ${req.address}</p>
                    <p><i class="fas fa-dollar-sign"></i> <strong>Payment:</strong> $${req.estimatedPay.toFixed(2)}</p>
                </div>
                ${req.description ? `
                    <div class="special-notes">
                        <strong><i class="fas fa-info-circle"></i> Instructions:</strong>
                        <p>${req.description}</p>
                    </div>
                ` : ''}
            </div>
            <div class="request-footer">
                <button class="btn-secondary" onclick="declineRequest('${req.id}')">
                    <i class="fas fa-times"></i> Decline
                </button>
                <button class="btn-primary ${req.isUrgent ? 'pulse' : ''}" onclick="acceptRequest('${req.id}', '${req.clientName}')">
                    <i class="fas fa-check"></i> Accept Job
                </button>
            </div>
        </div>
    `).join('');
}

async function acceptRequest(jobId, clientName) {
    if (!isOnline) {
        if (confirm('You are currently offline. Do you want to go online and accept this job?')) {
            await setOnline(true);
        } else {
            return;
        }
    }
    
    try {
        await apiAcceptJob(jobId);
        showMaidNotification(`Job accepted! ${clientName} has been notified.`, 'success');
        await loadJobRequests();
        await loadMaidDashboard();
    } catch (error) {
        showMaidNotification(error.message || 'Failed to accept job', 'error');
    }
}

async function declineRequest(jobId) {
    if (!confirm('Are you sure you want to decline this job request?')) return;
    
    try {
        await apiDeclineJob(jobId);
        showMaidNotification('Job request declined', 'info');
        await loadJobRequests();
    } catch (error) {
        showMaidNotification(error.message || 'Failed to decline job', 'error');
    }
}


// ============================================================
// Availability Toggle
// ============================================================

async function toggleAvailability() {
    const toggle = document.getElementById('availabilityToggle');
    const newStatus = toggle.checked;
    await setOnline(newStatus);
}

async function setOnline(online) {
    try {
        await apiUpdateAvailability(online);
        isOnline = online;
        updateAvailabilityUI(online);
        showMaidNotification(online ? 'You are now online!' : 'You are now offline', online ? 'success' : 'info');
    } catch (error) {
        showMaidNotification('Failed to update availability', 'error');
        // Revert toggle
        document.getElementById('availabilityToggle').checked = isOnline;
    }
}

function updateAvailabilityUI(online) {
    const toggle = document.getElementById('availabilityToggle');
    const text = document.getElementById('availabilityText');
    const statusCard = document.getElementById('statusCard');
    
    if (toggle) toggle.checked = online;
    
    if (text) {
        text.textContent = online ? 'You are Online' : 'You are Offline';
        text.style.color = online ? '#10b981' : '#64748b';
    }
    
    if (statusCard) {
        statusCard.classList.toggle('online-status', online);
        statusCard.classList.toggle('offline-status', !online);
        statusCard.innerHTML = online ? `
            <div class="status-icon"><i class="fas fa-check-circle"></i></div>
            <div class="status-info">
                <h2>You are now Online</h2>
                <p>You will receive job requests from nearby clients</p>
                <button class="btn-secondary" onclick="setOnline(false)"><i class="fas fa-toggle-off"></i> Go Offline</button>
            </div>
        ` : `
            <div class="status-icon"><i class="fas fa-power-off"></i></div>
            <div class="status-info">
                <h2>You are currently Offline</h2>
                <p>Turn on availability to start receiving job requests</p>
                <button class="btn-primary" onclick="setOnline(true)"><i class="fas fa-toggle-on"></i> Go Online</button>
            </div>
        `;
    }
}

function goOnline() { setOnline(true); }
function goOffline() { setOnline(false); }

// ============================================================
// Check-in/Check-out
// ============================================================

async function checkIn(jobId) {
    showMaidNotification('Verifying your location...', 'info');
    
    try {
        const response = await apiCheckIn(jobId);
        currentJobStartTime = new Date();
        currentActiveJobId = jobId;
        currentAttendanceId = response.attendanceId;
        
        showMaidNotification('Checked in successfully!', 'success');
        startWorkTimer();
        await loadMaidDashboard();
        showSection('my-jobs');
    } catch (error) {
        showMaidNotification(error.message || 'Check-in failed', 'error');
    }
}

function checkOut() {
    document.getElementById('checkoutModal')?.classList.add('active');
}

function completeJob() {
    document.getElementById('checkoutModal')?.classList.add('active');
}

async function submitCheckout(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn?.innerHTML;
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;
    }
    
    try {
        if (currentAttendanceId && currentActiveJobId) {
            await apiCheckOut(currentAttendanceId, currentActiveJobId);
        }
        
        stopWorkTimer();
        showMaidNotification('Job completed successfully!', 'success');
        closeModal('checkoutModal');
        
        currentAttendanceId = null;
        currentActiveJobId = null;
        
        await loadMaidDashboard();
        showSection('dashboard');
    } catch (error) {
        showMaidNotification(error.message || 'Check-out failed', 'error');
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

// ============================================================
// Earnings
// ============================================================

async function loadEarnings(range = 'month') {
    try {
        const data = await apiGetMaidEarnings(range);
        renderEarnings(data);
    } catch (error) {
        console.error('Error loading earnings:', error);
        showMaidNotification('Failed to load earnings', 'error');
    }
}

function renderEarnings(data) {
    // Update earning cards
    const earningCards = document.querySelectorAll('.earning-card h2');
    if (earningCards.length >= 4) {
        earningCards[0].textContent = `$${data.totalEarnings?.toFixed(2) || '0.00'}`;
        earningCards[1].textContent = `$${(data.totalEarnings / 4)?.toFixed(2) || '0.00'}`; // Weekly estimate
        earningCards[2].textContent = `$${data.pendingAmount?.toFixed(2) || '0.00'}`;
        earningCards[3].textContent = `$${data.averageRate || 15}/hr`;
    }
    
    // Update table
    const tbody = document.querySelector('.data-table tbody');
    if (tbody && data.earnings) {
        if (data.earnings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No earnings yet</td></tr>';
        } else {
            tbody.innerHTML = data.earnings.map(e => `
                <tr>
                    <td>${formatDate(e.date)}</td>
                    <td>${e.clientName}</td>
                    <td>${e.service}</td>
                    <td>${e.duration} hours</td>
                    <td>$${e.amount.toFixed(2)}</td>
                    <td><span class="status-badge ${e.status === 'paid' ? 'completed' : 'pending'}">${e.status === 'paid' ? 'Paid' : 'Pending'}</span></td>
                </tr>
            `).join('');
        }
    }
}

// ============================================================
// Reviews
// ============================================================

async function loadReviews() {
    try {
        const data = await apiGetMaidReviews();
        renderReviewsPage(data);
    } catch (error) {
        console.error('Error loading reviews:', error);
        showMaidNotification('Failed to load reviews', 'error');
    }
}

function renderReviewsPage(data) {
    // Update rating overview
    const ratingOverview = document.querySelector('.rating-overview h2');
    if (ratingOverview) ratingOverview.textContent = data.averageRating?.toFixed(1) || '0.0';
    
    const totalReviews = document.querySelector('.rating-overview p');
    if (totalReviews) totalReviews.textContent = `Based on ${data.totalReviews || 0} reviews`;
    
    // Update rating bars
    if (data.ratingDistribution) {
        const total = data.totalReviews || 1;
        for (let i = 5; i >= 1; i--) {
            const bar = document.querySelector(`.rating-bar[data-rating="${i}"] .bar-fill`);
            if (bar) {
                const percent = ((data.ratingDistribution[i] || 0) / total) * 100;
                bar.style.width = `${percent}%`;
            }
        }
    }
}

// ============================================================
// My Jobs
// ============================================================

async function loadMyJobs(status = '') {
    try {
        const data = await apiGetMaidJobs(status);
        myMaidJobs = data.jobs || [];
        renderMyJobs(myMaidJobs);
    } catch (error) {
        console.error('Error loading jobs:', error);
        showMaidNotification('Failed to load jobs', 'error');
    }
}

function renderMyJobs(jobs) {
    const upcomingList = document.querySelector('.upcoming-jobs-list');
    if (!upcomingList) return;
    
    const upcoming = jobs.filter(j => j.status === 'accepted');
    
    if (upcoming.length === 0) {
        upcomingList.innerHTML = '<div class="empty-state"><p>No upcoming jobs</p></div>';
        return;
    }
    
    upcomingList.innerHTML = upcoming.map(job => `
        <div class="upcoming-job-item">
            <div class="job-time">
                <div class="time-badge">
                    <span class="time">${formatTime(job.scheduledDate)}</span>
                    <span class="date">${formatShortDate(job.scheduledDate)}</span>
                </div>
            </div>
            <div class="job-details">
                <h4>${job.title}</h4>
                <p><i class="fas fa-user"></i> ${job.clientName}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${job.address}</p>
                <p><i class="fas fa-dollar-sign"></i> $${job.estimatedPay.toFixed(2)} (${job.estimatedDuration} hours)</p>
            </div>
            <div class="job-actions-compact">
                <button class="btn-icon-text" onclick="checkIn('${job.id}')">
                    <i class="fas fa-sign-in-alt"></i> Check In
                </button>
            </div>
        </div>
    `).join('');
}

function filterJobs(status) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    loadMyJobs(status);
}


// ============================================================
// Helper Functions
// ============================================================

function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    let html = '';
    for (let i = 0; i < full; i++) html += '<i class="fas fa-star"></i>';
    if (half) html += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < empty; i++) html += '<i class="far fa-star"></i>';
    return html;
}

function formatStatus(status) {
    const map = { 'requested': 'Pending', 'accepted': 'Upcoming', 'in_progress': 'In Progress', 'completed': 'Completed', 'cancelled': 'Cancelled' };
    return map[status] || status;
}

function getStatusClass(status) {
    const map = { 'requested': 'pending', 'accepted': 'pending', 'in_progress': 'active', 'completed': 'completed', 'cancelled': 'cancelled' };
    return map[status] || '';
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatShortDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatTimeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    
    if (mins < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return formatDate(dateStr);
}

function showLoadingState() {
    document.querySelectorAll('.stat-card .stat-details h3').forEach(el => {
        el.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    });
}

function hideLoadingState() {}

// ============================================================
// Work Timer
// ============================================================

let workTimerInterval;

function startWorkTimer() {
    if (!currentJobStartTime) currentJobStartTime = new Date();
    
    workTimerInterval = setInterval(() => {
        const now = new Date();
        const diff = now - currentJobStartTime;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        
        const timeStr = `${hours}h ${minutes}m`;
        const workingTimeEl = document.getElementById('workingTime');
        if (workingTimeEl) workingTimeEl.textContent = timeStr;
        
        const totalDurationEl = document.getElementById('totalDuration');
        if (totalDurationEl) totalDurationEl.textContent = timeStr;
    }, 1000);
}

function stopWorkTimer() {
    if (workTimerInterval) {
        clearInterval(workTimerInterval);
        currentJobStartTime = null;
    }
}

// ============================================================
// Navigation & UI
// ============================================================

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId)?.classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === '#' + sectionId) item.classList.add('active');
    });
    
    const titles = {
        'dashboard': 'Maid Dashboard', 'job-requests': 'Job Requests', 'my-jobs': 'My Jobs',
        'schedule': 'Schedule', 'earnings': 'Earnings', 'reviews': 'Reviews', 'profile': 'Profile'
    };
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = titles[sectionId] || 'Dashboard';
    
    // Load section data
    switch (sectionId) {
        case 'dashboard': loadMaidDashboard(); break;
        case 'job-requests': loadJobRequests(); break;
        case 'my-jobs': loadMyJobs(); break;
        case 'earnings': loadEarnings(); break;
        case 'reviews': loadReviews(); break;
        case 'profile': loadMaidProfile(); break;
    }
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
}

function viewJobDetails(jobId) {
    alert(`Job Details #${jobId}\n\nThis would show complete job information.`);
}

function getDirections(jobId) {
    showMaidNotification('Opening navigation...', 'info');
}

function contactClient(clientId) {
    showMaidNotification('Opening chat...', 'info');
}

function reportIssue() {
    const issue = prompt('Describe the issue:');
    if (issue?.trim()) showMaidNotification('Issue reported to support', 'success');
}

function updateJobStatus() {
    document.querySelector('.task-update-section')?.scrollIntoView({ behavior: 'smooth' });
}

function markTaskDone(taskId) {
    const checkbox = event.target.closest('.task-checkbox')?.querySelector('input');
    if (checkbox) checkbox.checked = true;
    event.target.closest('.task-checkbox')?.classList.add('completed');
    event.target.remove();
    showMaidNotification('Task marked complete', 'success');
}

function exportEarnings() {
    showMaidNotification('Generating report...', 'info');
    setTimeout(() => showMaidNotification('Report downloaded!', 'success'), 1500);
}

function showMaidNotifications() {
    showMaidNotification('Notifications feature coming soon', 'info');
}

// ============================================================
// Notifications
// ============================================================

function showMaidNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================================
// Notification Functions
// ============================================================

async function initMaidNotifications() {
    await loadMaidNotificationList();
    notificationStream = connectNotificationStream(
        handleMaidNewNotification,
        updateMaidNotificationBadge
    );
}

async function loadMaidNotificationList() {
    try {
        const data = await apiGetNotifications({ limit: 20 });
        renderMaidNotifications(data.notifications || []);
        updateMaidNotificationBadge(data.unreadCount || 0);
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function renderMaidNotifications(notifications) {
    const list = document.getElementById('notificationList');
    if (!list) return;
    
    if (!notifications || notifications.length === 0) {
        list.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = notifications.map(n => `
        <div class="notification-item ${n.is_read ? '' : 'unread'}" 
             onclick="handleMaidNotificationClick('${n._id}', '${n.type}')">
            <div class="notification-icon ${n.type}">
                <i class="fas ${getMaidNotificationIcon(n.type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${escapeMaidHtml(n.title)}</div>
                <div class="notification-message">${escapeMaidHtml(n.message)}</div>
                <div class="notification-time">${formatMaidNotificationTime(n.createdAt)}</div>
            </div>
        </div>
    `).join('');
}

function getMaidNotificationIcon(type) {
    const icons = {
        'job_request': 'fa-briefcase',
        'job_accepted': 'fa-check-circle',
        'job_declined': 'fa-times-circle',
        'job_started': 'fa-play-circle',
        'job_completed': 'fa-check-double',
        'job_cancelled': 'fa-ban',
        'new_review': 'fa-star',
        'payment_received': 'fa-dollar-sign',
        'maid_approved': 'fa-user-check',
        'maid_rejected': 'fa-user-times',
        'system': 'fa-info-circle'
    };
    return icons[type] || 'fa-bell';
}

function formatMaidNotificationTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

function escapeMaidHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function toggleNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.classList.toggle('active');
        if (panel.classList.contains('active')) {
            loadMaidNotificationList();
        }
    }
}

function updateMaidNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = count > 0 ? 'block' : 'none';
    }
}

async function handleMaidNotificationClick(notificationId, type) {
    try {
        await apiMarkNotificationRead(notificationId);
        loadMaidNotificationList();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
    
    // Navigate based on type
    if (type === 'job_request') {
        showSection('job-requests');
    } else if (type === 'new_review') {
        showSection('reviews');
    } else if (type === 'payment_received') {
        showSection('earnings');
    }
    
    document.getElementById('notificationPanel')?.classList.remove('active');
}

async function markAllNotificationsRead() {
    try {
        await apiMarkAllNotificationsRead();
        loadMaidNotificationList();
        showMaidNotification('All notifications marked as read', 'success');
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

function handleMaidNewNotification(notification) {
    showMaidNotificationToast(notification);
    const panel = document.getElementById('notificationPanel');
    if (panel && panel.classList.contains('active')) {
        loadMaidNotificationList();
    }
    
    // Refresh job requests if it's a new job request
    if (notification.type === 'job_request') {
        loadJobRequests();
        loadMaidDashboard();
    }
}

function showMaidNotificationToast(notification) {
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${getMaidNotificationIcon(notification.type)}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${escapeMaidHtml(notification.title)}</div>
            <div class="toast-message">${escapeMaidHtml(notification.message)}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ============================================================
// Profile Functions
// ============================================================

async function loadMaidProfile() {
    try {
        const profile = await apiGetProfile();
        
        // Update profile display
        document.getElementById('profileName').textContent = profile.name || 'Maid';
        document.getElementById('profileFullName').value = profile.name || '';
        document.getElementById('profileEmail').value = profile.email || '';
        document.getElementById('profilePhone').value = profile.phone || '';
        
        if (profile.photo_url) {
            document.getElementById('profileAvatar').src = profile.photo_url;
        }
        
        // Load maid-specific data
        if (dashboardData) {
            document.getElementById('profileRating').textContent = dashboardData.stats?.averageRating?.toFixed(1) || '0.0';
            document.getElementById('profileReviewCount').textContent = dashboardData.stats?.totalReviews || 0;
        }
        
        // Get maid profile details
        const maidProfile = await apiRequest('/profile/maid', { method: 'GET' }).catch(() => null);
        if (maidProfile) {
            document.getElementById('profileLocation').value = maidProfile.location || '';
            document.getElementById('profileSpecialization').value = maidProfile.specializations || 'General Cleaning';
            document.getElementById('profileHourlyRate').value = maidProfile.hourly_rate || 15;
            document.getElementById('profileBio').value = maidProfile.bio || '';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function updateMaidProfile(event) {
    event.preventDefault();
    
    const profileData = {
        name: document.getElementById('profileFullName').value,
        phone: document.getElementById('profilePhone').value,
        location: document.getElementById('profileLocation').value,
        specializations: document.getElementById('profileSpecialization').value,
        hourly_rate: parseFloat(document.getElementById('profileHourlyRate').value) || 15,
        bio: document.getElementById('profileBio').value
    };
    
    try {
        await apiUpdateProfile(profileData);
        
        // Update local user data
        const user = getUser();
        if (user) {
            user.name = profileData.name;
            setUser(user);
        }
        
        // Update header display
        const userNameEl = document.querySelector('.user-profile span');
        if (userNameEl) userNameEl.textContent = profileData.name;
        
        showMaidNotification('Profile updated successfully!', 'success');
    } catch (error) {
        showMaidNotification(error.message || 'Failed to update profile', 'error');
    }
}

async function changeMaidPassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showMaidNotification('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showMaidNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        await apiRequest('/profile/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        showMaidNotification('Password changed successfully!', 'success');
        
        // Clear form
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    } catch (error) {
        showMaidNotification(error.message || 'Failed to change password', 'error');
    }
}

async function uploadMaidAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showMaidNotification('Please select an image file', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showMaidNotification('Image must be less than 5MB', 'error');
        return;
    }
    
    // Preview image immediately
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('profileAvatar').src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    // Upload to server
    const formData = new FormData();
    formData.append('photo', file);
    
    try {
        const response = await apiUploadPhoto(formData);
        if (response.photo_url) {
            document.getElementById('profileAvatar').src = response.photo_url;
        }
        showMaidNotification('Profile photo updated!', 'success');
    } catch (error) {
        showMaidNotification(error.message || 'Failed to upload photo', 'error');
    }
}

// ============================================================
// Logout
// ============================================================

function handleMaidLogout() {
    stopWorkTimer();
    if (typeof logout === 'function') {
        logout();
    } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'home.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href="index.html"]').forEach(link => {
        if (link.querySelector('.fa-sign-out-alt')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                handleMaidLogout();
            });
        }
    });
});

window.addEventListener('beforeunload', () => {
    stopWorkTimer();
    if (notificationStream) {
        notificationStream.close();
    }
});

console.log('Maid Script loaded');
