import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_MOCK_MODE, MOCK_FORM_TEMPLATES } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    // Return mock data if in mock mode (bypass session check)
    if (IS_MOCK_MODE) {
      return NextResponse.json({
        success: true,
        data: MOCK_FORM_TEMPLATES,
      });
    }

    // Real mode - check session
    const session = await getServerSession(authOptions);
    if (!session || !session.user.doctorId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Real database logic
    const { db } = await import("@/lib/db");
    const { formTemplates } = await import("@/lib/db/schema");
    const { eq, desc } = await import("drizzle-orm");

    const forms = await db.query.formTemplates.findMany({
      where: eq(formTemplates.doctorId, session.user.doctorId),
      orderBy: [desc(formTemplates.createdAt)],
    });

    return NextResponse.json({
      success: true,
      data: forms,
    });
  } catch (error) {
    console.error("Get forms error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.doctorId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Mock mode - return success with new form
    if (IS_MOCK_MODE) {
      const newForm = {
        id: `form-${Date.now()}`,
        doctorId: session.user.doctorId,
        ...body,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return NextResponse.json({
        success: true,
        data: newForm,
      });
    }

    // Real database logic
    const { db } = await import("@/lib/db");
    const { formTemplates, doctors } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    const { formTemplateSchema } = await import("@/lib/validators");
    const { canUseCustomForms } = await import("@/constants/plans");

    // Check if doctor can create custom forms
    const doctor = await db.query.doctors.findFirst({
      where: eq(doctors.id, session.user.doctorId),
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Doctor not found" },
        { status: 404 }
      );
    }

    if (!canUseCustomForms(doctor.subscriptionPlan)) {
      return NextResponse.json(
        {
          success: false,
          error: "Custom forms are only available on Premium and Advanced plans",
        },
        { status: 403 }
      );
    }

    const validation = formTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (validation.data.isDefault) {
      await db
        .update(formTemplates)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(formTemplates.doctorId, session.user.doctorId));
    }

    const [newForm] = await db
      .insert(formTemplates)
      .values({
        doctorId: session.user.doctorId,
        ...validation.data,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newForm,
    });
  } catch (error) {
    console.error("Create form error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create form" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.doctorId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { formId, ...updateData } = body;

    if (!formId) {
      return NextResponse.json(
        { success: false, error: "Form ID is required" },
        { status: 400 }
      );
    }

    // Mock mode - return success
    if (IS_MOCK_MODE) {
      const existingForm = MOCK_FORM_TEMPLATES.find((f) => f.id === formId);
      if (!existingForm) {
        return NextResponse.json(
          { success: false, error: "Form not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...existingForm,
          ...updateData,
          updatedAt: new Date(),
        },
      });
    }

    // Real database logic
    const { db } = await import("@/lib/db");
    const { formTemplates, doctors } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");
    const { formTemplateSchema } = await import("@/lib/validators");
    const { canUseCustomForms } = await import("@/constants/plans");

    // Check if doctor can edit forms
    const doctor = await db.query.doctors.findFirst({
      where: eq(doctors.id, session.user.doctorId),
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Doctor not found" },
        { status: 404 }
      );
    }

    // Free trial users can't edit forms (they use the default)
    if (!canUseCustomForms(doctor.subscriptionPlan)) {
      return NextResponse.json(
        {
          success: false,
          error: "Custom forms are only available on Premium and Advanced plans",
        },
        { status: 403 }
      );
    }

    const validation = formTemplateSchema.partial().safeParse(updateData);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid update data" },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (validation.data.isDefault) {
      await db
        .update(formTemplates)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(formTemplates.doctorId, session.user.doctorId));
    }

    const [updatedForm] = await db
      .update(formTemplates)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(formTemplates.id, formId),
          eq(formTemplates.doctorId, session.user.doctorId)
        )
      )
      .returning();

    if (!updatedForm) {
      return NextResponse.json(
        { success: false, error: "Form not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedForm,
    });
  } catch (error) {
    console.error("Update form error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update form" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.doctorId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const formId = searchParams.get("formId");

    if (!formId) {
      return NextResponse.json(
        { success: false, error: "Form ID is required" },
        { status: 400 }
      );
    }

    // Mock mode - return success
    if (IS_MOCK_MODE) {
      return NextResponse.json({
        success: true,
        message: "Form deleted successfully",
      });
    }

    // Real database logic
    const { db } = await import("@/lib/db");
    const { formTemplates } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Get the form to check if it's the default
    const form = await db.query.formTemplates.findFirst({
      where: and(
        eq(formTemplates.id, formId),
        eq(formTemplates.doctorId, session.user.doctorId)
      ),
    });

    if (!form) {
      return NextResponse.json(
        { success: false, error: "Form not found" },
        { status: 404 }
      );
    }

    // Can't delete the only form or the default basic form
    const formCount = await db.query.formTemplates.findMany({
      where: eq(formTemplates.doctorId, session.user.doctorId),
    });

    if (formCount.length <= 1) {
      return NextResponse.json(
        { success: false, error: "Cannot delete the only form" },
        { status: 400 }
      );
    }

    await db.delete(formTemplates).where(eq(formTemplates.id, formId));

    // If deleted form was default, set another as default
    if (form.isDefault) {
      const remainingForms = await db.query.formTemplates.findMany({
        where: eq(formTemplates.doctorId, session.user.doctorId),
        limit: 1,
      });

      if (remainingForms.length > 0) {
        await db
          .update(formTemplates)
          .set({ isDefault: true, updatedAt: new Date() })
          .where(eq(formTemplates.id, remainingForms[0].id));
      }
    }

    return NextResponse.json({
      success: true,
      message: "Form deleted successfully",
    });
  } catch (error) {
    console.error("Delete form error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete form" },
      { status: 500 }
    );
  }
}
