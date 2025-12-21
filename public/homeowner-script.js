// Homeowner-specific functions

// Store data for current session
let myJobs = [];
let searchedMaids = [];
let currentBookingMaidId = null;
let dashboardData = null;
let notificationStream = null;

/**
 * Initialize homeowner dashboard on page load
 */
document.addEventListener('DOMContentLoaded', async function() {
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
    
    if (user.role !== 'homeowner') {
        if (typeof redirectToDashboard === 'function') {
            redirectToDashboard();
        } else {
            window.location.href = 'login.html';
        }
        return;
    }
    
    // Update user display
    const userNameEl = document.querySelector('.user-profile span');
    if (userNameEl && user.name) {
        userNameEl.textContent = user.name;
    }
    
    // Load initial data
    await loadHomeownerDashboard();
    
    // Initialize notifications
    initNotifications();
    
    // Close notification panel when clicking outside
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('notificationPanel');
        const wrapper = e.target.closest('.notification-wrapper');
        if (panel && panel.classList.contains('active') && !wrapper) {
            panel.classList.remove('active');
        }
    });
});

/**
 * Load homeowner dashboard data from API
 */
async function loadHomeownerDashboard() {
    try {
        showLoadingState();
        dashboardData = await apiGetHomeownerDashboard();
        renderDashboard(dashboardData);
        hideLoadingState();
        
        // Check for pending payments and notify user
        checkPendingPayments();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        hideLoadingState();
        showNotification('Failed to load dashboard data', 'error');
    }
}


/**
 * Render dashboard with real data
 */
function renderDashboard(data) {
    if (!data) return;
    
    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card .stat-details h3');
    if (statCards.length >= 4 && data.stats) {
        statCards[0].textContent = data.stats.activeBookings || 0;
        statCards[1].textContent = data.stats.maidsOnSiteToday || 0;
        statCards[2].textContent = data.stats.pendingReviews || 0;
        statCards[3].textContent = `$${data.stats.monthlySpend || 0}`;
    }
    
    // Render today's schedule
    renderTodaySchedule(data.todaySchedule || []);
    
    // Render recent activity
    renderRecentActivity(data.recentActivity || []);
}

/**
 * Render today's schedule
 */
