/**
 * Aisle to Islands - Form & Email API
 * Handles inquiry form submissions and sends emails via Resend
 */

const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Jessica's email for receiving inquiries
const JESSICA_EMAIL = process.env.JESSICA_EMAIL || 'planning@aisle-to-islands.com';

// CORS configuration - only allow requests from the production site
const corsOptions = {
    origin: [
        'https://aisle-to-islands.com',
        'https://www.aisle-to-islands.com',
        // Allow localhost for development
        'http://localhost:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:63342',
        'http://127.0.0.1:63342'
    ],
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: false
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load email templates
const getAutoresponderTemplate = () => {
    const templatePath = path.join(__dirname, 'templates', 'inquiry-autoresponder.html');
    return fs.readFileSync(templatePath, 'utf8');
};

const getNotificationTemplate = () => {
    const templatePath = path.join(__dirname, 'templates', 'inquiry-notification.html');
    return fs.readFileSync(templatePath, 'utf8');
};

// Service name mapping
const getServiceDescription = (service) => {
    const serviceMap = {
        'destination-wedding': 'Destination Wedding',
        'curated-honeymoon': 'Honeymoon',
        'both-services': 'Destination Wedding & Honeymoon',
        'other': 'Other Services'
    };
    return serviceMap[service] || service || 'Not specified';
};

// Wedding package mapping
const getPackageDescription = (pkg) => {
    const packageMap = {
        'exploration-service': 'Exploration Service ($7,500)',
        'full-service': 'Comprehensive Service Planning (Starting at $10,000 + 10%)'
    };
    return packageMap[pkg] || pkg || 'Not selected';
};

// Referral source mapping
const getReferralDescription = (source) => {
    const sourceMap = {
        'past-client': 'Past Client Referral',
        'google': 'Google Search',
        'social-media': 'Social Media (Instagram/Facebook)',
        'venue': 'Wedding Venue Recommendation',
        'friend-family': 'Friend/Family Recommendation',
        'wedding-website': 'Wedding Website (The Knot, etc.)',
        'other': 'Other'
    };
    return sourceMap[source] || source || 'Not specified';
};

// Format date for display
const formatDate = (dateStr) => {
    if (!dateStr) return 'Not specified';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return dateStr;
    }
};

// Format currency
const formatCurrency = (amount) => {
    if (!amount) return 'Not specified';
    const num = parseInt(amount);
    if (isNaN(num)) return amount;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
    }).format(num);
};

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'aisle-to-islands-email-api',
        timestamp: new Date().toISOString()
    });
});

/**
 * Main Form Submission Endpoint
 * Receives inquiry form data, sends auto-responder to user and notification to Jessica
 */
