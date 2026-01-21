import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../../../../src/lib/auth";
import { prisma } from "../../../../src/lib/prisma";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rentals = await prisma.appointmentSlot.findMany({
      where: {
        bookedBy: session.user.id,
      },
      include: {
        car: true,
      },
      orderBy: {
        start: "desc",
      },
    });

    return NextResponse.json({ rentals });
  } catch (error) {
    console.error("Error fetching rentals:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
