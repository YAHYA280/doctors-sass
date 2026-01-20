import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { doctors, clinics, formTemplates, availability, blockedSlots, appointments } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { "doctor-slug": string } }
) {
  try {
    const slug = params["doctor-slug"];

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
