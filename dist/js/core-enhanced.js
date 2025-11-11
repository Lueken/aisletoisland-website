/**
 * AISLE TO ISLANDS - CORE ENHANCED MODULE
 * Non-critical functionality loaded after essential features
 * Version: 2.0 - Split Architecture
 */

class AisleToIslandsEnhanced {
    constructor() {
        this.config = {};
        this.isInitialized = false;
        this.observers = new Map();
        this.eventListeners = new Map();
    }

    // ==========================================
    // ENHANCED INITIALIZATION
    // ==========================================

    init(config = {}) {
        if (this.isInitialized) {
            console.warn('🔄 Enhanced features already initialized');
            return;
        }

        this.config = config;
        console.log('🚀 Initializing Enhanced Features...');

        // Initialize enhanced functionality
        this.initHomepageNavigation();
        this.initNavbarEffects();
        this.initSmoothScrolling();
        this.initYearsExperience();
        this.initGoogleAnalytics();

        this.isInitialized = true;
        console.log('✅ Enhanced features initialization complete');
    }

    // ==========================================
    // HOMEPAGE NAVIGATION (ENHANCED)
    // ==========================================

    initHomepageNavigation() {
        // Only initialize if we're on homepage
        if (!document.querySelector('nav.homepage-nav')) {
            return;
        }

        const nav = document.querySelector('nav.homepage-nav');
        const splash = document.querySelector('.splash');

        if (!nav || !splash) return;

        const navHeight = nav.offsetHeight;
        // Calculate sticky point: when nav top hits viewport top (just the splash height)
        const stickyPoint = splash.offsetHeight;
        let isSticky = false;

        // Check if mobile device
        const isMobile = window.innerWidth <= 768;

        // Create spacer to prevent content jump
        const spacer = document.createElement('div');
        spacer.className = 'nav-spacer';
        spacer.style.height = '0';
        spacer.style.overflow = 'hidden';
        nav.parentNode.insertBefore(spacer, nav.nextSibling);

        // Initialize hero animation for both mobile and desktop
        this.initHomepageHeroAnimation(splash);

        // For mobile, make nav sticky immediately
        if (isMobile) {
            nav.classList.add('homepage-nav-sticky');
            spacer.style.height = navHeight + 'px';
            spacer.classList.add('active');
            isSticky = true;
            console.log('📱 Mobile navigation set to always sticky');
            return;
        }

        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            if (scrollTop >= stickyPoint && !isSticky) {
                // Get fresh nav height right before transition to ensure accuracy
                const currentNavHeight = nav.offsetHeight;
                // Set spacer height FIRST to fill the space the nav will vacate
                spacer.style.height = currentNavHeight + 'px';
                spacer.classList.add('active');
                // Then make nav sticky in the same frame (no delay) to prevent jump
                nav.classList.add('homepage-nav-sticky');
                isSticky = true;
            } else if (scrollTop < stickyPoint && isSticky) {
                // Remove sticky state and reset spacer
                nav.classList.remove('homepage-nav-sticky');
                spacer.classList.remove('active');
                spacer.style.height = '0';
                isSticky = false;
            }
        };

        const handleResize = () => {
            const newIsMobile = window.innerWidth <= 768;
            if (newIsMobile && !isSticky) {
                nav.classList.add('homepage-nav-sticky');
                spacer.style.height = navHeight + 'px';
                spacer.classList.add('active');
                isSticky = true;
            } else if (!newIsMobile && isSticky && window.pageYOffset < stickyPoint) {
                nav.classList.remove('homepage-nav-sticky');
                spacer.classList.remove('active');
                spacer.style.height = '0';
                isSticky = false;
            }
            
            // Re-initialize hero animation on resize to handle orientation changes
            this.initHomepageHeroAnimation(splash);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize, { passive: true });

        this.eventListeners.set('homepageNavScroll', { element: window, event: 'scroll', handler: handleScroll });
        this.eventListeners.set('homepageNavResize', { element: window, event: 'resize', handler: handleResize });

