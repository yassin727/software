// Navigation and Section Management
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

// Form Submission Handler
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Form submitted successfully! (This is a prototype - no backend integration)');
            // Close any open modals
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => modal.classList.remove('active'));
            // Reset form
            form.reset();
        });
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
function showPendingApprovals() {
    document.getElementById('pendingApprovalsCard').style.display = 'block';
    document.getElementById('pendingApprovalsCard').scrollIntoView({ behavior: 'smooth' });
}

function hidePendingApprovals() {
    document.getElementById('pendingApprovalsCard').style.display = 'none';
}

function approveMaid(maidName) {
    if (confirm(`Approve ${maidName} as a maid?\n\nThey will be able to receive job requests immediately.`)) {
        alert(`✓ ${maidName} has been approved!\n\nAn approval email has been sent to them.`);
        // Remove the approval card
        event.target.closest('.approval-card').style.opacity = '0';
        setTimeout(() => {
            event.target.closest('.approval-card').remove();
            // Check if there are no more approvals
            const remaining = document.querySelectorAll('.approval-card').length;
            if (remaining === 0) {
                document.querySelector('.alert-card.warning').style.display = 'none';
                hidePendingApprovals();
            }
        }, 300);
    }
}

function rejectMaid(maidName) {
    const reason = prompt(`Please provide a reason for rejecting ${maidName}:`);
    if (reason && reason.trim()) {
        alert(`${maidName} has been rejected.\n\nReason: ${reason}\n\nA notification email has been sent.`);
        // Remove the approval card
        event.target.closest('.approval-card').style.opacity = '0';
        setTimeout(() => {
            event.target.closest('.approval-card').remove();
            const remaining = document.querySelectorAll('.approval-card').length;
            if (remaining === 0) {
                document.querySelector('.alert-card.warning').style.display = 'none';
                hidePendingApprovals();
            }
        }, 300);
    }
}

function viewDocument(docType) {
    alert(`Viewing ${docType} document...\n\n(In production, this would open a document viewer/PDF)`);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initTooltips();
    console.log('Home Maid Tracking System Prototype Loaded!');
    console.log('Keyboard shortcuts: Alt+D (Dashboard), Alt+M (Maids), Alt+S (Schedule), Alt+T (Tasks)');
});
