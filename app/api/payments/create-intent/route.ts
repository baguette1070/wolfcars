import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "../../../../src/lib/auth";
import { prisma } from "../../../../src/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

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

    // Vérifier si la date est déjà réservée
    const existingReservation = await prisma.appointmentSlot.findFirst({
      where: {
        carId: carId,
        start: {
          gte: new Date(startDate + "T00:00:00"),
          lt: new Date(startDate + "T23:59:59"),
        },
        isBooked: true,
      },
    });

    if (existingReservation) {
      return NextResponse.json(
        { error: "Cette date est déjà réservée" },
        { status: 400 }
      );
    }

    // Créer une session Stripe Checkout personnalisée SANS créer de réservation
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Acompte location - ${car.name}`,
              description: `Acompte de 0,50€ pour la location du ${new Date(
                startDate
              ).toLocaleDateString("fr-FR")}`,
            },
            unit_amount: 50, // 0,50€ en centimes
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/cancelled`,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
        carId: car.id,
        startDate: startDate,
        type: "deposit",
      },
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("Error creating deposit payment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
