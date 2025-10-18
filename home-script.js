// Homepage JavaScript functionality

// Mobile menu toggle
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    
    navMenu.classList.toggle('active');
    mobileToggle.classList.toggle('active');
    
    // Animate hamburger icon
    const icon = mobileToggle.querySelector('i');
    if (navMenu.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
    } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
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

// Header animations and scroll effects
function initHeaderAnimations() {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const logo = document.querySelector('.nav-logo');
    
    // Add scroll effect to navbar
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Hide/show navbar on scroll direction
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollY = currentScrollY;
    });
    
    // Add staggered animation to nav links
    navLinks.forEach((link, index) => {
        link.style.opacity = '0';
        link.style.transform = 'translateY(-20px)';
        link.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        
        setTimeout(() => {
            link.style.opacity = '1';
            link.style.transform = 'translateY(0)';
        }, 200 + (index * 100));
    });
    
    // Add logo animation on load
    if (logo) {
        logo.style.opacity = '0';
        logo.style.transform = 'scale(0.8)';
        logo.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        
        setTimeout(() => {
            logo.style.opacity = '1';
            logo.style.transform = 'scale(1)';
        }, 100);
    }
    
    // Add active state to nav links based on scroll position
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
    
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn-login, .btn-signup');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize animations
    initStarRatings();
    initScrollAnimations();
    initHeaderAnimations();
    
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
    
    // Initialize professional header effects
    initProfessionalHeader();
});

// Add some interactive hover effects
document.addEventListener('DOMContentLoaded', function() {
    // Add enhanced hover effects to service cards
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.03)';
            this.style.boxShadow = '0 30px 60px rgba(0, 0, 0, 0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
        });
    });
    
    // Add enhanced hover effects to testimonial cards
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    testimonialCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            this.style.boxShadow = '0 30px 60px rgba(0, 0, 0, 0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
        });
    });
    
    // Add interactive effects to step cards
    const stepCards = document.querySelectorAll('.step');
    stepCards.forEach(step => {
        step.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
            this.style.background = 'rgba(255, 255, 255, 0.15)';
            this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.2)';
        });
        
        step.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.background = 'rgba(255, 255, 255, 0.1)';
            this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)';
        });
    });
    
    // Add parallax scrolling effect to sections
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.services, .how-it-works, .testimonials');
        
        parallaxElements.forEach((element, index) => {
            const speed = 0.5 + (index * 0.1);
            element.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
    
    // Add intersection observer for section animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe all sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(50px)';
        section.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        sectionObserver.observe(section);
    });
    
    // Add CSS for animate-in class
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
});

// Professional Header Enhancements
function initProfessionalHeader() {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const buttons = document.querySelectorAll('.btn-login, .btn-signup');
    
    // Add scroll effect to navbar
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScrollY = currentScrollY;
    });
    
    // Add ripple effect to buttons
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            createRipple(e, this);
        });
    });
    
    // Add active state to navigation links based on scroll position
    const sections = document.querySelectorAll('section[id]');
    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);
    
    sections.forEach(section => observer.observe(section));
    
    // Add hover effects to navigation links
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Add logo click animation
    const logo = document.querySelector('.nav-logo');
    if (logo) {
        logo.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 150);
            }, 150);
        });
    }
}

// Create ripple effect for buttons
function createRipple(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}