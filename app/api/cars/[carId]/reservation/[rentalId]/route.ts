import { PrismaClient } from "@/src/generated/prisma";
import { auth } from "@/src/lib/auth";
import { isAfter, setHours, setMinutes, subDays } from "date-fns";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ carId: string; rentalId: string }> },
) {
  const resolvedParams = await params;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Récupérer la location
    const rental = await prisma.appointmentSlot.findUnique({
      where: { id: resolvedParams.rentalId },
    });
    if (!rental) {
      return NextResponse.json(
        { error: "Location introuvable" },
        { status: 404 },
      );
    }
    if (rental.bookedBy !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Calculer la date limite d'annulation (veille à 17h)
    const departure = new Date(rental.start);
    const cancelLimit = setHours(setMinutes(subDays(departure, 1), 0), 17); // veille à 17h00
    const now = new Date();
    if (isAfter(now, cancelLimit)) {
      return NextResponse.json(
        { error: "La période d'annulation est dépassée" },
        { status: 400 },
      );
    }

    // Annuler la location (ici on supprime, on pourrait aussi mettre un statut "cancelled")
    await prisma.appointmentSlot.delete({
      where: { id: resolvedParams.rentalId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de l'annulation:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'annulation" },
      { status: 500 },
    );
  }
}