function renderTodaySchedule(schedule) {
    const scheduleList = document.querySelector('.schedule-list');
    if (!scheduleList) return;
    
    if (schedule.length === 0) {
        scheduleList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-check"></i>
                <p>No appointments scheduled for today</p>
                <button class="btn-primary" onclick="showSection('search-maids')">Book a Maid</button>
            </div>
        `;
        return;
    }
    
    scheduleList.innerHTML = schedule.map(item => `
        <div class="schedule-item ${item.status === 'in_progress' ? 'active-booking' : ''}">
            <div class="schedule-time">${item.time}</div>
            <div class="schedule-details">
                <h4>${item.maidName}</h4>
                <p><i class="fas fa-broom"></i> ${item.service}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${item.address}</p>
            </div>
            <div class="booking-actions">
                <span class="status-badge ${item.status === 'in_progress' ? 'active' : 'pending'}">
                    ${formatStatus(item.status)}
                </span>
                ${item.status === 'in_progress' ? `
                    <button class="btn-icon" onclick="trackMaid('${item.id}')">
                        <i class="fas fa-location-arrow"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

/**
 * Render recent activity timeline
 */
function renderRecentActivity(activity) {
    const timeline = document.querySelector('.activity-timeline');
    if (!timeline) return;
    
    if (activity.length === 0) {
        timeline.innerHTML = `
            <div class="empty-state">
                <p>No recent activity</p>
            </div>
        `;
        return;
    }
    
    timeline.innerHTML = activity.map(item => `
        <div class="timeline-item">
            <div class="timeline-marker ${item.type}"></div>
            <div class="timeline-content">
                <p><strong>${item.maidName}</strong> ${item.action}</p>
                <span class="time">${item.time}</span>
            </div>
        </div>
    `).join('');
}

/**
 * Load and render maids for search
 */
async function loadSearchMaids(filters = {}) {
    try {
        const maidGrid = document.querySelector('.maid-cards-grid');
        if (maidGrid) {
            maidGrid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading maids...</div>';
        }
        
        const response = await apiSearchMaids(filters);
        searchedMaids = response.maids || [];
        renderMaidCards(searchedMaids);
    } catch (error) {
        console.error('Error loading maids:', error);
        showNotification('Failed to load maids', 'error');
    }
}

/**
 * Render maid cards
 */
function renderMaidCards(maids) {
    const maidGrid = document.querySelector('.maid-cards-grid');
    if (!maidGrid) return;
    
    if (maids.length === 0) {
        maidGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <i class="fas fa-search" style="font-size: 48px; color: #ccc; margin-bottom: 16px;"></i>
                <p>No maids found matching your criteria</p>
                <button class="btn-secondary" onclick="loadSearchMaids()">Clear Filters</button>
            </div>
        `;
        return;
    }
    
    maidGrid.innerHTML = maids.map(maid => `
        <div class="maid-card">
            <div class="maid-card-header">
                <img src="${maid.photo || 'https://via.placeholder.com/80'}" alt="${maid.name}">
                <span class="${maid.isOnline ? 'online-badge' : 'offline-badge'}">${maid.isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div class="maid-card-body">
                <h3>${maid.name}</h3>
                <div class="maid-rating">
                    ${renderStars(maid.rating)}
                    <span>${maid.rating.toFixed(1)} (${maid.totalReviews} reviews)</span>
                </div>
                <p class="maid-specialization">
                    <i class="fas fa-broom"></i> ${maid.specialization}
                </p>
                <p class="maid-location">
                    <i class="fas fa-map-marker-alt"></i> ${maid.location}
                </p>
                <p class="maid-rate">
                    <i class="fas fa-dollar-sign"></i> $${maid.hourlyRate}/hour
                </p>
                <div class="maid-tags">
                    ${maid.isVerified ? '<span class="tag">Verified</span>' : ''}
                    ${maid.rating >= 4.5 ? '<span class="tag">Top Rated</span>' : ''}
                    ${maid.experienceYears >= 3 ? '<span class="tag">Experienced</span>' : ''}
                </div>
            </div>
            <div class="maid-card-footer">
                <button class="btn-secondary" onclick="viewMaidProfile('${maid.id}')">View Profile</button>
                <button class="btn-secondary" onclick="contactMaid('${maid.userId}')" title="Message"><i class="fas fa-comment"></i></button>
                <button class="btn-primary" onclick="bookMaid('${maid.id}', '${maid.name}', ${maid.hourlyRate})" ${!maid.isOnline ? 'disabled' : ''}>
                    ${maid.isOnline ? 'Book Now' : 'Currently Offline'}
                </button>
            </div>
        </div>
    `).join('');
}


/**
 * Load and render bookings
 */
async function loadBookings(status = 'all') {
    try {
        const bookingsList = document.querySelector('.bookings-list');
        if (bookingsList) {
            bookingsList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading bookings...</div>';
        }
        
        const response = await apiGetHomeownerBookings(status);
        myJobs = response.bookings || [];
        renderBookings(myJobs);
    } catch (error) {
        console.error('Error loading bookings:', error);
        showNotification('Failed to load bookings', 'error');
    }
}

/**
 * Render bookings list
 */
function renderBookings(bookings) {
    const bookingsList = document.querySelector('.bookings-list');
    if (!bookingsList) return;
    
    if (bookings.length === 0) {
        bookingsList.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px;">
                <i class="fas fa-calendar-alt" style="font-size: 48px; color: #ccc; margin-bottom: 16px;"></i>
                <p>No bookings found</p>
                <button class="btn-primary" onclick="showSection('search-maids')">Find a Maid</button>
            </div>
        `;
        return;
    }
    
    bookingsList.innerHTML = bookings.map(booking => {
        const isInProgress = booking.status === 'in_progress';
        const progressPercent = booking.progressPercentage || 0;
        
        return `
        <div class="booking-card ${isInProgress ? 'active-card' : ''}">
            <div class="booking-header">
                <h3>Booking #${booking.id.slice(-6).toUpperCase()}</h3>
                <span class="status-badge ${getStatusClass(booking.status)}">${formatStatus(booking.status)}</span>
            </div>
            <div class="booking-body">
                <div class="booking-maid-info">
                    <img src="${booking.maid.photo || 'https://via.placeholder.com/60'}" alt="${booking.maid.name}">
                    <div>
                        <h4>${booking.maid.name}</h4>
                        <p class="rating"><i class="fas fa-star"></i> ${booking.maid.rating.toFixed(1)}</p>
                    </div>
                </div>
                ${isInProgress ? `
                    <div style="margin: 16px 0; padding: 16px; background: var(--bg-light); border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <strong><i class="fas fa-tasks"></i> Work Progress</strong>
                            <strong style="color: var(--primary-color);">${progressPercent}%</strong>
                        </div>
                        <div style="width: 100%; height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden; margin-bottom: 8px;">
                            <div style="width: ${progressPercent}%; height: 100%; background: var(--success-color); transition: width 0.3s;"></div>
                        </div>
                        <div style="display: flex; gap: 8px; margin-top: 8px;">
                            <button class="btn-secondary" onclick="viewHomeownerJobProgress('${booking.id}')" style="flex: 1;">
                                <i class="fas fa-eye"></i> View Progress
                            </button>
                            <button class="btn-secondary" onclick="editHomeownerJobTasks('${booking.id}')" style="flex: 1;">
                                <i class="fas fa-edit"></i> Edit Tasks
                            </button>
                        </div>
                    </div>
                ` : ''}
                <div class="booking-details">
                    <p><i class="fas fa-calendar"></i> <strong>Date:</strong> ${formatDate(booking.scheduledDatetime)}</p>
                    <p><i class="fas fa-clock"></i> <strong>Time:</strong> ${formatTime(booking.scheduledDatetime)}</p>
                    <p><i class="fas fa-broom"></i> <strong>Service:</strong> ${booking.title}</p>
                    <p><i class="fas fa-map-marker-alt"></i> <strong>Location:</strong> ${booking.address}</p>
                    <p><i class="fas fa-dollar-sign"></i> <strong>Rate:</strong> $${booking.hourlyRate}/hour (Est. $${booking.estimatedTotal})</p>
                </div>
            </div>
            <div class="booking-footer">
                ${renderBookingActions(booking)}
            </div>
        </div>
    `}).join('');
}

/**
 * Render booking action buttons based on status
 */
function renderBookingActions(booking) {
    const actions = [];
    
    // Payment button for completed jobs awaiting payment
    if (booking.status === 'completed' && booking.paymentStatus === 'awaiting_payment') {
        const amount = booking.hourlyRate * (booking.actualDuration || booking.estimatedDuration || 4);
        actions.push(`<button class="btn-primary" onclick="openPaymentModal('${booking.id}', '${booking.title}', '${booking.maid.name}', ${amount}, '${booking.paymentMethod}')"><i class="fas fa-credit-card"></i> Pay Now ($${amount.toFixed(2)})</button>`);
    }
    
    // Message button available for all active bookings (uses booking ID to find conversation)
    if (booking.status === 'in_progress' || booking.status === 'requested' || booking.status === 'accepted') {
        actions.push(`<button class="btn-secondary" onclick="messageFromBooking('${booking.id}')"><i class="fas fa-comment"></i> Message</button>`);
    }
    
    if (booking.status === 'in_progress') {
        actions.push(`<button class="btn-secondary" onclick="trackMaid('${booking.id}')"><i class="fas fa-location-arrow"></i> Track</button>`);
        actions.push(`<button class="btn-primary" onclick="viewTaskProgress('${booking.id}')"><i class="fas fa-tasks"></i> Progress</button>`);
    } else if (booking.status === 'requested' || booking.status === 'accepted') {
        actions.push(`<button class="btn-secondary" onclick="rescheduleBooking('${booking.id}')"><i class="fas fa-calendar-alt"></i> Reschedule</button>`);
        actions.push(`<button class="btn-secondary" onclick="cancelBooking('${booking.id}')"><i class="fas fa-times"></i> Cancel</button>`);
    } else if (booking.status === 'completed' && booking.paymentStatus !== 'awaiting_payment' && !booking.hasReview) {
        actions.push(`<button class="btn-primary" onclick="openReviewModal('${booking.id}', '${booking.maid.userId}')"><i class="fas fa-star"></i> Leave Review</button>`);
        actions.push(`<button class="btn-secondary" onclick="bookAgain('${booking.maid.id}')"><i class="fas fa-redo"></i> Book Again</button>`);
    } else if (booking.status === 'completed' && booking.paymentStatus !== 'awaiting_payment') {
        actions.push(`<button class="btn-secondary" onclick="viewInvoice('${booking.id}')"><i class="fas fa-file-invoice"></i> Invoice</button>`);
        actions.push(`<button class="btn-secondary" onclick="bookAgain('${booking.maid.id}')"><i class="fas fa-redo"></i> Book Again</button>`);
    }
    
    return actions.join('');
}

/**
 * Load and render service history
 */
async function loadHistory(startDate, endDate) {
    try {
        const historyList = document.querySelector('.history-list');
        if (historyList) {
            historyList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading history...</div>';
        }
        
        const response = await apiGetServiceHistory(startDate, endDate);
        renderHistory(response);
    } catch (error) {
        console.error('Error loading history:', error);
        showNotification('Failed to load history', 'error');
    }
}

/**
 * Render service history
 */
function renderHistory(data) {
    const historyList = document.querySelector('.history-list');
    if (!historyList) return;
    
    const history = data.history || [];
    
    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px;">
                <i class="fas fa-history" style="font-size: 48px; color: #ccc; margin-bottom: 16px;"></i>
                <p>No service history found</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = history.map(item => `
        <div class="history-card">
            <div class="history-header">
                <h4>Booking #${item.id.slice(-6).toUpperCase()}</h4>
                <span class="status-badge completed">Completed</span>
            </div>
            <div class="history-body">
                <div class="history-maid">
                    <img src="${item.maid.photo || 'https://via.placeholder.com/50'}" alt="${item.maid.name}">
                    <div>
                        <h5>${item.maid.name}</h5>
                        <p>${item.title}</p>
                    </div>
                </div>
                <div class="history-details">
                    <p><i class="fas fa-calendar"></i> ${formatDate(item.scheduledDatetime)}</p>
                    <p><i class="fas fa-clock"></i> ${item.duration} hours</p>
                    <p><i class="fas fa-dollar-sign"></i> $${item.totalAmount.toFixed(2)}</p>
                </div>
                ${item.review ? `
                    <div class="history-rating">
                        <div class="stars">${renderStars(item.review.rating)}</div>
                        <p class="review">"${item.review.comment || 'No comment'}"</p>
                    </div>
                ` : ''}
            </div>
            <div class="history-footer">
                <button class="btn-small" onclick="viewInvoice('${item.id}')"><i class="fas fa-file-invoice"></i> Invoice</button>
                <button class="btn-small" onclick="bookAgain('${item.maid.id}')"><i class="fas fa-redo"></i> Book Again</button>
            </div>
        </div>
    `).join('');
}


// ============================================================
// Helper Functions
// ============================================================

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
    
    let html = '';
    for (let i = 0; i < fullStars; i++) html += '<i class="fas fa-star"></i>';
    if (hasHalf) html += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < emptyStars; i++) html += '<i class="far fa-star"></i>';
    return html;
}

function formatStatus(status) {
    const statusMap = {
        'requested': 'Pending',
        'accepted': 'Upcoming',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
}

function getStatusClass(status) {
    const classMap = {
        'requested': 'pending',
        'accepted': 'pending',
        'in_progress': 'active',
        'completed': 'completed',
        'cancelled': 'cancelled'
    };
    return classMap[status] || '';
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
}

function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}

function showLoadingState() {
    document.querySelectorAll('.stat-card .stat-details h3').forEach(el => {
        el.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    });
}

function hideLoadingState() {
    // Loading state is replaced by actual data
}

// ============================================================
// Action Functions
// ============================================================

function bookMaid(maidId, maidName, hourlyRate) {
    currentBookingMaidId = maidId;
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.add('active');
        
        // Populate maid select with available maids
        const maidSelect = document.getElementById('maidSelect');
        if (maidSelect) {
            maidSelect.innerHTML = '<option value="">Choose a maid...</option>';
            
            // Add all searched maids as options
            searchedMaids.forEach(maid => {
                const option = document.createElement('option');
                option.value = maid.id;
                option.textContent = `${maid.name} - $${maid.hourlyRate}/hour`;
                option.dataset.rate = maid.hourlyRate;
                maidSelect.appendChild(option);
            });
            
            // If maid not in list, add them
            if (maidId && !searchedMaids.find(m => m.id === maidId)) {
                const option = document.createElement('option');
                option.value = maidId;
                option.textContent = `${maidName} - $${hourlyRate}/hour`;
                option.dataset.rate = hourlyRate;
                maidSelect.appendChild(option);
            }
            
            maidSelect.value = maidId;
        }
        
        // Set hourly rate
        const rateInput = document.getElementById('bookingHourlyRate');
        if (rateInput) {
            rateInput.value = hourlyRate || 15;
        }
        
        // Set default date to tomorrow
        const dateInput = document.getElementById('bookingDate');
        if (dateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.value = tomorrow.toISOString().split('T')[0];
            dateInput.min = new Date().toISOString().split('T')[0];
        }
        
        // Set default time
        const timeInput = document.getElementById('bookingTime');
        if (timeInput) {
            timeInput.value = '09:00';
        }
        
        // Update rate display
        updateMaidRateDisplay();
        updateEstimatedTotal();
    }
    showNotification(`Booking ${maidName}`, 'info');
}

// Update rate display when maid selection changes
function updateMaidRateDisplay() {
    const maidSelect = document.getElementById('maidSelect');
    const rateDisplay = document.getElementById('maidRateDisplay');
    const rateInput = document.getElementById('bookingHourlyRate');
    
    if (maidSelect && maidSelect.selectedOptions[0]) {
        const rate = maidSelect.selectedOptions[0].dataset.rate;
        if (rate && rateDisplay) {
            rateDisplay.textContent = `Rate: $${rate}/hour`;
        }
        if (rate && rateInput) {
            rateInput.value = rate;
        }
    }
    updateEstimatedTotal();
}

// Calculate and display estimated total
function updateEstimatedTotal() {
    const duration = parseFloat(document.getElementById('bookingDuration')?.value) || 4;
    const rate = parseFloat(document.getElementById('bookingHourlyRate')?.value) || 0;
    const total = duration * rate;
    
    const totalDisplay = document.getElementById('estimatedTotal');
    if (totalDisplay) {
        totalDisplay.textContent = `$${total.toFixed(2)}`;
    }
}

// Add event listeners for booking form
document.addEventListener('DOMContentLoaded', () => {
    const maidSelect = document.getElementById('maidSelect');
    const durationInput = document.getElementById('bookingDuration');
    const rateInput = document.getElementById('bookingHourlyRate');
    
    if (maidSelect) maidSelect.addEventListener('change', updateMaidRateDisplay);
    if (durationInput) durationInput.addEventListener('input', updateEstimatedTotal);
    if (rateInput) rateInput.addEventListener('input', updateEstimatedTotal);
});

async function viewMaidProfile(maidId) {
    try {
        const profile = await apiGetMaidProfile(maidId);
        // Show profile in modal or alert for now
        alert(`${profile.name}\n\n` +
              `Rating: ${profile.rating.toFixed(1)} (${profile.totalReviews} reviews)\n` +
              `Specialization: ${profile.specialization}\n` +
              `Rate: $${profile.hourlyRate}/hour\n` +
              `Experience: ${profile.experienceYears} years\n` +
              `Location: ${profile.location}\n` +
              `Completed Jobs: ${profile.completedJobs}\n\n` +
              `${profile.bio || 'No bio available'}`);
    } catch (error) {
        showNotification('Failed to load maid profile', 'error');
    }
}

function trackMaid(bookingId) {
    showNotification('Opening live tracking...', 'info');
    openMaidLocationModal(bookingId);
}

/**
 * Open modal to show maid's live location
 */
async function openMaidLocationModal(jobId) {
    try {
        // Create modal if it doesn't exist
        let modal = document.getElementById('maidLocationModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'maidLocationModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        // Show loading state
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2><i class="fas fa-map-marker-alt"></i> Maid Location</h2>
                    <button class="modal-close" onclick="closeModal('maidLocationModal')">&times;</button>
                </div>
                <div class="modal-body" style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: var(--primary-color);"></i>
                    <p style="margin-top: 16px;">Loading location...</p>
                </div>
            </div>
        `;
        modal.classList.add('active');
        
        // Fetch maid location
        const response = await apiGetMaidLocation(jobId);
        
        if (!response.location) {
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2><i class="fas fa-map-marker-alt"></i> Maid Location</h2>
                        <button class="modal-close" onclick="closeModal('maidLocationModal')">&times;</button>
                    </div>
                    <div class="modal-body" style="text-align: center; padding: 40px;">
                        <i class="fas fa-map-marked-alt" style="font-size: 64px; color: #ccc; margin-bottom: 16px;"></i>
                        <h3>${response.maidName || 'Maid'}</h3>
                        <p style="color: var(--text-light);">${response.message || 'Location not available yet'}</p>
                        <p style="font-size: 12px; color: #999; margin-top: 16px;">The maid needs to share their location from the app</p>
                        <button class="btn-secondary" onclick="openMaidLocationModal('${jobId}')" style="margin-top: 16px;">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        const { latitude, longitude, updatedAt } = response.location;
        const maidName = response.maidName || 'Maid';
        const lastUpdate = updatedAt ? new Date(updatedAt).toLocaleTimeString() : 'Unknown';
        
        // Create map URL (using OpenStreetMap embed)
        const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.005},${latitude-0.005},${longitude+0.005},${latitude+0.005}&layer=mapnik&marker=${latitude},${longitude}`;
        const fullMapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h2><i class="fas fa-map-marker-alt"></i> ${maidName}'s Location</h2>
                    <button class="modal-close" onclick="closeModal('maidLocationModal')">&times;</button>
                </div>
                <div class="modal-body" style="padding: 0;">
                    <div style="position: relative; width: 100%; height: 400px; background: #f0f0f0;">
                        <iframe 
                            width="100%" 
                            height="100%" 
                            frameborder="0" 
                            scrolling="no" 
                            marginheight="0" 
                            marginwidth="0" 
                            src="${mapUrl}"
                            style="border: 0;">
                        </iframe>
                    </div>
                    <div style="padding: 16px; background: var(--bg-light); border-top: 1px solid var(--border-color);">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                            <div>
                                <p style="margin: 0; font-weight: 600;"><i class="fas fa-user"></i> ${maidName}</p>
                                <p style="margin: 4px 0 0; font-size: 12px; color: var(--text-light);">
                                    <i class="fas fa-clock"></i> Last updated: ${lastUpdate}
                                </p>
                                <p style="margin: 4px 0 0; font-size: 12px; color: var(--text-light);">
                                    <i class="fas fa-map-pin"></i> ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
                                </p>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn-secondary" onclick="openMaidLocationModal('${jobId}')">
                                    <i class="fas fa-sync"></i> Refresh
                                </button>
                                <a href="${fullMapUrl}" target="_blank" class="btn-primary" style="text-decoration: none;">
                                    <i class="fas fa-external-link-alt"></i> Open in Maps
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error getting maid location:', error);
        showNotification('Failed to get maid location: ' + (error.message || 'Unknown error'), 'error');
        closeModal('maidLocationModal');
    }
}

async function contactMaid(maidId) {
    showNotification('Opening messenger...', 'info');
    try {
        // Create or get existing conversation with this maid
        const conversation = await apiCreateConversation(maidId);
        currentConversationId = conversation.id;
        
        // Switch to messages section and load the conversation
        showSection('messages');
        await loadConversations();
        await selectConversation(conversation.id);
    } catch (error) {
        console.error('Error opening conversation:', error);
        showNotification(error.message || 'Failed to open conversation', 'error');
    }
}

/**
 * Open conversation from a booking (uses booking ID to find/create conversation)
 * Server derives userId from JWT - we only send bookingId
 */
async function messageFromBooking(bookingId) {
    // Validate bookingId before making API call
    if (!bookingId) {
        showNotification('Cannot open chat: booking ID is missing', 'error');
        return;
    }
    
    // Check if user is authenticated
    const user = getUser();
    if (!user || !user.id) {
        showNotification('Please log in to send messages', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    showNotification('Opening messenger...', 'info');
    try {
        // Get conversation for this booking (server derives maidId from booking)
        const conversation = await apiGetConversationByBooking(bookingId);
        
        if (!conversation || !conversation.id) {
            showNotification('Could not open conversation', 'error');
            return;
        }
        
        currentConversationId = conversation.id;
        
        // Switch to messages section and load the conversation
        showSection('messages');
        await loadConversations();
        await selectConversation(conversation.id);
    } catch (error) {
        console.error('Error opening conversation from booking:', error);
        // Show user-friendly error messages
        const errorMsg = error.message || 'Failed to open conversation';
        if (errorMsg.includes('not found')) {
            showNotification('Booking or maid not found', 'error');
        } else if (errorMsg.includes('Not authorized') || errorMsg.includes('403')) {
            showNotification('You are not authorized to view this conversation', 'error');
        } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
            showNotification('Session expired. Please log in again.', 'error');
            window.location.href = 'login.html';
        } else {
            showNotification(errorMsg, 'error');
        }
    }
}

function viewTaskProgress(bookingId) {
    // Open job progress modal instead
    viewHomeownerJobProgress(bookingId);
}

async function submitBooking(event) {
    event.preventDefault();
    
    // Get form values using IDs
    const maidId = document.getElementById('maidSelect')?.value || currentBookingMaidId;
    const bookingDate = document.getElementById('bookingDate')?.value;
    const bookingTime = document.getElementById('bookingTime')?.value;
    const serviceType = document.getElementById('bookingServiceType')?.value;
    const address = document.getElementById('bookingAddress')?.value;
    const hourlyRate = document.getElementById('bookingHourlyRate')?.value;
    const instructions = document.getElementById('bookingInstructions')?.value;
    const duration = document.getElementById('bookingDuration')?.value;
    
    // Validate required fields
    if (!maidId) {
        showNotification('Please select a maid', 'error');
        return;
    }
    if (!bookingDate || !bookingTime) {
        showNotification('Please select date and time', 'error');
        return;
    }
    if (!serviceType) {
        showNotification('Please select a service type', 'error');
        return;
    }
    if (!address) {
        showNotification('Please enter your address', 'error');
        return;
    }
    if (!hourlyRate || parseFloat(hourlyRate) <= 0) {
        showNotification('Please enter a valid hourly rate', 'error');
        return;
    }
    
    // Build scheduled datetime in ISO format
    const scheduledDatetime = `${bookingDate}T${bookingTime}:00`;
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn?.innerHTML;
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';
        submitBtn.disabled = true;
    }
    
    // Collect tasks
    const tasks = [];
    document.querySelectorAll('#tasksContainer .task-item').forEach(item => {
        const taskName = item.querySelector('.task-name')?.textContent.trim();
        if (taskName) {
            tasks.push({ name: taskName });
        }
    });
    
    // Get selected payment method
    const paymentMethodInput = document.querySelector('input[name="paymentMethod"]:checked');
    const paymentMethod = paymentMethodInput?.value || 'cash';
    
    try {
        const response = await apiCreateJob({
            maidId: maidId,
            title: serviceType,
            description: instructions || '',
            address: address,
            scheduledDatetime: scheduledDatetime,
            hourlyRate: parseFloat(hourlyRate),
            estimatedDuration: parseFloat(duration) || 4,
            tasks: tasks,
            paymentMethod: paymentMethod
        });
        
        const paymentMsg = paymentMethod === 'cash' 
            ? 'Pay the maid directly after service.' 
            : 'You will be notified to complete payment after service.';
        showNotification(`Booking created successfully! ${paymentMsg}`, 'success');
        closeModal('bookingModal');
        document.getElementById('bookingForm')?.reset();
        
        // Clear tasks container
        const tasksContainer = document.getElementById('tasksContainer');
        if (tasksContainer) tasksContainer.innerHTML = '';
        
        // Redirect to My Bookings
        showSection('my-bookings');
    } catch (error) {
        showNotification(error.message || 'Failed to create booking', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

function rescheduleBooking(bookingId) {
    // Find the booking to get current date
    const booking = myJobs.find(b => b.id === bookingId);
    const currentDate = booking ? new Date(booking.scheduledDatetime) : new Date();
    
    // Create reschedule modal
    let modal = document.getElementById('rescheduleModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'rescheduleModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    // Format current date for display
    const currentDateStr = currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    
    // Set min date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px;">
            <div class="modal-header">
                <h2><i class="fas fa-calendar-alt"></i> Reschedule Booking</h2>
                <button class="modal-close" onclick="closeModal('rescheduleModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p style="margin-bottom: 16px; color: var(--text-light);">
                    Current schedule: <strong>${currentDateStr}</strong>
                </p>
                <form id="rescheduleForm" onsubmit="submitReschedule(event, '${bookingId}')">
                    <div class="form-group">
                        <label for="newDate"><i class="fas fa-calendar"></i> New Date</label>
                        <input type="date" id="newDate" name="newDate" min="${minDate}" required>
                    </div>
                    <div class="form-group">
                        <label for="newTime"><i class="fas fa-clock"></i> New Time</label>
                        <input type="time" id="newTime" name="newTime" required>
                    </div>
                    <div style="display: flex; gap: 12px; margin-top: 24px;">
                        <button type="button" class="btn-secondary" onclick="closeModal('rescheduleModal')" style="flex: 1;">
                            Cancel
                        </button>
                        <button type="submit" class="btn-primary" style="flex: 1;">
                            <i class="fas fa-check"></i> Confirm
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

async function submitReschedule(event, bookingId) {
    event.preventDefault();
    
    const newDate = document.getElementById('newDate').value;
    const newTime = document.getElementById('newTime').value;
    
    if (!newDate || !newTime) {
        showNotification('Please select both date and time', 'error');
        return;
    }
    
    const scheduledDatetime = new Date(`${newDate}T${newTime}`).toISOString();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rescheduling...';
    submitBtn.disabled = true;
    
    try {
        await apiRescheduleBooking(bookingId, scheduledDatetime);
        showNotification('Booking rescheduled successfully!', 'success');
        closeModal('rescheduleModal');
        await loadBookings();
    } catch (error) {
        showNotification(error.message || 'Failed to reschedule booking', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function cancelBooking(bookingId) {
    // Create cancel confirmation modal
    let modal = document.getElementById('cancelModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cancelModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h2><i class="fas fa-times-circle" style="color: #e74c3c;"></i> Cancel Booking</h2>
                <button class="modal-close" onclick="closeModal('cancelModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p style="margin-bottom: 16px;">Are you sure you want to cancel this booking?</p>
                <div class="form-group">
                    <label for="cancelReason">Reason (optional)</label>
                    <textarea id="cancelReason" rows="3" placeholder="Let the maid know why you're cancelling..."></textarea>
                </div>
                <div style="display: flex; gap: 12px; margin-top: 24px;">
                    <button type="button" class="btn-secondary" onclick="closeModal('cancelModal')" style="flex: 1;">
                        Keep Booking
                    </button>
                    <button type="button" class="btn-primary" onclick="confirmCancelBooking('${bookingId}')" style="flex: 1; background: #e74c3c;">
                        <i class="fas fa-times"></i> Cancel Booking
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

async function confirmCancelBooking(bookingId) {
    const reason = document.getElementById('cancelReason')?.value || '';
    const cancelBtn = document.querySelector('#cancelModal .btn-primary');
    
    if (cancelBtn) {
        cancelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelling...';
        cancelBtn.disabled = true;
    }
    
    try {
        await apiCancelBooking(bookingId, reason);
        showNotification('Booking cancelled successfully', 'success');
        closeModal('cancelModal');
        await loadBookings();
    } catch (error) {
        showNotification(error.message || 'Failed to cancel booking', 'error');
        if (cancelBtn) {
            cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel Booking';
            cancelBtn.disabled = false;
        }
    }
}

function filterBookings(status) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    loadBookings(status);
}

function openBookingModal() {
    document.getElementById('bookingModal')?.classList.add('active');
}

function openReviewModal(bookingId, maidId) {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.classList.add('active');
        modal.dataset.bookingId = bookingId;
        modal.dataset.maidId = maidId;
    }
}

async function submitReview(event) {
    event.preventDefault();
    
    const form = event.target;
    const modal = document.getElementById('reviewModal');
    const bookingId = modal?.dataset.bookingId;
    const maidId = modal?.dataset.maidId;
    
    // Get rating from filled stars (fas class)
    const filledStars = document.querySelectorAll('.star-rating .fas');
    const rating = filledStars.length || 5;
    const reviewText = form.querySelector('textarea')?.value?.trim() || '';
    
    if (rating < 1 || rating > 5) {
        showNotification('Please select a rating', 'error');
        return;
    }
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn?.innerHTML;
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;
    }
    
    try {
        await apiSubmitReview({
            jobId: bookingId,
            revieweeId: maidId,
            rating: rating,
            comments: reviewText
        });
        
        showNotification('Review submitted successfully!', 'success');
        closeModal('reviewModal');
        form.reset();
        
        // Reset stars to empty
        document.querySelectorAll('.star-rating i').forEach(star => {
            star.classList.remove('fas');
            star.classList.add('far');
        });
        
        await loadBookings();
    } catch (error) {
        showNotification(error.message || 'Failed to submit review', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

function exportHistory() {
    showNotification('Exporting service history...', 'info');
    setTimeout(() => showNotification('History exported!', 'success'), 1500);
}

function viewInvoice(bookingId) {
    alert(`Invoice for Booking #${bookingId.slice(-6).toUpperCase()}\n\nThis feature is coming soon.`);
}

function bookAgain(maidId) {
    openBookingModal();
    const maidSelect = document.getElementById('maidSelect');
    if (maidSelect) maidSelect.value = maidId;
    showNotification('Pre-filled with previous maid', 'info');
}

function showNotifications() {
    showNotification('Notifications feature coming soon', 'info');
}

function applyFilters() {
    const location = document.querySelector('.filter-group select:nth-child(1)')?.value;
    const specialization = document.querySelector('.filter-group:nth-child(2) select')?.value;
    const availability = document.querySelector('.filter-group:nth-child(3) select')?.value;
    const rating = document.querySelector('.filter-group:nth-child(4) select')?.value;
    
    const minRating = rating?.includes('4.5') ? 4.5 : rating?.includes('4.0') ? 4.0 : rating?.includes('3.5') ? 3.5 : null;
    
    loadSearchMaids({
        location: location !== 'All Locations' ? location : null,
        specialization: specialization !== 'All Types' ? specialization : null,
        availability: availability !== 'Any Time' ? availability : null,
        minRating: minRating
    });
}


// ============================================================
// Section Change Handler
// ============================================================

// Override showSection to load data when switching sections
const originalShowSection = typeof showSection === 'function' ? showSection : null;

function showSection(sectionId) {
    console.log('Homeowner showSection called with:', sectionId);
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === '#' + sectionId) {
            item.classList.add('active');
        }
    });
    
    // Update page title
    const titles = {
        'dashboard': 'Homeowner Dashboard',
        'search-maids': 'Search Maids',
        'my-bookings': 'My Bookings',
        'history': 'Service History',
        'messages': 'Messages',
        'profile': 'My Profile'
    };
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = titles[sectionId] || 'Dashboard';
    
    // Load data for section
    console.log('Loading data for section:', sectionId);
    loadSectionData(sectionId);
}

