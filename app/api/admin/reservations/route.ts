import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../src/lib/auth";
import { prisma } from "../../../../src/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier si l'utilisateur est admin
    if (session.user.email !== "lamrininawfal11@gmail.com") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer toutes les réservations avec les détails de la voiture
    const reservations = await prisma.appointmentSlot.findMany({
      include: {
        car: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        start: "desc",
      },
    });

    // Récupérer les informations utilisateur pour les réservations bookées
    const userIds = reservations
      .filter((r) => r.bookedBy)
      .map((r) => r.bookedBy)
      .filter((id): id is string => id !== null);

    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    const userMap = new Map(users.map((user) => [user.id, user]));

    // Mapper les données pour inclure les informations utilisateur
    const mappedReservations = reservations.map((reservation) => ({
      id: reservation.id,
      start: reservation.start,
      end: reservation.end,
      isBooked: reservation.isBooked,
      bookedBy: reservation.bookedBy,
      car: reservation.car,
      user: reservation.bookedBy
        ? userMap.get(reservation.bookedBy)
        : undefined,
    }));

    return NextResponse.json({
      reservations: mappedReservations,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des réservations:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
