import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les locations de l'utilisateur avec les détails des voitures
    const rentals = await prisma.appointmentSlot.findMany({
      where: {
        bookedBy: session.user.id,
        isBooked: true,
      },
      include: {
        car: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
          },
        },
      },
      orderBy: {
        start: "desc",
      },
    });

    // Formater les données pour l'affichage
    const formattedRentals = rentals.map((rental) => ({
      id: rental.id,
      carId: rental.carId,
      car: rental.car,
      startTime: rental.start,
      endTime: rental.end,
      status: getRentalStatus(rental.start, rental.end),
      totalHours: Math.round(
        (new Date(rental.end).getTime() - new Date(rental.start).getTime()) /
          (1000 * 60 * 60)
      ),
    }));

    return NextResponse.json({ rentals: formattedRentals });
  } catch (error) {
    console.error("Error fetching user rentals:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des locations" },
      { status: 500 }
    );
  }
}

// Fonction pour déterminer le statut de la location
function getRentalStatus(
  startTime: Date,
  endTime: Date
): "upcoming" | "active" | "completed" | "cancelled" {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) {
    return "upcoming";
  } else if (now >= start && now <= end) {
    return "active";
  } else {
    return "completed";
  }
}