// Separate function to load section data
async function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'dashboard':
            loadHomeownerDashboard();
            break;
        case 'search-maids':
            loadSearchMaids();
            break;
        case 'my-bookings':
            loadBookings();
            break;
        case 'history':
            loadHistory();
            break;
        case 'messages':
            loadConversations();
            break;
    }
}

// Also add click event listeners as backup
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const sectionId = href.substring(1);
                showSection(sectionId);
            }
        });
    });
});

// ============================================================
// Modal Functions
// ============================================================

/**
 * View job progress for homeowner
 */
async function viewHomeownerJobProgress(jobId) {
    try {
        const data = await apiGetJobDetails(jobId);
        const job = data.job;
        
        // Create or update progress modal
        let modal = document.getElementById('homeownerJobProgressModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'homeownerJobProgressModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        const tasks = job.tasks || [];
        const progressPercent = job.progress_percentage || 0;
        const progressNotes = job.progress_notes || [];
        const completedTasks = tasks.filter(t => t.completed).length;
        
        // Determine progress color
        let progressColor = '#3498db'; // blue
        if (progressPercent >= 75) progressColor = '#22c55e'; // green
        else if (progressPercent >= 50) progressColor = '#f59e0b'; // orange
        
        // Format scheduled date
        const scheduledDate = job.scheduled_datetime ? new Date(job.scheduled_datetime).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : 'Not scheduled';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 550px; border-radius: 16px; overflow: hidden;">
                <div class="modal-header" style="background: linear-gradient(135deg, #1e3a5f, #2c5282); color: white; padding: 20px 24px;">
                    <div>
                        <h2 style="display: flex; align-items: center; gap: 10px; margin: 0; font-size: 20px;">
                            <i class="fas fa-clipboard-check"></i> ${job.title}
                        </h2>
                        <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.9;">
                            <i class="fas fa-calendar"></i> ${scheduledDate} &nbsp;|&nbsp; 
                            <i class="fas fa-map-marker-alt"></i> ${job.address || 'No address'}
                        </p>
                    </div>
                    <button class="modal-close" onclick="closeModal('homeownerJobProgressModal')" style="color: white; background: rgba(255,255,255,0.2); border-radius: 50%; width: 32px; height: 32px;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="max-height: 60vh; overflow-y: auto; padding: 24px;">
                    
                    <!-- Progress Circle -->
                    <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 28px;">
                        <div style="position: relative; width: 140px; height: 140px;">
                            <svg width="140" height="140" style="transform: rotate(-90deg);">
                                <circle cx="70" cy="70" r="58" fill="none" stroke="#e2e8f0" stroke-width="12"/>
                                <circle cx="70" cy="70" r="58" fill="none" stroke="${progressColor}" stroke-width="12"
                                    stroke-dasharray="${Math.PI * 116}" 
                                    stroke-dashoffset="${Math.PI * 116 * (1 - progressPercent / 100)}"
                                    stroke-linecap="round"
                                    style="transition: stroke-dashoffset 0.5s ease;"/>
                            </svg>
                            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                                <div style="font-size: 32px; font-weight: 700; color: ${progressColor};">${progressPercent}%</div>
                                <div style="font-size: 12px; color: #64748b; font-weight: 500;">Complete</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tasks Section -->
                    <div style="margin-bottom: 24px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                            <h4 style="margin: 0; display: flex; align-items: center; gap: 8px; font-size: 15px;">
                                <i class="fas fa-list-check" style="color: #1e3a5f;"></i> 
                                Task Checklist
                            </h4>
                            <span style="font-size: 13px; color: #64748b; font-weight: 500;">
                                ${completedTasks} of ${tasks.length} done
                            </span>
                        </div>
                        ${tasks.length === 0 ? `
                            <div style="text-align: center; padding: 24px; background: #f8fafc; border-radius: 12px; border: 2px dashed #e2e8f0;">
                                <i class="fas fa-clipboard" style="font-size: 32px; color: #cbd5e1; margin-bottom: 8px;"></i>
                                <p style="color: #64748b; margin: 0; font-size: 14px;">No tasks defined for this job</p>
                            </div>
                        ` : `
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                ${tasks.map(task => `
                                    <div style="display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: ${task.completed ? '#f0fdf4' : '#ffffff'}; border-radius: 10px; border: 1px solid ${task.completed ? '#bbf7d0' : '#e2e8f0'}; transition: all 0.2s;">
                                        <div style="width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${task.completed ? '#22c55e' : '#e2e8f0'};">
                                            <i class="fas ${task.completed ? 'fa-check' : 'fa-circle'}" style="color: ${task.completed ? 'white' : '#94a3b8'}; font-size: ${task.completed ? '12px' : '8px'};"></i>
                                        </div>
                                        <div style="flex: 1;">
                                            <div style="font-weight: 500; color: ${task.completed ? '#16a34a' : '#1e293b'}; font-size: 14px;">${task.name}</div>
                                            ${task.completed_at ? `
                                                <div style="font-size: 11px; color: #22c55e; margin-top: 3px;">
                                                    <i class="fas fa-check-double"></i> Completed at ${new Date(task.completed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                    
                    <!-- Progress Notes -->
                    ${progressNotes.length > 0 ? `
                        <div style="margin-bottom: 24px;">
                            <h4 style="margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px; font-size: 15px;">
                                <i class="fas fa-comment-alt" style="color: #1e3a5f;"></i> 
                                Progress Updates
                            </h4>
                            <div style="display: flex; flex-direction: column; gap: 10px; max-height: 180px; overflow-y: auto;">
                                ${progressNotes.slice().reverse().map(note => `
                                    <div style="padding: 14px; background: #f8fafc; border-radius: 10px; border-left: 4px solid #3b82f6;">
                                        <div style="font-size: 14px; color: #1e293b; line-height: 1.5;">${note.note}</div>
                                        <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
                                            <i class="fas fa-clock"></i> ${new Date(note.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Maid Info Card -->
                    <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 12px; padding: 18px; border: 1px solid #e2e8f0;">
                        <h4 style="margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px; font-size: 15px;">
                            <i class="fas fa-user-tie" style="color: #1e3a5f;"></i> 
                            Assigned Maid
                        </h4>
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #1e3a5f, #2c5282); display: flex; align-items: center; justify-content: center; color: white; font-size: 22px; font-weight: 600;">
                                ${(job.maid?.name || 'M').charAt(0).toUpperCase()}
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; font-size: 16px; color: #1e293b;">${job.maid?.name || 'Not assigned'}</div>
                                <div style="font-size: 13px; color: #64748b; margin-top: 2px;">
                                    <i class="fas fa-phone"></i> ${job.maid?.phone || 'No phone'}
                                </div>
                                ${job.maid?.rating ? `
                                    <div style="font-size: 13px; color: #f59e0b; margin-top: 2px;">
                                        <i class="fas fa-star"></i> ${job.maid.rating.toFixed(1)} rating
                                    </div>
                                ` : ''}
                            </div>
                            ${job.attendance ? `
                                <div style="text-align: right;">
                                    <div style="font-size: 11px; color: #64748b;">Status</div>
                                    <div style="font-weight: 600; color: ${job.attendance.check_out_time ? '#64748b' : '#22c55e'}; font-size: 13px;">
                                        ${job.attendance.check_out_time ? 
                                            `<i class="fas fa-check-circle"></i> Done` : 
                                            `<i class="fas fa-circle" style="animation: pulse 1.5s infinite;"></i> Working`
                                        }
                                    </div>
                                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                                        Since ${new Date(job.attendance.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ` : `
                                <div style="text-align: right;">
                                    <div style="font-size: 11px; color: #64748b;">Status</div>
                                    <div style="font-weight: 600; color: #f59e0b; font-size: 13px;">
                                        <i class="fas fa-hourglass-half"></i> Pending
                                    </div>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
                
                <!-- Footer Actions -->
                <div style="padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn-secondary" onclick="trackMaid('${jobId}')" style="padding: 10px 16px;">
                        <i class="fas fa-map-marker-alt"></i> Track
                    </button>
                    <button class="btn-secondary" onclick="messageFromBooking('${jobId}')" style="padding: 10px 16px;">
                        <i class="fas fa-comment"></i> Message
                    </button>
                    <button class="btn-primary" onclick="closeModal('homeownerJobProgressModal')" style="padding: 10px 20px;">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    } catch (error) {
        console.error('Error loading job progress:', error);
        showNotification(error.message || 'Failed to load job progress', 'error');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// ============================================================
// Notification Helper
// ============================================================

function showNotification(message, type = 'info') {
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
// Star Rating Functionality
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const starRating = document.querySelector('.star-rating');
    if (starRating) {
        const stars = starRating.querySelectorAll('i');
        stars.forEach(star => {
            star.addEventListener('click', function() {
                const rating = this.dataset.rating;
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.remove('far');
                        s.classList.add('fas');
                    } else {
                        s.classList.remove('fas');
                        s.classList.add('far');
                    }
                });
            });
        });
    }
});

// ============================================================
// Logout Handler
// ============================================================

function handleHomeownerLogout() {
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
                handleHomeownerLogout();
            });
        }
    });
});

