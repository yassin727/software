// Homeowner-specific functions

function bookMaid(maidId, maidName) {
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

function submitBooking(event) {
    event.preventDefault();
    showNotification('Booking request sent successfully! Waiting for maid confirmation.', 'success');
    closeModal('bookingModal');
    
    // Simulate adding to bookings
    setTimeout(() => {
        showNotification('Sarah Johnson accepted your booking!', 'success');
    }, 3000);
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

function submitReview(event) {
    event.preventDefault();
    const rating = document.querySelectorAll('.star-rating .fas').length;
    showNotification(`Review submitted! Rating: ${rating} stars`, 'success');
    closeModal('reviewModal');
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
    progressInterval = setInterval(() => {
        // Simulate progress updates
        console.log('Checking for task updates...');
    }, 5000);
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
