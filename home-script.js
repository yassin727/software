// Homepage JavaScript functionality

// Mobile menu toggle
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('active');
}

// Smooth scrolling for anchor links
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// Modal management
function openSignupModal() {
    closeAllModals();
    document.getElementById('signupModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function openLoginModal() {
    closeAllModals();
    document.getElementById('loginModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = 'auto';
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.classList.remove('active'));
    document.body.style.overflow = 'auto';
}

// User type selection
function selectUserType(userType) {
    const cards = document.querySelectorAll('.user-type-card');
    cards.forEach(card => card.classList.remove('selected'));
    
    event.currentTarget.classList.add('selected');
    
    // Show appropriate form
    const homeownerForm = document.getElementById('homeownerSignupForm');
    const maidForm = document.getElementById('maidSignupForm');
    
    if (userType === 'homeowner') {
        homeownerForm.style.display = 'block';
        maidForm.style.display = 'none';
    } else if (userType === 'maid') {
        homeownerForm.style.display = 'none';
        maidForm.style.display = 'block';
    }
}

function goBackToUserType() {
    const homeownerForm = document.getElementById('homeownerSignupForm');
    const maidForm = document.getElementById('maidSignupForm');
    
    homeownerForm.style.display = 'none';
    maidForm.style.display = 'none';
    
    const cards = document.querySelectorAll('.user-type-card');
    cards.forEach(card => card.classList.remove('selected'));
}

// Form submissions
function submitHomeownerSignup(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Basic validation
    if (data.password !== data.confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    if (data.age < 18) {
        alert('You must be at least 18 years old to sign up.');
        return;
    }
    
    // Simulate form submission
    showNotification('Account created successfully! Redirecting to homeowner dashboard...', 'success');
    
    setTimeout(() => {
        closeModal('signupModal');
        window.location.href = 'homeowner.html';
    }, 2000);
}

function submitMaidSignup(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Basic validation
    if (data.password !== data.confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    if (data.age < 18) {
        alert('You must be at least 18 years old to sign up.');
        return;
    }
    
    // Check if at least one specialization is selected
    const specializations = formData.getAll('specializations');
    if (specializations.length === 0) {
        alert('Please select at least one specialization.');
        return;
    }
    
    // Simulate form submission
    showNotification('Account created successfully! Redirecting to maid dashboard...', 'success');
    
    setTimeout(() => {
        closeModal('signupModal');
        window.location.href = 'maid.html';
    }, 2000);
}

function submitLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Simulate login
    showNotification('Login successful! Redirecting to dashboard...', 'success');
    
    setTimeout(() => {
        closeModal('loginModal');
        // In a real app, this would determine user type and redirect accordingly
        window.location.href = 'homeowner.html';
    }, 1500);
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide notification after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// File upload handling
document.addEventListener('change', function(event) {
    if (event.target.type === 'file') {
        const file = event.target.files[0];
        const uploadContent = event.target.nextElementSibling;
        
        if (file) {
            uploadContent.innerHTML = `
                <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
                <span>${file.name}</span>
            `;
        }
    }
});

// Star rating for testimonials
function initStarRatings() {
    const starRatings = document.querySelectorAll('.testimonial-rating');
    starRatings.forEach(rating => {
        const stars = rating.querySelectorAll('i');
        stars.forEach((star, index) => {
            star.style.animationDelay = `${index * 0.1}s`;
        });
    });
}

// Animate elements on scroll
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observe service cards
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });

    // Observe testimonial cards
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    testimonialCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
}

// Counter animation for stats
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.textContent.replace(/[^\d]/g, ''));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            if (counter.textContent.includes('K')) {
                counter.textContent = Math.floor(current) + 'K+';
            } else if (counter.textContent.includes('.')) {
                counter.textContent = (current / 10).toFixed(1);
            } else {
                counter.textContent = Math.floor(current);
            }
        }, 16);
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize animations
    initStarRatings();
    initScrollAnimations();
    
    // Animate counters when hero section is visible
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                heroObserver.unobserve(entry.target);
            }
        });
    });
    
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        heroObserver.observe(heroStats);
    }
    
    // Close modals when clicking outside
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    console.log('MaidTrack Homepage loaded successfully!');
});

// Add some interactive hover effects
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to service cards
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add hover effects to testimonial cards
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    testimonialCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)';
        });
    });
});