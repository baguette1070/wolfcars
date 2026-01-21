import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Aucun compte trouvé avec cet email" },
        { status: 404 }
      );
    }

    // Vérifier si l'email est déjà vérifié
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Cet email est déjà vérifié" },
        { status: 400 }
      );
    }

    // Utiliser Better Auth pour renvoyer l'email de vérification
    const result = await auth.api.sendVerificationEmail({
      body: {
        email,
        callbackURL: "/auth/signin",
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email de vérification renvoyé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors du renvoi de l'email:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
