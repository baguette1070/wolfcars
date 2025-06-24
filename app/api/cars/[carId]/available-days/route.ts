import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isWeekend,
  startOfMonth,
} from "date-fns";
import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../../src/generated/prisma";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { carId: string } }
) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // Format: "2025-06"

  if (!month) {
    return NextResponse.json(
      { error: "Month parameter is required (format: YYYY-MM)" },
      { status: 400 }
    );
  }

  try {
    // Parse le mois demandé
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = startOfMonth(new Date(year, monthNum - 1));
    const endDate = endOfMonth(new Date(year, monthNum - 1));

    // Générer tous les jours du mois
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Filtrer les jours ouvrés (pas de weekend)
    const workingDays = allDays.filter((day) => !isWeekend(day));

    // Récupérer toutes les locations existantes pour cette voiture dans le mois
    const existingRentals = await prisma.appointmentSlot.findMany({
      where: {
        carId: params.carId,
        start: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculer les jours disponibles
    const availableDays: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const day of workingDays) {
      // Ignorer les jours passés
      if (day < today) {
        continue;
      }

      // Vérifier si la voiture est déjà louée ce jour-là
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const isRentedThisDay = existingRentals.some((rental) => {
        const rentalStart = new Date(rental.start);
        // Le jour bloqué est uniquement le jour de départ
        return (
          rentalStart.getFullYear() === dayStart.getFullYear() &&
          rentalStart.getMonth() === dayStart.getMonth() &&
          rentalStart.getDate() === dayStart.getDate()
        );
      });

      // Si la voiture n'est pas louée ce jour, le jour est disponible
      if (!isRentedThisDay) {
        availableDays.push(format(day, "yyyy-MM-dd"));
      }
    }

    return NextResponse.json({
      availableDays,
      totalWorkingDays: workingDays.length,
      totalAvailableDays: availableDays.length,
      month: month,
    });
  } catch (error) {
    console.error("Error fetching available days:", error);
    return NextResponse.json(
      { error: "Failed to fetch available days" },
      { status: 500 }
    );
  }
}
