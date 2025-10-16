// Maid-specific functions

let isOnline = false;
let currentJobStartTime = null;

// Availability Toggle
function toggleAvailability() {
    const toggle = document.getElementById('availabilityToggle');
    const text = document.getElementById('availabilityText');
    const statusCard = document.getElementById('statusCard');
    
    isOnline = toggle.checked;
    
    if (isOnline) {
        text.textContent = 'You are Online';
        text.style.color = '#10b981';
        statusCard.classList.remove('offline-status');
        statusCard.classList.add('online-status');
        statusCard.innerHTML = `
            <div class="status-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="status-info">
                <h2>You are now Online</h2>
                <p>You will receive job requests from nearby clients</p>
                <button class="btn-secondary" onclick="goOffline()">
                    <i class="fas fa-toggle-off"></i> Go Offline
                </button>
            </div>
        `;
        showMaidNotification('You are now online and visible to clients!', 'success');
    } else {
        text.textContent = 'You are Offline';
        text.style.color = '#64748b';
        statusCard.classList.remove('online-status');
        statusCard.classList.add('offline-status');
        statusCard.innerHTML = `
            <div class="status-icon">
                <i class="fas fa-power-off"></i>
            </div>
            <div class="status-info">
                <h2>You are currently Offline</h2>
                <p>Turn on availability to start receiving job requests</p>
                <button class="btn-primary" onclick="goOnline()">
                    <i class="fas fa-toggle-on"></i> Go Online
                </button>
            </div>
        `;
        showMaidNotification('You are now offline', 'info');
    }
}

function goOnline() {
    document.getElementById('availabilityToggle').checked = true;
    toggleAvailability();
}

function goOffline() {
    document.getElementById('availabilityToggle').checked = false;
    toggleAvailability();
}

// Job Request Management
function acceptRequest(requestId, clientName) {
    if (!isOnline) {
        if (confirm('You are currently offline. Do you want to go online and accept this job?')) {
            goOnline();
        } else {
            return;
        }
    }
    
    showMaidNotification(`Job accepted! ${clientName} has been notified.`, 'success');
    setTimeout(() => {
        showMaidNotification('Job has been added to your schedule', 'info');
        showSection('my-jobs');
    }, 1500);
}

function declineRequest(requestId) {
    if (confirm('Are you sure you want to decline this job request?')) {
        showMaidNotification('Job request declined', 'info');
        // Remove the request card with animation
        const requestCard = event.target.closest('.job-request-card');
        requestCard.style.opacity = '0';
        requestCard.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            requestCard.remove();
        }, 300);
    }
}

// Check-in/Check-out
function checkIn(jobId) {
    // Check geo-location (simulated)
    showMaidNotification('Verifying your location...', 'info');
    
    setTimeout(() => {
        currentJobStartTime = new Date();
        showMaidNotification('Checked in successfully! You can now start working.', 'success');
        startWorkTimer();
        
        // Update UI to show active job
        showSection('my-jobs');
    }, 1500);
}

function checkOut() {
    document.getElementById('checkoutModal').classList.add('active');
}

function completeJob() {
    document.getElementById('checkoutModal').classList.add('active');
}

function submitCheckout(event) {
    event.preventDefault();
    
    showMaidNotification('Processing check-out...', 'info');
    
    setTimeout(() => {
        stopWorkTimer();
        showMaidNotification('Job completed successfully! Payment is being processed.', 'success');
        closeModal('checkoutModal');
        
        // Refresh dashboard
        setTimeout(() => {
            showSection('dashboard');
        }, 1000);
    }, 1500);
}

// Task Management
function markTaskDone(taskId) {
    const checkbox = event.target.closest('.task-checkbox').querySelector('input[type="checkbox"]');
    checkbox.checked = true;
    
    const taskLabel = event.target.closest('.task-checkbox');
    taskLabel.classList.add('completed');
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const smallTag = document.createElement('small');
    smallTag.textContent = `Completed at ${timeStr}`;
    taskLabel.appendChild(smallTag);
    
    event.target.remove(); // Remove the button
    
    showMaidNotification('Task marked as complete. Client has been notified.', 'success');
    updateProgress();
}

function markTaskComplete(checkbox, taskName) {
    if (checkbox.checked) {
        showMaidNotification(`${taskName} marked as complete!`, 'success');
        updateProgress();
    }
}

function updateProgress() {
    // Calculate and update progress percentage
    const checkboxes = document.querySelectorAll('.task-checklist-maid input[type="checkbox"]');
    const checked = document.querySelectorAll('.task-checklist-maid input[type="checkbox"]:checked');
    const percentage = (checked.length / checkboxes.length) * 100;
    
    // Update progress bar if exists
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
}

function updateJobStatus() {
    showMaidNotification('Opening task update panel...', 'info');
    // Scroll to task checklist
    document.querySelector('.task-update-section').scrollIntoView({ behavior: 'smooth' });
}

// Work Timer
let workTimerInterval;

function startWorkTimer() {
    if (!currentJobStartTime) {
        currentJobStartTime = new Date();
    }
    
    workTimerInterval = setInterval(() => {
        const now = new Date();
        const diff = now - currentJobStartTime;
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        
        const timeStr = `${hours}h ${minutes}m`;
        const workingTimeEl = document.getElementById('workingTime');
        if (workingTimeEl) {
            workingTimeEl.textContent = timeStr;
        }
        
        const totalDurationEl = document.getElementById('totalDuration');
        if (totalDurationEl) {
            totalDurationEl.textContent = timeStr;
        }
    }, 1000);
}

function stopWorkTimer() {
    if (workTimerInterval) {
        clearInterval(workTimerInterval);
        currentJobStartTime = null;
    }
}

// Navigation & Communication
function viewJobDetails(jobId) {
    alert(`Job Details #${jobId}\n\n` +
          `This would show:\n` +
          `- Complete task list\n` +
          `- Client contact info\n` +
          `- Address and parking info\n` +
          `- Special instructions\n` +
          `- Cancellation policy`);
}

function getDirections(jobId) {
    showMaidNotification('Opening navigation to job location...', 'info');
    // In real app, this would open Google Maps/Apple Maps
    alert('Opening map navigation...\n(Would launch Google Maps with directions)');
}

function contactClient(clientId) {
    showMaidNotification('Opening chat with client...', 'info');
    // Navigate to messages or open chat modal
}

function reportIssue() {
    const issue = prompt('Please describe the issue you\'re experiencing:');
    if (issue && issue.trim()) {
        showMaidNotification('Issue reported to support team. We\'ll contact you soon.', 'success');
    }
}

// Job Filtering
function filterJobs(status) {
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    showMaidNotification(`Showing ${status} jobs`, 'info');
}

// Earnings
function exportEarnings() {
    showMaidNotification('Generating earnings report...', 'info');
    setTimeout(() => {
        showMaidNotification('Report downloaded successfully!', 'success');
    }, 1500);
}

// Notifications
function showMaidNotifications() {
    alert('Notifications:\n\n' +
          '1. New job request from Michael Brown ($60)\n' +
          '2. Urgent job request nearby! ($50)\n' +
          '3. John Doe left you a 5-star review\n' +
          '4. Payment received: $60.00');
}

function showMaidNotification(message, type = 'info') {
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Maid Dashboard Loaded');
    
    // Start work timer if there's an active job
    const activeJob = document.querySelector('.active-job-card');
    if (activeJob) {
        startWorkTimer();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopWorkTimer();
});
