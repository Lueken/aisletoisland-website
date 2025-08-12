console.log('🚀 ENHANCED CONTACT PAGE - LOADING...');

// ==========================================
// ENHANCED BULLETPROOF ANIMATION SYSTEM
// ==========================================

function initBulletproofAnimations() {
    console.log('💫 Initializing enhanced contact page animations...');

    // Setup scroll animations for fade-in elements
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    console.log('🎯 Contact element entering viewport:', entry.target.className);

                    // Add slight delay to prevent all animations firing at once
                    setTimeout(() => {
                        entry.target.classList.add('is-visible');
                        console.log('✨ Contact animation applied to:', entry.target.className);
                    }, index * 150);

                    // Stop observing once animated
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Find all elements to animate
        const animateElements = document.querySelectorAll('.fade-in-element');
        console.log(`🎭 Found ${animateElements.length} contact elements to animate`);

        // Start observing with staggered delays
        animateElements.forEach((element, index) => {
            element.style.transitionDelay = `${index * 0.15}s`;
            observer.observe(element);
        });

        console.log('👀 Contact Intersection Observer initialized');
    } else {
        // Fallback for older browsers
        console.log('⚠️ Intersection Observer not supported, using contact fallback');

        setTimeout(() => {
            document.querySelectorAll('.fade-in-element').forEach((element, index) => {
                setTimeout(() => {
                    element.classList.add('is-visible');
                }, index * 300 + 1000);
            });
        }, 500);
    }
}

// ==========================================
// ENHANCED CONTACT FORM CLASS
// ==========================================

class EnhancedContactForm {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.selectedCelebrationType = null;
        this.formData = new Map();
        this.validationRules = new Map();

