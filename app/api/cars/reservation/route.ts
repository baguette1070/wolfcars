import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../src/lib/auth";
import { sendMail } from "../../../../src/lib/mailer";
import { prisma } from "../../../../src/lib/prisma";

// Fonction pour déterminer le prix selon la voiture
const getCarPrice = (carId: string): number => {
  // RS3 2025 FaceLift
  if (carId === "e421dd5a-ed6b-49fd-9279-9068d1a1291c") {
    return 400;
  }
  // Golf 8 GTI 2020
  if (carId === "e7cddf33-0de4-427d-b0bc-57bdcc1ac680") {
    return 250;
  }
  // Prix par défaut
  return 250;
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { carId, startDate } = await request.json();

    if (!carId || !startDate) {
      return NextResponse.json(
        { error: "carId et startDate sont requis" },
        { status: 400 }
      );
    }

    // Vérifier si la voiture existe
    const car = await prisma.car.findUnique({
      where: { id: carId },
    });

    if (!car) {
      return NextResponse.json(
        { error: "Voiture non trouvée" },
        { status: 404 }
      );
    }

    // Obtenir le prix de la voiture
    const carPrice = getCarPrice(carId);

    // Vérifier si la date est disponible
    const startDateTime = new Date(startDate);
    startDateTime.setHours(9, 0, 0, 0); // 9h00

    const endDateTime = new Date(startDateTime);
    endDateTime.setDate(endDateTime.getDate() + 1);
    endDateTime.setHours(8, 45, 0, 0); // 8h45 le lendemain

    // Vérifier si l'utilisateur a déjà une réservation pour cette date
    const userExistingReservation = await prisma.appointmentSlot.findFirst({
      where: {
        bookedBy: session.user.id,
        isBooked: true,
        OR: [
          // Réservation qui commence le même jour
          {
            start: {
              gte: new Date(startDate),
              lt: new Date(
                new Date(startDate).setDate(new Date(startDate).getDate() + 1)
              ),
            },
          },
          // Réservation qui se termine le même jour
          {
            end: {
              gt: new Date(startDate),
              lte: new Date(
                new Date(startDate).setDate(new Date(startDate).getDate() + 1)
              ),
            },
          },
          // Réservation qui englobe cette date
          {
            start: { lte: new Date(startDate) },
            end: {
              gte: new Date(
                new Date(startDate).setDate(new Date(startDate).getDate() + 1)
              ),
            },
          },
        ],
      },
    });

    if (userExistingReservation) {
      return NextResponse.json(
        {
          error:
            "Vous avez déjà une réservation pour cette date. Vous ne pouvez prendre qu'une seule location par jour.",
        },
        { status: 409 }
      );
    }

    const existingSlot = await prisma.appointmentSlot.findFirst({
      where: {
        carId: carId,
        start: startDateTime,
        isBooked: true,
      },
    });

    if (existingSlot) {
      return NextResponse.json(
        { error: "Cette date n'est plus disponible" },
        { status: 409 }
      );
    }

    // Créer le créneau de réservation
    const slot = await prisma.appointmentSlot.create({
      data: {
        carId: carId,
        start: startDateTime,
        end: endDateTime,
        isBooked: true,
        bookedBy: session.user.id,
      },
    });

    // Envoyer un mail de confirmation à l'utilisateur
    try {
      await sendMail({
        to: session.user.email,
        subject: `Confirmation de votre location - ${car.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Votre location est confirmée !</h2>
            <p>Bonjour ${session.user.name || session.user.email},</p>
            <p>Vous avez réservé : <strong>${car.name}</strong></p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Détails de votre location :</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="margin-bottom: 10px;"><strong>Date de départ :</strong> ${format(startDateTime, "dd MMMM yyyy à HH:mm", { locale: fr })}</li>
                <li style="margin-bottom: 10px;"><strong>Date de retour :</strong> ${format(endDateTime, "dd MMMM yyyy à HH:mm", { locale: fr })}</li>
                <li style="margin-bottom: 10px;"><strong>Montant :</strong> ${carPrice.toLocaleString("fr-FR")} €</li>
              </ul>
            </div>
            
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af;"><strong>Important :</strong></p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Merci de vous présenter à l'agence à <strong>9h00</strong> le jour du départ pour récupérer la voiture</li>
                <li>Rendez la voiture à <strong>8h45</strong> le lendemain</li>
                <li>N'oubliez pas d'apporter votre permis de conduire et une pièce d'identité</li>
                <li>Le paiement de ${carPrice.toLocaleString("fr-FR")} € se fera sur place lors de la récupération du véhicule</li>
              </ul>
            </div>
            
            <p>Merci de votre confiance !</p>
            
            <p>Cordialement,<br>
            L'équipe de location de voitures</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      // On continue même si l'email échoue
    }

    return NextResponse.json({
      success: true,
      slot: {
        id: slot.id,
        start: slot.start,
        end: slot.end,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la création de la réservation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
