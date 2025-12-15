// Navigation and Section Management

// Store current data
let pendingMaidsData = [];
let adminDashboardData = null;

function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }

    // Update navigation active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick')?.includes(sectionId)) {
            item.classList.add('active');
        }
    });

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'maids': 'Maids Management',
        'schedule': 'Schedule Management',
        'tasks': 'Task Tracking',
        'attendance': 'Attendance Records',
        'payments': 'Payment Management',
        'reports': 'Reports & Analytics',
        'settings': 'Settings'
    };
    document.getElementById('page-title').textContent = titles[sectionId] || 'Dashboard';
    
    // Prevent default anchor behavior
    event?.preventDefault();
    
    // Load section-specific data
    loadSectionData(sectionId);
}

// Load data for specific section
async function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'dashboard':
            await loadAdminDashboard();
            break;
        case 'maids':
            await loadPendingMaidsCount();
            break;
        case 'attendance':
            await loadAttendanceData();
            break;
        case 'schedule':
            await loadScheduleData();
            break;
        case 'reports':
            await loadReportsData();
            break;
        case 'settings':
            await loadAdminSettings();
            break;
    }
}

// Load admin dashboard data from API
async function loadAdminDashboard() {
    try {
        adminDashboardData = await apiGetAdminDashboard();
        renderAdminDashboard(adminDashboardData);
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
    }
}

// Render admin dashboard with real data
function renderAdminDashboard(data) {
    if (!data || !data.stats) return;
    
    const stats = data.stats;
    
    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card .stat-details h3');
    if (statCards.length >= 4) {
        statCards[0].textContent = stats.totalMaids || 0;
        statCards[1].textContent = stats.onDutyToday || 0;
        statCards[2].textContent = stats.pendingJobs || 0;
        statCards[3].textContent = `$${stats.revenueThisMonth || 0}`;
    }
    
    // Update pending maids alert
    const pendingAlert = document.querySelector('.alert-card.warning');
    if (pendingAlert) {
        if (stats.pendingMaids > 0) {
            pendingAlert.style.display = 'flex';
            const strongEl = pendingAlert.querySelector('strong');
            if (strongEl) {
                strongEl.textContent = `${stats.pendingMaids} maid registration${stats.pendingMaids > 1 ? 's' : ''}`;
            }
        } else {
            pendingAlert.style.display = 'none';
        }
    }
    
    // Render today's schedule
    if (data.todaySchedule) {
        renderTodaySchedule(data.todaySchedule);
    }
    
    // Render recent activities
    if (data.recentActivities) {
        renderRecentActivities(data.recentActivities);
    }
}

// Render today's schedule
function renderTodaySchedule(schedule) {
    const scheduleList = document.querySelector('#dashboard .schedule-list');
    if (!scheduleList) return;
    
    if (!schedule || schedule.length === 0) {
        scheduleList.innerHTML = '<p class="empty-text">No jobs scheduled for today</p>';
        return;
    }
    
    scheduleList.innerHTML = schedule.map(item => `
        <div class="schedule-item">
            <div class="schedule-time">${item.time}</div>
            <div class="schedule-details">
                <h4>${item.title}</h4>
                <p>${item.homeownerName} - ${item.address || 'No address'}</p>
            </div>
            <span class="status-badge ${item.status}">${item.status}</span>
        </div>
    `).join('');
}

// Render recent activities
function renderRecentActivities(activities) {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;
    
    if (!activities || activities.length === 0) {
        activityList.innerHTML = '<p class="empty-text">No recent activities</p>';
        return;
    }
    
    activityList.innerHTML = activities.map(a => `
        <div class="activity-item">
            <div class="activity-icon ${a.color}">
                <i class="fas ${a.icon}"></i>
            </div>
            <div class="activity-details">
                <p>${a.message}</p>
                <span class="activity-time">${a.timeAgo}</span>
            </div>
        </div>
    `).join('');
}

