import { sendMail } from "@/src/lib/mailer";
import { prisma } from "@/src/lib/prisma";
import { addDays, format, parse, setHours, setMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_PROD_SECRET_KEY!, {
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

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 },
    );
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, carId, startDate } = session.metadata!;

    try {
      // Create the rental in the database
      const departureDate = parse(startDate, "yyyy-MM-dd", new Date());
      const departureTime = setHours(setMinutes(departureDate, 0), 9); // Départ à 9h00
      const returnTime = addDays(setHours(setMinutes(departureDate, 45), 8), 1); // Retour le lendemain à 8h45

      await prisma.appointmentSlot.create({
        data: {
          carId: carId,
          start: departureTime,
          end: returnTime,
          isBooked: true,
          bookedBy: userId,
        },
      });

      // Send confirmation email
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const car = await prisma.car.findUnique({ where: { id: carId } });

      if (user && car) {
        const carPrice = getCarPrice(carId);

        await sendMail({
          to: user.email!,
          subject: `Confirmation de votre location - ${car.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Paiement réussi et location confirmée !</h2>
              <p>Bonjour ${user.name || user.email},</p>
              <p>Vous avez loué : <strong>${car.name}</strong></p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Détails de votre location :</h3>
                <ul style="list-style: none; padding: 0;">
                  <li style="margin-bottom: 10px;"><strong>Date de départ :</strong> ${format(
                    departureTime,
                    "dd MMMM yyyy à HH:mm",
                    { locale: fr },
                  )}</li>
                  <li style="margin-bottom: 10px;"><strong>Date de retour :</strong> ${format(
                    returnTime,
                    "dd MMMM yyyy à HH:mm",
                    { locale: fr },
                  )}</li>
                  <li style="margin-bottom: 10px;"><strong>Montant payé :</strong> ${carPrice.toLocaleString("fr-FR")} €</li>
                </ul>
              </div>
              
              <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #1e40af;"><strong>Important :</strong></p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Merci de vous présenter à l'agence à <strong>9h00</strong> le jour du départ pour récupérer la voiture</li>
                  <li>Rendez la voiture à <strong>8h45</strong> le lendemain</li>
                  <li>N'oubliez pas d'apporter votre permis de conduire et une pièce d'identité</li>
                </ul>
              </div>
              
              <p>Merci de votre confiance !</p>
            </div>
          `,
        });
      }
    } catch (error) {
      console.error("Error handling checkout session:", error);
      return NextResponse.json(
        { error: "Error processing reservation" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ received: true });
}