app.post('/submit-inquiry', async (req, res) => {
    console.log('📬 Received form submission');

    try {
        const formData = req.body;

        // Check honeypot field for spam
        if (formData.website) {
            console.log('🍯 Honeypot triggered - bot detected');
            // Return success to not alert bots
            return res.json({ success: true });
        }

        // Extract form fields
        const brideName = formData.brides_name || 'there';
        const groomName = formData.grooms_name || 'Not provided';
        const email = formData.email;
        const phone = formData.phone || 'Not provided';
        const celebrationDate = formData.celebration_date;
        const service = formData['services[]'] || formData.services;
        const weddingPackage = formData.wedding_package;
        const location = formData.celebration_location || 'Not specified';
        const investment = formData.planned_investment;
        const guestCount = formData.guest_count;
        const additionalInfo = formData.additional_info || 'None provided';
        const referralSource = formData.referral_source;

        // Validate required email field
        if (!email) {
            console.error('❌ Missing email address');
            return res.status(400).json({
                success: false,
                error: 'Email address is required'
            });
        }

        // Prepare template data
        const templateData = {
            brideName,
            groomName,
            email,
            phone,
            celebrationDate: formatDate(celebrationDate),
            service: getServiceDescription(service),
            weddingPackage: getPackageDescription(weddingPackage),
            location,
            investment: formatCurrency(investment),
            guestCount: guestCount || 'Not specified',
            additionalInfo,
            referralSource: getReferralDescription(referralSource),
            submittedAt: new Date().toLocaleString('en-US', {
                timeZone: 'America/Los_Angeles',
                dateStyle: 'full',
                timeStyle: 'short'
            })
        };

        // Send both emails concurrently
        const [autoresponderResult, notificationResult] = await Promise.all([
            // 1. Auto-responder to user
            sendAutoresponder(email, brideName, groomName),
            // 2. Notification to Jessica
            sendNotification(templateData)
        ]);

        if (autoresponderResult.error) {
            console.error('❌ Auto-responder error:', autoresponderResult.error);
        } else {
            console.log(`✅ Auto-responder sent to ${email}`);
        }

        if (notificationResult.error) {
            console.error('❌ Notification error:', notificationResult.error);
        } else {
            console.log(`✅ Notification sent to Jessica`);
        }

        // Log inquiry summary
        console.log('📋 Inquiry:', {
            couple: `${brideName} & ${groomName}`,
            service: templateData.service,
            date: templateData.celebrationDate,
            location
        });

        res.json({
            success: true,
            message: 'Inquiry received successfully'
        });

    } catch (error) {
        console.error('❌ Form processing error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process inquiry. Please try again.'
        });
    }
});

/**
 * Send auto-responder email to user
 */
async function sendAutoresponder(email, brideName, groomName) {
    try {
        let emailHtml = getAutoresponderTemplate();
        emailHtml = emailHtml.replace(/\{\{BRIDE_NAME\}\}/g, brideName);
        emailHtml = emailHtml.replace(/\{\{GROOM_NAME\}\}/g, groomName);

        const result = await resend.emails.send({
            from: 'Jessica Lueken <jessica@aisle-to-islands.com>',
            to: email,
            subject: 'Thank You for Your Inquiry | Aisle to Islands',
            html: emailHtml,
            replyTo: JESSICA_EMAIL
        });

        return result;
    } catch (error) {
        return { error };
    }
}

/**
 * Send notification email to Jessica
 */
async function sendNotification(data) {
    try {
        let emailHtml = getNotificationTemplate();

        // Replace all template placeholders
        emailHtml = emailHtml
            .replace(/\{\{BRIDE_NAME\}\}/g, data.brideName)
            .replace(/\{\{GROOM_NAME\}\}/g, data.groomName)
            .replace(/\{\{EMAIL\}\}/g, data.email)
            .replace(/\{\{PHONE\}\}/g, data.phone)
            .replace(/\{\{CELEBRATION_DATE\}\}/g, data.celebrationDate)
            .replace(/\{\{SERVICE\}\}/g, data.service)
            .replace(/\{\{WEDDING_PACKAGE\}\}/g, data.weddingPackage)
            .replace(/\{\{LOCATION\}\}/g, data.location)
            .replace(/\{\{INVESTMENT\}\}/g, data.investment)
            .replace(/\{\{GUEST_COUNT\}\}/g, data.guestCount)
            .replace(/\{\{ADDITIONAL_INFO\}\}/g, data.additionalInfo)
            .replace(/\{\{REFERRAL_SOURCE\}\}/g, data.referralSource)
            .replace(/\{\{SUBMITTED_AT\}\}/g, data.submittedAt);

        const result = await resend.emails.send({
            from: 'Aisle to Islands <inquiries@aisle-to-islands.com>',
            to: JESSICA_EMAIL,
            subject: `New Inquiry: ${data.brideName} & ${data.groomName} - ${data.service}`,
            html: emailHtml,
            replyTo: data.email
        });

        return result;
    } catch (error) {
        return { error };
    }
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Aisle to Islands Email API running on port ${PORT}`);
    console.log(`📧 Resend API key: ${process.env.RESEND_API_KEY ? 'Configured' : 'NOT SET'}`);
    console.log(`📬 Notifications will be sent to: ${JESSICA_EMAIL}`);
});