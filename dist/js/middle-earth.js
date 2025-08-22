/**
 * MIDDLE-EARTH MODULE
 * Special animations and easter eggs for the 404 page
 * Creates a Lord of the Rings themed experience
 * Depends on: core.js
 */

class MiddleEarthManager {
    constructor() {
        this.config = {
            mistAnimationInterval: 4000,
            ringPulseInterval: 50,
            konamiCode: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']
        };

        this.state = {
            konamiSequence: [],
            mistAnimationId: null,
            ringAnimationId: null,
            isInitialized: false
        };
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================

    init() {
        if (this.state.isInitialized) {
            console.warn('🧙‍♂️ Middle-earth already initialized');
            return;
        }

        console.log('🧙‍♂️ Welcome to Middle-earth! Even the wisest can lose their way...');

        this.initEasterEggs();
        this.initMiddleEarthAnimations();
        this.initGoogleAnalytics404();

        this.state.isInitialized = true;
        console.log('🌟 Middle-earth has awakened!');
    }

    // ==========================================
    // MIDDLE-EARTH SPECIFIC ANIMATIONS
    // ==========================================

    initMiddleEarthAnimations() {
        console.log('✨ Casting animation spells across Middle-earth...');

        // Animate hero content with delay
        setTimeout(() => {
            const heroContent = document.querySelector('.hero-content');
            const heroVisual = document.querySelector('.hero-visual');

            if (heroContent) {
                heroContent.classList.add('loaded');
                console.log('📜 Ancient scrolls have been revealed');
            }

            if (heroVisual) {
                heroVisual.classList.add('loaded');
                console.log('🏔️ The mountains of Middle-earth rise majestically');
            }
        }, 300);

        // Start floating mist animation
        this.startMistAnimation();

        // Start ring glow pulse
        this.startRingAnimation();
    }

    startMistAnimation() {
        this.state.mistAnimationId = setInterval(() => {
            const mistElements = document.querySelectorAll('.mist');
            mistElements.forEach((mist, index) => {
                const randomDelay = Math.random() * 2000;
                setTimeout(() => {
                    const translateX = Math.random() * 20 - 10;
                    const translateY = Math.random() * 10 - 5;
                    mist.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`;
                }, randomDelay);
            });
        }, this.config.mistAnimationInterval);

        console.log('🌫️ Mist of Middle-earth is flowing');
    }

    startRingAnimation() {
        const ring = document.querySelector('.ring-glow');
        if (!ring) return;

        const animateRing = () => {
            const scale = 1 + Math.sin(Date.now() * 0.001) * 0.1;
            ring.style.transform = `scale(${scale})`;
            this.state.ringAnimationId = requestAnimationFrame(animateRing);
        };

        animateRing();
        console.log('💍 The Ring pulses with ancient power');
    }

    // ==========================================
    // EASTER EGGS AND INTERACTIONS
    // ==========================================

    initEasterEggs() {
        this.displayWelcomeMessages();
        this.initKonamiCode();
        this.setupSpecialRoutes();
    }

    displayWelcomeMessages() {
        const messages = [
            '🧙‍♂️ "A wizard is never late, nor is he early. He arrives precisely when he means to."',
            '👁 "One does not simply walk into a 404 page..."',
            '⚔️ "You shall not pass... until you find the right URL!"'
        ];

        messages.forEach(message => {
            console.log(message);
        });
    }

    initKonamiCode() {
        document.addEventListener('keydown', (e) => {
            this.state.konamiSequence.push(e.code);

            if (this.state.konamiSequence.length > this.config.konamiCode.length) {
                this.state.konamiSequence.shift();
            }

            if (this.state.konamiSequence.toString() === this.config.konamiCode.toString()) {
                this.activateKonamiEasterEgg();
            }
        });

        console.log('🎮 Konami code listener activated');
    }

    activateKonamiEasterEgg() {
        console.log('🧙‍♂️ Gandalf whispers: "Speak friend and enter... try /fellowship or /shire"');

        // Apply sepia filter to create old parchment effect
        document.body.style.filter = 'sepia(0.3)';
        document.body.style.transition = 'filter 0.5s ease';

        // Show special message
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(139, 69, 19, 0.9);
            color: #f4e4bc;
            padding: 20px;
            border-radius: 10px;
            font-family: serif;
            text-align: center;
            z-index: 9999;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            border: 2px solid #ffd700;
        `;
        message.innerHTML = `
            <h3>🧙‍♂️ Gandalf's Secret</h3>
            <p>"The secret paths of Middle-earth are revealed to those who seek!"</p>
            <small>Easter egg activated! Ancient magic flows through the page...</small>
        `;

        document.body.appendChild(message);

        // Remove effects after 3 seconds
        setTimeout(() => {
            document.body.style.filter = 'none';
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);

        // Track easter egg activation
        this.trackEasterEgg('konami_code');
    }

    setupSpecialRoutes() {
        // Check for special URL fragments or search params
        const urlPath = window.location.pathname.toLowerCase();
        const urlParams = new URLSearchParams(window.location.search);

        if (urlPath.includes('fellowship') || urlParams.get('fellowship')) {
            this.activateFellowshipEasterEgg();
        }

        if (urlPath.includes('shire') || urlParams.get('shire')) {
            this.activateShireEasterEgg();
        }
    }

    activateFellowshipEasterEgg() {
        console.log('⚔️ The Fellowship of the Ring has been summoned!');
        document.body.style.background = 'linear-gradient(45deg, #2c1810, #5d4037)';
        this.trackEasterEgg('fellowship_route');
    }

    activateShireEasterEgg() {
        console.log('🌱 Welcome to the peaceful Shire!');
        document.body.style.background = 'linear-gradient(45deg, #2e7d32, #66bb6a)';
        this.trackEasterEgg('shire_route');
    }

    // ==========================================
    // ANALYTICS AND TRACKING
    // ==========================================

    initGoogleAnalytics404() {
        // Track 404 page view
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                'page_title': '404 - Lost in Middle-earth',
                'page_location': window.location.href,
                'custom_parameter_1': 'middle_earth_404'
            });

            // Track how users arrived at 404
            const referrer = document.referrer;
            if (referrer) {
                gtag('event', '404_source', {
                    'event_category': 'navigation',
                    'event_label': referrer,
                    'value': 1
                });
            }
        }

        console.log('📊 Middle-earth analytics initialized');
    }

    trackEasterEgg(eggType) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'easter_egg', {
                'event_category': 'engagement',
                'event_label': eggType,
                'value': 1
            });
        }

        console.log(`🥚 Easter egg tracked: ${eggType}`);
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    displayHelpfulLinks() {
        const links = [
            { text: 'Return to the Shire', url: 'index.html' },
            { text: 'Plan Your Quest', url: 'destination-wedding.html' },
            { text: 'Luxury Adventures', url: 'curated-honeymoon.html' },
            { text: 'Contact the Fellowship', url: 'inquire.html' }
        ];

        console.group('🗺️ Helpful paths through Middle-earth:');
        links.forEach(link => {
            console.log(`→ ${link.text}: ${link.url}`);
        });
        console.groupEnd();
    }

    // ==========================================
    // CLEANUP
    // ==========================================

    destroy() {
        // Clear animations
        if (this.state.mistAnimationId) {
            clearInterval(this.state.mistAnimationId);
        }

        if (this.state.ringAnimationId) {
            cancelAnimationFrame(this.state.ringAnimationId);
        }

        // Reset state
        this.state = {
            konamiSequence: [],
            mistAnimationId: null,
            ringAnimationId: null,
            isInitialized: false
        };

        // Remove any special styling
        document.body.style.filter = '';
        document.body.style.background = '';

        console.log('🧹 Middle-earth magic has been dispelled');
    }

    // ==========================================
    // DEBUG METHODS
    // ==========================================

    getState() {
        return {
            isInitialized: this.state.isInitialized,
            activeAnimations: {
                mist: !!this.state.mistAnimationId,
                ring: !!this.state.ringAnimationId
            },
            konamiProgress: this.state.konamiSequence.length,
            konamiSequence: this.state.konamiSequence.join(' → ')
        };
    }

    triggerKonamiCode() {
        this.state.konamiSequence = [...this.config.konamiCode];
        this.activateKonamiEasterEgg();
        console.log('🧪 Konami code manually triggered');
    }
}

// ==========================================
// ADDITIONAL MIDDLE-EARTH UTILITIES
// ==========================================

class MiddleEarthQuotes {
    static quotes = [
        "Not all those who wander are lost.",
        "Even the smallest person can change the course of the future.",
        "I will not say: do not weep; for not all tears are an evil.",
        "The road goes ever on and on, down from the door where it began.",
        "All we have to decide is what to do with the time that is given us.",
        "There is some good in this world, and it's worth fighting for.",
        "A wizard is never late, nor is he early. He arrives precisely when he means to."
    ];

    static getRandomQuote() {
        const randomIndex = Math.floor(Math.random() * this.quotes.length);
        return this.quotes[randomIndex];
    }

    static displayQuoteInConsole() {
        const quote = this.getRandomQuote();
        console.log(`📖 "${quote}"`);
        return quote;
    }
}

// ==========================================
// GLOBAL INITIALIZATION
// ==========================================

// Auto-initialize only on 404 page
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the 404 page
    if (document.querySelector('.hero-404') || document.title.includes('Lost in Middle-earth')) {
        window.MiddleEarth = new MiddleEarthManager();
        window.MiddleEarth.init();

        // Display helpful links after initialization
        setTimeout(() => {
            window.MiddleEarth.displayHelpfulLinks();
            MiddleEarthQuotes.displayQuoteInConsole();
        }, 1000);
    }
});

// Expose classes globally for debugging
window.MiddleEarthManager = MiddleEarthManager;
window.MiddleEarthQuotes = MiddleEarthQuotes;

// Debug functions
window.testMiddleEarthAnimations = function() {
    if (window.MiddleEarth) {
        console.log('🧪 MIDDLE-EARTH ANIMATION TEST');
        console.table(window.MiddleEarth.getState());
    } else {
        console.log('❌ Middle-earth not initialized');
    }
};

window.triggerGandalfEasterEgg = function() {
    if (window.MiddleEarth) {
        window.MiddleEarth.triggerKonamiCode();
    }
};

window.getMiddleEarthQuote = function() {
    return MiddleEarthQuotes.getRandomQuote();
};

console.log('🏗️ Middle-earth module loaded and ready for adventure');