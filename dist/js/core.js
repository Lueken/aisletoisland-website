/**
 * AISLE TO ISLANDS - CORE JAVASCRIPT MODULE
 * Shared functionality across all website pages
 * Version: 2.0
 */

class AisleToIslandsCore {
    constructor() {
        this.config = {
            animationDelay: 300,
            intersectionThreshold: 0.2,
            intersectionMargin: '0px 0px -50px 0px',
            scrollThreshold: 50,
            staggerDelay: 100
        };

        this.isInitialized = false;
        this.observers = new Map();
        this.eventListeners = new Map();
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================

    init(pageConfig = {}) {
        if (this.isInitialized) {
            console.warn('🔄 Core already initialized');
            return;
        }

        console.log('🚀 Initializing Aisle to Islands Core...');

        this.config = { ...this.config, ...pageConfig };

        // Initialize core functionality
        this.initPerformanceOptimizations();
        this.initMobileMenu();
        this.initNavbarEffects();
        this.initSmoothScrolling();
        this.initYearsExperience();

        // Initialize animations with delay
        setTimeout(() => {
            this.initHeroAnimations();
            this.initScrollAnimations();
            console.log('✅ Core initialization complete');
        }, this.config.animationDelay);

        this.isInitialized = true;
    }

    // ==========================================
    // ANIMATION SYSTEM
    // ==========================================

    initHeroAnimations() {
        const heroElements = document.querySelectorAll('.hero-animate, .hero-content');

        heroElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('loaded');
                console.log(`✨ Hero animation ${index + 1} activated`);
            }, index * 150);
        });

        // Animate hero visual separately
        const heroVisual = document.querySelector('.hero-visual');
        if (heroVisual) {
            setTimeout(() => {
                heroVisual.classList.add('loaded');
                console.log('🎭 Hero visual animated');
            }, 400);
        }
    }

    initScrollAnimations() {
        if (!('IntersectionObserver' in window)) {
            console.log('⚠️ IntersectionObserver not supported, using fallback');
            this.fallbackAnimations();
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('is-visible');
                        console.log(`🎯 Element animated: ${entry.target.className}`);
                    }, index * this.config.staggerDelay);

                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: this.config.intersectionThreshold,
            rootMargin: this.config.intersectionMargin
        });

        // Observe all fade-in elements
        const animateElements = document.querySelectorAll('.fade-in-element');
        console.log(`👀 Observing ${animateElements.length} elements for animation`);

        animateElements.forEach((element, index) => {
            element.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(element);
        });

        this.observers.set('scrollAnimations', observer);
    }

    fallbackAnimations() {
        setTimeout(() => {
            document.querySelectorAll('.fade-in-element').forEach((element, index) => {
                setTimeout(() => {
                    element.classList.add('is-visible');
                }, index * 200 + 1000);
            });
        }, 500);
    }

    // ==========================================
    // MOBILE MENU SYSTEM
    // ==========================================

    initMobileMenu() {
        const toggle = document.querySelector('.mobile-menu-toggle');
        const mobileNav = document.querySelector('.mobile-nav');

        if (!toggle || !mobileNav) {
            console.log('📱 Mobile menu elements not found');
            return;
        }

        // Toggle button handler
        const toggleHandler = (e) => {
            e.preventDefault();
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

            toggle.classList.toggle('active');
            toggle.setAttribute('aria-expanded', !isExpanded);

            if (!isExpanded) {
                mobileNav.classList.add('active');
                mobileNav.style.display = 'block';
                // Force reflow for animation
                mobileNav.offsetHeight;
            } else {
                this.closeMobileMenu();
            }
        };

        // Link click handlers
        const links = mobileNav.querySelectorAll('a');
        const linkHandler = () => this.closeMobileMenu();

        // Outside click handler
        const outsideClickHandler = (e) => {
            if (!toggle.contains(e.target) && !mobileNav.contains(e.target)) {
                this.closeMobileMenu();
            }
        };

        // Add event listeners
        toggle.addEventListener('click', toggleHandler);
        links.forEach(link => link.addEventListener('click', linkHandler));
        document.addEventListener('click', outsideClickHandler);

        // Store references for cleanup
        this.eventListeners.set('mobileMenuToggle', { element: toggle, event: 'click', handler: toggleHandler });
        this.eventListeners.set('mobileMenuOutside', { element: document, event: 'click', handler: outsideClickHandler });

        console.log('📱 Mobile menu initialized');
    }

    closeMobileMenu() {
        const toggle = document.querySelector('.mobile-menu-toggle');
        const mobileNav = document.querySelector('.mobile-nav');

        if (toggle && mobileNav) {
            toggle.classList.remove('active');
            mobileNav.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');

            setTimeout(() => {
                mobileNav.style.display = 'none';
            }, 300);
        }
    }

    // ==========================================
    // NAVBAR EFFECTS
    // ==========================================

    initNavbarEffects() {
        const nav = document.querySelector('nav');
        if (!nav) return;

        let ticking = false;
        const scrollHandler = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

                    if (scrollTop > this.config.scrollThreshold) {
                        nav.style.background = 'rgba(250, 248, 245, 0.98)';
                        nav.style.boxShadow = '0 2px 20px rgba(15, 95, 95, 0.08)';
                    } else {
                        nav.style.background = 'rgba(250, 248, 245, 0.97)';
                        nav.style.boxShadow = 'none';
                    }

                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', scrollHandler, { passive: true });
        this.eventListeners.set('navbarScroll', { element: window, event: 'scroll', handler: scrollHandler });

        console.log('🎛️ Navbar effects initialized');
    }

    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================

    initSmoothScrolling() {
        const smoothScrollHandler = function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 100;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        };

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', smoothScrollHandler);
        });

        console.log('🔗 Smooth scrolling initialized');
    }

    initYearsExperience() {
        const businessStartYear = 2013;
        const currentYear = new Date().getFullYear();
        const yearsExperience = currentYear - businessStartYear;

        const experienceElement = document.getElementById('yearsExperience');
        if (experienceElement) {
            experienceElement.textContent = `${yearsExperience}+`;
            console.log(`📅 Years experience updated: ${yearsExperience}+ years`);
        }
    }

    // ==========================================
    // PERFORMANCE OPTIMIZATIONS
    // ==========================================

    initPerformanceOptimizations() {
        // Respect user's motion preferences
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        if (prefersReducedMotion.matches) {
            console.log('♿ Reduced motion detected, disabling animations');
            const style = document.createElement('style');
            style.textContent = `
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            `;
            document.head.appendChild(style);
        }

        // Pause animations when page is not visible
        const visibilityHandler = () => {
            const elements = document.querySelectorAll('.fade-in-element, .hero-animate');
            elements.forEach(element => {
                if (document.hidden) {
                    element.style.animationPlayState = 'paused';
                } else {
                    element.style.animationPlayState = 'running';
                }
            });
        };

        document.addEventListener('visibilitychange', visibilityHandler);
        this.eventListeners.set('visibilityChange', { element: document, event: 'visibilitychange', handler: visibilityHandler });

        console.log('⚡ Performance optimizations applied');
    }

    // ==========================================
    // GOOGLE ANALYTICS INTEGRATION
    // ==========================================

    initGoogleAnalytics() {
        // Enhanced GA initialization with Core Web Vitals optimization
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-Z92QX7TK22', {
            send_page_view: false,
            transport_type: 'beacon'
        });

        // Load GA after page loads
        window.addEventListener('load', function() {
            const script = document.createElement('script');
            script.src = 'https://www.googletagmanager.com/gtag/js?id=G-Z92QX7TK22';
            script.async = true;
            document.head.appendChild(script);

            // Send page view after loading
            gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href
            });
        });

        console.log('📊 Google Analytics initialized');
    }

    // ==========================================
    // DEBUGGING AND TESTING
    // ==========================================

    testAnimations() {
        console.log('🧪 MANUAL ANIMATION TEST');
        const elements = document.querySelectorAll('.fade-in-element');
        elements.forEach((element, index) => {
            console.log(`Testing element ${index + 1}:`, element);
            element.classList.toggle('is-visible');
        });
    }

    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            config: this.config,
            observers: Array.from(this.observers.keys()),
            eventListeners: Array.from(this.eventListeners.keys()),
            animatedElements: document.querySelectorAll('.is-visible').length,
            totalElements: document.querySelectorAll('.fade-in-element').length
        };
    }

    // ==========================================
    // CLEANUP
    // ==========================================

    destroy() {
        // Remove event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });

        // Disconnect observers
        this.observers.forEach(observer => {
            observer.disconnect();
        });

        // Clear maps
        this.eventListeners.clear();
        this.observers.clear();

        this.isInitialized = false;
        console.log('🧹 Core destroyed and cleaned up');
    }
}

