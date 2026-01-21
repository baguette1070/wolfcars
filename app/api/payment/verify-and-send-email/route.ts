import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "../../../../src/lib/auth";
import { sendMail } from "../../../../src/lib/mailer";
import { prisma } from "../../../../src/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_PROD_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

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

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const body = await req.json();
    const { sessionId, userId } = body as { sessionId: string; userId: string };

    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 },
      );
    }

    console.log("🔍 Verifying payment session:", sessionId);

    // Récupérer la session Stripe
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (stripeSession.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 },
      );
    }

    const sessionMetadata = stripeSession.metadata;
    if (
      !sessionMetadata?.userId ||
      !sessionMetadata?.carId ||
      !sessionMetadata?.startDate
    ) {
      return NextResponse.json(
        { error: "Missing session metadata" },
        { status: 400 },
      );
    }

    console.log("✅ Payment verified for session:", sessionId);

    // Chercher la réservation créée par le webhook
    let reservation = await prisma.appointmentSlot.findFirst({
      where: {
        stripeSessionId: sessionId,
        isBooked: true,
      },
      include: {
        car: true,
      },
    });

    // Si la réservation n'existe pas (webhook pas encore traité ou en dev local),
    // on la crée directement
    if (!reservation) {
      console.log("⚠️ Reservation not found, creating it now...");

      // Vérifier si une réservation existe déjà pour cette date
      const existingReservation = await prisma.appointmentSlot.findFirst({
        where: {
          carId: sessionMetadata.carId,
          start: {
            gte: new Date(sessionMetadata.startDate + "T00:00:00"),
            lt: new Date(sessionMetadata.startDate + "T23:59:59"),
          },
          isBooked: true,
        },
      });

      if (existingReservation) {
        return NextResponse.json(
          { error: "Date already reserved" },
          { status: 400 },
        );
      }

      // Créer la réservation
      const startDate = new Date(sessionMetadata.startDate + "T09:00:00");
      // Le lendemain à 8h45
      const endDate = new Date(sessionMetadata.startDate + "T09:00:00");
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(8, 45, 0, 0);

      const totalPrice = getCarPrice(sessionMetadata.carId);
      const remainingAmount = totalPrice - 0.5;

      reservation = await prisma.appointmentSlot.create({
        data: {
          carId: sessionMetadata.carId,
          start: startDate,
          end: endDate,
          isBooked: true,
          bookedBy: sessionMetadata.userId,
          paymentStatus: "deposit_paid",
          depositPaid: true,
          depositAmount: 0.5,
          remainingAmount: remainingAmount,
          stripeSessionId: sessionId,
        },
        include: {
          car: true,
        },
      });

      console.log("✅ Reservation created:", reservation.id);

      // Envoyer l'email de confirmation
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user && reservation.car) {
        console.log("📧 Sending confirmation email to:", user.email);

        try {
          await sendMail({
            to: user.email!,
            subject: `Acompte confirmé - Location ${reservation.car.name}`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">Acompte de 0,50€ confirmé !</h2>
              <p>Bonjour ${user.name || user.email},</p>
              <p>Votre acompte de <strong>0,50€</strong> pour la location de <strong>${reservation.car.name}</strong> a été confirmé.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Détails de votre réservation :</h3>
                <ul style="list-style: none; padding: 0;">
                  <li style="margin-bottom: 10px;"><strong>Voiture :</strong> ${reservation.car.name}</li>
                  <li style="margin-bottom: 10px;"><strong>Date de départ :</strong> ${format(
                    reservation.start,
                    "dd MMMM yyyy à HH:mm",
                    { locale: fr },
                  )}</li>
                  <li style="margin-bottom: 10px;"><strong>Date de retour :</strong> ${format(
                    reservation.end,
                    "dd MMMM yyyy à HH:mm",
                    { locale: fr },
                  )}</li>
                  <li style="margin-bottom: 10px;"><strong>Acompte payé :</strong> 0,50 €</li>
                  <li style="margin-bottom: 10px;"><strong>Montant restant à payer sur place :</strong> ${remainingAmount} €</li>
                </ul>
              </div>
              
              <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #1e40af;"><strong>Prochaines étapes :</strong></p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Votre réservation est maintenant confirmée</li>
                  <li>Vous devez payer le montant restant (${remainingAmount}€) lors de la récupération du véhicule</li>
                  <li>Merci de vous présenter à l'agence à <strong>9h00</strong> le jour du départ</li>
                  <li>N'oubliez pas d'apporter votre permis de conduire et une pièce d'identité</li>
                </ul>
              </div>
              
              <p>Merci de votre confiance !</p>
            </div>
          `,
          });

          console.log("✅ Email sent successfully");
        } catch (emailError) {
          console.error("❌ Email sending failed:", emailError);
        }
      }
    }

    // La réservation est créée et payée
    const totalPrice = getCarPrice(reservation.car.id);
    const remainingAmount = totalPrice - 0.5;

    // Récupérer les informations de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      paymentDetails: {
        reservationId: reservation.id,
        carName: reservation.car.name,
        startDate: format(reservation.start, "dd/MM/yyyy à HH:mm", {
          locale: fr,
        }),
        endDate: format(reservation.end, "dd/MM/yyyy à HH:mm", { locale: fr }),
        depositAmount: 0.5,
        remainingAmount: remainingAmount,
      },
    });
  } catch (error) {
    console.error("❌ Error verifying payment and sending email:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