// Load pending maids count
async function loadPendingMaidsCount() {
    try {
        const response = await apiGetPendingMaids();
        pendingMaidsData = response || [];
        
        const alertCard = document.querySelector('.alert-card.warning');
        if (alertCard) {
            if (pendingMaidsData.length > 0) {
                alertCard.style.display = 'flex';
                const strongEl = alertCard.querySelector('strong');
                if (strongEl) {
                    strongEl.textContent = `${pendingMaidsData.length} maid registration${pendingMaidsData.length > 1 ? 's' : ''}`;
                }
            } else {
                alertCard.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading pending maids:', error);
    }
}

// Load attendance data
async function loadAttendanceData(date) {
    try {
        const data = await apiGetAdminAttendance(date);
        renderAttendanceTable(data.records || []);
    } catch (error) {
        console.error('Error loading attendance:', error);
    }
}

// Render attendance table
function renderAttendanceTable(records) {
    const tbody = document.querySelector('#attendance .data-table tbody');
    if (!tbody) return;
    
    if (!records || records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No attendance records for this date</td></tr>';
        return;
    }
    
    tbody.innerHTML = records.map(r => `
        <tr>
            <td>${r.maidName}</td>
            <td>${r.jobTitle}</td>
            <td>${new Date(r.checkIn).toLocaleTimeString()}</td>
            <td>${r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '-'}</td>
            <td>${r.duration ? r.duration + ' hrs' : 'On duty'}</td>
            <td><span class="status-badge ${r.status}">${r.status}</span></td>
        </tr>
    `).join('');
}

// Load schedule data
async function loadScheduleData() {
    try {
        const today = new Date();
        const from = today.toISOString().split('T')[0];
        const to = new Date(today.setMonth(today.getMonth() + 1)).toISOString().split('T')[0];
        
        const data = await apiGetAdminSchedule(from, to);
        // Schedule rendering would update calendar component
        console.log('Schedule loaded:', data.events?.length || 0, 'events');
    } catch (error) {
        console.error('Error loading schedule:', error);
    }
}

// Load reports data
async function loadReportsData() {
    try {
        const summary = await apiGetReportsSummary('month');
        renderReportsSummary(summary);
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

// Render reports summary
function renderReportsSummary(data) {
    if (!data) return;
    
    // Update report cards if they exist
    const reportCards = document.querySelectorAll('#reports .stat-card h3');
    if (reportCards.length >= 4) {
        reportCards[0].textContent = data.totalJobs || 0;
        reportCards[1].textContent = data.completedJobs || 0;
        reportCards[2].textContent = `$${data.totalRevenue || 0}`;
        reportCards[3].textContent = `${data.completionRate || 0}%`;
    }
}

// Load admin settings
async function loadAdminSettings() {
    try {
        const profile = await apiGetAdminProfile();
        renderAdminSettings(profile);
    } catch (error) {
        console.error('Error loading admin settings:', error);
    }
}

// Render admin settings
function renderAdminSettings(profile) {
    if (!profile) return;
    
    const nameInput = document.getElementById('settingsName');
    const emailInput = document.getElementById('settingsEmail');
    const phoneInput = document.getElementById('settingsPhone');
    
    if (nameInput) nameInput.value = profile.name || '';
    if (emailInput) emailInput.value = profile.email || '';
    if (phoneInput) phoneInput.value = profile.phone || '';
}

// Update dashboard stats (legacy function)
function updateDashboardStats() {
    loadAdminDashboard();
}

// Sidebar Toggle for Mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

// Modal Management
function openAddMaidModal() {
    const modal = document.getElementById('addMaidModal');
    modal.classList.add('active');
}

function openScheduleModal() {
    alert('Schedule modal would open here. (Not implemented in prototype)');
}

function openTaskModal() {
    alert('Task modal would open here. (Not implemented in prototype)');
}

function openPaymentModal() {
    alert('Payment modal would open here. (Not implemented in prototype)');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Form Submission Handler - Only for forms without specific handlers
document.addEventListener('DOMContentLoaded', () => {
    // Only add generic handler to forms that don't have their own submit handlers
    // Forms with IDs or specific onsubmit handlers are handled separately
    const forms = document.querySelectorAll('form:not([id]):not([onsubmit])');
    forms.forEach(form => {
        // Skip if form is inside a modal that has specific handling
        if (form.closest('#addMaidModal')) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                // Handle add maid form via API
                const formData = new FormData(form);
                console.log('Add maid form submitted:', Object.fromEntries(formData));
                alert('Maid added successfully!');
                closeModal('addMaidModal');
                form.reset();
            });
        }
    });

    // Add smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
        });
    });
});

