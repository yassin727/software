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
        
        // Reload dashboard and jobs
        await loadMaidDashboard();
        await loadMyJobs('active'); // This will render the active job card
        
        // Switch to my-jobs section to show the active job
        showSection('my-jobs');
    } catch (error) {
        showMaidNotification(error.message || 'Check-in failed', 'error');
    }
}

function checkOut() {
    document.getElementById('checkoutModal')?.classList.add('active');
}

function completeJob() {
    if (currentActiveJobId) {
        completeJobAndCheckout(currentActiveJobId);
    } else {
        document.getElementById('checkoutModal')?.classList.add('active');
    }
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
        
        // Render active job card if there's an in_progress job
        const inProgressJob = myMaidJobs.find(j => j.status === 'in_progress');
        const activeJobCard = document.querySelector('#activeJobCardContainer') || document.querySelector('.active-job-card');
        
        if (inProgressJob) {
            await renderActiveJobCard(inProgressJob);
            if (activeJobCard) {
                activeJobCard.style.display = 'block';
            }
        } else {
            // Hide active job card if no in_progress job
            if (activeJobCard) {
                activeJobCard.style.display = 'none';
            }
        }
        
        renderMyJobs(myMaidJobs);
    } catch (error) {
        console.error('Error loading jobs:', error);
        showMaidNotification('Failed to load jobs', 'error');
    }
}

/**
 * Render active job card with tasks (replaces hardcoded HTML)
 */
