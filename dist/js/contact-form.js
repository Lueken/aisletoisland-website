/**
 * CONTACT FORM MODULE
 * Handles form validation, submission, and service pre-selection
 * Depends on: core.js
 */

class ContactFormHandler {
    constructor() {
        this.form = null;
        this.submitBtn = null;
        this.successMessage = null;
        this.errorMessage = null;
        this.isSubmitting = false;
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================

    init() {
        console.log('📝 Initializing Contact Form...');

        this.form = document.getElementById('contactForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.successMessage = document.getElementById('successMessage');
        this.errorMessage = document.getElementById('errorMessage');

        if (!this.form) {
            console.warn('⚠️ Contact form not found');
            return;
        }

        this.bindEvents();
        this.setMinDate();
        this.autoSelectService();

        console.log('✅ Contact Form initialized');
    }

    // ==========================================
    // EVENT BINDING
    // ==========================================

    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Real-time validation
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => FormUtils.clearFieldErrors(input));
        });
    }

    // ==========================================
    // URL PARAMETER HANDLING
    // ==========================================

    autoSelectService() {
        const serviceParam = UrlUtils.getParameter('service');

        if (serviceParam) {
            const radioButton = document.getElementById(serviceParam);
            if (radioButton) {
                radioButton.checked = true;
                this.highlightPreselectedService(radioButton);
                console.log(`✅ Auto-selected service: ${serviceParam}`);
            }
        }
    }

    highlightPreselectedService(radioButton) {
        const formGroup = radioButton.closest('.form-group');
        if (formGroup) {
            formGroup.style.background = 'rgba(15, 95, 95, 0.05)';
            formGroup.style.borderRadius = '8px';
            formGroup.style.padding = '15px';
            formGroup.style.transition = 'all 0.3s ease';

            // Remove highlight after 3 seconds
            setTimeout(() => {
                formGroup.style.background = '';
                formGroup.style.padding = '';
            }, 3000);
        }
    }

    // ==========================================
    // VALIDATION
    // ==========================================

    validateField(field) {
        const isRequired = field.hasAttribute('required');
        const value = field.value.trim();

        FormUtils.clearFieldErrors(field);

        if (isRequired && !value) {
            FormUtils.setFieldError(field, 'This field is required');
            return false;
        }

        // Email validation
        if (field.type === 'email' && value) {
            if (!FormUtils.validateEmail(value)) {
                FormUtils.setFieldError(field, 'Please enter a valid email address');
                return false;
            }
        }

        // Phone validation
        if (field.name === 'phone' && value) {
            if (!FormUtils.validatePhone(value)) {
                FormUtils.setFieldError(field, 'Please enter a valid phone number');
                return false;
            }
        }

        // Services validation
        if (field.name === 'services[]') {
            const checkboxes = document.querySelectorAll('input[name="services[]"]');
            const checkedBoxes = Array.from(checkboxes).filter(cb => cb.checked);

            if (checkedBoxes.length === 0) {
                FormUtils.setFieldError(checkboxes[0], 'Please select at least one service');
                return false;
            }
        }

        // Investment validation
        if (field.name === 'planned_investment' && value) {
            const investment = parseInt(value);
            if (investment < 1000) {
                FormUtils.setFieldError(field, 'Please enter a realistic investment amount');
                return false;
            }
        }

        // Guest count validation
        if (field.name === 'guest_count' && value) {
            const guestCount = parseInt(value);
            if (guestCount < 1 || guestCount > 500) {
                FormUtils.setFieldError(field, 'Please enter a realistic guest count (1-500)');
                return false;
            }
        }

        return true;
    }

    validateForm() {
        const requiredFields = this.form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        // Validate services selection
        const checkboxes = document.querySelectorAll('input[name="services[]"]');
        const checkedBoxes = Array.from(checkboxes).filter(cb => cb.checked);

        if (checkedBoxes.length === 0) {
            FormUtils.setFieldError(checkboxes[0], 'Please select at least one service');
            isValid = false;
        }

        return isValid;
    }

    // ==========================================
    // FORM SUBMISSION
    // ==========================================

    async handleSubmit() {
        if (this.isSubmitting) return;

        if (!this.validateForm()) {
            this.scrollToFirstError();
            return;
        }

        this.setLoadingState(true);

        try {
            const formData = new FormData(this.form);

            // Add metadata
            formData.append('form_submitted_at', new Date().toISOString());
            formData.append('user_agent', navigator.userAgent);
            formData.append('page_url', window.location.href);

            console.log('📤 Submitting form to Formspree:', Object.fromEntries(formData));

            const response = await fetch(this.form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                this.showSuccess();
                this.trackConversion();
            } else {
                const data = await response.json();
                console.error('Formspree error:', data);

                if (data && data.errors) {
                    throw new Error(`Validation error: ${data.errors.map(e => e.message).join(', ')}`);
                } else {
                    throw new Error(`Server error: ${response.status}`);
                }
            }

        } catch (error) {
            console.error('Form submission error:', error);
            this.showError();
        } finally {
            this.setLoadingState(false);
        }
    }

    // ==========================================
    // UI STATE MANAGEMENT
    // ==========================================

    setLoadingState(loading) {
        this.isSubmitting = loading;

        if (this.submitBtn) {
            this.submitBtn.disabled = loading;
            this.submitBtn.classList.toggle('loading', loading);
            this.submitBtn.textContent = loading ? 'Sending...' : 'Send My Inquiry';
        }
    }

    showSuccess() {
        if (this.form && this.successMessage) {
            this.form.style.display = 'none';
            this.successMessage.style.display = 'block';
            this.successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    showError() {
        if (this.errorMessage) {
            this.errorMessage.style.display = 'block';
            this.errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        this.setLoadingState(false);
    }

    scrollToFirstError() {
        const firstError = this.form.querySelector('.error-text');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================

    setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.querySelector('input[type="date"]');
        if (dateInput) {
            dateInput.min = today;
        }
    }

    trackConversion() {
        // Google Analytics conversion tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'form_submit', {
                'event_category': 'contact',
                'event_label': 'contact_form',
                'value': 1
            });
        }

        // Facebook Pixel (if implemented)
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Lead');
        }

        console.log('📊 Conversion tracked');
    }

    // ==========================================
    // PUBLIC API
    // ==========================================

    reset() {
        if (this.form) {
            this.form.reset();
            this.form.style.display = 'block';
        }

        if (this.successMessage) {
            this.successMessage.style.display = 'none';
        }

        if (this.errorMessage) {
            this.errorMessage.style.display = 'none';
        }

        // Clear all field errors
        this.form.querySelectorAll('.error-text').forEach(error => error.remove());
        this.form.querySelectorAll('.form-group').forEach(group => {
            group.style.borderColor = '';
        });

        this.setLoadingState(false);
        console.log('🔄 Form reset');
    }

    getFormData() {
        if (!this.form) return null;

        const formData = new FormData(this.form);
        return Object.fromEntries(formData);
    }
}

// ==========================================
// INTEGRATION WITH CORE
// ==========================================

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on a page with a contact form
    if (document.getElementById('contactForm')) {
        window.ContactForm = new ContactFormHandler();
        window.ContactForm.init();
    }
});

// Expose globally for debugging
window.ContactFormHandler = ContactFormHandler;