        console.log('🏠 Homepage navigation enhanced');
    }

    // ==========================================
    // HOMEPAGE HERO ANIMATION (ENHANCED)
    // ==========================================

    initHomepageHeroAnimation(splash) {
        const heroContainer = document.querySelector('.hero-container.fade-in-element');
        if (!heroContainer) return;

        const isMobile = window.innerWidth <= 768;
        
        // Remove existing hero scroll listener to prevent duplicates
        const existingListener = this.eventListeners.get('homepageHeroScroll');
        if (existingListener) {
            existingListener.element.removeEventListener(existingListener.event, existingListener.handler);
            this.eventListeners.delete('homepageHeroScroll');
        }
        
        // On mobile, trigger animation immediately or after a short delay
        if (isMobile) {
            // Only trigger if not already visible
            if (!heroContainer.classList.contains('is-visible')) {
                setTimeout(() => {
                    heroContainer.classList.add('is-visible');
                    console.log('📱 Hero animation triggered immediately on mobile');
                }, 500); // Small delay for better UX
            }
            return;
        }

        // Desktop behavior - trigger based on scroll position
        const handleHeroScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            // Calculate when navbar is halfway through the splash section (earlier trigger)
            const halfwayPoint = splash.offsetHeight * 0.7; // Trigger at 70% through splash

            // Trigger hero animation when we're 70% through the splash section
            if (scrollTop >= halfwayPoint && !heroContainer.classList.contains('is-visible')) {
                console.log('🎭 Triggering hero animation at scroll:', scrollTop, 'halfway point:', halfwayPoint);
                setTimeout(() => {
                    heroContainer.classList.add('is-visible');
                }, 100); // Reduced delay for more responsive feel
            } else if (scrollTop < halfwayPoint && heroContainer.classList.contains('is-visible')) {
                // Reset hero animation if scrolling back up
                heroContainer.classList.remove('is-visible');
            }
        };

        window.addEventListener('scroll', handleHeroScroll, { passive: true });
        this.eventListeners.set('homepageHeroScroll', { element: window, event: 'scroll', handler: handleHeroScroll });

        console.log('🎭 Homepage hero animation enhanced');
    }

    // ==========================================
    // NAVBAR EFFECTS (ENHANCED)
    // ==========================================

    initNavbarEffects() {
        // Skip if homepage nav exists
        if (document.querySelector('nav.homepage-nav')) return;

        const nav = document.querySelector('nav');
        if (!nav) return;

        let lastScrollY = window.pageYOffset;
        let ticking = false;

        const handleScroll = () => {
            const scrollY = window.pageYOffset;
            
            if (scrollY > 100) {
                nav.classList.add('nav-scrolled');
            } else {
                nav.classList.remove('nav-scrolled');
            }

            lastScrollY = scrollY;
        };

        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestTick, { passive: true });
        this.eventListeners.set('navbarScroll', { element: window, event: 'scroll', handler: requestTick });

        console.log('🧭 Navbar effects initialized');
    }

    // ==========================================
    // SMOOTH SCROLLING (ENHANCED)
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

        const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
        smoothScrollLinks.forEach(link => {
            // Skip empty hash links
            if (link.getAttribute('href') !== '#') {
                link.addEventListener('click', smoothScrollHandler);
                this.eventListeners.set(`smoothScroll_${link.href}`, { 
                    element: link, 
                    event: 'click', 
                    handler: smoothScrollHandler 
                });
            }
        });

        console.log('🌊 Smooth scrolling initialized');
    }

    // ==========================================
    // YEARS EXPERIENCE (ENHANCED)
    // ==========================================

    initYearsExperience() {
        const businessStartYear = 2013;
        const currentYear = new Date().getFullYear();
        const yearsExperience = currentYear - businessStartYear;

        const experienceElement = document.getElementById('yearsExperience');
        if (experienceElement) {
            experienceElement.textContent = yearsExperience;
            console.log(`📅 Years experience updated: ${yearsExperience} years`);
        }
    }

    // ==========================================
    // GOOGLE ANALYTICS (ENHANCED)
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

        // Load GA when browser is idle for better performance
        const loadGA = () => {
            const script = document.createElement('script');
            script.src = 'https://www.googletagmanager.com/gtag/js?id=G-Z92QX7TK22';
            script.async = true;
            document.head.appendChild(script);

            // Send page view after loading
            gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href
            });

            console.log('📊 Google Analytics script loaded via idle callback');
        };

        // Use requestIdleCallback for optimal performance, fallback to timeout
        if ('requestIdleCallback' in window) {
            requestIdleCallback(loadGA, { timeout: 3000 });
        } else {
            // Fallback for browsers without requestIdleCallback
            setTimeout(loadGA, 2000);
        }

        console.log('📊 Google Analytics initialized with idle loading');
    }

    // ==========================================
    // DEBUGGING AND TESTING (ENHANCED)
    // ==========================================

    testAnimations() {
        console.log('🧪 ENHANCED ANIMATION TEST');
        const elements = document.querySelectorAll('.fade-in-element');
        elements.forEach((element, index) => {
            console.log(`Testing enhanced element ${index + 1}:`, element);
            element.classList.toggle('is-visible');
        });
    }

    getDebugInfo() {
        return {
            'Enhanced Initialized': this.isInitialized,
            'Config': this.config,
            'Observers Count': this.observers.size,
            'Event Listeners Count': this.eventListeners.size,
            'Current Page': window.location.pathname,
            'User Agent': navigator.userAgent.substring(0, 50) + '...'
        };
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

        console.log('🧹 Enhanced features cleaned up');
    }
}

// ==========================================
// ENHANCED UTILITIES
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
// GLOBAL REGISTRATION
// ==========================================

// Create global instance
window.AisleToIslandsEnhanced = new AisleToIslandsEnhanced();
window.UrlUtils = UrlUtils;

// Expose enhanced test functions globally
window.testEnhancedAnimations = () => window.AisleToIslandsEnhanced.testAnimations();
window.debugEnhanced = () => console.table(window.AisleToIslandsEnhanced.getDebugInfo());

console.log('🚀 Aisle to Islands Enhanced Features loaded');