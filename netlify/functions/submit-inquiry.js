/**
 * Netlify Function: Submit Inquiry
 * Handles inquiry form submissions and sends emails via Resend
 */

const { Resend } = require('resend');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Jessica's email for receiving inquiries
const JESSICA_EMAIL = process.env.JESSICA_EMAIL || 'planning@aisle-to-islands.com';

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

// Auto-responder email template
const getAutoresponderTemplate = (brideName, groomName) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You for Your Inquiry | Aisle to Islands</title>
</head>
<body style="margin: 0; padding: 0; background-color: #faf8f5; font-family: 'Georgia', 'Times New Roman', serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #faf8f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 4px; box-shadow: 0 4px 24px rgba(15, 95, 95, 0.08);">
                    <tr>
                        <td align="center" style="padding: 48px 40px 32px 40px; border-bottom: 1px solid #f0ebe6;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center">
                                        <img src="https://aisle-to-islands.com/images/logos/aisle-to-islands-logo.png" alt="Aisle to Islands" width="80" height="80" style="display: block; border: 0;">
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 16px;">
                                        <span style="font-family: Georgia, serif; font-size: 24px; color: #0f5f5f; letter-spacing: 2px; text-transform: uppercase;">Aisle to Islands</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 48px 48px 32px 48px;">
                            <p style="margin: 0 0 24px 0; font-family: Georgia, serif; font-size: 18px; color: #2c2c2c; line-height: 1.6;">
                                Hello ${brideName} & ${groomName},
                            </p>
                            <p style="margin: 0 0 24px 0; font-family: Georgia, serif; font-size: 16px; color: #4a4a4a; line-height: 1.8;">
                                Thank you for filling out Aisle to Islands' Inquiry Form; I am excited to get to know more about your vision!
                            </p>
                            <p style="margin: 0 0 24px 0; font-family: Georgia, serif; font-size: 16px; color: #4a4a4a; line-height: 1.8;">
                                As I'm sure you've guessed, this is an auto-responder; I just wanted you to be sure that your inquiry is in my inbox. You'll be receiving a personalized email from me within the next two business days.
                            </p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="padding: 24px 0;">
                                        <div style="height: 1px; background: linear-gradient(to right, transparent, #d4956b, transparent);"></div>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 20px 0; font-family: Georgia, serif; font-size: 16px; color: #4a4a4a; line-height: 1.8;">
                                In the meantime, if you haven't already, please feel free to check out <strong style="color: #0f5f5f;">The Legacy Wedding Blueprint</strong>. It's a workbook I've designed to help you uncover your family heritage, clarify your values, and create decision-making frameworks.
                            </p>
                            <p style="margin: 0 0 32px 0; font-family: Georgia, serif; font-size: 16px; color: #4a4a4a; line-height: 1.8;">
                                Even if you're looking for honeymoon or family travel, and not wanting to plan a wedding with me, I still believe that The Legacy Wedding Blueprint is a great resource for couples to become better connected, as well as receive practical insights into how you can relate to and understand each other.
                            </p>
                            <p style="margin: 0 0 32px 0; font-family: Georgia, serif; font-size: 16px; color: #6a6a6a; font-style: italic; line-height: 1.8;">
                                I highly recommend it, and not just because I created it!
                            </p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                                <tr>
                                    <td align="center" style="border-radius: 4px; background-color: #0f5f5f;">
                                        <a href="https://legacy.aisle-to-islands.com" target="_blank" style="display: inline-block; padding: 16px 40px; font-family: Georgia, serif; font-size: 14px; color: #ffffff; text-decoration: none; letter-spacing: 2px; text-transform: uppercase;">Explore the Blueprint</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 48px 48px 48px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="padding: 32px 0 24px 0;">
                                        <div style="height: 1px; background: linear-gradient(to right, transparent, #d4956b, transparent);"></div>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 8px 0; font-family: Georgia, serif; font-size: 16px; color: #4a4a4a; line-height: 1.6;">
                                You'll be hearing from me personally soon,
                            </p>
                            <p style="margin: 24px 0 0 0; font-family: 'Brush Script MT', cursive; font-size: 32px; color: #0f5f5f;">
                                Jessica Lueken
                            </p>
                            <p style="margin: 4px 0 0 0; font-family: Georgia, serif; font-size: 14px; color: #6a6a6a; letter-spacing: 1px;">
                                Founder, Aisle to Islands
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px 48px; background-color: #f9f7f4; border-top: 1px solid #f0ebe6; border-radius: 0 0 4px 4px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 16px 0; font-family: Georgia, serif; font-size: 13px; color: #6a6a6a;">
                                            <a href="https://aisle-to-islands.com" style="color: #0f5f5f; text-decoration: none;">Website</a>
                                            &nbsp;&nbsp;|&nbsp;&nbsp;
                                            <a href="https://www.instagram.com/aisletoislands" style="color: #0f5f5f; text-decoration: none;">Instagram</a>
                                            &nbsp;&nbsp;|&nbsp;&nbsp;
                                            <a href="https://aisle-to-islands.com/blog.html" style="color: #0f5f5f; text-decoration: none;">Blog</a>
                                        </p>
                                        <p style="margin: 0; font-family: Georgia, serif; font-size: 12px; color: #9a9a9a;">
                                            &copy; 2025 Aisle to Islands. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px;">
                    <tr>
                        <td align="center" style="padding: 24px 20px;">
                            <p style="margin: 0; font-family: Georgia, serif; font-size: 12px; color: #9a9a9a; line-height: 1.6;">
                                You received this email because you submitted an inquiry at aisle-to-islands.com.<br>
                                This is a one-time confirmation email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