// ============================================================
// Sidebar Toggle
// ============================================================

function toggleSidebar() {
    document.querySelector('.sidebar')?.classList.toggle('collapsed');
    document.querySelector('.main-content')?.classList.toggle('expanded');
}

console.log('Homeowner Script loaded');


// ============================================================
// Profile Functions
// ============================================================

/**
 * Load user profile data
 */
async function loadProfile() {
    try {
        const profile = await apiGetProfile();
        
        // Update form fields
        document.getElementById('profileName').value = profile.name || '';
        document.getElementById('profileEmail').value = profile.email || '';
        document.getElementById('profilePhone').value = profile.phone || '';
        document.getElementById('profileMemberSince').value = profile.createdAt 
            ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : 'N/A';
        
        // Update avatar
        const avatar = document.getElementById('profileAvatar');
        if (avatar && profile.photo_url) {
            avatar.src = profile.photo_url;
        }
        
        // Update header avatar too
        const headerAvatar = document.querySelector('.user-profile img');
        if (headerAvatar && profile.photo_url) {
            headerAvatar.src = profile.photo_url;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Failed to load profile', 'error');
    }
}

/**
 * Update user profile
 */
async function updateProfile(event) {
    event.preventDefault();
    
    const name = document.getElementById('profileName').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    
    if (!name) {
        showNotification('Name is required', 'error');
        return;
    }
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    try {
        await apiUpdateProfile({ name, phone });
        showNotification('Profile updated successfully!', 'success');
        
        // Update local storage and header
        const user = getUser();
        if (user) {
            user.name = name;
            setUser(user);
            const userNameEl = document.querySelector('.user-profile span');
            if (userNameEl) userNameEl.textContent = name;
        }
    } catch (error) {
        showNotification(error.message || 'Failed to update profile', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

/**
 * Change password
 */
async function changePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Changing...';
    submitBtn.disabled = true;
    
    try {
        await apiRequest('/profile/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
        });
        
        showNotification('Password changed successfully!', 'success');
        document.getElementById('passwordForm').reset();
    } catch (error) {
        showNotification(error.message || 'Failed to change password', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

/**
 * Upload avatar
 */
async function uploadAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image must be less than 5MB', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('photo', file);
    
    try {
        showNotification('Uploading photo...', 'info');
        
        const token = getToken();
        const response = await fetch('/api/profile/photo', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Upload failed');
        }
        
        // Update avatar display
        const avatar = document.getElementById('profileAvatar');
        if (avatar && data.photoUrl) {
            avatar.src = data.photoUrl + '?t=' + Date.now(); // Cache bust
        }
        
        // Update header avatar
        const headerAvatar = document.querySelector('.user-profile img');
        if (headerAvatar && data.photoUrl) {
            headerAvatar.src = data.photoUrl + '?t=' + Date.now();
        }
        
        showNotification('Photo uploaded successfully!', 'success');
    } catch (error) {
        showNotification(error.message || 'Failed to upload photo', 'error');
    }
}

// Update showSection to load profile data
const originalShowSectionFn = showSection;
showSection = function(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === '#' + sectionId) {
            item.classList.add('active');
        }
    });
    
    // Update page title
    const titles = {
        'dashboard': 'Homeowner Dashboard',
        'search-maids': 'Search Maids',
        'my-bookings': 'My Bookings',
        'history': 'Service History',
        'messages': 'Messages',
        'profile': 'My Profile'
    };
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = titles[sectionId] || 'Dashboard';
    
    // Load data for section
    switch (sectionId) {
        case 'dashboard':
            loadHomeownerDashboard();
            break;
        case 'search-maids':
            loadSearchMaids();
            break;
        case 'my-bookings':
            loadBookings();
            break;
        case 'history':
            loadHistory();
            break;
        case 'profile':
            loadProfile();
            break;
        case 'messages':
            loadConversations();
            initMessagingUI();
            break;
        default:
            stopMessagePolling();
    }
};


// ============================================================
// Notification Functions
// ============================================================

/**
 * Initialize notification system
 */
async function initNotifications() {
    // Load initial notifications
    await loadNotifications();
    
    // Start polling for updates
    notificationStream = connectNotificationStream(
        handleNewNotification,
        updateNotificationBadge
    );
}

/**
 * Load notifications from API
 */
async function loadNotifications() {
    try {
        const data = await apiGetNotifications({ limit: 20 });
        renderNotifications(data.notifications || []);
        updateNotificationBadge(data.unreadCount || 0);
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

/**
 * Render notifications in the panel
 */
function renderNotifications(notifications) {
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
             onclick="handleNotificationClick('${n._id}', ${JSON.stringify(n.data || {}).replace(/"/g, '&quot;')})">
            <div class="notification-icon ${n.type}">
                <i class="fas ${getNotificationIcon(n.type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${escapeHtml(n.title)}</div>
                <div class="notification-message">${escapeHtml(n.message)}</div>
                <div class="notification-time">${formatNotificationTime(n.createdAt)}</div>
            </div>
        </div>
    `).join('');
}

/**
 * Get icon for notification type
 */
function getNotificationIcon(type) {
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

/**
 * Format notification time
 */
function formatNotificationTime(dateStr) {
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

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Edit tasks for an existing booking (homeowner)
 */
async function editHomeownerJobTasks(jobId) {
    try {
        const data = await apiGetJobDetails(jobId);
        const job = data.job;
        
        // Create or update tasks edit modal
        let modal = document.getElementById('editTasksModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'editTasksModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        const tasks = job.tasks || [];
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2><i class="fas fa-edit"></i> Edit Tasks: ${job.title}</h2>
                    <button class="modal-close" onclick="closeModal('editTasksModal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <p style="color: var(--text-light); margin-bottom: 16px;">
                        Edit the tasks for this job. The maid will see these tasks when they check in.
                    </p>
                    
                    <div id="editTasksContainer" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
                        ${tasks.map((task, index) => `
                            <div class="task-item" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--bg-light); border-radius: 6px;">
                                <input type="text" value="${escapeHtml(task.name)}" 
                                       class="task-name-input" 
                                       data-index="${index}"
                                       style="flex: 1; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
                                <button type="button" class="btn-icon" onclick="removeEditTask(this)" style="color: var(--danger-color);">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                        <input type="text" id="newEditTaskInput" placeholder="Add new task..." 
                               style="flex: 1; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px;">
                        <button type="button" class="btn-secondary" onclick="addEditTask()">
                            <i class="fas fa-plus"></i> Add
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeModal('editTasksModal')">Cancel</button>
                    <button type="button" class="btn-primary" onclick="saveHomeownerTasks('${jobId}')">
                        <i class="fas fa-save"></i> Save Tasks
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    } catch (error) {
        console.error('Error loading job for editing:', error);
        showNotification(error.message || 'Failed to load job', 'error');
    }
}

