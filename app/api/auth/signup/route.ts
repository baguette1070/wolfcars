import { auth } from "@/src/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone, image } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, mot de passe et nom requis" },
        { status: 400 }
      );
    }

    // Utiliser Better Auth pour créer le compte
    // Cela gérera automatiquement le hashing du mot de passe et l'envoi de l'email de vérification
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        callbackURL: "/auth/signin",
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: "Erreur lors de la création du compte" },
        { status: 500 }
      );
    }

    // Mettre à jour le téléphone et l'image si fournis (Better Auth ne les gère pas par défaut)
    if ((phone || image) && result.user) {
      const { prisma } = await import("../../../../src/lib/prisma");
      await prisma.user.update({
        where: { id: result.user.id },
        data: {
          ...(phone && { phone }),
          ...(image && { image }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Compte créé avec succès. Veuillez vérifier votre email pour activer votre compte.",
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la création du compte:", error);
    
    // Gérer les erreurs spécifiques
    if (error instanceof Error) {
      if (error.message.includes("already exists") || error.message.includes("unique")) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
