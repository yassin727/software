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
            await loadActiveMaids();
            break;
        case 'attendance':
            await loadAttendanceData();
            break;
        case 'schedule':
            await loadScheduleData();
            break;
        case 'tasks':
            await loadTasksData();
            break;
        case 'payments':
            await loadPaymentsData();
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
        // Also load active maids for the dashboard section
        await loadActiveMaids();
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

// Load active maids and render them
async function loadActiveMaids() {
    try {
        console.log('Loading active maids...');
        const maids = await apiGetActiveMaids();
        console.log('Active maids API response:', maids);
        console.log('Number of maids received:', Array.isArray(maids) ? maids.length : 'not an array');
        renderActiveMaidsTable(maids || []);
    } catch (error) {
        console.error('Error loading active maids:', error);
        // Show error in UI
        const tbody = document.querySelector('#maids .data-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Error loading maids. Check console.</td></tr>';
        }
    }
}

// Render active maids table
function renderActiveMaidsTable(maids) {
    const tbody = document.querySelector('#maids .data-table tbody');
    console.log('renderActiveMaidsTable called with', maids?.length, 'maids');
    console.log('tbody element found:', tbody);
    
    if (!tbody) {
        console.error('Could not find tbody element with selector: #maids .data-table tbody');
        return;
    }
    
    if (!maids || maids.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No active maids found</td></tr>';
        return;
    }
    
    console.log('Rendering', maids.length, 'maids to table');
    tbody.innerHTML = maids.map((maid, index) => {
        const userData = maid.user_id || {};
        const name = userData.name || 'Unknown';
        const phone = userData.phone || 'N/A';
        const email = userData.email || 'N/A';
        const photo = userData.photo_url || 'https://via.placeholder.com/35';
        const specialization = maid.specializations || 'General Cleaning';
        const rating = maid.average_rating || 0;
        const isOnline = maid.is_online;
        const status = isOnline ? 'active' : 'inactive';
        const statusText = isOnline ? 'Active' : 'Off Duty';
        
        return `
            <tr>
                <td>#${String(index + 1).padStart(3, '0')}</td>
                <td>
                    <div class="user-cell">
                        <img src="${photo}" alt="${name}">
                        <span>${name}</span>
                    </div>
                </td>
                <td>${phone}</td>
                <td>${specialization}</td>
                <td><span class="status-badge ${status}">${statusText}</span></td>
                <td>
                    <div class="rating">
                        <i class="fas fa-star"></i> ${rating.toFixed(1)}
                    </div>
                </td>
                <td>
                    <button class="btn-icon" title="View" onclick="viewMaidDetails('${maid._id}')"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" title="Edit" onclick="editMaid('${maid._id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" title="Suspend" onclick="suspendMaid('${maid._id}', '${name}')"><i class="fas fa-ban"></i></button>
                </td>
            </tr>
        `;
    }).join('');
    console.log('Table rendering complete');
}

// Placeholder functions for maid actions
function viewMaidDetails(maidId) {
    alert(`Viewing details for maid ID: ${maidId}\n(This feature will be implemented)`);
}

function editMaid(maidId) {
    alert(`Editing maid ID: ${maidId}\n(This feature will be implemented)`);
}

