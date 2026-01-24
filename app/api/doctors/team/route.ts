import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_MOCK_MODE, MOCK_TEAM_MEMBERS } from "@/lib/mock-data";
import { SUBSCRIPTION_PLANS } from "@/constants/plans";

// GET - Fetch team members
export async function GET(request: NextRequest) {
  try {
    // Return mock data if in mock mode (bypass session check)
    if (IS_MOCK_MODE) {
      return NextResponse.json({ success: true, data: MOCK_TEAM_MEMBERS });
    }

    // Real mode - check session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = (session.user as any).doctorId;
    if (!doctorId) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, { status: 404 });
    }

    // Real database logic
    const { db } = await import("@/lib/db");
    const { teamMembers, users } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const members = await db
      .select({
        id: teamMembers.id,
        email: teamMembers.email,
        role: teamMembers.role,
        status: teamMembers.status,
        invitedAt: teamMembers.invitedAt,
        joinedAt: teamMembers.joinedAt,
        user: {
          id: users.id,
          email: users.email,
        },
      })
      .from(teamMembers)
      .leftJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.doctorId, doctorId))
      .orderBy(teamMembers.invitedAt);

    return NextResponse.json({ success: true, data: members });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

// POST - Invite new team member
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = (session.user as any).doctorId;
    const subscriptionPlan = (session.user as any).subscriptionPlan || "free_trial";

    if (!doctorId) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, { status: 404 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Mock mode - return success with new member
    if (IS_MOCK_MODE) {
      const newMember = {
        id: `team-${Date.now()}`,
        doctorId,
        email: email.toLowerCase(),
        role: role || "staff",
        status: "pending",
        invitedAt: new Date().toISOString(),
        joinedAt: null,
        user: null,
      };

      return NextResponse.json({
        success: true,
        data: newMember,
        message: "Invitation sent successfully (mock mode)",
      });
    }

    // Real database logic
    const { db } = await import("@/lib/db");
    const { teamMembers, doctors } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");
    const { sendEmail } = await import("@/services/email");
    const { randomUUID } = await import("crypto");

    // Check subscription limits
    const planLimits = SUBSCRIPTION_PLANS[subscriptionPlan as keyof typeof SUBSCRIPTION_PLANS]?.limits;
    const maxTeamMembers = planLimits?.maxTeamMembers || 0;

    if (maxTeamMembers !== -1) {
      const existingMembers = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.doctorId, doctorId));

      if (existingMembers.length >= maxTeamMembers) {
        return NextResponse.json(
          { success: false, error: "Team member limit reached. Please upgrade your plan." },
          { status: 403 }
        );
      }
    }

    // Check if email is already invited
    const existingInvite = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.doctorId, doctorId),
          eq(teamMembers.email, email.toLowerCase())
        )
      );

    if (existingInvite.length > 0) {
      return NextResponse.json(
        { success: false, error: "This email has already been invited" },
        { status: 400 }
      );
    }

    // Generate invite token
    const inviteToken = randomUUID();

    // Create team member record
    const [newMember] = await db
      .insert(teamMembers)
      .values({
        doctorId,
        email: email.toLowerCase(),
        role: role || "staff",
        status: "pending",
        inviteToken,
        invitedAt: new Date(),
      })
      .returning();

    // Get doctor info for email
    const [doctor] = await db
      .select()
      .from(doctors)
      .where(eq(doctors.id, doctorId));

    // Send invitation email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/team/accept?token=${inviteToken}`;

    await sendEmail({
      to: email,
      subject: `You've been invited to join Dr. ${doctor.fullName}'s team`,
      html: `
        <h2>Team Invitation</h2>
        <p>Dr. ${doctor.fullName} has invited you to join their team as a ${role}.</p>
        <p>Click the link below to accept the invitation:</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #0A6847; color: white; text-decoration: none; border-radius: 6px;">
          Accept Invitation
        </a>
        <p>This invitation will expire in 7 days.</p>
      `,
    });

    return NextResponse.json({
      success: true,
      data: newMember,
      message: "Invitation sent successfully",
    });
  } catch (error) {
    console.error("Error inviting team member:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}

// PATCH - Update team member role
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = (session.user as any).doctorId;
    if (!doctorId) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, { status: 404 });
    }

    const body = await request.json();
    const { memberId, role } = body;

    if (!memberId || !role) {
      return NextResponse.json(
        { success: false, error: "Member ID and role are required" },
        { status: 400 }
      );
    }

    // Mock mode - return success
    if (IS_MOCK_MODE) {
      const member = MOCK_TEAM_MEMBERS.find((m) => m.id === memberId);
      if (!member) {
        return NextResponse.json(
          { success: false, error: "Team member not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { ...member, role },
      });
    }

    // Real database logic
    const { db } = await import("@/lib/db");
    const { teamMembers } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Update the team member
    const [updated] = await db
      .update(teamMembers)
      .set({ role })
      .where(
        and(
          eq(teamMembers.id, memberId),
          eq(teamMembers.doctorId, doctorId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Team member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update team member" },
      { status: 500 }
    );
  }
}

// DELETE - Remove team member
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = (session.user as any).doctorId;
    if (!doctorId) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { success: false, error: "Member ID is required" },
        { status: 400 }
      );
    }

    // Mock mode - return success
    if (IS_MOCK_MODE) {
      return NextResponse.json({
        success: true,
        message: "Team member removed successfully",
      });
    }

    // Real database logic
    const { db } = await import("@/lib/db");
    const { teamMembers } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    // Delete the team member
    const [deleted] = await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.id, memberId),
          eq(teamMembers.doctorId, doctorId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Team member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Team member removed successfully",
    });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
