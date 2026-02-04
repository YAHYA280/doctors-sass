import { NextRequest, NextResponse } from "next/server";
import { IS_MOCK_MODE_SERVER, MOCK_DOCTOR, MOCK_AVAILABILITY, MOCK_FORM_TEMPLATES } from "@/lib/mock-data";

export async function GET(
  request: NextRequest,
  { params }: { params: { "doctor-slug": string } }
) {
  try {
    const slug = params["doctor-slug"];

    // Mock mode - return mock data
    if (IS_MOCK_MODE_SERVER) {
      if (slug !== MOCK_DOCTOR.slug) {
        return NextResponse.json(
          { success: false, error: "Doctor not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          doctor: {
            slug: MOCK_DOCTOR.slug,
            fullName: MOCK_DOCTOR.fullName,
            specialty: MOCK_DOCTOR.specialty,
            bio: MOCK_DOCTOR.bio,
            profileImage: MOCK_DOCTOR.profileImage,
            clinicName: MOCK_DOCTOR.clinicName,
            address: MOCK_DOCTOR.address,
            brandColor: MOCK_DOCTOR.brandColor,
            welcomeMessage: "Welcome to our practice! We look forward to providing you with excellent care.",
          },
          clinics: [{
            id: "clinic-001",
            name: MOCK_DOCTOR.clinicName,
            address: MOCK_DOCTOR.address,
            phone: MOCK_DOCTOR.phone,
            workingHours: null,
          }],
          form: MOCK_FORM_TEMPLATES[0] ? {
            id: MOCK_FORM_TEMPLATES[0].id,
            formName: MOCK_FORM_TEMPLATES[0].name,
            description: MOCK_FORM_TEMPLATES[0].description,
            fields: MOCK_FORM_TEMPLATES[0].fields,
          } : null,
          availability: MOCK_AVAILABILITY.map(a => ({
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
            slotDuration: a.slotDuration,
            clinicId: null,
          })),
        },
      });
    }

    // Real mode - query database
    const { db } = await import("@/lib/db");
    const { doctors, clinics, formTemplates, availability } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Get doctor public profile
    const doctor = await db.query.doctors.findFirst({
      where: and(
        eq(doctors.slug, slug),
        eq(doctors.isActive, true)
      ),
      columns: {
        id: true,
        slug: true,
        fullName: true,
        specialty: true,
        bio: true,
        profileImage: true,
        clinicName: true,
        address: true,
        brandColor: true,
        welcomeMessage: true,
        subscriptionPlan: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Doctor not found" },
        { status: 404 }
      );
    }

    // Check if subscription is active
    const now = new Date();
    const doctorFull = await db.query.doctors.findFirst({
      where: eq(doctors.id, doctor.id),
    });

    if (doctorFull?.subscriptionEnd && new Date(doctorFull.subscriptionEnd) < now) {
      return NextResponse.json(
        { success: false, error: "This booking page is currently unavailable" },
        { status: 403 }
      );
    }

    // Get clinics
    const doctorClinics = await db.query.clinics.findMany({
      where: and(
        eq(clinics.doctorId, doctor.id),
        eq(clinics.isActive, true)
      ),
      columns: {
        id: true,
        name: true,
        address: true,
        phone: true,
        workingHours: true,
      },
    });

    // Get default intake form
    const defaultForm = await db.query.formTemplates.findFirst({
      where: and(
        eq(formTemplates.doctorId, doctor.id),
        eq(formTemplates.isDefault, true),
        eq(formTemplates.isActive, true)
      ),
    });

    // If no default form found, try to get any active form
    const activeForm = defaultForm || await db.query.formTemplates.findFirst({
      where: and(
        eq(formTemplates.doctorId, doctor.id),
        eq(formTemplates.isActive, true)
      ),
    });

    // Get availability settings
    const availabilitySettings = await db.query.availability.findMany({
      where: and(
        eq(availability.doctorId, doctor.id),
        eq(availability.isAvailable, true)
      ),
    });

    return NextResponse.json({
      success: true,
      data: {
        doctor: {
          ...doctor,
          // Remove internal fields from response
          id: undefined,
          subscriptionPlan: undefined,
        },
        clinics: doctorClinics,
        form: activeForm ? {
          id: activeForm.id,
          formName: activeForm.formName,
          description: activeForm.description,
          fields: activeForm.fields,
        } : null,
        availability: availabilitySettings.map(a => ({
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          slotDuration: a.slotDuration,
          clinicId: a.clinicId,
        })),
      },
    });
  } catch (error) {
    console.error("Get booking page error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch booking page" },
      { status: 500 }
    );
  }
}
