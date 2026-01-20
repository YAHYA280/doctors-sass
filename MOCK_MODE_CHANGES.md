# Mock Mode Implementation Changes

This document tracks all changes made to implement mock data mode for UI testing without a database connection.

## Overview

Mock mode allows the application to run with sample data without requiring a PostgreSQL database connection. This is useful for:
- UI/UX testing and development
- Demonstrating the application
- Frontend development without backend dependencies

## How to Enable Mock Mode

Mock mode is automatically enabled when either:
1. `DATABASE_URL` environment variable is not set, OR
2. `NEXT_PUBLIC_USE_MOCK_DATA=true` is set in `.env.local`

### Current `.env.local` Configuration
```env
# Database (commented out for mock mode)
# DATABASE_URL="postgresql://user:password@localhost:5432/doctor_saas"

# Enable mock mode for UI testing without database
NEXT_PUBLIC_USE_MOCK_DATA="true"
```

## Mock Login Credentials

| Role   | Email              | Password   |
|--------|-------------------|------------|
| Doctor | doctor@demo.com   | Demo123!   |
| Admin  | admin@demo.com    | Admin123!  |

---

## Files Created

### 1. `lib/mock-data.ts`
Central mock data file containing all sample data:

- **MOCK_USERS** - Login credentials for doctor and admin
- **MOCK_DOCTOR** - Sample doctor profile (Dr. Sarah Johnson)
- **MOCK_PATIENTS** - 6 sample patients with medical history
- **MOCK_APPOINTMENTS** - 8 sample appointments (past, today, tomorrow)
- **MOCK_AVAILABILITY** - Weekly availability schedule (Mon-Fri)
- **MOCK_BLOCKED_SLOTS** - Sample blocked time slots
- **MOCK_TEAM_MEMBERS** - 3 team members (active and pending)
- **MOCK_FORM_TEMPLATES** - 2 intake forms with fields
- **MOCK_NOTIFICATIONS** - 3 sample notifications
- **MOCK_ADMIN_USERS** - 4 users for admin dashboard
- **MOCK_ADMIN_ANALYTICS** - Dashboard statistics
- **MOCK_SUPPORT_TICKETS** - 3 support tickets with replies
- **MOCK_DOCTOR_ANALYTICS** / **MOCK_ANALYTICS** - Doctor dashboard analytics

**Important:** All dates are stored as ISO strings (not Date objects) to prevent hydration mismatches between server and client.

---

## Files Modified

### 2. `lib/auth/config.ts`
Updated NextAuth configuration to support mock authentication:

**Changes:**
- Added conditional database imports (only loads DB modules when not in mock mode)
- Added mock credential validation in `authorize()` function
- Mock mode checks `MOCK_USERS.doctor` and `MOCK_USERS.admin` credentials
- Returns mock user session data including `doctorId`, `doctorSlug`, `subscriptionPlan`

```typescript
// Mock mode authentication
if (IS_MOCK_MODE || !db) {
  if (credentials.email === MOCK_USERS.doctor.email &&
      credentials.password === MOCK_USERS.doctor.password) {
    return {
      id: MOCK_USERS.doctor.id,
      email: MOCK_USERS.doctor.email,
      role: MOCK_USERS.doctor.role,
      doctorId: MOCK_DOCTOR.id,
      doctorSlug: MOCK_DOCTOR.slug,
      subscriptionPlan: MOCK_DOCTOR.subscriptionPlan,
    };
  }
  // ... admin check
}
```

---

### 3. API Routes Updated

All doctor API routes were updated to check `IS_MOCK_MODE` and return mock data:

#### `app/api/doctors/profile/route.ts`
- **GET**: Returns `MOCK_DOCTOR` with calculated `daysRemaining`
- **PATCH**: Returns merged mock doctor data with updates

#### `app/api/doctors/appointments/route.ts`
- **GET**: Returns filtered/paginated `MOCK_APPOINTMENTS`
- **POST**: Returns new appointment with generated ID
- **PATCH**: Returns updated appointment data

#### `app/api/doctors/patients/route.ts`
- **GET**: Returns filtered/paginated `MOCK_PATIENTS`
- **POST**: Returns new patient with generated ID
- **PATCH**: Returns updated patient data
- **DELETE**: Returns success message

#### `app/api/doctors/analytics/route.ts`
- **GET**: Returns `MOCK_ANALYTICS` (doctor dashboard stats)

