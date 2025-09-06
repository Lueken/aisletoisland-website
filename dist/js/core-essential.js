/**
 * AISLE TO ISLANDS - CORE ESSENTIAL MODULE
 * Critical functionality that must load immediately
 * Version: 2.0 - Split Architecture
 */

class AisleToIslandsCoreEssential {
    constructor() {
        this.config = {
            animationDelay: 150,
            intersectionThreshold: 0.2,
            intersectionMargin: '0px 0px -50px 0px',
            scrollThreshold: 50,
            staggerDelay: 50
        };

        this.isInitialized = false;
        this.observers = new Map();
        this.eventListeners = new Map();
    }

    // ==========================================
    // ESSENTIAL INITIALIZATION
    // ==========================================

    init(pageConfig = {}) {
        if (this.isInitialized) {
            console.warn('🔄 Core Essential already initialized');
            return;
        }

        // Merge page-specific config
        this.config = { ...this.config, ...pageConfig };
        console.log('🏗️ Initializing Core Essential...');

        // Initialize essential functionality only
        this.initPerformanceOptimizations();
        this.initMobileMenu();
        this.initLogoAnimation();
        
        // Initialize basic animations immediately
        this.initScrollAnimations();
        this.initHeroAnimations();
        
        this.isInitialized = true;
        console.log('✅ Core Essential initialization complete');

        // Signal that enhanced features can load
        this.loadEnhancedFeatures();
    }

    // ==========================================
    // PERFORMANCE OPTIMIZATIONS
    // ==========================================

    initPerformanceOptimizations() {
        // Respect user's motion preferences
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        if (prefersReducedMotion.matches) {
            console.log('♿ Reduced motion detected, disabling animations');
            this.config.animationDelay = 0;
            this.config.staggerDelay = 0;
            
            // Add reduced-motion class to html
            document.documentElement.classList.add('reduced-motion');
        }

        // Add scroll optimization for passive listeners
        let ticking = false;
        this.optimizedScrollHandler = (callback) => {
            if (!ticking) {
                requestAnimationFrame(callback);
                ticking = true;
                requestAnimationFrame(() => ticking = false);
            }
        };

        console.log('⚡ Performance optimizations applied');
    }

    // ==========================================
    // LOGO ANIMATION (ESSENTIAL)
    // ==========================================

    initLogoAnimation() {
        const logoContainer = document.querySelector('.logo-container');
        
        if (logoContainer) {
            // Start with very subtle hidden state
            logoContainer.style.opacity = '0.3';
            logoContainer.style.transform = 'translateY(-2px)';
            
            // Quick, subtle animation - feels instant but polished
            setTimeout(() => {
                logoContainer.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                logoContainer.style.opacity = '1';
                logoContainer.style.transform = 'translateY(0)';
            }, 50);
        }
        
        console.log('✨ Logo animation initialized (subtle)');
    }

    // ==========================================
    // MOBILE MENU (ESSENTIAL)
    // ==========================================

    initMobileMenu() {
        const toggle = document.querySelector('.mobile-menu-toggle');
        const mobileNav = document.querySelector('.mobile-nav');

        if (!toggle || !mobileNav) {
            console.log('📱 Mobile menu elements not found');
            return;
        }

        let isOpen = false;

        const toggleMenu = () => {
            isOpen = !isOpen;
            toggle.classList.toggle('active', isOpen);
            mobileNav.classList.toggle('active', isOpen);
            toggle.setAttribute('aria-expanded', isOpen);
            
            // Prevent body scroll when menu is open
            document.body.style.overflow = isOpen ? 'hidden' : '';
        };

        const closeMenu = () => {
            if (isOpen) {
                isOpen = false;
                toggle.classList.remove('active');
                mobileNav.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        };

        // Toggle menu on button click
        toggle.addEventListener('click', toggleMenu);

        // Close menu when clicking on links
        const menuLinks = mobileNav.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) {
                closeMenu();
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (isOpen && !toggle.contains(e.target) && !mobileNav.contains(e.target)) {
                closeMenu();
            }
        });

