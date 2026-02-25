# Aisle to Islands - Form & Email API

Express.js API that handles inquiry form submissions and sends emails via Resend.

## Architecture

```
User submits form → Railway API → Resend → Auto-responder to user
                              ↘→ Resend → Notification to Jessica
```

This replaces Formspree entirely - all form handling and email sending happens through your own API.

## Setup

### 1. Deploy to Railway

**Option A: Add to existing Railway project**
1. In your Railway project, create a new service
2. Connect this repo and set the root directory to `/api`
3. Add environment variables (see below)

**Option B: Deploy as new project**
```bash
cd api
npm install
railway init
railway up
```

### 2. Configure Environment Variables

In Railway, add these variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes | Your Resend API key (sending access only) |
| `JESSICA_EMAIL` | No | Override recipient email (default: jessica@aisle-to-islands.com) |

### 3. Configure Resend Domain

1. Go to [resend.com](https://resend.com) → Domains
2. Add and verify `aisle-to-islands.com`
3. This allows sending from `jessica@aisle-to-islands.com` and `inquiries@aisle-to-islands.com`

### 4. Update Form Endpoint

The form in `dist/inquire.html` needs to point to your Railway URL:

```html
<form id="contactForm" data-api-endpoint="https://YOUR-APP.up.railway.app/submit-inquiry">
```

## API Endpoints

### `GET /health`
Health check for Railway.

### `POST /submit-inquiry`
Main form submission endpoint. Sends two emails:
1. **Auto-responder** to the user (from jessica@aisle-to-islands.com)
2. **Notification** to Jessica with all inquiry details

**Request body:**
```json
{
  "brides_name": "Jane",
  "grooms_name": "John",
  "email": "jane@example.com",
  "phone": "555-123-4567",
  "celebration_date": "2026-06-15",
  "services[]": "destination-wedding",
  "wedding_package": "full-service",
  "celebration_location": "Tuscany, Italy",
  "planned_investment": "50000",
  "guest_count": "75",
  "additional_info": "Looking for vineyard venues",
  "referral_source": "google"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Inquiry received successfully"
}
```

## Email Templates

Located in `/templates`:

- `inquiry-autoresponder.html` - Thank you email sent to user
- `inquiry-notification.html` - Inquiry details sent to Jessica

### Template Variables

**Auto-responder:**
- `{{BRIDE_NAME}}` - Bride's first name

**Notification:**
- `{{BRIDE_NAME}}`, `{{GROOM_NAME}}` - Names
- `{{EMAIL}}`, `{{PHONE}}` - Contact info
- `{{SERVICE}}`, `{{WEDDING_PACKAGE}}` - Service selections
- `{{CELEBRATION_DATE}}`, `{{LOCATION}}` - Event details
- `{{INVESTMENT}}`, `{{GUEST_COUNT}}` - Budget info
- `{{ADDITIONAL_INFO}}` - Their biggest challenge
- `{{REFERRAL_SOURCE}}` - How they found you
- `{{SUBMITTED_AT}}` - Submission timestamp (PST)

## Local Development

```bash
cd api
npm install

# Create .env file
cp .env.example .env
# Add your RESEND_API_KEY

npm run dev
```

Test submission:
```bash
curl -X POST http://localhost:3000/submit-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "brides_name": "Test",
    "grooms_name": "User",
    "email": "your@email.com",
    "phone": "555-1234",
    "celebration_date": "2026-06-15",
    "services[]": "destination-wedding",
    "celebration_location": "Test Location",
    "planned_investment": "25000",
    "guest_count": "50"
  }'
```

## CORS

Configured to accept requests from:
- `https://aisle-to-islands.com`
- `https://www.aisle-to-islands.com`
- `localhost` (for development)

## Spam Protection

- Honeypot field (`website`) - bots fill this, humans don't
- CORS restrictions - only your domain can submit