        this.init();
    }

    init() {
        console.log('📝 Initializing Enhanced Contact Form...');

        this.setupValidationRules();
        this.bindEvents();
        this.updateProgress();
        this.updateProgressDots();
        this.initRealTimeValidation();
        this.setMinDates();
        this.initChoiceCards();

        console.log('✅ Enhanced Contact Form initialized');
    }

    setupValidationRules() {
        this.validationRules.set('email', {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address'
        });

        this.validationRules.set('phone', {
            required: false,
            pattern: /^[\+]?[1-9][\d]{9,15}$/,
            message: 'Please enter a valid phone number'
        });
    }

    bindEvents() {
        // Navigation buttons
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.nextStep();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.prevStep();
            });
        }

        // Choice cards
        document.querySelectorAll('.choice-card').forEach(card => {
            card.addEventListener('click', () => {
                this.handleChoiceSelection(card);
            });
        });

        // "How did you hear about us" dropdown
        const referralSelect = document.querySelector('select[name="referral_source"]');
        const otherGroup = document.getElementById('otherSourceGroup');

        if (referralSelect && otherGroup) {
            referralSelect.addEventListener('change', (e) => {
                if (e.target.value === 'Other') {
                    otherGroup.style.display = 'block';
                    const otherInput = document.getElementById('otherSource');
                    if (otherInput) {
                        otherInput.required = true;
                        setTimeout(() => otherInput.focus(), 100);
                    }
                } else {
                    otherGroup.style.display = 'none';
                    const otherInput = document.getElementById('otherSource');
                    if (otherInput) {
                        otherInput.required = false;
                        otherInput.value = '';
                    }
                }
            });
        }

        // Form submission
        const form = document.getElementById('contactForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitForm();
            });
        }
    }

    initRealTimeValidation() {
        const inputs = document.querySelectorAll('.form-input, .form-select, .form-textarea');

        inputs.forEach(input => {
            // Validate on blur
            input.addEventListener('blur', (e) => {
                this.validateField(e.target);
            });

            // Clear validation on focus/input
            input.addEventListener('focus', (e) => {
                this.clearFieldValidation(e.target);
            });

            input.addEventListener('input', (e) => {
                this.clearFieldValidation(e.target);

                // Real-time email validation with delay
                if (e.target.type === 'email' && e.target.value.length > 3) {
                    clearTimeout(this.emailValidationTimeout);
                    this.emailValidationTimeout = setTimeout(() => {
                        this.validateField(e.target);
                    }, 500);
                }
            });

            // Enhanced focus effects
            input.addEventListener('focus', (e) => {
                e.target.parentElement.classList.add('focused');
            });

            input.addEventListener('blur', (e) => {
                e.target.parentElement.classList.remove('focused');
            });
        });

        console.log('✅ Real-time validation initialized');
    }

    initChoiceCards() {
        // Add enhanced interaction for choice cards
        document.querySelectorAll('.choice-card').forEach(card => {
            // Add hover sound effect simulation
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-6px) scale(1.01)';
            });

            card.addEventListener('mouseleave', () => {
                if (!card.classList.contains('selected')) {
                    card.style.transform = '';
                }
            });
        });
    }

    validateField(field) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return true; // Skip if not in a form group

        const isRequired = field.hasAttribute('required');
        const value = field.value.trim();
        const fieldName = field.name;

        // Clear previous validation
        this.clearFieldValidation(field);

        // Required field validation
        if (isRequired && !value) {
            this.setFieldError(formGroup, 'This field is required');
            return false;
        }

        // Skip further validation if empty and not required
        if (!value && !isRequired) {
            return true;
        }

        // Specific field validations
        const rule = this.validationRules.get(field.type) || this.validationRules.get(fieldName);
        if (rule && rule.pattern && !rule.pattern.test(value)) {
            this.setFieldError(formGroup, rule.message);
            return false;
        }

        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.setFieldError(formGroup, 'Please enter a valid email address');
                return false;
            }
        }

        // Phone validation (basic)
        if (field.type === 'tel' && value) {
            const cleanPhone = value.replace(/\D/g, '');
            if (cleanPhone.length < 10) {
                this.setFieldError(formGroup, 'Please enter a valid phone number');
                return false;
            }
        }

        // Success state
        if (value && formGroup) {
            formGroup.classList.add('success');
            // Add success animation
            setTimeout(() => {
                formGroup.querySelector('.form-input, .form-select, .form-textarea').style.transform = 'scale(1.02)';
                setTimeout(() => {
                    formGroup.querySelector('.form-input, .form-select, .form-textarea').style.transform = '';
                }, 150);
            }, 100);
        }

        return true;
    }

    setFieldError(formGroup, message) {
        if (!formGroup) return;

        formGroup.classList.add('error');
        formGroup.classList.remove('success');

        // Remove existing error message
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `⚠️ ${message}`;
        formGroup.appendChild(errorDiv);

        // Focus the field for better UX
        const field = formGroup.querySelector('.form-input, .form-select, .form-textarea');
        if (field) {
            field.focus();
        }
    }

    clearFieldValidation(field) {
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        formGroup.classList.remove('error', 'success');

        const errorMsg = formGroup.querySelector('.error-message');
        if (errorMsg) {
            errorMsg.remove();
        }
    }

    handleChoiceSelection(card) {
        const value = card.dataset.value;
        const radio = card.querySelector('input[type="radio"]');

        // Clear previous selections with animation
        document.querySelectorAll('.choice-card').forEach(c => {
            c.classList.remove('selected');
            c.style.transform = '';
        });

        // Select this card with enhanced animation
        card.classList.add('selected');
        radio.checked = true;

        // Store selection
        this.selectedCelebrationType = value;
        this.formData.set('celebration_type', value);

        // Show relevant details section
        this.showEventDetails(value);

        // Enhanced selection feedback
        card.style.transform = 'scale(1.05)';
        setTimeout(() => {
            card.style.transform = 'scale(1.02) translateY(-4px)';
        }, 150);

        // Auto-advance with enhanced timing
        setTimeout(() => {
            if (this.currentStep === 2) {
                this.nextStep();
            }
        }, 1200);

        console.log('✅ Choice selected:', value);
    }

    showEventDetails(celebrationType) {
        // Hide all sections with fade out
        const sections = ['weddingSection', 'honeymoonSection', 'combinedSection'];
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.opacity = '0';
                section.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    section.style.display = 'none';
                }, 300);
            }
        });

        // Show relevant section with fade in
        let targetSectionId;
        switch(celebrationType) {
            case 'Destination Wedding':
                targetSectionId = 'weddingSection';
                break;
            case 'Luxury Honeymoon':
                targetSectionId = 'honeymoonSection';
                break;
            case 'Wedding + Honeymoon Package':
                targetSectionId = 'combinedSection';
                break;
        }

        if (targetSectionId) {
            const targetSection = document.getElementById(targetSectionId);
            if (targetSection) {
                setTimeout(() => {
                    targetSection.style.display = 'block';
                    setTimeout(() => {
                        targetSection.style.opacity = '1';
                        targetSection.style.transform = 'translateY(0)';
                    }, 50);
                }, 350);
            }
        }
    }

    nextStep() {
        if (!this.validateCurrentStep()) {
            this.showValidationErrors();
            return;
        }

        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.showStep(this.currentStep);
            this.updateProgress();
            this.updateProgressDots();
            this.updateNavigation();
            this.updateStepCounter();

            // Enhanced step transition
            this.playStepTransition();
        } else {
            this.submitForm();
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateProgress();
            this.updateProgressDots();
            this.updateNavigation();
            this.updateStepCounter();

            // Enhanced step transition
            this.playStepTransition();
        }
    }

    showStep(step) {
        // Hide all steps with fade out
        document.querySelectorAll('.form-step').forEach(stepEl => {
            stepEl.classList.remove('active');
            stepEl.style.opacity = '0';
            stepEl.style.transform = 'translateY(30px)';
        });

        // Show current step with enhanced animation
        setTimeout(() => {
            const currentStepElement = document.querySelector(`.form-step[data-step="${step}"]`);
            if (currentStepElement) {
                currentStepElement.classList.add('active');

                setTimeout(() => {
                    currentStepElement.style.opacity = '1';
                    currentStepElement.style.transform = 'translateY(0)';

                    // Focus first input in new step
                    setTimeout(() => {
                        const firstInput = currentStepElement.querySelector('.form-input, .form-select');
                        if (firstInput && step !== 2) { // Skip auto-focus on choice step
                            firstInput.focus();
                        }
                    }, 300);
                }, 100);
            }
        }, 200);
    }

    validateCurrentStep() {
        const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        if (!currentStepElement) return false;

        const requiredFields = currentStepElement.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    showValidationErrors() {
        // Find first error and scroll to it
        const firstError = document.querySelector('.form-group.error');
        if (firstError) {
            firstError.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            // Add attention animation
            firstError.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                firstError.style.animation = '';
            }, 500);
        }
    }

    updateProgress() {
        const progressPercent = (this.currentStep / this.totalSteps) * 100;
        const progressFill = document.getElementById('progressFill');

        if (progressFill) {
            progressFill.style.width = `${progressPercent}%`;
        }

        // Update time estimate
        const timeEstimate = document.getElementById('timeEstimate');
        if (timeEstimate) {
            const remainingSteps = this.totalSteps - this.currentStep;
            const estimatedMinutes = Math.max(1, remainingSteps);
            timeEstimate.textContent = remainingSteps === 0 ? 'Complete!' :
                `${estimatedMinutes} minute${estimatedMinutes > 1 ? 's' : ''} remaining`;
        }
    }

    updateProgressDots() {
        document.querySelectorAll('.step-dot').forEach((dot, index) => {
            const stepNum = index + 1;
            dot.classList.remove('active', 'completed');

            if (stepNum < this.currentStep) {
                dot.classList.add('completed');
                dot.textContent = '✓';
            } else if (stepNum === this.currentStep) {
                dot.classList.add('active');
                dot.textContent = stepNum;
            } else {
                dot.textContent = stepNum;
            }
        });
    }

    updateStepCounter() {
        const stepNumElement = document.getElementById('currentStepNum');
        if (stepNumElement) {
            stepNumElement.textContent = this.currentStep;
        }
    }

    updateNavigation() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (prevBtn) {
            prevBtn.style.visibility = this.currentStep > 1 ? 'visible' : 'hidden';
        }

        if (nextBtn) {
            if (this.currentStep === this.totalSteps) {
                nextBtn.innerHTML = 'Send My Inquiry <span class="btn-icon">✨</span>';
                nextBtn.classList.add('final-step');
            } else {
                nextBtn.innerHTML = 'Next Step <span class="btn-icon">→</span>';
                nextBtn.classList.remove('final-step');
            }
        }
    }

    playStepTransition() {
        // Add enhanced transition effects
        const formCard = document.querySelector('.form-card');
        if (formCard) {
            formCard.style.transform = 'scale(0.98)';
            setTimeout(() => {
                formCard.style.transform = '';
            }, 200);
        }
    }

    setMinDates() {
        // Set minimum date to today for all date inputs
        const today = new Date().toISOString().split('T')[0];
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            input.min = today;
        });

        console.log('📅 Minimum dates set to today');
    }

    async submitForm() {
        const form = document.getElementById('contactForm');
        const nextBtn = document.getElementById('nextBtn');
        const successMessage = document.getElementById('successMessage');
        const errorMessage = document.getElementById('errorMessage');

        if (!form) {
            console.error('❌ Form not found');
            return;
        }

        // Show enhanced loading state
        nextBtn.classList.add('loading');
        nextBtn.disabled = true;

        // Update progress to show completion
        this.updateProgress();
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = '100%';
        }

        try {
            const formData = new FormData(form);

            // Add enhanced form summary
            const summaryData = this.generateEnhancedFormSummary(formData);
            formData.append('inquiry_summary', summaryData);
            formData.append('form_submitted_at', new Date().toISOString());
            formData.append('user_agent', navigator.userAgent);
            formData.append('page_url', window.location.href);

            console.log('📤 Submitting enhanced form to Formspree...');

            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                console.log('✅ Form submitted successfully');

                // Enhanced success animation
                form.style.opacity = '0';
                form.style.transform = 'translateY(-20px)';

                setTimeout(() => {
                    form.style.display = 'none';
                    successMessage.style.display = 'block';

                    // Animate success message
                    setTimeout(() => {
                        successMessage.style.transform = 'scale(1)';
                        successMessage.style.opacity = '1';
                    }, 100);
                }, 300);

                // Scroll to success message
                setTimeout(() => {
                    successMessage.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }, 500);

                // Track conversion (if analytics available)
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'form_submit', {
                        'event_category': 'contact',
                        'event_label': this.selectedCelebrationType || 'unknown',
                        'value': 1
                    });
                }

                console.log('🎉 Success message displayed');

            } else {
                const data = await response.json();
                console.error('❌ Formspree error:', data);
                throw new Error('Submission failed');
            }

        } catch (error) {
            console.error('❌ Error submitting form:', error);

            // Show enhanced error message
            errorMessage.style.display = 'block';
            errorMessage.style.transform = 'scale(1)';
            errorMessage.style.opacity = '1';

            nextBtn.classList.remove('loading');
            nextBtn.disabled = false;

            // Scroll to error message
            errorMessage.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            // Reset progress
            const progressFill = document.getElementById('progressFill');
            if (progressFill) {
                progressFill.style.width = `${(this.currentStep / this.totalSteps) * 100}%`;
            }
        }
    }

    generateEnhancedFormSummary(formData) {
        const celebrationType = formData.get('celebration_type') || 'Not specified';
        const brideFirstName = formData.get('bride_first_name') || '';
        const groomFirstName = formData.get('groom_first_name') || '';

        let summary = `=== ENHANCED INQUIRY SUMMARY ===\n`;
        summary += `Submission Date: ${new Date().toLocaleString()}\n`;
        summary += `Celebration Type: ${celebrationType}\n`;
        summary += `Couple: ${brideFirstName} & ${groomFirstName}\n`;
        summary += `Email: ${formData.get('email') || 'Not provided'}\n`;
        summary += `Phone: ${formData.get('phone') || 'Not provided'}\n`;
        summary += `Referral Source: ${formData.get('referral_source') || 'Not specified'}\n`;

        if (formData.get('other_source')) {
            summary += `Other Source Details: ${formData.get('other_source')}\n`;
        }

        summary += `\n`;

        // Add specific details based on celebration type
        if (celebrationType.includes('Wedding')) {
            summary += `WEDDING DETAILS:\n`;
            summary += `Date: ${formData.get('wedding_date') || formData.get('combined_wedding_date') || 'Flexible'}\n`;
            summary += `Guest Count: ${formData.get('wedding_guest_count') || formData.get('combined_guest_count') || 'Not specified'}\n`;
            summary += `Location: ${formData.get('wedding_location') || formData.get('combined_wedding_location') || 'Open to suggestions'}\n`;
            summary += `Style: ${formData.get('wedding_style') || 'Not specified'}\n`;
            summary += `Budget: ${formData.get('wedding_budget') || 'Not specified'}\n`;

            const weddingPlans = formData.get('wedding_plans');
            if (weddingPlans && weddingPlans.trim()) {
                summary += `Wedding Vision: ${weddingPlans}\n`;
            }
            summary += `\n`;
        }

        if (celebrationType.includes('Honeymoon')) {
            summary += `HONEYMOON DETAILS:\n`;
            summary += `Dates: ${formData.get('honeymoon_dates') || 'Flexible'}\n`;
            summary += `Duration: ${formData.get('honeymoon_duration') || 'Not specified'}\n`;
            summary += `Destination: ${formData.get('honeymoon_destination') || formData.get('combined_honeymoon_location') || 'Open to suggestions'}\n`;
            summary += `Style: ${formData.get('honeymoon_style') || 'Not specified'}\n`;
            summary += `Budget: ${formData.get('honeymoon_budget') || 'Not specified'}\n`;

            const honeymoonPlans = formData.get('honeymoon_plans');
            if (honeymoonPlans && honeymoonPlans.trim()) {
                summary += `Honeymoon Vision: ${honeymoonPlans}\n`;
            }
            summary += `\n`;
        }

        if (celebrationType.includes('Package')) {
            summary += `PACKAGE BUDGET: ${formData.get('combined_total_budget') || 'Not specified'}\n`;

            const combinedPlans = formData.get('combined_plans');
            if (combinedPlans && combinedPlans.trim()) {
                summary += `Complete Vision: ${combinedPlans}\n`;
            }
            summary += `\n`;
        }

        summary += `=== TECHNICAL INFO ===\n`;
        summary += `Page URL: ${window.location.href}\n`;
        summary += `User Agent: ${navigator.userAgent}\n`;
        summary += `Form Version: Enhanced v2.0\n`;

        return summary;
    }

    // Debug methods for testing
    testValidation() {
        console.log('🧪 Testing form validation...');
        const testFields = document.querySelectorAll('.form-input, .form-select');
        testFields.forEach(field => {
            this.validateField(field);
        });
    }

    fillTestData() {
        console.log('🧪 Filling form with test data...');

        // Fill basic info
        const brideField = document.querySelector('input[name="bride_first_name"]');
        const groomField = document.querySelector('input[name="groom_first_name"]');
        const emailField = document.querySelector('input[name="email"]');

        if (brideField) brideField.value = 'Sarah';
        if (groomField) groomField.value = 'Michael';
        if (emailField) emailField.value = 'sarah.michael@example.com';

        console.log('✅ Test data filled');
    }
}

