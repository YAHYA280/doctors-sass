# Doctor Management SaaS Platform

A comprehensive SaaS platform for healthcare professionals to manage their practice, appointments, and patient interactions.

## Features

### For Doctors
- **Custom Booking Page**: Personal booking link (`/dr/[your-slug]`) for patients
- **Appointment Management**: Full calendar view, status updates, patient communication
- **Patient Records**: Track patient history, form submissions, and visit history
- **Customizable Intake Forms**: Drag-and-drop form builder with conditional logic
- **Team Management**: Invite staff members with role-based access
- **Analytics Dashboard**: Track appointments, patient trends, and practice performance
- **Availability Management**: Set working hours and block time off

### For Patients
- **Easy Booking**: No account required, book via doctor's custom link
- **Self-Service Management**: Cancel or reschedule within 8 hours via unique token
- **Multi-channel Notifications**: Email and WhatsApp confirmations/reminders
- **Form Submissions**: Complete intake forms before appointments

### For Administrators
- **User Management**: Manage all platform users, activate/deactivate accounts
- **Subscription Management**: Monitor subscriptions, extend trials, manage billing
- **Platform Analytics**: Revenue tracking, growth metrics, top performers
- **Support Tickets**: Handle customer support requests

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js with JWT
- **Payments**: Stripe (subscriptions & one-time)
- **Notifications**: Twilio (WhatsApp), Resend/Nodemailer (Email)
- **Real-time**: Pusher
- **Rate Limiting**: Upstash Redis
- **UI**: shadcn/ui + Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Drag & Drop**: @dnd-kit

## Subscription Plans

| Feature | Free Trial | Premium ($15/mo) | Advanced ($35/mo) |
|---------|------------|------------------|-------------------|
| Trial Period | 14 days | - | - |
| Max Patients/Month | 20 | 300 | Unlimited |
| Clinics | 1 | Unlimited | Unlimited |
| Team Members | 0 | 3 | Unlimited |
| Custom Forms | Basic | Advanced | Advanced |
| Form Conditional Logic | No | Yes | Yes |
| Notifications | Email | Email + WhatsApp | Email + WhatsApp |
| Analytics | Basic | Detailed | Comprehensive |
| API Access | No | No | Yes |
| HIPAA Tools | No | No | Yes |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account
- Twilio account (for WhatsApp)
- Pusher account (for real-time)
- Upstash Redis account (for rate limiting)

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/doctors_saas

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_ADVANCED_PRICE_ID=price_...

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Email
EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_...

# Pusher
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=us2
NEXT_PUBLIC_PUSHER_KEY=...
NEXT_PUBLIC_PUSHER_CLUSTER=us2

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Cron Secret
CRON_SECRET=your-cron-secret
```

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd doctors-saas
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run db:generate
npm run db:migrate
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Database Commands

```bash
# Generate migrations from schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio

# Push schema directly (development only)
npm run db:push
```

## Project Structure

```
├── app/
│   ├── (auth)/             # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── admin/              # Admin dashboard
│   │   ├── analytics/
│   │   ├── subscriptions/
│   │   ├── support/
│   │   └── users/
│   ├── api/                # API routes
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── booking/
│   │   ├── cron/
│   │   ├── doctors/
│   │   ├── notifications/
│   │   └── webhooks/
│   ├── appointment/        # Patient appointment management
│   ├── dashboard/          # Doctor dashboard
│   │   ├── analytics/
│   │   ├── appointments/
│   │   ├── calendar/
│   │   ├── forms/
│   │   ├── my-page/
│   │   ├── patients/
│   │   ├── settings/
│   │   └── team/
│   ├── dr/                 # Public booking pages
│   │   └── [doctor-slug]/
│   └── page.tsx            # Landing page
├── components/
│   ├── forms/              # Form builder components
│   ├── layouts/            # Layout components
│   └── ui/                 # shadcn/ui components
├── constants/              # App constants
├── hooks/                  # Custom React hooks
├── lib/
│   ├── auth/               # NextAuth configuration
│   ├── db/                 # Database schema & connection
│   └── validators/         # Zod schemas
├── services/               # External service integrations
│   ├── email.ts
│   ├── pusher.ts
│   ├── stripe.ts
│   └── whatsapp.ts
└── types/                  # TypeScript types
```

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Doctor Routes
- `GET/PATCH /api/doctors/profile` - Doctor profile management
- `GET/POST/PATCH/DELETE /api/doctors/appointments` - Appointment management
- `GET/PUT/POST/DELETE /api/doctors/availability` - Availability settings
- `GET /api/doctors/patients` - Patient list
- `GET/POST/PUT/DELETE /api/doctors/forms` - Form templates
- `GET/POST/PATCH/DELETE /api/doctors/team` - Team management
- `GET /api/doctors/analytics` - Analytics data

### Booking Routes
- `GET /api/booking/[doctor-slug]` - Get doctor's booking info
- `GET /api/booking/available-slots` - Get available time slots
- `POST /api/booking/submit` - Submit new booking
- `GET/PATCH/DELETE /api/booking/manage` - Patient self-service

### Admin Routes
- `GET/PATCH/DELETE/POST /api/admin/users` - User management
- `GET /api/admin/analytics` - Platform analytics
- `GET/PATCH /api/admin/subscriptions` - Subscription management
- `GET/POST/PATCH /api/admin/tickets` - Support tickets

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler

### Cron Jobs
- `GET /api/cron/reminders` - Send appointment reminders

## Security

- **Authentication**: JWT-based with NextAuth.js
- **Authorization**: Role-based access control (Admin, Doctor, Patient)
- **Rate Limiting**: Upstash Redis-based rate limiting on all endpoints
- **Validation**: Zod schema validation on all inputs
- **SQL Injection**: Protected via Drizzle ORM parameterized queries
- **XSS Protection**: React's built-in escaping + sanitization
- **CSRF Protection**: NextAuth.js built-in CSRF tokens
- **Password Hashing**: bcrypt with salt rounds

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Cron Jobs

Configure Vercel cron jobs in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details
