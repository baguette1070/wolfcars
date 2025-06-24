import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../src/lib/auth";
import { prisma } from "../../../../src/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier si l'utilisateur est admin (temporairement par email)
    if (session.user.email !== "admin@example.com") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer les statistiques
    const [totalUsers, totalCars, totalReservations, pendingReservations] =
      await Promise.all([
        prisma.user.count(),
        prisma.car.count(),
        prisma.appointmentSlot.count({
          where: { isBooked: true },
        }),
        prisma.appointmentSlot.count({
          where: {
            isBooked: true,
            start: {
              gte: new Date(),
            },
          },
        }),
      ]);

    return NextResponse.json({
      totalUsers,
      totalCars,
      totalReservations,
      pendingReservations,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