/**
 * Add task in edit modal
 */
function addEditTask() {
    const taskInput = document.getElementById('newEditTaskInput');
    const taskName = taskInput.value.trim();
    
    if (!taskName) {
        showNotification('Please enter a task name', 'warning');
        return;
    }
    
    const container = document.getElementById('editTasksContainer');
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--bg-light); border-radius: 6px;';
    taskItem.innerHTML = `
        <input type="text" value="${escapeHtml(taskName)}" 
               class="task-name-input" 
               style="flex: 1; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
        <button type="button" class="btn-icon" onclick="removeEditTask(this)" style="color: var(--danger-color);">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(taskItem);
    taskInput.value = '';
}

/**
 * Remove task in edit modal
 */
function removeEditTask(button) {
    button.closest('.task-item').remove();
}

/**
 * Save tasks for homeowner
 */
async function saveHomeownerTasks(jobId) {
    try {
        const taskInputs = document.querySelectorAll('#editTasksContainer .task-name-input');
        const tasks = [];
        
        taskInputs.forEach(input => {
            const taskName = input.value.trim();
            if (taskName) {
                tasks.push({ name: taskName });
            }
        });
        
        await apiUpdateJobProgress(jobId, { tasks: tasks });
        
        showNotification('Tasks updated successfully!', 'success');
        closeModal('editTasksModal');
        
        // Reload bookings to show updated progress
        await loadBookings();
    } catch (error) {
        console.error('Error saving tasks:', error);
        showNotification(error.message || 'Failed to save tasks', 'error');
    }
}

/**
 * Add task to booking form
 */
function addBookingTask() {
    const taskInput = document.getElementById('newTaskInput');
    const taskName = taskInput.value.trim();
    
    if (!taskName) {
        showNotification('Please enter a task name', 'warning');
        return;
    }
    
    const tasksContainer = document.getElementById('tasksContainer');
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--bg-light); border-radius: 6px;';
    taskItem.innerHTML = `
        <span class="task-name" style="flex: 1;">${escapeHtml(taskName)}</span>
        <button type="button" class="btn-icon" onclick="removeBookingTask(this)" style="color: var(--danger-color);">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    tasksContainer.appendChild(taskItem);
    taskInput.value = '';
}