// Simulate real-time updates (for demo purposes)
function updateStats() {
    // This would normally fetch from an API
    // For prototype, we'll just add some animation
    const statValues = document.querySelectorAll('.stat-details h3');
    statValues.forEach(stat => {
        stat.style.transform = 'scale(1.1)';
        setTimeout(() => {
            stat.style.transform = 'scale(1)';
        }, 200);
    });
}

// Update stats every 5 seconds (for demo)
setInterval(updateStats, 5000);

// Search functionality
const searchInput = document.querySelector('.search-bar input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        // This would normally search through data
        console.log('Searching for:', searchTerm);
    });
}

// Notification bell click
const notificationBtn = document.querySelector('.notification-btn');
if (notificationBtn) {
    notificationBtn.addEventListener('click', () => {
        alert('Notifications:\n\n1. New maid registration pending approval\n2. Payment due for Maria Garcia\n3. Task completion rate is 95% this week!');
    });
}

// Table action buttons
document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-icon')) {
        const button = e.target.closest('.btn-icon');
        const title = button.getAttribute('title');
        
        if (title) {
            alert(`${title} action clicked. (This is a prototype - no backend integration)`);
        }
    }
});

// Calendar day click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('calendar-day') && !e.target.classList.contains('header')) {
        const day = e.target.textContent;
        alert(`Schedule for day ${day} would be shown here.`);
    }
});

// Task card drag and drop (basic simulation)
let draggedElement = null;

document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('task-card')) {
        draggedElement = e.target;
        e.target.style.opacity = '0.5';
    }
});

document.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('task-card')) {
        e.target.style.opacity = '1';
    }
});

document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.target.classList.contains('task-column') && draggedElement) {
        e.target.appendChild(draggedElement);
        alert('Task status updated! (This is a prototype)');
    }
});

// Make task cards draggable
document.querySelectorAll('.task-card').forEach(card => {
    card.setAttribute('draggable', 'true');
});

// Chart placeholder interaction
document.querySelectorAll('.chart-placeholder').forEach(placeholder => {
    placeholder.addEventListener('click', () => {
        alert('In a full implementation, interactive charts would be displayed here using libraries like Chart.js or D3.js');
    });
});

// Add loading animation
function showLoading() {
    // This would show a loading spinner
    console.log('Loading...');
}

// Simulate data refresh
function refreshData() {
    showLoading();
    setTimeout(() => {
        alert('Data refreshed successfully!');
    }, 1000);
}

// Export functionality
document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-primary') && e.target.textContent.includes('Export')) {
        e.preventDefault();
        alert('Export functionality would download a CSV/PDF file here. (This is a prototype)');
    }
});

// Status change simulation
function changeStatus(element, newStatus) {
    const badge = element.querySelector('.status-badge');
    if (badge) {
        badge.className = 'status-badge ' + newStatus;
        badge.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Alt + D for Dashboard
    if (e.altKey && e.key === 'd') {
        showSection('dashboard');
    }
    // Alt + M for Maids
    if (e.altKey && e.key === 'm') {
        showSection('maids');
    }
    // Alt + S for Schedule
    if (e.altKey && e.key === 's') {
        showSection('schedule');
    }
    // Alt + T for Tasks
    if (e.altKey && e.key === 't') {
        showSection('tasks');
    }
    // Esc to close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

// Initialize tooltips
function initTooltips() {
    const tooltipElements = document.querySelectorAll('[title]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', (e) => {
            // Custom tooltip implementation would go here
        });
    });
}

// ============================================================
// Admin Settings Functions
// ============================================================

async function saveAdminProfile(event) {
    event.preventDefault();
    
    const name = document.getElementById('settingsName').value;
    const phone = document.getElementById('settingsPhone').value;
    
    try {
        await apiUpdateAdminProfile({ name, phone });
        alert('Profile updated successfully!');
        
        // Update header display
        const userNameEl = document.querySelector('.user-profile span');
        if (userNameEl) userNameEl.textContent = name;
    } catch (error) {
        alert('Error updating profile: ' + (error.message || 'Unknown error'));
    }
}

