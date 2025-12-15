// Navigation and Section Management

// Store current pending maids data
let pendingMaidsData = [];

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
        'reports': 'Reports & Analytics'
    };
    document.getElementById('page-title').textContent = titles[sectionId] || 'Dashboard';
    
    // Prevent default anchor behavior
    event?.preventDefault();
    
    // Check if we need to update dashboard stats
    checkDashboardUpdate(sectionId);
}

// Update dashboard stats when switching to dashboard
function checkDashboardUpdate(sectionId) {
    if (sectionId === 'dashboard') {
        updateDashboardStats();
    }
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
    if (!approvalList || !maids.length) return;
    
    // Clear existing content
    approvalList.innerHTML = '';
    
    maids.forEach(maid => {
        const card = document.createElement('div');
        card.className = 'approval-card';
        card.dataset.maidId = maid.id;
        card.innerHTML = `
            <div class="approval-header">
                <img src="https://via.placeholder.com/60" alt="Maid">
                <div>
                    <h4>${maid.name || 'Unknown'}</h4>
                    <p>Registered ${maid.createdAt ? formatDate(maid.createdAt) : 'recently'}</p>
                </div>
            </div>
            <div class="approval-body">
                <div class="info-grid">
                    <div class="info-item">
                        <label>Phone:</label>
                        <span>${maid.phone || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <label>Email:</label>
                        <span>${maid.email || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <label>Specialization:</label>
                        <span>${maid.specializations || 'General Cleaning'}</span>
                    </div>
                    <div class="info-item">
                        <label>Experience:</label>
                        <span>${maid.experience || 'Not specified'}</span>
                    </div>
                </div>
            </div>
            <div class="approval-footer">
                <button class="btn-danger" onclick="rejectMaid(${maid.id}, '${maid.name}')">
                    <i class="fas fa-times"></i> Reject
                </button>
                <button class="btn-success" onclick="approveMaid(${maid.id}, '${maid.name}')">
                    <i class="fas fa-check"></i> Approve
                </button>
            </div>
        `;
        approvalList.appendChild(card);
    });
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
        // Find maid ID from pendingMaidsData or use static approach
        const maid = pendingMaidsData.find(m => m.name === maidName);
        maidId = maid ? maid.id : null;
    }
    
    if (!confirm(`Approve ${maidName} as a maid?\n\nThey will be able to receive job requests immediately.`)) {
        return;
    }
    
    try {
        if (maidId) {
            await apiApproveMaid(maidId);
        }
        
        alert(`✓ ${maidName} has been approved!\n\nAn approval email has been sent to them.`);
        
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
        // Find maid ID from pendingMaidsData or use static approach
        const maid = pendingMaidsData.find(m => m.name === maidName);
        maidId = maid ? maid.id : null;
    }
    
    const reason = prompt(`Please provide a reason for rejecting ${maidName}:`);
    if (reason !== null) { // Allow empty reason
        try {
            if (maidId) {
                // Call API to reject maid
                await apiRequest('/api/admin/maids/reject', {
                    method: 'POST',
                    body: JSON.stringify({ maidId, reason })
                });
            }
            
            showApiSuccess(`${maidName} has been rejected.

Reason: ${reason || 'No reason provided'}

A notification email has been sent.`);
            
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
            showApiError('Error rejecting maid: ' + (error.message || 'Unknown error'));
        }
    }
}

function viewDocument(docType) {
    alert(`Viewing ${docType} document...\n\n(In production, this would open a document viewer/PDF)`);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initTooltips();
    
    // Check if we're on the admin page (index.html)
    const isAdminPage = window.location.pathname.includes('index.html') || 
                        (window.location.pathname.endsWith('/') && !window.location.pathname.includes('home'));
    
    if (isAdminPage && !window.location.pathname.includes('home.html')) {
        // Check authentication
        if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
            // Not logged in, redirect to login
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
            // Wrong role, redirect to appropriate dashboard
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
    
    console.log('Home Maid Tracking System Loaded!');
});

/**
 * Load admin dashboard data from API
 */
async function loadAdminDashboard() {
    try {
        // Load pending maids count
        const pendingResponse = await apiGetPendingMaids();
        const pendingMaids = pendingResponse.data || pendingResponse || [];
        
        // Update pending approval badge
        const alertCard = document.querySelector('.alert-card.warning');
        if (alertCard) {
            if (pendingMaids.length > 0) {
                alertCard.style.display = 'flex';
                const strongEl = alertCard.querySelector('strong');
                if (strongEl) {
                    strongEl.textContent = `${pendingMaids.length} maid registration${pendingMaids.length > 1 ? 's' : ''}`;
                }
            } else {
                alertCard.style.display = 'none';
            }
        }
        
        // Store pending maids for later use
        pendingMaidsData = pendingMaids;
        
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
    }
}

/**
 * Update dashboard statistics
 */
async function updateDashboardStats() {
    try {
        const stats = await apiRequest('/api/dashboard/my', { method: 'GET' });
        
        // Update stat cards
        const statCards = document.querySelectorAll('.stat-card .stat-details h3');
        if (statCards.length >= 6) {
            statCards[0].textContent = stats.totalMaids || 0;
            statCards[1].textContent = stats.pendingApprovals || 0;
            statCards[2].textContent = stats.completedJobs || 0;
            statCards[3].textContent = stats.totalHomeowners || 0;
            statCards[4].textContent = stats.activeJobs || 0;
            statCards[5].textContent = `$${stats.todayRevenue || 0}`;
        }
        
        // Update recent activity
        // In a real implementation, this would fetch actual recent activity
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
        // Keep showing existing static data
    }
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

// Add logout handler to sidebar
document.addEventListener('DOMContentLoaded', () => {
    const logoutLink = document.querySelector('a[href="#logout"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
});