        this.eventListeners.set('mobileMenuToggle', { element: toggle, event: 'click', handler: toggleMenu });
        console.log('📱 Mobile menu initialized');
    }

    // ==========================================
    // BASIC SCROLL ANIMATIONS (ESSENTIAL)
    // ==========================================

    initScrollAnimations() {
        if (!('IntersectionObserver' in window)) {
            console.log('⚠️ IntersectionObserver not supported, using fallback');
            this.fallbackAnimations();
            return;
        }

        const observerOptions = {
            threshold: this.config.intersectionThreshold,
            rootMargin: this.config.intersectionMargin
        };

        // Create single observer for performance
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Add staggered delay based on entry order
                    setTimeout(() => {
                        entry.target.classList.add('is-visible');
                    }, index * this.config.staggerDelay);

                    // Stop observing once animated
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Find and observe fade-in elements (exclude hero-container - handled separately)
        const fadeElements = document.querySelectorAll('.fade-in-element:not(.hero-container)');
        fadeElements.forEach(element => {
            observer.observe(element);
        });

        this.observers.set('fadeInObserver', observer);
        console.log(`🎭 Observing ${fadeElements.length} fade-in elements`);
    }

    // Fallback for browsers without IntersectionObserver
    fallbackAnimations() {
        setTimeout(() => {
            const elements = document.querySelectorAll('.fade-in-element:not(.hero-container)');
            elements.forEach((element, index) => {
                setTimeout(() => {
                    element.classList.add('is-visible');
                }, index * this.config.staggerDelay + 1000);
            });
        }, this.config.animationDelay);
        
        console.log('🔄 Using animation fallback');
    }

    // ==========================================
    // HERO ANIMATIONS (ESSENTIAL - MOVED FROM ENHANCED)
    // ==========================================

    initHeroAnimations() {
        const heroElements = document.querySelectorAll('.hero-animate, .hero-content');

        heroElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('loaded');
            }, index * this.config.staggerDelay);
        });

        // Special handling for hero visual section
        setTimeout(() => {
            const heroVisual = document.querySelector('.hero-visual');
            if (heroVisual) {
                heroVisual.classList.add('loaded');
            }
        }, this.config.animationDelay);

        console.log('🎭 Hero animations initialized (essential)');
    }

    // ==========================================
    // ENHANCED FEATURES LOADER
    // ==========================================

    loadEnhancedFeatures() {
        // Load enhanced features when browser is idle or after delay
        const loadEnhanced = () => {
            const script = document.createElement('script');
            script.src = 'js/core-enhanced.js';
            script.async = true;
            script.onload = () => {
                console.log('🚀 Enhanced features loaded');
                // Initialize enhanced features
                if (window.AisleToIslandsEnhanced) {
                    window.AisleToIslandsEnhanced.init(this.config);
                }
            };
            document.head.appendChild(script);
        };

        // Use requestIdleCallback for optimal performance
        if ('requestIdleCallback' in window) {
            requestIdleCallback(loadEnhanced, { timeout: 2000 });
        } else {
            setTimeout(loadEnhanced, 1000);
        }
    }

    // ==========================================
    // CLEANUP METHODS
    // ==========================================

    cleanup() {
        // Clean up observers
        this.observers.forEach(observer => {
            if (observer && typeof observer.disconnect === 'function') {
                observer.disconnect();
            }
        });
        this.observers.clear();

        // Clean up event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
            if (element && handler) {
                element.removeEventListener(event, handler);
            }
        });
        this.eventListeners.clear();

        console.log('🧹 Core Essential cleaned up');
    }
}

// ==========================================
// ESSENTIAL UTILITIES
// ==========================================

class FormUtilsEssential {
    static showError(input, message) {
        const existingError = input.nextElementSibling;
        if (existingError && existingError.classList.contains('error-message')) {
            existingError.textContent = message;
            return;
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.setAttribute('role', 'alert');
        
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
        input.classList.add('error');
    }

    static clearError(input) {
        const errorText = input.nextElementSibling;
        if (errorText && errorText.classList.contains('error-message')) {
            errorText.remove();
        }
        input.classList.remove('error');
    }
}

// ==========================================
// GLOBAL INITIALIZATION
// ==========================================

// Create global instance
window.AisleToIslands = new AisleToIslandsCoreEssential();
window.FormUtils = FormUtilsEssential;

// Auto-initialize on DOM ready unless disabled
document.addEventListener('DOMContentLoaded', function() {
    if (!document.documentElement.hasAttribute('data-disable-auto-init')) {
        window.AisleToIslands.init();
    }
});

console.log('🏗️ Aisle to Islands Core Essential loaded');