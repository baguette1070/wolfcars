import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "../../../../src/lib/auth";
import { prisma } from "../../../../src/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
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
  const session = await auth.api.getSession({ headers: await headers() });
  const body = await req.json();
  const { carId, startDate } = body as { carId: string; startDate: string };
  const headersList = await headers();
  const origin = headersList.get("origin") || "http://localhost:3000";

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!carId || !startDate) {
    return NextResponse.json(
      { error: "carId and startDate are required" },
      { status: 400 }
    );
  }

  try {
    const car = await prisma.car.findUnique({
      where: { id: carId },
    });

    if (!car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    // Obtenir le prix de la voiture
    const carPrice = getCarPrice(carId);
    const priceInCents = carPrice * 100; // Convertir en centimes pour Stripe

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Location: ${car.name}`,
              description: `Pour la journée du ${new Date(
                startDate
              ).toLocaleDateString("fr-FR")}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/dashboard/my-rentals?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/cars/${carId}/reservation?payment=cancelled`,
      metadata: {
        userId: session.user.id,
        carId: car.id,
        startDate: startDate,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
