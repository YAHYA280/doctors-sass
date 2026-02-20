import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Only allow in development or with a secret key
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (
      process.env.NODE_ENV === "production" &&
      secret !== process.env.NEXTAUTH_SECRET
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const adminEmail = "admin@medibook.com";

    // Check if admin already exists
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.email, adminEmail),
    });

    if (existingAdmin) {
      // Update password to ensure it's correct
      const passwordHash = await hash("Admin123!", 12);
      await db
        .update(users)
        .set({ passwordHash, isActive: true })
        .where(eq(users.id, existingAdmin.id));

      return NextResponse.json({
        success: true,
        message: "Admin user already exists, password updated",
        data: { email: adminEmail, role: existingAdmin.role },
      });
    }

    // Create admin user
    const passwordHash = await hash("Admin123!", 12);

    const [newAdmin] = await db
      .insert(users)
      .values({
        email: adminEmail,
        passwordHash,
        role: "admin",
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      data: {
        id: newAdmin.id,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error("Seed admin error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to seed admin user" },
      { status: 500 }
    );
  }
}
