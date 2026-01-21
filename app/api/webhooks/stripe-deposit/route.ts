import { sendMail } from "@/src/lib/mailer";
import { prisma } from "@/src/lib/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature") as string;

  console.log("🔔 Webhook received:", {
    signature: signature ? "present" : "missing",
    bodyLength: body.length,
  });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log("✅ Webhook signature verified, event type:", event.type);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Webhook signature verification failed:", errorMessage);
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    console.log("💰 Processing checkout.session.completed event");

    const session = event.data.object as Stripe.Checkout.Session;
    const sessionMetadata = session.metadata;

    console.log("📋 Session details:", {
      metadata: sessionMetadata,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total,
    });

    // Vérifier que c'est bien un paiement d'acompte
    if (sessionMetadata?.type !== "deposit") {
      console.log("⚠️ Not a deposit payment, skipping...");
      return NextResponse.json({ received: true });
    }

    if (
      !sessionMetadata?.userId ||
      !sessionMetadata?.carId ||
      !sessionMetadata?.startDate
    ) {
      console.error("❌ Missing required metadata");
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    console.log("✅ Processing deposit payment, creating reservation...");

    try {
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
        console.error("❌ Date already reserved after payment");
        return NextResponse.json(
          { error: "Date already reserved" },
          { status: 400 }
        );
      }

      // Créer la réservation APRÈS le paiement confirmé
      const startDate = new Date(sessionMetadata.startDate + "T09:00:00");
      // Le lendemain à 8h45
      const endDate = new Date(sessionMetadata.startDate + "T09:00:00");
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(8, 45, 0, 0);

      const totalPrice = getCarPrice(sessionMetadata.carId);
      const remainingAmount = totalPrice - 0.5;

      const newReservation = await prisma.appointmentSlot.create({
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
          stripeSessionId: session.id,
        },
        include: {
          car: true,
        },
      });

      console.log("✅ Reservation created:", newReservation.id);

      // Récupérer les informations de l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: newReservation.bookedBy! },
      });

      if (user && newReservation.car) {
        console.log("📧 Sending confirmation email to:", user.email);

        try {
          // Envoyer l'email de confirmation d'acompte
          await sendMail({
            to: user.email!,
            subject: `Acompte confirmé - Location ${newReservation.car.name}`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">Acompte de 0,50€ confirmé !</h2>
              <p>Bonjour ${user.name || user.email},</p>
              <p>Votre acompte de <strong>0,50€</strong> pour la location de <strong>${newReservation.car.name}</strong> a été confirmé.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Détails de votre réservation :</h3>
                <ul style="list-style: none; padding: 0;">
                  <li style="margin-bottom: 10px;"><strong>Voiture :</strong> ${newReservation.car.name}</li>
                  <li style="margin-bottom: 10px;"><strong>Date de départ :</strong> ${format(
                    newReservation.start,
                    "dd MMMM yyyy à HH:mm",
                    { locale: fr }
                  )}</li>
                  <li style="margin-bottom: 10px;"><strong>Date de retour :</strong> ${format(
                    newReservation.end,
                    "dd MMMM yyyy à HH:mm",
                    { locale: fr }
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
          console.log("📧 Email content would be:");
          console.log(`To: ${user.email}`);
          console.log(
            `Subject: Acompte confirmé - Location ${newReservation.car.name}`
          );
          console.log(
            `Body: Acompte de 0,50€ confirmé pour ${newReservation.car.name}`
          );
        }
      } else {
        console.log("⚠️ User or car not found, skipping email");
      }

      console.log(`✅ Deposit confirmed for reservation ${newReservation.id}`);
    } catch (error) {
      console.error("❌ Error handling deposit payment:", error);
      return NextResponse.json(
        { error: "Error processing deposit payment" },
        { status: 500 }
      );
    }
  } else {
    console.log("ℹ️ Event type not handled:", event.type);
  }

  return NextResponse.json({ received: true });
}