async function renderActiveJobCard(job) {
    try {
        // Get full job details with tasks
        const jobDetails = await apiGetJobDetails(job.id);
        const fullJob = jobDetails.job;
        
        const activeJobCard = document.querySelector('.active-job-card');
        if (!activeJobCard) return;
        
        activeJobCard.style.display = 'block';
        
        const tasks = fullJob.tasks || [];
        const completedTasks = tasks.filter(t => t.completed).length;
        const progressPercent = fullJob.progress_percentage || 0;
        
        // Calculate elapsed time
        let elapsedTime = '0h 0m';
        if (fullJob.attendance && fullJob.attendance.check_in_time) {
            const checkInTime = new Date(fullJob.attendance.check_in_time);
            const now = new Date();
            const diffMs = now - checkInTime;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            elapsedTime = `${diffHours}h ${diffMinutes}m`;
        }
        
        // Format check-in time
        const checkInTime = fullJob.attendance?.check_in_time 
            ? new Date(fullJob.attendance.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : 'Not checked in';
        
        activeJobCard.innerHTML = `
            <div class="job-card-header">
                <h3>Current Job - In Progress</h3>
                <span class="status-badge active">Active</span>
            </div>
            <div class="job-card-body">
                <div class="job-info-grid">
                    <div class="info-item">
                        <label>Client</label>
                        <p><img src="${fullJob.homeowner?.photo || 'https://via.placeholder.com/30'}" alt="Client" class="inline-avatar"> ${fullJob.homeowner?.name || 'Unknown'}</p>
                    </div>
                    <div class="info-item">
                        <label>Service</label>
                        <p>${fullJob.title}</p>
                    </div>
                    <div class="info-item">
                        <label>Check-in</label>
                        <p class="success-text"><i class="fas fa-check-circle"></i> ${checkInTime}</p>
                    </div>
                    <div class="info-item">
                        <label>Duration</label>
                        <p id="workingTime">${elapsedTime}</p>
                    </div>
                    <div class="info-item">
                        <label>Location</label>
                        <p>${fullJob.address}</p>
                    </div>
                    <div class="info-item">
                        <label>Expected Payment</label>
                        <p class="highlight-text">$${(fullJob.hourly_rate * (fullJob.estimated_duration || 4)).toFixed(2)}</p>
                    </div>
                </div>

                <!-- Task Checklist -->
                <div class="task-update-section">
                    <h4><i class="fas fa-tasks"></i> Task Checklist (${completedTasks}/${tasks.length} completed)</h4>
                    <div class="task-checklist-maid" id="activeJobTasksList">
                        ${tasks.length === 0 ? '<p style="color: var(--text-light); padding: 16px;">No tasks defined for this job.</p>' : ''}
                        ${tasks.map((task, index) => {
                            const completed = task.completed;
                            const completedAt = task.completed_at ? new Date(task.completed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
                            return `
                                <label class="task-checkbox ${completed ? 'completed' : ''}">
                                    <input type="checkbox" ${completed ? 'checked' : ''} 
                                           onchange="toggleTask('${fullJob.id}', ${index}, this.checked)"
                                           ${completed ? 'disabled' : ''}>
                                    <span>${task.name}</span>
                                    ${completed && completedAt ? `<small>Completed at ${completedAt}</small>` : ''}
                                    ${!completed ? `<button class="mark-done-btn" onclick="markTaskDone('${fullJob.id}', ${index})">Mark Done</button>` : ''}
                                </label>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="job-action-buttons">
                    <button class="btn-secondary" onclick="contactClient('${fullJob.homeowner?.phone || ''}')">
                        <i class="fas fa-phone"></i> Contact Client
                    </button>
                    <button class="btn-secondary" onclick="reportIssue()">
                        <i class="fas fa-exclamation-circle"></i> Report Issue
                    </button>
                    <button class="btn-primary large" onclick="completeJobAndCheckout('${fullJob.id}')">
                        <i class="fas fa-check-circle"></i> Complete & Check Out
                    </button>
                </div>
            </div>
        `;
        
        // Start/update work timer
        if (fullJob.attendance && fullJob.attendance.check_in_time) {
            currentJobStartTime = new Date(fullJob.attendance.check_in_time);
            currentActiveJobId = fullJob.id;
            startWorkTimer();
        }
    } catch (error) {
        console.error('Error rendering active job:', error);
    }
}

function renderMyJobs(jobs) {
    const upcomingList = document.querySelector('.upcoming-jobs-list');
    if (!upcomingList) return;
    
    // Show both accepted and in_progress jobs
    const activeJobs = jobs.filter(j => j.status === 'accepted' || j.status === 'in_progress');
    
    if (activeJobs.length === 0) {
        upcomingList.innerHTML = '<div class="empty-state"><p>No active jobs</p></div>';
        return;
    }
    
    upcomingList.innerHTML = activeJobs.map(job => {
        const isInProgress = job.status === 'in_progress';
        const progressPercent = job.progressPercentage || 0;
        
        return `
        <div class="upcoming-job-item ${isInProgress ? 'in-progress-job' : ''}">
            <div class="job-time">
                <div class="time-badge ${isInProgress ? 'active' : ''}">
                    <span class="time">${formatTime(job.scheduledDate)}</span>
                    <span class="date">${formatShortDate(job.scheduledDate)}</span>
                </div>
            </div>
            <div class="job-details">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h4>${job.title}</h4>
                    <span class="status-badge ${isInProgress ? 'active' : 'pending'}">${isInProgress ? 'In Progress' : 'Accepted'}</span>
                </div>
                ${isInProgress ? `
                    <div style="margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <small style="color: var(--text-light);">Progress</small>
                            <small style="font-weight: 600;">${progressPercent}%</small>
                        </div>
                        <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${progressPercent}%; height: 100%; background: var(--success-color); transition: width 0.3s;"></div>
                        </div>
                    </div>
                ` : ''}
                <p><i class="fas fa-user"></i> ${job.clientName}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${job.address}</p>
                <p><i class="fas fa-dollar-sign"></i> $${job.estimatedPay.toFixed(2)} (${job.estimatedDuration} hours)</p>
            </div>
            <div class="job-actions-compact">
                ${isInProgress ? `
                    <button class="btn-primary" onclick="viewJobProgress('${job.id}')" style="margin-bottom: 8px;">
                        <i class="fas fa-tasks"></i> View Tasks
                    </button>
                    <button class="btn-secondary" onclick="checkOut()">
                        <i class="fas fa-sign-out-alt"></i> Check Out
                    </button>
                ` : `
                    <button class="btn-icon-text" onclick="checkIn('${job.id}')">
                        <i class="fas fa-sign-in-alt"></i> Check In
                    </button>
                `}
            </div>
        </div>
    `}).join('');
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
        'schedule': 'Schedule', 'earnings': 'Earnings', 'reviews': 'Reviews', 'messages': 'Messages', 'profile': 'Profile'
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
        case 'messages': 
            loadMaidConversations(); 
            initMaidMessagingUI(); 
            break;
        default:
            stopMaidMessagePolling();
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

function contactClient(phone) {
    if (phone) {
        window.location.href = `tel:${phone}`;
    } else {
        showMaidNotification('Phone number not available', 'warning');
    }
}

function reportIssue() {
    const issue = prompt('Describe the issue:');
    if (issue?.trim()) showMaidNotification('Issue reported to support', 'success');
}

/**
 * View and update job progress with tasks
 */
async function viewJobProgress(jobId) {
    try {
        const data = await apiGetJobDetails(jobId);
        const job = data.job;
        
        // Create or update progress modal
        let modal = document.getElementById('jobProgressModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'jobProgressModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        const tasks = job.tasks || [];
        const progressPercent = job.progress_percentage || 0;
        const progressNotes = job.progress_notes || [];
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2><i class="fas fa-tasks"></i> Job Progress: ${job.title}</h2>
                    <button class="modal-close" onclick="closeModal('jobProgressModal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <!-- Progress Bar -->
                    <div style="margin-bottom: 24px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <h3>Overall Progress</h3>
                            <span style="font-size: 18px; font-weight: 600; color: var(--primary-color);">${progressPercent}%</span>
                        </div>
                        <div style="width: 100%; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden;">
                            <div id="progressBar" style="width: ${progressPercent}%; height: 100%; background: var(--success-color); transition: width 0.3s;"></div>
                        </div>
                    </div>
                    
                    <!-- Tasks List -->
                    <div style="margin-bottom: 24px;">
                        <h3 style="margin-bottom: 16px;"><i class="fas fa-list-check"></i> Tasks</h3>
                        <div id="tasksList" style="display: flex; flex-direction: column; gap: 12px;">
                            ${tasks.length === 0 ? '<p style="color: var(--text-light);">No tasks defined yet. Add tasks below.</p>' : ''}
                            ${tasks.map((task, index) => `
                                <div class="task-item" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-light); border-radius: 8px;">
                                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                                           onchange="toggleTask('${jobId}', ${index}, this.checked)"
                                           style="width: 20px; height: 20px; cursor: pointer;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 500; ${task.completed ? 'text-decoration: line-through; color: var(--text-light);' : ''}">${task.name}</div>
                                        ${task.notes ? `<div style="font-size: 12px; color: var(--text-light); margin-top: 4px;">${task.notes}</div>` : ''}
                                        ${task.completed_at ? `<div style="font-size: 11px; color: var(--success-color); margin-top: 4px;">Completed: ${new Date(task.completed_at).toLocaleString()}</div>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <!-- Add Task -->
                        <div style="margin-top: 16px; display: flex; gap: 8px;">
                            <input type="text" id="newTaskName" placeholder="Add new task..." 
                                   style="flex: 1; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px;">
                            <button class="btn-primary" onclick="addTask('${jobId}')">
                                <i class="fas fa-plus"></i> Add
                            </button>
                        </div>
                    </div>
                    
                    <!-- Progress Notes -->
                    <div style="margin-bottom: 24px;">
                        <h3 style="margin-bottom: 16px;"><i class="fas fa-sticky-note"></i> Progress Notes</h3>
                        <div id="progressNotesList" style="display: flex; flex-direction: column; gap: 12px; max-height: 200px; overflow-y: auto;">
                            ${progressNotes.length === 0 ? '<p style="color: var(--text-light);">No progress notes yet.</p>' : ''}
                            ${progressNotes.slice().reverse().map(note => `
                                <div style="padding: 12px; background: var(--bg-light); border-radius: 8px; border-left: 3px solid var(--primary-color);">
                                    <div style="font-size: 14px;">${note.note}</div>
                                    <div style="font-size: 11px; color: var(--text-light); margin-top: 4px;">
                                        ${new Date(note.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <!-- Add Progress Note -->
                        <div style="margin-top: 16px;">
                            <textarea id="newProgressNote" placeholder="Add progress update..." 
                                      rows="3" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; resize: vertical;"></textarea>
                            <div style="display: flex; gap: 8px; margin-top: 8px;">
                                <input type="range" id="progressSlider" min="0" max="100" value="${progressPercent}" 
                                       oninput="document.getElementById('progressValue').textContent = this.value + '%'"
                                       style="flex: 1;">
                                <span id="progressValue" style="min-width: 50px; font-weight: 600;">${progressPercent}%</span>
                                <button class="btn-primary" onclick="addProgressNote('${jobId}')">
                                    <i class="fas fa-save"></i> Update
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    } catch (error) {
        console.error('Error loading job progress:', error);
        showMaidNotification(error.message || 'Failed to load job progress', 'error');
    }
}

/**
 * Complete job and checkout
 */
async function completeJobAndCheckout(jobId) {
    try {
        // First, check if all tasks are completed
        const jobDetails = await apiGetJobDetails(jobId);
        const tasks = jobDetails.job.tasks || [];
        const incompleteTasks = tasks.filter(t => !t.completed);
        
        if (incompleteTasks.length > 0) {
            const confirmMsg = `You have ${incompleteTasks.length} incomplete task(s). Do you want to complete and checkout anyway?`;
            if (!confirm(confirmMsg)) return;
        }
        
        // Update progress to 100%
        await apiUpdateJobProgress(jobId, {
            progress_percentage: 100
        });
        
        // Then checkout
        if (currentAttendanceId && jobId) {
            await apiCheckOut(currentAttendanceId, jobId);
            showMaidNotification('Job completed and checked out successfully!', 'success');
            
            // Clear active job variables
            currentJobStartTime = null;
            currentActiveJobId = null;
            currentAttendanceId = null;
            stopWorkTimer();
            
            // Reload everything
            await loadMaidDashboard();
            await loadMyJobs('active');
        } else {
            showMaidNotification('Unable to checkout. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error completing job:', error);
        showMaidNotification(error.message || 'Failed to complete job', 'error');
    }
}

/**
 * Mark task as done (from active job card)
 */
async function markTaskDone(jobId, taskIndex) {
    try {
        await toggleTask(jobId, taskIndex, true);
        // Reload active job card to reflect changes
        const job = myMaidJobs.find(j => j.id === jobId);
        if (job && job.status === 'in_progress') {
            await renderActiveJobCard(job);
        }
    } catch (error) {
        console.error('Error marking task done:', error);
        showMaidNotification(error.message || 'Failed to mark task', 'error');
    }
}

/**
 * Toggle task completion
 */
async function toggleTask(jobId, taskIndex, completed) {
    try {
        const data = await apiGetJobDetails(jobId);
        const job = data.job;
        const tasks = job.tasks || [];
        
        if (tasks[taskIndex]) {
            tasks[taskIndex].completed = completed;
            tasks[taskIndex].completed_at = completed ? new Date() : null;
            
            // Calculate progress based on completed tasks
            const completedCount = tasks.filter(t => t.completed).length;
            const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
            
            await apiUpdateJobProgress(jobId, {
                tasks: tasks,
                progress_percentage: progressPercent
            });
            
            // Reload active job card if this is the current active job
            if (currentActiveJobId === jobId) {
                const job = myMaidJobs.find(j => j.id === jobId);
                if (job && job.status === 'in_progress') {
                    await renderActiveJobCard(job);
                }
            }
            
            // Reload the modal if it's open
            const modal = document.getElementById('jobProgressModal');
            if (modal && modal.classList.contains('active')) {
                await viewJobProgress(jobId);
            }
            
            await loadMyJobs('active'); // Refresh job list
            showMaidNotification('Task updated successfully', 'success');
        }
    } catch (error) {
        console.error('Error updating task:', error);
        showMaidNotification(error.message || 'Failed to update task', 'error');
    }
}

/**
 * Add new task
 */
async function addTask(jobId) {
    const taskInput = document.getElementById('newTaskName');
    const taskName = taskInput.value.trim();
    
    if (!taskName) {
        showMaidNotification('Please enter a task name', 'warning');
        return;
    }
    
    try {
        const data = await apiGetJobDetails(jobId);
        const job = data.job;
        const tasks = job.tasks || [];
        
        tasks.push({
            name: taskName,
            completed: false,
            completed_at: null,
            notes: ''
        });
        
        await apiUpdateJobProgress(jobId, { tasks: tasks });
        
        taskInput.value = '';
        await viewJobProgress(jobId);
        await loadMyJobs('active');
        showMaidNotification('Task added successfully', 'success');
    } catch (error) {
        console.error('Error adding task:', error);
        showMaidNotification(error.message || 'Failed to add task', 'error');
    }
}

/**
 * Add progress note and update progress percentage
 */
async function addProgressNote(jobId) {
    const noteInput = document.getElementById('newProgressNote');
    const progressSlider = document.getElementById('progressSlider');
    const note = noteInput.value.trim();
    const progressPercent = parseInt(progressSlider.value);
    
    if (!note && progressPercent === 0) {
        showMaidNotification('Please add a note or update progress', 'warning');
        return;
    }
    
    try {
        await apiUpdateJobProgress(jobId, {
            progress_percentage: progressPercent,
            progress_note: note || undefined
        });
        
        noteInput.value = '';
        await viewJobProgress(jobId);
        await loadMyJobs('active');
        showMaidNotification('Progress updated successfully', 'success');
    } catch (error) {
        console.error('Error updating progress:', error);
        showMaidNotification(error.message || 'Failed to update progress', 'error');
    }
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
    if (maidMessagePollingInterval) {
        clearInterval(maidMessagePollingInterval);
    }
});

// ============================================================
// MESSAGING FUNCTIONALITY
// ============================================================

let maidCurrentConversationId = null;
let maidMessagePollingInterval = null;
let maidConversationsCache = [];

/**
 * Load all conversations for the maid
 */
async function loadMaidConversations() {
    try {
        const conversations = await apiGetConversations();
        maidConversationsCache = conversations;
        renderMaidConversationsList(conversations);
        updateMaidMessageBadge();
    } catch (error) {
        console.error('Error loading conversations:', error);
        renderMaidConversationsList([]);
    }
}

/**
 * Render conversations list in sidebar
 */
function renderMaidConversationsList(conversations) {
    const container = document.querySelector('.conversations-list');
    if (!container) return;
    
    if (!conversations || conversations.length === 0) {
        container.innerHTML = `
            <div class="empty-conversations">
                <i class="fas fa-comments"></i>
                <p>No conversations yet</p>
                <small>Homeowners will message you about bookings</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = conversations.map(conv => {
        const participant = conv.otherParticipant || {};
        const lastMsg = conv.lastMessage;
        const isActive = conv.id === maidCurrentConversationId;
        const unreadClass = conv.unreadCount > 0 ? 'has-unread' : '';
        
        return `
            <div class="conversation-item ${isActive ? 'active' : ''} ${unreadClass}" 
                 data-conversation-id="${conv.id}"
                 onclick="selectMaidConversation('${conv.id}')">
                <img src="${participant.avatar || 'https://via.placeholder.com/45'}" alt="${participant.name || 'User'}">
                <div class="conversation-info">
                    <h4>${escapeMaidHtml(participant.name || 'Unknown')}</h4>
                    <p>${lastMsg ? escapeMaidHtml(lastMsg.body.substring(0, 40)) + (lastMsg.body.length > 40 ? '...' : '') : 'No messages yet'}</p>
                </div>
                <span class="message-time">${lastMsg ? formatMaidMessageTime(lastMsg.createdAt) : ''}</span>
                ${conv.unreadCount > 0 ? `<span class="unread-badge">${conv.unreadCount}</span>` : ''}
            </div>
        `;
    }).join('');
}

/**
 * Select and load a conversation
 */
async function selectMaidConversation(conversationId) {
    maidCurrentConversationId = conversationId;
    
    // Update active state in list
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.toggle('active', item.dataset.conversationId === conversationId);
    });
    
    // Find conversation in cache
    const conversation = maidConversationsCache.find(c => c.id === conversationId);
    
    // Update chat header
    updateMaidChatHeader(conversation);
    
    // Load messages
    await loadMaidMessages(conversationId);
    
    // Mark as read
    try {
        await apiMarkMessagesAsRead(conversationId);
        const convItem = document.querySelector(`.conversation-item[data-conversation-id="${conversationId}"]`);
        if (convItem) {
            convItem.classList.remove('has-unread');
            const badge = convItem.querySelector('.unread-badge');
            if (badge) badge.remove();
        }
        updateMaidMessageBadge();
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
    
    // Start polling for new messages
    startMaidMessagePolling();
}

/**
 * Update chat header with participant info
 */
function updateMaidChatHeader(conversation) {
    const header = document.querySelector('.chat-header');
    if (!header || !conversation) return;
    
    const participant = conversation.otherParticipant || {};
    header.innerHTML = `
        <img src="${participant.avatar || 'https://via.placeholder.com/45'}" alt="${participant.name || 'User'}">
        <div>
            <h4>${escapeMaidHtml(participant.name || 'Unknown')}</h4>
            <p class="online-status"><i class="fas fa-circle"></i> Homeowner</p>
        </div>
    `;
}

/**
 * Load messages for a conversation
 */
async function loadMaidMessages(conversationId) {
    const container = document.querySelector('.chat-messages');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-messages"><i class="fas fa-spinner fa-spin"></i> Loading messages...</div>';
    
    try {
        const messages = await apiGetMessages(conversationId);
        renderMaidMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
        container.innerHTML = '<div class="error-messages"><i class="fas fa-exclamation-circle"></i> Failed to load messages</div>';
    }
}

/**
 * Render messages in chat area
 */
function renderMaidMessages(messages) {
    const container = document.querySelector('.chat-messages');
    if (!container) return;
    
    const currentUser = getUser();
    
    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div class="empty-messages">
                <i class="fas fa-comment-dots"></i>
                <p>No messages yet</p>
                <small>Send a message to start the conversation</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = messages.map(msg => {
        const isSent = msg.senderId.toString() === currentUser.id.toString();
        return `
            <div class="message ${isSent ? 'sent' : 'received'}">
                <p>${escapeMaidHtml(msg.body)}</p>
                <span class="time">${formatMaidMessageTime(msg.createdAt)}</span>
            </div>
        `;
    }).join('');
    
    container.scrollTop = container.scrollHeight;
}

/**
 * Send a message
 */
async function sendMaidMessage() {
    if (!maidCurrentConversationId) {
        showMaidNotification('Please select a conversation first', 'error');
        return;
    }
    
    const input = document.querySelector('.chat-input input');
    if (!input) return;
    
    const body = input.value.trim();
    if (!body) return;
    
    input.value = '';
    
    try {
        const message = await apiSendMessage(maidCurrentConversationId, body);
        appendMaidMessage(message);
        await loadMaidConversations();
    } catch (error) {
        console.error('Error sending message:', error);
        showMaidNotification(error.message || 'Failed to send message', 'error');
        input.value = body;
    }
}

/**
 * Append a single message to the chat
 */
function appendMaidMessage(message) {
    const container = document.querySelector('.chat-messages');
    if (!container) return;
    
    const emptyState = container.querySelector('.empty-messages');
    if (emptyState) emptyState.remove();
    
    const currentUser = getUser();
    const isSent = message.senderId.toString() === currentUser.id.toString();
    
    const msgEl = document.createElement('div');
    msgEl.className = `message ${isSent ? 'sent' : 'received'}`;
    msgEl.innerHTML = `
        <p>${escapeMaidHtml(message.body)}</p>
        <span class="time">${formatMaidMessageTime(message.createdAt)}</span>
    `;
    
    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
}

/**
 * Format message timestamp
 */
function formatMaidMessageTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

/**
 * Update message badge in navbar
 */
async function updateMaidMessageBadge() {
    try {
        const result = await apiGetUnreadMessageCount();
        const navItem = document.querySelector('a[href="#messages"]');
        if (navItem) {
            let badgeEl = navItem.querySelector('.msg-badge');
            if (result.unreadCount > 0) {
                if (!badgeEl) {
                    badgeEl = document.createElement('span');
                    badgeEl.className = 'msg-badge badge';
                    navItem.appendChild(badgeEl);
                }
                badgeEl.textContent = result.unreadCount > 99 ? '99+' : result.unreadCount;
                badgeEl.style.display = 'inline-block';
            } else if (badgeEl) {
                badgeEl.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error updating message badge:', error);
    }
}

/**
 * Start polling for new messages
 */
function startMaidMessagePolling() {
    if (maidMessagePollingInterval) {
        clearInterval(maidMessagePollingInterval);
    }
    
    maidMessagePollingInterval = setInterval(async () => {
        if (!maidCurrentConversationId) return;
        
        try {
            const messages = await apiGetMessages(maidCurrentConversationId);
            const container = document.querySelector('.chat-messages');
            if (container) {
                const currentCount = container.querySelectorAll('.message').length;
                if (messages.length > currentCount) {
                    renderMaidMessages(messages);
                }
            }
        } catch (error) {
            console.error('Error polling messages:', error);
        }
    }, 5000);
}

/**
 * Stop message polling
 */
function stopMaidMessagePolling() {
    if (maidMessagePollingInterval) {
        clearInterval(maidMessagePollingInterval);
        maidMessagePollingInterval = null;
    }
}

/**
 * Initialize messaging UI event listeners
 */
function initMaidMessagingUI() {
    const sendBtn = document.querySelector('.chat-input button');
    if (sendBtn) {
        sendBtn.onclick = sendMaidMessage;
    }
    
    const chatInput = document.querySelector('.chat-input input');
    if (chatInput) {
        chatInput.onkeypress = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMaidMessage();
            }
        };
    }
}

// Messaging is initialized via showSection switch case above

/**
 * Contact a homeowner (start conversation)
 */
async function contactHomeowner(homeownerId) {
    showMaidNotification('Opening messenger...', 'info');
    try {
        const conversation = await apiCreateConversation(homeownerId);
        maidCurrentConversationId = conversation.id;
        showSection('messages');
        await loadMaidConversations();
        await selectMaidConversation(conversation.id);
    } catch (error) {
        console.error('Error opening conversation:', error);
        showMaidNotification(error.message || 'Failed to open conversation', 'error');
    }
}

console.log('Maid Script loaded');
