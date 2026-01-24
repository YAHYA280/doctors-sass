# Changelog

All notable changes to MediBook will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- Full demo mode with mock authentication - no backend required
- Auto-login as doctor in demo mode for instant access
- Unified auth provider supporting both demo and production modes
- Mock data for all dashboard features (appointments, patients, analytics, etc.)

### Changed
- Vercel cron schedule changed from hourly to daily (Hobby account compatibility)
- Middleware simplified for demo mode - bypasses auth checks
- All doctor API routes updated to work without session in demo mode
- Auth provider now uses custom context instead of NextAuth session in demo mode

### Fixed
- Fixed Vercel deployment error due to hourly cron job limit
- Fixed auth redirect error on Vercel (`/api/auth/error?error=Configuration`)
- Fixed session dependency issues in API routes for demo mode

---

## [1.0.0] - 2024-01-24

### Added
- Initial release of MediBook - Doctors SaaS booking platform
- Doctor dashboard with appointment management
- Patient management system
- Calendar view with availability settings
- Custom intake form builder
- Team member management
- Analytics and reporting
- Public booking pages for patients
- Multi-clinic support
- WhatsApp and email notifications
- Subscription management with Stripe
- Admin panel for platform management
- Support ticket system
- Real-time updates with Pusher

### Features by Plan
- **Free Trial**: 20 patients, 1 clinic, email notifications
- **Premium ($15/mo)**: 300 patients, unlimited clinics, WhatsApp, 3 team members
- **Advanced ($35/mo)**: Unlimited everything, API access, HIPAA tools

---

## Demo Mode

To run the app in demo mode (without database):

1. Set environment variable: `NEXT_PUBLIC_USE_MOCK_DATA="true"`
2. No database connection required
3. Login with demo credentials:
   - **Doctor**: doctor@demo.com / Demo123!
   - **Admin**: admin@demo.com / Admin123!

Demo mode provides full UI functionality with mock data for showcasing the platform.