// Notification email template for Jessica
const getNotificationTemplate = (data) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Inquiry | Aisle to Islands</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f3f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f3f0;">
        <tr>
            <td align="center" style="padding: 32px 16px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <tr>
                        <td style="padding: 32px 32px 24px 32px; background-color: #0f5f5f; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff;">
                                New Wedding & Travel Inquiry
                            </h1>
                            <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.8);">
                                Submitted ${data.submittedAt}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px 32px 0 32px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #faf8f5; border-radius: 8px; padding: 24px;">
                                <tr>
                                    <td>
                                        <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #0f5f5f; font-weight: 600;">
                                            ${data.brideName} & ${data.groomName}
                                        </h2>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6a6a6a;">Email</span><br>
                                                    <a href="mailto:${data.email}" style="font-size: 15px; color: #0f5f5f; text-decoration: none;">${data.email}</a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6a6a6a;">Phone</span><br>
                                                    <a href="tel:${data.phone}" style="font-size: 15px; color: #2c2c2c; text-decoration: none;">${data.phone}</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 32px 0 32px;">
                            <h3 style="margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6a6a6a; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px;">
                                Event Details
                            </h3>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td width="50%" style="padding: 8px 8px 8px 0; vertical-align: top;">
                                        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6a6a6a;">Service</span><br>
                                        <span style="font-size: 15px; color: #2c2c2c; font-weight: 500;">${data.service}</span>
                                    </td>
                                    <td width="50%" style="padding: 8px 0 8px 8px; vertical-align: top;">
                                        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6a6a6a;">Wedding Package</span><br>
                                        <span style="font-size: 15px; color: #2c2c2c;">${data.weddingPackage}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td width="50%" style="padding: 8px 8px 8px 0; vertical-align: top;">
                                        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6a6a6a;">Celebration Date</span><br>
                                        <span style="font-size: 15px; color: #2c2c2c;">${data.celebrationDate}</span>
                                    </td>
                                    <td width="50%" style="padding: 8px 0 8px 8px; vertical-align: top;">
                                        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6a6a6a;">Location</span><br>
                                        <span style="font-size: 15px; color: #2c2c2c;">${data.location}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td width="50%" style="padding: 8px 8px 8px 0; vertical-align: top;">
                                        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6a6a6a;">Planned Investment</span><br>
                                        <span style="font-size: 15px; color: #0f5f5f; font-weight: 600;">${data.investment}</span>
                                    </td>
                                    <td width="50%" style="padding: 8px 0 8px 8px; vertical-align: top;">
                                        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6a6a6a;">Guest Count</span><br>
                                        <span style="font-size: 15px; color: #2c2c2c;">${data.guestCount}</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 32px 0 32px;">
                            <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6a6a6a; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px;">
                                Greatest Challenge
                            </h3>
                            <p style="margin: 0; font-size: 15px; color: #2c2c2c; line-height: 1.6; background-color: #faf8f5; padding: 16px; border-radius: 6px; border-left: 3px solid #d4956b;">
                                ${data.additionalInfo}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 32px 0 32px;">
                            <h3 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6a6a6a;">
                                How They Found Us
                            </h3>
                            <p style="margin: 0; font-size: 15px; color: #2c2c2c;">
                                ${data.referralSource}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                                <tr>
                                    <td style="border-radius: 6px; background-color: #0f5f5f;">
                                        <a href="mailto:${data.email}?subject=Re: Your Aisle to Islands Inquiry" style="display: inline-block; padding: 14px 32px; font-size: 14px; color: #ffffff; text-decoration: none; font-weight: 500;">
                                            Reply to ${data.brideName}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 32px; background-color: #f5f3f0; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e5e5;">
                            <p style="margin: 0; font-size: 12px; color: #6a6a6a; text-align: center;">
                                This inquiry was submitted via aisle-to-islands.com<br>
                                An auto-responder has been sent to the client.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

// Main handler
exports.handler = async (event, context) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse form data
        const formData = JSON.parse(event.body);

        // Check honeypot for spam
        if (formData.website) {
            console.log('🍯 Honeypot triggered - bot detected');
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: true })
            };
        }

        // Extract form fields
        const brideName = formData.brides_name || 'there';
        const groomName = formData.grooms_name || 'Partner';
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

        // Validate email
        if (!email) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: false, error: 'Email address is required' })
            };
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
            // Auto-responder to user
            resend.emails.send({
                from: 'Jessica Lueken <jessica@aisle-to-islands.com>',
                to: email,
                subject: 'Thank You for Your Inquiry | Aisle to Islands',
                html: getAutoresponderTemplate(brideName, groomName),
                replyTo: JESSICA_EMAIL
            }),
            // Notification to Jessica
            resend.emails.send({
                from: 'Aisle to Islands <inquiries@aisle-to-islands.com>',
                to: JESSICA_EMAIL,
                subject: `New Inquiry: ${brideName} & ${groomName} - ${templateData.service}`,
                html: getNotificationTemplate(templateData),
                replyTo: email
            })
        ]);

        console.log('✅ Emails sent:', {
            autoresponder: autoresponderResult.data?.id,
            notification: notificationResult.data?.id
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true, message: 'Inquiry received successfully' })
        };

    } catch (error) {
        console.error('❌ Error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: false, error: 'Failed to process inquiry' })
        };
    }
};
