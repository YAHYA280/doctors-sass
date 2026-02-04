import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { users, doctors, formTemplates } from "@/lib/db/schema";
import { registerSchema } from "@/lib/validators";
import { generateUniqueSlug, calculateTrialEndDate } from "@/lib/utils";
import { withRateLimit } from "@/lib/rate-limit";
import { DEFAULT_FREE_FORM_FIELDS } from "@/constants/form-fields";

export const dynamic = "force-dynamic";
import { eq } from "drizzle-orm";
import { sendWelcomeEmail } from "@/services/email";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await withRateLimit(request, "auth");
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();

    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const { email, password, fullName, specialty } = validationResult.data;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        role: "doctor",
      })
      .returning();

    // Generate unique slug for doctor
    const slug = generateUniqueSlug(fullName);

    // Calculate trial end date (14 days from now)
    const trialEndDate = calculateTrialEndDate();

    // Create doctor profile
    const [newDoctor] = await db
      .insert(doctors)
      .values({
        userId: newUser.id,
        slug,
        fullName,
        specialty: specialty || null,
        subscriptionPlan: "free_trial",
        subscriptionStart: new Date(),
        subscriptionEnd: trialEndDate,
        trialUsed: false,
        patientCountThisMonth: 0,
        monthlyResetDate: new Date().toISOString().split("T")[0],
      })
      .returning();

    // Create default intake form
    await db.insert(formTemplates).values({
      doctorId: newDoctor.id,
      formName: "Basic Intake Form",
      description: "Default patient intake form",
      fields: DEFAULT_FREE_FORM_FIELDS,
      isActive: true,
      isDefault: true,
    });

    // Send welcome email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendWelcomeEmail(email, fullName, `${appUrl}/login`);

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        data: {
          id: newUser.id,
          email: newUser.email,
          doctorSlug: newDoctor.slug,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