#### `app/api/doctors/team/route.ts`
- **GET**: Returns `MOCK_TEAM_MEMBERS`
- **POST**: Returns new team member invitation
- **PATCH**: Returns updated team member role
- **DELETE**: Returns success message

#### `app/api/doctors/availability/route.ts`
- **GET**: Returns `MOCK_AVAILABILITY` and `MOCK_BLOCKED_SLOTS`
- **POST**: Returns new availability or blocked slot
- **DELETE**: Returns success message

#### `app/api/doctors/forms/route.ts`
- **GET**: Returns `MOCK_FORM_TEMPLATES`
- **POST**: Returns new form template
- **PATCH**: Returns updated form template
- **DELETE**: Returns success message

---

### 4. `components/layouts/dashboard-sidebar.tsx`
Fixed hydration mismatch error:

**Changes:**
- Added placeholder render when `mounted` is false
- Prevents server/client DOM mismatch for navigation elements

```typescript
// Prevent hydration mismatch by not rendering until mounted
if (!mounted) {
  return (
    <aside className="fixed top-0 left-0 z-40 h-screen w-72 bg-card border-r border-border/50 lg:block hidden">
      {/* Minimal placeholder content */}
    </aside>
  );
}
```

---

### 5. `.env.local`
Updated environment configuration:

**Changes:**
- Commented out `DATABASE_URL` to disable database connection
- Added `NEXT_PUBLIC_USE_MOCK_DATA="true"` to explicitly enable mock mode

---

## API Route Pattern

All API routes follow this pattern for mock mode support:

```typescript
import { IS_MOCK_MODE, MOCK_DATA } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  // Auth check...

  // Return mock data if in mock mode
  if (IS_MOCK_MODE) {
    return NextResponse.json({
      success: true,
      data: MOCK_DATA,
    });
  }

  // Real database logic (using dynamic imports)
  const { db } = await import("@/lib/db");
  const { table } = await import("@/lib/db/schema");
  // ... database operations
}
```

**Note:** Database modules are imported dynamically to prevent errors when database is not configured.

---

## Sample Data Summary

| Data Type      | Count | Description                          |
|----------------|-------|--------------------------------------|
| Patients       | 6     | Various ages, genders, conditions    |
| Appointments   | 8     | Mix of confirmed, pending, completed |
| Team Members   | 3     | 2 active, 1 pending invitation       |
| Form Templates | 2     | Intake form and follow-up form       |
| Notifications  | 3     | Appointment, reminder, system        |
| Admin Users    | 4     | Various subscription statuses        |
| Support Tickets| 3     | Open, in progress, resolved          |

---

## Switching Back to Real Database

To use the real database instead of mock data:

1. Update `.env.local`:
```env
# Enable database
DATABASE_URL="postgresql://user:password@localhost:5432/doctor_saas"

# Disable mock mode
NEXT_PUBLIC_USE_MOCK_DATA="false"
```

2. Ensure PostgreSQL is running with the correct credentials

3. Run database migrations if needed:
```bash
npm run db:migrate
```

4. Restart the dev server:
```bash
npm run dev
```

---

## Known Limitations

1. **Data Persistence**: Mock data changes are not persisted between sessions
2. **File Uploads**: Profile images use placeholder URLs
3. **Real-time Features**: Pusher/WebSocket events are simulated
4. **Payments**: Stripe integration is bypassed in mock mode
5. **Email/SMS**: WhatsApp and email notifications are not sent

---

## Troubleshooting

### Hydration Errors
If you see hydration mismatch errors:
- Ensure all dates in mock data are strings, not `Date` objects
- Check that client components use `mounted` state before rendering dynamic content

### Database Connection Errors
If you see "password authentication failed":
- Verify `NEXT_PUBLIC_USE_MOCK_DATA="true"` is set
- Ensure `DATABASE_URL` is commented out or removed

### Session/Auth Issues
If login fails:
- Check credentials match exactly: `doctor@demo.com` / `Demo123!`
- Clear browser cookies and try again
- Restart the dev server after env changes

---

## Date Reference

All mock appointments use these fixed dates (based on January 2026):
- Today: 2026-01-20
- Tomorrow: 2026-01-21
- Yesterday: 2026-01-19
- Trial ends: 2026-01-27

Update these in `lib/mock-data.ts` if testing requires different dates.
