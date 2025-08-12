import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; planId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pixelDistance, realDistance, calibrationUnit, scale } = await request.json();

    // Verify the plan belongs to the project and user has access
    const plan = await prisma.plan.findFirst({
      where: {
        id: params.planId,
        projectId: params.id,
        project: {
          userId: session.user.id
        }
      }
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Update the plan with calibration data
    const updatedPlan = await prisma.plan.update({
      where: { id: params.planId },
      data: {
        pixelDistance,
        realDistance,
        calibrationUnit,
        scale,
      }
    });

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    );
  }
}