async function changeAdminPassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentAdminPassword').value;
    const newPassword = document.getElementById('newAdminPassword').value;
    const confirmPassword = document.getElementById('confirmAdminPassword').value;
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters!');
        return;
    }
    
    try {
        await apiChangeAdminPassword(currentPassword, newPassword);
        alert('Password changed successfully!');
        
        // Clear form
        document.getElementById('currentAdminPassword').value = '';
        document.getElementById('newAdminPassword').value = '';
        document.getElementById('confirmAdminPassword').value = '';
    } catch (error) {
        alert('Error changing password: ' + (error.message || 'Unknown error'));
    }
}

// Admin Approval Functions
async function showPendingApprovals() {
    document.getElementById('pendingApprovalsCard').style.display = 'block';
    document.getElementById('pendingApprovalsCard').scrollIntoView({ behavior: 'smooth' });
    
    // Load pending maids from API
    try {
        const response = await apiGetPendingMaids();
        pendingMaidsData = response.data || response || [];
        renderPendingMaids(pendingMaidsData);
                
        // Update pending approval badge
        const alertCard = document.querySelector('.alert-card.warning');
        if (alertCard) {
            if (pendingMaidsData.length > 0) {
                alertCard.style.display = 'flex';
                const strongEl = alertCard.querySelector('strong');
                if (strongEl) {
                    strongEl.textContent = `${pendingMaidsData.length} maid registration${pendingMaidsData.length > 1 ? 's' : ''}`;
                }
            } else {
                alertCard.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading pending maids:', error);
        // Keep showing existing static data if API fails
    }
}

/**
 * Render pending maids list dynamically
 */
function renderPendingMaids(maids) {
    const approvalList = document.querySelector('.approval-list');
    if (!approvalList) return;
    
    if (!maids || maids.length === 0) {
        approvalList.innerHTML = `
            <div class="empty-state" style="padding: 40px; text-align: center;">
                <i class="fas fa-check-circle" style="font-size: 48px; color: #2ECC71; margin-bottom: 16px;"></i>
                <p>No pending maid approvals</p>
            </div>
        `;
        return;
    }
    
    // Clear existing content
    approvalList.innerHTML = '';
    
    maids.forEach(maid => {
        // Handle MongoDB structure: maid has _id and user_id populated with user data
        const maidId = maid._id;
        const userData = maid.user_id || {};
        const name = userData.name || maid.name || 'Unknown';
        const email = userData.email || maid.email || 'N/A';
        const phone = userData.phone || maid.phone || 'N/A';
        const specializations = maid.specializations || 'General Cleaning';
        const experience = maid.experience_years ? `${maid.experience_years} years` : 'Not specified';
        const createdAt = maid.createdAt || userData.createdAt;
        
        const card = document.createElement('div');
        card.className = 'approval-card';
        card.dataset.maidId = maidId;
        card.innerHTML = `
            <div class="approval-header">
                <img src="${userData.photo_url || 'https://via.placeholder.com/60'}" alt="Maid">
                <div>
                    <h4>${escapeHtmlAdmin(name)}</h4>
                    <p>Registered ${createdAt ? formatDate(createdAt) : 'recently'}</p>
                </div>
            </div>
            <div class="approval-body">
                <div class="info-grid">
                    <div class="info-item">
                        <label>Phone:</label>
                        <span>${escapeHtmlAdmin(phone)}</span>
                    </div>
                    <div class="info-item">
                        <label>Email:</label>
                        <span>${escapeHtmlAdmin(email)}</span>
                    </div>
                    <div class="info-item">
                        <label>Specialization:</label>
                        <span>${escapeHtmlAdmin(specializations)}</span>
                    </div>
                    <div class="info-item">
                        <label>Experience:</label>
                        <span>${escapeHtmlAdmin(experience)}</span>
                    </div>
                </div>
            </div>
            <div class="approval-footer">
                <button class="btn-danger" onclick="rejectMaid('${maidId}', '${escapeHtmlAdmin(name)}')">
                    <i class="fas fa-times"></i> Reject
                </button>
                <button class="btn-success" onclick="approveMaid('${maidId}', '${escapeHtmlAdmin(name)}')">
                    <i class="fas fa-check"></i> Approve
                </button>
            </div>
        `;
        approvalList.appendChild(card);
    });
}

/**
 * Escape HTML for admin panel
 */
function escapeHtmlAdmin(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
}

function hidePendingApprovals() {
    document.getElementById('pendingApprovalsCard').style.display = 'none';
}

async function approveMaid(maidId, maidName) {
    // Handle both old style (maidName only) and new style (maidId, maidName)
    if (typeof maidId === 'string' && !maidName) {
        maidName = maidId;
        // Find maid ID from pendingMaidsData
        const maid = pendingMaidsData.find(m => (m.user_id?.name || m.name) === maidName);
        maidId = maid ? maid._id : null;
    }
    
    if (!confirm(`Approve ${maidName} as a maid?\n\nThey will receive an approval email and can start accepting jobs immediately.`)) {
        return;
    }
    
    try {
        if (maidId) {
            const result = await apiApproveMaid(maidId);
            console.log('Approval result:', result);
        }
        
        alert(`✅ ${maidName} has been approved!\n\n${maidId ? 'An approval email has been sent to them.' : ''}`);
        
        // Remove the approval card with animation
        const approvalCard = event.target.closest('.approval-card');
        if (approvalCard) {
            approvalCard.style.opacity = '0';
            setTimeout(() => {
                approvalCard.remove();
                // Check if there are no more approvals
                const remaining = document.querySelectorAll('.approval-card').length;
                if (remaining === 0) {
                    const alertCard = document.querySelector('.alert-card.warning');
                    if (alertCard) alertCard.style.display = 'none';
                    hidePendingApprovals();
                }
                // Update dashboard stats
                updateDashboardStats();
            }, 300);
        }
    } catch (error) {
        alert('Error approving maid: ' + (error.message || 'Unknown error'));
    }
}

async function rejectMaid(maidId, maidName) {
    // Handle both old style (maidName only) and new style (maidId, maidName)
    if (typeof maidId === 'string' && !maidName) {
        maidName = maidId;
        // Find maid ID from pendingMaidsData
        const maid = pendingMaidsData.find(m => (m.user_id?.name || m.name) === maidName);
        maidId = maid ? maid._id : null;
    }
    
    const reason = prompt(`Please provide a reason for rejecting ${maidName}:`);
    if (reason !== null) { // Allow empty reason
        try {
            if (maidId) {
                // Use the apiRejectMaid function
                await apiRejectMaid(maidId, reason);
            }
            
            alert(`❌ ${maidName} has been rejected.\n\nReason: ${reason || 'No reason provided'}\n\nA rejection email has been sent.`);
            
            // Remove the approval card
            const approvalCard = event.target.closest('.approval-card');
            if (approvalCard) {
                approvalCard.style.opacity = '0';
                setTimeout(() => {
                    approvalCard.remove();
                    const remaining = document.querySelectorAll('.approval-card').length;
                    if (remaining === 0) {
                        const alertCard = document.querySelector('.alert-card.warning');
                        if (alertCard) alertCard.style.display = 'none';
                        hidePendingApprovals();
                    }
                    // Update dashboard stats
                    updateDashboardStats();
                }, 300);
            }
        } catch (error) {
            alert('Error rejecting maid: ' + (error.message || 'Unknown error'));
        }
    }
}

function viewDocument(docType) {
    alert(`Viewing ${docType} document...\n\n(In production, this would open a document viewer/PDF)`);
}

/**
 * Handle logout - clear token and redirect
 */
function handleLogout() {
    if (typeof logout === 'function') {
        logout();
    } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'home.html';
    }
}

// Initialize on page load - Admin authentication and dashboard
document.addEventListener('DOMContentLoaded', () => {
    initTooltips();
    
    // Check if we're on the admin page (index.html)
    const isAdminPage = window.location.pathname.includes('index.html') || 
                        (window.location.pathname.endsWith('/') && !window.location.pathname.includes('home'));
    
    if (isAdminPage && !window.location.pathname.includes('home.html')) {
        // Check authentication
        if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        
        // Check if user is admin
        const user = typeof getUser === 'function' ? getUser() : null;
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        if (user.role !== 'admin') {
            if (typeof redirectToDashboard === 'function') {
                redirectToDashboard();
            } else {
                alert('Unauthorized: Admin access required');
                window.location.href = 'login.html';
            }
            return;
        }
        
        // User is admin, load dashboard data
        loadAdminDashboard();
    }
    
    // Add logout handler to sidebar
    const logoutLink = document.querySelector('a[href="#logout"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
    
    console.log('Home Maid Tracking System Loaded!');
});