/**
 * Remove task from booking form
 */
function removeBookingTask(button) {
    button.closest('.task-item').remove();
}

/**
 * Toggle notification panel
 */
function toggleNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.classList.toggle('active');
        if (panel.classList.contains('active')) {
            loadNotifications(); // Refresh when opening
        }
    }
}

/**
 * Update notification badge count
 */
function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = count > 0 ? 'block' : 'none';
    }
}

/**
 * Handle notification click
 */
async function handleNotificationClick(notificationId, data) {
    // Mark as read
    try {
        await apiMarkNotificationRead(notificationId);
        loadNotifications(); // Refresh list
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
    
    // Navigate based on notification data
    if (data && data.job_id) {
        showSection('my-bookings');
    }
    
    // Close panel
    document.getElementById('notificationPanel')?.classList.remove('active');
}

/**
 * Mark all notifications as read
 */
async function markAllNotificationsRead() {
    try {
        await apiMarkAllNotificationsRead();
        loadNotifications();
        showNotification('All notifications marked as read', 'success');
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

/**
 * Handle new real-time notification
 */
function handleNewNotification(notification) {
    // Show toast notification
    showNotificationToast(notification);
    
    // Refresh notification list if panel is open
    const panel = document.getElementById('notificationPanel');
    if (panel && panel.classList.contains('active')) {
        loadNotifications();
    }
}

/**
 * Show toast notification for real-time updates
 */
function showNotificationToast(notification) {
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${getNotificationIcon(notification.type)}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(notification.title)}</div>
            <div class="toast-message">${escapeHtml(notification.message)}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (notificationStream) {
        notificationStream.close();
    }
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
    }
});