function suspendMaid(maidId, name) {
    if (confirm(`Are you sure you want to suspend ${name}?`)) {
        alert(`Maid ${name} suspended.\n(This feature will be implemented)`);
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
    
    tbody.innerHTML = records.map(r => {
        const maidName = r.maidName || 'Unknown';
        const checkInTime = r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';
        const checkOutTime = r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';
        const duration = r.duration ? r.duration.toFixed(1) + ' hrs' : '-';
        const status = r.checkOut ? 'completed' : (r.checkIn ? 'active' : 'inactive');
        const statusText = r.checkOut ? 'Present' : (r.checkIn ? 'On Duty' : 'Absent');
        const location = r.location || '-';
        
        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <img src="https://via.placeholder.com/35" alt="${escapeHtmlAdmin(maidName)}">
                        <span>${escapeHtmlAdmin(maidName)}</span>
                    </div>
                </td>
                <td>${checkInTime}</td>
                <td>${checkOutTime}</td>
                <td>${duration}</td>
                <td><span class="status-badge ${status}">${statusText}</span></td>
                <td>${escapeHtmlAdmin(location)}</td>
            </tr>
        `;
    }).join('');
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

// Load tasks data
async function loadTasksData() {
    try {
        // For admin, get all jobs
        const data = await apiGetAllJobs();
        renderTasksBoard(data.jobs || data || []);
    } catch (error) {
        console.error('Error loading tasks:', error);
        // Fallback to empty state
        renderTasksBoard([]);
    }
}

// Render tasks board
function renderTasksBoard(jobs) {
    const pendingColumn = document.querySelector('.task-column:nth-child(1)');
    const inProgressColumn = document.querySelector('.task-column:nth-child(2)');
    const completedColumn = document.querySelector('.task-column:nth-child(3)');
    
    if (!pendingColumn || !inProgressColumn || !completedColumn) return;
    
    const pending = jobs.filter(j => j.status === 'requested');
    const inProgress = jobs.filter(j => j.status === 'in_progress' || j.status === 'accepted');
    const completed = jobs.filter(j => j.status === 'completed');
    
    // Update counts
    pendingColumn.querySelector('.count').textContent = pending.length;
    inProgressColumn.querySelector('.count').textContent = inProgress.length;
    completedColumn.querySelector('.count').textContent = completed.length;
    
    // Render pending tasks
    const pendingHTML = pending.slice(0, 5).map(job => `
        <div class="task-card">
            <h4>${escapeHtmlAdmin(job.title)}</h4>
            <p>${escapeHtmlAdmin(job.description || 'No description')}</p>
            <div class="task-meta">
                <span class="assigned-to">
                    <i class="fas fa-user"></i> ${escapeHtmlAdmin(job.maid_id?.user_id?.name || 'Unassigned')}
                </span>
                <span class="task-priority medium">Medium</span>
            </div>
        </div>
    `).join('');
    
    // Render in-progress tasks
    const inProgressHTML = inProgress.slice(0, 5).map(job => `
        <div class="task-card">
            <h4>${escapeHtmlAdmin(job.title)}</h4>
            <p>${escapeHtmlAdmin(job.description || 'No description')}</p>
            <div class="task-meta">
                <span class="assigned-to">
                    <i class="fas fa-user"></i> ${escapeHtmlAdmin(job.maid_id?.user_id?.name || 'Unassigned')}
                </span>
                <span class="task-priority high">High</span>
            </div>
        </div>
    `).join('');
    
    // Render completed tasks
    const completedHTML = completed.slice(0, 5).map(job => `
        <div class="task-card completed">
            <h4>${escapeHtmlAdmin(job.title)}</h4>
            <p>${escapeHtmlAdmin(job.description || 'No description')}</p>
            <div class="task-meta">
                <span class="assigned-to">
                    <i class="fas fa-user"></i> ${escapeHtmlAdmin(job.maid_id?.user_id?.name || 'Unknown')}
                </span>
                <span class="task-priority low">Low</span>
            </div>
            <div class="completed-badge">
                <i class="fas fa-check-circle"></i> Completed
            </div>
        </div>
    `).join('');
    
    // Clear and append
    const pendingContainer = pendingColumn.querySelector('.task-card')?.parentElement;
    const inProgressContainer = inProgressColumn.querySelector('.task-card')?.parentElement;
    const completedContainer = completedColumn.querySelector('.task-card')?.parentElement;
    
    if (pendingContainer) {
        pendingContainer.innerHTML = pendingHTML || '<p class="empty-text">No pending tasks</p>';
    }
    if (inProgressContainer) {
        inProgressContainer.innerHTML = inProgressHTML || '<p class="empty-text">No tasks in progress</p>';
    }
    if (completedContainer) {
        completedContainer.innerHTML = completedHTML || '<p class="empty-text">No completed tasks</p>';
    }
}

// Load payments data
async function loadPaymentsData() {
    try {
        // For admin, get all jobs
        const data = await apiGetAllJobs();
        const allJobs = data.jobs || data || [];
        const completedJobs = allJobs.filter(j => j.status === 'completed');
        renderPaymentsTable(completedJobs);
        renderPaymentStats(completedJobs);
    } catch (error) {
        console.error('Error loading payments:', error);
        // Show empty state on error
        renderPaymentsTable([]);
        renderPaymentStats([]);
    }
}

// Render payment statistics
function renderPaymentStats(jobs) {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const totalPaidThisMonth = jobs
        .filter(j => new Date(j.updatedAt) >= thisMonth)
        .reduce((sum, j) => sum + (j.hourly_rate * (j.actual_duration || 4)), 0);
    
    const pendingPayments = jobs
        .filter(j => !j.payment_status || j.payment_status === 'pending')
        .reduce((sum, j) => sum + (j.hourly_rate * (j.actual_duration || 4)), 0);
    
    const statCards = document.querySelectorAll('#payments .stat-card .stat-details h3');
    if (statCards.length >= 3) {
        statCards[0].textContent = `$${totalPaidThisMonth.toFixed(2)}`;
        statCards[1].textContent = `$${pendingPayments.toFixed(2)}`;
        statCards[2].textContent = `$0.00`; // Due this week - would need more logic
    }
}

// Render payments table
function renderPaymentsTable(jobs) {
    const tbody = document.querySelector('#payments .data-table tbody');
    if (!tbody) return;
    
    if (!jobs || jobs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No payment records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = jobs.slice(0, 10).map((job, index) => {
        const amount = (job.hourly_rate * (job.actual_duration || 4)).toFixed(2);
        const date = new Date(job.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const maidName = job.maid_id?.user_id?.name || 'Unknown';
        const isPaid = job.payment_status === 'paid';
        
        return `
            <tr>
                <td>#INV-${String(index + 1).padStart(3, '0')}</td>
                <td>${escapeHtmlAdmin(maidName)}</td>
                <td>$${amount}</td>
                <td>${date}</td>
                <td>Bank Transfer</td>
                <td><span class="status-badge ${isPaid ? 'completed' : 'pending'}">${isPaid ? 'Paid' : 'Pending'}</span></td>
                <td>
                    <button class="btn-icon" title="View"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" title="Download"><i class="fas fa-download"></i></button>
                </td>
            </tr>
        `;
    }).join('');
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
    
    // Update summary items
    const summaryItems = document.querySelectorAll('#reports .summary-item .summary-value');
    if (summaryItems.length >= 4) {
        summaryItems[0].textContent = `${data.totalHours || 0} hrs`;
        summaryItems[1].textContent = data.tasksCompleted || 0;
        summaryItems[2].innerHTML = `${data.averageRating || 0} <i class="fas fa-star"></i>`;
        summaryItems[3].textContent = `$${data.totalRevenue || 0}`;
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
    // Clear form
    document.getElementById('addMaidForm').reset();
}

/**
 * Handle Add Maid form submission
 */
async function handleAddMaid(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding...';
        
        // Collect form data
        const formData = {
            name: document.getElementById('maidName').value.trim(),
            email: document.getElementById('maidEmail').value.trim(),
            phone: document.getElementById('maidPhone').value.trim(),
            password: document.getElementById('maidPassword').value,
            role: 'maid',
            specializations: document.getElementById('maidSpecialization').value,
            hourly_rate: parseFloat(document.getElementById('maidRate').value) || 15,
            experience_years: parseInt(document.getElementById('maidExperience').value) || 0,
            location: document.getElementById('maidLocation').value.trim() || '',
            bio: document.getElementById('maidBio').value.trim() || ''
        };
        
        console.log('Submitting maid data:', formData);
        
        // Call API to register maid
        const result = await apiRegister(formData);
        
        console.log('Maid registered successfully:', result);
        
        // Show success message
        alert(`✅ Maid "${formData.name}" has been added successfully!\n\nThe maid account is now pending admin approval.`);
        
        // Close modal and reset form
        closeModal('addMaidModal');
        form.reset();
        
        // Reload pending maids list
        await loadPendingMaidsCount();
        
        // Update dashboard if visible
        if (document.getElementById('dashboard').classList.contains('active')) {
            await loadAdminDashboard();
        }
        
    } catch (error) {
        console.error('Error adding maid:', error);
        alert(`❌ Error adding maid: ${error.message}\n\nPlease check the form and try again.`);
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
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
        
        // Remove the approval card by maidId (not relying on event.target)
        const approvalCard = document.querySelector(`.approval-card[data-maid-id="${maidId}"]`);
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
            
            alert(`❌ ${maidName} has been rejected.

Reason: ${reason || 'No reason provided'}

A rejection email has been sent.`);
            
            // Remove the approval card by maidId (not relying on event.target)
            const approvalCard = document.querySelector(`.approval-card[data-maid-id="${maidId}"]`);
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