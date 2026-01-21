import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../src/lib/auth";
import { sendMail } from "../../../../../src/lib/mailer";
import { prisma } from "../../../../../src/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier si l'utilisateur est admin
    if (session.user.email !== process.env.MON_EMAIL) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { reservationId } = await params;
    const { userEmail, carName, startDate } = await request.json();

    // Vérifier si la réservation existe
    const reservation = await prisma.appointmentSlot.findUnique({
      where: { id: reservationId },
      include: {
        car: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 },
      );
    }

    if (!reservation.isBooked) {
      return NextResponse.json(
        { error: "Cette réservation n'est pas active" },
        { status: 400 },
      );
    }

    // Supprimer complètement la réservation pour libérer la date
    await prisma.appointmentSlot.delete({
      where: { id: reservationId },
    });

    // Envoyer l'email de notification
    try {
      await sendMail({
        to: userEmail,
        subject: "Annulation de votre location",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Annulation de votre location</h2>
            <p>Bonjour,</p>
            <p>Nous vous informons que votre location a été annulée par notre équipe.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Détails de la location annulée :</h3>
              <p><strong>Voiture :</strong> ${carName}</p>
              <p><strong>Date :</strong> ${new Date(startDate).toLocaleDateString("fr-FR")}</p>
            </div>
            
            <p>Si vous avez des questions concernant cette annulation, n'hésitez pas à nous contacter.</p>
            
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
      message: "Réservation supprimée et email envoyé",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la réservation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