// ============================================================
// MESSAGING FUNCTIONALITY
// ============================================================

let currentConversationId = null;
let messagePollingInterval = null;
let conversationsCache = [];

/**
 * Load all conversations for the user
 */
async function loadConversations() {
    try {
        const conversations = await apiGetConversations();
        conversationsCache = conversations;
        renderConversationsList(conversations);
        updateMessageBadge();
    } catch (error) {
        console.error('Error loading conversations:', error);
        renderConversationsList([]);
    }
}

/**
 * Render conversations list in sidebar
 */
function renderConversationsList(conversations) {
    const container = document.querySelector('.conversations-list');
    if (!container) return;
    
    if (!conversations || conversations.length === 0) {
        container.innerHTML = `
            <div class="empty-conversations">
                <i class="fas fa-comments"></i>
                <p>No conversations yet</p>
                <small>Start a conversation by messaging a maid from your bookings</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = conversations.map(conv => {
        const participant = conv.otherParticipant || {};
        const lastMsg = conv.lastMessage;
        const isActive = conv.id === currentConversationId;
        const unreadClass = conv.unreadCount > 0 ? 'has-unread' : '';
        
        return `
            <div class="conversation-item ${isActive ? 'active' : ''} ${unreadClass}" 
                 data-conversation-id="${conv.id}"
                 onclick="selectConversation('${conv.id}')">
                <img src="${participant.avatar || 'https://via.placeholder.com/45'}" alt="${participant.name || 'User'}">
                <div class="conversation-info">
                    <h4>${escapeHtml(participant.name || 'Unknown')}</h4>
                    <p>${lastMsg ? escapeHtml(lastMsg.body.substring(0, 40)) + (lastMsg.body.length > 40 ? '...' : '') : 'No messages yet'}</p>
                </div>
                <span class="message-time">${lastMsg ? formatMessageTime(lastMsg.createdAt) : ''}</span>
                ${conv.unreadCount > 0 ? `<span class="unread-badge">${conv.unreadCount}</span>` : ''}
            </div>
        `;
    }).join('');
}

/**
 * Select and load a conversation
 */
async function selectConversation(conversationId) {
    currentConversationId = conversationId;
    
    // Update active state in list
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.toggle('active', item.dataset.conversationId === conversationId);
    });
    
    // Find conversation in cache
    const conversation = conversationsCache.find(c => c.id === conversationId);
    
    // Update chat header
    updateChatHeader(conversation);
    
    // Load messages
    await loadMessages(conversationId);
    
    // Mark as read
    try {
        await apiMarkMessagesAsRead(conversationId);
        // Update unread count in list
        const convItem = document.querySelector(`.conversation-item[data-conversation-id="${conversationId}"]`);
        if (convItem) {
            convItem.classList.remove('has-unread');
            const badge = convItem.querySelector('.unread-badge');
            if (badge) badge.remove();
        }
        updateMessageBadge();
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
    
    // Start polling for new messages
    startMessagePolling();
}

/**
 * Update chat header with participant info
 */
function updateChatHeader(conversation) {
    const header = document.querySelector('.chat-header');
    if (!header || !conversation) return;
    
    const participant = conversation.otherParticipant || {};
    header.innerHTML = `
        <img src="${participant.avatar || 'https://via.placeholder.com/45'}" alt="${participant.name || 'User'}">
        <div>
            <h4>${escapeHtml(participant.name || 'Unknown')}</h4>
            <p class="online-status"><i class="fas fa-circle"></i> ${participant.role || 'User'}</p>
        </div>
    `;
}

/**
 * Load messages for a conversation
 */
async function loadMessages(conversationId) {
    const container = document.querySelector('.chat-messages');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-messages"><i class="fas fa-spinner fa-spin"></i> Loading messages...</div>';
    
    try {
        const messages = await apiGetMessages(conversationId);
        renderMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
        container.innerHTML = '<div class="error-messages"><i class="fas fa-exclamation-circle"></i> Failed to load messages</div>';
    }
}

/**
 * Render messages in chat area
 */
function renderMessages(messages) {
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
        // Safe comparison - handle both populated and unpopulated senderId
        const msgSenderId = msg.senderId?._id || msg.senderId || '';
        const currentUserId = currentUser?.id || '';
        const isSent = String(msgSenderId) === String(currentUserId);
        return `
            <div class="message ${isSent ? 'sent' : 'received'}">
                <p>${escapeHtml(msg.body)}</p>
                <span class="time">${formatMessageTime(msg.createdAt)}</span>
            </div>
        `;
    }).join('');
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

/**
 * Send a message
 */
async function sendMessage() {
    if (!currentConversationId) {
        showNotification('Please select a conversation first', 'error');
        return;
    }
    
    const input = document.querySelector('.chat-input input');
    if (!input) return;
    
    const body = input.value.trim();
    if (!body) return;
    
    // Clear input immediately
    input.value = '';
    
    try {
        const message = await apiSendMessage(currentConversationId, body);
        
        // Append message to chat
        appendMessage(message);
        
        // Update conversation in list
        await loadConversations();
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification(error.message || 'Failed to send message', 'error');
        // Restore input value on error
        input.value = body;
    }
}

/**
 * Append a single message to the chat
 */
function appendMessage(message) {
    const container = document.querySelector('.chat-messages');
    if (!container) return;
    
    // Remove empty state if present
    const emptyState = container.querySelector('.empty-messages');
    if (emptyState) emptyState.remove();
    
    const currentUser = getUser();
    // Safe comparison - handle both populated and unpopulated senderId
    const msgSenderId = message.senderId?._id || message.senderId || '';
    const currentUserId = currentUser?.id || '';
    const isSent = String(msgSenderId) === String(currentUserId);
    
    const msgEl = document.createElement('div');
    msgEl.className = `message ${isSent ? 'sent' : 'received'}`;
    msgEl.innerHTML = `
        <p>${escapeHtml(message.body)}</p>
        <span class="time">${formatMessageTime(message.createdAt)}</span>
    `;
    
    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
}

/**
 * Format message timestamp
 */
function formatMessageTime(timestamp) {
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
async function updateMessageBadge() {
    try {
        const result = await apiGetUnreadMessageCount();
        const badge = document.querySelector('.nav-item[href="#messages"] .badge, .messages-badge');
        
        // Also update sidebar nav item
        const navItem = document.querySelector('a[href="#messages"]');
        if (navItem) {
            let badgeEl = navItem.querySelector('.msg-badge');
            if (result.unreadCount > 0) {
                if (!badgeEl) {
                    badgeEl = document.createElement('span');
                    badgeEl.className = 'msg-badge';
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
function startMessagePolling() {
    // Clear existing interval
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
    }
    
    // Poll every 5 seconds
    messagePollingInterval = setInterval(async () => {
        if (!currentConversationId) return;
        
        try {
            const messages = await apiGetMessages(currentConversationId);
            const container = document.querySelector('.chat-messages');
            if (container) {
                const currentCount = container.querySelectorAll('.message').length;
                if (messages.length > currentCount) {
                    renderMessages(messages);
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
function stopMessagePolling() {
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
        messagePollingInterval = null;
    }
}

/**
 * Initialize messaging UI event listeners
 */
function initMessagingUI() {
    // Send button click
    const sendBtn = document.querySelector('.chat-input button');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    // Enter key to send
    const chatInput = document.querySelector('.chat-input input');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

// Messaging is initialized via showSection switch case above


// ============================================================
// Payment Method Selection & Processing
// ============================================================

let currentPaymentJobId = null;
let currentPaymentAmount = 0;

/**
 * Initialize payment method selection UI
 */
function initPaymentMethodUI() {
    const paymentOptions = document.querySelectorAll('input[name="paymentMethod"]');
    paymentOptions.forEach(option => {
        option.addEventListener('change', updatePaymentMethodHint);
    });
}

/**
 * Update payment method hint text
 */
function updatePaymentMethodHint() {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    const hintEl = document.getElementById('paymentMethodHint');
    const summaryEl = document.getElementById('paymentSummary');
    
    const hints = {
        'cash': '<i class="fas fa-info-circle"></i> Cash payments are made directly to the maid after service completion.',
        'card': '<i class="fas fa-info-circle"></i> You will receive a notification to complete card payment after the maid checks out.',
        'apple_pay': '<i class="fas fa-info-circle"></i> You will receive a notification to complete Apple Pay payment after the maid checks out.'
    };
    
    const summaries = {
        'cash': '<i class="fas fa-money-bill-wave"></i> Payment: Cash to maid',
        'card': '<i class="fas fa-credit-card"></i> Payment: Card (after service)',
        'apple_pay': '<i class="fab fa-apple-pay"></i> Payment: Apple Pay (after service)'
    };
    
    if (hintEl) hintEl.innerHTML = hints[selectedMethod] || hints['cash'];
    if (summaryEl) summaryEl.innerHTML = summaries[selectedMethod] || summaries['cash'];
    
    // Update visual selection
    document.querySelectorAll('.payment-option').forEach(opt => {
        const input = opt.querySelector('input');
        if (input?.checked) {
            opt.style.borderColor = 'var(--primary-color)';
            opt.style.background = 'rgba(52, 152, 219, 0.05)';
        } else {
            opt.style.borderColor = 'var(--border-color)';
            opt.style.background = 'white';
        }
    });
}

/**
 * Open payment modal for a completed job
 */
function openPaymentModal(jobId, jobTitle, maidName, amount, paymentMethod) {
    currentPaymentJobId = jobId;
    currentPaymentAmount = amount;
    
    document.getElementById('paymentJobTitle').textContent = jobTitle || 'Service Completed';
    document.getElementById('paymentMaidName').innerHTML = `<i class="fas fa-user"></i> Maid: ${maidName}`;
    
    // Show loading state for breakdown
    const breakdownEl = document.getElementById('paymentBreakdown');
    if (breakdownEl) {
        breakdownEl.innerHTML = '<div style="text-align: center; padding: 10px;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    }
    
    document.getElementById('paymentModal').classList.add('active');
    
    // Fetch payment breakdown from API
    apiGetPaymentBreakdown(jobId).then(breakdown => {
        currentPaymentAmount = breakdown.total;
        
        // Update breakdown display
        if (breakdownEl) {
            breakdownEl.innerHTML = `
                <div class="breakdown-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <span>Service (${breakdown.duration} hrs x $${breakdown.hourlyRate}/hr)</span>
                    <span>$${breakdown.subtotal.toFixed(2)}</span>
                </div>
                <div class="breakdown-row" style="display: flex; justify-content: space-between; padding: 8px 0; color: var(--text-light); font-size: 14px;">
                    <span><i class="fas fa-info-circle"></i> Platform Fee (${breakdown.platformFeePercent}%)</span>
                    <span>$${breakdown.platformFee.toFixed(2)}</span>
                </div>
                <div class="breakdown-row" style="display: flex; justify-content: space-between; padding: 8px 0; color: var(--success-color); font-size: 14px;">
                    <span><i class="fas fa-user"></i> Maid Receives</span>
                    <span>$${breakdown.maidEarnings.toFixed(2)}</span>
                </div>
                <div class="breakdown-total" style="display: flex; justify-content: space-between; padding: 12px 0; margin-top: 8px; border-top: 2px solid var(--primary-color); font-weight: bold; font-size: 18px;">
                    <span>Total</span>
                    <span style="color: var(--primary-color);">$${breakdown.total.toFixed(2)}</span>
                </div>
            `;
        }
        
        document.getElementById('paymentAmount').textContent = `Total: $${breakdown.total.toFixed(2)}`;
    }).catch(error => {
        console.error('Error fetching payment breakdown:', error);
        // Fallback to simple display
        if (breakdownEl) {
            breakdownEl.innerHTML = `
                <div class="breakdown-total" style="display: flex; justify-content: space-between; padding: 12px 0; font-weight: bold; font-size: 18px;">
                    <span>Total</span>
                    <span style="color: var(--primary-color);">$${amount.toFixed(2)}</span>
                </div>
            `;
        }
        document.getElementById('paymentAmount').textContent = `Total: $${amount.toFixed(2)}`;
    });
    
    // Set default payment tab based on booking payment method
    if (paymentMethod === 'apple_pay') {
        selectPaymentTab('apple_pay');
    } else {
        selectPaymentTab('card');
    }
}

/**
 * Select payment tab (card or apple_pay)
 */function selectPaymentTab(tab) {
    const cardForm = document.getElementById('cardPaymentForm');
    const applePaySection = document.getElementById('applePaySection');
    const tabCard = document.getElementById('tabCard');
    const tabApplePay = document.getElementById('tabApplePay');
    const processBtn = document.getElementById('processPaymentBtn');
    
    if (tab === 'apple_pay') {
        cardForm.style.display = 'none';
        applePaySection.style.display = 'block';
        tabCard.style.background = 'white';
        tabCard.style.color = 'var(--text-color)';
        tabCard.style.borderColor = 'var(--border-color)';
        tabApplePay.style.background = 'var(--primary-color)';
        tabApplePay.style.color = 'white';
        tabApplePay.style.borderColor = 'var(--primary-color)';
        processBtn.style.display = 'none';
    } else {
        cardForm.style.display = 'block';
        applePaySection.style.display = 'none';
        tabCard.style.background = 'var(--primary-color)';
        tabCard.style.color = 'white';
        tabCard.style.borderColor = 'var(--primary-color)';
        tabApplePay.style.background = 'white';
        tabApplePay.style.color = 'var(--text-color)';
        tabApplePay.style.borderColor = 'var(--border-color)';
        processBtn.style.display = 'inline-flex';
    }
}

/**
 * Process card payment
 */
async function processCardPayment() {
    const cardNumber = document.getElementById('cardNumber')?.value?.trim();
    const cardExpiry = document.getElementById('cardExpiry')?.value?.trim();
    const cardCvv = document.getElementById('cardCvv')?.value?.trim();
    const cardName = document.getElementById('cardName')?.value?.trim();
    
    // Basic validation
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
        showNotification('Please enter a valid card number', 'error');
        return;
    }
    if (!cardExpiry || !cardExpiry.match(/^\d{2}\/\d{2}$/)) {
        showNotification('Please enter expiry date (MM/YY)', 'error');
        return;
    }
    if (!cardCvv || cardCvv.length < 3) {
        showNotification('Please enter a valid CVV', 'error');
        return;
    }
    if (!cardName) {
        showNotification('Please enter cardholder name', 'error');
        return;
    }
    
    const btn = document.getElementById('processPaymentBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;
    
    try {
        // In production, this would send card details to Stripe
        // For now, we just call our backend to mark payment as complete
        const result = await apiProcessPayment(currentPaymentJobId, 'card');
        
        showNotification(`Payment of $${currentPaymentAmount.toFixed(2)} successful!`, 'success');
        closeModal('paymentModal');
        
        // Clear form
        document.getElementById('cardNumber').value = '';
        document.getElementById('cardExpiry').value = '';
        document.getElementById('cardCvv').value = '';
        document.getElementById('cardName').value = '';
        
        // Refresh bookings
        loadBookings();
        loadHomeownerDashboard();
    } catch (error) {
        showNotification(error.message || 'Payment failed. Please try again.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

/**
 * Process Apple Pay payment
 */
async function processApplePay() {
    // In production, this would trigger Apple Pay sheet
    // For now, simulate Apple Pay flow
    
    showNotification('Processing Apple Pay...', 'info');
    
    try {
        const result = await apiProcessPayment(currentPaymentJobId, 'apple_pay');
        
        showNotification(`Payment of $${currentPaymentAmount.toFixed(2)} successful!`, 'success');
        closeModal('paymentModal');
        
        // Refresh bookings
        loadBookings();
        loadHomeownerDashboard();
    } catch (error) {
        showNotification(error.message || 'Apple Pay failed. Please try again.', 'error');
    }
}

/**
 * Check for pending payments and show notification
 */
async function checkPendingPayments() {
    try {
        const result = await apiGetPendingPayments();
        const pending = result.pendingPayments || [];
        
        if (pending.length > 0) {
            // Show notification for first pending payment
            const payment = pending[0];
            showNotification(
                `Payment required: $${payment.amount.toFixed(2)} for ${payment.title}`,
                'warning'
            );
            
            // Optionally auto-open payment modal
            // openPaymentModal(payment.jobId, payment.title, payment.maidName, payment.amount, payment.paymentMethod);
        }
    } catch (error) {
        console.error('Error checking pending payments:', error);
    }
}

/**
 * Format card number with spaces
 */
function formatCardNumber(input) {
    let value = input.value.replace(/\s/g, '').replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < value.length && i < 16; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += value[i];
    }
    input.value = formatted;
}

/**
 * Format expiry date
 */
function formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    input.value = value;
}

// Initialize payment UI on page load
document.addEventListener('DOMContentLoaded', () => {
    initPaymentMethodUI();
    
    // Add card number formatting
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', () => formatCardNumber(cardNumberInput));
    }
    
    // Add expiry date formatting
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', () => formatExpiryDate(cardExpiryInput));
    }
    
    // Check for pending payments after a short delay
    setTimeout(checkPendingPayments, 3000);
});