// ==========================================
// FORM UTILITIES
// ==========================================

class FormUtils {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    static formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    static setFieldError(field, message) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        formGroup.style.borderColor = 'var(--error-red, #dc3545)';

        if (!formGroup.querySelector('.error-text')) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-text';
            errorDiv.style.color = 'var(--error-red, #dc3545)';
            errorDiv.style.fontSize = '14px';
            errorDiv.style.marginTop = '5px';
            errorDiv.textContent = message;
            formGroup.appendChild(errorDiv);
        }
    }

    static clearFieldErrors(field) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        formGroup.style.borderColor = '';
        const errorText = formGroup.querySelector('.error-text');
        if (errorText) {
            errorText.remove();
        }
    }
}

// ==========================================
// URL UTILITIES
// ==========================================

class UrlUtils {
    static getParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    static setParameter(name, value) {
        const url = new URL(window.location);
        url.searchParams.set(name, value);
        window.history.pushState({}, '', url);
    }

    static removeParameter(name) {
        const url = new URL(window.location);
        url.searchParams.delete(name);
        window.history.pushState({}, '', url);
    }
}

// ==========================================
// GLOBAL INITIALIZATION
// ==========================================

// Create global instance
window.AisleToIslands = new AisleToIslandsCore();
window.FormUtils = FormUtils;
window.UrlUtils = UrlUtils;

// Auto-initialize on DOM ready unless disabled
document.addEventListener('DOMContentLoaded', function() {
    // Check if auto-init is disabled
    if (!document.documentElement.hasAttribute('data-disable-auto-init')) {
        window.AisleToIslands.init();
    }
});

// Expose test function globally
window.testAnimations = () => window.AisleToIslands.testAnimations();
window.debugCore = () => console.table(window.AisleToIslands.getDebugInfo());

console.log('🏗️ Aisle to Islands Core loaded and ready');