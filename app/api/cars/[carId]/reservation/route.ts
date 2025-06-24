import { sendMail } from "@/src/lib/mailer";
import { addDays, format, parse, setHours, setMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { PrismaClient } from "../../../../../src/generated/prisma";
import { auth } from "../../../../../src/lib/auth";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { carId: string } }
) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { error: "Date parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Parse la date de départ
    const departureDate = parse(date, "yyyy-MM-dd", new Date());
    const departureTime = setHours(setMinutes(departureDate, 0), 9); // Départ à 9h00
    const returnTime = addDays(setHours(setMinutes(departureDate, 45), 8), 1); // Retour le lendemain à 8h45

    // Vérifier si la voiture est disponible pour cette période
    const existingRental = await prisma.appointmentSlot.findFirst({
      where: {
        carId: params.carId,
        OR: [
          // Location qui commence pendant notre période
          {
            start: {
              gte: departureTime,
              lt: returnTime,
            },
          },
          // Location qui se termine pendant notre période
          {
            end: {
              gt: departureTime,
              lte: returnTime,
            },
          },
          // Location qui englobe notre période
          {
            start: { lte: departureTime },
            end: { gte: returnTime },
          },
        ],
      },
    });

    const isAvailable = !existingRental;

    return NextResponse.json({
      isAvailable,
      departureTime: departureTime.toISOString(),
      returnTime: returnTime.toISOString(),
      message: isAvailable
        ? "Voiture disponible pour cette date"
        : "Voiture déjà louée pour cette période",
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { carId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { startDate } = body;

    if (!startDate) {
      return NextResponse.json(
        { error: "Start date is required" },
        { status: 400 }
      );
    }

    const departureDate = parse(startDate, "yyyy-MM-dd", new Date());
    const departureTime = setHours(setMinutes(departureDate, 0), 9); // Départ à 9h00
    const returnTime = addDays(setHours(setMinutes(departureDate, 45), 8), 1); // Retour le lendemain à 8h45

    const existingRental = await prisma.appointmentSlot.findFirst({
      where: {
        carId: params.carId,
        OR: [
          {
            start: {
              gte: departureTime,
              lt: returnTime,
            },
          },
          {
            end: {
              gt: departureTime,
              lte: returnTime,
            },
          },
          {
            start: { lte: departureTime },
            end: { gte: returnTime },
          },
        ],
      },
    });

    if (existingRental) {
      return NextResponse.json(
        { error: "Voiture déjà louée pour cette période" },
        { status: 400 }
      );
    }

    const rental = await prisma.appointmentSlot.create({
      data: {
        carId: params.carId,
        start: departureTime,
        end: returnTime,
        isBooked: true,
        bookedBy: session.user.id,
      },
    });

    // Récupérer les infos de la voiture
    const car = await prisma.car.findUnique({
      where: { id: params.carId },
    });

    // Envoyer un mail de confirmation à l'utilisateur
    await sendMail({
      to: session.user.email,
      subject: `Confirmation de votre location - ${car?.name || "Votre voiture"}`,
      html: `
        <h2>Votre location est confirmée !</h2>
        <p>Bonjour ${session.user.name || session.user.email},</p>
        <p>Vous avez réservé : <strong>${car?.name || "une voiture"}</strong></p>
        <ul>
          <li>Date de départ : <strong>${format(departureTime, "dd MMMM yyyy à HH:mm", { locale: fr })}</strong></li>
          <li>Date de retour : <strong>${format(returnTime, "dd MMMM yyyy à HH:mm", { locale: fr })}</strong></li>
        </ul>
        <p>Merci de vous présenter à l'agence à <b>9h00</b> le jour du départ pour récupérer la voiture, et de la rendre à <b>8h45</b> le lendemain.</p>
        <p>À bientôt !</p>
      `,
    });

    return NextResponse.json({
      rental,
      departureTime: departureTime.toISOString(),
      returnTime: returnTime.toISOString(),
      message: "Location créée avec succès",
    });
  } catch (error) {
    console.error("Error creating rental:", error);
    return NextResponse.json(
      { error: "Failed to create rental" },
      { status: 500 }
    );
  }
}