// ==========================================
// MOBILE MENU FUNCTIONALITY
// ==========================================

function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');

    if (toggle && mobileNav) {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

            toggle.classList.toggle('active');
            toggle.setAttribute('aria-expanded', !isExpanded);

            if (!isExpanded) {
                mobileNav.classList.add('active');
                mobileNav.style.display = 'block';
                mobileNav.offsetHeight; // Force reflow
            } else {
                mobileNav.classList.remove('active');
                setTimeout(() => {
                    mobileNav.style.display = 'none';
                }, 300);
            }
        });

        // Close mobile menu when clicking links
        const links = mobileNav.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                toggle.classList.remove('active');
                mobileNav.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
                setTimeout(() => {
                    mobileNav.style.display = 'none';
                }, 300);
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!toggle.contains(e.target) && !mobileNav.contains(e.target)) {
                toggle.classList.remove('active');
                mobileNav.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
                setTimeout(() => {
                    mobileNav.style.display = 'none';
                }, 300);
            }
        });
    }
    console.log('📱 Enhanced mobile menu initialized');
}

// ==========================================
// SMOOTH SCROLLING
// ==========================================

function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 100;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    console.log('🔗 Enhanced smooth scrolling initialized');
}

// ==========================================
// ENHANCED NAVBAR EFFECTS
// ==========================================

