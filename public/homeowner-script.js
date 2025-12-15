// Homeowner-specific functions

// Store data for current session
let myJobs = [];
let recommendedMaids = [];
let currentBookingMaidId = null;

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
});

/**
 * Load homeowner dashboard data
 */
async function loadHomeownerDashboard() {
    try {
        // Load dashboard stats
        await updateHomeownerStats();
        
        // Load user's jobs
        await loadMyJobs();
        
        // Load recommended maids
        await loadRecommendedMaids();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

/**
 * Load user's jobs from API
 */
async function loadMyJobs() {
    try {
        const response = await apiGetMyJobs();
        myJobs = response.data || response || [];
        renderBookings(myJobs);
    } catch (error) {
        console.error('Error loading jobs:', error);
    }
}

/**
 * Load recommended maids from API
 */
async function loadRecommendedMaids() {
    try {
        const response = await apiGetRecommendedMaids();
        recommendedMaids = response.data || response || [];
        // Maids would be rendered in the search maids section if needed
    } catch (error) {
        console.error('Error loading recommended maids:', error);
    }
}

/**
 * Update dashboard statistics
 */
async function updateHomeownerStats() {
    try {
        const stats = await apiRequest('/api/dashboard/my', { method: 'GET' });
        
        // Update stat cards
        const statCards = document.querySelectorAll('.stat-card .stat-details h3');
        if (statCards.length >= 5) {
            statCards[0].textContent = stats.activeBookings || 0;
            statCards[1].textContent = stats.upcomingJobs || 0;
            statCards[2].textContent = stats.pendingReviews || 0;
            statCards[3].textContent = `$${stats.totalSpent || 0}`;
            statCards[4].textContent = stats.favoriteMaids || 0;
        }
    } catch (error) {
        console.error('Error updating homeowner stats:', error);
        // Keep showing existing static data
    }
}

/**
 * Render bookings list
 */
function renderBookings(jobs) {
    const bookingsList = document.querySelector('.bookings-list');
    if (!bookingsList || !jobs.length) return;
    
    // Keep existing UI if no API data to render
    // In production, we would dynamically render all bookings
}

function bookMaid(maidId, maidName) {
    currentBookingMaidId = maidId;
    document.getElementById('bookingModal').classList.add('active');
    document.getElementById('maidSelect').value = maidId;
    showNotification(`Booking ${maidName}`, 'info');
}

function viewMaidProfile(maidId) {
    alert(`Viewing detailed profile for Maid ID: ${maidId}\n\n` +
          `This would show:\n` +
          `- Full biography\n` +
          `- Work history\n` +
          `- All reviews\n` +
          `- Verified documents\n` +
          `- Availability calendar\n` +
          `- Photo gallery of past work`);
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
    
    const form = event.target;
    const formData = new FormData(form);
    
    const maidId = document.getElementById('maidSelect').value || currentBookingMaidId;
    const dateInput = form.querySelector('input[type="date"]');
    const timeInput = form.querySelector('input[type="time"]');
    const durationInput = form.querySelector('input[type="number"]');
    const serviceType = form.querySelector('select:not(#maidSelect)');
    const locationInput = form.querySelector('input[type="text"]');
    const instructionsTextarea = form.querySelector('textarea');
    
    // Get hourly rate based on selected maid
    const maidSelect = document.getElementById('maidSelect');
    const selectedOption = maidSelect.options[maidSelect.selectedIndex];
    const rateMatch = selectedOption ? selectedOption.text.match(/\$(\d+)/) : null;
    const hourlyRate = rateMatch ? parseFloat(rateMatch[1]) : 15;
    
    // Construct scheduled datetime
    const scheduledDatetime = `${dateInput.value}T${timeInput.value}:00`;
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';
    submitBtn.disabled = true;
    
    try {
        const response = await apiCreateJob({
            maidId: parseInt(maidId),
            title: serviceType ? serviceType.value : 'General Cleaning',
            address: locationInput ? locationInput.value : '',
            scheduledDatetime: scheduledDatetime,
            hourlyRate: hourlyRate,
            estimatedDuration: durationInput ? parseFloat(durationInput.value) : 4,
            instructions: instructionsTextarea ? instructionsTextarea.value : ''
        });
        
        showNotification('Booking created successfully! Waiting for maid confirmation.', 'success');
        closeModal('bookingModal');
        form.reset();
        
        // Reload jobs
        await loadMyJobs();
        
    } catch (error) {
        showNotification(error.message || 'Failed to create booking. Please try again.', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function rescheduleBooking(bookingId) {
    alert('Reschedule booking #' + bookingId + '\n\nThis would open a calendar to select new date/time.');
}

function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        showNotification('Booking cancelled successfully. Refund will be processed.', 'info');
    }
}

function filterBookings(status) {
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    showNotification(`Filtering bookings: ${status}`, 'info');
}

function openBookingModal() {
    document.getElementById('bookingModal').classList.add('active');
}

function openReviewModal(bookingId) {
    document.getElementById('reviewModal').classList.add('active');
    // Set booking context
    document.getElementById('reviewModal').dataset.bookingId = bookingId;
}

async function submitReview(event) {
    event.preventDefault();
    
    const form = event.target;
    const modal = document.getElementById('reviewModal');
    const bookingId = modal.dataset.bookingId;
    
    // Get rating from stars
    const rating = document.querySelectorAll('.star-rating .fas').length;
    
    // Get review text
    const reviewText = form.querySelector('textarea').value;
    
    // Get recommendation
    const recommend = form.querySelector('input[name="recommend"]:checked').value;
    
    // Find the job and maid info
    const job = myJobs.find(j => j.id == bookingId);
    const maidId = job ? job.maidId : null;
    
    if (!maidId) {
        showNotification('Unable to find booking information', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    try {
        await apiSubmitReview({
            jobId: parseInt(bookingId),
            revieweeId: parseInt(maidId),
            rating: rating,
            comment: reviewText,
            recommend: recommend === 'yes'
        });
        
        showNotification(`Review submitted! Rating: ${rating} stars`, 'success');
        closeModal('reviewModal');
        form.reset();
        
        // Reload jobs to update reviewed status
        await loadMyJobs();
        
    } catch (error) {
        showNotification(error.message || 'Failed to submit review. Please try again.', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function exportHistory() {
    showNotification('Exporting service history as PDF...', 'info');
    setTimeout(() => {
        showNotification('History exported successfully!', 'success');
    }, 1500);
}

function viewInvoice(bookingId) {
    alert(`Opening invoice for Booking #${bookingId}\n\nThis would display a detailed invoice with payment breakdown.`);
}

function bookAgain(maidId) {
    openBookingModal();
    document.getElementById('maidSelect').value = maidId;
    showNotification('Pre-filled with previous booking details', 'info');
}

function showNotifications() {
    alert('Notifications:\n\n' +
          '1. Maria Garcia checked in at 10:00 AM\n' +
          '2. Sarah Johnson accepted your booking for 2:00 PM\n' +
          '3. New message from Maria Garcia');
}

// Star rating functionality
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
            
            star.addEventListener('mouseenter', function() {
                const rating = this.dataset.rating;
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.add('hover');
                    } else {
                        s.classList.remove('hover');
                    }
                });
            });
        });
        
        starRating.addEventListener('mouseleave', function() {
            stars.forEach(s => s.classList.remove('hover'));
        });
    }
});

// Helper function for notifications
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Auto-refresh task progress
let progressInterval;

function startProgressTracking() {
    progressInterval = setInterval(async () => {
        // Check for task updates from API
        try {
            await loadMyJobs();
            console.log('Checking for task updates...');
        } catch (error) {
            console.error('Error refreshing jobs:', error);
        }
    }, 30000); // Check every 30 seconds
}

function stopProgressTracking() {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
}

// Start tracking when on active tasks page
document.addEventListener('sectionChange', (e) => {
    if (e.detail === 'active-tasks') {
        startProgressTracking();
    } else {
        stopProgressTracking();
    }
});

/**
 * Handle logout for homeowner page
 */
function handleHomeownerLogout() {
    if (typeof logout === 'function') {
        logout();
    } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        window.location.href = 'home.html';
    }
}

// Add logout handler
document.addEventListener('DOMContentLoaded', () => {
    const logoutLinks = document.querySelectorAll('a[href="index.html"]');
    logoutLinks.forEach(link => {
        if (link.querySelector('.fa-sign-out-alt') || link.textContent.toLowerCase().includes('logout')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                handleHomeownerLogout();
            });
        }
    });
});
