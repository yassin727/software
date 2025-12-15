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
    
    bookingsList.innerHTML = bookings.map(booking => `
        <div class="booking-card ${booking.status === 'in_progress' ? 'active-card' : ''}">
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
    `).join('');
}

/**
 * Render booking action buttons based on status
 */
function renderBookingActions(booking) {
    const actions = [];
    
    if (booking.status === 'in_progress') {
        actions.push(`<button class="btn-secondary" onclick="trackMaid('${booking.id}')"><i class="fas fa-location-arrow"></i> Track Maid</button>`);
        actions.push(`<button class="btn-secondary" onclick="contactMaid('${booking.maid.id}')"><i class="fas fa-comment"></i> Message</button>`);
        actions.push(`<button class="btn-primary" onclick="viewTaskProgress('${booking.id}')"><i class="fas fa-tasks"></i> View Progress</button>`);
    } else if (booking.status === 'requested' || booking.status === 'accepted') {
        actions.push(`<button class="btn-secondary" onclick="rescheduleBooking('${booking.id}')"><i class="fas fa-calendar-alt"></i> Reschedule</button>`);
        actions.push(`<button class="btn-secondary" onclick="cancelBooking('${booking.id}')"><i class="fas fa-times"></i> Cancel</button>`);
        actions.push(`<button class="btn-secondary" onclick="contactMaid('${booking.maid.id}')"><i class="fas fa-comment"></i> Message</button>`);
    } else if (booking.status === 'completed' && !booking.hasReview) {
        actions.push(`<button class="btn-primary" onclick="openReviewModal('${booking.id}', '${booking.maid.id}')"><i class="fas fa-star"></i> Leave Review</button>`);
        actions.push(`<button class="btn-secondary" onclick="bookAgain('${booking.maid.id}')"><i class="fas fa-redo"></i> Book Again</button>`);
    } else if (booking.status === 'completed') {
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
    showSection('active-tasks');
}

function contactMaid(maidId) {
    showNotification('Opening messenger...', 'info');
    showSection('messages');
}

function viewTaskProgress(bookingId) {
    showNotification('Loading task progress...', 'info');
    showSection('active-tasks');
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
    
    try {
        const response = await apiCreateJob({
            maidId: maidId,
            title: serviceType,
            description: instructions || '',
            address: address,
            scheduledDatetime: scheduledDatetime,
            hourlyRate: parseFloat(hourlyRate),
            estimatedDuration: parseFloat(duration) || 4
        });
        
        showNotification('Booking created successfully!', 'success');
        closeModal('bookingModal');
        document.getElementById('bookingForm')?.reset();
        
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
    alert('Reschedule booking #' + bookingId.slice(-6).toUpperCase() + '\n\nThis feature is coming soon.');
}

async function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        try {
            await apiRequest(`/jobs/${bookingId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'cancelled' })
            });
            showNotification('Booking cancelled successfully', 'success');
            await loadBookings();
        } catch (error) {
            showNotification('Failed to cancel booking', 'error');
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
    
    const rating = document.querySelectorAll('.star-rating .fas').length || 5;
    const reviewText = form.querySelector('textarea')?.value || '';
    
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
            comment: reviewText
        });
        
        showNotification('Review submitted successfully!', 'success');
        closeModal('reviewModal');
        form.reset();
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
        'active-tasks': 'Active Tasks',
        'history': 'Service History',
        'messages': 'Messages'
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
    }
}

// ============================================================
// Modal Functions
// ============================================================

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
        'active-tasks': 'Active Tasks',
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
});