function initNavbarEffects() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    let ticking = false;
    let lastScrollY = 0;

    function updateNavbar() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Enhanced navbar styling based on scroll
        if (scrollTop > 50) {
            nav.style.background = 'rgba(250, 248, 245, 0.98)';
            nav.style.boxShadow = '0 4px 32px rgba(15, 95, 95, 0.12)';
            nav.style.backdropFilter = 'blur(30px)';
        } else {
            nav.style.background = 'rgba(250, 248, 245, 0.97)';
            nav.style.boxShadow = '0 1px 8px rgba(15, 95, 95, 0.04)';
            nav.style.backdropFilter = 'blur(25px)';
        }

        // Hide/show navbar on scroll (optional enhancement)
        if (scrollTop > lastScrollY && scrollTop > 200) {
            nav.style.transform = 'translateY(-100%)';
        } else {
            nav.style.transform = 'translateY(0)';
        }

        lastScrollY = scrollTop;
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateNavbar);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestTick, { passive: true });
    console.log('🎛️ Enhanced navbar effects initialized');
}

// ==========================================
// PERFORMANCE OPTIMIZATIONS
// ==========================================

function initPerformanceOptimizations() {
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (prefersReducedMotion.matches) {
        console.log('♿ Reduced motion detected for enhanced contact page');
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
    document.addEventListener('visibilitychange', () => {
        const elements = document.querySelectorAll('.fade-in-element, .form-step');
        elements.forEach(element => {
            if (document.hidden) {
                element.style.animationPlayState = 'paused';
            } else {
                element.style.animationPlayState = 'running';
            }
        });
    });

    // Optimize form performance
    const debouncedValidation = debounce((field) => {
        contactForm.validateField(field);
    }, 300);

    // Add debounced validation to form fields
    setTimeout(() => {
        const inputs = document.querySelectorAll('.form-input, .form-select, .form-textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => debouncedValidation(input));
        });
    }, 1000);

    console.log('⚡ Enhanced performance optimizations applied');
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==========================================
// ENHANCED FORM ANALYTICS
// ==========================================

function initFormAnalytics() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const inputs = form.querySelectorAll('.form-input, .form-select, .form-textarea');
    let hasInteracted = false;
    let interactionStartTime = null;
    let stepTimes = [];

    // Track form interaction start
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            if (!hasInteracted) {
                hasInteracted = true;
                interactionStartTime = Date.now();
                console.log('📊 User started enhanced form interaction');

                // Track with analytics if available
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'form_start', {
                        'event_category': 'enhanced_contact',
                        'custom_map': {
                            'dimension1': 'enhanced_form'
                        }
                    });
                }
            }
        });
    });

    // Track step completion times
    const originalNextStep = contactForm.nextStep;
    contactForm.nextStep = function() {
        stepTimes.push({
            step: this.currentStep,
            time: Date.now() - (interactionStartTime || Date.now())
        });

        console.log(`📊 Step ${this.currentStep} completed in ${stepTimes[stepTimes.length - 1].time}ms`);

        return originalNextStep.call(this);
    };

    // Track form abandonment
    let isSubmitting = false;
    form.addEventListener('submit', () => {
        isSubmitting = true;
    });

    window.addEventListener('beforeunload', () => {
        if (hasInteracted && !isSubmitting) {
            console.log('📊 Enhanced form abandonment detected');

            // Send analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'form_abandon', {
                    'event_category': 'enhanced_contact',
                    'custom_map': {
                        'dimension1': contactForm.currentStep,
                        'dimension2': contactForm.selectedCelebrationType || 'unknown'
                    }
                });
            }
        }
    });

    console.log('📊 Enhanced form analytics initialized');
}

