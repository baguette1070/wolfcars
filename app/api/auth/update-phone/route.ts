import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../src/lib/auth";
import { prisma } from "../../../../src/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true },
    });

    return NextResponse.json({
      phone: user?.phone || null,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du téléphone:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Numéro de téléphone requis" },
        { status: 400 }
      );
    }

    // Mettre à jour le numéro de téléphone
    await prisma.user.update({
      where: { id: session.user.id },
      data: { phone },
    });

    return NextResponse.json({
      success: true,
      message: "Numéro de téléphone mis à jour",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du téléphone:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
