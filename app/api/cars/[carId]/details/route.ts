import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ carId: string }> },
) {
  const resolvedParams = await params;
  try {
    const car = await prisma.car.findUnique({
      where: { id: resolvedParams.carId },
      select: {
        name: true,
      },
    });

    if (!car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    return NextResponse.json(car);
  } catch (error) {
    console.error(
      `Error fetching car details for ${resolvedParams.carId}:`,
      error,
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
