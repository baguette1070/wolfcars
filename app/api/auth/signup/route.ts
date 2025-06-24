import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone, image } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, mot de passe et nom requis" },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        id: `user-${Date.now()}`,
        name,
        email,
        phone: phone || null,
        image: image || null,
        emailVerified: false,
        role: "USER",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Créer le compte avec le mot de passe hashé
    await prisma.account.create({
      data: {
        id: `account-${Date.now()}`,
        accountId: user.id,
        providerId: "email-and-password",
        userId: user.id,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Compte créé avec succès",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la création du compte:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