// ==========================================
// GLOBAL VARIABLES
// ==========================================

let contactForm;

// ==========================================
// MANUAL TEST FUNCTIONS
// ==========================================

// Make test functions available globally for debugging
window.testEnhancedContactAnimations = function() {
    console.log('🧪 ENHANCED CONTACT MANUAL ANIMATION TEST');
    const elements = document.querySelectorAll('.fade-in-element');
    elements.forEach((element, index) => {
        console.log(`Testing enhanced contact element ${index + 1}:`, element);
        element.classList.toggle('is-visible');
    });
};

window.testFormFunctionality = function() {
    console.log('🧪 TESTING ENHANCED FORM FUNCTIONALITY');
    if (contactForm) {
        contactForm.fillTestData();
        contactForm.testValidation();
    }
};

window.testStepProgression = function() {
    console.log('🧪 TESTING STEP PROGRESSION');
    if (contactForm) {
        console.log('Current step:', contactForm.currentStep);
        contactForm.nextStep();
        console.log('After next:', contactForm.currentStep);
    }
};

// ==========================================
// INITIALIZATION
// ==========================================

// Initialize everything with proper timing
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Enhanced Contact DOM loaded, starting initialization...');

    // Initialize core functionality first
    initPerformanceOptimizations();
    initMobileMenu();
    initSmoothScrolling();
    initNavbarEffects();

    // Initialize the enhanced contact form
    contactForm = new EnhancedContactForm();

    // Initialize form analytics
    initFormAnalytics();

    // Initialize animations with delay to ensure CSS is ready
    setTimeout(() => {
        initBulletproofAnimations();
        console.log('🎉 ENHANCED CONTACT PAGE - ALL SYSTEMS INITIALIZED!');
        console.log('💡 Try typing "testEnhancedContactAnimations()" in console to manually test animations');
        console.log('💡 Try typing "testFormFunctionality()" to test form features');
        console.log('💡 Try typing "testStepProgression()" to test step navigation');
    }, 100);
});

// Additional debugging
window.addEventListener('load', () => {
    console.log('🏁 Enhanced contact page fully loaded');

    // Check if Formspree endpoint is configured
    const form = document.getElementById('contactForm');
    if (form && form.action.includes('YOUR_FORM_ID')) {
        console.warn('⚠️ Remember to update the Formspree form action URL with your actual form ID');
    }

    // Additional performance monitoring
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
            console.log(`🎨 ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
        });
    }
});

// Handle errors gracefully
window.addEventListener('error', (e) => {
    console.error('💥 Enhanced contact page error:', e);

    // Send error to analytics if available
    if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', {
            'description': e.message,
            'fatal': false
        });
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('💥 Unhandled promise rejection on enhanced contact page:', e);

    // Send error to analytics if available
    if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', {
            'description': e.reason,
            'fatal': false
        });
    }
});

console.log('✅ Enhanced Contact Page JavaScript fully loaded and ready!');